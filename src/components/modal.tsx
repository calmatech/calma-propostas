"use client";

import { useEffect, useRef } from "react";

// Modal acessível (dialog nativo: foco, Esc e fundo)
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className={wide ? "modal wide" : "modal"} onClose={onClose} onClick={(e) => e.target === ref.current && onClose()} aria-labelledby="modal-title">
      <div className="modal-box stack">
        <h2 id="modal-title">{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
