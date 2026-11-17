"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { MOMENTOS, NOVIOS, esVisible, etiquetaMomento, marcarVistas, urlFoto, useFotos, type Foto } from "@/lib/album";
import { loMejor } from "@/lib/mejores";
import { masQueridas, queridasAhora } from "@/lib/ranking";
import { AvisoEstado, IconoCorazon, useToast } from "./Comun";
import { useMomento } from "./Ambiente";
import BolaEspejo from "./BolaEspejo";
import DiarioAlbum from "./DiarioAlbum";

const ROTACION_MS = 7000;

export default function Album() {
  const [filtro, setFiltro] = useState<string>("todas");
  // "Más queridas": promedio bayesiano de corazones sobre vistas (lib/ranking.ts).
  // "Lo mejor": amor + calidad, una por ráfaga, el mejor 30 % (lib/mejores.ts).
  const [orden, setOrden] = useState<"recientes" | "queridas" | "mejor">("recientes");
  // "Ver el álbum" abre el diario; el mural en columnas queda como vista alternativa.
  const [vista, setVista] = useState<"diario" | "mural">("diario");
  const [toast, avisar] = useToast();
  const { momento } = useMomento();
  const [frescas, setFrescas] = useState<Set<string>>(new Set());
  const [visor, setVisor] = useState<{ lista: Foto[]; i: number } | null>(null);
  const [proyector, setProyector] = useState(false);
  const prioridad = useRef<Foto[]>([]);
  const [senalNueva, setSenalNueva] = useState(0);

  const alLlegar = useCallback((nuevas: Foto[]) => {
    setFrescas((s) => new Set([...s, ...nuevas.map((f) => f.id)]));
    prioridad.current.push(...nuevas);
    setSenalNueva((n) => n + 1);
  }, []);
  const { fotos, estado, corazon } = useFotos(alLlegar);
  // Estable: el proyector registra listeners con este callback.
  const salirProyector = useCallback(() => setProyector(false), []);
  const abrirProyector = () => {
    prioridad.current = []; // solo cuentan como "Nueva" las que lleguen con el proyector abierto
    setProyector(true);
  };

  const filtradas = fotos.filter((f) => esVisible(f) && (filtro === "todas" || f.momento === filtro));
  const lista =
    orden === "queridas" ? masQueridas(filtradas) : orden === "mejor" ? loMejor(filtradas) : filtradas;
  const mural = useRef<HTMLDivElement>(null);

  // Mural: cuenta como vista la foto que entra a la pantalla.
  const idsMural = vista === "mural" ? lista.map((f) => f.id).join(",") : "";
  useEffect(() => {
    const el = mural.current;
    if (!idsMural || !el) return;
    const io = new IntersectionObserver(
      (es) => marcarVistas(es.filter((e) => e.isIntersecting).map((e) => (e.target as HTMLElement).dataset.id ?? "")),
      { threshold: 0.6 }
    );
    el.querySelectorAll<HTMLElement>("[data-id]").forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [idsMural]);
  // Una recarga fallida (señal floja en la fiesta) pone estado "error", pero las
  // fotos ya cargadas siguen sirviendo: no se esconde el diario ni el conteo.
  const hayDatos = estado === "listo" || fotos.length > 0;

  return (
    <section className="pg">
      <AvisoEstado estado={estado} />
      <div className="head">
        <div>
          <h2>
            El álbum de todos
            {momento === "fiesta" && <BolaEspejo tamano={52} velocidad={0.1} className="bola-titulo" />}
          </h2>
          <p>
            {estado === "cargando"
              ? "Cargando fotos…"
              : hayDatos
                ? orden === "mejor"
                  ? `Lo mejor de la noche: ${lista.length} de ${filtradas.length} fotos`
                  : `${lista.length} ${lista.length === 1 ? "foto" : "fotos"} compartidas por los invitados`
                : ""}
          </p>
        </div>
        <div className="head-acciones">
          <div className="chips" role="group" aria-label="Vista">
            <button type="button" className="chip" aria-pressed={vista === "diario"} onClick={() => setVista("diario")}>
              Diario
            </button>
            <button type="button" className="chip" aria-pressed={vista === "mural"} onClick={() => setVista("mural")}>
              Mural
            </button>
          </div>
          <button className="btn ghost small solo-pantalla-grande" type="button" onClick={abrirProyector}>
            Modo proyector
          </button>
        </div>
      </div>

      <div className="filtros">
        <div className="chips" role="group" aria-label="Filtrar por momento">
          {[{ id: "todas", label: "Todas" }, ...MOMENTOS].map((o) => (
            <button
              key={o.id}
              type="button"
              className="chip"
              aria-pressed={filtro === o.id}
              onClick={() => setFiltro(o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div className="chips" role="group" aria-label="Ordenar">
          <button type="button" className="chip" aria-pressed={orden === "recientes"} onClick={() => setOrden("recientes")}>
            Recientes
          </button>
          <button type="button" className="chip" aria-pressed={orden === "queridas"} onClick={() => setOrden("queridas")}>
            ♥ Más queridas
          </button>
          <button type="button" className="chip" aria-pressed={orden === "mejor"} onClick={() => setOrden("mejor")}>
            ★ Lo mejor
          </button>
        </div>
      </div>

      {vista === "diario" ? (
        hayDatos && (
          <DiarioAlbum
            fotos={lista}
            onAbrir={(i) => setVisor({ lista, i })}
            onMural={() => setVista("mural")}
            avisar={avisar}
          />
        )
      ) : lista.length > 0 ? (
        <div className="wall" ref={mural}>
          {lista.map((f, i) => (
            <figure
              key={f.id}
              data-id={f.id}
              className={`tile${frescas.has(f.id) ? " fresh" : ""}`}
              tabIndex={0}
              role="button"
              aria-label={`Ampliar foto de ${f.nombre}`}
              onClick={() => setVisor({ lista, i })}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setVisor({ lista, i });
                }
              }}
            >
              <img
                src={urlFoto(f.public_id, 480)}
                width={f.ancho}
                height={f.alto}
                alt={`Foto de ${f.nombre}`}
                loading="lazy"
                decoding="async"
              />
              <figcaption className="cap">
                <span className="cap-texto">
                  <span>{f.nombre}</span>
                  {f.mensaje && <span className="cap-mensaje">“{f.mensaje}”</span>}
                </span>
                <BotonCorazon foto={f} onClick={() => corazon(f.id)} />
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        estado === "listo" && (
          <div className="empty">
            <h3>Aún no hay fotos</h3>
            <p>La primera la pones tú. Ve a Subir y comparte lo que estás viendo.</p>
            <Link className="btn ghost small" href="/album">
              Subir una foto
            </Link>
          </div>
        )
      )}

      {visor && (
        <Visor
          lista={visor.lista.map((v) => fotos.find((f) => f.id === v.id) ?? v)}
          inicio={visor.i}
          onCerrar={() => setVisor(null)}
          onCorazon={corazon}
        />
      )}
      {proyector && (
        <Proyector
          fotos={fotos.filter(esVisible)}
          prioridad={prioridad}
          senalNueva={senalNueva}
          onSalir={salirProyector}
        />
      )}
      {toast}
    </section>
  );
}

function BotonCorazon({ foto, onClick, className = "heart" }: { foto: Foto; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      className={className}
      aria-pressed={foto.mi_corazon}
      aria-label={`Me encanta (${foto.corazones})`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <IconoCorazon />
      <span>{foto.corazones}</span>
    </button>
  );
}

/* ───────────── visor ───────────── */

function Visor({
  lista,
  inicio,
  onCerrar,
  onCorazon,
}: {
  lista: Foto[];
  inicio: number;
  onCerrar: () => void;
  onCorazon: (id: string) => void;
}) {
  const dlg = useRef<HTMLDialogElement>(null);
  const [i, setI] = useState(inicio);
  const n = lista.length;
  const f = lista[Math.min(i, n - 1)];
  const idVisto = f?.id;
  useEffect(() => {
    if (idVisto) marcarVistas([idVisto]);
  }, [idVisto]);
  const paso = useCallback((d: number) => setI((x) => (x + d + n) % n), [n]);

  useEffect(() => {
    const d = dlg.current;
    if (d && !d.open) d.showModal();
  }, []);

  if (!f) return null;
  return (
    <dialog
      ref={dlg}
      className="viewer"
      aria-label="Foto ampliada"
      onClose={onCerrar}
      onClick={(e) => e.target === dlg.current && dlg.current?.close()}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") paso(-1);
        if (e.key === "ArrowRight") paso(1);
      }}
    >
      <div className="v-wrap">
        <div className="v-top">
          <div className="v-cap">
            <strong>{f.nombre}</strong>
            {f.mensaje && <div className="v-mensaje">“{f.mensaje}”</div>}
            <div>{[etiquetaMomento(f.momento), f.reto].filter(Boolean).join(" · ")}</div>
          </div>
          <button className="v-btn" type="button" onClick={() => dlg.current?.close()}>
            Cerrar
          </button>
        </div>
        <div className="v-img">
          {n > 1 && (
            <button className="v-nav prev" type="button" aria-label="Foto anterior" onClick={() => paso(-1)}>
              ‹
            </button>
          )}
          <img src={urlFoto(f.public_id, 1600)} alt={`Foto de ${f.nombre}`} />
          {n > 1 && (
            <button className="v-nav next" type="button" aria-label="Foto siguiente" onClick={() => paso(1)}>
              ›
            </button>
          )}
        </div>
        <div className="v-bot">
          <BotonCorazon foto={f} className="v-btn heart" onClick={() => onCorazon(f.id)} />
        </div>
      </div>
    </dialog>
  );
}

/* ───────────── proyector ───────────── */

function Proyector({
  fotos,
  prioridad,
  senalNueva,
  onSalir,
}: {
  fotos: Foto[];
  prioridad: React.RefObject<Foto[]>;
  senalNueva: number;
  onSalir: () => void;
}) {
  const [actual, setActual] = useState<{ foto: Foto; nueva: boolean } | null>(null);
  const idx = useRef(0);
  const fotosRef = useRef(fotos);
  useEffect(() => {
    fotosRef.current = fotos;
  });

  const idxSinVotos = useRef(0);
  const siguiente = useCallback(() => {
    // Orden "lo más querido ahora" (lib/ranking.ts).
    const visibles = queridasAhora(fotosRef.current, Date.now());
    const ids = new Set(visibles.map((f) => f.id));
    // Las recién llegadas pasan primero (si no las ocultaron mientras tanto).
    let p = prioridad.current.shift();
    while (p && !ids.has(p.id)) p = prioridad.current.shift();
    if (p) return setActual({ foto: p, nueva: true });
    if (!visibles.length) return setActual(null);
    // 1 de cada 3: una foto sin corazones todavía, para que lo nuevo también se vea.
    const sinVotos = visibles.filter((f) => f.corazones === 0);
    const turno = idx.current++;
    if (turno % 3 === 2 && sinVotos.length) {
      setActual({ foto: sinVotos[idxSinVotos.current++ % sinVotos.length], nueva: false });
    } else {
      setActual({ foto: visibles[(turno - Math.floor(turno / 3)) % visibles.length], nueva: false });
    }
  }, [prioridad]);

  // Rotación; se reinicia cada vez que llega una foto nueva para mostrarla ya.
  useEffect(() => {
    queueMicrotask(siguiente);
    const t = setInterval(siguiente, ROTACION_MS);
    return () => clearInterval(t);
  }, [siguiente, senalNueva]);

  // Pantalla completa + mantener la pantalla encendida.
  useEffect(() => {
    let wake: WakeLockSentinel | null = null;
    document.documentElement.requestFullscreen?.().catch(() => {});
    navigator.wakeLock
      ?.request("screen")
      .then((w) => (wake = w))
      .catch(() => {});
    const alSalirPantalla = () => !document.fullscreenElement && onSalir();
    const alTecla = (e: KeyboardEvent) => e.key === "Escape" && onSalir();
    document.addEventListener("fullscreenchange", alSalirPantalla);
    document.addEventListener("keydown", alTecla);
    return () => {
      document.removeEventListener("fullscreenchange", alSalirPantalla);
      document.removeEventListener("keydown", alTecla);
      wake?.release().catch(() => {});
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [onSalir]);

  const f = actual?.foto;
  const idProyectado = f?.id;
  useEffect(() => {
    if (idProyectado) marcarVistas([idProyectado]);
  }, [idProyectado]);
  return (
    <div className="proj">
      <button className="proj-x" type="button" onClick={onSalir}>
        Salir
      </button>
      <div className="proj-stage">
        {f ? (
          <img key={f.id} src={urlFoto(f.public_id, 1600)} alt={`Foto de ${f.nombre}`} />
        ) : (
          <div className="proj-empty">Las fotos de la fiesta aparecerán aquí</div>
        )}
      </div>
      <div className="proj-foot">
        <div>
          <div className="proj-name">
            {f?.nombre}
            {actual?.nueva && <span className="proj-new">Nueva</span>}
          </div>
          <div className="proj-meta">{f ? [etiquetaMomento(f.momento), f.reto].filter(Boolean).join(" · ") : ""}</div>
          {f?.mensaje && <div className="proj-mensaje">“{f.mensaje}”</div>}
        </div>
        <div className="proj-meta">
          {NOVIOS.a} y {NOVIOS.b}
        </div>
      </div>
    </div>
  );
}
