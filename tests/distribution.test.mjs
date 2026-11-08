import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateDistribution } from '../scripts/distribution.mjs';

const source = fileURLToPath(new URL('..', import.meta.url));
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'security-distribution-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const name of ['package.json', 'plugin.json', '.codex-plugin', '.claude-plugin', '.agents', 'LICENSE', 'NOTICE', 'release-notes', 'skills/security-risk-review/LICENSE', 'skills/security-risk-review/NOTICE']) {
    const destination = path.join(root, name);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.cpSync(path.join(source, name), destination, { recursive: true });
  }
  const edit = (name, mutate) => {
    const file = path.join(root, name);
    const value = JSON.parse(fs.readFileSync(file, 'utf8'));
    mutate(value);
    fs.writeFileSync(file, JSON.stringify(value));
  };
  return { root, edit };
}

test('all distribution routes share identity, license, version, and canonical paths', () => {
  assert.deepEqual(validateDistribution(source, 'v0.1.0'), []);
  assert.ok(validateDistribution(source, 'v0.2.0').some(x => x.includes('Release tag')));
});

test('manifest drift and unexpected runtime behavior fail distribution validation', t => {
  const { root, edit } = fixture(t);
  edit('.claude-plugin/plugin.json', x => { x.version = '99.0.0'; x.hooks = './hooks.json'; });
  const failures = validateDistribution(root);
  assert.ok(failures.some(x => x.includes('claude version')));
  assert.ok(failures.some(x => x.includes('automatic tools')));
});

test('escaping marketplace paths and missing direct-install notices are rejected', t => {
  const { root, edit } = fixture(t);
  edit('.agents/plugins/marketplace.json', x => { x.plugins[0].source.path = '../other'; });
  fs.unlinkSync(path.join(root, 'skills/security-risk-review/LICENSE'));
  const failures = validateDistribution(root);
  assert.ok(failures.some(x => x.includes('resolve to the repository root')));
  assert.ok(failures.some(x => x.includes('Missing distribution notice')));
});

test('malformed catalogs and inconsistent notices do not pass validation', t => {
  const { root } = fixture(t);
  fs.writeFileSync(path.join(root, '.claude-plugin/marketplace.json'), '{');
  fs.writeFileSync(path.join(root, 'skills/security-risk-review/NOTICE'), 'different publisher');
  const failures = validateDistribution(root);
  assert.ok(failures.some(x => x.includes('Missing or invalid JSON')));
  assert.ok(failures.some(x => x.includes('NOTICE must travel unchanged')));
});
