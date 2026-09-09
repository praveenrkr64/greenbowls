"use client";

import { useEffect, useMemo, useState } from "react";
import { getCustomerRecentOrders, getCustomers, updateOrderStatus } from "@/lib/api";
import { Customer, OrderResponse } from "@/lib/types";
import OrderCard from "@/components/OrderCard";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminCustomerManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [expandedPhone, setExpandedPhone] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderResponse[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  useEffect(() => {
    getCustomers()
      .then((data) => {
        setCustomers(data);
        setError(null);
      })
      .catch(() => setError("Couldn't load customers."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return customers;
    return customers.filter((c) => c.phone.includes(q));
  }, [customers, query]);

  async function loadRecentOrders(phone: string) {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const data = await getCustomerRecentOrders(phone);
      setRecentOrders(data);
    } catch {
      setOrdersError("Couldn't load recent orders.");
    } finally {
      setOrdersLoading(false);
    }
  }

  async function toggleExpand(customer: Customer) {
    if (expandedPhone === customer.phone) {
      setExpandedPhone(null);
      return;
    }
    setExpandedPhone(customer.phone);
    await loadRecentOrders(customer.phone);
  }

  async function handleStatusChange(id: number, status: string) {
    setRecentOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      await updateOrderStatus(id, status);
    } catch {
      if (expandedPhone) loadRecentOrders(expandedPhone); // revert to server truth on failure
    }
  }

  return (
    <div className="px-5 mt-4">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by phone number"
        inputMode="tel"
        className="w-full rounded-lg border border-line bg-paper-raised px-3 py-2 text-sm text-ink mb-4"
      />

      {error && <p className="text-sm text-clay mb-3">{error}</p>}
      {loading && <p className="text-sm text-ink-soft">Loading customers...</p>}

      <div className="space-y-3">
        {filtered.map((customer) => (
          <div key={customer.id} className="bg-paper-raised border border-line rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleExpand(customer)}
              className="w-full flex items-center justify-between gap-3 p-4 text-left"
            >
              <div>
                <p className="font-semibold text-ink">{customer.name}</p>
                <p className="text-sm text-ink-soft">{customer.phone}</p>
                <p className="text-xs text-ink-soft mt-1">Customer since {formatDate(customer.createdAt)}</p>
              </div>
              <span className="shrink-0 rounded-full bg-leaf-pale px-3 py-1 text-xs font-semibold text-sprout-dark">
                {customer.orderCount} order{customer.orderCount === 1 ? "" : "s"}
              </span>
            </button>

            {expandedPhone === customer.phone && (
              <div className="border-t border-line p-4 space-y-3">
                <p className="text-xs font-semibold text-ink-soft uppercase tracking-wide">
                  Recent orders (most recent first)
                </p>

                {ordersLoading && <p className="text-sm text-ink-soft">Loading...</p>}
                {ordersError && <p className="text-sm text-clay">{ordersError}</p>}

                {!ordersLoading && !ordersError && recentOrders.length === 0 && (
                  <p className="text-sm text-ink-soft">No orders found.</p>
                )}

                {!ordersLoading &&
                  recentOrders.map((order) => (
                    <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
                  ))}
              </div>
            )}
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <p className="text-sm text-ink-soft text-center py-10">
            {query ? "No customers match that phone number." : "No customers yet."}
          </p>
        )}
      </div>
    </div>
  );
}
