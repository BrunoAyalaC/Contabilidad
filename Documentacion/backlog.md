# Backlog inicial — Front ↔ Backend

Este backlog contiene historias de usuario priorizadas, tareas y subtareas derivadas de la documentación técnica (`Documentacion.md`). Cada historia incluye criterios de aceptación y una estimación en puntos (1,2,3,5,8).

Convenciones

- Puntos: Fibonacci (1,2,3,5,8).
- Prioridad: P0 (critico), P1 (alto), P2 (medio).
- Etiquetas: auth, invoices, accounting, catalogs, integration, infra.

---

## US-001 — Autenticación de usuarios (Auth Service)

- Prioridad: P0
- Puntos: 5
- Etiquetas: auth, infra, security

Descripción:
Como usuario quiero iniciar sesión de forma segura para acceder a las funcionalidades protegidas del front.

Criterios de aceptación (Given/When/Then):

- Given: la pantalla de login con campos username y password
- When: envío credenciales válidas a POST `/api/auth/login`
- Then: recibo `accessToken` y `refreshToken` (o cookie httpOnly) y se redirige al dashboard

Tareas:

- T1: Definir contrato OpenAPI para `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout` (2 pts)
  - Subtarea: Añadir ejemplos de request/response (1 pt)
  - Subtarea: Definir códigos de error y payload de error estandarizado (1 pt)
- T2: Implementar backend minimal (auth) que emita JWT y refresh token (5 pts)
  - Subtarea: Store de refresh tokens y endpoint de invalidación (2 pts)
  - Subtarea: Rate limiting y protección básica (2 pts)
- T3: Implementar `AuthProvider` y `useAuth` en front (React) que mantenga accessToken en memoria y refresque automáticamente (3 pts)
  - Subtarea: Implementar interceptor HTTP para manejar 401 → refresh → retry (2 pts)
- T4: Tests básicos (unit + integration) para login y refresh (3 pts)

DoD (Definition of Done): contract OpenAPI disponible, login funcional en dev, tests verdes, CI básico ejecutando lint & tests.

---

## US-002 — Listado y detalle de facturas (Invoice Service)

- Prioridad: P0
- Puntos: 8
- Etiquetas: invoices, integration

Descripción:
Como usuario quiero ver un listado paginado de facturas y ver el detalle para revisar información y líneas.

Criterios de aceptación:

- Given: usuario autenticado
- When: solicita GET `/api/invoices?page=1&limit=20`
- Then: recibe payload paginado con items y meta

Tareas:

- T1: Especificar OpenAPI para endpoints de invoices (list, get, create, update, delete) (3 pts)
  - Subtarea: Modelos Invoice / InvoiceCreate / InvoiceUpdate (1 pt)
- T2: Implementar endpoints backend (CRUD) con validación server-side de totales (5 pts)
  - Subtarea: Calculo de subTotal/taxTotal/total en backend (2 pts)
  - Subtarea: Soporte para filtro `type=sale|purchase` y búsqueda `q` (1 pt)
- T3: Implementar `InvoiceViewer` y `InvoiceList` en front consumiendo la API (3 pts)
  - Subtarea: Pagination UI y manejo de errores (2 pts)
- T4: Tests y contract tests entre front y backend (3 pts)

DoD: CRUD funcional en dev, front muestra listado y detalle, contratos validados.

---

## US-003 — Crear/Editar Factura (invoices)

- Prioridad: P0
- Puntos: 5
- Etiquetas: invoices, integration, forms

Descripción:
Como usuario quiero crear y editar facturas para registrar operaciones de venta/compra.

Criterios de aceptación:

- Given: formulario de factura
- When: envío payload a POST `/api/invoices`
- Then: backend valida y devuelve 201 con la factura creada, totales calculados

Tareas:

- T1: Implementar validaciones server-side (totales, impuestos, campos requeridos) (3 pts)
- T2: Implementar formulario en front (PurchaseInvoiceForm / SalesInvoiceForm) con validación (React Hook Form + Zod) (3 pts)
  - Subtarea: Autocompletar clientes/productos (llamar Catalog Service) (2 pts)
