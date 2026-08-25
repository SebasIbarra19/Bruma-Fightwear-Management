-- El código de una categoría ES su prefijo.
--
-- Bug: `create_category` derivaba `codigo` slugificando el nombre
-- (`lower(regexp_replace(nombre,'[^a-zA-Z0-9]+','-','g'))`), pero la columna es
-- `varchar(10)` en la base real. Cualquier nombre cuyo slug pase 10 caracteres
-- falla con un error crudo de Postgres que llega al usuario como un 500:
--
--   "Guantes de Boxeo" → "guantes-de-boxeo" (16) → value too long
--
-- Los datos muestran que el slug nunca fue la convención. De las 8 categorías,
-- las 6 reales tienen el código igual al prefijo de 3 letras:
--
--   Rashguard → RSH    Panta-Sin-Licra → PSL    T-Shirt   → TSH
--   GI-Solapa → GIS    Panta-Con-Licra → PCL    GI-Pantalon → GIP
--
-- Las únicas dos con slug (`coleprueba`, `hoodie`) son las que se crearon por la
-- vía automática. Y `coleprueba` mide exactamente 10: estaba a un carácter de
-- fallar.
--
-- Fix: que `codigo` sea el prefijo. Nunca supera 3 caracteres, así que el
-- desborde desaparece por construcción en vez de por un truncado que dejaría
-- colisiones silenciosas ("guantes-de-boxeo" y "guantes-de-cuero" truncan igual).
--
-- Beneficio lateral: `codigo` ya es NOT NULL UNIQUE, así que esto convierte esa
-- restricción existente en justo la garantía que hacía falta —**dos categorías no
-- pueden compartir prefijo**—. Antes podían, y compartir prefijo significa
-- compartir la serie de SKU (GOR-BRU-001 para gorras y GOR-BRU-002 para gorros),
-- con lo cual el prefijo dejaba de identificar la categoría.
--
-- El precio: crear "Gorro" después de "Gorra" ahora falla, porque ambos derivan
-- GOR. Es deseable: el conflicto aparece al crear, cuando cuesta nada
-- resolverlo escribiendo un prefijo explícito (el campo ya existe en el modal),
-- en vez de aparecer más tarde como SKUs ambiguos.

CREATE OR REPLACE FUNCTION public.create_category(
  p_nombre character varying,
  p_codigo character varying DEFAULT NULL,
  p_prefijo character varying DEFAULT NULL
)
RETURNS TABLE (
  id_tipo integer,
  nombre character varying,
  codigo character varying,
  prefijo character varying
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefijo text;
BEGIN
  v_prefijo := upper(regexp_replace(
    COALESCE(NULLIF(p_prefijo, ''), public.category_prefix(p_nombre)),
    '[^a-zA-Z0-9]', '', 'g'
  ));
  v_prefijo := left(COALESCE(NULLIF(v_prefijo, ''), 'GEN'), 3);

  -- Chequeo explícito para dar un mensaje accionable en vez de dejar que la
  -- violación de UNIQUE llegue cruda a la UI.
  IF EXISTS (SELECT 1 FROM public.tipoproducto t WHERE t.codigo = v_prefijo) THEN
    RAISE EXCEPTION
      'El prefijo % ya lo usa otra categoría. Indicá uno distinto al crearla.',
      v_prefijo
      USING ERRCODE = '23505';
  END IF;

  RETURN QUERY
  INSERT INTO public.tipoproducto (nombre, codigo, prefijo)
  VALUES (p_nombre, COALESCE(NULLIF(p_codigo, ''), v_prefijo), v_prefijo)
  RETURNING tipoproducto.id_tipo,
            tipoproducto.nombre,
            tipoproducto.codigo,
            tipoproducto.prefijo;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_category(character varying, character varying, character varying) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.create_category(character varying, character varying, character varying) TO service_role;

NOTIFY pgrst, 'reload schema';
