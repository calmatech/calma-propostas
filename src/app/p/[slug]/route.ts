import { adminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";
import { renderProposal } from "@/lib/templates/render";

export const dynamic = "force-dynamic";

const HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "private, no-store",
  "x-robots-tag": "noindex, nofollow, noarchive, nosnippet",
  "referrer-policy": "no-referrer",
};

const notFound = () =>
  new Response(
    `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Proposta indisponível</title><body style="margin:0;min-height:100svh;display:grid;place-items:center;background:#F7F7F7;color:#222;font:16px/1.6 system-ui,sans-serif;text-align:center;padding:24px"><div><p style="font:400 48px/1 Georgia,serif;margin:0 0 12px">Proposta indisponível</p><p style="color:#6E6E6B;margin:0">Este link expirou ou não existe. Fale com a gente: <a href="https://estudiocalma.com.br" style="color:inherit">estudiocalma.com.br</a></p></div></body></html>`,
    { status: 404, headers: HEADERS },
  );

export async function GET(_req: Request, ctx: RouteContext<"/p/[slug]">) {
  const { slug } = await ctx.params;
  if (!/^[A-Za-z0-9]{6,64}$/.test(slug)) return notFound();

  const { data: p } = await adminClient()
    .from("proposals")
    .select("slug, template, data, archived, approved_at, approved_name")
    .eq("slug", slug)
    .maybeSingle();

  const user = await getUser().catch(() => null);
  if (!p || (p.archived && !user)) return notFound();

  const html = await renderProposal({
    slug: p.slug,
    template: p.template,
    data: p.data ?? {},
    approvedAt: p.approved_at,
    approvedName: p.approved_name,
    preview: Boolean(user),
  });
  return new Response(html, { headers: HEADERS });
}
