"use client";

import { useState, useTransition } from "react";
import { pdf } from "@react-pdf/renderer";
import BlankCollectionSheetDocument from "./BlankCollectionSheetDocument";
import { generateBlankCollectionSheet } from "./blank-sheet-actions";

type DownloadBlankSheetButtonProps = {
  branchId: string;
};

export default function DownloadBlankSheetButton({ branchId }: DownloadBlankSheetButtonProps) {
  const [isGenerating, startGenerating] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");

  function handleClick() {
    setErrorMessage("");

    startGenerating(() => {
      void (async () => {
        try {
          const sheet = await generateBlankCollectionSheet(branchId);
          const blob = await pdf(<BlankCollectionSheetDocument sheet={sheet} />).toBlob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");

          link.href = url;
          link.download = `UAE-${sheet.branchName.replace(/\s+/g, "-")}-Blank-Sheet.pdf`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to generate the blank sheet.");
        }
      })();
    });
  }

  return (
    <div className="inline-flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isGenerating}
        className="inline-flex items-center justify-center rounded-lg border border-[#1d3a8a]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#0f1729] transition hover:border-[#1d3a8a]/35 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isGenerating ? "Generating..." : "Download Blank Sheet"}
      </button>

      {errorMessage ? <p className="text-sm font-medium text-rose-700">{errorMessage}</p> : null}
    </div>
  );
}
