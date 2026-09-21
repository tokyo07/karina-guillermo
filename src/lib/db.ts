import { Pool } from "pg";

declare global {
  var _pgPool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "Falta la variable de entorno DATABASE_URL. Copiá .env.example a .env.local y completá la conexión a tu Postgres."
    );
  }
  return new Pool({
    connectionString,
    ssl: connectionString.includes("sslmode=disable")
      ? false
      : { rejectUnauthorized: false },
  });
}

// Lazy singleton: no toca DATABASE_URL hasta que alguien realmente consulta,
// así el build no falla si todavía no configuraste la base de datos.
export function getPool(): Pool {
  if (!globalThis._pgPool) {
    globalThis._pgPool = createPool();
  }
  return globalThis._pgPool;
}
