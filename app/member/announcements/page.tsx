import Link from "next/link";
import AnnouncementsList from "./AnnouncementsList";
import { getVisibleAnnouncementsForMember } from "./actions";

export default async function MemberAnnouncementsPage() {
  const announcements = await getVisibleAnnouncementsForMember();

  return (
    <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="flex flex-col gap-4 border-b border-[#c9a227]/50 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c9a227]">Member Portal</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0f1729] [font-family:var(--font-uae-display)] sm:text-4xl">
              Announcements
            </h1>
          </div>

          <Link
            href="/member"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to Dashboard
          </Link>
        </div>

        <AnnouncementsList initialAnnouncements={announcements} />
      </section>
    </main>
  );
}
