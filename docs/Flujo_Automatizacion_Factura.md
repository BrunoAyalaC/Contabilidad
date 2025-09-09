# Flujo contable y automatización al subir una factura (.pdf)

Resumen corto

Este documento describe, paso a paso, cómo registrar contablemente una factura (emisión o recepción) siguiendo el PCGE, cómo preparar el asiento para importarlo a Concar, y cómo automatizar el proceso al subir un PDF. Incluye plantillas listas para generar el CSV de importación hacia Concar, ejemplo práctico con cifras y una checklist de controles.

Alcance

- Facturas de venta (emisor) y facturas de compra (receptor).
- IGV estándar (18%) y operaciones sin IGV.
- Generación automática de asiento diario y archivo CSV para importación masiva en Concar.
- Almacenamiento referenciado del PDF y trazabilidad documental.

Supuestos razonables (confirmar con tu PCGE/empresa)

- El plan de cuentas sigue el PCGE; usaré códigos de cuenta generales (ej.: `12`, `40`, `42`, `60`, `70`) y subcuentas sugeridas. Ajusta los códigos a tu parametrización en Concar.
- En ventas: `12` = Cuentas por cobrar; `70` = Ventas; `40.01` = IGV por pagar (subcuenta bajo Tributos).
- En compras: `60` = Compras; `40.02` = IGV por recuperar (si no existe, crear subcuenta bajo `40` o usar la cuenta que tu PCGE define para IGV acreditable); `42` = Cuentas por pagar.

Requeriré si faltan (solo si no lo confirmas): periodo contable (mes/año), moneda, serie y número del comprobante, centro de costo si aplica.

Checklist de lo que se automatizará

- [ ] Recepción del PDF (upload manual / watch folder / API)
- [ ] OCR y extracción de campos clave (RUC, razón social, fecha, tipo comprobante, serie-número, base imponible, IGV, total, items, moneda)
- [ ] Validación de RUC y CPE (opcional: consulta SUNAT o comprobante XML)
- [ ] Clasificación contable automática mediante reglas de mapeo
- [ ] Generación de asiento (JSON + CSV para Concar) y almacenamiento del PDF con referencia al asiento
- [ ] Importación en Concar y validaciones post-importación (saldos, cuadre)

1. Contrato de datos (campos de entrada / salida)

- Entrada (desde PDF/OCR):
  - tipo_comprobante (Factura, Boleta, Nota de crédito, etc.)
  - serie
  - numero
  - fecha_emision (YYYY-MM-DD)
  - ruc_proveedor/cliente
  - razon_social
  - moneda
  - base_imponible
  - igv
  - total
  - items: [{descripcion, cantidad, precio_unitario, cuenta_sugerida?}]
- Salida (para Concar):
  - fecha
  - libro (Libro Diario)
  - documento_tipo (FACTURA, BOLETA)
  - serie
  - numero
  - cuenta_contable (código completo)
  - descripcion_glosa
  - debe
  - haber
  - centro_costo (opcional)
  - referencia_pdf (ruta/uuid)

2. Reglas de mapeo (ejemplos)

- Comprobante de venta (Factura):

  - CxC (Débito): `12.01 - Ctas x Cobrar - Facturas` (importe total)
  - Ventas (Crédito): `70 - Ventas` (base imponible)
  - IGV por pagar (Crédito): `40.01 - IGV por Pagar` (igv)
  - Glosa: "Venta x [RUC cliente] [Razón social] F[serie]-[numero]"

- Comprobante de compra (Factura recibida):
  - Compras / Gasto (Débito): `60 - Compras` o la cuenta de gasto según item (base imponible)
  - IGV por recuperar (Débito): `40.02 - IGV por Recuperar` (igv) _o la cuenta del PCGE que uses para IGV acreditable_
  - CxP (Crédito): `42 - Ctas x Pagar Comerciales` (importe total)
  - Glosa: "Compra x [RUC proveedor] [Razón social] F[serie]-[numero]"

Observación: si la factura contiene retenciones u otros tributos, añadir líneas adicionales (por ejemplo retención a cuenta de SUNAT: `41.XX`, o la cuenta que en tu PCGE uses para retenciones). Para operaciones en moneda extranjera, incluir columna de tipo de cambio y asientos de diferencia si procede.

