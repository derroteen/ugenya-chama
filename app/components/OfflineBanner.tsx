"use client";

/**
 * Small inline banner shown on write-action pages/forms when the browser is
 * offline. Does not block reading or navigation - only the caller's
 * save/submit buttons should be disabled alongside this.
 */
export default function OfflineBanner({
  show,
  className = "",
}: {
  show: boolean;
  className?: string;
}) {
  if (!show) return null;

  return (
    <div
      role="status"
      className={`flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-4 w-4 shrink-0"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3l18 18M8.5 8.5A9.94 9.94 0 002.6 12c.6 1.05 1.36 2 2.25 2.8m3.4 1.7A9.94 9.94 0 0012 17c1.1 0 2.16-.2 3.14-.56M12 7c3.6 0 6.85 1.9 8.65 4.8a10.4 10.4 0 01-1.6 2.05M12 11a1 1 0 011 1"
        />
      </svg>
      <span>You&apos;re offline. Reconnect to the internet to save changes.</span>
    </div>
  );
}
