import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('paired corpus covers 18 families and preparation withholds answer labels from inputs', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'review-corpus-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const script = fileURLToPath(new URL('../scripts/prepare-evaluation.mjs', import.meta.url));
  const destination = path.join(root, 'evaluation');
  const result = spawnSync(process.execPath, [script, destination], { encoding: 'utf8' });
  assert.equal(result.status, 0);
  const oracle = JSON.parse(fs.readFileSync(path.join(destination, 'oracle.json'), 'utf8'));
  assert.equal(oracle.length, 40);
  assert.equal(new Set(oracle.map(x => x.risk)).size, 18);
  for (const row of oracle) {
    assert.match(row.sample, /^sample-\d{2}\.txt$/);
    const text = fs.readFileSync(path.join(destination, 'inputs', row.sample), 'utf8');
    assert.ok(text.length > 50); assert.ok(!text.includes(row.expected));
  }
  assert.notEqual(spawnSync(process.execPath, [script, destination]).status, 0);
  // Corpus validation is not a claim about the assistant's detection accuracy.
});
