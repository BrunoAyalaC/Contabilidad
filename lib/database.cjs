
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.resolve(__dirname, '..', 'contabilidad.db');
const db = new sqlite3.Database(dbPath);

const saltRounds = 10;

function initDatabase() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
      )
    `, (err) => {
      if (err) {
        console.error('Error creating users table:', err);
        return;
      }
      // Insert a default user for testing if the table is newly created
      db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, row) => {
        if (err) {
            console.error('Error checking for default user:', err);
            return;
        }
        if (!row) {
          registerUser('admin', 'admin');
          console.log('Default user "admin" with password "admin" created.');
        }
      });
    });
    
      // Crear tabla para resultados de Consulta RUC (SUNAT)
      db.run(`
        CREATE TABLE IF NOT EXISTS sunat_ruc (
          ruc TEXT PRIMARY KEY,
          tipo_contribuyente TEXT,
          tipo_documento TEXT,
          nombre_comercial TEXT,
          fecha_inscripcion TEXT,
          fecha_inicio_actividades TEXT,
          estado_contribuyente TEXT,
          condicion_contribuyente TEXT,
          domicilio_fiscal TEXT,
          sistema_emision_comprobante TEXT,
          actividad_comercio_exterior TEXT,
          sistema_contabilidad TEXT,
          actividades_economicas TEXT,
          comprobantes_impresion TEXT,
          sistema_emision_electronica TEXT,
          emisor_electronico_desde TEXT,
          comprobantes_electronicos TEXT,
          afiliado_ple_desde TEXT,
          padrones TEXT,
          raw_json TEXT
        )
      `, (err) => {
        if (err) console.error('Error creating sunat_ruc table:', err);
      });
        // Crear tabla de clientes
        db.run(`
          CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ruc TEXT UNIQUE,
            name TEXT,
            address TEXT,
            status TEXT,
            condition TEXT,
            raw_json TEXT,
            created_at TEXT DEFAULT (datetime('now'))
          )
        `, (err) => {
          if (err) console.error('Error creating clients table:', err);
        });
        // Crear tabla de facturas/ventas
        db.run(`
          CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER,
            client_ruc TEXT,
            client_name TEXT,
            series TEXT,
            number TEXT,
            date TEXT,
            subtotal REAL,
            igv REAL,
            total REAL,
            glosa TEXT,
            items_json TEXT,
            created_at TEXT DEFAULT (datetime('now'))
          )
        `, (err) => {
          if (err) console.error('Error creating invoices table:', err);
        });
        // Crear tabla de compras (purchases)
        db.run(`
          CREATE TABLE IF NOT EXISTS purchases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_client_id INTEGER, -- la cuenta/empresa a la que pertenece la factura
            provider_id INTEGER, -- si el proveedor está registrado en clients
            provider_ruc TEXT,
            provider_name TEXT,
            series TEXT,
            number TEXT,
            date TEXT,
            subtotal REAL,
            igv REAL,
            total REAL,
            glosa TEXT,
            items_json TEXT,
            asiento_json TEXT,
            parsed_json TEXT,
            created_at TEXT DEFAULT (datetime('now'))
          )
        `, (err) => {
          if (err) console.error('Error creating purchases table:', err);
        });
  });
}

async function registerUser(username, password) {
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function(err) {
      if (err) {
        reject('Error registering user: ' + err.message);
      } else {
        resolve({ id: this.lastID });
      }
    });
  });
}

async function loginUser(username, password) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        reject('Database error: ' + err.message);
      } else if (!user) {
        reject('User not found');
      } else {
        const match = await bcrypt.compare(password, user.password);
        if (match) {
          resolve({ id: user.id, username: user.username });
        } else {
          reject('Incorrect password');
        }
      }
    });
  });
}

module.exports = {
  initDatabase,
  registerUser,
  loginUser,
  // Función para guardar/actualizar datos extraídos de SUNAT
  saveSunatData: async function(data) {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(`REPLACE INTO sunat_ruc (
          ruc, tipo_contribuyente, tipo_documento, nombre_comercial, fecha_inscripcion,
          fecha_inicio_actividades, estado_contribuyente, condicion_contribuyente, domicilio_fiscal,
          sistema_emision_comprobante, actividad_comercio_exterior, sistema_contabilidad, actividades_economicas,
          comprobantes_impresion, sistema_emision_electronica, emisor_electronico_desde, comprobantes_electronicos,
          afiliado_ple_desde, padrones, raw_json
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);

        const params = [
          data.ruc || null,
          data.tipo_contribuyente || null,
          data.tipo_documento || null,
          data.nombre_comercial || null,
          data.fecha_inscripcion || null,
          data.fecha_inicio_actividades || null,
          data.estado_contribuyente || null,
          data.condicion_contribuyente || null,
          data.domicilio_fiscal || null,
          data.sistema_emision_comprobante || null,
          data.actividad_comercio_exterior || null,
          data.sistema_contabilidad || null,
          data.actividades_economicas || null,
          data.comprobantes_impresion || null,
          data.sistema_emision_electronica || null,
          data.emisor_electronico_desde || null,
          data.comprobantes_electronicos || null,
          data.afiliado_ple_desde || null,
          data.padrones || null,
          JSON.stringify(data.raw || null)
        ];

        stmt.run(params, function(err) {
          stmt.finalize();
          if (err) return reject(err);
          resolve({ success: true, changes: this.changes });

  // Añadimos helper para obtener fila por RUC
  module.exports.getSunatByRuc = function(ruc) {
    return new Promise((resolve, reject) => {
      if (!ruc) return resolve(null);
      db.get('SELECT * FROM sunat_ruc WHERE ruc = ?', [String(ruc)], (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        try {
          if (row.raw_json && typeof row.raw_json === 'string') {
            row.raw_json = JSON.parse(row.raw_json);
          }
        } catch (e) {
          // keep raw as string if parse fails
        }
        resolve(row);
      });
    });
  };
        });
      } catch (err) {
        reject(err);
      }
    });
  }
};

