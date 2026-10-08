import { adminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Diagnóstico sem expor segredos: variáveis presentes e acesso ao banco/auth.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const pub = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  const env = {
    url: /^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url) ? "ok" : url ? "formato inesperado" : "ausente",
    publishableKey: pub ? (pub.startsWith("sb_secret") ? "é a secret key!" : "ok") : "ausente",
    secretKey: process.env.SUPABASE_SECRET_KEY ? "ok" : "ausente",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "ausente",
    shortUrl: process.env.NEXT_PUBLIC_SHORT_URL ?? "ausente",
  };

  let db = "não testado";
  let auth = "não testado";
  try {
    const { error } = await adminClient().from("proposals").select("id", { head: true, count: "exact" });
    db = error ? `erro: ${error.message}` : "ok";
  } catch (e) {
    db = `erro: ${(e as Error).message}`;
  }
  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, { headers: { apikey: pub } });
    auth = r.ok ? "ok" : `erro HTTP ${r.status}`;
  } catch (e) {
    auth = `erro: ${(e as Error).message}`;
  }
  return Response.json({ env, db, auth }, { headers: { "cache-control": "no-store" } });
}
