"use client";

import { useEffect, useState } from "react";

const EVENTO = new Date("2026-12-19T17:00:00-05:00").getTime();

function dos(n: number) {
  return (n < 10 ? "0" : "") + n;
}

function partes(now: number) {
  const seg = Math.floor(Math.max(0, EVENTO - now) / 1000);
  return {
    d: dos(Math.floor(seg / 86400)),
    h: dos(Math.floor((seg % 86400) / 3600)),
    m: dos(Math.floor((seg % 3600) / 60)),
    s: dos(seg % 60),
  };
}

export default function Countdown() {
  // Se calcula una vez en el render inicial (servidor y cliente dan valores
  // distintos porque el reloj avanza entre uno y otro: es un reloj en vivo,
  // por eso los <strong> de abajo llevan suppressHydrationWarning).
  const [t, setT] = useState<{ d: string; h: string; m: string; s: string }>(() =>
    partes(Date.now())
  );

  useEffect(() => {
    const id = setInterval(() => setT(partes(Date.now())), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="cuenta cream">
      <h2>Faltan</h2>
      <div className="contador" role="timer" aria-live="off">
        <div>
          <strong suppressHydrationWarning>{t.d}</strong>
          <small>Días</small>
        </div>
        <div>
          <strong suppressHydrationWarning>{t.h}</strong>
          <small>Horas</small>
        </div>
        <div>
          <strong suppressHydrationWarning>{t.m}</strong>
          <small>Min</small>
        </div>
        <div>
          <strong suppressHydrationWarning>{t.s}</strong>
          <small>Seg</small>
        </div>
      </div>
    </section>
  );
}
