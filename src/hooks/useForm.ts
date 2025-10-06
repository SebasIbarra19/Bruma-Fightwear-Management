'use client'

import { useState, useCallback } from 'react'

// ============= VALIDATION RULES =============
export type ValidationRule = {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  email?: boolean
  custom?: (value: any) => string | null
}

export type FieldConfig = {
  [key: string]: ValidationRule
}

export type FormErrors = {
  [key: string]: string
}

export type FormData = {
  [key: string]: any
}

// ============= VALIDATION FUNCTIONS =============
const validateField = (value: any, rules: ValidationRule): string | null => {
  // Required validation
  if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return 'Este campo es requerido'
  }

  // Skip other validations if field is empty and not required
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return null
  }

  // String validations
  if (typeof value === 'string') {
    // Min length
    if (rules.minLength && value.length < rules.minLength) {
      return `Mínimo ${rules.minLength} caracteres`
    }

    // Max length
    if (rules.maxLength && value.length > rules.maxLength) {
      return `Máximo ${rules.maxLength} caracteres`
    }

    // Email validation
    if (rules.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return 'Formato de email inválido'
      }
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      return 'Formato inválido'
    }
  }

  // Number validations
  if (typeof value === 'number') {
    // Min value
    if (rules.min !== undefined && value < rules.min) {
      return `Valor mínimo: ${rules.min}`
    }

    // Max value
    if (rules.max !== undefined && value > rules.max) {
      return `Valor máximo: ${rules.max}`
    }
  }

  // Custom validation
  if (rules.custom) {
    return rules.custom(value)
  }

  return null
}

// ============= FORM HOOK =============
export const useForm = <T extends FormData>(
  initialData: T,
  validationConfig?: FieldConfig
) => {
  const [data, setData] = useState<T>(initialData)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<{[key: string]: boolean}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update field value
  const setValue = useCallback((field: keyof T, value: any) => {
    setData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: '' }))
    }
  }, [errors])

  // Mark field as touched
  const markFieldTouched = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field as string]: true }))
  }, [])

  // Validate single field
  const validateSingleField = useCallback((field: keyof T): string | null => {
    if (!validationConfig || !validationConfig[field as string]) {
      return null
    }

    const value = data[field]
    const rules = validationConfig[field as string]
    return validateField(value, rules)
  }, [data, validationConfig])

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    if (!validationConfig) return true

    const newErrors: FormErrors = {}
    let isValid = true

    Object.keys(validationConfig).forEach((field) => {
      const error = validateSingleField(field as keyof T)
      if (error) {
        newErrors[field] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [validationConfig, validateSingleField])

  // Handle field change
  const handleChange = useCallback((field: keyof T) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked
        : e.target.type === 'number'
        ? parseFloat(e.target.value) || ''
        : e.target.value

      setValue(field, value)
    }
  }, [setValue])

  // Handle field blur
  const handleBlur = useCallback((field: keyof T) => {
    return () => {
      markFieldTouched(field)
      
      // Validate on blur if field is configured
      if (validationConfig && validationConfig[field as string]) {
        const error = validateSingleField(field)
        if (error) {
          setErrors(prev => ({ ...prev, [field as string]: error }))
        }
      }
    }
  }, [markFieldTouched, validationConfig, validateSingleField])

  // Reset form
  const reset = useCallback((newData?: Partial<T>) => {
    setData(newData ? { ...initialData, ...newData } : initialData)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialData])

  // Submit form
  const handleSubmit = useCallback(async (
    onSubmit: (data: T) => Promise<void> | void,
    onError?: (errors: FormErrors) => void
  ) => {
    return async (e: React.FormEvent) => {
      e.preventDefault()
      
      setIsSubmitting(true)
      
      try {
        const isValid = validateForm()
        
        if (!isValid) {
          onError?.(errors)
          return
        }

        await onSubmit(data)
      } catch (error) {
        console.error('Form submission error:', error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }, [data, errors, validateForm])

  // Get field props for easy binding
  const getFieldProps = useCallback((field: keyof T) => {
    return {
      value: data[field] || '',
      onChange: handleChange(field),
      onBlur: handleBlur(field),
      error: touched[field as string] ? errors[field as string] : undefined
    }
  }, [data, handleChange, handleBlur, touched, errors])

  return {
    data,
    errors,
    touched,
    isSubmitting,
    setValue,
    markFieldTouched,
    validateField: validateSingleField,
    validateForm,
    handleChange,
    handleBlur,
    handleSubmit,
    getFieldProps,
    reset
  }
}

// ============= COMMON VALIDATION CONFIGS =============
export const commonValidations = {
  // Text fields
  requiredText: { required: true, minLength: 1 },
  name: { required: true, minLength: 2, maxLength: 50 },
  description: { maxLength: 500 },
  
  // Email
  email: { required: true, email: true },
  optionalEmail: { email: true },
  
  // Numbers
  requiredNumber: { required: true, min: 0 },
  price: { required: true, min: 0 },
  quantity: { required: true, min: 1 },
  percentage: { required: true, min: 0, max: 100 },
  
  // Phone
  phone: { 
    required: true, 
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
  },
  
  // Password
  password: { 
    required: true, 
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
  },
  
  // URL
  url: {
    pattern: /^https?:\/\/.+/
  }
}