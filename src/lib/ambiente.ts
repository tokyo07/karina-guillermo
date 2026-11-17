// Sin "use client": el layout (Server Component) importa el script como texto.

/** Dónde recuerda cada teléfono el último momento conocido. */
export const CLAVE_AMBIENTE = "album:ambiente";

/** Marca del enlace del QR: /album?subir lleva directo al formulario, sin la bienvenida. */
export const PARAM_SUBIR = "subir";

/**
 * Corre antes del primer pintado: pone data-momento en <html> con el último
 * momento conocido y, si se llegó desde el QR (?subir), data-subir para que la
 * bienvenida no aparezca ni un instante.
 */
export const SCRIPT_AMBIENTE = `try{var m=localStorage.getItem("${CLAVE_AMBIENTE}");if(m==="ceremonia"||m==="recepcion"||m==="fiesta")document.documentElement.dataset.momento=m}catch(e){}try{if(new URLSearchParams(location.search).has("${PARAM_SUBIR}"))document.documentElement.dataset.subir=""}catch(e){}`;
