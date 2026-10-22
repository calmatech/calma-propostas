"use client";

import { useState } from "react";
import { uploadImage } from "@/app/admin/actions";

// Alta qualidade para a galeria: o original vai intacto se couber no limite de envio;
// senão reduz para no máx. 3200px (telas Retina) em WebP 92%, baixando a qualidade só se precisar.
const LIMITE = 3.3 * 1024 * 1024;
const MAX_LADO = 3200;

// Versão média para os quadros da proposta (leve para o cliente); a original fica para a galeria
export async function medium(file: File, lado = 1400): Promise<File | null> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return null;
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, lado / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/webp", 0.86));
  return blob ? new File([blob], "foto-m.webp", { type: "image/webp" }) : null;
}

export async function shrink(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  const bmp = await createImageBitmap(file);
  const lado = Math.max(bmp.width, bmp.height);
  if (file.size <= LIMITE && lado <= MAX_LADO) return file; // original, sem perda
  const scale = Math.min(1, MAX_LADO / lado);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  for (const q of [0.92, 0.88, 0.84, 0.8, 0.75]) {
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/webp", q));
    if (blob && blob.size <= LIMITE) return new File([blob], "foto.webp", { type: "image/webp" });
  }
  return file;
}

export function ImageField({ url, onChange, label }: { url: string; onChange: (url: string, thumb?: string) => void; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      const up = async (f: File) => {
        const fd = new FormData();
        fd.append("file", f);
        return uploadImage(fd);
      };
      // original em alta (galeria) + versão média (quadro), enviadas juntas
      const [full, med] = await Promise.all([shrink(file).then(up), medium(file)]);
      if (!full.ok) setErr(full.error);
      else {
        const m = med ? await up(med) : null;
        onChange(full.url, m && m.ok ? m.url : undefined);
      }
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
