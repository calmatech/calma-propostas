"use client";

import { useState, useTransition } from "react";
import { ImageField, shrink } from "@/components/image-field";
import { emptyFrame, type CaseFrame, type CaseItem } from "@/lib/cases";
import { saveCase, uploadImage } from "@/app/admin/actions";

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
        {frames.slice(0, 2).map((f, i) => (
          <FrameEditor key={i} n={i + 1} frame={f} onChange={(v) => setFrame(i, v)} />
        ))}
      </div>
      <Extras
        urls={frames.slice(2).map((f) => f.url)}
        onChange={(urls) => setFrames((x) => [...x.slice(0, 2), ...urls.map((url) => ({ tipo: "imagem" as const, url }))])}
      />
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
          <button type="button" aria-pressed={!isLink} onClick={() => onChange(isLink ? { tipo: "imagem", url: "" } : frame)}>
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
          <ImageField url={frame.capa ?? ""} onChange={(capa, thumb) => onChange({ ...frame, capa: thumb || capa })} label="+ Capa" />
        </>
      ) : (
        <>
          <ImageField url={frame.thumb || frame.url} onChange={(url, thumb) => onChange({ ...frame, url, thumb })} />
          <div className="hint" style={{ marginTop: 0 }}>
            Na proposta, o clique amplia a imagem.
          </div>
        </>
      )}
    </div>
  );
}

// Fotos extras: não aparecem nos quadros, só na galeria do projeto
function Extras({ urls, onChange }: { urls: string[]; onChange: (urls: string[]) => void }) {
  const [busy, setBusy] = useState(0);
  const [err, setErr] = useState("");
  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setErr("");
    const list = [...files];
    setBusy(list.length);
    const out: string[] = [];
    for (const file of list) {
      try {
        const fd = new FormData();
        fd.append("file", await shrink(file));
        const r = await uploadImage(fd);
        if (r.ok) out.push(r.url);
        else setErr(r.error);
      } catch {
        setErr("Não foi possível enviar uma das imagens.");
      }
      setBusy((n) => n - 1);
    }
    onChange([...urls, ...out]);
  };
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= urls.length) return;
    const n = [...urls];
    [n[i], n[j]] = [n[j], n[i]];
    onChange(n);
  };
  return (
    <div className="row-item">
      <header>
        <span className="muted small">Fotos extras · só na galeria (o clique num quadro de imagem abre todas)</span>
        <label className="btn ghost sm" style={{ cursor: busy ? "progress" : "pointer" }}>
          {busy ? `Enviando ${busy}…` : "+ Adicionar fotos"}
          <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,image/gif" hidden disabled={!!busy} onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
        </label>
      </header>
      {urls.length > 0 && (
        <div className="extras">
          {urls.map((u, i) => (
            <div key={u + i} className="extra">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" />
              <span className="extra-actions">
                <button type="button" onClick={() => move(i, -1)} aria-label="Mover para a esquerda">←</button>
                <button type="button" onClick={() => move(i, 1)} aria-label="Mover para a direita">→</button>
                <button type="button" onClick={() => onChange(urls.filter((_, k) => k !== i))} aria-label="Remover">×</button>
              </span>
            </div>
          ))}
        </div>
      )}
      {err && <span className="err small">{err}</span>}
    </div>
  );
}
