import { createClient } from "@/lib/supabase/server";
import { TEMPLATES } from "@/lib/templates";
import { fmtMoney, type ProposalRow } from "@/lib/proposals";
import { ProposalTable } from "./proposal-table";
import { NewProposal } from "./new-proposal";

export default async function ProposalsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proposals")
    .select("*, links(code, clicks, last_click_at)")
    .order("created_at", { ascending: false });

  const all = (data ?? []) as ProposalRow[];
  const active = all.filter((p) => !p.archived);
  const approved = active.filter((p) => p.approved_at);
  const approvedValue = approved.reduce((s, p) => s + (Number(p.data?.valor) || 0), 0);

  return (
    <>
      <div className="head">
        <div>
          <h1>Propostas</h1>
          <p className="muted" style={{ margin: "8px 0 0" }}>
            Acompanhe quem abriu e quem aprovou.
          </p>
        </div>
        <NewProposal templates={Object.entries(TEMPLATES).map(([id, t]) => ({ id, name: t.name }))} />
      </div>

      <div className="grid3" style={{ marginBottom: 28 }}>
        <div className="card stat">
          <b>{active.filter((p) => !p.approved_at).length}</b>
          <span>em aberto · {active.filter((p) => !p.approved_at && p.first_viewed_at).length} já visualizadas</span>
        </div>
        <div className="card stat">
          <b>{approved.length}</b>
          <span>aprovadas</span>
        </div>
        <div className="card stat">
          <b>{fmtMoney(approvedValue)}</b>
          <span>em propostas aprovadas</span>
        </div>
      </div>

      {error && <p className="err">Erro ao carregar: {error.message}</p>}

      <ProposalTable all={all} />
    </>
  );
}
