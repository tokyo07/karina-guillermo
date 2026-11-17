import { FECHA, NOVIOS } from "@/lib/album";

// Portada de la fiesta y la hora loca: una foto de los novios al centro,
// fotos pequeñas que se dispersan alrededor y los nombres que se escriben solos
// encima, en letra manuscrita blanca. Se monta al pasar a "fiesta" o "hora loca",
// así que la animación corre cada vez que los novios cambian a uno de ellos.

const FLOTANTES = [
  { src: "/images/abrazo.jpg", clase: "f1" },
  { src: "/images/mirada.jpg", clase: "f2" },
  { src: "/images/pareja.jpg", clase: "f3" },
  { src: "/images/frentes.jpg", clase: "f4" },
];

/** "Sábado 19 de diciembre de 2026" → "19.12.2026", como la galería de referencia. */
function fechaCorta(fecha: string): string {
  const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const m = /(\d{1,2}) de (\w+) de (\d{4})/i.exec(fecha);
  const mes = m ? meses.indexOf(m[2].toLowerCase()) + 1 : 0;
  return m && mes ? `${m[1].padStart(2, "0")}.${String(mes).padStart(2, "0")}.${m[3]}` : fecha;
}

export default function FirmaFiesta() {
  return (
    <div className="firma-fiesta">
      <h1 className="sr-only">
        {NOVIOS.a} y {NOVIOS.b}
      </h1>
      <div className="ff-escena" aria-hidden="true">
        {FLOTANTES.map((f) => (
          <img key={f.clase} className={`ff-flota ${f.clase}`} src={f.src} alt="" decoding="async" />
        ))}
        <img className="ff-foto" src="/images/beso.jpg" alt="" decoding="async" />
        <p className="ff-firma">
          <span className="l1">{NOVIOS.a}</span>
          <span className="l2">&amp; {NOVIOS.b}</span>
        </p>
      </div>
      <p className="ff-fecha">[{fechaCorta(FECHA)}]</p>
    </div>
  );
}
