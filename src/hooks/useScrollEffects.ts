"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Progreso de scroll (0→1) mientras un contenedor alto atraviesa el viewport.
 * Pensado para un hijo `position: sticky` adentro: mientras dura el 0→1,
 * ese hijo queda "trabado" en pantalla — el mismo truco que usan los heroes
 * de video con scroll bloqueado.
 */
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;

    function measure() {
      const rect = el!.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      setProgress(p);
    }

    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    }

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return { ref, progress };
}

/** true la primera vez que el elemento entra en pantalla (y se queda en true). */
export function useInView<T extends HTMLElement>(threshold = 0.22) {
  const ref = useRef<T>(null);
  // Arranca en false tanto en el servidor como en el cliente (mismo valor
  // en los dos lados, sin mismatch de hidratación) y el efecto la prende
  // cuando de verdad entra en pantalla.
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
