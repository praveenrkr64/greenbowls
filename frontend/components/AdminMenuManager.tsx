"use client";

import { useEffect, useRef, useState } from "react";
import {
  createMenuItem,
  deactivateMenuItem,
  getAdminMenu,
  MenuItemAdminPayload,
  updateMenuItem,
  updateMenuItemSortOrder,
  uploadMedia,
} from "@/lib/api";
import { MenuItemAdmin } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import Modal from "@/components/Modal";

interface OptionForm {
  name: string;
  priceDelta: string;
  active: boolean;
}

interface GroupForm {
  name: string;
  required: boolean;
  minSelect: string;
  maxSelect: string;
  options: OptionForm[];
}

interface ItemForm {
  name: string;
  description: string;
  basePrice: string;
  discountedPrice: string;
  category: string;
  imageUrl: string;
  active: boolean;
  variantGroups: GroupForm[];
}

const BLANK_OPTION: OptionForm = { name: "", priceDelta: "0", active: true };
const BLANK_GROUP: GroupForm = { name: "", required: false, minSelect: "0", maxSelect: "1", options: [{ ...BLANK_OPTION }] };
const BLANK_ITEM: ItemForm = {
  name: "",
  description: "",
  basePrice: "",
  discountedPrice: "",
  category: "",
  imageUrl: "",
  active: true,
  variantGroups: [],
};

function toForm(item: MenuItemAdmin): ItemForm {
  return {
    name: item.name,
    description: item.description || "",
    basePrice: String(item.basePrice),
    discountedPrice: item.discountedPrice != null ? String(item.discountedPrice) : "",
    category: item.category,
    imageUrl: item.imageUrl || "",
    active: item.active,
    variantGroups: item.variantGroups.map((g) => ({
      name: g.name,
      required: g.required,
      minSelect: String(g.minSelect),
      maxSelect: String(g.maxSelect),
      options: g.options.map((o) => ({ name: o.name, priceDelta: String(o.priceDelta), active: o.active })),
    })),
  };
}

function toPayload(form: ItemForm, sortOrder: number): MenuItemAdminPayload {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    basePrice: Number(form.basePrice) || 0,
    discountedPrice: form.discountedPrice.trim() ? Number(form.discountedPrice) : null,
    category: form.category.trim(),
    imageUrl: form.imageUrl.trim(),
    active: form.active,
    sortOrder,
    variantGroups: form.variantGroups.map((g, gi) => ({
      name: g.name.trim(),
      required: g.required,
      minSelect: Number(g.minSelect) || 0,
      maxSelect: Number(g.maxSelect) || 1,
      sortOrder: gi,
      options: g.options.map((o, oi) => ({
        name: o.name.trim(),
        priceDelta: Number(o.priceDelta) || 0,
        active: o.active,
        sortOrder: oi,
      })),
    })),
  };
}

