"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(_prev: string | null, form: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email") ?? ""),
    password: String(form.get("password") ?? ""),
  });
  if (error) {
    if (error.code === "invalid_credentials") return "E-mail ou senha inválidos.";
    if (error.code === "email_not_confirmed") return "E-mail ainda não confirmado no Supabase.";
    console.error("login", error);
    return `Erro ao entrar: ${error.message}`;
  }
  const next = String(form.get("next") ?? "");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
