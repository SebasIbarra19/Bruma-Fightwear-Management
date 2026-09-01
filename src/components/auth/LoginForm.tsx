'use client'

import { useState } from 'react'
import Link from 'next/link'
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
            <Link
              href="/auth/forgot"
              className="text-[10px] uppercase tracking-widest text-bone/40 hover:text-bone transition-colors"
            >
              Reset Protocol?
            </Link>
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

    </form>
  )
}
