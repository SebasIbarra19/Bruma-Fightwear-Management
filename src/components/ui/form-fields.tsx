'use client'

import React, { forwardRef } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

// ============= TEXT INPUT =============
interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  description?: string
  required?: boolean
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
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
        
        <input
          ref={ref}
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

TextField.displayName = 'TextField'

// ============= TEXTAREA =============
interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  description?: string
  required?: boolean
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, error, description, required, className, rows = 4, ...props }, ref) => {
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
        
        <textarea
          ref={ref}
          rows={rows}
          className={`w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 resize-vertical ${
            error ? 'focus:ring-red-500' : 'focus:ring-blue-500'
          } ${className}`}
          style={{
            backgroundColor: theme.colors.background,
            borderColor: error ? theme.colors.error : theme.colors.border,
            color: theme.colors.textPrimary
          }}
          {...props}
        />
        
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

TextAreaField.displayName = 'TextAreaField'

// ============= SELECT =============
export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

interface SelectFieldProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label: string
  options: SelectOption[]
  error?: string
  description?: string
  required?: boolean
  placeholder?: string
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, options, error, description, required, placeholder, className, ...props }, ref) => {
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
          <select
            ref={ref}
            className={`w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 appearance-none ${
              error ? 'focus:ring-red-500' : 'focus:ring-blue-500'
            } ${className}`}
            style={{
              backgroundColor: theme.colors.background,
              borderColor: error ? theme.colors.error : theme.colors.border,
              color: theme.colors.textPrimary
            }}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Custom arrow */}
          <div 
            className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
            style={{ color: theme.colors.textSecondary }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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

SelectField.displayName = 'SelectField'

// ============= NUMBER INPUT =============
interface NumberFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
  description?: string
  required?: boolean
  prefix?: string
  suffix?: string
}

export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(
  ({ label, error, description, required, prefix, suffix, className, ...props }, ref) => {
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
          {prefix && (
            <div 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-medium"
              style={{ color: theme.colors.textSecondary }}
            >
              {prefix}
            </div>
          )}
          
          <input
            ref={ref}
            type="number"
            className={`w-full py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 ${
              error ? 'focus:ring-red-500' : 'focus:ring-blue-500'
            } ${
              prefix ? 'pl-8' : 'pl-4'
            } ${
              suffix ? 'pr-8' : 'pr-4'
            } ${className}`}
            style={{
              backgroundColor: theme.colors.background,
              borderColor: error ? theme.colors.error : theme.colors.border,
              color: theme.colors.textPrimary
            }}
            {...props}
          />
          
          {suffix && (
            <div 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm font-medium"
              style={{ color: theme.colors.textSecondary }}
            >
              {suffix}
            </div>
          )}
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

NumberField.displayName = 'NumberField'