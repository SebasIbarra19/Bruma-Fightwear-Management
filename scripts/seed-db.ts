
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde la raíz
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas en el .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log('🚀 Iniciando proceso de siembra de datos...');

  try {
    // 1. LIMPIEZA: Borrar categoría "Ropa" si existe
    console.log('🧹 Limpiando datos previos...');
    const { data: catRopa } = await supabase
      .from('tipoproducto')
      .select('id_tipo')
      .ilike('nombre', 'Ropa')
      .single();

    if (catRopa) {
      console.log(`🗑️ Borrando categoría 'Ropa' (ID: ${catRopa.id_tipo})...`);
      await supabase.rpc('delete_category', { p_id_tipo: catRopa.id_tipo });
    }

    // 2. CATÁLOGOS BASE
    console.log('📚 Insertando catálogos base...');

    const { data: colData } = await supabase.from('coleccion').upsert([
      { nombre: 'Bruma', descripcion: 'Colección principal' },
      { nombre: 'Esenciales', descripcion: 'Básicos de siempre' },
      { nombre: 'Verano 2026', descripcion: 'Temporada próxima' }
    ]).select();

    const { data: colorData } = await supabase.from('color').upsert([
      { codigo: 'BLK', nombre: 'Negro', hex_code: '#000000' },
      { codigo: 'WHT', nombre: 'Blanco', hex_code: '#FFFFFF' },
      { codigo: 'BLU', nombre: 'Azul', hex_code: '#0000FF' }
    ]).select();

    const { data: tallaData } = await supabase.from('tallabase').upsert([
      { codigo: 'S', descripcion: 'Small' },
      { codigo: 'M', descripcion: 'Medium' },
      { codigo: 'L', descripcion: 'Large' },
      { codigo: 'XL', descripcion: 'Extra Large' }
    ]).select();

    const { data: estadoData } = await supabase.from('estado').upsert([
      { nombre: 'En proceso' },
      { nombre: 'Entregado' },
      { nombre: 'Cancelado' }
    ]).select();

    const { data: metodoData } = await supabase.from('metodopago').upsert([
      { codigo: 'TRANSF', nombre: 'Transferencia' },
      { codigo: 'CORT', nombre: 'Cortesía', requiere_referencia: false },
      { codigo: 'CASH', nombre: 'Efectivo' }
    ]).select();

    // 3. PROVEEDORES Y CATEGORÍAS (Usando RPC)
    console.log('🏢 Creando proveedores y categorías...');

    const { data: provA } = await supabase.rpc('create_supplier', { p_nombre: 'Proveedor A' });
    const { data: provB } = await supabase.rpc('create_supplier', { p_nombre: 'Proveedor B' });

    const { data: catRSG } = await supabase.rpc('create_category', { p_nombre: 'Rashguard', p_codigo: 'RSG' });
    const { data: catSHT } = await supabase.rpc('create_category', { p_nombre: 'Shorts', p_codigo: 'SHT' });
    const { data: catTSH } = await supabase.rpc('create_category', { p_nombre: 'Camiseta', p_codigo: 'TSH' });

    // 4. PRODUCTOS (Usando RPC)
    console.log('👕 Creando productos...');

    const { data: prodRSG } = await supabase.rpc('create_product', {
      p_nombre: 'Rashguard Base',
      p_descripcion: 'Rashguard de alta calidad para entrenamiento',
      p_codigo: 'PROD-RSG',
      p_id_categoria: catRSG[0].id_tipo
    });

    const { data: prodTSH } = await supabase.rpc('create_product', {
      p_nombre: 'T-shirt Clásica',
      p_descripcion: 'Camiseta de algodón 100%',
      p_codigo: 'PROD-TSH',
      p_id_categoria: catTSH[0].id_tipo
    });

    // 5. VARIANTES (Usando RPC)
    console.log('🎨 Creando variantes...');

    const { data: varRSG } = await supabase.rpc('create_product_variant', {
      p_id_producto: prodRSG[0].id_producto,
      p_id_color: colorData?.find(c => c.codigo === 'BLK')?.id_color,
      p_codigo_variante: 'RSG-001',
      p_nombre_variante: 'Negro / L',
      p_precio_variante: 15000
    });

    const { data: varTSH } = await supabase.rpc('create_product_variant', {
      p_id_producto: prodTSH[0].id_producto,
      p_id_color: colorData?.find(c => c.codigo === 'WHT')?.id_color,
      p_codigo_variante: 'TSH-002',
      p_nombre_variante: 'Blanco / M',
      p_precio_variante: 10000
    });

    // 6. TALLAS PROVEEDOR E INVENTARIO
    console.log('📦 Configurando inventario...');

    const { data: tpL } = await supabase.from('tallaproveedor').insert({
      id_proveedor: provA[0].id_proveedor,
      id_talla: tallaData?.find(t => t.codigo === 'L')?.id_talla,
      descripcion_talla: 'Talla L Proveedor A'
    }).select();

    const { data: tpM } = await supabase.from('tallaproveedor').insert({
      id_proveedor: provB[0].id_proveedor,
      id_talla: tallaData?.find(t => t.codigo === 'M')?.id_talla,
      descripcion_talla: 'Talla M Proveedor B'
    }).select();

    // Crear stock inicial
    const { data: stockRSG } = await supabase.from('productotallastock').insert({
      id_variante: varRSG[0].id_variante,
      id_talla_proveedor: tpL?.[0].id_talla_proveedor,
      stock: 10,
      precio: 15000
    }).select();

    const { data: stockTSH } = await supabase.from('productotallastock').insert({
      id_variante: varTSH[0].id_variante,
      id_talla_proveedor: tpM?.[0].id_talla_proveedor,
      stock: 20,
      precio: 10000
    }).select();

    // 7. CLIENTE Y PEDIDO (La prueba maestra)
    console.log('🛒 Creando cliente y pedido de prueba...');

    const { data: cliente } = await supabase.rpc('create_customer', {
      p_nombre: 'Luis Felipe',
      p_email: 'luis.felipe@example.com',
      p_telefono: '8888-8888'
    });

    const { data: pedido } = await supabase.rpc('create_order', {
      p_id_estado: estadoData?.find(e => e.nombre === 'Entregado')?.id_estado,
      p_id_cliente: cliente[0].id_cliente,
      p_total: 25000,
      p_id_metodo_pago: metodoData?.find(m => m.codigo === 'CORT')?.id_metodo_pago
    });

    console.log('🧪 Ejecutando add_order_item (Prueba de automatización de stock)...');
    
    // Añadir ítem al pedido - Esto debería disparar el descuento de stock
    await supabase.rpc('add_order_item', {
      p_id_pedido: pedido[0].id_pedido,
      p_id_producto_talla: stockRSG?.[0].id_producto_talla,
      p_cantidad: 1,
      p_precio_unitario: 15000
    });

    console.log('✅ Proceso de siembra completado con éxito!');
    console.log('📊 Resumen:');
    console.log(`   - Categorías creadas: ${catRSG ? 3 : 0}`);
    console.log(`   - Productos creados: ${prodRSG ? 2 : 0}`);
    console.log(`   - Pedido generado ID: ${pedido[0].id_pedido}`);
    console.log(`   - Stock de Rashguard (ID ${stockRSG?.[0].id_producto_talla}) debería haber bajado de 10 a 9.`);

  } catch (error) {
    console.error('❌ Error durante la siembra:', error);
  }
}

seed();
