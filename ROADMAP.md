# BRUMA — Roadmap y estado

> **Última actualización:** 2026-08-25
> **Cómo usar este archivo:** marcá `[x]` al completar. Cada item tiene su
> evidencia (archivo:línea) para no volver a investigar. El registro de avance
> está al final.

---

## Contexto

Este documento nace de un volcado de 18 ideas sin priorizar. Se exploró el código
para ordenarlas con datos en vez de impresiones. El resultado cambió el orden
original: **apareció un agujero de seguridad explotable que no estaba en la
lista**, y varios items resultaron mucho más baratos —o innecesarios— de lo que
parecían.

---

## 🔴 Fase 0 — Cerrar el acceso (antes de cualquier deploy)

**Estado: NO INICIADA.** Bloquea todo deploy público.

### El problema, probado en vivo

Con la anon key (la que viaja en el bundle del browser):

```
POST /rest/v1/rpc/get_order_analytics  → {"total_ingresos": 200.00, ...}
POST /rest/v1/rpc/adjust_inventory     → {"code":"P0001","message":"Registro de
                                          stock no encontrado para id 999999"}
```

Ese `P0001` es la validación interna del propio SP: **la función se ejecutó**. Con
un `id_producto_talla` válido habría modificado stock. En cambio
`GET /rest/v1/producto` devuelve `[]`, o sea que el RLS sí bloquea tablas.

**Causa:** ~82 funciones `SECURITY DEFINER` y **cero `GRANT`/`REVOKE`** en las
migraciones. Postgres da `EXECUTE` a `PUBLIC` por defecto, PostgREST publica cada
función en `/rest/v1/rpc/<nombre>`, y al ser `SECURITY DEFINER` corren como owner
y saltean el RLS.

| Hallazgo | Evidencia |
|---|---|
| Middleware no-op declarado | `src/middleware.ts:4-7` — "BYPASS TOTAL PARA DESARROLLO" |
| 0 de 23 rutas verifican identidad | Sin `getUser`/`getSession` en `src/app/api/**` |
| Registro abierto | `RegisterForm.tsx:47` `signUp` sin allowlist |

**Atenuantes verificados:** no hay deploy activo; la `SERVICE_ROLE_KEY` del
historial de git pertenece a un proyecto **viejo** (`ref=qveesfkespwtaeypogaq`, ya
no resuelve), no al actual (`tlutwoinynuyivxivakt`) — la rotación fue efectiva.
Pero el repo es público, así que URL y anon key son obtenibles.

### Tareas

- [ ] **0.1 Migración REVOKE/GRANT** — nueva en `supabase/migrations/`.
      `REVOKE EXECUTE ON ALL ROUTINES IN SCHEMA public FROM PUBLIC, anon,
      authenticated;` + `GRANT ... TO service_role;` + `ALTER DEFAULT PRIVILEGES`
      para que las funciones nuevas nazcan cerradas + `NOTIFY pgrst, 'reload schema';`
      ⚠️ No omitir el GRANT a `service_role`: saltea RLS pero **no** privilegios de EXECUTE.
- [ ] **0.2 Cerrar registro** — Dashboard Supabase → Authentication → Providers →
      Email → desactivar signup. Va junto con 0.1: si el registro queda abierto,
      cualquiera se registra y vuelve a entrar.
- [ ] **0.3 Restaurar `src/middleware.ts`** — redirige a login en páginas, 401 en
      `/api/*`. **Borrar `middleware.ts` de la raíz**: verificado contra
      `.next/server/middleware-manifest.json` (`name: "src/middleware"`), el de la
      raíz nunca se compila.
- [ ] **0.4 `withAuth` en las 23 rutas** — helper en `src/lib/api/middleware.ts`,
      compuesto con el `withErrorHandling` existente. Usar `getUser()` (valida
      contra el servidor), no `getSession()` (solo decodifica cookie).
- [ ] **0.5 Subir Next a ≥14.2.25** — CVE-2025-29927: bypass de middleware con el
      header `x-middleware-subrequest`. Por esto el chequeo va **también** en cada
      route handler, no solo en el middleware.
- [ ] **0.6 Precio y total derivados en la DB** — `api/orders/route.ts:52` calcula
      el total con `precio_unitario` que manda el cliente. El precio canónico ya
      está en `productotallastock.precio`. No se arregla validando: se arregla
      dejando de aceptar el campo. Sumar `CHECK` cantidad > 0 y ≤100% en descuentos.
- [ ] **0.7 Confirmar** que el proyecto viejo `qveesfkespwtaeypogaq` está borrado.

