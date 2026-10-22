"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { newShortCode, newSlug } from "@/lib/ids";
import { TEMPLATES, isTemplateId } from "@/lib/templates";

async function session() {
  const [supabase, user] = await Promise.all([createClient(), getUser()]);
  if (!user) redirect("/login");
  return { supabase, user };
}

type Supa = Awaited<ReturnType<typeof session>>["supabase"];

async function createShortLink(
  supabase: Supa,
  values: { proposal_id?: string; target_url?: string; label: string; created_by: string },
  code?: string,
) {
  for (let i = 0; i < 6; i++) {
    const c = code || newShortCode(i < 3 ? 5 : 6);
    const { error } = await supabase.from("links").insert({ code: c, ...values });
    if (!error) return { code: c };
    if (code || error.code !== "23505") return { error: error.code === "23505" ? "Esse código já existe." : error.message };
  }
  return { error: "Não foi possível gerar um código." };
}

const titleOf = (d: Record<string, unknown>) =>
  [d.cliente, d.projeto].filter((v) => typeof v === "string" && v.trim()).join(" · ") || "Sem título";

export async function createProposal(form: FormData) {
  const { supabase, user } = await session();
  const template = String(form.get("template") || "calma-v1");
  if (!isTemplateId(template)) throw new Error("Modelo inválido");
  const cliente = String(form.get("cliente") || "").trim() || "[Nome]";

  const in15 = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);
  const data = { ...TEMPLATES[template].defaults, cliente, validade: in15 };

  const { data: row, error } = await supabase
    .from("proposals")
    .insert({ slug: newSlug(), template, data, client_name: cliente, title: titleOf(data), created_by: user.id })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await createShortLink(supabase, { proposal_id: row.id, label: titleOf(data), created_by: user.id });
  revalidatePath("/admin");
  redirect(`/admin/propostas/${row.id}`);
}

export async function saveProposal(id: string, data: Record<string, unknown>) {
  const { supabase } = await session();
  const [{ error }] = await Promise.all([
    supabase.from("proposals").update({ data, client_name: String(data.cliente ?? ""), title: titleOf(data) }).eq("id", id),
    supabase.from("links").update({ label: titleOf(data) }).eq("proposal_id", id),
  ]);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin");
  revalidatePath(`/admin/propostas/${id}`);
  return { ok: true as const, savedAt: new Date().toISOString() };
}

export async function duplicateProposal(id: string) {
  const { supabase, user } = await session();
  const { data: src } = await supabase.from("proposals").select("template, data").eq("id", id).single();
  if (!src) throw new Error("Proposta não encontrada");
  const data = { ...src.data, cliente: `${src.data?.cliente ?? ""} (cópia)` };
  const { data: row, error } = await supabase
    .from("proposals")
    .insert({ slug: newSlug(), template: src.template, data, client_name: data.cliente, title: titleOf(data), created_by: user.id })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await createShortLink(supabase, { proposal_id: row.id, label: titleOf(data), created_by: user.id });
  revalidatePath("/admin");
  redirect(`/admin/propostas/${row.id}`);
}

export async function setArchived(id: string, archived: boolean) {
  const { supabase } = await session();
  await supabase.from("proposals").update({ archived }).eq("id", id);
  revalidatePath("/admin");
  revalidatePath(`/admin/propostas/${id}`);
}

export async function resetApproval(id: string) {
  const { supabase } = await session();
  await supabase.from("proposals").update({ approved_at: null, approved_name: null, approved_note: null }).eq("id", id);
  await supabase.from("proposal_events").insert({ proposal_id: id, type: "unapprove" });
  revalidatePath("/admin");
  revalidatePath(`/admin/propostas/${id}`);
}

export async function deleteProposal(id: string) {
  const { supabase } = await session();
  await supabase.from("proposals").delete().eq("id", id);
  revalidatePath("/admin");
  redirect("/admin");
}

export async function addProposalLink(id: string) {
  const { supabase, user } = await session();
  const { data: p } = await supabase.from("proposals").select("title").eq("id", id).single();
  await createShortLink(supabase, { proposal_id: id, label: p?.title ?? "", created_by: user.id });
  revalidatePath("/admin");
  revalidatePath(`/admin/propostas/${id}`);
}

export async function createLink(_prev: string | null, form: FormData) {
  const { supabase, user } = await session();
  const target = String(form.get("target_url") || "").trim();
  const code = String(form.get("code") || "").trim();
  const label = String(form.get("label") || "").trim();
  if (!/^https?:\/\/\S+$/.test(target)) return "Informe uma URL completa (https://…).";
  if (code && !/^[a-zA-Z0-9_-]{2,64}$/.test(code)) return "Código: letras, números, - e _ (2 a 64).";
  const res = await createShortLink(supabase, { target_url: target, label, created_by: user.id }, code || undefined);
  if (res.error) return res.error;
  revalidatePath("/admin/links");
  return null;
}

export async function deleteLink(code: string) {
  const { supabase } = await session();
  await supabase.from("links").delete().eq("code", code);
  revalidatePath("/admin/links");
  revalidatePath("/admin");
}

// Imagens dos cases: guardadas no Storage do Supabase (bucket público "propostas").
// O navegador já reduz a imagem antes do envio (ver editor), então o arquivo chega leve.
const BUCKET = "propostas";
const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "image/gif": "gif" };

export async function uploadImage(form: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await session();
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return { ok: false, error: "Nenhum arquivo enviado." };
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return { ok: false, error: "Use uma imagem JPG, PNG, WebP, AVIF ou GIF." };
  if (file.size > 3.5 * 1024 * 1024) return { ok: false, error: "Imagem muito grande (máx. 3,5 MB)." };

  const db = adminClient();
  const path = `cases/${crypto.randomUUID()}.${ext}`;
  const put = () => db.storage.from(BUCKET).upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  let { error } = await put();
  if (error && /bucket not found/i.test(error.message)) {
    await db.storage.createBucket(BUCKET, { public: true });
    ({ error } = await put());
  }
  if (error) return { ok: false, error: error.message };
  return { ok: true, url: db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
}
