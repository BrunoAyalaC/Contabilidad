const { chromium } = require('playwright');

async function submitRucOnPage(page, ruc) {
  const input = await page.$('input[placeholder*="Ingrese"]') || (await page.$$('input'))[0];
  if (!input) throw new Error('Campo RUC no encontrado');
  await input.fill(ruc);
  const btn = await page.$('button:has-text("Buscar")') || await page.$('input[type=button]');
  if (btn) await btn.click(); else await input.press('Enter');
  await page.waitForTimeout(1200);
}

// Normaliza texto: trim, collapsar espacios y quitar tildes
function normalizeKey(s) {
  if (!s) return '';
  return String(s).trim().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[\s\u00A0]+/g, ' ').toLowerCase();
}

// Ejecuta heurísticas en el contexto del frame para extraer pares key/value
async function extractPairsFromFrame(frame) {
  return await frame.evaluate(() => {
    const pairs = [];

    const textOf = (el) => el ? (el.innerText || el.textContent || '') .trim() : '';

    // 1) Tablas: filas con 2 celdas -> key/value
    const tables = Array.from(document.querySelectorAll('table'));
    for (const t of tables) {
      for (const row of Array.from(t.querySelectorAll('tr'))) {
        const cells = Array.from(row.querySelectorAll('td, th'));
        if (cells.length >= 2) {
          const key = textOf(cells[0]);
          const value = cells.slice(1).map(textOf).join(' ').trim();
          if (key) pairs.push({ key, value });
        }
      }
    }

    // 2) Listas definicion (dl dt/dd)
    const dls = Array.from(document.querySelectorAll('dl'));
    for (const dl of dls) {
      const dts = Array.from(dl.querySelectorAll('dt'));
      for (const dt of dts) {
        const dd = dt.nextElementSibling && dt.nextElementSibling.tagName.toLowerCase() === 'dd' ? dt.nextElementSibling : null;
        if (dd) {
          const key = textOf(dt);
          const value = textOf(dd);
          if (key) pairs.push({ key, value });
        }
      }
    }

    // 3) Elementos con strong/b como etiqueta seguida de texto
    const candidates = Array.from(document.querySelectorAll('p,div,span'));
    for (const el of candidates) {
      const strong = el.querySelector('strong, b');
      if (strong) {
        const key = textOf(strong);
        // value: text del contenedor sin el strong
        const clone = el.cloneNode(true);
        const s = clone.querySelector('strong, b'); if (s) s.remove();
        const value = textOf(clone);
        if (key && value) pairs.push({ key, value });
      }
    }

    // 3b) Bloques tipo list-group-item / filas con heading (h4) + valor en columna hermana
    for (const item of Array.from(document.querySelectorAll('.list-group-item, .list-group > .list-group-item, .panel .list-group-item'))) {
      try {
        const heading = item.querySelector('h4, h5, .list-group-item-heading, label, strong, b');
        if (heading) {
          // buscar el primer elemento con texto que no sea el heading
          const nodes = Array.from(item.querySelectorAll('div, p, span, td, dd'));
          let value = '';
          for (const n of nodes) {
            if (n.contains(heading)) continue;
            const t = textOf(n);
            if (t && t !== textOf(heading)) { value = t; break; }
          }
          if (!value) {
            // fallback: buscar en los hermanos del heading
            let sib = heading.nextElementSibling;
            while (sib) { const t = textOf(sib); if (t) { value = t; break; } sib = sib.nextElementSibling; }
          }
          if (value) pairs.push({ key: textOf(heading), value });
        }
      } catch (e) {}
    }

    // 4) Buscar etiquetas inline: label: value en el texto
    const bodyText = textOf(document.body || document.documentElement || document);
    const lines = bodyText.split(/\n+/).map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      const m = line.match(/^\s*([^:\-]{2,80})\s*[:\-]\s*(.{1,200})$/);
      if (m) pairs.push({ key: m[1].trim(), value: m[2].trim() });
    }

    return pairs;
  });
}

