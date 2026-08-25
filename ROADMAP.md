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

**Estado: CERRADA EN CÓDIGO Y BASE (2026-08-25).** Quedan dos acciones manuales
del usuario: 0.2 (crear el admin y cerrar el registro) y 0.7.

⚠️ **BLOQUEANTE ANTES DE USAR LA APP: hay 0 usuarios registrados.** Con la
autenticación aplicada, hoy nadie puede entrar. Hay que crear el usuario admin
**antes** de desactivar el registro, o el sistema queda inaccesible para todos.

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

- [x] **0.1 Migración REVOKE/GRANT** — nueva en `supabase/migrations/`.
      `REVOKE EXECUTE ON ALL ROUTINES IN SCHEMA public FROM PUBLIC, anon,
      authenticated;` + `GRANT ... TO service_role;` + `ALTER DEFAULT PRIVILEGES`
      para que las funciones nuevas nazcan cerradas + `NOTIFY pgrst, 'reload schema';`
      ⚠️ No omitir el GRANT a `service_role`: saltea RLS pero **no** privilegios de EXECUTE.
- [x] **0.2 Cerrar registro** — HECHO por el usuario (2026-08-25): admin creado
      **primero** y recién después desactivado el signup. El orden importaba: con
      0 usuarios, cerrar el registro antes habría dejado la app inaccesible para
      todos, incluido el dueño.
- [x] **0.3 Restaurar `src/middleware.ts`** — redirige a login en páginas, 401 en
      `/api/*`. **Borrar `middleware.ts` de la raíz**: verificado contra
      `.next/server/middleware-manifest.json` (`name: "src/middleware"`), el de la
      raíz nunca se compila.
- [x] **0.4 `withAuth` en las 24 rutas** (son 24, no 23) — helper en `src/lib/api/middleware.ts`,
      compuesto con el `withErrorHandling` existente. Usar `getUser()` (valida
      contra el servidor), no `getSession()` (solo decodifica cookie).
- [x] **0.5 Subir Next a ≥14.2.25** — quedó en 14.2.33. CVE-2025-29927: bypass de middleware con el
      header `x-middleware-subrequest`. Por esto el chequeo va **también** en cada
      route handler, no solo en el middleware.
- [x] **0.6 Precio y total derivados en la DB** — `api/orders/route.ts:52` calcula
      el total con `precio_unitario` que manda el cliente. El precio canónico ya
      está en `productotallastock.precio`. No se arregla validando: se arregla
      dejando de aceptar el campo. Sumar `CHECK` cantidad > 0 y ≤100% en descuentos.
- [x] **0.7** Proyecto viejo `qveesfkespwtaeypogaq` **borrado** (confirmado por el usuario, 2026-08-25).


### Verificado tras aplicar (2026-08-25)

| Prueba | Antes | Ahora |
|---|---|---|
| `adjust_inventory` con anon key | `P0001` (se ejecutó) | `42501 permission denied` |
| `get_order_analytics` con anon | devolvía ingresos | `42501` |
| Funciones nuevas con anon | — | `PGRST202` (ni figuran) |
| Rutas de API sin sesión | 200 con datos | **401** las 24 |
| Páginas sin sesión | cargaban | **307** a `/auth/login?redirectTo=` |
| Pedido con `precio_unitario: 1` (real ₡50) | total ₡2 | **total ₡100**, precio guardado 50 |
| Assets de `public/` (incluida extensión `.PNG`) | 307 al login | **200 `image/*`** |
| Landing `/` sin sesión | 307 al login | **200** |

Control inverso (que no se rompió nada): con sesión, las 8 páginas y las 8 rutas
de datos responden 200; `service_role` ejecuta todo. Probado creando un usuario
temporal, iniciando sesión real en el navegador y borrándolo después — la base
quedó igual que antes (0 usuarios, pedidos 7 y 8, stock 11).

### Hallazgos nuevos durante la ejecución

- [x] ⚠️ **Deriva de esquema — RESUELTA, y era peor de lo detectado.** No eran 2
  columnas sino **29**: `initial_schema.sql` omite el límite de `varchar` en
  *todas* las columnas de texto, mientras la base real sí los tiene
  (`cliente.telefono(20)`, `producto.codigo(20)`, `color.hex_code(7)`,
  `productovariante.codigo_variante(30)`, …). Un despliegue desde cero habría
  producido un esquema distinto al de producción en 29 puntos, y el bug solo
  aparecería al promover.
  Migración `20260825030000` codifica los 29 límites. Es no-op contra la base
  actual (verificado: `tipoproducto` sigue en 10/50/3); su valor es que de acá en
  más las migraciones describen la realidad.
  ⚠️ `supabase db pull` **no sirve en esta máquina**: necesita Docker para la base
  sombra. La comparación se hizo contra el spec OpenAPI de PostgREST. Eso cubre
  tablas y columnas, **no** funciones ni índices — si algún día hay Docker, vale
  correr un `db pull` real para cerrar el resto.
