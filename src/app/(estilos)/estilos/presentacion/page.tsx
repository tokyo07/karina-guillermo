import PerspectiveTunnelHero, { type TunnelImage } from "@/components/ui/perspective-tunnel-hero";

// Vista previa de la presentación: túnel de fotos que avanza solo, sin scroll.

const FOTOS: TunnelImage[] = [
  "/images/beso.jpg",
  "/img/4.jpeg",
  "/images/mirada.jpg",
  "/images/abrazo.jpg",
  "/img/3.jpeg",
  "/images/pareja.jpg",
  "/img/6.jpeg",
  "/images/frentes.jpg",
  "/img/7.jpeg",
  "/img/WhatsApp Image 2026-09-27 at 2.27.12.jpeg",
  "/images/hero.jpg",
].map((src) => ({ src: encodeURI(src), alt: "Karina y Guillermo" }));

export default function PresentacionPage() {
  return (
    <div style={{ "--pth-display": "var(--jsc-font), Georgia, serif" } as React.CSSProperties}>
      <PerspectiveTunnelHero
        images={FOTOS}
        eyebrow="Nos casamos"
        title={
          <>
            Karina
            <br />& Guillermo
          </>
        }
        subtitle="Sábado 19 de diciembre de 2026"
      />
    </div>
  );
}
