"use client";

import { OrderResponse } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { StatusBadge } from "./OrderCard";

interface CustomerOrderCardProps {
  order: OrderResponse;
  onCancel?: (order: OrderResponse) => void;
  cancelling?: boolean;
}

export default function CustomerOrderCard({ order, onCancel, cancelling }: CustomerOrderCardProps) {
  // "Not yet started preparing" - once the kitchen is on it, it's too late to back out.
  const canCancel = order.status === "NEW" || order.status === "CONFIRMED";

  return (
    <div className="bg-paper-raised border border-line rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-ink-soft uppercase tracking-wide">Order #{order.id}</p>
        <StatusBadge status={order.status} />
      </div>

      <div className="ticket-rule my-3" />

      <div className="space-y-1">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-ink">
              {item.quantity} &times; {item.menuItemName}
              {item.selections.length > 0 && (
                <span className="text-ink-soft"> ({item.selections.join(", ")})</span>
              )}
            </span>
            <span className="font-mono text-ink-soft">{formatPrice(item.lineTotal)}</span>
          </div>
        ))}
      </div>

      <div className="ticket-rule my-3" />

      <p className="text-xs text-ink-soft">
        Delivering to: {order.communityName}, {order.tower}, Flat {order.flatNumber}
      </p>

      {order.discountAmount > 0 && (
        <p className="text-xs text-sprout-dark mt-1">
          {order.discountReason || "Discount"}: &minus;{formatPrice(order.discountAmount)}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 mt-3">
        <span className="font-mono font-semibold text-ink">{formatPrice(order.totalAmount)}</span>
        {canCancel && onCancel && (
          <button
            onClick={() => onCancel(order)}
            disabled={cancelling}
            className="rounded-full border border-clay text-clay font-semibold text-sm px-4 py-1.5 disabled:opacity-50"
          >
            {cancelling ? "Cancelling..." : "Cancel order"}
          </button>
        )}
      </div>
    </div>
  );
}
