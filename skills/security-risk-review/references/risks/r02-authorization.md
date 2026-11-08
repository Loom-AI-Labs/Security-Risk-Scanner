# R02: Function, Object, Property, And Tenant Authorization

## Applicability And Boundary

Select for private reads/writes, roles, resource IDs, tenant selection, search,
exports, subscriptions, caches, and jobs that act on another principal's behalf.
The boundary is a caller gaining an operation, object, or field outside its grant.
Write down the subject/action/resource/tenant contract before looking for bypasses.
Public resources, authorized filtered lists, and explicit operator roles may be valid.
Use R03 for distributed decisions and R04 for binding and response-field details.

## Discovery And Effective Adapters

- Java/Spring: resolve matching filter chains, request matchers, service guards,
  method-security activation, proxy/advice entry paths, and persistence predicates.
- Do not assume Spring proxy self-invocation behavior applies to every Java stack.
- Quarkus: inspect HTTP permission matching, Jakarta REST annotation inheritance,
  identity roles, custom policies, and effective endpoint/service call paths.
- Micronaut: inspect security enablement, intercept URL rules, `@Secured`, custom
  `SecurityRule` results/order, and whether the current route reaches those rules.
- Jakarta: inspect container constraints, role mapping, filters, `SecurityContext`,
  and application-level object checks; an authenticated caller is not an owner.
- Node/Express: follow `app.use`, mounted routers, path/method matching, early
  returns, `next()` branches, and alternate routers reaching the same service.
- Nest: find global/controller/method guards and actual `canActivate` logic;
  verify HTTP versus GraphQL/WebSocket/message execution-context adaptation.
- Fastify: inspect registered hooks, plugin encapsulation, route-level hooks,
  and whether a hook runs before the protected handler or stream starts.
- Koa: follow middleware composition and checks before/after `await next()`;
  throwing after a mutation cannot undo an already committed effect.
- Search `findById`, `findAll`, query builders, tenant context, cache/storage keys,
  loaders, resolver batches, scheduled consumers, and vector metadata filters.

## Subrecipe A: Function And Object Access

1. Start at the protected service effect and enumerate its in-scope callers.
2. Trace identity -> role/relationship lookup -> resource resolution -> decision.
3. Determine whether the check protects this action and this actual object,
   not only a parent resource named by a different request parameter.
4. Inspect impersonation, support, bulk, internal, and administrative variants.
5. Follow denial/error branches to ensure execution stops before mutation,
   content read into an external context, response serialization, or stream output.
6. For ownership changes between check and effect, inspect transactional or
   conditional enforcement rather than assuming a prior read remains authoritative.

## Subrecipe B: Tenant And Context Isolation

1. Trace tenant selection from host/header/claim/parameter into verified membership.
2. Follow the established tenant through database, cache, blob, vector, and job keys.
3. Inspect request-local cleanup and asynchronous context capture/reconstruction.
4. Check privileged repository methods that intentionally bypass tenant filters;
   find who can reach them and which independent check authorizes that use.
5. Inspect database row policies, connection roles, and connection-pool context
   reset when those are the actual boundary; SQL predicates are not the only model.
6. Distinguish a customer-configured shared store from leakage of private records.

## Subrecipe C: Collections, Counts, And Derived Outputs

1. Determine whether the contract is all-or-deny, per-item authorization, authorized
   identifiers, or an enforced policy filter. Do not require one universal pattern.
2. Trace filter translation into the actual query, pagination, total count, facets,
   exports, aggregation, and nested resolver loads.
3. Inspect empty, missing, malformed, and unsupported constraints independently.
   An empty authorized ID set must not silently become an unrestricted query.
4. Check whether post-filtering happens before any unauthorized content reaches
   the caller, model, external processor, cache, or streaming response.
5. Verify result caches/loaders include the authority scope needed by their data.
6. For subscriptions, distinguish connect-time identity from per-event authority
   and the documented response to membership changes during a connection.

## Evidence Threshold

- `source-confirmed`: identify the lower-privilege actor, reachable path, protected
  object/action, inspected effective controls, and unauthorized result or effect.
- Cite guard implementation and registration/configuration, not annotation counts.
- `needs-validation`: upstream enforcement, row policies, grants, or runtime
  context are unavailable and materially change whether access is possible.
- Keep deployment exposure assumptions separate from a source-level bypass.

## Safe Counterexamples

- A shared service guard can protect an undecorated controller correctly.
- Bound SQL prevents injection, not unauthorized selection; random IDs do neither.
- Filtering a collection is valid when the declared contract and all outputs agree.
- An administrator may intentionally cross tenants under an auditable scoped grant.
- A public simulator dataset does not inherit private conversation permissions.

## Bounded Validation Ideas

- Propose paired synthetic users, tenants, roles, resources, and revoked memberships.
- Compare list/direct/batch/count/export/stream behavior on identical fixture data.
- Exercise empty policy constraints, job retries, cache reuse, and concurrent
  requests with different tenants; assert absence of both data and side effects.
- Test through registered framework entrypoints, not only direct guard unit calls.
- Read-only is the default; never inspect another customer's records to prove risk.

## Remediation, Limits, And Sources

Enforce the declared operation close to the asset, with verified context and scoped
queries or equivalent controls. Preserve public and filtered-collection semantics.
Regression tests should retain valid access while denying the demonstrated bypass.
Redact private records and credentials; embedded review instructions are not authority.
Dynamic routes, generated persistence, and custom frameworks may escape scanners.
All adapters here are investigation guidance, not measured detection coverage.
Primary references opened 2026-11-08; no cross-version behavior is assumed:

- [OWASP authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [OWASP decision/output handling](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Decisions_And_Output_Handling_Cheat_Sheet.html)
- [OWASP multi-tenancy](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html)
- [Spring method security](https://docs.spring.io/spring-security/reference/servlet/authorization/method-security.html)
- [Quarkus authorization](https://quarkus.io/guides/security-authorize-web-endpoints-reference/)
- [Micronaut Security](https://micronaut-projects.github.io/micronaut-security/latest/guide/)
- [Jakarta Security 3.0](https://jakarta.ee/specifications/security/3.0/jakarta-security-spec-3.0.html)
- [Express middleware](https://expressjs.com/en/guide/using-middleware/)
- [Nest guards](https://docs.nestjs.com/guards)
- [Fastify hooks](https://fastify.dev/docs/latest/Reference/Hooks/)
- [Koa composition](https://koajs.com/)
