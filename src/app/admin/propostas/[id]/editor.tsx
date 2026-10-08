"use client";

import { useEffect, useState, useTransition } from "react";
import type { CalmaV1 } from "@/lib/templates/calma-v1";
import { saveProposal } from "../../actions";

type Data = Record<string, unknown>;

const lines = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);

export function Editor({ id, template, initial }: { id: string; template: string; initial: Data }) {
  const [data, setData] = useState<Data>(initial);
  const [saved, setSaved] = useState<Data>(initial);
  const [mode, setMode] = useState<"form" | "json">(template === "calma-v1" ? "form" : "json");
  const [json, setJson] = useState(() => JSON.stringify(initial, null, 2));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(data) !== JSON.stringify(saved);

  const save = () => {
    let payload = data;
    if (mode === "json") {
      try {
        payload = JSON.parse(json);
        setData(payload);
      } catch {
        setMsg({ ok: false, text: "JSON inválido." });
        return;
      }
    }
    start(async () => {
      const r = await saveProposal(id, payload);
      if (r.ok) {
        setSaved(payload);
        setMsg({ ok: true, text: "Salvo ✓" });
      } else setMsg({ ok: false, text: r.error });
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    };
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    addEventListener("keydown", onKey);
    addEventListener("beforeunload", onLeave);
    return () => {
      removeEventListener("keydown", onKey);
      removeEventListener("beforeunload", onLeave);
    };
  });

  return (
    <div>
      <div className="tabs">
        {template === "calma-v1" && (
          <a href="#" aria-current={mode === "form" ? "page" : undefined} onClick={(e) => { e.preventDefault(); if (mode === "json") { try { setData(JSON.parse(json)); } catch {} } setMode("form"); }}>
            Formulário
          </a>
        )}
        <a href="#" aria-current={mode === "json" ? "page" : undefined} onClick={(e) => { e.preventDefault(); setJson(JSON.stringify(data, null, 2)); setMode("json"); }}>
          Avançado (JSON)
        </a>
      </div>

      {mode === "form" ? (
        <CalmaForm d={data as unknown as CalmaV1} set={(patch) => { setData((x) => ({ ...x, ...patch })); setMsg(null); }} />
      ) : (
        <div className="card">
          <textarea value={json} onChange={(e) => { setJson(e.target.value); setMsg(null); }} spellCheck={false} style={{ minHeight: 560, font: "13px/1.5 ui-monospace, Menlo, monospace" }} />
        </div>
      )}

      <div className="savebar">
        {msg && <span className={msg.ok ? "muted small" : "err"}>{msg.text}</span>}
        {dirty && !msg && <span className="muted small">Alterações não salvas</span>}
        <button className="btn" onClick={save} disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="f">
      <span>{label}</span>
      {children}
      {hint && <div className="hint">{hint}</div>}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card stack" style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 24 }}>{title}</h2>
      {children}
    </section>
  );
}

// textarea "um por linha" que mantém o texto enquanto digita
function LinesInput({ value, onChange, rows = 4 }: { value: string[]; onChange: (v: string[]) => void; rows?: number }) {
  const [text, setText] = useState(value.join("\n"));
  // valor mudou por fora (ex.: reordenar) → sincroniza
  if (lines(text).join("\n") !== value.join("\n")) setText(value.join("\n"));
  return (
    <textarea
      rows={rows}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(lines(e.target.value));
      }}
    />
  );
}

function Rows<T>({ items, onChange, empty, render, title }: { items: T[]; onChange: (v: T[]) => void; empty: T; render: (item: T, set: (v: T) => void) => React.ReactNode; title: (i: number) => string }) {
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const n = [...items];
    [n[i], n[j]] = [n[j], n[i]];
    onChange(n);
  };
  return (
    <div className="stack">
      {items.map((it, i) => (
        <div className="row-item" key={i}>
          <header>
            <span className="muted small">{title(i)}</span>
            <span className="inline">
              <button type="button" className="linkbtn small" onClick={() => move(i, -1)} aria-label="Subir">↑</button>
              <button type="button" className="linkbtn small" onClick={() => move(i, 1)} aria-label="Descer">↓</button>
              <button type="button" className="linkbtn small" onClick={() => onChange(items.filter((_, k) => k !== i))}>Remover</button>
            </span>
          </header>
          {render(it, (v) => onChange(items.map((x, k) => (k === i ? v : x))))}
        </div>
      ))}
      <div>
        <button type="button" className="btn ghost sm" onClick={() => onChange([...items, structuredClone(empty)])}>
          + Adicionar
        </button>
      </div>
    </div>
  );
}

