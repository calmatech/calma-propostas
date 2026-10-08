import { fmtDate, publicUrl, shortLink, statusOf, timeAgo, type ProposalRow } from "@/lib/proposals";
import { Copy } from "@/components/copy";
import { ActionButton } from "@/components/action-button";
import { Sk } from "@/components/skeletons";
import { addProposalLink } from "@/app/admin/actions";

export type ProposalEvent = {
  id: number;
  type: string;
  detail: string | null;
  session_id: string | null;
  user_agent: string | null;
  country: string | null;
  city: string | null;
  created_at: string;
};

const SECTION_LABEL: Record<string, string> = {
  sobre: "Sobre",
  entrega: "O que vamos entregar",
  etapas: "Como funciona",
  investimento: "Investimento",
  cloud: "Calma Cloud",
  aprovar: "Próximos passos",
};

const eventLabel = (e: ProposalEvent) =>
  ({
    view: "Abriu a proposta",
    link_click: "Clicou no link curto",
    section: `Viu “${SECTION_LABEL[e.detail ?? ""] ?? e.detail}”`,
    approve_open: "Clicou em Aprovar (abriu a confirmação)",
    approve: "Confirmou a aprovação",
    unapprove: "Aprovação desfeita pela equipe",
  })[e.type] ?? e.type;

function device(ua: string | null) {
  if (!ua) return "";
  const os = /iPhone|iPad/.test(ua) ? "iPhone/iPad" : /Android/.test(ua) ? "Android" : /Mac OS/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : "";
  const br = /Instagram/.test(ua) ? "Instagram" : /WhatsApp/.test(ua) ? "WhatsApp" : /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : /Firefox\//.test(ua) ? "Firefox" : "";
  return [os, br].filter(Boolean).join(" · ");
}

// Status, jornada, links e atividade de uma proposta.
// Usado na página de edição e na gaveta da lista. events = null → carregando.
export function ProposalInsights({ p, events }: { p: ProposalRow; events: ProposalEvent[] | null }) {
  const st = statusOf(p);
  const firstClick = events?.filter((e) => e.type === "link_click").at(-1)?.created_at ?? null;
  const clicked = p.links?.find((l) => l.clicks > 0);
  const funnel: [string, string | null][] = [
    ["Clicou no link", firstClick ?? clicked?.last_click_at ?? null],
    ["Abriu a proposta", p.first_viewed_at],
    ["Chegou no investimento", p.reached_pricing_at ?? null],
    ["Clicou em Aprovar", p.approve_opened_at ?? null],
    ["Confirmou a aprovação", p.approved_at],
  ];
  const sessions = events ? new Set(events.filter((e) => e.type === "view").map((e) => e.session_id)).size : null;

  return (
    <>
      <div className="card stack">
        <div className="inline" style={{ justifyContent: "space-between" }}>
          <span className={`pill ${st.tone}`}>{st.label}</span>
          <span className="muted small">
            {p.view_count} {p.view_count === 1 ? "acesso" : "acessos"}
            {sessions !== null && ` · ${sessions} ${sessions === 1 ? "sessão" : "sessões"}`}
          </span>
        </div>
        {p.approved_at ? (
          <div>
            <p style={{ margin: 0 }}>
              Aprovada por <b>{p.approved_name}</b>
              <br />
              <span className="muted small">{fmtDate(p.approved_at)}</span>
            </p>
            {p.approved_note && <p className="small" style={{ margin: "8px 0 0", whiteSpace: "pre-wrap" }}>“{p.approved_note}”</p>}
          </div>
        ) : (
          <p className="muted small" style={{ margin: 0 }}>
            {p.first_viewed_at ? `Primeiro acesso ${timeAgo(p.first_viewed_at)}, último ${timeAgo(p.last_viewed_at)}.` : "Ainda não foi aberta pelo cliente."}
          </p>
        )}
      </div>

      <div className="card stack">
        <h2 style={{ fontSize: 22 }}>Jornada do cliente</h2>
        <ol className="funnel">
          {funnel.map(([label, at]) => (
            <li key={label} data-done={at ? "" : undefined}>
              <span>{label}</span>
              <span className="muted small">{at ? fmtDate(at) : "—"}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="card stack">
        <h2 style={{ fontSize: 22 }}>Links</h2>
        {(p.links ?? []).map((l) => (
          <div key={l.code} className="inline" style={{ justifyContent: "space-between" }}>
            <Copy text={shortLink(l.code)} />
            <span className="muted small">
              {l.clicks} {l.clicks === 1 ? "clique" : "cliques"}
            </span>
          </div>
        ))}
        <div className="inline" style={{ justifyContent: "space-between" }}>
          <Copy text={publicUrl(p.slug)} label="Copiar link completo" />
          <ActionButton action={addProposalLink.bind(null, p.id)} className="linkbtn small">
            + novo link curto
          </ActionButton>
        </div>
      </div>

      <div className="card stack">
        <h2 style={{ fontSize: 22 }}>Atividade</h2>
        {events === null ? (
          <div className="stack" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12 }}>
                <Sk h={12} />
                <div>
                  <Sk w="60%" />
                  <Sk w="40%" h={10} style={{ marginTop: 8 }} />
                </div>
              </div>
            ))}
          </div>
        ) : events.length ? (
          <ul className="timeline">
            {events.map((e) => (
              <li key={e.id}>
                <span className="muted small">{fmtDate(e.created_at)}</span>
                <span>
                  {eventLabel(e)}
                  <span className="muted small" style={{ display: "block" }}>
                    {[device(e.user_agent), [e.city, e.country].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted small" style={{ margin: 0 }}>
            Nada ainda. Seus próprios acessos (logado no painel) não contam.
          </p>
        )}
      </div>
    </>
  );
}
