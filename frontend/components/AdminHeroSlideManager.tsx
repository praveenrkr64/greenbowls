"use client";

import { useEffect, useRef, useState } from "react";
import {
  createHeroSlide,
  deleteHeroSlide,
  getAdminHeroSlides,
  getAdminRestaurantInfo,
  updateHeroSlide,
  updateRestaurantInfo,
  uploadMedia,
} from "@/lib/api";
import { HeroSlideAdmin } from "@/lib/types";

/** Mirrors the server floor - see RestaurantSettingsAdminRequest.heroRotationMs. */
const MIN_ROTATION_MS = 500;
const MAX_ROTATION_MS = 60000;

/**
 * Manages the images in the rotating banner at the top of the customer menu page.
 *
 * <p>Upload is the primary action rather than a URL field: the admin picks files and each one is
 * uploaded and saved as a slide in one step. Multiple files can be selected at once, since
 * "I want several images" is the whole point of this screen.
 */
export default function AdminHeroSlideManager() {
  const [slides, setSlides] = useState<HeroSlideAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  // Rotation speed lives on RestaurantSettings, but it is edited here because this is the card
  // that owns the banner - splitting it into Restaurant details is what made the old single
  // hero-image control so easy to reach for by mistake.
  const [rotationMs, setRotationMs] = useState("");
  const [savingSpeed, setSavingSpeed] = useState(false);
  const [speedSaved, setSpeedSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const [data, settings] = await Promise.all([getAdminHeroSlides(), getAdminRestaurantInfo()]);
      setSlides(data);
      setRotationMs(String(settings.heroRotationMs));
      setError(null);
    } catch {
      setError("Couldn't load banner images.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSpeed() {
    const value = Number(rotationMs);
    if (!Number.isInteger(value) || value < MIN_ROTATION_MS || value > MAX_ROTATION_MS) {
      setError(`Rotation speed must be a whole number between ${MIN_ROTATION_MS} and ${MAX_ROTATION_MS} ms.`);
      return;
    }
    setSavingSpeed(true);
    setError(null);
    setSpeedSaved(false);
    try {
      // Read-modify-write: this endpoint takes the whole settings object, so posting only the
      // speed would blank the name and phone alongside it.
      const current = await getAdminRestaurantInfo();
      await updateRestaurantInfo({
        name: current.name,
        phone: current.phone,
        nameStyle: current.nameStyle || "",
        tagline: current.tagline || "",
        taglineStyle: current.taglineStyle || "",
        heroImageUrl: current.heroImageUrl || "",
        eyebrowText: current.eyebrowText || "",
        eyebrowStyle: current.eyebrowStyle || "",
        showFeatureBadges: current.showFeatureBadges,
        featureBadgesText: current.featureBadgesText || "",
        adminEmail: current.adminEmail || "",
        expressDeliveryEnabled: current.expressDeliveryEnabled,
        expressDeliveryMinutes: current.expressDeliveryMinutes,
        orderConfirmMessage: current.orderConfirmMessage || "",
        heroRotationMs: value,
      });
      setSpeedSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save the rotation speed.");
    } finally {
      setSavingSpeed(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);

    // New slides go after the existing ones, in the order they were picked.
    let nextSort = slides.reduce((max, s) => Math.max(max, s.sortOrder), 0) + 1;
    const picked = Array.from(files);
    let failed = 0;

    for (let i = 0; i < picked.length; i++) {
      setProgress(`Uploading ${i + 1} of ${picked.length}...`);
      try {
        const { url } = await uploadMedia(picked[i]);
        await createHeroSlide({ enabled: true, imageUrl: url, sortOrder: nextSort++ });
      } catch {
        // Keep going: one rejected file (wrong type, too large) should not discard the rest.
        failed++;
      }
    }

    setProgress(null);
    setUploading(false);
    if (failed > 0) {
      setError(
        `${failed} of ${picked.length} image(s) couldn't be added. JPEG, PNG, WebP and GIF are accepted.`,
      );
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    await load();
  }

  async function handleToggle(slide: HeroSlideAdmin) {
    try {
      await updateHeroSlide(slide.id, {
        enabled: !slide.enabled,
        imageUrl: slide.imageUrl,
        sortOrder: slide.sortOrder,
      });
      await load();
    } catch {
      alert("Couldn't update this image.");
    }
  }

  // Swaps this slide's position with its neighbour. Two writes rather than a reorder endpoint,
  // which keeps the API the same shape as every other admin list here.
  async function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;
    const a = slides[index];
    const b = slides[target];
    // Equal sortOrders would leave the order down to the id tiebreak and the move would
    // appear to do nothing, so give them distinct values based on position.
    try {
      await updateHeroSlide(a.id, { enabled: a.enabled, imageUrl: a.imageUrl, sortOrder: target });
      await updateHeroSlide(b.id, { enabled: b.enabled, imageUrl: b.imageUrl, sortOrder: index });
      await load();
    } catch {
      alert("Couldn't reorder the images.");
    }
  }

  async function handleDelete(slide: HeroSlideAdmin) {
    if (!confirm("Remove this image from the banner?")) return;
    try {
      await deleteHeroSlide(slide.id);
      await load();
    } catch {
      alert("Couldn't remove this image.");
    }
  }

  const liveCount = slides.filter((s) => s.enabled).length;

  return (
    <div className="bg-paper-raised border border-line rounded-2xl p-5 mb-6 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-ink">Menu banner images</p>
          <p className="text-xs text-ink-soft mt-0.5">
            Shown at the top of the customer menu page. Add more than one and they rotate
            automatically as a slider - customers can also swipe or tap the dots.
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold bg-ink text-paper-raised disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "+ Add images"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <div className="flex flex-wrap items-end gap-2 border-t border-line pt-3">
        <label className="text-xs text-ink-soft block">
          Rotation speed (milliseconds)
          <input
            type="number"
            inputMode="numeric"
            min={MIN_ROTATION_MS}
            max={MAX_ROTATION_MS}
            step={100}
            value={rotationMs}
            onChange={(e) => {
              setRotationMs(e.target.value);
              setSpeedSaved(false);
            }}
            className="mt-1 w-32 rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
          />
        </label>
        <button
          onClick={handleSaveSpeed}
          disabled={savingSpeed}
          className="rounded-full px-4 py-2 text-xs font-semibold bg-ink text-paper-raised disabled:opacity-50"
        >
          {savingSpeed ? "Saving..." : "Save speed"}
        </button>
        <p className="text-[11px] text-ink-soft pb-2">
          {speedSaved
            ? "Saved - reload the menu page to see it."
            : `How long each image is held. ${MIN_ROTATION_MS}-${MAX_ROTATION_MS} ms (1000 ms = 1 second). Only applies with two or more live images.`}
        </p>
      </div>

      {progress && <p className="text-sm text-ink-soft">{progress}</p>}
      {error && <p className="text-sm text-clay">{error}</p>}
      {loading && <p className="text-sm text-ink-soft">Loading banner images...</p>}

      {!loading && slides.length > 0 && (
        <p className="text-xs text-ink-soft">
          {liveCount === 0
            ? "No images are live - the menu page is showing the tagline instead."
            : liveCount === 1
              ? "1 image live - it shows as a still banner, with no rotation."
              : `${liveCount} images live - they rotate every ${rotationMs || 5000} ms.`}
        </p>
      )}

      <div className="space-y-2">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="flex items-center gap-3 border border-line rounded-xl px-3 py-2"
          >
            <img
              src={slide.imageUrl}
              alt=""
              className="h-14 w-24 shrink-0 object-cover rounded-lg border border-line"
            />
            <div className="min-w-0 flex-1">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  slide.enabled ? "bg-leaf-pale text-sprout-dark" : "bg-line text-ink-soft"
                }`}
              >
                {slide.enabled ? "Live" : "Off"}
              </span>
              <p className="text-[11px] text-ink-soft truncate mt-1">Position {index + 1}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleMove(index, -1)}
                disabled={index === 0}
                aria-label="Move earlier"
                className="rounded-full h-7 w-7 text-xs font-semibold border border-line text-ink-soft disabled:opacity-30"
              >
                &#8593;
              </button>
              <button
                onClick={() => handleMove(index, 1)}
                disabled={index === slides.length - 1}
                aria-label="Move later"
                className="rounded-full h-7 w-7 text-xs font-semibold border border-line text-ink-soft disabled:opacity-30"
              >
                &#8595;
              </button>
              <button
                onClick={() => handleToggle(slide)}
                className="rounded-full px-3 py-1 text-xs font-semibold border border-line text-ink-soft"
              >
                {slide.enabled ? "Turn off" : "Turn on"}
              </button>
              <button
                onClick={() => handleDelete(slide)}
                className="rounded-full px-3 py-1 text-xs font-semibold border border-line text-clay"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {!loading && slides.length === 0 && (
          <p className="text-sm text-ink-soft text-center py-6">
            No banner images yet. Any image set in Restaurant settings still shows until you add
            one here.
          </p>
        )}
      </div>
    </div>
  );
}
