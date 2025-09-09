import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const fixturePath = path.resolve(__dirname, '..', 'tmp', 'sunat-10702859676.json');
const mod = require(path.resolve(__dirname, '..', 'ConsultaSunat', 'consulta-ruc-extended-v2.js'));
const mapFlatKeysToFields = mod.mapFlatKeysToFields || mod.mapFlatKeysToFields;

describe('mapFlatKeysToFields', () => {
  it('maps fields from fixture without throwing and returns expected keys', () => {
    const raw = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    const flat = raw.flatMap || raw.flatMap || raw.flatMap;
    // call helper
    const mapped = mapFlatKeysToFields(flat || {});
    // basic expectations: keys exist
    expect(mapped).toBeDefined();
    expect(Object.prototype.hasOwnProperty.call(mapped, 'tipo_contribuyente')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(mapped, 'fecha_inscripcion')).toBe(true);
    // some known values from the fixture
    expect(mapped.fecha_inscripcion).toBeTruthy();
  });
});
