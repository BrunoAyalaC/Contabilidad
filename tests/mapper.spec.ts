import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

const fixturePath = path.resolve(__dirname, '..', 'tmp', 'sunat-10702859676.json');
const consultaPath = path.resolve(__dirname, '..', 'ConsultaSunat', 'consulta-ruc-extended-v2.js');

describe('mapFlatKeysToFields', () => {
  it('maps fixture flatMap to expected parsedFields keys and contains no html fields', async () => {
    const raw = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    const mod = await import(consultaPath);
    const mapFn = mod.mapFlatKeysToFields || mod.default && mod.default.mapFlatKeysToFields || mod.default;
    expect(typeof mapFn).toBe('function');
    const mapped = mapFn(raw.flatMap || {});
    // expected keys (a subset)
    expect(mapped).toHaveProperty('condicion_contribuyente');
    expect(mapped).toHaveProperty('domicilio_fiscal');
    expect(mapped).toHaveProperty('tipo_contribuyente');
    // no html content should be present
    const jsonStr = JSON.stringify(mapped);
    expect(jsonStr.toLowerCase()).not.toContain('<html');
    expect(jsonStr.toLowerCase()).not.toContain('<div');
  });
});
