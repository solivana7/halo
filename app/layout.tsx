import type { Metadata } from "next";
import { Jost, Montserrat, Playfair_Display } from "next/font/google";
import "./globals.css";

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-jost",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-montserrat",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Halo — AI Visibility for Wellness Brands",
  description:
    "See exactly where ChatGPT, Perplexity, and Claude cite your wellness business — and where competitors are taking your slot.",
  metadataBase: new URL("https://halo.solivana.io"),
  openGraph: {
    title: "Halo — AI Visibility for Wellness Brands",
    description:
      "See exactly where ChatGPT, Perplexity, and Claude cite your wellness business.",
    url: "https://halo.solivana.io",
    siteName: "Halo",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jost.variable} ${montserrat.variable} ${playfair.variable}`}>
      <body>
        <a href="#main" className="skip-link">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
