import { SkeletonBlock, SkeletonCard, SkeletonTable } from "@/app/components/Skeleton";

export default function BranchMemberDetailsLoading() {
  return (
    <main className="bg-[#eef2ff] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="w-full max-w-xl space-y-3">
            <SkeletonBlock width="26%" height={14} />
            <SkeletonBlock width="58%" height={34} />
            <SkeletonBlock width="38%" height={18} />
          </div>
          <SkeletonBlock width={130} height={40} className="rounded-lg" />
        </div>

        <div className="mb-8 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonBlock height={64} className="rounded-lg" />
          <SkeletonBlock height={64} className="rounded-lg" />
          <SkeletonBlock height={64} className="rounded-lg" />
          <SkeletonBlock height={64} className="rounded-lg" />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 pt-4 sm:px-6">
            <div className="flex flex-wrap gap-2 pb-3">
              <SkeletonBlock width={130} height={36} className="rounded-t-lg" />
              <SkeletonBlock width={190} height={36} className="rounded-t-lg" />
              <SkeletonBlock width={120} height={36} className="rounded-t-lg" />
            </div>
          </div>
          <div className="px-4 py-6 sm:px-6 sm:py-8">
            <SkeletonCard className="border-0 p-0 shadow-none" />
            <div className="mt-6">
              <SkeletonTable rows={3} columns={3} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
