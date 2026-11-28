# Auth for a loopback MCP server: OAuth vs static bearer, secrets in deeplinks/configs

Research date: 2026-11-26. All claims below were checked against live pages on that date unless tagged **unconfirmed**.
Machine-local CLI versions observed: Claude Code 2.1.332, Codex CLI 0.172.0, Gemini CLI 0.32.1 (cursor/code/goose/zed not installed here). No client config contents were read.

---------------------------------------------------------------------
## 0. TL;DR

1. The newest MCP spec revision is **2026-07-28** (not 2025-11-25). Anytype's heart serves 2025-06-18 / 2025-11-25; that is fine, clients negotiate down. The 2026-07-28 revision removes sessions/initialize handshake and deprecates Dynamic Client Registration (DCR) in favour of Client ID Metadata Documents (CIMD).
2. Authorization is **OPTIONAL** in MCP. A static `Authorization: Bearer <key>` is not part of the OAuth profile but is universally supported by every client in scope via a headers field. Streamable HTTP spec says servers "SHOULD implement proper authentication for all connections" (any scheme) and MUST validate Origin.
3. Strict reading: OAuth 2.1 sec 1.5 says all OAuth URLs "MUST use the https scheme except for loopback interface redirect URIs". The MCP spec repeats: "All authorization server endpoints MUST be served over HTTPS" and "All redirect URIs MUST be either localhost or use HTTPS". So an authorization server on plain `http://127.0.0.1:31009` is **not spec-conformant**. In practice some clients tolerate loopback http token endpoints (Claude Code v2 documented; MCP TypeScript SDK client reported) but this is per-client and mostly unconfirmed.
4. Cloud-hosted clients (Claude Desktop custom connectors / claude.ai, ChatGPT apps) cannot reach loopback at all, regardless of auth. Claude Desktop explicitly rejects `localhost` / `http://` connector URLs (maintainer: "intentional").
5. **Recommendation:** Ship static scoped bearer keys, minted via internal RPC and written *by the Anytype app* directly into each client's config or via the client's CLI (secret never goes through a URL). Use a deeplink only as fallback and only with a short-lived/low-privilege key. Do NOT build MCP OAuth in v1; revisit when (a) CIMD adoption + loopback-AS tolerance is confirmed in more clients and (b) Anytype wants a "no-secret-at-rest" model. Details in section 9.

---------------------------------------------------------------------
## 1. What the latest spec says (2026-07-28, with 2025-11-25 differences)

### 1.1 Is authorization required?
Quote (2026-07-28 /basic/authorization): "Authorization is OPTIONAL for MCP implementations. When supported: Implementations using an HTTP-based transport SHOULD conform to this specification. Implementations using an STDIO transport SHOULD NOT follow this specification, and instead retrieve credentials from the environment."
=> Static bearer is allowed; it just is not "MCP authorization". Clients that see an `Authorization` header configured will use it and not run OAuth (Claude Code docs: "If you configure an Authorization header, Claude Code uses it as the server's credential and doesn't fall back to OAuth").

### 1.2 Is http (non-TLS) allowed for a loopback authorization server?
Spec text (2026-07-28 /basic/authorization/security-considerations, "Communication Security"):
```
Implementations MUST follow OAuth 2.1 Section 1.5 "Communication Security". Specifically:
1. All authorization server endpoints MUST be served over HTTPS.
2. All redirect URIs MUST be either localhost or use HTTPS.
```
OAuth 2.1 draft-13 sec 1.5 (read from ietf.org archive):
```
All the OAuth protocol URLs (URLs exposed by the AS, RS and Client) MUST use the https
scheme except for loopback interface redirect URIs, which MAY use the http scheme.
```
RFC 8252 sec 7.3 / 8.3: loopback *redirect* URIs may be http; says nothing relaxing the AS or RS URLs.
Answer: **No, not by the letter of the spec.** Only the client's loopback redirect URI (`http://127.0.0.1:{port}/callback`) may be http. An AS or protected-resource-metadata URL at `http://127.0.0.1:31009` violates "MUST be HTTPS". Real clients differ:
- Claude Code (v2 MCP runtime) docs: "Sends MCP OAuth credentials only to a token endpoint served over HTTPS or at `localhost`, `127.0.0.1`, or `::1`. Sign-in fails for a server whose token endpoint is plain `http://` anywhere else." => loopback http token endpoint **accepted** (documented).
- MCP TypeScript client `@modelcontextprotocol/client` 2.0.0: per a github.com/anomalyco/opencode PR #55627 description, it refuses non-https token endpoints unless host is exactly `localhost`, `127.0.0.1`, `::1` (secondary source, via search summary; **unconfirmed against SDK source**). Clients built on it inherit this.
- Codex, Cursor, VS Code, Gemini CLI, Windsurf, Zed, Goose, LM Studio: behaviour with an http loopback AS **unconfirmed** (no doc statement found).
- Claude Desktop / claude.ai connectors: not applicable (cloud-fetched; localhost URL rejected).

