import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

/**
 * POST /api/auth/signup
 * The "Infinite Testing" Admin SDK.
 * 1. Checks if user exists.
 * 2. If user exists, DELETES them (so the tester can reuse the email).
 * 3. Creates a fresh, confirmed user.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email/password" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // 1. Check if user already exists
    // We use listUsers (Admin) to find the user by email
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error("[Signup Auth] listUsers Error:", listError.message);
      // Fallback: just try to create. If it fails with "exists", we handle it below.
    } else {
      const existingUser = listData.users.find(u => u.email === email);
      
      if (existingUser) {
        console.log(`[Signup Auth] User ${email} exists. Deleting to allow fresh trial...`);
        const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id);
        if (deleteError) {
          console.error("[Signup Auth] Delete Error:", deleteError.message);
          // If delete fails, we might still be able to just "sign them in" client side
          return NextResponse.json({ success: true, existing: true });
        }
      }
    }

    // 2. Create the fresh user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { source: 'fresh_trial_signup' }
    });

    if (error) {
      console.error(`[Signup Auth] Admin Create Error: ${error.message}`);
      // Handle race condition where user was created between list and create
      if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already exists")) {
        return NextResponse.json({ success: true, existing: true });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log(`[Signup Auth] Successfully created fresh user: ${email}`);
    return NextResponse.json({ success: true, existing: false, user: data.user });

  } catch (error: any) {
    console.error("[Signup Auth] Critical Catch Block:", error.message || error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
