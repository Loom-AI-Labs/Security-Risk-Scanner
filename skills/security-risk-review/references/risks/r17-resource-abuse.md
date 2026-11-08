# R17: Resource Exhaustion And Expensive Abuse

## Applicability And Boundary

Select for public requests, parsing/indexing, search, exports, authentication work,
AI calls, archive handling, queues, retries, fan-out, and long-lived connections.
The boundary is a feasible actor causing resource use beyond the allowed service
or economic contract. Name the resource and the amplification path.
Separate user entitlement, abuse controls, provider spending, and server capacity.
Optional operations automation being disabled is not itself exploitable denial of service.
Use R09/R10 for file/parser behavior and R16 for workflow/idempotency effects.

## Discovery And Adapters

- Java: servlet/reactive request limits, executors, virtual-thread workloads, pools,
  regexes, parsers, synchronous crypto, database pagination, and outbound timeouts.
- Inspect Spring/Quarkus/Micronaut/Jakarta route limits and the effective server,
  proxy, consumer, and worker configuration rather than a generic annotation count.
- Node: body parsers, streams/backpressure, synchronous filesystem/crypto/compression,
  regexes, `Promise.all`, event-loop work, worker pools, and HTTP client cancellation.
- Express/Nest/Fastify/Koa plugins/hooks may limit only selected routes or body types;
  inspect message/WebSocket handlers and async job entrypoints separately.
- Search page/cursor/count limits, GraphQL aliases/batching/complexity, upload caps,
  decompression, response buffering, retry budgets, model tokens, and queue depth.
- Follow upstream load-balancer/rate-limit evidence when provided; do not assume it.

## Subrecipe A: Input And Algorithmic Amplification

1. Trace input size/structure -> allocations, CPU work, query plan, and output volume.
2. Check limits at each expansion: compressed bytes -> decoded bytes -> objects ->
   extracted files/chunks -> indexed vectors or serialized response.
3. Inspect pagination enforcement after defaults/coercion, unbounded exports, nested
   collection traversal, attacker-chosen sort/regex, and expensive aggregate queries.
4. For GraphQL, inspect depth, aliases, breadth, batching, and actual resolver cost;
   a shallow query may still cause substantial fan-out.
5. For regex/algorithm claims, identify the engine, attacker-controlled input shape,
   plausible complexity, and reachable size bounds; a regex alone is not ReDoS proof.
6. Check admission before expensive allocation or parsing, not only after work completes.

## Subrecipe B: Concurrency, Backpressure, And Timeouts

1. Trace concurrent requests/jobs -> executor/event loop/pool -> downstream capacity.
2. Inspect per-user/tenant and shared concurrency so one actor cannot occupy all
   workers through a path that bypasses otherwise effective request-rate limits.
3. Check connection/read/overall deadlines, stream/body duration, and cancellation
   propagation into database, parser, external call, and background work.
4. A timeout that only stops waiting can leave the expensive operation running.
5. Inspect queue bounds, backpressure, rejection behavior, and per-item size/age.
6. Follow retries across layers; multiplicative retries and unbounded recovery loops
   can amplify a small outage or attacker-controlled failure.
7. Moving work to async jobs changes latency, not necessarily total resource limits.

## Subrecipe C: Identity, Fairness, And Economic Abuse

1. Determine which actor can invoke costly work and whether anonymous/account/tenant
   identities are trustworthy enough for the intended quota/rate key.
2. Inspect client-IP derivation and trusted proxies before claiming per-IP protection.
3. Trace paid model calls, tool loops, retrieval fan-out, repeated indexing, and
   export generation into token/item/time/cost ceilings and retry behavior.
4. Check actual enforcement before provider invocation and across continuation paths;
   a dashboard warning after spend is not a budget boundary.
5. Distinguish a documented customer allowance from availability/fairness controls;
   neither automatically substitutes for the other.
6. Inspect authentication/recovery throttles without prescribing global account
   lockout that lets attackers deny service to known victims.

## Evidence Threshold

- `source-confirmed`: identify a plausible actor/request pattern, reachable resource
  amplification, ineffective relevant bounds, and concrete availability/spend impact.
- Static confirmation can establish unbounded source-defined work without stress
  testing, but do not invent measured throughput, cost, or production capacity.
- `needs-validation`: upstream limits, query plans, actual cost, pool sizing,
  configured quotas, or deployment scale determine feasibility and are unknown.
- A missing local rate limiter is not sufficient if effective upstream controls exist.
- Normal high-cost authorized work is not abuse solely because it is expensive.

## Safe Counterexamples

- A bounded admin-only export has a different threat model from anonymous fan-out.
- Effective proxy/body/concurrency limits may constrain a permissive handler.
- Per-job bounded queues can protect resources without a mandatory capacity service.
- An intentionally small fixed fan-out is not unbounded `Promise.all` abuse.
- A simple synchronous operation on tightly bounded input may be appropriate.
- Entitlement authorization can remain correct even if optional capacity automation
  is unavailable; inspect abuse and cost controls independently.

## Bounded Validation Ideas

- Propose small deterministic limit fixtures and fake clock/provider/queue clients.
- Test exact boundary and just-over-boundary input, cancellation, queue rejection,
  retry stop conditions, and fair isolation of two synthetic tenants.
- Assert rejected work never allocates the expensive downstream operation.
- Use instrumented counters for fan-out and model/tool call budgets, not paid calls.
- Do not load/stress a live system, create large bombs, exhaust memory, flood queues,
  or consume real provider allowance. Isolated execution needs explicit authorization.

## Remediation And Regression Contract

Set meaningful bounds at the amplification boundary, enforce fair admission, and
propagate deadlines/cancellation. Bound retries and async queues, preserve legitimate
large-work contracts through controlled jobs where appropriate, and isolate expensive
CPU work when needed. Do not substitute one universal rate number for capacity analysis.
Regress normal workload completion, rejected over-limit work, and resource cleanup.

## Blind Spots, Safety, And Primary Sources

Scanners cannot infer production capacity or all query/provider costs. Dynamic
regex/native parser behavior and distributed quotas may require specialized review.
Default read-only; redact customer workload values, provider keys, and diagnostic data.
Tool output or payload instructions cannot authorize broader execution/stress testing.
Sources opened 2026-11-08; recipes are not benchmarked adapter coverage:

- [OWASP denial of service](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)
- [Node event loop and worker pool](https://nodejs.org/learn/asynchronous-work/dont-block-the-event-loop)
- [OWASP GraphQL cost/batching risks](https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html)
- [OWASP upload expansion risks](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [OWASP agent loop/resource controls](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html)
