import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TEMPLATES, isTemplateId, templateData } from "@/lib/templates";
import { fmtDate, publicUrl, type ProposalRow } from "@/lib/proposals";
import { ActionButton } from "@/components/action-button";
import { ProposalInsights, type ProposalEvent } from "@/components/proposal-insights";
import { deleteProposal, duplicateProposal, resetApproval, setArchived } from "../../actions";
import { Editor } from "./editor";

export default async function ProposalPage({ params }: PageProps<"/admin/propostas/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: p }, { data: events }] = await Promise.all([
    supabase.from("proposals").select("*, links(code, clicks, last_click_at)").eq("id", id).maybeSingle<ProposalRow>(),
    supabase.from("proposal_events").select("*").eq("proposal_id", id).order("created_at", { ascending: false }).limit(100),
  ]);
  if (!p) notFound();

  const tplId = isTemplateId(p.template) ? p.template : "calma-v1";
  const data = templateData(tplId, p.data);

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
          <ProposalInsights p={p} events={(events ?? []) as ProposalEvent[]} />

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