### 1.3 Client registration: CIMD vs DCR (2026-07-28 /basic/authorization/client-registration)
- Priority for clients supporting all: (1) pre-registered, (2) CIMD if AS metadata has `client_id_metadata_document_supported: true`, (3) DCR if `registration_endpoint` present, (4) prompt the user.
- CIMD: client_id is an HTTPS URL with a path (e.g. `https://vscode.dev/oauth/client-metadata.json`); the **AS fetches that URL** to read `client_name`, `redirect_uris`, etc. Requires the AS to make an outbound HTTPS request (SSRF-hardened) -> for a local-first desktop app this means Anytype's heart would need internet access at consent time, and must show the redirect hostname; spec: "SHOULD display additional warnings for localhost-only redirect URIs", "MUST clearly display the redirect URI hostname".
- DCR (RFC 7591): "Deprecated as of protocol version 2026-07-28 ... remains in the specification for at least twelve months" but is "retained for backwards compatibility". Clients MUST send `application_type` ("native" for desktop/CLI) in DCR (SEP-837).
- Changelog 2026-07-28 auth items: AS SHOULD include RFC 9207 `iss` in authorization responses and clients MUST validate it (SEP-2468); clients MUST key persisted credentials by issuer and re-register if AS changes (SEP-2352).
- Required server pieces if Anytype were the AS+RS: RFC 9728 Protected Resource Metadata (`/.well-known/oauth-protected-resource[/mcp/large]` or `WWW-Authenticate: Bearer resource_metadata="..."` on 401), RFC 8414 AS metadata (must include `code_challenge_methods_supported` incl. S256, else clients MUST refuse), `/authorize`, `/token`, PKCE S256, `resource` parameter (RFC 8707) audience binding, optionally `/register`.

### 1.4 Transport security (2026-07-28 /basic/transports/streamable-http, same as 2025-11-25)
```
1. Servers MUST validate the Origin header on all incoming connections to prevent DNS rebinding attacks.
   If the Origin header is present and invalid, servers MUST respond with HTTP 403 Forbidden.
2. When running locally, servers SHOULD bind only to localhost (127.0.0.1) rather than all network interfaces (0.0.0.0).
3. Servers SHOULD implement proper authentication for all connections.
```
Anytype's existing Origin check plus loopback binding satisfies (1)-(2). (3) is satisfied by the bearer key.
Spec-version note: 2026-07-28 makes Mcp-Method / MCP-Protocol-Version headers mandatory and removes initialize/sessions; Anytype serving only 2025-06-18/2025-11-25 JSON responses will keep working with current clients; track when clients start sending 2026-07-28 first (server returns 400 UnsupportedProtocolVersion with supported list, per that spec).

---------------------------------------------------------------------
## 2. Per-client: OAuth support for HTTP MCP servers, and fit against a loopback server

Legend: DOC = official doc seen today; SEC = secondary source; UNC = unconfirmed.

