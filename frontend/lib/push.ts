"use client";

import { API_BASE } from "./api";

/**
 * Web Push subscription for the customer's order.
 *
 * Push is what reaches a customer who has CLOSED the app. The in-page banner on the order
 * page only fires while that page is open, which is the minority of the time between placing
 * an order and it arriving.
 */

export type PushSupport =
  | "ready"          // subscribed, nothing more to do
  | "askable"        // supported and not yet decided -- show the opt-in
  | "denied"         // the customer said no, or the browser blocks it; unrecoverable in-app
  | "ios-needs-install"  // Safari on iOS: push only works once added to the Home Screen
  | "unsupported"    // no service worker / PushManager at all
  | "disabled";      // the server has no VAPID keys configured

/**
 * Base64url -> bytes, the form PushManager.subscribe expects for the VAPID key.
 *
 * Returns ArrayBuffer rather than Uint8Array: TypeScript's DOM types require a BufferSource
 * backed by a plain ArrayBuffer, and a Uint8Array is typed as possibly backed by a
 * SharedArrayBuffer, which is not assignable.
 */
function urlBase64ToBytes(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalised = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalised);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buffer;
}

function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/** True when the page is running as an installed app rather than a Safari tab. */
function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari's own non-standard flag, which is the only one it sets on iOS.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export async function getPushSupport(): Promise<PushSupport> {
  if (typeof window === "undefined") return "unsupported";

  // iOS is checked BEFORE feature detection on purpose. Safari in a plain tab exposes
  // neither PushManager nor a usable Notification API, so the generic check would report
  // "unsupported" and the customer would be told their phone cannot do this at all -- when
  // in fact it can, once the site is added to the Home Screen. That distinction is the
  // difference between a dead end and an instruction.
  if (isIos() && !isStandalone()) return "ios-needs-install";

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported";
  if (typeof Notification === "undefined") return "unsupported";

  try {
    const res = await fetch(`${API_BASE}/api/push/config`);
    const config = await res.json();
    if (!config.enabled) return "disabled";
  } catch {
    return "disabled";
  }

  if (Notification.permission === "denied") return "denied";

  const registration = await navigator.serviceWorker.getRegistration();
  const existing = await registration?.pushManager.getSubscription();
  if (existing && Notification.permission === "granted") return "ready";

  return "askable";
}

/**
 * Asks permission, subscribes, and registers the subscription against this order.
 *
 * Returns false rather than throwing when the customer declines: saying no is a normal
 * answer, not an error, and the page should carry on quietly.
 */
export async function subscribeToOrderPush(orderId: number): Promise<boolean> {
  try {
    const configRes = await fetch(`${API_BASE}/api/push/config`);
    const config = await configRes.json();
    if (!config.enabled || !config.publicKey) return false;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    // Registered here rather than on page load: a service worker installed before the
    // customer has shown any interest is a background download they did not ask for.
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        // Required to be true by every browser: a push that shows no notification is not
        // permitted, and passing false makes subscribe() reject outright.
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToBytes(config.publicKey),
      }));

    const json = subscription.toJSON() as { endpoint?: string; keys?: { p256dh: string; auth: string } };
    if (!json.endpoint || !json.keys) return false;

    await fetch(`${API_BASE}/api/push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      }),
    });
    return true;
  } catch {
    return false;
  }
}
