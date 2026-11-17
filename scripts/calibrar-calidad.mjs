// Calibra el filtro de calidad (src/lib/calidad.ts) con fotos reales.
// Toma las fotos de public/ y genera con ffmpeg versiones "malas" (borrosa,
// movida, negra, quemada, lisa) y casos que deben pasar (oscura de fiesta,
// recorte de la misma foto = repetida). Imprime medidas y veredicto.
//
// Uso (necesita ffmpeg en el PATH y Node 22.18+):
//   node scripts/calibrar-calidad.mjs
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { LADO_ANALISIS, UMBRALES, distancia, juzgar, medir } from "../src/lib/calidad.ts";

const L = LADO_ANALISIS;
// Igual que el navegador: lado mayor = 512, interpolación bilineal.
const ESCALA = `scale='if(gt(iw,ih),${L},-2)':'if(gt(iw,ih),-2,${L})':flags=bilinear`;

/** Decodifica con ffmpeg a RGBA (formato PAM: cabecera con WIDTH/HEIGHT). */
function rgba(args) {
  const out = execFileSync("ffmpeg", ["-v", "error", ...args, "-frames:v", "1", "-f", "image2pipe", "-c:v", "pam", "-pix_fmt", "rgba", "-"], {
    maxBuffer: 64 * 1024 * 1024,
  });
  const fin = out.indexOf("ENDHDR\n") + 7;
  const cab = out.subarray(0, fin).toString();
  const w = Number(/WIDTH (\d+)/.exec(cab)[1]);
  const h = Number(/HEIGHT (\d+)/.exec(cab)[1]);
  return { px: out.subarray(fin), w, h };
}

const desdeFoto = (archivo, filtro = "") => rgba(["-i", archivo, "-vf", (filtro ? filtro + "," : "") + ESCALA]);
const sintetica = (fuente) => rgba(["-f", "lavfi", "-i", fuente, "-vf", ESCALA]);

const fotos = ["public/images", "public/img"].flatMap((d) =>
  readdirSync(d)
    .filter((f) => /\.jpe?g$/i.test(f) && !/upscaled/.test(f))
    .map((f) => join(d, f))
);

const VARIANTES = [
  { nombre: "original", filtro: "", espera: null },
  { nombre: "desenfoque leve (σ=2)", filtro: "gblur=sigma=2", espera: null },
  { nombre: "desenfoque fuerte (σ=8)", filtro: "gblur=sigma=8", espera: "borrosa" },
  // Tolerada: una foto con mucha textura puede seguir pareciendo nítida aunque esté movida;
  // el filtro es permisivo a propósito y prefiere dejar pasar a retener de más.
  { nombre: "movida (barrido 40px)", filtro: "avgblur=sizeX=20:sizeY=1", espera: "borrosa", tolera: true },
  { nombre: "penumbra de fiesta", filtro: "eq=brightness=-0.35:contrast=0.9", espera: null, momento: "fiesta" },
  { nombre: "casi negra", filtro: "eq=brightness=-0.9", espera: "oscura" },
  { nombre: "quemada", filtro: "eq=brightness=0.85:contrast=0.5", espera: "quemada" },
];

const SINTETICAS = [
  { nombre: "bolsillo (negro con ruido)", fuente: "color=c=0x070707:s=1200x1600,noise=alls=8:allf=t", espera: "oscura", momento: "fiesta" },
  { nombre: "pared lisa", fuente: "color=c=0xd8c8b0:s=1600x1200,noise=alls=6:allf=t", espera: "lisa" },
  { nombre: "techo con degradé", fuente: "gradients=s=1600x1200:c0=0xe9e2d6:c1=0xcfc6b8,noise=alls=4:allf=t", espera: "lisa" },
];

let fallas = 0;
let toleradas = 0;
const fila = (etq, m, motivo, espera, tolera = false) => {
  const ok = motivo === espera;
  if (!ok && tolera) toleradas++;
  else if (!ok) fallas++;
  console.log(
    `${ok ? "  " : tolera ? "~ " : "✗ "}${etq.padEnd(48)} brillo ${String(m.brillo).padStart(5)}  osc ${m.oscuros.toFixed(2)}  cla ${m.claros.toFixed(2)}  contr ${String(m.contraste).padStart(5)}  estr ${String(m.estructura).padStart(5)}  nitidez ${String(m.nitidez).padStart(7)}  → ${motivo ?? "ok"}${ok ? "" : ` (esperado ${espera ?? "ok"})`}`
  );
};

console.log(`Fotos: ${fotos.length}\n`);
const huellas = [];
for (const f of fotos) {
  console.log(f);
  for (const v of VARIANTES) {
    const { px, w, h } = desdeFoto(f, v.filtro);
    const m = medir(px, w, h);
    if (v.nombre === "original") huellas.push({ f, h: m.huella });
    fila(v.nombre, m, juzgar(m, v.momento ?? "recepcion"), v.espera, v.tolera);
  }
}

console.log("\nSintéticas");
for (const s of SINTETICAS) {
  const { px, w, h } = sintetica(s.fuente);
  const m = medir(px, w, h);
  fila(s.nombre, m, juzgar(m, s.momento ?? "recepcion"), s.espera);
}

console.log("\nRepetidas (recorte del 4 % y leve cambio de brillo de cada foto contra su original)");
for (const { f, h } of huellas) {
  const { px, w, h: alto } = desdeFoto(f, "crop=iw*0.96:ih*0.96,eq=brightness=0.04");
  const m = medir(px, w, alto);
  const d = distancia(h, m.huella);
  const motivo = juzgar(m, "recepcion", [h]);
  const ok = motivo === "repetida";
  if (!ok) fallas++;
  console.log(`${ok ? "  " : "✗ "}${f.padEnd(48)} distancia ${d} → ${motivo ?? "ok"}`);
}

console.log("\nDistintas (cada par de fotos; 0–2 = el mismo archivo copiado en public/img)");
const pares = [];
for (let i = 0; i < huellas.length; i++)
  for (let j = i + 1; j < huellas.length; j++) pares.push({ d: distancia(huellas[i].h, huellas[j].h), a: huellas[i].f, b: huellas[j].f });
pares.sort((x, y) => x.d - y.d);
const copias = pares.filter((p) => p.d <= 2);
const distintas = pares.filter((p) => p.d > 2);
console.log(`  copias del mismo archivo: ${copias.length}`);
for (const p of distintas.slice(0, 5)) console.log(`  ${String(p.d).padStart(2)}  ${p.a} ↔ ${p.b}`);
const choques = distintas.filter((p) => p.d <= UMBRALES.repetida);
if (choques.length) fallas += choques.length;
console.log(`  ${choques.length ? "✗" : "✓"} fotos distintas marcadas como repetidas: ${choques.length} (umbral ${UMBRALES.repetida})`);

console.log(`\n${fallas ? `✗ ${fallas} casos no coinciden con lo esperado` : "✓ todos los casos coinciden"}${toleradas ? ` (~ ${toleradas} tolerados)` : ""}`);
process.exitCode = fallas ? 1 : 0;
