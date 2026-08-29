"use client";

import { useMemo, useState, useTransition } from "react";
import {
  saveFuneralCollections,
  loadFuneralCollectionEventDetail,
  deleteFuneralCollectionEvent,
  deleteFuneralCollectionRow,
  type FuneralCollectionSource,
  type FuneralSheetMember,
  type FuneralCollectionEventSummary,
} from "./actions";
import { useOnlineStatus } from "@/lib/useOnlineStatus";
import OfflineBanner from "@/app/components/OfflineBanner";

type FuneralSheetFormProps = {
  branchId: string;
  members: FuneralSheetMember[];
  pastEvents: FuneralCollectionEventSummary[];
};

type LoadedEvent = {
  eventDescription: string;
  collectionDate: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatKsh(value: number) {
  return `KSH ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(value)}`;
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default function FuneralSheetForm({ branchId, members, pastEvents }: FuneralSheetFormProps) {
  const [eventDescription, setEventDescription] = useState("");
  const [collectionDate, setCollectionDate] = useState(todayIso());
  const [amounts, setAmounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(members.map((member) => [member.memberId, ""]))
  );
  const [sources, setSources] = useState<Record<string, FuneralCollectionSource>>(() =>
    Object.fromEntries(members.map((member) => [member.memberId, "cash"]))
  );
  const [isSaving, startSaving] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const isOffline = !useOnlineStatus();

  // Set once an existing event's rows have been loaded into the form above, so
  // per-row "Remove" controls know which members actually have a saved entry to
  // delete, and deletes target the event's original identity rather than whatever
  // is currently typed in the description/date fields.
  const [loadedEvent, setLoadedEvent] = useState<LoadedEvent | null>(null);
  const [savedMemberIds, setSavedMemberIds] = useState<Set<string>>(new Set());
  const [isLoadingEvent, startLoadingEvent] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  const total = useMemo(
    () => Object.values(amounts).reduce((sum, value) => sum + toNumber(value), 0),
    [amounts]
  );

  function updateAmount(memberId: string, value: string) {
    setAmounts((current) => ({ ...current, [memberId]: value }));
  }

  function updateSource(memberId: string, value: FuneralCollectionSource) {
    setSources((current) => ({ ...current, [memberId]: value }));
  }

  function handleSaveAll() {
    setErrorMessage("");
    setSuccessMessage("");

    const descriptionAtSave = eventDescription;
    const dateAtSave = collectionDate;

    startSaving(async () => {
      const result = await saveFuneralCollections(
        branchId,
        descriptionAtSave,
        dateAtSave,
        members.map((member) => ({
          memberId: member.memberId,
          amount: amounts[member.memberId] ?? "",
          source: sources[member.memberId] ?? "cash",
        }))
      );

      if (result.status === "error") {
        setErrorMessage(result.message);
        return;
      }

      setSuccessMessage(result.message);

      // These rows now exist in the DB, so treat this as the loaded event going
      // forward - lets "Remove" appear on rows without a manual reload.
      setLoadedEvent({ eventDescription: descriptionAtSave, collectionDate: dateAtSave });
      setSavedMemberIds(
        new Set(members.filter((member) => toNumber(amounts[member.memberId] ?? "") > 0).map((member) => member.memberId))
      );
    });
  }

  function handleLoadEvent(event: FuneralCollectionEventSummary) {
    setErrorMessage("");
    setSuccessMessage("");

    startLoadingEvent(async () => {
      try {
        const rows = await loadFuneralCollectionEventDetail(branchId, event.eventDescription, event.collectionDate);

        setEventDescription(event.eventDescription);
        setCollectionDate(event.collectionDate);
        setAmounts(
          Object.fromEntries(
            members.map((member) => {
              const existing = rows.find((row) => row.memberId === member.memberId);
              return [member.memberId, existing ? existing.amount : ""];
            })
          )
        );
        setSources(
          Object.fromEntries(
            members.map((member) => {
              const existing = rows.find((row) => row.memberId === member.memberId);
              return [member.memberId, existing?.source ?? "cash"];
            })
          )
        );
        setLoadedEvent({ eventDescription: event.eventDescription, collectionDate: event.collectionDate });
        setSavedMemberIds(new Set(rows.map((row) => row.memberId)));
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to load this event.");
      }
    });
  }

  function handleDeleteEvent(event: FuneralCollectionEventSummary) {
    const confirmed = window.confirm(
      `Delete the entire "${event.eventDescription}" event on ${formatDate(event.collectionDate)}? This removes all ${event.memberCount} member entr${event.memberCount === 1 ? "y" : "ies"} totaling ${formatKsh(event.totalAmount)}. This cannot be undone.`
    );
    if (!confirmed) return;

    setErrorMessage("");
    setSuccessMessage("");

    startDeleting(async () => {
      const result = await deleteFuneralCollectionEvent(branchId, event.eventDescription, event.collectionDate);

      if (result.status === "error") {
        setErrorMessage(result.message);
        return;
      }

      setSuccessMessage(result.message);

      if (
        loadedEvent &&
        loadedEvent.eventDescription === event.eventDescription &&
        loadedEvent.collectionDate === event.collectionDate
      ) {
        setLoadedEvent(null);
        setSavedMemberIds(new Set());
        setAmounts(Object.fromEntries(members.map((member) => [member.memberId, ""])));
      }
    });
  }

  function handleRemoveRow(member: FuneralSheetMember) {
    if (!loadedEvent) return;

    const confirmed = window.confirm(
      `Remove ${member.memberName}'s entry from "${loadedEvent.eventDescription}" on ${formatDate(loadedEvent.collectionDate)}? This cannot be undone.`
    );
    if (!confirmed) return;

    setErrorMessage("");
    setSuccessMessage("");

    startDeleting(async () => {
      const result = await deleteFuneralCollectionRow(
        branchId,
        member.memberId,
        loadedEvent.eventDescription,
        loadedEvent.collectionDate
      );

      if (result.status === "error") {
        setErrorMessage(result.message);
        return;
      }

      setSuccessMessage(result.message);
      setSavedMemberIds((current) => {
        const next = new Set(current);
        next.delete(member.memberId);
        return next;
      });
      updateAmount(member.memberId, "");
    });
  }

  return (
    <>
      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="eventDescription" className="mb-2 block text-sm font-semibold text-[#0f1729]">
              Event Description
            </label>
            <input
              id="eventDescription"
              type="text"
              value={eventDescription}
              onChange={(event) => setEventDescription(event.target.value)}
              placeholder="e.g. Death of Jane's father"
              maxLength={200}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
            />
          </div>

          <div>
            <label htmlFor="collectionDate" className="mb-2 block text-sm font-semibold text-[#0f1729]">
              Collection Date
            </label>
            <input
              id="collectionDate"
              type="date"
              value={collectionDate}
              onChange={(event) => setCollectionDate(event.target.value)}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
            />
          </div>
        </div>
      </div>

      <OfflineBanner show={isOffline} className="mt-6" />

      {loadedEvent ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <span>
            Editing existing event: <span className="font-semibold">{loadedEvent.eventDescription}</span> (
            {formatDate(loadedEvent.collectionDate)})
          </span>
          <button
            type="button"
            onClick={() => {
              setLoadedEvent(null);
              setSavedMemberIds(new Set());
              setEventDescription("");
              setCollectionDate(todayIso());
              setAmounts(Object.fromEntries(members.map((member) => [member.memberId, ""])));
              setSources(Object.fromEntries(members.map((member) => [member.memberId, "cash"])));
            }}
            className="rounded px-2 py-1 text-xs font-semibold text-amber-900 underline-offset-2 hover:underline"
          >
            Start new event instead
          </button>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving || members.length === 0 || isOffline}
          className="inline-flex items-center rounded-lg bg-[#1d3a8a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#16306f] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving ? "Saving..." : "Save All"}
        </button>

        {successMessage ? (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
            <span>{successMessage}</span>
            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              className="rounded px-1 text-emerald-700 transition hover:bg-emerald-100"
              aria-label="Dismiss success message"
            >
              x
            </button>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage("")}
              className="rounded px-1 text-rose-700 transition hover:bg-rose-100"
              aria-label="Dismiss error message"
            >
              x
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        <div
          className="w-full overflow-x-auto"
          style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }}
        >
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">No.</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Name</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Member ID</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Amount</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Source</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                    No active members in this branch.
                  </td>
                </tr>
              ) : (
                members.map((member, index) => (
                  <tr key={member.memberId} className="hover:bg-slate-50/70">
                    <td className="px-3 py-3 text-sm text-slate-700">{member.sheetOrder ?? index + 1}</td>
                    <td className="px-3 py-3 text-sm font-medium text-[#0f1729]">{member.memberName}</td>
                    <td className="px-3 py-3 text-sm text-slate-700">{member.memberNo}</td>
                    <td className="px-3 py-3 text-sm text-slate-700">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={amounts[member.memberId] ?? ""}
                        onChange={(event) => updateAmount(member.memberId, event.target.value)}
                        placeholder="0.00"
                        className="w-32 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                      />
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-700">
                      <select
                        value={sources[member.memberId] ?? "cash"}
                        onChange={(event) => updateSource(member.memberId, event.target.value as FuneralCollectionSource)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
                      >
                        <option value="cash">Cash</option>
                        <option value="emergency_fund">From Emergency Fund</option>
                      </select>
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-700">
                      {savedMemberIds.has(member.memberId) ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(member)}
                          disabled={isDeleting}
                          className="rounded-lg border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Remove
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-[#f8fbff]">
              <tr>
                <td colSpan={4} className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Total
                </td>
                <td className="px-3 py-3 text-sm font-semibold text-[#0f1729]" colSpan={2}>
                  {formatKsh(total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold text-[#0f1729] [font-family:var(--font-uae-display)]">Past Events</h2>
        <p className="mt-1 text-sm text-slate-600">
          Load an existing event above to edit or remove individual entries, or delete an entire event at once.
        </p>

        {pastEvents.length === 0 ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-5 py-6 text-center text-sm text-slate-500">
            No collections recorded for this branch yet.
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }}>
              <table className="min-w-[640px] divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Event</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Date</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Total</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Members</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {pastEvents.map((event) => (
                    <tr key={`${event.eventDescription}|${event.collectionDate}`} className="hover:bg-slate-50/70">
                      <td className="px-3 py-3 text-sm font-medium text-[#0f1729]">{event.eventDescription}</td>
                      <td className="px-3 py-3 text-sm text-slate-700">{formatDate(event.collectionDate)}</td>
                      <td className="px-3 py-3 text-sm text-slate-700">{formatKsh(event.totalAmount)}</td>
                      <td className="px-3 py-3 text-sm text-slate-700">{event.memberCount}</td>
                      <td className="px-3 py-3 text-sm">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleLoadEvent(event)}
                            disabled={isLoadingEvent}
                            className="rounded-lg border border-[#1d3a8a]/30 px-2 py-1 text-xs font-semibold text-[#1d3a8a] transition hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isLoadingEvent ? "Loading..." : "Load / Edit"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(event)}
                            disabled={isDeleting}
                            className="rounded-lg border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Delete event
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
