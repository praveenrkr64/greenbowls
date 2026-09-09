"use client";

import { useCallback, useEffect, useState } from "react";
import { createExpense, deleteExpense, getExpenses, updateExpense, ExpensePayload } from "@/lib/api";
import { Expense, ExpenseSummary } from "@/lib/types";
import { formatPrice } from "@/lib/format";

const EMPTY: ExpensePayload = {
  itemName: "",
  category: "",
  quantity: null,
  unit: "",
  amount: 0,
  spentOn: null,
  vendor: "",
  notes: "",
};

/** First day of the current month, as the default report start. */
function monthStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminExpenseManager() {
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ExpensePayload>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setSummary(await getExpenses(from, to));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load expenses.");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function startEdit(expense: Expense) {
    setEditingId(expense.id);
    setForm({
      itemName: expense.itemName,
      category: expense.category ?? "",
      quantity: expense.quantity,
      unit: expense.unit ?? "",
      amount: expense.amount,
      spentOn: expense.spentOn,
      vendor: expense.vendor ?? "",
      notes: expense.notes ?? "",
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
    if (!form.amount || form.amount <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }
    setSaving(true);
    try {
      if (editingId === null) {
        await createExpense(form);
      } else {
        await updateExpense(editingId, form);
      }
      cancelEdit();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the expense.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(expense: Expense) {
    if (!confirm(`Delete the ${expense.itemName} entry?`)) return;
    try {
      await deleteExpense(expense.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the expense.");
    }
  }

  if (loading) return <p className="text-ink-soft">Loading expenses...</p>;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Costs</h2>
        <p className="text-sm text-ink-soft mt-0.5">
          What the kitchen spends on ingredients, packaging and supplies. This is a spend record
          only - it does not track how much stock is left.
        </p>
      </div>

      {error && (
        <p className="text-sm text-clay bg-clay/10 border border-clay/30 rounded-xl px-4 py-2">{error}</p>
      )}

      <div className="flex items-end gap-3">
        <div>
          <label className="block text-sm font-semibold text-ink mb-1">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-xl border border-line px-3 py-2 text-ink"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-ink mb-1">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-xl border border-line px-3 py-2 text-ink"
          />
        </div>
      </div>

      {summary && (
        <div className="bg-leaf-pale border border-sprout/30 rounded-2xl p-4">
          <p className="text-sm text-ink-soft">Total spend in this period</p>
          <p className="font-display text-2xl font-semibold text-sprout-dark">
            {formatPrice(summary.totalSpend)}
          </p>
          {summary.byCategory.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {summary.byCategory.map((c) => (
                <span
                  key={c.category}
                  className="text-xs bg-paper-raised border border-line rounded-full px-3 py-1 text-ink"
                >
                  {c.category}: {formatPrice(c.total)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {summary && summary.topItems.length > 0 && (
        <div className="bg-paper-raised border border-line rounded-2xl p-4">
          <p className="font-semibold text-ink mb-2">Most spent on</p>
          <div className="space-y-1">
            {summary.topItems.map((item) => (
              <div key={item.itemName} className="flex justify-between text-sm">
                <span className="text-ink">
                  {item.itemName}{" "}
                  <span className="text-ink-soft">
                    ({item.purchases} purchase{item.purchases === 1 ? "" : "s"})
                  </span>
                </span>
                <span className="font-mono text-ink">{formatPrice(item.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-paper-raised border border-line rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-ink mb-1">Item</label>
            <input
              required
              value={form.itemName}
              onChange={(e) => setForm({ ...form, itemName: e.target.value })}
              placeholder="Moong sprouts"
              className="w-full rounded-xl border border-line px-3 py-2 text-ink"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">Amount</label>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={form.amount || ""}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              className="w-full rounded-xl border border-line px-3 py-2 text-ink"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">Date</label>
            <input
              type="date"
              value={form.spentOn ?? today()}
              onChange={(e) => setForm({ ...form, spentOn: e.target.value })}
              className="w-full rounded-xl border border-line px-3 py-2 text-ink"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">Quantity</label>
            <input
              type="number"
              step="0.001"
              value={form.quantity ?? ""}
              onChange={(e) =>
                setForm({ ...form, quantity: e.target.value === "" ? null : Number(e.target.value) })
              }
              className="w-full rounded-xl border border-line px-3 py-2 text-ink"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">Unit</label>
            <input
              value={form.unit ?? ""}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="kg"
              className="w-full rounded-xl border border-line px-3 py-2 text-ink"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">Category</label>
            <input
              value={form.category ?? ""}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Vegetables"
              className="w-full rounded-xl border border-line px-3 py-2 text-ink"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">Vendor</label>
            <input
              value={form.vendor ?? ""}
              onChange={(e) => setForm({ ...form, vendor: e.target.value })}
              className="w-full rounded-xl border border-line px-3 py-2 text-ink"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-sprout text-white rounded-xl px-4 py-2 font-medium disabled:opacity-60"
          >
            {saving ? "Saving..." : editingId === null ? "Add expense" : "Save changes"}
          </button>
          {editingId !== null && (
            <button type="button" onClick={cancelEdit} className="text-ink-soft px-4 py-2">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-2">
        {summary?.expenses.length === 0 && (
          <p className="text-sm text-ink-soft">Nothing recorded in this period.</p>
        )}
        {summary?.expenses.map((expense) => (
          <div
            key={expense.id}
            className="bg-paper-raised border border-line rounded-2xl p-4 flex items-center gap-3"
          >
            <div className="flex-1">
              <p className="font-semibold text-ink">
                {expense.itemName}
                {expense.quantity ? (
                  <span className="font-normal text-ink-soft">
                    {" "}
                    - {expense.quantity} {expense.unit ?? ""}
                  </span>
                ) : null}
              </p>
              <p className="text-sm text-ink-soft mt-0.5">
                {expense.spentOn}
                {expense.category ? ` - ${expense.category}` : ""}
                {expense.vendor ? ` - ${expense.vendor}` : ""}
              </p>
            </div>
            <span className="font-mono text-ink">{formatPrice(expense.amount)}</span>
            <button onClick={() => startEdit(expense)} className="text-sm text-sprout-dark font-medium px-2">
              Edit
            </button>
            <button onClick={() => handleDelete(expense)} className="text-sm text-clay font-medium px-2">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
