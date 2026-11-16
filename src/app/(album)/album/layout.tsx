import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Figtree } from "next/font/google";
import Barra from "@/components/album/Barra";
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
    <html lang="es" className={`${display.variable} ${cuerpo.variable}`}>
      <body>
        <Barra />
        <main>{children}</main>
      </body>
    </html>
  );
}
