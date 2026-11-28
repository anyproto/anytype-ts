# OpenAI distribution (verified 2026-11-27)

Scope: OpenAI Plugin Directory (formerly Apps SDK / ChatGPT Apps), desktop-only plugins, Secure MCP Tunnels, and the config route (~/.codex/config.toml) shared by ChatGPT desktop / Codex app / CLI / IDE extension.

## 1. Directories / marketplaces
| Name | What it lists | Notes |
|---|---|---|
| OpenAI Plugin Directory (ChatGPT + Codex) | Plugins = skills + MCP servers. Public ones use REMOTE HTTPS MCP. | Submit at platform.openai.com/plugins |
| Same directory, desktop-only | Local stdio MCP / local programs | "Local MCP submissions are limited to approved partners": contact OpenAI rep, give org ID, get org allowlisted, then identity verification + clean desktop install test. |
| Workspace plugins | Admin-published local plugins | Org-internal only. |
| Repo / personal marketplace files | `$REPO/.agents/plugins/marketplace.json`, `~/.agents/plugins/marketplace.json`, legacy `.claude-plugin/marketplace.json` | Self-served, no review. Plugin folders under `~/.codex/plugins/`. Each entry needs `source`, `policy.installation`, `policy.authentication`, `category`. |
| Custom MCP server (ChatGPT) | private/dev connectors | Public HTTPS URL or Tunnel. |

Local CLI (codex-cli 0.172.0, run here):
- `codex mcp add <NAME> (--url <URL> [--bearer-token-env-var VAR] [--oauth-client-id ID] [--oauth-client-secret S] | [--env K=V] -- <COMMAND>...)`. Subcommands: list, get, add, remove, login, logout. There is NO `--header` / static-header flag on `mcp add`.
- `codex plugin add|list|remove|marketplace`; `codex plugin marketplace add <SOURCE>` where SOURCE = local path, `owner/repo[@ref]`, HTTPS or SSH git URL; options `--ref`, `--sparse`.

## 2. Public submission (remote MCP)
As in the researcher's report (org owner / "Apps Management Write", identity verification, ZIP upload, review info with 5 positive and 3 negative test cases, public HTTPS endpoint, privacy policy, tool annotations). Review time and fees remain unconfirmed.
Auth for remote servers: OAuth 2.1 + PKCE. The auth doc says ChatGPT cannot "present custom API keys or customer-provided mTLS certificates". Anytype's static Bearer key therefore cannot serve ChatGPT-hosted (web) calls. Public listing is impossible for a local-only server.

Plugin mcp.json auth schema (corrected): `extensions["com.openai"].auth.type` = `none | oauth | mixed | api_key`; for api_key, `headerScheme` = `bearer | basic | custom_header` (+ `headerName` only with custom_header). Schema URL is `https://agent-plugins.org/schemas/1.0.0/mcp.schema.json` (manifest uses plugin.schema.json). The researcher's claim that the submission portal does not support api_key is unconfirmed here.

## 3. Local-only listing
- Public listing: NO.
- Desktop-only: only for approved partners, stdio entry in root mcp.json (`type: stdio`, `command`, `args`, `cwd`, `${PLUGIN_ROOT}`), server and deps bundled. The doc says nothing on HTTP/127.0.0.1 entries and nothing on secrets/credentials for local servers (CONFIRMED gap).
- Secure MCP Tunnels: private connection only ("does not support public plugin submission or distribution"). Needs Platform org, tunnel_id, runtime API key (CONTROL_PLANE_API_KEY), Tunnels Read/Manage (create) and Read/Use (run), a running `tunnel-client` process. Doc does not state plan eligibility; personal Platform orgs exist, but a tunnel tied to a personal org does not show up in an Enterprise/Edu workspace. Not a consumer route.
```
tunnel-client init --sample sample_mcp_stdio_local --profile local-stdio --tunnel-id tunnel_... --mcp-command "..."   # or --mcp-server-url <url>
tunnel-client doctor --profile local-stdio --explain
tunnel-client run --profile local-stdio
```
Limits: 600 req/min, 10 MiB, 120 s deadline, 1,000 tunnels. The tunnel docs example uses an https URL; loopback http:// is unconfirmed.

## 4. Install experience / config route (the practical one)
Official doc (learn.chatgpt.com/docs/extend/mcp, ex developers.openai.com/codex/mcp, 308 redirect): "The ChatGPT desktop app, Codex CLI, and IDE extension share this configuration" (~/.codex/config.toml; project override `.codex/config.toml` for trusted projects). ChatGPT web does not read it.

