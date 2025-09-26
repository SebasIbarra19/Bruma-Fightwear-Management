# 🎨 **Página de Showcase - Componentes UI BRUMA**

## 🚀 **Cómo Acceder**

1. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

2. **Abrir en el navegador:**
   ```
   http://localhost:3000/showcase
   ```

## 📋 **Contenido de la Página**

La página de showcase incluye **5 pestañas principales**:

### **📊 1. Overview**
- **StatsGrid compact**: Grid de 6 columnas con estadísticas principales
- **StatsGrid default**: Grid de 4 columnas con métricas adicionales
- **StatCards con variantes**: Diferentes colores y tendencias
- **Iconos representativos**: Emojis para visualización rápida

### **📝 2. Tipografía** 
- **PageTitle**: Títulos principales de página
- **SectionTitle**: Títulos de sección (H2, H3, H4)
- **Text**: Variantes de texto (default, muted, small, large)
- **Badges**: Estados con colores (success, error, warning, info)

### **🎨 3. Botones**
- **8 Variantes**: Primary, Default, Success, Destructive, Warning, Outline, Ghost, Link
- **5 Tamaños**: XL, Large, Default, Small, Icon
- **Combinaciones comunes**: Con iconos y casos de uso reales

### **📐 4. Layout**
- **Grid configurable**: Ejemplos de grids responsivos
- **Flex layouts**: Diferentes configuraciones de flexbox
- **Contenedores**: PageContainer y espaciado

### **📋 5. Formularios**
- **Formulario funcional**: Con inputs y validación básica
- **Preview en tiempo real**: Muestra los datos ingresados
- **Estados dinámicos**: Badges que cambian según la validación

## 🎯 **Características Destacadas**

### **🔄 Interactividad**
- ✅ **Tabs navegables** - Cambio entre secciones
- ✅ **Formulario funcional** - Estados en tiempo real
- ✅ **Responsive design** - Se adapta a móviles
- ✅ **Hover effects** - En botones y enlaces

### **📊 Datos de Ejemplo**
- **Estadísticas realistas**: Números y métricas similares al sistema real
- **Tendencias visuales**: Flechas y porcentajes de cambio
- **Iconos representativos**: Emojis que representan cada métrica

### **🎨 Estilo Consistente**
- **Paleta de colores BRUMA**: Azules, verdes, rojos coordinados
- **Espaciado uniforme**: Gap y padding consistente
- **Tipografía escalable**: Tamaños que funcionan en todos los dispositivos

## 🔧 **Uso de los Componentes**

### **Ejemplo de Código Mostrado:**

```tsx
// PageTitle
<PageTitle>Gestión de Proveedores</PageTitle>

// StatsGrid
<StatsGrid variant="compact">
  <StatCard title="Total" value={2847} variant="default" />
  <StatCard title="Activos" value={156} variant="success" />
</StatsGrid>

// Button con variante
<Button variant="primary" size="lg">
  Guardar Cambios
</Button>

// Flex layout
<Flex justify="between" align="center" gap={4}>
  <Text>Título</Text>
  <Button variant="primary">Acción</Button>
</Flex>
```

## 📈 **Beneficios Demostrados**

### **✅ Antes vs Después**

**❌ Código Repetitivo (Antes):**
```tsx
<h1 className="text-3xl font-bold text-gray-900">Título</h1>
<div className="grid grid-cols-1 md:grid-cols-6 gap-6">
  <div className="bg-white rounded-lg shadow p-6">
    <div className="text-2xl font-bold text-blue-600">15</div>
    <div className="text-sm text-gray-600">Total</div>
  </div>
  {/* Repetir 5 veces más... */}
</div>
```

**✅ Componentes Estandarizados (Después):**
```tsx
<PageTitle>Título</PageTitle>
<StatsGrid variant="compact">
  <StatCard title="Total" value={15} variant="info" />
</StatsGrid>
```

### **📊 Métricas de Mejora**
- **🔻 60% menos código** repetitivo
- **⚡ UI consistente** en toda la aplicación
- **🛠 Fácil mantenimiento** centralizado
- **🚀 Desarrollo más rápido** de nuevas páginas

## 🎨 **Casos de Uso Reales**

La página muestra cómo estos componentes se aplicarían en:

- ✅ **Páginas de dashboard** - Con estadísticas y métricas
- ✅ **Formularios de gestión** - Productos, proveedores, pedidos
- ✅ **Listas y tablas** - Con filtros y acciones
- ✅ **Navegación** - Breadcrumbs y tabs
- ✅ **Estados de aplicación** - Badges y alertas

## 🚀 **Próximos Pasos**

1. **Revisar la página showcase** en http://localhost:3000/showcase
2. **Probar la interactividad** en cada pestaña
3. **Comparar con páginas existentes** del proyecto
4. **Decidir páginas prioritarias** para migrar
5. **Implementar gradualmente** los componentes

---

**🎯 ¿Listo para estandarizar tu UI?** La página de showcase demuestra el potencial completo del sistema de componentes BRUMA.