'use client'

import React, { useState } from 'react'
import { ModernTable } from '../../components/ui/modern-table'
import { AboutUs } from '../../components/ui/about-us'
import { MetricsCharts } from '../../components/ui/metrics-charts'
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext'
import { 
  PageTitle, 
  SectionTitle, 
  Text, 
  Label, 
  Badge 
} from '../../components/ui/typography'
import { 
  Grid, 
  StatsGrid, 
  PageContainer, 
  Flex 
} from '../../components/ui/layout'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { 
  Sidebar, 
  Header, 
  ProgressSteps, 
  ProjectInfo, 
  Icons 
} from '../../components/ui/navigation'
import { 
  LoginForm, 
  RegisterForm 
} from '../../components/ui/auth-forms-clean'
import { ProgressBar, SteppedProgress } from '../../components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'

// Interfaces para los datos de ejemplo
interface Employee {
  id: number
  name: string
  position: string
  department: string
  salary: number
  status: 'active' | 'inactive' | 'onLeave'
  startDate: string
  email: string
  phone: string
  location: string
}

interface Product {
  id: number
  name: string
  category: string
  price: number
  stock: number
  status: 'available' | 'outOfStock' | 'discontinued'
  sku: string
  brand: string
  description: string
  weight: number
}

interface Customer {
  id: number
  name: string
  email: string
  totalOrders: number
  totalSpent: number
  status: 'active' | 'inactive' | 'blocked'
  joinDate: string
  lastOrder: string
  country: string
  vipLevel: 'bronze' | 'silver' | 'gold' | 'platinum'
}

export default function ComponentsShowcase() {
  return (
    <ThemeProvider>
      <ShowcaseContent />
    </ThemeProvider>
  )
}

