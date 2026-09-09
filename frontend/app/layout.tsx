import type { Metadata } from "next";
import { Sora, Public_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import OrderAlertWatcher from "@/components/OrderAlertWatcher";
import { getRestaurantInfo } from "@/lib/api";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Generated rather than hardcoded so the browser tab follows the name the admin sets. A
// static "Sprout & Bowl" would keep showing after a rename, in the one place the customer
// cannot correct it.
export async function generateMetadata(): Promise<Metadata> {
  try {
    const info = await getRestaurantInfo();
    return {
      title: info.name,
      description: info.tagline ?? DEFAULT_DESCRIPTION,
    };
  } catch {
    // Settings unavailable at build or request time -- a missing title would render as the
    // URL, so fall back to the known name rather than nothing.
    return { title: "Sprout & Bowl", description: DEFAULT_DESCRIPTION };
  }
}

const DEFAULT_DESCRIPTION =
  "Protein-rich sprouts, chicken, egg and rice bowls, plus detox drinks. Delivered fresh to your apartment.";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sora.variable} ${publicSans.variable} ${plexMono.variable} font-sans antialiased`}>
        <CartProvider>
          {children}
          {/* App-wide, because the customer is rarely still on the order page when
              their food leaves the kitchen. */}
          <OrderAlertWatcher />
        </CartProvider>
      </body>
    </html>
  );
}
