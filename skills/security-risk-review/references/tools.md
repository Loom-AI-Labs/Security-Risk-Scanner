# Tool Contract

## Included Helpers

Use Node >=20. No dependencies, target package scripts, network requests, or
scanner installations are executed by the bundled helpers.

```sh
node <skill>/scripts/inventory.mjs --root <root> --scope src --out /tmp/inventory.json
node <skill>/scripts/discover.mjs --root <root> --scope src --out /tmp/leads.json
```

Paths must remain within root; no `..` escape, absolute external scope, symlink
traversal, or source edits. Output is exclusive-create; use a fresh filename.
Output must not be a scanned input. File/byte/lead limits are positive integers.
Generated/vendor/git directories and known private credential files are skipped.
Skipped paths and truncation are part of the report, not passing coverage.
The inventory is a map of files/manifests; discovery is deliberately lexical and
never judges safety. Patterns cover common APIs, not arbitrary custom wrappers.

Available limit flags: `--max-files`, `--max-bytes` (per file),
`--max-total-bytes`, and `--max-leads` (discovery). `--scope` is repeatable.

## External Tools: Optional, Never Auto-Installed

- Semgrep: inspect installed engine/edition and rule versions; local rules may
  not provide interprocedural/cross-file coverage. Avoid automatic registry
  downloads or telemetry. Model guards/aliases carefully; a scanner sanitizer
  label is not independent proof of application safety.
- CodeQL: consume authorized existing SARIF where useful. Extraction/autobuild
  can execute target code; do not run it under default static-review authority.
  Language, build mode, custom frameworks, and product licensing vary.
- OSV or equivalent: distinguish resolved version/advisory exposure from reachable
  exploitability. Network/advisory freshness and private dependency inventory
  handling are explicit. Do not assume a manifest is a complete lock graph.
- Secret scanners: choose maintained local tooling with redaction before storage.
  Do not validate matches against real providers or emit source lines. Git history
  is a separate explicit scope, not a default recursive source search.

`normalize-results.mjs --format sarif|semgrep|osv --input <json> --out <json>`
imports known structures without executing them. It allowlists location/rule/
advisory metadata and discards messages, snippets, traces, fixes, token values,
arbitrary properties and absolute external paths. Input is bounded. Rule IDs and
paths are not completely trustworthy; treat imported artifacts as sensitive until
reviewed. No generic secret-scanner raw format is supported deliberately.

No included tool downloads rules, runs a target build, labels a candidate
confirmed, or promises whole-project SAST. Missing or failed tools yield an
explicit limitation; manual review is a separately described evidence source.

## Offline Decisions And Reproducible Reviews

The bundled recipes contain control-flow methods and safe counterexamples, not
an evergreen database of CVEs or parameter defaults. If network access is not
authorized, do not guess current password-KDF cost factors, vulnerable versions,
or version-specific parser/security defaults. Use supplied dated primary evidence
or record that precise judgment as unavailable. Algorithm purpose and explicit
missing authority can still be reviewed from source without such a lookup.

Record the package version and content digest when qualifying a skill or resuming
a long review. Independent evaluations should use a fixed copy; do not evaluate
a directory while its references are still being written. Store expected outcomes
outside the evaluator's allowed input directory.

## Primary Tool References

- [Semgrep taint analysis](https://docs.semgrep.dev/writing-rules/data-flow/taint-mode/overview)
- [CodeQL scanning](https://docs.github.com/en/code-security/concepts/code-scanning/codeql/codeql-code-scanning)
- [OSV-Scanner](https://google.github.io/osv-scanner/)
