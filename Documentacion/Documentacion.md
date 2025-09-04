````markdown
# Documentación: Servicios backend requeridos por el Front

Este archivo consolida los microservicios mínimos que el front (carpeta `Front`) requiere para funcionar, y define el diseño de login/autenticación que debe implementarse en el backend.
Objetivo

- Proveer al equipo backend contratos claros (endpoints, payloads, respuestas esperadas) para acelerar la implementación y pruebas de integración.

Servicios requeridos (resumen)

- Auth Service — Autenticación, emisión y refresh de tokens, logout, gestión de usuarios/roles.
- Invoice Service — CRUD y búsquedas de facturas (ventas y compras). Endpoints de listado paginado, obtención por id, creación, actualización y eliminación.
- Accounting Service — Asientos contables (journal entries), libro diario, reportes contables (income statement usado por `IncomeStatement.tsx`).
- Catalog Service — Catálogos maestros: clientes, proveedores, productos/servicios, cuentas contables. Endpoints para autocompletar y paginar.

Convenciones transversales

- Base path: todos los servicios expondrán rutas bajo `/api/<service>` (ej. `/api/auth`, `/api/invoices`).
- Identificadores: `id` (UUID v4 preferible).
- Identificadores: `id` (UUID v4 preferible).
- Errores uniformes: respuesta JSON con { code: string, message: string, details?: any } y códigos HTTP semánticos.
- Paginación: query params `page` (1-based), `limit`; respuesta con `{ items: T[], meta: { page, limit, total } }`.
- Search/autocomplete: query param `q` y filtros por campos relevantes (ej. `type=sale|purchase`).
- Seguridad: TLS obligatorio en producción; CORS que permita el origen del front y exponga headers de auth.

1. Auth Service

- Base URL: `/api/auth`

- POST /login

  - Request: { "username": string, "password": string }
  - Response 200: { "accessToken": string, "refreshToken": string (opcional si se usa cookie), "user": { "id": string, "name": string, "roles": string[] } }
  - Errors: 401, 400

- POST /refresh
  - Request: { "refreshToken": string } OR cookie httpOnly
  - Response 200: { "accessToken": string }
- POST /logout
  - Request: {} (o invalidación automática desde cookie)
  - Response 204

Recomendaciones concretas de implementación

- accessToken: JWT con corta expiración (ej. 10–15 min). Usarlo en header `Authorization: Bearer <token>`.
- refreshToken: almacenar preferiblemente en cookie `HttpOnly; Secure; SameSite=Strict` y usar endpoint `/refresh` para emitir nuevos access tokens.
- Endpoint `/login` y `/refresh` deben implementar medidas de mitigación: rate limiting, bloqueo temporal tras varios intentos fallidos, logging y alertas.
- Exponer claims mínimos en token (userId, roles, exp) y evitar datos sensibles.

Base de datos (nota importante)

