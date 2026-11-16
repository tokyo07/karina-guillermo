import type { Metadata } from "next";
import { Bodoni_Moda, Caveat } from "next/font/google";

// Catálogo de estilos/componentes de prueba (/estilos/*). No se enlaza desde
// la invitación ni el álbum; es para ver componentes antes de usarlos.

const mano = Caveat({ variable: "--jsc-hand", subsets: ["latin"], weight: ["600"] });
const display = Bodoni_Moda({ variable: "--jsc-font", subsets: ["latin"], style: ["italic"] });

export const metadata: Metadata = {
  title: "Estilos · Karina y Guillermo",
  robots: { index: false, follow: false },
};

export default function EstilosLayout({ children }: LayoutProps<"/estilos">) {
  return (
    <html lang="es" className={`${mano.variable} ${display.variable}`}>
      <body style={{ margin: 0, background: "#3a1e12" }}>{children}</body>
    </html>
  );
}
