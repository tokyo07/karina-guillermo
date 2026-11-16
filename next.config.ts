import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      // La invitación oficial es el HTML estático public/index.html (la que
      // ya recibieron los invitados). Se sirve en "/" antes de que Next mire
      // src/app/page.tsx, y conserva el query (?invitado=Nombre).
      beforeFiles: [{ source: "/", destination: "/index.html" }],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
