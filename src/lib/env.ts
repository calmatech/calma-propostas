const req = (name: string, v: string | undefined) => {
  if (!v) throw new Error(`Variável de ambiente ausente: ${name}`);
  return v;
};

// Aceita a URL colada com /rest/v1 ou /auth/v1 no final
export const normalizeSupabaseUrl = (v: string) => v.trim().replace(/\/+$/, "").replace(/\/(rest|auth)\/v1$/, "");

export const env = {
  supabaseUrl: () => normalizeSupabaseUrl(req("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL)),
  supabaseKey: () => req("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  supabaseSecret: () => req("SUPABASE_SECRET_KEY", process.env.SUPABASE_SECRET_KEY),
  siteUrl: () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  shortUrl: () => (process.env.NEXT_PUBLIC_SHORT_URL || "http://localhost:3000/l").replace(/\/$/, ""),
};

// Hosts que respondem como encurtador (ex.: s.tudio.cc)
export const shortHosts = () =>
  (process.env.SHORT_HOSTS || "s.tudio.cc").split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
