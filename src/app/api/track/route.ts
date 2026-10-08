import { adminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";
import { isBot } from "@/lib/bots";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const slug = typeof body?.slug === "string" ? body.slug : "";
  const ua = req.headers.get("user-agent");
  if (!slug || isBot(ua)) return new Response(null, { status: 204 });

  // acessos da equipe (logada no painel) não contam
  if (await getUser().catch(() => null)) return new Response(null, { status: 204 });

  await adminClient().rpc("track_view", {
    p_slug: slug,
    p_session: String(body?.sid ?? "").slice(0, 64),
    p_ua: ua ?? "",
    p_ref: String(body?.ref ?? "").slice(0, 400),
    p_country: req.headers.get("x-vercel-ip-country") ?? "",
    p_city: decodeURIComponent(req.headers.get("x-vercel-ip-city") ?? ""),
  });
  return new Response(null, { status: 204 });
}
