# Distribution And Updates

Repository: <https://github.com/Loom-AI-Labs/Security-Risk-Scanner>.
Plugin: `security-risk-scanner`. Skill: `security-risk-review`.
Repository-hosted marketplace: `loom-ai-labs-security`.

## Installation Choices

Choose one route per assistant: a direct skill, a plugin, or a manual copy. They
share the same instructions and helpers. Installing all routes creates duplicate
entries; it does not improve review coverage.

### Direct Skill

From the project, with Node 22.20+ and Git:

```sh
npx skills@1.7.6 add Loom-AI-Labs/Security-Risk-Scanner@v0.1.0 --skill security-risk-review -a codex claude-code
```

Add `-g` for user-wide installation; remove one agent name to target one host.
For unattended installation into an explicitly selected project, add `-y`.
`--copy` selects copies instead of links. The installer manages these directories:

- Codex: `.agents/skills/security-risk-review`.
- Claude Code: `.claude/skills/security-risk-review`.

The npm package is the installer, not our skill. We do not need npm publishing
credentials for this distribution route. Read the third-party installer's trust,
telemetry, and overwrite behavior before using it on an existing project.
Our stricter manual installer refuses an existing installation instead of updating
it. Neither installation route automatically scans an application.

For branch-following installation, omit `@v0.1.0`. `skills check` and
`skills update security-risk-review` manage update checks and installation.
Review changes first. For release-pinned installations, explicitly install the
next approved tag rather than assuming an update will change the pinned ref.

Removal, from the same scope where installed:

```sh
npx skills@1.7.6 remove security-risk-review -a codex claude-code
```

Add `-g` only for a user-wide installation. Removal does not delete review reports.

### Codex Plugin

```sh
codex plugin marketplace add Loom-AI-Labs/Security-Risk-Scanner --ref v0.1.0
codex plugin list
codex plugin add security-risk-scanner@loom-ai-labs-security
```

The root `plugin.json` follows the Agent Plugins format. The fallback
`.codex-plugin/plugin.json` serves compatible Codex clients. Marketplace entries
are in `.agents/plugins/marketplace.json`, with paths relative to the repository
root. There is no MCP server, credential setup, or lifecycle hook.

Some clients expose installation through the Plugins Directory instead of
`plugin add`. Follow `codex plugin --help` for that client. In Codex, invoke
`$security-risk-review` or select the plugin's skill from the available skills.

Refresh an unpinned marketplace with:

```sh
codex plugin marketplace upgrade loom-ai-labs-security
```

For a pinned release, register the next reviewed ref using `marketplace add` and
follow the client's plugin refresh flow. Remove using
`codex plugin remove security-risk-scanner@loom-ai-labs-security`; the marketplace
itself can be removed separately with `plugin marketplace remove`.

### Claude Code Plugin

Using the CLI:

```sh
claude plugin marketplace add https://github.com/Loom-AI-Labs/Security-Risk-Scanner.git#v0.1.0
claude plugin install security-risk-scanner@loom-ai-labs-security --scope project
claude plugin list
```

Alternatively, use the `/plugin marketplace add` and `/plugin install` commands
shown in the README for the default branch. Plugin skills are namespaced:

```text
/security-risk-scanner:security-risk-review Review src in phased, report-only mode.
```

The `.claude-plugin/plugin.json` manifest uses the default root `skills/`
directory. Its marketplace points to the repository root with `source: "./"`.
Do not move the skill into `.claude-plugin/`.

Use Claude's plugin manager to refresh/update the plugin or uninstall it. Review
the new tag or commit before changing a release-pinned source. Removing a plugin
does not remove a direct skill installation made through a different route.

### Manual Or Offline Copy

Download the tagged release archive and its `SHA256SUMS` file. Verify the ZIP's
SHA-256 using `sha256sum -c SHA256SUMS` on Linux, or `shasum -a 256 -c SHA256SUMS`
on macOS, then extract it. Checksums detect changed bytes but are not an
independent signature or a security certification.

From the extracted root:

```sh
node scripts/install.mjs --agent both --project /absolute/path/to/your-project
```

Use `--user` instead of `--project` for personal installation. The bundled
installer requires Node 20+, copies the complete skill including license/notice,
and refuses overwrites or symlinked installation parents. It does not download
anything. Review and explicitly remove/replace an old manual installation when
upgrading; preserve any local modifications yourself.

## Release Maintenance

1. Update `package.json`, all three manifests, qualification, and release notes.
2. Run `npm test` and `npm run validate`. Validators check matching identity,
   version, license, marketplace paths, notices, and absence of automatic tools.
3. In temporary project/home directories, check direct discovery and installation
   for both agents, then plugin loading with each available client. Do not reuse
   the maintainer's credential-bearing home for these tests.
4. Commit and push to `main`; wait for the repository CI workflow to pass.
5. Create an annotated `v<version>` tag on that reviewed commit and push it.
6. The release workflow reruns tests, verifies tag/version agreement, then creates
   a GitHub release containing a tracked-source ZIP and SHA-256 checksums.
7. Verify fresh installation from the public tagged source, not just a checkout.

The archive comes from `git archive HEAD`; ignored/local files are not included.
Release permissions are scoped to the publishing job. GitHub Actions are pinned
to reviewed commit SHAs. Never include target-project reports, customer source,
private tokens, or a real application's credentials in a public package.

## Discovery Is Not Official Approval

The repository can be installed by URL immediately. A skills.sh search listing or
ranking may depend on that service's indexing/usage; it is not guaranteed by a
release. Our catalogs are self-hosted catalogs, not third-party endorsements.

Submission to OpenAI's public Plugins Directory or Anthropic's directory is a
separate publisher/review process. No listing, review acceptance, or host-side
security certification is implied by the manifests. Publisher account access,
verified branding/contact details, and any requested policies must be supplied
before an official-directory submission.

## Primary Documentation

- [Agent Skills format](https://agentskills.io/home).
- [Codex skills and distribution](https://learn.chatgpt.com/docs/build-skills).
- [OpenAI plugin packaging](https://developers.openai.com/plugins/build/plugins).
- [Claude plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces).
- [Claude manifest reference](https://code.claude.com/docs/en/plugins-reference).
- [Skills installer commands](https://github.com/vercel-labs/skills/blob/main/docs/commands.md).

Reviewed on 2026-11-08. Client/installer changes can require renewed verification;
see [qualification](../QUALIFICATION.md) for what was actually tested.
