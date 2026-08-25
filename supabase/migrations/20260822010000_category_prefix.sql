-- Prefijo de categoría: derivación mejorada + carga explícita al crear.
--
-- Contexto: `next_product_code` (migración 20260822000000) arma el código como
-- <prefijo>-BRU-<###>. Si la categoría no tiene prefijo cargado, lo derivaba
-- tomando las 3 primeras letras del nombre. Eso funciona para nombres de una
-- palabra (Sticker → STI, Gorras → GOR) pero no para compuestos: la convención
-- real de BRUMA usa iniciales (Panta-Sin-Licra → PSL), y las 3 primeras letras
-- habrían dado PAN.
--
-- Aviso honesto sobre el alcance: los códigos existentes NO siguen una única
-- regla derivable. Rashguard → RSH son consonantes; T-Shirt → TSH es la inicial
-- más dos letras; GI-Solapa → GIS toma la primera palabra entera. Fueron
-- decisiones humanas, no un algoritmo. Ninguna derivación automática las
-- reproduce todas — por eso el prefijo explícito es el mecanismo principal y
-- esta derivación es solo el respaldo para que crear una categoría nunca falle
-- ni exija pensar en el momento equivocado. Las categorías actuales ya tienen
-- su prefijo sembrado, así que esto solo aplica a las nuevas.


-- ---------------------------------------------------------------------------
-- 1. Derivación del prefijo a partir del nombre
-- ---------------------------------------------------------------------------
-- Una palabra  → sus 3 primeras letras          (Sticker → STI)
-- Varias       → iniciales de las 3 primeras    (Panta Sin Licra → PSL)
--                y si quedan menos de 3, se completa con letras de la última
--                palabra                        (Gorra Trucker → GTR)

CREATE OR REPLACE FUNCTION public.category_prefix(p_nombre character varying)
RETURNS character varying
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_words text[];
  v_n     integer;
  v_pref  text;
BEGIN
  v_words := regexp_split_to_array(
               trim(regexp_replace(COALESCE(p_nombre, ''), '[^a-zA-Z0-9]+', ' ', 'g')),
               '\s+'
             );
  v_words := array_remove(v_words, '');
  v_n := COALESCE(array_length(v_words, 1), 0);

  IF v_n = 0 THEN
    RETURN 'GEN';
  END IF;

  IF v_n = 1 THEN
    v_pref := substring(v_words[1] from 1 for 3);
  ELSE
    SELECT string_agg(substring(w from 1 for 1), '' ORDER BY ord)
      INTO v_pref
      FROM unnest(v_words[1:3]) WITH ORDINALITY AS t(w, ord);

    IF length(v_pref) < 3 THEN
      v_pref := v_pref || substring(v_words[v_n] from 2 for 3 - length(v_pref));
    END IF;
  END IF;

  RETURN upper(v_pref);
END;
$$;

COMMENT ON FUNCTION public.category_prefix IS
  'Respaldo para tipoproducto.prefijo cuando no se carga explícitamente.';


-- ---------------------------------------------------------------------------
-- 2. next_product_code usa la derivación nueva
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.next_product_code(p_id_categoria integer)
RETURNS character varying
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefijo text;
  v_seq     integer;
BEGIN
  SELECT COALESCE(NULLIF(tp.prefijo, ''), public.category_prefix(tp.nombre))
    INTO v_prefijo
    FROM public.tipoproducto tp
   WHERE tp.id_tipo = p_id_categoria;

  -- Sanea: el prefijo se interpola en una expresión regular más abajo.
  v_prefijo := upper(regexp_replace(COALESCE(v_prefijo, ''), '[^a-zA-Z0-9]', '', 'g'));
  v_prefijo := COALESCE(NULLIF(v_prefijo, ''), 'GEN');

  -- La secuencia se cuenta por PREFIJO, no por categoría: si dos categorías
  -- comparten prefijo comparten la serie, y así los códigos siguen siendo
  -- únicos en vez de chocar contra el UNIQUE de producto.codigo.
  --
  -- ponytail: MAX()+1 sin bloqueo. Dos creaciones simultáneas pueden pedir el
  -- mismo número; el UNIQUE lo rechaza y basta reintentar. Si algún día se
  -- crean productos en lote, cambiar por un SEQUENCE por prefijo.
  SELECT COALESCE(MAX((substring(p.codigo from '^' || v_prefijo || '-BRU-(\d+)$'))::integer), 0) + 1
    INTO v_seq
    FROM public.producto p;

  RETURN v_prefijo || '-BRU-' || lpad(v_seq::text, 3, '0');
END;
$$;


-- ---------------------------------------------------------------------------
-- 3. create_category acepta el prefijo explícito
-- ---------------------------------------------------------------------------
-- Se reemplaza la versión de 2 argumentos: dejar ambas conviviendo haría
-- ambigua la llamada por parámetros nombrados desde PostgREST.
--
-- Si no se pasa prefijo se deriva del nombre, así queda persistido desde el
-- inicio y `next_product_code` no tiene que recalcularlo en cada creación.

DROP FUNCTION IF EXISTS public.create_category(character varying, character varying);

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
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH inserted AS (
    INSERT INTO public.tipoproducto (nombre, codigo, prefijo)
    VALUES (
      p_nombre,
      COALESCE(p_codigo, lower(regexp_replace(p_nombre, '[^a-zA-Z0-9]+', '-', 'g'))),
      upper(regexp_replace(
        COALESCE(NULLIF(p_prefijo, ''), public.category_prefix(p_nombre)),
        '[^a-zA-Z0-9]', '', 'g'
      ))
    )
    RETURNING id_tipo, nombre, codigo, prefijo
  )
  SELECT id_tipo, nombre, codigo, prefijo FROM inserted;
$$;
