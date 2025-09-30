# 🎯 Scripts BRUMA Fightwear - Sistema Completo

## 📁 Estructura de Scripts

### 🔧 Scripts de Base de Datos

| Archivo | Propósito | Orden |
|---------|-----------|-------|
| `00_cleanup_database.sql` | 🧹 Limpia todas las tablas existentes | 1º |
| `01_create_schema_complete.sql` | 🏗️ Crea esquema completo (29 tablas) | 2º |
| `02_populate_bruma_data.sql` | 🎯 Pobla datos del catálogo BRUMA | 3º |

### 🚀 Scripts de Stored Procedures

| Archivo | Funciones | Descripción |
|---------|-----------|-------------|
| `03_stored_procedures_projects.sql` | 6 funciones | 🏢 CRUD Projects + gestión usuarios |
| `04_stored_procedures_categories.sql` | 6 funciones | 🏷️ CRUD Categories + jerarquías |
| `05_stored_procedures_products.sql` | 6 funciones | 🎽 CRUD Products + duplicación |
| `06_stored_procedures_product_variants.sql` | 6 funciones | 🎨 CRUD Variants + bulk operations |
| `07_stored_procedures_inventory.sql` | 6 funciones | 📦 Gestión completa de inventario |

## 🚀 Proceso de Ejecución

### Fase 1: Base de Datos

#### 1. **Limpiar Base de Datos**
```sql
-- Ejecutar en Supabase SQL Editor
-- Archivo: 00_cleanup_database.sql
-- Elimina todas las tablas existentes limpiamente
```

#### 2. **Crear Schema Completo**
```sql
-- Ejecutar en Supabase SQL Editor  
-- Archivo: 01_create_schema_complete.sql
-- Crea las 29 tablas del sistema ecommerce profesional
```

#### 3. **Poblar Catálogo BRUMA**
```sql
-- Ejecutar en Supabase SQL Editor
-- Archivo: 02_populate_bruma_data.sql
-- Inserta catálogo completo con productos, variantes, proveedores
```

### Fase 2: Stored Procedures (API del Sistema)

#### 4. **Projects API**
```sql
-- Archivo: 03_stored_procedures_projects.sql
-- ✅ create_project() - Crear proyectos con owner automático
-- ✅ get_project() - Obtener por ID/slug con permisos 
-- ✅ update_project() - Actualizar configuración
-- ✅ delete_project() - Eliminar con/sin dependencias
-- ✅ list_projects() - Listar con filtros y paginación
-- ✅ add_user_to_project() - Gestión de usuarios
```

#### 5. **Categories API**
```sql
-- Archivo: 04_stored_procedures_categories.sql
-- ✅ create_category() - Crear con jerarquías
-- ✅ get_category() - Obtener con conteos de productos
-- ✅ update_category() - Actualizar con validaciones circulares
-- ✅ delete_category() - Eliminar con manejo de dependencias
-- ✅ list_categories() - Listar con estructura jerárquica
-- ✅ reorder_categories() - Reordenar múltiples categorías
```

#### 6. **Products API**
```sql
-- Archivo: 05_stored_procedures_products.sql  
-- ✅ create_product() - Crear con validaciones completas
-- ✅ get_product() - Obtener con variantes opcionales
-- ✅ update_product() - Actualizar con relaciones
-- ✅ delete_product() - Eliminar preservando historial
-- ✅ list_products() - Listar con filtros avanzados
-- ✅ duplicate_product() - Duplicar con variantes
```

#### 7. **Product Variants API**
```sql
-- Archivo: 06_stored_procedures_product_variants.sql
-- ✅ create_product_variant() - Crear con inventario inicial
-- ✅ get_product_variant() - Obtener con precios finales
-- ✅ update_product_variant() - Actualizar con sync inventario
-- ✅ delete_product_variant() - Eliminar preservando órdenes
-- ✅ list_product_variants() - Listar con stock y filtros
-- ✅ bulk_update_variants() - Actualización masiva
```

#### 8. **Inventory API**
```sql
-- Archivo: 07_stored_procedures_inventory.sql
-- ✅ adjust_inventory() - Ajustar con movimientos automáticos
-- ✅ get_stock_status() - Estado completo con alertas
-- ✅ transfer_stock() - Transferir entre variantes
-- ✅ get_low_stock_alerts() - Alertas inteligentes
-- ✅ get_inventory_movements() - Historial con balance
-- ✅ get_inventory_valuation() - Valuación con breakdown
```

## 📊 Resultado Final

### 🏢 **Sistema Multi-Tenant**
- ✅ Proyectos con roles y permisos
- ✅ Configuración flexible por tienda
- ✅ Multi-usuario con seguridad RLS

