"use client";

import { useState } from "react";
import { uploadImage } from "@/app/admin/actions";

// Reduz a imagem no navegador (máx. 1600px, WebP) e envia para o Storage
async function shrink(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/webp", 0.82));
  return blob && blob.size < file.size ? new File([blob], "case.webp", { type: "image/webp" }) : file;
}

export function ImageField({ url, onChange, label }: { url: string; onChange: (url: string) => void; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("file", await shrink(file));
      const r = await uploadImage(fd);
      if (r.ok) onChange(r.url);
      else setErr(r.error);
    } catch {
      setErr("Não foi possível enviar a imagem.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="case-img">
      <label className="case-thumb" data-busy={busy ? "" : undefined} title="Clique ou arraste uma imagem"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url ? <img src={url} alt="" /> : <span>{busy ? "Enviando…" : label ?? "+ Imagem"}</span>}
        {busy && url && <span className="case-busy">Enviando…</span>}
        <input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" hidden onChange={(e) => pick(e.target.files?.[0])} />
      </label>
      {url && (
        <button type="button" className="linkbtn small" onClick={() => onChange("")}>
          Remover imagem
        </button>
      )}
      {err && <span className="err small">{err}</span>}
    </div>
  );
}
