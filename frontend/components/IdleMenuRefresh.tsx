"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const;

// Refetches this page's server data (menu, prices, promo banner) after 15 minutes
// with no interaction - a customer who leaves the tab open shouldn't keep looking
// at a stale menu if the admin changes prices/availability while they're idle.
// router.refresh() re-runs the server component fetch without a full page reload,
// so scroll position and client-side state (cart, accordion state) are preserved.
export default function IdleMenuRefresh() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function scheduleRefresh() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        router.refresh();
        // Keep refreshing every 15 min for as long as the tab stays open and idle.
        scheduleRefresh();
      }, IDLE_TIMEOUT_MS);
    }

    scheduleRefresh();
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, scheduleRefresh, { passive: true }));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, scheduleRefresh));
    };
  }, [router]);

  return null;
}
