"use client";

import { useEffect, useState } from "react";
import {
  createDeliverySlot,
  deleteDeliverySlot,
  getAdminDeliverySlots,
  updateDeliverySlot,
  DeliverySlotPayload,
} from "@/lib/api";
import { DeliverySlotAdmin } from "@/lib/types";

const EMPTY: DeliverySlotPayload = {
  startTime: "12:00",
  endTime: "13:00",
  maxOrders: null,
  active: true,
  sortOrder: 0,
};

/** LocalTime arrives as "12:00:00"; the time input wants "12:00". */
function toInputTime(value: string): string {
  return value.slice(0, 5);
}

export default function AdminDeliverySlotManager() {
  const [slots, setSlots] = useState<DeliverySlotAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<DeliverySlotPayload>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    try {
      setSlots(await getAdminDeliverySlots());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load delivery slots.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function startEdit(slot: DeliverySlotAdmin) {
    setEditingId(slot.id);
    setForm({
      startTime: toInputTime(slot.startTime),
      endTime: toInputTime(slot.endTime),
      maxOrders: slot.maxOrders,
      active: slot.active,
      sortOrder: slot.sortOrder,
    });
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
    setError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.endTime <= form.startTime) {
      setError("End time must be after start time.");
      return;
    }
    setSaving(true);
    try {
      if (editingId === null) {
        await createDeliverySlot(form);
      } else {
        await updateDeliverySlot(editingId, form);
      }
      cancelEdit();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the slot.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(slot: DeliverySlotAdmin) {
    if (!confirm(`Delete the ${toInputTime(slot.startTime)} - ${toInputTime(slot.endTime)} slot? Past orders keep their record of it.`)) return;
    try {
      await deleteDeliverySlot(slot.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the slot.");
    }
  }

  if (loading) return <p className="text-ink-soft">Loading delivery slots...</p>;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Delivery slots</h2>
        <p className="text-sm text-ink-soft mt-0.5">
          Time windows customers choose at checkout. A slot stops being offered once it is full
          or its window has passed for the day.
        </p>
      </div>

      {error && (
        <p className="text-sm text-clay bg-clay/10 border border-clay/30 rounded-xl px-4 py-2">{error}</p>
      )}

      <form onSubmit={handleSave} className="bg-paper-raised border border-line rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {/* No Label field: a slot is identified by its window, and the customer only ever
              sees the times. The backend fills the legacy label column from the times. */}
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">From</label>
            <input
              required
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              className="w-full rounded-xl border border-line px-3 py-2 text-ink"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">To</label>
            <input
              required
              type="time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              className="w-full rounded-xl border border-line px-3 py-2 text-ink"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">Max orders</label>
            <input
              type="number"
              min={0}
              value={form.maxOrders ?? ""}
              onChange={(e) =>
                setForm({ ...form, maxOrders: e.target.value === "" ? null : Number(e.target.value) })
              }
              placeholder="Unlimited"
              className="w-full rounded-xl border border-line px-3 py-2 text-ink"
            />
            <p className="text-xs text-ink-soft mt-1">Leave blank or 0 for unlimited.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">Sort order</label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              className="w-full rounded-xl border border-line px-3 py-2 text-ink"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="accent-sprout"
          />
          Offered at checkout
        </label>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-sprout text-white rounded-xl px-4 py-2 font-medium disabled:opacity-60"
          >
            {saving ? "Saving..." : editingId === null ? "Add slot" : "Save changes"}
          </button>
          {editingId !== null && (
            <button type="button" onClick={cancelEdit} className="text-ink-soft px-4 py-2">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-2">
        {slots.length === 0 && (
          <p className="text-sm text-ink-soft">
            No slots yet. Until one is added, checkout asks only for an address.
          </p>
        )}
        {slots.map((slot) => {
          const full = slot.maxOrders !== null && slot.maxOrders > 0 && slot.ordersToday >= slot.maxOrders;
          return (
            <div
              key={slot.id}
              className="bg-paper-raised border border-line rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="flex-1">
                <p className="font-semibold text-ink">
                  {toInputTime(slot.startTime)} - {toInputTime(slot.endTime)}
                </p>
                <p className="text-sm text-ink-soft mt-0.5">
                  {slot.ordersToday} order{slot.ordersToday === 1 ? "" : "s"} today
                  {slot.maxOrders && slot.maxOrders > 0 ? ` of ${slot.maxOrders}` : " (unlimited)"}
                  {full ? " - full" : ""}
                  {!slot.active ? " - hidden from checkout" : ""}
                </p>
              </div>
              <button onClick={() => startEdit(slot)} className="text-sm text-sprout-dark font-medium px-2">
                Edit
              </button>
              <button onClick={() => handleDelete(slot)} className="text-sm text-clay font-medium px-2">
                Delete
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
