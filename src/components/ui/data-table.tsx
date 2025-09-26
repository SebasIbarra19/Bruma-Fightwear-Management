import React from 'react'
import { cn } from '@/lib/utils'

// Tipos para la tabla
interface TableColumn {
  key: string
  title: string
  width?: string
  render?: (value: any, row: any) => React.ReactNode
  sortable?: boolean
}

interface TableProps {
  data: any[]
  columns: TableColumn[]
  className?: string
  size?: 'sm' | 'md' | 'lg'
  striped?: boolean
  bordered?: boolean
  hoverable?: boolean
  loading?: boolean
  onRowClick?: (row: any) => void
}

export const DataTable: React.FC<TableProps> = ({
  data,
  columns,
  className,
  size = 'md',
  striped = true,
  bordered = true,
  hoverable = true,
  loading = false,
  onRowClick
}) => {
  const [sortConfig, setSortConfig] = React.useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data
    
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [data, sortConfig])

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const paddingClasses = {
    sm: 'px-2 py-1',
    md: 'px-3 py-2',
    lg: 'px-4 py-3'
  }

  if (loading) {
    return (
      <div className="w-full">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-2"></div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-100 rounded mb-1"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className={cn(
        "w-full",
        sizeClasses[size],
        bordered && "border border-gray-200",
        "rounded-lg overflow-hidden"
      )}>
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  paddingClasses[size],
                  "text-left font-semibold text-gray-900",
                  column.sortable && "cursor-pointer hover:bg-gray-100 transition-colors",
                  bordered && "border-b border-gray-200"
                )}
                style={{ width: column.width }}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center gap-2">
                  {column.title}
                  {column.sortable && (
                    <span className="text-gray-400">
                      {sortConfig?.key === column.key ? (
                        sortConfig.direction === 'asc' ? '↑' : '↓'
                      ) : (
                        '↕'
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sortedData.map((row, index) => (
            <tr
              key={index}
              className={cn(
                striped && index % 2 === 0 && "bg-white",
                striped && index % 2 === 1 && "bg-gray-50",
                hoverable && "hover:bg-blue-50 transition-colors cursor-pointer",
                onRowClick && "cursor-pointer"
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    paddingClasses[size],
                    "text-gray-900",
                    bordered && "border-b border-gray-200"
                  )}
                  style={{ width: column.width }}
                >
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {sortedData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay datos para mostrar
        </div>
      )}
    </div>
  )
}

// Componente de filtros
interface FilterOption {
  value: string
  label: string
}

interface TableFiltersProps {
  searchValue: string
  onSearchChange: (value: string) => void
  filters?: Array<{
    key: string
    label: string
    options: FilterOption[]
    value: string
    onChange: (value: string) => void
  }>
  className?: string
}

export const TableFilters: React.FC<TableFiltersProps> = ({
  searchValue,
  onSearchChange,
  filters = [],
  className
}) => {
  return (
    <div className={cn("flex flex-col sm:flex-row gap-4 mb-4", className)}>
      {/* Buscador */}
      <div className="flex-1">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">🔍</span>
          </div>
        </div>
      </div>
      
      {/* Filtros */}
      {filters.map((filter) => (
        <div key={filter.key} className="min-w-[200px]">
          <select
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">{filter.label}</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  )
}

// Componente de paginación
interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export const TablePagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className
}) => {
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    
    return pages
  }

  return (
    <div className={cn("flex items-center justify-between mt-4", className)}>
      <div className="text-sm text-gray-700">
        Página {currentPage} de {totalPages}
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        
        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-2 py-1 text-sm text-gray-500">...</span>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                className={cn(
                  "px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50",
                  currentPage === page && "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                )}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}