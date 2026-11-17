"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import {
  EN_PARALELO,
  MAX_INTENTOS,
  MAX_NOMBRE,
  AMBIENTES,
  MOMENTOS,
  cloudinaryListo,
  comprimir,
  conFirma,
  errorDefinitivo,
  etiquetaMomento,
  huellasPrevias,
  idDispositivo,
  local,
  mensajeError,
  recordarHuella,
  subirACloudinary,
  type Momento,
} from "@/lib/album";
import { ETIQUETA_MOTIVO, juzgar, type Medidas, type Motivo } from "@/lib/calidad";
import { catalogo, ganadas, leerEstado, registrarFoto, ESTADO_VACIO, type EstadoBingo } from "@/lib/bingo";
import { actividadActual } from "@/lib/cronograma";
import { useMomento } from "./Ambiente";
import FirmaFiesta from "./FirmaFiesta";
import PortadaInvitacion from "./PortadaInvitacion";
import { useToast } from "./Comun";

type Item = {
  id: string;
  file: File;
  miniatura: string;
  nombre: string;
  momento: Momento;
  reto: string;
  estado: "espera" | "subiendo" | "reintento" | "lista" | "error";
  intentos: number;
  error?: string;
  definitivo?: boolean;
  /** Si Cloudinary ya la recibió, no se vuelve a subir al reintentar. */
  subida?: { publicId: string; ancho: number; alto: number };
  /** Resultado del filtro de calidad; se mide una sola vez (al reintentar no se repite). */
  calidad?: { motivo: Motivo | null; medidas: Medidas | null };
};

const ETIQUETA: Record<Item["estado"], string> = {
  espera: "En cola",
  subiendo: "Subiendo",
  reintento: "Reintentando",
  lista: "Lista",
  error: "",
};

/** Cartón de bingo de cada momento: sus 6 retos generales (3×2). */
const CARTONES = Object.fromEntries(MOMENTOS.map((m) => [m.id, AMBIENTES[m.id].retos]));
const INSIGNIAS = catalogo(CARTONES);
const CLAVE_BINGO = "album:bingo";

