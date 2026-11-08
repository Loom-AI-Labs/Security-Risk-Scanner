import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { normalize } from '../skills/security-risk-review/scripts/normalize-results.mjs';

const scripts = fileURLToPath(new URL('../skills/security-risk-review/scripts/', import.meta.url));
const installer = fileURLToPath(new URL('../scripts/install.mjs', import.meta.url));
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'security-skill-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const put = (name, content) => { fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true }); fs.writeFileSync(path.join(root, name), content); };
  return { root, put };
}
const run = (script, ...args) => spawnSync(process.execPath, [path.join(scripts, script), ...args], { encoding: 'utf8' });

test('inventory scopes files, includes hidden CI, excludes private/generated files without reading them', t => {
  const { root, put } = fixture(t);
  put('src/a.java', 'class A {}'); put('.github/workflows/build.yml', 'permissions: read-all');
  put('node_modules/evil.js', 'process.exit(99)'); put('.env', 'PASSWORD=SYNTHETIC_SECRET');
  put('notes/CONFIG_PRIVATE.md', 'SYNTHETIC_SECRET');
  const result = run('inventory.mjs', '--root', root);
  assert.equal(result.status, 0);
  const data = JSON.parse(result.stdout);
  assert.deepEqual(data.files.map(x => x.path), ['.github/workflows/build.yml', 'src/a.java']);
  assert.equal(data.skippedCount, 3);
  assert.ok(!result.stdout.includes('SYNTHETIC_SECRET'));
});

test('explicit external and symlinked scopes are rejected', t => {
  const { root, put } = fixture(t); put('src/a.ts', 'fetch(url)');
  assert.notEqual(run('discover.mjs', '--root', root, '--scope', '../').status, 0);
  fs.symlinkSync(path.dirname(root), path.join(root, 'outside'));
  assert.notEqual(run('discover.mjs', '--root', root, '--scope', 'outside/anything').status, 0);
  const data = JSON.parse(run('inventory.mjs', '--root', root).stdout);
  assert.ok(data.skipped.some(x => x.path === 'outside' && x.reason === 'symlink'));
});

test('multiple scopes deduplicate files and report nonexisting paths', t => {
  const { root, put } = fixture(t); put('src/a.ts', 'fetch(url)');
  const data = JSON.parse(run('inventory.mjs', '--root', root, '--scope', 'src', '--scope', 'src/a.ts', '--scope', 'absent').stdout);
  assert.equal(data.files.length, 1); assert.equal(data.errors[0].code, 'ENOENT');
});

test('discovery emits locations only and does not decide unsafe versus safe', t => {
  const { root, put } = fixture(t);
  put('src/unsafe.ts', 'const accessToken="SYNTHETIC_DO_NOT_PRINT";\nfetch(input.url);');
  put('src/safe.ts', 'fetch("https://fixed.example.invalid/feed");');
  const result = run('discover.mjs', '--root', root);
  const data = JSON.parse(result.stdout);
  assert.ok(data.candidates.some(x => x.path === 'src/unsafe.ts' && x.line === 2 && x.riskIds.includes('R06')));
  assert.ok(data.candidates.some(x => x.path === 'src/safe.ts' && x.riskIds.includes('R06')));
  assert.ok(data.candidates.every(x => x.status === 'unverified-lead' && !('snippet' in x)));
  assert.ok(!result.stdout.includes('SYNTHETIC_DO_NOT_PRINT'));
  assert.ok(!result.stdout.includes('https://fixed'));
});

test('file, byte and lead budgets are explicit partial coverage', t => {
  const { root, put } = fixture(t); put('a.ts', 'fetch(url);\nfetch(url);'); put('b.ts', 'fetch(url);'); put('c.ts', 'x'.repeat(200));
  const files = JSON.parse(run('inventory.mjs', '--root', root, '--max-files', '1').stdout);
  assert.equal(files.truncated, true); assert.equal(files.files.length, 1);
  const bytes = JSON.parse(run('discover.mjs', '--root', root, '--max-bytes', '100', '--max-total-bytes', '1').stdout);
  assert.equal(bytes.truncated, true); assert.equal(bytes.candidates.length, 0);
  assert.ok(bytes.skipped.some(x => x.reason === 'per-file-byte-limit'));
  const leads = JSON.parse(run('discover.mjs', '--root', root, '--max-leads', '1').stdout);
  assert.equal(leads.truncated, true); assert.equal(leads.candidates.length, 1);
  assert.ok(leads.inspected.some(x => !x.complete));
});

test('unsafe numeric arguments are rejected and source is never overwritten', t => {
  const { root, put } = fixture(t); put('src/a.ts', 'fetch(url);');
  for (const value of ['0', '-1', 'Infinity', '1.2', '99999999999999999999']) assert.notEqual(run('inventory.mjs', '--root', root, '--max-files', value).status, 0);
  const file = path.join(root, 'src/a.ts');
  assert.notEqual(run('inventory.mjs', '--root', root, '--out', file).status, 0);
  assert.equal(fs.readFileSync(file, 'utf8'), 'fetch(url);');
});

