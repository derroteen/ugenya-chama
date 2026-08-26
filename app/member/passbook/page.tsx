import { getMemberPassbookData, type PassbookData } from "./actions";
import PassbookClient from "./PassbookClient";

async function getInitialPassbookData(): Promise<PassbookData> {
  return getMemberPassbookData();
}

export default async function MemberPassbookPage() {
  const initialData = await getInitialPassbookData();

  return (
    <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="flex flex-col gap-4 border-b border-[#c9a227]/50 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c9a227]">Member Portal</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0f1729] [font-family:var(--font-uae-display)] sm:text-4xl">
              Personal Contribution Passbook
            </h1>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <p className="text-sm font-medium text-slate-700">{initialData.memberName}</p>
            <p className="text-xs text-slate-500">
              {initialData.memberId} • {initialData.branchName}
            </p>
          </div>
        </div>

        <PassbookClient initialData={initialData} />
      </section>
    </main>
  );
}
