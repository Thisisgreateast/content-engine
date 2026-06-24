import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

/**
 * POST /api/auth/signup
 * The "Reset & Recreate" Fix.
 * 1. Checks if user exists.
 * 2. Deletes them if they do (to allow testing with same email).
 * 3. Creates a fresh confirmed user using Admin SDK.
 * 4. Bypasses all redirect validation.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    console.log(`Starting Admin Signup for: ${email}`);

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email/password" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // 1. Check if user already exists in Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error("Admin List Error:", listError);
      // If we can't list users, the Service Role key might be wrong
      return NextResponse.json({ error: "Admin access denied. Check your SERVICE_ROLE_KEY." }, { status: 500 });
    }

    const existingUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      console.log(`User exists with ID: ${existingUser.id}. Deleting for fresh test...`);
      const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id);
      if (deleteError) {
        console.error("Admin Delete Error:", deleteError);
        // Continue anyway, maybe it's just a permissions quirk
      }
    }

    // 2. Create the fresh user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { source: 'admin_signup_fix' }
    });

    if (error) {
      console.error("Admin Create Error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("User created successfully via Admin SDK");
    return NextResponse.json({ success: true, user: data.user });

  } catch (error: any) {
    console.error("Critical API Failure:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
