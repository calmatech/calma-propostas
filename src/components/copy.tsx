"use client";

import { useState } from "react";

export function Copy({ text, label }: { text: string; label?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className="copy"
      title="Clique para copiar"
      data-ok={ok ? "" : undefined}
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setOk(true);
          setTimeout(() => setOk(false), 1400);
        });
      }}
    >
      {ok ? "Copiado ✓" : (label ?? text.replace(/^https?:\/\//, ""))}
      {!ok && (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
          <path d="M10.5 5.5V3.5A1.5 1.5 0 0 0 9 2H3.5A1.5 1.5 0 0 0 2 3.5V9a1.5 1.5 0 0 0 1.5 1.5h2" />
        </svg>
      )}
    </button>
  );
}
