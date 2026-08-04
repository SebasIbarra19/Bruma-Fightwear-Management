'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LoginFormProps {
  onSuccess: () => void
  onToggleMode: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!email || !password) {
      setError('Provide full clearance credentials.')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      if (authError) {
        setError(authError.message || 'Authorization failed.')
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
        <div className="relative group">
          <label className="block font-geist text-[10px] uppercase tracking-widest text-bone/50 mb-2 transition-colors group-focus-within:text-ember">
            Operative ID (Email)
          </label>
          <div className="relative">
            <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-bone/30 group-focus-within:text-ember transition-colors" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@brumafightwear.com"
              className="w-full pl-10 pr-4 py-3 bg-obsidian border border-bone/20 rounded-[2px] text-bone placeholder:text-bone/20 text-sm focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-all font-geist"
            />
          </div>
        </div>

        <div className="relative group">
          <div className="flex justify-between items-end mb-2">
            <label className="block font-geist text-[10px] uppercase tracking-widest text-bone/50 transition-colors group-focus-within:text-ember">
              Passkey
            </label>
            <button type="button" className="text-[10px] uppercase tracking-widest text-bone/40 hover:text-bone transition-colors">
              Reset Protocol?
            </button>
          </div>
          <div className="relative">
            <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-bone/30 group-focus-within:text-ember transition-colors" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-12 py-3 bg-obsidian border border-bone/20 rounded-[2px] text-bone placeholder:text-bone/20 text-sm focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-all font-geist tracking-widest"
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

      <Button
        type="submit"
        disabled={loading}
        className="w-full py-6 mt-4"
      >
        {loading ? "Decrypting..." : "Initialize Session"}
      </Button>

      <div className="relative py-2 flex items-center gap-4">
        <div className="h-[1px] flex-1 bg-bone/10" />
        <span className="text-[10px] font-geist text-bone/30 uppercase tracking-widest">External Node</span>
        <div className="h-[1px] flex-1 bg-bone/10" />
      </div>

      <button type="button" className="w-full flex items-center justify-center gap-3 py-3 bg-bone/5 border border-bone/20 rounded-[2px] hover:bg-bone/10 hover:border-bone/40 transition-all font-geist text-xs text-bone/80 uppercase tracking-widest">
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" className="opacity-60" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        </svg>
        Authenticate Google
      </button>
    </form>
  )
}
