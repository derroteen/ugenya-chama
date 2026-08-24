-- One-time migration: recalculate monthly_savings.cumulative_saving
-- to drop kbg_shares_bf from the formula.
--
-- Old formula: cumulative_saving = kbg_shares_bf + old_savings_bf + previous_balance_bf + subs
-- New formula: cumulative_saving = old_savings_bf + previous_balance_bf + subs
--
-- MANUAL — run by hand in the Supabase SQL Editor after reviewing the
-- preview SELECT below. This touches every row of live financial data.
-- Not run automatically by the app or any script.

-- Step 1: preview which rows will change and by how much before touching
-- anything. Run this first and eyeball the results.
select
  ms.id,
  ms.branch_id,
  ms.member_id,
  ms.month,
  ms.old_savings_bf,
  ms.previous_balance_bf,
  ms.subs,
  ms.cumulative_saving as old_cumulative_saving,
  (ms.old_savings_bf + ms.previous_balance_bf + ms.subs) as new_cumulative_saving,
  ms.cumulative_saving - (ms.old_savings_bf + ms.previous_balance_bf + ms.subs) as difference
from monthly_savings ms
where ms.cumulative_saving <> (ms.old_savings_bf + ms.previous_balance_bf + ms.subs)
order by ms.branch_id, ms.month, ms.member_id;

-- Step 2: apply the recalculation. Only run after reviewing Step 1's output.
-- begin;

update monthly_savings
set cumulative_saving = old_savings_bf + previous_balance_bf + subs
where cumulative_saving <> (old_savings_bf + previous_balance_bf + subs);

-- Step 3: verify no rows still mismatch the new formula, then commit.
-- select count(*) from monthly_savings
-- where cumulative_saving <> (old_savings_bf + previous_balance_bf + subs);

-- commit;
