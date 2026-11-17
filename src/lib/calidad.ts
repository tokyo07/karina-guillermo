// Filtro de calidad del álbum: detecta fotos tomadas sin querer antes de subirlas.
// Funciones puras sobre píxeles RGBA (sin DOM) para poder probarlas fuera del navegador.
//
// Técnicas clásicas, sin modelos ni servicios:
//   - Nitidez: varianza del Laplaciano sobre la luminancia (baja = borrosa / movida).
//   - Exposición: brillo medio y fracción de píxeles casi negros o casi blancos.
//   - Estructura: desviación de los promedios de bloques (muy baja = foto "lisa":
//     pared, techo, mano tapando la cámara). Ignora el ruido del sensor.
//   - Repetidas: hash de diferencias (dHash, 64 bits) comparado por distancia de Hamming.
//
// Los umbrales son a propósito permisivos: una foto dudosa no se pierde, solo
// espera la revisión de los novios. Se calibraron con scripts/calibrar-calidad.mjs.

/** Lado mayor de la imagen que se analiza. La nitidez depende de la escala: medir siempre a este tamaño. */
export const LADO_ANALISIS = 512;

export type Medidas = {
  /** Brillo medio, 0–255. */
  brillo: number;
  /** Fracción de píxeles casi negros (< 24). */
  oscuros: number;
  /** Fracción de píxeles casi blancos (> 245). */
  claros: number;
  /** Desviación estándar de la luminancia. */
  contraste: number;
  /** Desviación estándar de los promedios de bloques de 16×16: contraste sin el ruido del sensor. */
  estructura: number;
  /** Varianza del Laplaciano. */
  nitidez: number;
  /** dHash de 64 bits en hexadecimal. */
  huella: string;
};

export type Motivo = "borrosa" | "oscura" | "quemada" | "lisa" | "repetida";

export const ETIQUETA_MOTIVO: Record<Motivo, string> = {
  borrosa: "Parece borrosa o movida",
  oscura: "Parece casi negra",
  quemada: "Parece casi blanca",
  lisa: "Parece no mostrar nada (pared, techo o bolsillo)",
  repetida: "Es casi igual a otra que ya subiste",
};

export const UMBRALES = {
  /** Varianza del Laplaciano por debajo de esto: borrosa. */
  nitidez: 25,
  /** Estructura por debajo de esto: lisa. */
  estructura: 12,
  /** Brillo medio y fracción de oscuros para "oscura". En la recepción y la fiesta (de noche) se tolera más oscuridad. */
  oscura: { brillo: 30, oscuros: 0.8 },
  oscuraFiesta: { brillo: 16, oscuros: 0.92 },
  /** "Quemada": casi todo blanco, o muy clara y sin contraste. */
  quemada: { claros: 0.75, brillo: 225, contraste: 15 },
  /** Distancia de Hamming máxima entre huellas para "repetida". */
  repetida: 8,
};

/** Luminancia (Rec. 601) de un buffer RGBA. */
function luminancia(rgba: ArrayLike<number>, n: number): Float32Array {
  const g = new Float32Array(n);
  for (let i = 0, j = 0; i < n; i++, j += 4) g[i] = 0.299 * rgba[j] + 0.587 * rgba[j + 1] + 0.114 * rgba[j + 2];
  return g;
}

/** dHash: reduce a 9×8 por promedio de bloques y compara cada píxel con su vecino derecho. */
function dhash(g: Float32Array, w: number, h: number): string {
  const cw = 9;
  const ch = 8;
  const celdas = new Float32Array(cw * ch);
  for (let cy = 0; cy < ch; cy++) {
    const y0 = Math.floor((cy * h) / ch);
    const y1 = Math.max(y0 + 1, Math.floor(((cy + 1) * h) / ch));
    for (let cx = 0; cx < cw; cx++) {
      const x0 = Math.floor((cx * w) / cw);
      const x1 = Math.max(x0 + 1, Math.floor(((cx + 1) * w) / cw));
      let s = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) s += g[y * w + x];
      celdas[cy * cw + cx] = s / ((y1 - y0) * (x1 - x0));
    }
  }
  let hex = "";
  for (let cy = 0; cy < ch; cy++) {
    let byte = 0;
    for (let cx = 0; cx < 8; cx++) byte = (byte << 1) | (celdas[cy * cw + cx] > celdas[cy * cw + cx + 1] ? 1 : 0);
    hex += byte.toString(16).padStart(2, "0");
  }
  return hex;
}