| Client | HTTP MCP static header | OAuth for HTTP MCP | Registration | Loopback AS (http://127.0.0.1) | Notes |
|---|---|---|---|---|---|
| Claude Code 2.1.332 | DOC: `claude mcp add --transport http NAME URL --header "Authorization: Bearer ..."` | DOC: yes, `/mcp` or `claude mcp login <name>` | DOC: DCR, CIMD ("discovers these automatically"), pre-registered via `--client-id`/`--client-secret`, `--callback-port` | DOC (v2 runtime): token endpoint over `localhost/127.0.0.1/::1` http allowed | Redirect is `http://localhost:PORT/callback` (v2.1.229 briefly sent 127.0.0.1, restored in 2.1.231). `oauth.authServerMetadataUrl` override exists. Validates `iss` on v2. |
| Codex CLI 0.172.0 | DOC: `bearer_token_env_var`, `http_headers`, `env_http_headers`, `http_headers_helper` | DOC: yes; `auth = "oauth"` default; `codex mcp login <name> [--no-browser] [--scopes] [--oauth-client-registration auto|cimd|dcr]` | DOC: pre-registered > CIMD (needs `client_id_metadata_document_supported`, `none` in token_endpoint_auth_methods_supported, loopback callback) > DCR | UNC | Requires AS to accept variable loopback ports (RFC 8252 7.3). Callback overrides `mcp_oauth_callback_port/url`. Validates `iss`. |
| Cursor | DOC: `headers` in mcp.json, `${env:NAME}` interpolation | DOC: yes; static `auth: {CLIENT_ID, CLIENT_SECRET, scopes}`; scopes read from `/.well-known/oauth-authorization-server` if omitted | DOC: static client documented; DCR/CIMD UNC (docs silent; a forum post says redirect moved from `cursor://anysphere.cursor-mcp/oauth/callback` to localhost, SEC) | UNC | Desktop redirect `http://localhost:8787/callback`; web/agents `https://www.cursor.com/agents/mcp/oauth/callback` (DOC). Docs list `http://localhost:3000/mcp` as a remote example. |
| VS Code | DOC: `headers`, `${input:id}` (password prompt, stored in secret storage), `${env:NAME}` | DOC: yes; `oauth: {clientId}`; secret set via CodeLens, stored in VS Code secret storage | SEC (den.dev blog): CIMD supported in stable, client_id `https://vscode.dev/oauth/client-metadata.json`; DCR UNC but historically supported | UNC (SEC: VS Code registers `http://localhost` loopback redirects) | Remote servers: tries Streamable HTTP then SSE. Also unix-socket/named-pipe URLs (`unix:///path`, `pipe:///pipe/name`) DOC. |
| VS Code + Copilot portable `.mcp.json` | `${NAME}` / `${NAME:-default}` env only | `oauthClientId` flat field | - | UNC | "A personal configuration file is not a secret store." (DOC) |
| Gemini CLI 0.32.1 | DOC: `gemini mcp add -t http -H "Authorization: Bearer X" NAME URL`; settings key `httpUrl` (streamable) / `url` (SSE) | DOC: yes; `oauth.enabled`, auto-discovery when only `url`; `/mcp auth <name>`; tokens in `~/.gemini/mcp-oauth-tokens.json` | DOC: DCR when no clientId; CIMD UNC | UNC (docs mention an `allowPrivateNetwork` option, not investigated) | Callback port: older docs fixed 7777, newer random (versions disagree). |
| Windsurf (now "Devin Desktop") | DOC: `headers`, `${env:VAR}` and `${file:/path}` (mirror) interpolation | DOC: yes for streamable-HTTP/SSE, not stdio | UNC | UNC | Config path conflict: `~/.codeium/windsurf/mcp_config.json` vs `~/.config/devin/mcp_config.json` (docs say both exist for different builds). `serverUrl` or `url`. |
| LM Studio | DOC: `headers` in mcp.json (Cursor notation) | UNC (docs do not mention OAuth) | - | - | Deeplink: `https://lmstudio.ai/install-mcp?name=NAME&config=<base64 of server JSON>` (DOC). |
| Claude Desktop | stdio only in `claude_desktop_config.json`; http needs a bridge (`mcp-remote`) or .mcpb extension (SEC) | Custom connectors support OAuth, but are reached **from Anthropic's cloud**; DOC (maintainer, github.com/anthropics/claude-ai-mcp/issues/9, closed not-planned 2026-05-12): "a localhost or http:// URL would not work even if accepted" | - | Not reachable | Even editing `claude_desktop_config.json` with a raw HTTP url reportedly stopped working (Jun-Jul 2026 comment, SEC). => Use stdio proxy (`@anyproto/anytype-mcp`) or .mcpb for Desktop. |
| Goose | DOC(search): `headers` map in config.yaml; deeplink `goose://extension?url=<enc>&type=streamable_http&id=..&name=..&description=..` (no documented headers param in deeplink: UNC) | DOC: yes; "normally obtain a client ID automatically using CIMD or DCR" | CIMD+DCR | UNC | |
| Zed | SEC: `context_servers.NAME: {url, headers}`; settings `~/.config/zed/settings.json` (mac/Linux), `%APPDATA%\Zed\settings.json` | SEC: OAuth runs when no Authorization header | UNC | UNC | zed-industries/zed issue #66640 (open at search time): ACP external agents get no OAuth token for HTTP context servers -> 401. Official Zed docs not read directly. |

Takeaway: every client above can talk to Anytype with a static bearer today. OAuth works against a loopback server only where (a) the client is a local process and (b) tolerates http AS. Only Claude Code documents (b). Everything else is UNC and would need hands-on testing per client before Anytype shipped OAuth.

---------------------------------------------------------------------
## 3. If Anytype implemented MCP OAuth with the desktop approval window as "consent page"

### 3.1 Architecture it would require
- heart (or Electron main) acts as RS+AS on `http://127.0.0.1:31009`.
  - `GET /.well-known/oauth-protected-resource/mcp/{tier}` -> `{"resource":"http://127.0.0.1:31009/mcp/large","authorization_servers":["http://127.0.0.1:31009"],"scopes_supported":["read","write"]}`
  - `GET /.well-known/oauth-authorization-server` -> issuer, authorization_endpoint, token_endpoint, `code_challenge_methods_supported:["S256"]`, `authorization_response_iss_parameter_supported:true`, optionally `client_id_metadata_document_supported:true` and `registration_endpoint`.
  - 401 response: `WWW-Authenticate: Bearer resource_metadata="http://127.0.0.1:31009/.well-known/oauth-protected-resource/mcp/large", scope="read"`.
  - `/authorize`: opened in the user's browser by the client. Anytype must foreground the desktop window (IPC or `anytype://` deeplink) showing client_name, redirect hostname, space picker, read/write; on Approve, redirect browser to `redirect_uri?code=..&state=..&iss=..`.
  - `/token`: PKCE S256 + `resource` check; issue access token (could literally be an Anytype API key with chosen spaces/permission) + refresh token (must rotate for public clients per spec).
- Origin check: the browser GET to `/authorize` has no CORS problem (navigation), but any browser-based client (MCPJam in browser, web inspectors) fetching `.well-known` cross-origin would be 403'd by the existing Origin check; discovery endpoints would need a deliberate allow-list.

### 3.2 End-user flow per client (best case)
| Client | Flow | Friction |
|---|---|---|
| Claude Code | `claude mcp add --transport http anytype http://127.0.0.1:31009/mcp/large` then `/mcp` or `claude mcp login anytype` -> browser opens -> Anytype window pops -> pick spaces -> done. | Needs Anytype to run the one `add` command for the user (feasible from Electron); browser tab hop; works if http AS tolerated (DOC yes). |
| Codex CLI | `codex mcp add anytype --url ...` + `codex mcp login anytype`; CIMD only works if AS advertises support and client_id URL reachable; else DCR. | UNC on http AS; Anytype must accept arbitrary loopback port redirect. |
| Cursor | Add `url` entry (deeplink or file); on first use Cursor opens browser; redirect `http://localhost:8787/callback`. | DCR/CIMD behaviour with local AS UNC; if only static client supported, Anytype would need to hand the user a client_id (defeats purpose). |
| VS Code | Install link / mcp.json `type:http`; OAuth prompt; CIMD client id is vscode.dev URL => Anytype must fetch it from the internet. | Offline users fail; localhost AS tolerance UNC. |
| Gemini CLI | settings `httpUrl` + `oauth.enabled`; `/mcp auth anytype`. | UNC on http AS; DCR needed. |
| Windsurf/Zed/Goose/LM Studio | Same shape; behaviour untested. | LM Studio OAuth UNC. |
| Claude Desktop / claude.ai / ChatGPT | Impossible against loopback (cloud-fetched). Needs stdio proxy or tunnel. | OAuth irrelevant. |

### 3.3 What would break / risk list
1. **HTTPS rule**: strict clients (anything following spec literally, e.g. a Python SDK-based client with `https`-only check, or enterprise-managed clients) refuse an http AS. Claude Code is the only one documented to allow it.
2. **Registration reliance**: CIMD needs outbound internet from the local AS; DCR is deprecated and each client would create a fresh registration -> registry growth on a local DB, plus SEP-2352 means the client re-registers if the issuer changes (e.g. user changes port 31009 -> different issuer string -> all clients must re-auth).
3. **Port variability**: user-configurable port and anytype-cli on 31012 -> issuer and resource URIs differ per install; stored OAuth tokens are keyed by issuer/resource.
4. **Three tiers = three resources**: `resource` audience binding means a token for `/mcp/large` should be rejected on `/mcp/full`; clients treat each URL as a separate server and prompt separately.
5. **Redirect host mismatch**: `localhost` vs `127.0.0.1` vs `::1` mismatches break exact-match registrations (reported for Claude Code 2.1.229, Entra/Copilot CLI). Anytype's AS must accept RFC 8252 7.3 variable loopback ports and both hostnames.
6. **Headless anytype-cli (31012)** has no desktop window: consent page would need a terminal/TUI approval path.
7. **Confirmation fatigue / phishing**: any local process can start an OAuth flow claiming to be "Claude Code" via CIMD (spec: "Client ID Metadata Documents cannot prevent localhost URL impersonation by themselves"); the consent window is the only defence, so it must clearly show the client name, redirect hostname, requested spaces and write access.
8. **Refresh/rotation state and revoke UI** must be built (store, revoke, expiry list) - the existing API-key list may be reusable if tokens are API keys.
9. **Unknown client behaviour** (see matrix): Cursor/VS Code/Gemini/Windsurf/Zed/Goose/LM Studio would each need hands-on testing against a loopback http AS; Zed has an open OAuth-token-forwarding bug.
10. The 2026-07-28 spec changes (stateless, iss, DCR deprecation) increase implementation churn.

Net: OAuth would give a great UX in 1-2 clients (Claude Code, maybe Codex) but most of the same UX can be reached by Anytype itself running `claude mcp add ... --header` with a freshly minted key. OAuth's incremental value is mostly "no secret in a file", which is addressable another way (section 5).

---------------------------------------------------------------------
## 4. Static bearer: how each client takes it (exact formats)

Key already minted by Anytype via internal RPC (read or read-write, selected spaces, optional expiry). URL examples use tier `large` and default port 31009.

```bash
# Claude Code (DOC, claude mcp add --help locally verified)
claude mcp add --transport http anytype http://127.0.0.1:31009/mcp/large --header "Authorization: Bearer $KEY" --scope user
# JSON form
claude mcp add-json anytype '{"type":"http","url":"http://127.0.0.1:31009/mcp/large","headers":{"Authorization":"Bearer KEY"}}'
```
User-scope entries live in `~/.claude.json` (DOC). Docs do not say whether header values there are plaintext (**unconfirmed**; OAuth client secret is "stored in your system keychain (macOS) or a credentials file"). Env expansion in `.mcp.json`: `"Authorization": "Bearer ${ANYTYPE_API_KEY}"` (`${VAR}` and `${VAR:-default}`, DOC). `headersHelper` (DOC): command printing `{"Authorization":"Bearer ..."}` to stdout, 10 s timeout, re-run on 401/403, runs per connection; user-scope helpers keep your environment, project-scope ones have credential-looking env vars stripped.

```toml
# Codex CLI ~/.codex/config.toml (DOC learn.chatgpt.com/docs/extend/mcp, 2026-11-26)
[mcp_servers.anytype]
url = "http://127.0.0.1:31009/mcp/large"
auth = "oauth"   # default; for a static key set bearer_token_env_var or headers:
bearer_token_env_var = "ANYTYPE_API_KEY"
# or: http_headers = { "Authorization" = "Bearer KEY" }   (plaintext)
# or: env_http_headers = { "Authorization" = "ANYTYPE_AUTH_HEADER" }
# or: http_headers_helper = "..."   (documented option; exact semantics UNC)
```
CLI: `codex mcp add anytype --url http://127.0.0.1:31009/mcp/large --bearer-token-env-var ANYTYPE_API_KEY` (verified in local `--help`). Caveat: env var must exist in the environment of the process that starts Codex; GUI-launched Codex (IDE extension) may not inherit shell exports (reasoning, **unconfirmed**). Whether `auth="oauth"` default interferes when only bearer env is set: UNC.

```json
// Cursor ~/.cursor/mcp.json or .cursor/mcp.json (DOC cursor.com/docs/mcp)
{"mcpServers":{"anytype":{"url":"http://127.0.0.1:31009/mcp/large","headers":{"Authorization":"Bearer ${env:ANYTYPE_API_KEY}"}}}}
```
Deeplink (DOC cursor.com/docs/mcp/install-links.md): `cursor://anysphere.cursor-deeplink/mcp/install?name=anytype&config=<base64(JSON.stringify(serverObject))>` where serverObject is the entry body (e.g. `{"url":...,"headers":{...}}`). Docs mention Cursor "prompts to install" but not the dialog contents; no documented secret handling. A web link `https://cursor.com/en/install-mcp` was NOT in the docs page (UNC).

```json
// VS Code user mcp.json (DOC code.visualstudio.com/docs/agents/reference/mcp-configuration)
{"inputs":[{"type":"promptString","id":"anytype-key","description":"Anytype API key","password":true}],
 "servers":{"anytype":{"type":"http","url":"http://127.0.0.1:31009/mcp/large","headers":{"Authorization":"Bearer ${input:anytype-key}"}}}}
```
CLI (DOC): `code --add-mcp '{"name":"anytype","type":"http","url":"...","headers":{...}}'`. Install URL `vscode:mcp/install?<urlencoded json>` / `vscode-insiders:` : only in community posts (SEC), not in current official pages I could fetch -> format **unconfirmed**; confirm in VS Code source before use. `${input:}` values are stored in VS Code secret storage (DOC) but the prompt requires the user to paste the key, defeating the one-click goal; use literal header written by Anytype instead, or `${env:}`.

```bash
# Gemini CLI (local --help verified)
gemini mcp add -s user -t http -H "Authorization: Bearer $KEY" anytype http://127.0.0.1:31009/mcp/large
```
Settings key is `httpUrl` + `headers` in `~/.gemini/settings.json` (DOC). Stored plaintext (**presumed; unconfirmed**).

```json
// Windsurf mcp_config.json (DOC docs.windsurf.com/plugins/cascade/mcp)
{"mcpServers":{"anytype":{"serverUrl":"http://127.0.0.1:31009/mcp/large","headers":{"Authorization":"Bearer ${env:ANYTYPE_API_KEY}"}}}}
```
`${file:/path/to/keyfile}` interpolation also reported (mirror site, SEC) - useful for a 0600 key file.

```json
// LM Studio mcp.json (DOC lmstudio.ai/docs/app/mcp) - Cursor notation
{"mcpServers":{"anytype":{"url":"http://127.0.0.1:31009/mcp/large","headers":{"Authorization":"Bearer KEY"}}}}
```
Deeplink: `https://lmstudio.ai/install-mcp?name=anytype&config=<base64 server JSON>` (DOC). Localhost support not explicitly documented (UNC), env-var support not documented.

```yaml
# Goose config.yaml (SEC; field name uri vs url UNC)
extensions:
  anytype: {type: streamable_http, uri: http://127.0.0.1:31009/mcp/large, headers: {Authorization: "Bearer KEY"}, enabled: true}
```
Deeplink: `goose://extension?url=<enc>&type=streamable_http&id=anytype&name=Anytype&description=...` (SEC from goose docs via search); no documented header param -> secret cannot ride the deeplink (UNC).

```json
// Zed settings.json (SEC)
{"context_servers":{"anytype":{"url":"http://127.0.0.1:31009/mcp/large","headers":{"Authorization":"Bearer KEY"}}}}
```
Claude Desktop: no direct HTTP; use stdio `npx -y @anyproto/anytype-mcp` (needs Node), a `.mcpb` bundle, or a bundled helper binary as stdio->HTTP proxy that reads the key from a 0600 file/keychain.

---------------------------------------------------------------------
## 5. Secret handling analysis

### 5.1 Bearer token inside a deeplink (cursor://, vscode:, goose://, lmstudio https link)
Risks (reasoned from how OS URL dispatch works; specific leak paths for these apps are **unconfirmed**):
- The URL is passed as a command-line argument or Apple Event to the handler: visible to same-user `ps`/process listings (Windows/Linux argv), crash reports, shell history if launched from terminal.
- Browser-hosted `https://` install links (lmstudio.ai/install-mcp, any web trampoline) put the key in browser history, referer risk, server logs of the trampoline host, sync services. Base64 is encoding, not protection.
- Custom schemes are unverified: any app can register the same scheme (CWE-939; RFC 8252 sec 7.1 warns about this for redirects). A malicious handler could receive the key. Only claimed https / OS-verified links mitigate.
- Tokens must not be in URL query strings for resource requests (spec: "Access tokens MUST NOT be included in the URI query string") - analogous best-practice for URLs.
- Handler confirmation dialogs vary (Cursor "prompts to install"); no doc says the dialog redacts the secret.
Mitigation if a deeplink is used: only the app fires it itself (no web page), use a key with short expiry and read-only default, label the key per client ("Cursor on <host>") so one revoke kills it, and delete/rotate on disconnect.
Better: avoid putting the secret in the link: link carries URL only and the secret is injected via env/file/helper (see 5.3).

### 5.2 Plaintext config files
- Codex `http_headers` and `client_secret` land in `config.toml` plaintext (DOC says "keep that file private"). Cursor/LM Studio/Gemini/Windsurf/Zed `headers` plaintext JSON (presumed; docs do not claim encryption).
- Claude Code: header values in `~/.claude.json` plaintext presumed (**unconfirmed**); its OAuth secrets use macOS keychain or a credentials file (DOC).
- VS Code: `${input:}` password values go to secret storage (DOC) - the only client in scope with first-class secret storage for static headers; "A personal configuration file is not a secret store." (DOC).
- Risk is bounded for a loopback-only API: key is useless off-machine; it matters for backup sync (Dropbox/iCloud/dotfile repos committed to git - a very common leak path for `~/.cursor/mcp.json`, `~/.claude.json`) and malware running as the user. So: scope keys narrowly, enable expiry, avoid read-write by default.

### 5.3 Indirection options (ranked by user friction for "Connect" button)
1. **Env var** (`bearer_token_env_var`, `${env:X}`, `${X}`): keeps config shareable but needs the variable present where the *client process* starts. On macOS GUI apps launched from Dock do not read `~/.zshrc`; would require `launchctl setenv` (lost at reboot) or editing shell profile + restart. Poor for non-technical users. (Reasoning; not tested.)
2. **File reference**: Windsurf `${file:...}` (SEC) - key lives in a 0600 file in Anytype's data dir; config holds no secret. Only Windsurf.
3. **Credential helper**: Claude Code `headersHelper` (DOC) and Codex `http_headers_helper` (DOC lists option; semantics UNC) call a command at connect time. Anytype could ship a tiny helper (`anytype mcp-auth-header`) that reads the key from the OS keychain/secure store and prints the header JSON; config contains no secret and rotation/expiry is transparent. Needs the helper binary at a stable path (bundled with the app, updated on app update) and trust prompts (Claude Code runs project-scope helpers only after folder trust; user scope fine).
4. **Stdio proxy** (`@anyproto/anytype-mcp` or bundled binary): the proxy reads key from keychain/file; client config holds only a command. Works for ALL clients including Claude Desktop, avoids the HTTP-in-config problem, but needs Node (npx) or a bundled binary, and a restart of the client.
5. **Literal header written by Anytype**: simplest, plaintext, universally works; combine with scoping/expiry.

### 5.4 OS keychain
- Anytype Electron can store the key via `safeStorage`/keytar (already in app, per build notes keytar is used: **unconfirmed here** - not checked in this research) and expose it through the helper (3) or proxy (4). No client reads the OS keychain natively for static MCP headers except via a helper script; VS Code uses its own secret storage; Claude Code/Codex store *OAuth* secrets in keychain.

### 5.5 Token scoping and rotation (Anytype-side, already possible via RPC)
- One key per (client, machine); name it so it appears in Anytype's API key list; read-only default; user picks spaces; optional expiry (suggest 90 days, with a "Reconnect" nudge) ; "Disconnect" in Anytype revokes key and removes the config entry.
- Rotation: Anytype can silently re-mint and rewrite config when expiry nears, if it can still write the config (needs the stored list of managed config paths) - helper/proxy approach (5.3 item 3/4) makes rotation invisible because the secret is not in client config.
- Spec parallels: short-lived access tokens + rotated refresh tokens (security-considerations "Token Theft"). A static long-lived key is the weakest model; mitigate with narrow scopes + expiry.

### 5.6 DNS rebinding / Origin protections for a loopback MCP server
- Spec: validate Origin (403 if present and invalid) + bind 127.0.0.1 + authenticate. Anytype already refuses browser origins - keep that (non-browser MCP clients send no Origin header).
- Add (recommended, not spec-mandated): validate `Host` header equals `127.0.0.1:{port}` / `localhost:{port}` / `[::1]:{port}` (rebinding makes the browser send attacker hostname in Host even if Origin is absent on same-origin-after-rebind requests), reject otherwise. This closes the rebinding case where the page's origin equals the rebound host.
- The bearer key itself is the strongest rebinding defence: a malicious web page cannot know it. This is an argument *for* keeping auth mandatory even on loopback; do not offer an "auth off" mode.
- Bind IPv4 loopback explicitly; do not bind 0.0.0.0 (spec SHOULD). (Anytype-side behaviour for ::1 not verified here.)

---------------------------------------------------------------------
## 6. Quantified comparison

| Criterion | Static bearer minted by Anytype | MCP OAuth (Anytype as AS, desktop consent) |
|---|---|---|
| Clients that work today | All local clients with a headers field (Claude Code, Codex, Cursor, VS Code, Gemini, Windsurf, LM Studio, Zed, Goose); Claude Desktop via stdio proxy | Claude Code (documented incl. http loopback); others UNC |
| User steps after "Connect" | 0 (Anytype writes config/runs CLI) | 1-3 (browser hop, consent) per client per tier; re-auth on port change |
| Implementation cost in heart | Done | Large: PRM, AS metadata, authorize/token/register, PKCE, resource binding, refresh rotation, consent UI, revoke UI |
| Spec conformance | Outside MCP auth profile but allowed (auth optional) | Would violate "AS MUST be HTTPS" on http loopback |
| Secret exposure | Key in config/URL unless helper/proxy | Short-lived tokens in client keychain/file; still a bearer |
| Revocation | Delete key in Anytype | Revoke grant |
| Cloud clients (Claude Desktop connectors, ChatGPT) | Impossible | Impossible |
| Future-proof | Fine until clients drop static-header support (no sign of this) | Better alignment with 2026-07-28 direction, but DCR deprecated and CIMD requires internet |

---------------------------------------------------------------------
## 7. Open questions worth a 30-minute hands-on test before committing
1. Does Codex `auth="oauth"` default block or ignore a configured `bearer_token_env_var`/`http_headers` (precedence)? 
2. Does `codex` / Cursor / VS Code / Gemini accept an http loopback AS? (Run a throwaway mock AS.)
3. Does Claude Code store `--header` values in `~/.claude.json` as plaintext? (Check by redacted key listing only.)
4. VS Code `vscode:mcp/install` exact JSON shape and whether `headers` are shown in the confirm dialog.
5. Goose deeplink header param, Zed official OAuth/headers docs.
6. Claude Desktop: current state of `.mcpb` bundling a stdio binary; whether raw http `url` entries in `claude_desktop_config.json` work (conflicting reports).

---------------------------------------------------------------------
## 8. Sources (all fetched 2026-11-26 unless noted)
- MCP spec 2026-07-28 changelog: https://modelcontextprotocol.io/specification/2026-07-28/changelog
- MCP spec 2026-07-28 authorization: https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization
- ... security considerations: https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations
- ... client registration: https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration
- ... Streamable HTTP: https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http
- MCP spec 2025-11-25 authorization / transports (seed): https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization , .../basic/transports
- OAuth 2.1 draft-13 (sec 1.5): https://www.ietf.org/archive/id/draft-ietf-oauth-v2-1-13.txt
- RFC 8252: https://www.rfc-editor.org/rfc/rfc8252.txt
- Claude Code MCP docs (v2.1.x): https://code.claude.com/docs/en/mcp
- Codex MCP docs (redirected from developers.openai.com/codex/mcp): https://learn.chatgpt.com/docs/extend/mcp?surface=cli ; local `codex mcp add/login --help` 0.172.0
- Cursor MCP docs: https://cursor.com/docs/mcp ; install links: https://cursor.com/docs/mcp/install-links.md ; forum: https://forum.cursor.com/t/oauth-redirect-uri-changed-from-cursor-to-http-localhost-for-streamable-http-mcp/165019 (SEC)
- VS Code MCP config reference: https://code.visualstudio.com/docs/agents/reference/mcp-configuration ; MCP servers page: https://code.visualstudio.com/docs/agent-customization/mcp-servers ; CIMD blog (SEC): https://den.dev/blog/cimd-vs-code-mcp/
- Gemini CLI MCP docs: https://geminicli.com/docs/tools/mcp-server/ , https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html ; local `gemini mcp add --help` 0.32.1
- Windsurf MCP docs: https://docs.windsurf.com/plugins/cascade/mcp
- LM Studio MCP docs: https://lmstudio.ai/docs/app/mcp
- Claude Desktop localhost issue: https://github.com/anthropics/claude-ai-mcp/issues/9
- Claude Code redirect-host issue (SEC): https://github.com/anthropics/claude-code/issues/82096
- opencode PR on loopback token endpoints (SEC for TS SDK behaviour): https://github.com/anomalyco/opencode/pull/55627
- Zed OAuth/ACP issue (SEC): https://github.com/zed-industries/zed/issues/66640
- Goose docs (search summary only): https://goose-docs.ai/docs/getting-started/using-extensions/
- Custom-scheme hijack background: https://cwe.mitre.org/data/definitions/939.html

---------------------------------------------------------------------
## 9. Recommendation for Anytype

**Route: static, narrowly-scoped bearer keys minted by the desktop app, injected by the app itself, with a keychain-backed helper/proxy as the "no secret in config" upgrade; no MCP OAuth in v1.**

Flow: user clicks "Connect to X" in Anytype -> picks spaces + read/read-write (default read) + expiry -> Anytype mints a key named "X on <machine>" via RPC -> Anytype delivers it by the most private channel the client supports, in this order:
1. **Client CLI executed by Electron** (secret as an argument to a short-lived child process; never a URL): `claude mcp add --transport http ... --header` (use `--scope user`), `codex mcp add ... --bearer-token-env-var` is NOT recommended for GUI users, prefer writing `http_headers`/helper; `gemini mcp add -H`; `code --add-mcp`.
2. **Direct config write by Anytype** (JSON/TOML merge, backup, 0600 where possible, show the path and a diff for consent): Cursor, Windsurf, LM Studio, Zed, Goose, Codex.
3. **Deeplink fallback** only for clients where 1-2 are impossible (e.g. install button flows): the app fires it locally (no web trampoline), the key is short-expiry/read-only, and the UI says what will be installed. Avoid `https://` trampolines (lmstudio.ai/install-mcp, cursor.com web link) for secrets.
4. **Claude Desktop**: stdio entry pointing at a bundled `anytype-mcp` proxy binary (no Node) or `.mcpb`; the proxy reads the key from keychain/0600 file. Cloud connectors/ChatGPT: explain loopback is unreachable (not an auth problem).

Hardening to ship with it: keep Origin check, add Host-header allow-list, loopback bind only, per-client named keys with expiry and one-click revoke ("Disconnect" removes config + key), read-only default, never log keys, redact in UI.

Phase 2 (optional): bundle a credential helper (`headersHelper` for Claude Code, `http_headers_helper` for Codex after confirming semantics) so config holds no secret and rotation is automatic. Phase 3 (only if demand + testing prove clients tolerate http loopback AS): MCP OAuth with CIMD+DCR, desktop consent window as `/authorize`, issuing the same API-key objects as access tokens - starting with Claude Code and Codex where documentation is strongest.
