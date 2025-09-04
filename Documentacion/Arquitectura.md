# Arquitectura y Plataforma — Microservicios para el Front

Este documento describe la arquitectura propuesta para soportar el front en `Front/` mediante microservicios, sus endpoints principales, dependencias infra (DB, colas, storage), requisitos de seguridad, observabilidad y despliegue.

Propósito

- Entregar un contrato técnico y guía operativa mínima para que el equipo backend implemente servicios interoperables y desplegables en entornos dev/staging/production.

Resumen de componentes

- API Gateway / Reverse Proxy: NGINX o cloud LB + TLS termination.
- Servicios (cada uno con su propia imagen, despliegue y BD según necesidad):
  - Auth Service
  - Invoice Service
  - Accounting Service
  - Catalog Service
  - Invoice OCR / Parser Service
  - SUNAT Verification Service (scraping / API verification for RUCs and document validation)
  - Notifications Service
  - Payments Service
  - Inventory Service (opcional)
- Infra transversal: SQL Server (MSSQL) (per-service or shared schema) — usamos SQL Server con Windows Authentication para desarrollo local (ver "Conexión" abajo); Redis (cache, broker), RabbitMQ (workers) o Redis Streams, MinIO/S3 (objetos), Prometheus + Grafana, Jaeger/OpenTelemetry, ELK/EFK o Loki/Grafana.

Principios

- Contract-first: publicar OpenAPI para endpoints críticos (Auth, Invoices, OCR).
- Bounded Contexts: cada servicio encapsula su propio dominio y API.
- Resiliencia: retries, circuit-breaker (Polly/Envoy filters), timeouts.
- Seguridad: TLS everywhere, least-privilege, httpOnly cookies para refresh tokens.

Servicios y Endpoints (contrato de alto nivel)

1. Auth Service

- Base: `/api/auth`
- POST /login
- POST /refresh
- POST /logout
- GET /me

Resp brief: JSON estándar { code?, message?, data? } y errores con { code, message, details? }.

2. Invoice Service

- Base: `/api/invoices`
- GET /?page=&limit=&q=&type=
- GET /:id
- POST /
- PUT /:id
- DELETE /:id
- GET /:id/pdf (opcional: descargar PDF asociado)
- POST /:id/validate-ruc -> 200 { valid: boolean, details? }

Notas importantes para invoices

- Cada factura debe estar relacionada con un RUC (tax identifier) del emisor o receptor según corresponda. Añadir columna `ruc` y `party_name` en la tabla `invoices` para referencia rápida.
- Incluir campo `document_type` y `document_number` (por ejemplo: Documento = 'FACTURA'|'BOLETA'|'NOTA' y número correlativo).
- El campo `type` indica si la factura es `sale` o `purchase`. Esto debe influir en la contabilidad (asientos):

  - `sale`: genera asientos que incrementan cuentas por cobrar (Haber/Credito para ingresos, Debe/DeBITO para cuentas por cobrar al crear el asiento de cobro cuando aplica).
  - `purchase`: genera asientos que incrementan cuentas por pagar (Debe/DEBITO para gastos/activos y Haber/CREDITO para cuentas por pagar).

- Además es necesario soportar sub-tipo de documento (por ejemplo `is_boleta` o `document_subtype`) para distinguir facturas vs boletas de venta/compra. Agregar la columna `is_boleta BIT` o `document_subtype NVARCHAR(20)` según convenga para que la UI pueda mostrar/requerir campos específicos.

UI: botón de subida y autocompletado desde PDF

- En el formulario de registro de factura (compra o venta) debe existir un botón `Subir PDF` que permita cargar la factura en PDF y lanzar el pipeline OCR/Parser para autocompletar todos los campos (vendedor, comprador, RUCs, líneas, totales). Flujo recomendado:
  1. El usuario hace clic en `Subir PDF` y envía el archivo al endpoint de ingest del OCR: `POST /api/ocr/invoices` (multipart/form-data) o al endpoint convenido en Invoice Service `POST /api/invoices/upload-pdf`.
  2. API responde `202 { jobId }`. El front muestra progreso y poll a `GET /api/ocr/invoices/:jobId` o `GET /api/invoices/upload-pdf/:jobId`.
  3. Cuando el job termina, el backend devuelve el objeto `ParsedInvoice` que incluye `supplier.ruc`, `supplier.name`, `customer.ruc`, `customer.name`, `lines`, `subTotal`, `taxTotal`, `total` y `confidence` por campo.
  4. El front mapea automáticamente los campos (RUC vendedor/comprador) en el formulario; si existen coincidencias en el `Catalog Service` sugiere `partyId` candidatos (ej. `compra a 1011203021231` si el PDF indica eso).
  5. Si la confianza en un campo es baja (<0.6 por ejemplo), marcar para revisión manual antes de guardar.

