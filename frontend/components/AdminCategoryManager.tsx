"use client";

import { useEffect, useState } from "react";
import {
  createCategory,
  deleteCategory,
  getAdminCategories,
  CategoryAdminPayload,
  updateCategory,
} from "@/lib/api";
import { Category } from "@/lib/types";

interface CategoryForm {
  name: string;
  description: string;
}

const BLANK_FORM: CategoryForm = { name: "", description: "" };

export default function AdminCategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<CategoryForm>(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function load() {
    try {
      const data = await getAdminCategories();
      setCategories(data);
      setError(null);
    } catch {
      setError("Couldn't load categories.");
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

  function openEdit(category: Category) {
    setForm({ name: category.name, description: category.description || "" });
    setFormError(null);
    setEditingId(category.id);
  }

  function closeForm() {
    setEditingId(null);
    setFormError(null);
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      setFormError("Category name is required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload: CategoryAdminPayload = { name: form.name.trim(), description: form.description.trim() };
    try {
      if (editingId === "new") {
        await createCategory(payload);
      } else if (editingId !== null) {
        await updateCategory(editingId, payload);
      }
      closeForm();
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Couldn't save this category.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category: Category) {
    if (!confirm(`Delete the "${category.name}" category description? Menu items keep their category, only the description goes away.`)) return;
    try {
      await deleteCategory(category.id);
      await load();
    } catch {
      alert("Couldn't delete this category.");
    }
  }

  const isFormOpen = editingId !== null;

  return (
    <div className="px-5 mt-4">
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-sm text-ink-soft">{categories.length} categories</span>
        <button
          onClick={openCreate}
          className="rounded-full px-4 py-1.5 text-xs font-semibold bg-ink text-paper-raised"
        >
          + Add category
        </button>
      </div>

      <p className="text-xs text-ink-soft mb-4">
        The name must match a category exactly as typed on a menu item (e.g. &ldquo;Sprouts
        Bowls&rdquo;) - the description shows on the customer menu page before the category is
        expanded.
      </p>

      {error && <p className="text-sm text-clay mb-3">{error}</p>}
      {loading && <p className="text-sm text-ink-soft">Loading categories...</p>}

      {isFormOpen && (
        <div className="bg-paper-raised border border-line rounded-2xl p-5 mb-4 space-y-3">
          <p className="font-display text-lg font-semibold text-ink">
            {editingId === "new" ? "New category" : "Edit category"}
          </p>

          <label className="text-xs text-ink-soft block">
            Category name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Sprouts Bowls"
              className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
            />
          </label>

          <label className="text-xs text-ink-soft block">
            Description
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Protein-packed bowls built around fresh sprouts, your choice of base and toppings."
              rows={2}
              className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
            />
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
        {categories.map((category) => (
          <div key={category.id} className="bg-paper-raised border border-line rounded-2xl p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-ink">{category.name}</p>
              {category.description && <p className="text-sm text-ink-soft mt-1">{category.description}</p>}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => openEdit(category)}
                className="rounded-full px-3 py-1 text-xs font-semibold border border-line text-ink-soft"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(category)}
                className="rounded-full px-3 py-1 text-xs font-semibold border border-line text-clay"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {!loading && categories.length === 0 && (
          <p className="text-sm text-ink-soft text-center py-10">No category descriptions yet.</p>
        )}
      </div>
    </div>
  );
}
