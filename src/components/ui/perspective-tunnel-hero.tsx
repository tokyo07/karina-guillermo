"use client";

/*
 * Túnel de fotos en perspectiva para la presentación.
 * Basado en "perspective-tunnel-hero" (21st.dev), con estos cambios:
 *  - Avanza solo y en bucle (antes había que hacer scroll con la rueda).
 *  - Sin Tailwind: el proyecto no lo usa, los estilos van en CSS propio (prefijo pth-).
 *  - Fotos, textos y colores entran por props / variables CSS.
 */

import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type TunnelImage = { src: string; title?: string; alt?: string };

export interface PerspectiveTunnelHeroProps {
  images: TunnelImage[];
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Se muestra bajo el subtítulo (por ejemplo, un botón para entrar). */
  children?: ReactNode;
  /** Modo bucle: milisegundos que tarda cada foto en cruzar el túnel. */
  loopMs?: number;
  /**
   * Una sola pasada: las fotos se acercan y se desvanecen de a una y, cuando se
   * agotan, aparecen los textos (eyebrow, título, subtítulo y children).
   */
  once?: boolean;
  /** Modo once: milisegundos entre una foto y la siguiente. */
  stepMs?: number;
  /** Modo once: milisegundos que tarda cada foto en llegar a la pantalla. */
  flyMs?: number;
  /** Modo once: texto del botón para saltar la animación (sin texto, no hay botón). */
  skipLabel?: string;
  /**
   * Hace el zoom aunque el sistema pida "reducir movimiento" (lo activan, por ejemplo,
   * Escritorio remoto o Windows sin efectos de animación). Úsalo solo con un botón para saltar.
   */
  alwaysZoom?: boolean;
  /** Modo once: se llama una vez cuando aparecen los textos (al final o al saltar). */
  onReveal?: () => void;
  height?: string;
  className?: string;
}

type Stage = { width: number; height: number; isMobile: boolean };

const SPRING = { stiffness: 60, damping: 25, mass: 0.5 };

const frac = (v: number) => v - Math.floor(v);

function opacityAt(t: number) {
  // Aparece al alejarse del fondo y se desvanece justo antes de pasar la cámara.
  if (t < 0.18) return t / 0.18;
  if (t < 0.82) return 1;
  if (t < 0.98) return 1 - (t - 0.82) / 0.16;
  return 0;
}

function opacityOnce(t: number) {
  // Una pasada: entra rápido, crece casi hasta llenar la pantalla y se desvanece al final.
  if (t <= 0 || t >= 1) return 0;
  if (t < 0.12) return t / 0.12;
  if (t < 0.7) return 1;
  return 1 - (t - 0.7) / 0.3;
}

function usePointerParallax(enabled: boolean) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING);
  const y = useSpring(rawY, SPRING);
  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: PointerEvent) => {
      rawX.set((e.clientX / window.innerWidth - 0.5) * 2);
      rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled, rawX, rawY]);
  return { x, y };
}

type Card = {
  item: TunnelImage;
  offset: number;
  cos: number;
  sin: number;
  rx: number;
  ry: number;
  rotZ: number;
  /** Modo once: milisegundo en que esta foto empieza a acercarse. */
  start: number;
};

