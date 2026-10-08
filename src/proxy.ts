import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env, shortHosts } from "@/lib/env";
import { TEAM_COOKIE, TEAM_COOKIE_OPTIONS } from "@/lib/team-cookie";

export async function proxy(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].toLowerCase();
  const { pathname } = req.nextUrl;

  // s.tudio.cc/abc12 → /l/abc12
  if (shortHosts().includes(host)) {
    if (pathname === "/robots.txt") return NextResponse.next();
    const code = pathname.slice(1);
    if (!code || code.includes("/")) return NextResponse.redirect("https://estudiocalma.com.br", 302);
    return NextResponse.rewrite(new URL(`/l/${code}`, req.url));
  }

  // Só o painel e o login precisam de sessão aqui
  if (!pathname.startsWith("/admin") && pathname !== "/login") return NextResponse.next();

  // Renova o token quando preciso e protege o painel.
  // getClaims valida o JWT localmente (sem ida à rede na maioria dos cliques).
  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(env.supabaseUrl(), env.supabaseKey(), {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getClaims();
  const loggedIn = Boolean(data?.claims?.sub);

  if (pathname.startsWith("/admin") && !loggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  if (pathname === "/login" && loggedIn) {
    const r = NextResponse.redirect(new URL("/admin", req.url));
    r.cookies.set(TEAM_COOKIE, "1", TEAM_COOKIE_OPTIONS);
    return r;
  }
  if (loggedIn && !req.cookies.get(TEAM_COOKIE)) res.cookies.set(TEAM_COOKIE, "1", TEAM_COOKIE_OPTIONS);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|assets/|favicon.ico|proposta-runtime.js|api/).*)"],
};
