import React, { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

interface Column<T> {
  key: keyof T
  title: string
  sortable?: boolean
  render?: (value: any, row: T) => React.ReactNode
}

interface FilterOperator {
  value: string
  label: string
}

interface ModernTableProps<T> {
  data: T[]
  columns: Column<T>[]
  title?: string
  subtitle?: string
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onCreate?: () => void
  renderExpandedRow?: (row: T) => React.ReactNode
  className?: string
  carouselItems?: Array<{
    title: string
    value: string
    trend?: 'up' | 'down' | 'neutral'
    icon?: string
  }>
}

const filterOperators: FilterOperator[] = [
  { value: 'contains', label: 'contains' },
  { value: 'does not contain', label: 'does not contain' },
  { value: 'equals', label: 'equals' },
  { value: 'does not equal', label: 'does not equal' },
  { value: 'starts with', label: 'starts with' },
  { value: 'ends with', label: 'ends with' },
  { value: 'is empty', label: 'is empty' },
  { value: 'is not empty', label: 'is not empty' }
]

export function ModernTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  subtitle,
  onEdit,
  onDelete,
  onCreate,
  renderExpandedRow,
  className = '',
  carouselItems = []
}: ModernTableProps<T>) {
  const { theme } = useTheme()
  const [showFilters, setShowFilters] = useState(false)
  const [showColumns, setShowColumns] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0)
  
  // Filtros avanzados
  const [filters, setFilters] = useState({
    column: columns[0]?.key || '',
    operator: 'contains',
    value: ''
  })

  // Columnas visibles
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    columns.reduce((acc, col) => ({ ...acc, [String(col.key)]: true }), {})
  )

  // Filtrar datos
  const filteredData = data.filter(item => {
    if (!filters.value) return true
    
    const columnValue = String(item[filters.column] || '').toLowerCase()
    const filterValue = filters.value.toLowerCase()
    
    switch (filters.operator) {
      case 'contains':
        return columnValue.includes(filterValue)
      case 'does not contain':
        return !columnValue.includes(filterValue)
      case 'equals':
        return columnValue === filterValue
      case 'does not equal':
        return columnValue !== filterValue
      case 'starts with':
        return columnValue.startsWith(filterValue)
      case 'ends with':
        return columnValue.endsWith(filterValue)
      case 'is empty':
        return columnValue === ''
      case 'is not empty':
        return columnValue !== ''
      default:
        return true
    }
  })

  // Ordenar datos
  const sortedData = sortColumn 
    ? [...filteredData].sort((a, b) => {
        const aValue = a[sortColumn]
        const bValue = b[sortColumn]
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    : filteredData

  // Paginación
  const totalPages = Math.ceil(sortedData.length / rowsPerPage)
  const paginatedData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  const handleSort = (column: keyof T) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const toggleColumn = (column: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }))
  }

  const toggleExpandRow = (index: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedRows(newExpanded)
  }

  // Función para cambiar el carrusel
  const nextCarouselItem = () => {
    if (carouselItems.length > 0) {
      setCurrentCarouselIndex((prev) => (prev + 1) % carouselItems.length)
    }
  }

  const prevCarouselItem = () => {
    if (carouselItems.length > 0) {
      setCurrentCarouselIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length)
    }
  }

  // Auto-rotar carrusel cada 4 segundos
  React.useEffect(() => {
    if (carouselItems.length > 1) {
      const interval = setInterval(nextCarouselItem, 4000)
      return () => clearInterval(interval)
    }
  }, [carouselItems.length])

  const getRowIndex = (row: T) => {
    return paginatedData.indexOf(row) + (currentPage - 1) * rowsPerPage
  }

  return (
    <div 
      className={`rounded-lg overflow-hidden ${className}`}
      style={{
        backgroundColor: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`
      }}
    >
      
      {/* Header with Carousel */}
      {((title || subtitle || onCreate) || carouselItems.length > 0) && (
        <div className="flex items-center justify-between p-6">
          <div className="flex-1">
            {subtitle && <p style={{ color: theme.colors.textSecondary }} className="text-sm mb-1">{subtitle}</p>}
            {title && <h1 style={{ color: theme.colors.textPrimary }} className="text-3xl font-semibold">{title}</h1>}
          </div>
          
          {/* Carousel minimalista */}
          {carouselItems.length > 0 && (
            <div className="flex items-center gap-4">
              <div 
                className="rounded-lg p-4 min-w-[200px] relative"
                style={{ backgroundColor: theme.colors.surfaceHover }}
              >
                <div className="text-center">
                  <div style={{ color: theme.colors.textSecondary }} className="text-xs mb-1">
                    {carouselItems[currentCarouselIndex]?.icon} {carouselItems[currentCarouselIndex]?.title}
                  </div>
                  <div style={{ color: theme.colors.textPrimary }} className="text-2xl font-bold">
                    {carouselItems[currentCarouselIndex]?.value}
                  </div>
                  {carouselItems[currentCarouselIndex]?.trend && (
                    <div className={`text-xs mt-1`} style={{
                      color: carouselItems[currentCarouselIndex].trend === 'up' ? theme.colors.success :
                             carouselItems[currentCarouselIndex].trend === 'down' ? theme.colors.error :
                             theme.colors.textSecondary
                    }}>
                      {carouselItems[currentCarouselIndex].trend === 'up' ? '↗ +12%' :
                       carouselItems[currentCarouselIndex].trend === 'down' ? '↘ -5%' :
                       '→ 0%'}
                    </div>
                  )}
                </div>
                
                {/* Indicadores de puntos */}
                {carouselItems.length > 1 && (
                  <div className="flex justify-center gap-1 mt-3">
                    {carouselItems.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentCarouselIndex(index)}
                        className="w-1.5 h-1.5 rounded-full transition-colors"
                        style={{
                          backgroundColor: index === currentCarouselIndex ? theme.colors.primary : theme.colors.border
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {onCreate && (
            <div className="flex items-center gap-3 ml-4">
              <button 
                className="p-2 transition-colors"
                style={{ color: theme.colors.textSecondary }}
                onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.textPrimary}
                onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </button>
              <button 
                onClick={onCreate}
                className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                style={{
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.textInverse
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.primaryHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary}
              >
                <span>+</span>
                Create
              </button>
            </div>
          )}
        </div>
      )}

      {/* Controles de tabla */}
      <div 
        className="flex items-center justify-between p-4"
        style={{ borderBottom: `1px solid ${theme.colors.border}` }}
      >
        <div className="flex items-center gap-3">
          {/* Botón de columnas */}
          <div className="relative">
            <button
              onClick={() => setShowColumns(!showColumns)}
              className="p-2 transition-colors rounded"
              style={{ 
                color: theme.colors.textSecondary, 
                border: `1px solid ${theme.colors.border}`
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.textPrimary}
              onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
              title="Configure columns"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 4H7a2 2 0 00-2 2v12a2 2 0 002 2h2M9 4V2a1 1 0 011-1h4a1 1 0 011 1v2M9 4h6m0 0v16M15 8h-2m2 4h-2m2 4h-2" />
              </svg>
            </button>

            {/* Dropdown de columnas */}
            {showColumns && (
              <div 
                className="absolute top-12 left-0 rounded-lg p-4 min-w-[200px] z-10 shadow-xl"
                style={{
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`
                }}
              >
                <div className="space-y-2">
                  {columns.map((column) => (
                    <label key={String(column.key)} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleColumns[String(column.key)]}
                        onChange={() => toggleColumn(String(column.key))}
                        className="rounded focus:ring-2"
                        style={{ 
                          accentColor: theme.colors.primary,
                          backgroundColor: theme.colors.surfaceHover,
                          borderColor: theme.colors.border
                        }}
                      />
                      <span style={{ color: theme.colors.textPrimary }} className="text-sm">{column.title}</span>
                    </label>
                  ))}
                  <div style={{ borderTop: `1px solid ${theme.colors.border}` }} className="pt-2 mt-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Object.values(visibleColumns).every(v => v)}
                        onChange={() => {
                          const allVisible = Object.values(visibleColumns).every(v => v)
                          setVisibleColumns(columns.reduce((acc, col) => ({
                            ...acc,
                            [String(col.key)]: !allVisible
                          }), {}))
                        }}
                        className="rounded focus:ring-2"
                        style={{ 
                          accentColor: theme.colors.primary,
                          backgroundColor: theme.colors.surfaceHover,
                          borderColor: theme.colors.border
                        }}
                      />
                      <span style={{ color: theme.colors.textPrimary }} className="text-sm">Show/Hide All</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botón de filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 transition-colors rounded"
            style={{ 
              color: theme.colors.textSecondary, 
              border: `1px solid ${theme.colors.border}`
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.textPrimary}
            onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
            title="Filter"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
            </svg>
          </button>

          {/* Botón de descargar */}
          <button 
            className="p-2 transition-colors rounded"
            style={{ 
              color: theme.colors.textSecondary, 
              border: `1px solid ${theme.colors.border}`
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.textPrimary}
            onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>

          {/* Botón de búsqueda */}
          <button 
            className="p-2 transition-colors rounded"
            style={{ 
              color: theme.colors.textSecondary, 
              border: `1px solid ${theme.colors.border}`
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.textPrimary}
            onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filtros avanzados */}
      {showFilters && (
        <div 
          className="p-4"
          style={{
            borderBottom: `1px solid ${theme.colors.border}`,
            backgroundColor: theme.colors.surfaceHover
          }}
        >
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowFilters(false)}
              style={{ color: theme.colors.textSecondary }}
              onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.textPrimary}
              onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
            >
              ✕
            </button>
            <div className="flex items-center gap-2">
              <span style={{ color: theme.colors.textSecondary }} className="text-sm">Columns</span>
              <select
                value={String(filters.column)}
                onChange={(e) => setFilters(prev => ({ ...prev, column: e.target.value as keyof T }))}
                className="rounded px-3 py-1 text-sm"
                style={{
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.textPrimary
                }}
              >
                {columns.map(col => (
                  <option key={String(col.key)} value={String(col.key)}>{col.title}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: theme.colors.textSecondary }} className="text-sm">Operator</span>
              <select
                value={filters.operator}
                onChange={(e) => setFilters(prev => ({ ...prev, operator: e.target.value }))}
                className="rounded px-3 py-1 text-sm"
                style={{
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.textPrimary
                }}
              >
                {filterOperators.map(op => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: theme.colors.textSecondary }} className="text-sm">Value</span>
              <input
                type="text"
                placeholder="Filter value"
                value={filters.value}
                onChange={(e) => setFilters(prev => ({ ...prev, value: e.target.value }))}
                className="rounded px-3 py-1 text-sm placeholder-opacity-60"
                style={{
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.textPrimary
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
              {renderExpandedRow && (
                <th className="text-left p-4 font-medium w-8" style={{ color: theme.colors.textSecondary }}></th>
              )}
              {columns.map((column) => 
                visibleColumns[String(column.key)] ? (
                  <th 
                    key={String(column.key)}
                    className={`text-left p-4 font-medium ${
                      column.sortable ? 'cursor-pointer transition-colors' : ''
                    }`}
                    style={{ 
                      color: column.sortable && sortColumn === column.key ? theme.colors.textPrimary : theme.colors.textSecondary 
                    }}
                    onMouseEnter={(e) => {
                      if (column.sortable) {
                        e.currentTarget.style.color = theme.colors.textPrimary
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (column.sortable && sortColumn !== column.key) {
                        e.currentTarget.style.color = theme.colors.textSecondary
                      }
                    }}
                    onClick={column.sortable ? () => handleSort(column.key) : undefined}
                  >
                    <div className="flex items-center gap-1">
                      {column.title}
                      {column.sortable && sortColumn === column.key && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d={
                            sortDirection === 'asc' 
                              ? "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              : "M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                          } clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </th>
                ) : null
              )}
              {(onEdit || onDelete) && (
                <th className="text-left p-4 font-medium" style={{ color: theme.colors.textSecondary }}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, index) => {
              const globalIndex = getRowIndex(row)
              const isExpanded = expandedRows.has(globalIndex)
              
              return (
                <React.Fragment key={index}>
                  <tr 
                    className="transition-colors cursor-pointer"
                    style={{ borderBottom: `1px solid ${theme.colors.border}` }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.surfaceHover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {renderExpandedRow && (
                      <td className="p-4">
                        <button
                          onClick={() => toggleExpandRow(globalIndex)}
                          className="p-1 transition-colors"
                          style={{ color: theme.colors.textSecondary }}
                          onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.textPrimary}
                          onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
                        >
                          <svg 
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </td>
                    )}
                    {columns.map((column) => 
                      visibleColumns[String(column.key)] ? (
                        <td key={String(column.key)} className="p-4" style={{ color: theme.colors.textPrimary }}>
                          {column.render 
                            ? column.render(row[column.key], row)
                            : String(row[column.key])
                          }
                        </td>
                      ) : null
                    )}
                    {(onEdit || onDelete) && (
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {onEdit && (
                            <button 
                              onClick={() => onEdit(row)}
                              className="p-1.5 rounded transition-colors"
                              style={{ 
                                color: theme.colors.textSecondary, 
                                border: `1px solid ${theme.colors.border}` 
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = theme.colors.textPrimary
                                e.currentTarget.style.borderColor = theme.colors.primary
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = theme.colors.textSecondary
                                e.currentTarget.style.borderColor = theme.colors.border
                              }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          )}
                          {onDelete && (
                            <button 
                              onClick={() => onDelete(row)}
                              className="p-1.5 rounded transition-colors"
                              style={{ 
                                color: theme.colors.textSecondary, 
                                border: `1px solid ${theme.colors.border}` 
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = theme.colors.error
                                e.currentTarget.style.borderColor = theme.colors.error
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = theme.colors.textSecondary
                                e.currentTarget.style.borderColor = theme.colors.border
                              }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                  {/* Fila expandida */}
                  {isExpanded && renderExpandedRow && (
                    <tr style={{ 
                      backgroundColor: theme.colors.surface
                    }}>
                      <td colSpan={columns.filter(col => visibleColumns[String(col.key)]).length + 1 + ((onEdit || onDelete) ? 1 : 0)}>
                        <div 
                          className="p-6" 
                          style={{ 
                            backgroundColor: theme.colors.surface,
                            borderTop: `1px solid ${theme.colors.border}`,
                            borderBottom: `1px solid ${theme.colors.border}`,
                            borderLeft: `4px solid ${theme.colors.primary}`,
                            color: theme.colors.textPrimary
                          }}
                        >
                          {renderExpandedRow(row)}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div 
        className="flex items-center justify-between p-4"
        style={{ borderTop: `1px solid ${theme.colors.border}` }}
      >
        <div className="flex items-center gap-4">
          <span style={{ color: theme.colors.textSecondary }} className="text-sm">Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="rounded px-2 py-1 text-sm"
            style={{
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              color: theme.colors.textPrimary
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <div className="flex items-center gap-4">
          <span style={{ color: theme.colors.textSecondary }} className="text-sm">
            {((currentPage - 1) * rowsPerPage) + 1}-{Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: currentPage === 1 ? theme.colors.textTertiary : theme.colors.textSecondary }}
              onMouseEnter={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.color = theme.colors.textPrimary
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.color = theme.colors.textSecondary
                }
              }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: currentPage === totalPages ? theme.colors.textTertiary : theme.colors.textSecondary }}
              onMouseEnter={(e) => {
                if (currentPage !== totalPages) {
                  e.currentTarget.style.color = theme.colors.textPrimary
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== totalPages) {
                  e.currentTarget.style.color = theme.colors.textSecondary
                }
              }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}