import { calmaV1Defaults } from "./calma-v1";

// Registro de modelos. Para criar um novo: adicione o HTML em /templates
// (com os marcadores /*__DATA__*/, <!--__HEAD__--> e <!--__RUNTIME__-->)
// e registre aqui com os valores padrão.
export const TEMPLATES = {
  "calma-v1": {
    name: "Calma · Identidade + Site",
    file: "calma-v1.html",
    defaults: calmaV1Defaults as Record<string, unknown>,
  },
} as const;

export type TemplateId = keyof typeof TEMPLATES;

export const isTemplateId = (id: string): id is TemplateId => id in TEMPLATES;
