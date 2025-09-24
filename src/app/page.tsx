import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SmartLogoNavbar, SmartLogoHero } from '@/components/common/SmartLogo'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <SmartLogoNavbar showText={true} />
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-indigo-600 transition-colors">
                Características
              </a>
              <a href="#projects" className="text-gray-600 hover:text-indigo-600 transition-colors">
                Proyectos
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-indigo-600 transition-colors">
                Precios
              </a>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/auth/login">
                <Button variant="outline" className="border-indigo-200 hover:bg-indigo-50">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg">
                  Comenzar Gratis
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 to-purple-100/20 -skew-y-1 transform origin-top-left"></div>
        <div className="relative container mx-auto px-4 py-24 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <SmartLogoHero showText={false} />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              Sistema de{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                SmartAdmin
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Plataforma integral para la administración empresarial. 
              Gestiona proyectos, productos, categorías y más con eficiencia.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/auth/register">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl text-lg px-8 py-4"
                >
                  Acceder al Sistema
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
              <Link href="#demo">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto border-gray-300 hover:border-indigo-300 hover:bg-indigo-50 text-lg px-8 py-4"
                >
                  Ver Demo
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Potencia tu negocio con{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                herramientas inteligentes
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
Descubre cómo BRUMA Management puede transformar la manera en que gestionas tu negocio
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <CardTitle className="text-xl">Gestión Multi-Proyecto</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Administra múltiples proyectos desde una sola interfaz. Cada proyecto mantiene su independencia y configuración única.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <CardTitle className="text-xl">Automatización Inteligente</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Automatiza tareas repetitivas y optimiza flujos de trabajo con IA integrada para mayor eficiencia.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <CardTitle className="text-xl">Analytics Avanzados</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Obtén insights profundos con dashboards interactivos y reportes en tiempo real para tomar mejores decisiones.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <CardTitle className="text-xl">Seguridad Empresarial</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Protección de datos de nivel empresarial con autenticación multi-factor y permisos granulares.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <CardTitle className="text-xl">Colaboración en Equipo</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Trabaja en equipo con herramientas de colaboración en tiempo real y gestión de permisos por proyecto.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <CardTitle className="text-xl">Interfaz Intuitiva</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Diseño moderno y intuitivo que se adapta a tu flujo de trabajo con personalización completa.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-24 bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Proyectos{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Disponibles
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Accede a diferentes tipos de proyectos empresariales desde una sola cuenta
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* E-commerce Genérico */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 border-0 shadow-lg overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/5"></div>
              <CardHeader className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    Disponible
                  </span>
                </div>
                <CardTitle className="text-2xl text-green-900 mb-2">E-commerce</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Plataforma completa para tiendas online. Gestión de productos, 
                  inventario, ventas, clientes y análisis de rendimiento.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">Tienda Online</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">Inventario</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">Ventas</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">CRM</span>
                </div>
                <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg group-hover:shadow-xl transition-all">
                  Acceder al E-commerce
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </CardContent>
            </Card>

            {/* Próximo Proyecto - SaaS */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 border-0 shadow-lg overflow-hidden relative opacity-90">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5"></div>
              <CardHeader className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    Próximamente
                  </span>
                </div>
                <CardTitle className="text-2xl text-blue-900 mb-2">Gestión SaaS</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Plataforma completa para gestionar servicios SaaS con facturación, 
                  suscripciones, métricas y soporte al cliente integrado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">Suscripciones</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">Facturación</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">Analytics</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">Soporte</span>
                </div>
                <Button variant="outline" className="w-full border-blue-200 hover:bg-blue-50 group-hover:shadow-lg transition-all" disabled>
                  Notificarme
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5l-5-5h5v-5a7.5 7.5 0 1 0-15 0v5h5" />
                  </svg>
                </Button>
              </CardContent>
            </Card>

            {/* Proyecto Personalizado */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 border-0 shadow-lg overflow-hidden relative opacity-90">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/5"></div>
              <CardHeader className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                    Personalizado
                  </span>
                </div>
                <CardTitle className="text-2xl text-purple-900 mb-2">Tu Proyecto</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  ¿Tienes una idea específica? Configuramos SmartAdmin 
                  para tu negocio único con funcionalidades a medida.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">Personalizado</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">Escalable</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">Modular</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">Soporte</span>
                </div>
                <Button variant="outline" className="w-full border-purple-200 hover:bg-purple-50 group-hover:shadow-lg transition-all" disabled>
                  Contactar
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sección para usuarios específicos */}
          <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Proyectos{' '}
                <span className="bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                  Especializados
                </span>
              </h3>
              <p className="text-lg text-gray-600">
                Acceso exclusivo para usuarios con proyectos personalizados
              </p>
            </div>

            <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* BRUMA Fightwear - Solo para usuario específico */}
              <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-600/5"></div>
                <CardHeader className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                      Exclusivo
                    </span>
                  </div>
                  <CardTitle className="text-2xl text-red-900 mb-2">BRUMA Fightwear</CardTitle>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    Tienda especializada en ropa deportiva y equipamiento de combate. 
                    Gestión completa con funcionalidades personalizadas.
                  </CardDescription>
                  <div className="mt-3 text-sm text-gray-500">
                    🔐 Acceso exclusivo: ibarraherrerasebastian@gmail.com
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">Fightwear</span>
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">Personalizado</span>
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">Premium</span>
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">Exclusivo</span>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg group-hover:shadow-xl transition-all">
                    Acceder a BRUMA Fightwear
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Button>
                </CardContent>
              </Card>

              {/* Placeholder para futuros proyectos exclusivos */}
              <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg overflow-hidden relative opacity-60">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-gray-600/5"></div>
                <CardHeader className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                      Próximamente
                    </span>
                  </div>
                  <CardTitle className="text-2xl text-gray-700 mb-2">Más Proyectos Exclusivos</CardTitle>
                  <CardDescription className="text-gray-500 leading-relaxed">
                    Próximamente tendremos más proyectos personalizados 
                    para usuarios específicos con necesidades únicas.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">Personalizado</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">Exclusivo</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">Premium</span>
                  </div>
                  <Button variant="outline" className="w-full border-gray-200 hover:bg-gray-50 transition-all" disabled>
                    Solicitar Acceso
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-indigo-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
              ¿Listo para transformar tu negocio?
            </h2>
            <p className="text-xl md:text-2xl text-indigo-100 mb-12 max-w-2xl mx-auto">
              Únete a miles de empresas que ya confían en SmartAdmin para gestionar sus proyectos
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/auth/register">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-white text-indigo-600 hover:bg-gray-100 shadow-2xl text-lg px-8 py-4 font-semibold"
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
                className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 text-lg px-8 py-4"
              >
                Hablar con Ventas
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <img 
                  src="/images/bruma/logo-circle.svg" 
                  alt="BRUMA Fightwear" 
                  className="w-10 h-10 rounded-xl bg-white p-1"
                />
                <img 
                  src="/images/bruma/logo-full.svg" 
                  alt="BRUMA Fightwear" 
                  className="h-8 w-auto filter invert"
                />
              </div>
              <p className="text-gray-400 leading-relaxed">
                Ropa deportiva de combate profesional con sistema de gestión integral para optimizar tu negocio.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Producto</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Características</a></li>
                <li><a href="#" className="hover:text-white">Precios</a></li>
                <li><a href="#" className="hover:text-white">Integraciones</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Soporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Documentación</a></li>
                <li><a href="#" className="hover:text-white">Contacto</a></li>
                <li><a href="#" className="hover:text-white">Estado del Sistema</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Acerca de</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Carreras</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <div className="text-gray-400 text-sm">
              © 2025 BRUMA Fightwear. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}