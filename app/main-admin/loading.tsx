import { SkeletonCard } from "@/app/components/Skeleton";

export default function MainAdminLoading() {
  return (
    <main className="bg-[#eef2ff] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto w-full max-w-5xl">
        <SkeletonCard />
      </div>
    </main>
  );
}
