# Servicios

## Microservicios Requeridos

| Microservicio                | Responsabilidades                                                            | Endpoints Clave                                            | Prioridad | Notas / Integración                                                      |
| ---------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------- | --------- | ------------------------------------------------------------------------ |
| Servicio de Usuario (Auth)   | Manejo de autenticación y autorización, gestión de usuarios y roles          | `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout` | Alta      | JWT + refresh cookie; rate limiting; OpenAPI                             |
| Invoice Service              | CRUD de facturas, cálculo de totales, estados (draft/issued/paid/cancelled)  | `/api/invoices` (+`/:id`)                                  | Alta      | Validación server-side de totales; integración con OCR service           |
| Accounting Service           | Asientos contables, conciliación, reportes (income-statement)                | `/api/accounting/entries`, `/api/accounting/reports/*`     | Alta      | Garantizar ACID en operaciones críticas                                  |
| Catalog Service              | Catálogos maestros (clientes, proveedores, productos, cuentas)               | `/api/catalogs/{customers,products,suppliers,accounts}`    | Alta      | Endpoints para autocompletar (q param)                                   |
| Invoice OCR / Parser Service | Subir PDF, extraer campos (fecha, proveedor, líneas, totales), retornar JSON | `/api/ocr/invoices` (POST), `/api/ocr/invoices/:id` (GET)  | Alta      | Procesamiento asíncrono, webhook o polling, sugerencias de autocompletar |
| Servicio de Notificaciones   | Envío de correos y push (alertas, notificaciones de proceso OCR completado)  | `/api/notifications/send`                                  | Media     | External provider (SES, SendGrid, Firebase)                              |
| Servicio de Pago             | Procesamiento de pagos y conciliación con facturas                           | `/api/payments`, `/api/payments/:id`                       | Media     | Integrar pasarelas (Stripe, PayU)                                        |
| Servicio de Inventario       | Gestión de SKUs, stock, y sincronización con facturas/ventas                 | `/api/inventory`, `/api/products`                          | Baja      | Integración opcional con ERP                                             |

## Descripción adicional: Invoice OCR / Parser Service

Propósito

Permitir que el front suba archivos PDF de facturas. El servicio extrae automáticamente datos estructurados (fecha, proveedor/cliente, líneas, importes, impuestos) y expone esos datos para que el front pueda autocompletar formularios (clientes, productos, cuentas) y crear facturas con menor intervención manual.

Requisitos funcionales

- Soportar subida de PDF (multipart/form-data) y aceptar URLs a S3/almacenamiento.
- Procesamiento asíncrono: retorno inmediato con `jobId` y estado; el cliente puede pollear `/api/ocr/invoices/:jobId` o recibir webhook cuando esté listo.
- Proveer endpoint para sugerencias/autocomplete basado en coincidencias de texto extraído (p. ej. `GET /api/ocr/suggestions?q=...&field=product`).
- Exponer JSON de origen con confidencias por campo para permitir revisión manual.

EndPoints sugeridos

- POST /api/ocr/invoices

  - Req: multipart/form-data { file: PDF }
  - Resp 202: { jobId: string, status: 'pending' }

- GET /api/ocr/invoices/:jobId

  - Resp 200 (if ready): { jobId, status: 'done', parsed: ParsedInvoice, rawText?: string }
  - Resp 202 (if pending): { jobId, status: 'pending' }

- GET /api/ocr/suggestions?field=product&q=abc&limit=10
  - Resp 200: { items: [{ id?, code?, name, matchScore }] }

Modelo de ejemplo: ParsedInvoice

```json
{
  "invoiceId": null,
  "date": "2025-09-01",
  "supplier": { "name": "ACME S.A.", "taxId": "X1234567" },
  "customer": null,
  "lines": [
    {
      "description": "Producto A",
      "quantity": 2,
      "unitPrice": 100.0,
      "taxRate": 0.19,
      "suggestedProductId": "prod_123",
      "confidence": 0.92
    },
    {
      "description": "Servicio B",
      "quantity": 1,
      "unitPrice": 200.0,
      "taxRate": 0.19,
      "confidence": 0.88
    }
  ],
  "subTotal": 400.0,
  "taxTotal": 76.0,
  "total": 476.0,
  "rawText": "Texto extraído completo...",
  "confidence": 0.9
}
```