// Intenta mapear claves detectadas a los nombres esperados por la BD
function mapFlatKeysToFields(flatMap) {
  // flatMap keys are expected to be normalized (lowercase, no diacritics)
  const mapOptions = {
    tipo_contribuyente: ['tipo contribuyente','tipo de contribuyente','contribuyente'],
    tipo_documento: ['tipo documento','tipo de documento','dni'],
    nombre_comercial: ['nombre comercial','nombre o razon social','razon social','nombre o razon','10702859676'],
    fecha_inscripcion: ['fecha de inscripcion','inscripcion','fecha de constitucion','fecha de inscripcion'],
    fecha_inicio_actividades: ['fecha inicio','inicio de actividades','fecha de inicio de actividades','fecha de inicio'],
    estado_contribuyente: ['estado del contribuyente','estado'],
  condicion_contribuyente: ['condicion del contribuyente','condicion','situacion del contribuyente','situacion','estado contribuyente','habido','no habido'],
  domicilio_fiscal: ['domicilio fiscal','domicilio','direccion','direccion del domicilio fiscal','domicilio fiscal completo','domicilio/ domicilio fiscal','domicilio fiscal y domicilio legal'],
    sistema_emision_comprobante: ['sistema de emision','sistema emision de comprobante','sistema emision comprobante'],
    actividad_comercio_exterior: ['actividad comercio exterior'],
    sistema_contabilidad: ['sistema contabilidad','sistema de contabilidad'],
    actividades_economicas: ['actividad economica','actividades economicas','actividad economica(s)','principal','secundaria'],
    comprobantes_impresion: ['comprobantes de pago','comprobantes de pago c/aut. de impresion','comprobantes de pago con aut. de impresion','806','816','factura','boleta'],
    sistema_emision_electronica: ['sistema de emision electronica','sistema de emision electronica'],
    emisor_electronico_desde: ['emisor electronico desde','emisor electronico','emisor electronico desde'],
    comprobantes_electronicos: ['comprobantes electronicos','comprobantes electronicos'],
    afiliado_ple_desde: ['afiliado al ple desde','afiliado al ple'],
    padrones: ['padrones','padron']
  };

  const findValue = (opts) => {
    for (const opt of opts) {
  const nopt = (''+opt).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g,' ').trim().toLowerCase();
      if (!nopt) continue;
      // exact
      if (flatMap[nopt]) return flatMap[nopt];
      // contains
      for (const fk in flatMap) {
        try {
          if (fk.includes(nopt)) return flatMap[fk];
        } catch (e) {}
      }
      // reverse contains (opt contains fk)
      for (const fk in flatMap) {
        try {
          if (nopt.includes(fk) && flatMap[fk]) return flatMap[fk];
        } catch (e) {}
      }
    }
    return null;
  };

  const mapped = {};
  for (const field in mapOptions) mapped[field] = findValue(mapOptions[field]);

  // Heurísticas adicionales
  // actividades_economicas: concatenar entradas 'principal' y 'secundaria'
  if (!mapped.actividades_economicas) {
    const acts = [];
    for (const k in flatMap) {
      if (k.includes('principal') || k.includes('secundaria') || /\bactividad\b/.test(k)) {
        acts.push(flatMap[k]);
      } else if (/^\d{3,4}\b/.test(flatMap[k]) || / - \d{3,4} - /.test(flatMap[k])) {
        acts.push(flatMap[k]);
      }
    }
    mapped.actividades_economicas = acts.length ? acts.filter(Boolean).join(' | ') : null;
  }

  // comprobantes_impresion y comprobantes_electronicos: extraer palabras clave desde los valores
  const impSet = new Set();
  for (const k in flatMap) {
    const v = ''+flatMap[k];
    if (/factura/i.test(v)) impSet.add('FACTURA');
    if (/boleta/i.test(v)) impSet.add('BOLETA');
    if (/guia/i.test(v)) impSet.add('GUIA');
  }
  if (!mapped.comprobantes_impresion) mapped.comprobantes_impresion = impSet.size ? Array.from(impSet).join(', ') : null;
  if (!mapped.comprobantes_electronicos) mapped.comprobantes_electronicos = mapped.comprobantes_impresion;

  // emisor_electronico_desde: buscar fecha DESDE xxxx
  if (!mapped.emisor_electronico_desde) {
    for (const k in flatMap) {
      const v = ''+flatMap[k];
      const m = v.match(/desde\s*(\d{2}\/\d{2}\/\d{4})/i);
      if (m) { mapped.emisor_electronico_desde = m[1]; break; }
    }
  }

  // padrones: si aparece 'ninguno' o texto similar
  // Limpieza y heurísticas específicas para domicilio_fiscal
  if (mapped.domicilio_fiscal) {
    // eliminar sufijos largos que no son parte de la dirección (ej. etiquetas como 'Teléfono', 'Condición')
    mapped.domicilio_fiscal = ('' + mapped.domicilio_fiscal).replace(/\s{2,}/g, ' ').trim();
    // si contiene palabras tipo 'fecha' o 'estado' cortar por esa parte
    mapped.domicilio_fiscal = mapped.domicilio_fiscal.replace(/(\bfecha\b|\bestado\b|\bcondici[oó]n\b).*/i, '').trim();
    if (!mapped.domicilio_fiscal) mapped.domicilio_fiscal = null;
  } else {
    // intentar heurística alternativa: buscar entradas en flatMap que contengan 'direccion' o calle/pj
    for (const k in flatMap) {
      if (/direccion|domicilio|calle|av\.|avenida|jr\.|jr |urb\.|urbanizacion/i.test(k) || /direccion|domicilio|calle|av\.|avenida|jr\.|urbanizacion/i.test(flatMap[k] || '')) {
        mapped.domicilio_fiscal = (mapped.domicilio_fiscal || '') + (mapped.domicilio_fiscal ? ' | ' : '') + flatMap[k];
      }
    }
    if (mapped.domicilio_fiscal) mapped.domicilio_fiscal = mapped.domicilio_fiscal.replace(/\s{2,}/g, ' ').trim();
  }

  // Heurística específica para condicion_contribuyente: normalizar a HABIDO/NO HABIDO o texto claro
  if (mapped.condicion_contribuyente) {
    let v = ('' + mapped.condicion_contribuyente).trim();
    // si el valor parece ser un encabezado (p.ej. 'Fecha Desde Fecha Hasta') buscar el verdadero valor en flatMap
    if (/fecha|desde|hasta/i.test(v)) {
      // buscar candidatos en flatMap: claves que sean 'habido' o valores que contengan 'habido'/'no habido'
      let found = null;
      for (const fk in flatMap) {
        const fv = (''+flatMap[fk]).trim();
        if (/^habido$/i.test(fk) || /^habido$/i.test(fv) || /\bhabido\b/i.test(fv)) { found = 'HABIDO'; break; }
        if (/^no\s*habido$/i.test(fk) || /^no\s*habido$/i.test(fv) || /no\s*habido/i.test(fv)) { found = 'NO HABIDO'; break; }
      }
      if (found) v = found;
      else v = v.toUpperCase();
    } else {
      if (/no\s*habido|no\s*inscrito|no\s*registrado/i.test(v)) v = 'NO HABIDO';
      else if (/habido|inscrito|registrado|activo/i.test(v)) v = 'HABIDO';
      else v = v.toUpperCase();
    }
    mapped.condicion_contribuyente = v;
  } else {
    // buscar en flatMap por claves que contengan 'condic' o 'situac'
    for (const k in flatMap) {
      if (/condic|situac|estado/i.test(k) || /condic|situac|estado/i.test(flatMap[k] || '')) {
        const cand = ('' + flatMap[k]).trim();
        if (cand) {
          if (/no\s*habido|no\s*inscrito|no\s*registrado/i.test(cand)) mapped.condicion_contribuyente = 'NO HABIDO';
          else if (/habido|inscrito|registrado|activo/i.test(cand)) mapped.condicion_contribuyente = 'HABIDO';
          else mapped.condicion_contribuyente = cand.toUpperCase();
          break;
        }
      }
    }
  }
  if (!mapped.padrones) {
    const p = findValue(['padrones','padron']);
    if (p) mapped.padrones = p;
  }

  return mapped;
}

