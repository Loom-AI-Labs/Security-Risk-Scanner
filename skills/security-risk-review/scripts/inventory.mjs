import path from 'node:path';
import { collect, emit, main, parseArgs, readBounded } from './common.mjs';

main(() => {
  const args = parseArgs(process.argv.slice(2), ['root', 'scope', 'out', 'max-files', 'max-bytes', 'help']);
  if (args.help) { console.log('inventory.mjs --root ROOT [--scope PATH] [--out NEW_JSON] [--max-files N] [--max-bytes N]'); return; }
  const inventory = collect(args);
  const extensions = {}, manifests = [], frameworks = new Set();
  const known = { express: 'Express', '@nestjs/core': 'Nest', fastify: 'Fastify', koa: 'Koa', next: 'Next', react: 'React', '@hapi/hapi': 'Hapi', hono: 'Hono' };
  for (const file of inventory.files) {
    const extension = path.extname(file.path) || '(none)';
    extensions[extension] = (extensions[extension] || 0) + 1;
    const name = path.basename(file.path);
    if (['pom.xml', 'build.gradle', 'build.gradle.kts', 'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'Dockerfile'].includes(name)) manifests.push(file.path);
    if (name !== 'package.json') continue;
    try {
      const data = JSON.parse(readBounded(inventory.root, file.path, inventory.limits.maxBytes) || '{}');
      for (const dependency of Object.keys({ ...data.dependencies, ...data.devDependencies })) if (known[dependency]) frameworks.add(known[dependency]);
    } catch { inventory.errors.push({ path: file.path, code: 'MANIFEST_READ_OR_PARSE_ERROR' }); }
  }
  emit({ schemaVersion: 1, kind: 'source-inventory', generatedAt: new Date().toISOString(), ...inventory, extensions, manifests, frameworkHints: [...frameworks].sort(), warning: 'Metadata inventory only. No security verdict; versions and effective controls require review.' }, args.out);
});
