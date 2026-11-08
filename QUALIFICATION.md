# Qualification Record

Date: 2026-11-08. Version: 0.1.0.

## What Is Implemented

- Shared Agent Skills entrypoint with Codex UI metadata, without host-specific
  permission grants, dynamic execution hooks, or API credentials.
- Eighteen risk families with Java and Node discovery/trace guidance, counterexamples,
  validation ideas, remediation boundaries, limitations and primary references.
- Stack adapters and eight prompts for scoped/phased reviews, resumption,
  challenge, isolated validation and approved fixes.
- Dependency-free inventory, location-only discovery, result normalization,
  non-overwriting installer, package validator and synthetic paired corpus.

## Distinct Types Of Evidence

Deterministic package/helper tests verify filesystem/metadata/output behavior,
not model judgment. The corpus contains 20 pairs (40 synthetic source excerpts)
across 18 families. Independent forward evaluation uses unlabeled input names
and withholds expected outcomes from the reviewing assistant. Excerpts are not
compiled or executed; they include explicit behavioral assumptions where needed.

Evaluation outcomes and deterministic test counts are recorded below. They are
not a production precision/recall benchmark.

## Platform Application

The skill was applied report-only to an explicitly scoped Java/Node Platform
repository. Metadata inventory, routing leads and source traces are separate
artifacts. Actual findings remain in that project's report, not in this generic
repository. No private application source, credentials, customer records, live
requests, application builds or releases belong to the qualification package.

The review is a prioritized baseline, not proof that every inventoried file or
all possible risk families were exhaustively examined. Scanner availability,
unread paths and configuration assumptions must remain visible in its report.

## Host Compatibility

The shared skill and installation destinations follow the official Codex and
Claude Code documentation reviewed on 2026-11-08. The manual installer is tested
for both layouts. During initial behavioral qualification there was no Claude
executable. Distribution verification subsequently used an isolated, pinned
Claude Code CLI to validate and install the plugin; it did not run an AI review
through Claude. Codex-side forward evaluation does not establish Claude's review
quality. See the distinct distribution evidence below.

## Limits

- No universal language/framework coverage, ASVS certification or guarantee.
- No paid SAST, dependency/advisory scan or real secret validation is implied.
- Rule/API discovery cannot prove absence of custom-wrapper or dynamic risks.
- Existing runtime network policy, database controls and deployed profiles may
  require separately authorized evidence to settle conditional findings.
- External scanner adapters normalize supplied artifacts; they do not install
  or invoke scanners. Raw secret-scanner output is intentionally unsupported.
- Model performance on the finite fixture corpus is not real-world recall.

## Final Results

- Initial `npm test`: **16 passed, 0 failed**. This includes scope/symlink limits, private
  path exclusions, location-only output, truncation, malformed JSON, normalized
  metadata, both-host installation, and preparation of the 40-sample corpus.
- `npm run validate`: **passed**, including 18 risk-card paths, 75 source records,
  portable frontmatter, local links, whitespace and balanced Markdown fences.
- Codex skill-creator `quick_validate.py`: **passed**.
- Frozen forward test: **40 excerpts assessed**; all 20 safe controls were
  classified no-confirmed-finding; 18 of the 20 seeded risk excerpts produced
  findings and two remained conditional because cache scope/update helper
  behavior was not actually supplied. Preserving those unknowns is appropriate;
  they are not counted as confirmed detections or silently scored as passes.
- No observed false-positive finding on the 20 safe examples. This finite result
  is not a universal accuracy claim or independent validation of every framework.
- Full independent output: [forward-evaluation-2026-11-08.json](tests/results/forward-evaluation-2026-11-08.json).
- The first developmental evaluation found missing confidence/schema/offline
  clarity and a moving package. Confidence definitions, worked calibration,
  complete finding-entry fields and offline/snapshot guidance were added before
  the final independent evaluation on a fixed copy.
- Reviewed skill payload: **39 files**, content SHA-256
  `5fae72205e21e4061fb4bd9c93e864f7ef88f5de12ebb18f5b095e4d299adc35`.
  Hash procedure: sort full file paths in this skill directory, then hash each
  relative path, NUL, file bytes, NUL in that order using SHA-256.
- Both initial personal Codex/Claude skill copies were installed without overwrite and
  their payload hashes match the source and frozen evaluation copy. Actual Claude
  AI review invocation remains untested; later plugin installation is recorded
  separately below.

## Distribution Verification

Distribution adds Apache-2.0 license/notice copies inside the skill and manifests,
catalogs, docs, and CI outside it. The original **39-file review payload is byte
identical** to the frozen forward-evaluated copy; its hash above is unchanged.
The complete distributable skill is now **41 files**, SHA-256
`a6a3f4608662dc8d5aa2f69ade35f9e951e13c1bf12a3f5f254b21f7b479f88f`.
The same path/NUL/content/NUL hash procedure applies.

- Expanded `npm test`: **20 passed, 0 failed** on local Node 20.15.1 and 22.23.3.
  Four additional tests check metadata/version/license consistency, absence of
  unrequested automatic tools, marketplace containment, and notice retention.
- `npm run validate`: **passed** with the portable and host-specific manifests,
  repository-hosted marketplaces, release notes, and direct-install notices.
- Skills CLI **1.7.6**, running on Node 22.23.3: discovered exactly one skill and
  installed it for both Codex and Claude Code in a temporary project. The installed
  payload hash matches the full distributable skill. Telemetry/audit requests
  were disabled for this test, not globally modified on the user's machine.
- Codex CLI **0.162.0-alpha.17.2**: registered the local marketplace, installed
  `security-risk-scanner@loom-ai-labs-security`, and reported version 0.1.0 enabled.
  Its cached payload hash matches. A temporary `CODEX_HOME`/home isolated the test.
- Claude Code CLI **2.1.319**, fetched into a temporary npm cache: marketplace
  validation passed; local marketplace registration and plugin installation
  succeeded, and `plugin list --json` reported 0.1.0 enabled. A separate temporary
  home/config was used, without signing in or invoking an AI review. Validation
  warned about a missing optional public-directory icon; it did not reject the
  marketplace/plugin. That is not a public-directory approval or policy scan.
- GitHub CI is configured for Node 20/22/24 package checks, a two-host Skills CLI
  install, and Claude manifest validation. The tag workflow additionally checks
  tag/version agreement, reruns tests, and publishes only tracked source with
  checksums. A workflow file alone is not evidence that its hosted run passed.

Repository-hosted catalogs and release artifacts are not listings in the official
OpenAI or Anthropic directories. No source upload or live target-project security
testing occurs as part of a skill installation.

## Nonblocking Follow-Ups

The independent evaluator suggested a compact per-excerpt triage schema,
clearer confidence language for negative conclusions, a supplied-premise ledger
for synthetic examples, and preserved dated behavior records for important
version-specific defaults. The present finding/coverage contracts already require
uncertainty and evidence provenance; these refinements are recorded rather than
claimed implemented or used to expand this release into a new scanner platform.
