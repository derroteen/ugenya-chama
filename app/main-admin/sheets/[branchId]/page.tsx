import { createClient } from "@/lib/supabase/server";
import { openMonthForBranch } from "../actions";
import SheetFilters from "./SheetFilters";
import SheetTableClient from "./SheetTableClient";

type PageProps = {
  params: Promise<{ branchId: string }> | { branchId: string };
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

function getParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default async function MainAdminBranchSheetPage({ params, searchParams }: PageProps) {
  const { branchId } = await Promise.resolve(params);
  const resolvedParams = await Promise.resolve(searchParams ?? {});
  const month = getParamValue(resolvedParams.month).trim() || currentMonth();
  const shouldOpenSheet = getParamValue(resolvedParams.open) === "1";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "main_admin" && profile.role !== "superadmin")) {
    return null;
  }

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name")
    .order("name", { ascending: true });

  const branchOptions = branches ?? [];
  const selectedBranch = branchOptions.find((branch) => branch.id === branchId);

  if (!selectedBranch) {
    return (
      <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
        <section className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10">
          <h1 className="text-2xl font-semibold text-[#0f1729]">Invalid Branch</h1>
          <p className="mt-3 text-slate-600">The selected branch does not exist.</p>
        </section>
      </main>
    );
  }

  const rows = shouldOpenSheet ? await openMonthForBranch(branchId, month) : [];

  return (
    <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-[95rem] rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c9a227]">UAE Monthly Sheets</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0f1729] [font-family:var(--font-uae-display)] sm:text-4xl">
          {selectedBranch.name} Contribution Sheet
        </h1>

        <SheetFilters
          branches={branchOptions}
          currentBranchId={branchId}
          month={month}
          isSheetOpen={shouldOpenSheet}
        />

        <SheetTableClient
          key={`${branchId}-${month}`}
          rows={rows}
          branchId={branchId}
          branchName={selectedBranch.name}
          month={month}
          isSheetOpen={shouldOpenSheet}
        />
      </section>
    </main>
  );
}
