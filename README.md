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

## Qué se publica en cada ruta

| Ruta | Qué es |
|---|---|
| `/` | **La invitación oficial**: `public/index.html` (HTML estático). `next.config.ts` la sirve en `/` y conserva `?invitado=Nombre`. Su RSVP va a Google Apps Script + Formspree. |
| `/album` | Subir fotos (destino del QR). Acepta `?invitado=Nombre`. |
| `/album/fotos` | Mural de todos, visor y modo proyector. |
| `/album/novios` | Panel con login: QR, estadísticas, moderación y descarga .zip. |

`src/app/(invitacion)/page.tsx` (la versión React de la invitación) queda en el
repo pero no se publica: la regla de `next.config.ts` tiene prioridad sobre ella.

## Álbum de fotos

Fotos en **Cloudinary** (con miniaturas automáticas por URL) y datos en
**Supabase** (quién subió, momento, corazones, ocultas, login de los novios).

### Configuración (una sola vez)

1. **Supabase → SQL editor**: pegar y correr [`sql/album.sql`](./sql/album.sql).
2. **Supabase → Authentication**:
   - Users → *Add user* con el correo de los novios (*Auto Confirm User*).
   - Sign In / Providers → desactivar *Allow new users to sign up*.
   - Correr en el SQL editor (con el correo real):
     ```sql
     insert into public.novios (user_id)
     select id from auth.users where email = 'CORREO_DE_LOS_NOVIOS'
     on conflict do nothing;
     ```
3. **Cloudinary → Settings → Upload → Upload presets → Add**:
   - Signing mode: **Unsigned**. Nombre: `boda_album`.
   - Asset folder: `boda`. Allowed formats: `jpg`.
   - Incoming transformation: `c_limit,w_1600,h_1600` (tope aunque alguien
     salte la compresión del navegador).
   - Desactivar *Use filename* / dejar *Unique filename* activo.
4. Variables en `.env.local` y en **Vercel → Settings → Environment Variables**:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.

### Operación

- **Ambiente por momento:** tres momentos, cada uno con su estilo:
  **Ceremonia** = la portada de la invitación (marfil, terracota, marco con
  ramas y foto en arco; pide apagar flash y sonido), **Recepción** = estilo
  galería (gris claro, naranja atardecer, menú `[subir]` en Jost) y **Fiesta** =
  noche morada con luces ámbar y rosa, con bolas de espejo que giran
  (`BolaEspejo.tsx`, canvas sin librerías). En la fiesta, la presentación de
  bienvenida también es de noche, con una bola gigante que crece detrás de las fotos. Recepción y Fiesta abren con la firma
  manuscrita de los novios que se escribe sola. Todos los teléfonos cambian
  solos (al instante por Realtime, o en menos de 30 s): colores, retos, texto
  de bienvenida y el momento que se propone al subir.
- **Programa de la boda** (`src/lib/cronograma.ts`): a su hora el momento
  cambia solo, por si nadie toca el panel (Ceremonia 5:00 p. m., Recepción
  6:45 p. m., Fiesta 8:00 p. m.). Lo elegido a mano en el panel manda hasta el
  siguiente cambio del programa. Además, mientras dura cada actividad (brindis,
  mariachis y pastel, parranda vallenata, hora loca de cierre…) sus retos
  aparecen primero al subir. Para probarlo en desarrollo: `/album?hora=2026-12-19T22:15`.
  Si `album.sql` se corrió antes, volver a correrlo completo (es idempotente).
- **Ranking por corazones** (`src/lib/ranking.ts`): cada teléfono registra
  qué fotos vio (una vista por foto y teléfono). "♥ Más queridas" en el álbum y
  en el panel ordena por *promedio bayesiano* de corazones sobre vistas, así las
  fotos que subieron temprano no ganan solo por antigüedad. Desde el panel se
  descargan las 30 más queridas.
- **Lo mejor de la noche** (`src/lib/mejores.ts`): "★ Lo mejor" en el álbum
  elige solo las mejores: puntaje = 60 % corazones/vistas + 40 % calidad
  (nitidez, exposición y estructura que mide el teléfono al subir), una sola
  foto por ráfaga de casi iguales y el mejor 30 % del álbum (mín. 6, máx. 50).
  La presentación de bienvenida suma las 4 mejores entre las fotos de los novios.
- **Bingo de retos** (`src/lib/bingo.ts`): cada momento tiene un cartón de
  3×2 con sus 6 retos. Tocar una casilla elige el reto de la próxima foto y
  subirla lo tacha. Insignias: Primera foto, ¡Línea! (una fila de 3), Testigo de
  honor / Alma de la mesa / Leyenda de la pista (cartón lleno de cada momento),
  Cazador de momentos (un reto en cada momento) y Paparazzi (10 fotos). Se
  guarda en cada teléfono (`localStorage`), sin cuentas ni base de datos.
- **Filtro de calidad:** antes de subir, el teléfono mide cada foto
  (`src/lib/calidad.ts`): borrosa o movida, casi negra, casi blanca, "lisa"
  (pared, techo, bolsillo) o casi igual a otra que ese teléfono ya subió. Una
  foto dudosa sube igual pero queda **por revisar**: los invitados no la ven
  hasta que los novios o el moderador la muestren desde "Por revisar" en el
  panel. Los umbrales son permisivos a propósito (en la fiesta se tolera más
  oscuridad). Para ajustarlos: `node scripts/calibrar-calidad.mjs` (necesita
  ffmpeg) prueba el filtro con las fotos de `public/`. Las medidas de cada foto
  quedan en `fotos.calidad` para revisar umbrales con fotos reales.
- **Moderador:** se da de alta igual que los novios (paso 2 de Configuración),
  con su propio correo; entra al mismo panel.
- Cerrar las subidas después de la boda:
  `update public.album_ajustes set subidas_abiertas = false;`
- Límite por teléfono: 60 fotos/hora (`album_ajustes.max_subidas_por_hora`).
- Al día siguiente: descargar el .zip desde el panel **y** exportar la carpeta
  `boda` desde Cloudinary (copia de respaldo).

### Riesgos conocidos

- El preset *unsigned* permite que alguien con el cloud name suba imágenes a
  Cloudinary sin pasar por el álbum (no aparecen en el mural, pero gastan
  cuota). Mitigación: borrar o desactivar el preset al cerrar el álbum.
- El .zip se arma en el navegador: con cientos de fotos usar una computadora,
  no el celular.
- Probar antes del evento en iPhone real (fotos HEIC) y con 20+ subidas a la vez.

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
