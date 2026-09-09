import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { getRestaurantInfo } from "@/lib/api";
import { RestaurantInfo } from "@/lib/types";
import { ChevronIcon, LeafIcon, PhoneIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

/**
 * "Who we are" - the kitchen's own story, written by the owner in Restaurant settings.
 *
 * <p>Reached from the button beside Order Now on the menu page, which only appears once there is
 * something here to read. This page still handles the empty case, because someone can clear the
 * text while a customer has the link open, or arrive at /about directly.
 */
export default async function AboutPage() {
  let restaurant: RestaurantInfo | null = null;
  try {
    restaurant = await getRestaurantInfo();
  } catch {
    restaurant = null;
  }

  const about = restaurant?.aboutUs?.trim();

  return (
    <main className="min-h-screen pb-16">
      <SiteHeader title="Who we are" />

      <section className="px-5 pt-6 max-w-2xl mx-auto">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-sprout-dark">
          <LeafIcon className="h-3.5 w-3.5" />
          Our story
        </span>
        <h1 className="font-display text-3xl font-bold text-ink mt-2 leading-tight">
          {restaurant?.name || "Our kitchen"}
        </h1>

        {about ? (
          // Written as plain text in a textarea, so blank lines are the author's paragraph breaks.
          // Split on them rather than rendering raw HTML, which would make the settings field an
          // injection point for anyone who got at the admin panel.
          <div className="mt-5 space-y-4">
            {about.split(/\n\s*\n/).map((paragraph, i) => (
              <p key={i} className="text-ink-soft leading-relaxed whitespace-pre-line">
                {paragraph.trim()}
              </p>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-ink-soft leading-relaxed">
            We haven&apos;t written our story yet - but our kitchen is open and the food is ready.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 mt-8">
          <Link
            href="/"
            className="shrink-0 flex items-center gap-1.5 rounded-full bg-sprout text-paper-raised font-semibold px-6 py-3 hover:bg-sprout-dark transition-colors"
          >
            See the menu
            <ChevronIcon className="h-4 w-4" />
          </Link>
          {restaurant?.phone && (
            <a
              href={`tel:${restaurant.phone.replace(/[^\d+]/g, "")}`}
              className="shrink-0 flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink transition-colors"
            >
              <PhoneIcon />
              {restaurant.phone}
            </a>
          )}
        </div>
      </section>
    </main>
  );
}
