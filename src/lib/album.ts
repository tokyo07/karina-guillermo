"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LADO_ANALISIS, medir, type Medidas } from "./calidad";
import { getSupabase } from "./supabase";

/* ───────────── configuración del álbum ───────────── */

export const NOVIOS = { a: "Karina", b: "Guillermo" };
export const FECHA = "Sábado 19 de diciembre de 2026";

export const MOMENTOS = [
  { id: "ceremonia", label: "Ceremonia" },
  { id: "recepcion", label: "Recepción" },
  { id: "fiesta", label: "Fiesta" },
] as const;
export type Momento = (typeof MOMENTOS)[number]["id"];

export const esMomento = (x: unknown): x is Momento => MOMENTOS.some((m) => m.id === x);

/** Ambiente de cada momento: retos y textos de la pantalla de subir. */
export const AMBIENTES: Record<Momento, { retos: string[]; lede: string; aviso?: string }> = {
  ceremonia: {
    retos: [
      "Los anillos",
      "La cara del novio al verla entrar",
      "Un detalle de la decoración",
      "Las manos de los novios",
      "Quien se emocionó a tu lado",
      "La salida de los novios",
    ],
    lede: "Los anillos, las miradas, los detalles. Guarda la ceremonia como la vives tú.",
    aviso: "Estamos en la iglesia: apaga el flash y el sonido de la cámara, por favor.",
  },
  recepcion: {
    retos: [
      "Foto con quien vino de más lejos",
      "Selfie de toda tu mesa",
      "El brindis",
      "Algo azul de la boda",
      "El abrazo más sincero",
      "Los novios sin que se den cuenta",
    ],
    lede: "Cada mesa vive la fiesta distinta. Sube lo que ves tú y ayúdanos a recordarla completa.",
  },
  fiesta: {
    retos: [
      "La pista de baile en pleno apogeo",
      "El paso de baile más raro",
      "Los novios bailando",
      "Tu grupo en plena foto loca",
      "El primero que se quitó los zapatos",
      "La hora loca",
    ],
    lede: "¡Ahora sí, a la pista! Sube lo más divertido de la noche.",
  },
};

/** Momento que se usa mientras no se sabe el real (es el diseño original). */
export const MOMENTO_INICIAL: Momento = "recepcion";

export const MAX_LADO = 1600;
export const CALIDAD_JPEG = 0.82;
export const EN_PARALELO = 2;
export const MAX_INTENTOS = 3;
export const MAX_NOMBRE = 40;
/** Cada cuánto se vuelve a pedir la lista completa (corazones y fotos ocultadas). */
export const REFRESCO_MS = 30_000;

export const etiquetaMomento = (id: string) => MOMENTOS.find((m) => m.id === id)?.label ?? "";

/* ───────────── almacenamiento local seguro ───────────── */

export const local = {
  get(k: string): string | null {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k: string, v: string) {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* modo privado o almacenamiento bloqueado: se sigue sin recordar */
    }
  },
};

/** Id anónimo de este teléfono: un corazón por foto y límite de subidas por hora. */
export function idDispositivo(): string {
  let id = local.get("album:dispositivo");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    id = crypto.randomUUID();
    local.set("album:dispositivo", id);
  }
  return id;
}

/* ───────────── Cloudinary ───────────── */

const NUBE = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const cloudinaryListo = () => Boolean(NUBE && PRESET);

/** URL de entrega. `ancho` limita el lado mayor; sin ancho, la imagen original. */
export function urlFoto(publicId: string, ancho?: 480 | 1600): string {
  const ruta = publicId.split("/").map(encodeURIComponent).join("/");
  const t = ancho ? `c_limit,w_${ancho},h_${ancho}/q_auto,f_auto/` : "";
  return `https://res.cloudinary.com/${NUBE}/image/upload/${t}${ruta}`;
}

