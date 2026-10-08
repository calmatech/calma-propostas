import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { isBot } from "@/lib/bots";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const FALLBACK = "https://estudiocalma.com.br";

export async function GET(req: Request, ctx: RouteContext<"/l/[code]">) {
  const { code } = await ctx.params;
  if (!/^[a-zA-Z0-9_-]{2,64}$/.test(code)) return NextResponse.redirect(FALLBACK, 302);

  const ua = req.headers.get("user-agent");
  const { data } = await adminClient()
    .rpc("hit_link", {
      p_code: code,
      p_ua: ua ?? "",
      p_ref: req.headers.get("referer") ?? "",
      p_country: req.headers.get("x-vercel-ip-country") ?? "",
      p_city: decodeURIComponent(req.headers.get("x-vercel-ip-city") ?? ""),
      p_is_bot: isBot(ua),
    })
    .maybeSingle<{ target_url: string | null; proposal_slug: string | null }>();

  const target = data?.proposal_slug ? `${env.siteUrl()}/p/${data.proposal_slug}` : data?.target_url || FALLBACK;
  const res = NextResponse.redirect(target, 302);
  res.headers.set("cache-control", "private, no-store");
  res.headers.set("x-robots-tag", "noindex, nofollow");
  return res;
}
