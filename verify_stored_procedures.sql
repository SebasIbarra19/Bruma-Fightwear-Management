-- ================================================
-- 🔍 QUERIES PARA VERIFICAR STORED PROCEDURES
-- Copia y pega estos queries en Supabase SQL Editor
-- ================================================

-- 1. LISTAR TODAS LAS FUNCIONES DISPONIBLES
SELECT 
    schemaname,
    functionname,
    definition
FROM pg_functions 
WHERE schemaname = 'public'
ORDER BY functionname;

-- 2. BUSCAR FUNCIONES ESPECÍFICAS DE PRODUCTOS
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name ILIKE '%product%'
ORDER BY routine_name;

-- 3. VER DEFINICIÓN COMPLETA DE get_products (si existe)
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'get_products' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 4. LISTAR TODAS LAS FUNCIONES CON SUS PARÁMETROS
SELECT 
    p.proname AS function_name,
    pg_catalog.pg_get_function_result(p.oid) AS result_type,
    pg_catalog.pg_get_function_arguments(p.oid) AS arguments
FROM pg_catalog.pg_proc p
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
AND p.proname ILIKE '%get%'
ORDER BY p.proname;

-- 5. BUSCAR FUNCIONES CON 'get_products' EN EL NOMBRE
SELECT 
    proname,
    pronargs,
    proargnames,
    proargtypes::regtype[]
FROM pg_proc 
WHERE proname ILIKE '%get_products%'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 6. VER TODAS LAS FUNCIONES DISPONIBLES (SIMPLE)
SELECT 
    p.proname AS function_name,
    p.pronargs AS num_args,
    pg_catalog.pg_get_function_identity_arguments(p.oid) AS arguments
FROM pg_catalog.pg_proc p
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- 7. VERIFICAR SI EXISTE LA FUNCIÓN EXACTA
SELECT EXISTS (
    SELECT 1 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'get_products'
) AS get_products_exists;

-- 8. VER DEFINICIÓN COMPLETA DE list_products
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'list_products' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 9. VER TIPOS DE RETORNO DE list_products
SELECT 
    p.proname AS function_name,
    pg_catalog.pg_get_function_result(p.oid) AS result_type,
    pg_catalog.pg_get_function_arguments(p.oid) AS arguments,
    p.prorettype::regtype AS return_type
FROM pg_catalog.pg_proc p
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
AND p.proname = 'list_products';

-- 10. PROBAR EJECUCIÓN DIRECTA DE list_products CON SIGNATURA CORRECTA
SELECT * FROM list_products(
    p_project_id := '4cffbb29-0a5b-414c-86c0-9509a19485d3'::uuid,
    p_category_id := NULL::uuid,
    p_product_line_id := NULL::uuid,
    p_limit := 20,
    p_offset := 0
);

-- 11. BUSCAR OTRAS FUNCIONES RELACIONADAS CON PRODUCTOS
SELECT 
    p.proname AS function_name,
    pg_catalog.pg_get_function_arguments(p.oid) AS arguments
FROM pg_catalog.pg_proc p
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
AND p.proname ILIKE '%product%'
ORDER BY p.proname;

-- 12. CONSULTA DIRECTA A LA TABLA PRODUCTS (SIN STORED PROCEDURE)
SELECT 
    id, project_id, category_id, name, slug, description, 
    sku, base_price, base_cost, is_active, created_at, updated_at
FROM products
WHERE project_id = '4cffbb29-0a5b-414c-86c0-9509a19485d3'::uuid
LIMIT 5;

-- ================================================
-- 🔍 ANÁLISIS DE CATEGORÍAS - STORED PROCEDURES
-- ================================================

-- 13. BUSCAR FUNCIONES ESPECÍFICAS DE CATEGORÍAS
SELECT 
    p.proname AS function_name,
    pg_catalog.pg_get_function_arguments(p.oid) AS arguments,
    pg_catalog.pg_get_function_result(p.oid) AS result_type
FROM pg_catalog.pg_proc p
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
AND p.proname ILIKE '%categor%'
ORDER BY p.proname;

-- 14. CONSULTA DIRECTA A LA TABLA CATEGORIES
SELECT 
    id, project_id, name, slug, description, 
    is_active, sort_order, created_at, updated_at
FROM categories
WHERE project_id = '4cffbb29-0a5b-414c-86c0-9509a19485d3'::uuid
ORDER BY sort_order, name
LIMIT 10;

-- 15. CONTAR PRODUCTOS POR CATEGORÍA
SELECT 
    c.id, c.name, c.slug,
    COUNT(p.id) as products_count
FROM categories c
LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
WHERE c.project_id = '4cffbb29-0a5b-414c-86c0-9509a19485d3'::uuid
GROUP BY c.id, c.name, c.slug
ORDER BY c.sort_order, c.name;