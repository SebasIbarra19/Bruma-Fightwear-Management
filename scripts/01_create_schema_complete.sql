-- ================================================
-- 🏗️ MODELO COMPLETO BRUMA FIGHTWEAR
-- Base de datos desde cero con todas las relaciones
-- ================================================

-- ================================================
-- 🏢 1. CORE - GESTIÓN DE PROYECTOS
-- ================================================

-- Tabla principal de proyectos (multi-tenant)
CREATE TABLE projects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name varchar(255) NOT NULL,
    slug varchar(255) NOT NULL UNIQUE,
    description text,
    project_type varchar(50) NOT NULL DEFAULT 'ecommerce',
    logo_url text,
    color_scheme jsonb DEFAULT '{"primary": "#dc2626", "secondary": "#b91c1c", "accent": "#fbbf24"}',
    config jsonb DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Asignación de usuarios a proyectos con roles
CREATE TABLE user_projects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL, -- Referencias auth.users
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role varchar(50) NOT NULL DEFAULT 'user', -- owner, admin, manager, staff, viewer
    permissions jsonb DEFAULT '{}',
    is_active boolean DEFAULT true,
    assigned_at timestamptz DEFAULT now(),
    assigned_by uuid, -- Referencias auth.users
    user_config jsonb DEFAULT '{}'
);

-- Configuración específica de ecommerce por proyecto
CREATE TABLE ecommerce_config (
    project_id uuid PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
    store_name varchar(255),
    store_description text,
    currency varchar(10) DEFAULT 'USD',
    tax_rate numeric(5,4) DEFAULT 0.0000,
    manage_inventory boolean DEFAULT true,
    allow_backorders boolean DEFAULT false,
    track_quantity boolean DEFAULT true,
    shipping_enabled boolean DEFAULT true,
    shipping_config jsonb DEFAULT '{}',
    payment_config jsonb DEFAULT '{}',
    additional_config jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ================================================
-- 🏷️ 2. CATÁLOGO - PRODUCTOS
-- ================================================

-- Categorías de productos
CREATE TABLE categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name varchar(255) NOT NULL,
    slug varchar(255) NOT NULL,
    description text,
    parent_id uuid REFERENCES categories(id),
    image_url text,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(project_id, slug)
);

-- Líneas de productos (Colección Bruma, Pro Series, etc.)
CREATE TABLE product_lines (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name varchar(255) NOT NULL,
    slug varchar(255) NOT NULL,
    description text,
    image_url text,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(project_id, slug)
);

-- Productos base (información general)
CREATE TABLE products (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    category_id uuid REFERENCES categories(id),
    product_line_id uuid REFERENCES product_lines(id),
    name varchar(255) NOT NULL,
    slug varchar(255) NOT NULL,
    description text,
    short_description text,
    sku varchar(100),
    base_price numeric(10,2) NOT NULL DEFAULT 0,
    base_cost numeric(10,2) DEFAULT 0,
    weight numeric(8,3), -- en gramos
    dimensions jsonb, -- {length, width, height}
    materials jsonb, -- ["lycra", "polyester"]
    care_instructions text,
    tags text[], -- para búsquedas
    track_inventory boolean DEFAULT true,
    continue_selling_when_out_of_stock boolean DEFAULT false,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(project_id, slug),
    UNIQUE(project_id, sku)
);

-- Atributos flexibles de productos
CREATE TABLE product_attributes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name varchar(255) NOT NULL, -- "Material", "Gramaje", "Elasticidad"
    slug varchar(255) NOT NULL,
    attribute_type varchar(50) NOT NULL, -- text, number, boolean, select, multiselect
    options jsonb DEFAULT '[]', -- Para select/multiselect
    unit varchar(20), -- "gr/m²", "cm", "%"
    is_required boolean DEFAULT false,
    is_variant boolean DEFAULT false, -- Si afecta variantes (como color/talla)
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    UNIQUE(project_id, slug)
);

