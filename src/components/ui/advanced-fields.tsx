'use client'

import React, { forwardRef, useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

// ============= DATE INPUT =============
interface DateFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
  description?: string
  required?: boolean
}

export const DateField = forwardRef<HTMLInputElement, DateFieldProps>(
  ({ label, error, description, required, className, ...props }, ref) => {
    const { theme } = useTheme()

    return (
      <div className="space-y-2">
        <label 
          className="block text-sm font-medium"
          style={{ color: theme.colors.textPrimary }}
        >
          {label}
          {required && <span style={{ color: theme.colors.error }}>*</span>}
        </label>
        
        <div className="relative">
          <input
            ref={ref}
            type="date"
            className={`w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 ${
              error ? 'focus:ring-red-500' : 'focus:ring-blue-500'
            } ${className}`}
            style={{
              backgroundColor: theme.colors.background,
              borderColor: error ? theme.colors.error : theme.colors.border,
              color: theme.colors.textPrimary
            }}
            {...props}
          />
          
          {/* Calendar icon */}
          <div 
            className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
            style={{ color: theme.colors.textSecondary }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        
        {description && !error && (
          <p className="text-sm" style={{ color: theme.colors.textTertiary }}>
            {description}
          </p>
        )}
        
        {error && (
          <p className="text-sm flex items-center gap-1" style={{ color: theme.colors.error }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        )}
      </div>
    )
  }
)

DateField.displayName = 'DateField'

// ============= CHECKBOX =============
interface CheckboxFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
  description?: string
}

export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ label, error, description, className, ...props }, ref) => {
    const { theme } = useTheme()

    return (
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <div className="relative">
            <input
              ref={ref}
              type="checkbox"
              className={`w-5 h-5 rounded border-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                error ? 'focus:ring-red-500' : 'focus:ring-blue-500'
              } ${className}`}
              style={{
                backgroundColor: theme.colors.background,
                borderColor: error ? theme.colors.error : theme.colors.border,
                accentColor: theme.colors.primary
              }}
              {...props}
            />
          </div>
          
          <div className="flex-1">
            <label 
              className="text-sm font-medium cursor-pointer"
              style={{ color: theme.colors.textPrimary }}
            >
              {label}
            </label>
            
            {description && !error && (
              <p className="text-sm mt-1" style={{ color: theme.colors.textTertiary }}>
                {description}
              </p>
            )}
          </div>
        </div>
        
        {error && (
          <p className="text-sm flex items-center gap-1 ml-8" style={{ color: theme.colors.error }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        )}
      </div>
    )
  }
)

CheckboxField.displayName = 'CheckboxField'

// ============= FILE INPUT =============
interface FileFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
  description?: string
  required?: boolean
  maxSize?: number // in MB
  allowedTypes?: string[]
}

export const FileField = forwardRef<HTMLInputElement, FileFieldProps>(
  ({ label, error, description, required, maxSize, allowedTypes, className, onChange, ...props }, ref) => {
    const { theme } = useTheme()
    const [dragActive, setDragActive] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null
      setSelectedFile(file)
      if (onChange) onChange(e)
    }

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true)
      } else if (e.type === "dragleave") {
        setDragActive(false)
      }
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0]
        setSelectedFile(file)
        
        // Create a synthetic event
        const syntheticEvent = {
          ...e,
          target: { ...e.target, files: e.dataTransfer.files }
        } as any
        
        if (onChange) onChange(syntheticEvent)
      }
    }

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
      <div className="space-y-2">
        <label 
          className="block text-sm font-medium"
          style={{ color: theme.colors.textPrimary }}
        >
          {label}
          {required && <span style={{ color: theme.colors.error }}>*</span>}
        </label>
        
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${
            dragActive ? 'border-blue-400 bg-blue-50' : ''
          } ${error ? 'border-red-300' : 'border-gray-300'} hover:border-gray-400`}
          style={{
            backgroundColor: dragActive ? theme.colors.surfaceHover : theme.colors.surface,
            borderColor: error ? theme.colors.error : theme.colors.border
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={ref}
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            accept={allowedTypes?.join(',')}
            {...props}
          />
          
          <div className="text-center">
            <svg 
              className="mx-auto h-12 w-12 mb-4" 
              stroke="currentColor" 
              fill="none" 
              viewBox="0 0 48 48"
              style={{ color: theme.colors.textSecondary }}
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            
            {selectedFile ? (
              <div>
                <p className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                  {selectedFile.name}
                </p>
                <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm" style={{ color: theme.colors.textPrimary }}>
                  <span className="font-medium">Haz clic para subir</span> o arrastra y suelta
                </p>
                <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                  {allowedTypes ? `${allowedTypes.join(', ')}` : 'Cualquier archivo'}
                  {maxSize && ` (máx. ${maxSize}MB)`}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {description && !error && (
          <p className="text-sm" style={{ color: theme.colors.textTertiary }}>
            {description}
          </p>
        )}
        
        {error && (
          <p className="text-sm flex items-center gap-1" style={{ color: theme.colors.error }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        )}
      </div>
    )
  }
)

FileField.displayName = 'FileField'

// ============= RADIO GROUP =============
export interface RadioOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

interface RadioGroupFieldProps {
  label: string
  name: string
  options: RadioOption[]
  value?: string
  onChange?: (value: string) => void
  error?: string
  description?: string
  required?: boolean
  direction?: 'horizontal' | 'vertical'
}

export const RadioGroupField: React.FC<RadioGroupFieldProps> = ({
  label,
  name,
  options,
  value,
  onChange,
  error,
  description,
  required,
  direction = 'vertical'
}) => {
  const { theme } = useTheme()

  return (
    <div className="space-y-2">
      <label 
        className="block text-sm font-medium"
        style={{ color: theme.colors.textPrimary }}
      >
        {label}
        {required && <span style={{ color: theme.colors.error }}>*</span>}
      </label>
      
      <div className={`${direction === 'horizontal' ? 'flex flex-wrap gap-6' : 'space-y-3'}`}>
        {options.map((option) => (
          <div key={option.value} className="flex items-start gap-3">
            <div className="relative">
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange?.(e.target.value)}
                disabled={option.disabled}
                className={`w-5 h-5 border-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  error ? 'focus:ring-red-500' : 'focus:ring-blue-500'
                }`}
                style={{
                  backgroundColor: theme.colors.background,
                  borderColor: error ? theme.colors.error : theme.colors.border,
                  accentColor: theme.colors.primary
                }}
              />
            </div>
            
            <div className="flex-1">
              <label 
                className="text-sm font-medium cursor-pointer"
                style={{ 
                  color: option.disabled ? theme.colors.textTertiary : theme.colors.textPrimary 
                }}
              >
                {option.label}
              </label>
              
              {option.description && (
                <p className="text-sm mt-1" style={{ color: theme.colors.textTertiary }}>
                  {option.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {description && !error && (
        <p className="text-sm" style={{ color: theme.colors.textTertiary }}>
          {description}
        </p>
      )}
      
      {error && (
        <p className="text-sm flex items-center gap-1" style={{ color: theme.colors.error }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}