### Decisiones tomadas

- **Todo el acceso pasa por rutas de API del servidor** → se revoca a `anon` y
  `authenticated` sobre todo. La anon key deja de servir para nada.
- **Se mantiene service role** tras verificar identidad en el borde. Pasar a
  cliente-con-sesión exigiría ~80 políticas RLS para expresar "cualquier admin
  puede todo", sin multi-tenancy ni roles que lo justifiquen.
- **Supabase Auth, no Clerk.** Ya funciona; ninguno de los hallazgos se arregla
  cambiando de proveedor. Revisitar cuando exista un segundo tipo de usuario.
- **Rate limiting: saltear.** El POST de credenciales va del browser directo a
  `supabase.co/auth/v1/token`, sin pasar por la app — un limiter en Next no
  protegería el login. Sirve: bajar el rate limit en el dashboard de Supabase
  (ya existe, cero código) + registro cerrado. Upstash cuando haya endpoint público.
- **Zod: todavía no.** Cerrado lo anterior, quien manda bodies es un admin de 1-3
  personas. Los `CHECK` de tabla protegen *cualquier* camino de escritura, no solo
  el HTTP — más fuerte que Zod. Sí cuando haya endpoints públicos.

---

## 🟠 Fase 1 — Bugs visibles

- [ ] **1.1 Descuentos: cambiar tipo no reinicia el valor** —
      `invoicing/page.tsx:129-131`. `updateDiscountField` es un setter genérico:
      al setear `tipo` deja `valor` intacto. Falta además techo de 100%: el
      `<input>` (L405) no tiene `max`, la API (`invoicing/[id]/route.ts:33-43`)
      valida `>= 0` sin tope, y el `CHECK` de `factura_descuento` tampoco.
      ⚠️ El caso peligroso es **el inverso**: un `20` tipeado como porcentaje que
      queda como `fijo` se guarda como ₡20 y nada lo detecta.
- [ ] **1.2 Imágenes rotas** — `catalog/page.tsx:139` renderiza
      `/imports/image-3.png` **hardcodeado para todos los productos**, y ese
      archivo no existe: hoy cada tarjeta muestra el SVG de error. En inventario,
      `mapInventoryImage` (`inventory/page.tsx:28`) devuelve ese mismo path y un
      guard en L171 lo excluye, así que siempre se ve el texto "IMG".
- [ ] **1.3 Barra de scroll de `TacticalTable`** — `TacticalTable.tsx:54,90` es el
      único scroll horizontal vivo sin estilar (usado en inventory y movements).
      Ya existen `scrollbar-none` y `tactical-scrollbar` en `globals.css:111,133`.
      Aparte: `tabs.tsx:35` usa `scrollbar-hide`, clase que **no está definida**.

---

## 🟡 Fase 2 — Conectar lo que ya existe

- [ ] **2.1 Dashboard** — el backend ya existe y nadie lo llama:
      `get_dashboard_stats` y `get_order_analytics` (rango de fechas, ingresos,
      promedio) funcionan; `useDashboardData.ts` + `/api/dashboard` + adapter
      también. La página es un cartel de "Próximamente" hardcodeado. Es trabajo de
      **conectar**, no de construir. Graficar con `recharts` — ya instalado
      (`^3.9.2`) y sin usar en ningún lado.
- [ ] **2.2 Statistics** — mismos SPs. Sin OLAP (ver descartados).
- [ ] **2.3 Limpieza de huérfanos** — **54 archivos, 7 564 líneas = 39% del código**
      (19 550 totales), verificado por importadores. Los gordos:
      `chart-container.tsx` (774, librería de charts en SVG hecha a mano),
      `sidebar.tsx` (726), `useInventoryData.ts` (405), `useCategoriesData.ts` (394),
      `carousel.tsx` (241, con `embla` instalado).

---

## 🟢 Fase 3 — Construcción nueva

- [ ] **3.1 Auditoría y logs de sistema** — **no hay ni tabla ni un solo trigger**
      (`grep "CREATE TRIGGER"` → 0). Lo único parecido es `inventario_movimiento`,
      que se escribe **a mano** desde 2 SPs y desde un `.insert()` en
      `catalog-adapter.ts:284`, y **no tiene campo de usuario**. No es un log de
      sistema: es historial de stock. Diseñar la tabla primero.
- [ ] **3.2 Imágenes de producto con CDN** — la tabla `producto_imagen` y los SPs
      `add_product_image`/`get_product_images` **ya existen** (initial_schema L81,
      L242, L1244) y no los usa nadie. Falta: bucket de Supabase Storage (no existe
      ninguno), campo en los modales, y reemplazar el path hardcodeado.
