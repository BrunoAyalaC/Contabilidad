// Importaciones de módulos de Node.js y Electron
const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const isDev = process.env.NODE_ENV !== 'production';

require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Requerir funciones locales necesarias (asegurar que initDatabase esté definido)
const { initDatabase, loginUser, registerUser } = require('../lib/database.cjs');
const { saveSunatData } = require('../lib/database.cjs');
const axios = require('axios');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const { parseInvoiceText } = require('../lib/pdfParser.cjs');
// Cargar PCGE (catálogo de cuentas) para validar y buscar cuentas contables
// PCGE loader will run asynchronously at startup. Keep index + list + loaded flag.
let pcgeIndex = null; // Map code 
let pcgeList = null;  
let pcgeIndexLoaded = false;

async function loadPcgeIndex() {
  try {
    const pcgePath = path.resolve(__dirname, '..', 'pcge.json');
    let pcgeRaw = await fs.promises.readFile(pcgePath, 'utf8');
    // strip BOM and normalize
    pcgeRaw = pcgeRaw.replace(/^\uFEFF/, '').trim();
    let pcge;
    try {
      pcge = JSON.parse(pcgeRaw);
    } catch (errParse) {
      console.warn('pcge.json parse failed, attempting best-effort recovery:', errParse && errParse.message ? errParse.message : errParse);

      let candidate = pcgeRaw.replace(/,\s*(\]|\})/g, '$1');
      
      const firstArr = candidate.indexOf('[');
      const lastArr = candidate.lastIndexOf(']');
      if (firstArr !== -1 && lastArr !== -1 && lastArr > firstArr) {
        candidate = candidate.slice(firstArr, lastArr + 1);
      }
      try {
        pcge = JSON.parse(candidate);
        console.warn('pcge.json recovery succeeded using substring/cleanup.');
      } catch (err2) {
        console.error('pcge.json recovery failed, will abort PCGE load:', err2 && err2.message ? err2.message : err2);
        throw err2;
      }
    }
    const index = new Map();
    const list = [];
    function walk(nodes, level = 1) {
      if (!Array.isArray(nodes)) return;
      for (const n of nodes) {
        if (n && n.codigo) {
          const meta = { code: String(n.codigo), description: String(n.nombre || ''), level };
          index.set(meta.code, meta);
          list.push(meta);
        }
        if (n && n.children && n.children.length) walk(n.children, level + 1);
      }
    }
    walk(pcge);
    
    list.sort((a, b) => a.code.localeCompare(b.code));
    pcgeIndex = index;
    pcgeList = list;
    pcgeIndexLoaded = true;
    console.log(`PCGE loaded: ${pcgeList.length} accounts`);
  } catch (err) {
    pcgeIndex = null;
    pcgeList = null;
    pcgeIndexLoaded = false;
    console.warn('Failed to asynchronously load pcge.json:', err && err.message ? err.message : err);
  }
}


