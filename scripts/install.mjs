import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../skills/security-risk-review', import.meta.url));
const args = process.argv.slice(2);
let agent, project, user = false;
const exists = file => { try { fs.lstatSync(file); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } };
try {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--agent') { if (agent) throw new Error('Repeated agent'); agent = args[++i]; }
    else if (args[i] === '--project') { if (project) throw new Error('Repeated project'); project = args[++i]; }
    else if (args[i] === '--user') user = true;
    else throw new Error('Use --agent codex|claude|both and exactly one of --project PATH or --user');
  }
  if (!['codex', 'claude', 'both'].includes(agent) || Boolean(project) === user) throw new Error('Use --agent codex|claude|both and exactly one of --project PATH or --user');
  const root = fs.realpathSync(user ? os.homedir() : path.resolve(project));
  if (!fs.statSync(root).isDirectory()) throw new Error('Installation root must be a directory');
  const hosts = agent === 'both' ? ['codex', 'claude'] : [agent];
  const destinations = hosts.map(host => path.join(root, host === 'codex' ? '.agents' : '.claude', 'skills', 'security-risk-review'));
  // Preflight every destination before making either installation.
  for (const destination of destinations) {
    if (exists(destination) || exists(path.dirname(destination)) && fs.lstatSync(path.dirname(destination)).isSymbolicLink()) throw new Error('Refusing existing installation or symlinked parent');
    for (let cursor = path.dirname(destination); cursor !== root; cursor = path.dirname(cursor)) if (exists(cursor) && fs.lstatSync(cursor).isSymbolicLink()) throw new Error('Refusing symlinked installation path');
  }
  for (const destination of destinations) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.cpSync(source, destination, { recursive: true, errorOnExist: true, force: false, dereference: false, filter: src => !fs.lstatSync(src).isSymbolicLink() });
    console.log(`Installed ${destination}`);
  }
} catch (error) { console.error(`Installation failed: ${error.code || error.message}`); process.exitCode = 1; }
