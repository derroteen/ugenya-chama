-- ============================================================
-- UGENYA ASSOCIATION - Chama Management System
-- Core schema: branches, profiles (roles), members, contributions
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
  created_at timestamptz not null default now()
);

-- ---------- 3. MEMBERS ----------
-- member_id format: UGY-<BRANCH_CODE>-<0000>  e.g. UGY-KIS-0042
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

-- Per-branch sequence counters, used to generate member_id
create table if not exists branch_member_counters (
  branch_id uuid primary key references branches(id),
  last_number int not null default 0
);

-- Function: generate next member_id for a branch atomically
create or replace function generate_member_id(p_branch_id uuid)
returns text
language plpgsql
as $$
declare
  v_code text;
  v_next int;
  v_member_id text;
begin
  select code into v_code from branches where id = p_branch_id;
  if v_code is null then
    raise exception 'Branch not found';
  end if;

  insert into branch_member_counters (branch_id, last_number)
  values (p_branch_id, 1)
  on conflict (branch_id) do update
    set last_number = branch_member_counters.last_number + 1
  returning last_number into v_next;

  v_member_id := 'UGY-' || v_code || '-' || lpad(v_next::text, 4, '0');
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
alter table branch_member_counters enable row level security;

-- Helper: get role/branch of the currently logged-in user
create or replace function my_role() returns text
language sql stable security definer as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function my_branch() returns uuid
language sql stable security definer as $$
  select branch_id from profiles where id = auth.uid();
$$;

-- ---------- Branches: everyone logged in can read branch names ----------
create policy "branches_read_all" on branches
  for select using (auth.uid() is not null);

create policy "branches_write_superadmin" on branches
  for all using (my_role() = 'superadmin')
  with check (my_role() = 'superadmin');

-- ---------- Profiles ----------
create policy "profiles_self_read" on profiles
  for select using (id = auth.uid() or my_role() in ('superadmin','main_admin'));

create policy "profiles_superadmin_write" on profiles
  for all using (my_role() = 'superadmin')
  with check (my_role() = 'superadmin');

-- ---------- Members ----------
-- superadmin + main_admin: see all. branch_admin: only their branch. member: only their own row.
create policy "members_select" on members
  for select using (
    my_role() in ('superadmin','main_admin')
    or (my_role() = 'branch_admin' and branch_id = my_branch())
    or auth_id = auth.uid()
  );

create policy "members_insert" on members
  for insert with check (
    my_role() in ('superadmin','main_admin')
    or (my_role() = 'branch_admin' and branch_id = my_branch())
  );

create policy "members_update" on members
  for update using (
    my_role() in ('superadmin','main_admin')
    or (my_role() = 'branch_admin' and branch_id = my_branch())
  );

-- ---------- Contributions ----------
create policy "contrib_select" on contributions
  for select using (
    my_role() in ('superadmin','main_admin')
    or (my_role() = 'branch_admin' and branch_id = my_branch())
    or member_id in (select id from members where auth_id = auth.uid())
  );

create policy "contrib_insert" on contributions
  for insert with check (
    my_role() in ('superadmin','main_admin')
    or (my_role() = 'branch_admin' and branch_id = my_branch())
  );

-- ---------- Loans (same pattern as contributions) ----------
create policy "loans_select" on loans
  for select using (
    my_role() in ('superadmin','main_admin')
    or (my_role() = 'branch_admin' and branch_id = my_branch())
    or member_id in (select id from members where auth_id = auth.uid())
  );

create policy "loans_insert" on loans
  for insert with check (
    my_role() in ('superadmin','main_admin')
    or (my_role() = 'branch_admin' and branch_id = my_branch())
  );

-- ---------- branch_member_counters: only touched via the SECURITY DEFINER function ----------
create policy "counters_no_direct_access" on branch_member_counters
  for all using (my_role() = 'superadmin');

-- ============================================================
-- SEED: your 4 branches (edit names/codes to match reality)
-- ============================================================
insert into branches (name, code) values
  ('Kisumu Branch', 'KIS'),
  ('Nairobi Branch', 'NBO'),
  ('Mombasa Branch', 'MSA'),
  ('Ugenya Branch', 'UGN')
on conflict (code) do nothing;
