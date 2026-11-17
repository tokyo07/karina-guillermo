// Programa de la boda (cronograma de la recepción + ceremonia a las 5:00 p. m.).
// Sirve para dos cosas:
//   1. Cambio automático de ambiente como respaldo: si nadie toca el panel, el
//      momento cambia solo a la hora del programa. Si los novios o el moderador
//      eligen un momento a mano, esa elección manda hasta el próximo cambio del
//      programa (ver momentoEfectivo).
//   2. Retos de la actividad que se está viviendo (el brindis, los mariachis...).
//
// Funciones puras: reciben la hora como número (ms) para poder probarlas.
// Todas las horas son de Ecuador (UTC-5, sin horario de verano).

import type { Momento } from "./album";

export const ZONA_HORARIA = "America/Guayaquil";

export type Actividad = {
  /** Hora de inicio (ISO con zona de Ecuador). */
  desde: string;
  nombre: string;
  momento: Momento;
  /** Retos de esta actividad; se muestran primero mientras dura. */
  retos: string[];
};

export const CRONOGRAMA: Actividad[] = [
  { desde: "2026-12-19T17:00:00-05:00", nombre: "Ceremonia en la iglesia", momento: "ceremonia", retos: [] },
  {
    desde: "2026-12-19T18:45:00-05:00",
    nombre: "Llegada y bienvenida",
    momento: "recepcion",
    retos: ["Tu mesa recién llegada", "El primer bocadito de la noche"],
  },
  {
    desde: "2026-12-19T19:15:00-05:00",
    nombre: "Entrada de los esposos",
    momento: "recepcion",
    retos: ["La entrada de los esposos", "Los aplausos de tu mesa"],
  },
  {
    desde: "2026-12-19T19:30:00-05:00",
    nombre: "Brindis",
    momento: "recepcion",
    retos: ["El brindis", "Las copas en alto de tu mesa"],
  },
  {
    desde: "2026-12-19T19:45:00-05:00",
    nombre: "Primer baile",
    momento: "recepcion",
    retos: ["El primer baile de los esposos", "El baile familiar"],
  },
  {
    desde: "2026-12-19T20:00:00-05:00",
    nombre: "Apertura de pista",
    momento: "fiesta",
    retos: ["La pista recién abierta", "El primero en salir a bailar"],
  },
  {
    desde: "2026-12-19T21:00:00-05:00",
    nombre: "Cena",
    momento: "fiesta",
    retos: ["Tu plato del buffet", "Selfie de toda tu mesa cenando"],
  },
  {
    desde: "2026-12-19T22:00:00-05:00",
    nombre: "Mariachis y corte del pastel",
    momento: "fiesta",
    retos: ["Los mariachis", "El corte del pastel", "Los esposos cantando “Si nos dejan”"],
  },
  {
    desde: "2026-12-19T22:40:00-05:00",
    nombre: "DJ tropical y baile",
    momento: "fiesta",
    retos: ["El paso tropical más sabroso", "Tu pareja de baile"],
  },
  {
    desde: "2026-12-19T23:30:00-05:00",
    nombre: "Parranda vallenata",
    momento: "fiesta",
    retos: ["La parranda vallenata", "Tu mejor paso de vallenato", "Los músicos de cerca"],
  },
  {
    desde: "2026-12-20T00:10:00-05:00",
    nombre: "DJ y baile",
    momento: "fiesta",
    retos: ["La pista después de medianoche"],
  },
  {
    desde: "2026-12-20T01:00:00-05:00",
    nombre: "Hora loca de cierre",
    momento: "fiesta",
    retos: [
      "El disfraz más loco",
      "Los esposos con sombrero o antifaz",
      "El trencito de baile",
      "Lluvia de luces y papelitos",
      "El que no se cansa de bailar",
    ],
  },
  {
    desde: "2026-12-20T01:50:00-05:00",
    nombre: "Última canción y despedida",
    momento: "fiesta",
    retos: ["La última canción", "La salida de los esposos", "La foto final de todos"],
  },
];

/** Fin de la recepción. */
export const FIN = "2026-12-20T02:00:00-05:00";
/** Después de esto el programa ya no cambia nada: el álbum queda con el último momento elegido. */
const FIN_AUTOMATICO = Date.parse("2026-12-20T06:00:00-05:00");

const ms = (iso: string) => Date.parse(iso);

/** Actividad en curso, o null fuera del programa. */
export function actividadActual(ahora: number): Actividad | null {
  if (ahora < ms(CRONOGRAMA[0].desde) || ahora >= ms(FIN)) return null;
  let actual: Actividad | null = null;
  for (const a of CRONOGRAMA) if (ms(a.desde) <= ahora) actual = a;
  return actual;
}

/** Horas en que el programa cambia de momento (ceremonia → recepción → fiesta). */
export const CAMBIOS: { desde: number; momento: Momento }[] = CRONOGRAMA.filter(
  (a, i) => i === 0 || CRONOGRAMA[i - 1].momento !== a.momento
).map((a) => ({ desde: ms(a.desde), momento: a.momento }));

/** Último cambio programado que ya pasó (dentro de la ventana automática), o null. */
export function cambioProgramado(ahora: number): { desde: number; momento: Momento } | null {
  if (ahora >= FIN_AUTOMATICO) return null;
  let ultimo: { desde: number; momento: Momento } | null = null;
  for (const c of CAMBIOS) if (c.desde <= ahora) ultimo = c;
  return ultimo;
}

/** Próximo cambio programado, o null si ya no quedan. */
export function siguienteCambio(ahora: number): { desde: number; momento: Momento } | null {
  return CAMBIOS.find((c) => c.desde > ahora) ?? null;
}

/**
 * Momento que se vive: el elegido a mano manda hasta el próximo cambio del
 * programa posterior a esa elección. Sin elección a mano posterior, el del programa.
 */
export function momentoEfectivo(manual: Momento, fijadoEn: number | null, ahora: number): Momento {
  const c = cambioProgramado(ahora);
  if (!c) return manual;
  if (fijadoEn !== null && fijadoEn >= c.desde) return manual;
  return c.momento;
}

/** "8:00 p. m." en hora de Ecuador. */
export function horaCorta(t: number): string {
  return new Intl.DateTimeFormat("es-EC", { hour: "numeric", minute: "2-digit", timeZone: ZONA_HORARIA }).format(t);
}
