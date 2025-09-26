'use client'

import React from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/typography'

interface AboutUsProps {
  className?: string
  showFullVersion?: boolean
}

export function AboutUs({ className = '', showFullVersion = false }: AboutUsProps) {
  const { theme } = useTheme()

  const teamMembers = [
    {
      name: 'Carlos Rodríguez',
      role: 'Fundador & CEO',
      image: '👨‍💼',
      description: 'Experto en artes marciales con 15 años de experiencia'
    },
    {
      name: 'Ana García',
      role: 'Diseñadora Principal',
      image: '👩‍🎨',
      description: 'Especialista en diseño deportivo y materiales técnicos'
    },
    {
      name: 'Miguel Torres',
      role: 'Director de Ventas',
      image: '👨‍💻',
      description: 'Estratega comercial con enfoque en experiencia del cliente'
    },
    {
      name: 'Laura Martín',
      role: 'Jefa de Producción',
      image: '👩‍🔧',
      description: 'Experta en calidad y procesos de manufactura'
    }
  ]

  const stats = [
    { label: 'Años de experiencia', value: '12+', icon: '🏆' },
    { label: 'Productos entregados', value: '50K+', icon: '📦' },
    { label: 'Clientes satisfechos', value: '15K+', icon: '😊' },
    { label: 'Países atendidos', value: '25+', icon: '🌍' }
  ]

  if (!showFullVersion) {
    return (
      <Card 
        className={className}
        style={{ 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border 
        }}
      >
        <CardHeader className="text-center">
          <div
            className="text-4xl mb-4"
            style={{ color: theme.colors.primary }}
          >
            🥊
          </div>
          <CardTitle style={{ color: theme.colors.textPrimary }}>
            BRUMA Fightwear
          </CardTitle>
          <CardDescription style={{ color: theme.colors.textSecondary }}>
            Equipamiento premium para artes marciales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Text 
            className="text-center text-sm leading-relaxed"
            style={{ color: theme.colors.textSecondary }}
          >
            Desde 2012, creamos equipamiento de alta calidad para luchadores profesionales y entusiastas de las artes marciales.
          </Text>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            {stats.slice(0, 2).map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div 
                  className="text-lg font-bold"
                  style={{ color: theme.colors.primary }}
                >
                  {stat.value}
                </div>
                <div 
                  className="text-xs"
                  style={{ color: theme.colors.textTertiary }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Hero Section */}
      <Card style={{ 
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border 
      }}>
        <CardContent className="p-12 text-center">
          <div
            className="text-6xl mb-6"
            style={{ color: theme.colors.primary }}
          >
            🥊
          </div>
          <h1 
            className="text-4xl font-bold mb-4"
            style={{ color: theme.colors.textPrimary }}
          >
            BRUMA Fightwear
          </h1>
          <Text 
            className="text-xl mb-8 max-w-2xl mx-auto"
            style={{ color: theme.colors.textSecondary }}
          >
            Equipamiento premium para artes marciales. Desde 2012, creamos productos de alta calidad 
            para luchadores profesionales y entusiastas de todo el mundo.
          </Text>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div 
                  className="text-2xl font-bold mb-1"
                  style={{ color: theme.colors.primary }}
                >
                  {stat.value}
                </div>
                <div 
                  className="text-sm"
                  style={{ color: theme.colors.textTertiary }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card style={{ 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border 
        }}>
          <CardHeader>
            <CardTitle 
              className="flex items-center gap-2"
              style={{ color: theme.colors.textPrimary }}
            >
              <span style={{ color: theme.colors.primary }}>🎯</span>
              Nuestra Misión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={{ color: theme.colors.textSecondary }}>
              Proporcionar equipamiento de artes marciales de la más alta calidad, diseñado para 
              maximizar el rendimiento y la seguridad de cada luchador, desde principiantes hasta 
              profesionales de élite.
            </Text>
          </CardContent>
        </Card>

        <Card style={{ 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border 
        }}>
          <CardHeader>
            <CardTitle 
              className="flex items-center gap-2"
              style={{ color: theme.colors.textPrimary }}
            >
              <span style={{ color: theme.colors.primary }}>👁️</span>
              Nuestra Visión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={{ color: theme.colors.textSecondary }}>
              Ser la marca líder mundial en equipamiento para artes marciales, reconocida por 
              nuestra innovación, calidad excepcional y compromiso con la comunidad de luchadores.
            </Text>
          </CardContent>
        </Card>
      </div>

      {/* Team Section */}
      <Card style={{ 
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border 
      }}>
        <CardHeader>
          <CardTitle style={{ color: theme.colors.textPrimary }}>
            Nuestro Equipo
          </CardTitle>
          <CardDescription style={{ color: theme.colors.textSecondary }}>
            Conoce a las personas apasionadas detrás de BRUMA Fightwear
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="text-center p-4 rounded-lg transition-all duration-200 hover:scale-105"
                style={{ 
                  backgroundColor: theme.colors.surfaceHover,
                  border: `1px solid ${theme.colors.border}`
                }}
              >
                <div className="text-4xl mb-3">{member.image}</div>
                <h3 
                  className="font-semibold mb-1"
                  style={{ color: theme.colors.textPrimary }}
                >
                  {member.name}
                </h3>
                <div 
                  className="text-sm font-medium mb-2"
                  style={{ color: theme.colors.primary }}
                >
                  {member.role}
                </div>
                <Text 
                  className="text-xs leading-relaxed"
                  style={{ color: theme.colors.textTertiary }}
                >
                  {member.description}
                </Text>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Values */}
      <Card style={{ 
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border 
      }}>
        <CardHeader>
          <CardTitle style={{ color: theme.colors.textPrimary }}>
            Nuestros Valores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div 
                className="text-3xl mb-3"
                style={{ color: theme.colors.primary }}
              >
                💪
              </div>
              <h4 
                className="font-semibold mb-2"
                style={{ color: theme.colors.textPrimary }}
              >
                Calidad Superior
              </h4>
              <Text 
                className="text-sm"
                style={{ color: theme.colors.textSecondary }}
              >
                Utilizamos solo los mejores materiales y técnicas de manufactura
              </Text>
            </div>
            
            <div className="text-center">
              <div 
                className="text-3xl mb-3"
                style={{ color: theme.colors.primary }}
              >
                🤝
              </div>
              <h4 
                className="font-semibold mb-2"
                style={{ color: theme.colors.textPrimary }}
              >
                Compromiso
              </h4>
              <Text 
                className="text-sm"
                style={{ color: theme.colors.textSecondary }}
              >
                Estamos comprometidos con el éxito de cada uno de nuestros clientes
              </Text>
            </div>
            
            <div className="text-center">
              <div 
                className="text-3xl mb-3"
                style={{ color: theme.colors.primary }}
              >
                🚀
              </div>
              <h4 
                className="font-semibold mb-2"
                style={{ color: theme.colors.textPrimary }}
              >
                Innovación
              </h4>
              <Text 
                className="text-sm"
                style={{ color: theme.colors.textSecondary }}
              >
                Constantemente mejoramos nuestros productos con las últimas tecnologías
              </Text>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact CTA */}
      <Card style={{ 
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border 
      }}>
        <CardContent className="p-8 text-center">
          <h3 
            className="text-xl font-bold mb-4"
            style={{ color: theme.colors.textPrimary }}
          >
            ¿Quieres conocer más sobre nosotros?
          </h3>
          <Text 
            className="mb-6"
            style={{ color: theme.colors.textSecondary }}
          >
            Estamos aquí para ayudarte a encontrar el equipamiento perfecto para tu entrenamiento
          </Text>
          <div className="flex gap-4 justify-center">
            <Button 
              style={{
                backgroundColor: theme.colors.primary,
                color: theme.colors.textInverse
              }}
              className="hover:opacity-90 transition-opacity"
            >
              Contactar
            </Button>
            <Button 
              variant="outline"
              style={{
                borderColor: theme.colors.border,
                color: theme.colors.textSecondary,
                backgroundColor: 'transparent'
              }}
              className="hover:opacity-80 transition-opacity"
            >
              Ver Catálogo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}