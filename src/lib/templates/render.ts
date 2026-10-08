import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { TEMPLATES, isTemplateId } from ".";

type RenderInput = {
  slug: string;
  template: string;
  data: Record<string, unknown>;
  approvedAt: string | null;
  approvedName: string | null;
  preview: boolean;
};

const cache = new Map<string, string>();

async function load(file: string) {
  if (process.env.NODE_ENV === "production" && cache.has(file)) return cache.get(file)!;
  const html = await readFile(path.join(process.cwd(), "templates", file), "utf8");
  cache.set(file, html);
  return html;
}

// JSON seguro para colocar dentro de <script>
const safeJson = (v: unknown) =>
  JSON.stringify(v).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function formatDateLong(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export async function renderProposal(input: RenderInput) {
  const id = isTemplateId(input.template) ? input.template : "calma-v1";
  const tpl = TEMPLATES[id];
  const data: Record<string, unknown> = { ...tpl.defaults, ...input.data };
  if (typeof data.validade === "string") data.validade = formatDateLong(data.validade);

  const cliente = String(data.cliente ?? "");
  const title = `Proposta para ${cliente} | Estúdio Calma`;
  const head = [
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(String(data.projeto ?? ""))}">`,
    `<meta property="og:site_name" content="Estúdio Calma">`,
    `<meta property="og:type" content="website">`,
  ].join("\n");

  const cfg = {
    slug: input.slug,
    preview: input.preview,
    approvedAt: input.approvedAt,
    approvedName: input.approvedName,
    contato: String(data.contato ?? ""),
  };

  const html = await load(tpl.file);
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace("<!--__HEAD__-->", head)
    .replace("/*__DATA__*/{}", safeJson(data))
    .replace("<!--__RUNTIME__-->", `<script>window.__CP__=${safeJson(cfg)};</script>\n<script src="/proposta-runtime.js" defer></script>`);
}
