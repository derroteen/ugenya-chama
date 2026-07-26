-- ============================================================
-- UGENYA ASSOCIATION ELDORET (UAE) - Chama Management System
-- Core schema: branches, profiles (roles), members, contributions
-- Member IDs: single global sequence, format UAE001, UAE002, ...
-- Run in Supabase SQL editor, or via `supabase db push`
-- ============================================================

-- ---------- 1. BRANCHES ----------
create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,       -- e.g. 'KIS', 'NBO', 'MSA', 'UGN'
  created_at timestamptz not null default now()
);

-- ---------- 2. PROFILES (linked 1:1 to auth.users) ----------
-- role: 'superadmin' | 'main_admin' | 'branch_admin' | 'member'
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('superadmin','main_admin','branch_admin','member')),
  branch_id uuid references branches(id),   -- null for superadmin / main_admin
  full_name text,
  email text,                                -- convenience copy of auth.users.email, set at creation
  created_at timestamptz not null default now()
);

-- ---------- 3. MEMBERS ----------
-- member_id format: UAE<000>  e.g. UAE001, UAE002 ... (single association-wide sequence,
-- not per-branch - branch_id below is still tracked for record-keeping, RLS scoping,
-- and reporting, it just no longer appears inside the member_id itself)
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid references auth.users(id) on delete set null, -- set once they have a login
  member_id text not null unique,
  branch_id uuid not null references branches(id),
  full_name text not null,
  phone text not null,
  id_number text,                 -- national ID, optional but useful for chamas
  must_change_password boolean not null default true,
  status text not null default 'active' check (status in ('active','inactive','suspended')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_members_branch on members(branch_id);

-- Single global counter for member IDs (one row, id fixed at 1)
create table if not exists member_id_counter (
  id int primary key default 1,
  last_number int not null default 0,
  constraint single_row check (id = 1)
);
insert into member_id_counter (id, last_number) values (1, 0)
on conflict (id) do nothing;

-- Function: generate the next global member_id atomically, e.g. UAE001, UAE002...
-- branch_id param is accepted (and can be used later for reporting) but no longer
-- affects the ID format itself.
-- SECURITY DEFINER is required here: member_id_counter's RLS policy only allows
-- superadmin direct writes, but branch_admin/main_admin need to trigger this
-- function when creating members. Running as the function's definer bypasses
-- that restriction safely, since the function only ever increments by exactly 1.
create or replace function generate_member_id(p_branch_id uuid default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next int;
  v_member_id text;
begin
  update member_id_counter
    set last_number = last_number + 1
    where id = 1
    returning last_number into v_next;

  v_member_id := 'UAE' || lpad(v_next::text, 3, '0');
  return v_member_id;
end;
$$;

-- ---------- 4. CONTRIBUTIONS (example ledger table) ----------
create table if not exists contributions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id),
  branch_id uuid not null references branches(id),
  amount numeric(12,2) not null check (amount >= 0),
  contribution_date date not null default current_date,
  method text default 'cash' check (method in ('cash','mpesa','bank','other')),
  reference text,
  recorded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_contrib_branch on contributions(branch_id);
create index if not exists idx_contrib_member on contributions(member_id);

-- ---------- 5. LOANS (example, extend as needed) ----------
create table if not exists loans (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id),
  branch_id uuid not null references branches(id),
  principal numeric(12,2) not null,
  balance numeric(12,2) not null,
  status text not null default 'active' check (status in ('active','cleared','defaulted')),
  issued_date date not null default current_date,
  recorded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_loans_branch on loans(branch_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table branches enable row level security;
alter table profiles enable row level security;
alter table members enable row level security;
alter table contributions enable row level security;
alter table loans enable row level security;
alter table member_id_counter enable row level security;

-- Helper: get role/branch of the currently logged-in user
create or replace function my_role() returns text
language sql stable security definer as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function my_branch() returns uuid
language sql stable security definer as $$
  select branch_id from profiles where id = auth.uid();
$$;

-- ---------- Branches: publicly readable (needed for the pre-login branch picker) ----------
drop policy if exists "branches_read_all" on branches;
create policy "branches_read_all" on branches
  for select using (true);

drop policy if exists "branches_write_superadmin" on branches;
create policy "branches_write_superadmin" on branches
  for all using (my_role() = 'superadmin')
  with check (my_role() = 'superadmin');

-- ---------- Profiles ----------
drop policy if exists "profiles_self_read" on profiles;
create policy "profiles_self_read" on profiles
  for select using (id = auth.uid() or my_role() in ('superadmin','main_admin'));

drop policy if exists "profiles_superadmin_write" on profiles;
create policy "profiles_superadmin_write" on profiles
  for all using (my_role() = 'superadmin')
  with check (my_role() = 'superadmin');

-- ---------- Members ----------
-- superadmin + main_admin: see all. branch_admin: only their branch. member: only their own row.
drop policy if exists "members_select" on members;
create policy "members_select" on members
  for select using (
    my_role() in ('superadmin','main_admin')
    or (my_role() = 'branch_admin' and branch_id = my_branch())
    or auth_id = auth.uid()
  );

drop policy if exists "members_insert" on members;
create policy "members_insert" on members
  for insert with check (
    my_role() in ('superadmin','main_admin')
    or (my_role() = 'branch_admin' and branch_id = my_branch())
  );

drop policy if exists "members_update" on members;
create policy "members_update" on members
  for update using (
    my_role() in ('superadmin','main_admin')
    or (my_role() = 'branch_admin' and branch_id = my_branch())
  );

-- ---------- Contributions ----------
drop policy if exists "contrib_select" on contributions;
create policy "contrib_select" on contributions
  for select using (
    my_role() in ('superadmin','main_admin')
    or (my_role() = 'branch_admin' and branch_id = my_branch())
    or member_id in (select id from members where auth_id = auth.uid())
  );

drop policy if exists "contrib_insert" on contributions;
create policy "contrib_insert" on contributions
  for insert with check (
    my_role() in ('superadmin','main_admin')
    or (my_role() = 'branch_admin' and branch_id = my_branch())
  );

-- ---------- Loans (same pattern as contributions) ----------
drop policy if exists "loans_select" on loans;
create policy "loans_select" on loans
  for select using (
    my_role() in ('superadmin','main_admin')
    or (my_role() = 'branch_admin' and branch_id = my_branch())
    or member_id in (select id from members where auth_id = auth.uid())
  );

drop policy if exists "loans_insert" on loans;
create policy "loans_insert" on loans
  for insert with check (
    my_role() in ('superadmin','main_admin')
    or (my_role() = 'branch_admin' and branch_id = my_branch())
  );

-- ---------- member_id_counter: only touched via the SECURITY DEFINER function ----------
drop policy if exists "counter_no_direct_access" on member_id_counter;
create policy "counter_no_direct_access" on member_id_counter
  for all using (my_role() = 'superadmin');

-- ============================================================
-- SEED: the 12 real UAE branches
-- (code is an internal short reference only - it no longer appears
-- in member_id, which is now a single global UAE001-style sequence)
-- ============================================================
insert into branches (name, code) values
  ('Huruma', 'HUR'),
  ('King''ong''o', 'KNG'),
  ('Langas', 'LAN'),
  ('Kipkaren', 'KIP'),
  ('Kidiwa', 'KID'),
  ('Racecourse', 'RAC'),
  ('Baringo', 'BAR'),
  ('Central Huruma', 'CHU'),
  ('Kahoya', 'KAH'),
  ('Kamkunji', 'KAM'),
  ('Kisumu Ndogo', 'KSD'),
  ('East Huruma', 'EHU')
on conflict (code) do nothing;
