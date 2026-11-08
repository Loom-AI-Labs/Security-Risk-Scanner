import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateDistribution } from './distribution.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const skill = path.join(root, 'skills/security-risk-review');
const failures = validateDistribution(root, process.env.GITHUB_REF_TYPE === 'tag' ? process.env.GITHUB_REF_NAME : undefined);
function check(ok, message) { if (!ok) failures.push(message); }
function walk(directory) { return fs.readdirSync(directory, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(directory, e.name)) : [path.join(directory, e.name)]); }
const entry = fs.readFileSync(path.join(skill, 'SKILL.md'), 'utf8');
check(/^---\nname: security-risk-review\ndescription: .+\n---\n/.test(entry), 'Missing portable skill frontmatter');
check(entry.split('\n').length < 180, 'Skill entrypoint should use progressive disclosure');
const index = JSON.parse(fs.readFileSync(path.join(skill, 'references/risk-index.json'), 'utf8'));
check(index.families.length === 18 && new Set(index.families.map(x => x.id)).size === 18, 'Expected 18 distinct risk families');
for (const family of index.families) check(fs.existsSync(path.join(skill, 'references', family.card)), `Missing card ${family.id}`);
for (const file of walk(root).filter(x => x.endsWith('.md') && !x.includes(`${path.sep}.git${path.sep}`))) {
  const content = fs.readFileSync(file, 'utf8');
  check((content.match(/^```/gm) || []).length % 2 === 0, `Unbalanced fences in ${path.relative(root, file)}`);
  check(!/^.*[\t ]+$/m.test(content), `Trailing whitespace in ${path.relative(root, file)}`);
  for (const match of content.matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1];
    if (/^(https?:|#|mailto:)/.test(target) || target.includes('<') || target.includes('{{')) continue;
    check(fs.existsSync(path.resolve(path.dirname(file), target.split('#')[0])), `Broken link ${path.relative(root, file)} -> ${target}`);
  }
}
const sources = JSON.parse(fs.readFileSync(path.join(skill, 'references/sources.json'), 'utf8'));
check(Array.isArray(sources.sources) && sources.sources.length > 10, 'Source registry incomplete');
for (const source of sources.sources || []) check(/^https:\/\//.test(source.url), 'Source URL must be direct HTTPS');
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`Package valid: ${index.families.length} risk families, ${sources.sources.length} sources, portable entrypoint and local links.`);
