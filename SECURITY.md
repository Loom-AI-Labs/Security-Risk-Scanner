# Security And Privacy

## Scope And Limitations

This package assists authorized source-security reviews. It is not a standalone
SAST engine, compliance certification, penetration test, or guarantee of security.
Static search produces leads; the assistant must trace real controls and clearly
separate confirmed findings, conditional risks, and coverage gaps.

It runs with the host assistant's existing filesystem/tool permissions. There is
no extra sandbox, remote MCP service, automatic execution hook, or new permission
grant in this package. Review the contents before installation and pin a tag or
commit when repeatability matters.

## Data Handling

Bundled Node helpers make no network requests and have no telemetry. Discovery
outputs omit source snippets and secret values; they are not a substitute for
redacting a manually written report. Never publish a real application's scan
artifacts without reviewing them for confidential source, identities, and secrets.

The assistant may send context to its model provider under that host/account's
data controls. Local helpers do not make the overall AI review offline. Check the
host's data policy before reviewing confidential repositories. The optional
third-party `skills` installer has its own network/telemetry behavior; disable its
telemetry with `DISABLE_TELEMETRY=1` if required.

Do not execute target scripts, build/import target applications, validate found
credentials, install external scanners, or probe live endpoints unless that work
has separate explicit authorization and a bounded scope. Findings about a target
application should go to that application's owner, not this public repository.

## Reporting Problems In This Package

For a security defect in this skill or its helpers, use the repository's private
vulnerability-reporting option when available. If it is unavailable, open a public
issue requesting a private contact without including exploit details, customer
source, credentials, or confidential reports. No response-time SLA is promised.

For ordinary bugs or documentation corrections, use
[GitHub issues](https://github.com/Loom-AI-Labs/Security-Risk-Scanner/issues).
Do not use public issues to disclose vulnerabilities in projects you reviewed.
