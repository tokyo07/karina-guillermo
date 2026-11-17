"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import IntroAlbum from "./IntroAlbum";

// "Ver el álbum" con presentación: pasan las fotos (en la fiesta, con la bola
// gigante), aparece "Álbum de la boda · Karina & Guillermo" y, después de una
// pausa, se entra solo al álbum con un desvanecido.
//
// Vive en el layout del álbum (no en la página) para que la presentación siga
// en pantalla mientras se cambia de página y se desvanezca recién cuando el
// álbum ya está debajo: así no hay corte.

const DESTINO = "/album/fotos";
/** Cuánto se deja ver el título antes de entrar al álbum. */
const PAUSA_TITULO_MS = 2200;
const DESVANECER_MS = 700;

const VerAlbumCtx = createContext<() => void>(() => {});

/** Abre la presentación y al terminar lleva al álbum. */
export const useVerAlbum = () => useContext(VerAlbumCtx);

export function Presentacion({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const ruta = usePathname();
  const [fase, setFase] = useState<"no" | "viendo" | "saliendo">("no");
  const [vez, setVez] = useState(0);
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const verAlbum = useCallback(() => {
    router.prefetch(DESTINO);
    setVez((v) => v + 1); // una presentación nueva cada vez
    setFase("viendo");
  }, [router]);

  const alRevelar = useCallback(() => {
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => router.push(DESTINO), PAUSA_TITULO_MS);
  }, [router]);

  // Ya en el álbum: la presentación se desvanece…
  useEffect(() => {
    if (fase === "viendo" && ruta === DESTINO) queueMicrotask(() => setFase("saliendo"));
  }, [fase, ruta]);
  // …y se quita. En su propio efecto: si el temporizador viviera en el de arriba,
  // el cambio a "saliendo" lo cancelaba y la presentación quedaba montada
  // (invisible, pero con la bola animando y el scroll de la página bloqueado).
  useEffect(() => {
    if (fase !== "saliendo") return;
    const t = setTimeout(() => setFase("no"), DESVANECER_MS);
    return () => clearTimeout(t);
  }, [fase]);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  return (
    <VerAlbumCtx.Provider value={verAlbum}>
      {children}
      {fase !== "no" && <IntroAlbum key={vez} modo="viaje" alRevelar={alRevelar} saliendo={fase === "saliendo"} />}
    </VerAlbumCtx.Provider>
  );
}