- [x] **Bug de `create_category` — RESUELTO.** Derivaba el `codigo` slugificando
  el nombre contra una columna `varchar(10)`: "Guantes de Boxeo" → 500.
  Los datos mostraron que el slug nunca fue la convención — las 6 categorías
  reales tienen `codigo` = prefijo (RSH, PSL, TSH…); solo las 2 creadas
  automáticamente traían slug, y `coleprueba` medía exactamente 10, a un carácter
  de fallar. Migración `20260825020000`: **`codigo` es el prefijo**. Nunca pasa de
  3 caracteres, así que el desborde desaparece por construcción en vez de por un
  truncado que dejaría colisiones silenciosas.
  Beneficio lateral: `codigo` ya era `UNIQUE`, así que ahora esa restricción
  garantiza lo que hacía falta — **dos categorías no pueden compartir prefijo**, y
  por lo tanto no comparten serie de SKU. Verificado: "Guantes de Boxeo" → GDB,
  "Gorros" tras "Gorras" da un mensaje accionable en vez de un 500 crudo, y con
  prefijo explícito GRO entra bien.
- [x] **`api/inventory/valuation/route.ts` — ELIMINADA.** Usaba el cliente anon en
  el servidor y consultaba una tabla `inventory` inexistente. Se fue con ella
  `useInventoryData.ts` (405 líneas), su único llamador, también huérfano: la
  página real usa `useInventory`.
- **`next/image` con `remotePatterns: hostname: '**'`** (`next.config.js`) es
  justo el patrón comodín del aviso GHSA-9g9p-9gw9-jx7f (DoS del optimizador de
  imágenes). Acotarlo a los hosts reales cuando se implemente 3.2.
- Quedan 10 avisos de `npm audit` sin corrección disponible en la línea 14.x, casi
  todos DoS. El bypass de middleware (CVE-2025-29927), que era el que motivaba
  el upgrade, sí quedó cubierto.
- [x] ⚠️ **REGRESIÓN introducida por 0.3 y corregida — todas las imágenes rotas.**
  El `matcher` del middleware excluía `public/`, exclusión que **no hace nada**:
  Next sirve `public/` desde la RAÍZ, así que `public/brand/x.png` se pide como
  `/brand/x.png` y una URL con `/public/` no existe jamás. Consecuencia: el
  middleware interceptaba cada imagen y respondía **307 hacia el login**;
  `next/image` fallaba con *"received null"* porque recibía HTML esperando un PNG.
  Rompía cinturones, cinta, y hasta los logos de login y register, que son
  páginas públicas. Confirmado con petición real, no por lectura del patrón.
  El primer intento de arreglo **volvió a fallar de otra forma**: excluir por
  extensión en el matcher es sensible a mayúsculas, y el proyecto mezcla
  `Nogi-set-model-01.PNG` con `Nogi-set-model-02.png` — quedó rota justo la
  tarjeta "Ritual de Combate" del landing. El segundo intento (`(?i:...)`) tumbó
  el build entero: el matcher se compila a un `RegExp` de JavaScript, que **no**
  admite flags de grupo inline.
  **Solución final:** la exclusión vive dentro de la función (`STATIC_ASSET`,
  `src/middleware.ts`), donde el flag `i` sí funciona. Lección: el `matcher` no es
  una regex completa; lo que necesite lógica real va adentro.
- [x] **Landing público.** `/` redirigía al login. Se corrigió tras notar que el
  grupo `(landing)` es marketing de verdad —`HomeHero`, `RaicesSection`,
  `PhilosophySection`, `EmblemSection`, `ContactSection`—, no una antesala del
  login: un visitante sin cuenta tiene que poder verlo. Se separó `AUTH_PATHS`
  (a quien ya tiene sesión se lo manda al panel) de `PUBLIC_PATHS` (abierto a
  todos, con o sin sesión). Comparación por igualdad exacta: un `startsWith`
  con `'/'` habría abierto la aplicación entera.
- **`/favicon.svg` no existe** aunque `layout.tsx:23-25` lo declara → 404 y la
  pestaña muestra el ícono genérico. Cosmético y preexistente.

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