- Este proyecto usará SQL Server (MSSQL). Para desarrollo local se usará Windows Authentication/Integrated Security contra el servidor `DESKTOP-UDAM3NC\\SQLEXPRESS04`. En .NET/EF Core la cadena de conexión ejemplo en `appsettings.json` es:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=DESKTOP-UDAM3NC\\\\SQLEXPRESS04;Database=NombreBD;Trusted_Connection=True;MultipleActiveResultSets=True;"
  }
}
```

Reemplace `NombreBD` por el nombre de la base de datos de la aplicación. Evite usar `localhost` en entornos de desarrollo, use el servidor indicado.

2. Invoice Service

- Base URL: `/api/invoices`
- GET /?page=&limit=&q=&type=

  - Response 200: { items: Invoice[], meta: { page, limit, total } }

- GET /:id
  - Response 200: Invoice
- POST /

  - Request: InvoiceCreate
  - Response 201: Invoice

- PUT /:id

  - Request: InvoiceUpdate
  - Response 200: Invoice

- DELETE /:id
  - Response 204

Notas importantes sobre facturas y RUC

- Cada factura debe almacenar el RUC del emisor (supplier) o del receptor (customer) según corresponda. Campos recomendados: `ruc: string`, `party_name: string`, `document_type: string`, `document_number: string`.
- El campo `type` indica `sale` o `purchase` y determina la lógica contable (ver Accounting Service).

SUNAT / Verificación RUC

- Se añadirá un servicio que verifique RUCs y datos oficiales en SUNAT (scraping o API cuando esté disponible). El flujo propuesto:
  - Front/Invoice Service encola verificación con `POST /api/sunat/verify` o `POST /api/invoices/:id/verify-ruc`.
  - Worker realiza consulta/scraping y actualiza registro con resultado y metadata (razón social, estado, comprobantes asociados).
  - Si la verificación falla, marcar estado y notificar al usuario para revisión manual.

Modelos (ejemplo)

- Invoice

  - id: string
  - type: 'sale' | 'purchase'
  - date: string (ISO 8601)
    UI / Autocompletar desde PDF (botón "Subir PDF")

- En los formularios de creación/edición de factura (compra o venta) debe incluirse un botón `Subir PDF` que permita cargar la factura y rellenar automáticamente los campos:
  - Acciones front: enviar el PDF a `POST /api/invoices/upload-pdf` o `POST /api/ocr/invoices`.
  - Respuesta: 202 { jobId } y poll a `GET /api/invoices/upload-pdf/:jobId` o `GET /api/ocr/invoices/:jobId`.
  - Cuando el job finaliza, el sistema devuelve `ParsedInvoice` con `supplier` y `customer` (incluyendo `ruc` y `name`), `lines`, `subTotal`, `taxTotal`, `total` y `confidence` por campo.
  - El front debe autocompletar los campos y sugerir `partyId` si hay coincidencias en `Catalog Service`.
  - Si `ParsedInvoice` detecta una boleta (`document_subtype` = 'BOLETA'), el formulario debe marcar `is_boleta=true` y ajustar validaciones.

Ejemplo de flujo minimal:

1.  Usuario en formulario hace clic `Subir PDF` y selecciona archivo.
2.  Front POST `/api/invoices/upload-pdf` -> 202 { jobId }
3.  Front poll GET `/api/invoices/upload-pdf/:jobId` hasta `status: done`.
4.  Front muestra los datos sugeridos (RUC vendedor/comprador, líneas) con botones `Aceptar` / `Editar`.
5.  Si el usuario acepta, POST `/api/invoices/:id/apply-parsed` o al crear una factura nueva, se crea con los datos completados.

- partyId: string (cliente o proveedor según tipo)
- currency: string (ISO-4217)
- lines: [{ id?: string, productId?: string, description: string, quantity: number, unitPrice: number, taxRate?: number }]
- subTotal: number
- taxTotal: number
- total: number

- InvoiceCreate / InvoiceUpdate: mismos campos excepto `id`, `subTotal`, `taxTotal`, `total` se calculan en backend.

Notas de integración

- Validaciones: totals y taxes deben ser calculadas/validadas en backend para evitar inconsistencias.
- Soportar estados de factura si aplica (draft, issued, paid, cancelled).

3. Accounting Service

- Base URL: `/api/accounting`
- POST /entries

  - Request: JournalEntryCreate { date: string, description?: string, lines: [{ accountId: string, debit?: number, credit?: number }] }
  - Response 201: JournalEntry

- GET /entries?start=&end=&page=&limit=
  - Response paginado de JournalEntry
- GET /reports/income-statement?start=&end=
  - Response: IncomeStatement DTO (utilizado por `IncomeStatement.tsx`)

Modelo básico de JournalEntry

- id: string
- date: string
- description: string
- lines: [{ accountId: string, debit: number, credit: number }]

Requerimientos funcionales

- Imponer que suma(debits) == suma(credits) al crear entry; retornar 400 si no coincide.
- Permitir filtros por rango de fechas para reportes.

4. Catalog Service

- Base URL: `/api/catalogs`
- GET /customers?q=&page=&limit=
- GET /suppliers?q=&page=&limit=
- GET /products?q=&page=&limit=
- GET /accounts?q=&page=&limit=

Respuesta mínima para autocompletar

- { items: [{ id, code?, name }], meta }

Recomendación: incluir endpoints `GET /<catalog>/:id` para obtener detalle.

Cross-cutting: observabilidad y contratos

- Logging estructurado: cada petición debe incluir request id/correlation id para trazabilidad.
- Métricas: latencias, tasa de error, throughput por endpoint.
- Errores: estandarizar payload { code: string, message: string, details?: any }.

Políticas de seguridad y operaciones

- CORS: permitir origen del front durante desarrollo; en producción restringir a dominios autorizados.
- Rate limiting y WAF en endpoints sensibles (auth, create invoice, accounting entries).
- Backup y migraciones para datos contables; políticas de retención y exportación.

Formato de ejemplo de error

```json
{
  "code": "INVALID_TOTAL",
  "message": "El total calculado no coincide con la suma de líneas",
  "details": { "field": "total" }
}
```
````

Checklist rápida para backend (prioridad)

1. Implementar Auth Service con `/login`, `/refresh`, `/logout` y protección de rutas (JWT + refresh cookie).
2. Implementar Invoice Service (list, get, create, update, delete). Validación server-side de totales y taxes.
3. Implementar Accounting Service con asientos y reportes (income statement).
4. Implementar Catalog Service con endpoints de autocompletar.
5. Exponer OpenAPI/Swagger para los endpoints críticos (Auth, Invoices) antes de la primera integración.

Siguiente paso recomendado

- Generar un OpenAPI 3.0 minimal para `Auth` y `Invoices` (puedo generarlo si lo deseas). Esto facilita la implementación backend y la generación de clientes para el front.

Fin del documento.

```

```
