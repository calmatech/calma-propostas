import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TEMPLATES } from "@/lib/templates";
import { fmtMoney, type ProposalRow } from "@/lib/proposals";
import { SubmitButton } from "@/components/submit-button";
import { createProposal } from "./actions";
import { ProposalTable } from "./proposal-table";

const FILTERS = [
  { key: "", label: "Em aberto" },
  { key: "aprovadas", label: "Aprovadas" },
  { key: "todas", label: "Todas" },
  { key: "arquivadas", label: "Arquivadas" },
];

export default async function ProposalsPage({ searchParams }: PageProps<"/admin">) {
  const { f = "" } = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proposals")
    .select("*, links(code, clicks, last_click_at)")
    .order("created_at", { ascending: false });

  const all = (data ?? []) as ProposalRow[];
  const active = all.filter((p) => !p.archived);
  const list = all.filter((p) => {
    if (f === "arquivadas") return p.archived;
    if (p.archived) return false;
    if (f === "aprovadas") return !!p.approved_at;
    if (f === "todas") return true;
    return !p.approved_at;
  });
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
        <form action={createProposal} className="inline">
          <input name="cliente" placeholder="Nome do cliente" required style={{ width: 220 }} />
          {Object.keys(TEMPLATES).length > 1 && (
            <select name="template" style={{ width: "auto" }}>
              {Object.entries(TEMPLATES).map(([id, t]) => (
                <option key={id} value={id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
          <SubmitButton pending="Criando…">Nova proposta +</SubmitButton>
        </form>
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

      <div className="tabs">
        {FILTERS.map((x) => (
          <Link key={x.key} href={x.key ? `/admin?f=${x.key}` : "/admin"} aria-current={f === x.key ? "page" : undefined}>
            {x.label}
          </Link>
        ))}
      </div>

      {error && <p className="err">Erro ao carregar: {error.message}</p>}

      {list.length === 0 ? (
        <div className="card muted">Nenhuma proposta aqui ainda.</div>
      ) : (
        <ProposalTable list={list} all={all} />
      )}
    </>
  );
}
