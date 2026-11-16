"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PerspectiveTunnelHero, { type TunnelImage } from "@/components/ui/perspective-tunnel-hero";
import { FECHA, NOVIOS } from "@/lib/album";

// Presentación del álbum: las fotos de los novios se acercan a la pantalla y se
// desvanecen; cuando se agotan aparecen los nombres y el botón para entrar.
// Se muestra una vez por visita (sessionStorage), no cada vez que se vuelve a /album.

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

const CLAVE = "album:intro-vista";

function marcarVista() {
  try {
    sessionStorage.setItem(CLAVE, "1");
  } catch {
    /* sin almacenamiento: se volverá a mostrar, no pasa nada */
  }
}

export default function IntroAlbum() {
  // "mostrar" desde el servidor para que no se vea el formulario un instante antes del intro.
  const [estado, setEstado] = useState<"mostrar" | "saliendo" | "oculto">("mostrar");

  useEffect(() => {
    let vista = false;
    try {
      vista = sessionStorage.getItem(CLAVE) === "1";
    } catch {}
    if (vista) queueMicrotask(() => setEstado("oculto"));
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
    <div className={"intro-album" + (estado === "saliendo" ? " saliendo" : "")} role="dialog" aria-label="Presentación del álbum">
      <PerspectiveTunnelHero
        images={FOTOS}
        once
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
