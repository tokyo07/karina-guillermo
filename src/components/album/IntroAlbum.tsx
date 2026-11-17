"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PerspectiveTunnelHero, { type TunnelImage } from "@/components/ui/perspective-tunnel-hero";
import { FECHA, NOVIOS, esVisible, local, urlFoto, type Foto } from "@/lib/album";
import { loMejor } from "@/lib/mejores";
import { getSupabase } from "@/lib/supabase";

// Presentación del álbum: las fotos de los novios se acercan a la pantalla y se
// desvanecen; cuando se agotan aparecen los nombres y el botón para entrar.
// Es la bienvenida: se muestra en cada carga de la página (también al refrescar).
// Al moverse dentro del álbum (Subir ↔ Álbum ↔ Novios) no se repite.
// Entre las fotos de los novios aparecen las mejores de los invitados
// ("Lo mejor": corazones + calidad, una por ráfaga; lib/mejores.ts).

const FOTOS: TunnelImage[] = [
  "/images/beso.jpg",
  "/img/4.jpeg",
  "/images/mirada.jpg",
  "/images/abrazo.jpg",
  "/img/3.jpeg",
  "/images/pareja.jpg",
  "/img/6.jpeg",
  "/images/frentes.jpg",
  "/img/7.jpeg",
  "/img/WhatsApp Image 2026-09-27 at 2.27.12.jpeg",
  "/images/hero.jpg",
].map((src) => ({ src: encodeURI(src), alt: `${NOVIOS.a} y ${NOVIOS.b}` }));

/** Cuántas fotos de invitados entran a la presentación. */
const DESTACADAS = 4;
/** Cuánto se espera el ranking antes de arrancar con lo que haya. */
const ESPERA_MS = 1200;
const CLAVE_DESTACADAS = "album:destacadas";

/** Fotos de los novios con las destacadas intercaladas; termina siempre con la última de los novios. */
function mezclar(destacadas: TunnelImage[]): TunnelImage[] {
  if (!destacadas.length) return FOTOS;
  // Se mantiene el largo total: entran las destacadas y salen tantas de los novios (nunca la última).
  const final = FOTOS[FOTOS.length - 1];
  const novios = FOTOS.slice(0, FOTOS.length - 1 - destacadas.length);
  const out: TunnelImage[] = [];
  novios.forEach((f, i) => {
    out.push(f);
    if (i % 2 === 1 && destacadas.length) out.push(destacadas.shift()!);
  });
  return [...out, ...destacadas, final];
}

async function pedirDestacadas(): Promise<TunnelImage[]> {
  const { data, error } = await getSupabase().rpc("listar_fotos", {});
  if (error) throw error;
  const fotos = ((data ?? []) as Foto[])
    .map((f) => ({
      ...f,
      corazones: Number(f.corazones),
      vistas: Number(f.vistas ?? 0),
      revisar: f.revisar ?? false,
    }))
    .filter(esVisible);
  return loMejor(fotos)
    .slice(0, DESTACADAS)
    .map((f) => ({
      src: urlFoto(f.public_id, 1600),
      alt: `Foto de ${f.nombre}`,
    }));
}

// Vive en memoria del módulo: se reinicia al recargar la página, pero sobrevive
// a la navegación interna de Next (que no recarga los módulos).
let yaMostrada = false;

function marcarVista() {
  yaMostrada = true;
}

export default function IntroAlbum() {
  // En la primera carga vale "mostrar" igual que en el servidor (sin desajuste de hidratación).
  const [estado, setEstado] = useState<"mostrar" | "saliendo" | "oculto">(() => (yaMostrada ? "oculto" : "mostrar"));
  // null mientras se espera el ranking (la presentación arranca cuando llega o a los ESPERA_MS).
  const [fotos, setFotos] = useState<TunnelImage[] | null>(null);

  useEffect(() => {
    if (yaMostrada) return;
    let listo = false;
    let previas: TunnelImage[] = [];
    try {
      previas = JSON.parse(local.get(CLAVE_DESTACADAS) || "[]");
    } catch {
      /* sin caché */
    }
    const arrancar = (d: TunnelImage[]) => {
      if (listo) return;
      listo = true;
      setFotos(mezclar([...d]));
    };
    const t = setTimeout(() => arrancar(previas), ESPERA_MS);
    pedirDestacadas()
      .then((d) => {
        local.set(CLAVE_DESTACADAS, JSON.stringify(d));
        arrancar(d);
      })
      .catch(() => arrancar(previas));
    return () => clearTimeout(t);
  }, []);

  // Sin scroll de fondo mientras está la presentación.
  useEffect(() => {
    if (estado === "oculto") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [estado]);

  if (estado === "oculto") return null;

  const entrar = () => {
    marcarVista();
    setEstado("saliendo");
    setTimeout(() => setEstado("oculto"), 700);
  };

  return (
    <div
      className={"intro-album" + (estado === "saliendo" ? " saliendo" : "")}
      role="dialog"
      aria-label="Presentación del álbum"
    >
      {fotos && (
        <PerspectiveTunnelHero
          images={fotos}
          once
          alwaysZoom
          skipLabel="Saltar"
          eyebrow="Álbum de la boda"
          title={
            <>
              {NOVIOS.a}
              <br />& {NOVIOS.b}
            </>
          }
          subtitle={FECHA}
        >
          <div className="intro-acciones">
            <button type="button" className="btn" onClick={entrar}>
              Compartir mis fotos
            </button>
            <Link className="btn ghost" href="/album/fotos" onClick={marcarVista}>
              Ver el álbum
            </Link>
          </div>
        </PerspectiveTunnelHero>
      )}
    </div>
  );
}
