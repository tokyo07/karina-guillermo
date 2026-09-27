"use client";

import { useEffect, useRef, useState } from "react";
import Petals from "./Petals";
import Flower3D from "./Flower3D";
import Countdown from "./Countdown";
import MusicPlayer from "./MusicPlayer";
import RsvpForm from "./RsvpForm";
import PinnedHero from "./PinnedHero";
import Reveal from "./Reveal";

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
                <div className="f">19 · 12 · 2026</div>
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
        <PinnedHero />
        <div className="festones" style={{ backgroundColor: "var(--cream)", marginTop: "-1px" }} aria-hidden="true" />

        <Reveal>
          <Flower3D />
        </Reveal>

        <section className="cartas cream">
          <img className="flor a" src="/images/rosas-lazo.png" alt="" />
          <Reveal>
            <p className="quote">
              Por mucho tiempo soñamos con este momento, y hoy decidimos dar el paso más
              importante de nuestras vidas: unir nuestros caminos y recibir la bendición de Dios
              para siempre.
            </p>
            <p className="quote">
              Lo que un día comenzó con una mirada, hoy se convierte en una vida juntos y en el
              comienzo de nuestra propia historia.
            </p>
            <p className="quote">
              Con el corazón lleno de amor y gratitud, tenemos la dicha de compartir con ustedes
              la fecha en que celebraremos este momento tan importante para nuestras vidas.
            </p>
            <p className="honor">Para la gloria de Dios.</p>
          </Reveal>
          <Reveal delay={0.1}>
            <p>
              Con la bendición de Dios
              <br />
              y de nuestros padres:
            </p>
            <p>
              <span className="rol">Padres de la novia</span>
              <span className="nom">Damián Carriel Arias</span>
              <span className="nom">Juana Porro Cedeño</span>
            </p>
            <p>
              <span className="rol">Padres del novio</span>
              <span className="nom">Juana Emperatriz Luna Plaza</span>
              <span className="nom">Guillermo José Pacheco Díaz</span>
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="diaSem" style={{ marginTop: "26px" }}>
              sábado
            </div>
            <div className="diaGrande">
              <span className="mes">diciembre</span>
              <span className="num">19</span>
              <span className="anio">2026</span>
            </div>
          </Reveal>
        </section>

        <Reveal>
          <Countdown />
        </Reveal>

        <Reveal>
          <MusicPlayer songTitle="Qué suerte tenerte" />
        </Reveal>

        <div className="lugarFoto" role="img" aria-label="Karina y Guillermo sonriendo">
          <img src="/images/pareja.jpg" alt="" style={{ objectPosition: "22% 30%" }} />
        </div>
        <section className="lugar">
          <Reveal>
            <div className="hora">5:00 pm</div>
            <h2>Ceremonia</h2>
            <p className="sitio">Iglesia Católica San Alberto Magno</p>
            <p className="dir">Sector La Joya</p>
            <a
              className="btn"
              href="https://maps.app.goo.gl/xE6HfJ8jiwQL23tq8?g_st=iwb"
              target="_blank"
              rel="noopener"
            >
              Ver ubicación
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" />
                <circle cx="12" cy="9" r="2.4" />
              </svg>
            </a>
          </Reveal>
        </section>
        <div className="festones cielo" style={{ backgroundColor: "var(--terra)" }} aria-hidden="true" />

        <section className="lugar claro">
          <Reveal>
            <div className="hora">7:00 pm</div>
            <h2>Recepción</h2>
            <p className="sitio">Altaría Eventos</p>
            <a
              className="btn oscuro"
              href="https://maps.app.goo.gl/KuWgkAvbLbSDoR2q9?g_st=iwb"
              target="_blank"
              rel="noopener"
            >
              Ver ubicación
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" />
                <circle cx="12" cy="9" r="2.4" />
              </svg>
            </a>
          </Reveal>
        </section>

        <div className="festones sandy" style={{ backgroundColor: "var(--sand)" }} aria-hidden="true" />
        <section className="arena">
          <img className="florArena" src="/images/azaleas.png" alt="" aria-hidden="true" />
          <Reveal>
            <div className="bloque bloque--sutil">
              <h2 className="titulo titulo--sutil">No Niños</h2>
              <p>
                Con mucho cariño, esperamos compartir con ustedes una noche inolvidable en una
                celebración para adultos. Su compañía hará este día aún más especial.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
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
          </Reveal>
        </section>

        <section className="arena p2">
          <Reveal>
            <div className="bloque">
              <h2 className="titulo">Tonos a evitar</h2>
              <p>Con cariño, les pedimos no vestir de blanco ni de los tonos de nuestra paleta de boda el día de la ceremonia.</p>
              <div className="swatches">
                <span className="swatch">
                  <i style={{ background: "#ffffff", border: "1px solid #e2ddcf" }} />
                  <b>Blanco</b>
                </span>
                <span className="swatch">
                  <i style={{ background: "#a94b24" }} />
                  <b>Terracota</b>
                </span>
                <span className="swatch">
                  <i style={{ background: "#d97a2e" }} />
                  <b>Naranja</b>
                </span>
                <span className="swatch">
                  <i style={{ background: "#d3bfa0" }} />
                  <b>Beige</b>
                </span>
              </div>
              <p style={{ fontStyle: "italic", color: "var(--terra-deep)", fontSize: "15px" }}>
                ¡Gracias por ser parte de nuestro gran día!
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="bloque">
              <h2 className="titulo">Lluvia de sobres</h2>
              <div className="ticket">
                <b>Su presencia es nuestro mejor regalo.</b>
                <br />
                Si desean acompañar sus buenos deseos con un detalle, les agradecemos hacerlo
                mediante sobre cerrado.
              </div>
            </div>
          </Reveal>
        </section>

        <div className="festones" style={{ backgroundColor: "var(--sand)" }} aria-hidden="true" />
        <section className="rsvp">
          <img className="florRsvp" src="/images/rosas-spray.png" alt="" aria-hidden="true" />
          <Reveal>
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
            <p className="deadline">Hasta el 5 de diciembre</p>
          </Reveal>
        </section>

        <div className="cierre" role="img" aria-label="Karina y Guillermo al atardecer">
          <img src="/images/pareja.jpg" alt="" style={{ objectPosition: "center 25%" }} />
          <Reveal>
            <p className="fin">Esperamos contar con su presencia</p>
            <p className="gracias">Muchas gracias</p>
            <p className="mono">K &amp; G</p>
          </Reveal>
        </div>
      </main>
    </>
  );
}