Integración con front

- El front debe llamar `POST /api/ocr/invoices` al subir un PDF. Mostrar una pantalla de progreso y luego solicitar `GET /api/ocr/invoices/:jobId` hasta que `status: done`.
- Usar `/api/ocr/suggestions` para autocompletar campos (productos, clientes, cuentas). Las sugerencias pueden mapearse al `Catalog Service`.
- En caso de baja confianza (campo.confidence < 0.6) el front debe marcar los campos para revisión manual.

### Autocompletado de cuentas (Accounting)

Se recomienda exponer desde el Accounting Service un endpoint ligero para autocompletar cuentas contables que el front-consumer pueda consultar mientras el usuario escribe. Esto mejora la usabilidad al evitar que el usuario deba recordar códigos largos.

- Endpoint sugerido:

  - GET /api/Accounting/accounts?q=<texto>&limit=10

- Parámetros:

  - q (required): término de búsqueda (código parcial, nombre o texto libre).
  - limit (optional): número máximo de sugerencias a devolver (por defecto 10).

- Respuesta (200):

```json
{
  "items": [
    {
      "code": "62.01",
      "name": "Compras nacionales",
      "description": "Cuenta para compras locales",
      "type": "Gasto"
    },
    {
      "code": "70.10",
      "name": "Ventas internas gravadas",
      "description": "Ingresos por ventas gravadas",
      "type": "Ingreso"
    }
  ]
}
```

- Notas de uso desde el Front:

  - Hacer peticiones con debounce (ej. 200-300ms) para evitar sobrecargar el servicio.
  - Mostrar tanto el `code` como el `name` en la lista de sugerencias para desambiguar.
  - Al seleccionar una sugerencia, almacenar el `code` como `glAccount` (o el identificador que el dominio use) y opcionalmente también el `name` para mostrar.
  - Si el endpoint está protegido, reenviar el Authorization header (Bearer token) desde el cliente.
  - En desarrollo con Vite, puede configurarse un proxy (por ejemplo `/api/Accounting` -> `http://localhost:5002`) para evitar CORS y llamadas cross-origin.

- Recomendación de implementación frontal mínima:
  - Componente controlado que acepta `value`, `onChange` y `placeholder`.
  - Internamente realiza GET `/api/Accounting/accounts?q=${encodeURIComponent(term)}&limit=${limit}` y muestra resultados.
  - Permitir selección con teclado (arriba/abajo/enter) y con clic.

Con esta API el flujo de OCR → formulario de factura → selección de cuenta será más fluido y reducirá errores manuales.

### Comportamiento adicional: Enter → ventana modal de selección

Para escenarios donde el usuario prefiera una búsqueda más amplia o necesite corregir manualmente la cuenta detectada por OCR, se recomienda implementar la interacción siguiente en el componente de cuenta:

- Si el usuario presiona Enter mientras está sobre el campo de búsqueda de cuenta, abrir una ventana modal centrada con un campo de búsqueda y una lista ampliada de resultados.
- La modal debe:
  - Permitir búsqueda con debounce y devolver más resultados (por ejemplo limit=50).
  - Soportar navegación por teclado (ArrowUp / ArrowDown), Enter para seleccionar y Escape para cerrar.
  - Mostrar código y nombre (ej. "70.10 — Ventas internas gravadas") y permitir selección por clic.
  - Al seleccionar una cuenta, cerrar la modal y poblar el formulario con el `code` (y opcionalmente el `name`) para mostrar en la UI.
  - Exponer una acción de `Seleccionar` y otra `Cancelar` en el pie de la modal.

Notas UX/Accesibilidad y técnicas:

- Mostrar en el input principal la cuenta seleccionada (code + name) para evitar pérdida de contexto. Mantener un campo oculto con el `code` que envía el formulario si el backend espera solo el código.
- Si el endpoint requiere autenticación, reenviar el header Authorization; en aplicaciones con SSO usar el token en las llamadas desde la modal.
- Evitar bloquear el hilo principal: la modal debe usar peticiones asíncronas y mostrar un spinner/estado mientras carga.
- Para testing manual y en CI local con Vite, configurar proxy `/api/Accounting` → `http://localhost:5002` para evitar CORS durante el desarrollo.

