-- 002 · Engajamento: seções vistas, clique em "Aprovar", clique contado na proposta
-- Rode no Supabase: SQL Editor → New query → cole tudo → Run. Pode rodar mais de uma vez.

-- novos marcos na proposta
alter table public.proposals add column if not exists reached_pricing_at timestamptz;
alter table public.proposals add column if not exists approve_opened_at  timestamptz;

-- eventos: novo campo de detalhe + novos tipos
alter table public.proposal_events add column if not exists detail text;
alter table public.proposal_events drop constraint if exists proposal_events_type_check;
alter table public.proposal_events add constraint proposal_events_type_check
  check (type in ('view', 'link_click', 'section', 'approve_open', 'approve', 'unapprove'));

-- Registra um evento vindo da página da proposta (já filtrado: sem robôs, sem equipe)
create or replace function public.track_event(
  p_slug text, p_type text, p_detail text, p_session text,
  p_ua text, p_ref text, p_country text, p_city text
) returns void language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  select id into pid from proposals where slug = p_slug and not archived;
  if pid is null then return; end if;

  if p_type = 'view' then
    update proposals set view_count = view_count + 1,
      first_viewed_at = coalesce(first_viewed_at, now()), last_viewed_at = now()
    where id = pid;
  elsif p_type = 'section' then
    -- uma vez por sessão por seção
    if exists (select 1 from proposal_events where proposal_id = pid and type = 'section'
               and session_id = p_session and detail = p_detail) then return; end if;
    if p_detail = 'investimento' then
      update proposals set reached_pricing_at = coalesce(reached_pricing_at, now()) where id = pid;
    end if;
  elsif p_type = 'approve_open' then
    if exists (select 1 from proposal_events where proposal_id = pid and type = 'approve_open'
               and session_id = p_session) then return; end if;
    update proposals set approve_opened_at = coalesce(approve_opened_at, now()) where id = pid;
  elsif p_type = 'link_click' then
    update links set clicks = clicks + 1, last_click_at = now() where code = p_detail and proposal_id = pid;
    if not found then return; end if;
  else
    return;
  end if;

  insert into proposal_events (proposal_id, type, detail, session_id, user_agent, referrer, country, city)
  values (pid, p_type, left(p_detail, 100), left(p_session, 64), left(p_ua, 400), left(p_ref, 400), p_country, p_city);
end $$;

-- Só resolve o destino do link (a contagem de link de proposta passa a ser feita na própria proposta)
create or replace function public.resolve_link(p_code text)
returns table (target_url text, proposal_slug text) language sql security definer set search_path = public as $$
  select l.target_url, p.slug from links l left join proposals p on p.id = l.proposal_id where l.code = p_code;
$$;

revoke all on function public.track_event(text, text, text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.resolve_link(text) from public, anon, authenticated;
grant execute on function public.track_event(text, text, text, text, text, text, text, text) to service_role;
grant execute on function public.resolve_link(text) to service_role;
