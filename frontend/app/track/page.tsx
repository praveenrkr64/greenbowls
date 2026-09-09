"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { cancelOrder, getMyRecentOrders } from "@/lib/api";
import { OrderResponse } from "@/lib/types";
import CustomerOrderCard from "@/components/CustomerOrderCard";
import SiteHeader from "@/components/SiteHeader";

export default function TrackOrdersPage() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<OrderResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  async function handleLookup(e: FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getMyRecentOrders(phone.trim());
      setOrders(data);
    } catch {
      setError("Couldn't look up orders for that number right now.");
      setOrders(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(order: OrderResponse) {
    if (!confirm(`Cancel order #${order.id}? This can't be undone.`)) return;
    setCancellingId(order.id);
    try {
      const updated = await cancelOrder(order.id, phone.trim());
      setOrders((prev) => (prev ? prev.map((o) => (o.id === updated.id ? updated : o)) : prev));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Couldn't cancel this order.");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <main className="min-h-screen pb-16 max-w-lg mx-auto">
      <SiteHeader title="Track orders" />

      <div className="px-5">
      <header className="pt-8 pb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-sprout">Track orders</p>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink mt-1">Your recent orders</h1>
        <p className="text-ink-soft text-sm mt-2">
          Enter the phone number you ordered with to see your last 3 orders.
        </p>
      </header>

      <form onSubmit={handleLookup} className="flex gap-2 mb-6">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number"
          inputMode="tel"
          className="flex-1 rounded-lg border border-line bg-paper-raised px-3 py-2.5 text-sm text-ink"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-sprout text-paper-raised font-semibold px-5 py-2.5 text-sm disabled:opacity-50 shrink-0"
        >
          {loading ? "Looking up..." : "Find orders"}
        </button>
      </form>

      {error && <p className="text-sm text-clay mb-4">{error}</p>}

      <div className="space-y-4">
        {orders?.map((order) => (
          <CustomerOrderCard
            key={order.id}
            order={order}
            onCancel={handleCancel}
            cancelling={cancellingId === order.id}
          />
        ))}

        {orders && orders.length === 0 && (
          <p className="text-sm text-ink-soft text-center py-10">No orders found for that number.</p>
        )}
      </div>

      <Link
        href="/"
        className="block text-center mt-8 rounded-xl border border-line text-ink font-semibold py-3.5 hover:border-sprout transition-colors"
      >
        Back to menu
      </Link>
      </div>
    </main>
  );
}
