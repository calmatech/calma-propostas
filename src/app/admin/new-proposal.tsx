"use client";

import { useState } from "react";
import { Modal } from "@/components/modal";
import { SubmitButton } from "@/components/submit-button";
import { createProposal } from "./actions";

// "Nova proposta +": pede o nome do cliente e cria com os textos padrão do modelo
export function NewProposal({ templates }: { templates: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn" onClick={() => setOpen(true)}>
        Nova proposta +
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nova proposta">
        <form action={createProposal} className="stack">
          <label className="f">
            <span>Nome do cliente</span>
            <input name="cliente" required autoFocus autoComplete="off" placeholder="Ex.: Mari Nolasco" />
          </label>
          {templates.length > 1 && (
            <label className="f">
              <span>Modelo</span>
              <select name="template">
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <p className="muted small" style={{ margin: 0 }}>
            A proposta já começa com os textos e valores padrão. Você ajusta tudo no editor.
          </p>
          <div className="modal-actions">
            <button type="button" className="linkbtn" onClick={() => setOpen(false)}>
              Cancelar
            </button>
            <SubmitButton pending="Criando…">Continuar →</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
