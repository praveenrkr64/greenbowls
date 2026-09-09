"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import { createOrder, getCommunities, getCustomerProfile, getDeliverySlots, getRestaurantInfo } from "@/lib/api";
import Modal from "@/components/Modal";
import { Community, DeliverySlot } from "@/lib/types";
import SiteHeader from "@/components/SiteHeader";

// Same-device convenience: after a successful order, remember delivery details here
// so a returning customer on this browser doesn't have to retype them. If this is
// empty (new device, cleared storage - "session expired"), the phone-number lookup
// effect below fetches the same details from the backend by phone number instead.
const SAVED_DETAILS_KEY = "sprout-bowl-checkout-details";

interface SavedCheckoutDetails {
  customerName: string;
  customerPhone: string;
  communityId: string;
  tower: string;
  flatNumber: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, subtotal, clearCart, hydrated } = useCart();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  // "express" is a sentinel rather than a slot id: express delivery is INSTEAD of a slot,
  // so it cannot be represented as one without inventing a fake row.
  const [deliveryChoice, setDeliveryChoice] = useState<string>("");
  const [expressEnabled, setExpressEnabled] = useState(false);
  const [expressMinutes, setExpressMinutes] = useState(20);
  const [confirmMessage, setConfirmMessage] = useState("");
  // Which single field is wrong, so the message can sit against it rather than in one banner
  // far from the input the customer has to fix.
  const [fieldError, setFieldError] = useState<{ field: string; message: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    communityId: "",
    tower: "",
    flatNumber: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autofilled, setAutofilled] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  // clearCart() after a successful order also empties `lines`, which would
  // otherwise trigger the redirect-to-/cart effect below and steal the
  // navigation to the order confirmation page - this flag tells it to stand down.
  const orderPlacedRef = useRef(false);
  const lookedUpPhoneRef = useRef<string | null>(null);

  useEffect(() => {
    getDeliverySlots().then(setSlots).catch(() => setSlots([]));
    getRestaurantInfo()
      .then((info) => {
        setExpressEnabled(info.expressDeliveryEnabled);
        setExpressMinutes(info.expressDeliveryMinutes || 20);
        setConfirmMessage(info.orderConfirmMessage || "");
      })
      // A failed settings call must not offer express by default -- the kitchen may have
      // switched it off, and promising 20 minutes it cannot meet is worse than not offering.
      .catch(() => setExpressEnabled(false));

    getCommunities()
      .then(setCommunities)
      .catch(() => setError("Couldn't load delivery areas. Please try again shortly."));
  }, []);

  useEffect(() => {
    if (hydrated && lines.length === 0 && !orderPlacedRef.current) router.replace("/cart");
  }, [hydrated, lines, router]);

  // Same-device prefill from a previous order.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SAVED_DETAILS_KEY);
      if (raw) {
        const saved: SavedCheckoutDetails = JSON.parse(raw);
        setForm((f) => ({ ...f, ...saved }));
      }
    } catch {
      // ignore corrupt saved data
    }
  }, []);

  // A saved/looked-up community might have gone inactive since - don't leave a
  // dead option silently selected once the real list of active communities loads.
  useEffect(() => {
    if (communities.length === 0) return;
    setForm((f) =>
      f.communityId && !communities.some((c) => String(c.id) === f.communityId)
        ? { ...f, communityId: "" }
        : f
    );
  }, [communities]);

  // "Session expired" / new device: once a full 10-digit phone is typed with no
  // other details filled in yet, look up this customer's last delivery address by
  // phone alone - no login. Never overwrites fields the customer already has set.
  useEffect(() => {
    const phone = form.customerPhone;
    if (phone.length !== 10) return;
    if (lookedUpPhoneRef.current === phone) return;
    if (form.customerName || form.tower || form.flatNumber) return;
    lookedUpPhoneRef.current = phone;
    getCustomerProfile(phone)
      .then((profile) => {
        if (!profile) {
          // No prior order under this phone - eligible for the first-order welcome offer.
          setIsNewCustomer(true);
          return;
        }
        setForm((f) => ({
          ...f,
          customerName: profile.name,
          tower: profile.tower,
          flatNumber: profile.flatNumber,
          communityId: String(profile.communityId),
        }));
        setAutofilled(true);
      })
      .catch(() => {
        // autofill is a convenience, not a hard dependency - fail silently
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.customerPhone]);

  /**
   * The first thing that is wrong, in the order the customer reads the form.
   *
   * Returning the FIELD rather than just a message is what lets the page put the cursor where
   * the problem is. Scanning top to bottom matters: reporting the delivery slot first when the
   * name is also blank sends the customer to the bottom of the form and back again.
   */
  function firstProblem(): { field: string; message: string } | null {
    if (!form.customerName.trim()) {
      return { field: "customerName", message: "Please enter your name." };
    }
    if (!/^[0-9]{10}$/.test(form.customerPhone)) {
      return { field: "customerPhone", message: "Please enter a valid 10-digit phone number." };
    }
    if (!form.communityId) {
      return {
        field: "communityId",
        message: "Please select your apartment community — we only deliver to a few served areas.",
      };
    }
    if (!form.tower.trim()) {
      return { field: "tower", message: "Please enter your tower or block." };
    }
    if (!form.flatNumber.trim()) {
      return { field: "flatNumber", message: "Please enter your flat number." };
    }
    // Mandatory, not conditional: the server rejects an order without a delivery choice, so
    // letting it through here would turn a clear inline message into a failed request.
    if (!deliveryChoice) {
      return { field: "deliveryChoice", message: "Please choose a delivery time." };
    }
    return null;
  }

  function focusProblem(problem: { field: string; message: string }) {
    setFieldError(problem);
    const el = fieldRefs.current[problem.field];
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    // Radio groups have no single focusable element, so fall back to the first input inside.
    (el instanceof HTMLInputElement || el instanceof HTMLSelectElement
      ? el
      : el?.querySelector<HTMLInputElement>("input")
    )?.focus();
  }

  // Step 1 of placing an order: validate, then show the confirmation dialog. The order is
  // only actually submitted from the dialog, so the customer sees the total before committing.
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const problem = firstProblem();
    if (problem) {
      focusProblem(problem);
      return;
    }
    setFieldError(null);
    setShowConfirm(true);
  }

  // Rendered directly beneath the offending field. One message in one place beats a banner at
  // the top of a long form, which the customer has usually scrolled past by the time they submit.
  function FieldError({ field }: { field: string }) {
    if (fieldError?.field !== field) return null;
    return <p className="text-sm text-clay font-medium mt-1">{fieldError.message}</p>;
  }

  async function placeOrder() {
    setShowConfirm(false);
    setError(null);

    setSubmitting(true);
    try {
      const order = await createOrder({
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        communityId: Number(form.communityId),
        tower: form.tower,
        flatNumber: form.flatNumber,
        notes: form.notes || undefined,
        expressDelivery: deliveryChoice === "express",
        deliverySlotId: deliveryChoice && deliveryChoice !== "express" ? Number(deliveryChoice) : null,
        items: lines.map((l) => ({
          menuItemId: l.menuItem.id,
          quantity: l.quantity,
          selectedOptionIds: l.selections.map((s) => s.optionId),
        })),
      });
      orderPlacedRef.current = true;
      try {
        const details: SavedCheckoutDetails = {
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          communityId: form.communityId,
          tower: form.tower,
          flatNumber: form.flatNumber,
        };
        window.localStorage.setItem(SAVED_DETAILS_KEY, JSON.stringify(details));
      } catch {
        // ignore storage errors (private browsing, quota, etc.) - not critical
      }
      clearCart();
      router.push(`/order/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong placing your order.");
    } finally {
      setSubmitting(false);
    }
  }

  // Preview only - the backend independently verifies first-order eligibility and
  // computes the authoritative discount, so this can't be gamed by tampering with the client.
  const estimatedDiscount = isNewCustomer ? Math.round(Math.min(subtotal * 0.5, 100) * 100) / 100 : 0;
  const estimatedTotal = subtotal - estimatedDiscount;

  return (
    <main className="min-h-screen pb-48 max-w-lg mx-auto">
      <SiteHeader title="Checkout" />
      <p className="px-5 pt-4 text-sm text-ink-soft">
        We currently deliver only to select apartment communities.
      </p>

      <form id="checkout-form" onSubmit={handleSubmit} className="px-5 mt-4 space-y-5">
        {error && (
          <div className="rounded-xl border border-clay bg-leaf-pale px-4 py-3 text-sm text-ink">
            {error}
          </div>
        )}

        {autofilled && (
          <div className="rounded-xl border border-line bg-leaf-pale px-4 py-3 text-sm text-sprout-dark">
            Welcome back! We filled in your details from your last order &mdash; feel free to update anything.
          </div>
        )}

        {isNewCustomer && (
          <div className="rounded-xl border border-turmeric-dark bg-turmeric/20 px-4 py-3 text-sm text-ink">
            <span className="font-semibold">First order? You&rsquo;re in luck</span> &mdash; get 50% off this
            order (up to &#8377;100), applied automatically at checkout.
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-ink mb-1">Phone number</label>
          <input
            required
            type="tel"
            inputMode="numeric"
            pattern="[0-9]{10}"
            maxLength={10}
            autoFocus
            ref={(el) => { fieldRefs.current["customerPhone"] = el; }}
            value={form.customerPhone}
            onChange={(e) => setForm({ ...form, customerPhone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
            className="w-full rounded-xl border border-line bg-paper-raised px-4 py-3 text-ink"
            placeholder="10-digit mobile number"
          />
          <FieldError field="customerPhone" />
          {form.customerPhone.length > 0 && form.customerPhone.length < 10 && (
            <p className="text-xs text-clay mt-1">Enter all 10 digits ({form.customerPhone.length}/10)</p>
          )}
          {!autofilled && form.customerPhone.length < 10 && (
            <p className="text-xs text-ink-soft mt-1">
              We&rsquo;ll fill in your details automatically if you&rsquo;ve ordered before.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink mb-1">Your name</label>
          <input
            required
            ref={(el) => { fieldRefs.current["customerName"] = el; }}
            value={form.customerName}
            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            className="w-full rounded-xl border border-line bg-paper-raised px-4 py-3 text-ink"
            placeholder="Full name"
          />
          <FieldError field="customerName" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink mb-1">Apartment community</label>
          <select
            required
            ref={(el) => { fieldRefs.current["communityId"] = el; }}
            value={form.communityId}
            onChange={(e) => setForm({ ...form, communityId: e.target.value })}
            className="w-full rounded-xl border border-line bg-paper-raised px-4 py-3 text-ink"
          >
            <option value="">Select your community</option>
            {communities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <FieldError field="communityId" />
        </div>

        {slots.length === 0 && !expressEnabled && (
          <p className="text-sm text-clay bg-clay/10 border border-clay/30 rounded-xl px-4 py-3">
            No delivery times are available right now, so orders cannot be placed. Please try
            again shortly.
          </p>
        )}

        {(slots.length > 0 || expressEnabled) && (
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">
              Delivery time <span className="text-clay">*</span>
            </label>
            <div
              className="space-y-2 scroll-mt-24"
              ref={(el) => { fieldRefs.current["deliveryChoice"] = el; }}
            >
              {expressEnabled && (
                <label className="flex items-center gap-3 rounded-xl border border-sprout/40 bg-leaf-pale px-4 py-3 cursor-pointer">
                  <input
                    type="radio"
                    name="deliveryChoice"
                    value="express"
                    checked={deliveryChoice === "express"}
                    onChange={(e) => setDeliveryChoice(e.target.value)}
                    className="accent-sprout"
                  />
                  <span className="flex-1">
                    <span className="font-semibold text-sprout-dark">Express delivery</span>
                    <span className="block text-sm text-ink-soft">
                      Delivered in about {expressMinutes} minutes
                    </span>
                  </span>
                </label>
              )}

              {/* Unavailable slots are shown disabled rather than hidden. A customer whose
                  usual 12:00 slot has simply passed or filled needs to see why it is gone,
                  not a silently shorter list. */}
              {slots.map((slot) => (
                <label
                  key={slot.id}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                    slot.available
                      ? "border-line bg-paper-raised cursor-pointer"
                      : "border-line/60 bg-paper opacity-60 cursor-not-allowed"
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryChoice"
                    value={String(slot.id)}
                    disabled={!slot.available}
                    checked={deliveryChoice === String(slot.id)}
                    onChange={(e) => setDeliveryChoice(e.target.value)}
                    className="accent-sprout"
                  />
                  <span className="flex-1">
                    <span className="font-semibold text-ink">{slot.label}</span>
                    <span className="block text-sm text-ink-soft">
                      {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
                      {slot.unavailableReason ? ` - ${slot.unavailableReason}` : ""}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <FieldError field="deliveryChoice" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">Tower / Block</label>
            <input
              required
              ref={(el) => { fieldRefs.current["tower"] = el; }}
            value={form.tower}
              onChange={(e) => setForm({ ...form, tower: e.target.value })}
              className="w-full rounded-xl border border-line bg-paper-raised px-4 py-3 text-ink"
              placeholder="e.g. Tower B"
            />
            <FieldError field="tower" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">Flat number</label>
            <input
              required
              ref={(el) => { fieldRefs.current["flatNumber"] = el; }}
            value={form.flatNumber}
              onChange={(e) => setForm({ ...form, flatNumber: e.target.value })}
              className="w-full rounded-xl border border-line bg-paper-raised px-4 py-3 text-ink"
              placeholder="e.g. 1204"
            />
            <FieldError field="flatNumber" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink mb-1">
            Notes <span className="text-ink-soft font-normal">(optional)</span>
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full rounded-xl border border-line bg-paper-raised px-4 py-3 text-ink"
            rows={2}
            placeholder="Gate code, landmark, spice preference, etc."
          />
        </div>

      </form>

      <div className="fixed bottom-4 left-0 right-0 px-5">
        <div className="max-w-lg mx-auto bg-paper-raised border border-line rounded-2xl shadow-fresh px-5 py-4">
          {isNewCustomer && estimatedDiscount > 0 && (
            <>
              <div className="flex items-center justify-between mb-1 text-sm">
                <span className="text-ink-soft">Subtotal</span>
                <span className="font-mono text-ink-soft">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-sprout-dark">Welcome offer (50% off, up to &#8377;100)</span>
                <span className="font-mono text-sprout-dark">&minus;{formatPrice(estimatedDiscount)}</span>
              </div>
            </>
          )}
          <div className="flex items-center justify-between mb-2">
            <span className="text-ink-soft text-sm">Total</span>
            <span className="font-mono text-lg text-ink">{formatPrice(estimatedTotal)}</span>
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={submitting}
            className="w-full rounded-xl bg-sprout text-paper-raised font-semibold py-3.5 disabled:opacity-50 hover:bg-sprout-dark transition-colors"
          >
            {submitting ? "Placing order..." : "Place order"}
          </button>
        </div>
      </div>

      {showConfirm && (
        <Modal title="Confirm your order" onClose={() => setShowConfirm(false)}>
          <div className="space-y-4">
            {/* Admin-configurable, so what the kitchen promises at the moment of commitment
                can change without a deploy. */}
            {confirmMessage && <p className="text-sm text-ink">{confirmMessage}</p>}

            <div className="rounded-xl border border-line bg-paper p-4 space-y-1.5">
              <div className="flex justify-between text-sm text-ink-soft">
                <span>Subtotal</span>
                <span className="font-mono">{formatPrice(subtotal)}</span>
              </div>
              {estimatedDiscount > 0 && (
                <div className="flex justify-between text-sm text-sprout-dark">
                  <span>Welcome offer</span>
                  <span className="font-mono">&minus;{formatPrice(estimatedDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-ink pt-1.5 border-t border-line">
                <span>Total to pay</span>
                <span className="font-mono text-lg">{formatPrice(estimatedTotal)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-xl border border-line text-ink font-semibold py-3"
              >
                Back
              </button>
              <button
                onClick={placeOrder}
                disabled={submitting}
                className="flex-1 rounded-xl bg-sprout text-paper-raised font-semibold py-3 disabled:opacity-50 hover:bg-sprout-dark transition-colors"
              >
                {submitting ? "Placing..." : "Confirm order"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
