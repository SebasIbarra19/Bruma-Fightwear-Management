'use client'

import { BELTS, BELT_IDS, type BeltId } from './belts'

interface BeltPickerProps {
  value: BeltId
  onChange: (belt: BeltId) => void
}

/** Selector de grado: un punto por cinturón. */
export function BeltPicker({ value, onChange }: BeltPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Grado del cinturón"
      className="flex shrink-0 items-center justify-center gap-2"
    >
      {BELT_IDS.map((id) => {
        const isActive = id === value
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={BELTS[id].label}
            title={BELTS[id].label}
            onClick={() => onChange(id)}
            className={`h-4 w-4 rounded-full border transition-all outline-none focus-visible:ring-1 focus-visible:ring-ember ${
              isActive
                ? 'scale-125 border-ember'
                : 'border-bone/25 hover:border-bone/60'
            }`}
            style={{ backgroundColor: BELTS[id].swatch }}
          />
        )
      })}
    </div>
  )
}
