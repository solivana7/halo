import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Halo — AI visibility tracker for wellness brands",
  description: "See where ChatGPT, Perplexity, and Claude cite your wellness business.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
