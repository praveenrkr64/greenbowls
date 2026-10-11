"use client";

import { useEffect, useState } from "react";
import {
  deleteSubscriptionRequest,
  getSubscriptionRequests,
  updateSubscriptionRequest,
} from "@/lib/api";
import { SubscriptionRequest } from "@/lib/types";

/**
 * The kitchen's call-back worklist: who asked for a plan, and what was agreed when you rang them.
 *
 * <p>NEW means nobody has called yet, so those sort to the top and are the point of the screen.
 */

const STATUS_LABEL: Record<string, string> = {
  NEW: "To call",
  CONTACTED: "Called",
  CLOSED: "Closed",
};

const STATUS_STYLE: Record<string, string> = {
  NEW: "bg-turmeric text-ink",
  CONTACTED: "bg-leaf-pale text-sprout-dark",
  CLOSED: "bg-line text-ink-soft",
};

export default function AdminSubscriptionManager() {
  const [rows, setRows] = useState<SubscriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  async function load() {
    try {
      setRows(await getSubscriptionRequests());
      setError(null);
    } catch {
      setError("Couldn't load subscription requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(row: SubscriptionRequest, status: string) {
    try {
      await updateSubscriptionRequest(row.id, { status });
      await load();
    } catch {
      alert("Couldn't update this request.");
    }
  }

  async function saveNotes(row: SubscriptionRequest) {
    try {
      await updateSubscriptionRequest(row.id, { notes: noteDraft });
      setEditing(null);
      await load();
    } catch {
      alert("Couldn't save the notes.");
    }
  }

  async function handleDelete(row: SubscriptionRequest) {
    if (!confirm(`Delete the ${row.planType.toLowerCase()} request from ${row.customerName}?`)) return;
    try {
      await deleteSubscriptionRequest(row.id);
      await load();
    } catch {
      alert("Couldn't delete this request.");
    }
  }

  const pending = rows.filter((r) => r.status === "NEW").length;

  return (
    <div className="bg-paper-raised border border-line rounded-2xl p-5 mb-6 space-y-3">
      <div>
        <p className="font-display text-lg font-semibold text-ink">Subscription requests</p>
        <p className="text-xs text-ink-soft mt-0.5">
          Customers who asked to be called about a weekly or monthly plan. Ring them, agree the
          bowls, timings and price, then record what you settled on here.
        </p>
      </div>

      {error && <p className="text-sm text-clay">{error}</p>}
      {loading && <p className="text-sm text-ink-soft">Loading requests...</p>}

      {!loading && rows.length > 0 && (
        <p className="text-xs text-ink-soft">
          {pending === 0 ? "Everyone has been called." : `${pending} still to call.`}
        </p>
      )}

      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="border border-line rounded-xl px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-ink">
                  {row.customerName}{" "}
                  <a
                    href={`tel:${row.phone.replace(/[^\d+]/g, "")}`}
                    className="font-normal text-sprout-dark underline underline-offset-2"
                  >
                    {row.phone}
                  </a>
                </p>
                <p className="text-xs text-ink-soft mt-0.5">
                  {row.planType === "WEEKLY" ? "Weekly" : "Monthly"} plan &middot;{" "}
                  {new Date(row.createdAt).toLocaleDateString()}
                </p>
                <span
                  className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    STATUS_STYLE[row.status] || "bg-line text-ink-soft"
                  }`}
                >
                  {STATUS_LABEL[row.status] || row.status}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {row.status !== "CONTACTED" && (
                  <button
                    onClick={() => setStatus(row, "CONTACTED")}
                    className="rounded-full px-3 py-1 text-xs font-semibold border border-line text-ink-soft"
                  >
                    Mark called
                  </button>
                )}
                {row.status !== "CLOSED" && (
                  <button
                    onClick={() => setStatus(row, "CLOSED")}
                    className="rounded-full px-3 py-1 text-xs font-semibold border border-line text-ink-soft"
                  >
                    Close
                  </button>
                )}
                <button
                  onClick={() => handleDelete(row)}
                  className="rounded-full px-3 py-1 text-xs font-semibold border border-line text-clay"
                >
                  Delete
                </button>
              </div>
            </div>

            {editing === row.id ? (
              <div className="mt-2 space-y-2">
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="What you agreed: bowls, delivery timings, price..."
                  className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => saveNotes(row)}
                    className="rounded-full px-4 py-1.5 text-xs font-semibold bg-ink text-paper-raised"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="rounded-full px-4 py-1.5 text-xs font-semibold border border-line text-ink-soft"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setEditing(row.id); setNoteDraft(row.notes || ""); }}
                className="mt-2 text-left text-xs text-ink-soft hover:text-ink"
              >
                {row.notes ? row.notes : "+ Add notes from the call"}
              </button>
            )}
          </div>
        ))}

        {!loading && rows.length === 0 && (
          <p className="text-sm text-ink-soft text-center py-6">No subscription requests yet.</p>
        )}
      </div>
    </div>
  );
}
