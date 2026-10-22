// Biblioteca de cases (tabela public.cases), reutilizável entre propostas.

export type CaseFrame = {
  tipo: "imagem" | "link";
  url: string; // imagem: endereço da imagem · link: endereço do site
  thumb?: string; // imagem: versão média usada no quadro (a original em alta fica para a galeria)
  capa?: string; // link: imagem mostrada se o site não puder ser exibido no quadro
  abreLink?: boolean; // link: o clique abre o site (padrão: sim)
  embed?: boolean | null; // link: o site permite ser exibido em quadro? (verificado ao salvar)
};

export type CaseItem = {
  id: string;
  nome: string;
  categoria: string;
  frames: CaseFrame[];
  updated_at?: string;
};

// Configuração de cada categoria dentro de uma proposta
export type CaseCategoria = {
  nome: string;
  abertos: number; // quantos projetos aparecem antes do "Ver mais"
  verMais: "expandir" | "link" | "nenhum";
  verMaisLink?: string;
};

export const MAX_FRAMES = 24;

export const emptyFrame = (): CaseFrame => ({ tipo: "imagem", url: "" });

export function normalizeCase(c: Partial<CaseItem> & { id: string }): CaseItem {
  // os 2 primeiros aparecem na proposta; os demais só na galeria
  const frames = Array.isArray(c.frames) ? c.frames.slice(0, MAX_FRAMES) : [];
  while (frames.length < 2) frames.push(emptyFrame());
  return { id: c.id, nome: c.nome ?? "", categoria: c.categoria ?? "", frames, updated_at: c.updated_at };
}

// Categorias na ordem da proposta: as configuradas primeiro, depois as novas (ordem de aparição)
export function mergeCategorias(cases: CaseItem[], conf: CaseCategoria[] = []): CaseCategoria[] {
  const nomes = [...new Set(cases.map((c) => c.categoria.trim()).filter(Boolean))];
  const known = conf.filter((c) => nomes.includes(c.nome));
  for (const n of nomes) if (!known.some((c) => c.nome === n)) known.push({ nome: n, abertos: 2, verMais: "expandir" });
  return known;
}
