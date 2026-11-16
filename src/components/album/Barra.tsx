"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECCIONES = [
  { href: "/album", label: "Subir" },
  { href: "/album/fotos", label: "Álbum" },
  { href: "/album/novios", label: "Novios" },
] as const;

export default function Barra() {
  const ruta = usePathname();
  return (
    <header className="bar">
      <div className="bar-in">
        <Link className="mono" href="/album" aria-label="Inicio del álbum">
          K<b>&amp;</b>G
        </Link>
        <nav className="nav" aria-label="Secciones">
          {SECCIONES.map((s) => (
            <Link key={s.href} href={s.href} aria-current={ruta === s.href ? "page" : undefined}>
              {s.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
