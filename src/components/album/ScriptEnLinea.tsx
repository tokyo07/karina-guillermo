"use client";

// Script en línea que corre antes de hidratar. En el cliente se marca
// text/plain para que React no avise de un <script> renderizado
// (patrón de docs/01-app/02-guides/preventing-flash-before-hydration).
export function ScriptEnLinea({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
