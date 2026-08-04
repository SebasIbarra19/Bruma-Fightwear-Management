'use client'

import { useState, type CSSProperties } from 'react'
import Image from 'next/image'

const CARDS = [
  {
    tag: 'CONCENTRACIÓN',
    title: 'Ritual de Combate',
    description:
      'No hacemos prendas desechables. Forjamos armaduras biológicas preparadas para resistir las sesiones de entrenamiento más demandantes, inspirados en la persistencia de la fauna costarricense.',
    image: '/brand/photography/jiu-jitsu/Nogi-set-model-01.PNG',
  },
  {
    tag: 'PRESENCIA',
    title: 'Mente Serena',
    description: 'Representamos el balance de la naturaleza: la calma y el caos en perfecta armonía.',
    image: '/brand/photography/jiu-jitsu/Nogi-set-model-02.png',
  },
  {
    tag: 'DETALLE',
    title: 'Identidad Forjada',
    description:
      'Nacidos de las montañas de Cartago, nuestro equipamiento absorbe la humedad y resiste la torsión extrema, protegiendo al atleta bajo las condiciones más adversas.',
    image: '/brand/photography/jiu-jitsu/Nogi-set-model-03.png',
  },
] as const

const GRID_VALUES = ['5fr 1fr 1fr', '1fr 5fr 1fr', '1fr 1fr 5fr']

export function RaicesSection() {
  const [activeIndex, setActiveIndex] = useState(0)

  const gridStyle = {
    '--grid-cols': GRID_VALUES[activeIndex],
    '--grid-rows': GRID_VALUES[activeIndex],
  } as CSSProperties

  return (
    <section id="raices" className="relative pt-12 md:pt-14 pb-12 md:pb-16 px-6 md:px-12 w-full overflow-hidden bg-obsidian">
      <div className="max-w-[1100px] mx-auto relative z-10 w-full">
        <div className="max-w-4xl mb-6">
          <h3 className="font-fraunces text-[1.95rem] md:text-[2.65rem] font-black text-bone tracking-tight mb-3 leading-tight">
            Más que una marca
          </h3>
          <p className="font-fraunces text-xl md:text-[1.55rem] text-bone/90 font-light leading-relaxed italic">
            &ldquo;Una forma de ser auténticos, firmes y conectados a nuestras raíces.&rdquo;
          </p>
        </div>

        <div className="raices-grid min-h-[385px] md:h-[505px] select-none mt-4" style={gridStyle}>
          {CARDS.map((card, index) => {
            const isActive = index === activeIndex
            return (
              <div
                key={card.title}
                onClick={() => setActiveIndex(index)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`raices-card group relative rounded-[8px] overflow-hidden border border-bone/10 cursor-pointer flex flex-col justify-between bg-[#120d06] shadow-xl min-w-0 min-h-0${isActive ? ' active' : ''}`}
              >
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-cover object-top transition-all duration-700 ease-out-expo z-0"
                />

                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 opacity-0 group-[.active]:opacity-100 transition-opacity duration-500 ease-out-expo pointer-events-none" />

                <div className="absolute inset-0 z-20 p-6 md:p-8 flex flex-col justify-end pointer-events-none">
                  <div className="translate-y-8 opacity-0 group-[.active]:translate-y-0 group-[.active]:opacity-100 transition-all duration-500 ease-out-expo delay-75 pointer-events-none">
                    <span className="text-[9px] font-bold text-ember uppercase tracking-[0.2em] mb-1.5 block">
                      {card.tag}
                    </span>
                  </div>

                  <h4 className="font-fraunces text-2xl md:text-3xl font-black text-bone leading-tight mb-3 translate-y-8 opacity-0 group-[.active]:translate-y-0 group-[.active]:opacity-100 transition-all duration-500 ease-out-expo delay-100 pointer-events-none">
                    {card.title}
                  </h4>

                  <p className="font-geist text-xs md:text-sm text-bone/75 font-light leading-relaxed max-w-sm translate-y-8 opacity-0 group-[.active]:translate-y-0 group-[.active]:opacity-100 transition-all duration-500 ease-out-expo delay-150 pointer-events-none">
                    {card.description}
                  </p>
                </div>

                <div className="absolute inset-0 z-20 p-6 flex flex-col justify-between pointer-events-none">
                  <span className="font-fraunces text-4xl font-black text-bone/20 group-[.active]:opacity-0 transition-opacity duration-300">
                    .0{index + 1}
                  </span>

                  <div className="hidden md:flex mt-auto group-[.active]:opacity-0 transition-opacity duration-300 origin-top-left vertical-text ml-4 mb-4">
                    <span className="font-fraunces text-base font-bold text-bone/80 tracking-wide whitespace-nowrap">
                      {card.title}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