function TunnelCard({
  card,
  progress,
  pointer,
  stage,
  still,
  flyMs,
}: {
  card: Card;
  progress: MotionValue<number>;
  pointer: { x: MotionValue<number>; y: MotionValue<number> };
  stage: Stage;
  /** Movimiento reducido: la foto no vuela, solo aparece y se desvanece en su sitio. */
  still: boolean;
  /** Modo once: progress son milisegundos transcurridos. Sin él, progress es la fracción del bucle. */
  flyMs?: number;
}) {
  // Posición de esta foto en su recorrido: 0 = al fondo, 1 = pasó la pantalla.
  const local = (p: number) => (flyMs ? (p - card.start) / flyMs : frac(p + card.offset));
  const farZ = stage.isMobile ? -1200 : -1700;
  // Una pasada: llegan mucho más cerca (perspectiva 900/1200 → ~4-5x su tamaño) para el zoom.
  const nearZ = flyMs ? (stage.isMobile ? 700 : 950) : stage.isMobile ? 350 : 500;
  const width = stage.isMobile
    ? Math.max(120, Math.min(170, stage.width * 0.36))
    : Math.max(170, Math.min(260, stage.width * 0.18));
  const baseX = card.cos * stage.width * card.rx;
  const baseY = card.sin * stage.height * card.ry;
  const pan = stage.isMobile ? 20 : 45;

  // Perspectiva calculada a mano (proyección), no con translateZ + perspective de CSS:
  // WebKit (Safari y Chrome en iPhone) aplana el 3D con overflow:hidden y las fotos
  // quedaban todas del mismo tamaño, amontonadas al centro. La cuenta es la misma
  // que hace el navegador —escala = P / (P − z), y la posición se escala igual—,
  // así que en computadora se ve idéntico y en cualquier celular también.
  const P = stage.isMobile ? 900 : 1200;
  const transform = useTransform([progress, pointer.x, pointer.y], ([p, px, py]: number[]) => {
    const t = still ? 0.55 : Math.min(1, Math.max(0, local(p)));
    // Una pasada: acelera al acercarse, como si la cámara avanzara hacia ellas.
    const z = farZ + (nearZ - farZ) * (flyMs ? Math.pow(t, 1.6) : t);
    const s = P / Math.max(P - z, 1);
    const x = (baseX - px * pan) * s;
    const y = (baseY - py * pan) * s;
    return `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${s}) rotate(${card.rotZ}deg)`;
  });
  const opacity = useTransform(progress, (p) => {
    const t = local(p);
    if (flyMs) return opacityOnce(t);
    // Sin vuelo: cada foto se muestra en una ventana corta, así hay 3-4 a la vez y no tapan el título.
    return still ? (t < 0.3 ? Math.sin((Math.PI * t) / 0.3) : 0) : opacityAt(t);
  });

  return (
    <motion.div className="pth-card" style={{ width, transform, opacity }}>
      <div className="pth-card-in">
        <img src={card.item.src} alt={card.item.alt ?? card.item.title ?? ""} draggable={false} decoding="async" />
        {card.item.title ? (
          <div className="pth-cap">
            <span>{card.item.title}</span>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

export default function PerspectiveTunnelHero({
  images,
  eyebrow,
  title,
  subtitle,
  children,
  loopMs = 16000,
  once = false,
  stepMs = 650,
  flyMs = 3600,
  skipLabel,
  alwaysZoom = false,
  onReveal,
  height = "100svh",
  className,
}: PerspectiveTunnelHeroProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  // null hasta medir en el cliente: las tarjetas dependen del tamaño y de "reducir movimiento",
  // que el servidor no conoce, así que no se renderizan en SSR (evita desajustes de hidratación).
  const [stage, setStage] = useState<Stage | null>(null);

  // Medidas del contenedor (no de la ventana), por si no ocupa toda la pantalla.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = (w: number, h: number) => setStage({ width: w, height: h, isMobile: w < 768 });
    // Medida inicial directa: ResizeObserver no dispara mientras la pestaña está oculta.
    queueMicrotask(() => medir(el.clientWidth, el.clientHeight));
    const ro = new ResizeObserver(([e]) => medir(e.contentRect.width, e.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Reparto en espiral (ángulo áureo) y desfase para que entren de a una, en bucle.
  const cards = useMemo<Card[]>(
    () =>
      images.map((item, i) => {
        const a = i * 137.5 * (Math.PI / 180);
        return {
          item,
          offset: i / images.length,
          cos: Math.cos(a),
          sin: Math.sin(a),
          // Una pasada: salen más cerca del centro y la perspectiva las abre hacia los bordes.
          rx: (once ? 0.16 : 0.28) + (i % 3) * (once ? 0.05 : 0.08),
          ry: (once ? 0.14 : 0.26) + (i % 2) * (once ? 0.06 : 0.09),
          rotZ: (i % 2 === 0 ? 1 : -1) * (3 + (i % 5) * 2),
          start: i * stepMs,
        };
      }),
    [images, stepMs, once]
  );

  // Modo once: los textos aparecen cuando la última foto ya va de salida.
  const revealAt = (images.length - 1) * stepMs + flyMs * 0.35;
  const endAt = (images.length - 1) * stepMs + flyMs;
  const [revealed, setRevealed] = useState(false);
  const onRevealRef = useRef(onReveal);
  useEffect(() => {
    onRevealRef.current = onReveal;
  });
  useEffect(() => {
    if (revealed) onRevealRef.current?.();
  }, [revealed]);

  // Avance automático: el tiempo empuja el túnel, sin scroll.
  // Solo avanza mientras está en pantalla y la pestaña visible.
  const progress = useMotionValue(once ? 0 : 0.35);
  const visible = useRef(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => (visible.current = e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  // Con "reducir movimiento" (accesibilidad del sistema) sigue pasando solo,
  // pero las fotos no vuelan: aparecen y se desvanecen en su lugar, más despacio.
  const still = Boolean(reduce) && !alwaysZoom;
  useAnimationFrame((_, delta) => {
    if (!visible.current || document.hidden) return;
    const dt = Math.min(delta, 100);
    if (once) {
      // No arranca hasta tener tarjetas medidas, para que la primera foto no se pierda.
      if (!stage || progress.get() >= endAt) return;
      const next = Math.min(endAt, progress.get() + dt);
      progress.set(next);
      if (!revealed && next >= revealAt) setRevealed(true);
      return;
    }
    const ms = still ? loopMs * 1.5 : loopMs;
    progress.set(frac(progress.get() + dt / ms));
  });

  const saltar = () => {
    progress.set(endAt);
    setRevealed(true);
  };

  const pointer = usePointerParallax(!still);

  return (
    <div
      ref={ref}
      className={"pth-root" + (className ? " " + className : "")}
      style={{ height }}
    >
      <style>{CSS}</style>
      <div className="pth-dots" aria-hidden="true" />
      <div className="pth-glow" aria-hidden="true" />
      <div className="pth-ring pth-ring-a" aria-hidden="true" />
      <div className="pth-ring pth-ring-b" aria-hidden="true" />

      <div className="pth-plane" aria-hidden="true">
        {stage
          ? cards.map((c, i) => (
              <TunnelCard
                key={i}
                card={c}
                progress={progress}
                pointer={pointer}
                stage={stage}
                still={still}
                flyMs={once ? flyMs : undefined}
              />
            ))
          : null}
      </div>

      {/* La entrada del título va por CSS: igual en servidor y cliente (sin desajuste de hidratación).
          En modo once queda oculto hasta que se agotan las fotos. */}
      <div className={"pth-head" + (once ? (revealed ? " pth-show" : " pth-wait") : "")} aria-hidden={once && !revealed}>
        {eyebrow ? <p className="pth-eyebrow">{eyebrow}</p> : null}
        <h1 className="pth-title">{title}</h1>
        {subtitle ? <p className="pth-sub">{subtitle}</p> : null}
        {children ? <div className="pth-cta">{children}</div> : null}
      </div>

      {once && skipLabel && !revealed ? (
        <button type="button" className="pth-skip" onClick={saltar}>
          {skipLabel}
        </button>
      ) : null}
    </div>
  );
}

// Paleta por defecto: la de la invitación. Se puede cambiar con las variables --pth-*.
const CSS = `
.pth-root{position:relative;width:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;
  background:var(--pth-bg,#f8f1e5);color:var(--pth-ink,#46291d);user-select:none;-webkit-user-select:none}
.pth-dots{position:absolute;inset:0;pointer-events:none;opacity:.7;
  background-image:radial-gradient(var(--pth-dot,#d6bb93) 1px,transparent 1px);background-size:28px 28px;
  -webkit-mask-image:radial-gradient(ellipse 70% 70% at 50% 50%,#000 60%,transparent 100%);mask-image:radial-gradient(ellipse 70% 70% at 50% 50%,#000 60%,transparent 100%)}
.pth-glow{position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at center,var(--pth-glow,rgba(207,122,76,.18)) 0%,transparent 70%)}
.pth-ring{position:absolute;border-radius:50%;pointer-events:none}
.pth-ring-a{width:48vmin;height:48vmin;border:1px solid var(--pth-ring,rgba(168,97,66,.22))}
.pth-ring-b{width:76vmin;height:76vmin;border:1px dashed var(--pth-ring2,rgba(168,97,66,.28))}
.pth-plane{position:absolute;inset:0;pointer-events:none}
.pth-card{position:absolute;left:50%;top:50%;aspect-ratio:4/5;will-change:transform,opacity;pointer-events:auto}
.pth-card-in{position:relative;width:100%;height:100%;overflow:hidden;border-radius:16px;background:var(--pth-card,#ecdcc6);
  box-shadow:0 24px 50px -12px rgba(70,41,29,.35);outline:1px solid rgba(70,41,29,.12);outline-offset:-1px;transition:outline-color .5s,box-shadow .5s}
.pth-card-in:hover{outline-color:var(--pth-accent,#cf7a4c);box-shadow:0 24px 50px -12px rgba(207,122,76,.45)}
.pth-card-in img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .7s ease-out}
.pth-card-in:hover img{transform:scale(1.08)}
.pth-cap{position:absolute;inset:0;display:flex;align-items:flex-end;padding:14px;background:linear-gradient(to top,rgba(46,22,12,.75),rgba(46,22,12,.08) 45%,transparent)}
.pth-cap span{font:500 .75rem/1.2 var(--pth-body,system-ui,sans-serif);letter-spacing:.18em;text-transform:uppercase;color:#f8f1e5}
.pth-head{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;text-align:center;padding:0 24px;max-width:40rem;pointer-events:none;
  animation:pth-in 1.4s cubic-bezier(.2,.7,.2,1) both}
.pth-head::before{content:"";position:absolute;inset:-18% -10%;z-index:-1;pointer-events:none;
  background:radial-gradient(closest-side,var(--pth-bg,#f8f1e5) 45%,transparent)}
@keyframes pth-in{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:none}}
.pth-eyebrow{margin:0 0 14px;font:500 .75rem var(--pth-body,system-ui,sans-serif);letter-spacing:.4em;text-transform:uppercase;color:var(--pth-accent-ink,#a86142)}
.pth-title{margin:0;font:italic 500 clamp(3rem,10vw,6.5rem)/.95 var(--pth-display,Georgia,serif);letter-spacing:-.01em;color:var(--pth-ink,#46291d);
  text-shadow:0 2px 30px var(--pth-bg,#f8f1e5)}
.pth-sub{margin:16px 0 0;max-width:36ch;font:400 clamp(.95rem,2.2vw,1.1rem)/1.5 var(--pth-body,system-ui,sans-serif);color:var(--pth-muted,#6b4a38)}
.pth-cta{margin-top:26px;pointer-events:auto}
.pth-head.pth-wait,.pth-head.pth-show{animation:none}
.pth-wait>*{opacity:0;transform:translateY(16px)}
.pth-wait::before{opacity:0}
.pth-wait .pth-cta{pointer-events:none;visibility:hidden}
.pth-show::before{opacity:1;transition:opacity 1.2s ease}
.pth-show>*{opacity:1;transform:none;transition:opacity 1.1s ease,transform 1.1s cubic-bezier(.2,.7,.2,1)}
.pth-show>*:nth-child(2){transition-delay:.35s}
.pth-show>*:nth-child(3){transition-delay:.7s}
.pth-show>*:nth-child(4){transition-delay:1.1s}
.pth-skip{position:absolute;left:50%;bottom:max(22px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2;cursor:pointer;
  background:transparent;border:1px solid var(--pth-ring2,rgba(168,97,66,.4));border-radius:999px;padding:8px 18px;
  font:500 .75rem var(--pth-body,system-ui,sans-serif);letter-spacing:.2em;text-transform:uppercase;color:var(--pth-muted,#6b4a38)}
.pth-skip:focus-visible{outline:2px solid var(--pth-accent,#cf7a4c);outline-offset:3px}
@media (prefers-reduced-motion:reduce){.pth-card-in,.pth-card-in img{transition:none}.pth-head{animation:pth-fade 1.2s ease both}}
@keyframes pth-fade{from{opacity:0}to{opacity:1}}
`;
