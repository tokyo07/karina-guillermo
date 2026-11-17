# Pruebas antes de la boda (19 de diciembre de 2026)

Hacerlas en el sitio publicado (no en `localhost`), con **un iPhone y un Android
reales**, idealmente con datos móviles y no con wifi. Marcar cada casilla.
Las fotos de prueba se pueden ocultar después desde el panel.

## 0. Configuración (una sola vez)

- [ ] **Vercel → Settings → Environment Variables** tiene las cuatro variables:
      `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
      (o `NEXT_PUBLIC_SUPABASE_ANON_KEY`), `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`,
      `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`. Después de cambiarlas, volver a publicar.
- [ ] **Cloudinary → Settings → Upload → Upload presets → `boda_album`**:
      en *Allowed formats* agregar `heic` y `heif` además de `jpg`
      (para las fotos HEIC que el celular no puede comprimir; ver punto 3).
- [ ] **Supabase**: `sql/album.sql` corrido completo con la última versión.
- [ ] El moderador tiene su usuario y está en la tabla `novios`.

## 1. Bienvenida y modos

- [ ] Abrir `/album` desde el QR impreso: aparece la presentación y luego la pantalla de subir.
- [ ] En el panel (`/album/novios`) tocar **Ceremonia**, **Recepción** y **Fiesta**:
      en el otro celular el ambiente cambia solo en pocos segundos.
- [ ] En Fiesta: la bienvenida es de noche con la bola de espejo gigante y la
      página no se traba (si se traba en un celular viejo, avisar).
- [ ] Dejarlo en **Ceremonia** al terminar.

## 2. Subir fotos (iPhone y Android)

- [ ] **Tomar foto** abre la cámara; la foto sube y queda "Lista".
- [ ] **Elegir de mi galería** con 5 fotos a la vez: suben todas.
- [ ] Elegir un reto del bingo, subir la foto: la casilla se tacha y aparece
      la insignia "Primera foto".
- [ ] Una foto tapando la cámara con el dedo: queda "Lista · los novios la
      revisan" y aparece en **Por revisar** del panel. Aprobarla con **Mostrar**.
- [ ] La misma foto dos veces seguidas: la segunda queda por revisar (repetida).

## 3. Fotos HEIC

- [ ] **iPhone**: subir una foto normal de la galería (el iPhone las guarda en HEIC):
      sube bien (Safari la convierte sola).
- [ ] **Android** (Samsung u otro con fotos HEIC/HEIF activado en la cámara): subir
      una de esas fotos. Debe quedar "Lista". Si dice "No pudimos leer esta foto
      (formato HEIC)…", falta permitir `heic`/`heif` en el preset de Cloudinary.

## 4. Álbum

- [ ] **Ver el álbum**: el diario pasa páginas y las fotos nuevas aparecen sin recargar.
- [ ] Dar ♥ a una foto desde el otro celular: el número sube.
- [ ] **♥ Más queridas** y **★ Lo mejor** cambian el orden.
- [ ] Las filas de filtros se deslizan de costado con el dedo.

## 5. Panel de los novios

- [ ] Entrar con el correo y la contraseña.
- [ ] **Guardar QR como imagen** y escanearlo con otro celular: abre `/album`.
- [ ] **Descargar todo (.zip)** desde una computadora: el archivo abre y las
      fotos (también las HEIC) vienen en JPG.
- [ ] **Ocultar** una foto: desaparece del álbum en el otro celular.

## 6. El día de la boda

- [ ] El programa cambia solo: Ceremonia 5:00 p. m., Recepción 6:45 p. m.,
      Fiesta 8:00 p. m. (el moderador puede adelantar o alargar desde el panel).
- [ ] Al día siguiente: descargar el .zip **y** exportar la carpeta `boda` desde
      Cloudinary como respaldo.
- [ ] Cerrar las subidas cuando ya no se quieran fotos nuevas
      (`update public.album_ajustes set subidas_abiertas = false;` en Supabase).
