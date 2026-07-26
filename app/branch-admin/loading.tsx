import { SkeletonCard, SkeletonBlock } from "@/app/components/Skeleton";

export default function BranchAdminLoading() {
  return (
    <main className="bg-[#eef2ff] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <SkeletonCard className="border-0 p-0 shadow-none" />
        <SkeletonBlock width={140} height={44} className="mt-8 rounded-md" />
      </section>
    </main>
  );
}