### 🏷️ **Catálogo Profesional**
- ✅ **3 Categorías**: Rashguard, Pantaloneta, Camiseta
- ✅ **1 Línea**: Colección Bruma
- ✅ **3 Productos**: Con materiales y especificaciones
- ✅ **30 Variantes**: Tallas XS-XL, Colores Negro/Blanco
- ✅ **150 Unidades**: Stock inicial distribuido

### 🏭 **Supply Chain Completo**
- ✅ **2 Proveedores**: Textiles + Estampados
- ✅ **Contactos y Direcciones**: Info completa
- ✅ **Escalas de Precios**: Por volumen
- ✅ **Gestión de Compras**: Órdenes y recepciones

### 📦 **Inventario Inteligente**
- ✅ **Stock por Variante**: Control granular
- ✅ **Puntos de Reorden**: Alertas automáticas
- ✅ **Trazabilidad**: Historial completo de movimientos
- ✅ **Costos**: Promedio ponderado y último costo

### 🛒 **Sistema de Ventas**
- ✅ **Clientes CRM**: Base con segmentación
- ✅ **Órdenes Completas**: Items, pagos, envíos
- ✅ **Estados Múltiples**: Pago, cumplimiento, entrega
- ✅ **Métodos de Pago**: Transferencia, PayPal, SinpeMóvil, Cortesía

## 💰 Valor del Inventario

| Producto | Variantes | Stock | Costo Unit. | Total Costo | Precio Unit. | Total Venta |
|----------|-----------|-------|-------------|-------------|--------------|-------------|
| Rashguard | 10 | 50 | $30 | $1,500 | $50 | $2,500 |
| Pantaloneta | 10 | 50 | $30 | $1,500 | $50 | $2,500 |
| Camiseta | 10 | 50 | $10 | $500 | $22 | $1,100 |
| **TOTAL** | **30** | **150** | - | **$3,500** | - | **$6,100** |

**Margen Bruto**: $2,600 (42.6%)

## 🎮 Ejemplos de Uso de las Stored Procedures

### � **Gestión de Proyectos**
```sql
-- Crear nuevo proyecto
SELECT * FROM create_project(
    'Mi Nueva Tienda', 
    'mi-nueva-tienda', 
    'Tienda especializada en deportes de combate',
    'ecommerce'
);

-- Obtener proyecto con permisos del usuario
SELECT * FROM get_project(p_slug := 'bruma-fightwear');

-- Listar mis proyectos
SELECT * FROM list_projects(p_limit := 10);
```

### 🏷️ **Gestión de Categorías**
```sql
-- Crear categoría principal
SELECT * FROM create_category(
    'uuid-proyecto',
    'Combat Sports', 
    'combat-sports', 
    'Equipamiento para deportes de combate'
);

-- Crear subcategoría
SELECT * FROM create_category(
    'uuid-proyecto',
    'BJJ Gear', 
    'bjj-gear',
    'Equipamiento especializado para Brazilian Jiu-Jitsu',
    'uuid-categoria-padre'
);

-- Listar categorías con jerarquía
SELECT * FROM list_categories(
    'uuid-proyecto',
    p_include_children := true
);
```

### 🎽 **Gestión de Productos**
```sql
-- Crear producto completo
SELECT * FROM create_product(
    'uuid-proyecto',
    'uuid-categoria',
    'uuid-linea-productos',
    'Rashguard Elite',
    'rashguard-elite',
    'Rashguard profesional de máxima calidad...',
    'Rashguard Elite - Lycra premium',
    'RAS-ELITE',
    89.99,
    54.00,
    185, -- peso en gramos
    '["Lycra Premium", "Polyester"]'::jsonb,
    'Lavar en agua fría, secar al aire'
);

-- Buscar productos
SELECT * FROM list_products(
    'uuid-proyecto',
    p_search := 'rashguard',
    p_low_stock := true,
    p_limit := 20
);
```

### 🎨 **Gestión de Variantes**
```sql
-- Crear variante con stock inicial
SELECT * FROM create_product_variant(
    'uuid-proyecto',
    'uuid-producto',
    'Rashguard Elite - Negro - L',
    'RAS-ELITE-N-L',
    'L',           -- size
    'Negro',       -- color
    'Lycra',       -- material
    0,             -- price_adjustment
    0,             -- cost_adjustment
    0,             -- weight_adjustment
    null,          -- barcode
    true,          -- is_active
    null,          -- sort_order (auto)
    15,            -- initial_stock
    54.00          -- initial_cost
);

-- Actualización masiva de precios
SELECT * FROM bulk_update_variants(
    'uuid-proyecto',
    '[
        {"id": "uuid-variante-1", "price_adjustment": 10.00},
        {"id": "uuid-variante-2", "price_adjustment": 5.00},
        {"id": "uuid-variante-3", "is_active": false}
    ]'::jsonb
);
```

