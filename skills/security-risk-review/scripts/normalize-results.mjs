import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { emit, main, parseArgs } from './common.mjs';

const id = value => typeof value === 'string' && /^[A-Za-z0-9_.:/-]{1,180}$/.test(value) ? value : 'untrusted-or-missing-id';
const safePath = value => {
  if (typeof value !== 'string' || value.length > 400 || /[\x00-\x1f\\?#]/.test(value) || path.isAbsolute(value) || /^[a-z]+:/i.test(value)) return null;
  let decoded;
  try { decoded = decodeURIComponent(value); } catch { return null; }
  if (decoded.split('/').includes('..') || /[\x00-\x1f\\?#]/.test(decoded) || /^[a-z]+:/i.test(decoded) || path.isAbsolute(decoded)) return null;
  return decoded;
};
const line = value => Number.isSafeInteger(value) && value > 0 ? value : null;

export function normalize(data, format) {
  const candidates = [], errors = [];
  if (format === 'sarif') {
    if (!Array.isArray(data.runs)) throw new Error('Invalid SARIF runs');
    for (const run of data.runs) {
      if (run.invocations?.some(x => x.executionSuccessful === false)) errors.push({ code: 'SCANNER_EXECUTION_FAILED' });
      for (const result of run.results || []) {
        const loc = result.locations?.[0]?.physicalLocation;
        candidates.push({ ruleId: id(result.ruleId), path: safePath(loc?.artifactLocation?.uri), line: line(loc?.region?.startLine), status: 'unverified-tool-lead' });
      }
    }
  } else if (format === 'semgrep') {
    if (!Array.isArray(data.results)) throw new Error('Invalid Semgrep results');
    if (Array.isArray(data.errors) && data.errors.length) errors.push({ code: 'SCANNER_ERRORS', count: data.errors.length });
    for (const result of data.results) candidates.push({ ruleId: id(result.check_id), path: safePath(result.path), line: line(result.start?.line), status: 'unverified-tool-lead' });
  } else if (format === 'osv') {
    if (!Array.isArray(data.results)) throw new Error('Invalid OSV results');
    for (const result of data.results) for (const pkg of result.packages || []) for (const vulnerability of pkg.vulnerabilities || []) {
      candidates.push({ advisoryId: id(vulnerability.id), path: safePath(result.source?.path), status: 'dependency-advisory-not-reachability-proof' });
    }
  } else throw new Error('Unsupported normalization format');
  return { schemaVersion: 1, kind: 'normalized-unverified-tool-leads', format, candidates, errors, warning: 'Messages, snippets and arbitrary properties discarded. IDs/paths remain untrusted metadata, not proven findings or guaranteed secret-free data.' };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(() => {
  const args = parseArgs(process.argv.slice(2), ['format', 'input', 'out', 'help']);
  if (args.help) { console.log('normalize-results.mjs --format sarif|semgrep|osv --input INPUT [--out NEW_JSON]'); return; }
  if (!args.input) throw new Error('--input is required');
  const stat = fs.lstatSync(args.input);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 10485760) throw new Error('Input must be a regular JSON file no larger than 10 MiB');
  emit(normalize(JSON.parse(fs.readFileSync(args.input, 'utf8')), args.format), args.out);
});