// Clientes: helpers básicos
module.exports.getAllClients = function() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM clients ORDER BY name COLLATE NOCASE', [], (err, rows) => {
      if (err) return reject(err);
      try {
        rows.forEach(r => { if (r.raw_json && typeof r.raw_json === 'string') { try { r.raw_json = JSON.parse(r.raw_json); } catch(e){} } });
      } catch(e) {}
      resolve(rows || []);
    });
  });
};

module.exports.getClientByRuc = function(ruc) {
  return new Promise((resolve, reject) => {
    if (!ruc) return resolve(null);
    db.get('SELECT * FROM clients WHERE ruc = ?', [String(ruc)], (err, row) => {
      if (err) return reject(err);
      if (!row) return resolve(null);
      try { if (row.raw_json && typeof row.raw_json === 'string') row.raw_json = JSON.parse(row.raw_json); } catch(e){}
      resolve(row);
    });
  });
};

module.exports.addClient = function(client) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`INSERT OR REPLACE INTO clients (ruc, name, address, status, condition, raw_json) VALUES (?,?,?,?,?,?)`);
    const params = [client.ruc || null, client.name || null, client.address || null, client.status || null, client.condition || null, JSON.stringify(client.raw || null)];
    stmt.run(params, function(err) {
      stmt.finalize();
      if (err) return reject(err);
      resolve({ success: true, lastID: this.lastID, changes: this.changes });
    });
  });
};

module.exports.removeClient = function(rucOrId) {
  return new Promise((resolve, reject) => {
    const byId = Number(rucOrId) && Number.isFinite(Number(rucOrId));
    const sql = byId ? 'DELETE FROM clients WHERE id = ?' : 'DELETE FROM clients WHERE ruc = ?';
    db.run(sql, [rucOrId], function(err) {
      if (err) return reject(err);
      resolve({ success: true, changes: this.changes });
    });
  });
};

module.exports.addInvoice = function(invoice) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(`INSERT INTO invoices (client_id, client_ruc, client_name, series, number, date, subtotal, igv, total, glosa, items_json) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
      const params = [
        invoice.client_id || null,
        invoice.client_ruc || null,
        invoice.client_name || null,
        invoice.series || null,
        invoice.number || null,
        invoice.date || null,
        invoice.subtotal || 0,
        invoice.igv || 0,
        invoice.total || 0,
        invoice.glosa || null,
        JSON.stringify(invoice.items || [])
      ];
      stmt.run(params, function(err) {
        stmt.finalize();
        if (err) return reject(err);
        resolve({ success: true, lastID: this.lastID, changes: this.changes });
      });
    } catch (e) { reject(e); }
  });
};

module.exports.addPurchase = function(purchase) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(`INSERT INTO purchases (owner_client_id, provider_id, provider_ruc, provider_name, series, number, date, subtotal, igv, total, glosa, items_json, asiento_json, parsed_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
      const params = [
        purchase.owner_client_id || null,
        purchase.provider_id || null,
        purchase.provider_ruc || null,
        purchase.provider_name || null,
        purchase.series || null,
        purchase.number || null,
        purchase.date || null,
        purchase.subtotal || 0,
        purchase.igv || 0,
        purchase.total || 0,
        purchase.glosa || null,
        JSON.stringify(purchase.items || []),
        JSON.stringify(purchase.asiento || null),
        JSON.stringify(purchase.parsed || null)
      ];
      stmt.run(params, function(err) {
        stmt.finalize();
        if (err) return reject(err);
        resolve({ success: true, lastID: this.lastID, changes: this.changes });
      });
    } catch (e) { reject(e); }
  });
};
