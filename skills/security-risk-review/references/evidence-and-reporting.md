# Evidence And Reporting

## Finding Versus Lead

A lead names a location worth inspecting. A finding names a reachable actor,
protected asset/effect, failed boundary, and evidence trace. A safer-looking API
or method name is not enough to close a lead; read what the control does.

Severity concerns impact and reachability. Confidence concerns evidence quality.
Use critical/high/medium/low only with a rationale; do not inherit a scanner's
severity without examining the path. A dependency advisory is a dependency risk,
not automatic proof of remote application compromise.

Confidence calibration:
- High: the relevant actor/input, effective control, and sink are inspected;
  remaining uncertainty does not change the described source-level failure.
- Medium: a bounded assumption about registration/configuration or an external
  control materially affects the outcome; state it and normally use needs-validation.
- Low: the candidate is plausible but key reachability/control behavior is unread
  or unsupported. Keep it a lead/question, not a confirmed vulnerability.

Do not confuse a missing live exploit with low confidence in a complete source
trace. Conversely, a scanner's high-confidence label does not fill missing code.

## Worked Calibration Examples

- A request body is passed to `users.update`, but the helper is unavailable:
  possible mass assignment, needs-validation. If the helper demonstrably copies
  arbitrary supplied role/tenant fields into the user row, the same trace can
  become source-confirmed. Inspect field filtering instead of assuming it.
- `cache.get(id)` precedes a tenant-scoped query: conditional if the cache could
  be tenant-local. Source-confirmed cross-tenant exposure requires a shared cache
  and a plausible overlapping key/data scope. Do not invent either condition.
- An owned-deployment probe passes supplied host/scheme directly to the server's
  HTTP client, without a destination check: source-confirmed destination-control
  issue. Actual internal network reachability and credential exfiltration remain
  separate deployment/credential assumptions unless observed.

Evidence states:
- source-confirmed: source demonstrates the relevant path and failure under
  explicit prerequisites, without claiming a live exploit.
- isolated-test-reproduced: an authorized isolated test reproduced the failure.
- needs-validation: plausible candidate with a material unresolved condition.

Hardening recommendations are separate. Missing tests, a broad interface, or
outdated documentation alone are not confirmed exploitable vulnerabilities.

## Per-Finding Contract

Include ID, title, risk family, severity/rationale, confidence, evidence state,
actor/prerequisites, asset/boundary, affected paths/lines, short source-to-effect
trace, counterevidence checked, deployment assumptions, safe test proposal,
bounded remediation, and focused regression expectations. Add a verified CWE or
versioned ASVS mapping only if useful and actually checked.

Use repository-relative paths in portable JSON and actual line numbers. In a
local Markdown report, make source references absolute/clickable where the host
supports them. Never expose secret values, tokens, private messages, raw provider
payloads, or personal data. Mask even snippets if their content is sensitive.

Do not include an executable exploit or external attack recipe merely to sound
convincing; a local synthetic regression describes the contract adequately.
Do not claim a weakness exists in a serving image without deployment evidence.

## Coverage

For each selected risk, list inspected surfaces and unknowns. Record commit,
dirty state, exact scope, generated/vendor/private exclusions, files/bytes/lead
budgets, scanner versions/rules/advisory date, and errors. Empty tool output,
unsupported syntax, failed scans, and unassessed areas remain visible.

Consolidate duplicate routes under the same root cause. Keep separate findings
when actors/effects/remediations materially differ. Explain why a tempting
candidate was dismissed so future reviews avoid repeating the false positive.

## Minimal JSON Shape

```json
{
  "schemaVersion": 1,
  "scope": {"root": "/reviewed/root", "commit": "observed", "mode": "project", "paths": ["src"]},
  "findings": [],
  "candidates": [],
  "recommendations": [],
  "coverage": [{"riskId": "R02", "state": "selected", "inspected": [], "unknowns": []}],
  "tools": [],
  "limitations": []
}
```

Actual finding entries must satisfy the full contract. Do not manufacture
demonstration findings in a real project's report. The tool normalizer deliberately
returns candidate metadata only, not this finished finding structure.

### Finding Entry Fields

```json
{
  "id": "F01",
  "title": "Short boundary failure",
  "riskIds": ["R02"],
  "severity": "medium",
  "severityReason": "Impact and actor reachability, not just an API name",
  "confidence": "high",
  "evidenceStatus": "source-confirmed",
  "actor": "Precisely identified actor",
  "prerequisites": ["Explicit required condition"],
  "asset": "Protected asset/effect",
  "boundary": "Authority or confidentiality boundary crossed",
  "locations": [{"path": "src/Example.java", "line": 10}],
  "trace": ["entrypoint -> inspected guard -> protected effect"],
  "counterevidence": ["Controls inspected and why they do not close this path"],
  "assumptions": ["Unknown deployment fact, if any"],
  "validation": {"executed": false, "proposal": "Bounded synthetic test"},
  "remediation": "Narrow fix for the demonstrated root cause",
  "regression": ["Valid access preserved; unauthorized effect denied"],
  "provenance": ["Source location or tool/rule/advisory reference"]
}
```

This is a schema example, not an actual project finding. Use valid enumerations
and actual evidence; do not copy the demonstration assumptions into reports.
