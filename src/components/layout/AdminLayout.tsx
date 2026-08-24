"use client";

import React from "react";
import { BeltNavigation } from "@/components/navigation/BeltNavigation";
import { BrumaPatternBackground } from "@/components/figma-shared/BrumaPatternBackground";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    // Sin padding vertical en el contenedor: cualquier padding acá le resta
    // recorrido al `sticky` de la barra respecto del rango de scroll, y la
    // barra se despegaría justo al final. Va en <main>.
    <div className="flex-1 w-full max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-8 px-4 md:px-8 relative z-10">
      <BeltNavigation />
      {/*
        overflow-hidden en <main> (no en el contenedor de arriba) es
        obligatorio, no cosmético: el recorrido de un `sticky` está acotado
        por la altura de su containing block (el div de arriba), pero el
        scroll real de la página lo determina document.scrollHeight, que
        también cuenta cualquier descendiente que se salga de su caja
        normal-flow (ej. las decoraciones <Fauna> con offsets negativos, como
        bottom-[-5%] en Statistics). Sin recortar esa fuga, cualquier página
        con una decoración así infla el scroll más allá de lo que la barra
        puede cubrir, y esta se despega cerca del final.

        Va en <main> y no en el div de arriba porque `overflow` distinto de
        `visible` en el propio containing block de un elemento sticky cambia
        el scrollport contra el que se resuelve y anula el pegado por
        completo (probado: rompía el sticky al 100%). <main> es hermano de
        <aside>, no su ancestro, así que recortar ahí es seguro.
      */}
      <main className="flex-1 flex flex-col gap-12 relative z-20 w-full min-w-0 pt-4 pb-12 overflow-hidden">
        <BrumaPatternBackground />
        <div className="relative z-10 flex flex-col gap-12">{children}</div>
      </main>
    </div>
  );
}