async function consultaRucExtendedV2(ruc) {
  if (!/^[0-9]{8,11}$/.test(ruc)) throw new Error('RUC inválido');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' });
  try {
    await page.goto('https://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/FrameCriterioBusquedaWeb.jsp', { waitUntil: 'networkidle' });
    await submitRucOnPage(page, ruc);

    const sections = [];

    // buscamos en cada frame los elementos clicables y los procesamos
    let frames = page.frames();
    for (let fi = 0; fi < frames.length; fi++) {
      const f = frames[fi];
      try {
        // obtener textos de elementos candidatos en el frame
        const elems = await f.evaluate(() => {
          const nodes = Array.from(document.querySelectorAll('button, a, input[type=button]'));
          return nodes.map(n => ({ text: (n.innerText||n.value||'').trim() }));
        });
        for (let ei = 0; ei < elems.length; ei++) {
          const label = elems[ei].text || `element#${ei}`;
          if (!label) continue;
          // evitar botones genéricos muy cortos
          if (label.length < 3) continue;

          // click dentro del frame por índice
          try {
            await f.evaluate((idx) => { const nodes = Array.from(document.querySelectorAll('button, a, input[type=button]')); nodes[idx] && nodes[idx].click(); }, ei);
            await page.waitForTimeout(1100);

            // capturar contenido del frame y de todos los frames (html + texto + parsed pairs)
            const captured = [];
            const allFrames = page.frames();
            for (let k=0;k<allFrames.length;k++) {
              try {
                const tf = allFrames[k];
                const text = await tf.evaluate(() => document.body ? document.body.innerText : '');
                // Intencionalmente no capturamos HTML (outerHTML) para mantener solo JSON/texto
                // parsed pairs extraídos en el contexto del frame
                const parsed = await (async () => {
                  try {
                    return await tf.evaluate(() => {
                      const pairs = [];
                      const textOf = (el) => el ? (el.innerText || el.textContent || '') .trim() : '';
                      // tablas
                      for (const t of Array.from(document.querySelectorAll('table'))) {
                        for (const row of Array.from(t.querySelectorAll('tr'))) {
                          const cells = Array.from(row.querySelectorAll('td, th'));
                          if (cells.length >= 2) {
                            const key = textOf(cells[0]);
                            const value = cells.slice(1).map(textOf).join(' ').trim();
                            if (key) pairs.push({ key, value });
                          }
                        }
                      }
                      // dl dt/dd
                      for (const dl of Array.from(document.querySelectorAll('dl'))) {
                        const dts = Array.from(dl.querySelectorAll('dt'));
                        for (const dt of dts) {
                          const dd = dt.nextElementSibling && dt.nextElementSibling.tagName.toLowerCase() === 'dd' ? dt.nextElementSibling : null;
                          if (dd) pairs.push({ key: textOf(dt), value: textOf(dd) });
                        }
                      }
                      // strong/b patterns
                      for (const el of Array.from(document.querySelectorAll('p,div,span'))) {
                        const strong = el.querySelector('strong, b');
                        if (strong) {
                          const key = textOf(strong);
                          const clone = el.cloneNode(true);
                          const s = clone.querySelector('strong, b'); if (s) s.remove();
                          const value = textOf(clone);
                          if (key && value) pairs.push({ key, value });
                        }
                      }
                      // list-group / h4 heading patterns
                      for (const item of Array.from(document.querySelectorAll('.list-group-item, .list-group > .list-group-item, .panel .list-group-item'))) {
                        try {
                          const heading = item.querySelector('h4, h5, .list-group-item-heading, label, strong, b');
                          if (heading) {
                            const nodes = Array.from(item.querySelectorAll('div, p, span, td, dd'));
                            let value = '';
                            for (const n of nodes) {
                              if (n.contains(heading)) continue;
                              const t = textOf(n);
                              if (t && t !== textOf(heading)) { value = t; break; }
                            }
                            if (!value) {
                              let sib = heading.nextElementSibling;
                              while (sib) { const t = textOf(sib); if (t) { value = t; break; } sib = sib.nextElementSibling; }
                            }
                            if (value) pairs.push({ key: textOf(heading), value });
                          }
                        } catch (e) {}
                      }
                      // lines with label: value
                      const bodyText = textOf(document.body || document.documentElement || document);
                      for (const line of bodyText.split(/\n+/).map(l=>l.trim()).filter(Boolean)) {
                        const m = line.match(/^\s*([^:\-]{2,80})\s*[:\-]\s*(.{1,200})$/);
                        if (m) pairs.push({ key: m[1].trim(), value: m[2].trim() });
                      }
                      return pairs;
                    });
                  } catch (e) { return []; }
                })();

                captured.push({ context: `frame[${k}] ${tf.url()}`, text, parsed });
              } catch (e) {}
            }
            sections.push({ name: label, captured });

            // intentar volver con enlaces/buttons conocidos
            let returned = false;
            try {
              const volver = page.frames().find(fr=>true) && (await page.$('#aNuevaConsulta') || await page.$('a:has-text("Volver")') || await page.$('.btnNuevaConsulta'));
              if (volver) { await volver.click(); await page.waitForTimeout(800); returned = true; }
            } catch (ee) { returned = false; }

            if (!returned) {
              // recargar y reenviar la búsqueda para restaurar estado
              try {
                await page.goto('https://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/FrameCriterioBusquedaWeb.jsp', { waitUntil: 'networkidle' });
                await submitRucOnPage(page, ruc);
                await page.waitForTimeout(800);
                frames = page.frames();
              } catch (ee) {}
            }
          } catch (e) {
            // continuar con siguiente elemento
          }
        }
      } catch (e) {
        // continuar con siguiente frame
      }
    }

    // Construir un mapa plano de claves normalizadas -> valor (primero encontrado)
    const flat = {};
    for (const sec of sections) {
      for (const cap of sec.captured) {
        if (Array.isArray(cap.parsed)) {
          for (const p of cap.parsed) {
            try {
              // normalize key: remove diacritics, remove punctuation, collapse spaces
              const k = (p.key || '')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^\w\s]/g, '')
                .replace(/[\s\u00A0]+/g, ' ')
                .trim()
                .toLowerCase();
              if (!k) continue;
              if (!flat[k]) flat[k] = p.value || '';
            } catch (e) { /* ignore */ }
          }
        }
      }
    }

    // Mapear heurísticamente a los campos esperados
    const parsedFields = mapFlatKeysToFields(flat);

    return { sections, parsedFields, flatMap: flat };
  } finally {
    await browser.close();
  }
}

module.exports = { consultaRucExtendedV2 };
// Expose internal helper for testing and mapping tuning
module.exports.mapFlatKeysToFields = mapFlatKeysToFields;
