"use client";

import { useEffect, useState } from "react";
import { getAdminRestaurantInfo, updateRestaurantInfo } from "@/lib/api";
import { parseInlineStyle } from "@/lib/format";

export default function AdminRestaurantSettingsManager() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nameStyle, setNameStyle] = useState("");
  const [tagline, setTagline] = useState("");
  const [taglineStyle, setTaglineStyle] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [eyebrowText, setEyebrowText] = useState("");
  const [eyebrowStyle, setEyebrowStyle] = useState("");
  const [showFeatureBadges, setShowFeatureBadges] = useState(false);
  const [featureBadgesText, setFeatureBadgesText] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [expressDeliveryEnabled, setExpressDeliveryEnabled] = useState(false);
  const [expressDeliveryMinutes, setExpressDeliveryMinutes] = useState(20);
  const [orderConfirmMessage, setOrderConfirmMessage] = useState("");
  const [aboutUs, setAboutUs] = useState("");
  const [mailHost, setMailHost] = useState("");
  const [mailPort, setMailPort] = useState<number | "">("");
  const [mailUsername, setMailUsername] = useState("");
  const [mailFrom, setMailFrom] = useState("");
  // Write-only: the server never sends the stored password back, it only says whether one exists.
  const [mailPassword, setMailPassword] = useState("");
  const [mailPasswordSet, setMailPasswordSet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getAdminRestaurantInfo()
      .then((info) => {
        setName(info.name);
        setPhone(info.phone);
        setNameStyle(info.nameStyle || "");
        setTagline(info.tagline || "");
        setTaglineStyle(info.taglineStyle || "");
        setHeroImageUrl(info.heroImageUrl || "");
        setEyebrowText(info.eyebrowText || "");
        setEyebrowStyle(info.eyebrowStyle || "");
        setShowFeatureBadges(info.showFeatureBadges);
        setFeatureBadgesText(info.featureBadgesText || "");
        setAdminEmail(info.adminEmail || "");
        setExpressDeliveryEnabled(info.expressDeliveryEnabled);
        setExpressDeliveryMinutes(info.expressDeliveryMinutes || 20);
        setOrderConfirmMessage(info.orderConfirmMessage || "");
        setAboutUs(info.aboutUs || "");
        setMailHost(info.mailHost || "");
        setMailPort(info.mailPort ?? "");
        setMailUsername(info.mailUsername || "");
        setMailFrom(info.mailFrom || "");
        setMailPasswordSet(info.mailPasswordSet);
      })
      .catch(() => setError("Couldn't load restaurant settings."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!name.trim() || !phone.trim()) {
      setError("Name and phone number are required.");
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await updateRestaurantInfo({
        name: name.trim(),
        phone: phone.trim(),
        nameStyle: nameStyle.trim(),
        tagline: tagline.trim(),
        taglineStyle: taglineStyle.trim(),
        heroImageUrl: heroImageUrl.trim(),
        eyebrowText: eyebrowText.trim(),
        eyebrowStyle: eyebrowStyle.trim(),
        showFeatureBadges,
        featureBadgesText: featureBadgesText.trim(),
        adminEmail: adminEmail.trim(),
        expressDeliveryEnabled,
        expressDeliveryMinutes,
        orderConfirmMessage: orderConfirmMessage.trim(),
        aboutUs: aboutUs.trim(),
        mailHost: mailHost.trim(),
        mailPort: mailPort === "" ? null : Number(mailPort),
        mailUsername: mailUsername.trim(),
        mailFrom: mailFrom.trim(),
        // Only sent when the admin actually typed one; blank leaves the stored one alone.
        ...(mailPassword.trim() ? { mailPassword: mailPassword.trim() } : {}),
      });
      setName(updated.name);
      setPhone(updated.phone);
      setNameStyle(updated.nameStyle || "");
      setTagline(updated.tagline || "");
      setTaglineStyle(updated.taglineStyle || "");
      setHeroImageUrl(updated.heroImageUrl || "");
      setEyebrowText(updated.eyebrowText || "");
      setEyebrowStyle(updated.eyebrowStyle || "");
      setShowFeatureBadges(updated.showFeatureBadges);
      setFeatureBadgesText(updated.featureBadgesText || "");
      setAdminEmail(updated.adminEmail || "");
      setExpressDeliveryEnabled(updated.expressDeliveryEnabled);
      setExpressDeliveryMinutes(updated.expressDeliveryMinutes || 20);
      setOrderConfirmMessage(updated.orderConfirmMessage || "");
      setAboutUs(updated.aboutUs || "");
      setMailPasswordSet(updated.mailPasswordSet);
      setMailPassword("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save restaurant settings.");
    } finally {
      setSaving(false);
    }
  }


  if (loading) {
    return <p className="text-sm text-ink-soft mb-4">Loading restaurant settings...</p>;
  }

  return (
    <div className="bg-paper-raised border border-line rounded-2xl p-5 mb-6 space-y-3">
      <p className="font-display text-lg font-semibold text-ink">Restaurant details</p>
      <p className="text-xs text-ink-soft">
        Shown in the header of the customer menu page.
      </p>

      <label className="text-xs text-ink-soft block">
        Restaurant name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
        />
      </label>

      <label className="text-xs text-ink-soft block">
        Name styling (raw CSS, optional - e.g. <code>color: #ff6b35; font-style: italic;</code>)
        <input
          value={nameStyle}
          onChange={(e) => setNameStyle(e.target.value)}
          placeholder="e.g. color: #ff6b35; letter-spacing: 1px;"
          className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink font-mono"
        />
      </label>

      {name.trim() && (
        <div className="rounded-lg border border-line bg-paper px-4 py-3">
          <p className="text-[10px] text-ink-soft uppercase tracking-wide mb-1">Preview</p>
          {eyebrowText.trim() && (
            <p className="text-[11px] uppercase tracking-widest text-sprout font-mono" style={parseInlineStyle(eyebrowStyle)}>
              {eyebrowText}
            </p>
          )}
          <p className="font-display text-2xl font-semibold text-ink" style={parseInlineStyle(nameStyle)}>
            {name}
          </p>
          {heroImageUrl.trim() ? (
            <img
              src={heroImageUrl}
              alt={name}
              className="mt-2 w-full max-h-40 object-cover rounded-lg"
            />
          ) : (
            tagline.trim() && (
              <p className="text-sm mt-1" style={parseInlineStyle(taglineStyle)}>
                {tagline}
              </p>
            )
          )}
        </div>
      )}

      <label className="text-xs text-ink-soft block">
        Eyebrow text (small line shown above the headline)
        <input
          value={eyebrowText}
          onChange={(e) => setEyebrowText(e.target.value)}
          placeholder="e.g. Fresh - High-protein - Made to order"
          className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
        />
      </label>

      <label className="text-xs text-ink-soft block">
        Eyebrow text styling (raw CSS, optional)
        <input
          value={eyebrowStyle}
          onChange={(e) => setEyebrowStyle(e.target.value)}
          placeholder="e.g. color: #1fa463; letter-spacing: 2px;"
          className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink font-mono"
        />
      </label>

      <label className="text-xs text-ink-soft flex items-center gap-2">
        <input
          type="checkbox"
          checked={showFeatureBadges}
          onChange={(e) => setShowFeatureBadges(e.target.checked)}
        />
        Show feature badges below the hero image
      </label>

      <label className="text-xs text-ink-soft block">
        Feature badges text (comma-separated)
        <input
          value={featureBadgesText}
          onChange={(e) => setFeatureBadgesText(e.target.value)}
          placeholder="e.g. High Protein, 100% Natural, No Preservatives"
          className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
        />
      </label>

      {/* The single hero image is NO LONGER uploadable here - "Menu banner images" below owns
          the banner and takes any number of images. Two upload controls for the same banner meant
          the one labelled "Hero image" got used and only ever held one file. The stored value is
          still shown and still honoured (HeroSlideService falls back to it when no slides exist),
          so an existing banner keeps working; it just cannot be set from here any more. */}
      {heroImageUrl.trim() && (
        <div className="text-xs text-ink-soft block">
          Hero image (legacy - superseded by &ldquo;Menu banner images&rdquo; below)
          <div className="mt-1 flex items-center gap-3">
            <img src={heroImageUrl} alt="" className="h-10 w-10 rounded-lg object-cover border border-line" />
            <span className="text-[11px] text-ink-soft">
              Still shown until you add banner images below, which replace it.
            </span>
            <button
              type="button"
              onClick={() => setHeroImageUrl("")}
              className="text-xs font-semibold text-clay hover:underline"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Email notifications. These live in the database rather than only in server environment
          variables so they can be changed from here - editing an env var needs shell access to
          the server, which a rotating home IP makes unreliable. */}
      <div className="border-t border-line pt-3 mt-3 space-y-3">
        <div>
          <p className="text-sm font-semibold text-ink">Email notifications</p>
          <p className="text-[11px] text-ink-soft mt-0.5">
            Sends you an email on every new order and every weekly/monthly plan request. For
            Gmail use an App Password (needs 2-Step Verification), not your account password.
            Anything set here overrides the server&rsquo;s own configuration.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-ink-soft block">
            SMTP host
            <input
              value={mailHost}
              onChange={(e) => setMailHost(e.target.value)}
              placeholder="smtp.gmail.com"
              className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
            />
          </label>
          <label className="text-xs text-ink-soft block">
            Port
            <input
              type="number"
              value={mailPort}
              onChange={(e) => setMailPort(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="587"
              className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
            />
          </label>
        </div>

        <label className="text-xs text-ink-soft block">
          SMTP username (the sending address)
          <input
            value={mailUsername}
            onChange={(e) => setMailUsername(e.target.value)}
            placeholder="mrgreenbowls@gmail.com"
            className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
          />
        </label>

        <label className="text-xs text-ink-soft block">
          App password
          <input
            type="password"
            value={mailPassword}
            onChange={(e) => setMailPassword(e.target.value)}
            placeholder={mailPasswordSet ? "Saved - leave blank to keep it" : "16-character app password"}
            autoComplete="new-password"
            className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
          />
          <span className="text-[11px] text-ink-soft">
            {mailPasswordSet
              ? "A password is saved. It is never shown again - type a new one only to replace it."
              : "No password saved yet, so no email is being sent."}
          </span>
        </label>

        <label className="text-xs text-ink-soft block">
          From address (optional - defaults to the username)
          <input
            value={mailFrom}
            onChange={(e) => setMailFrom(e.target.value)}
            placeholder="mrgreenbowls@gmail.com"
            className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
          />
        </label>
      </div>

      <label className="text-xs text-ink-soft block">
        Who we are (your story - shown on the About page)
        <textarea
          value={aboutUs}
          onChange={(e) => setAboutUs(e.target.value)}
          rows={6}
          maxLength={4000}
          placeholder="e.g. We are a two-person kitchen in Bengaluru cooking the food we grew up on..."
          className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
        />
        <span className="text-[11px] text-ink-soft">
          Leave blank to hide the &ldquo;Who we are&rdquo; button on the menu page. Leave a blank
          line between paragraphs. {aboutUs.length}/4000
        </span>
      </label>

      <label className="text-xs text-ink-soft block">
        Tagline (shown under the name when the banner has no images)
        <input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="e.g. Build your bowl. Pick your sprouts, your protein, your rice..."
          className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
        />
      </label>

      <label className="text-xs text-ink-soft block">
        Tagline styling (raw CSS, optional)
        <input
          value={taglineStyle}
          onChange={(e) => setTaglineStyle(e.target.value)}
          placeholder="e.g. color: #5c6b60; font-style: italic;"
          className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink font-mono"
        />
      </label>

      <label className="text-xs text-ink-soft block">
        Phone number
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
        />
      </label>

      <label className="text-xs text-ink-soft block">
        Notification email (optional - receives an email on every new order and when an
        order is marked delivered)
        <input
          type="email"
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          placeholder="e.g. kitchen@example.com"
          className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
        />
      </label>

      <label className="text-xs text-ink-soft block">
        Order confirmation message (shown in the popup when a customer presses Place order,
        above the cart total)
        <textarea
          rows={2}
          maxLength={500}
          value={orderConfirmMessage}
          onChange={(e) => setOrderConfirmMessage(e.target.value)}
          placeholder="We will call you shortly to confirm this order before we start cooking."
          className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
        />
      </label>

      <div className="rounded-lg border border-line bg-paper p-3 space-y-2">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={expressDeliveryEnabled}
            onChange={(e) => setExpressDeliveryEnabled(e.target.checked)}
            className="accent-sprout"
          />
          Offer express delivery at checkout
        </label>
        <p className="text-xs text-ink-soft">
          When on, customers can skip the delivery slots and choose express instead. Turning it
          off hides the option immediately - orders already placed keep theirs.
        </p>
        <label className="text-xs text-ink-soft block">
          Promised minutes
          <input
            type="number"
            min={1}
            value={expressDeliveryMinutes}
            onChange={(e) => setExpressDeliveryMinutes(Number(e.target.value))}
            disabled={!expressDeliveryEnabled}
            className="mt-1 w-28 rounded-lg border border-line bg-paper-raised px-3 py-2 text-sm text-ink disabled:opacity-50"
          />
        </label>
      </div>

      {error && <p className="text-sm text-clay">{error}</p>}

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-full px-4 py-1.5 text-xs font-semibold bg-ink text-paper-raised disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {saved && <span className="text-xs font-semibold text-sprout-dark">Saved</span>}
      </div>
    </div>
  );
}
