import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createPlainClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "@/server/env";

/** Supabase client bound to the signed-in user's cookies (RLS applies). */
export async function createClient() {
  const store = await cookies();
  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component — the proxy refreshes the session instead.
        }
      },
    },
  });
}

let admin: SupabaseClient | null = null;

/** Service-role client for server-owned writes (question bank, XP, limiter, cache). Never send to the browser. */
export function adminClient(): SupabaseClient {
  admin ??= createPlainClient(env.supabaseUrl, env.supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return admin;
}

export type Session = { supabase: Awaited<ReturnType<typeof createClient>>; user: User };

/** Returns the signed-in user, or null. */
export async function getSession(): Promise<Session | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { supabase, user: data.user };
}