Este patrón (inline-autocomplete + modal ampliada al presionar Enter) ofrece un buen balance entre rapidez (sugerencias instantáneas) y control (búsqueda exhaustiva y corrección manual), reduciendo errores al enviar asientos a Contabilidad.

### Endpoints para modificar PCGE (crear categorías / cuentas / subcuentas)

Se añadieron endpoints en el `AccountingService` para permitir agregar elementos al plan contable (PCGE) desde interfaces administrativas o procesos automatizados.

- POST `/api/Accounting/category`

  - Body JSON: { "codigo": "8", "nombre": "OTROS", "descripcion": "Texto opcional" }
  - Respuestas:
    - 201: devuelve la categoría creada (estructura `PcgeCategory`).
    - 400: si faltan campos requeridos.
    - 409: si ya existe una categoría con el mismo `codigo`.
  - Comportamiento: inserta la categoría y reordena el listado por `codigo`. Persiste de forma best-effort en `pcge.json`.

- POST `/api/Accounting/cuenta`

  - Body JSON: { "categoryCodigo": "8", "codigo": "80", "nombre": "Gastos Varios", "descripcion": "Opcional" }
  - Respuestas:
    - 201: devuelve la cuenta creada (`PcgeCuenta`).
    - 400: si faltan campos.
    - 404: si la categoría indicada no existe.
    - 409: si ya existe una cuenta con el mismo `codigo` en la categoría.
  - Comportamiento: agrega la cuenta dentro de la categoría y reordena las cuentas por `codigo`. Persiste en `pcge.json` (best-effort).

- POST `/api/Accounting/subcuenta`
  - Body JSON: { "categoryCodigo": "8", "cuentaCodigo": "80", "codigo": "801", "nombre": "Gastos Representación", "descripcion": "Opcional" }
  - Respuestas:
    - 201: devuelve la subcuenta creada (`PcgeSubcuenta`).
    - 400: si faltan campos.
    - 404: si la categoría o cuenta no existen.
    - 409: si ya existe la subcuenta con el mismo `codigo`.
  - Comportamiento: agrega la subcuenta, reordena el nivel de subcuentas y persiste en `pcge.json`.

Notas de implementación y operaciones

- Persistencia:

  - Los endpoints realizan una persistencia "best-effort" en el archivo `pcge.json` (ubicado en la raíz del repo). Si la escritura falla, el API seguirá respondiendo 201 para no romper flujos automatizados; sin embargo se registrará el fallo en logs y se recomienda revisar y reintentar.

- Ordenamiento:

  - Tras cada inserción la lista en el nivel correspondiente se reordena por `codigo`. Si deseas un ordenamiento semántico (numérico) en lugar de lexicográfico, podemos usar un comparador que extraiga los dígitos y compare numéricamente.

- Concurrencia:

  - Actualmente no hay locking distribuido; si múltiples procesos realizan cambios simultáneos existe riesgo de condiciones de carrera y de pérdida de actualizaciones. Para producción se recomienda:
    - Añadir un mecanismo de locking (por ejemplo base de datos o file lock robusto) o
    - Centralizar las mutaciones a través de la base de datos y generar `pcge.json` desde la BD cuando sea necesario.

- Validaciones adicionales recomendadas:
  - Validar formato de `codigo` (solo dígitos y puntos permitidos, por ejemplo `70.10` o `7011`).
  - No permitir solapamiento de códigos entre niveles sin política clara (ej. `70` y `701` son distintos y válidos, pero `701` dentro de otra categoría no debería coexistir sin cuidado).

Ejemplo de uso (PowerShell / curl)

PowerShell (agregar cuenta):

```powershell
Invoke-RestMethod -Method Post -Uri 'http://localhost:5002/api/Accounting/cuenta' -Body (@{
  categoryCodigo = '8'
  codigo = '80'
  nombre = 'Gastos Varios'
  descripcion = 'Gastos no recurrentes'
} | ConvertTo-Json) -ContentType 'application/json'
```

curl (agregar subcuenta):

```bash
curl -X POST http://localhost:5002/api/Accounting/subcuenta \
  -H 'Content-Type: application/json' \
  -d '{"categoryCodigo":"8","cuentaCodigo":"80","codigo":"801","nombre":"Gastos Representación","descripcion":"Representación"}'
```

