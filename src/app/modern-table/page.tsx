'use client'

import React, { useState } from 'react'

interface Employee {
  id: number
  name: string
  age: number
  joinDate: string
  department: string
  fullTime: boolean
}

export default function ModernTable() {
  const [showFilters, setShowFilters] = useState(false)
  const [showColumns, setShowColumns] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [sortColumn, setSortColumn] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  
  // Filtros avanzados
  const [filters, setFilters] = useState({
    column: 'ID',
    operator: 'contains',
    value: ''
  })

  // Columnas visibles
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    name: true,
    age: true,
    joinDate: true,
    department: true,
    fullTime: true,
    actions: true
  })

  // Datos de empleados
  const employees: Employee[] = [
    { id: 1, name: 'Edward Perry', age: 25, joinDate: '7/15/2025', department: 'Finance', fullTime: true },
    { id: 2, name: 'Josephine Drake', age: 36, joinDate: '7/15/2025', department: 'Market', fullTime: false },
    { id: 3, name: 'Cody Phillips', age: 19, joinDate: '7/15/2025', department: 'Development', fullTime: true },
    { id: 4, name: 'Sarah Johnson', age: 28, joinDate: '6/20/2025', department: 'HR', fullTime: true },
    { id: 5, name: 'Mike Wilson', age: 32, joinDate: '8/10/2025', department: 'Marketing', fullTime: false },
    { id: 6, name: 'Lisa Brown', age: 27, joinDate: '5/12/2025', department: 'Finance', fullTime: true },
    { id: 7, name: 'David Martinez', age: 35, joinDate: '9/03/2025', department: 'Development', fullTime: true },
    { id: 8, name: 'Anna Garcia', age: 29, joinDate: '4/18/2025', department: 'HR', fullTime: false },
  ]

  const operators = [
    'contains',
    'does not contain',
    'equals',
    'does not equal',
    'starts with',
    'ends with',
    'is empty',
    'is not empty'
  ]

  const columns = ['ID', 'Name', 'Age', 'Join date', 'Department', 'Full-time', 'actions']

  // Filtrar datos
  const filteredEmployees = employees.filter(employee => {
    // Búsqueda global
    const matchesSearch = searchTerm === '' || 
      Object.values(employee).some(value => 
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )

    // Filtros avanzados
    let matchesFilter = true
    if (filters.value) {
      const columnValue = getColumnValue(employee, filters.column).toString().toLowerCase()
      const filterValue = filters.value.toLowerCase()
      
      switch (filters.operator) {
        case 'contains':
          matchesFilter = columnValue.includes(filterValue)
          break
        case 'does not contain':
          matchesFilter = !columnValue.includes(filterValue)
          break
        case 'equals':
          matchesFilter = columnValue === filterValue
          break
        case 'does not equal':
          matchesFilter = columnValue !== filterValue
          break
        case 'starts with':
          matchesFilter = columnValue.startsWith(filterValue)
          break
        case 'ends with':
          matchesFilter = columnValue.endsWith(filterValue)
          break
        case 'is empty':
          matchesFilter = columnValue === ''
          break
        case 'is not empty':
          matchesFilter = columnValue !== ''
          break
      }
    }

    return matchesSearch && matchesFilter
  })

  // Ordenar datos
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    const aValue = getColumnValue(a, sortColumn)
    const bValue = getColumnValue(b, sortColumn)
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // Paginación
  const totalPages = Math.ceil(sortedEmployees.length / rowsPerPage)
  const paginatedEmployees = sortedEmployees.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  function getColumnValue(employee: Employee, column: string) {
    switch (column.toLowerCase()) {
      case 'id': return employee.id
      case 'name': return employee.name
      case 'age': return employee.age
      case 'join date': return employee.joinDate
      case 'department': return employee.department
      case 'full-time': return employee.fullTime
      default: return ''
    }
  }

  const handleSort = (column: string) => {
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
      [column]: !prev[column as keyof typeof prev]
    }))
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-gray-400 text-sm mb-1">Employees</p>
            <h1 className="text-3xl font-semibold">Employees</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
              <span>+</span>
              Create
            </button>
          </div>
        </div>

        {/* Controles de tabla */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              {/* Botón de columnas */}
              <div className="relative">
                <button
                  onClick={() => setShowColumns(!showColumns)}
                  className="p-2 text-gray-400 hover:text-white transition-colors border border-gray-600 rounded"
                  title="Configure columns"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 4H7a2 2 0 00-2 2v12a2 2 0 002 2h2M9 4V2a1 1 0 011-1h4a1 1 0 011 1v2M9 4h6m0 0v16M15 8h-2m2 4h-2m2 4h-2" />
                  </svg>
                </button>

                {/* Dropdown de columnas */}
                {showColumns && (
                  <div className="absolute top-12 left-0 bg-gray-800 border border-gray-600 rounded-lg p-4 min-w-[200px] z-10 shadow-xl">
                    <div className="mb-3">
                      <input
                        type="text"
                        placeholder="Search"
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      {Object.entries(visibleColumns).map(([key, visible]) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={visible}
                            onChange={() => toggleColumn(key)}
                            className="text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-white capitalize">{key === 'fullTime' ? 'Full-time' : key}</span>
                        </label>
                      ))}
                      <div className="border-t border-gray-600 pt-2 mt-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Object.values(visibleColumns).every(v => v)}
                            onChange={() => {
                              const allVisible = Object.values(visibleColumns).every(v => v)
                              setVisibleColumns(Object.keys(visibleColumns).reduce((acc, key) => ({
                                ...acc,
                                [key]: !allVisible
                              }), {} as typeof visibleColumns))
                            }}
                            className="text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-white">Show/Hide All</span>
                        </label>
                      </div>
                      <button className="text-sm text-gray-400 hover:text-white mt-2">
                        Reset
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Botón de filtros */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 text-gray-400 hover:text-white transition-colors border border-gray-600 rounded"
                title="Filter"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                </svg>
              </button>

              {/* Botón de descargar */}
              <button className="p-2 text-gray-400 hover:text-white transition-colors border border-gray-600 rounded">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>

              {/* Botón de búsqueda */}
              <button className="p-2 text-gray-400 hover:text-white transition-colors border border-gray-600 rounded">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Filtros avanzados */}
          {showFilters && (
            <div className="p-4 border-b border-gray-700 bg-gray-850">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowFilters(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Columns</span>
                  <select
                    value={filters.column}
                    onChange={(e) => setFilters(prev => ({ ...prev, column: e.target.value }))}
                    className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm text-white"
                  >
                    {columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Operator</span>
                  <select
                    value={filters.operator}
                    onChange={(e) => setFilters(prev => ({ ...prev, operator: e.target.value }))}
                    className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm text-white"
                  >
                    {operators.map(op => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Value</span>
                  <input
                    type="text"
                    placeholder="Filter value"
                    value={filters.value}
                    onChange={(e) => setFilters(prev => ({ ...prev, value: e.target.value }))}
                    className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm text-white placeholder-gray-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  {visibleColumns.id && (
                    <th className="text-left p-4 font-medium text-gray-300">ID</th>
                  )}
                  {visibleColumns.name && (
                    <th 
                      className="text-left p-4 font-medium text-gray-300 cursor-pointer hover:text-white flex items-center gap-1"
                      onClick={() => handleSort('name')}
                    >
                      Name
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </th>
                  )}
                  {visibleColumns.age && (
                    <th className="text-left p-4 font-medium text-gray-300">Age</th>
                  )}
                  {visibleColumns.joinDate && (
                    <th className="text-left p-4 font-medium text-gray-300">Join date</th>
                  )}
                  {visibleColumns.department && (
                    <th className="text-left p-4 font-medium text-gray-300">Department</th>
                  )}
                  {visibleColumns.fullTime && (
                    <th className="text-left p-4 font-medium text-gray-300">Full-time</th>
                  )}
                  {visibleColumns.actions && (
                    <th className="text-left p-4 font-medium text-gray-300">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedEmployees.map((employee) => (
                  <tr key={employee.id} className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors">
                    {visibleColumns.id && (
                      <td className="p-4 text-gray-300">{employee.id}</td>
                    )}
                    {visibleColumns.name && (
                      <td className="p-4 text-white">{employee.name}</td>
                    )}
                    {visibleColumns.age && (
                      <td className="p-4 text-gray-300">{employee.age}</td>
                    )}
                    {visibleColumns.joinDate && (
                      <td className="p-4 text-gray-300">{employee.joinDate}</td>
                    )}
                    {visibleColumns.department && (
                      <td className="p-4 text-gray-300">{employee.department}</td>
                    )}
                    {visibleColumns.fullTime && (
                      <td className="p-4">
                        {employee.fullTime ? (
                          <span className="text-green-400">✓</span>
                        ) : (
                          <span className="text-red-400">✗</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.actions && (
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 text-gray-400 hover:text-white border border-gray-600 rounded hover:border-gray-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-red-400 border border-gray-600 rounded hover:border-red-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between p-4 border-t border-gray-700">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">
                {((currentPage - 1) * rowsPerPage) + 1}-{Math.min(currentPage * rowsPerPage, filteredEmployees.length)} of {filteredEmployees.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-1 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}