import Image from 'next/image'

export function PhilosophySection() {
  return (
    <section id="filosofia" className="relative py-12 md:py-16 px-6 md:px-12 bg-obsidian border-y border-bone/5 overflow-hidden">
      <div className="absolute -right-32 top-10 w-[500px] h-[500px] bg-ember/5 rounded-full filter blur-[120px] pointer-events-none" />

      <div className="max-w-[1300px] mx-auto bg-surface/20 border border-bone/10 p-6 md:p-10 rounded-[12px] shadow-2xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-14 items-stretch">
          <div className="col-span-12 lg:col-span-6 flex flex-col justify-center">
            <Image
              src="/brand/logos/balance-negative.png"
              alt="Balance Perfecto - Dos Jaguares"
              width={450}
              height={450}
              className="w-full max-w-[390px] md:max-w-[450px] object-contain relative z-10 transition-transform duration-700 ease-out-expo filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]"
            />
          </div>

          <div className="col-span-12 lg:col-span-6 flex flex-col justify-center">
            <h3 className="font-fraunces text-4xl md:text-5xl font-black text-bone tracking-tight mb-5 leading-tight">
              Balance <span>Perfecto</span>
            </h3>

            <p className="font-fraunces text-lg md:text-xl text-bone/85 font-light leading-relaxed italic mb-4">
              &ldquo;Dos jaguares en posición de pelea: un homenaje al balance del camino marcial.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
