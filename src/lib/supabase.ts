import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let client: ReturnType<typeof createClient<Database>> | null = null;

// Cliente perezoso: no toca las variables de entorno hasta que alguien
// realmente lo usa, así el build no falla si todavía no configuraste Supabase.
export function getSupabase() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Supabase nombra la clave pública de dos formas según dónde se copie:
  // "anon" (clave JWT, nombre clásico) o "publishable" (sb_publishable_…,
  // el que da hoy el botón Connect). Sirve cualquiera de las dos.
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Copiá .env.example a .env.local y completá los valores de tu proyecto Supabase."
    );
  }
  client = createClient<Database>(url, key);
  return client;
}
