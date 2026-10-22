import { renderProposal } from "@/lib/templates/render";

// Proposta de exemplo SÓ para desenvolvimento e testes automatizados (tests/).
// Em produção responde 404. Não usa banco: os dados vêm dos padrões do modelo.
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") return new Response(null, { status: 404 });
  const q = new URL(req.url).searchParams;
  const data: Record<string, unknown> = { cliente: q.get("cliente") ?? "Cliente Teste" };
  if (q.get("semCloud") === "1") data.mostrarCloud = false;
  if (q.get("cases") === "1") {
    const img = (n: number) => (n % 2 ? "/assets/vivi-tavares.jpg" : "/assets/giovanni-fonseca.jpg");
    data.mostrarCases = true;
    data.casesLista = [
      { id: "a", nome: "Mari Nolasco", categoria: "Websites", frames: [{ tipo: "link", url: q.get("site") ?? "https://example.com", abreLink: true }, { tipo: "imagem", url: img(1) }] },
      { id: "b", nome: "Lab Comportamental", categoria: "Websites", frames: [{ tipo: "imagem", url: img(2) }, { tipo: "imagem", url: img(1) }, { tipo: "imagem", url: "/assets/clientes/tedx.svg" }, { tipo: "imagem", url: "/assets/clientes/unidos.svg" }] },
      { id: "c", nome: "Great Place To Work", categoria: "Apps", frames: [{ tipo: "imagem", url: img(1) }, { tipo: "imagem", url: img(2) }] },
      { id: "d", nome: "Waterlog", categoria: "Apps", frames: [{ tipo: "imagem", url: img(2) }, { tipo: "imagem", url: img(1) }] },
      { id: "e", nome: "Ponto App", categoria: "Apps", frames: [{ tipo: "imagem", url: img(1) }, { tipo: "imagem", url: img(2) }] },
    ];
    data.casesCategorias = [
      { nome: "Websites", abertos: 2, verMais: "link", verMaisLink: "https://estudiocalma.com.br" },
      { nome: "Apps", abertos: 2, verMais: "expandir" },
    ];
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