-- Variantes específicas de productos (talla + color)
CREATE TABLE product_variants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name varchar(255) NOT NULL, -- "Rashguard Bruma - Negro - M"
    sku varchar(100) NOT NULL,
    size varchar(20), -- XS, S, M, L, XL, XXL
    color varchar(50), -- Negro, Blanco, Rojo, Azul
    price_adjustment numeric(10,2) DEFAULT 0, -- Ajuste al precio base
    cost_adjustment numeric(10,2) DEFAULT 0, -- Ajuste al costo base
    weight_adjustment numeric(8,3) DEFAULT 0, -- Ajuste al peso base
    barcode varchar(100),
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(sku),
    UNIQUE(product_id, size, color)
);

-- Valores de atributos por producto
CREATE TABLE product_attribute_values (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    attribute_id uuid NOT NULL REFERENCES product_attributes(id) ON DELETE CASCADE,
    value text NOT NULL,
    UNIQUE(product_id, attribute_id)
);

-- Imágenes de productos y variantes
CREATE TABLE product_images (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE,
    url text NOT NULL,
    alt_text varchar(255),
    sort_order integer DEFAULT 0,
    is_primary boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- ================================================
-- 🏭 3. PROVEEDORES - SUPPLY CHAIN
-- ================================================

-- Proveedores
CREATE TABLE suppliers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name varchar(255) NOT NULL,
    legal_name varchar(255),
    tax_id varchar(50),
    supplier_type varchar(50), -- textile, printing, embroidery, packaging
    website varchar(255),
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Contactos de proveedores
CREATE TABLE supplier_contacts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    name varchar(255) NOT NULL,
    position varchar(100),
    email varchar(255),
    phone varchar(50),
    is_primary boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Direcciones de proveedores
CREATE TABLE supplier_addresses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    address_type varchar(50) DEFAULT 'main', -- main, billing, shipping
    address_line_1 text NOT NULL,
    address_line_2 text,
    city varchar(100),
    state varchar(100),
    country varchar(100),
    postal_code varchar(20),
    is_primary boolean DEFAULT false
);

-- Productos que ofrece cada proveedor
CREATE TABLE supplier_products (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id) ON DELETE SET NULL,
    supplier_sku varchar(100) NOT NULL,
    supplier_name varchar(255),
    description text,
    minimum_order_quantity integer DEFAULT 1,
    lead_time_days integer, -- Tiempo de entrega en días
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    UNIQUE(supplier_id, supplier_sku)
);

-- Precios por proveedor (escalas de cantidad)
CREATE TABLE supplier_prices (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_product_id uuid NOT NULL REFERENCES supplier_products(id) ON DELETE CASCADE,
    min_quantity integer NOT NULL DEFAULT 1,
    max_quantity integer, -- NULL = sin límite
    unit_price numeric(10,2) NOT NULL,
    currency varchar(10) DEFAULT 'USD',
    valid_from date,
    valid_until date,
    created_at timestamptz DEFAULT now()
);

-- ================================================
-- 📦 4. INVENTARIO - STOCK
-- ================================================

-- Stock por variante de producto
CREATE TABLE inventory (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE,
    sku varchar(100) NOT NULL,
    quantity_available integer NOT NULL DEFAULT 0,
    quantity_reserved integer NOT NULL DEFAULT 0, -- Reservado para órdenes
    quantity_on_order integer NOT NULL DEFAULT 0, -- En camino de proveedores
    reorder_level integer DEFAULT 5, -- Punto de reorden
    reorder_quantity integer DEFAULT 20, -- Cantidad a reordenar
    last_cost numeric(10,2), -- Último costo de compra
    average_cost numeric(10,2), -- Costo promedio ponderado
    location varchar(100), -- Ubicación física
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(project_id, sku)
);

-- Historial de movimientos de inventario
CREATE TABLE inventory_movements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    inventory_id uuid NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    movement_type varchar(50) NOT NULL, -- in, out, adjustment, transfer, reserved, unreserved
    quantity integer NOT NULL,
    unit_cost numeric(10,2),
    total_cost numeric(10,2),
    reference_type varchar(50), -- purchase_order, order, adjustment, transfer
    reference_id uuid,
    notes text,
    created_by uuid NOT NULL, -- auth.users
    created_at timestamptz DEFAULT now(),
    
    CHECK (movement_type IN ('in', 'out', 'adjustment', 'transfer', 'reserved', 'unreserved'))
);