export async function subirACloudinary(blob: Blob): Promise<{ publicId: string; ancho: number; alto: number }> {
  if (!NUBE || !PRESET) throw new Error("cloudinary_sin_configurar");
  const fd = new FormData();
  fd.append("file", blob, "foto.jpg");
  fd.append("upload_preset", PRESET);
  const r = await fetch(`https://api.cloudinary.com/v1_1/${NUBE}/image/upload`, { method: "POST", body: fd });
  if (!r.ok) throw new Error(`cloudinary_${r.status}`);
  const j = (await r.json()) as { public_id: string; width: number; height: number };
  return { publicId: j.public_id, ancho: j.width, alto: j.height };
}

/* ───────────── compresión en el cliente ───────────── */

/** Mide la calidad de lo que ya está dibujado en `c`, reducido a LADO_ANALISIS (ver lib/calidad.ts). */
function medirLienzo(c: HTMLCanvasElement): Medidas | null {
  try {
    const s = Math.min(1, LADO_ANALISIS / Math.max(c.width, c.height));
    const p = document.createElement("canvas");
    p.width = Math.max(1, Math.round(c.width * s));
    p.height = Math.max(1, Math.round(c.height * s));
    const ctx = p.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(c, 0, 0, p.width, p.height);
    return medir(ctx.getImageData(0, 0, p.width, p.height).data, p.width, p.height);
  } catch {
    return null; // si algo falla, la foto sube sin filtro: nunca se bloquea por esto
  }
}

