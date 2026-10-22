// Aplica as migrações de supabase/migrations/ que ainda não rodaram.
// Uso: pnpm db:migrate   (precisa de SUPABASE_DB_URL no .env.local — Supabase → Connect → Session pooler)
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import pg from "pg";

for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("Falta SUPABASE_DB_URL no .env.local (Supabase → Connect → Session pooler).");
  process.exit(1);
}

const dir = "supabase/migrations";
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
await client.query("create table if not exists public._migrations (name text primary key, applied_at timestamptz not null default now())");
const done = new Set((await client.query("select name from public._migrations")).rows.map((r) => r.name));

let applied = 0;
for (const f of files) {
  if (done.has(f)) continue;
  process.stdout.write(`→ ${f} … `);
  try {
    await client.query("begin");
    await client.query(readFileSync(path.join(dir, f), "utf8"));
    await client.query("insert into public._migrations (name) values ($1)", [f]);
    await client.query("commit");
    console.log("ok");
    applied++;
  } catch (e) {
    await client.query("rollback");
    console.log("ERRO");
    console.error(e.message);
    await client.end();
    process.exit(1);
  }
}
console.log(applied ? `${applied} migração(ões) aplicada(s).` : "Banco já está atualizado.");
await client.end();
