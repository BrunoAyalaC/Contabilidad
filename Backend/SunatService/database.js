const sqlite3 = require('sqlite3').verbose();
const dbPath = './SunatService.db';

// Conectar a la base de datos (la crea si no existe)
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al abrir la base de datos', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite.');
    createTable();
  }
});

// Crear la tabla si no existe
function createTable() {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS Contribuyentes (
      Ruc TEXT PRIMARY KEY,
      TipoContribuyente TEXT,
      TipoDocumento TEXT,
      NombreComercial TEXT,
      FechaInscripcion TEXT,
      FechaInicioActividades TEXT,
      EstadoContribuyente TEXT,
      CondicionContribuyente TEXT,
      DomicilioFiscal TEXT,
      SistemaEmisionComprobante TEXT,
      ActividadComercioExterior TEXT,
      SistemaContabilidad TEXT,
      ActividadesEconomicas TEXT,
      ComprobantesDePago TEXT,
      SistemaEmisionElectronica TEXT,
      EmisorElectronicoDesde TEXT,
      ComprobantesElectronicos TEXT,
      AfiliadoPleDesde TEXT,
      Padrones TEXT,
      UltimaActualizacion TEXT
    )
  `;
  db.run(createTableSql, (err) => {
    if (err) {
      console.error('Error al crear la tabla', err.message);
    } else {
      console.log('Tabla Contribuyentes asegurada.');
    }
  });
}

module.exports = db;
