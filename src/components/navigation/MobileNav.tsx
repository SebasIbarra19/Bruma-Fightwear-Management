import Link from 'next/link'
import { NAV, type BeltId } from './belts'
import { BeltPicker } from './BeltPicker'

interface MobileNavProps {
  belt: BeltId
  onBeltChange: (belt: BeltId) => void
  activeIndex: number
}

/**
 * Nav de <lg (breakpoint 1024px). El rail vertical de `BeltNavigation` está
 * dimensionado exclusivamente para una columna de 220px (ver `belts.ts`) —
 * por debajo de `lg`, `<aside>` pasaría a ancho completo y produciría un
 * cinturón gigante con slots inutilizables (ver FINDINGS.md, "BeltNavigation
 * no tiene solución mobile"). En vez de forzar esa geometría a otra escala,
 * esta es una variante compuesta aparte: registro producto (legibilidad y
 * densidad, no el rail fotográfico) — franja superior sticky con identidad
 * (wordmark + selector de grado, reutilizando `BeltPicker` tal cual) y los 8
 * destinos de `NAV` como fila horizontal con scroll. Mismo lenguaje visual
 * que los pills de filtro de Inventory (`bg-ember/10 text-ember
 * border-ember/30` para el activo) en vez de inventar un estilo nuevo.
 */
export function MobileNav({ belt, onBeltChange, activeIndex }: MobileNavProps) {
  return (
    <div className="sticky top-0 z-40 flex flex-col bg-obsidian border-b border-bone/10 lg:hidden">
      <div className="flex items-center justify-between gap-4 px-4 py-2 border-b border-bone/10">
        <span className="font-fraunces text-sm font-bold tracking-wide text-bone">
          BRUMA
        </span>
        <BeltPicker value={belt} onChange={onBeltChange} />
      </div>

      <nav
        aria-label="Navegación principal"
        className="flex gap-2 overflow-x-auto scrollbar-none px-4 py-2"
      >
        {NAV.map((item, index) => {
          const Icon = item.icon
          const isActive = index === activeIndex
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-[2px] border px-3 py-2 font-geist text-[11px] font-bold uppercase tracking-widest outline-none transition-all focus-visible:ring-1 focus-visible:ring-ember ${
                isActive
                  ? 'bg-ember/10 text-ember border-ember/30'
                  : 'bg-bone/5 text-bone/60 border-bone/20 hover:border-bone/50 hover:text-bone'
              }`}
            >
              <Icon size={14} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