export default function AdminMenuManager() {
  const [items, setItems] = useState<MenuItemAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<ItemForm>(BLANK_ITEM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const data = await getAdminMenu();
      setItems(data);
      setError(null);
    } catch {
      setError("Couldn't load menu items.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setForm(BLANK_ITEM);
    setFormError(null);
    setEditingId("new");
  }

  function openEdit(item: MenuItemAdmin) {
    setForm(toForm(item));
    setFormError(null);
    setEditingId(item.id);
  }

  function closeForm() {
    setEditingId(null);
    setFormError(null);
  }

  function updateGroup(gi: number, patch: Partial<GroupForm>) {
    setForm((f) => ({
      ...f,
      variantGroups: f.variantGroups.map((g, i) => (i === gi ? { ...g, ...patch } : g)),
    }));
  }

  function updateOption(gi: number, oi: number, patch: Partial<OptionForm>) {
    setForm((f) => ({
      ...f,
      variantGroups: f.variantGroups.map((g, i) =>
        i === gi ? { ...g, options: g.options.map((o, j) => (j === oi ? { ...o, ...patch } : o)) } : g
      ),
    }));
  }

  function addGroup() {
    setForm((f) => ({ ...f, variantGroups: [...f.variantGroups, { ...BLANK_GROUP, options: [{ ...BLANK_OPTION }] }] }));
  }

  function removeGroup(gi: number) {
    setForm((f) => ({ ...f, variantGroups: f.variantGroups.filter((_, i) => i !== gi) }));
  }

  function addOption(gi: number) {
    setForm((f) => ({
      ...f,
      variantGroups: f.variantGroups.map((g, i) => (i === gi ? { ...g, options: [...g.options, { ...BLANK_OPTION }] } : g)),
    }));
  }

  function removeOption(gi: number, oi: number) {
    setForm((f) => ({
      ...f,
      variantGroups: f.variantGroups.map((g, i) => (i === gi ? { ...g, options: g.options.filter((_, j) => j !== oi) } : g)),
    }));
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setFormError(null);
    try {
      const { url } = await uploadMedia(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Couldn't upload the image.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.category.trim() || !form.basePrice) {
      setFormError("Name, category, and price are required.");
      return;
    }
    if (form.discountedPrice.trim() && Number(form.discountedPrice) >= Number(form.basePrice)) {
      setFormError("Discounted price must be less than the actual price.");
      return;
    }
    for (const g of form.variantGroups) {
      if (!g.name.trim() || g.options.length === 0 || g.options.some((o) => !o.name.trim())) {
        setFormError("Every option group needs a name and at least one named option.");
        return;
      }
    }
    setSaving(true);
    setFormError(null);
    try {
      const existing = editingId !== "new" ? items.find((i) => i.id === editingId) : undefined;
      const payload = toPayload(form, existing?.sortOrder ?? items.length);
      if (editingId === "new") {
        await createMenuItem(payload);
      } else if (editingId !== null) {
        await updateMenuItem(editingId, payload);
      }
      closeForm();
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Couldn't save this item.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(item: MenuItemAdmin) {
    if (!confirm(`Remove "${item.name}" from the menu?`)) return;
    try {
      await deactivateMenuItem(item.id);
      await load();
    } catch {
      alert("Couldn't remove this item.");
    }
  }

  async function handleReactivate(item: MenuItemAdmin) {
    try {
      await updateMenuItem(item.id, { ...toPayload(toForm(item), item.sortOrder), active: true });
      await load();
    } catch {
      alert("Couldn't restore this item.");
    }
  }

  // Items within the same category, in the order they already display (i.e. by sortOrder).
  function categorySiblings(category: string) {
    return items.filter((i) => i.category === category);
  }

  async function handleMove(item: MenuItemAdmin, direction: "up" | "down") {
    const siblings = categorySiblings(item.category);
    const idx = siblings.findIndex((i) => i.id === item.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;
    const other = siblings[swapIdx];
    try {
      await updateMenuItemSortOrder(item.id, other.sortOrder);
      await updateMenuItemSortOrder(other.id, item.sortOrder);
      await load();
    } catch {
      alert("Couldn't reorder this item.");
    }
  }

  async function handlePromoteToTop(item: MenuItemAdmin) {
    const siblings = categorySiblings(item.category);
    if (siblings[0]?.id === item.id) return; // already first
    const minSortOrder = Math.min(...siblings.map((i) => i.sortOrder));
    try {
      await updateMenuItemSortOrder(item.id, minSortOrder - 1);
      await load();
    } catch {
      alert("Couldn't promote this item.");
    }
  }

  const isFormOpen = editingId !== null;
  const categories = Array.from(new Set(items.map((i) => i.category)));

  return (
    <div className="px-5 mt-4">
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-sm text-ink-soft">{items.length} items</span>
        <button
          onClick={openCreate}
          className="rounded-full px-4 py-1.5 text-xs font-semibold bg-ink text-paper-raised"
        >
          + Add item
        </button>
      </div>

      {error && <p className="text-sm text-clay mb-3">{error}</p>}
      {loading && <p className="text-sm text-ink-soft">Loading menu...</p>}

      {isFormOpen && (
        <Modal title={editingId === "new" ? "New menu item" : "Edit menu item"} onClose={closeForm}>
          <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-ink-soft col-span-2">
              Name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
              />
            </label>
            <label className="text-xs text-ink-soft col-span-2">
              Description
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
                rows={2}
              />
            </label>
            <label className="text-xs text-ink-soft">
              Category
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
              />
            </label>
            <label className="text-xs text-ink-soft">
              Base price
              <input
                type="number"
                step="0.01"
                value={form.basePrice}
                onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
              />
            </label>
            <label className="text-xs text-ink-soft">
              Discounted price <span className="text-ink-soft/70">(optional)</span>
              <input
                type="number"
                step="0.01"
                value={form.discountedPrice}
                onChange={(e) => setForm({ ...form, discountedPrice: e.target.value })}
                placeholder="e.g. 89"
                className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
              />
            </label>
            <div className="text-xs text-ink-soft col-span-2">
              Image
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelected}
                className="hidden"
              />
              <div className="mt-1 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink hover:bg-leaf-pale disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : form.imageUrl.trim() ? "Replace image" : "Upload image"}
                </button>
                {form.imageUrl.trim() && (
                  <>
                    <img src={form.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover border border-line" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, imageUrl: "" })}
                      className="text-xs font-semibold text-clay hover:underline"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
            <label className="text-xs text-ink-soft flex items-center gap-2 col-span-2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Visible on the customer menu
            </label>
          </div>

          <div className="ticket-rule my-3" />

          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">Option groups</p>
            <button onClick={addGroup} className="text-xs font-semibold text-sprout-dark">
              + Add group
            </button>
          </div>

          {form.variantGroups.map((g, gi) => (
            <div key={gi} className="border border-line rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  value={g.name}
                  onChange={(e) => updateGroup(gi, { name: e.target.value })}
                  placeholder="Group name (e.g. Choose protein)"
                  className="flex-1 rounded-lg border border-line bg-paper px-3 py-1.5 text-sm text-ink"
                />
                <button onClick={() => removeGroup(gi)} className="text-xs text-clay shrink-0">
                  Remove
                </button>
              </div>
              <div className="flex items-center gap-3 text-xs text-ink-soft">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={g.required}
                    onChange={(e) => updateGroup(gi, { required: e.target.checked })}
                  />
                  Required
                </label>
                <label className="flex items-center gap-1">
                  Min
                  <input
                    type="number"
                    value={g.minSelect}
                    onChange={(e) => updateGroup(gi, { minSelect: e.target.value })}
                    className="w-14 rounded border border-line bg-paper px-2 py-1"
                  />
                </label>
                <label className="flex items-center gap-1">
                  Max
                  <input
                    type="number"
                    value={g.maxSelect}
                    onChange={(e) => updateGroup(gi, { maxSelect: e.target.value })}
                    className="w-14 rounded border border-line bg-paper px-2 py-1"
                  />
                </label>
              </div>

              {g.options.map((o, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input
                    value={o.name}
                    onChange={(e) => updateOption(gi, oi, { name: e.target.value })}
                    placeholder="Option name"
                    className="flex-1 rounded-lg border border-line bg-paper px-3 py-1.5 text-sm text-ink"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={o.priceDelta}
                    onChange={(e) => updateOption(gi, oi, { priceDelta: e.target.value })}
                    placeholder="+price"
                    className="w-20 rounded-lg border border-line bg-paper px-2 py-1.5 text-sm text-ink"
                  />
                  <button onClick={() => removeOption(gi, oi)} className="text-xs text-clay shrink-0">
                    &times;
                  </button>
                </div>
              ))}
              <button onClick={() => addOption(gi)} className="text-xs font-semibold text-sprout-dark">
                + Add option
              </button>
            </div>
          ))}

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
        </Modal>
      )}

      <div className="space-y-6">
        {categories.map((category) => {
          const categoryItems = categorySiblings(category);
          return (
            <div key={category}>
              <p className="text-xs font-semibold text-ink-soft uppercase tracking-wide mb-2">{category}</p>
              <div className="space-y-3">
                {categoryItems.map((item, idx) => (
                  <div key={item.id} className="bg-paper-raised border border-line rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink">
                          {item.name}{" "}
                          {!item.active && (
                            <span className="rounded-full bg-line px-2 py-0.5 text-[10px] font-semibold text-ink-soft align-middle">
                              Hidden
                            </span>
                          )}
                        </p>
                        {item.description && <p className="text-sm text-ink-soft mt-1 whitespace-pre-line">{item.description}</p>}
                      </div>
                      <span className="font-mono text-sm shrink-0">
                        {item.discountedPrice != null ? (
                          <>
                            <span className="line-through text-ink-soft/60 mr-1.5">{formatPrice(item.basePrice)}</span>
                            <span className="text-clay font-semibold">{formatPrice(item.discountedPrice)}</span>
                          </>
                        ) : (
                          <span className="text-ink">{formatPrice(item.basePrice)}</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <button
                        onClick={() => handleMove(item, "up")}
                        disabled={idx === 0}
                        className="rounded-full px-3 py-1 text-xs font-semibold border border-line text-ink-soft disabled:opacity-30"
                      >
                        Move up
                      </button>
                      <button
                        onClick={() => handleMove(item, "down")}
                        disabled={idx === categoryItems.length - 1}
                        className="rounded-full px-3 py-1 text-xs font-semibold border border-line text-ink-soft disabled:opacity-30"
                      >
                        Move down
                      </button>
                      {idx > 0 && (
                        <button
                          onClick={() => handlePromoteToTop(item)}
                          className="rounded-full px-3 py-1 text-xs font-semibold border border-line text-sprout-dark"
                        >
                          Promote to top
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(item)}
                        className="rounded-full px-3 py-1 text-xs font-semibold border border-line text-ink-soft"
                      >
                        Edit
                      </button>
                      {item.active ? (
                        <button
                          onClick={() => handleDeactivate(item)}
                          className="rounded-full px-3 py-1 text-xs font-semibold border border-line text-clay"
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(item)}
                          className="rounded-full px-3 py-1 text-xs font-semibold border border-line text-sprout-dark"
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {!loading && items.length === 0 && (
          <p className="text-sm text-ink-soft text-center py-10">No menu items yet.</p>
        )}
      </div>
    </div>
  );
}
