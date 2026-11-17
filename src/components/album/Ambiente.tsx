"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { MOMENTO_INICIAL, REFRESCO_MS, esMomento, local, type Momento } from "@/lib/album";
import { CLAVE_AMBIENTE } from "@/lib/ambiente";
import { momentoEfectivo } from "@/lib/cronograma";

// Ambiente de la boda según el momento (ceremonia, recepción, fiesta).
// Dos fuentes, y gana la más reciente:
//   - El panel: los novios o el moderador eligen un momento (Supabase, con
//     Realtime y un refresco periódico de respaldo).
//   - El programa de la boda (lib/cronograma.ts): a su hora cambia el momento
//     solo, por si nadie tocó el panel.
// El resultado se aplica como `data-momento` en <html> (la paleta de album.css).

const CLAVE = CLAVE_AMBIENTE;
/** Cada cuánto se revisa el reloj para los cambios del programa. */
const TICK_MS = 15_000;

type Ctx = {
  momento: Momento;
  /** Los novios eligieron un momento en el panel (ya guardado en Supabase). */
  aplicar: (m: Momento) => void;
  /** Hora actual en ms (0 hasta que el cliente tiene reloj: igual que en el servidor). */
  ahora: number;
};
const AmbienteCtx = createContext<Ctx>({ momento: MOMENTO_INICIAL, aplicar: () => {}, ahora: 0 });

export const useMomento = () => useContext(AmbienteCtx);

/** Solo en desarrollo: ?hora=2026-12-19T22:15 simula esa hora (en Ecuador) para probar el programa. */
function desfaseDePrueba(): number {
  if (process.env.NODE_ENV === "production") return 0;
  const h = new URLSearchParams(location.search).get("hora");
  const t = h ? Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(h) ? h : `${h}-05:00`) : NaN;
  return Number.isNaN(t) ? 0 : t - Date.now();
}

export function Ambiente({ children }: { children: React.ReactNode }) {
  const [manual, setManual] = useState<{ m: Momento; en: number | null }>({ m: MOMENTO_INICIAL, en: null });
  const [ahora, setAhora] = useState(0);
  const desfase = useRef(0);
  const reloj = useCallback(() => Date.now() + desfase.current, []);

  const momento = momentoEfectivo(manual.m, manual.en, ahora);

  // Pintar el ambiente (solo con reloj: antes manda lo que puso el script en línea).
  useEffect(() => {
    if (!ahora) return;
    document.documentElement.dataset.momento = momento;
    local.set(CLAVE, momento);
  }, [momento, ahora]);

  const aplicar = useCallback((m: Momento) => setManual({ m, en: reloj() }), [reloj]);

  useEffect(() => {
    desfase.current = desfaseDePrueba();
    // Lo último conocido en este teléfono, mientras llega el dato real.
    const guardado = local.get(CLAVE);
    queueMicrotask(() => {
      if (esMomento(guardado)) setManual({ m: guardado, en: null });
      setAhora(reloj());
    });
    const tic = setInterval(() => setAhora(reloj()), TICK_MS);

    let sb: ReturnType<typeof getSupabase>;
    try {
      sb = getSupabase();
    } catch {
      return () => clearInterval(tic); // sin configurar: ambiente guardado o programa
    }

    const desdeFila = (fila: { momento_actual?: unknown; momento_fijado_en?: unknown } | null | undefined) => {
      if (!fila || !esMomento(fila.momento_actual)) return;
      const en = typeof fila.momento_fijado_en === "string" ? Date.parse(fila.momento_fijado_en) : NaN;
      setManual({ m: fila.momento_actual, en: Number.isNaN(en) ? null : en });
    };

    const leer = async () => {
      // "*": sirve aunque la base todavía no tenga momento_fijado_en.
      const { data, error } = await sb.from("album_ajustes").select("*").maybeSingle();
      if (!error) desdeFila(data);
      setAhora(reloj());
    };
    queueMicrotask(leer);

    const canal = sb
      .channel("album-ambiente")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "album_ajustes" }, (p) =>
        desdeFila(p.new as { momento_actual?: unknown; momento_fijado_en?: unknown })
      )
      .subscribe();
    const t = setInterval(leer, REFRESCO_MS);
    const alVolver = () => document.visibilityState === "visible" && leer();
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      clearInterval(tic);
      clearInterval(t);
      document.removeEventListener("visibilitychange", alVolver);
      sb.removeChannel(canal);
    };
  }, [reloj]);

  return <AmbienteCtx.Provider value={{ momento, aplicar, ahora }}>{children}</AmbienteCtx.Provider>;
}
