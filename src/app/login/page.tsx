import { Logo } from "@/components/logo";
import { LoginForm } from "./form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <div className="login">
      <div className="card stack">
        <div>
          <h1 style={{ fontSize: 40, display: "flex", alignItems: "baseline", gap: 12 }}>
            <Logo height={30} />
            <em>propostas</em>
          </h1>
          <p className="muted small" style={{ margin: "8px 0 0" }}>Acesso restrito à equipe.</p>
        </div>
        <LoginForm next={typeof next === "string" ? next : "/admin"} />
      </div>
    </div>
  );
}