Si quieres, puedo añadir endpoints adicionales: `PUT` para actualizar el nombre/descripcion, y `DELETE` para eliminar (con validación de que no existan referencias). También puedo cambiar la persistencia para que falle la operación si el guardado en disco no puede confirmarse.

PDF upload & Autocompletar en formulario de factura

- El formulario de creación/edición de factura debe exponer un botón `Subir PDF` que permita enviar el archivo al backend y autocompletar los campos:
  - Endpoints sugeridos:
    - `POST /api/invoices/upload-pdf` -> 202 { jobId }
    - `GET /api/invoices/upload-pdf/:jobId` -> 200 { status, parsed }
    - `POST /api/invoices/:id/apply-parsed` -> 200 { invoice }
  - El `ParsedInvoice` debe contener `supplier` y `customer` con `ruc` y `name`, `lines`, `subTotal`, `taxTotal`, `total` y `confidence` por campo.
  - Si el documento detectado es una boleta, incluir `document_subtype: 'BOLETA'` o `is_boleta=true` en el parsed payload.
  - El front debe mapear `supplier.ruc` / `customer.ruc` a `partyId` consultando `GET /api/catalogs/customers?q=<ruc>` o `GET /api/catalogs/suppliers?q=<ruc>` y sugerir coincidencias.

RUC y verificación externa (SUNAT)

- Servicio propuesto: `SUNAT Verification Service`

  - Responsabilidad: validar RUCs, obtener razón social y estado del contribuyente y validar emisión de documentos (cuando aplique) mediante scraping o APIs oficiales.
  - Endpoints sugeridos:
    - `POST /api/sunat/verify` (body: { ruc: string, country?: 'PE' }) → 202 { jobId }
    - `GET /api/sunat/verify/:jobId` → 200 { jobId, status: 'pending'|'done'|'error', result?: { ruc, name, status, matched_docs? } }
    - `POST /api/sunat/scrape/document` (body: { document_number, ruc, type }) → 202 { jobId }

- Integración: Invoice Service llamará o encolará requests a `SUNAT Verification Service` para validar RUC y datos del emisor/receptor antes de confirmar la factura.

Contabilidad (Debe / Haber)

- El Accounting Service debe exponer reglas y endpoints para crear asientos contables (journal entries) con líneas que indiquen `accountId`, `debit` y `credit`. Imponer la regla: suma(debit) == suma(credit).
- Al crear facturas el sistema debe proponer asientos automáticos según `type`:
  - Para `sale`: proponer líneas que acrediten ingresos (haber) y debiten cuentas por cobrar (debe).
  - Para `purchase`: proponer líneas que debiten gastos o inventario (debe) y acrediten cuentas por pagar (haber).

Consideraciones técnicas y operativas

- Procesamiento: combinar PDF parsing (pdfminer, Apache Tika) con OCR (Tesseract) según necesidad; para facturas estructuradas preferir parsing directo.
- Escalado: usar cola de trabajo (RabbitMQ, Redis Queue) y workers que procesen PDFs; almacenamiento temporal en S3 o blob storage.
- Seguridad y privacidad: cifrar archivos en reposo, retención limitada, manejar PII con cuidado.
- Costos: OCR y parsing pueden ser costosos; evaluar uso de servicios managed (Google Document AI, AWS Textract) si el volumen lo justifica.
- Telemetría: exponer métricas (jobs queued, jobs processed, error rate, avg processing time) y logs estructurados.

Nota sobre base de datos

- La plataforma usará SQL Server (MSSQL) como motor relacional. Para desarrollo local se empleará Windows Authentication hacia el servidor `DESKTOP-UDAM3NC\\SQLEXPRESS04`. Use `UNIQUEIDENTIFIER` para ids y `NVARCHAR(MAX)` para campos JSON/raw_text. Evite referencias a Postgres en implementaciones y migraciones.

## Notas Adicionales

Es importante que cada microservicio tenga documentación clara y que se mantenga actualizada. Sincronizar los contratos OpenAPI con el backlog y `Documentacion.md`.

## Prioridades

Las prioridades pueden cambiar según las necesidades del negocio. Se recomienda revisarlas mensualmente.

## Contacto

Para más información, contactar al equipo de backend.
