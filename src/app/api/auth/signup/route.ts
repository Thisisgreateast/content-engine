import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

/**
 * POST /api/auth/signup
 * Server-side signup using Service Role to bypass redirect whitelist checks.
 * This route is the definitive fix for the "Invalid path specified in request URL" error.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Create user using Admin API - this explicitly bypasses redirect validation
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the user immediately
    });

    if (error) {
      // If user already exists, we treat it as success (they'll just sign in)
      if (error.message.includes("already registered")) {
        return NextResponse.json({ success: true, message: "User already exists" });
      }
      
      console.error("Admin Signup Error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (error: any) {
    console.error("Critical API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error during signup" },
      { status: 500 }
    );
  }
}