- [x] **1.1 Descuentos: cambiar tipo no reinicia el valor** — RESUELTO. Ahora
      `updateDiscountField` limpia `valor` al cambiar de tipo, y el input toma
      `max=100` en modo porcentaje (misma regla que el CHECK
      `factura_descuento_porcentaje_max` de la base). Contexto original:
      `invoicing/page.tsx:129-131`. `updateDiscountField` es un setter genérico:
      al setear `tipo` deja `valor` intacto. Falta además techo de 100%: el
      `<input>` (L405) no tiene `max`, la API (`invoicing/[id]/route.ts:33-43`)
      valida `>= 0` sin tope, y el `CHECK` de `factura_descuento` tampoco.
      ⚠️ El caso peligroso es **el inverso**: un `20` tipeado como porcentaje que
      queda como `fijo` se guarda como ₡20 y nada lo detecta.
- [x] **1.2 Imágenes — RESUELTO con la feature completa** (se adelantó 3.2 por
      decisión del usuario). Ver "Imágenes de producto" más abajo. Contexto
      original: `catalog/page.tsx:139` renderiza
      `/imports/image-3.png` **hardcodeado para todos los productos**, y ese
      archivo no existe: hoy cada tarjeta muestra el SVG de error. En inventario,
      `mapInventoryImage` (`inventory/page.tsx:28`) devuelve ese mismo path y un
      guard en L171 lo excluye, así que siempre se ve el texto "IMG".
- [x] **1.3 Barra de scroll de `TacticalTable`** — RESUELTO: se aplicó
      `tactical-scrollbar` (ya existía en `globals.css:133`, con la paleta Canopy)
      a los dos scrolls de `TacticalTable.tsx:54,90`. `table.tsx` y `tabs.tsx`
      resultaron **huérfanos** (0 importadores), así que la clase `scrollbar-hide`
      indefinida es irrelevante — se van con 2.3. Contexto original: `TacticalTable.tsx:54,90` es el
      único scroll horizontal vivo sin estilar (usado en inventory y movements).
      Ya existen `scrollbar-none` y `tactical-scrollbar` en `globals.css:111,133`.
      Aparte: `tabs.tsx:35` usa `scrollbar-hide`, clase que **no está definida**.

---

## 🟡 Fase 2 — Conectar lo que ya existe

- [x] **2.1 Dashboard — HECHO.** Los 4 KPI y el panel de reposición salen de tres
      SPs que ya existían y nadie invocaba: `get_dashboard_stats`,
      `get_order_analytics` y `list_inventory_items`. Cero SQL nuevo — fue
      conectar, tal como decía el diagnóstico. `getDashboardPayload()` dispara las
      tres en paralelo, así el cliente hace un solo viaje.
      **Decisiones:** (a) se quitó el KPI de *clientes* — daba 0 con 2 pedidos
      existentes, porque desde `20260813000000` los pedidos guardan el contacto en
      línea y la tabla `cliente` quedó sin uso: un dato correcto que se lee como
      roto; (b) "Stock Burn Rate" se reemplazó por **Necesita reposición**, que sí
      es accionable, y de paso deja a la vista el stock en −2 del Rashguard;
      (c) "Monthly Goal" sigue en Próximamente porque las metas no existen como
      concepto en el esquema — ahí no falta conectar, falta definir.
- [x] **2.2 Statistics — HECHO.** Lo que la separa del dashboard es el **selector
      de período**: `get_order_analytics` siempre aceptó `p_start_date`/`p_end_date`
      y nadie los usaba. Presets 7/30/90 días y Todo. Segundo SP rescatado:
      `get_inventory_valuation` (valor total, productos, agotados, bajo stock),
      muerto desde que se borró la ruta `valuation` que lo llamaba mal.
      La valuación **no** se filtra por rango a propósito: es una foto de hoy.
      `/api/statistics` valida formato de fecha y que `start <= end`; el hook
      cancela respuestas viejas para que cambiar de preset rápido no deje pintado
      un rango anterior que llegó tarde.
      Verificado: 30 días → 2 pedidos ₡200; 7 días → 0 con aviso de rango vacío.
- **Sin gráficos, en ambas.** `recharts` sigue instalado y sin usar, a propósito:
  hay **2 pedidos y los dos son del 13 de agosto**. Cualquier serie temporal es un
  punto. Un gráfico vacío se ve peor que no tenerlo. Revisitar cuando haya
  volumen real — el paquete ya está pago.
