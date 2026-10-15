import { adminClient } from "@/lib/supabase/admin";
import { normalizeSupabaseUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

// Diagnóstico sem expor segredos: variáveis presentes e acesso ao banco/auth.
export async function GET() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const url = normalizeSupabaseUrl(raw);
  const pub = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  let host = "";
  try {
    const u = new URL(url);
    host = `${u.protocol}//${u.host}${u.pathname}`;
  } catch {}
  const env = {
    urlValue: host || "inválida",
    urlColada: raw === url ? "ok" : "tinha sufixo extra (corrigido no código)",
    url: /^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url) ? "ok" : url ? "formato inesperado" : "ausente",
    publishableKey: pub ? (pub.startsWith("sb_secret") ? "é a secret key!" : "ok") : "ausente",
    secretKey: process.env.SUPABASE_SECRET_KEY ? "ok" : "ausente",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "ausente",
    shortUrl: process.env.NEXT_PUBLIC_SHORT_URL ?? "ausente",
  };

  const t = () => performance.now();
  const ms: Record<string, number> = {};
  let db = "não testado";
  let auth = "não testado";
  try {
    const t0 = t();
    const { error } = await adminClient().from("proposals").select("id", { head: true, count: "exact" });
    ms.db1 = Math.round(t() - t0);
    const t1 = t();
    await adminClient().from("proposals").select("id").limit(1);
    ms.db2 = Math.round(t() - t1);
    db = error ? `erro: ${error.message}` : "ok";
  } catch (e) {
    db = `erro: ${(e as Error).message}`;
  }
  try {
    const t2 = t();
    const r = await fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, { headers: { apikey: pub } });
    ms.auth = Math.round(t() - t2);
    auth = r.ok ? "ok" : `erro HTTP ${r.status}`;
  } catch (e) {
    auth = `erro: ${(e as Error).message}`;
  }
  // diagnóstico temporário: quantos eventos de cada tipo existem (sem dados pessoais)
  const events: Record<string, number | string> = {};
  for (const type of ["view", "link_click", "section", "approve_open", "approve"]) {
    const { count, error } = await adminClient().from("proposal_events").select("id", { head: true, count: "exact" }).eq("type", type);
    events[type] = error ? `erro: ${error.message}` : (count ?? 0);
  }
  const { data: pr, error: prErr } = await adminClient().from("proposals").select("reached_pricing_at, approve_opened_at").limit(1);
  const cols = prErr ? `erro: ${prErr.message}` : `ok (${pr?.length ?? 0})`;
  // teste: o banco aceita um evento "section"? (grava e apaga em seguida)
  let insertSection = "sem proposta para testar";
  const { data: one } = await adminClient().from("proposals").select("id").limit(1).maybeSingle();
  if (one) {
    const ins = await adminClient().from("proposal_events").insert({ proposal_id: one.id, type: "section", detail: "__diag__", session_id: "__diag__" }).select("id").maybeSingle();
    insertSection = ins.error ? `erro: ${ins.error.message}` : "ok";
    if (ins.data) await adminClient().from("proposal_events").delete().eq("id", ins.data.id);
  }
  return Response.json({ env, db, auth, ms, region: process.env.VERCEL_REGION ?? "?", events, colunasMigracao002: cols, insertSection }, { headers: { "cache-control": "no-store" } });
}
