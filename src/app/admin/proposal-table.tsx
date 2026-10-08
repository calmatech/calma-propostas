"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fmtDate, fmtMoney, publicUrl, shortLink, statusOf, timeAgo, type ProposalRow } from "@/lib/proposals";
import { Copy } from "@/components/copy";
import { ProposalInsights, type ProposalEvent } from "@/components/proposal-insights";

// ?p=<id> abre a gaveta. Usa history nativo (sem ida ao servidor); o voltar do navegador fecha.
function setDrawerParam(id: string | null) {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set("p", id);
  else url.searchParams.delete("p");
  if (id && !new URL(window.location.href).searchParams.get("p")) window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
}

export function ProposalTable({ list, all }: { list: ProposalRow[]; all: ProposalRow[] }) {
  const openId = useSearchParams().get("p");
  const open = all.find((p) => p.id === openId) ?? null;

  return (
    <>
      <div className="tablewrap">
        <table className="table">
          <thead>
            <tr>
              <th>Proposta</th>
              <th>Status</th>
              <th className="hide-sm">Acessos</th>
              <th className="hide-sm">Último acesso</th>
              <th className="hide-sm">Valor</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const st = statusOf(p);
              const link = p.links?.[0];
              return (
                <tr
                  key={p.id}
                  className="clickable"
                  aria-selected={p.id === openId}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("button, a")) return;
                    setDrawerParam(p.id);
                  }}
                >
                  <td>
                    <button type="button" className="rowbtn" onClick={() => setDrawerParam(p.id)}>
                      {p.client_name || "Sem nome"}
                    </button>
                    <div className="muted small">
                      {String(p.data?.projeto ?? "")} · criada {timeAgo(p.created_at)}
                    </div>
                  </td>
                  <td>
                    <span className={`pill ${st.tone}`}>{st.label}</span>
                    {p.approved_at && <div className="muted small">{timeAgo(p.approved_at)}</div>}
                  </td>
                  <td className="hide-sm">{p.view_count}</td>
                  <td className="hide-sm muted">{timeAgo(p.last_viewed_at)}</td>
                  <td className="hide-sm">{fmtMoney(p.data?.valor)}</td>
                  <td>{link ? <Copy text={shortLink(link.code)} /> : <span className="muted">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {open && <Drawer p={open} onClose={() => setDrawerParam(null)} />}
    </>
  );
}

// eventos já carregados ficam em memória: reabrir é instantâneo e atualiza em segundo plano
const eventsCache = new Map<string, ProposalEvent[]>();

function Drawer({ p, onClose }: { p: ProposalRow; onClose: () => void }) {
  const [events, setEvents] = useState<ProposalEvent[] | null>(() => eventsCache.get(p.id) ?? null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(async () => {
    const r = await fetch(`/api/admin/proposals/${p.id}/events`, { cache: "no-store" });
    if (!r.ok) return;
    const data = (await r.json()) as ProposalEvent[];
    eventsCache.set(p.id, data);
    setEvents(data);
  }, [p.id]);

  useEffect(() => {
    setEvents(eventsCache.get(p.id) ?? null);
    load();
  }, [p.id, load]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <header>
          <div style={{ minWidth: 0 }}>
            <h2 id="drawer-title">{p.client_name || "Sem nome"}</h2>
            <p className="muted small" style={{ margin: "4px 0 0" }}>
              {String(p.data?.projeto ?? "")} · criada em {fmtDate(p.created_at, false)}
            </p>
          </div>
          <button ref={closeRef} type="button" className="drawer-close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </header>
        <div className="drawer-actions">
          <Link className="btn sm" href={`/admin/propostas/${p.id}`}>
            Editar
          </Link>
          <a className="btn ghost sm" href={publicUrl(p.slug)} target="_blank" rel="noreferrer">
            Ver proposta ↗
          </a>
        </div>
        <div className="drawer-body stack">
          <ProposalInsights p={p} events={events} />
        </div>
      </aside>
    </>
  );
}