const esImagen = (f: File) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name);
const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function SubirFotos() {
  const [nombre, setNombre] = useState("");
  // El momento sigue al ambiente de la boda; el invitado puede cambiarlo para
  // esta tanda, y vuelve a seguir al ambiente cuando los novios lo cambian.
  const { momento: actual, ahora } = useMomento();
  const [elegido, setElegido] = useState<{ m: Momento; durante: Momento } | null>(null);
  const momento = elegido && elegido.durante === actual ? elegido.m : actual;
  const ambiente = AMBIENTES[momento];
  // Retos: primero los de la actividad del programa que se vive ahora (si es de
  // este momento), después los generales del momento.
  const actividad = actividadActual(ahora);
  const deAhora = actividad && actividad.momento === momento ? actividad.retos : [];
  const retos = [...deAhora, ...ambiente.retos.filter((r) => !deAhora.includes(r))];
  const [retoElegido, setReto] = useState("");
  const reto = retos.includes(retoElegido) ? retoElegido : "";
  const [toast, avisar] = useToast();
  const [items, setItems] = useState<Item[]>([]);
  // Bingo de retos: lo que este teléfono ya tachó y las fotos que subió (lib/bingo.ts).
  const [bingo, setBingo] = useState<EstadoBingo>(ESTADO_VACIO);
  const bingoRef = useRef<EstadoBingo>(ESTADO_VACIO);
  const tachados = new Set(bingo.hechos);
  const conseguidas = ganadas(CARTONES, bingo);
  /** Ids que ya tienen una subida corriendo (evita lanzarlas dos veces). */
  const enCurso = useRef(new Set<string>());
  const miniaturas = useRef(new Set<string>());
  const inNombre = useRef<HTMLInputElement>(null);
  const inCamara = useRef<HTMLInputElement>(null);
  const inGaleria = useRef<HTMLInputElement>(null);

  // Nombre: ?invitado=Nombre (máx. 40) o el que quedó guardado en este teléfono.
  useEffect(() => {
    const q = (new URLSearchParams(location.search).get("invitado") || "").trim().slice(0, MAX_NOMBRE);
    const guardado = leerEstado(local.get(CLAVE_BINGO));
    bingoRef.current = guardado;
    queueMicrotask(() => {
      setNombre(q || local.get("album:nombre") || "");
      setBingo(guardado);
    });
  }, []);

  /** Una foto quedó subida: tacha su reto y avisa si ganó insignias. */
  const anotarEnBingo = useCallback(
    (reto: string) => {
      const { estado, nuevas } = registrarFoto(CARTONES, bingoRef.current, reto || null);
      bingoRef.current = estado;
      local.set(CLAVE_BINGO, JSON.stringify(estado));
      setBingo(estado);
      if (nuevas.length) avisar(`★ Nueva insignia: ${nuevas.map((i) => i.nombre).join(" · ")}`);
    },
    [avisar]
  );

  // Liberar las miniaturas locales al salir.
  useEffect(() => {
    const m = miniaturas.current;
    return () => m.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const actualizar = useCallback(
    (id: string, cambio: Partial<Item>) => setItems((prev) => prev.map((q) => (q.id === id ? { ...q, ...cambio } : q))),
    []
  );

  const procesar = useCallback(
    async (it: Item) => {
      actualizar(it.id, { estado: "subiendo" });
      let subida = it.subida;
      let calidad = it.calidad;
      try {
        if (!subida) {
          const { blob, medidas } = await comprimir(it.file);
          if (!calidad) {
            // Filtro de calidad: una foto dudosa sube igual, pero espera la revisión de los novios.
            calidad = { medidas, motivo: medidas ? juzgar(medidas, it.momento, huellasPrevias()) : null };
            if (medidas) recordarHuella(medidas.huella);
            actualizar(it.id, { calidad });
          }
          subida = await subirACloudinary(blob);
          actualizar(it.id, { subida }); // si falla Supabase, el reintento no vuelve a subir la imagen
        }
        const base = {
          p_public_id: subida.publicId,
          p_ancho: subida.ancho,
          p_alto: subida.alto,
          p_nombre: it.nombre,
          p_momento: it.momento,
          p_reto: it.reto || null,
          p_dispositivo: idDispositivo(),
        };
        const sb = getSupabase();
        let { error } = await sb.rpc("subir_foto", {
          ...base,
          p_motivo: calidad?.motivo ?? null,
          p_calidad: calidad?.medidas ?? null,
        });
        // PGRST202: la base todavía tiene la versión de subir_foto sin filtro de
        // calidad (falta correr sql/album.sql). Se sube igual, sin el filtro.
        if (error?.code === "PGRST202") ({ error } = await sb.rpc("subir_foto", base));
        // 23505 = ya estaba registrada (un intento anterior llegó pero se perdió la respuesta).
        if (error && error.code !== "23505") throw error;
        actualizar(it.id, { estado: "lista" });
        anotarEnBingo(it.reto);
      } catch (e) {
        const intentos = it.intentos + 1;
        if (errorDefinitivo(e)) {
          actualizar(it.id, { estado: "error", intentos, definitivo: true, error: mensajeError(e) });
        } else if (intentos < MAX_INTENTOS) {
          actualizar(it.id, { estado: "reintento", intentos });
          await pausa(1500 * intentos);
          enCurso.current.delete(it.id); // libre antes de volver a la cola
          actualizar(it.id, { estado: "espera", subida });
        } else {
          actualizar(it.id, { estado: "error", intentos, error: mensajeError(e) });
        }
      }
    },
    [actualizar, anotarEnBingo]
  );

  // Cola: hasta EN_PARALELO subidas a la vez; cada cambio de estado libera lugar.
  useEffect(() => {
    const ocupadas = items.filter((q) => q.estado === "subiendo" || q.estado === "reintento").length;
    const libres = EN_PARALELO - Math.max(ocupadas, enCurso.current.size);
    if (libres <= 0) return;
    items
      .filter((q) => q.estado === "espera" && !enCurso.current.has(q.id))
      .slice(0, libres)
      .forEach((it) => {
        enCurso.current.add(it.id);
        procesar(it).finally(() => enCurso.current.delete(it.id));
      });
  }, [items, procesar]);

  function encolar(files: FileList | null) {
    if (!files?.length) return;
    const n = nombre.trim();
    local.set("album:nombre", n);
    const nuevos: Item[] = [...files].filter(esImagen).map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      miniatura: URL.createObjectURL(f),
      nombre: n,
      momento,
      reto,
      estado: "espera",
      intentos: 0,
    }));
    if (!nuevos.length) return avisar("Solo se pueden subir imágenes.");
    nuevos.forEach((q) => miniaturas.current.add(q.miniatura));
    setItems((prev) => [...nuevos, ...prev]);
  }

  function faltaNombre() {
    if (nombre.trim()) return false;
    inNombre.current?.focus();
    avisar("Escribe tu nombre para que los novios sepan quién subió cada foto.");
    return true;
  }

  function reintentar(it: Item) {
    if (it.definitivo) return;
    actualizar(it.id, { intentos: 0, estado: "espera", error: undefined });
  }

  const pendientes = items.some((q) => q.estado === "espera" || q.estado === "subiendo" || q.estado === "reintento");
  const listas = items.filter((q) => q.estado === "lista").length;
  const enRevision = items.filter((q) => q.estado === "lista" && q.calidad?.motivo).length;
  const configurado = cloudinaryListo();

  return (
    <section>
      {!configurado && <div className="notice">El álbum todavía no está configurado (falta Cloudinary).</div>}
      {conFirma(actual) ? <FirmaFiesta key={actual} /> : <PortadaInvitacion />}
      <p className="lede">{AMBIENTES[actual].lede}</p>
      {AMBIENTES[actual].aviso && <p className="aviso-momento">{AMBIENTES[actual].aviso}</p>}

      <div className="card">
        <label className="field">
          <span>Tu nombre</span>
          <input
            ref={inNombre}
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value.slice(0, MAX_NOMBRE))}
            maxLength={MAX_NOMBRE}
            autoComplete="given-name"
            placeholder="Como te conocen en la fiesta"
          />
        </label>

        <div className="field">
          <span className="legend">¿En qué momento estás?</span>
          <div className="chips" role="group" aria-label="Momento">
            {MOMENTOS.map((m) => (
              <button
                key={m.id}
                type="button"
                className="chip"
                aria-pressed={momento === m.id}
                onClick={() => setElegido({ m: m.id, durante: actual })}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="legend">
            Reto para esta foto <small>(opcional)</small>
          </span>
          {deAhora.length > 0 && actividad && (
            <>
              <p className="ahora-programa">
                Ahora: <b>{actividad.nombre}</b>
              </p>
              <div className="chips" role="group" aria-label="Retos de ahora" style={{ marginBottom: 12 }}>
                {deAhora.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className="chip ahora"
                    aria-pressed={reto === r}
                    onClick={() => setReto(reto === r ? "" : r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </>
          )}
          {/* Bingo: el cartón del momento. Tocar elige el reto de la próxima foto; subirla lo tacha. */}
          <div className="bingo">
            <div className="bingo-head">
              <span>Bingo de la {etiquetaMomento(momento).toLowerCase()}</span>
              <span>
                {ambiente.retos.filter((r) => tachados.has(r)).length}/{ambiente.retos.length}
              </span>
            </div>
            <div className="bingo-carton" role="group" aria-label={`Cartón de bingo: ${etiquetaMomento(momento)}`}>
              {ambiente.retos.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`bingo-casilla${tachados.has(r) ? " hecha" : ""}`}
                  aria-pressed={reto === r}
                  aria-label={`${r}${tachados.has(r) ? " (ya lo tienes)" : ""}`}
                  onClick={() => setReto(reto === r ? "" : r)}
                >
                  <span>{r}</span>
                  {tachados.has(r) && (
                    <i className="bingo-check" aria-hidden="true">
                      ✓
                    </i>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="insignias" aria-label={`Insignias: ${conseguidas.size} de ${INSIGNIAS.length}`}>
            <span className="insignias-titulo">
              Tus insignias {conseguidas.size}/{INSIGNIAS.length}
            </span>
            <ul>
              {INSIGNIAS.map((i) => (
                <li key={i.id} className={conseguidas.has(i.id) ? "ganada" : ""} title={i.detalle}>
                  {conseguidas.has(i.id) ? "★" : "☆"} {i.nombre}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="actions">
          <button
            className="btn"
            type="button"
            disabled={!configurado}
            onClick={() => !faltaNombre() && inCamara.current?.click()}
          >
            Tomar foto
          </button>
          <button
            className="btn ghost"
            type="button"
            disabled={!configurado}
            onClick={() => !faltaNombre() && inGaleria.current?.click()}
          >
            Elegir de mi galería
          </button>
        </div>
        <input
          ref={inCamara}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            encolar(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={inGaleria}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            encolar(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="hint">
          Puedes subir varias a la vez. Las comprimimos para que suban rápido aunque la señal esté floja.
        </p>

        <ul className="queue" aria-live="polite">
          {items.slice(0, 12).map((it) => {
            const reintentable = it.estado === "error" && !it.definitivo;
            return (
              <li
                key={it.id}
                className={`q ${it.estado === "lista" ? "done" : it.estado === "error" ? "fail" : ""}${reintentable ? " retryable" : ""}`}
                onClick={reintentable ? () => reintentar(it) : undefined}
              >
                <img src={it.miniatura} alt="" />
                <div>
                  <div>
                    {it.nombre} · {etiquetaMomento(it.momento)}
                  </div>
                  <div className="st">
                    {it.estado === "error"
                      ? it.error
                      : it.estado === "lista" && it.calidad?.motivo
                        ? "Lista · los novios la revisan antes de mostrarla"
                        : ETIQUETA[it.estado]}
                  </div>
                  {it.calidad?.motivo && it.estado !== "error" && (
                    <div className="st revisa">{ETIQUETA_MOTIVO[it.calidad.motivo]}</div>
                  )}
                  {(it.estado === "subiendo" || it.estado === "reintento") && <div className="bar-load" />}
                  {reintentable && (
                    <button
                      type="button"
                      className="sr-only"
                      onClick={(e) => {
                        e.stopPropagation();
                        reintentar(it);
                      }}
                    >
                      Reintentar
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {!pendientes && listas > 0 && (
          <div className="thanks">
            Gracias, {items[0]?.nombre}.{" "}
            {listas === 1 ? "Tu foto ya está" : `Tus ${listas} fotos ya están`} en el álbum.{" "}
            {enRevision > 0 &&
              (enRevision === 1
                ? "Una parece tomada sin querer: se mostrará cuando los novios la revisen. "
                : `${enRevision} parecen tomadas sin querer: se mostrarán cuando los novios las revisen. `)}
            <Link href="/album/fotos">Ver el álbum</Link>
          </div>
        )}
      </div>
      {toast}
    </section>
  );
}