### 📦 **Gestión de Inventario**
```sql
-- Recibir mercancía (entrada de stock)
SELECT * FROM adjust_inventory(
    'uuid-proyecto',
    'uuid-variante',
    25,            -- cantidad a agregar
    52.00,         -- costo unitario
    'purchase_receipt',
    'uuid-orden-compra',
    'purchase_order',
    'Recepción orden de compra #PO-2024-001'
);

-- Vender producto (salida de stock)
SELECT * FROM adjust_inventory(
    'uuid-proyecto',
    'uuid-variante',
    -2,            -- cantidad a restar (venta)
    null,          -- usar costo promedio
    'sale',
    'uuid-orden-venta',
    'sales_order',
    'Venta orden #ORD-2024-123'
);

-- Ver alertas de stock bajo
SELECT * FROM get_low_stock_alerts(
    'uuid-proyecto',
    p_include_out_of_stock := true
);

-- Transferir stock entre tallas
SELECT * FROM transfer_stock(
    'uuid-proyecto',
    'uuid-variante-s',    -- desde talla S
    'uuid-variante-m',    -- hacia talla M
    3,                    -- cantidad
    'size_correction',
    'Corrección por error en pedido'
);

-- Reporte de valuación de inventario
SELECT * FROM get_inventory_valuation(
    'uuid-proyecto',
    p_valuation_method := 'average'
);
```

## 🔍 Verificación del Sistema

Después de ejecutar todos los scripts:

```sql
-- Verificar estructura completa
SELECT 'projects' as tabla, COUNT(*) as registros FROM projects WHERE slug = 'bruma-fightwear'
UNION ALL
SELECT 'categories', COUNT(*) FROM categories c 
    JOIN projects p ON c.project_id = p.id WHERE p.slug = 'bruma-fightwear'
UNION ALL
SELECT 'products', COUNT(*) FROM products pr 
    JOIN projects p ON pr.project_id = p.id WHERE p.slug = 'bruma-fightwear'
UNION ALL
SELECT 'product_variants', COUNT(*) FROM product_variants pv 
    JOIN products pr ON pv.product_id = pr.id 
    JOIN projects p ON pr.project_id = p.id WHERE p.slug = 'bruma-fightwear'
UNION ALL
SELECT 'inventory', COUNT(*) FROM inventory i 
    JOIN projects p ON i.project_id = p.id WHERE p.slug = 'bruma-fightwear'
UNION ALL
SELECT 'suppliers', COUNT(*) FROM suppliers s 
    JOIN projects p ON s.project_id = p.id WHERE p.slug = 'bruma-fightwear';

-- Ver resumen de inventario y valores
SELECT 
    p.name as producto,
    COUNT(pv.id) as variantes,
    SUM(i.quantity_available) as stock_total,
    SUM(i.quantity_available * i.average_cost) as valor_costo,
    SUM(i.quantity_available * (p.base_price + pv.price_adjustment)) as valor_venta
FROM products p
JOIN projects pr ON p.project_id = pr.id
LEFT JOIN product_variants pv ON p.id = pv.product_id
LEFT JOIN inventory i ON pv.id = i.variant_id
WHERE pr.slug = 'bruma-fightwear'
GROUP BY p.id, p.name
ORDER BY p.name;
```

**Resultado esperado:**
- projects: 1
- categories: 3  
- products: 3
- product_variants: 30  
- inventory: 30
- suppliers: 2

## 🎉 ¡Sistema Completo y Operativo!

Tu plataforma BRUMA Fightwear incluye:

### 🏗️ **Infraestructura**
- ✅ **29 Tablas**: Schema completo profesional
- ✅ **30 Stored Procedures**: API completa del sistema
- ✅ **RLS Policies**: Seguridad multi-tenant
- ✅ **Data Inicial**: Catálogo BRUMA listo para usar

### 🎯 **Funcionalidades Listas**
- 🏪 **Ecommerce Completo**: Productos, variantes, inventario
- 👥 **Multi-Usuario**: Roles, permisos, proyectos
- � **Supply Chain**: Proveedores, órdenes de compra
- 📊 **Reportes**: Inventario, valuación, alertas
- 🔄 **Operaciones**: Transferencias, ajustes, movimientos

### � **Inventario Inicial**
- **Costo Total**: $3,500 USD
- **Valor de Venta**: $6,100 USD  
- **Margen Potencial**: $2,600 USD (42.6%)
- **150 Unidades**: Distribuidas en 30 variantes

¡Lista para dominar el mercado de combat sports! 🥊🔥