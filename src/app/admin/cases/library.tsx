"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/modal";
import { CaseForm } from "@/components/case-form";
import { CaseThumb } from "@/components/case-thumb";
import { ActionButton } from "@/components/action-button";
import type { CaseItem } from "@/lib/cases";
import { deleteCase } from "../actions";

export function CasesLibrary({ initial }: { initial: CaseItem[] }) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<CaseItem | "novo" | null>(null);
  const categorias = useMemo(() => [...new Set(items.map((c) => c.categoria).filter(Boolean))], [items]);
  const grupos = useMemo(() => {
    const m = new Map<string, CaseItem[]>();
    for (const c of items) m.set(c.categoria || "Sem categoria", [...(m.get(c.categoria || "Sem categoria") ?? []), c]);
    return [...m.entries()];
  }, [items]);

  return (
    <>
      <div className="inline" style={{ marginBottom: 24 }}>
        <button type="button" className="btn" onClick={() => setEditing("novo")}>
          Novo case +
        </button>
        <span className="muted small">{items.length} {items.length === 1 ? "case" : "cases"}</span>
      </div>

      {items.length === 0 && <div className="card muted">Nenhum case ainda. Crie o primeiro aqui ou direto no editor de uma proposta.</div>}

      {grupos.map(([cat, list]) => (
        <section key={cat} style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 26, marginBottom: 14 }}>{cat}</h2>
          <div className="case-grid">
            {list.map((c) => (
              <div key={c.id} className="case-card">
                <button type="button" className="case-card-main" onClick={() => setEditing(c)}>
                  <div className="case-card-frames">
                    {c.frames.map((f, i) => (
                      <CaseThumb key={i} frame={f} />
                    ))}
                  </div>
                  <b>{c.nome}</b>
                </button>
                <div className="inline" style={{ justifyContent: "space-between" }}>
                  <button type="button" className="linkbtn small" onClick={() => setEditing(c)}>
                    Editar
                  </button>
                  <ActionButton
                    className="linkbtn small"
                    confirm={`Excluir o case "${c.nome}"? Ele sai de todas as propostas que o usam.`}
                    action={async () => {
                      await deleteCase(c.id);
                      setItems((x) => x.filter((y) => y.id !== c.id));
                    }}
                  >
                    Excluir
                  </ActionButton>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "novo" ? "Novo case" : "Editar case"} wide>
        {editing && (
          <CaseForm
            key={editing === "novo" ? "novo" : editing.id}
            initial={editing === "novo" ? undefined : editing}
            categorias={categorias}
            onCancel={() => setEditing(null)}
            onSaved={(item) => {
              setItems((x) => (x.some((y) => y.id === item.id) ? x.map((y) => (y.id === item.id ? item : y)) : [...x, item]));
              setEditing(null);
            }}
          />
        )}
      </Modal>
    </>
  );
}
