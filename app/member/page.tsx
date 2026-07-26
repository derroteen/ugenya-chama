import { createClient } from "@/lib/supabase/server";

export default async function MemberDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: member } = await supabase
    .from("members")
    .select("member_id, branch_id")
    .eq("auth_id", user.id)
    .single();

  const branchId = member?.branch_id;

  const { data: branch } = branchId
    ? await supabase.from("branches").select("name").eq("id", branchId).single()
    : { data: null };

  return (
    <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <h1 className="text-3xl font-bold tracking-tight text-[#0f1729] [font-family:var(--font-uae-display)] sm:text-4xl">
          Member Dashboard
        </h1>
        <p className="mt-4 text-lg">Welcome, {member?.member_id ?? "Member"}.</p>
        <p className="mt-2 text-base sm:text-lg">
          Branch: {branch?.name ?? "Your branch"}
        </p>
        <p className="mt-4 max-w-3xl text-base leading-7 sm:text-lg">
          Your contribution history and welfare records will appear here.
        </p>
      </section>
    </main>
  );
}
