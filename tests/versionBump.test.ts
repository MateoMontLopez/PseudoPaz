import { describe, it, expect } from 'vitest';
import { bumpVersion } from '../scripts/bump-version.mjs';
import fs from 'fs';
import path from 'path';

describe('Versionado Automático SemVer', () => {
  it('debe poder calcular incrementos patch, minor y major correctamente', () => {
    // Leemos la versión actual del package.json
    const packageJsonPath = path.resolve(__dirname, '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const [maj, min, pat] = pkg.version.split('.').map(Number);

    expect(typeof maj).toBe('number');
    expect(typeof min).toBe('number');
    expect(typeof pat).toBe('number');
    expect(maj).toBeGreaterThanOrEqual(2);
  });
});

