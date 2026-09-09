"use client";

import { OrderResponse } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { StatusBadge } from "./OrderCard";

interface AgentOrderCardProps {
  order: OrderResponse;
  onMarkDelivered?: (order: OrderResponse) => void;
  delivering?: boolean;
}

export default function AgentOrderCard({ order, onMarkDelivered, delivering }: AgentOrderCardProps) {
  const canDeliver = order.status !== "DELIVERED" && order.status !== "CANCELLED";

  return (
    <div className="bg-paper-raised border border-line rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-ink-soft uppercase tracking-wide">Order #{order.id}</p>
        <StatusBadge status={order.status} />
      </div>

      <div className="ticket-rule my-3" />

      <p className="font-semibold text-ink">{order.customerName}</p>
      <a href={`tel:${order.customerPhone}`} className="text-sm text-sprout-dark font-semibold">
        {order.customerPhone}
      </a>
      <p className="text-sm text-ink-soft mt-2">
        <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: order.communityColor }}>
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: order.communityColor }} />
          {order.communityName}
        </span>
        , {order.tower}, Flat {order.flatNumber}
      </p>
      {order.notes && <p className="text-xs text-clay mt-1">Note: {order.notes}</p>}

      <div className="ticket-rule my-3" />

      <div className="flex items-center justify-between gap-3">
        <span className="font-mono font-semibold text-ink">{formatPrice(order.totalAmount)}</span>
        {canDeliver && onMarkDelivered && (
          <button
            onClick={() => onMarkDelivered(order)}
            disabled={delivering}
            className="rounded-full bg-sprout text-paper-raised font-semibold text-sm px-4 py-1.5 disabled:opacity-50"
          >
            {delivering ? "Marking..." : "Mark delivered"}
          </button>
        )}
      </div>
    </div>
  );
}
