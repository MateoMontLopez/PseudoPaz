import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const packageJsonPath = path.join(rootDir, 'package.json');
const packageLockPath = path.join(rootDir, 'package-lock.json');
const platformConstantsPath = path.join(rootDir, 'src', 'constants', 'platform.ts');

export function bumpVersion(type = 'patch') {
  if (!fs.existsSync(packageJsonPath)) {
    console.error('Error: no se encontró package.json en', packageJsonPath);
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const currentVersion = packageJson.version || '1.0.0';
  const parts = currentVersion.split('.').map((p) => parseInt(p, 10));

  if (parts.length !== 3 || parts.some(isNaN)) {
    console.error(`Error: formato de versión semver inválido en package.json: "${currentVersion}"`);
    process.exit(1);
  }

  let [major, minor, patch] = parts;

  if (type === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (type === 'minor') {
    minor += 1;
    patch = 0;
  } else {
    // Por defecto incremento de patch
    patch += 1;
  }

  const nextVersion = `${major}.${minor}.${patch}`;
  const nextPlatformVersion = `v${nextVersion}`;

  // 1. Actualizar package.json
  packageJson.version = nextVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');

  // 2. Actualizar package-lock.json si existe
  if (fs.existsSync(packageLockPath)) {
    try {
      const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));
      packageLock.version = nextVersion;
      if (packageLock.packages && packageLock.packages['']) {
        packageLock.packages[''].version = nextVersion;
      }
      fs.writeFileSync(packageLockPath, JSON.stringify(packageLock, null, 2) + '\n', 'utf8');
    } catch (e) {
      console.warn('Aviso: no se pudo actualizar package-lock.json:', e);
    }
  }

  // 3. Actualizar src/constants/platform.ts
  if (fs.existsSync(platformConstantsPath)) {
    let content = fs.readFileSync(platformConstantsPath, 'utf8');
    const versionRegex = /export const PLATFORM_VERSION = ['"][^'"]+['"];/;
    if (versionRegex.test(content)) {
      content = content.replace(
        versionRegex,
        `export const PLATFORM_VERSION = '${nextPlatformVersion}';`
      );
      fs.writeFileSync(platformConstantsPath, content, 'utf8');
    } else {
      console.warn('Aviso: no se encontró PLATFORM_VERSION en platform.ts');
    }
  }

  console.log(`[Version Bump] ${currentVersion} -> ${nextVersion} (${nextPlatformVersion})`);
  return { currentVersion, nextVersion, nextPlatformVersion };
}

// Si se ejecuta directamente desde la línea de comandos
if (process.argv[1] === __filename) {
  const bumpType = process.argv[2] || 'patch';
  bumpVersion(bumpType);
}