async function callGeminiApi(invoiceText) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    
    console.warn('GEMINI_API_KEY not set, using local parser fallback');
    const local = parseInvoiceText(invoiceText);
    return { ...local, _source: 'local-parser' };
  }

  const prompt = `
  You are an expert accounting assistant. Your task is to extract structured invoice data from the provided text.
  The text is from a Peruvian electronic invoice.
  Extract the following fields and return them as a JSON object.
  Ensure all numerical values are parsed as numbers (floats).
  If a field is not found, set its value to null.

  Expected JSON format: ... (omitted for brevity)

  Here is the invoice text:
  """
  ${invoiceText}
  """
  `;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${GEMINI_API_KEY}`;
  let attempt = 0;
  const maxAttempts = 2;

  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      const response = await axios.post(url, { contents: [{ parts: [{ text: prompt }] }] }, { headers: { 'Content-Type': 'application/json' } });
      const geminiResponseText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!geminiResponseText) throw new Error('Empty response from Gemini');
      const jsonMatch = geminiResponseText.match(/```json\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : geminiResponseText;
      const parsed = JSON.parse(jsonString);
      return { ...parsed, _source: 'gemini' };
    } catch (error) {
      const status = error?.response?.status;
      console.error('Error calling Gemini API:', error?.response?.data || error.message || error);

      // Si es un error de cuota (429) o recurso agotado, no insistir demasiado: usar fallback local
      if (status === 429 || (error?.response?.data?.error?.status === 'RESOURCE_EXHAUSTED')) {
        console.warn('Gemini quota exceeded or resource exhausted; falling back to local parser');
        try {
          const local = parseInvoiceText(invoiceText);
          return { ...local, _source: 'local-parser', _geminiError: error?.response?.data || error.message };
        } catch (localErr) {
          console.error('Local parser also failed:', localErr);
          throw new Error('Both Gemini API and local parser failed');
        }
      }

      // Para otros errores, si aún quedan intentos, backoff y reintentar
      if (attempt < maxAttempts) {
        const backoffMs = 500 * attempt;
        await new Promise(r => setTimeout(r, backoffMs));
        continue;
      }

      // Intento final: fallback local parser
      try {
        const local = parseInvoiceText(invoiceText);
        return { ...local, _source: 'local-parser', _geminiError: error?.response?.data || error.message };
      } catch (localErr) {
        console.error('Local parser also failed:', localErr);
        throw new Error('Failed to extract data using Gemini API and local parser fallback');
      }
    }
  }
}

// --- INICIO: Nuevo Motor de Sugerencias Contables ---


/**
 * Genera un asiento contable completo y preciso basado en los datos parseados de una factura.
 * @param {object} parsedData - El objeto de datos extraído de la factura por `parseInvoiceText`.
 * @param {string} ownRuc - El RUC de la propia empresa para determinar si es compra o venta.
 * @returns {object} Un objeto `asiento` con todas las cuentas y subcuentas sugeridas.
 */
function suggestJournalEntry(parsedData, ownRuc = '20100066603') { // TODO: Este RUC debe ser configurable por el usuario o cargado desde una configuración de la aplicación.
  const isSale = parsedData.emitter && parsedData.emitter.ruc === ownRuc;
  const isPurchase = parsedData.receiver && parsedData.receiver.ruc === ownRuc;
    const isContado = parsedData.paymentCondition === 'Contado';

  // Si no coincide ningún RUC propio, intentar inferir por montos y estructura
  const canInferSale = !isSale && !isPurchase && parsedData.total && parsedData.igv && parsedData.subtotal && parsedData.total === Number((parsedData.subtotal + parsedData.igv).toFixed(2));

  if (isSale || canInferSale) {
        const debitAccount = isContado
            ? { code: '1041', description: 'Cuentas corrientes operativas' }
            : { code: '1212', description: 'Emitidas en cartera' };

        return {
            type: 'sale',
            naturaleza: {
                title: `Asiento de Venta - Factura ${parsedData.invoiceId}`,
                lines: [
                    { ...debitAccount, debit: parsedData.total, credit: 0 },
                    { code: '40111', description: 'IGV - Cuenta propia', debit: 0, credit: parsedData.igv },
                    { code: '70121', description: 'Ventas - Mercaderías para terceros', debit: 0, credit: parsedData.subtotal },
                ]
            },
      destino: null,
      inferred: !isSale // marcar si fue inferido por heurística
        };
    }

    if (isPurchase) {
        const creditAccount = isContado
            ? { code: '1041', description: 'Cuentas corrientes operativas' }
            : { code: '4212', description: 'Emitidas' };

        const firstItemDesc = parsedData.items[0]?.description.toLowerCase() || '';
        let purchaseAccount = { code: '6011', description: 'Mercaderías' };
        if (firstItemDesc.includes('servicio')) {
            purchaseAccount = { code: '63', description: 'Gastos de servicios prestados por terceros' };
        }

        return {
            type: 'purchase',
            naturaleza: {
                title: `Asiento de Compra (Naturaleza) - Factura ${parsedData.invoiceId}`,
                lines: [
                    { ...purchaseAccount, debit: parsedData.subtotal, credit: 0 },
                    { code: '1673', description: 'IGV por acreditar en compras', debit: parsedData.igv, credit: 0 },
                    { ...creditAccount, debit: 0, credit: parsedData.total },
                ]
            },
            destino: {
                title: `Asiento de Compra (Destino) - Factura ${parsedData.invoiceId}`,
                lines: [
                    purchaseAccount.code.startsWith('60')
                        ? { code: '20111', description: 'Mercaderías - Costo', debit: parsedData.subtotal, credit: 0 }
                        : { code: '941', description: 'Gastos de Administración', debit: parsedData.subtotal, credit: 0 },
                    purchaseAccount.code.startsWith('60')
                        ? { code: '6111', description: 'Variación de existencias - Mercaderías', debit: 0, credit: parsedData.subtotal }
                        : { code: '791', description: 'Cargas imputables a cuentas de costos y gastos', debit: 0, credit: parsedData.subtotal }
                ]
            }
        };
    }

    return null;
}

