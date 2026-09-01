'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

/** Mismo mínimo que exige Supabase por defecto. */
const MIN_CLAVE = 6

export default function ResetPasswordPage() {
  const router = useRouter()
  const [clave, setClave] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [verClave, setVerClave] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [listo, setListo] = useState(false)

  // `null` = todavía verificando; el enlace se procesa de forma asíncrona.
  const [sesionValida, setSesionValida] = useState<boolean | null>(null)
  // Motivo tecnico del rechazo. Se muestra en pequeno: un 'enlace invalido'
  // sin causa deja al usuario sin nada que hacer ni que reportar.
  const [detalleError, setDetalleError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const establecer = async () => {
      // Si ya hay sesión (el usuario recargó la página tras consumir el
      // enlace), no hay nada que hacer.
      const { data: actual } = await supabase.auth.getSession()
      if (actual.session) {
        setSesionValida(true)
        return
      }

      // El enlace trae los tokens en el FRAGMENTO de la URL, que nunca viaja al
      // servidor — por eso esto se resuelve acá y no en el middleware.
      //
      // ⚠️ Se parsean a mano en vez de confiar en `detectSessionInUrl`: el
      // cliente de auth-helpers usa flujo PKCE, que espera un `?code=` en la
      // query y NO consume los tokens del hash del flujo implícito. Comprobado
      // en el navegador: tras cargar la página el hash seguía intacto, con sus
      // 921 caracteres y el `access_token` sin tocar.
      const params = new URLSearchParams(window.location.hash.slice(1))
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')

      if (!access_token || !refresh_token) {
        setSesionValida(false)
        return
      }

      const { error } = await supabase.auth.setSession({ access_token, refresh_token })
      if (error) {
        console.error('[reset] setSession falló:', error.message)
        setDetalleError(error.message)
        setSesionValida(false)
        return
      }

      // Se limpia el fragmento para que los tokens no queden en la barra de
      // direcciones ni en el historial una vez canjeados.
      window.history.replaceState(null, '', window.location.pathname)
      setSesionValida(true)
    }

    establecer()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (clave.length < MIN_CLAVE) {
      setError(`La clave debe tener al menos ${MIN_CLAVE} caracteres.`)
      return
    }
    if (clave !== confirmacion) {
      setError('Las dos claves no coinciden.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.updateUser({ password: clave })
      if (err) throw err
      setListo(true)
      // Se deja ver la confirmación antes de saltar; el enlace ya se consumió y
      // volver atrás no sirve de nada.
      setTimeout(() => router.push('/dashboard'), 1800)
    } catch (err: any) {
      setError(err.message || 'No se pudo cambiar la clave.')
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
          Nueva clave
        </h1>
      </div>

      {sesionValida === null && (
        <p className="font-geist text-sm text-bone/50">Verificando el enlace...</p>
      )}

      {sesionValida === false && (
        <div className="flex flex-col gap-4">
          <div className="px-4 py-4 bg-ember/10 border border-ember/30 rounded-[2px]">
            <p className="font-geist text-sm text-ember">
              Este enlace no es válido o ya venció.
            </p>
          </div>
          <p className="font-geist text-xs text-bone/40">
            Los enlaces duran una hora y sirven una sola vez. Pedí uno nuevo.
          </p>
          {detalleError && (
            <p className="font-geist text-[10px] text-bone/30">Detalle: {detalleError}</p>
          )}
          <Link
            href="/auth/forgot"
            className="flex items-center gap-2 font-geist text-[10px] uppercase tracking-widest text-bone/50 hover:text-bone transition-colors"
          >
            <ArrowLeft size={12} /> Pedir otro enlace
          </Link>
        </div>
      )}

      {sesionValida && listo && (
        <div className="px-4 py-4 bg-[#7ddb7d]/10 border border-[#7ddb7d]/30 rounded-[2px]">
          <p className="font-geist text-sm text-[#7ddb7d]">
            Clave actualizada. Entrando al panel...
          </p>
        </div>
      )}

      {sesionValida && !listo && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="px-4 py-3 bg-ember/10 border border-ember/30 rounded-[2px]">
              <p className="font-geist text-sm text-ember">{error}</p>
            </div>
          )}

          <div className="relative group">
            <label className="block font-geist text-[10px] uppercase tracking-widest text-bone/50 mb-2 transition-colors group-focus-within:text-ember">
              Nueva clave
            </label>
            <div className="relative">
              <Lock
                size={14}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-bone/30 group-focus-within:text-ember transition-colors"
              />
              <input
                type={verClave ? 'text' : 'password'}
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full pl-10 pr-12 py-3 bg-obsidian border border-bone/20 rounded-[2px] text-bone placeholder:text-bone/20 text-sm focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-all font-geist tracking-widest"
              />
              <button
                type="button"
                onClick={() => setVerClave(!verClave)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-bone/30 hover:text-ember transition-colors"
                aria-label={verClave ? 'Ocultar clave' : 'Mostrar clave'}
              >
                {verClave ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="relative group">
            <label className="block font-geist text-[10px] uppercase tracking-widest text-bone/50 mb-2 transition-colors group-focus-within:text-ember">
              Repetir clave
            </label>
            <div className="relative">
              <Lock
                size={14}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-bone/30 group-focus-within:text-ember transition-colors"
              />
              <input
                type={verClave ? 'text' : 'password'}
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full pl-10 pr-4 py-3 bg-obsidian border border-bone/20 rounded-[2px] text-bone placeholder:text-bone/20 text-sm focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-all font-geist tracking-widest"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full py-6">
            {loading ? 'Guardando...' : 'Guardar clave'}
          </Button>
        </form>
      )}
    </div>
  )
}
