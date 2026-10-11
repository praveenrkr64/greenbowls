"use client";

import { useEffect, useRef, useState } from "react";
import { assignDeliveryAgent, getAdminDeliveryAgents, getOrders, getRestaurantInfo, updateOrderStatus } from "@/lib/api";
import { DeliveryAgentAdmin, OrderResponse } from "@/lib/types";
import AdminMenuManager from "@/components/AdminMenuManager";
import AdminCategoryManager from "@/components/AdminCategoryManager";
import AdminDeliverySlotManager from "@/components/AdminDeliverySlotManager";
import AdminExpenseManager from "@/components/AdminExpenseManager";
import AdminCustomerManager from "@/components/AdminCustomerManager";
import AdminCommunityManager from "@/components/AdminCommunityManager";
import AdminDeliveryAgentManager from "@/components/AdminDeliveryAgentManager";
import AdminPromoBannerManager from "@/components/AdminPromoBannerManager";
import AdminSubscriptionManager from "@/components/AdminSubscriptionManager";
import AdminCouponManager from "@/components/AdminCouponManager";
import AdminHeroSlideManager from "@/components/AdminHeroSlideManager";
import AdminRestaurantSettingsManager from "@/components/AdminRestaurantSettingsManager";
import OrderCard, { STATUS_FLOW, STATUS_LABEL } from "@/components/OrderCard";
import { BellIcon } from "@/components/icons";

