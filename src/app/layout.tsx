import type { Metadata } from "next";
import { Cormorant_Garamond, Great_Vibes, Marcellus } from "next/font/google";
import "./globals.css";

const serif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
});

const script = Great_Vibes({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
});

const titulo = Marcellus({
  variable: "--font-titulo",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Karina & Guillermo",
  description: "Invitación de boda de Karina & Guillermo — 11 de julio de 2026",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${serif.variable} ${script.variable} ${titulo.variable}`}>
      <body>{children}</body>
    </html>
  );
}
