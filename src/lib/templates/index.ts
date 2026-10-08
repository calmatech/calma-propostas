import { calmaV1Defaults, normalizeCalmaV1 } from "./calma-v1";

// Registro de modelos. Para criar um novo: adicione o HTML em /templates
// (com os marcadores /*__DATA__*/, <!--__HEAD__--> e <!--__RUNTIME__-->)
// e registre aqui com os valores padrão.
export const TEMPLATES = {
  "calma-v1": {
    name: "Calma · Identidade + Site",
    file: "calma-v1.html",
    defaults: calmaV1Defaults as Record<string, unknown>,
    normalize: normalizeCalmaV1,
  },
} as const;

export type TemplateId = keyof typeof TEMPLATES;

// Valores padrão + dados da proposta, já normalizados para a versão atual do modelo
export function templateData(id: TemplateId, data: Record<string, unknown>) {
  const t = TEMPLATES[id];
  return t.normalize({ ...t.defaults, ...data }, data);
}

export const isTemplateId = (id: string): id is TemplateId => id in TEMPLATES;
