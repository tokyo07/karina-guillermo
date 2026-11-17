// Sin "use client": el layout (Server Component) importa el script como texto.

/** Dónde recuerda cada teléfono el último momento conocido. */
export const CLAVE_AMBIENTE = "album:ambiente";

/** Corre antes del primer pintado: pone data-momento en <html> con el último momento conocido. */
export const SCRIPT_AMBIENTE = `try{var m=localStorage.getItem("${CLAVE_AMBIENTE}");if(m==="ceremonia"||m==="recepcion"||m==="fiesta")document.documentElement.dataset.momento=m}catch(e){}`;
