import Image from 'next/image'

export function EmblemSection() {
  return (
    <section className="relative py-12 md:py-16 px-6 overflow-hidden border-t border-obsidian/10 bg-bone text-obsidian">
      <div className="absolute inset-0 tactical-grid-dark opacity-[0.06] pointer-events-none" />

      <div className="max-w-[1800px] mx-auto text-center relative flex flex-col items-center">
        <div className="relative w-full max-w-[1100px] min-h-[420px] md:min-h-[680px] flex items-center justify-center mb-10 select-none">
          <div className="absolute z-10 w-[390px] h-[340px] md:w-[640px] md:h-[640px] flex items-center justify-center animate-rotate-slow pointer-events-none">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <path id="circlePath" d="M 100,16 A 84,84 0 1,1 99.99,16 Z" fill="none" />
              <text className="font-geist text-[5.0px] md:text-[7.1px] uppercase tracking-[0.24em] fill-obsidian font-black" style={{ fillOpacity: 0.65 }}>
                <textPath href="#circlePath" startOffset="0%">
                  En la niebla se esconde una silueta  •  Invisible para muchos, inevitable para quien lo ve
                </textPath>
              </text>
            </svg>
          </div>

          <div className="relative z-20 w-[310px] h-[310px] md:w-[480px] md:h-[480px] flex items-center justify-center transition-transform duration-1000 ease-out-expo hover:scale-105">
            <Image
              src="/brand/logos/logo-circle-original-no-background.png"
              alt="Emblema Circular BRUMA"
              width={480}
              height={480}
              className="w-full h-full object-contain relative z-10 drop-shadow-[0_20px_50px_rgba(26,18,8,0.12)]"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
