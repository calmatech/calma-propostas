"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Barra fina no topo que aparece no instante do clique em qualquer link interno
// e some quando a nova página chega. Feedback imediato mesmo com o servidor longe.
export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [active, setActive] = useState(false);

  useEffect(() => setActive(false), [pathname, search]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    // fase de "bolha": se o editor barrar a saída (modal), o evento nem chega aqui
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
      setActive(true);
      clearTimeout(timer);
      timer = setTimeout(() => setActive(false), 15000);
    };
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      clearTimeout(timer);
    };
  }, []);

  return active ? <div className="nav-progress" role="progressbar" aria-label="Carregando" /> : null;
}
