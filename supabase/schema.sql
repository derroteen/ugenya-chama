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
-- role: 'superadmin' | 'main_admin' | 'member'
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('superadmin','main_admin','member')),
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
  kbg_shares_bf numeric(12,2),
  must_change_password boolean not null default true,
  status text not null default 'active' check (status in ('active','inactive','suspended')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists recycled_member_ids (
  id uuid primary key default gen_random_uuid(),
  member_id text not null unique,
  recycled_at timestamptz default now()
);

alter table members add column if not exists kbg_shares_bf numeric(12,2);
alter table members add column if not exists sheet_order integer default null;

create index if not exists idx_members_branch on members(branch_id);
create index if not exists idx_members_sheet_order on members(branch_id, sheet_order);

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
-- superadmin direct writes, but main_admin users can still trigger this
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

-- (No loans table - UAE does not offer loans, only savings/shares and welfare/funeral support.)

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table branches enable row level security;
alter table profiles enable row level security;
alter table members enable row level security;
alter table contributions enable row level security;
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
-- superadmin + main_admin: see all. member: only their own row.
drop policy if exists "members_select" on members;
create policy "members_select" on members
  for select using (
    my_role() in ('superadmin','main_admin')
    or auth_id = auth.uid()
  );

drop policy if exists "members_insert" on members;
create policy "members_insert" on members
  for insert with check (
    my_role() in ('superadmin','main_admin')
  );

drop policy if exists "members_update" on members;
create policy "members_update" on members
  for update using (
    my_role() in ('superadmin','main_admin')
  );

-- ---------- Contributions ----------
drop policy if exists "contrib_select" on contributions;
create policy "contrib_select" on contributions
  for select using (
    my_role() in ('superadmin','main_admin')
    or member_id in (select id from members where auth_id = auth.uid())
  );

drop policy if exists "contrib_insert" on contributions;
create policy "contrib_insert" on contributions
  for insert with check (
    my_role() in ('superadmin','main_admin')
  );

-- ---------- member_id_counter: only touched via the SECURITY DEFINER function ----------
drop policy if exists "counter_no_direct_access" on member_id_counter;
create policy "counter_no_direct_access" on member_id_counter
  for all using (my_role() = 'superadmin');

-- ============================================================
-- EXTENDED MEMBER RECORDS
-- (from the physical Membership General Record + Beneficiary Declaration forms)
-- ============================================================

-- ---------- MEMBER FAMILY DETAILS (one row per member) ----------
create table if not exists member_family_details (
  member_id uuid primary key references members(id) on delete cascade,
  marital_status text check (marital_status in ('single','married','widowed')),
  employment_status text check (employment_status in ('employed','self_employed','unemployed')),
  occupation text,
  residential_location text,
  home_district text,
  home_location text,
  home_village text,
  spouse_name text,
  spouse_district text,
  spouse_location text,
  spouse_sub_location text,
  spouse_village text,
  spouse_id_number text,
  updated_at timestamptz not null default now()
);

-- ---------- MEMBER CHILDREN (many rows per member) ----------
create table if not exists member_children (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  full_name text not null,
  age int,
  created_at timestamptz not null default now()
);

create index if not exists idx_children_member on member_children(member_id);

-- ---------- BENEFICIARY / NEXT-OF-KIN DECLARATION (one row per member) ----------
-- from the "Last Respect" declaration form: parents' status, guardian (if both
-- parents deceased), and the named beneficiary who would receive death benefits.
create table if not exists member_beneficiary_declarations (
  member_id uuid primary key references members(id) on delete cascade,

  father_name text,
  father_date_of_birth date,
  father_id_number text,
  father_status text check (father_status in ('alive','deceased')),

  mother_name text,
  mother_date_of_birth date,
  mother_id_number text,
  mother_status text check (mother_status in ('alive','deceased')),

  -- filled only if both parents are deceased
  guardian_name text,
  guardian_date_of_birth date,
  guardian_id_number text,

  beneficiary_full_name text,
  beneficiary_date_of_birth date,
  beneficiary_mobile text,
  beneficiary_relationship text,

  branch_chair_signed_at timestamptz,
  branch_secretary_signed_at timestamptz,
  recorded_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- PASSBOOK: two separate ledgers, matching the physical passbook
-- ============================================================

-- ---------- MONTHLY CONTRIBUTIONS (shares & dividends ledger) ----------
create table if not exists monthly_contributions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  branch_id uuid not null references branches(id),
  entry_date date not null default current_date,
  amount numeric(12,2) not null default 0 check (amount >= 0),
  dividend numeric(12,2) not null default 0,
  withdrawal numeric(12,2) not null default 0 check (withdrawal >= 0),
  running_balance numeric(12,2) not null default 0, -- computed and stored at insert time by the app
  recorded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_monthly_contrib_member on monthly_contributions(member_id);
create index if not exists idx_monthly_contrib_branch on monthly_contributions(branch_id);

-- ---------- FUNERAL CONTRIBUTIONS (separate ledger, tied to specific events) ----------
create table if not exists funeral_contributions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  branch_id uuid not null references branches(id),        -- the contributing member's branch
  event_branch_id uuid references branches(id),            -- the branch the funeral event relates to (may differ)
  entry_date date not null default current_date,
  event_description text,
  amount numeric(12,2) not null default 0 check (amount >= 0),
  recorded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_funeral_contrib_member on funeral_contributions(member_id);
create index if not exists idx_funeral_contrib_branch on funeral_contributions(branch_id);

-- ============================================================
-- RLS: extended member records + passbook
-- (same access pattern as members/contributions above: superadmin + main_admin
-- see everything, member sees only their own)
-- ============================================================

alter table member_family_details enable row level security;
alter table member_children enable row level security;
alter table member_beneficiary_declarations enable row level security;
alter table monthly_contributions enable row level security;
alter table funeral_contributions enable row level security;

-- ---------- member_family_details ----------
drop policy if exists "family_details_select" on member_family_details;
create policy "family_details_select" on member_family_details
  for select using (
    my_role() in ('superadmin','main_admin')
    or member_id in (select id from members where auth_id = auth.uid())
  );

drop policy if exists "family_details_write" on member_family_details;
create policy "family_details_write" on member_family_details
  for all using (
    my_role() in ('superadmin','main_admin')
  )
  with check (
    my_role() in ('superadmin','main_admin')
  );

-- ---------- member_children ----------
drop policy if exists "children_select" on member_children;
create policy "children_select" on member_children
  for select using (
    my_role() in ('superadmin','main_admin')
    or member_id in (select id from members where auth_id = auth.uid())
  );

drop policy if exists "children_write" on member_children;
create policy "children_write" on member_children
  for all using (
    my_role() in ('superadmin','main_admin')
  )
  with check (
    my_role() in ('superadmin','main_admin')
  );

-- ---------- member_beneficiary_declarations ----------
drop policy if exists "beneficiary_select" on member_beneficiary_declarations;
create policy "beneficiary_select" on member_beneficiary_declarations
  for select using (
    my_role() in ('superadmin','main_admin')
    or member_id in (select id from members where auth_id = auth.uid())
  );

drop policy if exists "beneficiary_write" on member_beneficiary_declarations;
create policy "beneficiary_write" on member_beneficiary_declarations
  for all using (
    my_role() in ('superadmin','main_admin')
  )
  with check (
    my_role() in ('superadmin','main_admin')
  );

-- ---------- monthly_contributions ----------
drop policy if exists "monthly_contrib_select" on monthly_contributions;
create policy "monthly_contrib_select" on monthly_contributions
  for select using (
    my_role() in ('superadmin','main_admin')
    or member_id in (select id from members where auth_id = auth.uid())
  );

drop policy if exists "monthly_contrib_insert" on monthly_contributions;
create policy "monthly_contrib_insert" on monthly_contributions
  for insert with check (
    my_role() in ('superadmin','main_admin')
  );

-- ---------- funeral_contributions ----------
drop policy if exists "funeral_contrib_select" on funeral_contributions;
create policy "funeral_contrib_select" on funeral_contributions
  for select using (
    my_role() in ('superadmin','main_admin')
    or member_id in (select id from members where auth_id = auth.uid())
  );

drop policy if exists "funeral_contrib_insert" on funeral_contributions;
create policy "funeral_contrib_insert" on funeral_contributions
  for insert with check (
    my_role() in ('superadmin','main_admin')
  );

-- ============================================================
-- SHEET-BASED CONTRIBUTIONS
-- ============================================================

create table if not exists monthly_savings (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  month text not null,
  old_savings_bf numeric(12,2) not null default 0,
  previous_balance_bf numeric(12,2) not null default 0,
  subs numeric(12,2) not null default 0 check (subs >= 0),
  cumulative_saving numeric(12,2) not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (branch_id, member_id, month)
);

create index if not exists idx_monthly_savings_branch_month on monthly_savings(branch_id, month);
create index if not exists idx_monthly_savings_member on monthly_savings(member_id);

create table if not exists emergency_contributions (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  month text not null,
  previous_emerg_bf numeric(12,2) not null default 0,
  emerg_subs numeric(12,2) not null default 0 check (emerg_subs >= 0),
  cumulative_emerg_fund numeric(12,2) not null default 0,
  withdrawal numeric(12,2) not null default 0 check (withdrawal >= 0),
  emergency_balance numeric(12,2) not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (branch_id, member_id, month)
);

create index if not exists idx_emerg_contrib_branch_month on emergency_contributions(branch_id, month);
create index if not exists idx_emerg_contrib_member on emergency_contributions(member_id);

alter table monthly_savings enable row level security;
alter table emergency_contributions enable row level security;

drop policy if exists "monthly_savings_select" on monthly_savings;
create policy "monthly_savings_select" on monthly_savings
  for select using (
    my_role() in ('superadmin','main_admin')
    or member_id in (select id from members where auth_id = auth.uid())
  );

drop policy if exists "monthly_savings_write" on monthly_savings;
create policy "monthly_savings_write" on monthly_savings
  for all using (my_role() in ('superadmin','main_admin'))
  with check (my_role() in ('superadmin','main_admin'));

drop policy if exists "emerg_sheets_select" on emergency_contributions;
create policy "emerg_sheets_select" on emergency_contributions
  for select using (
    my_role() in ('superadmin','main_admin')
    or member_id in (select id from members where auth_id = auth.uid())
  );

drop policy if exists "emerg_sheets_write" on emergency_contributions;
create policy "emerg_sheets_write" on emergency_contributions
  for all using (my_role() in ('superadmin','main_admin'))
  with check (my_role() in ('superadmin','main_admin'));
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