- [ ] **3.3 Perfil de usuario** — depende de auth aplicada (Fase 0).
- [ ] **3.4 Responsive** — el nav mobile ya se hizo. Falta el resto de pantallas.
- [ ] **3.5 SSR** — las 8 páginas admin son `"use client"`. Convertirlas es trabajo
      real, no un flag.
- [ ] **3.6 Lazy loading**
- [ ] **3.7 Auditoría de UX / funcionalidad inconsistente**
- [ ] **3.8 Keep-alive de Supabase** — ⚠️ la premisa original no funciona: un
      trigger de Postgres solo se dispara ante eventos de datos, **no puede
      auto-invocarse por tiempo**. Necesita un agendador: `pg_cron` dentro de la DB
      (verificar disponibilidad en el plan) o, más simple, un cron externo que
      pegue a un endpoint — GitHub Actions con `schedule` es gratis y el repo ya
      está ahí.
      ⚠️ Interacción con Fase 0: **después del REVOKE la anon key no ejecuta nada**,
      así que el ping no puede ir a `/rest/v1/rpc/...` con esa llave. Mejor pegarle
      a un `/api/health` de la propia app (sin secretos fuera, y verifica la cadena
      completa). Vercel Cron en gratuito sirve: mínimo 1 vez por día, ±59 min de
      precisión — suficiente contra una ventana de 7 días. Cron de GitHub Actions
      se desactiva solo si el repo no tiene actividad en 60 días.

---

## 🏁 Decisiones de lanzamiento (no bloquean el desarrollo)

