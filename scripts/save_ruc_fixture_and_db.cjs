const path = require('path');
const fs = require('fs');
(async function(){
  try{
    const modPath = path.resolve(__dirname, '..', 'ConsultaSunat', 'consulta-ruc-extended-v2.js');
    const { consultaRucExtendedV2 } = require(modPath);
    console.log('Running scraper...');
    const res = await consultaRucExtendedV2('10702859676');
    const outDir = path.resolve(__dirname, '..', 'tmp');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
    const outPath = path.join(outDir, 'sunat-10702859676.json');
    fs.writeFileSync(outPath, JSON.stringify(res, null, 2));
    console.log('Fixture written to', outPath);

    // save to DB
    const db = require(path.resolve(__dirname, '..', 'lib', 'database.cjs'));
    if (db.initDatabase) db.initDatabase();
    const saveData = Object.assign({}, res.parsedFields || {});
    saveData.ruc = '10702859676';
    saveData.raw = res;

    const result = await db.saveSunatData(saveData);
    console.log('DB save result:', result);
  } catch (e) {
    console.error('ERROR RUNNER:', e && e.stack ? e.stack : e);
    process.exit(1);
  }
})();