Endpoints adicionales sugeridos (Invoice-centric)

- POST `/api/invoices/upload-pdf` -> 202 { jobId } (con opción `?associate=true` para crear un draft invoice ligado al resultado)
- GET `/api/invoices/upload-pdf/:jobId` -> 200 { status, parsed }
- POST `/api/invoices/:id/apply-parsed` -> 200 { invoice } (aplica el parsed payload al draft existente, retorna la factura con los campos completados)

Cambios en esquema (sugeridos)

- En `dbo.invoices` recomendamos añadir columnas opcionales:
  - `ruc NVARCHAR(50) NULL` -- RUC principal (emisor o receptor según `type`)
  - `party_ruc NVARCHAR(50) NULL` -- RUC de la contraparte si aplica
  - `document_type NVARCHAR(20) NULL`
  - `document_subtype NVARCHAR(20) NULL` -- p.ej. 'BOLETA' o 'FACTURA'
  - `is_boleta BIT NOT NULL DEFAULT 0`
  - `sunat_verified BIT NOT NULL DEFAULT 0`

-- Ejemplo de endpoints complementarios relacionados con RUC y validación (integración con SUNAT):

- POST `/api/invoices/:id/verify-ruc` -> encola verificación contra SUNAT; response 202 { jobId }
- GET `/api/invoices/:id/verify-ruc/:jobId` -> 200 { status, valid, metadata }

3. Accounting Service

- Base: `/api/accounting`
- POST /entries
- GET /entries?start=&end=&page=&limit=
- GET /reports/income-statement?start=&end=

4. Catalog Service

- Base: `/api/catalogs`
- GET /customers?q=&page=&limit=
- GET /suppliers?q=&page=&limit=
- GET /products?q=&page=&limit=
- GET /accounts?q=&page=&limit=
- GET /<catalog>/:id

5. Invoice OCR / Parser Service

- Base: `/api/ocr`
- POST /invoices (multipart form data) -> 202 { jobId }
- GET /invoices/:jobId -> 200 { status, parsed }
- GET /suggestions?field=&q=&limit=

6. Notifications Service

- POST /send (email/push templates)

7. Payments Service

- POST /payments
- GET /payments/:id
- POST /payments/:id/confirm

8. Inventory Service (opcional)

- GET /products?q=&page=&limit=
- POST /inventory/adjust

Data stores y patrones de persistencia

- SQL Server (principal): datos transaccionales (invoices, accounting entries, catalogs). Favor esquema por servicio o schemas separados para aislamiento. Usaremos `UNIQUEIDENTIFIER` para ids y `NVARCHAR(MAX)` para JSON/raw text; ver sección de tablas para ejemplos.
- Redis: cache de resultados, rate-limiting counters, short-lived locks. También puede usarse como broker (Redis Streams) o usar RabbitMQ para colas.
- Message broker: RabbitMQ o Kafka (si se requiere throughput). Ejemplo: Invoice->Accounting events, OCR->InvoiceCreate suggestions.
- Object storage: S3/MinIO para PDFs y artefactos (preservar con cifrado en reposo).
- Search/index: opcional Elasticsearch para búsquedas libres y autocompletes en Catalog.

Procesamiento asíncrono

- Jobs: ingestion (OCR) y tareas pesadas deben encolarse. API responde con jobId y workers (Python/Node) procesan y actualizan estado en DB.
- Diseñar idempotencia en workers y manejar retries con backoff. Registrar failures y exponer dead-letter queue para análisis.

Seguridad y control de acceso

- TLS 1.2/1.3 en todas las comunicaciones.
- Auth: JWT para accessToken (corta vida). Refresh token en cookie httpOnly; server-side store para revocación.
- RBAC: claims en JWT para roles y permisos; endpoints administrativos protegidos por scopes.
- Validaciones: sanitizar inputs, limitar tamaño de uploads, escanear archivos si procede.

Observabilidad

- Logs: estructurados JSON, incluir correlation_id (request-id) y userId cuando aplique; centralizar en ELK o Loki.
- Metrics: Prometheus export en cada servicio; alertas en Grafana (error rate, latency, queue depth).
- Tracing: OpenTelemetry + Jaeger para seguir requests distribuidas (Auth -> Invoice -> OCR -> Accounting).

CI/CD y despliegue