// --- FIN: Nuevo Motor de Sugerencias Contables ---


let mainWindow;

// Función para crear la ventana principal de la aplicación
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(process.cwd(), 'electron', 'preload.js'),
      contextIsolation: true, // Es una buena práctica de seguridad
      nodeIntegration: false, // Deshabilitado por seguridad
    },
  });

  // Carga la URL de desarrollo o el archivo de producción
  if (isDev) {
    const url = 'http://localhost:5173';
    mainWindow.loadURL(url);
    mainWindow.webContents.openDevTools({ mode: 'detach' }); // Abrir herramientas de desarrollo automáticamente
  } else {
    const indexHtml = `file://${path.join(process.cwd(), 'dist', 'index.html')}`;
    mainWindow.loadURL(indexHtml);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Evento: la aplicación está lista
app.whenReady().then(() => {
  initDatabase(); // Inicializa la base de datos
  createWindow(); // Crea la ventana de la aplicación
  // Cargar PCGE en background para acelerar búsquedas posteriores
  loadPcgeIndex().catch(err => {
    console.warn('Background PCGE load failed:', err && err.message ? err.message : err);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Evento: todas las ventanas se han cerrado
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit(); // Salir de la app en Windows y Linux
});

// --- MANEJADORES DE COMUNICACIÓN ENTRE PROCESOS (IPC) ---

// Manejador para el login de usuario
ipcMain.handle('db:login', async (event, { username, password }) => {
  try {
    const user = await loginUser(username, password);
    return { success: true, user };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
});

// Manejador para el registro de usuario
ipcMain.handle('db:register', async (event, { username, password }) => {
  try {
    const result = await registerUser(username, password);
    return { success: true, ...result };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
});

// IPC: leer y guardar configuración de la app en userData/config.json
ipcMain.handle('app:get-config', async () => {
  try {
    const cfgPath = path.join(app.getPath('userData'), 'config.json');
    const exists = await fs.promises.stat(cfgPath).then(s => s.isFile()).catch(() => false);
    if (!exists) return { success: true, config: {} };
    const raw = await fs.promises.readFile(cfgPath, 'utf8');
    const parsed = JSON.parse(raw);
    return { success: true, config: parsed };
  } catch (e) {
    console.error('Failed to read app config', e);
    return { success: false, message: String(e) };
  }
});

ipcMain.handle('app:set-config', async (event, { config }) => {
  try {
    const cfgPath = path.join(app.getPath('userData'), 'config.json');
    await fs.promises.mkdir(path.dirname(cfgPath), { recursive: true });
    await fs.promises.writeFile(cfgPath, JSON.stringify(config, null, 2), 'utf8');
    return { success: true };
  } catch (e) {
    console.error('Failed to write app config', e);
    return { success: false, message: String(e) };
  }
});

// Utility: extraer texto de PDF de forma asíncrona usando pdfjs
async function extractPdfToText(pdfPath, outDir) {
  // validaciones
  if (!pdfPath) throw new Error('Ruta de PDF vacía');
  const stat = await fs.promises.stat(pdfPath).catch(() => null);
  if (!stat || !stat.isFile()) throw new Error('PDF no encontrado: ' + pdfPath);

  await fs.promises.mkdir(outDir, { recursive: true });
  const data = new Uint8Array(await fs.promises.readFile(pdfPath));
  // Configure standardFontDataUrl if we bundle standard fonts to avoid warnings
  const fontsDir = path.resolve(__dirname, '..', 'assets', 'fonts');
  let loadingTask;
  if (await fs.promises.stat(fontsDir).then(s => s.isDirectory()).catch(() => false)) {
    const standardFontDataUrl = `file://${fontsDir}/`;
    console.log('Using standardFontDataUrl for pdfjs:', standardFontDataUrl);
    loadingTask = pdfjsLib.getDocument({ data, disableFontFace: false, standardFontDataUrl });
  } else {
    // Evitar que pdfjs intente descargar fuentes estándar (evita warnings en Electron)
    loadingTask = pdfjsLib.getDocument({ data, disableFontFace: true });
  }
  const doc = await loadingTask.promise;

  let fullText = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str || '');
    fullText += strings.join(' ') + '\n\n';
    // Enviar progreso por página si el handler proporcionó un sender al contexto
    try {
      if (typeof extractPdfToText._progressSender === 'function') {
        const percent = Math.round((i / doc.numPages) * 80); // extracción ocupa hasta 80%
        extractPdfToText._progressSender({ step: 'extracting_pages', percent, message: `Procesando página ${i} de ${doc.numPages}` });
      }
    } catch (err) {
      // noop
    }
  }

  const baseName = path.basename(pdfPath, path.extname(pdfPath));
  const txtPath = path.join(outDir, baseName + '.txt');
  const jsonPath = path.join(outDir, baseName + '.json');

  await fs.promises.writeFile(txtPath, fullText, 'utf8');
  
  // --- INICIO: Lógica de Parseo y Sugerencia Mejorada ---
  
  // 1. Usar el parser avanzado para obtener un JSON estructurado y fiel.
  const parsedInvoice = await callGeminiApi(fullText);
  console.log('Parsed Invoice (from pdfParser):', JSON.stringify(parsedInvoice, null, 2));
  
  // 2. Usar el motor de sugerencias para generar el asiento contable.
  const suggestedAsiento = suggestJournalEntry(parsedInvoice);
  console.log('Suggested Asiento (from suggestJournalEntry):', JSON.stringify(suggestedAsiento, null, 2));

  // 3. Combinar todo en un solo objeto para el frontend.
  const parsedData = {
      ...parsedInvoice,
      asiento: suggestedAsiento, // Adjuntamos el asiento completo
  };
  console.log('Final parsedData sent to frontend:', JSON.stringify(parsedData, null, 2));

  await fs.promises.writeFile(jsonPath, JSON.stringify(parsedData, null, 2), 'utf8');

  // --- FIN: Lógica de Parseo y Sugerencia Mejorada ---

  return { txtPath, jsonPath, fullText, parsed: parsedData }; // Devolvemos el nuevo objeto `parsed`
}

// IPC handler para que el renderer solicite importar un PDF
ipcMain.handle('read-pdf-data', async (event) => {
  try {
    const win = BrowserWindow.getFocusedWindow();
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Seleccionar archivo PDF',
      properties: ['openFile'],
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    });

    if (canceled || !filePaths || filePaths.length === 0) {
      return { success: false, message: 'No file selected' };
    }

    const pdfPath = filePaths[0];

    // Directorio de salida dentro de userData
    const outDir = path.join(app.getPath('userData'), 'attachments', 'extracted');
    const attachmentsDir = path.join(app.getPath('userData'), 'attachments');
    await fs.promises.mkdir(attachmentsDir, { recursive: true });

    // Copiar PDF a attachments para gestión interna
    const destPdf = path.join(attachmentsDir, path.basename(pdfPath));
    await fs.promises.copyFile(pdfPath, destPdf);

    // Registrar un sender de progreso para que extractPdfToText lo invoque
    extractPdfToText._progressSender = (payload) => {
      try { event.sender.send('read-pdf-progress', payload); } catch (e) { /* noop */ } 
    };

  // Extraer texto y parsed
  const { txtPath, jsonPath, fullText, parsed } = await extractPdfToText(destPdf, outDir);

  // Informar 100% completado
  try { event.sender.send('read-pdf-progress', { step: 'done', percent: 100, message: 'Completado' }); } catch (e) {}

  // Limpiar sender
  extractPdfToText._progressSender = null;

  return { success: true, text: fullText, txtPath, jsonPath, attachmentPath: destPdf, parsedData: parsed };
  } catch (err) {
  console.error('read-pdf-data failed', err && err.stack ? err.stack : err);
  return { success: false, message: err && err.message ? err.message : String(err) };
  }
});

// IPC handler para exponer cuentas del PCGE al renderer
ipcMain.handle('pcge:getAccounts', async (event, { query, limit = 50, offset = 0 } = {}) => {
  try {
    if (!pcgeList) return { success: true, loaded: pcgeIndexLoaded, total: 0, accounts: [] };
    const q = String(query || '').trim().toLowerCase();
    let filtered = pcgeList;
    if (q) {
      filtered = pcgeList.filter(m => m.code.toLowerCase().includes(q) || m.description.toLowerCase().includes(q));
    }
    const total = filtered.length;
    const slice = filtered.slice(offset, offset + limit);
    return { success: true, loaded: pcgeIndexLoaded, total, accounts: slice };
  } catch (err) {
    return { success: false, loaded: pcgeIndexLoaded, total: 0, accounts: [] };
  }
});

// IPC handler para exportar datos a CSV
ipcMain.handle('export-to-csv', async (event, invoiceData) => {
  try {
    const win = BrowserWindow.getFocusedWindow();
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'Exportar a CSV',
      defaultPath: `factura-${invoiceData.invoiceId}.csv`,
      filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    });

    if (canceled || !filePath) {
      return { success: false, message: 'Exportación cancelada' };
    }

    // Convertir el asiento a formato CSV 
    const header = 'cuenta,descripcion,debe,haber,documento,ruc,fecha\n';
    const lines = invoiceData.asiento.naturaleza.lines.map(line => {
        const doc = `${invoiceData.invoiceId}`;
        const ruc = invoiceData.emitter.ruc === '20100066603' ? invoiceData.receiver.ruc : invoiceData.emitter.ruc;
        return `${line.code},"${line.description}",${line.debit},${line.credit},${doc},${ruc},${invoiceData.date}`;
    }).join('\n');

    const csvContent = header + lines;

    await fs.promises.writeFile(filePath, csvContent, 'utf8');

    return { success: true, path: filePath };
  } catch (err) {
    console.error('export-to-csv failed', err && err.stack ? err.stack : err);
    return { success: false, message: err && err.message ? err.message : String(err) };
  }
});

