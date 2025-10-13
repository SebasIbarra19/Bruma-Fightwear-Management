-- ================================================
-- 📦 TABLA: INVENTORY MOVEMENTS
-- Registro de todos los movimientos de inventario
-- ================================================

-- Crear la tabla de movimientos de inventario si no existe
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('entrada', 'salida', 'transferencia', 'ajuste')),
    
    -- Información del producto/variante
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    reference_sku TEXT, -- SKU de referencia en caso de que se elimine el producto
    
    -- Cantidades y costos
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2) DEFAULT 0.00,
    total_cost DECIMAL(10,2) DEFAULT 0.00,
    
    -- Ubicaciones
    location_from TEXT,
    location_to TEXT,
    
    -- Información del movimiento
    reason TEXT,
    reference_number TEXT, -- Número de factura, orden de compra, etc.
    user_name TEXT DEFAULT 'Sistema',
    notes TEXT,
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_inventory_movements_project_id ON inventory_movements(project_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_variant_id ON inventory_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON inventory_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_reference ON inventory_movements(reference_number);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_inventory_movements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_inventory_movements_updated_at
    BEFORE UPDATE ON inventory_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_movements_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE inventory_movements IS 'Registro de todos los movimientos de inventario (entradas, salidas, transferencias, ajustes)';
COMMENT ON COLUMN inventory_movements.movement_type IS 'Tipo de movimiento: entrada, salida, transferencia, ajuste';
COMMENT ON COLUMN inventory_movements.quantity IS 'Cantidad del movimiento (positivo para entradas, negativo para salidas)';
COMMENT ON COLUMN inventory_movements.reference_number IS 'Número de referencia (factura, orden de compra, etc.)';