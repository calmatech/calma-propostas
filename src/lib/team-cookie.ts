// Selo gravado no navegador de quem entra no painel (1 ano).
// Mesmo com a sessão expirada, esse aparelho não conta como acesso do cliente.
export const TEAM_COOKIE = "cp_team";
export const TEAM_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};
