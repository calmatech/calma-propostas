import { cookies } from "next/headers";
import { getUser } from "@/lib/supabase/server";
import { TEAM_COOKIE } from "@/lib/team-cookie";

// Acesso da equipe: logado no painel ou aparelho com o selo de equipe
export async function isTeam() {
  const jar = await cookies();
  if (jar.get(TEAM_COOKIE)) return true;
  return Boolean(await getUser().catch(() => null));
}
