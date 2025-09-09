const fs = require('fs');
const path = require('path');

function fail(msg){ console.error('TEST FAIL:', msg); process.exit(1); }

try{
  const fixturePath = path.resolve(__dirname, '..', 'tmp', 'sunat-10702859676.json');
  if (!fs.existsSync(fixturePath)) fail('Fixture not found: ' + fixturePath);
  const raw = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  const mod = require(path.resolve(__dirname, '..', 'ConsultaSunat', 'consulta-ruc-extended-v2.js'));
  const map = mod.mapFlatKeysToFields || mod.mapFlatKeysToFields;
  if (!map) fail('mapFlatKeysToFields not exported');
  const mapped = map(raw.flatMap || raw.flatMap || {});
  console.log('Mapped keys:', Object.keys(mapped));
  if (!mapped.fecha_inscripcion) fail('fecha_inscripcion missing');
  if (!mapped.comprobantes_impresion) fail('comprobantes_impresion missing');
  console.log('All basic assertions passed.');
  process.exit(0);
} catch(e){ console.error('TEST ERROR:', e && e.stack ? e.stack : e); process.exit(1); }
