"use client";

import { useState } from "react";
import { markAnnouncementRead, type MemberAnnouncement } from "./actions";
import { useOnlineStatus } from "@/lib/useOnlineStatus";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function AnnouncementsList({ initialAnnouncements }: { initialAnnouncements: MemberAnnouncement[] }) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const isOffline = !useOnlineStatus();

  async function handleOpenAnnouncement(id: string) {
    const existing = announcements.find((item) => item.id === id);
    if (!existing || existing.isRead) {
      return;
    }

    try {
      await markAnnouncementRead(id);
      setAnnouncements((current) =>
        current.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
    } catch (error) {
      console.error("Failed to mark announcement as read:", error);
    }
  }

  return (
    <div className="mt-8 space-y-4">
      {announcements.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-6 text-slate-600">
          No announcements are visible to you right now.
        </div>
      ) : (
        announcements.map((announcement) => (
          <article
            key={announcement.id}
            className={`rounded-2xl border p-5 shadow-sm ${announcement.isRead ? "border-slate-200 bg-white" : "border-[#c9a227]/50 bg-[#fffdf7]"}`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#0f1729]">{announcement.title}</h2>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                  {announcement.isRead ? "Read" : "Unread"}
                </p>
              </div>

              <div className="text-xs text-slate-500">{formatDate(announcement.createdAt)}</div>
            </div>

            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{announcement.body}</p>

            {!announcement.isRead ? (
              <button
                type="button"
                onClick={() => void handleOpenAnnouncement(announcement.id)}
                disabled={isOffline}
                className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#0f1729] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d3a8a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Mark as Read
              </button>
            ) : null}
          </article>
        ))
      )}
    </div>
  );
}
