"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Ao voltar para a aba, busca dados novos (acessos/aprovações) sem recarregar a página.
export function RefreshOnFocus({ minInterval = 30_000 }: { minInterval?: number }) {
  const router = useRouter();
  const last = useRef(0);
  useEffect(() => {
    const on = () => {
      if (document.visibilityState !== "visible" || Date.now() - last.current < minInterval) return;
      last.current = Date.now();
      router.refresh();
    };
    last.current = Date.now();
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, [router, minInterval]);
  return null;
}
