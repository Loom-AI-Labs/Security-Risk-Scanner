import path from 'node:path';
import { collect, emit, main, parseArgs, positive, readBounded, textExtensions } from './common.mjs';

export const rules = [
  ['identity-token', ['R01'], /JwtDecoder|jwt\.(?:verify|decode)|jsonwebtoken|session\.(?:save|destroy)|setCookie|OAuth|oidc/i],
  ['authorization-entrypoint', ['R02', 'R03'], /SecurityFilterChain|@PreAuthorize|@RolesAllowed|@PermitAll|requestMatchers|permitAll\(|hasAuthority|hasRole|canActivate|addHook|preHandler|authorize|requireRole|checkPermission/],
  ['tenant-resource', ['R02'], /tenantId|customerId|ownerId|findById\(|findAll\(|findUnique\(|findMany\(|ThreadLocal|AsyncLocalStorage/],
  ['binding-projection', ['R04'], /@RequestBody|Object\.assign|\.\.\.req\.body|\.\.\.request\.body|BeanUtils\.copyProperties|ObjectMapper|toResponse/],
  ['interpreter-sink', ['R05'], /createNativeQuery|createQuery\(|JdbcTemplate|\.query\(|\$queryRawUnsafe|Runtime\.getRuntime|ProcessBuilder|child_process|execSync\(|exec\(|eval\(|SpelExpressionParser|ScriptEngine/],
  ['outbound-request', ['R06'], /HttpClient|RestTemplate|WebClient|HttpRequest|fetch\(|axios|\.openConnection\(|followRedirect|URI\.create|URL\(/],
  ['html-sink', ['R07'], /dangerouslySetInnerHTML|innerHTML|outerHTML|insertAdjacentHTML|rehypeRaw|html:\s*true|v-html|bypassSecurityTrustHtml/],
  ['browser-boundary', ['R08'], /postMessage|addEventListener\(['"]message|allowedOrigins|allowCredentials|csrf|sameSite|redirect_uri|sendRedirect|res\.redirect/],
  ['file-storage', ['R09'], /MultipartFile|Files\.(?:read|write|copy|move)|\.resolve\(|ZipInputStream|ZipEntry|createReadStream|extractAll|presign|GetObjectRequest|PutObjectRequest/],
  ['parser-construction', ['R10'], /ObjectInputStream|XMLDecoder|enableDefaultTyping|activateDefaultTyping|DocumentBuilderFactory|SAXParserFactory|TransformerFactory|new Yaml|yaml\.load|deepMerge|\.merge\(/],
  ['credential-handling', ['R11'], /getPassword\(|getSecret\(|resolveSecret\(|Authorization|apiKey|api_key|clientSecret|accessToken/],
  ['cryptography', ['R12'], /MessageDigest|Cipher\.getInstance|SecureRandom|Math\.random|createHash|createCipher|randomBytes|PasswordEncoder|bcrypt|argon2/],
  ['diagnostics', ['R13'], /log\.(?:info|debug|warn|error)|console\.(?:log|error)|printStackTrace|getStackTrace|stacktrace|include-message|exposure/],
  ['delivery-input', ['R14'], /pull_request_target|workflow_run|permissions:|secrets\.|actions\/checkout|npm install|npm ci|curl.*\|.*sh/],
  ['infrastructure', ['R15'], /privileged:|docker\.sock|hostNetwork|verifySsl.*false|trustAll|InsecureTrustManager|ssl.*false|0\.0\.0\.0|USER root/],
  ['workflow-webhook', ['R16'], /webhook|hmac|idempotenc|compareAndSet|@Transactional|FOR UPDATE|optimistic|confirmation|status\s*=/i],
  ['resource-work', ['R17'], /retry|timeout|max.*(?:Bytes|Size|Tokens|Iterations)|bodyLimit|rateLimit|Semaphore|Executors\.|Promise\.all|while\s*\(/i],
  ['ai-boundary', ['R18'], /prompt|toolCall|function_call|vectorSpace|retrieval|grounding|MCP|agent/i]
];

main(() => {
  const args = parseArgs(process.argv.slice(2), ['root', 'scope', 'out', 'max-files', 'max-bytes', 'max-total-bytes', 'max-leads', 'help']);
  if (args.help) { console.log('discover.mjs --root ROOT [--scope PATH] [--out NEW_JSON] [--max-files N] [--max-bytes N] [--max-total-bytes N] [--max-leads N]'); return; }
  const inventory = collect(args);
  const maxLeads = positive(args['max-leads'], 5000, 'max-leads');
  const maxTotalBytes = positive(args['max-total-bytes'], 67108864, 'max-total-bytes');
  const candidates = [], inspected = [], uninspected = [];
  let bytesRead = 0, limited = false;
  for (const file of inventory.files) {
    if (!textExtensions.has(path.extname(file.path)) && path.basename(file.path) !== 'Dockerfile') continue;
    if (limited || bytesRead + file.bytes > maxTotalBytes) { limited = true; uninspected.push({ path: file.path, reason: 'analysis-budget' }); continue; }
    try {
      const content = readBounded(inventory.root, file.path, inventory.limits.maxBytes);
      if (content === null) { uninspected.push({ path: file.path, reason: 'binary-or-size-changed' }); continue; }
      bytesRead += Buffer.byteLength(content);
      let complete = true;
      const lines = content.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        for (const [ruleId, riskIds, pattern] of rules) {
          if (!pattern.test(lines[i])) continue;
          if (candidates.length >= maxLeads) { limited = true; complete = false; break; }
          candidates.push({ path: file.path, line: i + 1, ruleId, riskIds, status: 'unverified-lead' });
        }
        if (!complete) break;
      }
      inspected.push({ path: file.path, complete });
    } catch (error) { inventory.errors.push({ path: file.path, code: error.code || 'READ_ERROR' }); }
  }
  emit({ schemaVersion: 1, kind: 'unverified-source-leads', generatedAt: new Date().toISOString(), root: inventory.root, scopes: inventory.scopes, candidates, inspected, uninspected, bytesRead, limits: { ...inventory.limits, maxTotalBytes, maxLeads }, truncated: inventory.truncated || limited, skipped: inventory.skipped, skippedCount: inventory.skippedCount, errors: inventory.errors, warning: 'Lexical routing clues only; not SAST coverage, confirmed risks, or a clean security result. No source snippets or secret values are emitted.' }, args.out);
});
