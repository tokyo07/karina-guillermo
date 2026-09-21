# Invitación de Karina & Guillermo

Invitación de boda hecha con **Next.js 16 (App Router) + React + TypeScript**,
con confirmación de asistencia (RSVP) guardada en un proyecto de **Supabase
(Postgres)** dedicado a esta invitación.

Empezó como un prototipo estático (un solo HTML) y se portó a esta app real
para poder guardar las confirmaciones en una base de datos propia, en vez de
depender solo de un enlace de WhatsApp.

## Qué incluye

- Sobre animado como primera pantalla ("Abrir invitación") — se abre con un
  flip 3D y revela el resto de la invitación con scroll.
- Flor 3D real (Three.js, generada en código — sin descargar modelos externos).
- Pétalos cayendo de fondo, cuenta regresiva en vivo, reproductor de música.
- Formulario de confirmación de asistencia (`/api/rsvp`) que guarda cada
  respuesta en Postgres vía Supabase (nombre, si asiste, acompañantes, mensaje).
- Botón alternativo para confirmar por WhatsApp.

## Base de datos

Ya existe un proyecto de Supabase para esta invitación
(`karina-guillermo-invitacion`) con la tabla `rsvps` creada y Row Level
Security activado: cualquiera puede **insertar** una confirmación con la
clave pública (`anon`), pero nadie puede **leer** la lista de invitados con
esa misma clave — así los datos de los invitados quedan privados aunque la
clave viaje en el frontend. Para ver las confirmaciones, entrá al Table
Editor del proyecto en supabase.com con tu cuenta.

Si en algún momento necesitás recrear la tabla desde cero (otro proyecto,
otro ambiente), el SQL está en [`sql/schema.sql`](./sql/schema.sql).

## Requisitos

- Node.js 20+
- Acceso al proyecto de Supabase de esta invitación (o a uno propio con el
  mismo esquema).

## Poner en marcha

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Copiar `.env.example` a `.env.local` y completar con la URL y la clave
   `anon` del proyecto de Supabase (Project Settings → API):

   ```bash
   cp .env.example .env.local
   ```

3. Levantar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Abrí [http://localhost:3000](http://localhost:3000).

Sin las variables de Supabase configuradas, la página se ve y anima igual —
solo el formulario "Confirmar asistencia" va a fallar con un mensaje claro
(se puede seguir confirmando por WhatsApp mientras tanto).

## Estructura

```
src/
  app/
    page.tsx            # arma la página con <Invitation />
    layout.tsx          # fuentes (Cormorant Garamond, Great Vibes, Marcellus)
    globals.css         # todo el diseño (paleta terracota, sobre, secciones)
    api/rsvp/route.ts   # POST guarda una confirmación en Supabase
  components/
    Invitation.tsx      # arma toda la invitación y el estado de "abrir sobre"
    Petals.tsx           # pétalos cayendo (ambiental)
    Flower3D.tsx         # flor 3D con Three.js
    Countdown.tsx        # cuenta regresiva en vivo
    MusicPlayer.tsx      # reproductor (falta cargarle una canción real)
    RsvpForm.tsx          # formulario que llama a /api/rsvp
  lib/supabase.ts        # cliente de Supabase, perezoso
sql/schema.sql            # tabla `rsvps` + políticas de RLS
```

## Pendiente / a completar

- **Número de WhatsApp real**: el botón "Confirmar por WhatsApp" en
  `Invitation.tsx` usa un número de ejemplo (`593000000000`) — hay que
  reemplazarlo por el real.
- **Canción**: `MusicPlayer` no trae ningún archivo de audio cargado (por
  derechos de autor no se incluyó ninguno). Pasale una URL propia con
  `<MusicPlayer src="/audio/nuestra-cancion.mp3" />` una vez que tengas el
  archivo con permiso de uso.
- **Ver las confirmaciones**: por ahora se revisan desde el Table Editor de
  Supabase. Si más adelante querés una pantalla propia para verlas (protegida
  con contraseña, por ejemplo), es el siguiente paso natural.
- **Deploy**: pensado para [Vercel](https://vercel.com) — conectá las mismas
  dos variables de entorno (`NEXT_PUBLIC_SUPABASE_URL` y
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`) en la configuración del proyecto.