Streamable HTTP keys under `[mcp_servers.<name>]`: `url` (required), `auth` (default `oauth`; the doc defines it as "authentication to try AFTER configured bearer tokens and authorization headers", so a static bearer/header means no OAuth is attempted; other value `chatgpt`), `bearer_token_env_var`, `http_headers` (map of static values), `env_http_headers` (header -> env var name), `http_headers_helper` (local command printing JSON headers; HTTP from local env only), `enabled`, `[mcp_servers.<name>.oauth]`, `scopes`.
```toml
[mcp_servers.anytype]
url = "http://127.0.0.1:31009/mcp/large"
http_headers = { Authorization = "Bearer <key>" }
```
- CORRECTED: no special `auth` value is needed to avoid OAuth probing; static headers take precedence.
- Loopback http:// acceptance by Codex: not stated in docs; HTTP MCP to localhost is commonplace in Codex community usage, but UNCONFIRMED here (test on a real install).
- Reload: Desktop app: Save then **Restart** (button). IDE extension: Restart extension. CLI: docs silent (assume new session); verify with `codex mcp list`.
- Windows path: docs don't state it; `%USERPROFILE%\.codex\config.toml` is the presumed equivalent, UNCONFIRMED. (CODEX_HOME override exists in Codex generally, unverified here.)
- No install deeplink documented for plugins or MCP servers (CONFIRMED as undocumented; plugin docs and web search show none). Unconfirmed that none exists.
- Plugin personal marketplace: add via `codex plugin marketplace add owner/repo` or a hand-written `~/.agents/plugins/marketplace.json`; the desktop app must be restarted afterwards. Plugins cache to `~/.codex/plugins/cache/...`.
- CORRECTED bug facts: openai/codex #38162 was opened 2026-08-12 (not Nov), still open, updated 2026-11-25, 29 comments, Windows + macOS: ChatGPT Desktop (Codex app 26.803+/26.908) completes initialize + tools/list for local MCP servers but does not expose the tools to Chat sessions. A related issue #37976 reports the same for REMOTE HTTP MCP servers in desktop conversations; reports say it works in Codex CLI and older versions. Implication: the desktop-app route is unreliable today, even though the config is written correctly; CLI is the dependable surface.
- Local machine: `codex` 0.172.0, ~/.codex/config.toml exists (not read), ChatGPT.app + ChatGPT Classic.app in /Applications; no separate Codex.app. "ChatGPT desktop and Codex merged 2026-07-09" remains secondary-source only (UNCONFIRMED), though issue reports calling it "Codex App" inside ChatGPT Desktop support the merge.

## 5. Precedents
Figma and Notion in the directory are remote-MCP plugins. No local-first desktop-only precedent found (UNCONFIRMED).

## Verification log
| Claim | Status | Source |
|---|---|---|
| Local MCP submissions limited to approved partners | CONFIRMED | developers.openai.com/plugins/deploy/desktop-only |
| Desktop-only uses stdio entry, no mention of HTTP/localhost or secrets | CONFIRMED (gap) | same |
| ChatGPT cannot present custom API keys | CONFIRMED | developers.openai.com/plugins/build/auth.md |
| Tunnel commands, limits | CONFIRMED | developers.openai.com/api/docs/guides/secure-mcp-tunnels |
| Tunnel consumer eligibility | UNCONFIRMED (docs silent; personal Platform org mentioned) | same |
| config.toml shared by desktop/CLI/IDE | CONFIRMED | learn.chatgpt.com/docs/extend/mcp?surface=cli |
| http_headers / env_http_headers / http_headers_helper / bearer_token_env_var keys | CONFIRMED | same |
| Need to disable OAuth via unknown value | CORRECTED: not needed, static headers win over `auth` | same |
| `codex mcp add --url ... --bearer-token-env-var` | CONFIRMED (local --help 0.172.0) | local CLI |
| `codex mcp add` header flag | CORRECTED: none exists; write TOML instead | local CLI |
| `codex plugin marketplace add owner/repo` | CONFIRMED | local CLI + plugins/build/plugins |
| Personal marketplace `~/.agents/plugins/marketplace.json`, restart desktop | CONFIRMED | developers.openai.com/plugins/build/plugins |
| Windows config path | UNCONFIRMED | docs silent |
| Loopback http:// accepted | UNCONFIRMED | docs silent |
| Reload: desktop needs Restart; CLI unspecified | CONFIRMED / UNCONFIRMED | learn.chatgpt.com doc |
| Install deeplink exists | UNCONFIRMED (none documented) | plugins docs, web search |
| Issue #38162 dated Nov 2026 | CORRECTED -> opened 2026-08-12, active until 2026-11-25; plus #37976 for remote HTTP | github.com/openai/codex/issues/38162 |
| api_key unsupported in submission portal | UNCONFIRMED (schema lists api_key type) | plugins/build/plugins |

## Recommendation for Anytype
Primary zero-touch route (ChatGPT desktop + Codex, one config file, but treat them as two UI tiles): user clicks "Connect to Codex / ChatGPT desktop" in Anytype, picks spaces and read/read-write; Anytype mints the key via RPC, backs up and TOML-merges `[mcp_servers.anytype]` (`url` = native `/mcp/large` on the user's actual port, `http_headers = { Authorization = "Bearer <key>" }`) into `~/.codex/config.toml`, then tells the user to click Restart in the app (CLI: new session). User sees: spaces picker, "Connected" and a Restart hint. Alternatively for CLI-installed users run `codex mcp list` after write to verify; do not use `codex mcp add` with the key (only env-var bearer supported, poor UX).
Fallback: `http_headers_helper` pointing to a tiny Anytype helper so the key is not stored in the file, or the stdio proxy (`npx @anyproto/anytype-mcp`) via `codex mcp add ... --env`, or manual Settings -> MCP servers paste of URL + header.
OS notes: macOS/Linux `~/.codex/config.toml`; Windows presumed `%USERPROFILE%\.codex\config.toml` (verify); detect install via the `codex` binary on PATH and ChatGPT.app / Codex presence; Codex "Connect" tile should be shown only if ~/.codex exists or the app is detected.
Gotchas: (1) ChatGPT desktop chat may not expose MCP tools (issues #38162, #37976) so label the desktop tile as "Codex mode" and make the CLI/Codex path the verified one; (2) ChatGPT web/mobile cannot reach 127.0.0.1 or send API keys, no public directory or tunnel route (needs OAuth + public HTTPS; tunnels need Platform org + tunnel-client); (3) the key is stored in plaintext in config; use read-only/short expiry defaults; (4) preserve user's existing TOML/comments, back up first; (5) desktop-only directory listing needs OpenAI partner allowlisting: worth a business inquiry, not an engineering dependency; (6) optional later: self-hosted plugin marketplace repo with an Anytype usage skill via `codex plugin marketplace add anyproto/...`.
