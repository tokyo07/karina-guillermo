import { NOVIOS } from "@/lib/album";

// Portada del modo recepción: la misma de la invitación (public/index.html).
// Marco doble terracota con ramas en dos esquinas, nombres en Great Vibes y la
// foto de los novios en arco. Los dibujos son los símbolos de la invitación.

function Petalo5({ x, y, s }: { x: number; y: number; s: number }) {
  const p = "M0-6c-6-10-2-20 0-22 2 2 6 12 0 22z";
  return (
    <g transform={`translate(${x + s / 2} ${y + s / 2}) scale(${s / 60})`}>
      <circle r="5" />
      {[0, 72, 144, 216, 288].map((r) => (
        <path key={r} d={p} transform={`rotate(${r})`} />
      ))}
    </g>
  );
}

function RamaEsquina({ className }: { className: string }) {
  return (
    <svg className={`pr-ill pr-rama ${className}`} viewBox="0 0 200 200" aria-hidden="true">
      <path d="M20 190 C 50 140, 80 100, 150 40" />
      <path d="M45 150 C 30 130, 20 110, 25 90" />
      <path d="M85 100 C 110 95, 130 100, 150 115" />
      <path d="M55 132c-10-4-16-14-14-24 10 3 16 13 14 24z" />
      <path d="M70 115c4-10 14-16 24-14-3 10-13 16-24 14z" />
      <path d="M100 80c-9-6-12-17-8-26 9 6 12 17 8 26z" />
      <path d="M115 70c6-9 17-12 26-8-6 9-17 12-26 8z" />
      <path d="M33 110c-8-6-10-16-6-24 8 6 10 16 6 24z" />
      <path d="M120 105c6 8 6 18 0 24-6-8-6-18 0-24z" />
      <Petalo5 x={122} y={8} s={60} />
      <Petalo5 x={134} y={98} s={36} />
      <path d="M25 90c-6-4-7-12-2-16 5 4 6 12 2 16z" />
      <circle cx="70" cy="165" r="2.5" />
      <circle cx="165" cy="70" r="2" />
      <circle cx="95" cy="150" r="1.5" />
    </svg>
  );
}

export function Corazon() {
  return (
    <svg className="pr-ill" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.8 3.9 4.5 7.2 4.5c2 0 3.6 1.1 4.8 2.9 1.2-1.8 2.8-2.9 4.8-2.9 3.3 0 5.6 3.3 4.4 6.7-1.7 4.7-9.2 9.3-9.2 9.3z" />
    </svg>
  );
}

export default function PortadaRecepcion() {
  return (
    <div className="pr-hero">
      <div className="pr-foto">
        <img src="/images/beso.jpg" alt={`${NOVIOS.a} y ${NOVIOS.b} abrazados al atardecer`} decoding="async" />
      </div>
      <div className="pr-marco">
        <RamaEsquina className="tl" />
        <RamaEsquina className="br" />
        <p className="pr-eyebrow">Nos casamos</p>
        <h1>
          {NOVIOS.a} <span className="pr-amp">&amp;</span> {NOVIOS.b}
        </h1>
        <div className="pr-divisor">
          <Corazon />
        </div>
        <p className="pr-fecha">Sábado · 19 · Diciembre · 2026</p>
      </div>
    </div>
  );
}
