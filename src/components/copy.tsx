"use client";

import { useState } from "react";

export function Copy({ text, label }: { text: string; label?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className="copy"
      title="Copiar"
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setOk(true);
          setTimeout(() => setOk(false), 1400);
        });
      }}
    >
      {ok ? "Copiado ✓" : (label ?? text.replace(/^https?:\/\//, ""))}
    </button>
  );
}