- Pipeline mínima: lint -> typecheck -> unit tests -> build -> integration tests -> image publish.
- Entorno: despliegue en Kubernetes (EKS/AKS/GKE) o Docker Compose para dev. Helm charts para releases.
- Release strategy: Canary/Blue-Green para endpoints críticos (Auth, Invoices).

Escalado y Sizing

- Servicios stateless: escalar horizontalmente tras CPU/RPS métricas.
- Workers: escalar según queue depth (HPA o worker autoscaler).
- Base de datos: réplica de lectura y conexión pool; particionado si volumen lo exige.

Backup y recuperacion

- Backups regulares de SQL Server (ej. `BACKUP DATABASE` a .bak o snapshots gestionados por el proveedor) y snapshots de S3/MinIO.
- Plan de restauración documentado y probado (DR drills). Para Azure SQL o instancias gestionadas, usar las herramientas del proveedor para backups y point-in-time recovery.

Recomendaciones operativas rápidas

- Publicar OpenAPI para Auth, Invoices, OCR y Catalog (v1) — permitir generación de clientes y contract tests.
- Añadir contract tests en CI (pact/contract testing) antes de integración front-back.
- Implementar feature flags para rollout de OCR automations.

Ejemplo de flujo (Upload PDF -> Create Invoice)

1. Front POST `/api/ocr/invoices` con PDF -> returns jobId
2. Worker procesa, extrae `ParsedInvoice` y guarda resultado; publica `invoice.parsed` event
3. Invoice Service escucha event, crea draft invoice con `parsed` data (o front lo hace al confirmar)
4. Front muestra datos sugeridos y permite confirmar/editar antes de POST `/api/invoices`

Checklist de entrega mínima (MVP infra)

- OpenAPI (Auth, Invoices, OCR) — yes
- Endpoints CRUD (Invoice) — yes
- Worker pipeline básico + Redis/RabbitMQ — yes
- Storage S3/MinIO para PDFs — yes
- Prometheus + Grafana + basic dashboards — yes

Siguientes pasos sugeridos

1. Generar OpenAPI 3.0 minimal para Auth, Invoices y OCR.
2. Prototipar worker local (python script) y mock OCR to validate front flow.
3. Crear helm charts / docker-compose para entorno dev reproducible.

Contacto y mantenimiento

- Mantener este documento sincronizado con `Documentacion/Servicios.md` y `Documentacion/backlog.md`.

## Tablas necesarias (resumen y ejemplos SQL)

Este proyecto requiere un modelado relacional para datos transaccionales y columnas JSON/textuales para datos semiestructurados (OCR). Usaremos SQL Server (MSSQL); las muestras abajo usan `UNIQUEIDENTIFIER` para ids y `NVARCHAR(MAX)` para JSON/raw text. Consulte las recomendaciones de conexión y ejemplos para Windows Authentication.

Resumen rápido (por servicio)

- Auth: `users`, `roles`, `user_roles`, `refresh_tokens`, `audit_auth`.
- Invoices: `invoices`, `invoice_lines`, `invoice_attachments`.
- Accounting: `journal_entries`, `journal_lines`, `accounts`.
- Catalogs: `customers`, `suppliers`, `products`, `accounts` (catálogo contable).
- OCR: `ocr_jobs`, `ocr_parsed_invoices`, `ocr_parsed_lines`.
- Notifications / Payments / Inventory: tablas específicas por dominio (notifications, payments, product_stock, inventory_movements).

Recomendaciones para SQL Server

- Motor: SQL Server (MSSQL) — usar `UNIQUEIDENTIFIER` para ids y `NEWSEQUENTIALID()` o `NEWID()` según necesidades de rendimiento.
- JSON: SQL Server maneja JSON en columnas `NVARCHAR(MAX)` y dispone de funciones `JSON_VALUE`, `OPENJSON` y `ISJSON` para consulta y extracción; no existe JSONB, pero se puede indexar valores concretos con computed columns y índices.
- Búsqueda: usar Full-Text Search (FTS) para `raw_text` OCR; usar índices `NONCLUSTERED` y `COLUMNSTORE` para cargas analíticas.
- Índices filtrados y columnas calculadas son recomendados (filtered indexes, computed columns). En SQL Server use computed columns sobre `JSON_VALUE` y cree índices no clusterizados sobre esas columnas para consultas frecuentes en JSON.

Ejemplos SQL Server (MSSQL) — tablas núcleo

-- Users

```sql
CREATE TABLE dbo.users (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  username NVARCHAR(255) NOT NULL UNIQUE,
  email NVARCHAR(320) NULL UNIQUE,
  password_hash NVARCHAR(512) NOT NULL,
  is_active BIT NOT NULL DEFAULT 1,
  created_at DATETIMEOFFSET(7) NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIMEOFFSET(7) NOT NULL DEFAULT SYSUTCDATETIME(),
  profile NVARCHAR(MAX) NULL -- JSON stored as NVARCHAR
);
CREATE INDEX IX_users_username ON dbo.users(username);
```

