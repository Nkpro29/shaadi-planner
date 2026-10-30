import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Nunito_Sans } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cormorant",
});

const sans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-nunito",
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
