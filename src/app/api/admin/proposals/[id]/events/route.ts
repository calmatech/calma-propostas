import { createClient, getUser } from "@/lib/supabase/server";

// Atividade de uma proposta (usada pela gaveta da lista). Só para a equipe logada.
export async function GET(_req: Request, ctx: RouteContext<"/api/admin/proposals/[id]/events">) {
  const [{ id }, user] = await Promise.all([ctx.params, getUser()]);
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proposal_events")
    .select("id, type, detail, session_id, user_agent, country, city, created_at")
    .eq("proposal_id", id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { headers: { "cache-control": "private, no-store" } });
}
