import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import FuneralSheetsFilters from "./FuneralSheetsFilters";

type PageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

type BranchRelation = { name?: string };
type MemberRelation = { member_id?: string; full_name?: string };

type CollectionRow = {
  id: string;
  event_description: string;
  collection_date: string;
  amount: number | string;
  source?: string | null;
  branches: BranchRelation | BranchRelation[] | null;
  members: MemberRelation | MemberRelation[] | null;
};

function getParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function escapeIlike(value: string) {
  return value.replace(/[,%_]/g, " ").trim();
}

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatKsh(value: number) {
  return `KSH ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(value)}`;
}

function formatAmountWithSource(value: number | string, source?: string | null) {
  const normalizedSource = String(source ?? "cash").trim().toLowerCase();
  const label = normalizedSource === "emergency_fund" || normalizedSource === "emergency-fund" ? "Emergency Fund" : "Cash";
  return `${formatKsh(toNumber(value))} (${label})`;
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function getRelation<T>(relation: T | T[] | null | undefined): T | null {
  if (!relation) return null;
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

export default async function FuneralSheetsCombinedPage({ searchParams }: PageProps) {
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

  const resolvedParams = await Promise.resolve(searchParams ?? {});
  const eventSearch = getParamValue(resolvedParams.event).trim();
  const dateFrom = getParamValue(resolvedParams.from).trim();
  const dateTo = getParamValue(resolvedParams.to).trim();

  let query = supabase
    .from("funeral_collections")
    .select("id, event_description, collection_date, amount, source, branches(name), members(member_id, full_name)")
    .order("name", { ascending: true, foreignTable: "branches" })
    .order("collection_date", { ascending: false });

  const searchValue = escapeIlike(eventSearch);
  if (searchValue) {
    query = query.ilike("event_description", `%${searchValue}%`);
  }
  if (dateFrom) {
    query = query.gte("collection_date", dateFrom);
  }
  if (dateTo) {
    query = query.lte("collection_date", dateTo);
  }

  const { data: collections } = await query;
  const rows = (collections ?? []) as CollectionRow[];
  const grandTotal = rows.reduce((sum, row) => sum + toNumber(row.amount), 0);

  return (
    <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c9a227]">
          UAE Funeral / Emergency Collections
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0f1729] [font-family:var(--font-uae-display)] sm:text-4xl">
          All Branches - Combined View
        </h1>
        <p className="mt-3 max-w-3xl text-base text-slate-600">
          Browse funeral/emergency-event collections across every branch, filtered by event description or date
          range. To record a new collection, open a specific branch from{" "}
          <Link
            href="/main-admin/branches"
            className="font-semibold text-[#1d3a8a] underline-offset-2 hover:underline"
          >
            Branches
          </Link>
          .
        </p>

        <FuneralSheetsFilters event={eventSearch} from={dateFrom} to={dateTo} />

        {rows.length === 0 ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-5 py-8 text-center">
            <p className="text-lg font-semibold text-[#0f1729]">No collections found</p>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Try adjusting the event search or date range.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
            <div
              className="w-full overflow-x-auto"
              style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}
            >
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">
                      Branch
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">
                      Event
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">
                      Member
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">
                      Member ID
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {rows.map((row) => {
                    const branch = getRelation(row.branches);
                    const member = getRelation(row.members);
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 text-sm text-slate-700 sm:px-6">{branch?.name ?? "-"}</td>
                        <td className="px-4 py-3 text-sm text-slate-700 sm:px-6">{row.event_description}</td>
                        <td className="px-4 py-3 text-sm text-slate-700 sm:px-6">{formatDate(row.collection_date)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-[#0f1729] sm:px-6">
                          {member?.full_name ?? "Unknown Member"}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#1d3a8a] sm:px-6">{member?.member_id ?? "-"}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-[#0f1729] sm:px-6">
                          {formatAmountWithSource(row.amount, row.source)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-[#f8fbff]">
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6"
                    >
                      Grand Total
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-[#0f1729] sm:px-6">
                      {formatKsh(grandTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
