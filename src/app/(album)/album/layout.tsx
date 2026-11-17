import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Caveat, Figtree, IBM_Plex_Mono, Sacramento } from "next/font/google";
import { Ambiente } from "@/components/album/Ambiente";
import { SCRIPT_AMBIENTE } from "@/lib/ambiente";
import Barra from "@/components/album/Barra";
import { ScriptEnLinea } from "@/components/album/ScriptEnLinea";
import "./album.css";

const display = Bodoni_Moda({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const cuerpo = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
});

// Letra manuscrita de las notas y pies de foto del diario (journal-spread-carousel).
const mano = Caveat({
  variable: "--jsc-hand",
  subsets: ["latin"],
  weight: ["600"],
});

// Modo fiesta (estilo galería): firma manuscrita y menú monoespaciado entre corchetes.
const firma = Sacramento({
  variable: "--font-firma",
  subsets: ["latin"],
  weight: ["400"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Álbum de boda de Karina y Guillermo",
  description: "Sube tus fotos de la boda de Karina y Guillermo y mira las de todos.",
  // El álbum solo se comparte por QR/enlace: que no aparezca en buscadores.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#78462f",
};

export default function AlbumLayout({ children }: LayoutProps<"/album">) {
  return (
    // suppressHydrationWarning: el script de abajo pone data-momento en <html>
    // antes de que React hidrate (ver docs/01-app/02-guides/preventing-flash-before-hydration).
    <html lang="es" className={`${display.variable} ${cuerpo.variable} ${mano.variable} ${firma.variable} ${mono.variable}`} suppressHydrationWarning>
      <body>
        <ScriptEnLinea html={SCRIPT_AMBIENTE} />
        <Ambiente>
          <Barra />
          <main>{children}</main>
        </Ambiente>
      </body>
    </html>
  );
}
