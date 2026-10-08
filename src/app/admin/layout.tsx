import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { Logo } from "@/components/logo";
import { Nav } from "./nav";
import { RefreshOnFocus } from "./refresh-on-focus";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getUser();
  if (!user) redirect("/login");
  return (
    <>
      <header className="top">
        <div className="wrap">
          <Link href="/admin" className="logo" aria-label="Calma propostas, início">
            <Logo height={17} />
            <b>propostas</b>
          </Link>
          <Nav />
          <form action={signOut} className="inline">
            <span className="muted small hide-sm">{user.email}</span>
            <button className="linkbtn small">Sair</button>
          </form>
        </div>
      </header>
      <main className="wrap">{children}</main>
      <RefreshOnFocus />
    </>
  );
}
