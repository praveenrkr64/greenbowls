import Link from "next/link";
import { getCategories, getHeroSlides, getMenu, getPromoBanners, getRestaurantInfo } from "@/lib/api";
import MenuCategoryAccordion from "@/components/MenuCategoryAccordion";
import PromoBannerBar from "@/components/PromoBannerBar";
import CartBar from "@/components/CartBar";
import SubscriptionCard from "@/components/SubscriptionCard";
import HeroSlider from "@/components/HeroSlider";
import IdleMenuRefresh from "@/components/IdleMenuRefresh";
import { Category, HeroSlide, MenuItem, PromoBanner, RestaurantInfo } from "@/lib/types";
import { parseInlineStyle } from "@/lib/format";
import { ChevronIcon, DropletIcon, DumbbellIcon, HeartIcon, InfoIcon, LeafIcon, PhoneIcon, ReceiptIcon, SproutIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const DEFAULT_RESTAURANT: RestaurantInfo = {
  name: "Sprout & Bowl",
  phone: "",
  nameStyle: null,
  tagline: "Fresh food. Real ingredients.",
  taglineStyle: null,
  heroImageUrl: null,
  eyebrowText: "Fresh · High-protein · Made to order",
  eyebrowStyle: null,
  showFeatureBadges: false,
  featureBadgesText: "High Protein, 100% Natural, No Preservatives",
  // Off in the fallback: if the settings call fails we must not advertise a 20-minute
  // promise the kitchen may not be honouring.
  expressDeliveryEnabled: false,
  expressDeliveryMinutes: 20,
  heroRotationMs: 5000,
  aboutUs: null,
  orderConfirmMessage: "We will call you shortly to confirm this order before we start cooking.",
};

const FEATURE_STRIP = [
  { Icon: LeafIcon, label: "Fresh Daily", sub: "Prepared fresh every day" },
  { Icon: DumbbellIcon, label: "High Protein", sub: "Meals that fuel your body" },
  { Icon: DropletIcon, label: "Clean Ingredients", sub: "No preservatives, no artificial flavors" },
  { Icon: HeartIcon, label: "Made with Love", sub: "Hygienic & made just for you" },
];

export default async function MenuPage() {
  let menu: MenuItem[] = [];
  let categories: Category[] = [];
  let error: string | null = null;
  let restaurant: RestaurantInfo = DEFAULT_RESTAURANT;
  let promoBanners: PromoBanner[] = [];
  let heroSlides: HeroSlide[] = [];

  try {
    menu = await getMenu();
  } catch {
    error = "Couldn't load the menu right now. Please check back shortly.";
  }

  try {
    categories = await getCategories();
  } catch {
    categories = [];
  }

  try {
    restaurant = await getRestaurantInfo();
  } catch {
    restaurant = DEFAULT_RESTAURANT;
  }

  try {
    promoBanners = await getPromoBanners();
  } catch {
    promoBanners = [];
  }

  try {
    heroSlides = await getHeroSlides();
  } catch {
    // The banner is decoration; a failure here must not cost the customer the menu.
    heroSlides = [];
  }

  const featureBadges = (restaurant.featureBadgesText || "")
    .split(",")
    .map((label) => label.trim())
    .filter(Boolean);

  return (
    <main className="min-h-screen pb-28">
      <IdleMenuRefresh />
      <header className="px-5 pt-6 pb-2 flex items-center justify-between gap-2 max-w-2xl mx-auto">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* The restaurant name alone -- no logo mark. nameStyle is applied last, so an admin
              who sets an explicit colour there overrides this green rather than fighting it. */}
          <h1
            className="font-display font-bold text-lg text-sprout-dark leading-tight truncate min-w-0"
            style={parseInlineStyle(restaurant.nameStyle)}
          >
            {restaurant.name}
          </h1>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {/* Track first, then the phone. Both are "reach us about an order" actions rather than
              menu navigation, so they sit together; the phone stays filled and last, which keeps
              it the rightmost thumb target on a phone-sized screen. */}
          <Link
            href="/track"
            aria-label="Track my orders"
            title="Track my orders"
            className="shrink-0 flex items-center justify-center h-11 w-11 rounded-full border border-line text-ink-soft hover:text-ink hover:border-sprout transition-colors"
          >
            <ReceiptIcon className="h-5 w-5" />
          </Link>
          {restaurant.phone && (
            <a
              href={`tel:${restaurant.phone.replace(/[^\d+]/g, "")}`}
              aria-label={`Call ${restaurant.phone}`}
              className="shrink-0 flex items-center justify-center gap-2 rounded-full bg-sprout text-paper-raised h-11 w-11 sm:w-auto sm:px-4 sm:py-2.5 text-sm font-semibold hover:bg-sprout-dark transition-colors"
            >
              <PhoneIcon />
              <span className="hidden sm:inline">{restaurant.phone}</span>
            </a>
          )}
        </div>
      </header>

      <section className="px-5 pt-4 pb-2 max-w-2xl mx-auto">
        <p
          className="font-mono text-xs uppercase tracking-widest text-sprout"
          style={parseInlineStyle(restaurant.eyebrowStyle)}
        >
          {restaurant.eyebrowText}
        </p>
        {/* The banner is admin-configurable and IS rendered when images are set; the tagline
            takes its place when they are not. The "no image" instruction was about the logo mark
            beside the restaurant name and the Vercel favicon, not this.
            /api/hero-slides falls back to the legacy single heroImageUrl when no slides are
            configured, so this one branch covers both. */}
        {heroSlides.length > 0 ? (
          <HeroSlider slides={heroSlides} alt={restaurant.name} intervalMs={restaurant.heroRotationMs} />
        ) : (
          <p
            className="font-display text-3xl sm:text-4xl font-bold text-ink mt-2 leading-tight"
            style={parseInlineStyle(restaurant.taglineStyle)}
          >
            {restaurant.tagline}
          </p>
        )}

        {restaurant.showFeatureBadges && featureBadges.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5 mt-5">
            {featureBadges.map((label) => (
              <span
                key={label}
                className="flex items-center gap-2 rounded-full border border-line bg-paper-raised pl-1.5 pr-3 py-1.5 text-xs font-semibold text-ink"
              >
                <span className="h-6 w-6 rounded-full bg-leaf-pale text-sprout-dark flex items-center justify-center">
                  <SproutIcon className="h-3.5 w-3.5" />
                </span>
                {label}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 mt-6">
          <a
            href="#menu"
            // Transparent border so this matches the bordered "Who we are" beside it; without
            // it the two buttons differ by the 2px border and look misaligned.
            className="shrink-0 flex items-center gap-1.5 rounded-full border border-transparent bg-sprout text-paper-raised font-semibold px-6 py-3 hover:bg-sprout-dark transition-colors"
          >
            Order Now
            <ChevronIcon className="h-4 w-4" />
          </a>
          {/* Only rendered once the kitchen has written something - a button leading to an empty
              page is worse than no button. The admin field says as much. */}
          {restaurant.aboutUs && restaurant.aboutUs.trim() && (
            <Link
              href="/about"
              className="shrink-0 flex items-center gap-1.5 rounded-full border border-sprout text-sprout-dark font-semibold px-5 py-3 hover:bg-leaf-pale transition-colors"
            >
              <InfoIcon className="h-4 w-4" />
              Who we are
            </Link>
          )}
        </div>
      </section>

      {promoBanners.map((banner) => (
        <PromoBannerBar key={banner.id} message={banner.message} />
      ))}

      {error && (
        <div className="mx-5 mt-6 max-w-2xl mx-auto rounded-xl border border-clay bg-leaf-pale px-4 py-3 text-sm text-ink">
          {error}
        </div>
      )}

      <div id="menu" className="px-5 mt-5 mb-4 max-w-2xl mx-auto flex items-center justify-center gap-3">
        <span className="h-px w-10 bg-line" />
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-sprout-dark">
          <LeafIcon className="h-3.5 w-3.5" />
          Explore our menu
        </span>
        <span className="h-px w-10 bg-line" />
      </div>

      <div className="px-5 max-w-2xl mx-auto">
        <MenuCategoryAccordion menu={menu} categories={categories} />
      </div>

      {/* Subscriptions sit after the menu: a customer scrolls the bowls first, and the plan
          offer makes sense once they have seen what is on offer. mt-3 matches the space-y-3
          between the category cards above, so this reads as the last card in that stack rather
          than a detached block - it already shares their border/rounding/background. */}
      <section className="px-5 mt-3 max-w-2xl mx-auto">
        <SubscriptionCard />
      </section>

      <section className="px-5 mt-10 max-w-2xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-5 gap-x-3 bg-leaf-pale rounded-2xl p-5">
          {FEATURE_STRIP.map(({ Icon, label, sub }) => (
            <div key={label} className="text-center">
              <span className="mx-auto h-10 w-10 rounded-full bg-paper-raised text-sprout-dark flex items-center justify-center mb-2">
                <Icon className="h-5 w-5" />
              </span>
              <p className="text-sm font-semibold text-ink">{label}</p>
              <p className="text-[11px] text-ink-soft mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      <CartBar />
    </main>
  );
}
