// Ranking de fotos por corazones. Dos algoritmos conocidos, sin dependencias:
//
// 1. "Más queridas" (promedio bayesiano): puntaje = (corazones + C·m) / (vistas + C)
//    - m: proporción de corazones por vista de todo el álbum (la media).
//    - C: cuántas vistas "prestadas" se le suman a cada foto. Con pocas vistas,
//      el puntaje se queda cerca de la media; con muchas, manda su propia proporción.
//    Así una foto con 3 corazones de 4 vistas puede ganarle a una con 5 de 60, y
//    las fotos que subieron temprano (más vistas) no ganan solo por antigüedad.
//
// 2. "Lo más querido ahora" (como Hacker News): puntaje = corazones / (horas + 2)^G
//    - Las fotos nuevas con algunos corazones suben rápido y las viejas van bajando.
//    - Para la presentación de bienvenida, que debe mostrar lo de este momento.
//
// Empates: la más reciente primero.

export type ParaRanking = { id: string; corazones: number; vistas: number; creada_en: string };

/** Vistas "prestadas" a cada foto en el promedio bayesiano. */
export const VISTAS_PREVIAS = 10;
/** Gravedad del ranking "ahora": cuánto pesa el paso del tiempo. */
export const GRAVEDAD = 1.5;

const reciente = (a: ParaRanking, b: ParaRanking) => Date.parse(b.creada_en) - Date.parse(a.creada_en);

/** Corazones por vista de todo el álbum (al menos tantas vistas como corazones). */
export function mediaGlobal(fotos: readonly ParaRanking[]): number {
  let c = 0;
  let v = 0;
  for (const f of fotos) {
    c += f.corazones;
    v += Math.max(f.vistas, f.corazones);
  }
  return v ? c / v : 0;
}

export function puntajeQuerida(f: ParaRanking, media: number, previas = VISTAS_PREVIAS): number {
  const vistas = Math.max(f.vistas, f.corazones); // un corazón implica que la vio
  return (f.corazones + previas * media) / (vistas + previas);
}

export function puntajeAhora(f: ParaRanking, ahora: number, gravedad = GRAVEDAD): number {
  const horas = Math.max(0, (ahora - Date.parse(f.creada_en)) / 3_600_000);
  return f.corazones / Math.pow(horas + 2, gravedad);
}

/** Ordena por "Más queridas" (no modifica el arreglo). */
export function masQueridas<T extends ParaRanking>(fotos: readonly T[]): T[] {
  const media = mediaGlobal(fotos);
  const p = new Map(fotos.map((f) => [f.id, puntajeQuerida(f, media)]));
  return [...fotos].sort((a, b) => p.get(b.id)! - p.get(a.id)! || reciente(a, b));
}

/** Ordena por "Lo más querido ahora" (no modifica el arreglo). */
export function queridasAhora<T extends ParaRanking>(fotos: readonly T[], ahora: number): T[] {
  const p = new Map(fotos.map((f) => [f.id, puntajeAhora(f, ahora)]));
  return [...fotos].sort((a, b) => p.get(b.id)! - p.get(a.id)! || reciente(a, b));
}
