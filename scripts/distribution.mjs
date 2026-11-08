import fs from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';

export function validateDistribution(root, releaseTag) {
  const failures = [];
  const check = (ok, message) => { if (!ok) failures.push(message); };
  const read = name => {
    try { return JSON.parse(fs.readFileSync(path.join(root, name), 'utf8')); }
    catch { failures.push(`Missing or invalid JSON: ${name}`); return {}; }
  };
  const pkg = read('package.json');
  const portable = read('plugin.json');
  const codex = read('.codex-plugin/plugin.json');
  const claude = read('.claude-plugin/plugin.json');
  const codexCatalog = read('.agents/plugins/marketplace.json');
  const claudeCatalog = read('.claude-plugin/marketplace.json');

  check(pkg.name === 'security-risk-scanner', 'Package identity differs from published plugin');
  check(/^\d+\.\d+\.\d+$/.test(pkg.version), 'Expected a stable semantic version');
  check(pkg.license === 'Apache-2.0', 'Package must retain the repository license');
  check(portable.$schema === 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json', 'Missing portable plugin schema');
  for (const [label, manifest] of [['portable', portable], ['codex', codex], ['claude', claude]]) {
    check(manifest.name === pkg.name, `${label} identity mismatch`);
    check(manifest.version === pkg.version, `${label} version mismatch`);
    check(manifest.license === pkg.license, `${label} license mismatch`);
    check(manifest.author?.name === 'Loom AI Labs', `${label} publisher mismatch`);
    check(manifest.repository === 'https://github.com/Loom-AI-Labs/Security-Risk-Scanner', `${label} repository mismatch`);
    for (const key of ['hooks', 'mcpServers', 'apps', 'commands', 'dependencies', 'settings']) {
      check(!(key in manifest), `${label} unexpectedly declares automatic tools or extra behavior: ${key}`);
    }
  }
  const openai = portable.extensions?.['com.openai'];
  check(openai && isDeepStrictEqual(Object.keys(openai), ['interface']), 'Portable OpenAI overlay must contain presentation only');
  check(isDeepStrictEqual(openai?.interface, codex.interface), 'OpenAI presentation metadata differs between manifests');
  check(codex.skills === './skills/', 'Codex must load the canonical skill directory');
  check(!('skills' in claude), 'Claude should discover the canonical default skills directory');
  for (const [label, catalog] of [['codex', codexCatalog], ['claude', claudeCatalog]]) {
    check(catalog.name === 'loom-ai-labs-security', `${label} marketplace identity mismatch`);
    check(catalog.plugins?.length === 1 && catalog.plugins[0].name === pkg.name, `${label} must expose the single shared plugin`);
    const source = catalog.plugins?.[0]?.source;
    check(label === 'codex' ? source?.source === 'local' && source.path === './' : source === './', `${label} marketplace must resolve to the repository root`);
  }
  check(claudeCatalog.owner?.name === 'Loom AI Labs', 'Claude marketplace owner mismatch');
  const skill = path.join(root, 'skills/security-risk-review');
  for (const name of ['LICENSE', 'NOTICE']) {
    try {
      check(fs.readFileSync(path.join(root, name), 'utf8') === fs.readFileSync(path.join(skill, name), 'utf8'), `${name} must travel unchanged with direct skill installations`);
    } catch { failures.push(`Missing distribution notice: ${name}`); }
  }
  check(fs.existsSync(path.join(root, `release-notes/${pkg.version}.md`)), 'Missing release notes for this version');
  if (releaseTag !== undefined) check(releaseTag === `v${pkg.version}`, 'Release tag does not match package version');
  return failures;
}
