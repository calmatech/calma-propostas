import { adminClient } from "@/lib/supabase/admin";
import { calmaV1Defaults } from "@/lib/templates/calma-v1";

// TEMPORÁRIO: diagnóstico do rastreamento de seções. Remover após o teste.
const TOKEN = "bbb5eb2031a2a86e787bda6e7f28a05f";

export async function GET(req: Request) {
  const u = new URL(req.url);
  if (u.searchParams.get("t") !== TOKEN) return new Response(null, { status: 404 });
  const db = adminClient();
  const op = u.searchParams.get("op");
  if (op === "create") {
    const slug = "diag" + Math.random().toString(36).slice(2, 12);
    const { data, error } = await db.from("proposals").insert({ slug, title: "__diag__", client_name: "__diag__", template: "calma-v1", data: { ...calmaV1Defaults, cliente: "Diagnóstico" } }).select("id, slug").single();
    return Response.json(error ? { error: error.message } : data);
  }
  if (op === "events") {
    const { data } = await db.from("proposals").select("id, reached_pricing_at, view_count, proposal_events(type, detail, created_at)").eq("title", "__diag__");
    return Response.json(data);
  }
  if (op === "delete") {
    const { error } = await db.from("proposals").delete().eq("title", "__diag__");
    return Response.json({ deleted: !error, error: error?.message });
  }
  return new Response(null, { status: 404 });
}
