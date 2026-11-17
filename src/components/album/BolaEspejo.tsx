"use client";

import { useEffect, useRef } from "react";

// Bola de espejo (decoración del tema fiesta). Puntos sobre una esfera unidos
// por líneas finas (como un globo de malla), girando, con teselas de colores
// de la fiesta y destellos en las que miran al frente. Canvas 2D, sin librerías.
// Se pausa fuera de pantalla o con la pestaña oculta, y queda quieta con
// "reducir movimiento".

type Props = {
  /** Diámetro en px CSS. */
  tamano: number;
  /** Vueltas por segundo. */
  velocidad?: number;
  /** Largo del hilo del que cuelga (px); 0 = sin hilo. */
  hilo?: number;
  /** Cantidad de teselas (por defecto según el tamaño). */
  puntos?: number;
  className?: string;
};

const COLORES = ["255,248,240", "240,162,75", "226,87,122", "214,190,255"];

type Punto = { x: number; y: number; z: number; c: string; fase: number };

/** Puntos repartidos parejo sobre la esfera (espiral de Fibonacci). */
function esfera(n: number): Punto[] {
  const oro = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: n }, (_, i) => {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = oro * i;
    return { x: Math.cos(t) * r, y, z: Math.sin(t) * r, c: COLORES[i % COLORES.length], fase: (i * 2.399) % (Math.PI * 2) };
  });
}

/** Cada punto con sus 3 vecinos más cercanos (sin repetir aristas). */
function aristas(p: Punto[]): [number, number][] {
  const vistas = new Set<string>();
  const out: [number, number][] = [];
  p.forEach((a, i) => {
    const cerca = p
      .map((b, j) => ({ j, d: (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2 }))
      .filter((o) => o.j !== i)
      .sort((u, v) => u.d - v.d)
      .slice(0, 3);
    for (const { j } of cerca) {
      const k = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (!vistas.has(k)) {
        vistas.add(k);
        out.push([i, j]);
      }
    }
  });
  return out;
}

export default function BolaEspejo({ tamano, velocidad = 0.08, hilo = 0, puntos: cantidad, className }: Props) {
  const lienzo = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = lienzo.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    // Una bola gigante se dibuja a resolución normal: a 2× pesa 4 veces más por cuadro.
    const dpr = tamano > 300 ? 1 : Math.min(2, window.devicePixelRatio || 1);
    c.width = tamano * dpr;
    c.height = tamano * dpr;
    ctx.scale(dpr, dpr);

    const puntos = esfera(cantidad ?? (tamano > 70 ? 170 : 110));
    // Escala de teselas, destellos y líneas: crece con el tamaño, pero con tope
    // para que una bola gigante no tenga teselas enormes.
    const k = Math.min(tamano, 160) / 100;
    const grosor = tamano > 300 ? 1 : 0.6;
    const lados = aristas(puntos);
    const R = tamano / 2 - 3;
    const centro = tamano / 2;
    const inclinacion = 0.38;
    const ci = Math.cos(inclinacion);
    const si = Math.sin(inclinacion);
    const quieta = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let angulo = 0.6;
    let t = 0;
    let previo = 0;
    let raf = 0;
    let visible = true;

    const proyectar = (p: Punto) => {
      const ca = Math.cos(angulo);
      const sa = Math.sin(angulo);
      // Giro sobre el eje vertical y una leve inclinación hacia el que mira.
      const x = p.x * ca + p.z * sa;
      const z0 = -p.x * sa + p.z * ca;
      const y = p.y * ci - z0 * si;
      const z = p.y * si + z0 * ci;
      return { sx: centro + x * R, sy: centro + y * R, z };
    };

    const dibujar = () => {
      ctx.clearRect(0, 0, tamano, tamano);
      // Brillo de fondo de la bola.
      const g = ctx.createRadialGradient(centro - R * 0.3, centro - R * 0.35, R * 0.1, centro, centro, R * 1.05);
      g.addColorStop(0, "rgba(255,255,255,0.18)");
      g.addColorStop(0.6, "rgba(170,140,220,0.08)");
      g.addColorStop(1, "rgba(20,10,30,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(centro, centro, R, 0, Math.PI * 2);
      ctx.fill();

      const pr = puntos.map(proyectar);
      ctx.lineWidth = grosor;
      for (const [a, b] of lados) {
        const za = (pr[a].z + pr[b].z) / 2;
        ctx.strokeStyle = `rgba(255,240,235,${0.06 + 0.3 * ((za + 1) / 2)})`;
        ctx.beginPath();
        ctx.moveTo(pr[a].sx, pr[a].sy);
        ctx.lineTo(pr[b].sx, pr[b].sy);
        ctx.stroke();
      }
      // Teselas: atrás tenues, adelante brillantes; algunas destellan.
      pr.forEach((q, i) => {
        const p = puntos[i];
        const frente = (q.z + 1) / 2;
        const lado = 1.4 + 2.2 * frente * k;
        ctx.fillStyle = `rgba(${p.c},${0.15 + 0.85 * frente})`;
        ctx.fillRect(q.sx - lado / 2, q.sy - lado / 2, lado, lado);
        if (q.z > 0.35) {
          const destello = Math.pow(Math.max(0, Math.sin(t * 2.2 + p.fase)), 24);
          if (destello > 0.05) {
            const l = 2 + 7 * destello * k * (tamano > 300 ? 1.6 : 1);
            ctx.strokeStyle = `rgba(255,255,255,${destello})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(q.sx - l, q.sy);
            ctx.lineTo(q.sx + l, q.sy);
            ctx.moveTo(q.sx, q.sy - l);
            ctx.lineTo(q.sx, q.sy + l);
            ctx.stroke();
            ctx.lineWidth = grosor;
          }
        }
      });
    };

    const cuadro = (ms: number) => {
      raf = requestAnimationFrame(cuadro);
      if (!visible || document.hidden) {
        previo = ms;
        return;
      }
      const dt = Math.min(0.1, previo ? (ms - previo) / 1000 : 0);
      previo = ms;
      angulo += dt * velocidad * Math.PI * 2;
      t += dt;
      dibujar();
    };

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(c);
    if (quieta) dibujar();
    else raf = requestAnimationFrame(cuadro);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [tamano, velocidad, cantidad]);

  return (
    <span className={"bola-espejo" + (className ? " " + className : "")} aria-hidden="true">
      {hilo > 0 && <i className="bola-hilo" style={{ height: hilo }} />}
      <canvas ref={lienzo} style={{ width: tamano, height: tamano }} />
    </span>
  );
}
