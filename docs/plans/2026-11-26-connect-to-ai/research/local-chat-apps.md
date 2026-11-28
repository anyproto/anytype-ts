# Local/desktop chat apps (VERIFIED): Jan, AnythingLLM Desktop, Msty Studio, Raycast AI, Perplexity (Mac), BoltAI

Verified 2026-11-26/27 against live sources. Target entry: name `anytype`, `http://127.0.0.1:31009/mcp/large`, header `Authorization: Bearer <KEY>`.
Evidence: [src] GitHub source read today, [doc] vendor docs fetched today, [3p] third-party, unconfirmed = no live source.

## 0. Summary table (corrected)

| App | Version | Native Streamable HTTP | Static Authorization header | One-click deeplink | Config file | Live reload | Best Anytype route |
|---|---|---|---|---|---|---|---|
| Jan | v0.8.8 (2026-10-28) [src] | yes `type:"http"` | yes `headers` [src] | NO | `<DataFolder>/mcp_config.json` | NO watcher found; docs say restart | write JSON atomically, ask user to restart Jan |
| AnythingLLM Desktop | v1.20.0 (2026-11-17) [src] | yes `type:"streamable"` or `"http"` | yes `headers` [src] | none | `<storage>/plugins/anythingllm_mcp_servers.json` | click Refresh on Agent Skills page (no app restart) [doc] | write JSON, user clicks Refresh |
| Msty Studio 3.x | n/a | yes (HTTP) | v3 docs: bearer token or OAuth only; custom headers UNCONFIRMED | none found | none documented | n/a | guided paste only |
| Raycast | macOS v2.14 (2026-11-25) | yes (HTTP form) | yes "HTTP Headers" form [doc] | `raycast://mcp/install?<JSON>` works for STDIO [3p, many repos]; HTTP form UNCONFIRMED | none usable | live | deeplink with STDIO entry (bundled helper binary) |
| Perplexity Mac | n/a | remote only, https:// required | NO header field | none | none | n/a | not supported |
| BoltAI | 3.1 | Connectors (cloud-synced) + local stdio | Connectors: Custom headers [doc] | none | `~/.boltai/mcp.json` | "Reload Configuration" [doc] | write mcp.json stdio entry (+Reload) |

## 1. Jan
- Config paths CONFIRMED [doc docs.jan.ai/desktop/data-folder]: data dir macOS `~/Library/Application Support/Jan/data`, Windows `%APPDATA%/Jan/data`, Linux `~/.local/share/Jan/data` (XDG_DATA_HOME); user-changeable in Settings > General. The page does NOT mention mcp_config.json; per Jan CLI docs ("shared mcp_config.json") and OAuth doc ("next to mcp_config.json in the Jan data folder") it sits in that folder. Anytype must honor a custom data folder: unconfirmed how to discover it (no documented pointer file).
- Entry schema CONFIRMED [src models.rs extract_command_args]: `type` http|sse (else stdio), `url`, `command`, `args`, `timeout`, `headers` (object), `env` (object), `active` (bool). Top-level `mcpServers`.
```json
{ "mcpServers": { "anytype": { "type": "http", "url": "http://127.0.0.1:31009/mcp/large",
  "headers": { "Authorization": "Bearer <KEY>" }, "active": true } } }
```
- Hand-set Authorization header wins; OAuth never attempted [doc agent/mcp].
- CLI CONFIRMED [doc agent/cli.mdx]: `jan cli mcp add <NAME> --type http --url <URL> --header KEY=VALUE --active`; header parsed with split_once('=') so `Authorization=Bearer <KEY>` (quoted) is fine [src]. CLI exists only in Jan Agent; PATH install by desktop installer unconfirmed (not installed here).
- Deeplink for MCP: none (unchanged).
- Reload: CORRECTED/narrowed. No file watcher dependency (notify) in src-tauri Cargo.toml; `enable` = "connect on the next session". Treat as restart required.
- Marketplace: none for MCP.