- T3: Tests (unit + e2e) para flujo de creación (3 pts)

DoD: formulario puede crear y actualizar facturas; totals consistentes; tests incluidos.

---

## US-004 — Asientos contables y reporte (Accounting Service)

- Prioridad: P1
- Puntos: 8
- Etiquetas: accounting, reports

Descripción:
Como contable quiero registrar asientos y generar el estado de resultados para conciliación.

Criterios de aceptación:

- Given: usuario con permisos contables
- When: POST `/api/accounting/entries` con lines
- Then: backend acepta solo si suma(debits) == suma(credits) y devuelve 201

Tareas:

- T1: Definir modelo JournalEntry y endpoint POST /entries (3 pts)
  - Subtarea: Validación de sumas (2 pts)
- T2: Implementar GET /reports/income-statement?start=&end= (3 pts)
  - Subtarea: Mapeo del formato esperado por `IncomeStatement.tsx` (1 pt)
- T3: Tests de validación y reporte (3 pts)

DoD: entradas contables registradas y reporte disponible.

---

## US-005 — Catálogos maestros (Catalog Service)

- Prioridad: P1
- Puntos: 5
- Etiquetas: catalogs, infra

Descripción:
Como usuario necesito buscar clientes, proveedores, productos y cuentas para completar facturas y asientos.

Criterios de aceptación:

- Given: input con autocompletar
- When: escribo término y llamo GET `/api/catalogs/products?q=abc`
- Then: recibo lista con `id, code?, name` y meta paginada

Tareas:

- T1: Implementar endpoints GET para customers, suppliers, products, accounts con paginación y `q` (3 pts)
  - Subtarea: GET /<catalog>/:id (1 pt)
- T2: Optimizar índice/consulta en DB para búsquedas (2 pts)
- T3: Tests de contrato y performance básica (2 pts)

DoD: autocompletes fluidos en forms y endpoints disponibles.

---

## US-006 — Observabilidad, seguridad y despliegue básico

- Prioridad: P1
- Puntos: 5
- Etiquetas: infra, monitoring, security

Descripción:
Como equipo ops quiero métricas, logging estructurado y reglas básicas de seguridad para producción.

Criterios de aceptación:

- Given: servicios desplegados en staging
- When: hay errores o latencias altas
- Then: alertas mínimas (logs centralizados + métricas) deben existir

Tareas:

- T1: Añadir logging estructurado y correlation id en headers (2 pts)
- T2: Exponer métricas básicas (histogram de latencia, errores/endpoint) (2 pts)
- T3: Configurar rate limiting y CORS para producción (1 pt)

---

## Backlog de Integración (pendientes a corto plazo)

- Integrar OpenAPI y generar cliente TypeScript para el front (3 pts)
- Configurar CI que ejecute lint, typecheck y tests (3 pts)
- Crear doc de despliegue (infra mínima) y variables de entorno (2 pts)

---

### Notas finales

- Si quieres, puedo convertir estas historias en issues (GitHub/GitLab) y crear plantillas para PRs.
- Puedo generar el OpenAPI minimal para Auth + Invoices como siguiente paso.

---

## US-007 — Invoice OCR / Parser Service

- Prioridad: P0
- Puntos: 8
- Etiquetas: ocr, invoices, integration, infra

Descripción:
Como usuario quiero subir facturas en PDF y obtener los datos extraídos automáticamente para autocompletar formularios y reducir la captura manual.

Criterios de aceptación:

- Given: usuario autenticado y un PDF de factura
- When: sube el PDF a `POST /api/ocr/invoices`
- Then: recibe `jobId` con status pending; cuando el job termina `GET /api/ocr/invoices/:jobId` devuelve `status: done` y `parsed` con confidences por campo

Tareas:

- T1: Definir OpenAPI para `/api/ocr/invoices` (POST), `/api/ocr/invoices/:jobId` (GET) y `/api/ocr/suggestions` (3 pts)
  - Subtarea: ejemplos de request/response y códigos de error (1 pt)
