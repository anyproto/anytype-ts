# OpenAI Codex (CLI, IDE extension, desktop app) - Anytype connection (VERIFIED)

Verified 2026-11-26. Codex is a separate app from the classic ChatGPT chat app; give it its own card.

## 1. Surfaces
- Codex CLI `codex`: macOS/Linux/Windows. Stable rust-v0.172.0 (2026-11-24, confirmed via gh). Installed here at ~/.bun/bin/codex (0.172.0).
- Codex desktop app: on macOS it is shipped inside /Applications/ChatGPT.app (CFBundleIdentifier `com.openai.codex`, URL scheme `codex` registered; confirmed locally via Info.plist). Bundled CLI at `ChatGPT.app/Contents/Resources/codex-cli/` is a DIRECTORY (contains `bin/`, `codex-path`, `codex-package.json`, `CodexCLI.app`), not a single binary (corrected: report implied a binary). `ChatGPT Classic.app` is a different app. Windows/Linux desktop paths: unconfirmed.
- IDE extension: documented; shares the same config. Marketplace id unconfirmed.
- ChatGPT web / classic chat: cannot reach 127.0.0.1; not Codex.

## 2. MCP support (docs: https://learn.chatgpt.com/docs/extend/mcp?surface=cli, config-reference)
- stdio + Streamable HTTP supported. Static headers on HTTP entries supported: `http_headers` (map of static values), `env_http_headers`, `bearer_token_env_var`. `auth = "oauth" (default) | "chatgpt"`: OAuth is only a fallback after configured bearer/headers, so a static Authorization header works with no OAuth prompt.
- Loopback http://127.0.0.1 accepted by `codex mcp add --url` (researcher ran it locally; I did not re-run - my re-test was blocked by the sandbox classifier).
- Defaults: startup_timeout_sec 10, tool_timeout_sec 60. `default_tools_approval_mode = auto|prompt|writes|approve`.
- Docs example mixes `bearer_token_env_var` and `http_headers` in the same entry.

## 3. Routes ranked
### 3a. Anytype writes ~/.codex/config.toml (RECOMMENDED)
Path: `~/.codex/config.toml`; `CODEX_HOME` relocates. CORRECTED: docs give ONE default `~/.codex` with no per-OS variants, so on Windows it is `%USERPROFILE%\.codex\config.toml` by the same tilde rule (not separately documented). Windows `%LOCALAPPDATA%\Programs\OpenAI\Codex\bin` is CODEX_INSTALL_DIR only.
```toml
[mcp_servers.anytype]
url = "http://127.0.0.1:31009/mcp/large"
http_headers = { Authorization = "Bearer <ANYTYPE_API_KEY>" }
default_tools_approval_mode = "prompt"   # optional safety
```
Config file is shared by CLI, desktop and IDE. This machine's config.toml is mode 0600 and already has `[mcp_servers.anytype]` (stdio) plus marketplaces/plugins/projects/tui tables: use a comment-preserving edit of only the `[mcp_servers.anytype]` table; preserve file mode; replace any existing stdio anytype entry (name clash).
### 3b. CLI
`codex mcp add <NAME> (--url <URL> | -- <COMMAND>...)` with `--env`, `--bearer-token-env-var`, `--oauth-*`, `-c key=value` (confirmed in `codex mcp add --help`, 0.172.0). No header/literal-token flag: confirmed (official page also documents none). Subcommands list/get/remove/login/logout. Possible trick (unverified): `codex mcp add` then text-patch http_headers, or `-c` is one-shot only.
### 3c. UI form
Desktop: Settings -> MCP servers -> Add server -> name, STDIO or Streamable HTTP, URL -> Save -> Restart. IDE: same, "Restart extension". Headers/bearer field: NOT documented (UNCONFIRMED). Third-party guide (atlassc.net, Sep 2026) says Settings -> Plugins -> MCPs; UI labels may differ by version.
### 3d. Deeplink
No documented add-MCP deeplink (official page has none; web search found none). openai/codex#54925 still open, 3 comments (all community +1s, no maintainer reply, last 2026-10-28); it asks for prefilled link, no credentials in URLs. `codex://` scheme is registered (confirmed); undocumented routes `codex://settings/mcp-settings`, `codex://plugins/{id}` reported from asar strings - I did not re-extract; best-effort only.
### 3e. Plugin / marketplace
CORRECTED: docs do NOT document `codex plugin add <p>@<m>`. Documented: `codex plugin marketplace add|list|upgrade|remove` (owner/repo, owner/repo@ref, git URL, local root; `--ref`, `--sparse`); "Use the ChatGPT desktop app to install and test a local plugin." Marketplace file: `~/.agents/plugins/marketplace.json` (personal), `$REPO/.agents/plugins/marketplace.json`, legacy `.claude-plugin/marketplace.json`; entry `name, source{source:local,path}|url|git-subdir|package, policy{installation: AVAILABLE|INSTALLED_BY_DEFAULT|NOT_AVAILABLE, authentication}, category`. mcp.json `auth.type:"api_key"` with headerScheme bearer|basic|custom_header describes a credential users supply; manifest holds no token. No install deeplink.

