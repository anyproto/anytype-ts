# Connecting Anytype to the ChatGPT app (separate from Codex CLI) - research, 2026-11-26

Method: official OpenAI docs (learn.chatgpt.com, developers.openai.com, help.openai.com) fetched live, plus local inspection of the ChatGPT.app and codex-cli 0.172.0 on this Mac (`--help`, plist, key names of ~/.codex/config.toml only; no values read). Third-party blogs are flagged. Anything not confirmed is marked "unconfirmed".

## 0. Key finding: the naming has changed (since 2026-07-09)

- OpenAI merged the standalone Codex app into the ChatGPT desktop app on macOS and Windows. The macOS app named **ChatGPT.app now has bundle id `com.openai.codex`** and is the old Codex app renamed. Verified locally: `/Applications/ChatGPT.app`, CFBundleIdentifier `com.openai.codex`, version `26.1120.50957`, URL schemes `codex`, `http`, `https`. It bundles `Contents/Resources/codex-cli`.
- The previous ChatGPT chat app is now **"ChatGPT Classic"**. Verified locally: `/Applications/ChatGPT Classic.app`, bundle id `com.openai.chat`, version `1.2026.184`, URL schemes `openai`, `chatgpt`, `com.openai.chat`.
- The new app has modes Chat, Work and Codex. Source: https://help.openai.com/en/articles/20001276-moving-to-the-new-chatgpt-desktop-app (seen 2026-11-26) and third-party news (Neowin, developersdigest). Codex history is separate from Chat/Work history.
- Consequence for Anytype: **a user who has the new ChatGPT desktop app already has the Codex host** (local threads, MCP client, ~/.codex/config.toml). It is not required to install the Codex CLI. A ChatGPT Classic user or web-only user does NOT have a local MCP client.
- So there are three distinct user types: (A) new ChatGPT desktop app (local MCP works), (B) ChatGPT Classic (no local MCP found; unconfirmed that it has none, no doc says it supports MCP), (C) ChatGPT web only (remote HTTPS only).

## 1. Surfaces, platforms, versions

