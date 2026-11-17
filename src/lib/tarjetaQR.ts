// Tarjeta imprimible con el QR del álbum, con el estilo de la invitación:
// marfil, terracota, marco doble con ramas en dos esquinas, nombres en Great
// Vibes y un QR propio (puntos redondos, esquinas decoradas y el monograma
// K&G al centro). Todo se dibuja en un <canvas>, así la vista previa y el PNG
// para imprimir son idénticos.
//
// Medidas lógicas 1000×1400 (proporción 5×7). `escala` 1,5 da 1500×2100 px:
// 5×7 pulgadas a 300 ppp.

import QRCode from "qrcode";

export const ANCHO = 1000;
export const ALTO = 1400;

const TERRACOTA = "#B4533A";
const TERRACOTA_OSCURO = "#8f3f2b";
const LINEA = "#E1BAB0";
const MARFIL = "#FFFCFA";

type Textos = { a: string; b: string; fecha: string };

/** Familias de fuente reales (next/font les pone nombres propios). */
function familia(variable: string, respaldo: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return v || respaldo;
}

/** Ramas de la invitación (viewBox 200×200), como trazos. */
const RAMA = [
  "M20 190 C 50 140, 80 100, 150 40",
  "M45 150 C 30 130, 20 110, 25 90",
  "M85 100 C 110 95, 130 100, 150 115",
  "M55 132c-10-4-16-14-14-24 10 3 16 13 14 24z",
  "M70 115c4-10 14-16 24-14-3 10-13 16-24 14z",
  "M100 80c-9-6-12-17-8-26 9 6 12 17 8 26z",
  "M115 70c6-9 17-12 26-8-6 9-17 12-26 8z",
  "M33 110c-8-6-10-16-6-24 8 6 10 16 6 24z",
  "M120 105c6 8 6 18 0 24-6-8-6-18 0-24z",
  "M25 90c-6-4-7-12-2-16 5 4 6 12 2 16z",
];
const PETALO = "M0-6c-6-10-2-20 0-22 2 2 6 12 0 22z";