const TABS = ["orders", "menu", "categories", "slots", "subscriptions", "coupons", "costs", "customers", "communities", "deliveryAgents", "settings"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABEL: Record<Tab, string> = {
  orders: "Orders",
  menu: "Menu",
  categories: "Categories",
  slots: "Slots",
  subscriptions: "Plans",
  coupons: "Coupons",
  costs: "Costs",
  customers: "Customers",
  communities: "Communities",
  deliveryAgents: "Agents",
  settings: "Settings",
};

const PAGE_SIZE = 20;
const NEW_ORDER_CHECK_MS = 5 * 60 * 1000; // 5 minutes

export default function AdminOrdersPage() {
  const [tab, setTab] = useState<Tab>("orders");
  // Only used to word the WhatsApp message ("your Green Bowls order #12 is out for delivery").
  const [restaurantName, setRestaurantName] = useState("");
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ACTIVE");
  const [sortBy, setSortBy] = useState<"newest" | "community">("newest");
  const [page, setPage] = useState(0);
  const [agents, setAgents] = useState<DeliveryAgentAdmin[]>([]);
  const [newOrderAlert, setNewOrderAlert] = useState<{ count: number } | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const audioCtxRef = useRef<AudioContext | null>(null);

  async function load() {
    try {
      const data = await getOrders({ filter, sortBy, page, size: PAGE_SIZE });
      setOrders(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
      setError(null);
    } catch {
      setError("Couldn't load orders. Retrying...");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getRestaurantInfo().then((i) => setRestaurantName(i.name)).catch(() => setRestaurantName(""));
  }, []);

  useEffect(() => {
    load();
    // Poll for new orders every 20s since there's no push notification yet.
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, sortBy, page]);

  useEffect(() => {
    getAdminDeliveryAgents().then(setAgents).catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setNotifPermission(Notification.permission);
    }
  }, []);

  function ensureAudioContext(): AudioContext | null {
    if (typeof window === "undefined" || !window.AudioContext) return null;
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    return audioCtxRef.current;
  }

  // A ~2s ring of repeated chime notes, synthesized rather than an audio file -
  // no asset to ship. Only ever called when the popup first appears (see the
  // single call site in checkForNewOrders below) - never on dismiss/View, so it
  // doesn't sound again just because the admin closed or acted on the alert.
  function playAlertSound() {
    try {
      const ctx = ensureAudioContext();
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;
      const RING_DURATION_SEC = 2;
      const NOTE_GAP_SEC = 0.4;
      const chimeStarts: number[] = [];
      for (let t = 0; t < RING_DURATION_SEC; t += NOTE_GAP_SEC) chimeStarts.push(t);

      chimeStarts.forEach((chimeStart) => {
        [0, 0.18].forEach((offset, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = i === 0 ? 880 : 1175; // A5, then D6
          const start = now + chimeStart + offset;
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.18);
        });
      });
    } catch {
      // Autoplay restrictions or an unsupported browser - the popup and desktop
      // notification still get the admin's attention either way.
    }
  }

  // Browsers block audio until the page has seen a user gesture. Unlock the
  // audio context on the admin's first click anywhere, so the 5-minute checks
  // that follow (which aren't themselves user-initiated) are actually allowed
  // to play sound instead of silently failing every time.
  useEffect(() => {
    function unlock() {
      const ctx = ensureAudioContext();
      if (ctx?.state === "suspended") ctx.resume();
    }
    document.addEventListener("click", unlock, { once: true });
    return () => document.removeEventListener("click", unlock);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Independent of which tab is open or the Orders filter/sort/page - a kitchen
  // admin might be sitting on the Menu tab when a new order comes in and needs
  // to know regardless. Checks immediately on load, then every 5 minutes; keeps
  // nagging (re-shows the popup, re-fires the browser notification) as long as
  // there's still at least one NEW order, since that's the whole point - an
  // order that's been sitting unconfirmed shouldn't quietly go unnoticed.
  useEffect(() => {
    async function checkForNewOrders() {
      try {
        const data = await getOrders({ filter: "NEW", sortBy: "newest", page: 0, size: 1 });
        if (data.totalElements > 0) {
          setNewOrderAlert({ count: data.totalElements });
          playAlertSound();
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("New orders waiting", {
              body: `${data.totalElements} order${data.totalElements > 1 ? "s" : ""} need confirming.`,
            });
          }
        }
      } catch {
        // Silent - a failed background check shouldn't itself nag the admin.
      }
    }
    checkForNewOrders();
    const interval = setInterval(checkForNewOrders, NEW_ORDER_CHECK_MS);
    return () => clearInterval(interval);
  }, []);

  function requestNotificationPermission() {
    if (typeof Notification === "undefined") return;
    Notification.requestPermission().then(setNotifPermission);
  }

  function handleViewNewOrders() {
    setTab("orders");
    handleFilterChange("NEW");
    setNewOrderAlert(null);
  }

  // Changing the filter or sort invalidates the current page's meaning - always
  // jump back to the first page rather than showing a now-mismatched page number.
  function handleFilterChange(next: string) {
    setFilter(next);
    setPage(0);
  }

  function handleSortChange(next: "newest" | "community") {
    setSortBy(next);
    setPage(0);
  }

  async function handleStatusChange(id: number, status: string) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      await updateOrderStatus(id, status);
    } catch {
      load(); // revert to server truth on failure
    }
  }

  async function handleAssignAgent(id: number, agentId: number | null) {
    const agent = agents.find((a) => a.id === agentId) || null;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? { ...o, deliveryAgentId: agent?.id ?? null, deliveryAgentName: agent?.name ?? null, deliveryAgentPhone: agent?.phone ?? null }
          : o
      )
    );
    try {
      await assignDeliveryAgent(id, agentId);
    } catch {
      load(); // revert to server truth on failure
    }
  }

  return (
    <main className="min-h-screen pb-16 max-w-3xl mx-auto">
      <header className="px-5 pt-8 pb-4 border-b border-line flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-sprout">Admin</p>
          <h1 className="font-display text-2xl font-semibold text-ink">{TAB_LABEL[tab]}</h1>
        </div>
        <div className="flex items-center gap-3">
          {tab === "orders" && (
            <span className="font-mono text-sm text-ink-soft">{totalElements} total</span>
          )}
          {notifPermission === "default" && (
            <button
              onClick={requestNotificationPermission}
              className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-leaf-pale"
            >
              <BellIcon className="h-3.5 w-3.5" />
              Enable alerts
            </button>
          )}
          {notifPermission === "granted" && (
            <span className="flex items-center gap-1 text-sprout-dark" title="Desktop notifications on for new orders">
              <BellIcon className="h-4 w-4" />
            </span>
          )}
        </div>
      </header>

      {newOrderAlert && (
        <div className="fixed inset-x-0 top-3 z-50 flex justify-center px-4">
          <div className="flex items-center gap-3 rounded-2xl bg-ink text-paper-raised shadow-fresh px-4 py-3 max-w-md w-full">
            <span className="h-2.5 w-2.5 rounded-full bg-turmeric shrink-0 animate-pulse" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">
                {newOrderAlert.count} new order{newOrderAlert.count > 1 ? "s" : ""} waiting
              </p>
              <p className="text-xs text-paper-raised/70">Tap to review and confirm.</p>
            </div>
            <button
              onClick={handleViewNewOrders}
              className="shrink-0 rounded-full bg-paper-raised text-ink font-semibold text-xs px-3 py-1.5"
            >
              View
            </button>
            <button
              onClick={() => setNewOrderAlert(null)}
              aria-label="Dismiss"
              className="shrink-0 text-paper-raised/70 hover:text-paper-raised"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M5 5l10 10M15 5 5 15" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="px-5 mt-4 flex gap-2 overflow-x-auto pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold border ${
              tab === t ? "bg-ink text-paper-raised border-ink" : "border-line text-ink-soft"
            }`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {tab === "menu" && <AdminMenuManager />}

      {tab === "categories" && <AdminCategoryManager />}

      {tab === "slots" && <AdminDeliverySlotManager />}

      {tab === "subscriptions" && <AdminSubscriptionManager />}

      {tab === "coupons" && <AdminCouponManager />}

      {tab === "costs" && <AdminExpenseManager />}

      {tab === "customers" && <AdminCustomerManager />}

      {tab === "communities" && <AdminCommunityManager />}

      {tab === "deliveryAgents" && <AdminDeliveryAgentManager />}

      {tab === "settings" && (
        <div className="px-5 mt-4">
          <AdminHeroSlideManager />
          <AdminRestaurantSettingsManager />
          <AdminPromoBannerManager />
        </div>
      )}

      {tab === "orders" && (
        <>
          <div className="px-5 mt-4 flex gap-2 overflow-x-auto pb-2">
            {["ACTIVE", "ALL", ...STATUS_FLOW].map((f) => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold border ${
                  filter === f
                    ? "bg-ink text-paper-raised border-ink"
                    : "border-line text-ink-soft"
                }`}
              >
                {f === "ACTIVE" ? "Active" : f === "ALL" ? "All" : STATUS_LABEL[f]}
              </button>
            ))}
          </div>

          <div className="px-5 mt-3 flex items-center gap-2">
            <span className="text-xs text-ink-soft">Sort:</span>
            {(["newest", "community"] as const).map((s) => (
              <button
                key={s}
                onClick={() => handleSortChange(s)}
                className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                  sortBy === s ? "bg-ink text-paper-raised border-ink" : "border-line text-ink-soft"
                }`}
              >
                {s === "newest" ? "Newest first" : "By community"}
              </button>
            ))}
          </div>

          {error && <p className="px-5 mt-4 text-sm text-clay">{error}</p>}
          {loading && <p className="px-5 mt-6 text-sm text-ink-soft">Loading orders...</p>}

          <div className="px-5 mt-4 space-y-4">
            {orders.map((order, i) => {
              const showGroupHeader =
                sortBy === "community" && (i === 0 || orders[i - 1].communityName !== order.communityName);
              return (
                <div key={order.id}>
                  {showGroupHeader && (
                    <p
                      className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide mb-2"
                      style={{ color: order.communityColor }}
                    >
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: order.communityColor }} />
                      {order.communityName}
                    </p>
                  )}
                  <OrderCard
                    order={order}
                    onStatusChange={handleStatusChange}
                    agents={agents.filter((a) => a.active)}
                    onAssignAgent={handleAssignAgent}
                    restaurantName={restaurantName}
                    onOrderUpdated={() => load()}
                  />
                </div>
              );
            })}

            {!loading && orders.length === 0 && (
              <p className="text-sm text-ink-soft text-center py-10">No orders in this view.</p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="px-5 mt-6 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-full px-4 py-1.5 text-xs font-semibold border border-line text-ink-soft disabled:opacity-30"
              >
                Previous
              </button>
              <span className="text-xs text-ink-soft">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-full px-4 py-1.5 text-xs font-semibold border border-line text-ink-soft disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
