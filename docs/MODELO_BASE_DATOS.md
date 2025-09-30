# 🏗️ MODELO DE BASE DE DATOS - BRUMA FIGHTWEAR

## 📊 Arquitectura del Sistema

### 🎯 NÚCLEO DEL SISTEMA
```
projects (proyectos multi-tenant)
├── users_projects (asignación de usuarios)
├── ecommerce_config (configuración de tienda)
└── [todos los demás módulos]
```

### 🏷️ CATÁLOGO DE PRODUCTOS
```
categories (Rashguard, Pantaloneta, Camiseta)
├── product_lines (Colección Bruma, Pro Series, etc.)
│   └── products (productos base)
│       ├── product_variants (talla + color específico)
│       ├── product_images (imágenes por variante)
│       └── inventory (stock por variante)
```

### 🛒 GESTIÓN DE ÓRDENES  
```
customers (clientes)
├── orders (órdenes de compra)
│   ├── order_items (items específicos)
│   ├── order_payments (pagos)
│   └── order_shipping (envíos)
```

### 📦 INVENTARIO Y PROVEEDORES
```
suppliers (proveedores)
├── purchase_orders (órdenes de compra)
│   └── purchase_order_items (items de compra)
└── inventory_movements (movimientos de stock)
```

## 📋 TABLAS DETALLADAS

### 1. 🏢 CORE - Gestión de Proyectos
- **projects**: Proyectos multi-tenant
- **users_projects**: Asignación usuarios-proyectos con roles
- **ecommerce_config**: Configuración específica por tienda

### 2. 🏷️ CATÁLOGO - Productos
- **categories**: Categorías (Rashguard, Pantaloneta, Camiseta)
- **product_lines**: Líneas (Colección Bruma, Pro Series, Training)
- **products**: Productos base con info general
- **product_variants**: Variantes específicas (talla + color)
- **product_images**: Imágenes por producto/variante
- **product_attributes**: Atributos flexibles (material, peso, etc.)

### 3. 👥 CLIENTES - CRM
- **customers**: Base de clientes
- **customer_addresses**: Direcciones de entrega
- **customer_groups**: Segmentación (VIP, Mayorista, etc.)

### 4. 🛒 ÓRDENES - Ventas
- **orders**: Órdenes de compra
- **order_items**: Items específicos en cada orden
- **order_payments**: Registro de pagos
- **order_shipping**: Información de envío
- **order_status_history**: Historial de estados

### 5. 📦 INVENTARIO - Stock
- **inventory**: Stock actual por variante
- **inventory_movements**: Historial de movimientos
- **inventory_adjustments**: Ajustes manuales

### 6. 🏭 PROVEEDORES - Supply Chain
- **suppliers**: Proveedores de productos y materiales
- **supplier_contacts**: Contactos específicos por proveedor
- **supplier_products**: Catálogo de productos que ofrece cada proveedor
- **supplier_prices**: Precios por proveedor y cantidades (escalas)
- **purchase_orders**: Órdenes de compra a proveedores
- **purchase_order_items**: Items específicos en cada orden
- **purchase_receipts**: Recepciones de mercancía
- **supplier_payments**: Pagos realizados a proveedores

### 7. 💰 FINANZAS - Opcional futuro
- **payment_methods**: Métodos de pago disponibles
- **tax_rates**: Tasas de impuestos
- **discounts**: Descuentos y promociones
- **coupons**: Cupones de descuento

## 🎨 CARACTERÍSTICAS ESPECIALES BRUMA

### 🥊 Combat Sports Focus
- **Tallas específicas**: XS, S, M, L, XL, XXL
- **Materiales especiales**: Rashguard (lycra), Pantalonetas (polyester), etc.
- **Colores**: Negro, Blanco, Rojo, Azul (expandible)
- **Categorías deportivas**: Rashguard, Shorts/Pantalonetas, Camisetas, Accesorios

### 🏭 Supply Chain Específico
- **Proveedores textiles**: Fabricantes de lycra, polyester, algodón
- **Proveedores de insumos**: Hilos, etiquetas, empaques
- **Proveedores de servicios**: Bordado, estampado, confección
- **Escalas de precios**: Descuentos por volumen (50, 100, 500+ unidades)
- **Tiempos de entrega**: Standard (15 días), Express (7 días), Urgente (3 días)
- **Calidad**: Especificaciones técnicas por material (gramaje, elasticidad, etc.)

### 📊 Inventario Inteligente
- **Stock por variante**: Cada talla+color tiene stock independiente
- **Puntos de reorden**: Alertas automáticas de stock bajo
- **Reservas**: Stock reservado para órdenes pendientes
- **Movimientos trazables**: Entrada, salida, ajustes, transferencias

### 🚀 Escalabilidad
- **Multi-proyecto**: Un sistema, múltiples tiendas
- **Roles flexibles**: Owner, Admin, Manager, Staff, Viewer
- **Configuración por tienda**: Monedas, impuestos, métodos de pago
- **APIs preparadas**: Estructura lista para integraciones

## 🎯 BENEFICIOS DEL MODELO

✅ **Profesional**: Estructura enterprise-grade
✅ **Flexible**: Adaptable a crecimiento del negocio  
✅ **Completo**: Cubre todos los aspectos del ecommerce
✅ **Trazable**: Auditoría completa de inventario y ventas
✅ **Escalable**: Múltiples proyectos en una BD
✅ **Especializado**: Optimizado para ropa deportiva

## 📈 PLAN DE IMPLEMENTACIÓN

1. **Fase 1**: Core + Catálogo básico (Lo esencial)
2. **Fase 2**: Órdenes + Clientes (Ventas)  
3. **Fase 3**: Inventario avanzado (Control de stock)
4. **Fase 4**: Proveedores + Compras (Supply chain)
5. **Fase 5**: Finanzas + Analytics (Business intelligence)

¿Te parece bien este modelo? 🤔 ¿Algún ajuste específico para BRUMA?