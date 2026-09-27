export default function PinnedHero() {
  return (
    <div className="pinHero">
      <div className="pinHero__stage">
        <div className="pinHero__media">
          <img
            src="/images/hero.jpg"
            alt="Karina y Guillermo"
            style={{ objectPosition: "center 30%" }}
          />
          <div className="pinHero__scrim" />
        </div>
        <div className="pinHero__content">
          <p className="casamos">¡Nos casamos!</p>
          <h1>
            Karina <span>&amp;</span> Guillermo
          </h1>
          <p className="cuando">sábado 19 de diciembre de 2026</p>
        </div>
        <div className="pinHero__hint" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}
