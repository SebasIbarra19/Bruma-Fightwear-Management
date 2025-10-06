'use client'

import React, { ReactNode } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CrudModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (data: any) => void
  title: string
  subtitle?: string
  submitLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  mode?: 'create' | 'edit' | 'view'
}

export function CrudModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  subtitle,
  submitLabel,
  cancelLabel = 'Cancelar',
  isLoading = false,
  size = 'md',
  children,
  maxWidth = 'md',
  mode = 'create'
}: CrudModalProps) {
  const { theme } = useTheme()

  // Determinar labels por defecto según el modo
  const getDefaultSubmitLabel = () => {
    switch (mode) {
      case 'create': return 'Crear'
      case 'edit': return 'Actualizar'
      case 'view': return 'Cerrar'
      default: return 'Guardar'
    }
  }

  const actualSubmitLabel = submitLabel || getDefaultSubmitLabel()

  // Mapeo de tamaños
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl'
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode !== 'view' && onSubmit) {
      onSubmit(e)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: theme.colors.overlay }}
        onClick={onClose}
      >
        {/* Modal Container */}
        <div 
          className={`w-full ${sizeClasses[maxWidth]} max-h-[90vh] overflow-y-auto`}
          onClick={(e) => e.stopPropagation()}
        >
          <Card 
            className="animate-in zoom-in-95 duration-300 shadow-2xl border-2"
            style={{ 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              boxShadow: theme.colors.shadow
            }}
          >
            <CardHeader className="relative">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ 
                  backgroundColor: theme.colors.surfaceHover,
                  color: theme.colors.textSecondary,
                }}
                disabled={isLoading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Header Content */}
              <div className="pr-12">
                <CardTitle 
                  className="text-xl font-semibold flex items-center gap-3"
                  style={{ color: theme.colors.textPrimary }}
                >
                  {/* Icon según el modo */}
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ 
                      backgroundColor: mode === 'create' ? theme.colors.primary + '20' :
                                       mode === 'edit' ? theme.colors.warning + '20' :
                                       theme.colors.info + '20',
                      color: mode === 'create' ? theme.colors.primary :
                             mode === 'edit' ? theme.colors.warning :
                             theme.colors.info
                    }}
                  >
                    {mode === 'create' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                    {mode === 'edit' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    )}
                    {mode === 'view' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </div>
                  {title}
                </CardTitle>

                {subtitle && (
                  <CardDescription 
                    className="mt-2"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {subtitle}
                  </CardDescription>
                )}
              </div>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {children}
              </CardContent>

              {/* Footer with Actions */}
              <div 
                className="px-6 py-4 border-t flex justify-end gap-3"
                style={{ borderColor: theme.colors.border }}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="min-w-20"
                >
                  {cancelLabel}
                </Button>

                {mode !== 'view' && (
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="min-w-20 font-medium"
                    style={{
                      backgroundColor: mode === 'create' ? theme.colors.primary : theme.colors.warning,
                      color: theme.colors.textInverse
                    }}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                          style={{ borderColor: theme.colors.textInverse + '40', borderTopColor: 'transparent' }}
                        />
                        Procesando...
                      </div>
                    ) : (
                      actualSubmitLabel
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  )
}