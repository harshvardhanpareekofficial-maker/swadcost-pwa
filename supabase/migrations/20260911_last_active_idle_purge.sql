-- last_active_at + 12-day idle purge for fabriccost STUDIO analytics.
-- Table names stay swadcost_* as backend IDs (never shown in the UI).
--
-- Apply in the Supabase SQL editor on project stcjwprffdsojfeogfnx if not already present.
-- The Vite PWA client stamps last_active_at on sign-in and Calculate, then on every
-- app load deletes localStorage accounts idle > 12 days and matching remote rows.
-- RLS below only allows DELETE of idle (or orphan calc) rows — not active accounts.
-- Coordinator wipes existing rows separately; this migration does not truncate.

alter table public.swadcost_accounts
  add column if not exists last_active_at timestamptz;

update public.swadcost_accounts
  set last_active_at = created_at
  where last_active_at is null;

alter table public.swadcost_accounts
  alter column last_active_at set default now();

alter table public.swadcost_accounts
  alter column last_active_at set not null;

create index if not exists swadcost_accounts_last_active_at_idx
  on public.swadcost_accounts (last_active_at);

-- Anon may update last_active_at only (never username / id).
grant update (last_active_at) on public.swadcost_accounts to anon, authenticated;

drop policy if exists swadcost_accounts_update on public.swadcost_accounts;
create policy swadcost_accounts_update on public.swadcost_accounts
  for update to anon, authenticated
  using (true)
  with check (true);

drop policy if exists swadcost_accounts_delete_idle on public.swadcost_accounts;
create policy swadcost_accounts_delete_idle on public.swadcost_accounts
  for delete to anon, authenticated
  using (coalesce(last_active_at, created_at) < now() - interval '12 days');

-- Calcs may be deleted when the username has no *active* account
-- (idle account still present, or already removed).
drop policy if exists swadcost_calcs_delete_idle on public.swadcost_calcs;
create policy swadcost_calcs_delete_idle on public.swadcost_calcs
  for delete to anon, authenticated
  using (
    not exists (
      select 1
      from public.swadcost_accounts a
      where a.username_norm = lower(swadcost_calcs.username)
        and coalesce(a.last_active_at, a.created_at) >= now() - interval '12 days'
    )
  );
