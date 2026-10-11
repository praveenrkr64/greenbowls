"use client";

import { useEffect, useState } from "react";
import {
  createCouponType,
  deleteCoupon,
  deleteCouponType,
  getCategories,
  getCouponTypes,
  getCoupons,
  getRestaurantInfo,
  issueCoupon,
  lookupCoupon,
  updateCouponType,
  CouponTypePayload,
} from "@/lib/api";
import { Category, Coupon, CouponType } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { couponWhatsAppLink } from "@/lib/whatsapp";

/**
 * Coupons, in two halves: the TYPES the kitchen offers, and the coupons actually issued to
 * phone numbers.
 *
 * <p>Issued coupons snapshot their type's rules, so editing or deleting a type never changes a
 * coupon somebody is already holding.
 */

const BLANK: CouponTypePayload = {
  name: "",
  discountAmount: 50,
  conditionType: "NONE",
  minOrderTotal: null,
  categoryName: null,
  minQuantity: null,
  validityDays: 30,
  autoIssueOnDelivery: false,
  reusable: false,
  adminOnly: false,
  active: true,
};

export default function AdminCouponManager() {
  const [types, setTypes] = useState<CouponType[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<CouponTypePayload>(BLANK);
  const [saving, setSaving] = useState(false);

  const [issueTypeId, setIssueTypeId] = useState<number | "">("");
  const [issuePhone, setIssuePhone] = useState("");
  const [issuing, setIssuing] = useState(false);
  const [lastIssued, setLastIssued] = useState<Coupon | null>(null);
  const [filterPhone, setFilterPhone] = useState("");
  // Only used to word the WhatsApp message so it reads as coming from the kitchen.
  const [restaurantName, setRestaurantName] = useState("our kitchen");
  const [checkCode, setCheckCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState<Coupon | "none" | null>(null);

  async function load(phone?: string) {
    try {
      const [t, c, cats] = await Promise.all([
        getCouponTypes(),
        getCoupons(phone || undefined),
        getCategories().catch(() => [] as Category[]),
      ]);
      setTypes(t);
      setCoupons(c);
      setCategories(cats);
      setError(null);
    } catch {
      setError("Couldn't load coupons.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    getRestaurantInfo().then((i) => setRestaurantName(i.name)).catch(() => {});
  }, []);

  async function handleSaveType() {
    if (!form.name.trim()) {
      setError("Give the coupon a name.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingId === "new") await createCouponType(form);
      else if (editingId !== null) await updateCouponType(editingId, form);
      setEditingId(null);
      await load(filterPhone);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save this coupon type.");
    } finally {
      setSaving(false);
    }
  }

  async function handleIssue() {
    if (!issueTypeId || (!issueIsMaster && !issuePhone.trim())) {
      setError("Pick a coupon and enter a phone number.");
      return;
    }
    setIssuing(true);
    setError(null);
    try {
      const issued = await issueCoupon({
        couponTypeId: Number(issueTypeId),
        phone: issueIsMaster ? undefined : issuePhone.trim(),
      });
      setLastIssued(issued);
      setIssuePhone("");
      await load(filterPhone);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't issue that coupon.");
    } finally {
      setIssuing(false);
    }
  }

  async function handleCheck() {
    if (!checkCode.trim()) return;
    setChecking(true);
    setChecked(null);
    try {
      const found = await lookupCoupon(checkCode.trim());
      setChecked(found.length > 0 ? found[0] : "none");
    } catch {
      setError("Couldn't check that code.");
    } finally {
      setChecking(false);
    }
  }

  const issueIsMaster = types.find((t) => t.id === issueTypeId)?.reusable ?? false;

  const needsTotal = form.conditionType === "MIN_ORDER_TOTAL";
  const needsCategory = form.conditionType === "MIN_CATEGORY_QUANTITY";

  return (
    <div className="space-y-6 mb-6">
      {error && <p className="text-sm text-clay bg-clay/10 border border-clay/30 rounded-xl px-4 py-2">{error}</p>}
      {loading && <p className="text-sm text-ink-soft">Loading coupons...</p>}

      {/* ---------------- coupon types ---------------- */}
      <div className="bg-paper-raised border border-line rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-lg font-semibold text-ink">Coupon types</p>
            <p className="text-xs text-ink-soft mt-0.5">
              The offers you can hand out. Issued coupons keep the rules they were created with,
              so changing one here never alters a coupon a customer already holds.
            </p>
          </div>
          <button
            onClick={() => { setForm(BLANK); setEditingId("new"); }}
            className="shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold bg-ink text-paper-raised"
          >
            + Add type
          </button>
        </div>

        {editingId !== null && (
          <div className="border border-line rounded-xl p-4 space-y-3">
            <label className="text-xs text-ink-soft block">
              Name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Rs 50 off 2 salads"
                className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-ink-soft block">
                Discount (&#8377;)
                <input
                  type="number" min={1}
                  value={form.discountAmount}
                  onChange={(e) => setForm({ ...form, discountAmount: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
                />
              </label>
              <label className="text-xs text-ink-soft block">
                Valid for (days)
                <input
                  type="number" min={1}
                  value={form.validityDays}
                  onChange={(e) => setForm({ ...form, validityDays: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
                />
              </label>
            </div>

            <label className="text-xs text-ink-soft block">
              Condition
              <select
                value={form.conditionType}
                onChange={(e) => setForm({ ...form, conditionType: e.target.value as CouponTypePayload["conditionType"] })}
                className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
              >
                <option value="NONE">No condition - any order</option>
                <option value="MIN_ORDER_TOTAL">Minimum bill</option>
                <option value="MIN_CATEGORY_QUANTITY">Buy N from a category</option>
              </select>
            </label>

            {needsTotal && (
              <label className="text-xs text-ink-soft block">
                Minimum bill (&#8377;)
                <input
                  type="number" min={1}
                  value={form.minOrderTotal ?? ""}
                  onChange={(e) => setForm({ ...form, minOrderTotal: Number(e.target.value) })}
                  placeholder="500"
                  className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
                />
              </label>
            )}

            {needsCategory && (
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-ink-soft block">
                  Category
                  <select
                    value={form.categoryName ?? ""}
                    onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
                  >
                    <option value="">Choose...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-ink-soft block">
                  How many
                  <input
                    type="number" min={1}
                    value={form.minQuantity ?? ""}
                    onChange={(e) => setForm({ ...form, minQuantity: Number(e.target.value) })}
                    placeholder="2"
                    className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
                  />
                </label>
              </div>
            )}

            <label className="text-xs text-ink-soft flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.autoIssueOnDelivery}
                onChange={(e) => setForm({ ...form, autoIssueOnDelivery: e.target.checked })}
                disabled={form.reusable}
              />
              Give this automatically when an order is delivered
            </label>

            <label className="text-xs text-ink-soft flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={form.reusable ?? false}
                onChange={(e) => setForm({ ...form, reusable: e.target.checked, adminOnly: e.target.checked || form.adminOnly })}
              />
              <span>
                <span className="font-semibold">Master coupon</span> - one code you can apply to any
                number of orders. It is never used up and is not tied to a phone number.
                <span className="block text-[11px] mt-0.5">
                  Staff-only by necessity: a reusable code a customer could type would discount
                  every order the moment it leaked, so it can only be applied by you from the
                  order screen.
                </span>
              </span>
            </label>

            <div className="flex gap-2 pt-1">
              <button onClick={handleSaveType} disabled={saving}
                      className="rounded-full px-4 py-1.5 text-xs font-semibold bg-ink text-paper-raised disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setEditingId(null)}
                      className="rounded-full px-4 py-1.5 text-xs font-semibold border border-line text-ink-soft">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {types.map((t) => (
            <div key={t.id} className="flex items-start justify-between gap-3 border border-line rounded-xl px-4 py-3">
              <div className="min-w-0">
                <p className="font-semibold text-ink">{t.name}</p>
                <p className="text-xs text-ink-soft mt-0.5">{t.description}</p>
                <p className="text-[11px] text-ink-soft mt-0.5">
                  Valid {t.validityDays} days{t.autoIssueOnDelivery ? " - given automatically on delivery" : ""}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    setForm({
                      name: t.name, discountAmount: t.discountAmount, conditionType: t.conditionType,
                      minOrderTotal: t.minOrderTotal, categoryName: t.categoryName,
                      minQuantity: t.minQuantity, validityDays: t.validityDays,
                      autoIssueOnDelivery: t.autoIssueOnDelivery, active: t.active,
                    });
                    setEditingId(t.id);
                  }}
                  className="rounded-full px-3 py-1 text-xs font-semibold border border-line text-ink-soft"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    if (!confirm(`Delete "${t.name}"? Coupons already issued keep working.`)) return;
                    await deleteCouponType(t.id);
                    await load(filterPhone);
                  }}
                  className="rounded-full px-3 py-1 text-xs font-semibold border border-line text-clay"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {!loading && types.length === 0 && (
            <p className="text-sm text-ink-soft text-center py-4">No coupon types yet.</p>
          )}
        </div>
      </div>

      {/* ---------------- issue ---------------- */}
      <div className="bg-paper-raised border border-line rounded-2xl p-5 space-y-3">
        <p className="font-display text-lg font-semibold text-ink">Give a coupon</p>
        <p className="text-xs text-ink-soft">
          The code is tied to this phone number and cannot be used from any other.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-ink-soft block flex-1 min-w-40">
            Coupon
            <select
              value={issueTypeId}
              onChange={(e) => setIssueTypeId(e.target.value ? Number(e.target.value) : "")}
              className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
            >
              <option value="">Choose...</option>
              {types.filter((t) => t.active).map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-ink-soft block flex-1 min-w-40">
            Phone number{issueIsMaster && <span className="text-ink-soft"> (not needed)</span>}
            <input
              value={issuePhone}
              onChange={(e) => setIssuePhone(e.target.value)}
              inputMode="tel"
              disabled={issueIsMaster}
              placeholder={issueIsMaster ? "Master coupon - belongs to nobody" : "9876543210"}
              className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink disabled:opacity-50"
            />
          </label>
          <button onClick={handleIssue} disabled={issuing}
                  className="rounded-full px-4 py-2 text-xs font-semibold bg-ink text-paper-raised disabled:opacity-50">
            {issuing ? "Issuing..." : "Give coupon"}
          </button>
        </div>
        {lastIssued && (
          <p className="text-sm text-sprout-dark">
            Issued <span className="font-mono font-bold">{lastIssued.code}</span>{lastIssued.phone ? ` to ${lastIssued.phone}` : " (master coupon)"} &mdash;{" "}
            {lastIssued.description}. Expires {new Date(lastIssued.expiresAt).toLocaleDateString()}.
          </p>
        )}
      </div>

      {/* ---------------- check a code ---------------- */}
      <div className="bg-paper-raised border border-line rounded-2xl p-5 space-y-3">
        <p className="font-display text-lg font-semibold text-ink">Check a coupon</p>
        <p className="text-xs text-ink-soft">
          For when a customer quotes a code on the phone. Shows whose it is and whether it can
          still be used - the condition is only tested against a real basket at checkout.
        </p>
        <div className="flex gap-2">
          <input
            value={checkCode}
            onChange={(e) => { setCheckCode(e.target.value.toUpperCase()); setChecked(null); }}
            placeholder="GBAE79V2"
            className="flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink font-mono uppercase"
          />
          <button onClick={handleCheck} disabled={checking || !checkCode.trim()}
                  className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold bg-ink text-paper-raised disabled:opacity-50">
            {checking ? "Checking..." : "Check"}
          </button>
        </div>

        {checked === "none" && (
          <p className="text-sm text-clay">No coupon with that code exists.</p>
        )}
        {checked && checked !== "none" && (
          <div className={`rounded-xl border px-4 py-3 ${
            checked.usedAt || checked.expired ? "border-clay/40 bg-clay/10" : "border-sprout/40 bg-leaf-pale"
          }`}>
            <p className="font-semibold text-ink">
              {checked.usedAt
                ? `Already used${checked.usedOrderId ? ` on order #${checked.usedOrderId}` : ""}`
                : checked.expired
                  ? "Expired"
                  : `Valid - ${formatPrice(checked.discountAmount)} off`}
            </p>
            <p className="text-xs text-ink-soft mt-1">{checked.description}</p>
            <p className="text-xs text-ink-soft mt-0.5">
              Belongs to {checked.phone} &middot; expires {new Date(checked.expiresAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {/* ---------------- issued coupons ---------------- */}
      <div className="bg-paper-raised border border-line rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-lg font-semibold text-ink">Issued coupons</p>
          <div className="flex items-center gap-2">
            <input
              value={filterPhone}
              onChange={(e) => setFilterPhone(e.target.value)}
              placeholder="Filter by phone"
              className="rounded-lg border border-line bg-paper px-3 py-1.5 text-sm text-ink w-40"
            />
            <button onClick={() => load(filterPhone)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold border border-line text-ink-soft">
              Search
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {coupons.map((c) => {
            const state = c.usedAt ? "Used" : c.expired ? "Expired" : "Active";
            const style = c.usedAt ? "bg-line text-ink-soft"
              : c.expired ? "bg-clay/20 text-clay" : "bg-leaf-pale text-sprout-dark";
            return (
              <div key={c.id} className="flex items-start justify-between gap-3 border border-line rounded-xl px-4 py-3">
                <div className="min-w-0">
                  <p className="font-mono font-bold text-ink">{c.code}</p>
                  <p className="text-xs text-ink-soft mt-0.5">
                    {c.reusable ? "Master coupon - any order" : c.phone} &middot; {c.description}
                  </p>
                  <p className="text-[11px] text-ink-soft mt-0.5">
                    Expires {new Date(c.expiresAt).toLocaleDateString()}
                    {c.reusable
                      ? ` - applied to ${c.timesUsed} order${c.timesUsed === 1 ? "" : "s"}`
                      : c.usedOrderId ? ` - used on order #${c.usedOrderId}` : ""}
                  </p>
                  <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${style}`}>
                    {state}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Only for a coupon that can still be used - sending someone a spent or
                      expired code is worse than sending nothing. */}
                  {/* Never for a master coupon: sending a reusable staff code to a customer
                      is exactly how it leaks. */}
                  {!c.reusable && !c.usedAt && !c.expired && couponWhatsAppLink(c, restaurantName) && (
                    <a
                      href={couponWhatsAppLink(c, restaurantName) as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full px-3 py-1 text-xs font-semibold bg-[#25D366] text-white"
                    >
                      WhatsApp
                    </a>
                  )}
                  <button
                    onClick={async () => {
                      if (!confirm(`Delete coupon ${c.code}?`)) return;
                      await deleteCoupon(c.id);
                      await load(filterPhone);
                    }}
                    className="rounded-full px-3 py-1 text-xs font-semibold border border-line text-clay"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          {!loading && coupons.length === 0 && (
            <p className="text-sm text-ink-soft text-center py-4">No coupons issued yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
