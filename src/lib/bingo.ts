// Bingo de retos: cada momento tiene un cartón de 3×2 con sus 6 retos
// (AMBIENTES en lib/album.ts). Subir una foto con un reto lo tacha. Las
// insignias premian participar. Todo vive en el teléfono del invitado.
//
// Funciones puras (sin DOM ni localStorage) para poder probarlas.

export type Cartones = Record<string, readonly string[]>;
export type EstadoBingo = { hechos: string[]; fotos: number };

export const ESTADO_VACIO: EstadoBingo = { hechos: [], fotos: 0 };
/** Columnas del cartón: las filas completas cuentan como línea. */
export const COLUMNAS = 3;

export type Insignia = { id: string; nombre: string; detalle: string };

/** Nombre de la insignia por llenar el cartón de cada momento. */
const LLENO: Record<string, { nombre: string; detalle: string }> = {
  ceremonia: { nombre: "Testigo de honor", detalle: "Llenaste el cartón de la ceremonia" },
  recepcion: { nombre: "Alma de la mesa", detalle: "Llenaste el cartón de la recepción" },
  fiesta: { nombre: "Leyenda de la pista", detalle: "Llenaste el cartón de la fiesta" },
};

/** Todas las insignias posibles, en el orden en que se muestran. */
export function catalogo(cartones: Cartones): Insignia[] {
  return [
    { id: "primera", nombre: "Primera foto", detalle: "Subiste tu primera foto" },
    { id: "linea", nombre: "¡Línea!", detalle: "Completaste una fila de 3 retos" },
    ...Object.keys(cartones).map((m) => ({
      id: `lleno-${m}`,
      nombre: LLENO[m]?.nombre ?? `Cartón de ${m}`,
      detalle: LLENO[m]?.detalle ?? `Llenaste el cartón de ${m}`,
    })),
    { id: "cazador", nombre: "Cazador de momentos", detalle: "Un reto en cada momento de la boda" },
    { id: "paparazzi", nombre: "Paparazzi", detalle: "Subiste 10 fotos" },
  ];
}

/** Filas completas del cartón de un momento. */
export function lineas(retos: readonly string[], hechos: ReadonlySet<string>): number {
  let n = 0;
  for (let i = 0; i + COLUMNAS <= retos.length; i += COLUMNAS)
    if (retos.slice(i, i + COLUMNAS).every((r) => hechos.has(r))) n++;
  return n;
}

/** Ids de las insignias ganadas. */
export function ganadas(cartones: Cartones, estado: EstadoBingo): Set<string> {
  const hechos = new Set(estado.hechos);
  const g = new Set<string>();
  if (estado.fotos >= 1) g.add("primera");
  if (estado.fotos >= 10) g.add("paparazzi");
  const momentos = Object.entries(cartones);
  if (momentos.some(([, r]) => lineas(r, hechos) > 0)) g.add("linea");
  for (const [m, r] of momentos) if (r.length && r.every((x) => hechos.has(x))) g.add(`lleno-${m}`);
  if (momentos.length && momentos.every(([, r]) => r.some((x) => hechos.has(x)))) g.add("cazador");
  return g;
}

/** Suma una foto subida (con o sin reto). Devuelve el estado nuevo y las insignias recién ganadas. */
export function registrarFoto(
  cartones: Cartones,
  estado: EstadoBingo,
  reto: string | null | undefined
): { estado: EstadoBingo; nuevas: Insignia[] } {
  const antes = ganadas(cartones, estado);
  const hechos = reto && !estado.hechos.includes(reto) ? [...estado.hechos, reto] : estado.hechos;
  const siguiente = { hechos, fotos: estado.fotos + 1 };
  const despues = ganadas(cartones, siguiente);
  const nuevas = catalogo(cartones).filter((i) => despues.has(i.id) && !antes.has(i.id));
  return { estado: siguiente, nuevas };
}

/** Lee el estado guardado, tolerando basura. */
export function leerEstado(texto: string | null): EstadoBingo {
  try {
    const v = JSON.parse(texto || "null");
    if (v && Array.isArray(v.hechos) && typeof v.fotos === "number")
      return { hechos: v.hechos.filter((x: unknown) => typeof x === "string"), fotos: Math.max(0, v.fotos) };
  } catch {
    /* estado dañado: se empieza de cero */
  }
  return ESTADO_VACIO;
}
