import type { CaseFrame } from "@/lib/cases";

// Miniatura de um quadro do case no painel (imagem, capa ou o endereço do site)
export function CaseThumb({ frame }: { frame: CaseFrame }) {
  const img = frame.tipo === "imagem" ? frame.thumb || frame.url : frame.capa;
  let host = "";
  try {
    host = frame.tipo === "link" && frame.url ? new URL(frame.url).host.replace(/^www\./, "") : "";
  } catch {}
  return (
    <span className="case-mini" data-warn={frame.tipo === "link" && frame.embed === false && !frame.capa ? "" : undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {img ? <img src={img} alt="" /> : <span>{host ? `↗ ${host}` : "—"}</span>}
    </span>
  );
}