3. Ejemplo práctico (Factura de venta)

Datos extraídos del PDF

- Fecha: 2025-09-07
- Tipo: FACTURA
- Serie-Num: F001-00012345
- RUC Cliente: 20123456789
- Razon social: COMERCIAL ABC S.A.
- Moneda: PEN
- Base imponible: 1,000.00
- IGV (18%): 180.00
- Total: 1,180.00

Asiento propuesto (lista ordenada para Concar)

- Fecha: 2025-09-07
- Documento: FACTURA F001-00012345

1. 12.01 - CUENTAS POR COBRAR COMERCIALES (COMPRADORES) - Débito 1,180.00 - Documento: F001-00012345 - Ref: RUC 20123456789
2. 70 - VENTAS - Crédito 1,000.00 - Documento: F001-00012345 - Ref: RUC 20123456789
3. 40.01 - IGV POR PAGAR - Crédito 180.00 - Documento: F001-00012345 - Ref: RUC 20123456789

Formato listo para importación (CSV) — columnas sugeridas

- date,book,doc_type,serie,number,account,account_desc,description,debe,haber,currency,exchange_rate,cost_center,ref,attachment

Ejemplo fila (3 filas separadas por asiento):

"2025-09-07","LD","FACT","F001","00012345","12.01","CUENTAS POR COBRAR","Venta F001-00012345 - COMERCIAL ABC S.A.",1180.00,0.00,"PEN",1.00,,"RUC:20123456789","/path/to/storage/F001-00012345.pdf"
"2025-09-07","LD","FACT","F001","00012345","70","VENTAS","Venta F001-00012345 - COMERCIAL ABC S.A.",0.00,1000.00,"PEN",1.00,,"RUC:20123456789","/path/to/storage/F001-00012345.pdf"
"2025-09-07","LD","FACT","F001","00012345","40.01","IGV POR PAGAR","Venta F001-00012345 - COMERCIAL ABC S.A.",0.00,180.00,"PEN",1.00,,"RUC:20123456789","/path/to/storage/F001-00012345.pdf"

Notas sobre el CSV:

- Ajusta `book` al libro usado en Concar (Libro Diario/Libro Simplificado según política de la empresa).
- `account` debe coincidir exactamente con el código en tu plan de cuentas de Concar.
- `attachment` es ruta al PDF que será referenciado; Concar permite adjuntar documentos o al menos guardar referencia.

4. Ejemplo práctico (Factura de compra)

Datos ejemplo

- Fecha: 2025-09-07
- Tipo: FACTURA
- Serie-Num: F001-00054321
- RUC Proveedor: 20456789012
- Razon social: SUMINISTROS XYZ S.A.
- Moneda: PEN
- Base imponible: 2,000.00
- IGV (18%): 360.00
- Total: 2,360.00

Asiento propuesto

1. 60 - COMPRAS (o cuenta de gasto según items) - Débito 2,000.00 - Doc: F001-00054321 - Ref: RUC 20456789012
2. 40.02 - IGV POR RECUPERAR - Débito 360.00 - Doc: F001-00054321 - Ref: RUC 20456789012
3. 42 - CUENTAS POR PAGAR COMERCIALES - Crédito 2,360.00 - Doc: F001-00054321 - Ref: RUC 20456789012

4. Procedimiento para aplicar en Concar (pasos generales)

- Preparar CSV con el formato que tu versión de Concar acepte para importación de asientos.
- Menú (varía según versión): Contabilidad -> Asientos -> Importación / Herramientas -> Importar asientos
- Seleccionar libro (libro diario), periodo y archivo CSV. Mapear columnas si Concar lo solicita.
- Ejecutar validación: verificar que el asiento cuadre (SUM DEBE = SUM HABER), validaciones de número de cuenta, centro de costo y moneda.
- Importar y revisar en pantalla "Consulta de Asientos" o "Libro Diario".
- Adjuntar PDF al asiento (si Concar soporta adjuntos) o en el módulo documental del ERP.

Nota: Los nombres exactos de pantallas en Concar pueden variar según versión; si me confirmas la versión, puedo dar la ruta exacta.

6. Validaciones automáticas a ejecutar antes de importar

