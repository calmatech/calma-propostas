"use client";

import { useState, useTransition } from "react";
import { ImageField } from "@/components/image-field";
import { emptyFrame, type CaseFrame, type CaseItem } from "@/lib/cases";
import { saveCase } from "@/app/admin/actions";

// Formulário de um case da biblioteca (usado na página Cases e no editor da proposta).
export function CaseForm({
  initial,
  categorias,
  onSaved,
  onCancel,
}: {
  initial?: CaseItem;
  categorias: string[];
  onSaved: (item: CaseItem) => void;
  onCancel: () => void;
}) {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [categoria, setCategoria] = useState(initial?.categoria ?? categorias[0] ?? "");
  const [frames, setFrames] = useState<CaseFrame[]>(() => {
    const f = initial?.frames?.slice(0, 2) ?? [];
    while (f.length < 2) f.push(emptyFrame());
    return f;
  });
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const setFrame = (i: number, f: CaseFrame) => setFrames((x) => x.map((y, k) => (k === i ? f : y)));

  const submit = () =>
    start(async () => {
      setErr("");
      const r = await saveCase({ id: initial?.id, nome, categoria, frames });
      if (r.ok) onSaved(r.item);
      else setErr(r.error);
    });

  return (
    <div className="stack">
      <div className="grid2">
        <label className="f">
          <span>Nome do projeto</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Mari Nolasco" autoFocus />
        </label>
        <label className="f">
          <span>Categoria</span>
          <input value={categoria} onChange={(e) => setCategoria(e.target.value)} list="case-categorias" placeholder="Ex.: Websites" />
          <datalist id="case-categorias">
            {categorias.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
      </div>
      <div className="grid2">
        {frames.map((f, i) => (
          <FrameEditor key={i} n={i + 1} frame={f} onChange={(v) => setFrame(i, v)} />
        ))}
      </div>
      {err && <p className="err" style={{ margin: 0 }}>{err}</p>}
      <div className="modal-actions">
        <button type="button" className="linkbtn" onClick={onCancel}>
          Cancelar
        </button>
        <button type="button" className="btn" onClick={submit} disabled={pending}>
          {pending ? "Salvando…" : "Salvar case"}
        </button>
      </div>
    </div>
  );
}

function FrameEditor({ n, frame, onChange }: { n: number; frame: CaseFrame; onChange: (f: CaseFrame) => void }) {
  const isLink = frame.tipo === "link";
  return (
    <div className="row-item">
      <header>
        <span className="muted small">Quadro {n}</span>
        <span className="seg-mini" role="group" aria-label="Tipo do quadro">
          <button type="button" aria-pressed={!isLink} onClick={() => onChange({ tipo: "imagem", url: isLink ? "" : frame.url })}>
            Imagem
          </button>
          <button type="button" aria-pressed={isLink} onClick={() => onChange({ tipo: "link", url: isLink ? frame.url : "", abreLink: true })}>
            Link
          </button>
        </span>
      </header>
      {isLink ? (
        <>
          <input value={frame.url} placeholder="https://site-do-projeto.com" onChange={(e) => onChange({ ...frame, url: e.target.value, embed: undefined })} />
          <label className="toggle small">
            <input type="checkbox" checked={frame.abreLink !== false} onChange={(e) => onChange({ ...frame, abreLink: e.target.checked })} />
            <span>Clique abre o site</span>
          </label>
          {frame.embed === false && (
            <p className="small" style={{ margin: 0, color: "var(--warn)" }}>
              Esse site não permite ser exibido dentro de outra página. Envie uma capa abaixo: ela aparece no lugar do site.
            </p>
          )}
          <div className="hint" style={{ marginTop: 0 }}>
            O site aparece ao vivo no quadro. Capa (opcional): usada se o site não puder ser exibido.
          </div>
          <ImageField url={frame.capa ?? ""} onChange={(capa) => onChange({ ...frame, capa })} label="+ Capa" />
        </>
      ) : (
        <>
          <ImageField url={frame.url} onChange={(url) => onChange({ ...frame, url })} />
          <div className="hint" style={{ marginTop: 0 }}>
            Na proposta, o clique amplia a imagem.
          </div>
        </>
      )}
    </div>
  );
}
