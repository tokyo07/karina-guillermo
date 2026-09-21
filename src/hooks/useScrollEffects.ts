"use client";

import { useEffect, useRef, useState } from "react";

/** true la primera vez que el elemento entra en pantalla (y se queda en true). */
export function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  // Arranca en false tanto en el servidor como en el cliente (mismo valor
  // en los dos lados, sin mismatch de hidratación) y el efecto la prende
  // cuando de verdad entra en pantalla — el disparo natural (sin
  // anticipación) es lo que da la sensación de "aparece al llegar
  // scrolleando".
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    // Si el navegador no soporta IntersectionObserver (muy raro hoy),
    // el elemento se queda en su estado inicial (oculto) en vez de romper.
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            io.unobserve(entry.target);
          }
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, inView };
}
