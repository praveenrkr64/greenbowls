"use client";

import { useState, FormEvent } from "react";
import { getAssignedOrders, markOrderDelivered } from "@/lib/api";
import { OrderResponse } from "@/lib/types";
import AgentOrderCard from "@/components/AgentOrderCard";

// Delivery agents don't log in - like customer order tracking, they identify
// themselves with the phone number the admin assigned them under, plus a secret
// key only they and the admin know (a phone number alone isn't secret enough to
// gate someone else's delivery list), and see only their own undelivered orders.
export default function AgentPage() {
  const [phone, setPhone] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [orders, setOrders] = useState<OrderResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveringId, setDeliveringId] = useState<number | null>(null);

  async function handleLookup(e: FormEvent) {
    e.preventDefault();
    if (!phone.trim() || !secretKey.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAssignedOrders(phone.trim(), secretKey.trim());
      setOrders(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't look up orders for that number right now.");
      setOrders(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkDelivered(order: OrderResponse) {
    setDeliveringId(order.id);
    try {
      const updated = await markOrderDelivered(order.id, phone.trim(), secretKey.trim());
      setOrders((prev) => (prev ? prev.filter((o) => o.id !== updated.id) : prev));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Couldn't mark this order delivered.");
    } finally {
      setDeliveringId(null);
    }
  }

  return (
    <main className="min-h-screen pb-16 max-w-lg mx-auto">
      <header className="sticky top-0 z-30 bg-paper/95 backdrop-blur border-b border-line px-5 py-3">
        <span className="font-display text-base font-semibold text-ink">Delivery</span>
      </header>

      <div className="px-5">
        <header className="pt-8 pb-6">
          <p className="font-mono text-xs uppercase tracking-widest text-sprout">Delivery agent</p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink mt-1">Your assigned orders</h1>
          <p className="text-ink-soft text-sm mt-2">
            Enter the phone number and secret key the admin gave you to see your undelivered orders.
          </p>
        </header>

        <form onSubmit={handleLookup} className="space-y-2 mb-6">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
            inputMode="tel"
            className="w-full rounded-lg border border-line bg-paper-raised px-3 py-2.5 text-sm text-ink"
          />
          <input
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            placeholder="Secret key"
            className="w-full rounded-lg border border-line bg-paper-raised px-3 py-2.5 text-sm text-ink font-mono"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-sprout text-paper-raised font-semibold px-5 py-2.5 text-sm disabled:opacity-50"
          >
            {loading ? "Looking up..." : "Find orders"}
          </button>
        </form>

        {error && <p className="text-sm text-clay mb-4">{error}</p>}

        <div className="space-y-4">
          {orders?.map((order) => (
            <AgentOrderCard
              key={order.id}
              order={order}
              onMarkDelivered={handleMarkDelivered}
              delivering={deliveringId === order.id}
            />
          ))}

          {orders && orders.length === 0 && (
            <p className="text-sm text-ink-soft text-center py-10">No undelivered orders assigned to you right now.</p>
          )}
        </div>
      </div>
    </main>
  );
}
