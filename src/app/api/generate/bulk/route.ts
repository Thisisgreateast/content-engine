import { NextRequest, NextResponse } from "next/server";
import { openai, buildSystemPrompt, trackTokenUsage } from "@/lib/openai";
import { getSupabase } from "@/lib/supabase";
import {
  Platform,
  BrandVoice,
  GeneratedPostInput,
  PLATFORM_RULES,
  EditRecord,
} from "@/types";

interface BulkGenerateRequest {
  /** Array of client IDs or user IDs to generate for */
  clientIds: string[];
  /** The agency user making the request */
  agencyUserId: string;
  /** Optional: override platforms for all clients */
  platforms?: Platform[];
  /** Whether to include previous edit history for learning */
  includeEditHistory?: boolean;
}

interface BulkGenerationResult {
  clientId: string;
  businessName: string;
  success: boolean;
  posts?: GeneratedPostInput[];
  error?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * POST /api/generate/bulk
 * Generates a week of content for multiple clients at once.
 * Designed for the Agency tier — agencies managing many client accounts.
 *
 * Rate limiting: Processes clients sequentially with a 1-second delay between each
 * to avoid OpenAI rate limits.
 */
export async function POST(request: NextRequest) {
  try {
    const body: BulkGenerateRequest = await request.json();
    const { clientIds, agencyUserId, platforms, includeEditHistory = true } = body;

    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return NextResponse.json(
        { error: "Missing required field: clientIds (non-empty array)" },
        { status: 400 }
      );
    }

    if (!agencyUserId) {
      return NextResponse.json(
        { error: "Missing required field: agencyUserId" },
        { status: 400 }
      );
    }

    // Limit batch size to prevent abuse
    const MAX_BATCH_SIZE = 10;
    if (clientIds.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `Batch size exceeded. Maximum: ${MAX_BATCH_SIZE} clients per request` },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Verify agency user exists and has Agency plan
    const { data: agencyUser, error: agencyError } = await supabase
      .from("users")
      .select("id, plan")
      .eq("id", agencyUserId)
      .single();

    if (agencyError || !agencyUser) {
      return NextResponse.json(
        { error: "Agency user not found" },
        { status: 404 }
      );
    }

    if (agencyUser.plan !== "agency") {
      return NextResponse.json(
        { error: "Bulk generation requires an Agency plan. Upgrade your subscription." },
        { status: 403 }
      );
    }

    // Fetch all clients' brand profiles
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("*")
      .in("id", clientIds)
      .eq("agency_user_id", agencyUserId);

    if (clientsError) {
      console.error("Failed to fetch clients:", clientsError);
      return NextResponse.json(
        { error: "Failed to fetch client profiles" },
        { status: 500 }
      );
    }

    if (!clients || clients.length === 0) {
      return NextResponse.json(
        { error: "No clients found for the given IDs" },
        { status: 404 }
      );
    }

    // Validate all requested clients were found
    const foundClientIds = clients.map((c) => c.id);
    const missingIds = clientIds.filter((id) => !foundClientIds.includes(id));
    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: `Some clients not found: ${missingIds.join(", ")}` },
        { status: 404 }
      );
    }

    // Process each client sequentially
    const results: BulkGenerationResult[] = [];
    let totalTokens = 0;

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      const clientPlatforms = platforms || client.platforms || [];

      if (!clientPlatforms || clientPlatforms.length === 0) {
        results.push({
          clientId: client.id,
          businessName: client.business_name,
          success: false,
          error: "No platforms configured for this client",
        });
        continue;
      }

      try {
        // Fetch edit history if requested
        let previousEdits: EditRecord[] = [];
        if (includeEditHistory) {
          const { data: edits } = await supabase
            .from("edit_history")
            .select("original, edited, generated_posts!inner(platform)")
            .eq("user_id", client.id)
            .order("created_at", { ascending: false })
            .limit(10);

          if (edits && edits.length > 0) {
            previousEdits = edits.map((e: any) => ({
              original: e.original,
              edited: e.edited,
              platform: (e.generated_posts as any)?.platform || "twitter" as Platform,
            }));
          }
        }

        // Build the system prompt with client's brand settings
        const systemPrompt = buildSystemPrompt({
          business_name: client.business_name,
          industry: client.industry || "General",
          audience: client.target_audience || "General audience",
          brand_voice: (client.brand_voice as BrandVoice) || "professional",
          platforms: clientPlatforms,
          previous_edits: previousEdits,
        });

        const userMessage = `Generate a full week of social media content for ${client.business_name}.

Target audience: ${client.target_audience || "General audience"}
Brand voice: ${client.brand_voice || "professional"}
Platforms: ${clientPlatforms.join(", ")}

For each platform, create 7 posts (Monday through Sunday). Follow the platform rules strictly:
${clientPlatforms
  .map(
    (p: Platform) =>
      `- ${p.toUpperCase()}: Max ${PLATFORM_RULES[p].maxChars} chars, ${PLATFORM_RULES[p].hashtagLimit} hashtags max`
  )
  .join("\n")}

Return ONLY valid JSON. Do NOT wrap in markdown code blocks.`;

        // Call OpenAI
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          temperature: 0.8,
          max_tokens: 4000 * clientPlatforms.length,
          response_format: { type: "json_object" },
        });

        const usage = completion.usage;
        if (usage) {
          totalTokens += usage.total_tokens || 0;
          trackTokenUsage(agencyUserId, usage.prompt_tokens, usage.completion_tokens);
        }

        // Parse response
        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) {
          results.push({
            clientId: client.id,
            businessName: client.business_name,
            success: false,
            error: "No content generated from AI",
          });
          continue;
        }

        let parsed: { posts: GeneratedPostInput[] };
        try {
          parsed = JSON.parse(responseText);
        } catch {
          results.push({
            clientId: client.id,
            businessName: client.business_name,
            success: false,
            error: "Failed to parse AI response",
          });
          continue;
        }

        // Validate posts
        const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const validPlatforms: Platform[] = ["twitter", "linkedin", "instagram", "facebook", "tiktok"];
        const validatedPosts: GeneratedPostInput[] = [];

        for (const post of (parsed.posts || [])) {
          if (!post.platform || !post.day_of_week || !post.content) continue;
          if (!daysOfWeek.includes(post.day_of_week)) continue;
          if (!validPlatforms.includes(post.platform as Platform)) continue;

          validatedPosts.push({
            platform: post.platform as Platform,
            day_of_week: post.day_of_week,
            content: post.content,
            hashtags: post.hashtags || [],
            image_suggestion: post.image_suggestion || undefined,
            status: "pending",
            original_content: post.content,
          });
        }

        results.push({
          clientId: client.id,
          businessName: client.business_name,
          success: true,
          posts: validatedPosts,
          usage: {
            prompt_tokens: usage?.prompt_tokens || 0,
            completion_tokens: usage?.completion_tokens || 0,
            total_tokens: usage?.total_tokens || 0,
          },
        });

      } catch (clientError: any) {
        console.error(`Error generating for client ${client.business_name}:`, clientError);
        results.push({
          clientId: client.id,
          businessName: client.business_name,
          success: false,
          error: clientError?.message || "Generation failed",
        });
      }
    }

    return NextResponse.json({
      results,
      summary: {
        total: results.length,
        succeeded: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        total_tokens: totalTokens,
      },
    });
  } catch (error: any) {
    console.error("Bulk Generation Error:", error);
    return NextResponse.json(
      { error: error?.message || "Bulk generation failed" },
      { status: 500 }
    );
  }
}