- Suma debe = suma haber (cuadre)
- Existencia de cuentas en el plan (account codes válidos)
- Periodo abierto en Concar
- Formato de fecha válido
- Verificación del RUC (longitud y dígito verificador) — opcional: validar contra SUNAT
- Verificar que la factura electrónica exista en SUNAT (opcional pero recomendable)
- Control de retenciones y percepciones cuando apliquen

7. Checklist de control y documentación (para escanear/subir)

- PDF original de la factura (o XML/CPE cuando aplique)
- Comprobante de pago (si hay)
- Contrato o PO si corresponde
- Orden de compra
- Notas de crédito/debito relacionadas
- Registro de recepción (quien validó recepción)
- Centro de costo / proyecto asociado (si aplica)

8. Cómo automatizar técnicamente (arquitectura sugerida)

Componentes:

- Watcher / API de Upload: escucha una carpeta (`/incoming`) o recibe el PDF vía API.
- Extractor OCR: Tesseract (open-source) o servicio OCR (Google Vision, AWS Textract) para extraer texto y/o procesar el XML si viene con CPE.
- Parser de comprobantes: extrae campos claves (RUC, serie, número, montos, fecha, items). Para facturas electrónicas, preferir leer el XML del CPE cuando esté disponible.
- Motor de reglas: mapea ítems a cuentas y centros de costo según descripciones y reglas (keywords, proveedor, categoría de gasto).
- Generador de asientos: crea JSON y CSV para Concar; guarda referencia al PDF (almacenamiento S3 o carpeta local con UUID).
- Validador: ejecuta las validaciones del punto 6.
- Importador/Operador: realiza la importación (manual o por API). Algunos Concar permiten importar CSV; si no, usar la funcionalidad de ingreso masivo o API si existe.

Flujo técnico simplificado

1. Subida PDF a `/incoming`.
2. OCR/Parser extrae datos.
3. Motor de reglas decide cuentas y centro de costo.
4. Generador produce CSV para Concar y guarda PDF en `/storage/YYYY/MM/` con nombre `F001-00054321.pdf` y referencia UUID.
5. Notificación a contabilidad para revisión o importación automática si pasa validaciones.
6. Importación en Concar; almacenar respuesta (id_asiento) y enlazarlo con PDF en repositorio documental.

9) Plantilla de mapeo (JSON) — ejemplo mínimo

{
"proveedores": {
"20456789012": { "cuenta": "42", "centro_costo": "" }
},
"categorias": [
{ "keywords": ["papel", "insumo"], "cuenta": "60.10", "centro_costo": "GASTO_OFI" },
{ "keywords": ["servicio", "consultoría"], "cuenta": "62", "centro_costo": "SERVICIOS" }
],
"default": { "compra": { "base": "60", "igv": "40.02", "cxp": "42" }, "venta": { "cxp": "12", "venta": "70", "igv": "40.01" } }
}

10. Ejemplo de script (esqueleto) — Node.js (outline)

- watchFolder.js (outline)
  - escucha carpeta `/incoming`
  - llama a `ocrAndParse(filePath)`
  - llama a `mapAndGenerateJournal(parsedData)`
  - guarda CSV y PDF en `/outgoing` y envía notificación

Notas finales y recomendaciones

- Parchear y confirmar los códigos exactos del PCGE con el área administrativa o contable antes de la importación masiva.
- Mantener un ambiente de pruebas (con copia de Concar) para validar importaciones antes de producción.
- Registrar logs extensos durante el proceso automatizado y conservar PDF original para auditoría.
- Implementar controles de acceso y cifrado para el almacenamiento de comprobantes.

Si quieres, genero:

- el `CSV` de ejemplo real con las filas que dimos (fácilmente generable),
- un `node` script minimal que procese un PDF de ejemplo (sin OCR) y genere el CSV, o
- la plantilla `mapping.json` adaptada a tu plan de cuentas real si me confirmas los códigos exactos para IGV e Inventarios.

---

Archivo creado en el repo: `docs/Flujo_Automatizacion_Factura.md`.

Preguntas abiertas (si falta información)

- ¿Deseas que el proceso sea totalmente automático o con revisión humana previa a la importación?
- ¿Cuál es la cuenta precisa en tu PCGE para IGV acreditable (si existe) y para IGV por pagar?
- ¿Tu Concar admite importación CSV directa de asientos? ¿Cuál es la versión o módulo exacto?

