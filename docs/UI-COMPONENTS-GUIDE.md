# 📚 **BRUMA UI Components - Guía de Estandarización**

## 🎯 **Resumen de Componentes Creados**

He creado un sistema de componentes estandarizado para eliminar la repetición de código en todo el proyecto BRUMA. Estos componentes reemplazan los patrones repetitivos encontrados en más de 20 páginas.

---

## 🔤 **Componentes de Tipografía** (`typography.tsx`)

### **PageTitle**
Reemplaza: `<h1 className="text-3xl font-bold text-gray-900">`
```tsx
<PageTitle>Gestión de Proveedores</PageTitle>
<PageTitle className="mb-4">Título con margen personalizado</PageTitle>
```

### **SectionTitle**
Reemplaza títulos de sección con diferentes niveles
```tsx
<SectionTitle level={2}>Título H2</SectionTitle>
<SectionTitle level={3}>Título H3</SectionTitle>
<SectionTitle level={4}>Título H4</SectionTitle>
```

### **Text**
Reemplaza: `<p className="text-sm text-gray-600">`
```tsx
<Text variant="default">Texto normal</Text>
<Text variant="muted">Texto descriptivo</Text>
<Text variant="small">Texto pequeño</Text>
<Text variant="large">Texto grande</Text>
```

### **Label** & **Badge**
```tsx
<Label htmlFor="input-id">Etiqueta</Label>
<Badge variant="success">Activo</Badge>
<Badge variant="error">Error</Badge>
<Badge variant="warning">Pendiente</Badge>
```

---

## 🎨 **Componente Button Mejorado** (`button.tsx`)

### **Nueva Variante Primary**
Reemplaza: `className="bg-blue-600 hover:bg-blue-700"`
```tsx
<Button variant="primary">Botón Principal</Button>
<Button variant="default">Botón Default (índigo)</Button>
<Button variant="success">Botón Éxito</Button>
<Button variant="destructive">Botón Peligroso</Button>
<Button variant="outline">Botón Contorno</Button>
```

### **Tamaños Disponibles**
```tsx
<Button size="sm">Pequeño</Button>
<Button size="default">Normal</Button>
<Button size="lg">Grande</Button>
<Button size="xl">Extra Grande</Button>
<Button size="icon">Icono</Button>
```

---

## 📐 **Componentes de Layout** (`layout.tsx`)

### **Grid**
Reemplaza: `<div className="grid grid-cols-1 md:grid-cols-3 gap-4">`
```tsx
<Grid cols={1} colsMd={3} gap={4}>
  {/* Contenido */}
</Grid>
```

### **StatsGrid**
Para grillas de estadísticas específicamente
```tsx
<StatsGrid variant="default">     {/* 2 cols → 4 cols md */}
<StatsGrid variant="compact">     {/* 1 col → 6 cols md */}  
<StatsGrid variant="wide">        {/* 2 cols → 4 cols md → 7 cols lg */}
```

### **PageContainer**
Reemplaza: `<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">`
```tsx
<PageContainer maxWidth="xl">
  {/* Contenido de la página */}
</PageContainer>
```

### **Flex**
Para layouts flexbox comunes
```tsx
<Flex direction="row" align="center" justify="between" gap={4}>
  {/* Elementos */}
</Flex>
```

---

## 📊 **Componentes de Estadísticas** (`stats.tsx`)

### **StatCard**
Reemplaza las cards de estadísticas repetitivas
```tsx
<StatCard
  title="Total Proveedores"
  value={15}
  variant="success"
  trend={{ value: 12.5, isPositive: true }}
/>
```

### **Metric**
Para métricas simples sin card
```tsx
<Metric label="Total" value={1234} />
```

### **MetricList**
Para listas de métricas
```tsx
<MetricList 
  metrics={[
    { label: "Activos", value: 12, icon: <CheckIcon /> },
    { label: "Inactivos", value: 3, icon: <XIcon /> }
  ]}
/>
```

### **SummaryCard**
Para cards con múltiples métricas
```tsx
<SummaryCard 
  title="Resumen General"
  metrics={[
    { label: "Total", value: 15 },
    { label: "Activos", value: 12 }
  ]}
/>
```

---

## 🚀 **Importación Simplificada**

Todos los componentes se exportan desde un archivo central:

```tsx
import { 
  PageTitle, 
  SectionTitle, 
  Text,
  Button,
  Grid,
  StatsGrid,
  StatCard,
  PageContainer,
  Flex
} from '@/components/ui'
```

---

## 💡 **Beneficios de la Estandarización**

### **✅ Antes vs Después**

**❌ ANTES (Repetitivo):**
```tsx
<h1 className="text-3xl font-bold text-gray-900">Título</h1>
<div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
  <div className="bg-white rounded-lg shadow p-6">
    <div className="text-2xl font-bold text-blue-600">15</div>
    <div className="text-sm text-gray-600">Total</div>
  </div>
  {/* Repetir 5 veces más... */}
</div>
<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2">
  Botón
</button>
```

**✅ DESPUÉS (Estandarizado):**
```tsx
<PageTitle>Título</PageTitle>
<StatsGrid variant="compact">
  <StatCard title="Total" value={15} variant="info" />
  <StatCard title="Activos" value={12} variant="success" />
  <StatCard title="Inactivos" value={3} variant="error" />
</StatsGrid>
<Button variant="primary">Botón</Button>
```

---

## 🎯 **Próximos Pasos**

1. **✅ Componentes creados** - Todos los componentes están listos
2. **🔄 En proceso** - Aplicar en páginas específicas
3. **⏳ Pendiente** - Migración completa del proyecto

### **Páginas Prioritarias para Migrar:**
- `suppliers/page.tsx` - 6 cards repetitivas
- `shipping/page.tsx` - 4 stats grids  
- `products/page.tsx` - múltiples botones primary
- `orders/page.tsx` - títulos y layouts repetitivos
- `inventory/page.tsx` - grillas de estadísticas

---

## 📈 **Impacto Esperado**

- **🔻 Reducción de código**: ~60% menos líneas repetitivas
- **⚡ Consistencia**: UI uniforme en todo el proyecto
- **🛠 Mantenibilidad**: Cambios centralizados
- **🚀 Velocidad**: Desarrollo más rápido de nuevas páginas