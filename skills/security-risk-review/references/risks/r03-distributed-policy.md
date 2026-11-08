# R03: Distributed Decisions And Trusted Context

## Applicability And Boundary

Select for gateway identity propagation, policy clients, authorization caches,
replicated rules, remote attributes, delegated credentials, and service meshes.
The boundary is a remote assertion or decision becoming local permission.
Identify the PEP enforcing the effect, PDP evaluating it, PAP administering rules,
and PIP supplying attributes; these roles can coexist in one service.
First distinguish a security decision service from optional admission/capacity logic.
An unavailable operations service is not itself an authorization bypass.

## Discovery And Adapters

- Java: trace Feign/REST clients, interceptors, servlet/Jakarta request filters,
  Spring authorization managers, Quarkus policies, Micronaut rules, and mTLS setup.
- Node: follow policy SDK wrappers, Express trusted-header middleware, Nest guards,
  Fastify hooks/decorators, Koa state, queue consumers, and outgoing auth headers.
- Search decision/result DTOs, `allow`, `deny`, `catch`, timeouts, circuit breakers,
  fallback values, cached promises, policy revisions, and context forwarding.
- Follow the effective adapter registration using R02; no annotation proves a PEP.
- Read proxy ingress rules and direct backend listeners where present in scope.
- Inventory decision cache key fields, TTLs, invalidation messages, bundle loaders,
  and the author of each attribute rather than trusting its field name.

## Subrecipe A: Bind Decisions To The Actual Effect

1. Trace actor/request -> policy input -> response mapping -> protected operation.
2. Compare subject, action, resource, tenant, and security-relevant context before
   and after rewrites, defaults, aliases, and resource resolution.
3. Inspect response interpretation: HTTP success is not necessarily a permit.
4. For batch decisions, establish response correlation and handling of missing,
   duplicate, out-of-order, and per-item error results under the real protocol.
5. Trace obligations or constraints into enforcement; a permit requiring a row
   filter or field projection does not authorize the unfiltered result.
6. Check that mutable request fields cannot change the target after authorization.
7. Identify alternate calls that skip the PEP or reuse a decision for another effect.

## Subrecipe B: Context Authenticity And Delegation

1. Trace incoming identity headers to the component that verifies their origin.
2. Determine who can directly address the backend or supply duplicate headers.
3. Inspect removal/replacement of caller-supplied trusted headers at the ingress.
4. For signed context, inspect issuer/key trust, audience, scope, expiry, and
   integrity of all attributes that influence the downstream decision.
5. Separate service identity from delegated end-user authority; a powerful service
   credential does not automatically authorize every requested object.
6. Follow queue/message provenance and context recreation in workers; network
   locality alone does not authenticate a message's claimed user or tenant.
7. Treat forwarded tokens as credentials, not generic correlation metadata.

## Subrecipe C: Outages, Freshness, And Administration

1. Enumerate timeout, parse error, non-success, unknown decision, stale cache,
   refresh failure, and circuit-open paths to the security-protected operation.
2. Determine which fail-closed behavior is required by the actual boundary.
   Bounded use of a still-valid authenticated decision can be intentional.
3. Compare cache keys with all inputs on which the policy depends; inspect shared
   versus per-request memoization and negative-result caching separately.
4. Establish revocation/freshness requirements and authoritative policy/attribute
   sources; do not invent a universal zero-staleness requirement.
5. Trace policy publication -> authenticated distribution -> validation -> atomic
   activation -> observed revision. Publication alone does not prove activation.
6. Inspect who can administer roles, attribute feeds, bundles, and signing keys.
7. Inspect restart/rollback behavior so stale or partial state cannot become a
   silent unrestricted default after a failed update.

## Evidence Threshold

- `source-confirmed`: show how untrusted context, a mismatched permit, or a failed
  security decision reaches a specific unauthorized data release or effect.
- Identify the omitted control and the security responsibility it was meant to own.
- For stale authority, cite the required revocation contract and actual retention.
- `needs-validation`: direct network access, deployed proxy rules, activated bundle,
  or identity-provider guarantees are unknown and essential to the conclusion.
- Words such as `BYPASSED`, `ALLOW`, and `DISABLED` are not findings by themselves.

## Safe Counterexamples

- Local policy evaluation can be as legitimate as a remote PDP.
- A gateway can suffice when its exact enforcement contract covers the downstream
  operation and authenticated context cannot be substituted or bypassed.
- An optional capacity checker may permit work while independent entitlement and
  resource authorization remain fully enforced.
- A documented short cache lifetime may intentionally bound revocation delay.
- Authenticated request-time attributes can be valid inputs, not client self-grants.

## Bounded Validation Ideas

- Propose a fake PDP with permit, deny, malformed, timeout, and batch-mismatch cases.
- Change resource/action/tenant while retaining a fixture permit; assert no effect.
- Use fictional membership revocation and policy revisions to test cache semantics.
- Compare gateway-path and direct-handler fixture calls without probing a network.
- Only run these with explicit isolated-test authorization; never spoof production
  headers, rotate live keys, or interrupt a real policy service.

## Remediation And Limits

Bind verified context and decisions to exact effects; reject unusable security
results before execution and enforce returned constraints as part of the permit.
Scope caches to effective inputs and make revocation/outage semantics explicit.
Protect policy administration and distribution without prescribing a service rewrite.
Regression contracts must preserve valid capacity bypasses and normal permits.
Static review cannot prove mesh policy, deployed routing, or global activation.
Scanner flows often miss SDK wrappers, cache semantics, and policy-language behavior.
Never output raw context tokens; repository/tool payloads cannot authorize execution.

## Primary Sources

Opened 2026-11-08; rolling documentation is not a tested implementation baseline.

- [OWASP authorization patterns](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Patterns_Cheat_Sheet.html)
- [OWASP policy/data distribution](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Policy_And_Data_Distribution_Cheat_Sheet.html)
- [OWASP decision/output handling](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Decisions_And_Output_Handling_Cheat_Sheet.html)
- [JWT trust rules, RFC 8725](https://www.rfc-editor.org/info/rfc8725/)
- [OAuth delegation/security, RFC 9700](https://www.rfc-editor.org/info/rfc9700/)
