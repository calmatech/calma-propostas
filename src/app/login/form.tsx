"use client";

import { useActionState } from "react";
import { signIn } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [error, action, pending] = useActionState(signIn, null);
  return (
    <form action={action} className="stack">
      <input type="hidden" name="next" value={next} />
      <label className="f">
        <span>E-mail</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label className="f">
        <span>Senha</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {error && <p className="err">{error}</p>}
      <button className="btn" disabled={pending} style={{ width: "100%", justifyContent: "center" }}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
