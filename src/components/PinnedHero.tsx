"use client";

import { useScrollProgress } from "@/hooks/useScrollEffects";

export default function PinnedHero() {
  const { ref, progress } = useScrollProgress<HTMLDivElement>();

  // El texto termina de aparecer al 40% del recorrido; después queda fijo
  // en pantalla hasta que el sticky se suelta.
  const t = Math.min(1, progress / 0.4);
  const textOpacity = t;
  const textScale = 0.82 + t * 0.18;
  const textShift = (1 - t) * 26;
  // El scrim se oscurece un poco más a medida que se acerca el final,
  // para que el siguiente bloque (crema) entre con buen contraste.
  const scrimExtra = 0.15 + progress * 0.25;

  return (
    <div className="pinHero" ref={ref}>
      <div className="pinHero__stage">
        <div className="pinHero__media">
          <img
            src="/images/pareja.jpg"
            alt="Karina y Guillermo"
            style={{ objectPosition: "center 20%" }}
          />
          <div className="pinHero__scrim" style={{ opacity: scrimExtra }} />
        </div>
        <div
          className="pinHero__content"
          style={{
            opacity: textOpacity,
            transform: `translateY(${textShift}px) scale(${textScale})`,
          }}
        >
          <p className="casamos">¡Nos casamos!</p>
          <h1>
            Karina <span>&amp;</span> Guillermo
          </h1>
          <p className="cuando">sábado 11 de julio de 2026</p>
        </div>
        <div
          className="pinHero__hint"
          style={{ opacity: Math.max(0, 1 - progress * 4) }}
          aria-hidden="true"
        >
          <span />
        </div>
      </div>
    </div>
  );
}
