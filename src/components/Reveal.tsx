"use client";

import { useInView } from "@/hooks/useScrollEffects";

type Props = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

/**
 * Envoltorio genérico: sus hijos aparecen (fade + slide) al entrar en
 * pantalla. Se usa para el CONTENIDO (texto, botones), nunca para el fondo
 * de una sección entera — así el color de fondo de cada bloque siempre
 * está ahí desde que aparece, y solo el texto tiene la pequeña animación.
 */
export default function Reveal({ children, className = "", delay = 0 }: Props) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal${inView ? " inView" : ""}${className ? " " + className : ""}`}
      style={{ "--reveal-delay": `${delay}s` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
