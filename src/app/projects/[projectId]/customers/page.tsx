'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import type { User } from '@supabase/auth-helpers-nextjs'
import type { UserProject } from '@/types/database'

// Tipos para Customers
interface Customer {
  id: string
  project_id: string
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  country?: string
  contact_person?: string
  company_type?: 'individual' | 'company'
  tax_id?: string
  is_active: boolean
  credit_limit?: number
  payment_terms?: string
  notes?: string
  created_at: string
  updated_at: string
}

interface CustomerStats {
  totalCustomers: number
  activeCustomers: number
  inactiveCustomers: number
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  topCustomers: number
}

interface CustomerWithStats extends Customer {
  total_orders?: number
  total_spent?: number
  last_order_date?: string
  average_order_value?: number
}

interface Contact {
  id: string
  customer_id: string
  name: string
  position?: string
  email?: string
  phone?: string
  is_primary: boolean
  notes?: string
  created_at: string
  updated_at: string
}

interface CustomerSegment {
  id: string
  project_id: string
  name: string
  description?: string
  criteria?: Record<string, any>
  customer_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function CustomersPage() {
  // Estados generales
  const [user, setUser] = useState<User | null>(null)
  const [project, setProject] = useState<UserProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'clientes' | 'contactos' | 'segmentos' | 'estadisticas'>('clientes')
  
  // Estados para estadísticas generales
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    activeCustomers: 0,
    inactiveCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    topCustomers: 0
  })

  // Estados para Clientes
  const [customers, setCustomers] = useState<CustomerWithStats[]>([])
  const [customersLoading, setCustomersLoading] = useState(false)
  const [customersSearch, setCustomersSearch] = useState('')
  const [customersStatus, setCustomersStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [customersType, setCustomersType] = useState<'all' | 'individual' | 'company'>('all')

  // Estados para Contactos
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactsSearch, setContactsSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all')

  // Estados para Segmentos
  const [segments, setSegments] = useState<CustomerSegment[]>([])
  const [segmentsLoading, setSegmentsLoading] = useState(false)
  const [segmentsSearch, setSegmentsSearch] = useState('')

  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const projectSlug = params.projectId as string

  // Manejo de tabs con URL
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab)
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set('tab', tab)
    router.push(newUrl.pathname + newUrl.search, { scroll: false })
  }

  // Funciones para cargar datos - simuladas por ahora
  const loadCustomersStats = async () => {
    if (!project) return
    
    // Simulación de datos hasta que existan las tablas reales
    setStats({
      totalCustomers: 12,
      activeCustomers: 10,
      inactiveCustomers: 2,
      totalOrders: 155,
      totalRevenue: 1098500000,
      averageOrderValue: 7087096,
      topCustomers: 3
    })
  }

  const loadCustomers = async () => {
    if (!project) return
    setCustomersLoading(true)

    try {
      // Simulación de datos - reemplazar cuando existan las tablas
      const mockCustomers: CustomerWithStats[] = [
        // Clientes VIP (>100M/año)
        {
          id: 'cust1',
          project_id: project.project_id,
          name: 'Deportes El Campeón',
          email: 'info@deporteselcampeon.com',
          phone: '+57 301 234 5678',
          address: 'Calle 45 #23-15',
          city: 'Medellín',
          country: 'Colombia',
          contact_person: 'Carlos Rodríguez',
          company_type: 'company',
          tax_id: '900123456-1',
          is_active: true,
          credit_limit: 50000000,
          payment_terms: '30 días',
          total_orders: 25,
          total_spent: 185000000,
          last_order_date: '2024-09-20',
          average_order_value: 7400000,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-09-20T10:00:00Z'
        },
        {
          id: 'cust2',
          project_id: project.project_id,
          name: 'Gimnasio Fuerza Total',
          email: 'ventas@fuerzatotal.com',
          phone: '+57 302 987 6543',
          address: 'Carrera 70 #80-25',
          city: 'Bogotá',
          country: 'Colombia',
          contact_person: 'Ana María González',
          company_type: 'company',
          tax_id: '800987654-3',
          is_active: true,
          credit_limit: 30000000,
          payment_terms: '15 días',
          total_orders: 18,
          total_spent: 125000000,
          last_order_date: '2024-09-21',
          average_order_value: 6944444,
          created_at: '2024-02-20T08:30:00Z',
          updated_at: '2024-09-21T14:30:00Z'
        },
        {
          id: 'cust15',
          project_id: project.project_id,
          name: 'Elite Training Center',
          email: 'compras@elitetraining.com',
          phone: '+57 304 567 8901',
          address: 'Avenida 68 #125-45',
          city: 'Bogotá',
          country: 'Colombia',
          contact_person: 'Miguel Ángel Herrera',
          company_type: 'company',
          tax_id: '900456789-2',
          is_active: true,
          credit_limit: 75000000,
          payment_terms: '45 días',
          total_orders: 32,
          total_spent: 220000000,
          last_order_date: '2024-09-22',
          average_order_value: 6875000,
          created_at: '2023-11-20T09:30:00Z',
          updated_at: '2024-09-22T15:20:00Z'
        },
        
        // Clientes regulares - gimnasios
        {
          id: 'cust3',
          project_id: project.project_id,
          name: 'Crossfit Barranquilla',
          email: 'admin@crossfitbaq.com',
          phone: '+57 315 888 9999',
          address: 'Carrera 54 #76-23',
          city: 'Barranquilla',
          country: 'Colombia',
          contact_person: 'Roberto Silva',
          company_type: 'company',
          tax_id: '800555666-7',
          is_active: true,
          credit_limit: 25000000,
          payment_terms: '30 días',
          total_orders: 12,
          total_spent: 65000000,
          last_order_date: '2024-09-19',
          average_order_value: 5416666,
          created_at: '2024-03-05T14:00:00Z',
          updated_at: '2024-09-19T11:30:00Z'
        },
        {
          id: 'cust4',
          project_id: project.project_id,
          name: 'Bodytech Cali Sur',
          email: 'gerencia.calisur@bodytech.com.co',
          phone: '+57 318 777 5555',
          address: 'Avenida 6N #28-50',
          city: 'Cali',
          country: 'Colombia',
          contact_person: 'Patricia Londoño',
          company_type: 'company',
          tax_id: '800999888-4',
          is_active: true,
          credit_limit: 40000000,
          payment_terms: '15 días',
          total_orders: 16,
          total_spent: 85000000,
          last_order_date: '2024-09-21',
          average_order_value: 5312500,
          created_at: '2024-01-30T08:45:00Z',
          updated_at: '2024-09-21T16:20:00Z'
        },
        {
          id: 'cust5',
          project_id: project.project_id,
          name: 'Smart Fit Bucaramanga',
          email: 'compras@smartfit.com.co',
          phone: '+57 317 444 3333',
          address: 'Calle 56 #23-67',
          city: 'Bucaramanga',
          country: 'Colombia',
          contact_person: 'Andrés Moreno',
          company_type: 'company',
          tax_id: '800333222-1',
          is_active: true,
          credit_limit: 35000000,
          payment_terms: '30 días',
          total_orders: 14,
          total_spent: 72000000,
          last_order_date: '2024-09-18',
          average_order_value: 5142857,
          created_at: '2024-02-14T10:15:00Z',
          updated_at: '2024-09-18T13:40:00Z'
        },
        
        // Clientes individuales
        {
          id: 'cust6',
          project_id: project.project_id,
          name: 'Laura Patricia Martínez',
          email: 'laura.martinez@email.com',
          phone: '+57 315 555 1234',
          address: 'Transversal 12 #45-67',
          city: 'Cali',
          country: 'Colombia',
          company_type: 'individual',
          is_active: true,
          payment_terms: 'Contado',
          total_orders: 8,
          total_spent: 25000000,
          last_order_date: '2024-09-18',
          average_order_value: 3125000,
          created_at: '2024-03-10T12:00:00Z',
          updated_at: '2024-09-18T16:45:00Z'
        },
        {
          id: 'cust7',
          project_id: project.project_id,
          name: 'Carlos Eduardo Ramírez',
          email: 'carlos.ramirez@gmail.com',
          phone: '+57 310 666 7777',
          address: 'Carrera 15 #78-34',
          city: 'Medellín',
          country: 'Colombia',
          company_type: 'individual',
          is_active: true,
          payment_terms: 'Contado',
          total_orders: 5,
          total_spent: 18500000,
          last_order_date: '2024-09-16',
          average_order_value: 3700000,
          created_at: '2024-04-22T15:30:00Z',
          updated_at: '2024-09-16T09:15:00Z'
        },
        {
          id: 'cust8',
          project_id: project.project_id,
          name: 'María José Fernández',
          email: 'majo.fernandez@outlook.com',
          phone: '+57 314 888 9999',
          address: 'Calle 127 #45-89',
          city: 'Bogotá',
          country: 'Colombia',
          company_type: 'individual',
          is_active: true,
          payment_terms: '15 días',
          total_orders: 12,
          total_spent: 42000000,
          last_order_date: '2024-09-20',
          average_order_value: 3500000,
          created_at: '2024-01-05T11:20:00Z',
          updated_at: '2024-09-20T14:50:00Z'
        },
        
        // Distribuidores regionales
        {
          id: 'cust9',
          project_id: project.project_id,
          name: 'Distribuidora Deportiva del Caribe',
          email: 'ventas@depcaribe.com',
          phone: '+57 305 111 2222',
          address: 'Zona Industrial Vía 40',
          city: 'Barranquilla',
          country: 'Colombia',
          contact_person: 'Fernando Castro',
          company_type: 'company',
          tax_id: '900777888-9',
          is_active: true,
          credit_limit: 60000000,
          payment_terms: '60 días',
          total_orders: 28,
          total_spent: 150000000,
          last_order_date: '2024-09-23',
          average_order_value: 5357142,
          created_at: '2023-08-15T10:00:00Z',
          updated_at: '2024-09-23T08:30:00Z'
        },
        {
          id: 'cust10',
          project_id: project.project_id,
          name: 'Almacén Deportivo Santander',
          email: 'gerencia@depsantander.com',
          phone: '+57 307 333 4444',
          address: 'Centro Comercial Cacique',
          city: 'Bucaramanga',
          country: 'Colombia',
          contact_person: 'Gloria Pérez',
          company_type: 'company',
          tax_id: '800111222-3',
          is_active: true,
          credit_limit: 45000000,
          payment_terms: '45 días',
          total_orders: 22,
          total_spent: 95000000,
          last_order_date: '2024-09-17',
          average_order_value: 4318181,
          created_at: '2023-12-10T09:15:00Z',
          updated_at: '2024-09-17T12:45:00Z'
        },
        
        // Clientes inactivos
        {
          id: 'cust11',
          project_id: project.project_id,
          name: 'Gimnasio Old School',
          email: 'info@oldschoolgym.com',
          phone: '+57 316 555 6666',
          address: 'Carrera 30 #45-12',
          city: 'Medellín',
          country: 'Colombia',
          contact_person: 'Juan Carlos Ospina',
          company_type: 'company',
          tax_id: '800666777-8',
          is_active: false,
          credit_limit: 20000000,
          payment_terms: '30 días',
          total_orders: 6,
          total_spent: 28000000,
          last_order_date: '2024-05-15',
          average_order_value: 4666666,
          created_at: '2023-10-20T14:30:00Z',
          updated_at: '2024-05-15T16:20:00Z'
        },
        {
          id: 'cust12',
          project_id: project.project_id,
          name: 'Deportes La Victoria',
          email: 'ventas@deplavictoria.com',
          phone: '+57 312 777 8888',
          address: 'Calle 53 #67-89',
          city: 'Cali',
          country: 'Colombia',
          contact_person: 'Sandra Mejía',
          company_type: 'company',
          tax_id: '800444555-6',
          is_active: false,
          credit_limit: 15000000,
          payment_terms: '30 días',
          total_orders: 4,
          total_spent: 18000000,
          last_order_date: '2024-03-20',
          average_order_value: 4500000,
          created_at: '2024-01-08T08:00:00Z',
          updated_at: '2024-03-20T10:30:00Z'
        }
      ]

      setCustomers(mockCustomers)
    } catch (err) {
      console.error('Error loading customers:', err)
    } finally {
      setCustomersLoading(false)
    }
  }

  const loadContacts = async () => {
    if (!project) return
    setContactsLoading(true)

    try {
      // Simulación de datos - reemplazar cuando existan las tablas
      const mockContacts: Contact[] = [
        {
          id: 'contact1',
          customer_id: 'cust1',
          name: 'Carlos Rodríguez',
          position: 'Gerente General',
          email: 'carlos.rodriguez@deporteselcampeon.com',
          phone: '+57 301 234 5678',
          is_primary: true,
          notes: 'Contacto principal para pedidos grandes',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 'contact2',
          customer_id: 'cust1',
          name: 'María José Pérez',
          position: 'Jefe de Compras',
          email: 'compras@deporteselcampeon.com',
          phone: '+57 301 234 5679',
          is_primary: false,
          notes: 'Responsable de órdenes regulares',
          created_at: '2024-01-15T11:00:00Z',
          updated_at: '2024-01-15T11:00:00Z'
        },
        {
          id: 'contact3',
          customer_id: 'cust2',
          name: 'Ana María González',
          position: 'Propietaria',
          email: 'ventas@fuerzatotal.com',
          phone: '+57 302 987 6543',
          is_primary: true,
          notes: 'Toma decisiones de compra directamente',
          created_at: '2024-02-20T08:30:00Z',
          updated_at: '2024-02-20T08:30:00Z'
        }
      ]

      setContacts(mockContacts)
    } catch (err) {
      console.error('Error loading contacts:', err)
    } finally {
      setContactsLoading(false)
    }
  }

  const loadSegments = async () => {
    if (!project) return
    setSegmentsLoading(true)

    try {
      // Simulación de datos - reemplazar cuando existan las tablas
      const mockSegments: CustomerSegment[] = [
        {
          id: 'segment1',
          project_id: project.project_id,
          name: 'Clientes VIP',
          description: 'Clientes con compras superiores a $100M al año',
          criteria: {
            min_annual_spend: 100000000,
            min_orders: 10
          },
          customer_count: 15,
          is_active: true,
          created_at: '2024-01-10T10:00:00Z',
          updated_at: '2024-09-15T14:30:00Z'
        },
        {
          id: 'segment2',
          project_id: project.project_id,
          name: 'Gimnasios',
          description: 'Clientes especializados en equipos de gimnasio',
          criteria: {
            business_type: 'gym',
            avg_order_value: { min: 5000000 }
          },
          customer_count: 34,
          is_active: true,
          created_at: '2024-02-01T09:00:00Z',
          updated_at: '2024-09-10T11:20:00Z'
        },
        {
          id: 'segment3',
          project_id: project.project_id,
          name: 'Clientes Nuevos',
          description: 'Clientes registrados en los últimos 6 meses',
          criteria: {
            registration_date: { from: '2024-03-01' },
            max_orders: 5
          },
          customer_count: 23,
          is_active: true,
          created_at: '2024-03-01T12:00:00Z',
          updated_at: '2024-09-01T16:45:00Z'
        }
      ]

      setSegments(mockSegments)
    } catch (err) {
      console.error('Error loading segments:', err)
    } finally {
      setSegmentsLoading(false)
    }
  }

  // Funciones de filtrado
  const getFilteredCustomers = () => {
    return customers.filter(customer => {
      const matchesSearch = customersSearch === '' || 
        customer.name.toLowerCase().includes(customersSearch.toLowerCase()) ||
        customer.email.toLowerCase().includes(customersSearch.toLowerCase()) ||
        (customer.contact_person && customer.contact_person.toLowerCase().includes(customersSearch.toLowerCase()))
      
      const matchesStatus = customersStatus === 'all' || 
        (customersStatus === 'active' && customer.is_active) ||
        (customersStatus === 'inactive' && !customer.is_active)

      const matchesType = customersType === 'all' || customer.company_type === customersType

      return matchesSearch && matchesStatus && matchesType
    })
  }

  const getFilteredContacts = () => {
    return contacts.filter(contact => {
      const matchesSearch = contactsSearch === '' || 
        contact.name.toLowerCase().includes(contactsSearch.toLowerCase()) ||
        (contact.email && contact.email.toLowerCase().includes(contactsSearch.toLowerCase())) ||
        (contact.position && contact.position.toLowerCase().includes(contactsSearch.toLowerCase()))
      
      const matchesCustomer = selectedCustomer === 'all' || contact.customer_id === selectedCustomer

      return matchesSearch && matchesCustomer
    })
  }

  const getFilteredSegments = () => {
    return segments.filter(segment => {
      const matchesSearch = segmentsSearch === '' || 
        segment.name.toLowerCase().includes(segmentsSearch.toLowerCase()) ||
        (segment.description && segment.description.toLowerCase().includes(segmentsSearch.toLowerCase()))

      return matchesSearch
    })
  }

  // Función para toggle del estado del cliente
  const toggleCustomerStatus = async (customer: CustomerWithStats) => {
    try {
      // Simulación - reemplazar con llamada real a DB
      setCustomers(prev => prev.map(c => 
        c.id === customer.id ? { ...c, is_active: !c.is_active } : c
      ))
    } catch (err) {
      console.error('Error updating customer status:', err)
    }
  }

  // Función para toggle del estado del segmento
  const toggleSegmentStatus = async (segment: CustomerSegment) => {
    try {
      // Simulación - reemplazar con llamada real a DB
      setSegments(prev => prev.map(s => 
        s.id === segment.id ? { ...s, is_active: !s.is_active } : s
      ))
    } catch (err) {
      console.error('Error updating segment status:', err)
    }
  }

  // Efectos
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        router.push('/login')
        return
      }
      
      setUser(session.user)
      
      // Obtener datos del proyecto
      const { data: userProjects, error } = await supabase
        .from('user_projects')
        .select(`
          *,
          projects (*)
        `)
        .eq('user_id', session.user.id)
        .eq('projects.slug', projectSlug)
        .single()

      if (error || !userProjects) {
        console.error('Error fetching project:', error)
        router.push('/dashboard')
        return
      }

      const projectData = Array.isArray(userProjects.projects) 
        ? userProjects.projects[0] 
        : userProjects.projects

      if (!projectData) {
        router.push('/dashboard')
        return
      }

      setProject({
        project_id: projectData.id,
        project_name: projectData.name,
        project_slug: projectData.slug,
        project_description: projectData.description,
        project_type: projectData.project_type || '',
        user_role: userProjects.role,
        assigned_at: userProjects.assigned_at || '',
        config: projectData.config || {},
        color_scheme: projectData.color_scheme || {}
      } as UserProject)
    }

    getUser()
  }, [projectSlug, router])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['clientes', 'contactos', 'segmentos', 'estadisticas'].includes(tab)) {
      setActiveTab(tab as typeof activeTab)
    }
  }, [searchParams])

  useEffect(() => {
    if (project) {
      const loadData = async () => {
        setLoading(true)
        await Promise.all([
          loadCustomersStats(),
          loadCustomers(),
          loadContacts(),
          loadSegments()
        ])
        setLoading(false)
      }
      loadData()
    }
  }, [project])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando clientes...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">Proyecto no encontrado</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>→</span>
            <Link href={`/projects/${projectSlug}/dashboard`} className="hover:text-blue-600">
              {project?.project_name}
            </Link>
            <span>→</span>
            <span className="text-gray-900">Clientes</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img 
                src="/images/bruma/logo-circle.svg" 
                alt="BRUMA Fightwear" 
                className="w-12 h-12"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
                <p className="text-gray-600 mt-2">
                  Administra la base de clientes de {project.project_name}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas Generales */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">{stats.totalCustomers}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">{stats.activeCustomers}</div>
              <div className="text-sm text-gray-600">Activos</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-red-600">{stats.inactiveCustomers}</div>
              <div className="text-sm text-gray-600">Inactivos</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-purple-600">{stats.totalOrders}</div>
              <div className="text-sm text-gray-600">Pedidos</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-emerald-600">${(stats.totalRevenue / 1000000).toFixed(0)}M</div>
              <div className="text-sm text-gray-600">Ingresos</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-indigo-600">${(stats.averageOrderValue / 1000).toFixed(0)}K</div>
              <div className="text-sm text-gray-600">Promedio</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-orange-600">{stats.topCustomers}</div>
              <div className="text-sm text-gray-600">VIP</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleTabChange('clientes')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'clientes'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              👥 Clientes
            </button>
            <button
              onClick={() => handleTabChange('contactos')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'contactos'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📞 Contactos
            </button>
            <button
              onClick={() => handleTabChange('segmentos')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'segmentos'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🎯 Segmentos
            </button>
            <button
              onClick={() => handleTabChange('estadisticas')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'estadisticas'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Estadísticas
            </button>
          </div>
        </div>

        {/* Contenido del Tab de Clientes */}
        {activeTab === 'clientes' && (
          <>
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buscar clientes
                    </label>
                    <Input
                      placeholder="Nombre, email, contacto..."
                      value={customersSearch}
                      onChange={(e) => setCustomersSearch(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={customersStatus}
                      onChange={(e) => setCustomersStatus(e.target.value as any)}
                    >
                      <option value="all">Todos</option>
                      <option value="active">Activos</option>
                      <option value="inactive">Inactivos</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={customersType}
                      onChange={(e) => setCustomersType(e.target.value as any)}
                    >
                      <option value="all">Todos</option>
                      <option value="individual">Persona Natural</option>
                      <option value="company">Empresa</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <Link href={`/projects/${projectSlug}/customers/new`}>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        + Nuevo Cliente
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Clientes
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Mostrando {getFilteredCustomers().length} clientes
                    </p>
                  </div>
                </div>

                {customersLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando clientes...</p>
                  </div>
                ) : getFilteredCustomers().length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-4xl mb-4">👥</div>
                    <p className="text-gray-600 mb-2">No hay clientes</p>
                    <p className="text-sm text-gray-500">
                      Los clientes aparecerán aquí
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cliente
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contacto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ciudad
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pedidos
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Gastado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getFilteredCustomers().map((customer) => (
                          <tr key={customer.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {customer.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {customer.email}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                customer.company_type === 'company'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {customer.company_type === 'company' ? 'Empresa' : 'Individual'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {customer.contact_person || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {customer.phone}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {customer.city ? `${customer.city}, ${customer.country}` : 'Sin especificar'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {customer.total_orders || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${((customer.total_spent || 0) / 1000000).toFixed(1)}M
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => toggleCustomerStatus(customer)}
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  customer.is_active
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                              >
                                {customer.is_active ? 'Activo' : 'Inactivo'}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link
                                href={`/projects/${projectSlug}/customers/${customer.id}`}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                Ver
                              </Link>
                              <Link
                                href={`/projects/${projectSlug}/customers/${customer.id}/edit`}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Editar
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Contenido del Tab de Contactos */}
        {activeTab === 'contactos' && (
          <>
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buscar contactos
                    </label>
                    <Input
                      placeholder="Nombre, email, posición..."
                      value={contactsSearch}
                      onChange={(e) => setContactsSearch(e.target.value)}
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
                  
                  <div className="flex items-end">
                    <Link href={`/projects/${projectSlug}/customers/contacts/new`}>
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        + Nuevo Contacto
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Contactos
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Mostrando {getFilteredContacts().length} contactos
                    </p>
                  </div>
                </div>

                {contactsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando contactos...</p>
                  </div>
                ) : getFilteredContacts().length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-4xl mb-4">📞</div>
                    <p className="text-gray-600 mb-2">No hay contactos</p>
                    <p className="text-sm text-gray-500">
                      Los contactos aparecerán aquí
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contacto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cliente
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Posición
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Teléfono
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getFilteredContacts().map((contact) => {
                          const customer = customers.find(c => c.id === contact.customer_id)
                          return (
                            <tr key={contact.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {contact.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {contact.email}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {customer?.name || 'Cliente no encontrado'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {contact.position || 'Sin especificar'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {contact.phone}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  contact.is_primary
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {contact.is_primary ? 'Principal' : 'Secundario'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Link
                                  href={`/projects/${projectSlug}/customers/contacts/${contact.id}`}
                                  className="text-purple-600 hover:text-purple-900 mr-4"
                                >
                                  Ver
                                </Link>
                                <Link
                                  href={`/projects/${projectSlug}/customers/contacts/${contact.id}/edit`}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  Editar
                                </Link>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Contenido del Tab de Segmentos */}
        {activeTab === 'segmentos' && (
          <>
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buscar segmentos
                    </label>
                    <Input
                      placeholder="Nombre, descripción..."
                      value={segmentsSearch}
                      onChange={(e) => setSegmentsSearch(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Link href={`/projects/${projectSlug}/customers/segments/new`}>
                      <Button className="bg-green-600 hover:bg-green-700">
                        + Nuevo Segmento
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {segmentsLoading ? (
                <div className="col-span-full text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Cargando segmentos...</p>
                </div>
              ) : getFilteredSegments().length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">🎯</div>
                  <p className="text-gray-600 mb-2">No hay segmentos</p>
                  <p className="text-sm text-gray-500">
                    Los segmentos aparecerán aquí
                  </p>
                </div>
              ) : (
                getFilteredSegments().map((segment) => (
                  <Card key={segment.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{segment.name}</CardTitle>
                        <button
                          onClick={() => toggleSegmentStatus(segment)}
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            segment.is_active
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {segment.is_active ? 'Activo' : 'Inactivo'}
                        </button>
                      </div>
                      <CardDescription>{segment.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Clientes</span>
                          <span className="text-lg font-semibold text-blue-600">
                            {segment.customer_count}
                          </span>
                        </div>
                        
                        <div className="border-t pt-3">
                          <div className="flex space-x-2">
                            <Link
                              href={`/projects/${projectSlug}/customers/segments/${segment.id}`}
                              className="flex-1"
                            >
                              <Button variant="outline" size="sm" className="w-full">
                                Ver Detalles
                              </Button>
                            </Link>
                            <Link
                              href={`/projects/${projectSlug}/customers/segments/${segment.id}/edit`}
                              className="flex-1"
                            >
                              <Button variant="outline" size="sm" className="w-full">
                                Editar
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </>
        )}

        {/* Contenido del Tab de Estadísticas */}
        {activeTab === 'estadisticas' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total de Clientes</span>
                    <span className="font-semibold">{stats.totalCustomers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Clientes Activos</span>
                    <span className="font-semibold text-green-600">{stats.activeCustomers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Clientes Inactivos</span>
                    <span className="font-semibold text-red-600">{stats.inactiveCustomers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Clientes VIP</span>
                    <span className="font-semibold text-orange-600">{stats.topCustomers}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas de Ventas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total de Pedidos</span>
                    <span className="font-semibold">{stats.totalOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ingresos Totales</span>
                    <span className="font-semibold text-green-600">${(stats.totalRevenue / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor Promedio Pedido</span>
                    <span className="font-semibold text-blue-600">${(stats.averageOrderValue / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pedidos por Cliente</span>
                    <span className="font-semibold text-purple-600">{(stats.totalOrders / stats.totalCustomers).toFixed(1)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Análisis Avanzado</CardTitle>
                <CardDescription>
                  Insights detallados sobre comportamiento de clientes (próximamente)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">📈</div>
                  <p className="text-gray-600 mb-2">Análisis de Comportamiento</p>
                  <p className="text-sm text-gray-500">
                    Gráficos de retención, análisis de segmentación automática,<br />
                    predicción de churn y métricas de lifetime value
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  )
}