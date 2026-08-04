export function LandingFooter() {
  return (
    <footer className="bg-ember text-obsidian py-16 md:py-24 px-6 md:px-12 relative overflow-hidden select-none border-t border-ember/20 z-10">
      <div className="max-w-[1600px] mx-auto flex flex-col items-center justify-center text-center">
        <h2 className="font-fraunces font-black text-7xl md:text-[11rem] lg:text-[14rem] tracking-tighter uppercase leading-none">
          BRUMA
        </h2>
        <p className="font-geist text-sm md:text-xl lg:text-2xl font-black uppercase tracking-[0.6em] -mt-2 md:-mt-5 mb-8">
          fightwear
        </p>
        <div className="w-full h-[1px] bg-obsidian/10 my-8" />
        <div className="flex flex-col md:flex-row justify-between items-center w-full gap-4 text-[10px] uppercase tracking-[0.2em] font-black text-obsidian/65">
          <div>© 2026 BRUMA Fightwear. Todos los derechos reservados.</div>
          <div>Cerrando el círculo. Forjado en Costa Rica.</div>
        </div>
      </div>
    </footer>
  )
}