| Surface | Exists | Local MCP | Notes |
|---|---|---|---|
| New ChatGPT desktop app (Chat / Work / Codex) | macOS (Apple silicon; Intel unconfirmed by official page), Windows (Microsoft Store). Linux: separate "Linux desktop app" doc page exists (https://developers.openai.com/codex/linux/linux-app, not read) | Yes, in Codex mode / local threads | macOS version seen 26.1120.50957. Available on every plan per press (Neowin, third party); official help page does not state plans (unconfirmed officially) |
| ChatGPT Classic (old app) | macOS (Apple silicon only per third party), Windows unconfirmed | No MCP doc found - unconfirmed | Still supported; third party claims retirement 2027-01-30 (unconfirmed) |
| Codex CLI | all OS | Yes | Separate product. v0.172.0 here. Shares ~/.codex/config.toml |
| IDE extension | VS Code etc | Yes | Shares config; "Restart extension" after save |
| ChatGPT web (chatgpt.com) | browser | NO. Remote only | "ChatGPT web doesn't read local Codex configuration files"; "ChatGPT web uses remote MCP tools through plugins" |

Sources: https://learn.chatgpt.com/docs/extend/mcp (seen 2026-11-26); local plist.

## 2. MCP support per surface

### New desktop app (Codex mode), CLI, IDE (one shared configuration)
- stdio: yes (`command`, `args`, `env`, `env_vars`, `cwd`).
- Streamable HTTP: yes (`url`). Legacy SSE: not documented for Codex (unconfirmed).
- Static headers: yes. Per-server keys (verbatim from https://learn.chatgpt.com/docs/extend/mcp and config-reference):
  - `url` (required)
  - `bearer_token_env_var` - env var name whose value is sent as `Authorization: Bearer`
  - `http_headers` - map of header name to static value
  - `env_http_headers` - map of header name to env var name
  - `http_headers_helper` - "Local command that prints a JSON object of HTTP header names and values"; "Supported only for locally connected HTTP MCP servers"; explicit bearer tokens and OAuth take precedence over helper-provided Authorization
  - `auth` = `oauth` (default) or `chatgpt`
  - also `startup_timeout_sec` (10), `tool_timeout_sec` (60), `enabled`, `required`, `enabled_tools`, `disabled_tools`, `default_tools_approval_mode`, `startup_readiness`, `environment_id`.
- Secrets: no keychain integration documented. Options are env var (problem: a GUI app launched from Dock/Start does not inherit shell env vars on macOS; unconfirmed whether the app imports login-shell env), literal `http_headers` (plaintext in file), or `http_headers_helper` (a local command, e.g. a tiny script reading the OS keychain or a 0600 file, prints `{"Authorization":"Bearer ..."}`). The helper is the only documented non-plaintext, non-env route; note it runs a command each connection (frequency unconfirmed).
- Reaches 127.0.0.1: yes - the app/CLI is the local client and connects from the user's machine. HTTPS not required for localhost HTTP (the existing CLI works with http://127.0.0.1; HTTPS requirement for non-local URLs unconfirmed). Anytype's Origin check is irrelevant because native clients send no browser Origin.
- OAuth: supported (`codex mcp login`, Authenticate button); Anytype has no OAuth so not used.

### ChatGPT web / ChatGPT Classic-like cloud clients
- Remote only. Cloud executes the connector. Adding: chatgpt.com Plugins -> plus -> "Add custom MCP server" (https://developers.openai.com/api/docs/guides/custom-mcp-server, undated). Fields: name, description, Server URL under "Connection" or "Tunnel", auth, risk acknowledgment, "Create as a plugin", then install.
- Auth modes in form: OAuth, No authentication, OAuth-or-none (mixed). **No API key / custom header field in the web form.** Plugin packaging docs mention `auth.type: "api_key"` with `headerScheme` bearer/basic/custom_header, but "API-key declarations aren't supported by the submission portal's connection form" (https://developers.openai.com/plugins/build/plugins). Plugin auth guide says ChatGPT "can[not] present custom API keys" (https://developers.openai.com/plugins/build/auth).
- Transports: SSE and streamable HTTP.
- Plans: "Developer mode" has been removed (third-party dev.to article, Nov 2026, citing OpenAI help; the official custom-MCP page has an empty developer-mode heading). Reported rules (unconfirmed officially, changed several times in 2026): Business/Enterprise/Edu full read+write; Pro read-only tools; Plus/Free/Go unspecified. Workspace permissions and "Lockdown" can block custom servers.

## 3. Ways to add a server, ranked by user effort (worked example: name `anytype`, http://127.0.0.1:31009/mcp/large, bearer)

Placeholder `$KEY` = freshly minted Anytype API key.

### 3.1 Deeplink - for MCP servers: NONE
Official deeplink list (https://learn.chatgpt.com/docs/app/commands, seen 2026-11-26) has no MCP-add route. Routes that exist:
```
codex://settings
codex://settings/connections
codex://skills
codex://automations
codex://threads/new?prompt=<text>&path=<abs path>&originUrl=<git remote>
codex://new?prompt=...            (needs at least one of prompt/path/originUrl)
codex://threads/<thread-id>
codex://settings/browser-use | settings/computer-use/google-chrome | settings/connections/{computer,devices,ssh,ssh/add?name=<host>}
(plugins/install accepts ONLY `marketplace`; use `openai-curated` for OpenAI plugins. `codex://connector/oauth_callback` was NOT on the live page - removed/unconfirmed.)
codex://plugins/install/<plugin-name>?marketplace=<marketplace-name>
codex://plugins/<plugin-id>
codex://plugins/<plugin-name>?marketplacePath=<absolute-marketplace-path>   (optional mode=share)
codex://pets/install?name=..&imageUrl=..
```
A third-party gist (zhuowei) lists only the older subset. Windows: **CORRECTED** - the claim that issue #29605 reports a missing Windows `codex` protocol registration is FALSE; that issue is about choosing which window a `codex://` link opens in. Windows `codex://` registration remains unconfirmed (no doc states it; `codex://settings` is mentioned on the Windows app page), test before relying on it.

**Plugin deeplink route is the interesting one**: Anytype can generate a local marketplace + plugin on disk and open
```
codex://plugins/anytype?marketplacePath=/Users/<u>/.agents/anytype-marketplace
```
(documented format; exact UX of the resulting install dialog unconfirmed - not tested). The plugin's `mcp.json` would then hold the entry. Whether a plugin-bundled HTTP server can carry a static `Authorization` header or env-sourced header is **unconfirmed**: docs only mention OAuth fields (`clientId`, `callbackUrl`, `callbackPort`) for plugin HTTP servers, and `plugins.<plugin>.mcp_servers.<server>` user-config only exposes `enabled`, `enabled_tools`, `disabled_tools`, `default_tools_approval_mode`. So a plugin route for a bearer-token server is risky; use it for the skill and keep the MCP entry in config.toml (3.3) until verified.

### 3.2 CLI (needs the `codex` binary: bundled inside ChatGPT.app at `Contents/Resources/codex-cli`)
Verified locally (codex-cli 0.172.0): `codex mcp add <NAME> (--url <URL> | -- <COMMAND>...)` with `--bearer-token-env-var <ENV_VAR>` (HTTP only), `--env KEY=VALUE` (stdio only), `--oauth-client-id`, etc. There is **no `--header` / literal-token flag**. So:
```
# token in env var (user must have it in app's environment - fragile for GUI apps)
codex mcp add anytype --url http://127.0.0.1:31009/mcp/large --bearer-token-env-var ANYTYPE_API_KEY
```
and `codex mcp login <name>` is OAuth only. Literal bearer needs config.toml editing (3.3) or a stdio server (`-- npx -y @anyproto/anytype-mcp` with `--env OPENAPI_MCP_HEADERS=...`, needs Node; not recommended). Plugin management CLI: `codex plugin add|list|remove`, `codex plugin marketplace add|list|upgrade|remove` (verified locally).

### 3.3 Config file - the practical zero-touch route
Path: `~/.codex/config.toml` (macOS/Linux); Windows `%USERPROFILE%\.codex\config.toml` (https://learn.chatgpt.com/docs/windows/windows-app: "uses the Codex home directory %USERPROFILE%\.codex"). `CODEX_HOME` env var overrides (documented for WSL: `export CODEX_HOME=/mnt/c/Users/<windows-user>/.codex`). WSL users using the agent in WSL2 mode read the Linux home by default (Windows app has an agent-environment switch "Windows native" vs "WSL"; which side the MCP client lives in for WSL mode is unconfirmed). Store/Flatpak/Snap variants of the config path: none documented (Windows app is a Microsoft Store package but docs still point to %USERPROFILE%\.codex). Project scope: `.codex/config.toml` in trusted projects.
```toml
[mcp_servers.anytype]
url = "http://127.0.0.1:31009/mcp/large"
http_headers = { "Authorization" = "Bearer ANYTYPE_KEY_HERE" }
startup_timeout_sec = 20
```
Better (no plaintext token in config): 
```toml
[mcp_servers.anytype]
url = "http://127.0.0.1:31009/mcp/large"
http_headers_helper = "'/Applications/Anytype.app/Contents/Resources/anytype-mcp-header'"   # prints {"Authorization":"Bearer ..."}
```
Helper syntax (string command vs array, quoting, cwd) is documented only as "string (command)"; exact parsing unconfirmed - test. Anytype would need to ship that helper or a script reading its own secure store.
Verified locally that the user's own config has a `[mcp_servers.anytype]` table with keys `command, args, env` (stdio route) - so the app tolerates user-added servers alongside app-managed ones.

### 3.4 In-app UI form
New desktop app: Settings -> MCP servers -> Add server -> name, STDIO or Streamable HTTP, URL -> Save -> Restart (https://learn.chatgpt.com/docs/extend/mcp). A third-party guide (atlassc.net, 2026-09-11) shows Settings -> Plugins -> MCPs -> Add -> Add MCP server (menu names differ by version). The docs mention **no headers/bearer fields in the form** (headers documented only in config.toml) - so the form is not enough for Anytype's bearer; unconfirmed whether newer builds add them.

### 3.5 Extension package (.mcpb)
No .mcpb support documented for ChatGPT/Codex (unconfirmed absence). The equivalent is the plugin format (section 6).

### 3.6 ChatGPT web
Manual only, remote-only, no bearer field, see 2. For localhost: Secure MCP Tunnel (section 7).

## 4. Can Anytype write/merge config safely?
- File is TOML, shared by app, CLI, IDE. The app itself rewrites it (it stores `[projects]`, `[notice]`, `[tui]`, `[plugins]`, `[desktop]`, marketplaces etc.; seen as top-level keys locally). So Anytype must do a read-modify-write that preserves comments/unknown keys (use a format-preserving TOML editor, not parse+dump), write atomically (temp file + rename), keep a one-time backup, and only touch `[mcp_servers.anytype]`. Preferred: shell out to `codex mcp add anytype --url ... --bearer-token-env-var ...` when the bundled CLI exists because the vendor tool does the merge - but it cannot set a literal header.
- Reload: **not live**. Docs say Save -> **Restart** (desktop), "Restart extension" (IDE). For a file edit, a full restart of the ChatGPT app (or at least new thread - unconfirmed) is needed; tell the user "Quit and reopen ChatGPT". On macOS Anytype could do `osascript -e 'tell application id "com.openai.codex" to quit'` then `open -b com.openai.codex` after asking consent (risk: interrupts running agent tasks).
- Risks: concurrent writes while app is running; project-level `.codex/config.toml` overrides; multiple `CODEX_HOME`; WSL vs Windows homes; enterprise managed configuration (https://developers.openai.com/codex/enterprise/managed-configuration) can lock MCP; secrets in plaintext file readable by any local process (same as other clients).

## 5. Detecting installation
- macOS new app: bundle id `com.openai.codex` (find with `mdfind "kMDItemCFBundleIdentifier == 'com.openai.codex'"`), `/Applications/ChatGPT.app`, URL scheme `codex` (check `LSCopyDefaultApplicationURLForURL(codex://)`). Beware the old name `/Applications/Codex.app` duplicates (third party). Do NOT match on the filename "ChatGPT.app" alone: ChatGPT Classic is `/Applications/ChatGPT Classic.app` (`com.openai.chat`, schemes `chatgpt`, `openai`) and has no MCP client.
- macOS data dirs seen locally: `~/Library/Application Support/Codex`, `~/.codex`.
- Bundled CLI: `/Applications/ChatGPT.app/Contents/Resources/codex-cli` (seen locally). A separate npm/brew `codex` on PATH may exist but is a different product.
- Windows: Microsoft Store product id `9PLM9XGG6VKS` (https://learn.chatgpt.com/docs/windows/windows-app; `winget install --id 9PLM9XGG6VKS -s msstore`); executable `ChatGPT.exe`; config dir `%USERPROFILE%\.codex`. Package family name and registry detection: unconfirmed.
- Linux: Linux desktop app doc exists (unread); config `~/.codex/config.toml`; detection unconfirmed.
- Exists-check fallback: `~/.codex/` directory presence (also created by CLI-only users, so it signals "Codex host", not necessarily the GUI app).

## 6. Skills / plugins
- Plugins bundle MCP servers + skills + hooks. Layout (https://developers.openai.com/plugins/build/plugins, seen 2026-11-26): root `plugin.json` (or legacy `.codex-plugin/plugin.json`), root `mcp.json`, `skills/<name>/SKILL.md` (frontmatter `name`, `description`). Skills are Agent-Skills style SKILL.md.
- Marketplace file `.agents/plugins/marketplace.json` (repo) or `~/.agents/plugins/marketplace.json` with plugins in `~/.codex/plugins/<name>`; restart app. Verified real example (third-party codex-warp repo):
```json
{
  "name": "anytype",
  "owner": { "name": "Anytype", "url": "https://anytype.io" },
  "plugins": [
    {
      "name": "anytype",
      "description": "Anytype skills and MCP",
      "source": "./plugins/anytype",
      "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" },
      "version": "1.0.0",
      "category": "productivity"
    }
  ]
}
```
- Install ways: `codex plugin marketplace add owner/repo` (GitHub shorthand, Git URL, or local dir); `codex plugin add <plugin>@<marketplace>` (verify exact arg shape with --help); deeplink `codex://plugins/install/<plugin>?marketplace=<name>`; GUI Plugins tab. Installed cache under `~/.codex/plugins/cache/<marketplace>/<plugin>/<version>`; enabled state in config.toml `[plugins]` keyed `plugin@marketplace` (seen locally).
- Remote MCP entry in mcp.json: `{"mcpServers":{"docs":{"type":"streamable-http","url":"https://example.com/mcp"}}}`; api_key declaration `"extensions": {"com.openai": {"auth": {"type":"api_key","headerScheme":"bearer"}}}` exists in schema but whether Codex local prompts for the key for a localhost server is unconfirmed.
- Skills-only plugin is a safe zero-config add-on: Anytype ships a "how to use Anytype" skill while the MCP entry sits in config.toml.

## 7. Marketplace / directory and Secure MCP Tunnel
- OpenAI Plugin Directory exists (platform.openai.com/plugins submission portal). Requirements (https://developers.openai.com/plugins/deploy/submission): individual/business identity verification, organization owner submits, review needs exactly 5 positive + 3 negative cases and video, remote server must be "a stable, public HTTPS endpoint" with domain verification; auth: none, OAuth, or mixed; **no API-key/bearer flow**. => **A localhost-only Anytype server cannot be listed** as a normal plugin.
- Local MCP server listing: "Desktop only" badge plugins, bundle a stdio server in mcp.json (`{"type":"stdio","command":"node","args":["${PLUGIN_ROOT}/server/dist/index.js"],"cwd":"${PLUGIN_ROOT}"}`), install only from desktop app, usable in local threads only. But "Local MCP submissions are limited to approved partners" - needs OpenAI allowlisting by org ID via an OpenAI representative (https://developers.openai.com/plugins/deploy/desktop-only). Anytype could apply as a partner with a stdio plugin bundling a tiny proxy binary, but that is a business process, not engineering-only. Plan/OS not stated.
- Workspace distribution (Business/Enterprise admins) works without public submission.
- Secure MCP Tunnel (https://developers.openai.com/api/docs/guides/secure-mcp-tunnels, seen 2026-11-26): outbound-only `tunnel-client` binary runs on the user's machine and polls OpenAI (`api.openai.com:443 /v1/tunnel/*`), forwards MCP requests to a configured stdio command or `--mcp-server-url` (HTTP). ChatGPT side: Plugins -> Add custom MCP server -> Connection: Tunnel. Requires OpenAI **Platform organization** permissions (Tunnels Read+Manage to create, Read+Use to run/select) and a `CONTROL_PLANE_API_KEY` - not a consumer feature; plan tier not stated; ChatGPT-side auth still OAuth/none, so Anytype's bearer-only endpoint would still need an OAuth shim or no-auth exposure. Commands: `tunnel-client init --profile <n> --tunnel-id <id> --mcp-server-url ...`, `tunnel-client doctor`, `tunnel-client run`. Verdict: too heavy for a non-technical ChatGPT-web-only user; defer.

## 8. Recommendation

Zero-touch route (user type A: new ChatGPT desktop app, any plan that includes the app):
1. Anytype detects `com.openai.codex` (macOS) / Store package or `%USERPROFILE%\.codex` (Windows). Show a "ChatGPT" card. Do NOT conflate with Classic.
2. User clicks "Connect ChatGPT", picks spaces, access (read / read-write), optional expiry. Anytype mints the key via internal RPC.
3. Anytype merges `[mcp_servers.anytype]` into `~/.codex/config.toml` (format-preserving, atomic, backup). Prefer `http_headers_helper` pointing to an Anytype-shipped helper (no plaintext token) if testing confirms parsing; otherwise `http_headers` with the token (file written 0600).
4. Anytype asks "Restart ChatGPT now?" and restarts it. User opens Codex mode and types `/mcp` or asks about their notes. Total: 3 clicks + one restart confirm.
5. Optional: also install a skills-only plugin via local marketplace + `codex://plugins/...` deeplink.

Fallback (config write refused, or app form only): show "Open ChatGPT settings" (`codex://settings`), copy URL to clipboard; but the form lacks a header field, so fallback = show the TOML snippet with a copy button and the OS-specific path (open folder button), or use the bundled `codex mcp add anytype --url ... --bearer-token-env-var ANYTYPE_API_KEY` plus setting the env var (launchctl setenv on macOS, `setx` on Windows) - fragile, last resort.

Users B (Classic) and C (web only): no local route. Honest message "ChatGPT Classic/web cannot talk to local apps; install the new ChatGPT desktop app (free, includes Codex mode) or use Claude/other client". Remote route would need Anytype to expose an OAuth-capable public HTTPS endpoint or use OpenAI tunnel - out of scope.

Marketplace: a localhost bearer-token server cannot enter the public directory; the only plausible listing is a Desktop-only plugin (stdio proxy) which needs OpenAI partner approval - worth a business inquiry, not an engineering dependency.

Gotchas: token stored plaintext in config unless helper route works; restart required; GUI env-var inheritance makes `bearer_token_env_var` unreliable; app rewrites config.toml; enterprise managed config may block; `codex://` on Windows unverified; menu names (Settings -> MCP servers vs Plugins -> MCPs) vary by build; plan rules for web custom MCP changed repeatedly (Pro read-only reportedly); token via deeplink is not possible (no route) which is good for security.

## Sources (seen 2026-11-26 unless noted)
- https://learn.chatgpt.com/docs/extend/mcp (also developers.openai.com/codex/extend/mcp, redirects 308) - MCP config, desktop UI steps
- https://learn.chatgpt.com/docs/config-file/config-reference (read first 100k of 166k chars) - key definitions
- https://learn.chatgpt.com/docs/app/commands (deeplinks) and https://developers.openai.com/codex/app/commands
- https://learn.chatgpt.com/docs/windows/windows-app - Windows install, %USERPROFILE%\.codex, `codex://settings`
- https://developers.openai.com/plugins/build/plugins - plugin layout, marketplaces, api_key schema
- https://developers.openai.com/plugins/build/auth - OAuth only, no API keys
- https://developers.openai.com/plugins/deploy/desktop-only - local MCP plugins, approved partners only
- https://developers.openai.com/plugins/deploy/submission - public directory requirements
- https://developers.openai.com/api/docs/guides/secure-mcp-tunnels - tunnels
- https://developers.openai.com/api/docs/guides/custom-mcp-server - web custom MCP form (undated)
- https://developers.openai.com/plugins/changelog - no direct relevant entries
- https://help.openai.com/en/articles/20001276-moving-to-the-new-chatgpt-desktop-app - merge, Classic
- https://codex.danielvaughan.com/2026/07/17/codex-chatgpt-unified-desktop-app-cli-migration-codex-app-detection-workarounds/ (third party) - bundle id, claims CLI reads config.toml "not the desktop app" (contradicted by official "share this configuration"; treat official as correct, but the file-read by the GUI app itself is only implied: official page says shared configuration, not literally that the GUI reads the file - unconfirmed by test)
- https://atlassc.net/2026/09/11/how-to-add-an-mcp-server-in-codex-desktop (third party, 2026-09-11)
- https://dev.to/kinzarra/chatgpt-mcp-how-to-add-an-mcp-server-now-that-developer-mode-is-gone-4ia (third party, Nov 2026) - developer mode removal, plan reports
- https://gist.github.com/zhuowei/98005fb9f2a42d5fd376f0fa71f204cc (third party) - older deeplink list
- https://github.com/warpdotdev/codex-warp (real marketplace.json example)
- Local: /Applications/ChatGPT.app and ChatGPT Classic.app Info.plist, `codex --version` 0.172.0, `codex mcp add --help`, `codex plugin --help`, key names of ~/.codex/config.toml

## Open items to test empirically (not done, as research was read-only)
1. Does the GUI app pick up `http_headers` / `http_headers_helper` entries written to config.toml, and does a restart suffice?
2. `http_headers_helper` exact command string syntax and call frequency.
3. Does a plugin-bundled mcp.json HTTP entry accept static headers or env-sourced headers.
4. `codex://` registration on Windows; `codex://plugins/...marketplacePath=` UX.
5. Whether the GUI inherits shell env vars (for `bearer_token_env_var`).


---

# VERIFICATION (2026-11-26, second-pass skeptic)

## Verification log

| Claim | Status | Source |
|---|---|---|
| New ChatGPT.app = bundle id com.openai.codex, v26.1120.50957, schemes codex/http/https, bundles Contents/Resources/codex-cli | CONFIRMED locally (defaults read, plutil, lsregister "claimed schemes: codex:, http:, https:") | /Applications/ChatGPT.app |
| ChatGPT Classic exists as separate app (com.openai.chat) | CONFIRMED (dir present; official: "previous app, now called ChatGPT Classic, keeps receiving model updates, bug fixes, security patches") | https://help.openai.com/en/articles/20001276-moving-to-the-new-chatgpt-desktop-app |
| New app modes Chat/Work/Codex; macOS+Windows only; Codex history separate | CONFIRMED | same help page |
| Help page says nothing about MCP/connectors/plans | CONFIRMED (so the "every plan" claim stays unconfirmed officially) | same |
| Classic has no MCP | UNCONFIRMED (no official doc either way; third-party results conflict). Treat as "no local MCP route" | web search 2026-11-26 |
| Deeplinks list | CORRECTED: removed `codex://connector/oauth_callback`; added threads/<id>, settings/browser-use, settings/computer-use/google-chrome, settings/connections/{computer,devices,ssh,ssh/add?name=}. No MCP-add deeplink | https://learn.chatgpt.com/docs/reference/commands (developers.openai.com/codex/app/commands 308-redirects here) |
| codex://plugins/install/<plugin>?marketplace=<name>, codex://plugins/<id>, codex://plugins/<name>?marketplacePath=<abs>[&mode=share] | CONFIRMED (install accepts only `marketplace`; install requires marketplace already registered - inference) | same |
| Windows codex:// registration gap per issue #29605 | CORRECTED: issue is about window targeting, says nothing about Windows registration; Windows status UNCONFIRMED | https://github.com/openai/codex/issues/29605 |
| `codex mcp add <NAME> (--url URL \| -- CMD...)`, `--bearer-token-env-var`, `--env` (stdio only), `--oauth-client-id`, `--oauth-client-secret`, no header flag | CONFIRMED (codex-cli 0.172.0 --help). Docs likewise show no header flag | local CLI; https://learn.chatgpt.com/docs/extend/mcp |
| `codex plugin add/list/remove/marketplace`; `marketplace add <local path \| owner/repo[@ref] \| https/ssh git>` with --ref, --sparse | CONFIRMED (--help). Gives Anytype a CLI way to register a local marketplace without deeplink | local CLI |
| TOML keys url, bearer_token_env_var, http_headers, env_http_headers, http_headers_helper | CONFIRMED verbatim ("Static HTTP headers included with each MCP HTTP request"; helper "Supported only for locally connected HTTP MCP servers"; explicit bearer/OAuth take precedence over helper Authorization). No timing/syntax details for helper -> still UNCONFIRMED | https://learn.chatgpt.com/docs/config-file/config-reference |
| Static Authorization header to loopback http://127.0.0.1 works | PARTLY CONFIRMED: keys documented; loopback-HTTP + static header combo not demonstrated in docs; not tested (read-only task). Local user's existing config tolerates user-added [mcp_servers.*] | docs above |
| Config path ~/.codex/config.toml; Windows %USERPROFILE%\.codex; CODEX_HOME override | CONFIRMED macOS (file exists, top-level tables: skills, desktop, hooks, marketplaces, mcp_servers, notice, plugins, projects, tui); Windows per windows-app doc (not re-fetched this pass) | local; https://learn.chatgpt.com/docs/windows/windows-app |
| Reload behaviour | UNCONFIRMED/CORRECTED: docs say "Restart" only after saving a server IN THE APP UI; docs do not say whether hand-editing config.toml needs restart. Assume restart/new thread needed; test | https://learn.chatgpt.com/docs/extend/mcp |
| UI form: Settings -> MCP servers -> Add server -> name, STDIO/Streamable HTTP, URL -> save -> restart; no header fields documented | CONFIRMED (absence of header fields = unconfirmed whether truly absent) | same |
| "ChatGPT web doesn't read local Codex configuration files" | CONFIRMED verbatim | same |
| Plugin mcp.json: {"$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json","mcpServers":{"docs":{"type":"streamable-http","url":...}}}; auth under extensions["com.openai"].auth with type none/oauth/mixed/api_key, headerScheme bearer/basic/custom_header (+headerName); "describes how to send a credential supplied during connection setup; doesn't contain the token"; no env substitution/headers/localhost doc; api_key unsupported by submission portal form | CONFIRMED / adds $schema detail. Whether the desktop app prompts for a key for a local plugin server: UNCONFIRMED | https://developers.openai.com/plugins/build/plugins |
| Plugin config keys plugins.<p>.mcp_servers.<s>.{enabled,enabled_tools,disabled_tools,default_tools_approval_mode,tools.<t>.approval_mode} | CONFIRMED (adds per-tool approval_mode) | config-reference |
| Desktop-only local MCP plugins limited to approved partners, org allowlisted via OpenAI rep, stdio only, install only from desktop app, local threads only | CONFIRMED | https://developers.openai.com/plugins/deploy/desktop-only |
| Public directory needs stable public HTTPS; no API-key flow; localhost cannot be listed | CONFIRMED (submission page not re-fetched; consistent with plugins page + desktop-only) | https://developers.openai.com/plugins/deploy/submission |
| Secure MCP Tunnel: org permissions Tunnels Read+Manage / Read+Use, CONTROL_PLANE_API_KEY, tunnel-client init/doctor/run, `--mcp-command` (stdio) or `--mcp-server-url` (HTTP), tunnel must be associated with target workspace | CONFIRMED; docs do NOT say whether ChatGPT-side Authorization is forwarded to the private server; plans not named | https://developers.openai.com/api/docs/guides/secure-mcp-tunnels |
| Web custom MCP: Plugins -> + -> Add custom MCP server, remote only, Developer mode removed, plan rules | Menu/flow CONFIRMED by multiple third parties; plan rules conflict across sources (Business/Ent/Edu full; Pro read-only) -> UNCONFIRMED officially. Localhost rejected ("Unsafe URL" community report) | https://community.openai.com/t/how-can-i-connect-a-local-mcp-server-python-to-chatgpt-unsafe-url-issue/1368574 and web search |
| Marketplace layout .agents/plugins/marketplace.json, plugins in ~/.codex/plugins | UNCONFIRMED this pass (local ~/.agents has only skills; config.toml has [marketplaces.<name>] tables with source_type/source/last_updated, i.e. CLI `plugin marketplace add` persists to config.toml - CONFIRMED locally) | local |
| Third-party claims (Classic retirement 2027-01-30, Intel Mac) | UNCONFIRMED, drop from decisions | - |

## Missed / new findings
1. `codex plugin marketplace add <local path>` + `codex plugin add anytype@anytype` is a fully scriptable, vendor-merged route to install an Anytype skills/MCP plugin without hand-editing TOML (verified --help). Combined with deeplink `codex://plugins/install/anytype?marketplace=anytype` it is also UI-visible. Still blocked for the bearer token by the unconfirmed plugin-header question.
2. `-c key=value` overrides exist on every codex subcommand but are NOT persistent writes; do not use to configure.
3. No official extension API, no .mcpb, no directory path for a localhost bearer server; no recent deprecation affecting the route found. `http_headers_helper` is the newest/safest secret route and is undocumented in detail.
4. Official docs state "Local computer access with Work Cloud" exists; whether Work mode (cloud) can reach local MCP is unconfirmed - assume local MCP applies to Codex-mode local threads only.

## Recommendation for Anytype
**Primary zero-touch route (new ChatGPT desktop app, macOS/Windows):**
1. Detect: macOS bundle id com.openai.codex (never match the name "ChatGPT.app" alone; Classic is "ChatGPT Classic.app", com.openai.chat); Windows: Store package / ChatGPT.exe / existing %USERPROFILE%\.codex.
2. User clicks "Connect ChatGPT", picks spaces + read/read-write + expiry; Anytype mints the key via internal RPC.
3. Anytype writes `[mcp_servers.anytype]` into ~/.codex/config.toml with a format-preserving atomic edit, backup, file mode 0600:
```toml
[mcp_servers.anytype]
url = "http://127.0.0.1:31009/mcp/large"
http_headers = { "Authorization" = "Bearer <KEY>" }
startup_timeout_sec = 20
```
   Prefer `http_headers_helper` (Anytype-shipped helper that reads its own store) only after empirically confirming command-string parsing; else plaintext `http_headers`.
4. Ask consent, then quit + reopen ChatGPT (`osascript ... quit` then `open -b com.openai.codex` on macOS). User opens Codex mode and asks about notes. Total: pick spaces, click Connect, confirm restart.

**Fallback:** show "Open ChatGPT settings" (`codex://settings`) plus a copy button with the TOML snippet and a reveal-in-folder button for the path; or run the bundled CLI (`.../ChatGPT.app/Contents/Resources/codex-cli mcp add anytype --url ... --bearer-token-env-var ANYTYPE_API_KEY`) but env-var inheritance by GUI apps is unreliable, so last resort. Optional add-on: skills-only plugin via `codex plugin marketplace add <local dir>`.

**Not served:** ChatGPT Classic and ChatGPT web have no local route (web cannot read local config, rejects localhost, needs public HTTPS + OAuth/none; tunnel needs an OpenAI Platform org). Tell user to install the new desktop app or use another client.

**OS notes:** Windows config %USERPROFILE%\.codex\config.toml, WSL-mode agent may read the Linux home (unconfirmed); CODEX_HOME overrides; Linux desktop app exists (unread).

**Gotchas:** restart for hand-edited config unconfirmed; app itself rewrites config.toml; enterprise managed config can lock MCP; plaintext token at rest; Windows codex:// unverified; menu names vary by build; marketplace/directory listing only via OpenAI-approved desktop-only partner program (business inquiry, stdio proxy plugin), not engineering-only.
