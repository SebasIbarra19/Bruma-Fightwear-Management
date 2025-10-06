# Sistema de Formularios CRUD

Este sistema proporciona componentes reutilizables para crear formularios CRUD (Create, Read, Update, Delete) con tema dinámico, validación y manejo de estado.

## 🚀 Componentes Principales

### 1. **CrudModal** - Modal Base
```tsx
import { CrudModal } from '@/components/ui/crud-modal'

<CrudModal
  isOpen={isOpen}
  onClose={() => setOpen(false)}
  title="Título del Modal"
  mode="create" // 'create' | 'edit' | 'view'
  isLoading={isSubmitting}
>
  {/* Contenido del formulario */}
</CrudModal>
```

### 2. **Campos de Formulario**

#### TextField - Campo de Texto
```tsx
import { TextField } from '@/components/ui/form-fields'

<TextField
  label="Nombre"
  placeholder="Ingresa el nombre"
  value={value}
  onChange={handleChange}
  error={error}
  required
  disabled={mode === 'view'}
/>
```

#### TextAreaField - Área de Texto
```tsx
import { TextAreaField } from '@/components/ui/form-fields'

<TextAreaField
  label="Descripción"
  placeholder="Describe..."
  value={value}
  onChange={handleChange}
  rows={3}
  error={error}
/>
```

#### SelectField - Lista Desplegable
```tsx
import { SelectField } from '@/components/ui/form-fields'

const options = [
  { value: 'option1', label: 'Opción 1' },
  { value: 'option2', label: 'Opción 2' }
]

<SelectField
  label="Categoría"
  options={options}
  value={value}
  onChange={handleChange}
  error={error}
  placeholder="Seleccionar..."
/>
```

#### NumberField - Campo Numérico
```tsx
import { NumberField } from '@/components/ui/form-fields'

<NumberField
  label="Precio"
  prefix="$"
  suffix="USD"
  value={value}
  onChange={handleChange}
  step="0.01"
  min="0"
  error={error}
/>
```

#### DateField - Campo de Fecha
```tsx
import { DateField } from '@/components/ui/advanced-fields'

<DateField
  label="Fecha de Lanzamiento"
  value={value}
  onChange={handleChange}
  error={error}
  required
/>
```

#### CheckboxField - Casilla de Verificación
```tsx
import { CheckboxField } from '@/components/ui/advanced-fields'

<CheckboxField
  label="Activo"
  description="Marcar para activar"
  checked={isChecked}
  onChange={handleChange}
/>
```

#### RadioGroupField - Grupo de Radio Buttons
```tsx
import { RadioGroupField } from '@/components/ui/advanced-fields'

const options = [
  { value: 'option1', label: 'Opción 1', description: 'Descripción opcional' },
  { value: 'option2', label: 'Opción 2' }
]

<RadioGroupField
  label="Selecciona una opción"
  name="radioGroup"
  options={options}
  value={selectedValue}
  onChange={setValue}
  direction="vertical" // 'horizontal' | 'vertical'
/>
```

#### FileField - Campo de Archivo
```tsx
import { FileField } from '@/components/ui/advanced-fields'

<FileField
  label="Subir Archivo"
  value={file}
  onChange={handleFileChange}
  maxSize={5} // MB
  allowedTypes={['.jpg', '.png', '.pdf']}
  error={error}
/>
```

## 🎯 Hook useForm - Manejo de Estado y Validación

```tsx
import { useForm, commonValidations } from '@/hooks/useForm'

// Definir el tipo de datos del formulario
interface ProductData {
  name: string
  price: number
  category: string
  isActive: boolean
}

// Configurar validaciones
const validationConfig = {
  name: { required: true, minLength: 2, maxLength: 100 },
  price: { required: true, min: 0 },
  category: { required: true },
  // isActive no necesita validación
}

// Usar el hook
const MyForm = () => {
  const {
    data,
    errors,
    isSubmitting,
    getFieldProps,
    handleSubmit,
    reset
  } = useForm<ProductData>(
    { name: '', price: 0, category: '', isActive: true }, // datos iniciales
    validationConfig // configuración de validación
  )

  const onSubmit = handleSubmit(async (formData) => {
    // Lógica para guardar datos
    await saveProduct(formData)
  })

  return (
    <form onSubmit={onSubmit}>
      <TextField
        label="Nombre"
        {...getFieldProps('name')} // Incluye value, onChange, onBlur, error
      />
      
      <NumberField
        label="Precio"
        {...getFieldProps('price')}
      />
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  )
}
```