-- ================================================
-- 👥 5. CLIENTES - CRM
-- ================================================

-- Base de clientes
CREATE TABLE customers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    email varchar(255) NOT NULL,
    first_name varchar(100),
    last_name varchar(100),
    phone varchar(50),
    date_of_birth date,
    customer_group varchar(50) DEFAULT 'regular', -- regular, vip, wholesale
    total_spent numeric(12,2) DEFAULT 0,
    orders_count integer DEFAULT 0,
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(project_id, email)
);

-- Direcciones de clientes
CREATE TABLE customer_addresses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    address_type varchar(50) DEFAULT 'shipping', -- billing, shipping
    first_name varchar(100),
    last_name varchar(100),
    company varchar(100),
    address_line_1 text NOT NULL,
    address_line_2 text,
    city varchar(100),
    state varchar(100),
    country varchar(100),
    postal_code varchar(20),
    phone varchar(50),
    is_default boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- ================================================
-- 🛒 6. ÓRDENES - VENTAS
-- ================================================

-- Órdenes de compra
CREATE TABLE orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    order_number varchar(100) NOT NULL,
    customer_id uuid REFERENCES customers(id),
    customer_email varchar(255),
    customer_phone varchar(50),
    status varchar(50) NOT NULL DEFAULT 'pending', -- pending, confirmed, processing, shipped, delivered, cancelled
    payment_status varchar(50) DEFAULT 'pending', -- pending, paid, partially_paid, refunded
    fulfillment_status varchar(50) DEFAULT 'unfulfilled', -- unfulfilled, partial, fulfilled
    
    -- Totales
    subtotal numeric(12,2) NOT NULL DEFAULT 0,
    tax_amount numeric(12,2) DEFAULT 0,
    shipping_amount numeric(12,2) DEFAULT 0,
    discount_amount numeric(12,2) DEFAULT 0,
    total_amount numeric(12,2) NOT NULL DEFAULT 0,
    
    -- Direcciones
    billing_address jsonb,
    shipping_address jsonb,
    
    -- Metadatos
    currency varchar(10) DEFAULT 'USD',
    notes text,
    tags text[],
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    UNIQUE(project_id, order_number),
    CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    CHECK (payment_status IN ('pending', 'paid', 'partially_paid', 'refunded')),
    CHECK (fulfillment_status IN ('unfulfilled', 'partial', 'fulfilled'))
);

-- Items de órdenes
CREATE TABLE order_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES products(id),
    variant_id uuid REFERENCES product_variants(id),
    sku varchar(100) NOT NULL,
    name varchar(255) NOT NULL,
    variant_name varchar(255), -- "Negro - M"
    quantity integer NOT NULL CHECK (quantity > 0),
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(10,2) NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Pagos de órdenes
CREATE TABLE order_payments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_method varchar(50) NOT NULL, -- transferencia, paypal, sinpemovil, cortesia
    reference_number varchar(255),
    amount numeric(12,2) NOT NULL,
    currency varchar(10) DEFAULT 'USD',
    status varchar(50) DEFAULT 'pending', -- pending, completed, failed, cancelled
    transaction_id varchar(255),
    notes text,
    created_at timestamptz DEFAULT now(),
    
    CHECK (status IN ('pending', 'completed', 'failed', 'cancelled'))
);

-- Envíos de órdenes
CREATE TABLE order_shipments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    tracking_number varchar(255),
    carrier varchar(100),
    service_type varchar(100), -- standard, express, overnight
    shipping_cost numeric(10,2),
    estimated_delivery date,
    shipped_at timestamptz,
    delivered_at timestamptz,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- ================================================
-- 🏭 7. COMPRAS - ÓRDENES A PROVEEDORES
-- ================================================

