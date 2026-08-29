import type { createClient } from "@/lib/supabase/server";

/**
 * Next available sheet_order for a branch: MAX(sheet_order) + 1 across every member
 * ever assigned to that branch (active or not - a gap left by an inactive/removed
 * member is not reused). 1 if the branch has no members yet or none have a sheet_order.
 */
export async function getNextSheetOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  branchId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("members")
    .select("sheet_order")
    .eq("branch_id", branchId)
    .order("sheet_order", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  const currentMax = data?.sheet_order ?? 0;
  return currentMax + 1;
}