/** Huellas de las fotos que este teléfono ya subió (para detectar repetidas). */
const CLAVE_HUELLAS = "album:huellas";
export function huellasPrevias(): string[] {
  try {
    const v = JSON.parse(local.get(CLAVE_HUELLAS) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
export function recordarHuella(h: string) {
  local.set(CLAVE_HUELLAS, JSON.stringify([h, ...huellasPrevias()].slice(0, 150)));
}

/** Comprime y además mide la calidad de la foto (null si no se pudo medir). */
export async function comprimir(file: File): Promise<{ blob: Blob; medidas: Medidas | null }> {
  let fuente: CanvasImageSource;
  let w: number;
  let h: number;
  let url: string | null = null;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    fuente = bmp;
    w = bmp.width;
    h = bmp.height;
  } catch {
    url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await img.decode();
    fuente = img;
    w = img.naturalWidth;
    h = img.naturalHeight;
  }
  try {
    const s = Math.min(1, MAX_LADO / Math.max(w, h));
    const c = document.createElement("canvas");
    c.width = Math.round(w * s);
    c.height = Math.round(h * s);
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("sin_canvas");
    ctx.drawImage(fuente, 0, 0, c.width, c.height);
    const medidas = medirLienzo(c);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", CALIDAD_JPEG));
    if (!blob) throw new Error("no_se_pudo_comprimir");
    return { blob, medidas };
  } finally {
    if (fuente instanceof ImageBitmap) fuente.close();
    if (url) URL.revokeObjectURL(url);
  }
}

/* ───────────── errores legibles ───────────── */

export function mensajeError(e: unknown): string {
  const m = e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String(e.message) : "";
  if (m.includes("album_cerrado")) return "El álbum ya no recibe fotos nuevas.";
  if (m.includes("limite_por_hora")) return "Subiste muchas fotos en poco tiempo. Espera un rato.";
  if (m.includes("cloudinary_sin_configurar") || m.includes("Faltan NEXT_PUBLIC"))
    return "El álbum todavía no está configurado.";
  return "No se pudo subir. Toca para reintentar.";
}

/** Errores que no se arreglan reintentando. */
export const errorDefinitivo = (e: unknown) => {
  const m = e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String(e.message) : "";
  return /album_cerrado|limite_por_hora|sin_configurar|Faltan NEXT_PUBLIC|public_id_invalido/.test(m);
};

/* ───────────── datos de fotos (Supabase + Realtime) ───────────── */

export type Foto = {
  id: string;
  public_id: string;
  ancho: number;
  alto: number;
  nombre: string;
  momento: string;
  reto: string | null;
  oculta: boolean;
  /** Dudosa según el filtro de calidad: espera la revisión de los novios. */
  revisar: boolean;
  motivo: string | null;
  creada_en: string;
  corazones: number;
  mi_corazon: boolean;
};

/** La ven los invitados: ni oculta ni esperando revisión. */
export const esVisible = (f: Pick<Foto, "oculta" | "revisar">) => !f.oculta && !f.revisar;

export type EstadoCarga = "cargando" | "listo" | "sin_configurar" | "error";

/**
 * Lista de fotos con actualización en vivo.
 * - INSERT por Realtime: las fotos nuevas aparecen al instante (y se avisan con `alLlegar`).
 * - Cada REFRESCO_MS se recarga todo para traer corazones de otros y fotos ocultadas.
 */
export function useFotos(alLlegar?: (nuevas: Foto[]) => void) {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [estado, setEstado] = useState<EstadoCarga>("cargando");
  const conocidas = useRef<Set<string> | null>(null);
  const avisar = useRef(alLlegar);
  useEffect(() => {
    avisar.current = alLlegar;
  });

  const aplicar = useCallback((lista: Foto[]) => {
    const previas = conocidas.current;
    if (previas) {
      const nuevas = lista.filter((f) => !previas.has(f.id));
      if (nuevas.length) avisar.current?.(nuevas);
    }
    conocidas.current = new Set(lista.map((f) => f.id));
    setFotos(lista);
  }, []);

  const recargar = useCallback(async () => {
    try {
      const { data, error } = await getSupabase().rpc("listar_fotos", { p_dispositivo: idDispositivo() });
      if (error) throw error;
      aplicar(((data ?? []) as Foto[]).map((f) => ({ ...f, corazones: Number(f.corazones) })));
      setEstado("listo");
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      setEstado(m.includes("Faltan NEXT_PUBLIC") ? "sin_configurar" : "error");
    }
  }, [aplicar]);

  useEffect(() => {
    let sb: ReturnType<typeof getSupabase>;
    try {
      sb = getSupabase();
    } catch {
      // Sin variables de entorno: se muestra el aviso y no hay nada que escuchar.
      queueMicrotask(() => setEstado("sin_configurar"));
      return;
    }
    queueMicrotask(recargar);
    const canal = sb
      .channel("album-fotos")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "fotos" }, (p) => {
        const n = p.new as Omit<Foto, "corazones" | "mi_corazon" | "revisar" | "motivo"> & Partial<Foto>;
        const f: Foto = { ...n, revisar: n.revisar ?? false, motivo: n.motivo ?? null, corazones: 0, mi_corazon: false };
        // Las ocultas no llegan a los invitados (RLS); las por revisar solo llegan
        // a los novios, que las ven en el panel pero no como "nuevas" del álbum.
        if (f.oculta || conocidas.current?.has(f.id)) return;
        conocidas.current?.add(f.id);
        if (esVisible(f)) avisar.current?.([f]);
        setFotos((prev) => (prev.some((x) => x.id === f.id) ? prev : [f, ...prev]));
      })
      .subscribe();
    const t = setInterval(recargar, REFRESCO_MS);
    return () => {
      clearInterval(t);
      sb.removeChannel(canal);
    };
  }, [recargar]);

  const corazon = useCallback(
    async (id: string) => {
      // Optimista: se pinta ya y se corrige con la respuesta del servidor.
      setFotos((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, mi_corazon: !f.mi_corazon, corazones: Math.max(0, f.corazones + (f.mi_corazon ? -1 : 1)) }
            : f
        )
      );
      try {
        const { data, error } = await getSupabase().rpc("alternar_corazon", {
          p_foto: id,
          p_dispositivo: idDispositivo(),
        });
        if (error) throw error;
        const r = data?.[0];
        if (r)
          setFotos((prev) =>
            prev.map((f) => (f.id === id ? { ...f, mi_corazon: r.mi_corazon, corazones: Number(r.corazones) } : f))
          );
      } catch {
        recargar();
      }
    },
    [recargar]
  );

  return { fotos, estado, recargar, corazon, setFotos };
}

/* ───────────── utilidades de descarga ───────────── */

export function nombreArchivo(f: Pick<Foto, "nombre" | "creada_en">): string {
  const base = (f.nombre || "invitado")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `${base || "invitado"}-${new Date(f.creada_en).getTime().toString().slice(-6)}`;
}

export function guardarArchivo(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
