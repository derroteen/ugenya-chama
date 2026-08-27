"use client";

import { useEffect } from "react";

/**
 * Registers the read-only offline-cache service worker (public/sw.js).
 * Rendered once from the root layout. No UI - this only runs the
 * registration side effect.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration failures (unsupported browser, dev server quirks, etc.)
      // should never break the app - offline caching is a progressive
      // enhancement, not a requirement.
    });
  }, []);

  return null;
}
