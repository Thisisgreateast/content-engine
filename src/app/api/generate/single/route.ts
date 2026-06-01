import { NextRequest, NextResponse } from "next/server";
import { openai, buildSystemPrompt, trackTokenUsage } from "@/lib/openai";
import { getSupabase } from "@/lib/supabase";
import {
  GenerateRequest,
  GeneratedPostInput,
  Platform,
  PLATFORM_RULES,
} from "@/types";

/**
 * POST /api/generate/single
 * Regenerates a single platform-optimized social media post
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      business_name,
      industry,
      audience,
      brand_voice,
      platform,
      day_of_week,
      previous_edits,
      user_id,
    } = body;

    // Validate required fields
    if (!business_name || !industry || !audience || !brand_voice || !platform || !day_of_week) {
      return NextResponse.json(
        {
          error: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // 1. Build a specialized system prompt for single post regeneration
    // We can reuse buildSystemPrompt but might need to adjust instructions
    const systemPrompt = buildSystemPrompt({
      business_name,
      industry,
      audience,
      brand_voice,
      platforms: [platform as Platform],
      previous_edits: previous_edits || [],
    });

    const userMessage = `Regenerate a single social media post for ${business_name} on ${platform.toUpperCase()} for ${day_of_week}.
    
Follow these rules strictly:
- ${platform.toUpperCase()}: Max ${PLATFORM_RULES[platform as Platform].maxChars} chars, ${PLATFORM_RULES[platform as Platform].hashtagLimit} hashtags max

The user requested a regeneration because they weren't satisfied with the previous version. Make this one extra engaging and aligned with the brand voice.

IMPORTANT FORMAT RULES:
- Return ONLY valid JSON
- Do NOT wrap in markdown code blocks
- Return exactly one post in the 'posts' array`;

    // 2. Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.9, // Slightly higher temperature for regeneration to get more variety
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    // 3. Track usage
    const usage = completion.usage;
    if (usage && user_id) {
      trackTokenUsage(user_id, usage.prompt_tokens, usage.completion_tokens);
    }

    // 4. Parse response
    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error("No content generated");
    }

    const parsed = JSON.parse(responseText);
    const post = parsed.posts?.[0];

    if (!post) {
      throw new Error("AI returned no post");
    }

    const validatedPost: GeneratedPostInput = {
      platform: platform as Platform,
      day_of_week,
      content: post.content,
      hashtags: post.hashtags || [],
      image_suggestion: post.image_suggestion,
      status: "pending",
      original_content: post.content,
    };

    return NextResponse.json({ post: validatedPost }, { status: 200 });
  } catch (error: any) {
    console.error("Single Regeneration Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to regenerate post" },
      { status: 500 }
    );
  }
}
