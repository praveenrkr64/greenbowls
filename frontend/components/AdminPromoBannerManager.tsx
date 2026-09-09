"use client";

import { useEffect, useState } from "react";
import {
  createPromoBanner,
  deletePromoBanner,
  getAdminPromoBanners,
  PromoBannerAdminPayload,
  updatePromoBanner,
} from "@/lib/api";
import { PromoBannerAdmin } from "@/lib/types";

interface BannerForm {
  enabled: boolean;
  message: string;
}

const BLANK_FORM: BannerForm = { enabled: true, message: "" };

export default function AdminPromoBannerManager() {
  const [banners, setBanners] = useState<PromoBannerAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<BannerForm>(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function load() {
    try {
      const data = await getAdminPromoBanners();
      setBanners(data);
      setError(null);
    } catch {
      setError("Couldn't load promotion banners.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setForm(BLANK_FORM);
    setFormError(null);
    setEditingId("new");
  }

  function openEdit(banner: PromoBannerAdmin) {
    setForm({ enabled: banner.enabled, message: banner.message });
    setFormError(null);
    setEditingId(banner.id);
  }

  function closeForm() {
    setEditingId(null);
    setFormError(null);
  }

  async function handleSubmit() {
    if (!form.message.trim()) {
      setFormError("Banner message is required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload: PromoBannerAdminPayload = { enabled: form.enabled, message: form.message.trim() };
    try {
      if (editingId === "new") {
        await createPromoBanner(payload);
      } else if (editingId !== null) {
        await updatePromoBanner(editingId, payload);
      }
      closeForm();
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Couldn't save this banner.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(banner: PromoBannerAdmin) {
    if (!confirm(`Delete this banner? "${banner.message}"`)) return;
    try {
      await deletePromoBanner(banner.id);
      await load();
    } catch {
      alert("Couldn't delete this banner.");
    }
  }

  async function handleToggle(banner: PromoBannerAdmin) {
    try {
      await updatePromoBanner(banner.id, { enabled: !banner.enabled, message: banner.message });
      await load();
    } catch {
      alert("Couldn't update this banner.");
    }
  }

  const isFormOpen = editingId !== null;

  return (
    <div className="bg-paper-raised border border-line rounded-2xl p-5 mb-6 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-lg font-semibold text-ink">Promotion banners</p>
          <p className="text-xs text-ink-soft mt-0.5">
            Shown at the top of the customer menu page, above every category - enable as many as
            you want to run at once, e.g. two separate offers.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold bg-ink text-paper-raised"
        >
          + Add banner
        </button>
      </div>

      {error && <p className="text-sm text-clay">{error}</p>}
      {loading && <p className="text-sm text-ink-soft">Loading promotion banners...</p>}

      {isFormOpen && (
        <div className="border border-line rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-ink">
            {editingId === "new" ? "New banner" : "Edit banner"}
          </p>

          <label className="text-xs text-ink-soft flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            />
            Show banner on the menu page
          </label>

          <label className="text-xs text-ink-soft block">
            Banner message
            <input
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="e.g. 10% off Chicken Rice Bowl today only!"
              className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
            />
          </label>

          {formError && <p className="text-sm text-clay">{formError}</p>}

          <div className="flex items-center gap-2 pt-1">
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

      <div className="space-y-2">
        {banners.map((banner) => (
          <div key={banner.id} className="flex items-center justify-between gap-3 border border-line rounded-xl px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm text-ink truncate">{banner.message}</p>
              <span
                className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  banner.enabled ? "bg-leaf-pale text-sprout-dark" : "bg-line text-ink-soft"
                }`}
              >
                {banner.enabled ? "Live" : "Off"}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleToggle(banner)}
                className="rounded-full px-3 py-1 text-xs font-semibold border border-line text-ink-soft"
              >
                {banner.enabled ? "Turn off" : "Turn on"}
              </button>
              <button
                onClick={() => openEdit(banner)}
                className="rounded-full px-3 py-1 text-xs font-semibold border border-line text-ink-soft"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(banner)}
                className="rounded-full px-3 py-1 text-xs font-semibold border border-line text-clay"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {!loading && banners.length === 0 && (
          <p className="text-sm text-ink-soft text-center py-6">No promotion banners yet.</p>
        )}
      </div>
    </div>
  );
}
