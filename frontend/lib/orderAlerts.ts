"use client";

/**
 * Shared state for the "your order is out for delivery" alert.
 *
 * Extracted so the page-level hook and the app-wide watcher agree on what has already been
 * announced. Two components each keeping their own record would announce the same order
 * twice — once on the order page and again from the global watcher.
 */

const NOTIFIED_PREFIX = "ck.notified.outForDelivery.";

/** Written by checkout; the only durable handle we have on who the customer is. */
export const SAVED_DETAILS_KEY = "sprout-bowl-checkout-details";

/** Statuses after which nothing further will change, so polling can stop. */
export const TERMINAL_STATUSES = ["DELIVERED", "CANCELLED"];

export function alreadyNotified(orderId: number): boolean {
  try {
    return localStorage.getItem(NOTIFIED_PREFIX + orderId) !== null;
  } catch {
    // Private browsing and blocked site-data both throw. Failing "not yet notified" risks a
    // duplicate; failing "already notified" would silently drop the only alert the customer
    // gets. A repeat is the better failure.
    return false;
  }
}

export function markNotified(orderId: number) {
  try {
    localStorage.setItem(NOTIFIED_PREFIX + orderId, new Date().toISOString());
  } catch {
    // The alert has already been shown by the time this is called, which is what matters.
  }
}

export function savedCustomerPhone(): string | null {
  try {
    const raw = localStorage.getItem(SAVED_DETAILS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { customerPhone?: string };
    return parsed.customerPhone?.trim() || null;
  } catch {
    return null;
  }
}

/** A short two-tone chime, so the tab is noticeable without shipping an audio asset. */
export function playChime() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [880, 1170].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.18);
    });
  } catch {
    // Audio is a nicety; a browser that blocks it must not break the visible alert.
  }
}
