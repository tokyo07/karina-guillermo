import { getSupabase } from "@/lib/supabase";

type RsvpPayload = {
  nombre?: unknown;
  asiste?: unknown;
  acompanantes?: unknown;
  mensaje?: unknown;
};

export async function POST(request: Request) {
  let body: RsvpPayload;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
  const asiste = body.asiste === true || body.asiste === "true";
  const acompanantesRaw = Number(body.acompanantes);
  const acompanantes = Number.isFinite(acompanantesRaw)
    ? Math.max(0, Math.min(20, Math.trunc(acompanantesRaw)))
    : 0;
  const mensaje = typeof body.mensaje === "string" ? body.mensaje.trim().slice(0, 500) : null;

  if (!nombre) {
    return Response.json({ error: "Contanos tu nombre." }, { status: 400 });
  }
  if (nombre.length > 120) {
    return Response.json({ error: "El nombre es demasiado largo." }, { status: 400 });
  }

  try {
    const { error } = await getSupabase()
      .from("rsvps")
      .insert({ nombre, asiste, acompanantes, mensaje });
    if (error) throw error;
  } catch (err) {
    console.error("Error guardando RSVP:", err);
    return Response.json(
      { error: "No se pudo guardar la confirmación. Probá de nuevo en un momento." },
      { status: 500 }
    );
  }

  return Response.json({ ok: true });
}