- [x] **2.3 Limpieza de huérfanos — HECHA. 74 archivos borrados, cero muertos.**

      | | Antes | Después |
      |---|---|---|
      | Archivos `.ts/.tsx` | 180 | **106** |
      | Líneas | 20 354 | **11 857** |
      | Inalcanzables | 74 (41%) | **0** |

      **Método:** recorrido del grafo desde los puntos de entrada reales
      (`page.tsx`, `layout.tsx`, `route.ts`, `middleware.ts`), no "sin importador
      directo" — la diferencia son cadenas donde A importa B pero nadie importa A
      (59 contra 74). Script en el scratchpad de la sesión.
      **48 eran `src/components/ui/`**: la app usaba **9 de 57**. El sistema de
      diseño real es BRUMA (`FloraGlass`, `TacticalTable`, `Fauna`, `EmptyState`,
      `button`, `dialog`, `skeleton`, `layout`, `utils`), no shadcn — que estaba
      instalado entero y sin usar.
      Se verificó antes de borrar que solo 1 de los 48 tenía diseño propio
      (`typography.tsx`), y resultó obsoleto igual: usaba `useTheme` con estilos
      inline, el enfoque viejo que reemplazaron las clases Tailwind.
      Los otros 26 eran residuo de la reestructuración: `lib/supabase.ts` (el
      cliente anon que Fase 0 dejó sin sentido), `ProtectedRoute` (lo reemplazó el
      middleware), `VerticalNav`/`GlobalHeader` (los reemplazó BeltNavigation),
      8 hooks, `lib/theme/*`, `utils/*`.
      ⚠️ **`useDashboardData` NO se borró**: estaba en la lista de muertos y salió
      sola al conectarse el dashboard en 2.1. Por eso la limpieza fue después de
      conectar, no antes.
      Verificado: `tsc` 0 errores, build de producción OK, las 13 rutas siguen.

- [ ] **2.4 Dependencias sin usar** (secuela de 2.3) — al irse los componentes de
      shadcn quedaron 8 paquetes que ya nadie importa: `embla-carousel-react`,
      `react-day-picker`, `cmdk`, `vaul`, `sonner`, `input-otp`,
      `react-resizable-panels` y `recharts`.
      ⚠️ **`recharts` conviene dejarlo**: es el que se va a usar para graficar
      cuando haya volumen de pedidos (ver 2.1/2.2). Los otros 7 se pueden
      desinstalar; no bajan el bundle —el tree-shaking ya los excluía— pero sí
      acortan `npm install` y la superficie de `npm audit`.

---

## 🟢 Fase 3 — Construcción nueva

- [ ] **3.1 Auditoría y logs de sistema** — **no hay ni tabla ni un solo trigger**
      (`grep "CREATE TRIGGER"` → 0). Lo único parecido es `inventario_movimiento`,
      que se escribe **a mano** desde 2 SPs y desde un `.insert()` en
      `catalog-adapter.ts:284`, y **no tiene campo de usuario**. No es un log de
      sistema: es historial de stock. Diseñar la tabla primero.
- [x] **3.2 Imágenes de producto — HECHA** (adelantada desde Fase 1).

      **Lo que había:** la tabla `producto_imagen` y los SPs
      `add_product_image`/`get_product_images` existían desde el esquema inicial y
      **nadie los llamaba**. Mientras tanto la UI mostraba
      `/imports/image-3.png` hardcodeado para todos los productos — residuo de una
      exportación de Figma, y el archivo no existe en `public/`. Resultado: cada
      tarjeta del catálogo rendereaba el SVG de imagen rota, y en inventario
      alguien parcheó el síntoma con un guard que comparaba contra esa misma ruta
      (`item.img !== "/imports/image-3.png"`) en vez de quitarla.

      **Lo construido:**
      - Bucket `product-images` en Supabase Storage: público, 5 MB, solo
        JPEG/PNG/WebP/AVIF. Público porque las imágenes de producto no son
        sensibles y una URL directa se cachea sin firmar nada.
      - Migración `20260825040000`: `list_products` devuelve `imagen_url` (la
        principal, mismo orden que `get_product_images`) para no pedir imágenes
        producto por producto al pintar la grilla; y `delete_product_image`, que
        devuelve la url para poder borrar también el archivo del bucket.
      - Migración `20260825050000`: `set_primary_product_image`, para cambiar la
        portada sin re-subir el archivo (la alternativa duplicaba la imagen).
      - `/api/catalog/[id]/images` con GET/POST/PATCH/DELETE. **La subida pasa por
        el servidor a propósito**: el bucket solo acepta escrituras con
        `service_role`, así que la anon key del bundle no puede llenarlo
        (verificado: da 400).
      - `ProductImages.tsx` en el modal de edición: subir, ver, marcar portada,
        borrar. Solo al editar, no al crear — `add_product_image` necesita un
        `id_producto` que no existe hasta guardar.

      **Decisión de alcance:** inventario NO muestra la imagen todavía.
      `list_inventory_items` tendría que devolverla, y ese SP ya se redefinió 5
      veces y tiene un `UNION ALL` — tocarlo por una miniatura de 12px no vale el
      riesgo. Ahí quedó el placeholder honesto en vez de la ruta fantasma.
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
