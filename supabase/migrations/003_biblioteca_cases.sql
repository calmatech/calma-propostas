-- 003 · Biblioteca de cases (reutilizáveis entre propostas)
-- Rode no Supabase: SQL Editor → New query → cole tudo → Run. Pode rodar mais de uma vez.

create table if not exists public.cases (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  categoria  text not null default '',
  -- 2 quadros: [{ "tipo": "imagem"|"link", "url": "...", "capa": "...", "abreLink": true, "embed": true|false|null }]
  frames     jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cases_categoria_idx on public.cases (categoria, nome);

drop trigger if exists cases_touch on public.cases;
create trigger cases_touch before update on public.cases
for each row execute function public.touch_updated_at();

alter table public.cases enable row level security;
drop policy if exists "team all" on public.cases;
create policy "team all" on public.cases for all to authenticated using (true) with check (true);
