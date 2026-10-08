import { adminClient } from "@/lib/supabase/admin";
import { isTeam } from "@/lib/team";
import { isBot } from "@/lib/bots";

// Eventos que a página da proposta pode enviar
const TYPES = new Set(["view", "section", "approve_open"]);

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const slug = typeof body?.slug === "string" ? body.slug : "";
  const type = typeof body?.type === "string" ? body.type : "view";
  const ua = req.headers.get("user-agent");
  if (!slug || !TYPES.has(type) || isBot(ua)) return new Response(null, { status: 204 });

  // acessos da equipe não contam
  if (await isTeam()) return new Response(null, { status: 204 });

  await adminClient().rpc("track_event", {
    p_slug: slug,
    p_type: type,
    p_detail: typeof body?.detail === "string" ? body.detail.slice(0, 64) : "",
    p_session: String(body?.sid ?? "").slice(0, 64),
    p_ua: ua ?? "",
    p_ref: String(body?.ref ?? "").slice(0, 400),
    p_country: req.headers.get("x-vercel-ip-country") ?? "",
    p_city: decodeURIComponent(req.headers.get("x-vercel-ip-city") ?? ""),
  });
  return new Response(null, { status: 204 });
}
