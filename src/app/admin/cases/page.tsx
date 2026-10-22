import { createClient } from "@/lib/supabase/server";
import { normalizeCase, type CaseItem } from "@/lib/cases";
import { CasesLibrary } from "./library";

export default async function CasesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("cases").select("id, nome, categoria, frames, updated_at").order("categoria").order("nome");
  const items = (data ?? []).map((c) => normalizeCase(c)) as CaseItem[];
  const semTabela = !!error && /relation .*cases|does not exist|schema cache/i.test(error.message);
  return (
    <>
      <div className="head">
        <div>
          <h1>Cases</h1>
          <p className="muted" style={{ margin: "8px 0 0" }}>
            Biblioteca de projetos para as propostas. Editar aqui atualiza todas as propostas que usam o case.
          </p>
        </div>
      </div>
      {semTabela ? (
        <div className="card">
          <b>Falta criar a tabela de cases no banco.</b>
          <p className="muted small" style={{ margin: "6px 0 0" }}>
            Rode a migração <code>supabase/migrations/003_biblioteca_cases.sql</code> no Supabase (ou <code>pnpm db:migrate</code>).
          </p>
        </div>
      ) : error ? (
        <p className="err">Erro ao carregar: {error.message}</p>
      ) : (
        <CasesLibrary initial={items} />
      )}
    </>
  );
}