function rama(ctx: CanvasRenderingContext2D, x: number, y: number, tam: number, giro: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(giro);
  ctx.scale(tam / 200, tam / 200);
  ctx.strokeStyle = TERRACOTA;
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const d of RAMA) ctx.stroke(new Path2D(d));
  // Dos flores de cinco pétalos.
  for (const [fx, fy, s] of [
    [152, 38, 1],
    [152, 116, 0.6],
  ]) {
    ctx.save();
    ctx.translate(fx, fy);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      ctx.save();
      ctx.rotate((i * 72 * Math.PI) / 180);
      ctx.stroke(new Path2D(PETALO));
      ctx.restore();
    }
    ctx.restore();
  }
  for (const [cx, cy, r] of [
    [70, 165, 2.5],
    [165, 70, 2],
    [95, 150, 1.5],
  ]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function rectRedondo(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function corazon(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.save();
  ctx.translate(cx - 12 * s, cy - 12 * s);
  ctx.scale(s, s);
  ctx.strokeStyle = TERRACOTA;
  ctx.lineWidth = 1.4;
  ctx.stroke(
    new Path2D("M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.8 3.9 4.5 7.2 4.5c2 0 3.6 1.1 4.8 2.9 1.2-1.8 2.8-2.9 4.8-2.9 3.3 0 5.6 3.3 4.4 6.7-1.7 4.7-9.2 9.3-9.2 9.3z")
  );
  ctx.restore();
}

/** Texto centrado con espaciado entre letras (versalitas de la invitación). */
function espaciado(ctx: CanvasRenderingContext2D, texto: string, cx: number, y: number, espacio: number) {
  const anchos = [...texto].map((c) => ctx.measureText(c).width);
  const total = anchos.reduce((a, b) => a + b, 0) + espacio * (texto.length - 1);
  let x = cx - total / 2;
  ctx.textAlign = "left";
  [...texto].forEach((c, i) => {
    ctx.fillText(c, x, y);
    x += anchos[i] + espacio;
  });
  ctx.textAlign = "center";
}

/** Dibuja el QR propio: puntos redondos, ojos decorados y hueco central para el monograma. */
function dibujarQR(ctx: CanvasRenderingContext2D, url: string, x: number, y: number, lado: number, fuenteMono: string) {
  const qr = QRCode.create(url, { errorCorrectionLevel: "H" });
  const n = qr.modules.size;
  const m = lado / n;
  const enOjo = (f: number, c: number) => (f < 7 && c < 7) || (f < 7 && c >= n - 7) || (f >= n - 7 && c < 7);
  // Hueco central (≈ 22 % del lado; el nivel H tolera hasta 30 % de pérdida).
  const hueco = Math.round(n * 0.22) | 1;
  const h0 = Math.floor((n - hueco) / 2);
  const enHueco = (f: number, c: number) => f >= h0 && f < h0 + hueco && c >= h0 && c < h0 + hueco;

  ctx.fillStyle = TERRACOTA_OSCURO;
  for (let f = 0; f < n; f++)
    for (let c = 0; c < n; c++) {
      if (!qr.modules.get(f, c) || enOjo(f, c) || enHueco(f, c)) continue;
      ctx.beginPath();
      ctx.arc(x + (c + 0.5) * m, y + (f + 0.5) * m, m * 0.43, 0, Math.PI * 2);
      ctx.fill();
    }

  // Ojos: anillo redondeado con una gota adentro.
  for (const [f, c] of [
    [0, 0],
    [0, n - 7],
    [n - 7, 0],
  ]) {
    const ox = x + c * m;
    const oy = y + f * m;
    ctx.fillStyle = TERRACOTA_OSCURO;
    rectRedondo(ctx, ox, oy, 7 * m, 7 * m, 2.2 * m);
    ctx.fill();
    ctx.fillStyle = "#fff";
    rectRedondo(ctx, ox + m, oy + m, 5 * m, 5 * m, 1.6 * m);
    ctx.fill();
    ctx.fillStyle = TERRACOTA;
    rectRedondo(ctx, ox + 2 * m, oy + 2 * m, 3 * m, 3 * m, 1.2 * m);
    ctx.fill();
  }

  // Monograma al centro.
  const cx = x + lado / 2;
  const cy = y + lado / 2;
  const r = (hueco * m) / 2 - m * 0.3;
  ctx.fillStyle = MARFIL;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = TERRACOTA;
  ctx.lineWidth = m * 0.35;
  ctx.stroke();
  ctx.lineWidth = m * 0.12;
  ctx.beginPath();
  ctx.arc(cx, cy, r - m * 0.55, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = TERRACOTA;
  ctx.font = `400 ${r * 0.95}px ${fuenteMono}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("K&G", cx, cy + r * 0.06);
  ctx.textBaseline = "alphabetic";
}

/** Espera las fuentes de la invitación para que el lienzo no salga con letra de respaldo. */
export async function cargarFuentes() {
  const fuentes = [familia("--font-vibes", "cursive"), familia("--font-lato", "sans-serif"), familia("--font-cormorant", "serif")];
  await Promise.all(
    fuentes.flatMap((f) => [document.fonts.load(`400 40px ${f}`), document.fonts.load(`italic 400 40px ${f}`)])
  ).catch(() => {});
}

/** Dibuja la tarjeta completa en `lienzo`. */
export function dibujarTarjeta(lienzo: HTMLCanvasElement, url: string, textos: Textos, escala = 1) {
  lienzo.width = Math.round(ANCHO * escala);
  lienzo.height = Math.round(ALTO * escala);
  const ctx = lienzo.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(escala, 0, 0, escala, 0, 0);
  const vibes = familia("--font-vibes", "cursive");
  const lato = familia("--font-lato", "sans-serif");
  const cormorant = familia("--font-cormorant", "serif");

  // Fondo y marco doble.
  ctx.fillStyle = MARFIL;
  ctx.fillRect(0, 0, ANCHO, ALTO);
  ctx.strokeStyle = TERRACOTA;
  ctx.lineWidth = 4;
  ctx.strokeRect(56, 56, ANCHO - 112, ALTO - 112);
  ctx.strokeStyle = LINEA;
  ctx.lineWidth = 2;
  ctx.strokeRect(72, 72, ANCHO - 144, ALTO - 144);
  // Ramas abrazando las esquinas del marco, como en la invitación.
  rama(ctx, 6, 6, 235, 0);
  rama(ctx, ANCHO - 6, ALTO - 6, 235, Math.PI);

  // Encabezado.
  ctx.fillStyle = TERRACOTA;
  ctx.textAlign = "center";
  ctx.font = `400 26px ${lato}`;
  espaciado(ctx, "ÁLBUM DE LA BODA", ANCHO / 2, 175, 7);
  ctx.font = `400 104px ${vibes}`;
  ctx.fillText(`${textos.a} & ${textos.b}`, ANCHO / 2, 300);
  ctx.font = `400 24px ${lato}`;
  espaciado(ctx, textos.fecha.toUpperCase(), ANCHO / 2, 352, 6);

  // QR sobre un panel blanco.
  const lado = 500;
  const qx = (ANCHO - lado) / 2;
  const qy = 410;
  ctx.fillStyle = "#fff";
  rectRedondo(ctx, qx - 34, qy - 34, lado + 68, lado + 68, 28);
  ctx.fill();
  ctx.strokeStyle = LINEA;
  ctx.lineWidth = 2;
  ctx.stroke();
  dibujarQR(ctx, url, qx, qy, lado, vibes);

  // Invitación a escanear.
  ctx.fillStyle = TERRACOTA;
  ctx.font = `italic 400 48px ${cormorant}`;
  ctx.fillText("Escanea y comparte tus fotos", ANCHO / 2, 1040);
  // Divisor con corazón.
  ctx.strokeStyle = LINEA;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ANCHO / 2 - 140, 1088);
  ctx.lineTo(ANCHO / 2 - 34, 1088);
  ctx.moveTo(ANCHO / 2 + 34, 1088);
  ctx.lineTo(ANCHO / 2 + 140, 1088);
  ctx.stroke();
  corazon(ctx, ANCHO / 2, 1088, 1.4);
  ctx.font = `400 26px ${lato}`;
  ctx.fillText("Toma una foto, súbela y cumple los retos.", ANCHO / 2, 1146);
  ctx.fillText("Así guardamos juntos cada momento.", ANCHO / 2, 1182);
  ctx.fillStyle = "#a0634f";
  ctx.font = `400 20px ${lato}`;
  ctx.fillText(url.replace(/^https?:\/\//, ""), ANCHO / 2, 1252);
}
