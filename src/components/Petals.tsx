"use client";

import { useEffect, useRef } from "react";

const PETAL_PATH = "M12 2c4 3 4 9 0 12-4-3-4-9 0-12Z";
const SVG_NS = "http://www.w3.org/2000/svg";

export default function Petals() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const max = 14;
    let count = 0;
    let stopped = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    function spawn() {
      if (stopped || count >= max || !layer) return;
      count++;
      const petal = document.createElementNS(SVG_NS, "svg");
      petal.setAttribute("viewBox", "0 0 24 24");
      petal.classList.add("petal");
      if (Math.random() > 0.5) petal.classList.add("isTerra");
      const scale = 0.6 + Math.random() * 0.9;
      const left = Math.random() * 100;
      const duration = 10 + Math.random() * 9;
      petal.style.left = left + "%";
      petal.style.width = 15 * scale + "px";
      petal.style.animationDuration = duration + "s";
      petal.style.setProperty("--drift", Math.random() * 90 - 45 + "px");
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", PETAL_PATH);
      petal.appendChild(path);
      layer.appendChild(petal);
      petal.addEventListener("animationend", () => {
        petal.remove();
        count--;
      });
    }

    for (let i = 0; i < 6; i++) {
      timeouts.push(setTimeout(spawn, i * 850));
    }
    const interval = setInterval(() => {
      if (count < max) spawn();
    }, 1300);

    return () => {
      stopped = true;
      timeouts.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, []);

  return <div className="petalsLayer" ref={layerRef} aria-hidden="true" />;
}
