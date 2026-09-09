"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getMyRecentOrders } from "@/lib/api";
import { OrderResponse } from "@/lib/types";
import {
  alreadyNotified,
  markNotified,
  playChime,
  savedCustomerPhone,
  TERMINAL_STATUSES,
} from "@/lib/orderAlerts";

/**
 * Watches the customer's own orders from ANY page and announces when one goes out for delivery.
 *
 * <p>This lives in the root layout rather than on the order page because that is where the
 * customer actually is. The confirmation page is somewhere people glance at once and leave;
 * they then browse the menu, or sit on the cart, or leave the tab open on the home page. An
 * alert that only works on /order/[id] therefore misses the normal case entirely — which is
 * exactly what happened.
 *
 * <p>It is NOT a replacement for Web Push. This covers "the tab is open, somewhere in the
 * app"; push covers "the tab is closed". Both are needed, and both honour the same
 * already-notified record so the customer is told once, not twice.
 */

const POLL_MS = 20_000;

export default function OrderAlertWatcher() {
  const [announced, setAnnounced] = useState<OrderResponse | null>(null);
  const [dismissed, setDismissed] = useState(false);
  // Guards a double-announce within one mount, e.g. two polls resolving together.
  const firedRef = useRef(false);

  const check = useCallback(async () => {
    const phone = savedCustomerPhone();
    if (!phone) return true; // nothing to watch; tell the caller to stop polling

    let orders: OrderResponse[];
    try {
      orders = await getMyRecentOrders(phone);
    } catch {
      return false; // transient: keep polling rather than giving up on one failed request
    }

    const active = orders.filter((o) => !TERMINAL_STATUSES.includes(o.status));

    const outForDelivery = orders.find(
      (o) => o.status === "OUT_FOR_DELIVERY" && !alreadyNotified(o.id),
    );
    if (outForDelivery && !firedRef.current) {
      firedRef.current = true;
      markNotified(outForDelivery.id);
      setAnnounced(outForDelivery);
      setDismissed(false);
      playChime();
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("Your order is on the way", {
          body: `Order #${outForDelivery.id} has left the kitchen and is out for delivery.`,
          tag: `ck-order-${outForDelivery.id}`,
        });
      }
    }

    // Stop once nothing is in flight. This component is mounted on every page, so polling
    // forever would mean a request every 20s for every visitor who has ever ordered --
    // including ones just browsing the menu months later.
    return active.length === 0;
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      const done = await check();
      if (cancelled || done) return;
      timer = setTimeout(tick, POLL_MS);
    };
    tick();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [check]);

  if (!announced || dismissed) return null;

  return (
    // Fixed rather than inline: this renders on whatever page the customer happens to be on,
    // and must not push that page's layout around.
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 pointer-events-none">
      <div className="max-w-lg mx-auto pointer-events-auto">
        <div className="bg-sprout text-white rounded-2xl p-4 flex items-start gap-3 shadow-fresh">
          <span className="text-xl leading-none" aria-hidden="true">
            &#128663;
          </span>
          <div className="flex-1">
            <p className="font-display font-semibold">Your order is on the way</p>
            <p className="text-sm text-white/90 mt-0.5">
              Order #{announced.id} has left the kitchen and is out for delivery.
            </p>
            <Link
              href={`/order/${announced.id}`}
              className="inline-block text-sm font-semibold underline underline-offset-2 mt-1.5"
            >
              View order
            </Link>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-white/80 hover:text-white text-sm px-2"
            aria-label="Dismiss"
          >
            &#10005;
          </button>
        </div>
      </div>
    </div>
  );
}
