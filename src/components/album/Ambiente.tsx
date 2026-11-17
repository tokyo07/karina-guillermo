"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { MOMENTO_INICIAL, REFRESCO_MS, esMomento, local, type Momento } from "@/lib/album";
import { CLAVE_AMBIENTE } from "@/lib/ambiente";

// Ambiente de la boda según el momento (ceremonia, recepción, fiesta).
// El momento lo fijan los novios o el moderador desde el panel; acá se lee de
// Supabase, se escucha por Realtime (con un refresco periódico de respaldo) y se
// aplica como `data-momento` en <html>, que es lo que cambia la paleta en album.css.

const CLAVE = CLAVE_AMBIENTE;

type Ctx = { momento: Momento; aplicar: (m: Momento) => void };
const AmbienteCtx = createContext<Ctx>({ momento: MOMENTO_INICIAL, aplicar: () => {} });

export const useMomento = () => useContext(AmbienteCtx);

export function Ambiente({ children }: { children: React.ReactNode }) {
  const [momento, setMomento] = useState<Momento>(MOMENTO_INICIAL);

  const aplicar = useCallback((m: Momento) => {
    document.documentElement.dataset.momento = m;
    local.set(CLAVE, m);
    setMomento(m);
  }, []);

  useEffect(() => {
    // Lo último conocido en este teléfono, mientras llega el dato real.
    const guardado = local.get(CLAVE);
    if (esMomento(guardado)) queueMicrotask(() => setMomento(guardado));

    let sb: ReturnType<typeof getSupabase>;
    try {
      sb = getSupabase();
    } catch {
      return; // sin configurar: queda el ambiente guardado o el inicial
    }

    const leer = async () => {
      const { data, error } = await sb.from("album_ajustes").select("momento_actual").maybeSingle();
      // Si la migración todavía no se corrió, la columna no existe: se sigue igual.
      if (!error && esMomento(data?.momento_actual)) aplicar(data.momento_actual);
    };
    queueMicrotask(leer);

    const canal = sb
      .channel("album-ambiente")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "album_ajustes" }, (p) => {
        const m = (p.new as { momento_actual?: unknown }).momento_actual;
        if (esMomento(m)) aplicar(m);
      })
      .subscribe();
    const t = setInterval(leer, REFRESCO_MS);
    const alVolver = () => document.visibilityState === "visible" && leer();
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", alVolver);
      sb.removeChannel(canal);
    };
  }, [aplicar]);

  return <AmbienteCtx.Provider value={{ momento, aplicar }}>{children}</AmbienteCtx.Provider>;
}
