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
  valor: number;
  parcelasSemJuros: number;
  parcelasMax: number;
  dominio: number;
  planos: [string, number, string][];
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
  valor: 5000,
  parcelasSemJuros: 2,
  parcelasMax: 12,
  dominio: 40,
  planos: [
    ["Básica", 90, "Para sites institucionais e páginas simples."],
    ["Pro", 170, "Para sites maiores ou com atualizações frequentes."],
  ],
};