## 2. AnythingLLM Desktop
- v1.20.0 CONFIRMED. `createHttpTransport`: type `streamable`/`http` -> StreamableHTTPClientTransport with `requestInit.headers = server.headers`; any other/missing type -> SSE [src hypervisor/index.js]. Type optional when `url` present but then SSE is assumed.
- Path `plugins/anythingllm_mcp_servers.json` under storage dir CONFIRMED [doc mcp-compatibility/desktop]; file created when Agent Skills page opened. Storage dirs per earlier report (`~/Library/Application Support/anythingllm-desktop/storage`, `%APPDATA%\anythingllm-desktop\storage`, `~/.config/anythingllm-desktop/storage`) not re-fetched: UNCONFIRMED today.
- Reload CONFIRMED: Refresh button reloads from file and restarts servers, no app restart. No in-app add form, no deeplink.
- Note: docs do not show `type`/`streamable`/`headers` examples; support is from source only.
```json
{ "mcpServers": { "anytype": { "type": "streamable", "url": "http://127.0.0.1:31009/mcp/large",
  "headers": { "Authorization": "Bearer <KEY>" } } } }
```

## 3. Msty Studio 3.x
- v3 docs [docs.msty.ai/studio/v3/toolbox/tools]: Toolbox > Tools > Add New Tool > HTTP: URL + "bearer token and OAuth"; STDIO/JSON paste for commands; then add to a Toolset; "Test tool". Headers/localhost/deeplinks/import: not covered. A search snippet of the older docs said "Authentication and Headers" (UNCONFIRMED for v3). SSE unsupported (use Streamable HTTP).
- Route: guided copy/paste of URL + key. Possibly STDIO/JSON accepts a stdio entry (bundled helper) - unconfirmed.

## 4. Raycast
- CORRECTED: the official manual [manual.raycast.com/ai/model-context-protocol] documents only the form (Install MCP Server / Manage MCP Servers): stdio = Command/Arguments/Environment; HTTP = URL + HTTP Headers; OAuth none/dynamic/static. It does NOT document the `raycast://mcp/install` deeplink. MCP is "Pro Exclusive".
- Deeplink `raycast://mcp/install?` + encodeURIComponent(JSON) CONFIRMED in use [src: withastro/docs Astro "Add to Raycast" button; midday; scrivener-mcp; pieces-app/cli-agent; MCPay; TablePro]. EVERY verified instance is `{"name","type":"stdio","command","args"[,"env"]}`. No instance with `type:"http"`/`url`; PraisonAI's catalog sets `remote=None` for Raycast (HTTP not supported by link). So the report's HTTP-variant guess stays UNCONFIRMED and should not be used.
- Changelog [raycast.com/changelog]: v2.14 (2026-11-25), v2.13 (2026-11-18) added "Raycast MCP" local server (127.0.0.1:8267/mcp - Raycast as SERVER, unrelated); v2.13 fix: install error when URL is not http(s). Nothing on headers/localhost/deeplink.
- Route (new): deeplink with a STDIO entry whose `command` is an Anytype-bundled helper binary (absolute path) that proxies stdio->`127.0.0.1:31009/mcp/large`, key in `env`. Avoids Node. If helper unavailable, `command: npx, args: ["-y","@anyproto/anytype-mcp"], env: {OPENAPI_MCP_HEADERS: ...}` (requires Node). User still presses Install in Raycast. Token is visible in the URL: open via shell.openExternal, never log.
- Fallback: show form values (URL, header) for the HTTP form. Localhost for HTTP form: unconfirmed (should work, client is local).
- Marketplace: no local-only listing path.