// IPC para agregar factura a la DB
ipcMain.handle('invoices:add', async (event, invoice) => {
  try {
    const res = await require('../lib/database.cjs').addInvoice(invoice);
    return { success: true, result: res };
  } catch (e) {
    console.error('Failed adding invoice', e);
    return { success: false, message: String(e) };
  }
});

// IPC para agregar compra
ipcMain.handle('purchases:add', async (event, purchase) => {
  try {
    const res = await require('../lib/database.cjs').addPurchase(purchase);
    return { success: true, result: res };
  } catch (e) {
    console.error('Failed adding purchase', e);
    return { success: false, message: String(e) };
  }
});

// IPC handler para consultar RUC (utiliza scripts dentro de ConsultaSunat)
ipcMain.handle('sunat:consulta-ruc', async (event, { ruc }) => {
  try {
    if (!ruc || typeof ruc !== 'string') return { success: false, message: 'RUC inválido' };
    // Intentar usar el script playwright si existe
    const consultaPath = path.resolve(__dirname, '..', 'ConsultaSunat', 'consulta-ruc-extended-v2.js');
    if (fs.existsSync(consultaPath)) {
      // Requerir el módulo dentro de try/catch porque puede fallar si faltan dependencias (playwright)
      let consultaModule = null;
      try {
        consultaModule = require(consultaPath);
      } catch (errRequire) {
        console.warn('Failed to require ConsultaSunat script:', errRequire && errRequire.message ? errRequire.message : errRequire);
        // Si falta playwright u otra dependencia, devolver un mensaje claro y no hacer crash
        if (errRequire && errRequire.code === 'MODULE_NOT_FOUND') {
          const missing = errRequire.message || 'módulo requerido no encontrado';
          return { success: false, message: `Dependencia faltante al cargar motor de consulta: ${missing}. Instale las dependencias en la carpeta ConsultaSunat (cd ConsultaSunat && npm install) o instale 'playwright' en el proyecto.` };
        }
        return { success: false, message: 'Error al cargar el motor de consulta: ' + (errRequire && errRequire.message ? errRequire.message : String(errRequire)) };
      }

      const { consultaRucExtendedV2 } = consultaModule || {};
      if (typeof consultaRucExtendedV2 !== 'function') {
        return { success: false, message: 'El motor de consulta no exporta la función esperada (consultaRucExtendedV2).' };
      }

      try {
        const result = await consultaRucExtendedV2(ruc);

        // Si el scraper devuelve parsedFields, preferirlo (ya está normalizado)
        let mapped = null;
        if (result && result.parsedFields) {
          mapped = { ruc, ...result.parsedFields };
        } else {
          // Caída a heurística local antigua
          mapped = mapSunatResultToFields(result, ruc);
        }

        return { success: true, source: 'playwright', result: { raw: result, mapped } };
      } catch (err) {
        console.warn('Consulta RUC with playwright failed:', err && err.message ? err.message : err);
        return { success: false, message: err && err.message ? err.message : String(err) };
      }
    }

    // Si no hay script disponible, retornar error
    return { success: false, message: 'No hay motor de consulta disponible' };
  } catch (err) {
    console.error('sunat:consulta-ruc failed', err && err.stack ? err.stack : err);
    return { success: false, message: err && err.message ? err.message : String(err) };
  }
});

