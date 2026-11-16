"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PerspectiveTunnelHero, { type TunnelImage } from "@/components/ui/perspective-tunnel-hero";
import { FECHA, NOVIOS } from "@/lib/album";

// Presentación del álbum: las fotos de los novios se acercan a la pantalla y se
// desvanecen; cuando se agotan aparecen los nombres y el botón para entrar.
// Es la bienvenida: se muestra en cada carga de la página (también al refrescar).
// Al moverse dentro del álbum (Subir ↔ Álbum ↔ Novios) no se repite.

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

// Vive en memoria del módulo: se reinicia al recargar la página, pero sobrevive
// a la navegación interna de Next (que no recarga los módulos).
let yaMostrada = false;

function marcarVista() {
  yaMostrada = true;
}

export default function IntroAlbum() {
  // En la primera carga vale "mostrar" igual que en el servidor (sin desajuste de hidratación).
  const [estado, setEstado] = useState<"mostrar" | "saliendo" | "oculto">(() => (yaMostrada ? "oculto" : "mostrar"));

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
    <div className={"intro-album" + (estado === "saliendo" ? " saliendo" : "")} role="dialog" aria-label="Presentación del álbum">
      <PerspectiveTunnelHero
        images={FOTOS}
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
    </div>
  );
}
