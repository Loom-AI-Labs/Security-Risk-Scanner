# Node.js And TypeScript Review Adapter

Use for Node services, JavaScript/TypeScript packages, full-stack web code and browser integrations. Do not assume Express, Nest or a particular ORM. Combine with [workflow](../workflow.md), [evidence and reporting](../evidence-and-reporting.md), and the applicable R01-R18 risk cards. A match identifies a candidate, not an exploit.

Documentation reviewed: 2026-11-08. Recipes are not fixture-qualified support claims for every framework/runtime. Match documentation to the project's installed versions; unversioned/latest links are navigation aids. Bun, Deno, edge runtimes, native addons and unfamiliar framework integrations need explicit limits rather than inherited Node coverage.

## P0 Scope: Discover Runtime, Packages And Effective Configuration

- Inventory workspaces and server/browser/shared packages. Read `package.json`, `package-lock.json`, `npm-shrinkwrap.json`, `pnpm-lock.yaml`, `yarn.lock`, workspace declarations, `tsconfig` references/aliases, bundler configuration and framework route conventions within scope. Account for CommonJS/ESM imports, re-exports, wrappers and generated route declarations.
- Record runtime evidence from `engines`, `.nvmrc`, `.node-version`, Volta/toolchain settings, container images and deployment definitions. A compatible engine range is not the running version. Separate declared semver ranges, locked/resolved versions, workspace overrides/resolutions and supplied runtime records. A development dependency may still execute with build/release privileges.
- Inspect startup scripts, serverless handler exports, Docker entrypoints, environment loaders, proxy configuration, cookie/session settings and runtime-specific networking. Read configuration as data, not by importing/executing a `.js`/`.ts` config. Identify unknown environment overrides and generated deployment artifacts.
- TypeScript annotations, assertions and generics do not validate untrusted runtime values. Follow actual schema parsing, coercion, unknown-property policy and the values subsequently consumed. [TypeScript erased types](https://www.typescriptlang.org/docs/handbook/2/basic-types.html#erased-types).
- No package installation, `npx`/equivalent downloads, build/typecheck/lint/test scripts, framework startup, containers, hooks or migrations by default. Even a test or config import can execute application code. Package lifecycle scripts are executable build inputs, not harmless metadata. [npm script lifecycle](https://docs.npmjs.com/cli/v11/using-npm/scripts/).
- No live APIs, probes, credentials or source changes. Existing local result files may be read; unavailable tools or unresolved dependencies must be reported, never replaced with an undisclosed claim of equivalent coverage.

## P1 Map: Entrypoints, Guards And Effects

For each path record actor, input/protocol, identity and tenant origin, middleware/guard/service enforcement, protected operation/repository/storage/cache, serialization and error handling. Include internal callers and non-HTTP paths. Separate authentication, function permission, object/property ownership and rate/admission policy (R01-R04, R17).

### HTTP Routers, Middleware And Proxies

- Native `http`/`https` and custom servers: follow request listeners, URL/method dispatch, body parsing, upgrade handlers and wrapper registration. Map every listener, not just the package's nominal framework. Inspect header/body/time limits and cancellation in the actual runtime/proxy configuration; defaults vary by version. [Node HTTP API](https://nodejs.org/api/http.html).
- Express: inspect `app.use`, router mounting/order, method/path matching, nested routers, route arrays, middleware short circuits, `next()`/`next('route')` and error handlers. A guard declared after an effect cannot protect it; absence of a local guard is not a finding when an effective parent or service guard applies. Check async rejection behavior against the installed major version. [Express middleware](https://expressjs.com/en/guide/using-middleware/).
- Koa: trace composed middleware both before and after `await next()`, router mounting, `ctx.state` identity, exception translation and response mutation. A check after downstream work may be too late for a write, but not every post-processing middleware is a security check. [Koa middleware composition](https://koajs.com/).
- Fastify: inspect plugin registration, encapsulation boundaries, hook phase/order, route-specific hooks, decorations and alternate instances. A hook in a sibling plugin does not imply route coverage. Distinguish lifecycle authentication, parsed-input validation, effect authorization and serialization. [Fastify hooks](https://fastify.dev/docs/latest/Reference/Hooks/) and [encapsulation](https://fastify.dev/docs/v5.0.x/Reference/Encapsulation/).
- Nest: trace bootstrap, `APP_GUARD`/`useGlobalGuards`, controller/method guards, custom decorators/metadata overrides, execution context and service calls. Pipes validate shape; they do not establish ownership. Inspect connected microservice/GraphQL/WebSocket integration rather than assuming HTTP global-guard behavior transfers; hybrid microservices do not inherit `useGlobalGuards()` by default. [Nest guards](https://docs.nestjs.com/guards).
- Reverse proxies/gateways: inspect `trust proxy` or equivalent against hop topology, direct-origin access and overwritten forwarded host/proto/IP/identity headers. A trusted header is only evidence when the trust boundary authenticates its source. IP-based throttles, redirects, secure-cookie decisions and origin checks may depend on this configuration. [Express proxy trust](https://expressjs.com/en/guide/behind-proxies/).

### Full-Stack Routes And Browser Boundaries

- Find filesystem routes, API handlers, server actions, loaders/actions, RPC procedures and middleware/proxy matchers. Follow data-access helpers, not only page components. For Next.js inspect Pages/App Router differences, route handlers and server actions, plus `middleware`/`proxy` naming for the installed version. Treat callable actions as server entrypoints with their own input and authority requirements; hidden buttons/action IDs are not authorization. [Next.js data security](https://nextjs.org/docs/app/guides/data-security).
- Trace private data from server-side fetches into props, hydrated payloads, client components, caches, errors and public environment-variable substitution. Server-only module placement does not authorize every caller; a verified DAL projection can disprove an apparent broad server fetch leak. Read framework cache scope/key/invalidation behavior before claiming cross-user reuse.
- Inspect browser `message` handlers, workers, iframes, service workers and storage/event integrations. Trace exact origin/source/peer expectations, message schema, capability/resource scope and navigation targets. CORS controls browser response access; it is not backend authorization, and hidden UI or client-side route guards are not server enforcement.

### GraphQL, WebSockets, RPC And Streaming

- GraphQL: discover schema/resolver maps, context factories, resolver wrappers/directives, federation/subgraph paths, batch endpoints, loaders and subscriptions. Check nested fields, node-ID lookup, mutations and response projection against the viewer, not only endpoint authentication. Inspect query complexity, aliases, batching and pagination separately from authorization. [Apollo authentication and resolver authorization](https://www.apollographql.com/docs/apollo-server/security/authentication).
- DataLoader/cache: inspect actual instance lifetime, tenant/viewer keys, batch query scope, returned-key ordering and cross-request caches. Request-local caching is not automatically a leak; shared caching is not automatically wrong when the data-sharing contract and keys fit. A TypeScript generic does not enforce these properties.
- WebSockets: map upgrade listeners (`ws` or native), Socket.IO namespaces/rooms, connection middleware, event handlers, acknowledgments and outbound broadcasts. Verify authenticated handshake, Origin under ambient credentials, per-event resource permission, room membership, reconnect/recovery and revocation policy. Socket.IO middleware runs once per connection, not once per event; event authorization must be traced separately. [Socket.IO middleware](https://socket.io/docs/v4/middlewares/).
- Trace RPC/service procedures and gRPC interceptors/context into protected effects, including streaming callbacks and separate server registrations. Follow SSE subscription registration to event selection and buffering/cancellation. A public stream is not a finding without identifying private events or disproportionate resource use.

### Service Guards, Async Boundaries, Jobs And Functions

- Follow controller/resolver/router handlers into shared service guards and repository helpers, including functions exported for CLI/jobs/tools. Inspect caller-controlled actor/tenant/role arguments, confused-deputy paths, swallowed denials, missing `await` and effects started before a guard promise resolves.
- Locate `AsyncLocalStorage`, request-scoped DI, module singletons, event emitters, timers, worker threads/processes, queue producers/consumers (BullMQ or others), cron/schedulers and serverless handlers. Inspect context creation/cleanup and actual propagation behavior. An async context store can carry an identity; it does not authenticate its contents or automatically survive a serialized queue/worker boundary. [Node async context](https://nodejs.org/api/async_context.html).
- Map enqueue versus execution permission, service/run-as authority, payload tenant/object fields, queue producer trust, idempotency, retry/dead-letter processing, delayed execution/revocation policy and job-management endpoints. A job need not impersonate a user; it needs the authority required by its declared effect.
- For serverless adapters, distinguish trusted platform identity metadata from caller body/headers and inspect direct function invocation or alternate event sources. Read provider-specific primary docs before making claims about platform-authorizer coverage. Do not assume a single HTTP middleware protects every trigger.

## P2 Discovery: Follow Actual APIs And Wrappers

Use scoped file/text or language navigation. Search clues are non-exhaustive and are not lexical verdict rules:

- Routes/guards: `createServer`, `Router`, `app.use`, `addHook`, `preHandler`, `UseGuards`, `APP_GUARD`, `canActivate`, resolver maps, `use server`, handler exports, `upgrade`, `io.use`, `socket.on`, `authorize`, tenant/session helpers.
- Inputs/context: `req.body/query/params/headers`, cookies, `URLSearchParams`, raw webhook bodies, GraphQL args/context, `postMessage`, `AsyncLocalStorage`, queue payloads, stored integration configuration and external/model content.
- Sinks: `query`, `$queryRaw`, `$executeRaw`, `$queryRawUnsafe`, `raw`, repository calls, Mongo filters/update operators, `child_process`, `eval`, `new Function`, `vm`, template compilers, `fetch`/Axios/Undici, `fs`, archive extractors, `innerHTML`, serializers and presigners.
- Scope-loss paths: empty tenant filters, `undefined`/omitted predicates, object spread/update maps, shared caches, catch-and-continue, unhandled promises and fallback identities. Determine actual library semantics; a potentially omitted filter is not a confirmed unrestricted query without tracing the consumed value/configuration.

## P3 Trace: Different Sinks Need Different Controls

Record `actor/source -> identity/authority -> transforms/guards -> sink/effect -> response/error`. Inspect guard implementation and ordering, wrapper behavior and configuration. Look for counterevidence that makes the candidate safe.

### Authorization, Query Construction And Assignment (R02-R05)

- Sources: IDs, tenant selectors, query objects, mutation inputs, queue data and browser messages. Sinks: SQL/NoSQL repositories, object/vector stores, cache reads/writes, updates and serializer projections.
- Trace server-trusted subject and membership separately from object-ID unpredictability or SQL binding. Inspect list/count/export, relation traversal, nested writes, bulk operations, upserts and direct access; evaluate object/property scope and cache keys. Check empty sets, omitted predicates, raw-query bypasses and database policy/connection assumptions.
- SQL: inspect the actual driver/ORM's binding contract. `pg` binds values but not SQL identifiers; constrain dynamic table/column/order syntax separately. Proper binding can dismiss an injection candidate without resolving an authorization question. [node-postgres query parameters](https://node-postgres.com/features/queries).
- Tagged SQL: verify the tag implementation, value parameters, raw fragments, dynamically constructed templates and unsafe variants. A tagged template is not universally safe, and a raw-query API is not universally injectable. Prisma's safe parameterization differs from raw fragments/unsafe string construction; match the installed version. [Prisma raw queries](https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries).
- Document queries: inspect whether untrusted values can become operators, field paths, server-side expressions or update documents. A bound JSON object can still express unwanted query semantics. Look for schema-validated scalar inputs, explicit operator construction and independent tenant scoping; do not reuse SQL escaping advice for Mongo/Redis/search DSLs.
- Mass assignment: trace spread, `Object.assign`, ORM `data`/update objects, DTO transformation and nested relation operations. Determine which server-owned owner/tenant/role/status fields are writable. Explicit server-derived fields can make broad-looking mapping safe; validation and response projection remain separate contracts.

### Processes, JavaScript And Templates (R05)

- Trace `exec`/`execSync`, `spawn`/`execFile`, wrappers, executable paths, args, `shell` flags, environment and cwd. Avoiding a shell does not prevent argument/option injection or unsafe executable choice. Node documents that `execFile` does not use a shell by default; actual options/platform/wrappers still matter. [Node child processes](https://nodejs.org/api/child_process.html).
- For `eval`, `Function`, dynamic module loading and template engines, distinguish attacker-controlled code/template source from data consumed by a trusted program. Inspect engine escaping modes, helpers and execution capabilities. HTML sanitization is not JavaScript or shell isolation.
- `node:vm` contexts are not a security boundary for hostile code. Determine whether the product claims to isolate attacker code and which external isolation actually exists; mere use for trusted code is not a finding. [Node VM security warning](https://nodejs.org/api/vm.html).
- Schema compilers: trusted checked-in schema compilation using `new Function` is not the same as executing arbitrary user code. Investigate whether callers can supply/modify schemas or references. Fastify explicitly treats validation/serialization schema definitions as code. [Fastify validation and serialization](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/).

### Prototype Pollution And Unsafe Object Construction (R10)

- Source: parsed JSON, query parsers, path setters, deep merges and imported configuration. Sink: dynamic assignment/recursive merge/prototype mutation followed by a security-sensitive inherited-property read, request option, template behavior or other effect.
- Trace `__proto__`, `constructor.prototype`, traversal depth, own versus inherited properties, merge target and affected object lifetime. Validate the particular merge/parser version and reachable keys, not just a dependency name. A polluted target object and global `Object.prototype` mutation have different scope/impact.
- Counterevidence: explicit allowed own properties, suitable schemas, null-prototype dictionaries/`Map` and safe merge semantics can block a path. `JSON.parse` with a `__proto__` key alone does not mutate a prototype; object spread does not invoke the same setters as `Object.assign`. Either may still allow mass assignment of ordinary privileged fields. [MDN prototype-pollution mechanics](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/Prototype_pollution).
- Remediate the actual key traversal/merge/consumer contract, not only one string spelling. A runtime `__proto__` restriction is not proof that constructor/prototype paths or unsafe consumers are covered. Any isolated validation must use disposable objects/process state and synthetic flags, never shared application state.

### Outbound URLs, Files And Parsers (R06, R09, R10)

- Outbound sources include imports, webhooks, stored URLs, link previews and parser references. Trace into `fetch`, Axios, Undici, `http.request`, proxy wrappers and secondary fetches. Check schemes, host/port parsing, redirects, DNS/connection destination, proxy/agent behavior, credential forwarding, body/time limits and egress assumptions for the exact client version. Fixed trusted destinations can disprove arbitrary SSRF; a URL parser alone does not enforce destination policy.
- File sources include multipart names, archive entries, route IDs and object keys. Trace into `fs`, `path.resolve/join`, download/send-file wrappers, object SDKs and extractors. Check ownership independently from canonical containment, absolute paths, Windows/UNC semantics when deployed there, symlinks/creation parents, races, overwrite policy and expanded-size/count limits. Lexical normalization or extension checks are not a complete filesystem boundary.
- Inspect actual XML/YAML/parser settings for external entities/resources, constructors/tags and size/depth expansion limits. A YAML parser's executable-type behavior cannot be inferred from another package's defaults. Ordinary JSON parsing is not native object deserialization; custom revivers/type construction/merges need their own trace.

### Browser Output, Sessions And Webhooks (R01, R04, R07, R08, R16)

- Trace untrusted content into HTML/script/attribute/URL contexts, Markdown plugins, DOM operations, template raw helpers and `dangerouslySetInnerHTML`. Ordinary escaped React text is counterevidence to an HTML-injection allegation; raw HTML still needs the actual trusted-source/sanitizer contract. Inspect URL and script contexts separately. [React raw HTML guidance](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html).
- Inspect real token verification, key/algorithm/purpose/issuer/audience policy, session rotation/revocation and cookie scope. Decoding is not validation, and a decoded token used only for display need not be an authentication defect. Determine ambient-cookie versus explicit-header credentials before asserting a CSRF issue; CORS or schema validation does not replace authorization.
- Webhooks: trace byte-exact body handling, signature verification, timestamp/replay behavior only as required by the provider contract, secret lookup, tenant/integration binding and idempotent effects. Parsing before signature verification is a lead, not proof if raw bytes are preserved. Never invent one universal HMAC format or test against real providers.

### Secrets, Crypto, Errors, Delivery, Abuse And AI (R11-R18)

- Follow private values into logs, console output, error serialization, telemetry, client bundles, sourcemaps and public environment substitution. Distinguish public client IDs/keys and fictional fixtures from private credentials. Redact before persistence and never validate a secret against a provider.
- Inspect password/reset-token and crypto purpose, randomness, lifecycle and library configuration with current primary guidance; a checksum using a weak hash is not automatically a password-storage defect. Do not prescribe custom protocols.
- Review lockfile/advisory provenance and CI/publish scripts statically. Affected-version evidence is a dependency risk, not proof of reachable exploitation. Inspect privileged lifecycle/workflow execution of untrusted input, token scope, cache/artifact trust and generated public files without installing or building.
- Trace business-state transitions, transactions/conditional updates, idempotency and concurrent retries against the product contract. Inspect bounded body/query/regex/parser work, GraphQL fan-out, event-loop blocking, queue concurrency and provider budgets; name the resource/actor and account for upstream controls.
- For model/retrieval/tool flows, separate untrusted content from authority, tenant-scoped retrieval and execution grants. An imperfect answer is not a broken permission boundary. Any proposed hard validator must name the trust boundary or necessary execution contract it protects; do not substitute keyword blockers for contextual review.

## P4 Validate: Paired Checks, Not Automatic Execution

Static tracing can confirm a broken boundary. When runtime behavior is decisive, propose an isolated test with explicit fixture/command/isolation approval, bounded cost and stop conditions. No builds, installs, live services, credentials, stress tests or external probes are authorized by this adapter.

- User/tenant A versus B through direct, list/export, GraphQL nested and job paths; include a correct parent middleware/service guard as counterevidence.
- Two synthetic viewers interleaved through async stores, loaders and caches; inspect omission/empty-scope cases without querying a live database.
- Bound SQL values versus disallowed syntax; scalar document filters versus operator objects; explicit safe field selection versus privileged extra properties.
- Prototype-sensitive keys through the actual merge into disposable test objects, followed by the specific inherited-property consumer; compare safe JSON parsing/own-property handling without claiming every parser is vulnerable.
- Stub child-process calls, HTTP destinations/redirects and outbound credentials; no actual process or external network required. Loopback listeners need explicit approval even in a local test.
- Temporary filesystem/archive fixtures confined to approved scratch space; XML/YAML external resolution replaced with a rejecting stub and bounded content, not executable gadgets.
- Escaped versus raw output, cross-role projections and synthetic secret redaction; provider-authenticated fake webhook versus invalid/duplicate event and fake effects.

## P5 Report And Limits

Follow the shared evidence contract: stable finding ID/R-family, affected entrypoints, real file/line trace and inspected guard, actor/prerequisites/boundary, impact-based severity, separate confidence and evidence status (`source-confirmed`, `isolated-test-reproduced`, `needs-validation`). Separate confirmed findings, unresolved questions and hardening. Record runtime/config uncertainty, exclusions, tool failures and risk coverage; no score or security guarantee.

Dynamic imports/registration, generated clients, decorators, transpilation, native addons, external policy/database controls and opaque hosting may limit static tracing. Client and server packages in a monorepo can have different trust boundaries. Unsupported runtimes/protocols and unresolved library semantics remain unverified; a successful narrow scan does not upgrade them to covered.
