import { env } from "@/lib/env";

export type ProposalRow = {
  id: string;
  slug: string;
  title: string;
  client_name: string;
  template: string;
  data: Record<string, unknown>;
  archived: boolean;
  view_count: number;
  first_viewed_at: string | null;
  last_viewed_at: string | null;
  reached_pricing_at?: string | null;
  approve_opened_at?: string | null;
  approved_at: string | null;
  approved_name: string | null;
  approved_note: string | null;
  created_at: string;
  updated_at: string;
  links?: { code: string; clicks: number; last_click_at: string | null }[];
};

export type Status = {
  key: "approved" | "approving" | "pricing" | "opened" | "clicked" | "sent" | "archived";
  label: string;
  tone: "" | "ok" | "warn";
};

export function statusOf(p: ProposalRow): Status {
  if (p.archived) return { key: "archived", label: "Arquivada", tone: "" };
  if (p.approved_at) return { key: "approved", label: "Aprovada", tone: "ok" };
  if (p.approve_opened_at) return { key: "approving", label: "Clicou em aprovar", tone: "warn" };
  if (p.reached_pricing_at) return { key: "pricing", label: "Viu o investimento", tone: "warn" };
  if (p.first_viewed_at) return { key: "opened", label: "Visualizada", tone: "warn" };
  if (p.links?.some((l) => l.clicks > 0)) return { key: "clicked", label: "Link clicado", tone: "warn" };
  return { key: "sent", label: "Não aberta", tone: "" };
}

export const publicUrl = (slug: string) => `${env.siteUrl()}/p/${slug}`;
export const shortLink = (code: string) => `${env.shortUrl()}/${code}`;

export const fmtMoney = (n: unknown) =>
  typeof n === "number" ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }) : "—";

export const fmtDate = (iso: string | null, withTime = true) =>
  iso
    ? new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "short",
        ...(withTime ? { hour: "2-digit", minute: "2-digit" } : { year: "numeric" }),
        timeZone: "America/Sao_Paulo",
      })
    : "—";

export function timeAgo(iso: string | null) {
  if (!iso) return "—";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "agora";
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  if (s < 86400 * 30) return `há ${Math.floor(s / 86400)} d`;
  return fmtDate(iso, false);
}
