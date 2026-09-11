-- Already applied on project stcjwprffdsojfeogfnx (mettle-complete-dup).
-- Table names stay as backend identifiers; they are not shown in the UI.

create table if not exists public.swadcost_accounts (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  username_norm text generated always as (lower(username)) stored unique,
  created_at timestamptz not null default now()
);

create table if not exists public.swadcost_calcs (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  fabric_name text,
  mode text check (mode in ('single', 'multi')),
  reed numeric,
  pick numeric,
  warp_rs numeric,
  quality_label text,
  final_cost numeric,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.swadcost_accounts enable row level security;
alter table public.swadcost_calcs enable row level security;

-- Owner protection is a secret URL + VITE_OWNER_GATE. Anon may insert/select metadata only (no passwords).
drop policy if exists swadcost_accounts_insert on public.swadcost_accounts;
drop policy if exists swadcost_accounts_select on public.swadcost_accounts;
drop policy if exists swadcost_calcs_insert on public.swadcost_calcs;
drop policy if exists swadcost_calcs_select on public.swadcost_calcs;

create policy swadcost_accounts_insert on public.swadcost_accounts for insert to anon, authenticated with check (true);
create policy swadcost_accounts_select on public.swadcost_accounts for select to anon, authenticated using (true);
create policy swadcost_calcs_insert on public.swadcost_calcs for insert to anon, authenticated with check (true);
create policy swadcost_calcs_select on public.swadcost_calcs for select to anon, authenticated using (true);