## 5. Perplexity Mac
CONFIRMED [help-center 11502712, 13915507]: Mac app does not support adding own local (command-based) MCP servers; remote connector form: Name, URL (MUST be https://), Advanced: transport Streamable HTTP/SSE, auth None/API Key/OAuth 2.0, network Public/Cloudflare Access/PrivateLink; no custom headers (only CF-Access ones); members need admin to enable "Allow members to add custom connectors". Localhost: not stated; https requirement makes http://127.0.0.1 not viable. Verdict: not supported.

## 6. BoltAI
- CONFIRMED [help.boltai.com 3595143]: Connectors (internet, Settings > Connectors, cloud-sync, Authentication > Custom headers) vs Local MCP servers (Settings > MCP Servers, `~/.boltai/mcp.json`, Edit Configuration; after external edit use ⋯ > Reload Configuration; Import from Cursor / Claude Desktop). Format of http/url entries in mcp.json, localhost and plan requirements: NOT covered (unconfirmed).
- Route: write stdio entry to `~/.boltai/mcp.json` (bundled helper command preferred over npx), tell user Reload Configuration. Alternatively Connector with custom header but "run on the internet" implies localhost likely unreachable: avoid.
```json
{ "mcpServers": { "anytype": { "command": "<helper or npx>", "args": [...], "env": { "OPENAPI_MCP_HEADERS": "{\"Authorization\":\"Bearer <KEY>\"}" } } } }
```
- No deeplink, no marketplace found.

## 7. Cross-cutting
Safe write: parse, merge key, tmp+rename, 0600, keep .bak, abort on parse failure. Mint scoped, named, expiring keys. Detect apps via /Applications bundle, data dir, URL scheme.

## Verification log
| Claim | Status | Source |
|---|---|---|
| Jan v0.8.8 2026-10-28 | CONFIRMED | gh releases janhq/jan |
| Jan config schema (type http, url, headers, active) | CONFIRMED | src-tauri/src/core/mcp/models.rs |
| Jan data dir per OS | CONFIRMED | docs.jan.ai/desktop/data-folder |
| mcp_config.json lives in data dir | CONFIRMED (indirect, docs) | docs agent/mcp.mdx, cli.mdx |
| Jan CLI `jan cli mcp add --type http --url --header K=V --active` | CONFIRMED | docs agent/cli.mdx; cli/mcp.rs split_kv |
| Jan header value with space quoted ok | CONFIRMED (split_once '=') | cli/mcp.rs |
| Jan live reload unconfirmed | CORRECTED -> no watcher found, restart | Cargo.toml, cli docs |
| Jan MCP deeplink none | CONFIRMED (not re-found) | prior src read; no counter evidence |
| AnythingLLM v1.20.0 | CONFIRMED | gh releases |
| AnythingLLM streamable/http + headers | CONFIRMED | hypervisor/index.js |
| missing type -> SSE | CONFIRMED | same |
| Refresh reloads without restart | CONFIRMED | docs.anythingllm.com/mcp-compatibility/desktop |
| AnythingLLM storage paths per OS | UNCONFIRMED today | not refetched |
| Msty bearer/OAuth in HTTP form | CONFIRMED | docs.msty.ai/studio/v3/toolbox/tools |
| Msty custom headers | UNCONFIRMED | v3 doc silent |
| Raycast deeplink in official manual | CORRECTED (old: implied doc; new: only 3p/code) | manual.raycast.com |
| Raycast deeplink format `raycast://mcp/install?<encodeURIComponent(JSON)>` | CONFIRMED (stdio) | withastro/docs, midday, pieces cli-agent |
| Raycast deeplink HTTP keys | UNCONFIRMED (no real-world example; PraisonAI marks unsupported) | gh code search |
| Raycast HTTP Headers form field | CONFIRMED | manual.raycast.com |
| Raycast Pro required | CONFIRMED | manual.raycast.com |
| Raycast v2.14 2026-11-25 | CONFIRMED | raycast.com/changelog |
| Perplexity no local MCP on Mac, no headers, https required | CONFIRMED | perplexity help center |
| BoltAI mcp.json path + Reload Configuration | CONFIRMED | help.boltai.com |
| BoltAI http entries in mcp.json / localhost | UNCONFIRMED | doc silent |

## Recommendation for Anytype
- Primary zero-touch: (1) Raycast: mint key, open stdio deeplink with bundled helper; user clicks Install. (2) Jan and AnythingLLM: Anytype merges the JSON entry atomically; user restarts Jan / clicks Refresh in AnythingLLM. (3) BoltAI: write ~/.boltai/mcp.json stdio entry; user clicks Reload Configuration.
- Fallback: show URL + key with copy buttons and exact field names (Msty, BoltAI Connector, Raycast HTTP form).
- Not supported: Perplexity Mac (say so).
- OS notes: Raycast, BoltAI, Perplexity are Mac-only here; Jan/AnythingLLM paths differ per OS (above); honor Jan's custom data folder.
- Gotchas: AnythingLLM needs explicit `type:"streamable"`; Jan files rewritten by app (merge); token in plaintext config and in Raycast URL; shipping a stdio helper binary avoids requiring Node; test the Raycast link on a Pro Mac before shipping; nothing here has a marketplace route for a local-only server.
