import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { isBot } from "@/lib/bots";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const FALLBACK = "https://estudiocalma.com.br";

const redirect = (url: string) => {
  const res = NextResponse.redirect(url, 302);
  res.headers.set("cache-control", "private, no-store");
  res.headers.set("x-robots-tag", "noindex, nofollow");
  return res;
};

export async function GET(req: Request, ctx: RouteContext<"/l/[code]">) {
  const { code } = await ctx.params;
  if (!/^[a-zA-Z0-9_-]{2,64}$/.test(code)) return redirect(FALLBACK);

  const db = adminClient();
  let { data, error } = await db
    .rpc("resolve_link", { p_code: code })
    .maybeSingle<{ target_url: string | null; proposal_slug: string | null }>();
  if (error) {
    // migração 002 ainda não aplicada: busca direto
    const r = await db.from("links").select("target_url, proposal:proposals(slug)").eq("code", code).maybeSingle();
    const prop = r.data?.proposal as { slug: string } | { slug: string }[] | null | undefined;
    const slug = Array.isArray(prop) ? prop[0]?.slug : prop?.slug;
    data = r.data ? { target_url: r.data.target_url, proposal_slug: slug ?? null } : null;
    error = null;
  }
  if (!data) return redirect(FALLBACK);

  // Link de proposta: o clique é contado na própria página (lá sabemos se é alguém da equipe)
  if (data.proposal_slug) return redirect(`${env.siteUrl()}/p/${data.proposal_slug}?c=${encodeURIComponent(code)}`);

  // Link avulso: conta aqui mesmo (sem robôs)
  const ua = req.headers.get("user-agent");
  await db.rpc("hit_link", {
    p_code: code,
    p_ua: ua ?? "",
    p_ref: req.headers.get("referer") ?? "",
    p_country: req.headers.get("x-vercel-ip-country") ?? "",
    p_city: decodeURIComponent(req.headers.get("x-vercel-ip-city") ?? ""),
    p_is_bot: isBot(ua),
  });
  return redirect(data.target_url || FALLBACK);
}
