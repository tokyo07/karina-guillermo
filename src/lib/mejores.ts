// "Lo mejor de la noche": selección automática de las mejores fotos, sin modelos.
//
// Puntaje = 60 % amor + 40 % calidad
//   - Amor: el promedio bayesiano de corazones sobre vistas (lib/ranking.ts),
//     llevado a 0–1 de forma que la media del álbum vale 0,5. Sin corazones en
//     todo el álbum, todas valen 0,5 y decide la calidad.
//   - Calidad: las medidas que el teléfono tomó al subir (lib/calidad.ts):
//     nitidez, exposición y estructura. Sin medidas (fotos de antes del filtro), 0,5.
// Ráfagas: de las fotos casi iguales (huella dHash cercana) queda solo la mejor.
// Selección: el mejor 30 % del álbum (mínimo 6, máximo 50), ordenado por puntaje.

import { distancia, type Medidas } from "./calidad";
import { mediaGlobal, puntajeQuerida, type ParaRanking } from "./ranking";

export type ParaMejores = ParaRanking & { calidad?: Partial<Medidas> | null };

export const PESO_AMOR = 0.6;
/** Distancia de huella para considerar dos fotos de la misma ráfaga (algo más amplia que "repetida"). */
export const MISMA_RAFAGA = 10;
export const PROPORCION = 0.3;
export const MINIMO = 6;
export const MAXIMO = 50;

const acotar = (x: number) => Math.min(1, Math.max(0, x));

/** Calidad técnica 0–1 a partir de las medidas del filtro. */
export function puntajeCalidad(m: Partial<Medidas> | null | undefined): number {
  if (!m || typeof m.nitidez !== "number" || typeof m.brillo !== "number") return 0.5;
  // Nitidez en escala logarítmica: 25 (umbral de borrosa) ≈ 0,5 · 600 o más = 1.
  const nitidez = acotar(Math.log10(Math.max(1, m.nitidez)) / Math.log10(600));
  // Exposición: mejor cerca del gris medio, castigando zonas muy negras o quemadas.
  let exposicion = 1 - Math.abs(m.brillo - 125) / 125;
  if ((m.oscuros ?? 0) > 0.5) exposicion -= ((m.oscuros ?? 0) - 0.5) * 0.8;
  if ((m.claros ?? 0) > 0.3) exposicion -= ((m.claros ?? 0) - 0.3) * 0.8;
  const estructura = acotar((m.estructura ?? 30) / 50);
  return acotar(0.5 * nitidez + 0.3 * acotar(exposicion) + 0.2 * estructura);
}

/** Amor 0–1: la media del álbum vale 0,5. */
export function puntajeAmor(f: ParaRanking, media: number): number {
  if (media <= 0) return f.corazones > 0 ? 0.75 : 0.5;
  const p = puntajeQuerida(f, media);
  return p / (p + media);
}

export function puntajeMejor(f: ParaMejores, media: number): number {
  return PESO_AMOR * puntajeAmor(f, media) + (1 - PESO_AMOR) * puntajeCalidad(f.calidad);
}

/**
 * Las mejores fotos: puntaje, una por ráfaga y el mejor 30 % (mín. 6, máx. 50).
 * Devuelve un arreglo nuevo, ordenado de mejor a peor.
 */
export function loMejor<T extends ParaMejores>(fotos: readonly T[]): T[] {
  const media = mediaGlobal(fotos);
  const puntaje = new Map(fotos.map((f) => [f.id, puntajeMejor(f, media)]));
  const reciente = (a: T, b: T) => Date.parse(b.creada_en) - Date.parse(a.creada_en);
  const ordenadas = [...fotos].sort((a, b) => puntaje.get(b.id)! - puntaje.get(a.id)! || reciente(a, b));

  // Una por ráfaga: como van de mejor a peor, se descarta la que se parece a una ya elegida.
  const elegidas: T[] = [];
  const huellas: string[] = [];
  for (const f of ordenadas) {
    const h = f.calidad?.huella;
    if (h && huellas.some((x) => x.length === h.length && distancia(x, h) <= MISMA_RAFAGA)) continue;
    elegidas.push(f);
    if (h) huellas.push(h);
  }

  const cuantas = Math.min(MAXIMO, Math.max(MINIMO, Math.ceil(fotos.length * PROPORCION)));
  return elegidas.slice(0, cuantas);
}
