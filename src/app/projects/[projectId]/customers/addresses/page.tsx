'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

// Interfaces para Customer Addresses
interface CustomerAddress {
  id: string
  customer_id: string
  customer_name: string
  address_type: 'shipping' | 'billing' | 'both'
  is_default: boolean
  address_line_1: string
  address_line_2?: string
  provincia: string
  canton: string
  distrito: string
  codigo_postal: string
  country: string
  phone_number?: string
  delivery_notes?: string
  created_at: string
  updated_at: string
}

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
}

interface Project {
  project_id: string
  name: string
  slug: string
}

export default function CustomerAddressesPage({ params }: { params: { projectId: string } }) {
  const router = useRouter()
  const projectSlug = params.projectId

  // Estados
  const [project, setProject] = useState<Project | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [addresses, setAddresses] = useState<CustomerAddress[]>([])
  const [addressesLoading, setAddressesLoading] = useState(true)
  const [customersLoading, setCustomersLoading] = useState(true)

  // Estados de filtros
  const [addressSearch, setAddressSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all')
  const [addressType, setAddressType] = useState<string>('all')

  // Estados para nueva dirección
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [newAddress, setNewAddress] = useState<Partial<CustomerAddress>>({
    customer_id: '',
    address_type: 'shipping',
    is_default: false,
    address_line_1: '',
    address_line_2: '',
    provincia: '',
    canton: '',
    distrito: '',
    codigo_postal: '',
    country: 'Costa Rica',
    phone_number: '',
    delivery_notes: ''
  })

  // Datos mock del proyecto
  useEffect(() => {
    const mockProject: Project = {
      project_id: projectSlug,
      name: 'BRUMA Fightwear',
      slug: projectSlug
    }
    setProject(mockProject)
  }, [projectSlug])

  // Datos mock de clientes
  useEffect(() => {
    const mockCustomers: Customer[] = [
      {
        id: 'cust1',
        name: 'Deportes El Campeón',
        email: 'ventas@deporteselcampeon.com',
        phone: '+506 2222-3333'
      },
      {
        id: 'cust2',
        name: 'Gimnasio Fuerza Total',
        email: 'info@fuerzatotal.cr',
        phone: '+506 8888-9999'
      },
      {
        id: 'cust3',
        name: 'Academia de Artes Marciales Tigre',
        email: 'contacto@academiatigre.com',
        phone: '+506 7777-1111'
      }
    ]
    
    setCustomers(mockCustomers)
    setCustomersLoading(false)
  }, [])

  // Datos mock de direcciones
  useEffect(() => {
    const mockAddresses: CustomerAddress[] = [
      {
        id: 'addr1',
        customer_id: 'cust1',
        customer_name: 'Deportes El Campeón',
        address_type: 'both',
        is_default: true,
        address_line_1: 'Avenida Central, Local 15',
        address_line_2: 'Frente al Banco Nacional',
        provincia: 'San José',
        canton: 'San José',
        distrito: 'Carmen',
        codigo_postal: '10101',
        country: 'Costa Rica',
        phone_number: '+506 2222-3333',
        delivery_notes: 'Entregar en horario comercial 8am-6pm',
        created_at: '2024-09-15T10:00:00Z',
        updated_at: '2024-09-15T10:00:00Z'
      },
      {
        id: 'addr2',
        customer_id: 'cust2',
        customer_name: 'Gimnasio Fuerza Total',
        address_type: 'shipping',
        is_default: true,
        address_line_1: 'Plaza Occidente, 2do Piso',
        provincia: 'Alajuela',
        canton: 'Alajuela',
        distrito: 'Alajuela',
        codigo_postal: '20101',
        country: 'Costa Rica',
        phone_number: '+506 8888-9999',
        delivery_notes: 'Llamar antes de entregar',
        created_at: '2024-09-16T14:30:00Z',
        updated_at: '2024-09-16T14:30:00Z'
      },
      {
        id: 'addr3',
        customer_id: 'cust2',
        customer_name: 'Gimnasio Fuerza Total',
        address_type: 'billing',
        is_default: false,
        address_line_1: 'Oficinas Administrativas',
        address_line_2: 'Centro Empresarial, Torre B, Piso 3',
        provincia: 'San José',
        canton: 'Escazú',
        distrito: 'Escazú',
        codigo_postal: '10201',
        country: 'Costa Rica',
        phone_number: '+506 2289-0000',
        created_at: '2024-09-17T09:15:00Z',
        updated_at: '2024-09-17T09:15:00Z'
      },
      {
        id: 'addr4',
        customer_id: 'cust3',
        customer_name: 'Academia de Artes Marciales Tigre',
        address_type: 'shipping',
        is_default: true,
        address_line_1: 'Barrio Escalante, Casa 205',
        address_line_2: '200m sur de la Iglesia',
        provincia: 'San José',
        canton: 'San José',
        distrito: 'Escalante',
        codigo_postal: '10105',
        country: 'Costa Rica',
        phone_number: '+506 7777-1111',
        delivery_notes: 'Portón verde, tocar timbre',
        created_at: '2024-09-18T16:45:00Z',
        updated_at: '2024-09-18T16:45:00Z'
      }
    ]
    
    setAddresses(mockAddresses)
    setAddressesLoading(false)
  }, [])

  // Función para filtrar direcciones
  const getFilteredAddresses = () => {
    return addresses.filter(address => {
      const matchesSearch = addressSearch === '' || 
        address.customer_name.toLowerCase().includes(addressSearch.toLowerCase()) ||
        address.address_line_1.toLowerCase().includes(addressSearch.toLowerCase()) ||
        address.provincia.toLowerCase().includes(addressSearch.toLowerCase()) ||
        address.canton.toLowerCase().includes(addressSearch.toLowerCase())
      
      const matchesCustomer = selectedCustomer === 'all' || address.customer_id === selectedCustomer
      const matchesType = addressType === 'all' || address.address_type === addressType || address.address_type === 'both'
      
      return matchesSearch && matchesCustomer && matchesType
    })
  }

  // Manejar envío de nueva dirección
  const handleSubmitNewAddress = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newAddress.customer_id || !newAddress.address_line_1 || !newAddress.provincia || 
        !newAddress.canton || !newAddress.distrito || !newAddress.codigo_postal) {
      alert('Por favor complete todos los campos obligatorios')
      return
    }

    const addressToAdd: CustomerAddress = {
      id: `addr${addresses.length + 1}`,
      customer_id: newAddress.customer_id!,
      customer_name: customers.find(c => c.id === newAddress.customer_id)?.name || '',
      address_type: newAddress.address_type as 'shipping' | 'billing' | 'both',
      is_default: newAddress.is_default || false,
      address_line_1: newAddress.address_line_1!,
      address_line_2: newAddress.address_line_2,
      provincia: newAddress.provincia!,
      canton: newAddress.canton!,
      distrito: newAddress.distrito!,
      codigo_postal: newAddress.codigo_postal!,
      country: newAddress.country || 'Costa Rica',
      phone_number: newAddress.phone_number,
      delivery_notes: newAddress.delivery_notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setAddresses([...addresses, addressToAdd])
    setShowNewAddressForm(false)
    setNewAddress({
      customer_id: '',
      address_type: 'shipping',
      is_default: false,
      address_line_1: '',
      address_line_2: '',
      provincia: '',
      canton: '',
      distrito: '',
      codigo_postal: '',
      country: 'Costa Rica',
      phone_number: '',
      delivery_notes: ''
    })
  }

  if (!project) {
    return <div>Cargando proyecto...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Direcciones de Clientes</h1>
          <p className="text-gray-600 mt-2">Gestión de direcciones de entrega y facturación</p>
        </div>
        <div className="flex space-x-4">
          <Link href={`/projects/${projectSlug}/shipping`}>
            <Button variant="outline">🚚 Módulo Envíos</Button>
          </Link>
          <Link href={`/projects/${projectSlug}/customers`}>
            <Button variant="outline">← Volver a Clientes</Button>
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar direcciones
              </label>
              <Input
                placeholder="Cliente, dirección, provincia..."
                value={addressSearch}
                onChange={(e) => setAddressSearch(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
              >
                <option value="all">Todos los clientes</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Dirección
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={addressType}
                onChange={(e) => setAddressType(e.target.value)}
              >
                <option value="all">Todos los tipos</option>
                <option value="shipping">Solo Envío</option>
                <option value="billing">Solo Facturación</option>
                <option value="both">Ambos</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={() => setShowNewAddressForm(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                + Nueva Dirección
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulario Nueva Dirección */}
      {showNewAddressForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nueva Dirección</CardTitle>
            <CardDescription>Agregar nueva dirección para cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitNewAddress}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente *
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={newAddress.customer_id}
                    onChange={(e) => setNewAddress({...newAddress, customer_id: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar cliente</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Dirección *
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={newAddress.address_type}
                    onChange={(e) => setNewAddress({...newAddress, address_type: e.target.value as any})}
                    required
                  >
                    <option value="shipping">Solo Envío</option>
                    <option value="billing">Solo Facturación</option>
                    <option value="both">Envío y Facturación</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección Línea 1 *
                  </label>
                  <Input
                    value={newAddress.address_line_1}
                    onChange={(e) => setNewAddress({...newAddress, address_line_1: e.target.value})}
                    placeholder="Dirección principal"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección Línea 2
                  </label>
                  <Input
                    value={newAddress.address_line_2}
                    onChange={(e) => setNewAddress({...newAddress, address_line_2: e.target.value})}
                    placeholder="Referencia adicional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provincia *
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={newAddress.provincia}
                    onChange={(e) => setNewAddress({...newAddress, provincia: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar provincia</option>
                    <option value="San José">San José</option>
                    <option value="Alajuela">Alajuela</option>
                    <option value="Cartago">Cartago</option>
                    <option value="Heredia">Heredia</option>
                    <option value="Guanacaste">Guanacaste</option>
                    <option value="Puntarenas">Puntarenas</option>
                    <option value="Limón">Limón</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantón *
                  </label>
                  <Input
                    value={newAddress.canton}
                    onChange={(e) => setNewAddress({...newAddress, canton: e.target.value})}
                    placeholder="Cantón"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distrito *
                  </label>
                  <Input
                    value={newAddress.distrito}
                    onChange={(e) => setNewAddress({...newAddress, distrito: e.target.value})}
                    placeholder="Distrito"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código Postal *
                  </label>
                  <Input
                    value={newAddress.codigo_postal}
                    onChange={(e) => setNewAddress({...newAddress, codigo_postal: e.target.value})}
                    placeholder="10101"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <Input
                    value={newAddress.phone_number}
                    onChange={(e) => setNewAddress({...newAddress, phone_number: e.target.value})}
                    placeholder="+506 1234-5678"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas de Entrega
                </label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                  value={newAddress.delivery_notes}
                  onChange={(e) => setNewAddress({...newAddress, delivery_notes: e.target.value})}
                  placeholder="Instrucciones especiales de entrega..."
                />
              </div>

              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={newAddress.is_default}
                    onChange={(e) => setNewAddress({...newAddress, is_default: e.target.checked})}
                  />
                  Marcar como dirección predeterminada
                </label>
              </div>

              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowNewAddressForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  Crear Dirección
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Direcciones */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Direcciones</h3>
              <p className="text-sm text-gray-600 mt-1">
                Mostrando {getFilteredAddresses().length} direcciones
              </p>
            </div>
          </div>

          {addressesLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando direcciones...</p>
            </div>
          ) : getFilteredAddresses().length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">📍</div>
              <p className="text-gray-600 mb-2">No hay direcciones</p>
              <p className="text-sm text-gray-500">Las direcciones aparecerán aquí</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredAddresses().map((address) => (
                <Card key={address.id} className={`${address.is_default ? 'ring-2 ring-blue-500' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{address.customer_name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            address.address_type === 'shipping' 
                              ? 'bg-blue-100 text-blue-800'
                              : address.address_type === 'billing'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {address.address_type === 'shipping' ? 'Envío' : 
                             address.address_type === 'billing' ? 'Facturación' : 'Ambos'}
                          </span>
                          {address.is_default && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Principal
                            </span>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="font-medium">{address.address_line_1}</p>
                      {address.address_line_2 && <p>{address.address_line_2}</p>}
                      <p>{address.distrito}, {address.canton}</p>
                      <p>{address.provincia}, {address.codigo_postal}</p>
                      <p>{address.country}</p>
                    </div>
                    
                    {address.phone_number && (
                      <p className="text-sm text-gray-600 mt-2">
                        📞 {address.phone_number}
                      </p>
                    )}
                    
                    {address.delivery_notes && (
                      <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-gray-700">
                        <strong>Notas:</strong> {address.delivery_notes}
                      </div>
                    )}
                    
                    <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                      Creada: {new Date(address.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}