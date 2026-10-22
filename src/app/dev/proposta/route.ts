import { renderProposal } from "@/lib/templates/render";

// Proposta de exemplo SÓ para desenvolvimento e testes automatizados (tests/).
// Em produção responde 404. Não usa banco: os dados vêm dos padrões do modelo.
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") return new Response(null, { status: 404 });
  const q = new URL(req.url).searchParams;
  const data: Record<string, unknown> = { cliente: q.get("cliente") ?? "Cliente Teste" };
  if (q.get("semCloud") === "1") data.mostrarCloud = false;
  if (q.get("cases") === "1") {
    data.mostrarCases = true;
    data.cases = [1, 2, 3, 4].map((i) => ({
      imagem: i % 2 ? "/assets/vivi-tavares.jpg" : "/assets/giovanni-fonseca.jpg",
      categoria: "Identidade + Site",
      titulo: `Case de exemplo ${i}`,
      descricao: "Uma marca e um site feitos juntos, do primeiro papo ao ar.",
      link: i < 3 ? "https://estudiocalma.com.br" : "",
    }));
  }
  if (q.get("umaEntrega") === "1") data.grupos = [["Identidade visual", ["Imersão de 2h.", "Logo e elementos de marca.", "Paleta de cores e fontes.", "Templates de slides e posts.", "Entrega dos arquivos."]]];
  if (q.get("etapas")) data.etapas = Array.from({ length: Number(q.get("etapas")) }, (_, i) => [`Etapa ${i + 1}`, "Descrição da etapa."]);
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
