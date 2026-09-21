"use client";

import { useScrollProgress } from "@/hooks/useScrollEffects";

export default function PinnedHero() {
  const { ref, progress } = useScrollProgress<HTMLDivElement>();

  // El texto es visible desde el primer momento (nada depende de scrollear
  // para poder leerlo). Recién en el último tramo del recorrido se
  // desvanece hacia arriba, como salida, justo antes de que la foto se
  // suelte y empiece la siguiente sección — así no queda ningún tramo
  // "vacío" en el medio.
  const exitStart = 0.6;
  const exitT = Math.min(1, Math.max(0, (progress - exitStart) / (1 - exitStart)));
  const textOpacity = 1 - exitT;
  const textShift = -exitT * 22;
  const textScale = 1 - exitT * 0.06;

  return (
    <div className="pinHero" ref={ref}>
      <div className="pinHero__stage">
        <div className="pinHero__media">
          <img
            src="/images/pareja.jpg"
            alt="Karina y Guillermo"
            style={{ objectPosition: "center 20%" }}
          />
          <div className="pinHero__scrim" />
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
          style={{ opacity: Math.max(0, 1 - progress * 5) }}
          aria-hidden="true"
        >
          <span />
        </div>
      </div>
    </div>
  );
}
