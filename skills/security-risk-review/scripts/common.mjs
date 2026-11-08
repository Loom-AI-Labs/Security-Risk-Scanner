import fs from 'node:fs';
import path from 'node:path';

const excludedDirectories = new Set(['.git', 'node_modules', 'target', 'build', 'dist', '.next', '.nuxt', 'coverage', '.gradle', '.idea', 'vendor']);
const excludedFiles = /(^\.env(?:\.|$)|\.private\.|_private\.|(?:^|[-_.])(?:credentials|keystore)(?:[-_.]|$)|\.(?:pem|key|p12|pfx|jks)$|^(?:id_rsa|id_ed25519)$)/i;
export const textExtensions = new Set(['.java', '.kt', '.groovy', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.json', '.xml', '.yml', '.yaml', '.properties', '.gradle', '.sql', '.tf', '.sh', '.conf', '.html', '.jsp', '.ftl', '.mustache', '.ejs', '.hbs', '.pug', '.vue', '.svelte', '.astro', '.gql', '.graphql']);

export function parseArgs(argv, allowed) {
  const args = { scope: [] };
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (!key.startsWith('--') || !allowed.includes(key.slice(2))) throw new Error(`Unsupported argument: ${key}`);
    const name = key.slice(2);
    if (name === 'help') { args.help = true; continue; }
    const value = argv[++i];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${key}`);
    if (name === 'scope') args.scope.push(value);
    else if (args[name] !== undefined) throw new Error(`Repeated argument: ${key}`);
    else args[name] = value;
  }
  return args;
}

export function positive(value, fallback, name) {
  if (value === undefined) return fallback;
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) throw new Error(`${name} must be a positive safe integer`);
  return Number(value);
}

export function contained(root, target) {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

export function isPrivate(relative) {
  return relative.split(/[\\/]/).some(part => excludedFiles.test(part));
}

export function readBounded(root, relative, maxBytes) {
  const absolute = path.resolve(root, relative);
  if (!contained(root, absolute) || !contained(root, fs.realpathSync(absolute))) throw new Error('Path escapes reviewed root');
  const fd = fs.openSync(absolute, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const stat = fs.fstatSync(fd);
    if (!stat.isFile() || stat.size > maxBytes) return null;
    const buffer = Buffer.alloc(Math.min(stat.size + 1, maxBytes + 1));
    const count = fs.readSync(fd, buffer, 0, buffer.length, 0);
    if (count > maxBytes) return null;
    const bytes = buffer.subarray(0, count);
    if (bytes.includes(0)) return null;
    return bytes.toString('utf8');
  } finally { fs.closeSync(fd); }
}

export function collect(args) {
  if (!args.root) throw new Error('--root is required');
  const root = fs.realpathSync(path.resolve(args.root));
  if (!fs.statSync(root).isDirectory()) throw new Error('Root must be a directory');
  const maxFiles = positive(args['max-files'], 20000, 'max-files');
  const maxBytes = positive(args['max-bytes'], 1048576, 'max-bytes');
  const files = [], skipped = [], errors = [], seen = new Set();
  let truncated = false, skippedCount = 0;
  const out = args.out ? path.resolve(args.out) : null;
  function skip(file, reason) {
    skippedCount++;
    if (skipped.length < 500) skipped.push({ path: file, reason });
  }
  function visit(absolute) {
    if (truncated) return;
    const relative = path.relative(root, absolute).split(path.sep).join('/') || '.';
    if (seen.has(relative)) return;
    seen.add(relative);
    try {
      if (!contained(root, absolute)) throw new Error('Scope escapes root');
      const stat = fs.lstatSync(absolute);
      if (stat.isSymbolicLink()) { skip(relative, 'symlink'); return; }
      if (absolute === out) { skip(relative, 'output'); return; }
      if (isPrivate(relative)) { skip(relative, 'private-or-credential-path'); return; }
      if (stat.isDirectory()) {
        if (relative !== '.' && excludedDirectories.has(path.basename(absolute))) { skip(relative, 'generated-vendor-or-git'); return; }
        if (!contained(root, fs.realpathSync(absolute))) { skip(relative, 'external-realpath'); return; }
        for (const name of fs.readdirSync(absolute).sort()) {
          visit(path.join(absolute, name));
          if (truncated) break;
        }
      } else if (stat.isFile()) {
        if (files.length >= maxFiles) { truncated = true; return; }
        if (stat.size > maxBytes) { skip(relative, 'per-file-byte-limit'); return; }
        files.push({ path: relative, bytes: stat.size });
      } else skip(relative, 'non-regular-file');
    } catch (error) { errors.push({ path: relative, code: error.code || 'READ_ERROR' }); }
  }
  for (const scope of args.scope.length ? args.scope : ['.']) {
    const absolute = path.resolve(root, scope);
    if (!contained(root, absolute)) throw new Error('Scope escapes root');
    // Reject symlinked ancestors, including when an explicit scope names a child.
    let cursor = absolute;
    while (cursor !== root) {
      if (fs.existsSync(cursor) && fs.lstatSync(cursor).isSymbolicLink()) throw new Error('Symlinked scope is not allowed');
      cursor = path.dirname(cursor);
    }
    visit(absolute);
    if (truncated) break;
  }
  return { root, scopes: args.scope.length ? args.scope : ['.'], files, skipped, skippedCount, errors, limits: { maxFiles, maxBytes }, truncated };
}

export function emit(value, output) {
  const json = `${JSON.stringify(value, null, 2)}\n`;
  if (output) fs.writeFileSync(path.resolve(output), json, { flag: 'wx', mode: 0o600 });
  else process.stdout.write(json);
}

export function main(action) {
  try { action(); }
  catch (error) {
    // Avoid echoing input payloads or arbitrary filesystem content in diagnostics.
    process.stderr.write(`Security helper failed: ${error instanceof SyntaxError ? 'INVALID_JSON' : error.code || error.message}\n`);
    process.exitCode = 1;
  }
}
