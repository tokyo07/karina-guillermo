"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import JournalSpreadCarousel, {
  type JournalAction,
  type JournalSpread,
} from "@/components/ui/journal-spread-carousel";
import { NOVIOS, etiquetaMomento, marcarVistas, urlFoto, type Foto } from "@/lib/album";

// El álbum de los invitados como diario: una portada con los novios y luego una
// página por cada 3 fotos (una de fondo y dos polaroids, con una nota de quién la subió).

const PORTADA = encodeURI("/images/hero.jpg");
const POR_PAGINA = 3;

/** `ids`: fotos que se ven en la página (para contar vistas). */
type Pagina = { spread: JournalSpread; fondo: number | null; ids: string[] };

function armarPaginas(fotos: Foto[]): Pagina[] {
  const n = fotos.length;
  const portada: Pagina = {
    fondo: n ? 0 : null,
    ids: fotos.slice(0, 2).map((f) => f.id),
    spread: {
      id: "portada",
      label: "Portada",
      image: PORTADA,
      alt: `${NOVIOS.a} y ${NOVIOS.b}`,
      prints: n
        ? fotos.slice(0, 2).map((f, k) => ({
            src: urlFoto(f.public_id, 480),
            x: k ? 70 : 6,
            y: k ? 50 : 10,
            w: 21,
            rotate: k ? 5 : -6,
            caption: f.nombre,
            tape: k === 1,
          }))
        : [],
      notes: [
        n
          ? { x: 58, y: 8, w: 32, rotate: 2, title: "El álbum de todos", body: `${n} ${n === 1 ? "foto" : "fotos"} de los invitados` }
          : { x: 58, y: 60, w: 32, rotate: 2, title: "Aún no hay fotos", body: "La primera la pones tú: toca + para subirla." },
      ],
    },
  };

  const paginas: Pagina[] = [portada];
  for (let i = 0; i < n; i += POR_PAGINA) {
    const [bg, p1, p2] = fotos.slice(i, i + POR_PAGINA);
    const par = (i / POR_PAGINA) % 2 === 0; // alterna la disposición para que no se repita
    const prints: JournalSpread["prints"] = [];
    if (p1) prints.push({ src: urlFoto(p1.public_id, 480), x: par ? 72 : 6, y: par ? 8 : 48, w: 21, rotate: par ? 5 : -5, caption: p1.nombre });
    if (p2) prints.push({ src: urlFoto(p2.public_id, 480), x: par ? 74 : 72, y: par ? 52 : 8, w: 19, rotate: par ? -4 : 6, tape: true, caption: p2.nombre });
    paginas.push({
      fondo: i,
      ids: [bg, p1, p2].filter(Boolean).map((f) => f.id),
      spread: {
        id: bg.id,
        label: `Foto de ${bg.nombre}`,
        image: urlFoto(bg.public_id, 1600),
        alt: `Foto de ${bg.nombre}`,
        prints,
        notes: [
          {
            x: par ? 5 : 60,
            y: par ? 64 : 62,
            w: 28,
            rotate: par ? -3 : 2,
            title: bg.nombre,
            body: [etiquetaMomento(bg.momento), bg.reto].filter(Boolean).join(" · "),
          },
        ],
      },
    });
  }
  return paginas;
}

export default function DiarioAlbum({
  fotos,
  onAbrir,
  onMural,
  avisar,
}: {
  fotos: Foto[];
  /** Abre el visor en la foto de fondo de la página actual. */
  onAbrir: (indice: number) => void;
  onMural: () => void;
  avisar: (msg: string) => void;
}) {
  const router = useRouter();
  const paginas = useMemo(() => armarPaginas(fotos), [fotos]);
  // La portada se ve al abrir; las demás páginas, cuando el invitado llega a ellas.
  const idsPortada = paginas[0]?.ids.join(",") ?? "";
  useEffect(() => {
    if (idsPortada) marcarVistas(idsPortada.split(","));
  }, [idsPortada]);

  async function accion(a: JournalAction, i: number) {
    if (a === "add") return router.push("/album");
    if (a === "more") {
      const f = paginas[i]?.fondo;
      return f === null || f === undefined ? avisar("Esta página todavía no tiene fotos.") : onAbrir(f);
    }
    if (a === "share") {
      const url = `${location.origin}/album/fotos`;
      try {
        if (navigator.share) await navigator.share({ title: `Álbum de ${NOVIOS.a} y ${NOVIOS.b}`, url });
        else {
          await navigator.clipboard.writeText(url);
          avisar("Enlace copiado.");
        }
      } catch {
        /* el invitado canceló el menú de compartir */
      }
    }
  }

  return (
    <div className="diario">
      <JournalSpreadCarousel
        spreads={paginas.map((p) => p.spread)}
        title={`${NOVIOS.a} & ${NOVIOS.b}`}
        meta={`${fotos.length} ${fotos.length === 1 ? "foto" : "fotos"}`}
        height="max(520px, calc(100svh - 190px))"
        actions={["add", "more", "share"]}
        actionLabels={{ add: "Subir una foto", more: "Ver foto en grande", share: "Compartir el álbum" }}
        onAction={accion}
        onIndexChange={(i) => marcarVistas(paginas[i]?.ids ?? [])}
        onGridView={onMural}
        showTools={false}
      />
    </div>
  );
}
