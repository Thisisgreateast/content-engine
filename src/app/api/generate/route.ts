import { NextRequest, NextResponse } from "next/server";
import { openai, buildSystemPrompt, trackTokenUsage } from "@/lib/openai";
import { getSupabase } from "@/lib/supabase";
import {
  GenerateRequest,
  GenerateResponse,
  GeneratedPostInput,
  Platform,
  PLATFORM_RULES,
} from "@/types";

/**
 * POST /api/generate
 * AI Generation Engine — creates a week of platform-optimized social media posts
 *
 * Takes: business_name, industry, audience, brand_voice, platforms[], previous_edits[]
 * Returns: JSON with 7 days of posts per platform
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate the request
    const body: GenerateRequest & { user_id?: string } = await request.json();
    const {
      business_name,
      industry,
      audience,
      brand_voice,
      platforms,
      previous_edits,
      user_id,
    } = body;

    // Validate required fields
    if (!business_name || !industry || !audience || !brand_voice || !platforms) {
      return NextResponse.json(
        {
          error: "Missing required fields: business_name, industry, audience, brand_voice, platforms",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { error: "At least one platform must be specified" },
        { status: 400 }
      );
    }

    // Validate platforms are supported
    const validPlatforms: Platform[] = [
      "twitter",
      "linkedin",
      "instagram",
      "facebook",
      "tiktok",
    ];
    for (const platform of platforms) {
      if (!validPlatforms.includes(platform as Platform)) {
        return NextResponse.json(
          {
            error: `Invalid platform: ${platform}. Supported platforms: ${validPlatforms.join(", ")}`,
          },
          { status: 400 }
        );
      }
    }

    // 2. Build the system prompt
    const systemPrompt = buildSystemPrompt({
      business_name,
      industry,
      audience,
      brand_voice,
      platforms,
      previous_edits: previous_edits || [],
    });

    // 3. Build the user message with specific instructions
    const userMessage = `Generate a full week of social media content for ${business_name} in the ${industry} industry.

Target audience: ${audience}
Brand voice: ${brand_voice}
Platforms: ${platforms.join(", ")}

For each platform, create 7 posts (Monday through Sunday). Follow the platform rules strictly:
${platforms
  .map(
    (p) =>
      `- ${p.toUpperCase()}: Max ${PLATFORM_RULES[p].maxChars} chars, ${PLATFORM_RULES[p].hashtagLimit} hashtags max`
  )
  .join("\n")}

IMPORTANT FORMAT RULES:
- Return ONLY valid JSON
- Do NOT wrap in markdown code blocks
- Do NOT add any commentary before or after the JSON
- Make sure the JSON is parseable`;

    // 4. Call OpenAI GPT-4o
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.8,
      max_tokens: 4000 * platforms.length, // Scale tokens by number of platforms
      response_format: { type: "json_object" },
    });

    // 5. Track token usage
    const usage = completion.usage;
    if (usage && user_id) {
      trackTokenUsage(user_id, usage.prompt_tokens, usage.completion_tokens);
    }

    // 6. Parse the response
    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      return NextResponse.json(
        { error: "No content generated from AI" },
        { status: 500 }
      );
    }

    let parsed: { posts: GeneratedPostInput[]; usage_notes?: string };
    try {
      parsed = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", responseText);
      return NextResponse.json(
        { error: "Failed to parse AI response. The response was not valid JSON." },
        { status: 500 }
      );
    }

    if (!parsed.posts || !Array.isArray(parsed.posts) || parsed.posts.length === 0) {
      return NextResponse.json(
        { error: "AI returned no posts. Please try again." },
        { status: 500 }
      );
    }

    // 7. Validate each post has required fields
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const validatedPosts: GeneratedPostInput[] = [];

    for (const post of parsed.posts) {
      if (!post.platform || !post.day_of_week || !post.content) {
        continue; // Skip invalid posts
      }

      if (!daysOfWeek.includes(post.day_of_week)) {
        continue; // Skip invalid day
      }

      if (!validPlatforms.includes(post.platform as Platform)) {
        continue; // Skip invalid platform
      }

      validatedPosts.push({
        platform: post.platform,
        day_of_week: post.day_of_week,
        content: post.content,
        hashtags: post.hashtags || [],
        image_suggestion: post.image_suggestion || undefined,
        status: "pending",
        original_content: post.content,
      });
    }

    // 8. Return the response
    const response: GenerateResponse = {
      posts: validatedPosts,
      usage: {
        prompt_tokens: usage?.prompt_tokens || 0,
        completion_tokens: usage?.completion_tokens || 0,
        total_tokens: usage?.total_tokens || 0,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error("AI Generation Error:", error);

    // Handle OpenAI-specific errors
    if (error?.status === 401) {
      return NextResponse.json(
        { error: "OpenAI API key is invalid or not configured" },
        { status: 500 }
      );
    }

    if (error?.status === 429) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again in a few moments." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: error?.message || "An unexpected error occurred during AI generation",
      },
      { status: 500 }
    );
  }
}