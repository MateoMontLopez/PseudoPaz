import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const hooksDir = path.join(rootDir, '.git', 'hooks');

if (fs.existsSync(hooksDir)) {
  // 1. Hook post-merge: se ejecuta automáticamente tras cualquier `git merge`
  const postMergePath = path.join(hooksDir, 'post-merge');
  const postMergeScript = `#!/bin/sh
node scripts/git-hook-auto-bump.mjs
`;
  fs.writeFileSync(postMergePath, postMergeScript, { mode: 0o755 });
  try {
    fs.chmodSync(postMergePath, '755');
  } catch {}

  console.log('[Git Hooks] Hook post-merge configurado en .git/hooks/post-merge');

  // 2. Hook pre-push: valida antes de empujar a origin main
  const prePushPath = path.join(hooksDir, 'pre-push');
  const prePushScript = `#!/bin/sh
node scripts/git-hook-auto-bump.mjs
`;
  fs.writeFileSync(prePushPath, prePushScript, { mode: 0o755 });
  try {
    fs.chmodSync(prePushPath, '755');
  } catch {}

  console.log('[Git Hooks] Hook pre-push configurado en .git/hooks/pre-push');
} else {
  console.log('[Git Hooks] No se encontró el directorio .git/hooks (entorno no-git o CI).');
}