- [ ] **L.1 Hosting: resolver la licencia de Vercel antes de vender** — el plan
      Hobby es **solo uso no comercial**. La definición literal es amplia
      ("beneficio económico de cualquiera involucrado en cualquier parte de la
      producción"), pero **ninguno de los cinco ejemplos que da Vercel aplica** a
      este panel: no cobra a visitantes, no publicita, no tiene anuncios ni
      afiliados, no es de acceso público. Es una zona gris genuina.
      **Acción:** la propia Vercel invita a consultar en casos ambiguos. Escribir a
      soporte describiendo el caso (panel interno, 1-3 usuarios, sin pagos ni
      acceso público) y obtener confirmación por escrito. Gratis y definitivo.
      Si la respuesta es negativa: Pro son $20/mes por asiento. El cálculo no es
      "$20 contra $0" sino "$20 contra que se pause el sistema que factura".
      Hoy no urge: no hay deploy y no se está vendiendo.

- [ ] **L.2 Alternativas de hosting, si el costo pesa**

      | Opción | Costo | Nota |
      |---|---|---|
      | Vercel Pro | $20/mes/asiento | Soporte de primera parte para Next, cero config, ya hay `vercel.json` |
      | Railway Hobby | $5/mes mínimo + uso | Brilla en procesos largos y workers — nada de eso aplica acá. Solo se vuelve natural si se revierte la decisión del servicio de Python |
      | Cloudflare Workers | **Gratis, uso comercial permitido** | 100k req/día; el panel nunca se acerca. Pago desde $5/mes |

      **Cloudflare es el único que elimina la ambigüedad de licencia**, pero implica
      migrar a `@opennextjs/cloudflare` (un adaptador de build, no solo otro
      destino). Middleware y APIs de Node soportados; `next/image` requiere
      configurar Cloudflare Images; la versión de Next alinea con el upgrade a
      14.2.25 que ya hay que hacer por el CVE.
      ⚠️ **El riesgo está concentrado en las facturas PDF.** Límite de bundle:
      3 MiB comprimido (gratuito) / 10 MiB (pago). El stack pesa ~7.8 MB sin
      comprimir (`fontkit` 6.5 MB + `@react-pdf/pdfkit` 948 KB +
      `@react-pdf/renderer` 324 KB). Peor aún: `next.config.js` marca
      `serverComponentsExternalPackages: ['@react-pdf/renderer']` porque webpack no
      lograba empaquetarlo (`bidi-js` es CommonJS) — y **esa vía de escape no
      existe en Workers**, donde todo debe ir bundleado.
      **Si se evalúa esta ruta, prototipar primero la ruta del PDF.** Es el
      make-or-break; el resto de la app es lo fácil.

---

## ❌ Descartados (con motivo)

| Item | Por qué no |
|---|---|
| **Python para dashboard y stats** | Agrega un segundo runtime, deploy y lenguaje para calcular agregados que Postgres ya calcula. `get_order_analytics` **ya devuelve** ingresos y promedio por rango. El gráfico sale con `recharts`, ya instalado. Es SQL + una librería que ya pagaste. |
| **OLAP para statistics** | Hay 9 filas de inventario y 2 pedidos. Postgres maneja esta escala durante años. Si algún día llega, la respuesta intermedia es una vista materializada, no un stack nuevo. |
| **Clerk para auth** | Ninguno de los hallazgos se arregla cambiando de proveedor. Supabase Auth ya funciona e integra nativo con RLS vía `auth.uid()`. Revisitar si aparece multi-tenancy, RBAC con UI, o SSO. |

## ✅ Ya resuelto antes de empezar

| Item | Estado |
|---|---|
| **Evitar inyecciones SQL** | **Ya está bien.** 100% de los accesos usan `.rpc()` con parámetros nombrados. Cero SQL crudo, cero `EXECUTE format()` fuera de un bloque comentado, cero `.or()`/`.filter()` con input de usuario. El `ILIKE '%'‖p_search‖'%'` concatena el *valor*, no texto SQL. El riesgo real no es inyección — es la falta de autorización (Fase 0). |
| **Cloudflare / Railway / Vercel** | **Ya elegido:** existe `vercel.json` configurado para Next. |

---

## Verificación

**Fase 0** — el comando que hoy prueba el agujero debe fallar después:

```bash
# ANTES: {"code":"P0001",...} → se ejecutó
# DESPUÉS: PGRST202 / 404 → cerrado. Si vuelve P0001, NO quedó cerrado.
curl -s -X POST "$URL/rest/v1/rpc/adjust_inventory" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H "Content-Type: application/json" \
  -d '{"p_id_producto_talla":999999,"p_cantidad_cambio":1,"p_motivo":"pentest"}'
```

Auditoría definitiva en SQL (debe devolver **cero filas**):
```sql
select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname='public'
  and (has_function_privilege('anon', p.oid,'execute')
    or has_function_privilege('authenticated', p.oid,'execute'));
```

Control inverso (cero filas, o se rompió la app):
```sql
select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname='public' and not has_function_privilege('service_role', p.oid,'execute');
```

Cobertura de `withAuth` — sin salida:
```bash
grep -rL "withAuth" src/app/api --include=route.ts
```

**Fases 1-3** — `npm run build` + `npm run type-check` limpios, y verificación en
el navegador de cada pantalla tocada.

---

## Registro de avance

### 2026-08-25 — sesión de arranque

Completado antes de escribir este roadmap:

- [x] **Bug de zoom del cinturón (BeltNav)** — el panel se dimensiona en `vh` y el
      texto en `px` fijos, así que con zoom los slots se apretaban. Se resolvió
      escalando el **cinturón** (piso de 56 px por slot vía `MIN_SLOT_PX`) y
      subiéndolo para que el panel negro no se salga. Slot pasó de 39.6 px a 56 px
      a 175% de zoom, con los ítems dentro del negro. Sin regresión a 900 px.
- [x] **Nav mobile** — `MobileNav.tsx`, barra superior con pills; el rail
      fotográfico queda `hidden lg:block`. Antes se estiraba a ancho completo.
- [x] **Sándwich de invoicing** — el bloque opaco abarca todo el segmento central
      (Issued/Due/Order + items + totales), a sangre hasta los bordes del frame.
- [x] **SKU en detalle de pedido** — migración `20260821000000`: `get_order_details`
      hacía `to_jsonb(pedidodetalle)` a secas, sin JOINs, y la UI mostraba
      `SKU #15` (la PK). Ahora devuelve SKU y nombre reales.
- [x] **Prefijo de categoría** — migración `20260822010000`: derivación por
      iniciales para compuestos (`Panta-Sin-Licra → PSL`) y primeras 3 letras para
      palabra suelta (`Sticker → STI`, `Gorras → GOR`), más campo explícito de 3
      caracteres en el modal. Verificado end-to-end: `GOR-BRU-001`, `GOR-BRU-002`,
      `STK-BRU-001`. Datos de prueba limpiados.
- [x] **Limpieza parcial de huérfanos** — 25 archivos borrados (páginas rotas,
      `NavigationContext`, cadenas muertas de `purchase-orders`). **El build de
      producción estaba roto** y quedó verde; TypeScript pasó de 39 errores a 0.
      Quedan 54 archivos huérfanos más (ver 2.3).
- [x] **Rotación de la service role key** — verificado: la llave del historial de
      git ya no es la activa.

**Pendiente inmediato:** commitear las migraciones `20260822010000` y los cambios
de UI del prefijo de categoría.
