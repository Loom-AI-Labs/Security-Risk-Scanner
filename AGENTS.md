# Working On This Skill

Keep the skill portable between Claude Code and Codex. Shared instructions belong
in `skills/security-risk-review/SKILL.md`; do not add host-specific execution or
permission grants to that file. The scripts use Node 20 built-ins only.

Search matches are investigation leads, never vulnerability verdicts. Test both
unsafe examples and valid controls. Do not run code from an audited repository,
use discovered credentials, or call its live services without separate scope.
Do not include real customer source or secrets in this public-ready package.

Run `npm test` and `npm run validate` after changes. No dependency installation
is needed. Behavioral qualification is separate from script/package tests.
