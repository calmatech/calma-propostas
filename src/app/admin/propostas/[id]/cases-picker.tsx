"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/modal";
import { CaseForm } from "@/components/case-form";
import { CaseThumb } from "@/components/case-thumb";
import { mergeCategorias, type CaseCategoria, type CaseItem } from "@/lib/cases";

type Patch = { casesIds?: string[]; casesCategorias?: CaseCategoria[] };

// Escolha dos cases da proposta (da biblioteca) + configuração de cada categoria.
export function CasesPicker({
  library: initialLibrary,
  ids,
  categorias,
  onChange,
}: {
  library: CaseItem[];
  ids: string[];
  categorias: CaseCategoria[];
  onChange: (p: Patch) => void;
}) {
  const [library, setLibrary] = useState(initialLibrary);
  const [editing, setEditing] = useState<CaseItem | "novo" | null>(null);
  const [toAdd, setToAdd] = useState("");

  const byId = useMemo(() => new Map(library.map((c) => [c.id, c])), [library]);
  const selected = ids.map((id) => byId.get(id)).filter((c): c is CaseItem => !!c);
  const cats = mergeCategorias(selected, categorias);
  const allCats = [...new Set(library.map((c) => c.categoria).filter(Boolean))];
  const available = library.filter((c) => !ids.includes(c.id));

  const setIds = (next: string[]) => onChange({ casesIds: next, casesCategorias: mergeCategorias(next.map((id) => byId.get(id)).filter((c): c is CaseItem => !!c), categorias) });
  const move = <T,>(arr: T[], i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= arr.length) return arr;
    const n = [...arr];
    [n[i], n[j]] = [n[j], n[i]];
    return n;
  };
  const setCat = (i: number, patch: Partial<CaseCategoria>) => onChange({ casesCategorias: cats.map((c, k) => (k === i ? { ...c, ...patch } : c)) });

  return (
    <div className="stack">
      <div>
        <span className="muted small" style={{ display: "block", marginBottom: 8 }}>
          Projetos nesta proposta
        </span>
        {selected.length === 0 && <p className="muted small" style={{ margin: 0 }}>Nenhum case escolhido ainda.</p>}
        <div className="stack" style={{ gap: 8 }}>
          {selected.map((c, i) => (
            <div key={c.id} className="case-pick">
              <div className="case-card-frames">
                {c.frames.map((f, k) => (
                  <CaseThumb key={k} frame={f} />
                ))}
              </div>
              <div style={{ minWidth: 0 }}>
                <b>{c.nome}</b>
                <div className="muted small">{c.categoria || "Sem categoria"}</div>
              </div>
              <span className="inline" style={{ gap: 8 }}>
                <button type="button" className="linkbtn small" onClick={() => setIds(move(ids, ids.indexOf(c.id), -1))} aria-label="Subir">↑</button>
                <button type="button" className="linkbtn small" onClick={() => setIds(move(ids, ids.indexOf(c.id), 1))} aria-label="Descer">↓</button>
                <button type="button" className="linkbtn small" onClick={() => setEditing(c)}>Editar</button>
                <button type="button" className="linkbtn small" onClick={() => setIds(ids.filter((x) => x !== c.id))}>Remover</button>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="inline">
        <select value={toAdd} onChange={(e) => setToAdd(e.target.value)} style={{ width: "auto", flex: 1, minWidth: 200 }}>
          <option value="">{available.length ? "Escolher da biblioteca…" : "Todos os cases da biblioteca já estão aqui"}</option>
          {allCats.map((cat) => (
            <optgroup key={cat} label={cat}>
              {available.filter((c) => c.categoria === cat).map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </optgroup>
          ))}
          {available.filter((c) => !c.categoria).map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
        <button type="button" className="btn ghost sm" disabled={!toAdd} onClick={() => { setIds([...ids, toAdd]); setToAdd(""); }}>
          Adicionar
        </button>
        <button type="button" className="btn sm" onClick={() => setEditing("novo")}>
          + Criar novo case
        </button>
      </div>

      {cats.length > 0 && (
        <div className="stack">
          <span className="muted small">Categorias (na ordem em que aparecem na proposta)</span>
          {cats.map((c, i) => (
            <div key={c.nome} className="row-item">
              <header>
                <b>{c.nome}</b>
                <span className="inline" style={{ gap: 8 }}>
                  <button type="button" className="linkbtn small" onClick={() => onChange({ casesCategorias: move(cats, i, -1) })} aria-label="Subir">↑</button>
                  <button type="button" className="linkbtn small" onClick={() => onChange({ casesCategorias: move(cats, i, 1) })} aria-label="Descer">↓</button>
                </span>
              </header>
              <div className="grid3">
                <label className="f">
                  <span>Projetos abertos</span>
                  <input type="number" min={1} value={c.abertos} onChange={(e) => setCat(i, { abertos: Math.max(1, Number(e.target.value) || 1) })} />
                </label>
                <label className="f">
                  <span>“Ver mais”</span>
                  <select value={c.verMais} onChange={(e) => setCat(i, { verMais: e.target.value as CaseCategoria["verMais"] })}>
                    <option value="expandir">Mostra os ocultos</option>
                    <option value="link">Leva para um link</option>
                    <option value="nenhum">Sem “Ver mais”</option>
                  </select>
                </label>
                {c.verMais === "link" && (
                  <label className="f">
                    <span>Link do “Ver mais”</span>
                    <input value={c.verMaisLink ?? ""} placeholder="https://…" onChange={(e) => setCat(i, { verMaisLink: e.target.value })} />
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "novo" ? "Novo case" : "Editar case"} wide>
        {editing && (
          <>
            {editing !== "novo" && (
              <p className="small" style={{ margin: 0, color: "var(--warn)" }}>
                Alterações aqui valem para todas as propostas que usam este case.
              </p>
            )}
            <CaseForm
              key={editing === "novo" ? "novo" : editing.id}
              initial={editing === "novo" ? undefined : editing}
              categorias={allCats}
              onCancel={() => setEditing(null)}
              onSaved={(item) => {
                setLibrary((x) => (x.some((y) => y.id === item.id) ? x.map((y) => (y.id === item.id ? item : y)) : [...x, item]));
                if (editing === "novo") setIds([...ids, item.id]);
                setEditing(null);
              }}
            />
          </>
        )}
      </Modal>
    </div>
  );
}
