import path from 'path';
import fs from 'fs';

(async function(){
  const fixturePath = path.resolve(process.cwd(), 'tmp', 'sunat-10702859676.json');
  if (!fs.existsSync(fixturePath)) { console.error('Fixture not found:', fixturePath); process.exit(2); }
  const raw = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  const consultaPath = path.resolve(process.cwd(), 'ConsultaSunat', 'consulta-ruc-extended-v2.js');
  const mod = await import('file://' + consultaPath);
  const mapFn = mod.mapFlatKeysToFields || mod.default && mod.default.mapFlatKeysToFields || mod.default;
  if (typeof mapFn !== 'function') { console.error('mapFlatKeysToFields not found'); process.exit(3); }
  const mapped = mapFn(raw.flatMap || {});
  console.log('Mapped keys:', Object.keys(mapped));
  if (!('condicion_contribuyente' in mapped)) { console.error('Missing condicion_contribuyente'); process.exit(4); }
  if (!('domicilio_fiscal' in mapped)) { console.error('Missing domicilio_fiscal'); process.exit(5); }
  const jsonStr = JSON.stringify(mapped).toLowerCase();
  if (jsonStr.includes('<html') || jsonStr.includes('<div')) { console.error('HTML found in mapped output'); process.exit(6); }
  console.log('Mapper check OK');
  process.exit(0);
})();
