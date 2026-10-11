"use client";

import { useState } from "react";
import { createSubscriptionRequest } from "@/lib/api";
import { LeafIcon, SproutIcon } from "@/components/icons";

/**
 * "Subscribe weekly or monthly" on the menu page.
 *
 * <p>Deliberately NOT a checkout. The customer picks a cadence and leaves a number; the kitchen
 * rings them to agree which bowls, what times and what price. So there is no cart, no total and
 * no payment here - promising any of those on screen would commit the kitchen to terms nobody
 * has discussed yet.
 */

const PLANS = [
  { type: "WEEKLY" as const, title: "Weekly", blurb: "A set of bowls every week" },
  { type: "MONTHLY" as const, title: "Monthly", blurb: "A month of bowls, best value" },
];

export default function SubscriptionCard() {
  const [plan, setPlan] = useState<"WEEKLY" | "MONTHLY" | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"WEEKLY" | "MONTHLY" | null>(null);

  async function handleSubmit() {
    if (!plan) return;
    if (!name.trim() || !phone.trim()) {
      setError("Please tell us your name and phone number so we can call you.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createSubscriptionRequest({ customerName: name.trim(), phone: phone.trim(), planType: plan });
      setDone(plan);
      setPlan(null);
      setName("");
      setPhone("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-sprout/40 bg-leaf-pale px-5 py-6 text-center">
        <span className="mx-auto h-10 w-10 rounded-full bg-paper-raised text-sprout-dark flex items-center justify-center mb-2">
          <SproutIcon className="h-5 w-5" />
        </span>
        <p className="font-display text-lg font-semibold text-ink">
          We&apos;ll call you back
        </p>
        <p className="text-sm text-ink-soft mt-1 max-w-sm mx-auto">
          Thanks for your interest in a {done === "WEEKLY" ? "weekly" : "monthly"} plan. We&apos;ll
          ring you shortly to go through which bowls you&apos;d like, the delivery timings and the
          price.
        </p>
        <button
          onClick={() => setDone(null)}
          className="mt-3 text-sm font-semibold text-sprout-dark underline underline-offset-2"
        >
          Request another plan
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-paper-raised p-5">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-sprout-dark">
        <LeafIcon className="h-3.5 w-3.5" />
        Subscriptions
      </div>
      <p className="font-display text-xl font-bold text-ink mt-1">Eat well, every week</p>
      <p className="text-sm text-ink-soft mt-1">
        Pick a plan and we&apos;ll call you to put it together - the bowls you want, at the times
        that suit you.
      </p>

      <div className="grid grid-cols-2 gap-2 mt-4">
        {PLANS.map((p) => (
          <button
            key={p.type}
            type="button"
            onClick={() => { setPlan(p.type); setError(null); }}
            aria-pressed={plan === p.type}
            className={`rounded-xl border px-3 py-3 text-left transition-colors ${
              plan === p.type
                ? "border-sprout bg-leaf-pale"
                : "border-line bg-paper hover:border-sprout/60"
            }`}
          >
            <span className="block font-semibold text-ink">{p.title}</span>
            <span className="block text-[11px] text-ink-soft mt-0.5">{p.blurb}</span>
          </button>
        ))}
      </div>

      {plan && (
        <div className="mt-4 space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            placeholder="Phone number"
            className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink"
          />
          {error && <p className="text-sm text-clay">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-full bg-sprout text-paper-raised font-semibold px-6 py-3 hover:bg-sprout-dark transition-colors disabled:opacity-50"
          >
            {submitting ? "Sending..." : `Request a ${plan === "WEEKLY" ? "weekly" : "monthly"} plan`}
          </button>
          <p className="text-[11px] text-ink-soft text-center">
            No payment now - we agree everything on the call.
          </p>
        </div>
      )}
    </div>
  );
}
