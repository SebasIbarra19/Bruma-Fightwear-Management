'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Escribí tu correo.')
      return
    }
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      // `redirectTo` es lo que arregla el problema original: sin él, Supabase
      // usa el Site URL del proyecto —el landing— y el enlace dejaba al usuario
      // en una página que no sabe qué hacer con el token.
      // ⚠️ Esta URL debe estar en la lista blanca del dashboard
      // (Authentication → URL Configuration → Redirect URLs) o Supabase la
      // ignora y vuelve a caer en el Site URL.
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset`,
      })
      if (err) throw err
      setEnviado(true)
    } catch (err: any) {
      setError(err.message || 'No se pudo enviar el correo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6 px-6 py-16">
      <div>
        <p className="font-geist text-[10px] uppercase tracking-widest text-ember font-bold mb-2">
          Recuperación
        </p>
        <h1 className="font-fraunces text-3xl font-black text-bone leading-tight">
          Restablecer clave
        </h1>
      </div>

      {enviado ? (
        // Mensaje deliberadamente idéntico exista o no la cuenta: decir "ese
        // correo no está registrado" le confirma a un desconocido qué
        // direcciones tienen acceso al sistema.
        <div className="flex flex-col gap-4">
          <div className="px-4 py-4 bg-[#7ddb7d]/10 border border-[#7ddb7d]/30 rounded-[2px]">
            <p className="font-geist text-sm text-[#7ddb7d]">
              Si existe una cuenta con ese correo, te llega un enlace para poner
              una clave nueva.
            </p>
          </div>
          <p className="font-geist text-xs text-bone/40">
            El enlace vence en una hora y sirve una sola vez. Revisá también la
            carpeta de spam.
          </p>
          <Link
            href="/auth/login"
            className="flex items-center gap-2 font-geist text-[10px] uppercase tracking-widest text-bone/50 hover:text-bone transition-colors"
          >
            <ArrowLeft size={12} /> Volver al inicio de sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <p className="font-geist text-sm text-bone/60 leading-relaxed">
            Escribí el correo de tu cuenta y te mandamos un enlace para elegir
            una clave nueva.
          </p>

          {error && (
            <div className="px-4 py-3 bg-ember/10 border border-ember/30 rounded-[2px]">
              <p className="font-geist text-sm text-ember">{error}</p>
            </div>
          )}

          <div className="relative group">
            <label className="block font-geist text-[10px] uppercase tracking-widest text-bone/50 mb-2 transition-colors group-focus-within:text-ember">
              Operative ID (Email)
            </label>
            <div className="relative">
              <Mail
                size={14}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-bone/30 group-focus-within:text-ember transition-colors"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@brumafightwear.com"
                className="w-full pl-10 pr-4 py-3 bg-obsidian border border-bone/20 rounded-[2px] text-bone placeholder:text-bone/20 text-sm focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-all font-geist"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full py-6">
            {loading ? 'Enviando...' : 'Enviar enlace'}
          </Button>

          <Link
            href="/auth/login"
            className="flex items-center justify-center gap-2 font-geist text-[10px] uppercase tracking-widest text-bone/40 hover:text-bone transition-colors"
          >
            <ArrowLeft size={12} /> Volver al inicio de sesión
          </Link>
        </form>
      )}
    </div>
  )
}
