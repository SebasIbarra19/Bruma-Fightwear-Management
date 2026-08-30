-- 3.3 — Perfil de usuario.
--
-- Hasta ahora lo único que existía del usuario era `auth.users`: id, email y
-- fecha de creación. Nada editable, ningún nombre para mostrar, y —lo más
-- grave— **ninguna forma de cerrar sesión desde la interfaz**: `AuthContext`
-- expone `signOut` desde siempre y ningún componente lo llamaba (registrado en
-- FINDINGS.md tras el rediseño del nav).
--
-- Esta tabla es "1 a 1 opcional" con `auth.users`: la PK ES el uuid del
-- usuario, así que no puede haber dos perfiles para la misma cuenta ni un
-- perfil huérfano. Con `ON DELETE CASCADE`, borrar la cuenta se lleva el
-- perfil — a diferencia de la bitácora, que conserva el email desnormalizado
-- justamente para sobrevivir a ese borrado.
--
-- Nota sobre `preferencia_cinturon`: hoy el cinturón elegido vive en
-- `localStorage` (`bruma.belt`, ver BeltNavigation.tsx), así que se pierde al
-- cambiar de navegador o de máquina. Es la única preferencia real que el
-- producto ya tiene, y por eso es un campo legítimo y no especulativo. La
-- columna queda creada y disponible; migrar la lectura desde localStorage es
-- un paso aparte, para no tocar de paso un componente que funciona.


CREATE TABLE IF NOT EXISTS public.perfil_usuario (
  id_usuario    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  nombre_completo       character varying(80),
  telefono              character varying(20),
  avatar_url            text,

  -- Cargo o función dentro del negocio. Texto libre a propósito: NO es un rol
  -- de permisos. Hoy no hay control de acceso por rol —hay un solo tipo de
  -- usuario— y crear una columna que parezca autorización sin serlo es peor
  -- que no tenerla: invita a confiar en algo que no protege nada.
  puesto                character varying(60),

  preferencia_cinturon  character varying(10)
                        CHECK (preferencia_cinturon IS NULL OR
                               preferencia_cinturon IN ('white','blue','purple','brown','black')),

  fecha_creacion        timestamptz NOT NULL DEFAULT now(),
  fecha_actualizacion   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.perfil_usuario IS
  'Datos editables del usuario. 1-a-1 opcional con auth.users; la PK es el uuid de la cuenta.';
COMMENT ON COLUMN public.perfil_usuario.puesto IS
  'Cargo descriptivo, NO un rol de permisos. No gobierna ningún control de acceso.';


-- Mismo criterio de cierre que Fase 0: nada accesible con la anon key.
ALTER TABLE public.perfil_usuario ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.perfil_usuario FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.perfil_usuario TO service_role;


-- ---------------------------------------------------------------------------
-- Lectura
-- ---------------------------------------------------------------------------
/**
 * Perfil + los datos de la cuenta que no viven acá (email, alta).
 *
 * Devuelve una fila SIEMPRE, incluso si el usuario nunca guardó su perfil: el
 * `LEFT JOIN` deja los campos editables en NULL en vez de no devolver nada.
 * Así la pantalla no tiene que distinguir "sin perfil" de "usuario inexistente".
 */
CREATE OR REPLACE FUNCTION public.get_perfil(p_id_usuario uuid)
RETURNS TABLE (
  id_usuario           uuid,
  email                text,
  nombre_completo      character varying,
  telefono             character varying,
  avatar_url           text,
  puesto               character varying,
  preferencia_cinturon character varying,
  fecha_alta           timestamptz,
  fecha_actualizacion  timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    u.id,
    u.email::text,
    p.nombre_completo,
    p.telefono,
    p.avatar_url,
    p.puesto,
    p.preferencia_cinturon,
    u.created_at,
    p.fecha_actualizacion
  FROM auth.users u
  LEFT JOIN public.perfil_usuario p ON p.id_usuario = u.id
  WHERE u.id = p_id_usuario;
$$;


-- ---------------------------------------------------------------------------
-- Escritura
-- ---------------------------------------------------------------------------
/**
 * Crea o actualiza el perfil.
 *
 * `UPSERT` en vez de INSERT + UPDATE separados: el perfil puede no existir la
 * primera vez y el llamador no debería tener que averiguarlo.
 *
 * Cada campo usa `COALESCE(p_campo, valor_actual)`, así que **omitir un
 * parámetro conserva lo que había** en lugar de borrarlo. Para vaciar un campo
 * a propósito se manda cadena vacía, que se normaliza a NULL más abajo.
 */
CREATE OR REPLACE FUNCTION public.upsert_perfil(
  p_id_usuario           uuid,
  p_nombre_completo      character varying DEFAULT NULL,
  p_telefono             character varying DEFAULT NULL,
  p_avatar_url           text DEFAULT NULL,
  p_puesto               character varying DEFAULT NULL,
  p_preferencia_cinturon character varying DEFAULT NULL
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.perfil_usuario AS pu (
    id_usuario, nombre_completo, telefono, avatar_url, puesto, preferencia_cinturon
  )
  VALUES (
    p_id_usuario,
    NULLIF(btrim(p_nombre_completo), ''),
    NULLIF(btrim(p_telefono), ''),
    NULLIF(btrim(p_avatar_url), ''),
    NULLIF(btrim(p_puesto), ''),
    NULLIF(btrim(p_preferencia_cinturon), '')
  )
  ON CONFLICT (id_usuario) DO UPDATE SET
    nombre_completo      = COALESCE(NULLIF(btrim(EXCLUDED.nombre_completo), ''), pu.nombre_completo),
    telefono             = COALESCE(NULLIF(btrim(EXCLUDED.telefono), ''), pu.telefono),
    avatar_url           = COALESCE(NULLIF(btrim(EXCLUDED.avatar_url), ''), pu.avatar_url),
    puesto               = COALESCE(NULLIF(btrim(EXCLUDED.puesto), ''), pu.puesto),
    preferencia_cinturon = COALESCE(NULLIF(btrim(EXCLUDED.preferencia_cinturon), ''), pu.preferencia_cinturon),
    fecha_actualizacion  = now();
$$;

GRANT EXECUTE ON FUNCTION public.get_perfil(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.upsert_perfil(uuid, character varying, character varying, text, character varying, character varying) TO service_role;

NOTIFY pgrst, 'reload schema';
