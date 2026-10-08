import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

// Service role: só no servidor, para páginas públicas e rastreamento.
export function adminClient() {
  return createClient(env.supabaseUrl(), env.supabaseSecret(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
