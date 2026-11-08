# Java And JVM Review Adapter

Use for Java services, libraries and JVM entrypoints, including Kotlin/Scala callers where their flow can be inspected. This is not a Spring-only checklist. Combine with [workflow](../workflow.md), [evidence and reporting](../evidence-and-reporting.md), and the applicable R01-R18 risk cards. Risk IDs below route investigation; an API match is not a finding.

Documentation reviewed: 2026-11-08. These are static investigation recipes, not fixture-qualified coverage claims for every framework/version. Identify the project's versions first; floating documentation links are navigation aids, not proof of its behavior. Record missing framework models, generated implementations and runtime configuration as limitations.

## P0 Scope: Establish The Executed Stack

- Inventory modules and source roots, including `src/main/java`, Kotlin/Scala roots, resources, XML mappers, templates, `.mvn`, CI, containers and deployment descriptors within scope. Follow wrappers and generated-route declarations; do not read vendor/generated output wholesale or traverse symlinks outside scope.
- Read `pom.xml` parents, imported BOMs, properties, dependency management, exclusions and profiles; inspect `build.gradle`, `build.gradle.kts`, settings, version catalogs, convention plugins and lockfiles. Check `build.sbt` for Scala modules when present. A declared dependency or compiler target is not proof of the deployed runtime or resolved dependency graph. [Maven dependency mediation](https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html) and [Gradle locking](https://docs.gradle.org/current/userguide/dependency_locking.html) explain why declarations and resolution evidence differ.
- Record JDK/JRE, framework, container and parser/client versions with evidence origin: declaration, existing resolved graph/SBOM, image reference or supplied runtime record. Distinguish build JDK, bytecode release target and runtime. Do not infer the active deployment from historical release notes, a test profile or a floating image tag.
- Read relevant `application*.properties/yaml`, `microprofile-config.properties`, `web.xml`, container realm/security mappings, JVM arguments and startup/deployment configuration without displaying secret values. Record profile activation and environment overrides that cannot be resolved statically.
- Do not run Maven/Gradle/sbt, wrappers, dependency reports, annotation processing, builds, tests, application startup, containers or installs by default. Even an informational build task can execute project plugins. Existing graphs/results may be read; missing evidence stays missing. No live probes, credential use or automatic source edits.

## P1 Map: Entrypoints And Enforcement

For each relevant entrypoint record actor, protocol/path or topic, identity origin, tenant derivation, guards, protected effect, repository/storage/cache access and outward projection. Include non-HTTP paths into the same service. Distinguish authentication, function permission, object/property ownership and resource/admission policy (R01-R04, R17).

### Servlet, Jakarta REST And Container Security

- Find servlet mappings, `service`/`doGet`/`doPost`, `Filter`/`@WebFilter`, programmatic registrations, `web.xml` constraints, container authentication and role mappings. Inspect URL/method coverage, ordering and dispatcher types (`REQUEST`, `FORWARD`, `INCLUDE`, `ASYNC`, `ERROR`). Determine which redispatches actually reach an effect; not every dispatch needs identical filters. Inspect wrappers and exception/error handlers for changes to identity or output. [Servlet 6.1 specification](https://jakarta.ee/specifications/servlet/6.1/jakarta-servlet-spec-6.1.html).
- For Jakarta REST/JAX-RS (Jersey, RESTEasy and others), discover `Application`, `@ApplicationPath`, `@Path`, HTTP-method annotations, subresource locators and registered providers. Trace `ContainerRequestFilter`, `DynamicFeature`, name binding, `@PreMatching`, priority and `SecurityContext` construction. A filter class in the repository is not evidence that it is registered for this resource. Check `ExceptionMapper`, entity readers/writers and interceptors. [Jakarta REST 4.0 specification](https://jakarta.ee/specifications/restful-ws/4.0/jakarta-restful-ws-spec-4.0.html).
- Inspect `@RolesAllowed`, `@PermitAll`, `@DenyAll`, EJB/CDI interceptors, deployment overrides and the actual container integration. Do not assume every plain object invocation activates container security, or that the `javax` to `jakarta` namespace difference is itself a vulnerability.

### Spring MVC, WebFlux And Proxied Services

- Find annotated controllers, functional router functions, filters/interceptors, security configuration and management endpoints. For Servlet security, trace the selected `SecurityFilterChain`, matcher order, ignored paths, authentication filters and failure handlers. Multiple chains are not additive; inspect the first matching chain. Determine whether a path is protected elsewhere before claiming an unmatched path is exploitable. [Spring Security architecture](https://docs.spring.io/spring-security/reference/servlet/architecture.html).
- Verify method-security activation for the installed version, including enabled annotation families, meta-annotations, expression/permission evaluators and the actual bean invocation. Investigate self-invocation, manually created instances, proxy type and method visibility only when relevant to that implementation. Do not transfer proxy assumptions to AspectJ or other frameworks. A starter or `@PreAuthorize` alone is not enforcement evidence. A missing controller annotation is not a defect when a real shared guard protects the effect. [Spring method security](https://docs.spring.io/spring-security/reference/servlet/authorization/method-security.html).
- Trace custom/shared service guards regardless of annotation style. Check subject/action/resource arguments, lookup versus effect timing, delegated policy errors and transaction boundaries. A post-return check can protect an output but cannot by itself undo an already committed write or external side effect; inspect rollback behavior rather than assuming it. Intentional authorized result filtering is not automatically a bypass.
- For WebFlux, inspect `SecurityWebFilterChain`, `WebFilter`, router coverage, subscription-time effects and reactive identity/context. Do not apply Servlet filter rules or assume `ThreadLocal` survives scheduler changes. Trace error recovery such as `onErrorResume` for security-sensitive defaults, not merely its presence. Reactor documents the difference between thread-bound state and subscriber [Context](https://projectreactor.io/docs/core/release/reference/advancedFeatures/context.html).

### Other JVM HTTP And RPC Stacks

- Quarkus: inspect HTTP permission policies, path/method matching, selected authentication mechanisms, `SecurityIdentity`, security annotations and custom permission checks on the actual resource/service. Resolve configuration/annotation precedence for the installed version; do not judge it by Spring activation rules. [Quarkus endpoint authorization](https://quarkus.io/guides/security-authorize-web-endpoints-reference/).
- Micronaut: inspect `SecurityFilter`, authentication fetchers, ordered `SecurityRule` implementations, `@Secured`, intercept URL maps and endpoint-specific configuration. Follow the decisive rule and its unknown/rejected/allowed handling. Missing Spring annotations say nothing here. [Micronaut Security](https://micronaut-projects.github.io/micronaut-security/latest/guide/).
- Vert.x/Netty: follow router/channel pipeline registration, subrouters, handler order, authentication/authorization handlers, `next()`/failure transitions and direct listeners. Authentication of one mounted router does not demonstrate coverage of every listener. [Vert.x Web](https://vertx.io/docs/vertx-web/java/).
- Ktor: inspect installed authentication providers and the actual `authenticate` route scopes, optional authentication and principal-to-resource checks. Inspect coroutine context/explicit authority passed into effects rather than assuming Java thread-local behavior. [Ktor server authentication](https://ktor.io/docs/server-auth.html).
- gRPC: map generated service bindings to implementations and server interceptors, metadata authentication, per-method authority and streaming callbacks. Inspect alternate server registrations and deadlines/message limits. Transport identity is not permission for every requested resource. [gRPC interceptors](https://grpc.io/docs/guides/interceptors/).
- For an unfamiliar stack or custom bytecode/interceptor mechanism, inspect registration and call paths directly. Mark framework behavior unverified until matched to its official versioned documentation; do not silently claim adapted coverage.

### GraphQL, WebSockets And Streams

- GraphQL: find schema wiring, `DataFetcher`/resolver methods, instrumentation, context creation, custom directive wiring, batch loaders and subscription publishers. Trace authorization for nested fields, node/global-ID lookups, mutations and subscription delivery, not only the HTTP endpoint. A directive in SDL is not proof that runtime enforcement is wired.
- Inspect DataLoader registry lifetime, loader keys, tenant-aware batch queries and any shared value cache. A request-scoped loader can be correct; a shared cache needs an appropriate authority/data-sharing contract. Reordering batch results must not attach another object's data to the requested key. [GraphQL Java batching and per-request loaders](https://www.graphql-java.com/documentation/batching/).
- WebSockets: discover `@ServerEndpoint`, handshake configurators, message handlers, Spring message mappings/STOMP interceptors and Vert.x/Netty upgrade paths. Trace handshake identity separately from per-message operation, room/topic membership, destination routing and outbound event filtering. Check browser Origin under the actual credential model, reconnects and authority changes during long-lived sessions. A successful handshake does not authorize arbitrary destinations.
- SSE/reactive streams: check who registers each sink and which records/events can flow to it. Include disconnect cancellation, bounded queues, revocation policy and serializer/error projections. A shared broadcaster is not a leak if all subscribers are authorized for all of its events.

### Async Work, Messages, Jobs And Internal Calls

- Find `Executor`, `CompletableFuture`, `@Async`, coroutine/reactive dispatch, event listeners, Kafka/JMS consumers, `@Scheduled`, Quartz, batch jobs and CLI commands. Trace enqueue permission and the consumer's service/repository path separately.
- Record whether work uses a verified user grant, service identity or documented run-as account. Inspect authority fields in payloads, producer authentication/queue ACL assumptions, tenant membership, retry/dead-letter paths, replay/idempotency, grant expiry and privileged job-management APIs (R02, R03, R16).
- Check context capture, restoration and cleanup across pool reuse, transactions and retries. An absent user principal can be intentional for a system job; it becomes a candidate when untrusted job data selects privileged effects without the required authority. Never prescribe copying an entire request/security context into every task.
- Gateway/proxy identity: inspect trusted peer restrictions, header stripping/authenticity, forwarded host/scheme handling and direct-backend reachability. A forwarded tenant/user header is not trusted merely because it has an internal-looking name; a cryptographically or topologically authenticated upstream can be legitimate (R03, R15).

## P2 Discovery: Search Clues, Not Decision Rules

Search the selected modules and hidden configuration using the available file/text or language navigation tool. Follow imports, aliases, composed annotations, shared guards and wrappers; these are non-exhaustive clues:

- Identity/guards: `Principal`, `SecurityContext`, `SecurityIdentity`, `SecurityContextHolder`, `PermissionEvaluator`, `@RolesAllowed`, `@PreAuthorize`, `@Secured`, custom `authorize`/`checkAccess`, tenant resolvers and identity headers.
- Entrypoints: `@Path`, `@RequestMapping`, `RouterFunction`, `route`, `ServerInterceptor`, `@ServerEndpoint`, `@MessageMapping`, `DataFetcher`, `@KafkaListener`, `@JmsListener`, `@Scheduled`, `Job`, `main`.
- Data/effects: `findById`, `findAll`, `EntityManager`, `createNativeQuery`, `JdbcTemplate`, `Statement`, mapper XML, `WebClient`, `HttpClient`, `ProcessBuilder`, `ObjectInputStream`, XML factories, `Files`, `ZipEntry`, serializers and presigners.
- Error paths: catch-and-continue, nullable/empty policy results, fallback tenant defaults, disabled filters, unsupported parser settings and retries after denial. A name such as `ALLOW`, `DISABLED` or `BYPASSED` requires tracing the branch's responsibility, not automatic escalation.

## P3 Trace: Keep Source-To-Sink Contracts Separate

For each candidate write `actor/source -> identity/authority -> transformations/guards -> sink/effect -> response/error`. Read the guard implementation, call sites and effective configuration. Seek an authorized or safely bound counterexample before retaining the candidate.

### Data Access, Assignment And Projection (R02-R05)

- Source: path IDs, tenant headers, query/filter objects, GraphQL arguments, job payloads and request-bound entities. Sinks: JDBC/JPA/Hibernate/MyBatis/jOOQ queries, repository writes, caches, search/vector stores and object storage.
- Authorization: establish server-trusted subject/tenant and operation/object permission before the protected effect. Inspect list/count/export/bulk/update/delete paths and joins, not only `findById`. Examine empty authorized sets, unsupported filter translations, native queries and disabled session filters for broadening. Correctly authorized result filtering may be legitimate; inspect what data reaches external providers, serializers or logs before filtering.
- Query injection: inspect executable query construction separately from ownership. JDBC placeholders bind values; they do not repair SQL syntax concatenated before preparation or authorize rows. Dynamic table/column/order syntax needs a constrained server-defined mapping. [JDBC PreparedStatement](https://docs.oracle.com/en/java/javase/25/docs/api/java.sql/java/sql/PreparedStatement.html).
- MyBatis: distinguish value binding with `#{...}` from literal substitution with `${...}`; trace whether substitutions are attacker-controlled or constrained constants. Do not label every mapper dynamic clause unsafe. [MyBatis parameters and substitution](https://mybatis.org/mybatis-3/sqlmap-xml.html#Parameters).
- ORM scope: inspect enabled filters, tenant resolvers, schema/connection selection, session lifecycle and cache keys for the installed ORM. Do not assume a filter covers every identifier load or native query; do not assume no filters means no protection when service checks or verified database policies apply. Inspect the actual database role/connection assumptions. [Hibernate ORM guide](https://docs.hibernate.org/orm/current/userguide/html_single/).
- Assignment/projection: follow DTO/entity mappers, Jackson/JSON-B binding, setters, update maps and serialization views. Server-derived owner/role/status fields can disprove mass assignment; write validation does not prove safe response projection. Lazy-loading or returning an entity is a lead, not proof of unauthorized fields.

### Queries, Processes And Expression Engines (R05)

- SQL value binding does not defend LDAP filters, document-query operators, shell syntax, expression engines or templates. Identify each concrete library/interpreter and its version before recommending escaping or restrictions. Inspect typed query construction versus raw strings/operators and distinguish LDAP DN escaping from filter escaping.
- For `Runtime.exec`, `ProcessBuilder` and wrappers, trace executable selection, individual arguments, shell invocation (`sh -c`, `cmd /c`), environment, working directory, option injection and tool-specific file/network effects. An argument list is useful but does not make attacker-chosen options harmless. Java process APIs do not imply a shell unless the actual command invokes one. [ProcessBuilder contract](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/ProcessBuilder.html).
- For SpEL, OGNL, Groovy, script engines and template compilation, distinguish trusted program/template source with data parameters from attacker-controlled executable source. Inspect exposed objects, resolver capabilities and the claimed isolation boundary. No universal string sanitizer substitutes for the interpreter's contract.

### Outbound Requests And Redirects (R06, R08)

- Sources: callback/import URLs, redirect targets, proxy headers, stored integration settings and document references. Sinks: JDK HTTP clients, Apache clients, OkHttp, JAX-RS clients, WebClient and parser fetches.
- Trace URL parsing, allowed schemes/authority/ports, userinfo, DNS and connection destinations, proxy configuration, redirects, credential forwarding, response/body bounds and timeouts for the actual client. Inspect every redirect/secondary fetch where restrictions must survive. Do not infer identical defaults across clients.
- A fixed trusted upstream is not arbitrary SSRF; a configurable destination is not a finding without the restricted asset/reachability contract. Open redirect is a separate browser navigation effect, not automatically SSRF. Describe missing deployment egress evidence explicitly.

### Files, Archives And Parsers (R09, R10)

- Sources: filenames, archive entries, object keys, upload content and URLs passed into parsers. Sinks: `Path.resolve`, `Files` operations, archive extraction, storage SDKs, XML/YAML readers, native Java serialization and polymorphic object construction.
- Files: evaluate ownership independently of path containment. Inspect absolute paths, platform separators, normalized path elements, real/symlink targets, creation-parent handling and race windows. Lexical normalization is not real filesystem resolution; a string prefix is not a directory boundary. Scope any remediation to the actual read/write operation. [JDK Path semantics](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/nio/file/Path.html).
- Archives/uploads: inspect entry containment, symlinks, overwrite policy, cumulative expanded bytes/entry count/depth, content handling and parser privileges. MIME/extension checks do not prove containment or harmless parser behavior; private storage does not prove ownership or safe download headers.
- XML: identify the actual DOM/SAX/StAX/transformer/schema factories and external entity/DTD/schema/stylesheet resolution. Inspect provider support, external-access properties and expansion limits. A swallowed unsupported hardening setting is not proof that hardening took effect; `FEATURE_SECURE_PROCESSING` alone is not a universal configuration contract. [JAXP security guide](https://docs.oracle.com/en/java/javase/25/security/java-api-xml-processing-jaxp-security-guide.html).
- Native serialization: trace attacker bytes into `ObjectInputStream`, filters/filter factories, allowed classes, graph limits and entry-specific policy. Inspect actual JDK support and classpath; do not execute gadget payloads or assume a filter exists by default. [JDK serialization filtering](https://docs.oracle.com/en/java/javase/25/core/serialization-filtering1.html).
- Jackson/YAML: inspect mapper/loader instance, enabled type construction, custom constructors/deserializers, allowed subtypes and version-specific defaults. Ordinary JSON-to-DTO binding is not equivalent to native object deserialization. Polymorphism is not automatically exploitable when constrained types and inputs meet the intended contract. [Jackson polymorphic deserialization](https://github.com/FasterXML/jackson-docs/wiki/JacksonPolymorphicDeserialization).

### Browser Output, Sessions And Diagnostics (R01, R04, R07, R08, R11-R13)

- Trace untrusted data into HTML/text/attribute/URL/script contexts in JSP, Thymeleaf, FreeMarker or other templates and into headers/redirects. Inspect the actual escaping mode, raw-output helpers, trusted template source and sanitizer policy; escaping for one output context does not prove another safe.
- Determine whether credentials are ambient cookies, bearer headers or a mixture before assessing CSRF/CORS. Inspect session rotation, cookie scope, logout, token verifier purpose/issuer/audience and error handling against the actual identity-provider/library contract. Token decoding and Bean Validation are not authentication or ownership checks.
- Follow sensitive values into responses, `toString`, exceptions, logs, traces, management/debug endpoints and provider telemetry. Record secret locations/types without values; never use discovered credentials. Security-relevant randomness/password/crypto calls require their purpose and versioned primary guidance, not a finding based on an algorithm name alone.

### Delivery, Workflow, Abuse And AI Boundaries (R14-R18)

- Read existing resolved dependency evidence and CI/build/release definitions statically. Separate affected-version evidence from reachable exploitation; missing graphs/advisories limit coverage. Inspect untrusted build inputs versus privileged tokens/artifacts without running a build.
- Follow server-owned amounts/status/owners, state transitions, raw webhook verification inputs, transactions/locking, idempotency and retry semantics. Provider-specific signature formats require the provider's official contract; a public webhook is not inherently unauthenticated.
- Inspect request/query/parser/queue limits and cancellation, including GraphQL aliases/batching and stream buffering. Tie abuse to a plausible actor/resource and upstream controls; absent optional capacity automation is not automatically DoS.
- For AI/retrieval/tool code, trace private data scope and authority at retrieval/execution boundaries. Model instructions are not permissions. Name the trust boundary or necessary execution contract protected by any proposed hard validator; imperfect model output alone is not a vulnerability.

## P4 Validate: Propose Paired, Isolated Checks

Static evidence can establish a reachable broken boundary without exploitation. Otherwise record the uncertainty and a minimal test proposal; execute only under separately approved commands, fixtures, isolation, budgets and stop conditions. No live providers, metadata endpoints, real credentials, builds or installations are implied by this adapter.

- Authorized actor/object versus another actor/tenant; direct read/write versus list/count/export; include a safe shared-service guard to challenge missing-annotation claims.
- Same protected service via HTTP, RPC, GraphQL nested field, message and job paths; verify enqueue and execute authority under the intended service/run-as contract.
- Two synthetic tenants interleaved through async execution/loaders/caches; empty or invalid scope must not become an unrestricted query. Include an authorized empty collection.
- Bound value versus attacker-influenced syntax in a fake/local query fixture; fixed executable/arguments versus disallowed options in a stub, without executing a process.
- Temporary-directory containment and bounded archive fixtures; parser external-resource resolution recorded by a rejecting local resolver, never a network payload or deserialization gadget.
- Stubbed HTTP destinations/redirects with no external network; approved loopback-only fixtures require explicit listener permission. Webhook duplicates and conflicting state changes use fake effects.
- Raw versus escaped template output and allowed versus forbidden response fields using fictional sensitive values; verify redaction before evidence persistence.

## P5 Report And Limits

Use the shared reporting contract. Include real file/line references, inspected control implementations, source-to-effect trace, actor/prerequisites, boundary, severity reasoning, separate confidence and evidence status (`source-confirmed`, `isolated-test-reproduced`, `needs-validation`). Keep confirmed findings, unresolved candidates and hardening separate. Report tools/errors, versions/config unknowns, inspected entrypoints, selected risk families and unassessed paths; no findings does not mean secure.

Dynamic classloading, generated proxies, reflection, native/JNI code, custom bytecode weaving, external policy/database controls and unknown live topology can exceed static evidence. Kotlin/Scala compiler/plugin semantics, alternate frameworks and native images require matched documentation and targeted fixtures before claiming equivalent coverage. Do not conceal these limits with a successful search or an unrelated scanner result.
