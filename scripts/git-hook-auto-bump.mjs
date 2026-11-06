import { execSync } from 'child_process';
import { bumpVersion } from './bump-version.mjs';

function run() {
  try {
    // 1. Obtener la rama actual
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();

    if (currentBranch !== 'main') {
      // Solo automatizar versionado cuando se esté en la rama main
      return;
    }

    // 2. Verificar si el último commit ya modificó package.json
    let diffOutput = '';
    try {
      diffOutput = execSync('git diff HEAD~1 HEAD --name-only package.json', {
        encoding: 'utf8',
      }).trim();
    } catch {
      // Si es el primer commit del repo o falla diff, continuamos
    }

    if (diffOutput.includes('package.json')) {
      console.log('[Auto-Bump] package.json ya fue actualizado en el último commit de main.');
      return;
    }

    // 3. Incrementar la versión
    console.log('[Auto-Bump] Detectado cambio en main sin actualización de versión. Incrementando versión...');
    const { nextPlatformVersion } = bumpVersion('patch');

    // 4. Agregar y commitear automáticamente los archivos de versión
    execSync('git add package.json package-lock.json src/constants/platform.ts', { stdio: 'inherit' });
    execSync(`git commit -m "chore(release): bump version to ${nextPlatformVersion} [skip ci]"`, {
      stdio: 'inherit',
    });

    console.log(`[Auto-Bump] Commit generado exitosamente para ${nextPlatformVersion}`);
  } catch (err) {
    console.error('[Auto-Bump] Error al procesar versionado automático:', err.message);
  }
}

run();

