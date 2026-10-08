import { adminClient } from "@/lib/supabase/admin";
import { isTeam } from "@/lib/team";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const slug = typeof body?.slug === "string" ? body.slug : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!slug || !name) return Response.json({ error: "Dados incompletos" }, { status: 400 });

  if (await isTeam())
    return Response.json({ error: "Pré-visualização da equipe" }, { status: 403 });

  const { data, error } = await adminClient().rpc("approve_proposal", {
    p_slug: slug,
    p_name: name,
    p_note: typeof body?.note === "string" ? body.note.trim() : "",
    p_session: String(body?.sid ?? "").slice(0, 64),
    p_ua: req.headers.get("user-agent") ?? "",
  });
  if (error || !data) return Response.json({ error: "Proposta não encontrada" }, { status: 404 });
  return Response.json({ approvedAt: data });
}
