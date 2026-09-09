"use client";

import { useEffect, useState } from "react";
import {
  createCommunity,
  deactivateCommunity,
  getAdminCommunities,
  CommunityAdminPayload,
  updateCommunity,
} from "@/lib/api";
import { CommunityAdmin } from "@/lib/types";

const PRESET_COLORS = [
  "#33562e", // sprout green
  "#e2a63b", // turmeric yellow
  "#a9714a", // clay
  "#3b6ea5", // blue
  "#7a5fa0", // purple
  "#b5486b", // rose
  "#2f8577", // teal
  "#6b6b6b", // gray
];

interface CommunityForm {
  name: string;
  active: boolean;
  color: string;
}

const BLANK_FORM: CommunityForm = { name: "", active: true, color: PRESET_COLORS[0] };

export default function AdminCommunityManager() {
  const [communities, setCommunities] = useState<CommunityAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<CommunityForm>(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function load() {
    try {
      const data = await getAdminCommunities();
      setCommunities(data);
      setError(null);
    } catch {
      setError("Couldn't load communities.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    const usedColors = new Set(communities.map((c) => c.color));
    const nextColor = PRESET_COLORS.find((c) => !usedColors.has(c)) || PRESET_COLORS[0];
    setForm({ ...BLANK_FORM, color: nextColor });
    setFormError(null);
    setEditingId("new");
  }

  function openEdit(community: CommunityAdmin) {
    setForm({ name: community.name, active: community.active, color: community.color });
    setFormError(null);
    setEditingId(community.id);
  }

  function closeForm() {
    setEditingId(null);
    setFormError(null);
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      setFormError("Name is required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload: CommunityAdminPayload = { name: form.name.trim(), active: form.active, color: form.color };
    try {
      if (editingId === "new") {
        await createCommunity(payload);
      } else if (editingId !== null) {
        await updateCommunity(editingId, payload);
      }
      closeForm();
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Couldn't save this community.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(community: CommunityAdmin) {
    if (!confirm(`Stop delivering to "${community.name}"?`)) return;
    try {
      await deactivateCommunity(community.id);
      await load();
    } catch {
      alert("Couldn't update this community.");
    }
  }

  async function handleReactivate(community: CommunityAdmin) {
    try {
      await updateCommunity(community.id, { name: community.name, active: true, color: community.color });
      await load();
    } catch {
      alert("Couldn't restore this community.");
    }
  }

  const isFormOpen = editingId !== null;

  return (
    <div className="px-5 mt-4">
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-sm text-ink-soft">{communities.length} communities</span>
        <button
          onClick={openCreate}
          className="rounded-full px-4 py-1.5 text-xs font-semibold bg-ink text-paper-raised"
        >
          + Add community
        </button>
      </div>

      {error && <p className="text-sm text-clay mb-3">{error}</p>}
      {loading && <p className="text-sm text-ink-soft">Loading communities...</p>}

      {isFormOpen && (
        <div className="bg-paper-raised border border-line rounded-2xl p-5 mb-4 space-y-3">
          <p className="font-display text-lg font-semibold text-ink">
            {editingId === "new" ? "New community" : "Edit community"}
          </p>

          <label className="text-xs text-ink-soft block">
            Name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Prestige Lakeside"
              className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
            />
          </label>

          <div>
            <p className="text-xs text-ink-soft mb-1.5">Color used to tell this community's orders apart</p>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, color: c })}
                  className={`h-7 w-7 rounded-full border-2 ${form.color === c ? "border-ink" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="h-7 w-10 rounded border border-line bg-paper p-0.5"
              />
            </div>
          </div>

          <label className="text-xs text-ink-soft flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Delivery available here
          </label>

          {formError && <p className="text-sm text-clay">{formError}</p>}

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-full px-4 py-1.5 text-xs font-semibold bg-ink text-paper-raised disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={closeForm} className="rounded-full px-4 py-1.5 text-xs font-semibold border border-line text-ink-soft">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {communities.map((community) => (
          <div key={community.id} className="bg-paper-raised border border-line rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: community.color }} />
              <div>
                <p className="font-semibold text-ink">
                  {community.name}{" "}
                  {!community.active && (
                    <span className="rounded-full bg-line px-2 py-0.5 text-[10px] font-semibold text-ink-soft align-middle">
                      Not delivering
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => openEdit(community)}
                className="rounded-full px-3 py-1 text-xs font-semibold border border-line text-ink-soft"
              >
                Edit
              </button>
              {community.active ? (
                <button
                  onClick={() => handleDeactivate(community)}
                  className="rounded-full px-3 py-1 text-xs font-semibold border border-line text-clay"
                >
                  Remove
                </button>
              ) : (
                <button
                  onClick={() => handleReactivate(community)}
                  className="rounded-full px-3 py-1 text-xs font-semibold border border-line text-sprout-dark"
                >
                  Restore
                </button>
              )}
            </div>
          </div>
        ))}

        {!loading && communities.length === 0 && (
          <p className="text-sm text-ink-soft text-center py-10">No communities yet.</p>
        )}
      </div>
    </div>
  );
}
