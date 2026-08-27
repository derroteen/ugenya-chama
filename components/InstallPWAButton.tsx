"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

/**
 * Shows an "Install App" button only when the browser has actually fired
 * beforeinstallprompt (i.e. it has decided the site is installable). Hidden
 * entirely otherwise - already installed, or the browser doesn't support it.
 */
export default function InstallPWAButton({ className = "" }: { className?: string }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setInstallPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (!installPrompt) {
    return null;
  }

  async function handleInstallClick() {
    if (!installPrompt) return;

    setIsInstalling(true);

    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } finally {
      setInstallPrompt(null);
      setIsInstalling(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleInstallClick}
      disabled={isInstalling}
      className={
        className ||
        "inline-flex items-center gap-2 rounded-md border border-[#1d3a8a] bg-white px-5 py-2.5 text-base font-semibold text-[#1d3a8a] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      }
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v13m0 0l-4-4m4 4l4-4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
      </svg>
      {isInstalling ? "Installing..." : "Install App"}
    </button>
  );
}
