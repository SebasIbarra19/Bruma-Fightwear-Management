'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { RegisterForm } from '@/components/auth/RegisterForm'

export function RegisterPage() {
  const router = useRouter()

  return (
    <div className="fixed inset-0 flex bg-obsidian">
      <div className="hidden lg:flex relative w-1/2 h-full bg-bone items-center justify-center select-none">
        <div className="absolute inset-0 tactical-grid-dark opacity-[0.06] pointer-events-none" />
        <Image
          src="/brand/logos/logo-circle-original-no-background.png"
          alt="Emblema Circular BRUMA"
          width={384}
          height={384}
          className="relative z-10 w-64 md:w-80 lg:w-96 object-contain drop-shadow-[0_20px_50px_rgba(26,18,8,0.12)]"
        />
      </div>

      <div className="w-full lg:w-1/2 h-full relative flex items-center justify-center bg-obsidian border-l border-bone/5 overflow-y-auto">
        <div className="relative w-full max-w-md px-6 py-12">
          <div className="flex flex-col items-center mb-6">
            <span className="font-fraunces font-black text-3xl tracking-tighter uppercase text-bone select-none">
              BRUMA
            </span>
            <span className="text-[8px] text-ember uppercase tracking-[0.3em] font-bold mt-1">
              Únete a la Legión
            </span>
          </div>

          <RegisterForm onSuccess={() => router.push('/dashboard')} onToggleMode={() => {}} />

          <div className="mt-6 pt-5 border-t border-bone/10 text-center">
            <span className="text-[10px] text-bone/40 font-light tracking-wide">¿Ya eres parte?</span>
            <Link
              href="/auth/login"
              className="text-[10px] text-ember font-bold hover:underline tracking-widest uppercase ml-2"
            >
              Inicia Sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
