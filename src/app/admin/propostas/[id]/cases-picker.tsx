"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/modal";
import { CaseForm } from "@/components/case-form";
import { CaseThumb } from "@/components/case-thumb";
import { mergeCategorias, type CaseCategoria, type CaseItem } from "@/lib/cases";

type Patch = { casesIds?: string[]; casesCategorias?: CaseCategoria[] };

const swap = <T,>(arr: T[], i: number, d: number) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const n = [...arr];
  [n[i], n[j]] = [n[j], n[i]];
  return n;
};

// Escolha dos cases da proposta, agrupados exatamente como aparecem na proposta:
// cada categoria é um bloco (com suas configurações) e a ordem aqui é a ordem lá.
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
  const allCats = [...new Set(library.map((c) => c.categoria).filter(Boolean))];
  const available = library.filter((c) => !ids.includes(c.id));

  // monta os grupos a partir de uma lista de ids (na ordem das categorias)
  const build = (idList: string[], conf: CaseCategoria[], lib = byId) => {
    const sel = idList.map((id) => lib.get(id)).filter((c): c is CaseItem => !!c);
    const cats = mergeCategorias(sel, conf);
    const groups = cats.map((cat) => ({ cat, items: sel.filter((c) => c.categoria.trim() === cat.nome) }));
    const semCategoria = sel.filter((c) => !c.categoria.trim());
    return { cats, groups, semCategoria };
  };
  const { cats, groups, semCategoria } = build(ids, categorias);

  // salva ids já na ordem visual (categoria por categoria) + a configuração das categorias
  const commit = (gs: typeof groups, extra: CaseItem[] = semCategoria) =>
    onChange({ casesIds: [...gs.flatMap((g) => g.items.map((c) => c.id)), ...extra.map((c) => c.id)], casesCategorias: gs.map((g) => g.cat) });

  const moveItem = (gi: number, i: number, d: number) => commit(groups.map((g, k) => (k === gi ? { ...g, items: swap(g.items, i, d) } : g)));
  const moveCat = (gi: number, d: number) => commit(swap(groups, gi, d));
  const setCat = (gi: number, patch: Partial<CaseCategoria>) => commit(groups.map((g, k) => (k === gi ? { ...g, cat: { ...g.cat, ...patch } } : g)));
  const remove = (id: string) => {
    const r = build(ids.filter((x) => x !== id), cats);
    commit(r.groups, r.semCategoria);
  };
  const add = (id: string, lib = byId) => {
    const r = build([...ids, id], cats, lib);
    commit(r.groups, r.semCategoria);
  };

  const row = (c: CaseItem, onUp?: () => void, onDown?: () => void) => (
    <div key={c.id} className="case-pick">
      <div className="case-card-frames">
        {c.frames.slice(0, 2).map((f, k) => (
          <CaseThumb key={k} frame={f} />
        ))}
      </div>
      <div style={{ minWidth: 0 }}>
        <b>{c.nome}</b>
        <div className="muted small">{c.frames.length > 2 ? `+${c.frames.length - 2} fotos na galeria` : `${c.frames.length} quadros`}</div>
      </div>
      <span className="inline" style={{ gap: 8 }}>
        {onUp && <button type="button" className="linkbtn small" onClick={onUp} aria-label="Subir">↑</button>}
        {onDown && <button type="button" className="linkbtn small" onClick={onDown} aria-label="Descer">↓</button>}
        <button type="button" className="linkbtn small" onClick={() => setEditing(c)}>Editar</button>
        <button type="button" className="linkbtn small" onClick={() => remove(c.id)}>Remover</button>
      </span>
    </div>
  );

  return (
    <div className="stack">
      {groups.length === 0 && semCategoria.length === 0 && <p className="muted small" style={{ margin: 0 }}>Nenhum case escolhido ainda.</p>}

      {groups.map((g, gi) => (
        <div key={g.cat.nome} className="case-group">
          <header>
            <h3>{g.cat.nome}</h3>
            <span className="inline" style={{ gap: 8 }}>
              <span className="muted small">{gi === 0 ? "1ª categoria" : `${gi + 1}ª categoria`}</span>
              <button type="button" className="linkbtn small" onClick={() => moveCat(gi, -1)} disabled={gi === 0} aria-label="Categoria para cima">↑</button>
              <button type="button" className="linkbtn small" onClick={() => moveCat(gi, 1)} disabled={gi === groups.length - 1} aria-label="Categoria para baixo">↓</button>
            </span>
          </header>
          <div className="stack" style={{ gap: 8 }}>
            {g.items.map((c, i) => row(c, i > 0 ? () => moveItem(gi, i, -1) : undefined, i < g.items.length - 1 ? () => moveItem(gi, i, 1) : undefined))}
          </div>
          <div className="grid3">
            <label className="f">
              <span>Projetos abertos</span>
              <input type="number" min={1} value={g.cat.abertos} onChange={(e) => setCat(gi, { abertos: Math.max(1, Number(e.target.value) || 1) })} />
            </label>
            <label className="f">
              <span>“Ver mais”</span>
              <select value={g.cat.verMais} onChange={(e) => setCat(gi, { verMais: e.target.value as CaseCategoria["verMais"] })}>
                <option value="expandir">Mostra os ocultos</option>
                <option value="link">Leva para um link</option>
                <option value="nenhum">Sem “Ver mais”</option>
              </select>
            </label>
            {g.cat.verMais === "link" && (
              <label className="f">
                <span>Link do “Ver mais”</span>
                <input value={g.cat.verMaisLink ?? ""} placeholder="https://…" onChange={(e) => setCat(gi, { verMaisLink: e.target.value })} />
              </label>
            )}
          </div>
          {g.items.length > g.cat.abertos && g.cat.verMais === "nenhum" && (
            <p className="small" style={{ margin: 0, color: "var(--warn)" }}>
              Só os {g.cat.abertos} primeiros aparecem (sem “Ver mais”).
            </p>
          )}
        </div>
      ))}

      {semCategoria.length > 0 && (
        <div className="case-group">
          <header>
            <h3>Sem categoria</h3>
            <span className="small" style={{ color: "var(--warn)" }}>Não aparecem na proposta: defina a categoria no case.</span>
          </header>
          <div className="stack" style={{ gap: 8 }}>{semCategoria.map((c) => row(c))}</div>
        </div>
      )}

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
        <button type="button" className="btn ghost sm" disabled={!toAdd} onClick={() => { add(toAdd); setToAdd(""); }}>
          Adicionar
        </button>
        <button type="button" className="btn sm" onClick={() => setEditing("novo")}>
          + Criar novo case
        </button>
      </div>

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
                const next = library.some((y) => y.id === item.id) ? library.map((y) => (y.id === item.id ? item : y)) : [...library, item];
                setLibrary(next);
                const lib = new Map(next.map((c) => [c.id, c]));
                if (editing === "novo") add(item.id, lib);
                else {
                  // a categoria pode ter mudado: reagrupa com os dados novos
                  const r = build(ids, cats, lib);
                  commit(r.groups, r.semCategoria);
                }
                setEditing(null);
              }}
            />
          </>
        )}
      </Modal>
    </div>
  );
}
