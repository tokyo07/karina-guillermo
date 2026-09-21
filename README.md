# Invitación de Karina & Guillermo

Invitación de boda hecha con **Next.js 16 (App Router) + React + TypeScript**,
con confirmación de asistencia (RSVP) guardada en **Postgres**.

Empezó como un prototipo estático (un solo HTML) y se portó a esta app real
para poder guardar las confirmaciones en una base de datos propia, en vez de
depender solo de un enlace de WhatsApp.

## Qué incluye

- Sobre animado como primera pantalla ("Abrir invitación") — se abre con un
  flip 3D y revela el resto de la invitación con scroll.
- Flor 3D real (Three.js, generada en código — sin descargar modelos externos).
- Pétalos cayendo de fondo, cuenta regresiva en vivo, reproductor de música.
- Formulario de confirmación de asistencia (`/api/rsvp`) que guarda cada
  respuesta en Postgres (nombre, si asiste, acompañantes, mensaje).
- Botón alternativo para confirmar por WhatsApp.

## Requisitos

- Node.js 20+
- Una base de datos Postgres (Supabase, Neon, Vercel Postgres, o cualquier
  Postgres al que puedas conectarte por `DATABASE_URL`).

## Poner en marcha

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear la tabla de confirmaciones en tu Postgres — corré una sola vez el
   contenido de [`sql/schema.sql`](./sql/schema.sql) contra tu base (por
   `psql`, o pegándolo en el editor SQL de Supabase/Neon):

   ```bash
   psql "$DATABASE_URL" -f sql/schema.sql
   ```

3. Copiar `.env.example` a `.env.local` y completar la conexión real:

   ```bash
   cp .env.example .env.local
   ```

4. Levantar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Abrí [http://localhost:3000](http://localhost:3000).

Sin `DATABASE_URL` configurada, la página se ve y anima igual — solo el botón
"Confirmar asistencia" del formulario va a fallar con un mensaje claro (podés
seguir confirmando por WhatsApp mientras tanto).

## Estructura

```
src/
  app/
    page.tsx           # arma la página con <Invitation />
    layout.tsx          # fuentes (Cormorant Garamond, Great Vibes, Marcellus)
    globals.css          # todo el diseño (paleta terracota, sobre, secciones)
    api/rsvp/route.ts   # POST guarda una confirmación, GET las lista
  components/
    Invitation.tsx      # arma toda la invitación y el estado de "abrir sobre"
    Petals.tsx            # pétalos cayendo (ambiental)
    Flower3D.tsx          # flor 3D con Three.js
    Countdown.tsx        # cuenta regresiva en vivo
    MusicPlayer.tsx      # reproductor (falta cargarle una canción real)
    RsvpForm.tsx          # formulario que llama a /api/rsvp
  lib/db.ts              # conexión a Postgres (pg), perezosa
sql/schema.sql            # tabla `rsvps`
```

## Pendiente / a completar

- **Número de WhatsApp real**: el botón "Confirmar por WhatsApp" en
  `Invitation.tsx` usa un número de ejemplo (`593000000000`) — hay que
  reemplazarlo por el real.
- **Canción**: `MusicPlayer` no trae ningún archivo de audio cargado (por
  derechos de autor no se incluyó ninguno). Pasale una URL propia con
  `<MusicPlayer src="/audio/nuestra-cancion.mp3" />` una vez que tengas el
  archivo con permiso de uso.
- **Ver las confirmaciones**: `GET /api/rsvp` devuelve las últimas 200 en JSON;
  si querés una pantalla linda para revisarlas, es el próximo paso natural.
- **Deploy**: pensado para desplegar en [Vercel](https://vercel.com) (o
  cualquier host de Next.js) conectando la misma `DATABASE_URL` como variable
  de entorno de producción.
