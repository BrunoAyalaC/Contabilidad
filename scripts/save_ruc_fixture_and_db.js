import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadMaybeCjs(modulePath) {
  // dynamic import works for ESM; for CJS it will provide a default property
  const mod = await import(modulePath);
  // prefer named export, then default, then whole module
  return mod;
}

function pickExport(mod, name) {
  if (!mod) return undefined;
  if (mod[name]) return mod[name];
  if (mod.default && typeof mod.default === 'object' && mod.default[name]) return mod.default[name];
  // if module.exports = fn (CommonJS), default will be the function
  if (typeof mod.default === 'function' && name === 'default') return mod.default;
  return undefined;
}

async function main() {
  try {
    const argRuc = process.argv[2] || '10702859676';
    const ruc = String(argRuc).trim();
    if (!/^[0-9]{8,11}$/.test(ruc)) throw new Error('RUC inválido: ' + ruc);

    const consultaPath = path.resolve(__dirname, '..', 'ConsultaSunat', 'consulta-ruc-extended-v2.js');
    const consultaModule = await loadMaybeCjs(`file://${consultaPath}`);
    const consulta = pickExport(consultaModule, 'consultaRucExtendedV2') || pickExport(consultaModule, 'default') || consultaModule;
    if (!consulta) throw new Error('No se pudo cargar consultaRucExtendedV2 desde ' + consultaPath);

    console.log('Running scraper for RUC', ruc);
    const res = await (typeof consulta === 'function' ? consulta(ruc) : consulta.consultaRucExtendedV2(ruc));

    const outDir = path.resolve(__dirname, '..', 'tmp');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `sunat-${ruc}.json`);
    fs.writeFileSync(outPath, JSON.stringify(res, null, 2), { encoding: 'utf8' });
    console.log('Fixture written to', outPath);

    // save to DB
    const dbPath = path.resolve(__dirname, '..', 'lib', 'database.cjs');
    const dbModule = await loadMaybeCjs(`file://${dbPath}`);
    const saveFn = pickExport(dbModule, 'saveSunatData') || (dbModule.default && dbModule.default.saveSunatData) || dbModule.saveSunatData;
    const initFn = pickExport(dbModule, 'initDatabase') || dbModule.initDatabase || (dbModule.default && dbModule.default.initDatabase);
    if (initFn) {
      try { initFn(); } catch (e) { console.warn('initDatabase warning:', e && e.message ? e.message : e); }
    }

    if (!saveFn) throw new Error('No se encontró saveSunatData en lib/database.cjs');

    const saveData = Object.assign({}, res.parsedFields || {});
    saveData.ruc = ruc;
    saveData.raw = res;

    const result = await saveFn(saveData);
    console.log('DB save result:', result);
    process.exit(0);
  } catch (err) {
    console.error('ERROR RUNNER:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

main();
