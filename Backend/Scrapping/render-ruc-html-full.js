const fs = require('fs');
const path = require('path');
let consultaRucExtended = null;
// Preferir el extractor Playwright (una sola extracción). Caer en extractores previos si no existe.
try { consultaRucExtended = require('./consulta-ruc-playwright').consultaRucPlaywright; } catch (e) {
  try { consultaRucExtended = require('./consulta-ruc-extended-v2').consultaRucExtendedV2; } catch (e2) {
    try { consultaRucExtended = require('./consulta-ruc-extended').consultaRucExtended; } catch (ee) { throw new Error('No extractor disponible'); }
  }
}

function buildHtml(result, ruc) {
  const title = `Consulta RUC - ${ruc}`;
  const sections = result.sections || [];

  // Si tenemos secciones capturadas, mostrar únicamente la primera (vista mínima y limpia)
  if (sections.length > 0) {
    const s = sections[0];
    let contentHtml = '';

    if (s.html) {
      // intentar extraer el body para evitar duplicar <head> o estilos globales
      const m = s.html.match(/<body[^>]*>((.|[\r\n])*)<\/body>/i);
      contentHtml = m ? m[1] : s.html;
      contentHtml = stripControls(contentHtml);
    } else if (Array.isArray(s.snapshot) && s.snapshot.length>0) {
      const snap = s.snapshot[0];
      const m = snap.html && snap.html.match(/<body[^>]*>((.|[\r\n])*)<\/body>/i);
      contentHtml = m ? m[1] : (snap.html || escapeHtml(snap.text || ''));
      contentHtml = stripControls(contentHtml);
    } else {
      contentHtml = `<div style="font-size:14px">${escapeHtml(s.text||'No hay contenido capturado.')}</div>`;
    }

    return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>
      body{font-family:Segoe UI,Arial;margin:18px;background:#f6f7fb}
      .card{max-width:900px;margin:0 auto;background:#fff;padding:18px;border-radius:6px}
    </style></head><body>
      <div class="card">
        ${contentHtml}
      </div>
    </body></html>`;
  }

  // Fallback: si no hay secciones, mantener el render completo original (tabs/sections)
  const sectionsHtml = (result.sections||[]).map((s, idx) => {
    const title = s.label || s.name || `Sección ${idx}`;
    let content = '';
    if (s.html || s.text) {
      if (s.html) {
        const clean = stripControls(s.html);
        content += `<section style="margin-bottom:14px;"><h4>${escapeHtml(title)}</h4><iframe srcdoc='${escapeHtml(clean)}' style="width:100%;height:320px;border:1px solid #ddd;border-radius:6px"></iframe></section>`;
      } else content += `<section style="margin-bottom:14px;"><h4>${escapeHtml(title)}</h4><div style="background:#fff;border:1px solid #ddd;padding:10px;max-height:320px;overflow:auto;font-size:13px">${escapeHtml(s.text||'')}</div></section>`;
    } else if (Array.isArray(s.snapshot)) {
      for (const snap of s.snapshot) {
        if (snap.html) {
          const clean = stripControls(snap.html);
          content += `<section style="margin-bottom:14px;"><h4>${escapeHtml(title)} - ${escapeHtml(snap.frameUrl || '')}</h4><iframe srcdoc='${escapeHtml(clean)}' style="width:100%;height:320px;border:1px solid #ddd;border-radius:6px"></iframe></section>`;
        } else {
          content += `<section style="margin-bottom:14px;"><h4>${escapeHtml(title)} - ${escapeHtml(snap.frameUrl || '')}</h4><div style="background:#fff;border:1px solid #ddd;padding:10px;max-height:320px;overflow:auto;font-size:13px">${escapeHtml(snap.text||'')}</div></section>`;
        }
      }
    } else {
      content = `<section style="margin-bottom:14px;"><h4>${escapeHtml(title)}</h4><div style="background:#fff;border:1px solid #ddd;padding:10px;max-height:120px;overflow:auto;font-size:13px">No hay contenido capturado.</div></section>`;
    }
    return `<div class="section" id="sec-${idx}" style="padding:12px;display:none">${content}</div>`;
  }).join('\n');

  const usedNames = new Set();
  const nav = (result.sections||[]).map((s,idx)=>{
    let label = (s.label||s.name||`Sección ${idx}`).toString().trim();
    if (/^\s*$/.test(label) || label.length < 3) label = `Sección ${idx}`;
    let base = label, i = 1;
    while (usedNames.has(label)) { label = `${base} (${++i})`; }
    usedNames.add(label);
    return `<button data-target="#sec-${idx}" class="tabbtn">${escapeHtml(label)}</button>`;
  }).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8"><title>${title} (completo)</title><style>
    body{font-family:Segoe UI,Arial;margin:18px;background:#f6f7fb}
    .card{max-width:1000px;margin:0 auto;background:#fff;padding:18px;border-radius:6px}
    .tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
    .tabbtn{background:#2d6cdf;color:#fff;border:none;padding:8px 10px;border-radius:4px;cursor:pointer}
  </style></head><body>
  <div class="card">
    <h2>${title} (completo)</h2>
    <div class="tabs">${nav}</div>
    <div id="content">${sectionsHtml || '<p>No se capturaron secciones adicionales.</p>'}</div>
  </div>
  <script>
    document.querySelectorAll('.tabbtn').forEach(b=>b.addEventListener('click',()=>{
      document.querySelectorAll('.section').forEach(s=>s.style.display='none');
      const t = document.querySelector(b.getAttribute('data-target'));
      if (t) t.style.display = 'block';
    }));
  </script>
</body></html>`;
}

function escapeHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>'); }
// Escapa solo lo necesario para inyectar en el atributo srcdoc (no escapar etiquetas HTML)
function srcdocEscape(s){ if(!s) return ''; return s.replace(/'/g, "&#39;"); }

// Elimina botones y controles interactivos del HTML para dejar solo datos/texto
function stripControls(html){
  if(!html) return html;
  let h = html;
  // eliminar etiquetas <button>...</button>
  h = h.replace(/<button[\s\S]*?<\/button>/gi,'');
  // eliminar inputs tipo button/submit/reset
  h = h.replace(/<input[^>]*type\s*=\s*(?:"|')?(?:button|submit|reset)(?:"|')?[^>]*>/gi,'');
  // eliminar cualquier elemento con atributo onclick (aprox. remove whole element)
  h = h.replace(/<([a-z0-9]+)[^>]*onclick=[\s\S]*?>[\s\S]*?<\/\1>/gi,'');
  // eliminar elementos con clase que contenga 'btn' o 'tab' (aprox)
  h = h.replace(/<([a-z0-9]+)[^>]*class=(?:"|')[^"']*(?:btn|tab)[^"']*(?:"|')[^>]*>[\s\S]*?<\/\1>/gi,'');
  // eliminar atributos data-target y similares
  h = h.replace(/\sdata-target=("|')?[^\s>]+("|')?/gi,'');
  // eliminar elementos <a> que usan javascript: o tienen role=button
  h = h.replace(/<a[^>]*href\s*=\s*['"]?javascript:[^'">\s]*['"]?[^>]*>[\s\S]*?<\/a>/gi,'');
  h = h.replace(/<([a-z0-9]+)[^>]*role=(?:"|')?button(?:"|')?[^>]*>[\s\S]*?<\/\1>/gi,'');
  return h;
}

async function run(ruc) {
  const res = await consultaRucExtended(ruc);
  const out = path.resolve(__dirname, `resultado-full-${ruc}.html`);
  fs.writeFileSync(out, buildHtml(res,ruc),'utf8');
  console.log('HTML completo generado en:', out);
}

if (require.main===module){ const r = process.argv[2]; if(!r){ console.error('Uso: node render-ruc-html-full.js <RUC>'); process.exit(1);} run(r).catch(e=>{console.error(e);process.exit(2)}); }
