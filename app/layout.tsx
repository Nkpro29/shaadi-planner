import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const display = localFont({
  src: [
    { path: "./fonts/cormorant-garamond-latin-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/cormorant-garamond-latin-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/cormorant-garamond-latin-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-cormorant",
  display: "swap",
});

const sans = localFont({
  src: [
    { path: "./fonts/nunito-sans-latin-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/nunito-sans-latin-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/nunito-sans-latin-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/nunito-sans-latin-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ShaadiSaathi — Indian Wedding Planner",
  description: "Plan Dripti Kulshresth and Benjamin's wedding: tasks, ceremonies, shopping trips, gifts, guests, and budget.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#6E1E2C",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body className={`${display.variable} ${sans.variable}`}>{children}</body>
    </html>
  );
}
