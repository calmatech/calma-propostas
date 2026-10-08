import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TEMPLATES, isTemplateId } from "@/lib/templates";
import { fmtDate, publicUrl, shortLink, statusOf, timeAgo, type ProposalRow } from "@/lib/proposals";
import { Copy } from "@/components/copy";
import { ActionButton } from "@/components/action-button";
import { addProposalLink, deleteProposal, duplicateProposal, resetApproval, setArchived } from "../../actions";
import { Editor } from "./editor";

type Event = { id: number; type: string; session_id: string | null; user_agent: string | null; country: string | null; city: string | null; created_at: string };

const EVENT_LABEL: Record<string, string> = {
  view: "Abriu a proposta",
  link_click: "Clicou no link curto",
  approve: "Aprovou a proposta",
  unapprove: "Aprovação desfeita pela equipe",
};

function device(ua: string | null) {
  if (!ua) return "";
  const os = /iPhone|iPad/.test(ua) ? "iPhone/iPad" : /Android/.test(ua) ? "Android" : /Mac OS/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : "";
  const br = /Instagram/.test(ua) ? "Instagram" : /WhatsApp/.test(ua) ? "WhatsApp" : /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : /Firefox\//.test(ua) ? "Firefox" : "";
  return [os, br].filter(Boolean).join(" · ");
}

export default async function ProposalPage({ params }: PageProps<"/admin/propostas/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: p }, { data: events }] = await Promise.all([
    supabase.from("proposals").select("*, links(code, clicks, last_click_at)").eq("id", id).maybeSingle<ProposalRow>(),
    supabase.from("proposal_events").select("*").eq("proposal_id", id).order("created_at", { ascending: false }).limit(100),
  ]);
  if (!p) notFound();

  const st = statusOf(p);
  const tplId = isTemplateId(p.template) ? p.template : "calma-v1";
  const data = { ...TEMPLATES[tplId].defaults, ...p.data };
  const sessions = new Set((events as Event[] | null)?.filter((e) => e.type === "view").map((e) => e.session_id)).size;

  return (
    <>
      <div className="head">
        <div>
          <p className="small" style={{ margin: "0 0 8px" }}>
            <Link href="/admin" className="muted">
              ← Propostas
            </Link>
          </p>
          <h1>{p.client_name || "Sem nome"}</h1>
          <p className="muted" style={{ margin: "8px 0 0" }}>
            {TEMPLATES[tplId].name} · criada em {fmtDate(p.created_at, false)}
          </p>
        </div>
        <div className="inline">
          <a className="btn ghost" href={publicUrl(p.slug)} target="_blank" rel="noreferrer">
            Ver proposta ↗
          </a>
        </div>
      </div>

      <div className="editor">
        <Editor id={p.id} template={tplId} initial={data} />

        <aside className="stack">
          <div className="card stack">
            <div className="inline" style={{ justifyContent: "space-between" }}>
              <span className={`pill ${st.tone}`}>{st.label}</span>
              <span className="muted small">
                {p.view_count} {p.view_count === 1 ? "acesso" : "acessos"} · {sessions} {sessions === 1 ? "sessão" : "sessões"}
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
            <h2 style={{ fontSize: 22 }}>Links</h2>
            {(p.links ?? []).map((l) => (
              <div key={l.code} className="inline" style={{ justifyContent: "space-between" }}>
                <Copy text={shortLink(l.code)} />
                <span className="muted small">{l.clicks} cliques</span>
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
            {events?.length ? (
              <ul className="timeline">
                {(events as Event[]).map((e) => (
                  <li key={e.id}>
                    <span className="muted small">{fmtDate(e.created_at)}</span>
                    <span>
                      {EVENT_LABEL[e.type] ?? e.type}
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

          <div className="card inline">
            <ActionButton action={duplicateProposal.bind(null, p.id)}>Duplicar</ActionButton>
            <ActionButton action={setArchived.bind(null, p.id, !p.archived)}>{p.archived ? "Desarquivar" : "Arquivar"}</ActionButton>
            {p.approved_at && (
              <ActionButton action={resetApproval.bind(null, p.id)} confirm="Desfazer a aprovação desta proposta?">
                Desfazer aprovação
              </ActionButton>
            )}
            <ActionButton action={deleteProposal.bind(null, p.id)} confirm="Excluir esta proposta e os links dela? Não dá para desfazer." className="btn danger sm">
              Excluir
            </ActionButton>
          </div>
          <p className="muted small">Proposta arquivada sai do ar para o cliente (o link mostra “indisponível”).</p>
        </aside>
      </div>
    </>
  );
}
