'use client'

export function ContactSection() {
  return (
    <section id="contacto" className="relative py-28 md:py-36 px-6 md:px-12 border-t border-bone/10 bg-[#120d06] overflow-hidden">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.06] mix-blend-color-dodge pointer-events-none"
        style={{ backgroundImage: "url('/brand/patterns/Bruma-Pattern-01.png')", backgroundSize: '200px' }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-obsidian via-transparent to-transparent" />

      <div className="max-w-[1300px] mx-auto relative z-10 grid grid-cols-12 gap-12 items-start">
        <div className="col-span-12 lg:col-span-5 flex flex-col justify-between h-full min-h-[300px]">
          <div>
            <div className="font-fraunces font-black text-2xl tracking-tighter uppercase text-bone mb-8 select-none">
              BRUMA
            </div>
            <h4 className="font-fraunces text-3xl font-light italic text-bone mb-6">
              Ante la bruma, mente serena.
            </h4>

            <div className="space-y-6 font-geist text-xs tracking-wider font-light text-bone/60">
              <div className="flex items-start gap-4">
                <svg className="text-ember shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <div>
                  <span className="text-bone/80 font-semibold block mb-0.5">Ubicación</span>
                  <span>Cartago, Costa Rica (9.8601° N, 83.9178° W)</span>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <svg className="text-ember shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                <div>
                  <span className="text-bone/80 font-semibold block mb-0.5">Comunidad</span>
                  <a href="https://www.instagram.com/brumafightwear/" target="_blank" rel="noopener noreferrer" className="text-ember hover:underline">
                    @brumafightwear
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-bone/10 text-bone/35 text-[9px] uppercase tracking-[0.25em] leading-loose">
            © 2026 BRUMA Fightwear.
            <br />
            Cerrando el círculo. Forjado en Costa Rica.
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7">
          <div className="flora-glass rounded-[4px] p-6 md:p-10 shadow-2xl">
            <h4 className="font-fraunces text-2xl font-bold text-bone mb-2">Conéctate al Manto</h4>
            <p className="font-geist text-xs text-bone/50 tracking-wide font-light mb-8">
              Escríbenos para unirte a la legión del balance.
            </p>

            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label-bruma" htmlFor="contact-name">Nombre</label>
                  <input type="text" id="contact-name" className="input-bruma" placeholder="TU NOMBRE" required />
                </div>
                <div>
                  <label className="label-bruma" htmlFor="contact-email">Correo Electrónico</label>
                  <input type="email" id="contact-email" className="input-bruma" placeholder="EMAIL@DIRECCION.COM" required />
                </div>
              </div>

              <div>
                <label className="label-bruma" htmlFor="contact-message">Mensaje</label>
                <textarea id="contact-message" rows={4} className="input-bruma !resize-none" placeholder="REVELA TU MENSAJE..." required />
              </div>

              <div className="flex justify-end">
                <button type="submit" className="btn-bruma-primary">
                  Enviar Mensaje
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
