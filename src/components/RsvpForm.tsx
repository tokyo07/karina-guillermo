"use client";

import { useState } from "react";

type Estado = "idle" | "enviando" | "ok" | "error";

export default function RsvpForm() {
  const [nombre, setNombre] = useState("");
  const [asiste, setAsiste] = useState<boolean | null>(null);
  const [acompanantes, setAcompanantes] = useState("0");
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState<Estado>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || asiste === null) return;
    setEstado("enviando");
    setError("");
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          asiste,
          acompanantes: Number(acompanantes) || 0,
          mensaje,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo enviar.");
      setEstado("ok");
    } catch (err) {
      setEstado("error");
      setError(err instanceof Error ? err.message : "No se pudo enviar.");
    }
  }

  if (estado === "ok") {
    return (
      <p className="rsvpMsg">
        ¡Gracias, {nombre}! Tu confirmación quedó registrada.
      </p>
    );
  }

  return (
    <form className="rsvpForm" onSubmit={onSubmit}>
      <div>
        <label htmlFor="rsvp-nombre">Tu nombre</label>
        <input
          id="rsvp-nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre y apellido"
          required
        />
      </div>

      <div className="asiste">
        <button
          type="button"
          className={asiste === true ? "activo" : ""}
          onClick={() => setAsiste(true)}
        >
          Sí, ahí estaré
        </button>
        <button
          type="button"
          className={asiste === false ? "activo" : ""}
          onClick={() => setAsiste(false)}
        >
          No podré ir
        </button>
      </div>

      <div className="fila">
        <div style={{ flex: 1 }}>
          <label htmlFor="rsvp-acompanantes">Acompañantes</label>
          <input
            id="rsvp-acompanantes"
            type="number"
            min={0}
            max={10}
            value={acompanantes}
            onChange={(e) => setAcompanantes(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="rsvp-mensaje">Mensaje (opcional)</label>
        <textarea
          id="rsvp-mensaje"
          rows={2}
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="Un mensaje para Karina & Guillermo"
        />
      </div>

      <button
        type="submit"
        className="enviar"
        disabled={estado === "enviando" || !nombre.trim() || asiste === null}
      >
        {estado === "enviando" ? "Enviando…" : "Confirmar asistencia"}
      </button>

      {estado === "error" && <p className="rsvpMsg error">{error}</p>}
    </form>
  );
}
