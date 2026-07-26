import { SkeletonBlock, SkeletonTable } from "@/app/components/Skeleton";

export default function BranchMembersLoading() {
  return (
    <main className="bg-[#eef2ff] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="w-full max-w-md space-y-3">
            <SkeletonBlock width="28%" height={14} />
            <SkeletonBlock width="46%" height={34} />
          </div>
          <SkeletonBlock width={130} height={42} className="rounded-lg" />
        </div>

        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonBlock height={72} className="rounded-lg" />
            <SkeletonBlock height={72} className="rounded-lg" />
            <SkeletonBlock height={42} className="rounded-lg self-end" />
          </div>
        </div>

        <SkeletonTable rows={8} columns={6} />
      </section>
    </main>
  );
}
