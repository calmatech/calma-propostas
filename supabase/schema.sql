-- Calma Propostas: schema
-- Rode no Supabase: SQL Editor → New query → cole tudo → Run.

create extension if not exists pgcrypto;

-- Propostas -------------------------------------------------------------
create table if not exists public.proposals (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,                 -- id público, longo e difícil de adivinhar
  title           text not null,                        -- nome interno
  client_name     text not null default '',
  template        text not null default 'calma-v1',
  data            jsonb not null default '{}'::jsonb,   -- conteúdo editável do modelo
  archived        boolean not null default false,
  view_count      integer not null default 0,
  first_viewed_at timestamptz,
  last_viewed_at  timestamptz,
  approved_at     timestamptz,
  approved_name   text,
  approved_note   text,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists proposals_created_at_idx on public.proposals (created_at desc);

-- Links curtos ----------------------------------------------------------
create table if not exists public.links (
  code        text primary key check (code ~ '^[a-zA-Z0-9_-]{2,64}$'),
  target_url  text,                                      -- para links avulsos
  proposal_id uuid references public.proposals(id) on delete cascade, -- para propostas
  label       text not null default '',
  clicks      integer not null default 0,
  last_click_at timestamptz,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  check (target_url is not null or proposal_id is not null)
);

create index if not exists links_proposal_idx on public.links (proposal_id);

-- Eventos (visualização, clique no link curto, aprovação) ----------------
create table if not exists public.proposal_events (
  id          bigint generated always as identity primary key,
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  type        text not null check (type in ('view', 'link_click', 'approve', 'unapprove')),
  session_id  text,
  user_agent  text,
  referrer    text,
  country     text,
  city        text,
  created_at  timestamptz not null default now()
);

create index if not exists proposal_events_proposal_idx on public.proposal_events (proposal_id, created_at desc);

-- updated_at automático
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists proposals_touch on public.proposals;
create trigger proposals_touch before update on public.proposals
for each row execute function public.touch_updated_at();

-- RLS: só usuários logados (vocês) leem/escrevem pelo painel.
-- As páginas públicas usam a service key no servidor, nunca no navegador.
alter table public.proposals       enable row level security;
alter table public.links           enable row level security;
alter table public.proposal_events enable row level security;

drop policy if exists "team all" on public.proposals;
create policy "team all" on public.proposals for all to authenticated using (true) with check (true);
drop policy if exists "team all" on public.links;
create policy "team all" on public.links for all to authenticated using (true) with check (true);
drop policy if exists "team read" on public.proposal_events;
create policy "team read" on public.proposal_events for select to authenticated using (true);
drop policy if exists "team write" on public.proposal_events;
create policy "team write" on public.proposal_events for insert to authenticated with check (true);

-- Funções atômicas usadas pelo servidor (service role) ------------------
create or replace function public.track_view(p_slug text, p_session text, p_ua text, p_ref text, p_country text, p_city text)
returns void language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  update proposals set
    view_count = view_count + 1,
    first_viewed_at = coalesce(first_viewed_at, now()),
    last_viewed_at = now()
  where slug = p_slug and not archived
  returning id into pid;
  if pid is not null then
    insert into proposal_events (proposal_id, type, session_id, user_agent, referrer, country, city)
    values (pid, 'view', p_session, left(p_ua, 400), left(p_ref, 400), p_country, p_city);
  end if;
end $$;

create or replace function public.approve_proposal(p_slug text, p_name text, p_note text, p_session text, p_ua text)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare pid uuid; ts timestamptz;
begin
  select id, approved_at into pid, ts from proposals where slug = p_slug and not archived for update;
  if pid is null then return null; end if;
  if ts is not null then return ts; end if;  -- já aprovada
  update proposals set approved_at = now(), approved_name = left(p_name, 200), approved_note = left(p_note, 2000)
  where id = pid returning approved_at into ts;
  insert into proposal_events (proposal_id, type, session_id, user_agent)
  values (pid, 'approve', p_session, left(p_ua, 400));
  return ts;
end $$;

create or replace function public.hit_link(p_code text, p_ua text, p_ref text, p_country text, p_city text, p_is_bot boolean)
returns table (target_url text, proposal_slug text) language plpgsql security definer set search_path = public as $$
declare l links%rowtype; s text;
begin
  select * into l from links where code = p_code;
  if not found then return; end if;
  if l.proposal_id is not null then
    select slug into s from proposals where id = l.proposal_id;
  end if;
  if not p_is_bot then
    update links set clicks = clicks + 1, last_click_at = now() where code = p_code;
    if l.proposal_id is not null then
      insert into proposal_events (proposal_id, type, user_agent, referrer, country, city)
      values (l.proposal_id, 'link_click', left(p_ua, 400), left(p_ref, 400), p_country, p_city);
    end if;
  end if;
  return query select l.target_url, s;
end $$;

revoke all on function public.track_view(text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.approve_proposal(text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.hit_link(text, text, text, text, text, boolean) from public, anon, authenticated;
grant execute on function public.track_view(text, text, text, text, text, text) to service_role;
grant execute on function public.approve_proposal(text, text, text, text, text) to service_role;
grant execute on function public.hit_link(text, text, text, text, text, boolean) to service_role;
