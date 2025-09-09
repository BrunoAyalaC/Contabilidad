const { chromium } = require('playwright');

async function consultaRucPlaywright(ruc) {
  if (!/^[0-9]{11}$/.test(ruc)) throw new Error('RUC inválido');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' });
  try {
    await page.goto('https://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/FrameCriterioBusquedaWeb.jsp', { waitUntil: 'networkidle' });

    // localizar input
    const input = await page.$('input[placeholder*="Ingrese"]') || await page.$('input[placeholder*="RUC"]') || (await page.$$('input')).find(async el => {
      const maxlength = await el.getAttribute('maxlength');
      return maxlength === '11';
    });

    if (!input) throw new Error('Campo RUC no encontrado');
    await input.fill(ruc);

    const btn = await page.$('button:has-text("Buscar")') || await page.$('input[type=button]');
    if (btn) await btn.click();
    else await input.press('Enter');

    await page.waitForTimeout(1500);

    // Recolectar texto de la página y de frames
    const combinedTextParts = [];
    try {
      const main = await page.textContent('body');
      if (main) combinedTextParts.push(main);
    } catch (e) {}
    const frames = page.frames();
    for (const f of frames) {
      try {
        const t = await f.textContent('body');
        if (t) combinedTextParts.push(t);
      } catch (e) {}
    }

    const combinedText = combinedTextParts.join('\n').replace(/\t/g,' ');

    // etiquetas en orden cercano a la vista de SUNAT
    const labels = [
      'Número de RUC', 'Tipo Contribuyente', 'Tipo de Documento', 'Nombre Comercial', 'Fecha de Inscripción', 'Fecha de Inicio de Actividades',
      'Estado del Contribuyente', 'Condición del Contribuyente', 'Domicilio Fiscal', 'Sistema Emisión de Comprobante', 'Sistema Contabilidad',
      'Actividad(es) Económica(s)', 'Comprobantes de Pago', 'Sistema de Emisión Electrónica', 'Emisor electrónico desde', 'Comprobantes Electrónicos',
      'Afiliado al PLE desde', 'Padrones', 'Fecha consulta'
    ];

    const escapeRE = s => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const dataObj = {};
    const pairs = [];

    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const nextLabel = labels.slice(i+1).map(escapeRE).join('|') || '$';
      const re = new RegExp(escapeRE(label) + '\\s*[:\\-–]?\\s*([\\s\\S]*?)(?=(?:' + nextLabel + ')|$)', 'i');
      const m = combinedText.match(re);
      const val = m ? m[1].replace(/\n+/g,' ').replace(/\s+/g,' ').trim() : null;
      if (val) {
        pairs.push([label, val]);
        const key = label.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g,'');
        dataObj[key] = val;
      }
    }

    // intento adicional: si Número de RUC aparece en una línea larga, extraer número y nombre
    if (!dataObj.numero_de_ruc) {
      const m = combinedText.match(/(\d{8,11})\s*-\s*([^\n]+)/);
      if (m) {
        dataObj.numero_de_ruc = m[1];
        dataObj.razon_social = dataObj.razon_social || m[2].trim();
        pairs.unshift(['Número de RUC', m[1] + ' - ' + m[2].trim()]);
      }
    }

    // separar actividades si vienen en bloque grande
    if (dataObj.actividades_economicas) {
      dataObj.actividades = dataObj.actividades_economicas.split(/\s{2,}|;|\n/).map(s => s.trim()).filter(Boolean);
    }

    dataObj.ruc_consultado = ruc;

    // Limpieza preliminar de fecha de consulta
    try {
      const fc = dataObj.fecha_consulta || dataObj['fecha consulta'] || dataObj['fecha_consulta'];
      if (fc && typeof fc === 'string') {
        const m = fc.match(/(\d{2}\/\d{2}\/\d{4}(?:\s+\d{1,2}:\d{2})?)/);
        const clean = m ? m[1] : fc.split(/\n/)[0].trim();
        dataObj.fecha_consulta = clean;
        // actualizar pairs
        for (let i = 0; i < pairs.length; i++) if (/^Fecha consulta$/i.test(pairs[i][0])) pairs[i][1] = clean;
      }
    } catch (e) {}

    // garantizar que el RUC y algunos campos clave estén en el objeto
    if (!dataObj.numero_de_ruc && dataObj['número_de_ruc']) dataObj.numero_de_ruc = dataObj['número_de_ruc'];

    // --- Capturar todas las secciones/frames en la misma sesión (una sola extracción) ---
    const sections = [];

    // Helper: normalizar etiqueta de botón
    const normalizeLabel = s => (s || '').toString().trim().replace(/\s+/g, ' ');

    // Capturar snapshot inicial (antes de clicks)
    try {
      const snapFrames = page.frames();
      for (let idx = 0; idx < snapFrames.length; idx++) {
        const f = snapFrames[idx];
        try {
          const url = f.url();
          const text = (await f.textContent('body')) || '';
          // no capturamos HTML (outerHTML) — solo texto y metadatos en JSON
          sections.push({ label: `frame[${idx}] ${url}`, frameUrl: url, text: text.trim() });
        } catch (e) {}
      }
    } catch (e) {}

    // Buscar elementos clicables dentro de cada frame y hacer click por etiqueta (sin reenviar la búsqueda)
    try {
      const clickIgnore = /(volver|imprimir|e-?mail|buscar|captcha|correo)/i;
      const clicked = new Set();

      const framesList = page.frames();
      for (const f of framesList) {
        let clickables = [];
        try {
          clickables = await f.$$('button, a, input[type=button], input[type=submit]');
        } catch (e) { clickables = []; }

        for (const el of clickables) {
          try {
            const txt = normalizeLabel(await el.innerText().catch(() => el.getAttribute('value') || ''));
            if (!txt) continue;
            if (clickIgnore.test(txt)) continue;
            // evitar etiquetas muy cortas
            if (txt.replace(/[^\w]/g, '').length < 3) continue;

            const key = txt.toLowerCase();
            if (clicked.has(key)) continue;
            clicked.add(key);

            // click y esperar un breve periodo para que la sección cargue dentro del mismo contexto
            await Promise.all([
              el.click().catch(() => {}),
              page.waitForTimeout(800)
            ]);

            // después del click, capturar el estado actual de frames
            const snap = [];
            const nowFrames = page.frames();
            for (let j = 0; j < nowFrames.length; j++) {
              const ff = nowFrames[j];
              try {
                const furl = ff.url();
                const ftext = (await ff.textContent('body')) || '';
                // no se captura HTML aquí; se preserva solo texto y meta
                snap.push({ frameIndex: j, frameUrl: furl, text: ftext.trim() });
              } catch (e) {}
            }

            sections.push({ label: txt, frameUrl: f.url(), snapshot: snap });
          } catch (e) {
            // ignore single clickable failures
          }
        }
      }
    } catch (e) {}

    const parsed = { pairs, object: dataObj, sections };
    return parsed;
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  const ruc = process.argv[2];
  if (!ruc) { console.error('Uso: node consulta-ruc-playwright.js <RUC>'); process.exit(1); }
  consultaRucPlaywright(ruc).then(d => console.log(JSON.stringify(d, null, 2))).catch(e => { console.error(e.message); process.exit(2); });
}

// export para reutilizar desde otros scripts (por ejemplo para render HTML)
module.exports = { consultaRucPlaywright };
