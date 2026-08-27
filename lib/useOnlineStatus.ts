"use client";

import { useSyncExternalStore } from "react";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);
  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

// The server has no network status of its own - assume online so the first
// render matches the client's initial (pre-hydration) snapshot too.
function getServerSnapshot() {
  return true;
}

/**
 * Tracks the browser's online/offline state via navigator.onLine plus the
 * "online"/"offline" window events, using useSyncExternalStore so reads stay
 * correctly synchronized without any effect+setState round trip.
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
