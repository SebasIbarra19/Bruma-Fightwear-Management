'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../../../../components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import { ModernTable } from '@/components/ui/modern-table'
import type { User } from '@supabase/auth-helpers-nextjs'
import type { UserProject } from '@/types/database'

// Tipos específicos para purchase_order_items de Phase 2
interface PurchaseOrderItemPhase2 {
  id: string
  purchase_order_id: string
  sku: string
  description: string | null
  quantity_ordered: number
  quantity_received: number
  unit_cost: number
  total_cost: number
  notes: string | null
  created_at: string
  updated_at: string
}

interface PurchaseOrderWithItems {
  id: string
  project_id: string
  supplier_id: string
  order_number: string | null
  status: 'draft' | 'pending' | 'ordered' | 'partial' | 'received' | 'cancelled'
  order_date: string | null
  expected_date: string | null
  received_date: string | null
  subtotal: number
  tax_amount: number
  shipping_cost: number
  total_amount: number
  currency: string
  payment_terms: string | null
  notes: string | null
  created_at: string
  updated_at: string
  suppliers?: {
    id: string
    name: string
    contact_person?: string
    email?: string
  } | null
  items?: PurchaseOrderItemPhase2[]
}

export default function PurchaseOrderDetailPage() {
  const [user, setUser] = useState<User | null>(null)
  const [project, setProject] = useState<UserProject | null>(null)
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrderWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddItemDialog, setShowAddItemDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<PurchaseOrderItemPhase2 | null>(null)
  const [formData, setFormData] = useState({
    sku: '',
    description: '',
    quantity_ordered: '',
    unit_cost: ''
  })

  const router = useRouter()
  const params = useParams()
  const projectSlug = params.projectId as string
  const orderId = params.orderId as string

  useEffect(() => {
    loadProjectAndAuth()
  }, [])

  const loadProjectAndAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth/login')
        return
      }

      setUser(session.user)

      // Obtener proyectos del usuario
      const { data: userProjects, error } = await supabase
        .rpc('get_user_projects', { user_uuid: session.user.id })

      if (error) {
        console.error('Error obteniendo proyectos:', error)
        router.push('/dashboard')
        return
      }

      const currentProject = userProjects?.find((p: UserProject) => p.project_slug === projectSlug)
      
      if (!currentProject) {
        console.error('Proyecto no encontrado o sin acceso')
        router.push('/dashboard')
        return
      }

      setProject(currentProject)
      await loadPurchaseOrderData(currentProject.project_id)
      
    } catch (error) {
      console.error('Error:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadPurchaseOrderData = async (projectId: string) => {
    try {
      // Obtener la orden de compra
      const { data: orderData, error: orderError } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers (
            id,
            name,
            contact_person,
            email
          )
        `)
        .eq('id', orderId)
        .eq('project_id', projectId)
        .single()

      if (orderError) {
        console.error('Error loading purchase order:', orderError)
        router.push(`/projects/${projectSlug}/purchase-orders`)
        return
      }

      // Obtener los items de la orden
      const { data: itemsData, error: itemsError } = await supabase
        .from('purchase_order_items')
        .select('*')
        .eq('purchase_order_id', orderId)
        .order('created_at')

      if (itemsError) {
        console.error('Error loading purchase order items:', itemsError)
        return
      }

      setPurchaseOrder({
        ...orderData,
        items: itemsData || []
      })

    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleAddItem = async () => {
    if (!purchaseOrder || !formData.sku || !formData.quantity_ordered || !formData.unit_cost) {
      return
    }

    try {
      const quantity = parseInt(formData.quantity_ordered)
      const unitCost = parseFloat(formData.unit_cost)
      const totalCost = quantity * unitCost

      const { error } = await supabase
        .from('purchase_order_items')
        .insert({
          purchase_order_id: purchaseOrder.id,
          sku: formData.sku,
          description: formData.description || null,
          quantity_ordered: quantity,
          unit_cost: unitCost,
          total_cost: totalCost
        })

      if (error) {
        console.error('Error adding item:', error)
        return
      }

      // Recargar datos
      await loadPurchaseOrderData(project!.project_id)
      
      // Limpiar formulario
      setFormData({
        sku: '',
        description: '',
        quantity_ordered: '',
        unit_cost: ''
      })
      setShowAddItemDialog(false)

    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleEditItem = async () => {
    if (!editingItem || !formData.sku || !formData.quantity_ordered || !formData.unit_cost) {
      return
    }

    try {
      const quantity = parseInt(formData.quantity_ordered)
      const unitCost = parseFloat(formData.unit_cost)
      const totalCost = quantity * unitCost

      const { error } = await supabase
        .from('purchase_order_items')
        .update({
          sku: formData.sku,
          description: formData.description || null,
          quantity_ordered: quantity,
          unit_cost: unitCost,
          total_cost: totalCost,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingItem.id)

      if (error) {
        console.error('Error updating item:', error)
        return
      }

      await loadPurchaseOrderData(project!.project_id)
      setEditingItem(null)
      setFormData({
        sku: '',
        description: '',
        quantity_ordered: '',
        unit_cost: ''
      })

    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este item?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('purchase_order_items')
        .delete()
        .eq('id', itemId)

      if (error) {
        console.error('Error deleting item:', error)
        return
      }

      await loadPurchaseOrderData(project!.project_id)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const openEditDialog = (item: PurchaseOrderItemPhase2) => {
    setEditingItem(item)
    setFormData({
      sku: item.sku,
      description: item.description || '',
      quantity_ordered: item.quantity_ordered.toString(),
      unit_cost: item.unit_cost.toString()
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'draft': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Borrador' },
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      'ordered': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Ordenado' },
      'partial': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Parcial' },
      'received': { bg: 'bg-green-100', text: 'text-green-800', label: 'Recibido' },
      'cancelled': { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelado' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando orden de compra...</p>
        </div>
      </div>
    )
  }

  if (!project || !purchaseOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">Orden de compra no encontrada</p>
          <Link href={`/projects/${projectSlug}/purchase-orders`}>
            <Button className="mt-4">Volver a órdenes</Button>
          </Link>
        </div>
      </div>
    )
  }

  const totalItems = purchaseOrder.items?.length || 0
  const totalQuantity = purchaseOrder.items?.reduce((sum, item) => sum + item.quantity_ordered, 0) || 0
  const calculatedSubtotal = purchaseOrder.items?.reduce((sum, item) => sum + item.total_cost, 0) || 0

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
            <Link href={`/projects/${projectSlug}/purchase-orders`} className="hover:text-blue-600">
              Órdenes de Compra
            </Link>
            <span>→</span>
            <span className="text-gray-900">
              {purchaseOrder.order_number || `PO-${purchaseOrder.id.slice(0, 8)}`}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img 
                src="/images/bruma/logo-circle.svg" 
                alt="BRUMA Fightwear" 
                className="w-12 h-12"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Orden #{purchaseOrder.order_number || purchaseOrder.id.slice(0, 8)}
                </h1>
                <p className="text-gray-600 mt-2">
                  Items de la orden de compra
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    + Agregar Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Agregar Nuevo Item</DialogTitle>
                    <DialogDescription>
                      Agrega un nuevo producto a esta orden de compra
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">SKU *</label>
                      <Input
                        value={formData.sku}
                        onChange={(e) => setFormData({...formData, sku: e.target.value})}
                        placeholder="Ej: BRU-RG-001-M"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Descripción</label>
                      <Input
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Descripción del producto"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Cantidad *</label>
                      <Input
                        type="number"
                        value={formData.quantity_ordered}
                        onChange={(e) => setFormData({...formData, quantity_ordered: e.target.value})}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Costo Unitario *</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.unit_cost}
                        onChange={(e) => setFormData({...formData, unit_cost: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    {formData.quantity_ordered && formData.unit_cost && (
                      <div className="text-sm text-gray-600">
                        Total: {formatCurrency(parseInt(formData.quantity_ordered) * parseFloat(formData.unit_cost))}
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddItemDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddItem}>
                      Agregar Item
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Información de la orden */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Proveedor:</span>
                  <div className="font-medium">{purchaseOrder.suppliers?.name}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Estado:</span>
                  <div className="mt-1">{getStatusBadge(purchaseOrder.status)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Fecha de Orden:</span>
                  <div className="font-medium">
                    {purchaseOrder.order_date 
                      ? new Date(purchaseOrder.order_date).toLocaleDateString()
                      : 'No definida'
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen de Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Total Items:</span>
                  <div className="font-medium">{totalItems}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Cantidad Total:</span>
                  <div className="font-medium">{totalQuantity}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Subtotal Calculado:</span>
                  <div className="font-medium">{formatCurrency(calculatedSubtotal)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Totales de la Orden</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Subtotal:</span>
                  <div className="font-medium">{formatCurrency(purchaseOrder.subtotal)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Impuestos:</span>
                  <div className="font-medium">{formatCurrency(purchaseOrder.tax_amount)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Envío:</span>
                  <div className="font-medium">{formatCurrency(purchaseOrder.shipping_cost)}</div>
                </div>
                <div className="border-t pt-2">
                  <span className="text-sm text-gray-500">Total:</span>
                  <div className="font-bold text-lg">{formatCurrency(purchaseOrder.total_amount)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de items */}
        <ModernTable
          title="Items de la Orden"
          subtitle={`${totalItems} productos incluidos en esta orden de compra`}
              data={purchaseOrder.items || []}
              columns={[
                {
                  key: 'sku',
                  title: 'SKU',
                  sortable: true,
                  render: (value, row) => (
                    <div>
                      <div className="font-medium">{value}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(row.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  )
                },
                {
                  key: 'description',
                  title: 'Descripción',
                  sortable: true,
                  render: (value, row) => (
                    <div>
                      <div>{value || '-'}</div>
                      {row.notes && (
                        <div className="text-sm text-gray-500 mt-1">{row.notes}</div>
                      )}
                    </div>
                  )
                },
                {
                  key: 'quantity_ordered',
                  title: 'Cantidad',
                  sortable: true,
                  render: (value, row) => (
                    <div>
                      <div className="font-medium">{value}</div>
                      {row.quantity_received > 0 && (
                        <div className="text-sm text-green-600">
                          Recibido: {row.quantity_received}
                        </div>
                      )}
                    </div>
                  )
                },
                {
                  key: 'unit_cost',
                  title: 'Costo Unit.',
                  sortable: true,
                  render: (value) => (
                    <div className="font-medium">{formatCurrency(value)}</div>
                  )
                },
                {
                  key: 'total_cost',
                  title: 'Total',
                  sortable: true,
                  render: (value) => (
                    <div className="font-medium">{formatCurrency(value)}</div>
                  )
                }
              ]}
              renderExpandedRow={(row) => (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                  <div>
                    <h4 className="font-semibold mb-2">Detalles del Item</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-500">ID:</span> {row.id}</p>
                      <p><span className="text-gray-500">SKU:</span> {row.sku}</p>
                      <p><span className="text-gray-500">Descripción:</span> {row.description || 'Sin descripción'}</p>
                      {row.notes && (
                        <p><span className="text-gray-500">Notas:</span> {row.notes}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Cantidades y Costos</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-500">Cantidad ordenada:</span> {row.quantity_ordered}</p>
                      <p><span className="text-gray-500">Cantidad recibida:</span> {row.quantity_received}</p>
                      <p><span className="text-gray-500">Costo unitario:</span> {formatCurrency(row.unit_cost)}</p>
                      <p><span className="text-gray-500 font-medium">Costo total:</span> <span className="font-medium">{formatCurrency(row.total_cost)}</span></p>
                    </div>
                  </div>
                </div>
              )}
              onEdit={(item) => openEditDialog(item)}
              onDelete={(item) => handleDeleteItem(item.id)}
              onRefresh={() => project && loadPurchaseOrderData(project.project_id)}
            />

        {/* Dialog para editar item */}
        <Dialog open={!!editingItem} onOpenChange={(open: boolean) => !open && setEditingItem(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Item</DialogTitle>
              <DialogDescription>
                Modifica los datos del producto
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">SKU *</label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  placeholder="Ej: BRU-RG-001-M"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descripción</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descripción del producto"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Cantidad *</label>
                <Input
                  type="number"
                  value={formData.quantity_ordered}
                  onChange={(e) => setFormData({...formData, quantity_ordered: e.target.value})}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Costo Unitario *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.unit_cost}
                  onChange={(e) => setFormData({...formData, unit_cost: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              {formData.quantity_ordered && formData.unit_cost && (
                <div className="text-sm text-gray-600">
                  Total: {formatCurrency(parseInt(formData.quantity_ordered) * parseFloat(formData.unit_cost))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingItem(null)}>
                Cancelar
              </Button>
              <Button onClick={handleEditItem}>
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}