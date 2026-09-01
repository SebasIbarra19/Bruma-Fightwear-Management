"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell,
  PieChart, Pie,
} from "recharts";
import { FloraGlass } from "@/components/ui/FloraGlass";
import { formatColones } from "@/lib/utils";
import type { StatisticsSeries } from "@/lib/database/adapters/dashboard-adapter";

const EMBER = "#F46734";

// En recharts 3.9.2 la animacion de entrada se queda a medias: el Pie no llega
// a dibujar ni un sector, y las barras y la linea se quedan planas en cero. Un
// grafico congelado en el primer frame se lee como roto -- peor que no tener
// animacion. Se apaga en los cuatro.
const SIN_ANIMACION = { isAnimationActive: false } as const;

// Paleta para las categorias del donut y las barras. Se recorre en orden y se
// repite si hace falta: son pocas categorias, y usar un color por estado fijo
// obligaria a mantener un mapa que se desincroniza cuando alguien agrega uno.
const PALETA = [EMBER, "#7ddb7d", "#8ab4f8", "#e8c15a", "#c98bdb", "#5ec8c0"];

/** Marco comun: titulo, la pregunta que responde, y el vacio cuando no hay datos. */
function Panel({
  titulo, pregunta, vacio, hayDatos, cargando, className = "", children,
}: {
  titulo: string;
  pregunta: string;
  vacio: string;
  hayDatos: boolean;
  cargando: boolean;
  /** Para que el panel sea el item de la grilla y no un div envolvente: un
   *  envoltorio extra le quita la altura definida que el chart necesita. */
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <FloraGlass className={`p-6 flex flex-col min-h-[320px] ${className}`}>
      <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest">{titulo}</p>
      <p className="text-xs text-bone/40 font-geist mt-1 mb-5">{pregunta}</p>

      {cargando && <div className="flex-1 bg-bone/5 rounded-[2px] animate-pulse" />}

      {!cargando && !hayDatos && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-xs text-bone/30 font-geist max-w-[28ch]">{vacio}</p>
        </div>
      )}

      {!cargando && hayDatos && <div className="h-[220px]">{children}</div>}
    </FloraGlass>
  );
}

/** Tooltip propio: el de recharts trae fondo blanco y aca se ve como un parche. */
function Globo({ active, payload, label, formato, formatoLabel }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-obsidian border border-bone/20 rounded-[2px] px-3 py-2">
      {label !== undefined && (
        <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest mb-1">
          {formatoLabel ? formatoLabel(label) : label}
        </p>
      )}
      {payload.map((p: any) => (
        <p key={p.name} className="text-xs text-bone font-geist">
          {p.name}: {formato ? formato(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

const ejeComun = {
  stroke: "rgba(206,193,156,0.4)",
  fontSize: 10,
  tickLine: false,
  axisLine: false,
};

/** `2026-08-27` → `27 ago`, que es lo que cabe en un eje. */
function diaCorto(iso: string) {
  const [, mes, dia] = iso.split("-");
  const meses = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${Number(dia)} ${meses[Number(mes) - 1]}`;
}

export function StatisticsCharts({
  series, cargando,
}: {
  series: StatisticsSeries | null;
  cargando: boolean;
}) {
  const dias = series?.ingresos_por_dia ?? [];
  const top = series?.top_productos ?? [];
  const estados = series?.por_estado ?? [];
  const categorias = series?.por_categoria ?? [];

  // Un rango sin una sola venta devuelve la serie llena de ceros, no vacia: si
  // se dibujara, seria una linea plana en el piso que parece un grafico roto.
  const hayIngresos = dias.some((d) => d.ingresos > 0);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Panel
          className="xl:col-span-2"
          titulo="Ingresos por día"
          pregunta="¿Vendemos más o menos que antes?"
          vacio="Sin ventas en este período. Probá con un rango más amplio."
          hayDatos={hayIngresos}
          cargando={cargando}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dias} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
              <CartesianGrid stroke="rgba(206,193,156,0.08)" vertical={false} />
              <XAxis dataKey="fecha" tickFormatter={diaCorto} {...ejeComun} />
              <YAxis tickFormatter={(v) => formatColones(v)} width={72} {...ejeComun} />
              <Tooltip
                content={<Globo formato={formatColones} formatoLabel={diaCorto} />}
                cursor={{ stroke: "rgba(206,193,156,0.2)" }}
              />
              <Line
                type="monotone" dataKey="ingresos" name="Ingresos"
                stroke={EMBER} strokeWidth={2}
                dot={{ r: 2, fill: EMBER }} activeDot={{ r: 4 }}
                {...SIN_ANIMACION}
              />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

      <Panel
        titulo="Productos que se mueven"
        pregunta="¿Qué se vende, por unidades?"
        vacio="Todavía no hay pedidos con productos en este período."
        hayDatos={top.length > 0}
        cargando={cargando}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={top} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
            <CartesianGrid stroke="rgba(206,193,156,0.08)" horizontal={false} />
            <XAxis type="number" allowDecimals={false} {...ejeComun} />
            <YAxis type="category" dataKey="sku" width={128} {...ejeComun} />
            <Tooltip content={<Globo />} cursor={{ fill: "rgba(206,193,156,0.06)" }} />
            <Bar dataKey="unidades" name="Unidades" fill={EMBER} radius={[0, 2, 2, 0]} maxBarSize={28} {...SIN_ANIMACION} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel
        titulo="Estado de los pedidos"
        pregunta="¿Qué hay pendiente de resolver?"
        vacio="Sin pedidos en este período."
        hayDatos={estados.length > 0}
        cargando={cargando}
      >
        {/* La leyenda va en HTML al lado, no como etiquetas SVG dentro del
            donut: en un panel de 220 px las etiquetas se pisan entre si, y aca
            ademas se puede leer el conteo sin pasar el mouse. */}
        <div className="flex h-full items-center gap-4">
          <div className="h-full w-1/2 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                {/* El color va en el dato y no en `<Cell>`: mismo resultado
                    con menos nodos. */}
                <Pie
                  data={estados.map((e, i) => ({ ...e, fill: PALETA[i % PALETA.length] }))}
                  dataKey="pedidos" nameKey="estado"
                  innerRadius="45%" outerRadius="75%" stroke="none"
                  {...SIN_ANIMACION}
                />
                <Tooltip content={<Globo />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="flex flex-1 flex-col gap-2 min-w-0">
            {estados.map((e, i) => (
              <li key={e.estado} className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: PALETA[i % PALETA.length] }}
                />
                <span className="truncate text-xs text-bone/70 font-geist">{e.estado}</span>
                <span className="ml-auto font-fraunces text-sm font-bold text-bone">
                  {e.pedidos}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Panel>

        <Panel
          className="xl:col-span-2"
          titulo="Categorías que facturan"
          pregunta="¿De dónde sale el dinero?"
          vacio="Todavía no hay pedidos con productos en este período."
          hayDatos={categorias.length > 0}
          cargando={cargando}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categorias} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
              <CartesianGrid stroke="rgba(206,193,156,0.08)" vertical={false} />
              <XAxis dataKey="categoria" {...ejeComun} />
              <YAxis tickFormatter={(v) => formatColones(v)} width={72} {...ejeComun} />
              <Tooltip content={<Globo formato={formatColones} />} cursor={{ fill: "rgba(206,193,156,0.06)" }} />
              <Bar dataKey="ingresos" name="Ingresos" radius={[2, 2, 0, 0]} maxBarSize={72} {...SIN_ANIMACION}>
                {categorias.map((c, i) => (
                  <Cell key={c.categoria} fill={PALETA[i % PALETA.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
    </div>
  );
}
