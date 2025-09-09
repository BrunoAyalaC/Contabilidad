const fs = require('fs');
const path = require('path');
let consultaRucExtended = null;
// Preferir el extractor Playwright (una sola extracción). Caer en extractores previos si no existe.
try { consultaRucExtended = require('./consulta-ruc-playwright').consultaRucPlaywright; } catch (e) {
  try { consultaRucExtended = require('./consulta-ruc-extended-v2').consultaRucExtendedV2; } catch (e2) {
    try { consultaRucExtended = require('./consulta-ruc-extended').consultaRucExtended; } catch (ee) { throw new Error('No extractor disponible'); }
  }
}

function buildJson(result, ruc) {
  // Construir una salida JSON que contenga los pares, secciones y texto capturado
  return {
    ruc,
    summary: {
      parsedFields: result.parsedFields || result.object || null,
      pairs: result.pairs || null
    },
    sections: (result.sections || []).map(s => ({ label: s.label || s.name, frameUrl: s.frameUrl || null, text: s.text || null, snapshot: s.snapshot || null }))
  };
}

// Este archivo ahora genera JSON; helpers para manipular HTML fueron removidos.

async function run(ruc) {
  const res = await consultaRucExtended(ruc);
  const out = path.resolve(__dirname, `resultado-full-${ruc}.json`);
  fs.writeFileSync(out, JSON.stringify(buildJson(res,ruc), null, 2), 'utf8');
  console.log('Resultado JSON generado en:', out);
}

if (require.main===module){ const r = process.argv[2]; if(!r){ console.error('Uso: node render-ruc-html-full.js <RUC>'); process.exit(1);} run(r).catch(e=>{console.error(e);process.exit(2)}); }
