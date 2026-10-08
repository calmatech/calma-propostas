// Campos do modelo "calma-v1" (templates/calma-v1.html).
// Tuplas mantêm o formato que o HTML do modelo já espera.
export type CalmaV1 = {
  cliente: string;
  projeto: string;
  projetoMin: string;
  subtitulo: string;
  validade: string; // AAAA-MM-DD
  contato: string;
  descricao: string;
  ticker: string[];
  grupos: [string, string[]][];
  naoInclui: string[];
  etapas: [string, string][];
  prazo: string;
  inicio: string;
  valor: number; // valor cheio (cartão)
  valorPix?: number; // à vista no Pix; o selo de desconto é calculado
  parcelasSemJuros: number;
  parcelasMax: number;
  dominio: number;
  // [nome, R$/mês no plano anual, descrição, R$/mês no plano mensal]
  planos: [string, number, string, number?][];
};

export const calmaV1Defaults: CalmaV1 = {
  cliente: "[Nome]",
  projeto: "Identidade Visual + Site",
  projetoMin: "identidade visual e do site",
  subtitulo:
    "Uma marca nova e um site para inaugurar esse momento. Aqui está tudo o que vamos fazer juntos, quanto custa e como começar.",
  validade: "",
  contato: "",
  descricao:
    "Vamos construir a marca e o site juntos para inaugurar esse novo momento: um visual moderno e sensível, um logo próprio e elementos de marca que façam sentido (e sentir). O site nasce dessa mesma identidade, pronto para apresentar o seu trabalho no computador e no celular.",
  ticker: ["Identidade visual", "Site", "Calma Cloud", "Criar com sensibilidade e intenção"],
  grupos: [
    [
      "Identidade visual",
      [
        "Imersão de 2h com prática guiada, troca de desejos e referências.",
        "Criação de logo, elementos de marca, paleta de cores, imagens e fontes.",
        "Materiais base: templates de slides, posts e newsletter.",
        "Finalização e entrega de arquivos &lt;3",
      ],
    ],
    [
      "Site",
      [
        "Estrutura e conteúdo das páginas definidos junto com você.",
        "Design e desenvolvimento do site, responsivo para celular e computador.",
        "Publicação na Calma Cloud e conexão com o seu domínio.",
      ],
    ],
  ],
  naoInclui: [
    "Registro do domínio, que é feito no seu nome.",
    "Mensalidade da Calma Cloud, cobrada a partir da publicação.",
    "Licenças pagas de fontes ou bancos de imagem, se forem necessárias.",
  ],
  etapas: [
    ["Imersão", "Duas horas juntos para entender desejos e referências."],
    ["Identidade", "Logo, elementos, cores e fontes, com rodadas de ajuste."],
    ["Site", "Design das páginas com a nova marca e desenvolvimento."],
    ["No ar", "Publicação na Calma Cloud e entrega dos arquivos."],
  ],
  prazo: "45 dias úteis",
  inicio: "Após o contrato",
  valor: 5550,
  valorPix: 4990,
  parcelasSemJuros: 2,
  parcelasMax: 12,
  dominio: 40,
  planos: [
    ["Básica", 90, "Para sites institucionais e páginas simples.", 139],
    ["Pro", 170, "Para sites maiores ou com atualizações frequentes. Inclui estrutura de blog e suporte personalizado.", 210],
  ],
};

const OLD_PRO_DESC = "Para sites maiores ou com atualizações frequentes.";

// Propostas antigas: completa planos sem valor mensal e o campo Pix.
export function normalizeCalmaV1(data: Record<string, unknown>, raw: Record<string, unknown> = data): Record<string, unknown> {
  // proposta salva antes do campo Pix: Pix = valor do cartão (sem selo de desconto)
  if ("valor" in raw && !("valorPix" in raw)) data = { ...data, valorPix: 0 };
  if (!Array.isArray(data.planos)) return data;
  const planos = (data.planos as CalmaV1["planos"]).map((pl) => {
    const def = calmaV1Defaults.planos.find((d) => d[0] === pl[0]);
    if (!def) return pl;
    const desc = pl[0] === "Pro" && pl[2] === OLD_PRO_DESC ? def[2] : pl[2];
    return [pl[0], pl[1], desc, typeof pl[3] === "number" ? pl[3] : def[3]] as CalmaV1["planos"][number];
  });
  return { ...data, planos };
}
