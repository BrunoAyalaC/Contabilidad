const { chromium } = require('playwright');

async function submitRucOnPage(page, ruc) {
  const input = await page.$('input[placeholder*="Ingrese"]') || (await page.$$('input'))[0];
  if (!input) throw new Error('Campo RUC no encontrado');
  await input.fill(ruc);
  const btn = await page.$('button:has-text("Buscar")') || await page.$('input[type=button]');
  if (btn) await btn.click(); else await input.press('Enter');
  await page.waitForTimeout(1200);
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

            // capturar contenido del frame y de todos los frames (html + texto)
            const captured = [];
            const allFrames = page.frames();
            for (let k=0;k<allFrames.length;k++) {
              try {
                const tf = allFrames[k];
                const text = await tf.evaluate(() => document.body ? document.body.innerText : '');
                const html = await tf.evaluate(() => document.documentElement ? document.documentElement.outerHTML : '');
                captured.push({ context: `frame[${k}] ${tf.url()}`, text, html });
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

    return { sections };
  } finally {
    await browser.close();
  }
}

module.exports = { consultaRucExtendedV2 };