## 📋 Validaciones Comunes

```tsx
import { commonValidations } from '@/hooks/useForm'

const validationConfig = {
  name: commonValidations.name, // required, minLength: 2, maxLength: 50
  email: commonValidations.email, // required + format
  phone: commonValidations.phone, // required + pattern
  price: commonValidations.price, // required, min: 0
  password: commonValidations.password, // minLength: 8 + pattern
  url: commonValidations.url, // URL format
}
```

## 🎨 Ejemplo Completo - Formulario de Producto

```tsx
import React, { useState } from 'react'
import { CrudModal } from '@/components/ui/crud-modal'
import { TextField, SelectField, NumberField } from '@/components/ui/form-fields'
import { DateField, CheckboxField } from '@/components/ui/advanced-fields'

interface Product {
  id?: string
  name: string
  category: string
  price: number
  stock: number
  isActive: boolean
  releaseDate: string
}

interface ProductFormProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit' | 'view'
  product?: Product
  onSave: (product: Product) => Promise<void>
}

export const ProductForm: React.FC<ProductFormProps> = ({
  isOpen,
  onClose,
  mode,
  product,
  onSave
}) => {
  const [formData, setFormData] = useState<Product>(
    product || {
      name: '',
      category: '',
      price: 0,
      stock: 0,
      isActive: true,
      releaseDate: ''
    }
  )
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const categoryOptions = [
    { value: 'electronics', label: 'Electrónicos' },
    { value: 'clothing', label: 'Ropa' },
    { value: 'books', label: 'Libros' }
  ]

  const handleChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'view') return

    setIsSubmitting(true)
    try {
      await onSave(formData)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CrudModal
      isOpen={isOpen}
      onClose={onClose}
      title="Producto"
      mode={mode}
      isLoading={isSubmitting}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Nombre"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          disabled={mode === 'view'}
          required
        />

        <SelectField
          label="Categoría"
          options={categoryOptions}
          value={formData.category}
          onChange={(e) => handleChange('category', e.target.value)}
          disabled={mode === 'view'}
        />

        <div className="grid grid-cols-2 gap-4">
          <NumberField
            label="Precio"
            prefix="$"
            value={formData.price}
            onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
            disabled={mode === 'view'}
          />

          <NumberField
            label="Stock"
            value={formData.stock}
            onChange={(e) => handleChange('stock', parseInt(e.target.value) || 0)}
            disabled={mode === 'view'}
          />
        </div>

        <DateField
          label="Fecha de Lanzamiento"
          value={formData.releaseDate}
          onChange={(e) => handleChange('releaseDate', e.target.value)}
          disabled={mode === 'view'}
        />

        <CheckboxField
          label="Producto Activo"
          checked={formData.isActive}
          onChange={(e) => handleChange('isActive', e.target.checked)}
          disabled={mode === 'view'}
        />

        {mode !== 'view' && (
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        )}
      </form>
    </CrudModal>
  )
}
```

## 🎨 Integración con Temas

Todos los componentes están integrados con el sistema de temas de la aplicación:

```tsx
// Los componentes automáticamente se adaptan al tema actual
const { theme } = useTheme()

// Los colores cambian según el tema:
// - theme.colors.primary
// - theme.colors.background
// - theme.colors.textPrimary
// - theme.colors.border
// - theme.colors.error
```

## 📝 Características Principales

### ✅ **Características Incluidas:**
- 🎨 **Integración completa con sistema de temas**
- 🔍 **Validación en tiempo real**
- 📱 **Diseño responsive**
- ♿ **Accesibilidad (ARIA labels, navegación por teclado)**
- 🔄 **Estados de carga**
- ❌ **Manejo de errores**
- 🎭 **Modos create/edit/view**
- 📋 **Campos reutilizables**
- 🎯 **Hook de manejo de formularios**
- 🔧 **Componentes configurables**

### 🚀 **Próximas Mejoras:**
- 🔍 **Campos de búsqueda con autocompletado**
- 📊 **Campos de rango (slider)**
- 🌈 **Selector de colores**
- 📅 **Selector de fecha/hora avanzado**
- 🏷️ **Campo de tags/etiquetas**
- 📷 **Vista previa de imágenes**
- 🔄 **Validación asíncrona**
- 💾 **Auto-guardado**

¡El sistema está listo para usar y es completamente extensible! 🎉