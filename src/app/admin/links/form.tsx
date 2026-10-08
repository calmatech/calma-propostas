"use client";

import { useActionState, useEffect, useRef } from "react";
import { createLink } from "../actions";

export function NewLinkForm() {
  const [error, action, pending] = useActionState(createLink, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!pending && !error) ref.current?.reset();
  }, [pending, error]);

  return (
    <form ref={ref} action={action} className="stack">
      <div className="grid3" style={{ gridTemplateColumns: "2fr 1fr 1fr" }}>
        <label className="f">
          <span>URL de destino</span>
          <input name="target_url" type="url" placeholder="https://…" required />
        </label>
        <label className="f">
          <span>Código (opcional)</span>
          <input name="code" placeholder="gerado automaticamente" pattern="[a-zA-Z0-9_\-]{2,64}" />
        </label>
        <label className="f">
          <span>Descrição (opcional)</span>
          <input name="label" placeholder="Para lembrar do que é" />
        </label>
      </div>
      <div className="inline" style={{ justifyContent: "flex-end" }}>
        {error && <span className="err">{error}</span>}
        <button className="btn" disabled={pending}>
          {pending ? "Criando…" : "Criar link curto"}
        </button>
      </div>
    </form>
  );
}
