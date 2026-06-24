import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

/**
 * POST /api/auth/signup
 * The Robust Hybrid Fix v2.
 * Includes explicit sanitization and key-length debugging.
 */
export async function POST(request: NextRequest) {
  const emailLog = { email: "" };
  try {
    const { email, password } = await request.json();
    emailLog.email = email;

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email/password" }, { status: 400 });
    }

    // DEBUG: Log the environment variable presence and format (SAFE)
    const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || "";
    const cleanKey = rawKey.trim().replace(/^["']|["']$/g, "");
    
    console.log(`[Signup Auth] Attempting for ${email}`);
    console.log(`[Signup Auth] Service Key Length: ${rawKey.length} chars (Cleaned: ${cleanKey.length})`);
    
    if (cleanKey.length < 20) {
      console.error("[Signup Auth] CRITICAL: Service Role Key looks way too short. Check your Vercel Env Vars.");
      return NextResponse.json({ error: "Admin access denied. The Service Role Key provided is invalid or missing." }, { status: 500 });
    }

    const supabase = getServiceSupabase();

    // Directly attempt to create the user.
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { source: 'hybrid_signup_fix_v2' }
    });

    if (error) {
      // Handle "User already exists" gracefully
      if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already exists")) {
        console.log(`[Signup Auth] User ${email} already exists. Signin flow will take over.`);
        return NextResponse.json({ success: true, existing: true });
      }

      console.error(`[Signup Auth] Admin SDK Error: ${error.message}`);
      
      // If the error is specifically "Admin access denied", we return a more helpful message
      if (error.message.includes("Admin access denied") || error.status === 401) {
        return NextResponse.json({ 
          error: "Admin access denied. This means the SERVICE_ROLE_KEY in your environment is likely the 'anon' key by mistake. Please ensure you are using the 'service_role' (secret) key from Supabase Settings > API." 
        }, { status: 401 });
      }

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log(`[Signup Auth] Successfully created/confirmed user: ${email}`);
    return NextResponse.json({ success: true, existing: false, user: data.user });

  } catch (error: any) {
    console.error("[Signup Auth] Critical Catch Block:", error.message || error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
