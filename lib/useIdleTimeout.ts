"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const IDLE_TIMEOUT_MS = 60 * 60 * 1000;
const SESSION_EXPIRED_MESSAGE = "Your session expired due to inactivity. Please log in again.";

export function useIdleTimeout() {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSigningOutRef = useRef(false);

  const signOutAndRedirect = useCallback(async () => {
    if (isSigningOutRef.current) {
      return;
    }

    isSigningOutRef.current = true;

    try {
      const supabase = createClient();
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // Ignore sign-out errors and continue to the login page.
    }

    router.push(`/login?message=${encodeURIComponent(SESSION_EXPIRED_MESSAGE)}`);
  }, [router]);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      void signOutAndRedirect();
    }, IDLE_TIMEOUT_MS);
  }, [signOutAndRedirect]);

  useEffect(() => {
    const handleActivity = () => {
      resetTimer();
    };

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "keydown",
      "click",
      "touchstart",
      "touchmove",
      "scroll",
    ];

    events.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    });

    resetTimer();

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resetTimer]);
}
