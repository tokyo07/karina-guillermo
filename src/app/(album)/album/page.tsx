import IntroAlbum from "@/components/album/IntroAlbum";
import SubirFotos from "@/components/album/SubirFotos";

// Destino del QR: presentación con las fotos de los novios y luego subir fotos.
export default function SubirPage() {
  return (
    <>
      <IntroAlbum />
      <SubirFotos />
    </>
  );
}
