import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * POST /api/edits
 * Records user edits on generated posts so the AI can learn from them
 *
 * Body: { post_id, user_id, original, edited, platform }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { post_id, user_id, original, edited } = body;

    if (!post_id || !user_id || !original || !edited) {
      return NextResponse.json(
        { error: "Missing required fields: post_id, user_id, original, edited" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Record the edit in edit_history
    const { error: insertError } = await supabase.from("edit_history").insert({
      post_id,
      user_id,
      original,
      edited,
    });

    if (insertError) {
      console.error("Failed to record edit history:", insertError);
      return NextResponse.json(
        { error: "Failed to record edit" },
        { status: 500 }
      );
    }

    // Update the post's status and edited content
    const { error: updateError } = await supabase
      .from("generated_posts")
      .update({
        status: "edited",
        edited_content: edited,
        updated_at: new Date().toISOString(),
      })
      .eq("id", post_id);

    if (updateError) {
      console.error("Failed to update post after edit:", updateError);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Edits API Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to record edit" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/edits?user_id=xxx&limit=10
 * Retrieves recent edits for a user (for AI learning context)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  if (!userId) {
    return NextResponse.json(
      { error: "Missing required parameter: user_id" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("edit_history")
    .select("original, edited, generated_posts!inner(platform)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch edit history:", error);
    return NextResponse.json(
      { error: "Failed to fetch edit history" },
      { status: 500 }
    );
  }

  return NextResponse.json({ edits: data || [] }, { status: 200 });
}