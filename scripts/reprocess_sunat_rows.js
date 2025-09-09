#!/usr/bin/env node
/**
 * Reprocesa filas de la tabla sunat_ruc usando raw_json
 * Actualiza parsedFields en la fila aplicando mapFlatKeysToFields
 */
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadMaybeCjs(modulePath) {
  const mod = await import(modulePath);
  return mod;
}

function pickExport(mod, name) {
  if (!mod) return undefined;
  if (mod[name]) return mod[name];
  if (mod.default && typeof mod.default === 'object' && mod.default[name]) return mod.default[name];
  if (typeof mod.default === 'function' && name === 'default') return mod.default;
  return undefined;
}

async function main() {
  try {
    const dbPath = path.resolve(__dirname, '..', 'lib', 'database.cjs');
    const dbModule = await loadMaybeCjs(`file://${dbPath}`);
    const initDb = pickExport(dbModule, 'initDatabase') || dbModule.initDatabase || (dbModule.default && dbModule.default.initDatabase);
    const getAll = pickExport(dbModule, 'getAllSunatRows') || dbModule.getAllSunatRows || (dbModule.default && dbModule.default.getAllSunatRows);
    const updateFn = pickExport(dbModule, 'updateSunatParsed') || dbModule.updateSunatParsed || (dbModule.default && dbModule.default.updateSunatParsed);

    if (initDb) initDb();
    if (!getAll || !updateFn) {
      console.error('La API de DB no expone getAllSunatRows/updateSunatParsed. Abortando.');
      process.exit(2);
    }

    const consultaPath = path.resolve(__dirname, '..', 'ConsultaSunat', 'consulta-ruc-extended-v2.js');
    const consultaModule = await loadMaybeCjs(`file://${consultaPath}`);
    const mapFn = pickExport(consultaModule, 'mapFlatKeysToFields') || consultaModule.mapFlatKeysToFields || consultaModule.mapFlatKeysToFields || consultaModule.default && consultaModule.default.mapFlatKeysToFields;
    if (!mapFn) {
      console.error('No se encontró mapFlatKeysToFields en consulta-ruc-extended-v2.js');
      process.exit(3);
    }

    const rows = await getAll();
    console.log(`Rows to process: ${rows.length}`);
    let updated = 0;
    for (const row of rows) {
      try {
        const raw = row.raw_json || row.raw || null;
        if (!raw) continue;
        const flat = raw.flatMap || raw.flat || null;
        if (!flat) continue;
        const mapped = mapFn(flat);
        // update parsedFields JSON in DB
        const res = await updateFn(row.id || row.rowid || row.ruc, mapped);
        if (res && (res.changes || res.success)) updated++;
      } catch (e) {
        console.warn('failed row', row.id || row.ruc, e.message || e);
      }
    }
    console.log('Reprocess completed. Updated:', updated);
    process.exit(0);
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

main();
