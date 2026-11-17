"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EstadoCarga } from "@/lib/album";

export function IconoCorazon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" />
    </svg>
  );
}

/** Mensaje flotante breve. Devuelve [elemento, mostrar(msg)]. */
export function useToast() {
  const [msg, setMsg] = useState("");
  const t = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mostrar = useCallback((m: string) => {
    setMsg(m);
    clearTimeout(t.current);
    t.current = setTimeout(() => setMsg(""), 3600);
  }, []);
  useEffect(() => () => clearTimeout(t.current), []);
  const el = (
    <div className="toast" role="status" hidden={!msg}>
      {msg}
    </div>
  );
  return [el, mostrar] as const;
}

/** Aviso bajo la barra cuando falta configuración o no hay conexión. */
export function AvisoEstado({ estado }: { estado: EstadoCarga }) {
  if (estado === "sin_configurar")
    return <div className="notice">El álbum todavía no está configurado (faltan las variables de Supabase).</div>;
  if (estado === "error")
    return <div className="notice">No pudimos conectar con el álbum. Reintentamos solos en unos segundos.</div>;
  return null;
}