test('new report is private and does not overwrite a previous report', t => {
  const { root, put } = fixture(t); put('a.java', 'class A {}');
  const out = path.join(root, 'report.json');
  assert.equal(run('inventory.mjs', '--root', root, '--out', out).status, 0);
  assert.equal(fs.statSync(out).mode & 0o777, 0o600);
  assert.notEqual(run('inventory.mjs', '--root', root, '--out', out).status, 0);
});

test('manifest inventory emits known framework hints, not scripts or dependency values', t => {
  const { root, put } = fixture(t);
  put('package.json', JSON.stringify({ scripts: { prepare: 'echo SYNTHETIC_SECRET' }, dependencies: { express: 'https://user:SYNTHETIC_SECRET@example.invalid/repo' } }));
  const result = run('inventory.mjs', '--root', root);
  assert.deepEqual(JSON.parse(result.stdout).frameworkHints, ['Express']);
  assert.ok(!result.stdout.includes('SYNTHETIC_SECRET'));
});

test('malformed JSON diagnostics do not echo its sensitive contents', t => {
  const { root, put } = fixture(t); put('bad.json', '{"token":"SYNTHETIC_SECRET" invalid');
  const result = run('normalize-results.mjs', '--format', 'sarif', '--input', path.join(root, 'bad.json'));
  assert.notEqual(result.status, 0); assert.ok(!result.stderr.includes('SYNTHETIC_SECRET')); assert.match(result.stderr, /INVALID_JSON/);
});

test('SARIF normalizer strips source/messages/properties and retains scanner failures', () => {
  const output = normalize({ runs: [{ invocations: [{ executionSuccessful: false }], results: [{ ruleId: 'example/R02', message: { text: 'SYNTHETIC_SECRET' }, properties: { token: 'SYNTHETIC_SECRET' }, locations: [{ physicalLocation: { artifactLocation: { uri: 'src/A.java' }, region: { startLine: 4, snippet: { text: 'SYNTHETIC_SECRET' } } } }] }] }] }, 'sarif');
  assert.equal(output.candidates[0].path, 'src/A.java'); assert.equal(output.candidates[0].line, 4);
  assert.equal(output.errors[0].code, 'SCANNER_EXECUTION_FAILED'); assert.ok(!JSON.stringify(output).includes('SYNTHETIC_SECRET'));
});

test('normalizer rejects external, traversal, encoded traversal and hostile path metadata', () => {
  for (const file of ['/etc/passwd', '../secrets', '%2e%2e/secrets', 'file:///tmp/a', 'https://a/b', '%68ttps://a/b', 'a\\b', 'a?token=foo', 'a%3ftoken=foo']) {
    const output = normalize({ results: [{ check_id: 'R06', path: file, start: { line: 1 } }] }, 'semgrep');
    assert.equal(output.candidates[0].path, null);
  }
});

test('dependency results do not imply reachability and preserve advisory IDs only', () => {
  const output = normalize({ results: [{ source: { path: 'package-lock.json' }, packages: [{ package: { name: 'SYNTHETIC_SECRET' }, vulnerabilities: [{ id: 'CVE-2099-0001', details: 'SYNTHETIC_SECRET' }] }] }] }, 'osv');
  assert.equal(output.candidates[0].advisoryId, 'CVE-2099-0001');
  assert.equal(output.candidates[0].status, 'dependency-advisory-not-reachability-proof');
  assert.ok(!JSON.stringify(output).includes('SYNTHETIC_SECRET'));
});

test('installer supports both hosts and refuses overwrite', t => {
  const { root } = fixture(t);
  const install = () => spawnSync(process.execPath, [installer, '--agent', 'both', '--project', root], { encoding: 'utf8' });
  assert.equal(install().status, 0);
  for (const host of ['.agents', '.claude']) assert.ok(fs.existsSync(path.join(root, host, 'skills/security-risk-review/SKILL.md')));
  assert.notEqual(install().status, 0);
});

test('installer preflights both host destinations and rejects symlink parents', t => {
  const { root } = fixture(t);
  fs.symlinkSync(os.tmpdir(), path.join(root, '.claude'));
  const result = spawnSync(process.execPath, [installer, '--agent', 'both', '--project', root], { encoding: 'utf8' });
  assert.notEqual(result.status, 0); assert.equal(fs.existsSync(path.join(root, '.agents')), false);
});

test('installer refuses dangling destination links without modifying their target', t => {
  const { root } = fixture(t);
  const parent = path.join(root, '.agents/skills'); fs.mkdirSync(parent, { recursive: true });
  const target = path.join(root, 'not-created');
  fs.symlinkSync(target, path.join(parent, 'security-risk-review'));
  const result = spawnSync(process.execPath, [installer, '--agent', 'codex', '--project', root], { encoding: 'utf8' });
  assert.notEqual(result.status, 0); assert.equal(fs.existsSync(target), false);
});
