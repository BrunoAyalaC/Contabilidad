// Este archivo fue sustituido por 'render-ruc-html-full.js'.
// Si necesita la versión simple, consulte 'render-ruc-html-full.js' o recupere 'render-ruc-html.js.deleted'.
// Export minimal JSON writer to keep compatibility: writes resultado-<ruc>.json
async function run(ruc) {
  const data = await consultaRucPlaywright(ruc);
  const out = path.resolve(__dirname, `resultado-${ruc}.json`);
  fs.writeFileSync(out, JSON.stringify(data, null, 2), 'utf8');
  console.log('Resultado JSON generado en:', out);
}

module.exports = { run };

if (require.main === module) {
  const ruc = process.argv[2];
  if (!ruc) { console.error('Uso: node render-ruc-html.js <RUC>'); process.exit(1); }
  run(ruc).catch(e => { console.error(e); process.exit(2); });
}
