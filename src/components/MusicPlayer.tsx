"use client";

import { useRef, useState } from "react";

type Props = {
  src?: string;
};

export default function MusicPlayer({ src }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  function toggle() {
    const audio = audioRef.current;
    if (audio && audio.currentSrc) {
      if (audio.paused) audio.play().catch(() => {});
      else audio.pause();
    } else {
      // No hay canción cargada todavía: solo previsualiza el estado animado.
      setIsPlaying((p) => !p);
    }
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    const bar = barRef.current;
    if (!audio || !bar || !audio.duration) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * audio.duration;
  }

  return (
    <section className="playerSection">
      <p className="cue">
        Clic en el reproductor para escuchar
        <br />
        nuestra canción
      </p>
      <audio
        ref={audioRef}
        src={src}
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setProgress(0);
        }}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          if (a.duration) setProgress((a.currentTime / a.duration) * 100);
        }}
      />
      <div className={`playerWrap${isPlaying ? " isPlaying" : ""}`}>
        <div className="player">
          <button className="playerBtn" type="button" aria-label="aleatorio">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
              <path d="M4 6h4l9 12h3M4 18h4l3-4M16 6h4M17 4l3 2-3 2" />
            </svg>
          </button>
          <button className="playerBtn" type="button" aria-label="anterior">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zM19 6 9 12l10 6z" />
            </svg>
          </button>
          <button
            className="playerBtn playerBtnMain"
            type="button"
            aria-label={isPlaying ? "pausar" : "reproducir"}
            onClick={toggle}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button className="playerBtn" type="button" aria-label="siguiente">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 6h-2v12h2zM5 6l10 6-10 6z" />
            </svg>
          </button>
          <button className="playerBtn" type="button" aria-label="repetir">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
              <path d="M4 12a8 8 0 0 1 8-8h6M20 12a8 8 0 0 1-8 8H6" />
              <path d="M15 1l3 3-3 3M9 23l-3-3 3-3" />
            </svg>
          </button>
        </div>
        <div className="playerEq" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="playerBar" ref={barRef} onClick={handleSeek}>
          <span style={{ width: `${progress}%` }} />
          <i className="playerBarDot" style={{ left: `${progress}%` }} />
        </div>
      </div>
    </section>
  );
}
