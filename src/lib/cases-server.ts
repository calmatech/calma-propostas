import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { normalizeCase, type CaseItem } from "@/lib/cases";

// Busca os cases de uma proposta (na ordem escolhida). Falha silenciosa: sem cases.
export async function fetchCasesByIds(ids: string[]): Promise<CaseItem[]> {
  if (!ids.length) return [];
  try {
    const { data } = await adminClient().from("cases").select("id, nome, categoria, frames").in("id", ids);
    const byId = new Map((data ?? []).map((c) => [c.id, normalizeCase(c)]));
    return ids.map((id) => byId.get(id)).filter((c): c is CaseItem => !!c);
  } catch {
    return [];
  }
}

// O site permite ser mostrado dentro de um quadro (iframe) em outra página?
export async function checkEmbeddable(url: string): Promise<boolean | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch(url, { redirect: "follow", signal: ctrl.signal, headers: { "user-agent": "Mozilla/5.0 (Calma Propostas; verificação de quadro)" } });
    clearTimeout(t);
    const xfo = (r.headers.get("x-frame-options") || "").toLowerCase();
    if (xfo.includes("deny") || xfo.includes("sameorigin")) return false;
    const csp = r.headers.get("content-security-policy") || "";
    const fa = csp.split(";").map((d) => d.trim()).find((d) => d.toLowerCase().startsWith("frame-ancestors"));
    if (fa) {
      const v = fa.slice("frame-ancestors".length).trim();
      if (v.includes("'none'")) return false;
      if (!v.includes("*") && !/estudiocalma\.com\.br/.test(v)) return false;
    }
    return true;
  } catch {
    return null; // não deu para verificar (tenta exibir mesmo assim)
  }
}