/** Mide una imagen RGBA de w×h (idealmente con lado mayor LADO_ANALISIS). */
export function medir(rgba: ArrayLike<number>, w: number, h: number): Medidas {
  const n = w * h;
  const g = luminancia(rgba, n);

  let suma = 0;
  let suma2 = 0;
  let oscuros = 0;
  let claros = 0;
  for (let i = 0; i < n; i++) {
    const v = g[i];
    suma += v;
    suma2 += v * v;
    if (v < 24) oscuros++;
    else if (v > 245) claros++;
  }
  const brillo = suma / n;
  const contraste = Math.sqrt(Math.max(0, suma2 / n - brillo * brillo));

  // Laplaciano de 4 vecinos, sin los bordes.
  let ls = 0;
  let ls2 = 0;
  let m = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const l = g[i - w] + g[i + w] + g[i - 1] + g[i + 1] - 4 * g[i];
      ls += l;
      ls2 += l * l;
      m++;
    }
  }
  const media = m ? ls / m : 0;
  const nitidez = m ? ls2 / m - media * media : 0;

  // Estructura: promedios de bloques de 16×16 (el ruido se cancela) y su desviación.
  const B = 16;
  let bs = 0;
  let bs2 = 0;
  let nb = 0;
  for (let y0 = 0; y0 + B <= h; y0 += B) {
    for (let x0 = 0; x0 + B <= w; x0 += B) {
      let s = 0;
      for (let y = y0; y < y0 + B; y++) for (let x = x0; x < x0 + B; x++) s += g[y * w + x];
      const v = s / (B * B);
      bs += v;
      bs2 += v * v;
      nb++;
    }
  }
  const bm = nb ? bs / nb : 0;
  const estructura = nb ? Math.sqrt(Math.max(0, bs2 / nb - bm * bm)) : 0;

  const r = (x: number, d = 1) => Math.round(x * 10 ** d) / 10 ** d;
  return {
    brillo: r(brillo),
    oscuros: r(oscuros / n, 3),
    claros: r(claros / n, 3),
    contraste: r(contraste),
    estructura: r(estructura),
    nitidez: r(nitidez),
    huella: dhash(g, w, h),
  };
}

/** Bits distintos entre dos huellas hexadecimales de igual largo. */
export function distancia(a: string, b: string): number {
  let d = 0;
  for (let i = 0; i < a.length; i += 2) {
    let x = parseInt(a.slice(i, i + 2), 16) ^ parseInt(b.slice(i, i + 2), 16);
    while (x) {
      d += x & 1;
      x >>= 1;
    }
  }
  return d;
}

/**
 * Decide si la foto es dudosa. Devuelve el motivo o null si está bien.
 * `previas`: huellas de fotos que este teléfono ya subió.
 */
export function juzgar(m: Medidas, momento: string, previas: readonly string[] = []): Motivo | null {
  const oscura = momento === "recepcion" || momento === "fiesta" ? UMBRALES.oscuraFiesta : UMBRALES.oscura;
  if (m.brillo < oscura.brillo && m.oscuros > oscura.oscuros) return "oscura";
  const q = UMBRALES.quemada;
  if (m.claros > q.claros || (m.brillo > q.brillo && m.contraste < q.contraste)) return "quemada";
  if (m.estructura < UMBRALES.estructura) return "lisa";
  if (m.nitidez < UMBRALES.nitidez) return "borrosa";
  if (previas.some((p) => p.length === m.huella.length && distancia(p, m.huella) <= UMBRALES.repetida)) return "repetida";
  return null;
}