-- Refresh tokens (store hashed)

```sql
CREATE TABLE dbo.refresh_tokens (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  user_id UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.users(id) ON DELETE CASCADE,
  token_hash NVARCHAR(512) NOT NULL,
  revoked BIT NOT NULL DEFAULT 0,
  issued_at DATETIMEOFFSET(7) NOT NULL DEFAULT SYSUTCDATETIME(),
  expires_at DATETIMEOFFSET(7) NULL,
  ip NVARCHAR(100) NULL,
  user_agent NVARCHAR(1000) NULL
);
CREATE INDEX IX_refresh_user ON dbo.refresh_tokens(user_id);
```

-- Invoices + lines

```sql
CREATE TABLE dbo.invoices (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  type NVARCHAR(20) NOT NULL,
  invoice_number NVARCHAR(100) NULL,
  date DATE NOT NULL,
  party_id UNIQUEIDENTIFIER NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  status NVARCHAR(20) NOT NULL DEFAULT 'draft',
  sub_total DECIMAL(18,4) NULL,
  tax_total DECIMAL(18,4) NULL,
  total DECIMAL(18,4) NULL,
  created_by UNIQUEIDENTIFIER NULL,
  created_at DATETIMEOFFSET(7) NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIMEOFFSET(7) NOT NULL DEFAULT SYSUTCDATETIME(),
  metadata NVARCHAR(MAX) NULL -- JSON
);
CREATE INDEX IX_invoices_date ON dbo.invoices(date);
CREATE UNIQUE INDEX UX_invoices_number_per_party ON dbo.invoices(invoice_number, party_id) WHERE invoice_number IS NOT NULL;

CREATE TABLE dbo.invoice_lines (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  invoice_id UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.invoices(id) ON DELETE CASCADE,
  line_no INT NULL,
  product_id UNIQUEIDENTIFIER NULL,
  description NVARCHAR(MAX) NULL,
  quantity DECIMAL(18,4) NULL,
  unit_price DECIMAL(18,4) NULL,
  tax_rate DECIMAL(9,6) NULL,
  line_total DECIMAL(18,4) NULL
);
CREATE INDEX IX_invoice_lines_invoice ON dbo.invoice_lines(invoice_id);
```

-- OCR jobs + parsed (JSON stored as NVARCHAR(MAX))

```sql
CREATE TABLE dbo.ocr_jobs (
  job_id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  source_path NVARCHAR(2000) NULL,
  status NVARCHAR(20) NOT NULL DEFAULT 'pending',
  submitted_by UNIQUEIDENTIFIER NULL,
  created_at DATETIMEOFFSET(7) NOT NULL DEFAULT SYSUTCDATETIME(),
  started_at DATETIMEOFFSET(7) NULL,
  finished_at DATETIMEOFFSET(7) NULL
);
CREATE TABLE dbo.ocr_parsed_invoices (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  job_id UNIQUEIDENTIFIER NULL REFERENCES dbo.ocr_jobs(job_id) ON DELETE CASCADE,
  parsed NVARCHAR(MAX) NULL, -- JSON text
  parsed_summary NVARCHAR(MAX) NULL,
  raw_text NVARCHAR(MAX) NULL,
  confidence FLOAT NULL,
  created_at DATETIMEOFFSET(7) NOT NULL DEFAULT SYSUTCDATETIME()
);
-- Full-text index recommended on raw_text for OCR searches
-- Example (requires full-text catalog and service setup):
-- CREATE FULLTEXT CATALOG ft_ocr AS DEFAULT;
-- CREATE FULLTEXT INDEX ON dbo.ocr_parsed_invoices(raw_text) KEY INDEX PK__ocr_pars__...;
```

Notas operativas

- Almacenar blobs (PDFs) en S3/MinIO y sólo guardar la ruta en la BD. Para SQL Server alojado en Azure use Azure Blob Storage.
- Para consultar JSON en `NVARCHAR(MAX)`: use `JSON_VALUE(parsed, '$.date')` o `OPENJSON(parsed)` para desanidar. Crear columnas computadas con `JSON_VALUE` y indexarlas si se consultan frecuentemente.
- Use índices filtrados y columnstore indexes para reporting cuando corresponda.
- Evitar operaciones costosas en columnas `NVARCHAR(MAX)` sin índices; extraer campos frecuentes a columnas normales.