// IPC handler para obtener fila de sunat_ruc por RUC (consulta local)
const { getSunatByRuc } = require('../lib/database.cjs');
ipcMain.handle('sunat:get-by-ruc', async (event, { ruc }) => {
  try {
    if (!ruc) return { success: false, message: 'RUC inválido' };
    const row = await getSunatByRuc(ruc);
    if (!row) return { success: true, found: false, row: null };
    return { success: true, found: true, row };
  } catch (err) {
    console.error('sunat:get-by-ruc failed', err && err.stack ? err.stack : err);
    return { success: false, message: err && err.message ? err.message : String(err) };
  }
});

// Clients CRUD
const { getAllClients, getClientByRuc, addClient, removeClient } = require('../lib/database.cjs');
ipcMain.handle('clients:get-all', async () => {
  try {
    const rows = await getAllClients();
    return { success: true, clients: rows };
  } catch (err) { return { success: false, message: err && err.message ? err.message : String(err) }; }
});
ipcMain.handle('clients:get-by-ruc', async (event, { ruc }) => {
  try {
    const row = await getClientByRuc(ruc);
    return { success: true, found: !!row, client: row };
  } catch (err) { return { success: false, message: err && err.message ? err.message : String(err) }; }
});
ipcMain.handle('clients:add', async (event, client) => {
  try {
    const res = await addClient(client);
    return { success: true, res };
  } catch (err) { return { success: false, message: err && err.message ? err.message : String(err) }; }
});
ipcMain.handle('clients:remove', async (event, { rucOrId }) => {
  try {
    const res = await removeClient(rucOrId);
    return { success: true, res };
  } catch (err) { return { success: false, message: err && err.message ? err.message : String(err) }; }
});