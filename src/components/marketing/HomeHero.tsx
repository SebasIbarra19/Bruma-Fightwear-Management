import Image from 'next/image'
import Link from 'next/link'

export function HomeHero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center px-6 text-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/brand/photography/costa-rica/opt3.jpg"
          alt="Cascada Aérea Costa Rica"
          fill
          priority
          className="object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/30 to-transparent z-10 pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center -mt-12 md:-mt-20">
        <div className="mb-16 md:mb-24 transform translate-y-4 opacity-0 animate-fade-in-up flex flex-col items-center">
          <h1 className="font-fraunces font-black text-7xl md:text-[11rem] lg:text-[13rem] tracking-tighter uppercase text-bone select-none drop-shadow-[0_20px_45px_rgba(0,0,0,0.98)] leading-none">
            BRUMA
          </h1>
          <p className="font-geist text-sm md:text-2xl lg:text-3xl text-bone/50 uppercase tracking-[0.55em] font-black -mt-2 md:-mt-4">
            fightwear
          </p>
        </div>

        <p
          className="font-fraunces italic font-light text-2xl md:text-3xl text-bone/85 tracking-wide mb-10 max-w-2xl leading-relaxed transform translate-y-4 opacity-0 animate-fade-in-up"
          style={{ animationDelay: '300ms' }}
        >
          &ldquo;Ante la bruma, mente serena.&rdquo;
        </p>

        <div
          className="transform translate-y-4 opacity-0 animate-fade-in-up"
          style={{ animationDelay: '500ms' }}
        >
          <Link
            href="/auth/login"
            className="bg-ember text-obsidian px-8 py-4 rounded-[2px] font-bold uppercase text-xs tracking-[0.2em] hover:bg-ember/90 transition-all shadow-[0_0_20px_rgba(244,103,52,0.3)] duration-300 inline-block"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 opacity-40 animate-pulse">
        <span className="text-[8px] uppercase tracking-[0.25em] text-bone">Explorar</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-bounce">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </section>
  )
}
