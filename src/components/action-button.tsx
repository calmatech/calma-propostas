"use client";

import { useTransition } from "react";

// Botão que chama uma Server Action, com confirmação opcional.
export function ActionButton({
  action,
  confirm,
  className = "btn ghost sm",
  children,
}: {
  action: () => Promise<unknown>;
  confirm?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          await action();
        });
      }}
    >
      {children}
    </button>
  );
}
