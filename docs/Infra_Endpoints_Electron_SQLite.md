# Infraestructura: Endpoints IPC y SQLite (Electron)

Este documento describe los endpoints IPC implementados en el proceso main de Electron, la estructura de almacenamiento local (`userData`), y el esquema sugerido para la base de datos SQLite que usará la aplicación.

## IPC implementados

- `read-pdf-data` (invoke)
  - Descripción: abre diálogo de selección de archivo, copia el PDF a `userData/attachments`, extrae texto usando `pdfjs-dist`, guarda `.txt` y `.json` con el `rawText` y devuelve un objeto enriquecido (`parsedData`).
  - Uso (renderer): `const result = await window.electronAPI.readPdfData()` (expuesto por `preload.js`).
  - Respuesta esperada (ejemplo):

```json
{
  "success": true,
  "text": "...",
  "txtPath": "...",
  "jsonPath": "...",
  "attachmentPath": "...",
  "parsedData": {
    /* parsed invoice */
  }
}
```

- `read-pdf-progress` (event)
  - Descripción: eventos enviados desde el main al renderer mientras `read-pdf-data` ejecuta su pipeline (extracción de páginas, parseo, escritura de archivos, finalizado).
  - Payload: `{ step: string, percent?: number, message?: string }`.
  - Suscripción: `ipcRenderer.on('read-pdf-progress', handler)` mediante el `preload` (se expone helper en `window.electronAPI`).

## Estructura de almacenamiento local

- Base path: `app.getPath('userData')`
- Attachments dir: `${userData}/attachments/` (aquí se copian los PDFs seleccionados)
- Extracted outputs: `${userData}/attachments/extracted/` (txt/json generados por `pdfjs`)

Ejemplo de paths:

```
C:\Users\<user>\AppData\Roaming\contablesys\attachments\F001-000123.pdf
C:\Users\<user>\AppData\Roaming\contablesys\attachments\extracted\F001-000123.txt
C:\Users\<user>\AppData\Roaming\contablesys\attachments\extracted\F001-000123.json
```

## Esquema sugerido para SQLite

Tabla: `invoices`

Columns (SQL):

```sql
CREATE TABLE invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  ruc TEXT,
  supplier_name TEXT,
  serie TEXT,
  number TEXT,
  invoice_id TEXT, -- serie-number combinada
  date TEXT,
  currency TEXT,
  base_amount REAL,
  igv REAL,
  total REAL,
  attachment_path TEXT,
  txt_path TEXT,
  json_path TEXT,
  parsed_json TEXT, -- JSON string
  status TEXT, -- pending | parsed | validated | imported | error
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

Índices recomendados:

```sql
CREATE INDEX idx_invoices_invoice_id ON invoices(invoice_id);
CREATE INDEX idx_invoices_ruc ON invoices(ruc);
```

## Flujo recomendado de persistencia

1. Al completar `read-pdf-data`, insertar un registro `invoices` con `status = 'parsed'` y `parsed_json` lleno con la estructura devuelta.
2. Ejecutar validaciones y reglas de mapeo para generar el asiento contable; actualizar `status = 'validated'` o `status = 'error'` según corresponda.
3. Generar CSV para Concar y marcar `status = 'imported'` con referencia al `id_asiento` si aplica.

## Seguridad y consideraciones

- No ejecutar procesamiento en el renderer. Mantener IO y parseo en main o worker.
- Validar mime type y tamaño del archivo antes de procesar.
- Política de retención de `rawText` por privacidad: opcionalmente cifrar o truncar después de X días.

## Notas sobre pdfjs y fuentes

- Para evitar warnings en Electron al usar `pdfjs-dist`, el main intenta configurar `pdfjsLib.GlobalWorkerOptions.standardFontDataUrl` apuntando a `node_modules/pdfjs-dist/legacy/build/standard_fonts` si está presente. Además se pasa `disableFontFace: true` al crear el `loadingTask` para evitar intentos de descarga de fuentes en tiempo de ejecución.

---

Archivo generado por: integración Electron — `read-pdf-data` y `read-pdf-progress`.
