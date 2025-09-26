'use client'

import Link from 'next/link'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { SmartLogoNavbar, SmartLogoHero } from '@/components/common/SmartLogo'
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext'
import { 
  PageTitle, 
  SectionTitle, 
  Text, 
  Label, 
  Badge 
} from '@/components/ui/typography'
import { 
  PageContainer, 
  StatsGrid, 
  Grid, 
  Flex 
} from '@/components/ui/layout'
import { ThemeSelector } from '@/components/ui/theme-selector'

function HomePageInner() {
  const { theme } = useTheme()

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.surface} 50%, ${theme.colors.surfaceHover} 100%)` }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b" style={{ backgroundColor: theme.colors.surface + '90', borderColor: theme.colors.border }}>
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <SmartLogoNavbar showText={true} />
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="transition-colors hover:opacity-80" style={{ color: theme.colors.textSecondary }}>
                Características
              </a>
              <a href="#projects" className="transition-colors hover:opacity-80" style={{ color: theme.colors.textSecondary }}>
                Proyectos
              </a>
              <a href="#pricing" className="transition-colors hover:opacity-80" style={{ color: theme.colors.textSecondary }}>
                Precios
              </a>
            </div>
            <Flex className="items-center space-x-3">
              <ThemeSelector />
              <Link href="/auth/login">
                <Button variant="outline">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button>
                  Registrarse
                </Button>
              </Link>
            </Flex>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 50%, ${theme.colors.primary}20 0%, transparent 50%)` }}></div>
        <PageContainer className="relative text-center">
          <div className="max-w-5xl mx-auto mb-16">
            <PageTitle className="mb-8">
              La nueva forma de gestionar tu{' '}
              <span style={{ color: theme.colors.primary }}>
                negocio inteligente
              </span>
            </PageTitle>
            <Text className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto">
              Automatiza procesos, optimiza recursos y toma decisiones basadas en datos 
              con la plataforma de gestión empresarial más completa del mercado
            </Text>
            <Flex className="flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link href="/auth/register">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto text-lg px-8 py-4 font-semibold shadow-2xl transition-all hover:shadow-3xl"
                  style={{ 
                    backgroundColor: theme.colors.primary,
                    color: theme.colors.textInverse,
                    border: `2px solid ${theme.colors.primary}`
                  }}
                >
                  Comenzar Gratis
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
              <Link href="/showcase">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-4">
                  Ver Demo
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Button>
              </Link>
            </Flex>
          </div>

          {/* Hero Logo */}
          <div className="flex justify-center mb-16">
            <div className="relative">
              <div 
                className="absolute inset-0 rounded-3xl opacity-20 blur-3xl"
                style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})` }}
              ></div>
              <div className="relative p-8 rounded-3xl backdrop-blur-sm border" style={{ backgroundColor: theme.colors.surface + '50', borderColor: theme.colors.border }}>
                <SmartLogoHero />
              </div>
            </div>
          </div>

          {/* Stats */}
          <StatsGrid className="grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2" style={{ color: theme.colors.primary }}>500+</div>
              <Text>Empresas Activas</Text>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2" style={{ color: theme.colors.secondary }}>98%</div>
              <Text>Satisfacción</Text>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2" style={{ color: theme.colors.success }}>24/7</div>
              <Text>Soporte</Text>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2" style={{ color: theme.colors.info }}>15+</div>
              <Text>Integraciones</Text>
            </div>
          </StatsGrid>
        </PageContainer>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24" style={{ backgroundColor: theme.colors.surface }}>
        <PageContainer>
          <div className="text-center mb-16">
            <SectionTitle className="mb-4">
              Características <span style={{ color: theme.colors.primary }}>Principales</span>
            </SectionTitle>
            <Text className="text-xl max-w-3xl mx-auto">
              Descubre las herramientas que transformarán la manera en que gestionas tu negocio
            </Text>
          </div>

          <Grid className="md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Dashboard Analytics */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 overflow-hidden relative">
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${theme.colors.primary}05, ${theme.colors.primary}10)` }}></div>
              <CardHeader className="relative">
                <Flex className="items-center justify-between mb-4">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                    style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primary}cc)` }}
                  >
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <Badge style={{ backgroundColor: theme.colors.primary + '20', color: theme.colors.primary }}>
                    Analytics
                  </Badge>
                </Flex>
                <CardTitle className="text-2xl mb-2">Dashboard Inteligente</CardTitle>
                <CardDescription>
                  Visualiza KPIs, métricas de rendimiento y tendencias 
                  del negocio en tiempo real con gráficos interactivos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Flex className="flex-wrap gap-2 mb-6">
                  <Badge style={{ backgroundColor: theme.colors.primary + '20', color: theme.colors.primary }}>
                    Real-time
                  </Badge>
                  <Badge style={{ backgroundColor: theme.colors.primary + '20', color: theme.colors.primary }}>
                    KPIs
                  </Badge>
                  <Badge style={{ backgroundColor: theme.colors.primary + '20', color: theme.colors.primary }}>
                    Gráficos
                  </Badge>
                </Flex>
                <Button variant="outline" className="w-full transition-all">
                  Ver Demo
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </Button>
              </CardContent>
            </Card>

            {/* CRM System */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 overflow-hidden relative">
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}05, ${theme.colors.secondary}10)` }}></div>
              <CardHeader className="relative">
                <Flex className="items-center justify-between mb-4">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                    style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.secondary}cc)` }}
                  >
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <Badge style={{ backgroundColor: theme.colors.secondary + '20', color: theme.colors.secondary }}>
                    CRM
                  </Badge>
                </Flex>
                <CardTitle className="text-2xl mb-2">Gestión de Clientes</CardTitle>
                <CardDescription>
                  Administra contactos, seguimiento de ventas, 
                  historial de interacciones y pipeline completo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Flex className="flex-wrap gap-2 mb-6">
                  <Badge style={{ backgroundColor: theme.colors.secondary + '20', color: theme.colors.secondary }}>
                    Contactos
                  </Badge>
                  <Badge style={{ backgroundColor: theme.colors.secondary + '20', color: theme.colors.secondary }}>
                    Pipeline
                  </Badge>
                  <Badge style={{ backgroundColor: theme.colors.secondary + '20', color: theme.colors.secondary }}>
                    Seguimiento
                  </Badge>
                </Flex>
                <Button variant="outline" className="w-full transition-all">
                  Explorar
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </Button>
              </CardContent>
            </Card>

            {/* Inventory Management */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 overflow-hidden relative">
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${theme.colors.success}05, ${theme.colors.success}10)` }}></div>
              <CardHeader className="relative">
                <Flex className="items-center justify-between mb-4">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                    style={{ background: `linear-gradient(135deg, ${theme.colors.success}, ${theme.colors.success}cc)` }}
                  >
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <Badge style={{ backgroundColor: theme.colors.success + '20', color: theme.colors.success }}>
                    Inventario
                  </Badge>
                </Flex>
                <CardTitle className="text-2xl mb-2">Control de Inventario</CardTitle>
                <CardDescription>
                  Gestiona stock, alertas de reposición, 
                  códigos de barras y movimientos de almacén.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Flex className="flex-wrap gap-2 mb-6">
                  <Badge style={{ backgroundColor: theme.colors.success + '20', color: theme.colors.success }}>
                    Stock
                  </Badge>
                  <Badge style={{ backgroundColor: theme.colors.success + '20', color: theme.colors.success }}>
                    Alertas
                  </Badge>
                  <Badge style={{ backgroundColor: theme.colors.success + '20', color: theme.colors.success }}>
                    Códigos
                  </Badge>
                </Flex>
                <Button variant="outline" className="w-full transition-all">
                  Ver Más
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </CardContent>
            </Card>

            {/* Financial Management */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 overflow-hidden relative">
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${theme.colors.warning}05, ${theme.colors.warning}10)` }}></div>
              <CardHeader className="relative">
                <Flex className="items-center justify-between mb-4">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                    style={{ background: `linear-gradient(135deg, ${theme.colors.warning}, ${theme.colors.warning}cc)` }}
                  >
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <Badge style={{ backgroundColor: theme.colors.warning + '20', color: theme.colors.warning }}>
                    Finanzas
                  </Badge>
                </Flex>
                <CardTitle className="text-2xl mb-2">Gestión Financiera</CardTitle>
                <CardDescription>
                  Facturación automatizada, control de gastos, 
                  reportes contables y análisis de flujo de caja.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Flex className="flex-wrap gap-2 mb-6">
                  <Badge style={{ backgroundColor: theme.colors.warning + '20', color: theme.colors.warning }}>
                    Facturas
                  </Badge>
                  <Badge style={{ backgroundColor: theme.colors.warning + '20', color: theme.colors.warning }}>
                    Gastos
                  </Badge>
                  <Badge style={{ backgroundColor: theme.colors.warning + '20', color: theme.colors.warning }}>
                    Reportes
                  </Badge>
                </Flex>
                <Button variant="outline" className="w-full transition-all">
                  Detalles
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Button>
              </CardContent>
            </Card>

            {/* Team Management */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 overflow-hidden relative">
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${theme.colors.info}05, ${theme.colors.info}10)` }}></div>
              <CardHeader className="relative">
                <Flex className="items-center justify-between mb-4">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                    style={{ background: `linear-gradient(135deg, ${theme.colors.info}, ${theme.colors.info}cc)` }}
                  >
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <Badge style={{ backgroundColor: theme.colors.info + '20', color: theme.colors.info }}>
                    Equipo
                  </Badge>
                </Flex>
                <CardTitle className="text-2xl mb-2">Gestión de Equipo</CardTitle>
                <CardDescription>
                  Asignación de tareas, seguimiento de productividad, 
                  evaluaciones y gestión de permisos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Flex className="flex-wrap gap-2 mb-6">
                  <Badge style={{ backgroundColor: theme.colors.info + '20', color: theme.colors.info }}>
                    Tareas
                  </Badge>
                  <Badge style={{ backgroundColor: theme.colors.info + '20', color: theme.colors.info }}>
                    Productividad
                  </Badge>
                  <Badge style={{ backgroundColor: theme.colors.info + '20', color: theme.colors.info }}>
                    Permisos
                  </Badge>
                </Flex>
                <Button variant="outline" className="w-full transition-all">
                  Gestionar
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Button>
              </CardContent>
            </Card>

            {/* Custom Project */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 overflow-hidden relative opacity-90">
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}05, ${theme.colors.secondary}10)` }}></div>
              <CardHeader className="relative">
                <Flex className="items-center justify-between mb-4">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                    style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.secondary}cc)` }}
                  >
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <Badge style={{ backgroundColor: theme.colors.secondary + '20', color: theme.colors.secondary }}>
                    Personalizado
                  </Badge>
                </Flex>
                <CardTitle className="text-2xl mb-2">Tu Proyecto</CardTitle>
                <CardDescription>
                  ¿Tienes una idea específica? Configuramos SmartAdmin 
                  para tu negocio único con funcionalidades a medida.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Flex className="flex-wrap gap-2 mb-6">
                  <Badge style={{ backgroundColor: theme.colors.secondary + '20', color: theme.colors.secondary }}>
                    Personalizado
                  </Badge>
                  <Badge style={{ backgroundColor: theme.colors.secondary + '20', color: theme.colors.secondary }}>
                    Escalable
                  </Badge>
                  <Badge style={{ backgroundColor: theme.colors.secondary + '20', color: theme.colors.secondary }}>
                    Modular
                  </Badge>
                  <Badge style={{ backgroundColor: theme.colors.secondary + '20', color: theme.colors.secondary }}>
                    Soporte
                  </Badge>
                </Flex>
                <Button variant="outline" className="w-full transition-all" disabled>
                  Contactar
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </PageContainer>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-24" style={{ backgroundColor: theme.colors.background }}>
        <PageContainer>
          <div className="text-center mb-16">
            <SectionTitle className="mb-4">
              Nuestros <span style={{ color: theme.colors.primary }}>Proyectos</span>
            </SectionTitle>
            <Text className="text-xl max-w-3xl mx-auto">
              Descubre las soluciones que hemos desarrollado para diferentes sectores
            </Text>
          </div>

          <Grid className="md:grid-cols-1 lg:grid-cols-3 gap-8">
            {/* E-commerce Platform */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 overflow-hidden relative">
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${theme.colors.success}05, ${theme.colors.success}10)` }}></div>
              <CardHeader className="relative">
                <Flex className="items-center justify-between mb-4">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                    style={{ background: `linear-gradient(135deg, ${theme.colors.success}, ${theme.colors.success}cc)` }}
                  >
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5L21 18M7 13l-2.5 5m0 0L7 13m13.5 5L18 13" />
                    </svg>
                  </div>
                  <Badge style={{ backgroundColor: theme.colors.success + '20', color: theme.colors.success }}>
                    E-commerce
                  </Badge>
                </Flex>
                <CardTitle className="text-2xl mb-2">Tienda Online</CardTitle>
                <CardDescription>
                  Plataforma completa de comercio electrónico con gestión de inventario, 
                  pagos seguros y análisis de ventas en tiempo real.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Flex className="flex-wrap gap-2 mb-6">
                  <Badge style={{ backgroundColor: theme.colors.success + '20', color: theme.colors.success }}>
                    React
                  </Badge>
                  <Badge style={{ backgroundColor: theme.colors.success + '20', color: theme.colors.success }}>
                    Node.js
                  </Badge>
                  <Badge style={{ backgroundColor: theme.colors.success + '20', color: theme.colors.success }}>
                    Stripe
                  </Badge>
                </Flex>
                <Button variant="outline" className="w-full transition-all">
                  Ver Demo
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </Button>
              </CardContent>
            </Card>

            {/* SaaS Platform */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 overflow-hidden relative">
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${theme.colors.info}05, ${theme.colors.info}10)` }}></div>
              <CardHeader className="relative">
                <Flex className="items-center justify-between mb-4">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                    style={{ background: `linear-gradient(135deg, ${theme.colors.info}, ${theme.colors.info}cc)` }}
                  >
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <Badge style={{ backgroundColor: theme.colors.info + '20', color: theme.colors.info }}>
                    SaaS
                  </Badge>
                </Flex>
                <CardTitle className="text-2xl mb-2">Gestión Empresarial</CardTitle>
                <CardDescription>
                  Sistema integral de gestión empresarial con módulos de CRM, 
                  facturación, inventario y reportes avanzados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Flex className="flex-wrap gap-2 mb-6">
                  <Badge style={{ backgroundColor: theme.colors.info + '20', color: theme.colors.info }}>
                    Dashboard
                  </Badge>
                  <Badge style={{ backgroundColor: theme.colors.info + '20', color: theme.colors.info }}>
                    CRM
                  </Badge>
                  <Badge style={{ backgroundColor: theme.colors.info + '20', color: theme.colors.info }}>
                    Analytics
                  </Badge>
                </Flex>
                <Button variant="outline" className="w-full transition-all">
                  Explorar
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </Button>
              </CardContent>
            </Card>

            {/* Custom Project */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 overflow-hidden relative opacity-75">
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${theme.colors.textSecondary}05, ${theme.colors.textSecondary}10)` }}></div>
              <CardHeader className="relative">
                <Flex className="items-center justify-between mb-4">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                    style={{ background: `linear-gradient(135deg, ${theme.colors.textSecondary}, ${theme.colors.textSecondary}cc)` }}
                  >
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <Badge style={{ backgroundColor: theme.colors.textSecondary + '20', color: theme.colors.textSecondary }}>
                    Premium
                  </Badge>
                </Flex>
                <CardTitle className="text-2xl mb-2">Personalizado</CardTitle>
                <CardDescription>
                  Desarrollo de soluciones completamente personalizadas 
                  para usuarios específicos con necesidades únicas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Flex className="flex-wrap gap-2 mb-6">
                  <Badge style={{ backgroundColor: theme.colors.textSecondary + '20', color: theme.colors.textSecondary }}>
                    Personalizado
                  </Badge>
                  <Badge style={{ backgroundColor: theme.colors.textSecondary + '20', color: theme.colors.textSecondary }}>
                    Exclusivo
                  </Badge>
                  <Badge style={{ backgroundColor: theme.colors.textSecondary + '20', color: theme.colors.textSecondary }}>
                    Premium
                  </Badge>
                </Flex>
                <Button variant="outline" className="w-full transition-all" disabled>
                  Solicitar Acceso
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </PageContainer>
      </section>

      {/* Separator */}
      <div className="relative">
        <div className="absolute inset-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${theme.colors.border}, transparent)` }}></div>
        <div className="relative h-24 flex items-center justify-center">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: theme.colors.primary }}
          ></div>
          <div 
            className="w-16 h-px mx-4"
            style={{ backgroundColor: theme.colors.border }}
          ></div>
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: theme.colors.secondary }}
          ></div>
          <div 
            className="w-16 h-px mx-4"
            style={{ backgroundColor: theme.colors.border }}
          ></div>
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: theme.colors.primary }}
          ></div>
        </div>
      </div>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})` }}>
        <div className="absolute inset-0" style={{ backgroundColor: theme.colors.background + '20' }}></div>
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${theme.colors.surface}10, transparent)` }}></div>
        <PageContainer className="relative text-center">
          <div className="max-w-4xl mx-auto">
            <PageTitle className="text-white mb-8">
              ¿Listo para transformar tu negocio?
            </PageTitle>
            <Text className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto" style={{ color: theme.colors.textInverse + 'dd' }}>
              Únete a miles de empresas que ya confían en SmartAdmin para gestionar sus proyectos
            </Text>
            <Flex className="flex-col sm:flex-row gap-6 justify-center">
              <Link href="/auth/register">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto text-lg px-8 py-4 font-semibold shadow-2xl transition-all hover:shadow-3xl hover:scale-105"
                  style={{ 
                    backgroundColor: theme.colors.textInverse,
                    color: theme.colors.primary,
                    border: `2px solid ${theme.colors.textInverse}`,
                    fontWeight: '700'
                  }}
                >
                  Comenzar Gratis
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto text-lg px-8 py-4 border-white/30 text-white hover:bg-white/10"
              >
                Hablar con Ventas
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </Button>
            </Flex>
          </div>
        </PageContainer>
      </section>

      {/* Footer */}
      <footer className="py-16" style={{ backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border, borderTopWidth: '1px' }}>
        <PageContainer>
          <Grid className="md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-bold" style={{ color: theme.colors.primary }}>
                  SmartAdmin
                </h3>
              </div>
              <Text className="leading-relaxed mb-4">
                La plataforma de gestión empresarial más completa para hacer crecer tu negocio de manera inteligente.
              </Text>
            </div>

            <div>
              <SectionTitle className="text-lg mb-4">Producto</SectionTitle>
              <ul className="space-y-3">
                <li><a href="#features" className="transition-colors" style={{ color: theme.colors.textSecondary }}>Características</a></li>
                <li><a href="#projects" className="transition-colors" style={{ color: theme.colors.textSecondary }}>Proyectos</a></li>
                <li><a href="/showcase" className="transition-colors" style={{ color: theme.colors.textSecondary }}>Showcase</a></li>
                <li><a href="#pricing" className="transition-colors" style={{ color: theme.colors.textSecondary }}>Precios</a></li>
              </ul>
            </div>

            <div>
              <SectionTitle className="text-lg mb-4">Empresa</SectionTitle>
              <ul className="space-y-3">
                <li><a href="#" className="transition-colors" style={{ color: theme.colors.textSecondary }}>Acerca de</a></li>
                <li><a href="#" className="transition-colors" style={{ color: theme.colors.textSecondary }}>Blog</a></li>
                <li><a href="#" className="transition-colors" style={{ color: theme.colors.textSecondary }}>Carreras</a></li>
                <li><a href="#" className="transition-colors" style={{ color: theme.colors.textSecondary }}>Contacto</a></li>
              </ul>
            </div>

            <div>
              <SectionTitle className="text-lg mb-4">Soporte</SectionTitle>
              <ul className="space-y-3">
                <li><a href="#" className="transition-colors" style={{ color: theme.colors.textSecondary }}>Centro de Ayuda</a></li>
                <li><a href="#" className="transition-colors" style={{ color: theme.colors.textSecondary }}>Documentación</a></li>
                <li><a href="#" className="transition-colors" style={{ color: theme.colors.textSecondary }}>Estado del Sistema</a></li>
                <li><a href="#" className="transition-colors" style={{ color: theme.colors.textSecondary }}>Privacidad</a></li>
              </ul>
            </div>
          </Grid>

          <div className="pt-8 mt-8 border-t text-center" style={{ borderColor: theme.colors.border }}>
            <Text style={{ color: theme.colors.textTertiary }}>
              © 2025 SmartAdmin. Todos los derechos reservados.
            </Text>
          </div>
        </PageContainer>
      </footer>
    </div>
  )
}

export default function HomePage() {
  return (
    <ThemeProvider>
      <HomePageInner />
    </ThemeProvider>
  )
}