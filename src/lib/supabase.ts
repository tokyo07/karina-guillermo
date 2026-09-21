import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let client: ReturnType<typeof createClient<Database>> | null = null;

// Cliente perezoso: no toca las variables de entorno hasta que alguien
// realmente lo usa, así el build no falla si todavía no configuraste Supabase.
export function getSupabase() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Copiá .env.example a .env.local y completá los valores de tu proyecto Supabase."
    );
  }
  client = createClient<Database>(url, key);
  return client;
}
