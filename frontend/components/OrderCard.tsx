"use client";

import { DeliveryAgentAdmin, OrderResponse } from "@/lib/types";
import { formatPrice } from "@/lib/format";

export const STATUS_FLOW = ["NEW", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

export const STATUS_LABEL: Record<string, string> = {
  NEW: "New",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

// Active, unresolved statuses stay vivid so they draw the eye; DELIVERED/CANCELLED
// (nothing left to do) fade back so they don't compete for attention.
const STATUS_BADGE: Record<string, string> = {
  NEW: "bg-turmeric text-ink ring-2 ring-turmeric-dark animate-pulse",
  CONFIRMED: "bg-leaf-pale text-sprout-dark",
  PREPARING: "bg-sprout/15 text-sprout-dark border border-sprout/40",
  OUT_FOR_DELIVERY: "bg-sprout text-paper-raised",
  DELIVERED: "bg-line text-ink-soft",
  CANCELLED: "bg-clay/15 text-clay",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
        STATUS_BADGE[status] || "bg-line text-ink-soft"
      }`}
    >
      {status === "NEW" && <span className="h-1.5 w-1.5 rounded-full bg-ink" />}
      {STATUS_LABEL[status] || status}
    </span>
  );
}

interface OrderCardProps {
  order: OrderResponse;
  onStatusChange: (id: number, status: string) => void;
  agents?: DeliveryAgentAdmin[];
  onAssignAgent?: (id: number, agentId: number | null) => void;
}

export default function OrderCard({ order, onStatusChange, agents, onAssignAgent }: OrderCardProps) {
  return (
    <div
      className="bg-paper-raised border border-line rounded-2xl p-5 border-l-4"
      style={{ borderLeftColor: order.communityColor }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-ink">
            #{order.id} &middot; {order.customerName}
          </p>
          <p className="text-sm text-ink-soft">{order.customerPhone}</p>
          <p className="text-sm mt-1">
            <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: order.communityColor }}>
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: order.communityColor }} />
              {order.communityName}
            </span>
            <span className="text-ink-soft">
              , {order.tower}, Flat {order.flatNumber}
            </span>
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* The delivery time is the one field here that is time-critical to the kitchen, so it
          gets a filled badge rather than another line of grey text. An express order says so
          instead of naming a window -- it has no slot, by design. */}
      {(order.deliverySlotLabel || order.expressDelivery) && (
        <div className="mt-2">
          {order.expressDelivery ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-clay/15 border border-clay/40 px-2.5 py-1 text-sm font-semibold text-clay">
              Express delivery
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-lg bg-turmeric/25 border border-turmeric-dark/40 px-2.5 py-1 text-sm font-semibold text-ink">
              {order.deliverySlotLabel}
              {order.deliverySlotWindow && (
                <span className="font-mono text-xs text-ink-soft">{order.deliverySlotWindow}</span>
              )}
            </span>
          )}
        </div>
      )}

      <div className="ticket-rule my-3" />

      <div className="space-y-1">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-ink">
              <span className="font-mono text-ink-soft">{item.quantity}&times;</span>{" "}
              {/* The name carries the weight: on a dense ticket the options run to several
                  lines, and an unemphasised name reads as part of them. */}
              <span className="font-semibold text-sprout-dark">{item.menuItemName}</span>
              {item.selections.length > 0 && (
                <span className="text-ink-soft"> ({item.selections.join(", ")})</span>
              )}
            </span>
            <span className="font-mono text-ink-soft">{formatPrice(item.lineTotal)}</span>
          </div>
        ))}
      </div>

      {order.notes && <p className="text-xs text-clay mt-2">Note: {order.notes}</p>}

      {order.discountAmount > 0 && (
        <p className="text-xs text-sprout-dark mt-2">
          {order.discountReason || "Discount"}: &minus;{formatPrice(order.discountAmount)} (subtotal {formatPrice(order.subtotalAmount)})
        </p>
      )}

      <div className="ticket-rule my-3" />

      <div className="flex items-center justify-between gap-3">
        <span className="font-mono font-semibold text-ink">{formatPrice(order.totalAmount)}</span>
        <select
          value={order.status}
          onChange={(e) => onStatusChange(order.id, e.target.value)}
          className="rounded-lg border border-line bg-paper px-3 py-1.5 text-sm text-ink"
        >
          {STATUS_FLOW.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {agents && onAssignAgent && (
        <div className="flex items-center justify-between gap-3 mt-2">
          <span className="text-xs text-ink-soft">Delivery agent</span>
          <select
            value={order.deliveryAgentId ?? ""}
            onChange={(e) => onAssignAgent(order.id, e.target.value ? Number(e.target.value) : null)}
            className="rounded-lg border border-line bg-paper px-3 py-1.5 text-sm text-ink"
          >
            <option value="">Unassigned</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
