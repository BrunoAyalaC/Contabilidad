const cheerio = require('cheerio');

function normalizeLabel(s) {
  return String(s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function extractPairsFromHtml(html) {
  const $ = cheerio.load(html || '');
  const pairs = [];

  // buscar estructuras tipo dt/dd, th/td, label + sibling, o filas de tabla
  $('dt').each((i, el) => {
    const lab = $(el).text();
    const val = $(el).next('dd').text() || '';
    if (lab) pairs.push({ label: lab, value: val });
  });

  $('th').each((i, el) => {
    const lab = $(el).text();
    const val = $(el).next('td').text() || $(el).parent().next().find('td').first().text();
    if (lab) pairs.push({ label: lab, value: val });
  });

  // filas con columna label / value
  $('table').each((i, table) => {
    $(table).find('tr').each((ri, tr) => {
      const tds = $(tr).find('td');
      if (tds.length === 2) {
        const lab = $(tds[0]).text();
        const val = $(tds[1]).text();
        if (lab) pairs.push({ label: lab, value: val });
      }
    });
  });

  // simple: headings followed by paragraph
  $('h1,h2,h3,h4,h5,h6').each((i, h) => {
    const lab = $(h).text();
    const val = $(h).next().text() || '';
    if (lab) pairs.push({ label: lab, value: val });
  });

  // fallback: lines like "Label:\nValue"
  const rawText = $('body').text() || '';
  const lines = rawText.split(/\n{1,2}/).map(l => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length - 1; i++) {
    const a = lines[i];
    const b = lines[i + 1];
    if (/[:\-]\s*$/.test(a) || a.toLowerCase().includes('fecha') || a.length < 40) {
      pairs.push({ label: a, value: b });
    }
  }

  return pairs;
}

function findValueByLabels(pairs, labels) {
  const labs = labels.map(l => normalizeLabel(l));
  for (const p of pairs) {
    const nl = normalizeLabel(p.label);
    for (const target of labs) {
      if (nl.includes(target) || target.includes(nl) || nl === target) {
        return String(p.value || '').trim() || null;
      }
    }
  }
  return null;
}

function mapSunatResultToFields(rawResult, ruc) {
  try {
    const pairs = [];
    if (rawResult && Array.isArray(rawResult.sections)) {
      for (const s of rawResult.sections) {
        if (!s || !Array.isArray(s.captured)) continue;
        for (const c of s.captured) {
          if (c && c.html) {
            try {
              const extracted = extractPairsFromHtml(c.html);
              for (const ex of extracted) pairs.push(ex);
            } catch (e) {
              // ignore
            }
          }
          if (c && c.text) {
            // also push a simple pair where label is the line and value is next line (fallback handled later)
            const txt = String(c.text || '');
            const lines = txt.split(/\n{1,2}/).map(l => l.trim()).filter(Boolean);
            for (let i = 0; i < lines.length; i++) {
              pairs.push({ label: lines[i], value: lines[i + 1] || '' });
            }
          }
        }
      }
    }

    const mapped = {
      ruc: ruc,
      tipo_contribuyente: findValueByLabels(pairs, ['Tipo Contribuyente', 'Tipo de Contribuyente', 'Contribuyente', 'Tipo contribuyente']),
      tipo_documento: findValueByLabels(pairs, ['Tipo Documento', 'Tipo de Documento', 'Tipo documento']),
      nombre_comercial: findValueByLabels(pairs, ['Nombre Comercial', 'Nombre o Razon Social', 'Nombre comercial']),
      fecha_inscripcion: findValueByLabels(pairs, ['Fecha de Inscripcion', 'Fecha de Inscripción', 'Inscripción', 'Fecha de Inscripcion']),
      fecha_inicio_actividades: findValueByLabels(pairs, ['Fecha Inicio', 'Inicio de Actividades', 'Fecha de Inicio de Actividades', 'Fecha de Inicio']),
      estado_contribuyente: findValueByLabels(pairs, ['Estado del Contribuyente', 'Estado', 'Condicion', 'Condición del Contribuyente']),
      condicion_contribuyente: findValueByLabels(pairs, ['Condicion del Contribuyente', 'Condición del Contribuyente', 'Condicion']),
      domicilio_fiscal: findValueByLabels(pairs, ['Domicilio Fiscal', 'Domicilio', 'Direccion']),
      sistema_emision_comprobante: findValueByLabels(pairs, ['Sistema de Emision', 'Sistema Emisión de Comprobante', 'Sistema Emision de Comprobante', 'Sistema Emision']),
      actividad_comercio_exterior: findValueByLabels(pairs, ['Actividad Comercio Exterior', 'Actividad Comercio Exterior', 'Actividad comercio exterior']),
      sistema_contabilidad: findValueByLabels(pairs, ['Sistema Contabilidad', 'Sistema de Contabilidad', 'Sistema contabilidad']),
      actividades_economicas: findValueByLabels(pairs, ['Actividad Economica', 'Actividades Economicas', 'Actividad(es) Economica', 'Actividad economica']),
      comprobantes_impresion: findValueByLabels(pairs, ['Comprobantes de Pago', 'Comprobantes de Pago c/aut. de impresión', 'Comprobantes de Pago', 'Comprobantes']),
      sistema_emision_electronica: findValueByLabels(pairs, ['Sistema de Emision Electronica', 'Sistema de Emisión Electrónica', 'Sistema Emision Electronica']),
      emisor_electronico_desde: findValueByLabels(pairs, ['Emisor electronico desde', 'Emisor electrónico desde', 'Emisor electrónico', 'Emisor electronico']),
      comprobantes_electronicos: findValueByLabels(pairs, ['Comprobantes Electronicos', 'Comprobantes Electrónicos', 'Comprobantes Electronicos']),
      afiliado_ple_desde: findValueByLabels(pairs, ['Afiliado al PLE desde', 'Afiliado al PLE']),
      padrones: findValueByLabels(pairs, ['Padrones', 'Padron', 'Padrones'])
    };

    mapped.raw = rawResult;
    return mapped;
  } catch (err) {
    return { ruc, raw: rawResult };
  }
}

module.exports = { mapSunatResultToFields };
