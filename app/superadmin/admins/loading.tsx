import { SkeletonBlock, SkeletonTable } from "@/app/components/Skeleton";

export default function SuperadminAdminsLoading() {
  return (
    <main className="bg-[#eef2ff] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="w-full max-w-md space-y-3">
            <SkeletonBlock width="35%" height={14} />
            <SkeletonBlock width="60%" height={34} />
          </div>
          <SkeletonBlock width={120} height={42} className="rounded-lg" />
        </div>
        <SkeletonTable rows={7} columns={5} />
      </section>
    </main>
  );
}
