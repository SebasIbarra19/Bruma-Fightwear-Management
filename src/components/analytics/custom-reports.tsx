'use client'

import React, { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/typography'
import { ChartContainer, ChartDataPoint } from '@/components/ui/chart-container'

interface CustomReportsProps {
  className?: string
}

export function CustomReports({ className = '' }: CustomReportsProps) {
  const { theme } = useTheme()
  const [selectedTemplate, setSelectedTemplate] = useState<'executive' | 'operational' | 'financial' | 'custom'>('executive')
  const [reportView, setReportView] = useState<'builder' | 'templates' | 'scheduled' | 'exports'>('templates')

  // Datos para ejemplo de reporte personalizado
  const customReportData: ChartDataPoint[] = [
    { label: 'Q1 2024', value: 485670, category: 'trimestre' },
    { label: 'Q2 2024', value: 567890, category: 'trimestre' },
    { label: 'Q3 2024', value: 623450, category: 'trimestre' },
    { label: 'Q4 2024', value: 589120, category: 'predicción' }
  ]

  // Templates de reportes predefinidos
  const reportTemplates = [
    {
      id: 'executive',
      name: 'Reporte Ejecutivo',
      description: 'Dashboard C-level con KPIs clave y tendencias',
      frequency: 'Mensual',
      subscribers: 8,
      lastGenerated: '1 Oct 2024',
      format: 'PDF + Email',
      sections: ['KPIs', 'Revenue', 'Competencia', 'Alertas'],
      icon: '👔'
    },
    {
      id: 'operational',
      name: 'Rendimiento Operacional',
      description: 'Métricas de eficiencia, inventario y calidad',
      frequency: 'Semanal',
      subscribers: 12,
      lastGenerated: '6 Oct 2024',
      format: 'Dashboard + PDF',
      sections: ['Inventario', 'Procesos', 'Calidad', 'Costos'],
      icon: '⚙️'
    },
    {
      id: 'financial',
      name: 'Análisis Financiero',
      description: 'Márgenes, rentabilidad y análisis de costos',
      frequency: 'Quincenal',
      subscribers: 6,
      lastGenerated: '3 Oct 2024',
      format: 'Excel + PDF',
      sections: ['P&L', 'Márgenes', 'Cash Flow', 'Proyecciones'],
      icon: '💰'
    },
    {
      id: 'marketing',
      name: 'Performance Marketing',
      description: 'ROI campañas, conversión y análisis de canal',
      frequency: 'Semanal',
      subscribers: 15,
      lastGenerated: '7 Oct 2024',
      format: 'Dashboard Online',
      sections: ['Campañas', 'Conversión', 'ROI', 'Segmentos'],
      icon: '📈'
    },
    {
      id: 'sales',
      name: 'Análisis de Ventas',
      description: 'Performance comercial y análisis de producto',
      frequency: 'Diario',
      subscribers: 20,
      lastGenerated: 'Hoy',
      format: 'Email + Slack',
      sections: ['Ventas', 'Productos', 'Geografía', 'Funnel'],
      icon: '🎯'
    },
    {
      id: 'customer',
      name: 'Comportamiento Cliente',
      description: 'CLV, segmentación y análisis de retención',
      frequency: 'Mensual',
      subscribers: 9,
      lastGenerated: '30 Sep 2024',
      format: 'PDF Interactivo',
      sections: ['CLV', 'RFM', 'Retención', 'Satisfacción'],
      icon: '👥'
    }
  ]

  // Reportes programados
  const scheduledReports = [
    {
      name: 'Daily Sales Summary',
      nextRun: '8 Oct 9:00 AM',
      recipients: ['ceo@bruma.com', 'sales@bruma.com'],
      format: 'Email',
      status: 'active'
    },
    {
      name: 'Weekly Operations Review',
      nextRun: '12 Oct 8:00 AM',
      recipients: ['operations@bruma.com', 'warehouse@bruma.com'],
      format: 'PDF + Slack',
      status: 'active'
    },
    {
      name: 'Monthly Executive Dashboard',
      nextRun: '1 Nov 9:00 AM',
      recipients: ['board@bruma.com', 'executives@bruma.com'],
      format: 'Interactive PDF',
      status: 'active'
    },
    {
      name: 'Quarterly Financial Report',
      nextRun: '1 Jan 2025 10:00 AM',
      recipients: ['finance@bruma.com', 'auditors@external.com'],
      format: 'Excel + PDF',
      status: 'paused'
    }
  ]

  const views = [
    { key: 'templates', label: 'Templates', icon: '📋' },
    { key: 'builder', label: 'Constructor', icon: '🔧' },
    { key: 'scheduled', label: 'Programados', icon: '⏰' },
    { key: 'exports', label: 'Exportaciones', icon: '📤' }
  ]

  // Renderizar constructor de reportes
  const renderReportBuilder = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Configuración del reporte */}
      <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
        <CardHeader>
          <CardTitle style={{ color: theme.colors.textPrimary }}>
            🔧 Configuración
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                Nombre del Reporte
              </label>
              <input
                className="w-full mt-1 p-2 rounded border text-sm"
                style={{ 
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.textPrimary
                }}
                placeholder="Ej: Análisis Mensual MMA"
                defaultValue="Mi Reporte Personalizado"
              />
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                Frecuencia
              </label>
              <select 
                className="w-full mt-1 p-2 rounded border text-sm"
                style={{ 
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.textPrimary
                }}
              >
                <option>Diario</option>
                <option>Semanal</option>
                <option>Quincenal</option>
                <option>Mensual</option>
                <option>Trimestral</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                Formato de Salida
              </label>
              <div className="mt-2 space-y-2">
                {['PDF', 'Excel', 'PowerPoint', 'Email HTML', 'Dashboard Online'].map((format) => (
                  <label key={format} className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked={format === 'PDF'} />
                    <Text className="text-sm" style={{ color: theme.colors.textPrimary }}>
                      {format}
                    </Text>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                Destinatarios
              </label>
              <textarea
                className="w-full mt-1 p-2 rounded border text-sm h-20"
                style={{ 
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.textPrimary
                }}
                placeholder="emails separados por comas"
                defaultValue="analytics@bruma.com, manager@bruma.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Secciones disponibles */}
      <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
        <CardHeader>
          <CardTitle style={{ color: theme.colors.textPrimary }}>
            📊 Secciones Disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'KPIs Ejecutivos', icon: '📈', description: 'Métricas clave de rendimiento' },
              { name: 'Análisis de Ventas', icon: '🎯', description: 'Tendencias y performance comercial' },
              { name: 'Comportamiento Cliente', icon: '👥', description: 'Segmentación y retención' },
              { name: 'Operaciones', icon: '⚙️', description: 'Eficiencia e inventario' },
              { name: 'Análisis Financiero', icon: '💰', description: 'Márgenes y rentabilidad' },
              { name: 'Predicciones', icon: '🔮', description: 'Forecasting y recomendaciones' },
              { name: 'Competencia', icon: '🏆', description: 'Análisis competitivo' },
              { name: 'Marketing', icon: '📣', description: 'ROI campañas y conversión' }
            ].map((section, index) => (
              <div key={index} className="flex items-center p-2 rounded border cursor-pointer hover:bg-opacity-80" 
                   style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border }}>
                <input type="checkbox" className="mr-3" defaultChecked={index < 4} />
                <div className="flex items-center">
                  <span className="text-lg mr-2">{section.icon}</span>
                  <div>
                    <Text className="font-medium text-sm" style={{ color: theme.colors.textPrimary }}>
                      {section.name}
                    </Text>
                    <Text className="text-xs" style={{ color: theme.colors.textSecondary }}>
                      {section.description}
                    </Text>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vista previa */}
      <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
        <CardHeader>
          <CardTitle style={{ color: theme.colors.textPrimary }}>
            👀 Vista Previa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 rounded border" style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border }}>
              <h4 className="font-bold text-sm mb-2" style={{ color: theme.colors.textPrimary }}>
                Mi Reporte Personalizado
              </h4>
              <div className="text-xs space-y-1" style={{ color: theme.colors.textSecondary }}>
                <div>📅 Generado: 8 Oct 2024</div>
                <div>⏰ Período: Sep 2024</div>
                <div>📊 4 secciones incluidas</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Text className="text-xs font-medium" style={{ color: theme.colors.textSecondary }}>
                Secciones Incluidas:
              </Text>
              {['📈 KPIs Ejecutivos', '🎯 Análisis de Ventas', '👥 Comportamiento Cliente', '⚙️ Operaciones'].map((section, i) => (
                <div key={i} className="text-xs p-2 rounded" style={{ backgroundColor: theme.colors.background }}>
                  {section}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t" style={{ borderColor: theme.colors.border }}>
              <Button 
                className="w-full mb-2" 
                size="sm"
                style={{ backgroundColor: theme.colors.primary }}
              >
                🔍 Generar Vista Previa
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                size="sm"
                style={{ borderColor: theme.colors.border }}
              >
                💾 Guardar Template
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Renderizar exportaciones recientes
  const renderExports = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { type: 'Hoy', count: 12, size: '45.8 MB' },
          { type: 'Esta Semana', count: 67, size: '234.5 MB' },
          { type: 'Este Mes', count: 289, size: '1.2 GB' }
        ].map((stat, index) => (
          <Card key={index} style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold mb-1" style={{ color: theme.colors.textPrimary }}>
                  {stat.count}
                </div>
                <Text className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  Reportes {stat.type}
                </Text>
                <Text className="text-xs mt-1" style={{ color: theme.colors.textTertiary }}>
                  {stat.size}
                </Text>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
        <CardHeader>
          <CardTitle style={{ color: theme.colors.textPrimary }}>
            📤 Exportaciones Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                name: 'Executive Dashboard - Octubre 2024',
                type: 'PDF',
                size: '2.4 MB',
                generated: 'Hace 2 horas',
                downloads: 8,
                status: 'completed'
              },
              {
                name: 'Sales Analysis - Q3 2024',
                type: 'Excel',
                size: '8.7 MB',
                generated: 'Hace 5 horas',
                downloads: 15,
                status: 'completed'
              },
              {
                name: 'Customer Behavior Report',
                type: 'PowerPoint',
                size: '12.3 MB',
                generated: 'Hace 1 día',
                downloads: 6,
                status: 'completed'
              },
              {
                name: 'Operational Performance',
                type: 'PDF',
                size: '5.1 MB',
                generated: 'Procesando...',
                downloads: 0,
                status: 'processing'
              },
              {
                name: 'Predictive Analysis Report',
                type: 'HTML',
                size: '1.8 MB',
                generated: 'Hace 2 días',
                downloads: 23,
                status: 'completed'
              }
            ].map((export_item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded border" 
                   style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border }}>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    export_item.status === 'completed' ? 'bg-green-500' :
                    export_item.status === 'processing' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <Text className="font-medium text-sm" style={{ color: theme.colors.textPrimary }}>
                      {export_item.name}
                    </Text>
                    <div className="flex items-center gap-4 text-xs" style={{ color: theme.colors.textSecondary }}>
                      <span>{export_item.type} • {export_item.size}</span>
                      <span>{export_item.generated}</span>
                      <span>{export_item.downloads} descargas</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {export_item.status === 'completed' && (
                    <>
                      <Button variant="outline" size="sm">📤 Descargar</Button>
                      <Button variant="outline" size="sm">🔗 Compartir</Button>
                    </>
                  )}
                  {export_item.status === 'processing' && (
                    <Button variant="outline" size="sm" disabled>
                      ⏳ Procesando...
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con controles de vista */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
            📋 Reportes Personalizados
          </h2>
          <Text style={{ color: theme.colors.textSecondary }}>
            Constructor de reportes, templates predefinidos, programación y exportación
          </Text>
        </div>
        <div className="flex gap-2">
          {views.map((view) => (
            <Button
              key={view.key}
              variant={reportView === view.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setReportView(view.key as any)}
              style={{
                backgroundColor: reportView === view.key ? theme.colors.primary : 'transparent',
                borderColor: theme.colors.border,
                color: reportView === view.key ? theme.colors.textInverse : theme.colors.textSecondary
              }}
            >
              {view.icon} {view.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Templates predefinidos */}
      {reportView === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportTemplates.map((template) => (
            <Card key={template.id} style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg" style={{ color: theme.colors.textPrimary }}>
                    <span className="text-2xl">{template.icon}</span>
                    {template.name}
                  </CardTitle>
                </div>
                <CardDescription style={{ color: theme.colors.textSecondary }}>
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <Text style={{ color: theme.colors.textSecondary }}>Frecuencia</Text>
                      <Text className="font-medium" style={{ color: theme.colors.textPrimary }}>
                        {template.frequency}
                      </Text>
                    </div>
                    <div>
                      <Text style={{ color: theme.colors.textSecondary }}>Suscriptores</Text>
                      <Text className="font-medium" style={{ color: theme.colors.textPrimary }}>
                        {template.subscribers}
                      </Text>
                    </div>
                    <div>
                      <Text style={{ color: theme.colors.textSecondary }}>Último</Text>
                      <Text className="font-medium" style={{ color: theme.colors.textPrimary }}>
                        {template.lastGenerated}
                      </Text>
                    </div>
                    <div>
                      <Text style={{ color: theme.colors.textSecondary }}>Formato</Text>
                      <Text className="font-medium" style={{ color: theme.colors.textPrimary }}>
                        {template.format}
                      </Text>
                    </div>
                  </div>
                  
                  <div>
                    <Text className="text-xs font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                      Secciones:
                    </Text>
                    <div className="flex flex-wrap gap-1">
                      {template.sections.map((section, i) => (
                        <span key={i} className="px-2 py-1 rounded-full text-xs" 
                              style={{ backgroundColor: theme.colors.background, color: theme.colors.textPrimary }}>
                          {section}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      📊 Ver Ejemplo
                    </Button>
                    <Button size="sm" className="flex-1" style={{ backgroundColor: theme.colors.primary }}>
                      🚀 Generar Ahora
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Constructor de reportes */}
      {reportView === 'builder' && renderReportBuilder()}

      {/* Reportes programados */}
      {reportView === 'scheduled' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Activos', value: '12', icon: '✅' },
              { label: 'Pausados', value: '3', icon: '⏸️' },
              { label: 'Próximos 24h', value: '5', icon: '⏰' },
              { label: 'Fallas/Semana', value: '0', icon: '🛡️' }
            ].map((stat, index) => (
              <Card key={index} style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold" style={{ color: theme.colors.textPrimary }}>
                        {stat.value}
                      </div>
                      <Text className="text-sm" style={{ color: theme.colors.textSecondary }}>
                        {stat.label}
                      </Text>
                    </div>
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <CardHeader>
              <CardTitle style={{ color: theme.colors.textPrimary }}>
                ⏰ Reportes Programados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledReports.map((report, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded border" 
                       style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border }}>
                    <div>
                      <Text className="font-medium text-sm" style={{ color: theme.colors.textPrimary }}>
                        {report.name}
                      </Text>
                      <div className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>
                        <span>Próxima ejecución: {report.nextRun}</span>
                        <span className="mx-2">•</span>
                        <span>{report.recipients.length} destinatarios</span>
                        <span className="mx-2">•</span>
                        <span>{report.format}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        report.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {report.status === 'active' ? 'Activo' : 'Pausado'}
                      </span>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm">✏️</Button>
                        <Button variant="outline" size="sm">
                          {report.status === 'active' ? '⏸️' : '▶️'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Exportaciones */}
      {reportView === 'exports' && renderExports()}

      {/* Ejemplo de gráfico en la vista de templates */}
      {reportView === 'templates' && (
        <ChartContainer
          title="📊 Ejemplo: Reporte Trimestral"
          description="Vista previa de datos que se incluirían en reportes personalizados"
          data={customReportData}
          defaultChartType="bar"
          availableTypes={['bar', 'line', 'area']}
          height={300}
          showLegend={true}
          animated={true}
        />
      )}
    </div>
  )
}