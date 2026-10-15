import { renderProposal } from "@/lib/templates/render";

// Proposta de exemplo SÓ para desenvolvimento e testes automatizados (tests/).
// Em produção responde 404. Não usa banco: os dados vêm dos padrões do modelo.
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") return new Response(null, { status: 404 });
  const q = new URL(req.url).searchParams;
  const data: Record<string, unknown> = { cliente: q.get("cliente") ?? "Cliente Teste" };
  if (q.get("semCloud") === "1") data.mostrarCloud = false;
  const html = await renderProposal({
    slug: "teste-dev",
    template: q.get("modelo") ?? "calma-v1",
    data,
    approvedAt: null,
    approvedName: null,
    preview: q.get("equipe") === "1",
  });
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex" } });
}
