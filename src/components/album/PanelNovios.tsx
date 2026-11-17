"use client";

import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import {
  MOMENTOS,
  NOVIOS,
  etiquetaMomento,
  guardarArchivo,
  nombreArchivo,
  urlFoto,
  useFotos,
  type Foto,
  type Momento,
} from "@/lib/album";
import { useMomento } from "./Ambiente";
import { AvisoEstado, useToast } from "./Comun";

type Acceso = "verificando" | "fuera" | "no_novio" | "novio" | "sin_configurar";

export default function PanelNovios() {
  const [acceso, setAcceso] = useState<Acceso>("verificando");
  const [sesion, setSesion] = useState<Session | null>(null);

  useEffect(() => {
    let sb: ReturnType<typeof getSupabase>;
    try {
      sb = getSupabase();
    } catch {
      queueMicrotask(() => setAcceso("sin_configurar"));
      return;
    }
    const revisar = async (s: Session | null) => {
      setSesion(s);
      if (!s) return setAcceso("fuera");
      const { data, error } = await sb.rpc("es_novio");
      setAcceso(!error && data ? "novio" : "no_novio");
    };
    sb.auth.getSession().then(({ data }) => revisar(data.session));
    const { data } = sb.auth.onAuthStateChange((_e, s) => {
      // Fuera del callback: supabase-js no admite llamadas encadenadas dentro.
      setTimeout(() => revisar(s), 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const salir = () => getSupabase().auth.signOut();

  return (
    <section className="pg">
      <div className="head">
        <div>
          <h2>Panel de los novios</h2>
          <p>Código QR, moderación y descarga de todas las fotos.</p>
        </div>
      </div>
      {acceso === "sin_configurar" && <AvisoEstado estado="sin_configurar" />}
      {acceso === "verificando" && <p className="hint">Verificando sesión…</p>}
      {acceso === "fuera" && <Login />}
      {acceso === "no_novio" && (
        <div className="empty">
          <h3>Solo para los novios</h3>
          <p>La cuenta {sesion?.user.email} no administra este álbum.</p>
          <button className="btn ghost small" type="button" onClick={salir}>
            Cerrar sesión
          </button>
        </div>
      )}
      {acceso === "novio" && <Panel email={sesion?.user.email ?? ""} onSalir={salir} />}
    </section>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError("");
    const { error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password: clave });
    setEnviando(false);
    if (error) setError("Correo o contraseña incorrectos.");
  }

  return (
    <form className="card login" onSubmit={entrar}>
      <label className="field">
        <span>Correo</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
      </label>
      <label className="field">
        <span>Contraseña</span>
        <input
          type="password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      <button className="btn" type="submit" disabled={enviando}>
        {enviando ? "Entrando…" : "Entrar"}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}

function Panel({ email, onSalir }: { email: string; onSalir: () => void }) {
  const { fotos, estado, setFotos } = useFotos();
  const [toast, avisar] = useToast();
  const visibles = fotos.filter((f) => !f.oculta);

  const invitados = new Map<string, number>();
  visibles.forEach((f) => invitados.set(f.nombre, (invitados.get(f.nombre) ?? 0) + 1));
  const corazones = visibles.reduce((a, f) => a + f.corazones, 0);
  const top = [...invitados.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  async function alternarOculta(f: Foto) {
    const oculta = !f.oculta;
    setFotos((prev) => prev.map((x) => (x.id === f.id ? { ...x, oculta } : x)));
    const { error } = await getSupabase().from("fotos").update({ oculta }).eq("id", f.id);
    if (error) {
      setFotos((prev) => prev.map((x) => (x.id === f.id ? { ...x, oculta: f.oculta } : x)));
      avisar("No se pudo cambiar. Revisa tu conexión.");
    }
  }

  return (
    <>
      <AvisoEstado estado={estado} />
      <div className="sesion">
        <span>Sesión: {email}</span>
        <button className="btn ghost small" type="button" onClick={onSalir}>
          Cerrar sesión
        </button>
      </div>
      <MomentoActual avisar={avisar} />
      <div className="stats">
        {(
          [
            [visibles.length, "fotos"],
            [invitados.size, "invitados"],
            [corazones, "corazones"],
          ] as const
        ).map(([n, l]) => (
          <div className="stat" key={l}>
            <b>{n}</b>
            <span>{l}</span>
          </div>
        ))}
      </div>
      <div className="grid2">
        <div className="panel">
          <h3>Código QR</h3>
          <p>Imprímelo en las mesas o proyéctalo en la entrada. Lleva directo a Subir.</p>
          <TarjetaQR avisar={avisar} />
        </div>
        <div className="panel">
          <h3>Llévate los recuerdos</h3>
          <p>Descarga todas las fotos visibles en un solo archivo .zip, en su tamaño original.</p>
          <DescargaZip fotos={visibles} avisar={avisar} />
          <h3 style={{ marginTop: 26 }}>Invitados más activos</h3>
          <ol className="top">
            {top.length ? (
              top.map(([n, c]) => (
                <li key={n}>
                  {n}: {c} {c === 1 ? "foto" : "fotos"}
                </li>
              ))
            ) : (
              <li>Todavía nadie ha subido fotos.</li>
            )}
          </ol>
        </div>
      </div>
      <div className="panel" style={{ marginTop: 22 }}>
        <h3>Moderación</h3>
        <p>Oculta cualquier foto y deja de mostrarse en el álbum y el proyector. No se borra.</p>
        <div className="mod">
          {fotos.map((f) => (
            <figure key={f.id} className={f.oculta ? "off" : ""}>
              <img src={urlFoto(f.public_id, 480)} alt={`Foto de ${f.nombre}`} loading="lazy" decoding="async" />
              <button type="button" onClick={() => alternarOculta(f)}>
                {f.oculta ? "Mostrar" : "Ocultar"}
              </button>
            </figure>
          ))}
        </div>
      </div>
      {toast}
    </>
  );
}

/** Cambia el ambiente de todos los teléfonos: colores, retos y momento propuesto al subir. */
function MomentoActual({ avisar }: { avisar: (m: string) => void }) {
  const { momento, aplicar } = useMomento();
  const [enviando, setEnviando] = useState<Momento | null>(null);

  async function fijar(m: Momento) {
    if (m === momento || enviando) return;
    setEnviando(m);
    const { error } = await getSupabase().rpc("fijar_momento", { p_momento: m });
    setEnviando(null);
    if (error) return avisar("No se pudo cambiar el momento. Revisa tu conexión.");
    aplicar(m);
    avisar(`Ahora: ${etiquetaMomento(m)}. Los teléfonos cambian en unos segundos.`);
  }

  return (
    <div className="panel momento-panel">
      <h3>¿Qué se vive ahora?</h3>
      <p>Cambia el ambiente del álbum en todos los teléfonos: colores, retos y el momento de las fotos nuevas.</p>
      <div className="chips" role="group" aria-label="Momento actual de la boda">
        {MOMENTOS.map((m) => (
          <button
            key={m.id}
            type="button"
            className="chip"
            aria-pressed={momento === m.id}
            disabled={enviando !== null}
            onClick={() => fijar(m.id)}
          >
            {enviando === m.id ? "Cambiando…" : m.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TarjetaQR({ avisar }: { avisar: (m: string) => void }) {
  const [url, setUrl] = useState("");
  const lienzo = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    queueMicrotask(() => setUrl(`${location.origin}/album`));
  }, []);

  useEffect(() => {
    if (!url || !lienzo.current) return;
    let cancelado = false;
    import("qrcode").then(({ default: QR }) => {
      if (cancelado || !lienzo.current) return;
      QR.toCanvas(lienzo.current, url, {
        width: 220,
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#78462fff", light: "#ffffffff" },
      }).catch(() => avisar("No se pudo generar el QR."));
    });
    return () => {
      cancelado = true;
    };
  }, [url, avisar]);

  return (
    <>
      <div className="qr-card">
        <div className="festones" />
        <div className="qr">
          <canvas ref={lienzo} aria-label={`Código QR que abre ${url}`} />
        </div>
        <div className="nm">
          {NOVIOS.a} y {NOVIOS.b}
        </div>
        <div className="tx">Escanea y comparte tu mirada</div>
      </div>
      <label className="field">
        <span>Enlace público del álbum</span>
        <input type="text" value={url} onChange={(e) => setUrl(e.target.value.trim())} spellCheck={false} />
      </label>
      <button
        className="btn ghost small"
        type="button"
        onClick={() =>
          lienzo.current?.toBlob((b) => (b ? guardarArchivo(b, "qr-album-boda.png") : avisar("Genera el QR primero.")))
        }
      >
        Guardar QR como imagen
      </button>
    </>
  );
}

function DescargaZip({ fotos, avisar }: { fotos: Foto[]; avisar: (m: string) => void }) {
  const [estado, setEstado] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function descargar() {
    if (!fotos.length) return avisar("Aún no hay fotos para descargar.");
    setOcupado(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      let ok = 0;
      for (let i = 0; i < fotos.length; i++) {
        setEstado(`Preparando ${i + 1} de ${fotos.length}…`);
        try {
          const r = await fetch(urlFoto(fotos[i].public_id));
          if (!r.ok) throw new Error(String(r.status));
          zip.file(`${String(i + 1).padStart(3, "0")}-${nombreArchivo(fotos[i])}.jpg`, await r.blob());
          ok++;
        } catch {
          /* se informa en el resumen */
        }
      }
      setEstado("Armando el archivo…");
      // Las JPEG ya están comprimidas: STORE evita gastar CPU sin ganar tamaño.
      const out = await zip.generateAsync({ type: "blob", compression: "STORE" });
      guardarArchivo(out, `fotos-boda-${NOVIOS.a}-${NOVIOS.b}.zip`.toLowerCase());
      setEstado(
        ok === fotos.length ? `Listo: ${ok} fotos.` : `Listo: ${ok} de ${fotos.length} fotos (algunas no se pudieron leer).`
      );
    } catch {
      setEstado("");
      avisar("No se pudo armar el .zip.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <>
      <button className="btn" type="button" onClick={descargar} disabled={ocupado}>
        Descargar todo (.zip)
      </button>
      <p className="hint">{estado}</p>
    </>
  );
}
