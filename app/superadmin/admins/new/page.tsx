import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NewAdminForm from "./NewAdminForm";
import { initialNewAdminFormState } from "./form-state";

export default async function NewAdminAccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name")
    .order("name", { ascending: true });

  return (
    <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c9a227]">UAE Administration</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0f1729] [font-family:var(--font-uae-display)] sm:text-4xl">
              Add Admin
            </h1>
          </div>
          <Link
            href="/superadmin/admins"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#0f1729] transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a] focus-visible:ring-offset-2"
          >
            Back to Admin List
          </Link>
        </div>

        <p className="mt-4 max-w-3xl text-base leading-7 sm:text-lg">
          Create a new admin account and securely share the generated credentials.
        </p>

        <NewAdminForm branchOptions={branches ?? []} initialState={initialNewAdminFormState} />
      </section>
    </main>
  );
}
