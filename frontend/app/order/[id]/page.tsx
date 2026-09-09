"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { cancelOrder, getOrder } from "@/lib/api";
import { OrderResponse } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { StatusBadge } from "@/components/OrderCard";
import SiteHeader from "@/components/SiteHeader";
import { getPushSupport, subscribeToOrderPush, PushSupport } from "@/lib/push";
import { TERMINAL_STATUSES } from "@/lib/orderAlerts";

export default function OrderConfirmationPage() {
  const params = useParams();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [pushSupport, setPushSupport] = useState<PushSupport>("unsupported");
  const [subscribing, setSubscribing] = useState(false);

  const orderId = Number(params.id);
  // The out-for-delivery announcement itself belongs to OrderAlertWatcher, which runs on
  // every page. This page only needs to know whether the order is still in flight, to
  // decide whether polling and the push opt-in are still worth showing.
  const isTerminal = order != null && TERMINAL_STATUSES.includes(order.status);

  const refresh = useCallback(
    () => getOrder(orderId).then(setOrder).catch(() => {}),
    [orderId],
  );

  useEffect(() => {
    getOrder(orderId)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderId]);

  // Poll so the customer is told their food is on the way without having to refresh. The
  // page fetched once before, which meant the OUT_FOR_DELIVERY moment could only ever be
  // discovered by the customer reloading at the right time.
  //
  // Stops on DELIVERED/CANCELLED: nothing further will change, and this link stays open on
  // people's phones long after the food arrives -- polling forever would be a request every
  // 20s per abandoned tab, for nothing.
  useEffect(() => {
    getPushSupport().then(setPushSupport);
  }, []);

  async function handleEnablePush() {
    setSubscribing(true);
    const ok = await subscribeToOrderPush(orderId);
    setPushSupport(ok ? "ready" : "denied");
    setSubscribing(false);
  }

  useEffect(() => {
    if (isTerminal) return;
    const timer = setInterval(refresh, 20_000);
    return () => clearInterval(timer);
  }, [refresh, isTerminal]);

  async function handleCancel() {
    if (!order || !confirm("Cancel this order? This can't be undone.")) return;
    setCancelling(true);
    try {
      const updated = await cancelOrder(order.id, order.customerPhone);
      setOrder(updated);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Couldn't cancel this order.");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen">
        <SiteHeader title="Order confirmed" />
        <div className="flex items-center justify-center py-24">
          <p className="text-ink-soft">Loading your order...</p>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen">
        <SiteHeader title="Order confirmed" />
        <div className="flex flex-col items-center justify-center px-6 text-center py-24">
          <p className="font-display text-2xl text-ink mb-2">Order placed!</p>
          <p className="text-ink-soft text-sm mb-6">
            We&rsquo;ll call you shortly to confirm. Save this order number: #{params.id}
          </p>
          <Link href="/" className="rounded-full bg-sprout text-paper-raised font-semibold px-6 py-3">
            Back to menu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-16 max-w-lg mx-auto">
      <SiteHeader title="Order confirmed" />
      <div className="text-center pt-10 pb-6 px-5">
        <p className="font-mono text-xs uppercase tracking-widest text-sprout">Order confirmed</p>
        <h1 className="font-display text-3xl font-semibold text-ink mt-1">Thank you, {order.customerName.split(" ")[0]}!</h1>
        <p className="text-ink-soft text-sm mt-2">
          We&rsquo;ll call {order.customerPhone} shortly to confirm before we start cooking.
        </p>
      </div>

      {/* The out-for-delivery banner is rendered app-wide by OrderAlertWatcher, not here.
          Duplicating it on this page would announce the same order twice whenever the
          customer happened to be looking at it. */}

      {/* Only while the order is still in flight -- asking after delivery is pointless. */}
      {!isTerminal && (
        <div className="px-5 pb-3">
          {pushSupport === "askable" && (
            <button
              onClick={handleEnablePush}
              disabled={subscribing}
              className="w-full text-sm text-sprout-dark border border-sprout/40 bg-leaf-pale rounded-xl py-2.5 font-medium disabled:opacity-60"
            >
              {subscribing ? "Setting up..." : "Notify me when my order is out for delivery"}
            </button>
          )}

          {pushSupport === "ready" && (
            <p className="text-xs text-ink-soft text-center">
              You will be notified when this order is out for delivery, even if you close this page.
            </p>
          )}

          {/* iOS cannot do push from a Safari tab -- only from an installed app. Saying so is
              the difference between an instruction and an apparent dead end. */}
          {pushSupport === "ios-needs-install" && (
            <p className="text-xs text-ink-soft text-center">
              To get notified when your order is on the way, tap Share and then
              &ldquo;Add to Home Screen&rdquo;, then open this order from there.
            </p>
          )}

          {/* denied is unrecoverable from inside the page: the browser will not re-prompt. */}
          {pushSupport === "denied" && (
            <p className="text-xs text-ink-soft text-center">
              Notifications are blocked for this site. You can re-enable them in your browser
              settings, or keep this page open to see updates here.
            </p>
          )}
        </div>
      )}

      <div className="px-5">
        <div className="bg-paper-raised border border-line rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-ink-soft uppercase tracking-wide">Order #{order.id}</span>
            <StatusBadge status={order.status} />
          </div>

          <div className="ticket-rule my-4" />

          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-start justify-between text-sm">
                <div>
                  <p className="text-ink font-medium">
                    {item.quantity} &times; {item.menuItemName}
                  </p>
                  {item.selections.length > 0 && (
                    <p className="text-ink-soft text-xs mt-0.5">{item.selections.join(", ")}</p>
                  )}
                </div>
                <span className="font-mono text-ink">{formatPrice(item.lineTotal)}</span>
              </div>
            ))}
          </div>

          <div className="ticket-rule my-4" />

          {order.discountAmount > 0 && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">Subtotal</span>
                <span className="font-mono text-ink-soft">{formatPrice(order.subtotalAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-sprout-dark">{order.discountReason || "Discount"}</span>
                <span className="font-mono text-sprout-dark">&minus;{formatPrice(order.discountAmount)}</span>
              </div>
              <div className="ticket-rule my-3" />
            </>
          )}

          <div className="flex items-center justify-between">
            <span className="font-semibold text-ink">Total</span>
            <span className="font-mono text-lg text-ink">{formatPrice(order.totalAmount)}</span>
          </div>

          <div className="ticket-rule my-4" />

          <p className="text-xs text-ink-soft">
            Delivering to: {order.communityName}, {order.tower}, Flat {order.flatNumber}
          </p>
          {order.notes && <p className="text-xs text-ink-soft mt-1">Note: {order.notes}</p>}

          {(order.status === "NEW" || order.status === "CONFIRMED") && (
            <>
              <div className="ticket-rule my-4" />
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full rounded-full border border-clay text-clay font-semibold text-sm py-2.5 disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Cancel order"}
              </button>
            </>
          )}
        </div>

        <Link
          href="/"
          className="block text-center mt-6 rounded-xl border border-line text-ink font-semibold py-3.5 hover:border-sprout transition-colors"
        >
          Order more
        </Link>
      </div>
    </main>
  );
}
