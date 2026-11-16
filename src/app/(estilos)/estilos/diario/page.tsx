import JournalSpreadCarousel, { type JournalSpread } from "@/components/ui/journal-spread-carousel";

// Demo del carrusel tipo diario con las fotos de la boda que ya están en public/.

const foto = (ruta: string) => encodeURI(ruta);

const PAGINAS: JournalSpread[] = [
  {
    label: "Portada",
    image: foto("/images/hero.jpg"),
    alt: "Karina y Guillermo",
    prints: [{ src: foto("/images/beso.jpg"), x: 6, y: 10, w: 21, rotate: -6, caption: "nosotros" }],
    notes: [{ x: 60, y: 62, w: 30, rotate: 2, title: "Karina & Guillermo", body: "Sábado 19 de diciembre de 2026" }],
  },
  {
    label: "Nuestra historia",
    image: foto("/img/4.jpeg"),
    alt: "Karina y Guillermo juntos",
    prints: [{ src: foto("/images/mirada.jpg"), x: 72, y: 48, w: 20, rotate: 5, tape: true }],
    notes: [{ x: 6, y: 8, w: 42, style: "ink", title: "Nuestra historia", body: "Empezó con una mirada." }],
  },
  {
    label: "El sí",
    image: foto("/img/6.jpeg"),
    alt: "Karina y Guillermo",
    prints: [{ src: foto("/images/pareja.jpg"), x: 70, y: 8, w: 21, rotate: 4, caption: "para siempre" }],
    notes: [{ x: 6, y: 64, w: 27, rotate: -2, title: "Sí, acepto", body: "Con la bendición de Dios y de nuestros padres." }],
  },
  {
    label: "Juntos",
    image: foto("/images/frentes.jpg"),
    alt: "Karina y Guillermo frente a frente",
    prints: [
      { src: foto("/img/3.jpeg"), x: 6, y: 48, w: 21, rotate: -5, caption: "tú y yo" },
      { src: foto("/img/7.jpeg"), x: 74, y: 52, w: 19, rotate: 7, tape: true },
    ],
    notes: [{ x: 32, y: 7, w: 40, style: "ink", title: "Juntos", body: "Lo mejor está por venir." }],
  },
  {
    label: "Un abrazo",
    image: foto("/images/abrazo.jpg"),
    alt: "Karina y Guillermo abrazados",
    prints: [{ src: foto("/img/WhatsApp Image 2026-09-27 at 2.27.12.jpeg"), x: 72, y: 8, w: 21, rotate: 6, caption: "qué suerte tenerte" }],
    notes: [{ x: 5, y: 66, w: 28, rotate: -3, title: "La fecha", body: "Iglesia San Alberto Magno, 5:00 pm" }],
  },
  {
    label: "Última página",
    paper: "#f3e7d6",
    prints: [
      { src: foto("/images/beso.jpg"), x: 7, y: 9, w: 23, rotate: -4, caption: "el beso" },
      { src: foto("/images/mirada.jpg"), x: 31, y: 44, w: 21, rotate: 5, caption: "la mirada" },
      { src: foto("/images/pareja.jpg"), x: 58, y: 8, w: 20, rotate: 3, tape: true },
    ],
    notes: [{ x: 60, y: 60, w: 31, rotate: -2, title: "Gracias", body: "Por ser parte de nuestro gran día." }],
  },
];

export default function DiarioPage() {
  return (
    <div
      style={
        {
          // Paleta de la invitación en lugar del azul original del componente.
          "--jsc-bg": "radial-gradient(120% 80% at 50% 35%, #8a4d33 0%, #6b3a26 55%, #4a271a 100%)",
        } as React.CSSProperties
      }
    >
      <JournalSpreadCarousel spreads={PAGINAS} title="Nuestro diario" meta="Karina & Guillermo" initialIndex={0} />
    </div>
  );
}