Si confirmas, puedo generar la `mapping.json` y un `script` Node.js mínimo que convierta un JSON extraído del PDF en el CSV listo para Concar.

---

## Cambios recientes implementados (Integración Electron)

He avanzado en la integración para que la extracción y el parseo del PDF se ejecuten de forma asíncrona y segura dentro del contexto de Electron. Resumen técnico de lo que ya está en el repositorio:

- Nuevo IPC invocable desde el renderer: `read-pdf-data`.

  - Uso: `await window.electronAPI.readPdfData()` (expuesto por `preload.js`).
  - Comportamiento: abre un diálogo para seleccionar PDF, copia el PDF a la carpeta de `userData/attachments`, extrae texto usando `pdfjs-dist`, escribe archivos `.txt` y `.json` en `userData/attachments/extracted`, aplica una heurística ligera de parseo para extraer RUC, fecha, invoiceId, items y totales, y devuelve un objeto enriquecido.

- Evento de progreso: el main emite eventos IPC `read-pdf-progress` durante la operación para reportar pasos y porcentaje (ej.: extracción de páginas, parseo, finalizado). Esto permite mostrar una barra/círculo de progreso moderno en la UI.

- Salida devuelta por `read-pdf-data` (ejemplo):

```json
{
  "success": true,
  "text": "...texto extraído...",
  "txtPath": "C:/.../userData/attachments/extracted/archivo.txt",
  "jsonPath": "C:/.../userData/attachments/extracted/archivo.json",
  "attachmentPath": "C:/.../userData/attachments/archivo.pdf",
  "parsedData": {
    "invoiceId": "F001-000123",
    "date": "07/09/2025",
    "emitter": { "ruc": "20123456789", "name": "" },
    "items": [
      {
        "description": "...",
        "quantity": 1,
        "unitPrice": 100,
        "total": 100,
        "suggestedAccount": { "code": "601", "description": "Mercaderías" }
      }
    ],
    "totals": { "total": 1180 },
    "asiento": {
      "debitPurchase": { "code": "601" },
      "debitIgv": { "code": "40111" },
      "credit": { "code": "4212" }
    }
  }
}
```

- Archivos generados: además del `attachment` (copia del PDF), se generan `archivo.txt` y `archivo.json` con el `rawText` para asegurar trazabilidad y facilitar re-procesos.

- Mitigación de warnings de fuentes en `pdfjs-dist`: el main configura `pdfjsLib.GlobalWorkerOptions.standardFontDataUrl` apuntando a la carpeta `node_modules/pdfjs-dist/legacy/build/standard_fonts` cuando existe, y se usa `disableFontFace: true` al crear el `loadingTask` para reducir los warnings observados en Electron.

- Heurística de parseo: actualmente es ligera y basada en expresiones regulares para detectar RUC (11 dígitos), invoiceId, fecha y totales; también sugiere cuentas en base a keywords mapeadas a códigos del PCGE (ej.: mercaderías → `601`, servicios → `602`, IGV → `40111`).

### Limitaciones actuales

- La heurística es inicial y requiere afinamiento para edge-cases (facturas escaneadas, formatos internacionales, tablas complejas). Para PDFs escaneados se debe añadir un fallback a OCR (Tesseract u OCR Cloud).
- No se ha persistido aún el resultado en la tabla `invoices` de SQLite; hoy los artefacts quedan en `userData/attachments` y se devuelve `parsedData` al renderer. La persistencia y check de duplicados son próximos pasos.

### Recomendaciones siguientes (priorizadas)

1. Implementar persistencia en SQLite (`invoices` table) al completar `read-pdf-data`, con esquema y migración.
2. Añadir fallback OCR para PDFs sin texto (integrarlo como worker/thread con timeout y reporte de progreso).
3. Afinar el motor de reglas (mapping.json) para asignar cuentas y subcuentas más precisas por proveedor, categoría y descripción de item.
4. Añadir pruebas (unitarias/integración) con PDFs de muestra (digitales y escaneados).

Si quieres, genero la migración SQL y un ejemplo de inserción en `invoices` para integrarlo en el main.