## 4. Live reload
Docs: desktop "Save then Restart", IDE "Restart extension"; CLI reload behaviour not documented. Plan: restart app / start a new CLI session.

## 5. Detection
`codex` on PATH plus probes ~/.bun/bin, ~/.local/bin, /opt/homebrew/bin, /usr/local/bin; app: /Applications/ChatGPT.app with bundle id com.openai.codex; `~/.codex` exists. Windows/Linux app detection unconfirmed.

## 6. Skills
Agent Skills (SKILL.md) supported; ~/.codex/skills exists locally; ~/.agents/skills plausible; official docs URL 404 -> UNCONFIRMED.

## 7. Directory
Official plugin directory shared by ChatGPT and Codex. Submission (https://developers.openai.com/plugins/deploy/submission): remote MCP needs stable public HTTPS; portal supports none/OAuth/mixed only; API-key/Basic/custom-header not supported; nonempty server headers rejected. Local MCP/desktop plugins: separate "desktop-only" process, "choose Skills only". So a localhost + API-key MCP cannot be listed as remote MCP. Self-hosted GitHub marketplace is possible but per-user key injection unsolved.

## Missed / new
Nothing new that is one-click. Watch #54925 and the `codex://` routes. Auth `chatgpt` mode is irrelevant.

## Verification log
- Config path ~/.codex/config.toml, CODEX_HOME: CONFIRMED (docs; Windows default CORRECTED: no separate doc value) https://learn.chatgpt.com/docs/config-file/environment-variables
- http_headers / env_http_headers / bearer_token_env_var keys: CONFIRMED https://learn.chatgpt.com/docs/config-file/config-reference
- No CLI flag for literal token: CONFIRMED (local `codex mcp add --help`, docs)
- `codex mcp add --url ... --bearer-token-env-var`: CONFIRMED syntax locally (--help); execution not re-run
- Restart needs: CONFIRMED for app/IDE; CLI UNCONFIRMED https://learn.chatgpt.com/docs/extend/mcp?surface=cli
- Headers field in UI form: UNCONFIRMED
- No add-MCP deeplink; issue #54925 open: CONFIRMED (gh api; 3 comments, no maintainer) 
- codex:// scheme registered, bundle id com.openai.codex: CONFIRMED (plutil). Internal routes: UNCONFIRMED (not re-extracted)
- `codex plugin add <p>@<m>`: CORRECTED (undocumented; docs say install via desktop app) https://developers.openai.com/plugins/build/plugins
- Bundled codex-cli path: CORRECTED (directory with bin/, not a binary)
- Marketplace submission limits: CONFIRMED https://developers.openai.com/plugins/deploy/submission
- Latest release 0.172.0 2026-11-24: CONFIRMED (gh)
- Origin check not hit by Codex / sandbox not blocking loopback MCP: UNCONFIRMED (no live test vs Anytype)

## Recommendation for Anytype
Primary: "Connect Codex" card (shown if `codex` found or com.openai.codex app or ~/.codex exists). User picks spaces + read/read-write (+expiry); Anytype mints key via RPC, edits only `[mcp_servers.anytype]` in `$CODEX_HOME` or `~/.codex/config.toml` (literal `http_headers` Authorization, tier large, live port, approval mode prompt for read-write), keeps 0600, backs up file. Then show "Restart Codex" and optionally open `codex://settings/mcp-settings` (undocumented). Verify with `codex mcp get anytype`. One write covers CLI, desktop, IDE.
Fallback: copyable TOML block with per-OS path (Windows %USERPROFILE%\.codex\config.toml); or `codex mcp add anytype --url ... --bearer-token-env-var ANYTYPE_API_KEY` (env var is fragile for GUI apps: macOS launchctl setenv, Windows setx).
Gotchas: existing stdio `anytype` entry must be replaced; plaintext token; no Windows/Linux app detection confirmed; do not re-serialize whole TOML; do not put tokens in deeplinks; no directory listing possible for localhost+key.
