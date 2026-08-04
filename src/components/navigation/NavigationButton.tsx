import Link from 'next/link'
import type { NavItem } from './belts'

interface NavigationButtonProps {
  item: NavItem
  isActive: boolean
}

/**
 * Un slot del panel de grados.
 *
 * Es un <Link> real, no un div con onClick: eso preserva navegación por
 * teclado, click derecho y "abrir en pestaña nueva" de forma nativa.
 *
 * `aria-label` se mantiene aunque el texto ya sea visible: fija la etiqueta
 * accesible con independencia de un eventual truncado del label.
 */
export function NavigationButton({ item, isActive }: NavigationButtonProps) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
      // z-20 lo deja por encima de la cinta (z-10), para que ícono y texto del
      // ítem activo se lean sobre el esparadrapo y el foco nunca quede tapado.
      className="group relative z-20 flex flex-1 items-center justify-center gap-3 rounded-[2px] px-4 outline-none focus-visible:ring-1 focus-visible:ring-ember"
    >
      <Icon
        size={16}
        strokeWidth={isActive ? 2.5 : 2}
        className={
          isActive
            ? 'shrink-0 text-obsidian'
            : 'shrink-0 text-bone/55 transition-colors group-hover:text-bone'
        }
      />
      <span
        // El ítem activo va sobre la cinta blanca: necesita tinta oscura.
        // Los inactivos van sobre el panel oscuro: necesitan tinta clara.
        className={`whitespace-nowrap font-geist text-xs font-bold uppercase tracking-[0.15em] transition-colors ${
          isActive ? 'text-obsidian' : 'text-bone/60 group-hover:text-bone'
        }`}
      >
        {item.label}
      </span>
    </Link>
  )
}