function CalmaForm({ d, set }: { d: CalmaV1; set: (p: Partial<CalmaV1>) => void }) {
  const num = (v: string) => (v === "" ? 0 : Number(v.replace(",", ".")));
  return (
    <div>
      <Section title="Cliente e projeto">
        <div className="grid2">
          <Field label="Nome do cliente" hint="Aparece em “Olá, Nome,”">
            <input value={d.cliente} onChange={(e) => set({ cliente: e.target.value })} />
          </Field>
          <Field label="Validade da proposta">
            <input type="date" value={/^\d{4}-\d{2}-\d{2}$/.test(d.validade) ? d.validade : ""} onChange={(e) => set({ validade: e.target.value })} />
          </Field>
        </div>
        <div className="grid2">
          <Field label="Projeto (etiqueta do topo)">
            <input value={d.projeto} onChange={(e) => set({ projeto: e.target.value })} />
          </Field>
          <Field label="Projeto em minúsculas" hint="“Valor total da …”">
            <input value={d.projetoMin} onChange={(e) => set({ projetoMin: e.target.value })} />
          </Field>
        </div>
        <Field label="Subtítulo do topo">
          <textarea rows={2} value={d.subtitulo} onChange={(e) => set({ subtitulo: e.target.value })} />
        </Field>
        <Field label="Faixa rolante" hint="Um item por linha">
          <LinesInput rows={3} value={d.ticker ?? []} onChange={(ticker) => set({ ticker })} />
        </Field>
        <Field label="Contato (opcional)" hint="Link de WhatsApp ou e-mail mostrado depois que o cliente aprova. Ex.: https://wa.me/5511…">
          <input value={d.contato} onChange={(e) => set({ contato: e.target.value })} placeholder="https://wa.me/55…" />
        </Field>
      </Section>

      <Section title="O que vamos entregar">
        <Field label="Descrição">
          <textarea rows={4} value={d.descricao} onChange={(e) => set({ descricao: e.target.value })} />
        </Field>
        <Rows
          items={d.grupos}
          onChange={(grupos) => set({ grupos })}
          empty={["", []] as [string, string[]]}
          title={(i) => `Entrega ${String(i + 1).padStart(2, "0")}`}
          render={(g, up) => (
            <>
              <input value={g[0]} placeholder="Título" onChange={(e) => up([e.target.value, g[1]])} />
              <LinesInput value={g[1]} onChange={(v) => up([g[0], v])} />
              <div className="hint">Um item por linha</div>
            </>
          )}
        />
        <Field label="Fica de fora" hint="Um item por linha">
          <LinesInput value={d.naoInclui} onChange={(naoInclui) => set({ naoInclui })} />
        </Field>
      </Section>

      <Section title="Etapas e prazo">
        <Rows
          items={d.etapas}
          onChange={(etapas) => set({ etapas })}
          empty={["", ""] as [string, string]}
          title={(i) => `Passo ${i + 1}`}
          render={(s, up) => (
            <div className="grid2">
              <input value={s[0]} placeholder="Nome" onChange={(e) => up([e.target.value, s[1]])} />
              <input value={s[1]} placeholder="Descrição" onChange={(e) => up([s[0], e.target.value])} />
            </div>
          )}
        />
        <div className="grid2">
          <Field label="Prazo estimado">
            <input value={d.prazo} onChange={(e) => set({ prazo: e.target.value })} />
          </Field>
          <Field label="Início">
            <input value={d.inicio} onChange={(e) => set({ inicio: e.target.value })} />
          </Field>
        </div>
      </Section>

      <Section title="Investimento">
        <div className="grid2">
          <Field label="Valor total (R$)">
            <input inputMode="decimal" value={String(d.valor)} onChange={(e) => set({ valor: num(e.target.value) })} />
          </Field>
          <Field label="Domínio (R$ / ano)">
            <input inputMode="decimal" value={String(d.dominio)} onChange={(e) => set({ dominio: num(e.target.value) })} />
          </Field>
        </div>
        <div className="grid2">
          <Field label="Parcelas sem juros">
            <input type="number" min={1} value={d.parcelasSemJuros} onChange={(e) => set({ parcelasSemJuros: num(e.target.value) || 1 })} />
          </Field>
          <Field label="Máximo de parcelas no cartão">
            <input type="number" min={1} value={d.parcelasMax} onChange={(e) => set({ parcelasMax: num(e.target.value) || 1 })} />
          </Field>
        </div>
      </Section>

      <Section title="Planos Calma Cloud">
        <Rows
          items={d.planos}
          onChange={(planos) => set({ planos })}
          empty={["", 0, ""] as [string, number, string]}
          title={(i) => `Plano ${i + 1}`}
          render={(pl, up) => (
            <div className="grid3">
              <input value={pl[0]} placeholder="Nome" onChange={(e) => up([e.target.value, pl[1], pl[2]])} />
              <input inputMode="decimal" value={String(pl[1])} placeholder="R$ / mês" onChange={(e) => up([pl[0], num(e.target.value), pl[2]])} />
              <input value={pl[2]} placeholder="Descrição" onChange={(e) => up([pl[0], pl[1], e.target.value])} />
            </div>
          )}
        />
      </Section>
    </div>
  );
}
