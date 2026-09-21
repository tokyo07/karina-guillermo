"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Flower3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (typeof window === "undefined" || !window.WebGLRenderingContext) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      return;
    }

    const w = canvas.clientWidth || 200;
    const h = canvas.clientHeight || 220;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, w / h, 0.1, 100);
    camera.position.set(0, 0.5, 5.6);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(w, h, false);

    scene.add(new THREE.HemisphereLight(0xfff3e4, 0xcf9a6a, 1.1));
    const dir = new THREE.DirectionalLight(0xfff2df, 1.0);
    dir.position.set(2.2, 3, 4);
    scene.add(dir);

    function petalShape() {
      const s = new THREE.Shape();
      s.moveTo(0, 0);
      s.bezierCurveTo(0.55, 0.15, 0.62, 0.95, 0, 1.5);
      s.bezierCurveTo(-0.62, 0.95, -0.55, 0.15, 0, 0);
      return s;
    }

    const petalGeo = new THREE.ExtrudeGeometry(petalShape(), {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 2,
      curveSegments: 14,
    });
    petalGeo.translate(0, 0, -0.025);
    const pos = petalGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const bend = Math.sin(Math.max(0, Math.min(1, y / 1.5)) * (Math.PI / 2)) * 0.32;
      pos.setZ(i, pos.getZ(i) - bend);
    }
    pos.needsUpdate = true;
    petalGeo.computeVertexNormals();

    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xf1dcc0,
      roughness: 0.7,
      metalness: 0.03,
      side: THREE.DoubleSide,
    });

    const flower = new THREE.Group();
    const petalCount = 6;
    for (let p = 0; p < petalCount; p++) {
      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.rotation.x = Math.PI / 2.55;
      const holder = new THREE.Group();
      holder.add(petal);
      holder.rotation.y = (p / petalCount) * Math.PI * 2;
      flower.add(holder);
    }

    const center = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 20, 20),
      new THREE.MeshStandardMaterial({
        color: 0xa94b24,
        roughness: 0.5,
        metalness: 0.2,
        emissive: 0x5a2410,
        emissiveIntensity: 0.28,
      })
    );
    flower.add(center);

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.06, 2.4, 10),
      new THREE.MeshStandardMaterial({ color: 0x8b987c, roughness: 0.8 })
    );
    stem.position.y = -1.6;
    flower.add(stem);

    flower.rotation.x = 0.18;
    flower.position.y = 0.35;
    scene.add(flower);

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let visible = true;
    let raf = 0;

    const io =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => entries.forEach((entry) => (visible = entry.isIntersecting)),
            { threshold: 0.05 }
          )
        : null;
    io?.observe(canvas);

    function frame() {
      if (visible) {
        if (!reducedMotion) flower.rotation.y += 0.006;
        renderer.render(scene, camera);
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    function handleResize() {
      const w2 = canvas!.clientWidth;
      const h2 = canvas!.clientHeight;
      if (!w2 || !h2) return;
      camera.aspect = w2 / h2;
      camera.updateProjectionMatrix();
      renderer.setSize(w2, h2, false);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
      io?.disconnect();
      petalGeo.dispose();
      petalMat.dispose();
      center.geometry.dispose();
      (center.material as THREE.Material).dispose();
      stem.geometry.dispose();
      (stem.material as THREE.Material).dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="flor3d">
      <canvas ref={canvasRef} />
      <p className="flor3dCaption">un detalle floral, girando solo para ustedes</p>
    </div>
  );
}
