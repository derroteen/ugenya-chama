"use client";

import { useState } from "react";
import { deleteMember } from "./actions";
import { useOnlineStatus } from "@/lib/useOnlineStatus";
import OfflineBanner from "@/app/components/OfflineBanner";

type DeleteMemberButtonProps = {
  memberId: string;
  memberName: string;
  memberNumber: string;
};

export default function DeleteMemberButton({
  memberId,
  memberName,
  memberNumber,
}: DeleteMemberButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isOffline = !useOnlineStatus();

  async function handleDelete() {
    setIsDeleting(true);
    setErrorMessage("");

    try {
      await deleteMember(memberId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to delete the member right now.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center justify-center rounded-lg border border-red-300 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:border-red-400 hover:bg-red-100"
        >
          Delete Member
        </button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-600">Warning</p>
                <h2 className="mt-2 text-2xl font-bold text-[#0f1729] [font-family:var(--font-uae-display)]">
                  Delete Member
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close delete dialog"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-lg font-semibold text-[#0f1729]">{memberName}</p>
              <p className="mt-1 text-sm font-medium text-red-700">{memberNumber}</p>
            </div>

            <p className="mt-5 text-sm leading-6 text-slate-700">
              This will permanently remove this member from the system. Their Member ID will be recycled and assigned to the next new member. This cannot be undone.
            </p>

            {errorMessage ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <OfflineBanner show={isOffline} className="mt-4" />

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#0f1729] transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting || isOffline}
                onClick={handleDelete}
                className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
