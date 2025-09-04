// Este archivo fue sustituido por 'render-ruc-html-full.js'.
// Si necesita la versión simple, consulte 'render-ruc-html-full.js' o recupere 'render-ruc-html.js.deleted'.
module.exports = {};

function renderHtml(data) {
  const title = `Consulta RUC - ${data.object.numero_de_ruc || data.object.ruc_consultado || ''}`;
  const rowsHtml = data.pairs.map(([k,v]) => `
    <tr><th style="text-align:left;padding:8px;border-bottom:1px solid #eee;">${k}</th><td style="padding:8px;border-bottom:1px solid #eee;">${v.replace(/\n/g,'<br>')}</td></tr>`).join('\n');

  const objPre = `<pre style="white-space:pre-wrap;word-break:break-word;background:#f8f8f8;padding:12px;border-radius:6px;border:1px solid #eee;">${JSON.stringify(data.object,null,2)}</pre>`;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body{font-family:Segoe UI,Arial,Helvetica,sans-serif;margin:24px;color:#222}
    .card{max-width:900px;margin:0 auto;background:#fff;padding:18px;border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,0.06)}
    table{width:100%;border-collapse:collapse}
    th{width:33%;background:#f4f6fb}
    h1{font-size:20px;margin:0 0 12px}
    .meta{color:#666;font-size:13px;margin-bottom:10px}
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <div class="meta">Generado: ${new Date().toLocaleString()}</div>
    <table>
      ${rowsHtml}
    </table>
    <h3 style="margin-top:18px">Objeto JSON</h3>
    ${objPre}
  </div>
</body>
</html>`;
}

async function run(ruc) {
  const data = await consultaRucPlaywright(ruc);
  const html = renderHtml(data);
  const out = path.resolve(__dirname, `resultado-${ruc}.html`);
  fs.writeFileSync(out, html, 'utf8');
  console.log('HTML generado en:', out);
}

if (require.main === module) {
  const ruc = process.argv[2];
  if (!ruc) { console.error('Uso: node render-ruc-html.js <RUC>'); process.exit(1); }
  run(ruc).catch(e => { console.error(e); process.exit(2); });
}
