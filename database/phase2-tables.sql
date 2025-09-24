-- Script de creación de tablas para BRUMA Fase 2
-- Inventario y Proveedores (Operacional)

-- Tabla de proveedores
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    tax_id VARCHAR(50),
    payment_terms TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de inventario
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    product_id UUID, -- Referencias opcionales hasta que se creen las tablas de productos
    product_variant_id UUID, -- Referencias opcionales hasta que se creen las tablas de productos
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    sku VARCHAR(100) NOT NULL,
    product_name VARCHAR(255), -- Nombre del producto para referencia directa
    product_description TEXT, -- Descripción del producto
    quantity_available INTEGER NOT NULL DEFAULT 0,
    quantity_reserved INTEGER NOT NULL DEFAULT 0,
    quantity_on_order INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER,
    reorder_quantity INTEGER,
    unit_cost DECIMAL(10,2),
    last_cost DECIMAL(10,2),
    average_cost DECIMAL(10,2),
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, sku)
);

-- Tabla de órdenes de compra
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    order_number VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'ordered', 'partial', 'received', 'cancelled')),
    order_date DATE,
    expected_date DATE,
    received_date DATE,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    shipping_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payment_terms TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, order_number)
);

-- Tabla de elementos de órdenes de compra
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    description TEXT,
    quantity_ordered INTEGER NOT NULL,
    quantity_received INTEGER NOT NULL DEFAULT 0,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(12,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de movimientos de inventario
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'transfer')),
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(12,2),
    reference_type VARCHAR(50),
    reference_id UUID,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_suppliers_project_id ON suppliers(project_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email);

CREATE INDEX IF NOT EXISTS idx_inventory_project_id ON inventory(project_id);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_supplier_id ON inventory(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_project_id ON purchase_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date ON purchase_orders(order_date);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_purchase_order_id ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_sku ON purchase_order_items(sku);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_project_id ON inventory_movements(project_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_inventory_id ON inventory_movements(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at);

-- Triggers para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a las tablas necesarias
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory;
CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchase_orders_updated_at ON purchase_orders;
CREATE TRIGGER update_purchase_orders_updated_at
    BEFORE UPDATE ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchase_order_items_updated_at ON purchase_order_items;
CREATE TRIGGER update_purchase_order_items_updated_at
    BEFORE UPDATE ON purchase_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Políticas de seguridad RLS (Row Level Security)
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- Políticas para suppliers
DROP POLICY IF EXISTS "Users can view suppliers from their projects" ON suppliers;
CREATE POLICY "Users can view suppliers from their projects" ON suppliers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_projects 
            WHERE user_projects.project_id = suppliers.project_id 
            AND user_projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert suppliers in their projects" ON suppliers;
CREATE POLICY "Users can insert suppliers in their projects" ON suppliers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_projects 
            WHERE user_projects.project_id = suppliers.project_id 
            AND user_projects.user_id = auth.uid()
            AND user_projects.role IN ('owner', 'admin', 'editor')
        )
    );

DROP POLICY IF EXISTS "Users can update suppliers in their projects" ON suppliers;
CREATE POLICY "Users can update suppliers in their projects" ON suppliers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_projects 
            WHERE user_projects.project_id = suppliers.project_id 
            AND user_projects.user_id = auth.uid()
            AND user_projects.role IN ('owner', 'admin', 'editor')
        )
    );

DROP POLICY IF EXISTS "Users can delete suppliers in their projects" ON suppliers;
CREATE POLICY "Users can delete suppliers in their projects" ON suppliers
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_projects 
            WHERE user_projects.project_id = suppliers.project_id 
            AND user_projects.user_id = auth.uid()
            AND user_projects.role IN ('owner', 'admin')
        )
    );

-- Políticas para inventory (similar structure)
DROP POLICY IF EXISTS "Users can view inventory from their projects" ON inventory;
CREATE POLICY "Users can view inventory from their projects" ON inventory
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_projects 
            WHERE user_projects.project_id = inventory.project_id 
            AND user_projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage inventory in their projects" ON inventory;
CREATE POLICY "Users can manage inventory in their projects" ON inventory
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_projects 
            WHERE user_projects.project_id = inventory.project_id 
            AND user_projects.user_id = auth.uid()
            AND user_projects.role IN ('owner', 'admin', 'editor')
        )
    );

-- Políticas para purchase_orders
DROP POLICY IF EXISTS "Users can view purchase orders from their projects" ON purchase_orders;
CREATE POLICY "Users can view purchase orders from their projects" ON purchase_orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_projects 
            WHERE user_projects.project_id = purchase_orders.project_id 
            AND user_projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage purchase orders in their projects" ON purchase_orders;
CREATE POLICY "Users can manage purchase orders in their projects" ON purchase_orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_projects 
            WHERE user_projects.project_id = purchase_orders.project_id 
            AND user_projects.user_id = auth.uid()
            AND user_projects.role IN ('owner', 'admin', 'editor')
        )
    );

-- Políticas para purchase_order_items
DROP POLICY IF EXISTS "Users can view purchase order items" ON purchase_order_items;
CREATE POLICY "Users can view purchase order items" ON purchase_order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM purchase_orders p
            JOIN user_projects up ON up.project_id = p.project_id
            WHERE p.id = purchase_order_items.purchase_order_id 
            AND up.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage purchase order items" ON purchase_order_items;
CREATE POLICY "Users can manage purchase order items" ON purchase_order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM purchase_orders p
            JOIN user_projects up ON up.project_id = p.project_id
            WHERE p.id = purchase_order_items.purchase_order_id 
            AND up.user_id = auth.uid()
            AND up.role IN ('owner', 'admin', 'editor')
        )
    );

-- Políticas para inventory_movements
DROP POLICY IF EXISTS "Users can view inventory movements from their projects" ON inventory_movements;
CREATE POLICY "Users can view inventory movements from their projects" ON inventory_movements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_projects 
            WHERE user_projects.project_id = inventory_movements.project_id 
            AND user_projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create inventory movements in their projects" ON inventory_movements;
CREATE POLICY "Users can create inventory movements in their projects" ON inventory_movements
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_projects 
            WHERE user_projects.project_id = inventory_movements.project_id 
            AND user_projects.user_id = auth.uid()
            AND user_projects.role IN ('owner', 'admin', 'editor')
        )
    );

-- Comentario de finalización
-- Tablas de la Fase 2 creadas exitosamente
-- Recuerda ejecutar este script en Supabase SQL Editor

-- NOTA: Cuando se creen las tablas 'products' y 'product_variants' (mediante database-update.sql),
-- ejecutar este script adicional para agregar las restricciones de clave foránea:
/*
-- Script de actualización post-creación de tablas de productos
ALTER TABLE inventory 
ADD CONSTRAINT fk_inventory_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

ALTER TABLE inventory 
ADD CONSTRAINT fk_inventory_product_variant_id 
FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE SET NULL;
*/