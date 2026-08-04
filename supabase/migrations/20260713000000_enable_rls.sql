-- Migration: Enable RLS for all tables
-- This ensures security while allowing the service role (API) to bypass it.

-- 1. Enable RLS on all tables
ALTER TABLE public.cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codigoenvio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coleccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.color ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metodopago ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipoproducto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producto_imagen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productovariante ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tallabase ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tallaproveedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productotallastock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_movimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidodetalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipomedida ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipoproducto_medida ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tallaproveedor_medida ENABLE ROW LEVEL SECURITY;

-- 2. Create default "Deny All" policies for anon (Public access)
-- Note: By enabling RLS without policies, all access for anon is denied by default.
-- We are not creating 'SELECT' policies for 'anon' to ensure total security.
-- Your API uses 'service_role' which bypasses these checks automatically.

-- 3. (Optional) Allow authenticated users to view data
-- If you plan to use Supabase Auth for a dashboard later, uncomment these:

/*
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    LOOP
        EXECUTE format('CREATE POLICY "Allow authenticated read access" ON public.%I FOR SELECT TO authenticated USING (true);', t);
    END LOOP;
END $$;
*/
