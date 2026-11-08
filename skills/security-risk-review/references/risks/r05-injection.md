# R05: Queries, Commands, Templates, And Interpreters

## Applicability And Boundary

Select when external input reaches a query language, executable argument parser,
template compiler, expression evaluator, or code loader.
The boundary is data acquiring executable syntax or unintended command semantics.
Separate each interpreter: SQL escaping does not defend LDAP, shells, or templates.
Follow stored values, messages, imports, and model output as well as HTTP input.
Parameterized data access still requires R02 authorization.

## Discovery: Java And Node

- Java: `Statement`, `PreparedStatement`, native/JPA queries, dynamic HQL/JPQL,
  Mongo query documents, JNDI filters, XPath, `Runtime.exec`, and `ProcessBuilder`.
- Inspect FreeMarker/Thymeleaf template-source APIs, SpEL/EL evaluation, script
  engines, class loading, and wrappers in Spring, Quarkus, Micronaut, or Jakarta.
- Node: raw/tagged SQL APIs, query builders, Mongo operators, LDAP filters,
  `child_process`, `exec`, `spawn`, `eval`, `Function`, and `node:vm`.
- Follow EJS/Handlebars/Nunjucks compilation, dynamic includes, expression packages,
  and user-defined transforms; a familiar library name does not establish safety.
- In Express/Nest/Fastify/Koa, trace middleware/pipe/schema transformations into the
  actual service sink. HTTP validation may not cover a message or scheduled caller.
- Record installed sink/driver/engine versions; optional taint tools require their
  own framework models and analysis-depth disclosure, as discussed in R14.

## Subrecipe A: SQL And ORM Languages

1. Trace input -> transformations -> query construction -> driver execution.
2. Separate value parameters from structural choices: identifiers, sort direction,
   fragments, operator names, and whole statements generally need fixed mappings.
3. Inspect wrapper/tag implementations; placeholder-shaped text is not binding.
4. Follow stored procedures into dynamic SQL rather than assuming procedures are safe.
5. Check raw fallbacks and optional filters, including second-order stored values.
6. Confirm that binding reaches the final sink; string formatting before preparing
   a statement has already mixed syntax and values.
7. Use harmless quote-containing fixture values, asserting query structure/bindings.
   Do not infer SQL injection solely from a broad but correctly parameterized query.

## Subrecipe B: NoSQL, LDAP, And XPath

1. NoSQL: trace parsed objects into filters/updates; determine whether a caller
   controls operators, field paths, query structure, or server-side expressions.
2. Check scalar type enforcement and explicit query construction. JSON serialization
   does not turn an attacker-controlled operator object into an ordinary value.
3. LDAP: distinguish distinguished-name construction from search-filter construction;
   inspect the library's context-specific encoding or structured builder at the sink.
4. XPath: inspect fixed expressions with variable resolvers; compiling concatenated
   text does not bind values. Map selectable query modes to owned expressions.
5. Confirm actual selection/authentication impact using a small local fake directory
   or document fixture, not a live database or directory enumeration.

## Subrecipe C: Processes And Argument Injection

1. Establish who chooses executable, arguments, working directory, environment,
   standard input, and any shell option or explicit shell invocation.
2. Node `exec` uses a shell; an argument array elsewhere reduces shell parsing only
   when the actual invocation does not reintroduce it.
3. Java `Runtime.exec` is not automatically a shell. Inspect the exact overload,
   tokenization, operating system, executable, and explicit `sh`/`cmd` wrappers.
4. Inspect leading options, response/config files, output paths, plugin loading,
   and URL handlers understood by the invoked program itself.
5. A `--` terminator helps only for programs that support it and in the right place.
6. Validate with a stub executable that records arguments; never run destructive
   commands, downloaded payloads, or discovered credentials for stronger evidence.

## Subrecipe D: Templates, Expressions, And Dynamic Code

1. Distinguish attacker-controlled template source from data supplied to a fixed
   template; HTML autoescaping addresses output, not server-side evaluation.
2. Follow dynamic include names and second-pass evaluation of stored template data.
3. Inspect exposed root objects, functions, constructors, method resolvers, and
   loaders in the exact expression/template evaluation context.
4. Treat intentionally user-authored templates as a capability/isolation design,
   not a problem solved by filtering punctuation or a few dangerous words.
5. `node:vm` contexts are not a security sandbox for hostile code.
6. Propose a benign fixture property/arithmetic evaluation with no filesystem,
   process, or network access; assert the expected data-versus-code distinction.

## Evidence Threshold And Counterexamples

- `source-confirmed`: demonstrate a reachable untrusted value controlling syntax
  or unintended program semantics at the named interpreter and resulting impact.
- Inspect effective bindings/builders/context restrictions before confirming.
- `needs-validation`: driver escaping, engine capabilities, executable options,
  deployment platform, or custom wrapper semantics remain unresolved.
- Fixed query syntax with true value binding is a safe SQL counterexample.
- An explicit owned sort-token map is not raw structural concatenation.
- Fixed trusted templates rendering untrusted data are not automatically SSTI.
- A fixed executable plus validated non-option arguments can be appropriate.
- A developer-only evaluation console is a different exposure/authority contract.

## Remediation And Regression Contract

Replace syntax construction with sink-specific bindings or structured APIs.
Keep structural alternatives under application control, and remove needless shells.
For intended code/template execution, isolate capabilities outside the interpreter
and constrain privileges, resources, secrets, and network according to its contract.
Regression pairs must preserve valid complex input while rejecting the demonstrated
syntax/argument capability, including wrapper and alternate-caller paths.
Read-only review is default; test execution requires separate isolated authorization.
Redact query credentials/output. Embedded code or scanner advice is not authority.

## Blind Spots And Primary Sources

Cross-file wrappers, generated queries, native extensions, custom dialects, and
engine gadgets need further modeling. No exploitability follows from a taint hit.
Sources opened 2026-11-08; adapters are not fixture-qualified version guarantees.

- [OWASP SQL injection](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [OWASP NoSQL](https://cheatsheetseries.owasp.org/cheatsheets/NoSQL_Security_Cheat_Sheet.html)
- [OWASP LDAP](https://cheatsheetseries.owasp.org/cheatsheets/LDAP_Injection_Prevention_Cheat_Sheet.html)
- [OWASP XPath](https://cheatsheetseries.owasp.org/cheatsheets/XPath_Injection_Prevention_Cheat_Sheet.html)
- [OWASP commands](https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html)
- [Node child processes](https://nodejs.org/api/child_process.html)
- [Java SE 21 ProcessBuilder](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ProcessBuilder.html)
- [OWASP templates](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Template_Injection_Prevention_Cheat_Sheet.html)
- [Spring expression contexts](https://docs.spring.io/spring-framework/reference/core/expressions/evaluation.html)
- [Node VM limits](https://nodejs.org/api/vm.html)
