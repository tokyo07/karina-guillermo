import type { NextConfig } from "next";

// SOLO_ALBUM=1: este despliegue es solo el álbum (un proyecto de Vercel aparte,
// p. ej. album.dominio.com). "/" y la invitación llevan a /album. Sin la
// variable, el sitio es la invitación con el álbum en /album, como siempre.
const soloAlbum = process.env.SOLO_ALBUM === "1";

const nextConfig: NextConfig = {
  async redirects() {
    if (!soloAlbum) return [];
    // 307 (temporal): si algún día se quita, los navegadores no lo recuerdan.
    // El query se conserva: /?invitado=Ana → /album?invitado=Ana.
    return [
      { source: "/", destination: "/album", permanent: false },
      { source: "/index.html", destination: "/album", permanent: false },
    ];
  },
  async rewrites() {
    return {
      // La invitación oficial es el HTML estático public/index.html (la que
      // ya recibieron los invitados). Se sirve en "/" antes de que Next mire
      // src/app/page.tsx, y conserva el query (?invitado=Nombre).
      // En el sitio "solo álbum" no aplica: ahí "/" redirige antes (redirects va primero).
      beforeFiles: soloAlbum ? [] : [{ source: "/", destination: "/index.html" }],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
