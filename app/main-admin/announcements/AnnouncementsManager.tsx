"use client";

import { useMemo, useState } from "react";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncementsForAdmin,
  updateAnnouncement,
  type AnnouncementRecord,
} from "./actions";

type AnnouncementEditorState = {
  id?: string;
  title: string;
  body: string;
  targetType: "all" | "branches";
  branchIds: string[];
};

function AnnouncementForm({
  initialState,
  onSubmit,
  onCancel,
  submitLabel,
  branchOptions,
}: {
  initialState: AnnouncementEditorState;
  onSubmit: (state: AnnouncementEditorState) => Promise<void>;
  onCancel?: () => void;
  submitLabel: string;
  branchOptions: Array<{ id: string; name: string }>;
}) {
  const [state, setState] = useState(initialState);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleBranch(branchId: string) {
    setState((current) => ({
      ...current,
      branchIds: current.branchIds.includes(branchId)
        ? current.branchIds.filter((id) => id !== branchId)
        : [...current.branchIds, branchId],
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await onSubmit(state);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save the announcement.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedBranchesLabel = useMemo(
    () =>
      state.branchIds.length > 0
        ? `${state.branchIds.length} branch${state.branchIds.length === 1 ? "" : "es"} selected`
        : "No branches selected",
    [state.branchIds]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-800">Title</label>
        <input
          value={state.title}
          onChange={(event) => setState((current) => ({ ...current, title: event.target.value }))}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#1d3a8a]/10"
          placeholder="Weekly member update"
          required
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-800">Message</label>
        <textarea
          value={state.body}
          onChange={(event) => setState((current) => ({ ...current, body: event.target.value }))}
          rows={5}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#1d3a8a]/10"
          placeholder="Share the update for members..."
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-800">Target audience</label>
        <div className="flex flex-wrap gap-3">
          <label className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
            <input
              type="radio"
              checked={state.targetType === "all"}
              onChange={() => setState((current) => ({ ...current, targetType: "all", branchIds: [] }))}
            />
            All Members
          </label>

          <label className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
            <input
              type="radio"
              checked={state.targetType === "branches"}
              onChange={() => setState((current) => ({ ...current, targetType: "branches" }))}
            />
            Specific Branches
          </label>
        </div>
      </div>

      {state.targetType === "branches" ? (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-700">Select branches</p>
            <span className="text-xs text-slate-500">{selectedBranchesLabel}</span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {branchOptions.map((branch) => {
              const isChecked = state.branchIds.includes(branch.id);

              return (
                <label key={branch.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleBranch(branch.id)}
                  />
                  {branch.name}
                </label>
              );
            })}
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-lg bg-[#0f1729] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d3a8a] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>

        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

export default function AnnouncementsManager({
  initialAnnouncements,
  branchOptions,
}: {
  initialAnnouncements: AnnouncementRecord[];
  branchOptions: Array<{ id: string; name: string }>;
}) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [editor, setEditor] = useState<AnnouncementEditorState | null>(null);

  async function handleCreate(state: AnnouncementEditorState) {
    const result = await createAnnouncement({
      title: state.title,
      body: state.body,
      targetType: state.targetType,
      branchIds: state.branchIds,
    });

    if (result.success) {
      const refreshed = await getAnnouncementsForAdmin();
      setAnnouncements(refreshed);
      setEditor(null);
    }
  }

  async function handleUpdate(state: AnnouncementEditorState) {
    if (!state.id) return;

    const result = await updateAnnouncement({
      id: state.id,
      title: state.title,
      body: state.body,
      targetType: state.targetType,
      branchIds: state.branchIds,
    });

    if (result.success) {
      const refreshed = await getAnnouncementsForAdmin();
      setAnnouncements(refreshed);
      setEditor(null);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Delete this announcement?");
    if (!confirmed) {
      return;
    }

    const result = await deleteAnnouncement(id);
    if (result.success) {
      const refreshed = await getAnnouncementsForAdmin();
      setAnnouncements(refreshed);
    }
  }

  return (
    <div className="mt-8 space-y-8">
      {editor ? (
        <AnnouncementForm
          initialState={editor}
          submitLabel={editor.id ? "Update Announcement" : "Create Announcement"}
          onSubmit={editor.id ? handleUpdate : handleCreate}
          onCancel={() => setEditor(null)}
          branchOptions={branchOptions}
        />
      ) : (
        <button
          type="button"
          onClick={() =>
            setEditor({
              title: "",
              body: "",
              targetType: "all",
              branchIds: [],
            })
          }
          className="inline-flex items-center justify-center rounded-lg bg-[#0f1729] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d3a8a]"
        >
          New Announcement
        </button>
      )}

      <section>
        <h2 className="text-2xl font-semibold text-[#0f1729] [font-family:var(--font-uae-display)]">Current Announcements</h2>

        {announcements.length === 0 ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-5 py-6 text-slate-600">
            No announcements created yet.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {announcements.map((announcement) => (
              <article key={announcement.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-[#0f1729]">{announcement.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {announcement.targetType === "all" ? "All Members" : `Branches: ${announcement.branchNames.join(", ") || "Selected branches"}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEditor({
                          id: announcement.id,
                          title: announcement.title,
                          body: announcement.body,
                          targetType: announcement.targetType,
                          branchIds: announcement.branchIds,
                        })
                      }
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(announcement.id)}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{announcement.body}</p>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span>Created: {new Date(announcement.createdAt).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}</span>
                  <span>Updated: {new Date(announcement.updatedAt).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
