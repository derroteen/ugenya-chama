# Ugenya Association Eldoret (UAE) — Chama Management System
## Project Handoff / Context Document

---

## Overview

A savings & welfare association management system for Ugenya Association
Eldoret, covering 12 branches and ~300–400 members. Committee-approved and
paid; now in the "finish and populate with real data" phase.

**Stack:** Next.js 16 (App Router, Turbopack) · TypeScript · Supabase
(Postgres + Auth + RLS) · Tailwind CSS · Deployed on Vercel
**Repo:** github.com/derroteen/ugenya-chama (public)
**Live:** deployed on Vercel

---

## Roles (3 tiers)

| Role | Account | Capability |
|------|---------|-----------|
| Superadmin | superadmin@ugenya.org | Full control, creates admins |
| Main Admin | mainadmin@ugenya.org | All data entry across all 12 branches |
| Member | Member ID + phone (initial pw) | Views only their own records |

- Members log in with their Member ID (e.g. UAE001) and their phone number
  as the initial password, then are forced to change it on first login
  (`must_change_password` flag + redirect).
- The old `branch_admin` role was fully removed early in the project — all
  data entry is now done by the main admin.

---

## Core Features (built & tested)

### Public site
- Homepage: navy sticky navbar, hero, "What We Offer", "Member Portal"
  steps, "How Contributions Work", "Built on Trust", branches list,
  membership section, footer.
- Downloadable membership application form (PDF, uses `download` attribute
  on an `<a>` tag).
- Terms & Privacy combined page at `/terms`, linked from footer + login.

### Member portal
- Login, forced first-login password change, personal dashboard showing
  only the member's own savings/emergency records.

### Sheet system (the core)
- Per-branch, per-month contribution sheets at
  `/main-admin/sheets/[branchId]?month=YYYY-MM`.
- Columns: No. | Name | Member ID | KBG Shares B/F | Old Savings B/F |
  Previous Balance B/F | Subs | Cumulative Saving | Previous Emerg B/F |
  Emerg Subs | Cumulative Emerg Fund | Withdrawal | Emergency Balance.
- **Editable:** all input columns (KBG, Old Savings, Previous Balance,
  Subs, Previous Emerg, Emerg Subs, Withdrawal).
- **Calculated server-side only (read-only):**
  - `Cumulative Saving = KBG + Old Savings + Previous Balance + Subs`
  - `Cumulative Emerg Fund = Previous Emerg + Emerg Subs`
  - `Emergency Balance = Cumulative Emerg Fund − Withdrawal`
- **Carry-forward:** only `(previous_balance + subs)` rolls into next
  month's Previous Balance — NOT the full cumulative (KBG & Old Savings are
  static and must not double-count).
- Live totals update while typing; "Save All" with validation; per-row
  save also available.
- `openMonthForBranch` auto-creates rows for all active members the first
  time a month is opened, and tops up any members added later. Insert uses
  upsert with `ignoreDuplicates` to avoid a check-then-insert race.
- Row order is controlled by `members.sheet_order` (integer, nullable,
  nulls last) — set manually per member, independent of Member ID.
  (Reason: an executive may be UAE001 but sit at row 42 on the physical
  sheet.)

### Reports
- Monthly PDF report across all 12 branches (@react-pdf/renderer),
  per-branch tables + totals + association-wide grand totals. Empty
  branches show "No entries recorded".

### Branches
- `/main-admin/branches` — card grid, member counts, links to members +
  sheet.
- `/main-admin/branches/[id]` — members list + open-sheet quick action.

### Member management
- Single add form + **bulk CSV import** (`/main-admin/members/import`,
  columns: full_name, phone). Import runs sequentially with a **3-second
  delay between each creation** to stay under Supabase Auth's ~20/hour
  signup rate limit.
- **Delete member** with a confirmation modal; deleting frees the Member ID
  into `recycled_member_ids`, and `createMember` reuses the lowest recycled
  ID before generating a new sequential one.
- **Duplicate prevention** — createMember blocks duplicate phone numbers
  and duplicate (case-insensitive) full names, reporting which existing
  Member ID conflicts.

### Security & infra
- Rate limiting (in-memory), CSP + security headers in next.config.ts,
  input length validation on all server actions, SQL-injection audit
  (Supabase client is parameterized by default).
- Keep-alive route at `/api/keep-alive?token=...` pinged by cron-job.org
  every 3 days to stop the free-tier Supabase project pausing. (Replaced a
  flaky GitHub Actions workflow, now deleted.)

---

## Data / Domain Notes

- **Executives:** UAE001–UAE008 already added, across different branches.
  Each executive belongs to exactly one branch.
- **KBG Shares B/F:** a one-time dividend from an old association van
  project, paid to a few members. Static value — set once, never changes
  monthly. Editable on the sheet / member profile.
- **Old Savings B/F:** last year's closing balance — a one-time historical
  figure per member.
- **Langas branch:** 20 of ~30 members imported; **10 still pending**
  (rate-limited before the delay fix was added). CSV of the 10 exists.
- Other 11 branches: waiting on phone numbers before import.

---

## Outstanding Work

1. Import the remaining 10 Langas members (rate-limit window has reset).
2. Import the other 11 branches as phone numbers become available
   (one branch at a time).
3. Set `sheet_order` per member to match physical sheets.
4. Optional: register a proper `.co.ke` domain (covered by the annual
   hosting fee).

---

## Commercial

- One-time development: **KSH 36,500** (approved/paid).
- Annual hosting fee: **KSH 6,800/year** (domain renewal + hosting).
- **1-year warranty** on bug fixes & minor changes; new features and
  post-warranty maintenance quoted separately.

---

## ⚠️ Two Critical Gotchas (learned the hard way)

### 1. schema.sql is NOT the live database
Editing `supabase/schema.sql` changes only a local text file. Every
`create table` / `alter table` / `create index` MUST be run manually in the
Supabase SQL Editor. Forgetting this caused repeated runtime errors
(`monthly_savings` table missing, `kbg_shares_bf` column missing,
`sheet_order` column missing) — each only fixed after running the SQL by
hand. **Whenever schema.sql changes, run the new statements in Supabase.**

### 2. Verify every git diff before committing
After any AI-assisted change, run:
```
git status
git add -A
git diff --cached --stat
```
and eyeball the file list before committing. During the project the
previous tool silently touched unrelated files and once recreated a folder
that had been deliberately deleted (it matched HEAD exactly, so it was
invisible in `git status` until checked). Also: `git rm -rf` a folder, then
confirm the build's route list no longer shows it. Keep this discipline.

### Bonus: deleting Supabase auth users
Auth users can't be deleted while rows reference them. `created_by` columns
on `monthly_savings` / `emergency_contributions` were changed to
`ON DELETE SET NULL`. If a delete is blocked, clear referencing rows
(profiles, contribution rows) first, then delete the auth user via the
Supabase Dashboard (safer than raw SQL on `auth.users`).

---

## Suggested Supabase-to-code sync check

Columns/tables that must exist live in Supabase (verify before debugging
any "column/table does not exist" error):
- `members.kbg_shares_bf`, `members.old_savings_bf`, `members.sheet_order`
- `monthly_savings`, `emergency_contributions` tables (+ RLS policies)
- `recycled_member_ids` table
- `my_role()` function (used by RLS policies)