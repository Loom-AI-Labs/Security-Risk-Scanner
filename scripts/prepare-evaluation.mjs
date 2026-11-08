import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const output = args[0];
if (!output || args.length !== 1) { console.error('Usage: node scripts/prepare-evaluation.mjs NEW_OUTPUT_DIRECTORY'); process.exit(1); }
const destination = path.resolve(output);
if (fs.existsSync(destination)) { console.error('Evaluation output already exists'); process.exit(1); }
const corpus = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../tests/fixtures/cases.json', import.meta.url)), 'utf8'));
fs.mkdirSync(destination, { recursive: false, mode: 0o700 });
fs.mkdirSync(path.join(destination, 'inputs'));
const oracle = [];
for (let i = 0; i < corpus.pairs.length; i++) {
  const pair = corpus.pairs[i];
  // Mix presentation order. No answer/risk labels are included in input names.
  for (const [j, variant] of (i % 2 ? ['safe', 'unsafe'] : ['unsafe', 'safe']).entries()) {
    const sample = `sample-${String(i * 2 + j + 1).padStart(2, '0')}.txt`;
    fs.writeFileSync(path.join(destination, 'inputs', sample), pair[variant]);
    oracle.push({ sample, pair: pair.id, risk: pair.risk, variant, expected: pair.expected });
  }
}
fs.writeFileSync(path.join(destination, 'oracle.json'), `${JSON.stringify(oracle, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify({ inputDirectory: path.join(destination, 'inputs'), samples: oracle.length, oracle: 'Withhold oracle.json from the evaluating assistant.' }));
