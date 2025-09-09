// Temporary test script: call the ConsultaSunat scraper and map results
const path = require('path');
const mapper = require(path.resolve(__dirname, '..', 'lib', 'sunatMapper.cjs'));

async function run() {
  // require the scraper module directly
  const consulta = require(path.resolve(__dirname, '..', 'ConsultaSunat', 'consulta-ruc-extended-v2.js'));
  if (typeof consulta !== 'function' && consulta && consulta.default) {
    // ESM interop
    consulta = consulta.default;
  }

  try {
    const raw = await consulta('10702859676');
    const mapped = mapper.mapSunatResultToFields(raw, '10702859676');
    console.log('MAPPED_RESULT_START');
    console.log(JSON.stringify(mapped, null, 2));
    console.log('MAPPED_RESULT_END');
  } catch (err) {
    console.error('Error running scraper or mapper:', err && err.stack || err);
    process.exit(1);
  }
}

run();
