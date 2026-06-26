import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

/**
 * Sanitizes the Supabase URL to prevent "Invalid Path" errors.
 * Removes trailing slashes and accidental /auth/v1 suffixes.
 */
function sanitizeUrl(url: string) {
  return url
    .trim()
    .replace(/\/+$/, "") // Remove trailing slashes
    .replace(/\/auth\/v1$/, ""); // Remove accidental auth suffix
}

/**
 * Get the Supabase client.
 */
export function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  
  const supabaseUrl = sanitizeUrl(rawUrl);
  const supabaseAnonKey = rawKey.trim().replace(/^["']|["']$/g, "");

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key must be configured.");
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  });

  return supabaseInstance;
}

/**
 * Get the authenticated Supabase client for server-side operations.
 */
export function getServiceSupabase(): SupabaseClient {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || "";
  
  const supabaseUrl = sanitizeUrl(rawUrl);
  const serviceRoleKey = rawKey.trim().replace(/^["']|["']$/g, "");

  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL is missing.");
  }
  
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
