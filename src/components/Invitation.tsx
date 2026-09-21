"use client";

import { useEffect, useRef, useState } from "react";
import Petals from "./Petals";
import Flower3D from "./Flower3D";
import Countdown from "./Countdown";
import MusicPlayer from "./MusicPlayer";
import RsvpForm from "./RsvpForm";

type Phase = "cerrado" | "abierto" | "sube" | "sale" | "oculto";

const WHATSAPP_HREF =
  "https://wa.me/593000000000?text=" +
  encodeURIComponent("¡Hola! Confirmamos nuestra asistencia a la boda de Karina & Guillermo 💙");

export default function Invitation() {
  const [phase, setPhase] = useState<Phase>("cerrado");
  const [visible, setVisible] = useState(false);
  const openedRef = useRef(false);

  useEffect(() => {
    document.documentElement.classList.add("bloqueado");
    return () => document.documentElement.classList.remove("bloqueado");
  }, []);

  function abrir() {
    if (openedRef.current) return;
    openedRef.current = true;

    const reducido =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    setPhase("abierto");
    const t1 = setTimeout(() => setPhase("sube"), reducido ? 0 : 750);
    const t2 = setTimeout(() => {
      setPhase("sale");
      document.documentElement.classList.remove("bloqueado");
      window.scrollTo(0, 0);
      setVisible(true);
    }, reducido ? 200 : 2000);
    const t3 = setTimeout(() => setPhase("oculto"), reducido ? 600 : 3300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }

  const stageClass = [
    "stage",
    "grano",
    phase === "abierto" || phase === "sube" || phase === "sale" || phase === "oculto"
      ? "abierto"
      : "",
    phase === "sube" || phase === "sale" || phase === "oculto" ? "sube" : "",
    phase === "sale" || phase === "oculto" ? "sale" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <Petals />

      {/* ============ SOBRE — primera impresión ============ */}
      {phase !== "oculto" && (
        <div
          className={stageClass}
          role="dialog"
          aria-label="Invitación de boda de Karina y Guillermo"
        >
          <div className="intro">
            <b>Karina &amp; Guillermo</b>
            <span>te invitan a su boda</span>
          </div>
          <div className="sobreWrap">
            <div className="env" onClick={abrir}>
              <div className="envBack" />
              <div className="card grano">
                <img className="flor" src="/images/jazmin-rama.png" alt="" />
                <div className="n">
                  Karina <i>&amp;</i> Guillermo
                </div>
                <div className="f">11 · 07 · 2026</div>
              </div>
              <div className="pocket" />
              <div className="flap" />
              <div className="sello" aria-hidden="true">
                K&amp;G
              </div>
              <div className="envFlores" aria-hidden="true">
                <img src="/images/jazmin-esquina.png" alt="" />
              </div>
            </div>
          </div>
          <button className="abrir" type="button" onClick={abrir}>
            Abrir invitación
          </button>
        </div>
      )}

      {/* ============ INVITACIÓN ============ */}
      <main className={`invite${visible ? " visible" : ""}`} inert={!visible || undefined}>
        <header className="hero grano">
          <div className="arcoMarco rev" style={{ "--d": ".2s" } as React.CSSProperties}>
            <div className="arco">
              <img src="/images/pareja.jpg" alt="Karina y Guillermo" style={{ objectPosition: "center 20%" }} />
            </div>
          </div>
          <p className="casamos rev" style={{ "--d": ".5s" } as React.CSSProperties}>
            ¡Nos casamos!
          </p>
          <h1 className="rev" style={{ "--d": ".7s" } as React.CSSProperties}>
            Karina <span>&amp;</span> Guillermo
          </h1>
          <p className="cuando rev" style={{ "--d": ".9s" } as React.CSSProperties}>
            sábado 11 de julio de 2026
          </p>
        </header>
        <div className="festones" style={{ backgroundColor: "var(--cream)", marginTop: "-1px" }} aria-hidden="true" />

        <Flower3D />

        <section className="cartas cream">
          <img className="flor a" src="/images/rosas-lazo.png" alt="" />
          <p className="quote">
            &ldquo;Hay momentos que permanecen para siempre en el corazón, y el nuestro ha
            llegado. Después de recorrer caminos que nos llevaron a encontrarnos, hemos decidido
            unir nuestras vidas y celebrar, ante Dios y junto a quienes más amamos, el inicio de
            nuestra nueva historia.&rdquo;
          </p>
          <p>
            Con la bendición de Dios
            <br />
            y de nuestros padres:
          </p>
          <p>
            <span className="rol">Padres de la novia</span>
            <span className="nom">Domingo Ramos Castro</span>
            <span className="nom">Narcisa Guevara Farias ✝</span>
          </p>
          <p>
            <span className="rol">Padres del novio</span>
            <span className="nom">Ruperto Yun Hon Moran</span>
            <span className="nom">Diana Sacoto Hidalgo</span>
          </p>
          <p className="honor">Tenemos el honor de invitarte a celebrar nuestra unión en matrimonio</p>
          <div className="diaSem" style={{ marginTop: "26px" }}>
            sábado
          </div>
          <div className="diaGrande">
            <span className="mes">julio</span>
            <span className="num">11</span>
            <span className="anio">2026</span>
          </div>
        </section>

        <Countdown />

        <MusicPlayer />

        <div className="lugarFoto" role="img" aria-label="Karina y Guillermo sonriendo">
          <img src="/images/pareja.jpg" alt="" style={{ objectPosition: "22% 30%" }} />
        </div>
        <section className="lugar">
          <div className="hora">5:00 pm</div>
          <h2>Ceremonia</h2>
          <p className="sitio">Iglesia San José</p>
          <p className="dir">Quevedo, Ecuador</p>
          <a
            className="btn"
            href="https://www.google.com/maps/search/?api=1&query=Iglesia+San+Jose+Quevedo"
            target="_blank"
            rel="noopener"
          >
            Ver ubicación
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" />
              <circle cx="12" cy="9" r="2.4" />
            </svg>
          </a>
        </section>
        <div className="festones cielo" style={{ backgroundColor: "var(--terra)" }} aria-hidden="true" />

        <section className="lugar claro">
          <div className="hora">6:00 pm</div>
          <h2>Recepción</h2>
          <p className="sitio">San Camilo</p>
          <p className="dir">El patio de las Hadas</p>
          <a
            className="btn oscuro"
            href="https://www.google.com/maps/search/?api=1&query=San+Camilo+El+Patio+de+las+Hadas"
            target="_blank"
            rel="noopener"
          >
            Ver ubicación
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" />
              <circle cx="12" cy="9" r="2.4" />
            </svg>
          </a>
        </section>

        <div className="festones sandy" style={{ backgroundColor: "var(--sand)" }} aria-hidden="true" />
        <section className="arena">
          <img className="florArena" src="/images/azaleas.png" alt="" aria-hidden="true" />
          <div className="bloque">
            <h2 className="titulo">No Niños</h2>
            <p>
              Con mucho cariño, esperamos compartir con ustedes una noche inolvidable en una
              celebración para adultos. Su compañía hará este día aún más especial.
            </p>
          </div>
          <div className="bloque">
            <h2 className="titulo">Dress Code</h2>
            <p className="sub">Formal</p>
            <div className="trajes" aria-hidden="true">
              <svg viewBox="0 0 320 220" fill="none" stroke="var(--terra-deep)" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M110 30c-4 8-8 14-8 24 0 8 5 12 5 20l-14 106c-1 8 4 14 12 14h40c8 0 13-6 12-14l-14-106c0-8 5-12 5-20 0-10-4-16-8-24" />
                <path d="M96 60c-4 6-2 14 4 16M124 60c4 6 2 14-4 16" />
              </svg>
              <svg viewBox="0 0 320 220" fill="none" stroke="var(--terra-deep)" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M210 34h44l10 14-14 8-4-10v96l6 44h-44l6-44V46l-4 10-14-8Z" />
                <path d="M226 34l6 10 6-10" />
                <circle cx="216" cy="70" r="1.6" fill="var(--terra-deep)" />
                <circle cx="216" cy="90" r="1.6" fill="var(--terra-deep)" />
                <circle cx="216" cy="110" r="1.6" fill="var(--terra-deep)" />
              </svg>
            </div>
          </div>
        </section>

        <section className="arena p2">
          <div className="bloque">
            <h2 className="titulo">Evitar</h2>
            <p>Con cariño, les pedimos no vestir de blanco y de los tonos de nuestra paleta de boda.</p>
            <div className="swatches">
              <span style={{ background: "#a7c0dc" }} />
              <span style={{ background: "#fff" }} />
              <span style={{ background: "#efe6d3" }} />
              <span style={{ background: "#a33f37" }} />
            </div>
            <p style={{ fontStyle: "italic", color: "var(--terra-deep)", fontSize: "15px" }}>
              ¡Gracias por ser parte de nuestro gran día!
            </p>
          </div>
          <div className="bloque">
            <h2 className="titulo">Lluvia de sobres</h2>
            <div className="ticket">
              <b>Su presencia es nuestro mejor regalo.</b>
              <br />
              Si desean acompañar sus buenos deseos con un detalle, les agradecemos hacerlo mediante
              sobre cerrado.
            </div>
          </div>
        </section>

        <div className="festones" style={{ backgroundColor: "var(--sand)" }} aria-hidden="true" />
        <section className="rsvp">
          <img className="florRsvp" src="/images/rosas-spray.png" alt="" aria-hidden="true" />
          <h2 className="titulo">Confirmar Asistencia</h2>
          <p>
            Con gran ilusión deseamos compartirles este momento único. Confirmá tu asistencia con
            el formulario, o escribinos directo por WhatsApp.
          </p>
          <RsvpForm />
          <div className="botones">
            <a className="btn" href={WHATSAPP_HREF} target="_blank" rel="noopener">
              Confirmar por WhatsApp
            </a>
          </div>
          <p className="deadline">Hasta el 1 de julio</p>
        </section>

        <div className="cierre" role="img" aria-label="Karina y Guillermo al atardecer">
          <img src="/images/pareja.jpg" alt="" style={{ objectPosition: "center 25%" }} />
          <p className="fin">Esperamos contar con su presencia</p>
          <p className="gracias">Muchas gracias</p>
          <p className="mono">K &amp; G</p>
        </div>
      </main>
    </>
  );
}
