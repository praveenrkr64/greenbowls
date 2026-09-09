"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HeroSlide } from "@/lib/types";

/**
 * The rotating banner at the top of the menu page.
 *
 * <p>Replaces the single hero <img>. Keeps that element's exact framing - full width, capped
 * height, cropped to fill, same rounding and shadow - so the page looks unchanged when only one
 * image is configured, which is the state every existing install starts in.
 *
 * <p>With one slide it renders as a plain image: no autoplay, no dots, no swipe handlers. A
 * carousel of one is just an image, and the controls would be a lie.
 */

/** Used only if the caller passes nothing; the real value is admin-configurable. */
const DEFAULT_ADVANCE_MS = 5000;
/** Below this a horizontal drag is a tap or a vertical scroll, not a swipe. */
const SWIPE_THRESHOLD_PX = 40;

export default function HeroSlider({
  slides,
  alt,
  intervalMs,
}: {
  slides: HeroSlide[];
  alt: string;
  intervalMs?: number;
}) {
  // Guard the floor here too, not just in the API: a stale cached settings response or a value
  // written straight to the database would otherwise strobe the banner.
  const advanceMs = Math.max(500, intervalMs && intervalMs > 0 ? intervalMs : DEFAULT_ADVANCE_MS);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const count = slides.length;
  const multiple = count > 1;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  // Auto-advance. Paused on hover/focus so a customer reading a slide is not yanked off it,
  // and while the tab is hidden so a backgrounded tab does not race through the whole set.
  useEffect(() => {
    if (!multiple || paused) return;
    // Someone who has asked for reduced motion gets a static first slide plus the dots to
    // move themselves - auto-advancing is exactly the motion they turned off.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        setIndex((i) => (i + 1) % count);
      }
    }, advanceMs);
    return () => clearInterval(timer);
  }, [multiple, paused, count, advanceMs]);

  // A slide being removed in the admin while a customer has the page open would otherwise
  // leave index past the end and render nothing.
  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [index, count]);

  if (count === 0) return null;

  const frame = "mt-3 w-full max-h-64 object-cover rounded-2xl shadow-fresh";

  if (!multiple) {
    return <img src={slides[0].imageUrl} alt={alt} className={frame} />;
  }

  return (
    <div
      className="relative mt-3"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current;
        touchStartX.current = null;
        if (start === null) return;
        const dx = e.changedTouches[0].clientX - start;
        if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
        go(index + (dx < 0 ? 1 : -1));
      }}
    >
      {/* Every slide stays mounted and is cross-faded, so the browser has already fetched the
          next image by the time it is shown - swapping the src would flash on a slow connection. */}
      <div className="relative w-full max-h-64 rounded-2xl overflow-hidden shadow-fresh">
        {slides.map((slide, i) => (
          <img
            key={slide.id ?? slide.imageUrl}
            src={slide.imageUrl}
            alt={i === index ? alt : ""}
            aria-hidden={i !== index}
            className={`w-full max-h-64 object-cover transition-opacity duration-500 ${
              i === index ? "opacity-100" : "opacity-0 absolute inset-0"
            }`}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => go(index - 1)}
        aria-label="Previous image"
        className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-paper-raised/80 text-ink flex items-center justify-center text-lg leading-none hover:bg-paper-raised transition-colors"
      >
        &#8249;
      </button>
      <button
        type="button"
        onClick={() => go(index + 1)}
        aria-label="Next image"
        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-paper-raised/80 text-ink flex items-center justify-center text-lg leading-none hover:bg-paper-raised transition-colors"
      >
        &#8250;
      </button>

      <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1.5">
        {slides.map((slide, i) => (
          <button
            key={slide.id ?? slide.imageUrl}
            type="button"
            onClick={() => go(i)}
            aria-label={`Show image ${i + 1} of ${count}`}
            aria-current={i === index}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-5 bg-paper-raised" : "w-1.5 bg-paper-raised/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
