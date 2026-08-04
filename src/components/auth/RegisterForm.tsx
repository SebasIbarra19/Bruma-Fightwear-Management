'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RegisterFormProps {
  onSuccess: () => void
  onToggleMode: () => void
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passkeys do not match.')
      setLoading(false)
      return
    }

    if (!acceptedTerms) {
      setError('You must accept the tactical directives.')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            first_name: formData.nombre,
            last_name: formData.apellido,
          }
        }
      })

      if (signUpError) {
        setError(signUpError.message || 'Registration error.')
        return
      }

      if (data.user) {
        onSuccess()
      }
    } catch (err) {
      setError('System Error. Re-initialize sequence.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className="p-4 rounded-[2px] bg-ember/10 border border-ember/30 text-ember text-sm font-geist">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 bg-ember rounded-full animate-pulse"></div>
            <span className="text-[10px] uppercase tracking-widest font-bold">Protocol Error</span>
          </div>
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        
        {/* NAME GRID */}
        <div className="grid grid-cols-2 gap-4">
          <div className="relative group">
            <label className="block font-geist text-[10px] uppercase tracking-widest text-bone/50 mb-2 transition-colors group-focus-within:text-ember">
              First Name
            </label>
            <div className="relative">
              <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-bone/30 group-focus-within:text-ember transition-colors" />
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                placeholder="John"
                className="w-full pl-10 pr-4 py-3 bg-obsidian border border-bone/20 rounded-[2px] text-bone placeholder:text-bone/20 text-sm focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-all font-geist"
              />
            </div>
          </div>
          
          <div className="relative group">
            <label className="block font-geist text-[10px] uppercase tracking-widest text-bone/50 mb-2 transition-colors group-focus-within:text-ember">
              Last Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.apellido}
                onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                placeholder="Doe"
                className="w-full px-4 py-3 bg-obsidian border border-bone/20 rounded-[2px] text-bone placeholder:text-bone/20 text-sm focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-all font-geist"
              />
            </div>
          </div>
        </div>

        {/* EMAIL */}
        <div className="relative group">
          <label className="block font-geist text-[10px] uppercase tracking-widest text-bone/50 mb-2 transition-colors group-focus-within:text-ember">
            Operative ID (Email)
          </label>
          <div className="relative">
            <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-bone/30 group-focus-within:text-ember transition-colors" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="you@brumafightwear.com"
              className="w-full pl-10 pr-4 py-3 bg-obsidian border border-bone/20 rounded-[2px] text-bone placeholder:text-bone/20 text-sm focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-all font-geist"
            />
          </div>
        </div>

        {/* PASSWORDS */}
        <div className="grid grid-cols-2 gap-4">
          <div className="relative group">
            <label className="block font-geist text-[10px] uppercase tracking-widest text-bone/50 mb-2 transition-colors group-focus-within:text-ember">
              Passkey
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-bone/30 group-focus-within:text-ember transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-obsidian border border-bone/20 rounded-[2px] text-bone placeholder:text-bone/20 text-sm focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-all font-geist tracking-widest"
              />
            </div>
          </div>
          
          <div className="relative group">
            <label className="block font-geist text-[10px] uppercase tracking-widest text-bone/50 mb-2 transition-colors group-focus-within:text-ember">
              Confirm Passkey
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                placeholder="••••••••"
                className="w-full pl-4 pr-10 py-3 bg-obsidian border border-bone/20 rounded-[2px] text-bone placeholder:text-bone/20 text-sm focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-all font-geist tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-bone/30 hover:text-ember transition-colors"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* TERMS */}
        <label className="flex items-start gap-3 cursor-pointer group mt-2">
          <div className="relative flex items-center justify-center w-4 h-4 mt-0.5 border border-bone/30 rounded-[2px] group-hover:border-ember transition-colors">
            <input 
              type="checkbox" 
              checked={acceptedTerms}
              onChange={() => setAcceptedTerms(!acceptedTerms)}
              className="absolute opacity-0 cursor-pointer"
            />
            {acceptedTerms && <div className="w-2 h-2 bg-ember rounded-[1px]"></div>}
          </div>
          <span className="font-geist text-xs text-bone/60 leading-relaxed group-hover:text-bone/80 transition-colors">
            I confirm acceptance of the <a href="#" className="text-ember hover:underline">Logistics Directives</a> and <a href="#" className="text-ember hover:underline">Clearance Policies</a>.
          </span>
        </label>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full py-6 mt-2"
      >
        {loading ? "Generating Clearance..." : "Request Access"}
      </Button>

    </form>
  )
}
