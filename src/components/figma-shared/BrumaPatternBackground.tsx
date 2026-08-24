import React from "react";

/**
 * Fondo Bruma — mismo patrón que ContactSection.tsx (landing), reemplaza la
 * cuadrícula global (.tactical-grid) solo en las páginas que lo usan. `fixed`
 * porque no le afecta el `overflow-hidden` de AdminLayout's <main> (esa regla
 * solo recorta descendientes en flujo normal / posicionados, no fixed) y así
 * queda igual de estática que el resto del fondo global al hacer scroll. Vive
 * dentro del stacking context z-20 de <main>, así que ya pinta arriba de los
 * fixed z-0 globales sin necesitar z alto acá.
 *
 * Debe ser el primer hijo de un wrapper raíz `relative`, con el resto del
 * contenido de la página envuelto en un `<div className="relative z-10 ...">`
 * hermano justo después (ver orders/page.tsx e inventory/page.tsx).
 */
export function BrumaPatternBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 bg-[#120d06]" />
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.06] mix-blend-color-dodge brightness-125"
        style={{ backgroundImage: "url('/brand/patterns/Bruma-Pattern-01.png')", backgroundSize: '200px' }}
      />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-obsidian to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-obsidian to-transparent" />
    </div>
  );
}
