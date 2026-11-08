# Security Risk Scanner

By [Loom AI Labs](https://loomai.pro). An **AI-assisted source-security reviewer**
for Codex and Claude Code, distributed as an Agent Skill and installable plugin.
This is not a standalone SAST engine or a promise that an application is secure.

A portable coding-assistant skill for reviewing Java/JVM and Node.js/TypeScript
applications. It combines 18 risk playbooks, framework adapters, scoped review
prompts, and dependency-free local inventory/discovery helpers.

It supports selected-file, diff, risk-focused, and phased project reviews. It is
report-only by default. It does not execute the target application, probe live
services, validate credentials, install scanners, or automatically fix findings.

## Quick Install

Run from the project you want to review, using Node **22.20+** and Git:

```sh
npx skills add Loom-AI-Labs/Security-Risk-Scanner --skill security-risk-review -a codex claude-code
```

Choose the installation method when prompted. Add `-g` for a personal installation
across projects. Install for only one host by passing `-a codex` or `-a claude-code`.

For a reproducible release, pin both the third-party installer and our skill:

```sh
npx skills@1.7.6 add Loom-AI-Labs/Security-Risk-Scanner@v0.1.0 --skill security-risk-review -a codex claude-code
```

The `skills` CLI is a separate, third-party tool. Its Node requirement is higher
than our helpers' Node **20+** requirement. It can collect installation telemetry;
set `DISABLE_TELEMETRY=1` to disable its telemetry and security-audit requests.
Our own installer and helpers contain no telemetry or network calls.

Review the skill before installing. It uses your assistant's existing
permissions; installation does not create a new security sandbox. Your assistant
account/model usage is separate from this package, which needs no API key itself.

### Install As A Codex Plugin

```sh
codex plugin marketplace add Loom-AI-Labs/Security-Risk-Scanner --ref v0.1.0
codex plugin add security-risk-scanner@loom-ai-labs-security
```

On clients without `plugin add`, add the marketplace and install **Security Risk
Scanner** from that source in the Plugins Directory. See your client's available
commands with `codex plugin --help`.

### Install As A Claude Code Plugin

Run in a Claude Code session:

```text
/plugin marketplace add Loom-AI-Labs/Security-Risk-Scanner
/plugin install security-risk-scanner@loom-ai-labs-security
```

For CLI installation or pinning, see [distribution and updates](docs/DISTRIBUTION.md).
These are our repository-hosted catalogs, not claims of listing or approval in
OpenAI's or Anthropic's public directories. Choose either direct skill installation
or plugin installation per host to avoid duplicate skill entries.

### Manual / Offline Install

From this repository, using Node 20 or newer:

```sh
node scripts/install.mjs --agent both --project /absolute/path/to/your-project
```

This copies the same skill into `.agents/skills/security-risk-review` for Codex
and `.claude/skills/security-risk-review` for Claude Code. Existing installations
are never overwritten. For personal installation instead:

```sh
node scripts/install.mjs --agent both --user
```

Install just one host with `--agent codex` or `--agent claude`. Review the skill
before installation; it runs with the assistant's existing permissions, not a
new sandbox. No auto-executing hooks, remote tools, or tool grants are installed.

These locations and invocation forms follow the reviewed official
[Codex skill documentation](https://learn.chatgpt.com/docs/build-skills) and
[Claude Code skill documentation](https://code.claude.com/docs/en/skills).
Host behavior was checked against documentation on 2026-11-08; a compatible
package is not a claim that both clients have been executed in this environment.

## Invoke

Codex:

```text
Use $security-risk-review to review this project in phased, report-only mode.
Start with scope and attack-surface mapping, then investigate the selected risks.
Write findings with evidence, confidence, limitations, and next steps.
```

Claude Code, when installed directly as a skill:

```text
/security-risk-review Review this project in phased, report-only mode.
Start with scope and attack-surface mapping, then investigate the selected risks.
Write findings with evidence, confidence, limitations, and next steps.
```

Claude Code, when installed through the plugin:

```text
/security-risk-scanner:security-risk-review Review this project in phased, report-only mode.
```

Example scope for either assistant:

```text
Review src, config, and .github in report-only mode. Map the attack surface,
then investigate applicable risk families in bounded phases. Create
SECURITY_RISK_REPORT.md with severity, file/line evidence, confidence,
recommended fixes, and unreviewed areas. Do not modify code or probe live services.
```

For other coding assistants, explicitly read
[`SKILL.md`](skills/security-risk-review/SKILL.md). No model API or subscription
to a scanner service is required by the package itself.

## Prompts And Scan Phases

Use the templates in [`prompts/`](skills/security-risk-review/prompts/). Supply
the root, exact paths/diff base, desired risk focus, and report location. The
workflow is scope -> map -> discover -> trace -> validate -> report. Save a
checkpoint between bounded passes; incomplete work remains visibly incomplete.

The Java adapter covers Spring, Jakarta/JAX-RS, Quarkus, Micronaut, persistence,
messaging, and JVM service boundaries. The Node adapter covers Express, Nest,
Fastify, Koa, Next/server boundaries, GraphQL, queues, and browser integrations.
Other frameworks can be mapped through equivalent entrypoints/guards/sinks;
framework presence alone does not prove adapter coverage. Read the relevant
version's controls and report unsupported constructs.

## Helpers: Discovery, Not SAST Verdicts

```sh
node skills/security-risk-review/scripts/inventory.mjs --root /path/to/project --scope src --scope .github --out /tmp/security-inventory.json
node skills/security-risk-review/scripts/discover.mjs --root /path/to/project --scope src --out /tmp/security-leads.json
```

Both tools are local, bounded, read-only with respect to target source, and make
no network requests. They skip symlinks, generated/vendor directories, and known
credential files. They emit metadata, not source lines or secret values. Limits
and exclusions are recorded. Discovery emits **unverified leads**, never a
vulnerability count, security score, or clean bill of health.

`--scope` is repeatable and constrained to the root. Defaults: 20,000 files,
1 MiB per file, 64 MiB total discovery input, 5,000 leads. Override with explicit
numeric flags after reviewing scope. Reports cannot overwrite existing files.
Inventory does not read application content, except bounded package manifests
for dependency names/framework indicators; values and scripts are not emitted.

Optional scanner integration is documented in
[`tools.md`](skills/security-risk-review/references/tools.md). No scanner is
bundled or silently installed. Tool output is a separate evidence source.

## Validate The Package

```sh
npm test
npm run validate
```

Tests exercise helper boundaries, redaction-by-omission, scanner normalization,
installation, and paired review fixtures. Independent assistant evaluation and
Platform application are recorded in [`QUALIFICATION.md`](QUALIFICATION.md).
Do not equate deterministic tests with measured model precision/recall.

## Releases And Trust

Tagged releases include a source/plugin ZIP and SHA-256 checksums. The root
portable manifest and the Codex/Claude compatibility manifests all load the same
`skills/security-risk-review` directory. No MCP server, automatic hooks, or
additional tool permissions are required.

See [distribution and release instructions](docs/DISTRIBUTION.md),
[release notes](CHANGELOG.md), and [security/privacy guidance](SECURITY.md).
Public-directory submissions are separate from making a GitHub release available.

## License

[Apache License 2.0](LICENSE). Copyright 2026 Loom AI Labs. License and notice
copies travel inside the skill directory so direct skill installations retain
them. Referenced third-party documentation is linked, not relicensed by us.