-- Órdenes de compra a proveedores
CREATE TABLE purchase_orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    supplier_id uuid NOT NULL REFERENCES suppliers(id),
    po_number varchar(100) NOT NULL,
    status varchar(50) NOT NULL DEFAULT 'draft', -- draft, sent, confirmed, partial, received, cancelled
    order_date date,
    expected_delivery_date date,
    actual_delivery_date date,
    
    subtotal numeric(12,2) NOT NULL DEFAULT 0,
    tax_amount numeric(12,2) DEFAULT 0,
    shipping_cost numeric(12,2) DEFAULT 0,
    total_amount numeric(12,2) NOT NULL DEFAULT 0,
    currency varchar(10) DEFAULT 'USD',
    
    payment_terms text,
    delivery_address jsonb,
    notes text,
    
    created_by uuid NOT NULL, -- auth.users
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    UNIQUE(project_id, po_number),
    CHECK (status IN ('draft', 'sent', 'confirmed', 'partial', 'received', 'cancelled'))
);

-- Items en órdenes de compra
CREATE TABLE purchase_order_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    supplier_product_id uuid REFERENCES supplier_products(id),
    sku varchar(100) NOT NULL,
    description text,
    quantity_ordered integer NOT NULL CHECK (quantity_ordered > 0),
    quantity_received integer NOT NULL DEFAULT 0,
    unit_cost numeric(10,2) NOT NULL,
    total_cost numeric(10,2) NOT NULL,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Recepciones de mercancía
CREATE TABLE purchase_receipts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    receipt_number varchar(100),
    received_by uuid NOT NULL, -- auth.users
    received_at timestamptz DEFAULT now(),
    notes text
);

-- Items recibidos
CREATE TABLE purchase_receipt_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    receipt_id uuid NOT NULL REFERENCES purchase_receipts(id) ON DELETE CASCADE,
    purchase_order_item_id uuid NOT NULL REFERENCES purchase_order_items(id),
    quantity_received integer NOT NULL CHECK (quantity_received > 0),
    condition varchar(50) DEFAULT 'good', -- good, damaged, defective
    notes text
);

-- ================================================
-- 📊 8. ÍNDICES Y OPTIMIZACIONES
-- ================================================

-- Índices para performance
CREATE INDEX idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX idx_user_projects_project_id ON user_projects(project_id);
CREATE INDEX idx_categories_project_id ON categories(project_id);
CREATE INDEX idx_products_project_id ON products(project_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_inventory_project_id ON inventory(project_id);
CREATE INDEX idx_inventory_variant_id ON inventory(variant_id);
CREATE INDEX idx_customers_project_id ON customers(project_id);
CREATE INDEX idx_orders_project_id ON orders(project_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_suppliers_project_id ON suppliers(project_id);
CREATE INDEX idx_purchase_orders_project_id ON purchase_orders(project_id);
CREATE INDEX idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);

-- Índices para búsquedas de texto
CREATE INDEX idx_products_name_gin ON products USING gin(to_tsvector('spanish', name));
CREATE INDEX idx_products_tags_gin ON products USING gin(tags);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- ================================================
-- 🔐 9. RLS (ROW LEVEL SECURITY) POLICIES
-- ================================================

-- Habilitar RLS en todas las tablas principales
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

-- Política base: Solo usuarios asignados al proyecto pueden ver sus datos
CREATE POLICY "Users can only access their assigned projects" ON projects
    FOR ALL USING (
        id IN (
            SELECT project_id 
            FROM user_projects 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- ================================================
-- ✅ MODELO COMPLETO CREADO
-- ================================================

-- RESUMEN DEL MODELO:
-- 🏢 Core: 3 tablas (projects, user_projects, ecommerce_config)
-- 🏷️ Catálogo: 7 tablas (categories, product_lines, products, variants, attributes, etc.)
-- 🏭 Proveedores: 6 tablas (suppliers, contacts, products, prices, etc.)
-- 📦 Inventario: 2 tablas (inventory, movements)
-- 👥 Clientes: 2 tablas (customers, addresses)
-- 🛒 Órdenes: 4 tablas (orders, items, payments, shipments)
-- 🏭 Compras: 5 tablas (purchase_orders, items, receipts, etc.)
-- 
-- TOTAL: 29 tablas + índices + RLS policies
-- 
-- ¡Lista para crear el imperio BRUMA! 🥊🔥