- T2: Implementar endpoint de ingest (encolar job) y persistir metadata (3 pts)
  - Subtarea: almacenar archivo en MinIO/S3 y guardar job metadata en SQL Server/Redis (1 pt). Nota: desarrollo local usa Windows Authentication en el servidor `DESKTOP-UDAM3NC\\SQLEXPRESS04`.
- T3: Implementar worker pipeline (Python) con pdfplumber -> fallback Tesseract + OpenCV -> parsers/regex -> output JSON (5 pts)
  - Subtarea: integrar camelot/tabula para tablas cuando el PDF sea vectorial (2 pts)
  - Subtarea: añadir step de post-procesamiento: normalizar fechas, calcular totals y validación (2 pts)
- T4: Endpoint `/api/ocr/suggestions` que haga fuzzy-match contra `Catalog Service` (3 pts)
  - Subtarea: cache de sugerencias y límites de rate (1 pt)
- T5: Integración front: UI de subida, progreso y revisión manual de campos de baja confianza (3 pts)
  - Subtarea: mapping de `suggestedProductId` hacia `InvoiceCreate` (1 pt)
- T6: Tests (unit + integration + e2e para flujo completo) y contract tests (4 pts)
- T7: Métricas y alertas: exposición de jobs queued/processed/error rate y dashboard básico (2 pts)

DoD: API definida (OpenAPI), worker pipeline desplegable en dev, front puede subir PDF y completar factura con datos extraídos, tests básicos y métricas mínimas.

---

## US-008 — Verificación de RUC (SUNAT Service)

- Prioridad: P0
- Puntos: 3
- Etiquetas: ocr, invoices, integration, infra

Descripción:
Como usuario quiero que el sistema valide automáticamente el RUC del emisor/receptor (SUNAT) para evitar errores en la captura y detectar RUCs inválidos o inactivos.

Criterios de aceptación:

- Given: factura con `ruc` y `document_number`.
- When: se encola verificación con `POST /api/invoices/:id/verify-ruc` o `POST /api/sunat/verify`.
- Then: el sistema responde 202 con jobId y posteriormente `GET /api/sunat/verify/:jobId` devuelve `status: done` con `result` que incluye `valid: true|false`, `name`, y `details`.

Tareas:

- T1: Definir OpenAPI para `POST /api/sunat/verify`, `GET /api/sunat/verify/:jobId`, y `POST /api/invoices/:id/verify-ruc` (1 pt)
- T2: Implementar worker que haga scraping / API call a SUNAT y almacene resultado en SQL Server (`sunat_verifications` table) (2 pts)
- T3: Integrar con Invoice Service: marcar facturas con `sunat_verified` flag y exponer en UI (1 pt)

DoD: verificación básica funcional en dev; UI muestra estado y resultado; tests básicos.

---

## US-009 — Subir PDF y autocompletar factura (boleta/factura)

- Prioridad: P0
- Puntos: 5
- Etiquetas: invoices, ocr, ui, integration

Descripción:
Como usuario quiero subir el PDF de una factura o boleta desde el formulario para que el sistema extraiga automáticamente vendedor, comprador (RUCs), líneas y totales y autocompletar el formulario.

Criterios de aceptación:

- Given: formulario de creación/edición de factura
- When: el usuario hace clic `Subir PDF` y selecciona un PDF
- Then: el front recibe 202 { jobId } y luego `GET /api/invoices/upload-pdf/:jobId` devuelve `status: done` y `parsed` con `supplier`, `customer`, `lines`, `totals` y `confidence` por campo; el front muestra datos sugeridos y permite `Aceptar` o `Editar`.

Tareas:

- T1: Definir OpenAPI para `POST /api/invoices/upload-pdf`, `GET /api/invoices/upload-pdf/:jobId` y `POST /api/invoices/:id/apply-parsed` (2 pts)
- T2: Implementar backend que encole el job y guarde metadata (1 pt)
- T3: Implementar worker (OCR pipeline) que retorne `ParsedInvoice` (2 pts)
- T4: UI: añadir botón `Subir PDF`, pantalla de progreso y preview de datos sugeridos (3 pts)
- T5: Tests de integración y contract tests (2 pts)

DoD: flujo de subida y autocompletado funcional en dev; UI permite aceptar/editar antes de guardar.