function ShowcaseContent() {
  const { theme } = useTheme()
  const [activeSection, setActiveSection] = useState('overview')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tabScrollPosition, setTabScrollPosition] = useState(0)

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'employees', label: '👥 Empleados' },
    { id: 'products', label: '🥊 Productos' },
    { id: 'customers', label: '🛒 Clientes' },
    { id: 'navigation', label: '🧭 Navegación' },
    { id: 'auth', label: '🔐 Auth & Forms' },
    { id: 'progress', label: '📈 Progress & UI' },
    { id: 'statistics', label: '📊 Estadísticas' },
    { id: 'components', label: '🔧 Componentes' }
  ]

  const scrollTabs = (direction: 'left' | 'right') => {
    const container = document.getElementById('tabs-container')
    if (container) {
      const scrollAmount = 200
      const newPosition = direction === 'left' 
        ? Math.max(0, tabScrollPosition - scrollAmount)
        : Math.min(container.scrollWidth - container.clientWidth, tabScrollPosition + scrollAmount)
      
      container.scrollTo({ left: newPosition, behavior: 'smooth' })
      setTabScrollPosition(newPosition)
    }
  }

  // Datos de stats para el carrusel
  const statsData = [
    { title: 'Total Empleados', value: '156', trend: 'up' as const, icon: '👥' },
    { title: 'Productos Activos', value: '89', trend: 'up' as const, icon: '🥊' },
    { title: 'Clientes VIP', value: '42', trend: 'neutral' as const, icon: '💎' },
    { title: 'Ingresos Mes', value: '€125K', trend: 'up' as const, icon: '💰' },
    { title: 'Pedidos Pendientes', value: '23', trend: 'down' as const, icon: '📦' }
  ]

  // Datos de ejemplo para empleados
  const employeeData: Employee[] = [
    {
      id: 1,
      name: 'Ana García',
      position: 'Desarrolladora Senior',
      department: 'Tecnología',
      salary: 75000,
      status: 'active',
      startDate: '2022-01-15',
      email: 'ana.garcia@bruma.com',
      phone: '+34 600 123 456',
      location: 'Madrid, España'
    },
    {
      id: 2,
      name: 'Carlos López',
      position: 'Diseñador UX',
      department: 'Diseño',
      salary: 65000,
      status: 'active',
      startDate: '2021-06-10',
      email: 'carlos.lopez@bruma.com',
      phone: '+34 600 789 012',
      location: 'Barcelona, España'
    },
    {
      id: 3,
      name: 'María Rodríguez',
      position: 'Gerente de Ventas',
      department: 'Ventas',
      salary: 85000,
      status: 'onLeave',
      startDate: '2020-03-20',
      email: 'maria.rodriguez@bruma.com',
      phone: '+34 600 345 678',
      location: 'Valencia, España'
    }
  ]

  // Datos de ejemplo para productos
  const productData: Product[] = [
    {
      id: 1,
      name: 'Guantes de Boxeo Pro',
      category: 'Boxeo',
      price: 89.99,
      stock: 25,
      status: 'available',
      sku: 'BXG-001',
      brand: 'BRUMA',
      description: 'Guantes profesionales de cuero sintético',
      weight: 0.8
    },
    {
      id: 2,
      name: 'Saco de Entrenamiento',
      category: 'Equipamiento',
      price: 199.99,
      stock: 0,
      status: 'outOfStock',
      sku: 'EQP-002',
      brand: 'BRUMA',
      description: 'Saco pesado para entrenamiento intensivo',
      weight: 35.0
    }
  ]

  // Datos de ejemplo para clientes
  const customerData: Customer[] = [
    {
      id: 1,
      name: 'Roberto Sánchez',
      email: 'roberto@email.com',
      totalOrders: 15,
      totalSpent: 1250.75,
      status: 'active',
      joinDate: '2023-01-15',
      lastOrder: '2024-01-10',
      country: 'España',
      vipLevel: 'gold'
    },
    {
      id: 2,
      name: 'Ahmed Hassan',
      email: 'ahmed.hassan@email.com',
      totalOrders: 28,
      totalSpent: 3200.00,
      status: 'active',
      joinDate: '2022-05-10',
      lastOrder: '2024-01-12',
      country: 'Marruecos',
      vipLevel: 'platinum'
    }
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header 
        onMenuClick={() => console.log('Menu clicked')}
        user={{ 
          name: 'BRUMA Admin', 
          role: 'Administrador'
        }}
      />
      
      {/* Main Content */}
      <PageContainer className="flex-1">
          {/* Header con Navegación */}
          <div className="mb-8">
            <PageTitle>🎨 BRUMA Complete UI Showcase</PageTitle>
            <Text className="text-gray-400 mb-6">
              Sistema integrado de componentes trabajando en armonía
            </Text>

        {/* Navegación por pestañas con carrusel discreto */}
        <div className="relative mb-8">
          <div 
            className="flex items-center rounded-lg p-1"
            style={{ backgroundColor: theme.colors.surface }}
          >
            <button
              onClick={() => scrollTabs('left')}
              className="flex items-center justify-center w-8 h-8 rounded-full opacity-60 hover:opacity-100 transition-all duration-200 mr-2"
              style={{ color: theme.colors.textSecondary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = theme.colors.textPrimary
                e.currentTarget.style.backgroundColor = theme.colors.surfaceHover
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = theme.colors.textSecondary
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
              aria-label="Scroll tabs left"
            >
              ‹
            </button>
            
            <div 
              id="tabs-container"
              className="flex overflow-x-auto scrollbar-none flex-1 gap-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {tabs.map(tab => (
                <Button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  variant={activeSection === tab.id ? 'primary' : 'ghost'}
                  className="flex-shrink-0 px-4 py-2 text-sm font-medium transition-all whitespace-nowrap"
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            <button
              onClick={() => scrollTabs('right')}
              className="flex items-center justify-center w-8 h-8 rounded-full opacity-60 hover:opacity-100 transition-all duration-200 ml-2"
              style={{ 
                color: theme.colors.textSecondary
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = theme.colors.textPrimary
                e.currentTarget.style.backgroundColor = theme.colors.surfaceHover
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = theme.colors.textSecondary
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
              aria-label="Scroll tabs right"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <div className="space-y-8">
          <SectionTitle>📊 Panel de Control BRUMA</SectionTitle>
          
          {/* Stats Grid */}
          <StatsGrid>
            <Card 
              style={{
                background: `linear-gradient(to bottom right, ${theme.colors.primary}, ${theme.colors.primaryHover})`,
                borderColor: theme.colors.primary
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription style={{ color: theme.colors.textInverse }}>Total Empleados</CardDescription>
                  <span className="text-2xl">👥</span>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl text-white">156</CardTitle>
                <Badge 
                  style={{
                    backgroundColor: theme.colors.success + '20',
                    color: theme.colors.success
                  }}
                  className="mt-2"
                >
                  ↗ +12% este mes
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-600 to-green-700 border-green-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-green-100">Productos Activos</CardDescription>
                  <span className="text-2xl">🥊</span>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl text-white">89</CardTitle>
                <Badge 
                  style={{
                    backgroundColor: theme.colors.success + '20',
                    color: theme.colors.success
                  }}
                  className="mt-2"
                >
                  ↗ +5% nuevo stock
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-purple-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-purple-100">Clientes VIP</CardDescription>
                  <span className="text-2xl">💎</span>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl text-white">42</CardTitle>
                <Badge 
                  style={{
                    backgroundColor: theme.colors.warning + '20',
                    color: theme.colors.warning
                  }}
                  className="mt-2"
                >
                  → estable
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-600 to-orange-700 border-orange-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-orange-100">Ingresos Mes</CardDescription>
                  <span className="text-2xl">💰</span>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl text-white">€125K</CardTitle>
                <Badge 
                  style={{
                    backgroundColor: theme.colors.success + '20',
                    color: theme.colors.success
                  }}
                  className="mt-2"
                >
                  ↗ +18% vs mes pasado
                </Badge>
              </CardContent>
            </Card>
          </StatsGrid>

          {/* About Us Component */}
          <AboutUs />
        </div>
      )}

      {/* Employees Section */}
      {activeSection === 'employees' && (
        <div className="space-y-6">
          <SectionTitle>👥 Gestión de Empleados BRUMA</SectionTitle>
          <Text className="text-gray-400">
            Sistema completo de gestión de personal con detalles expandibles y carrusel de métricas
          </Text>
          
          <ModernTable<Employee>
            data={employeeData}
            title="Equipo BRUMA"
            subtitle="Personal activo del equipo de trabajo"
            carouselItems={statsData.slice(0, 3)}
            columns={[
              { 
                key: 'name', 
                title: 'Nombre', 
                sortable: true 
              },
              { 
                key: 'position', 
                title: 'Posición', 
                sortable: true 
              },
              { 
                key: 'department', 
                title: 'Departamento', 
                sortable: true 
              },
              { 
                key: 'salary', 
                title: 'Salario', 
                sortable: true,
                render: (value) => (
                  <Badge 
                    style={{
                      backgroundColor: theme.colors.success + '20',
                      color: theme.colors.success,
                      fontFamily: 'monospace'
                    }}
                  >
                    €{value.toLocaleString()}
                  </Badge>
                )
              },
              { 
                key: 'status', 
                title: 'Estado', 
                sortable: true,
                render: (value) => (
                  <Badge 
                    style={{
                      backgroundColor: value === 'active' ? theme.colors.success + '20' :
                                     value === 'onLeave' ? theme.colors.warning + '20' :
                                     theme.colors.error + '20',
                      color: value === 'active' ? theme.colors.success :
                             value === 'onLeave' ? theme.colors.warning :
                             theme.colors.error
                    }}
                  >
                    {value === 'active' ? '✅ Activo' :
                     value === 'onLeave' ? '🏖️ Permiso' :
                     '❌ Inactivo'}
                  </Badge>
                )
              }
            ]}
            renderExpandedRow={(employee: Employee) => (
              <div 
                className="rounded-lg p-6"
                style={{ backgroundColor: theme.colors.surface }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium uppercase tracking-wide border-b pb-2" style={{ color: theme.colors.primary, borderColor: theme.colors.border }}>Información de Contacto</h4>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs uppercase tracking-wide" style={{ color: theme.colors.textTertiary }}>Email</Label>
                        <Text className="font-mono text-sm" style={{ color: theme.colors.textPrimary }}>{employee.email}</Text>
                      </div>
                      <div>
                        <Label className="text-xs uppercase tracking-wide" style={{ color: theme.colors.textTertiary }}>Teléfono</Label>
                        <Text className="text-sm" style={{ color: theme.colors.textPrimary }}>{employee.phone}</Text>
                      </div>
                      <div>
                        <Label className="text-xs uppercase tracking-wide" style={{ color: theme.colors.textTertiary }}>Ubicación</Label>
                        <Text className="text-sm" style={{ color: theme.colors.textPrimary }}>{employee.location}</Text>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium uppercase tracking-wide border-b pb-2" style={{ color: theme.colors.secondary, borderColor: theme.colors.border }}>Datos Laborales</h4>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs uppercase tracking-wide" style={{ color: theme.colors.textTertiary }}>Fecha de Ingreso</Label>
                        <Text className="text-sm" style={{ color: theme.colors.textPrimary }}>{new Date(employee.startDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                      </div>
                      <div>
                        <Label className="text-xs uppercase tracking-wide" style={{ color: theme.colors.textTertiary }}>Salario</Label>
                        <Text className="text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>€{employee.salary.toLocaleString()}</Text>
                      </div>
                      <div>
                        <Label className="text-xs uppercase tracking-wide" style={{ color: theme.colors.textTertiary }}>ID de Empleado</Label>
                        <Text className="text-sm font-mono" style={{ color: theme.colors.textPrimary }}>#{employee.id.toString().padStart(4, '0')}</Text>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium uppercase tracking-wide border-b pb-2" style={{ color: theme.colors.info, borderColor: theme.colors.border }}>Acciones Rápidas</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="minimal" size="sm" className="justify-start">
                        <Icons.User className="w-3 h-3 mr-2" />
                        Ver Perfil
                      </Button>
                      <Button variant="minimal" size="sm" className="justify-start">
                        <Icons.Settings className="w-3 h-3 mr-2" />
                        Editar
                      </Button>
                      <Button variant="minimal" size="sm" className="justify-start">
                        <Icons.Notification className="w-3 h-3 mr-2" />
                        Mensaje
                      </Button>
                      <Button variant="minimal" size="sm" className="justify-start">
                        <Icons.Analytics className="w-3 h-3 mr-2" />
                        Historial
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      )}

      {/* Products Section */}
      {activeSection === 'products' && (
        <div className="space-y-6">
          <SectionTitle>🥊 Catálogo de Productos BRUMA</SectionTitle>
          <Text className="text-gray-400">
            Inventario completo con gestión de stock y estados avanzados
          </Text>
          
          <ModernTable<Product>
            data={productData}
            title="Productos BRUMA"
            subtitle="Catálogo de equipamiento de boxeo"
            carouselItems={[
              { title: 'Productos Totales', value: '89', trend: 'up', icon: '🥊' },
              { title: 'En Stock', value: '67', trend: 'up', icon: '📦' },
              { title: 'Agotados', value: '12', trend: 'down', icon: '⚠️' },
              { title: 'Guantes Boxing', value: '24', trend: 'up', icon: '🥊' },
              { title: 'Equipos Prot.', value: '18', trend: 'up', icon: '🛡️' },
              { title: 'Sacos Entren.', value: '15', trend: 'neutral', icon: '🏋️' }
            ]}
            columns={[
              { key: 'name', title: 'Producto', sortable: true },
              { key: 'category', title: 'Categoría', sortable: true },
              { 
                key: 'price', 
                title: 'Precio', 
                sortable: true,
                render: (value) => (
                  <Badge 
                    style={{
                      backgroundColor: theme.colors.primary + '20',
                      color: theme.colors.primary,
                      fontFamily: 'monospace'
                    }}
                  >
                    €{value}
                  </Badge>
                )
              },
              { 
                key: 'stock', 
                title: 'Stock', 
                sortable: true,
                render: (value) => (
                  <Badge 
                    style={{
                      backgroundColor: value > 50 ? theme.colors.success + '20' :
                                     value > 10 ? theme.colors.warning + '20' :
                                     value > 0 ? theme.colors.info + '20' :
                                     theme.colors.error + '20',
                      color: value > 50 ? theme.colors.success :
                             value > 10 ? theme.colors.warning :
                             value > 0 ? theme.colors.info :
                             theme.colors.error,
                      fontWeight: '600'
                    }}
                  >
                    {value}
                  </Badge>
                )
              },
              { 
                key: 'status', 
                title: 'Estado', 
                sortable: true,
                render: (value) => (
                  <Badge 
                    style={{
                      backgroundColor: value === 'available' ? theme.colors.success + '20' :
                                     value === 'outOfStock' ? theme.colors.error + '20' :
                                     theme.colors.textSecondary + '20',
                      color: value === 'available' ? theme.colors.success :
                             value === 'outOfStock' ? theme.colors.error :
                             theme.colors.textSecondary
                    }}
                  >
                    {value === 'available' ? '✅ Disponible' :
                     value === 'outOfStock' ? '❌ Sin Stock' :
                     '⏹️ Descontinuado'}
                  </Badge>
                )
              }
            ]}
            renderExpandedRow={(product: Product) => (
              <div style={{ backgroundColor: theme.colors.surface, borderRadius: '8px', padding: '24px' }}>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium uppercase tracking-wide border-b pb-2" style={{ color: theme.colors.primary, borderColor: theme.colors.border }}>Detalles del Producto</h4>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs uppercase tracking-wide" style={{ color: theme.colors.textTertiary }}>SKU</Label>
                        <Text className="font-mono text-sm" style={{ color: theme.colors.textPrimary }}>{product.sku}</Text>
                      </div>
                      <div>
                        <Label className="text-xs uppercase tracking-wide" style={{ color: theme.colors.textTertiary }}>Marca</Label>
                        <Text className="text-sm" style={{ color: theme.colors.textPrimary }}>{product.brand}</Text>
                      </div>
                      <div>
                        <Label className="text-xs uppercase tracking-wide" style={{ color: theme.colors.textTertiary }}>Peso</Label>
                        <Text className="text-sm" style={{ color: theme.colors.textPrimary }}>{product.weight} kg</Text>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium uppercase tracking-wide border-b pb-2" style={{ color: theme.colors.secondary, borderColor: theme.colors.border }}>Inventario</h4>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs uppercase tracking-wide" style={{ color: theme.colors.textTertiary }}>Precio</Label>
                        <Text className="text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>€{product.price}</Text>
                      </div>
                      <div>
                        <Label className="text-xs uppercase tracking-wide" style={{ color: theme.colors.textTertiary }}>Stock</Label>
                        <Text className="text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>{product.stock} unidades</Text>
                      </div>
                      <div>
                        <Label className="text-xs uppercase tracking-wide" style={{ color: theme.colors.textTertiary }}>Valor Total</Label>
                        <Text className="text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>€{(product.price * product.stock).toFixed(2)}</Text>
                      </div>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-2 xl:col-span-1 space-y-3">
                    <h4 className="text-sm font-medium uppercase tracking-wide border-b pb-2" style={{ color: theme.colors.info, borderColor: theme.colors.border }}>Descripción</h4>
                    <Text className="text-sm leading-relaxed" style={{ color: theme.colors.textPrimary }}>{product.description}</Text>
                    
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Button variant="minimal" size="sm" className="justify-start">
                        <Icons.Products className="w-3 h-3 mr-2" />
                        Ver Detalles
                      </Button>
                      <Button variant="minimal" size="sm" className="justify-start">
                        <Icons.Settings className="w-3 h-3 mr-2" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      )}

      {/* Customers Section */}
      {activeSection === 'customers' && (
        <div className="space-y-6">
          <SectionTitle>🛒 Base de Clientes BRUMA</SectionTitle>
          <Text className="text-gray-400">
            Gestión completa de clientes con niveles VIP y métricas de compra
          </Text>
          
          <ModernTable<Customer>
            data={customerData}
            title="Clientes BRUMA"
            subtitle="Base de datos de clientes registrados"
            carouselItems={[
              { title: 'Clientes Totales', value: '1.2K', trend: 'up', icon: '👥' },
              { title: 'Clientes VIP', value: '42', trend: 'up', icon: '💎' },
              { title: 'Clientes Nuevos', value: '156', trend: 'up', icon: '🆕' },
              { title: 'Clientes Platino', value: '8', trend: 'up', icon: '💸' },
              { title: 'Compras este mes', value: '324', trend: 'up', icon: '🛍️' },
              { title: 'Satisfacción', value: '97%', trend: 'up', icon: '⭐' }
            ]}
            columns={[
              { key: 'name', title: 'Cliente', sortable: true },
              { key: 'email', title: 'Email', sortable: true },
              { 
                key: 'totalOrders', 
                title: 'Pedidos', 
                sortable: true,
                render: (value) => (
                  <Badge 
                    style={{
                      backgroundColor: theme.colors.primary + '20',
                      color: theme.colors.primary,
                      fontWeight: '600'
                    }}
                  >
                    {value}
                  </Badge>
                )
              },
              { 
                key: 'totalSpent', 
                title: 'Total Gastado', 
                sortable: true,
                render: (value) => (
                  <Badge 
                    style={{
                      backgroundColor: theme.colors.success + '20',
                      color: theme.colors.success,
                      fontFamily: 'monospace'
                    }}
                  >
                    €{value.toLocaleString()}
                  </Badge>
                )
              },
              { 
                key: 'vipLevel', 
                title: 'Nivel VIP', 
                sortable: true,
                render: (value) => (
                  <Badge 
                    style={{
                      backgroundColor: value === 'platinum' ? theme.colors.secondary + '20' :
                                     value === 'gold' ? theme.colors.warning + '20' :
                                     value === 'silver' ? theme.colors.textSecondary + '20' :
                                     theme.colors.info + '20',
                      color: value === 'platinum' ? theme.colors.secondary :
                             value === 'gold' ? theme.colors.warning :
                             value === 'silver' ? theme.colors.textSecondary :
                             theme.colors.info
                    }}
                  >
                    {value === 'platinum' ? '💎 Platino' :
                     value === 'gold' ? '🥇 Oro' :
                     value === 'silver' ? '🥈 Plata' :
                     '🥉 Bronce'}
                  </Badge>
                )
              }
            ]}
            renderExpandedRow={(customer: Customer) => (
              <div className="bg-gray-900/80 rounded-lg p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-cyan-400 uppercase tracking-wide border-b border-gray-700 pb-2">Información Personal</h4>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-gray-500 uppercase tracking-wide">Email</Label>
                        <Text className="text-white font-mono text-sm">{customer.email}</Text>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 uppercase tracking-wide">País</Label>
                        <Text className="text-white text-sm">{customer.country}</Text>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 uppercase tracking-wide">Miembro desde</Label>
                        <Text className="text-white text-sm">{new Date(customer.joinDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-green-400 uppercase tracking-wide border-b border-gray-700 pb-2">Historial de Compras</h4>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-gray-500 uppercase tracking-wide">Total Gastado</Label>
                        <Text className="text-white text-sm font-semibold">€{customer.totalSpent.toLocaleString()}</Text>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 uppercase tracking-wide">Total Pedidos</Label>
                        <Text className="text-white text-sm font-semibold">{customer.totalOrders}</Text>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 uppercase tracking-wide">Promedio por Pedido</Label>
                        <Text className="text-white text-sm font-semibold">€{(customer.totalSpent / customer.totalOrders).toFixed(2)}</Text>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 uppercase tracking-wide">Último Pedido</Label>
                        <Text className="text-white text-sm">{new Date(customer.lastOrder).toLocaleDateString('es-ES')}</Text>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-purple-400 uppercase tracking-wide border-b border-gray-700 pb-2">Acción y Marketing</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="minimal" size="sm" className="justify-start">
                        <Icons.User className="w-3 h-3 mr-2" />
                        Ver Perfil
                      </Button>
                      <Button variant="minimal" size="sm" className="justify-start">
                        <Icons.Notification className="w-3 h-3 mr-2" />
                        Enviar Email
                      </Button>
                      <Button variant="minimal" size="sm" className="justify-start">
                        <Icons.Analytics className="w-3 h-3 mr-2" />
                        Historial
                      </Button>
                      <Button variant="minimal" size="sm" className="justify-start">
                        <Icons.Trophy className="w-3 h-3 mr-2" />
                        Promociones
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      )}

      {/* 📊 Estadísticas */}
      {activeSection === 'statistics' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-6" style={{ color: theme.colors.primary }}>📊 Dashboard de Estadísticas</h2>
            <Text className="text-gray-400 mb-8">
              Visualizaciones interactivas de datos del negocio con gráficos y métricas clave
            </Text>
          </div>

          {/* KPIs Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Ventas Totales</CardDescription>
                <CardTitle className="text-3xl text-green-400">€24,580</CardTitle>
              </CardHeader>
              <CardContent>
                <Text className="text-sm text-green-400">↗ +12% vs mes anterior</Text>
                <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-green-400 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Clientes Nuevos</CardDescription>
                <CardTitle className="text-3xl" style={{ color: theme.colors.primary }}>142</CardTitle>
              </CardHeader>
              <CardContent>
                <Text className="text-sm" style={{ color: theme.colors.primary }}>↗ +8% vs mes anterior</Text>
                <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                  <div className="h-2 rounded-full" style={{ backgroundColor: theme.colors.primary, width: '60%' }}></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Productos Vendidos</CardDescription>
                <CardTitle className="text-3xl text-yellow-400">1,267</CardTitle>
              </CardHeader>
              <CardContent>
                <Text className="text-sm text-yellow-400">↗ +15% vs mes anterior</Text>
                <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Tasa de Conversión</CardDescription>
                <CardTitle className="text-3xl text-purple-400">3.2%</CardTitle>
              </CardHeader>
              <CardContent>
                <Text className="text-sm text-red-400">↘ -2% vs mes anterior</Text>
                <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-purple-400 h-2 rounded-full" style={{ width: '32%' }}></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos Principales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gráfico de Ventas */}
            <Card>
              <CardHeader>
                <CardTitle>Ventas Mensuales 2024</CardTitle>
                <CardDescription>Evolución de ventas por mes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-2 p-4">
                  {[
                    { month: 'Ene', value: 4200 },
                    { month: 'Feb', value: 3800 },
                    { month: 'Mar', value: 5100 },
                    { month: 'Abr', value: 4600 },
                    { month: 'May', value: 5800 },
                    { month: 'Jun', value: 6200 },
                    { month: 'Jul', value: 7100 },
                    { month: 'Ago', value: 6800 },
                    { month: 'Sep', value: 7400 },
                    { month: 'Oct', value: 8200 },
                    { month: 'Nov', value: 7900 },
                    { month: 'Dic', value: 8600 }
                  ].map((data, index) => (
                    <div key={data.month} className="flex flex-col items-center group">
                      <div
                        className="bg-gradient-to-t from-blue-600 to-blue-400 rounded-t min-w-[20px] hover:from-blue-500 hover:to-blue-300 transition-colors cursor-pointer relative"
                        style={{ height: `${(data.value / 8600) * 200}px` }}
                        title={`${data.month}: €${data.value.toLocaleString()}`}
                      >
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 opacity-0 group-hover:opacity-100">
                          €{data.value.toLocaleString()}
                        </div>
                      </div>
                      <Text className="text-xs mt-2 text-gray-400">{data.month}</Text>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de Productos */}
            <Card>
              <CardHeader>
                <CardTitle>Productos Más Vendidos</CardTitle>
                <CardDescription>Top 5 productos por unidades</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Guantes de Boxeo Pro', sales: 245, color: 'bg-green-400' },
                    { name: 'Pantalones MMA Elite', sales: 198, color: 'bg-primary' },
                    { name: 'Camiseta BRUMA Logo', sales: 167, color: 'bg-yellow-400' },
                    { name: 'Vendas Profesionales', sales: 134, color: 'bg-purple-400' },
                    { name: 'Protector Bucal', sales: 89, color: 'bg-pink-400' }
                  ].map((product, index) => (
                    <div key={product.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-3 h-3 rounded-full ${product.color}`}></div>
                        <Text className="text-sm">{product.name}</Text>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-32 bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${product.color}`}
                            style={{ width: `${(product.sales / 245) * 100}%` }}
                          ></div>
                        </div>
                        <Text className="text-sm font-mono text-gray-300 w-8">
                          {product.sales}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Análisis Detallado */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Distribución por Región */}
            <Card>
              <CardHeader>
                <CardTitle>Ventas por Región</CardTitle>
                <CardDescription>Distribución geográfica</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { region: 'Madrid', percentage: 35, amount: 8603 },
                    { region: 'Barcelona', percentage: 28, amount: 6882 },
                    { region: 'Valencia', percentage: 15, amount: 3687 },
                    { region: 'Sevilla', percentage: 12, amount: 2950 },
                    { region: 'Otros', percentage: 10, amount: 2458 }
                  ].map((region) => (
                    <div key={region.region} className="space-y-1">
                      <Flex className="justify-between">
                        <Text className="text-sm">{region.region}</Text>
                        <Text className="text-sm text-gray-400">€{region.amount.toLocaleString()}</Text>
                      </Flex>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 rounded-full"
                          style={{ width: `${region.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Horarios de Mayor Actividad */}
            <Card>
              <CardHeader>
                <CardTitle>Actividad por Hora</CardTitle>
                <CardDescription>Picos de tráfico diario</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-40 flex items-end justify-between gap-1">
                  {Array.from({ length: 24 }, (_, hour) => {
                    const activity = Math.sin((hour - 6) * 0.3) * 40 + 50 + Math.random() * 20;
                    return (
                      <div key={hour} className="flex flex-col items-center group">
                        <div
                          className="bg-gradient-to-t from-purple-600 to-purple-400 rounded-t min-w-[8px] hover:from-purple-500 hover:to-purple-300 transition-colors cursor-pointer"
                          style={{ height: `${activity}%` }}
                          title={`${hour}:00 - ${Math.round(activity)}% actividad`}
                        ></div>
                        {hour % 4 === 0 && (
                          <Text className="text-xs mt-1 text-gray-400">{hour}h</Text>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Métricas de Rendimiento Avanzadas */}
            <MetricsCharts />
          </div>

          {/* Tabla de Últimas Transacciones */}
          <Card>
            <CardHeader>
              <CardTitle>Últimas Transacciones</CardTitle>
              <CardDescription>Actividad reciente del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <ModernTable
                data={[
                  {
                    id: 'TXN-2024-001',
                    customer: 'Carlos Rodríguez',
                    amount: 289.99,
                    product: 'Kit Completo MMA',
                    status: 'completed',
                    date: '2024-01-15 14:32'
                  },
                  {
                    id: 'TXN-2024-002',
                    customer: 'Ana García',
                    amount: 159.50,
                    product: 'Guantes Boxeo Pro',
                    status: 'pending',
                    date: '2024-01-15 13:45'
                  },
                  {
                    id: 'TXN-2024-003',
                    customer: 'Miguel Torres',
                    amount: 89.99,
                    product: 'Camiseta BRUMA',
                    status: 'completed',
                    date: '2024-01-15 12:18'
                  },
                  {
                    id: 'TXN-2024-004',
                    customer: 'Laura Martín',
                    amount: 199.00,
                    product: 'Pantalones MMA Elite',
                    status: 'failed',
                    date: '2024-01-15 11:22'
                  }
                ]}
                columns={[
                  { key: 'id', title: 'ID Transacción' },
                  { key: 'customer', title: 'Cliente' },
                  { 
                    key: 'amount', 
                    title: 'Importe',
                    render: (value) => `€${value.toFixed(2)}`
                  },
                  { key: 'product', title: 'Producto' },
                  {
                    key: 'status',
                    title: 'Estado',
                    render: (value) => (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        value === 'completed' ? 'bg-green-900 text-green-300' :
                        value === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-red-900 text-red-300'
                      }`}>
                        {value === 'completed' ? 'Completado' :
                         value === 'pending' ? 'Pendiente' : 'Fallido'}
                      </span>
                    )
                  },
                  { key: 'date', title: 'Fecha' }
                ]}
                renderExpandedRow={(row) => (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-gray-800 rounded-lg">
                    <div>
                      <Text className="text-sm font-semibold mb-2" style={{ color: theme.colors.primary }}>Detalles del Cliente</Text>
                      <div className="space-y-1 text-sm">
                        <Text><span className="text-gray-400">Nombre:</span> {row.customer}</Text>
                        <Text><span className="text-gray-400">Email:</span> cliente@email.com</Text>
                        <Text><span className="text-gray-400">Teléfono:</span> +34 666 777 888</Text>
                      </div>
                    </div>
                    <div>
                      <Text className="text-sm font-semibold text-green-400 mb-2">Información de Pago</Text>
                      <div className="space-y-1 text-sm">
                        <Text><span className="text-gray-400">Método:</span> Tarjeta Visa</Text>
                        <Text><span className="text-gray-400">**** **** **** 1234</span></Text>
                        <Text><span className="text-gray-400">Total:</span> €{row.amount.toFixed(2)}</Text>
                      </div>
                    </div>
                    <div>
                      <Text className="text-sm font-semibold text-purple-400 mb-2">Envío</Text>
                      <div className="space-y-1 text-sm">
                        <Text><span className="text-gray-400">Dirección:</span> Calle Principal 123</Text>
                        <Text><span className="text-gray-400">Ciudad:</span> Madrid</Text>
                        <Text><span className="text-gray-400">Tracking:</span> ESP123456789</Text>
                      </div>
                    </div>
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* 🔧 Componentes */}
      {activeSection === 'components' && (
        <div className="space-y-8">
          <SectionTitle>🔧 Biblioteca de Componentes</SectionTitle>
          <Text className="text-gray-400 mb-6">
            Demostración de todos los componentes del sistema de diseño BRUMA
          </Text>

          {/* Typography Showcase */}
          <Card>
            <CardHeader>
              <CardTitle>📝 Tipografía</CardTitle>
              <CardDescription>
                Sistema completo de tipografía y elementos de texto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>PageTitle</Label>
                <PageTitle>Título Principal del Sistema</PageTitle>
              </div>
              
              <div>
                <Label>SectionTitle</Label>
                <SectionTitle>Título de Sección</SectionTitle>
              </div>
              
              <div>
                <Label>Text Variants</Label>
                <div className="space-y-2">
                  <Text className="text-lg">Texto grande para destacar</Text>
                  <Text>Texto normal por defecto</Text>
                  <Text className="text-sm text-gray-400">Texto pequeño descriptivo</Text>
                </div>
              </div>
              
              <div>
                <Label>Badges</Label>
                <Flex className="gap-2 mt-2">
                  <Badge 
                    style={{
                      backgroundColor: theme.colors.success + '20',
                      color: theme.colors.success
                    }}
                  >✅ Success</Badge>
                  <Badge 
                    style={{
                      backgroundColor: theme.colors.error + '20',
                      color: theme.colors.error
                    }}
                  >❌ Error</Badge>
                  <Badge 
                    style={{
                      backgroundColor: theme.colors.warning + '20',
                      color: theme.colors.warning
                    }}
                  >⚠️ Warning</Badge>
                  <Badge 
                    style={{
                      backgroundColor: theme.colors.info + '20',
                      color: theme.colors.info
                    }}
                  >ℹ️ Info</Badge>
                </Flex>
              </div>
            </CardContent>
          </Card>

          {/* Buttons Showcase */}
          <Card>
            <CardHeader>
              <CardTitle>🎨 Botones</CardTitle>
              <CardDescription>
                Variantes y estados de botones del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Grid className="grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <Label className="mb-3 block">Variantes</Label>
                  <div className="space-y-3">
                    <Button className="w-full">Default</Button>
                    <Button variant="outline" className="w-full">Outline</Button>
                    <Button variant="ghost" className="w-full">Ghost</Button>
                    <Button variant="secondary" className="w-full">Secondary</Button>
                  </div>
                </div>
                
                <div>
                  <Label className="mb-3 block">Colores</Label>
                  <div className="space-y-3">
                    <Button 
                      className="w-full transition-colors"
                      style={{
                        backgroundColor: theme.colors.primary,
                        color: theme.colors.textInverse
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.primaryHover
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.primary
                      }}
                    >Primary</Button>
                    <Button className="w-full bg-green-600 hover:bg-green-700">Success</Button>
                    <Button className="w-full bg-red-600 hover:bg-red-700">Danger</Button>
                    <Button variant="warning" className="w-full">Warning</Button>
                  </div>
                </div>
                
                <div>
                  <Label className="mb-3 block">Tamaños</Label>
                  <div className="space-y-3">
                    <Button size="lg" className="w-full">Large</Button>
                    <Button className="w-full">Default</Button>
                    <Button size="sm" className="w-full">Small</Button>
                    <Button size="xl" className="w-full">Extra Large</Button>
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Minimalistas</Label>
                  <div className="space-y-3">
                    <Button variant="minimal" className="w-full">Minimal</Button>
                    <Button variant="minimal" size="sm" className="w-full">Minimal Small</Button>
                    <Button variant="minimal" size="lg" className="w-full">Minimal Large</Button>
                    <Button variant="link" className="w-full">Link Style</Button>
                  </div>
                </div>
              </Grid>

              {/* Progress & UI Buttons Section */}
              <div className="mt-8 pt-6" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
                <Label className="mb-4 block">Colección de Progress & UI</Label>
                <div className="space-y-4">
                  <div>
                    <Text className="mb-2 text-sm" style={{ color: theme.colors.textSecondary }}>Tamaños Minimalistas</Text>
                    <Flex className="gap-3">
                      <Button size="sm" variant="minimal">Pequeño</Button>
                      <Button size="default" variant="minimal">Normal</Button>
                      <Button size="lg" variant="minimal">Grande</Button>
                    </Flex>
                  </div>
                  
                  <div>
                    <Text className="mb-2 text-sm" style={{ color: theme.colors.textSecondary }}>Todas las Variantes</Text>
                    <Flex className="gap-3 flex-wrap">
                      <Button variant="minimal">Minimal</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="primary">Primary</Button>
                      <Button variant="success">Success</Button>
                      <Button variant="warning">Warning</Button>
                      <Button variant="destructive">Destructive</Button>
                    </Flex>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Layout Showcase */}
          <Card>
            <CardHeader>
              <CardTitle>📐 Layout</CardTitle>
              <CardDescription>
                Componentes de layout y organización
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-3 block">Grid System</Label>
                <Grid className="grid-cols-1 md:grid-cols-4 gap-4">
                  <div 
                    className="h-16 rounded flex items-center justify-center"
                    style={{
                      backgroundColor: theme.colors.primary + '20',
                      borderColor: theme.colors.primary,
                      border: `1px solid ${theme.colors.primary}`
                    }}
                  >
                    <Text style={{ color: theme.colors.primary }}>Grid 1</Text>
                  </div>
                  <div 
                    className="h-16 rounded flex items-center justify-center"
                    style={{
                      backgroundColor: theme.colors.success + '20',
                      border: `1px solid ${theme.colors.success}`
                    }}
                  >
                    <Text style={{ color: theme.colors.success }}>Grid 2</Text>
                  </div>
                  <div 
                    className="h-16 rounded flex items-center justify-center"
                    style={{
                      backgroundColor: theme.colors.secondary + '20',
                      border: `1px solid ${theme.colors.secondary}`
                    }}
                  >
                    <Text style={{ color: theme.colors.secondary }}>Grid 3</Text>
                  </div>
                  <div 
                    className="h-16 rounded flex items-center justify-center"
                    style={{
                      backgroundColor: theme.colors.warning + '20',
                      border: `1px solid ${theme.colors.warning}`
                    }}
                  >
                    <Text style={{ color: theme.colors.warning }}>Grid 4</Text>
                  </div>
                </Grid>
              </div>
              
              <div>
                <Label className="mb-3 block">Flex Layout</Label>
                <Flex className="gap-4 p-4 bg-gray-800 rounded-lg">
                  <div 
                    className="flex-1 h-12 rounded flex items-center justify-center"
                    style={{
                      backgroundColor: theme.colors.info + '20',
                      border: `1px solid ${theme.colors.info}`
                    }}
                  >
                    <Text style={{ color: theme.colors.info }}>Flex 1</Text>
                  </div>
                  <div 
                    className="h-12 w-20 rounded flex items-center justify-center"
                    style={{
                      backgroundColor: theme.colors.success + '20',
                      border: `1px solid ${theme.colors.success}`
                    }}
                  >
                    <Text style={{ color: theme.colors.success }} className="text-sm">Fixed</Text>
                  </div>
                  <div 
                    className="flex-1 h-12 rounded flex items-center justify-center"
                    style={{
                      backgroundColor: theme.colors.secondary + '20',
                      border: `1px solid ${theme.colors.secondary}`
                    }}
                  >
                    <Text style={{ color: theme.colors.secondary }}>Flex 2</Text>
                  </div>
                </Flex>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sección de Navegación */}
      {activeSection === 'navigation' && (
        <div className="space-y-8">
          <SectionTitle className="flex items-center gap-2">
            🧭 Navegación y Layout
          </SectionTitle>
          
          {/* Sidebar Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Sidebar Navigation</CardTitle>
              <CardDescription>
                Navegación lateral con branding BRUMA y menú completo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="rounded-lg p-4 h-96 overflow-hidden relative"
                style={{ backgroundColor: theme.colors.background }}
              >
                <div className="absolute inset-0">
                  <Sidebar isOpen={true} onClose={() => setSidebarOpen(false)} />
                </div>
                <div className="ml-64 p-4">
                  <Text style={{ color: theme.colors.textSecondary }}>
                    Contenido principal aquí...
                  </Text>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Header Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Header Component</CardTitle>
              <CardDescription>
                Header estilizado con búsqueda, notificaciones y perfil de usuario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-950 rounded-lg overflow-hidden">
                <Header 
                  onMenuClick={() => setSidebarOpen(true)} 
                  user={{
                    name: 'Juan Pérez',
                    role: 'Administrador'
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Icons Gallery */}
          <Card>
            <CardHeader>
              <CardTitle>Icon Library</CardTitle>
              <CardDescription>
                Colección completa de iconos para el sistema BRUMA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Grid className="grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {Object.entries(Icons).map(([name, IconComponent]) => (
                  <div 
                    key={name} 
                    className="text-center p-3 rounded-lg transition-colors cursor-pointer"
                    style={{
                      backgroundColor: theme.colors.surface
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.surfaceHover
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.surface
                    }}
                  >
                    <IconComponent 
                      className="w-6 h-6 mx-auto mb-2" 
                      color={theme.colors.primary}
                    />
                    <Text className="text-xs" style={{ color: theme.colors.textSecondary }}>{name}</Text>
                  </div>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sección de Auth y Forms */}
      {activeSection === 'auth' && (
        <div className="space-y-8">
          <SectionTitle className="flex items-center gap-2">
            🔐 Autenticación y Formularios
          </SectionTitle>
          
          <Grid className="grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Login Form */}
            <Card>
              <CardHeader>
                <CardTitle>Login Form</CardTitle>
                <CardDescription>
                  Formulario de inicio de sesión con branding BRUMA
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <LoginForm />
              </CardContent>
            </Card>

            {/* Register Form */}
            <Card>
              <CardHeader>
                <CardTitle>Register Form</CardTitle>
                <CardDescription>
                  Formulario de registro con validación completa
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <RegisterForm />
              </CardContent>
            </Card>
          </Grid>

          {/* Project Info Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Project Component</CardTitle>
              <CardDescription>
                Componente para mostrar información de proyectos con logo, labels y estado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Grid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ProjectInfo
                  name="BRUMA Fightwear System"
                  description="Sistema completo de gestión para empresa de ropa deportiva de combate con inventario, ventas y CRM integrado"
                  status="active"
                  version="2.1.0"
                  tags={['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Vercel']}
                />
                
                <ProjectInfo
                  name="E-commerce Frontend"
                  description="Tienda online moderna para venta de productos BRUMA con checkout avanzado"
                  status="development"
                  version="1.5.2"
                  tags={['Vue.js', 'Nuxt', 'Stripe', 'PWA']}
                />
                
                <ProjectInfo
                  name="Analytics Dashboard"
                  description="Dashboard para análisis de ventas y métricas de negocio en tiempo real"
                  status="inactive"
                  version="0.9.1"
                  tags={['Angular', 'D3.js', 'Charts.js']}
                />

                <ProjectInfo
                  name="Mobile App"
                  description="Aplicación móvil nativa para gestión de entrenamientos y compras"
                  status="development"
                  version="0.3.0"
                  tags={['React Native', 'Expo', 'Firebase']}
                />

                <ProjectInfo
                  name="API Backend"
                  description="Microservicios REST y GraphQL para toda la plataforma BRUMA"
                  status="active"
                  version="3.2.1"
                  tags={['Node.js', 'Express', 'MongoDB', 'Redis']}
                />

                <ProjectInfo
                  name="Design System"
                  description="Librería de componentes UI reutilizables y guías de diseño"
                  status="active"
                  version="1.8.0"
                  tags={['Storybook', 'CSS', 'Figma', 'Tokens']}
                />
              </Grid>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sección de Progress y UI */}
      {activeSection === 'progress' && (
        <div className="space-y-8">
          <SectionTitle className="flex items-center gap-2">
            📈 Progress Bars y UI Avanzado
          </SectionTitle>
          
          {/* Progress Bars */}
          <Card>
            <CardHeader>
              <CardTitle>Progress Bars</CardTitle>
              <CardDescription>
                Barras de progreso con diferentes estilos y variantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <ProgressBar 
                  value={75} 
                  variant="default" 
                  showLabel 
                  label="Progreso General" 
                />
                
                <ProgressBar 
                  value={90} 
                  variant="success" 
                  showLabel 
                  label="Tareas Completadas" 
                />
                
                <ProgressBar 
                  value={45} 
                  variant="warning" 
                  showLabel 
                  label="Proceso en Curso" 
                />
                
                <ProgressBar 
                  value={25} 
                  variant="danger" 
                  showLabel 
                  label="Acciones Requeridas" 
                  animated 
                />
              </div>
            </CardContent>
          </Card>

          {/* Stepped Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Stepped Progress</CardTitle>
              <CardDescription>
                Progreso por pasos para workflows complejos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div>
                  <Text className="mb-4 text-gray-300">Proceso de Onboarding</Text>
                  <SteppedProgress steps={5} currentStep={3} showNumbers />
                </div>
                
                <div>
                  <Text className="mb-4 text-gray-300">Verificación de Cuenta</Text>
                  <SteppedProgress steps={4} currentStep={4} variant="success" />
                </div>
                
                <div>
                  <Text className="mb-4 text-gray-300">Setup de Proyecto</Text>
                  <SteppedProgress steps={6} currentStep={2} variant="warning" showNumbers />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Steps Component */}
          <Card>
            <CardHeader>
              <CardTitle>Progress Steps</CardTitle>
              <CardDescription>
                Componente avanzado de pasos con descripción y estados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProgressSteps steps={[
                {
                  title: 'Configuración Inicial',
                  description: 'Setup básico del proyecto',
                  status: 'completed'
                },
                {
                  title: 'Desarrollo de UI',
                  description: 'Creación de componentes',
                  status: 'completed'
                },
                {
                  title: 'Integración API',
                  description: 'Conexión con backend',
                  status: 'current'
                },
                {
                  title: 'Testing',
                  description: 'Pruebas unitarias e integración',
                  status: 'upcoming'
                },
                {
                  title: 'Deployment',
                  description: 'Subida a producción',
                  status: 'upcoming'
                }
              ]} />
            </CardContent>
          </Card>

          {/* Button Variants - Updated to Minimal */}
          <Card>
            <CardHeader>
              <CardTitle>Botones Minimalistas</CardTitle>
              <CardDescription>
                Nueva colección de botones con diseño más discreto y minimalista
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="block mb-2">Tamaños</Label>
                  <Flex className="gap-3">
                    <Button size="sm" variant="minimal">Pequeño</Button>
                    <Button size="default" variant="minimal">Normal</Button>
                    <Button size="lg" variant="minimal">Grande</Button>
                  </Flex>
                </div>
                
                <div>
                  <Label className="block mb-2">Variantes</Label>
                  <Flex className="gap-3 flex-wrap">
                    <Button variant="minimal">Minimal</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="primary">Primary</Button>
                  </Flex>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer */}
      <div className="mt-16 pt-8" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
        <Flex className="justify-between items-center">
          <Text style={{ color: theme.colors.textSecondary }} className="text-sm">
            © 2025 BRUMA Fightwear - Complete UI System Showcase
          </Text>
          <Flex className="gap-4">
            <Button variant="ghost" className="text-sm">
              Documentación
            </Button>
            <Button variant="ghost" className="text-sm">
              GitHub
            </Button>
            <Button variant="ghost" className="text-sm">
              Soporte
            </Button>
          </Flex>
        </Flex>
      </div>
      </PageContainer>
      </div>
  )
}