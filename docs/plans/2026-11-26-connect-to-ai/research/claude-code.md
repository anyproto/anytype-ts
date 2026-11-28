# Claude Code (CLI, Desktop Code tab, VS Code / JetBrains) - connection research for Anytype

Research date: 2026-11-26. Local CLI inspected: `claude 2.1.332` (native install, `~/.local/bin/claude` -> `~/.local/share/claude/versions/2.1.332`). Claude Desktop installed locally: `/Applications/Claude.app`, bundle id `com.anthropic.claudefordesktop`. No config contents were read (only top-level key names of `~/.claude.json`).

Legend: "unconfirmed" = not verified from a live source.

---------------------------------------------------------------------
## 1. Surfaces, platforms, version

| Surface | Platforms | Notes |
|---|---|---|
| CLI (`claude`) | macOS 13+, Windows 10 1809+/Server 2019+, Ubuntu 20.04+, Debian 10+, Alpine 3.19+; x64/ARM64 | Local version here: 2.1.332 |
| Desktop app, **Code tab** (local, SSH, cloud sessions) | macOS (universal), Windows x64 + ARM64, Linux (beta, apt/.deb) | Local sessions run the embedded Claude Code engine on the user's machine. Cloud sessions run on Anthropic infra (cannot reach localhost). WSL sessions: plugins not available |
| VS Code extension | VS Code >= 1.94.0 | Extension version == bundled Claude Code version |
| JetBrains plugin | JetBrains IDEs | Runs Claude Code in the IDE terminal (so the CLI steps apply) |
| Web (claude.ai/code, cloud sessions) | n/a | Runs on Anthropic infra: **cannot reach 127.0.0.1**. Plugins installed at user/local scope on the machine are not available there |

Claude Code needs a Pro/Max/Ultra/Team/Enterprise/Console account (free plan has no Claude Code).

Install methods and paths (setup docs):
- Native (recommended): `curl -fsSL https://claude.ai/install.sh | bash` (mac/Linux/WSL); `irm https://claude.ai/install.ps1 | iex` (Windows). Binary: `~/.local/bin/claude` (symlink into `~/.local/share/claude/versions/<ver>`); Windows: `%USERPROFILE%\.local\bin\claude.exe`.
- Homebrew cask `claude-code` / `claude-code@latest`; WinGet `Anthropic.ClaudeCode`; apt/dnf/apk repos at downloads.claude.ai; npm `@anthropic-ai/claude-code` (needs Node 22+, installs the same native binary).
- `claude doctor` prints install diagnostics.

---------------------------------------------------------------------
## 2. MCP support in Claude Code

- Transports: stdio, **Streamable HTTP (`http`)**, SSE (deprecated; since v2.1.265 `--transport http` auto-falls back to SSE if the server is legacy), WebSocket (`ws`). JSON `type` accepts `streamable-http` as alias of `http`. A JSON entry with `url` but no `type` is rejected (read as stdio).
- **Static headers: yes.** `--header "Authorization: Bearer ..."` or `"headers": {...}` in JSON.
- **Env-var sourced headers: yes.** `${VAR}` and `${VAR:-default}` expand in `command`, `args`, `env`, `url`, `headers` (in `.mcp.json` and user/local config). Unset var with no default: config loads, literal `${VAR}` is sent, `claude mcp list` warns. Names such as `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, `AWS_BEARER_TOKEN_BEDROCK`, `HTTPS_PROXY`, `NPM_TOKEN` are read as empty in remote url/headers; `API_KEY`-style names are fine.
- **Dynamic headers: `headersHelper`** (command run through a shell, must print JSON object of string pairs on stdout, 10 s timeout, run fresh on every connect/reconnect and re-run once on 401/403; `Authorization` from helper disables OAuth fallback). Env given to the helper: `CLAUDE_CODE_MCP_SERVER_NAME`, `CLAUDE_CODE_MCP_SERVER_URL`, `CLAUDE_PLUGIN_ROOT` (plugin only). For a project/local-scope server the helper runs only after the folder trust dialog is accepted; user-scope servers are not gated. Plugin `headersHelper` cannot use `${user_config.*}`.
- **Secret prompts / keychain:** only via plugin `userConfig` with `"sensitive": true` (value masked, stored in the platform secure credential store, not settings.json). Plain `claude mcp add --header` writes the token in clear text to `~/.claude.json` (user/local) or `.mcp.json` (project).
- **OAuth:** supported for remote servers (`claude mcp login <name>`, `/mcp`, `--client-id`, `--client-secret`, `--callback-port`, DCR and CIMD). Not needed for Anytype today (no OAuth metadata). If `headers.Authorization` is set and rejected, Claude Code reports a failed connection - it does NOT fall back to OAuth.
- **Reach 127.0.0.1:** yes for the CLI, VS Code, JetBrains and Desktop Code-tab **local/SSH-host** sessions (the process runs on the user's machine). No for cloud/web sessions and for claude.ai connectors (executed by Anthropic cloud). Docs do not explicitly say "localhost allowed"; the plugin validator even special-cases it (warns on `http://` only for **non-loopback** hosts), which confirms plain `http://127.0.0.1` is an expected case.
- HTTPS not required: `http://127.0.0.1:31009/mcp/large` works; `claude plugin validate` only warns for `http://`/`ws://` to non-loopback hosts (v2.1.281+).
- Server names via `claude mcp ...` must match `[A-Za-z0-9_-]+`.
- Timeouts: `MCP_TIMEOUT` (startup ms), per-server `"timeout"`, `MCP_TOOL_TIMEOUT`.
- Precedence: local > project > user > plugin-provided > claude.ai connectors. Entire entry of the winning scope is used (no field merge).

---------------------------------------------------------------------
## 3. Every way to add a server (ranked by user effort)

> VERIFIED NOTE: the plugin repo `anyproto/anytype-claude-plugin` used in examples below does NOT exist today (gh api returns 404). It is a hypothetical repo Anytype would have to create and publish. Sections 3.1 and 3.3 depend on that.

Worked example: server `anytype`, `http://127.0.0.1:31009/mcp/large`, header `Authorization: Bearer <KEY>`.

### 3.1 Install-plugin deeplink (VS Code only)  - effort: 1 click, but only for plugins
```
vscode://anthropic.claude-code/install-plugin?plugin=anytype&marketplace=anyproto%2Fanytype-claude-plugin
```
- `plugin` required (<=100 chars, starts with ASCII letter/digit); `marketplace` = GitHub `owner/repo`, https URL or git SSH; default `anthropics/claude-plugins-official`. Git ref appended as `%23ref` (unencoded `#` fails). Requires the VS Code extension. There is NO equivalent plugin/MCP-install deeplink for the CLI (`claude-cli://open` only opens a session with prefilled prompt: params `q`, `cwd`, `repo`, max 5000 chars, never auto-submits) and none for Desktop (`claude://code/new` only takes `ssh_host`, `ssh_port`, `ssh_folder`, `q`; "a link can't carry a key file, a password, or a command"). **No MCP-server deeplink exists for Claude Code - unconfirmed in any source; docs say none documented.**

### 3.2 CLI command (best programmatic route)  - effort: Anytype runs it, 0 user steps
```bash
claude mcp add --transport http --scope user anytype http://127.0.0.1:31009/mcp/large \
  --header "Authorization: Bearer ANYTYPE_API_KEY"
```
Same via JSON (also supports `--scope`, stdin `-` since v2.1.327):
```bash
claude mcp add-json --scope user anytype \
  '{"type":"http","url":"http://127.0.0.1:31009/mcp/large","headers":{"Authorization":"Bearer ANYTYPE_API_KEY"}}'
printf '%s' "$JSON" | claude mcp add-json --scope user anytype -     # keeps the key out of argv / ps output
```
Other commands: `claude mcp list|get <name>|remove <name> [--scope s]`, `claude mcp reset-project-choices`, `claude mcp add-from-claude-desktop` (mac + WSL only; imports from Claude Desktop's config, interactive dialog).
Caveats: `--scope` default is `local` (stored per-project under `~/.claude.json` `projects["<path>"].mcpServers`) - Anytype MUST pass `--scope user` for a global connection. Passing the token as argv is visible in process listings briefly; prefer `add-json ... -` with stdin (>= 2.1.327).
Scopes (docs):
| Scope | Flag | Stored in | Loads in |
|---|---|---|---|
| local (default) | `--scope local` | `~/.claude.json` under project path | this project, private |
| project | `--scope project` | `.mcp.json` in repo root (committed) | this project, all collaborators; needs per-user approval |
| user | `--scope user` | `~/.claude.json` top-level `mcpServers` | all projects |

### 3.3 Plugin with bundled MCP + skill (richest route)
Install commands (shell; need CLI >= 2.1.292 for one-shot form):
```bash
claude plugin marketplace add anyproto/anytype-claude-plugin          # GitHub owner/repo, git URL, https marketplace.json URL, or local path
claude plugin install anytype@anytype-marketplace --scope user
# one command (>=2.1.292):
claude plugin install anytype --marketplace anyproto/anytype-claude-plugin --scope user --config api_key=ANYTYPE_API_KEY
# set/refresh secret afterwards (stdin = not in argv):
echo '{"api_key":"ANYTYPE_API_KEY"}' | claude plugin configure anytype --values-stdin
```
In-session: `/plugin marketplace add owner/repo`, `/plugin install anytype@marketplace` (opens details panel + scope picker; `/plugin install anytype --marketplace owner/repo` needs >= 2.1.275).
Plugin layout:
```
anytype/
  .claude-plugin/plugin.json
  .mcp.json
  skills/anytype/SKILL.md
```
`plugin.json`:
```json
{
  "name": "anytype",
  "displayName": "Anytype",
  "version": "1.0.0",
  "description": "Read and write your Anytype spaces",
  "userConfig": {
    "api_key": {
      "type": "string",
      "title": "Anytype API key",
      "description": "Created for you by Anytype desktop",
      "sensitive": true,
      "required": true
    },
    "base_url": {
      "type": "string",
      "title": "Anytype MCP URL",
      "description": "Local Anytype endpoint",
      "default": "http://127.0.0.1:31009/mcp/large"
    }
  }
}
```
`.mcp.json` (header taken from the sensitive userConfig, not shell-parsed - supported in `url` and `headers` for http servers):
```json
{
  "mcpServers": {
    "anytype": {
      "type": "http",
      "url": "${user_config.base_url}",
      "headers": { "Authorization": "Bearer ${user_config.api_key}" }
    }
  }
}
```
Tool names become `mcp__plugin_anytype_anytype__<tool>`; server shows as `plugin:anytype:anytype` in `/mcp`. Sensitive values go to the OS secure credential store; non-sensitive in `pluginConfigs` of settings.json. `claude plugin install` never prompts for userConfig in the shell - hence `--config` or `plugin configure --values-stdin`. `claude plugin validate ./anytype --strict` checks it (and flags `${user_config.X}` referencing undeclared option, plus literal-credential-looking headers).
Install scopes: user -> `enabledPlugins` in `~/.claude/settings.json`; project -> `.claude/settings.json`; local -> `.claude/settings.local.json`.
Alternative marketplace.json (repo root `.claude-plugin/marketplace.json`):
```json
{ "name": "anytype-marketplace", "owner": { "name": "Anytype" },
  "plugins": [ { "name": "anytype", "source": "./plugins/anytype", "description": "Anytype MCP + skill" } ] }
```
Sources for a plugin entry: relative path, `github` ({"source":"github","repo":"o/r"}), `git-subdir`, `url`, `archive` (zip over https), `npm`, `command`.
Settings-file route (no CLI): add to `~/.claude/settings.json`: `"extraKnownMarketplaces"` + `"enabledPlugins": {"anytype@anytype-marketplace": true}` (keys documented in settings reference; exact `extraKnownMarketplaces` shape NOT verified here - unconfirmed; use CLI commands instead).
Local-only plugin without marketplace: drop the folder (with `.claude-plugin/plugin.json`) under `~/.claude/skills/<name>/` (auto-loads next session as `<name>@skills-dir`); or `claude --plugin-dir ./anytype` (one session). `claude plugin init <name>` scaffolds there.
Reload: new session, or `/reload-plugins` in a running one.

### 3.4 `.mcpb` / desktop extension
Claude Code plugins accept `"mcpServers": "./servers/db.mcpb"` (or https URL to `.mcpb`/`.dxt`); `user_config` in the bundle manifest can be filled via `claude plugin install --config <server>.<key>=<value>` (>=2.1.285). MCPB bundles are for **local stdio** servers; they add nothing for Anytype's HTTP endpoint. (Claude Desktop **chat** app also uses .mcpb - separate research file.) Directory no longer accepts MCPB desktop-extension listings.

### 3.5 In-app UI
- CLI: `/mcp` shows status, auth, reconnect, toggle (does not add arbitrary HTTP+header servers in the terminal dialog - unconfirmed; CLI add is via `claude mcp add`).
- VS Code: `/mcp` in chat panel -> dialog can add/remove servers (local/user/project scope) - requires Claude Code >= 2.1.261. Same config as the terminal.
- Desktop Code tab: "+" -> Add connectors / Browse connectors (claude.ai connectors = remote, cloud-executed; localhost NOT reachable from the connector backend, but Desktop local sessions "register connectors as in-process sdk servers" - still account-level URLs, not suitable). For arbitrary servers docs say: "add MCP servers manually via settings files".
- Plugins in Desktop: "+" -> Add plugins / Plugins -> Browse plugins; scope chooser user/project/local.

### 3.6 Config files
| File | Path | Scope |
|---|---|---|
| user + local MCP servers | macOS/Linux: `~/.claude.json`; Windows: `%USERPROFILE%\.claude.json` (relocated by `CLAUDE_CONFIG_DIR`? - for `~/.claude` yes; `.claude.json` relocation unconfirmed) | user: top-level `mcpServers`; local: `projects["/abs/path"].mcpServers` |
| project MCP | `<repo>/.mcp.json` | project |
| settings (plugins, env, permissions) | `~/.claude/settings.json` (user), `.claude/settings.json`, `.claude/settings.local.json` | |
| managed | `managed-mcp.json` / `managedMcpServers` setting (admin; exclusive control) | org |
Format of a user entry in `~/.claude.json` (verified key names on this machine: top-level `mcpServers` object and per-project `mcpServers`, `enabledMcpjsonServers`, `disabledMcpjsonServers`, `hasTrustDialogAccepted`):
```json
{ "mcpServers": { "anytype": { "type": "http", "url": "http://127.0.0.1:31009/mcp/large",
  "headers": { "Authorization": "Bearer ANYTYPE_API_KEY" } } } }
```
Store/Flatpak/Snap variants: not applicable to the CLI. Claude Desktop MSIX/Store variants are a different config (`claude_desktop_config.json`), see the Claude Desktop (chat) research.

---------------------------------------------------------------------
## 4. Can Anytype safely write/merge the config?

- **Do NOT hand-edit `~/.claude.json`.** It is a large, live state file that every running Claude Code process rewrites constantly (stats, caches, feature flags, per-project `last*` metrics, 40+ top-level keys here). Concurrent write -> lost update or corruption. Docs never describe it as a supported hand-edit surface (except one documented flag, `projects["<path>"].hasTrustDialogAccepted`). **Recommended: always go through `claude mcp add-json --scope user` (it does the locking/merge) or a plugin.** Writing `~/.claude/settings.json` is a documented, stable surface (JSON, plain `enabledPlugins`/`env` keys), less risky but still shared with the app.
- `.mcp.json` (project scope) is a plain user-owned file, safe to merge, but project servers need per-user approval in interactive sessions, and it would commit a secret to git - avoid for the token (use `${VAR}` expansion if ever used).
- Live reload: MCP config is read at session start; a running session needs `/mcp` -> reconnect, `/reload-plugins` (plugins), or a new session/conversation. VS Code: "changes take effect in conversations you start afterwards". Desktop Code tab: new session. So Anytype should tell the user "start a new Claude Code session".
- Risks: 3P/managed Desktop deployments can set `strictPluginOnlyCustomization: ["mcp"]` and block `~/.claude.json` / `claude mcp add` servers (plugin-bundled MCP still loads) - another argument for the plugin route in enterprises. `allowedMcpServers`/`deniedMcpServers` may hide servers. Project-scope `.mcp.json` servers need approval; user scope does not. `headersHelper` for local/project scopes is blocked until the folder is trusted.
- Token at rest: `claude mcp add --header` stores the key in plaintext in `~/.claude.json` (readable by user only). The plugin `sensitive` userConfig route stores it in the OS keychain/credential store (better). `headersHelper` could instead read the key from a file/keychain on each connection (fresh each connect, 10 s limit) - lets Anytype rotate keys without rewriting config:
```json
"anytype": { "type": "http", "url": "http://127.0.0.1:31009/mcp/large",
  "headersHelper": "cat ~/.anytype/claude-header.json" }
```
(helper output must be `{"Authorization":"Bearer ..."}`; `cat` form is Unix only; Windows would need PowerShell/`type` - untested, unconfirmed.)

---------------------------------------------------------------------
## 5. Detection

| Thing | macOS | Windows | Linux |
|---|---|---|---|
| CLI on PATH | `command -v claude`; native: `~/.local/bin/claude`; brew: `/opt/homebrew/bin/claude` (or `/usr/local/bin`); npm: `$(npm prefix -g)/bin/claude` | `%USERPROFILE%\.local\bin\claude.exe`; WinGet link; npm `%APPDATA%\npm\claude.cmd` | `~/.local/bin/claude`, `/usr/bin/claude` (apt/dnf) |
| Reliable check | spawn `claude --version` (prints `2.1.x (Claude Code)`) with a login-shell PATH (Electron launched from Finder has a minimal PATH - probe `~/.local/bin` explicitly) | probe explicit paths | same |
| Claude config dir | `~/.claude` (exists after first run) and `~/.claude.json` | `%USERPROFILE%\.claude`, `.claude.json` | same |
| Desktop app (Code tab) | `/Applications/Claude.app`, bundle id `com.anthropic.claudefordesktop` (verified locally); Claude Code engine in `~/Library/Application Support/Claude/claude-code/` (not verified) | install dir unconfirmed (MSIX vs exe differs; SSH feature note says "download-button build, not the Microsoft Store build") | `.deb`/apt package (beta) - paths unconfirmed |
| VS Code extension | `~/.vscode/extensions/anthropic.claude-code-*` or `code --list-extensions \| grep anthropic.claude-code` | same under `%USERPROFILE%\.vscode\extensions` | same |
| URL scheme registered | `claude-cli://` handler = `~/Applications/Claude Code URL Handler.app` (registered only after first interactive message); `claude://` handled by Claude Desktop | `HKCU\Software\Classes\claude-cli` | `~/.local/share/applications/claude-code-url-handler.desktop` |
Note: the Desktop Code tab bundles its own engine; the standalone CLI may NOT be installed even if Desktop is. Desktop Code-tab local sessions share user config (`~/.claude/settings.json`, `~/.claude/skills`, plugins) with the CLI per docs: "The terminal, the desktop app's local sessions, and the VS Code extension on one computer read the same settings files, so a plugin you install at user scope in any of them is available in the other two." MCP servers in `~/.claude.json` are loaded in Code-tab sessions (inferred: 3P docs describe blocking exactly `~/.claude.json`, `.mcp.json`, `claude mcp add` servers in Code sessions) - not directly stated for the standard Desktop; a GitHub issue (#64464, closed 2026-06) reports even `claude_desktop_config.json` servers appear in the Code tab. **Treat Desktop-shares-`~/.claude.json` as probable but verify manually once.** If the CLI isn't installed, Anytype cannot run `claude mcp add`; fall back to the plugin folder in `~/.claude/skills/anytype/` (documented skills-dir plugin) which Desktop local sessions read ("Local sessions load your personal skills from `~/.claude/skills/`" - plugin-in-skills-dir load in Desktop is inferred, unconfirmed).

---------------------------------------------------------------------
## 6. Skills / plugins

- Agent Skills (`SKILL.md`): yes, native. Personal: `~/.claude/skills/<name>/SKILL.md`; project: `.claude/skills/`; plugin: `skills/<name>/SKILL.md`. Invoked as `/<plugin>:<skill>` and auto-matched by `description`.
- Plugin format bundles skills, commands, agents, hooks, MCP servers, LSP, output styles, `bin/` executables, monitors, themes. One install = everything.
- Install: `claude plugin install ...` (one command), `/plugin`, Desktop "Add plugins", VS Code `/plugins`, VS Code deeplink (3.1). Plugins sync from the claude.ai account (`<name>@synced`) to Claude Code at session start - so a plugin installed through claude.ai Customize > Plugins also shows up in Claude Code. Remote `http` MCP entries in a plugin show as connectors in claude.ai chat/Cowork, but localhost is useless there.
- Plugin MCP + `${user_config.*}`: loads in Claude Code and prompts for values; chat/Cowork ignore.
- `claude plugin details`, `claude plugin list`, `claude plugin validate [--strict]`, `claude plugin eval` exist.

---------------------------------------------------------------------
## 7. Marketplace / directory

- Official marketplace `claude-plugins-official` (repo `anthropics/claude-plugins-official`) auto-added on first interactive start; the "directory" at https://claude.ai/directory lists plugins and connectors (also `/plugin directory` in CLI >= 2.1.287). Community marketplace exists too. Reserved names (`claude-*`, `anthropic-*`, containing "official" next to claude/anthropic) are rejected by validate for plugins, so name the plugin `anytype`, not `claude-anytype`.
- **Your own marketplace (no approval):** any git repo with `.claude-plugin/marketplace.json`; users add with `claude plugin marketplace add owner/repo`. Can be GitHub, any git URL, local path, hosted https JSON file. Auto-update off by default for third-party marketplaces. Org admins can pre-install via managed settings. Fastest to ship.
- **Anthropic directory submission:** developer portal https://claude.ai/directory/manage; requires a paid claude.ai plan (Pro/Max/Ultra/Team/Enterprise owner). Two kinds: Plugin bundle (public GitHub repo, automated validation + security scan + human review per new listing) and MCP connector (REMOTE server URL only; auto policy scan, default "Community", may escalate to "Verified"). Local MCP via MCPB/desktop-extension listings are no longer accepted; "To distribute a local MCP server through the directory, include it in a plugin bundle." So a **localhost-only server can be listed only as a plugin bundle** whose MCP entry is local/localhost (stdio or `http://127.0.0.1` with userConfig); it cannot be a standalone connector. Whether reviewers accept a plugin whose server needs a locally-running app: not stated - unconfirmed (precedent: stdio local-server plugins exist). `anthropics/claude-plugins-official` itself takes no portal submissions (partner contact only).
- Plugin metadata for listing goes in `plugin.json`: `icon`, `documentationUrl`, `supportUrl`, `privacyPolicyUrl`, `termsOfServiceUrl` (https), plus `displayName`.
- Component support matrix (claude.com docs): remote http MCP -> Chat (as connector), Cowork, Claude Code; local MCP (command/.mcpb) -> Claude Code and Cowork-local only; MCP with `${user_config.*}` in URL -> ignored in Chat, Claude Code loads and prompts. => Anytype plugin works fully only in Claude Code (CLI/VS Code/Desktop Code tab), by design.

---------------------------------------------------------------------
## 8. Recommendation

**Zero-touch route (Claude Code CLI / VS Code / Desktop Code tab share this):**
1. In Anytype Settings -> "Connect to Claude Code": user picks spaces and read/read-write (and optionally expiry). Anytype mints the key via internal RPC, no pairing code.
2. Anytype detects `claude` (probe `~/.local/bin/claude`, brew paths, `%USERPROFILE%\.local\bin`, PATH; run `claude --version`; require >= 2.1.292 for one-shot plugin install, >= 2.1.327 for stdin add-json).
3. Anytype runs (from Electron main, token via stdin/env, not argv):
   - Plugin route (preferred): `claude plugin install anytype --marketplace anyproto/anytype-claude-plugin --scope user --config api_key=<KEY> --config base_url=http://127.0.0.1:<port>/mcp/large -y`
     (or `marketplace add` + `install` for older CLIs; `-y` is only needed for command-source plugins, not for a github-source plugin; pass key then via `echo '{"api_key":"..."}' | claude plugin configure anytype --values-stdin`).
     Result: Anytype MCP + an "anytype" skill, key stored in the OS credential store, port/tier user-changeable.
   - Plain route (if user wants only MCP, or plugin fetch blocked/offline): `printf '%s' '{"type":"http","url":"http://127.0.0.1:31009/mcp/large","headers":{"Authorization":"Bearer <KEY>"}}' | claude mcp add-json --scope user anytype -`
4. Anytype shows "Done. Start a new Claude Code session (or run /reload-plugins / /mcp in the open one)" and a "Test connection" button (Anytype can verify the key itself via its own API + optionally `claude mcp get anytype`).
User clicks: 1 (Connect) + picking spaces (+ 1 confirm). No JSON, no token copy, no Node.

**Fallbacks:**
- CLI not installed (Desktop/VS Code only): VS Code -> show "Install in VS Code" button that opens `vscode://anthropic.claude-code/install-plugin?plugin=anytype&marketplace=anyproto%2Fanytype-claude-plugin`, then the extension's plugin form asks for the key (Anytype copies the key to clipboard / shows it once, since Anytype cannot push `--config` into the extension - unconfirmed whether the install-plugin URI accepts config params; docs list only `plugin` and `marketplace`). Desktop-only: copy plugin folder to `~/.claude/skills/anytype/` (documented skills-dir plugin) with a `.mcp.json` whose header is `Bearer ${ANYTYPE_API_KEY}`... but then env var must exist - not zero-touch; or offer to install the CLI (`curl -fsSL https://claude.ai/install.sh | bash` / `irm https://claude.ai/install.ps1 | iex`) with consent, then step 3. All unconfirmed for Desktop-without-CLI beyond the settings-sharing statement.
- Manual copy-paste block (always available): a box with the exact one-line `claude mcp add --transport http --scope user anytype http://127.0.0.1:31009/mcp/large --header "Authorization: Bearer <KEY>"` and a Copy button (OS-specific quoting: PowerShell/cmd need the header in double quotes; same command works).

**Gotchas:**
- Always `--scope user` (default `local` binds the server to the cwd of the spawn, i.e. useless).
- Server name `anytype` must match `[A-Za-z0-9_-]`; avoid colliding with the old `@anyproto/anytype-mcp` stdio entry users may already have (local-scope entry would shadow user-scope: precedence local > project > user). Detect with `claude mcp list` / `claude mcp get anytype` and `claude mcp remove`.
- Security: the key sits in plaintext in `~/.claude.json` with the plain route; keychain-backed with the plugin route; never put the key in a deeplink (deeplinks here cannot carry it anyway). Keep Anytype key scoped read-only by default, offer expiry; show a revoke button.
- Anytype must be running for the MCP server to respond (local-first); the client shows "failed to connect" otherwise. Port is user-configurable: write the actual port; if it changes, plugin `base_url` userConfig lets `claude plugin configure` update it, while `~/.claude.json` needs re-add (`mcp remove` + `add-json`).
- `http://` loopback is fine (validator only warns on non-loopback http). No OAuth path: a 401 from a bad/revoked key shows "failed" and does not fall back to OAuth.
- Version minimums: `--transport http` fallback logic v2.1.265; `/mcp` add dialog in VS Code 2.1.261; plugin install `--marketplace` shell form 2.1.292; `--config` for bundled mcpb 2.1.285; add-json stdin 2.1.327; validate MCP checks 2.1.281; `/plugin directory` 2.1.287.
- Enterprise/3P Desktop may block user-defined MCP (`strictPluginOnlyCustomization:["mcp"]`): plugin route survives, plain route doesn't. Cloud/web Claude Code sessions can never reach the localhost server (state this in UI).
- Plugin name must not start with `claude-`/`anthropic-`; `claude plugin install` for `command`-source plugins asks for confirmation (`-y`), not applicable to a github-source plugin.
- Unconfirmed items worth a manual smoke test before shipping: (a) Desktop Code tab loading `~/.claude.json` user-scope MCP on current stable; (b) `claude plugin install ... --config` for a plugin's own `userConfig` (help text says "Set a userConfig option declared in the plugin's manifest" - verified in local `--help`, but not tested end-to-end); (c) exact `extraKnownMarketplaces` JSON shape; (d) whether `CLAUDE_CONFIG_DIR` also moves `.claude.json`.

---------------------------------------------------------------------
## Sources (all fetched 2026-11-26 unless noted)
- https://code.claude.com/docs/en/mcp  (CLI 2.1.x docs; scopes, add/add-json, env expansion, headersHelper, OAuth, plugin servers, import from Desktop)
- https://code.claude.com/docs/en/plugins/manifest-reference.md  (plugin.json, userConfig, ${user_config.*}, env vars, mcpServers shapes, validate)
- https://code.claude.com/docs/en/plugins/components.md  (plugin MCP/.mcp.json, skills, mcpb, configure)
- https://code.claude.com/docs/en/plugins/install.md  (install scopes, marketplace add sources, `--marketplace`, shell install, synced plugins, shared settings between CLI/Desktop local/VS Code)
- https://code.claude.com/docs/en/plugin-marketplaces (create-marketplace page: marketplace.json format)
- https://code.claude.com/docs/en/plugins/publish.md  (own marketplace vs Anthropic directory, submit via claude.ai/directory/manage)
- https://claude.com/docs/directory/publish  (connector = remote only; MCPB listings deprecated; local server only via plugin bundle)
- https://claude.com/docs/plugins/platform-support.md  (component support matrix across Chat/Cowork/Claude Code)
- https://code.claude.com/docs/en/deep-links  (`claude-cli://open`, registration locations, `claude://code/new` mention)
- https://code.claude.com/docs/en/desktop (Code tab, connectors, SSH, claude://code/new params; first 200k chars read)
- https://code.claude.com/docs/en/vs-code (shared MCP config, /mcp dialog >=2.1.261, `vscode://anthropic.claude-code/install-plugin` and `/open`)
- https://code.claude.com/docs/en/setup (install methods/paths, claude doctor, `~/.local/bin/claude`, `~/.claude.json`)
- https://claude.com/docs/third-party/claude-desktop/code.md (3P: Code session blocks `~/.claude.json`/.mcp.json/`claude mcp add` servers under strictPluginOnlyCustomization)
- https://claudeissues.com/issue/64464-docs-say-claude-desktop-config-json-mcp-servers-will-not-appear-in-the-code-tab (search result only, not fetched; contradiction report, closed 2026-06-22)
- Local CLI introspection 2026-11-26: `claude --version` = 2.1.332; `claude mcp add --help`, `claude mcp --help`, `claude plugin install --help`, `claude plugin configure --help`, `claude plugin marketplace add --help`; top-level key names of `~/.claude.json` (values not read).


---------------------------------------------------------------------
## Verification log (2026-11-26)

| Claim | Status | Source / note |
|---|---|---|
| `claude mcp add --transport http --scope user NAME URL --header "Authorization: Bearer X"`; `-t/-H/-s` short forms | CONFIRMED | local `claude mcp add --help` (2.1.332); https://code.claude.com/docs/en/mcp |
| `--transport` accepts stdio, sse, http only (ws needs add-json) | CONFIRMED | local help + mcp docs |
| `add-json <name> <json>` accepts `-` to read stdin | CONFIRMED (help text). Min version 2.1.327 UNCONFIRMED | local `claude mcp add-json --help`; docs excerpt does not mention stdin |
| `--scope` default is local; user = `~/.claude.json` | CONFIRMED | local help; mcp docs scope table |
| Entry with `url` but no `type` is rejected; `streamable-http` alias | CONFIRMED | mcp docs |
| `${VAR}`/`${VAR:-default}` expansion in url/headers; ANTHROPIC_* etc. read as empty | CONFIRMED | mcp docs |
| `headersHelper` re-run on each connect; user-scope not trust-gated; Windows form untested | CONFIRMED (10 s timeout and 401 re-run UNCONFIRMED in fetched part) | mcp docs lines on dynamic headers; example uses `echo '{"Authorization":...}'` |
| Plain `http://127.0.0.1` allowed | CONFIRMED indirectly (no HTTPS requirement stated; docs only restrict OAuth token endpoints to https or loopback) | mcp docs; not explicitly stated for MCP URL |
| No OAuth fallback when static Authorization set | CONFIRMED | this session's own MCP failure notice ("OAuth fallback is disabled when headers.Authorization is set") |
| No MCP-server deeplink for Claude Code | CONFIRMED | mcp docs (none mentioned), deep-links page |
| `claude-cli://open` params q (<=5000), cwd, repo; never auto-submits; handler registered only after first interactive message | CONFIRMED | https://code.claude.com/docs/en/deep-links |
| `vscode://anthropic.claude-code/install-plugin?plugin=&marketplace=` | CONFIRMED, CORRECTED nuance: it only opens the Manage plugins dialog at scope choice; nothing installs until user picks scope; no config/key params exist | https://code.claude.com/docs/en/vs-code |
| `vscode://anthropic.claude-code/open?prompt=&session=` | CONFIRMED (report omitted it) | vs-code docs |
| VS Code `/mcp` dialog can add servers (>=2.1.261); changes apply to conversations started afterward; MCP config shared with CLI | CONFIRMED | vs-code docs |
| `claude://code/new` params ssh_host/ssh_port/ssh_folder/q | UNCONFIRMED (desktop docs page does not show it in fetched portion; deep-links page only says Desktop handles `claude://` and points to SSH-link section) | |
| Desktop Code tab loads `~/.claude.json` MCP servers | UNCONFIRMED. Docs only say "add MCP servers manually via settings files"; GitHub #64464 contradiction report unverified | https://code.claude.com/docs/en/desktop |
| Plugins at user scope shared by terminal, Desktop local sessions, VS Code | CONFIRMED | https://code.claude.com/docs/en/plugins/install.md |
| `claude plugin install <plugin> --marketplace owner/repo` from shell needs >= 2.1.292; `/plugin install ... --marketplace` >= 2.1.275; default scope user | CONFIRMED | install.md; local `plugin install --help` |
| `--config key=value` for userConfig on install; `claude plugin configure --values-stdin` | CONFIRMED | local help |
| `-y` needed when stdin/stdout not a TTY | CORRECTED nuance: help says -y is for marketplace-declared command sources / headersHelper-fetched archives; github-source plugin should not need it | local help |
| Plugin install via shell: loads next session or `/reload-plugins` | CONFIRMED | install.md |
| `anyproto/anytype-claude-plugin` exists | CORRECTED: does not exist (404). Must be created | gh api |
| `extraKnownMarketplaces` shape | UNCONFIRMED | not verified |
| Directory: local MCP via MCPB no longer accepted; local server only inside plugin bundle; remote MCP connector otherwise; paid plan; portal claude.ai/directory/manage; plugin gets security scan + human review | CONFIRMED | https://claude.com/docs/directory/publish |
| Whether reviewers accept a plugin needing a locally running app | UNCONFIRMED | |
| Own marketplace (git repo + `.claude-plugin/marketplace.json`) needs no approval; third-party auto-update off by default | CONFIRMED | install.md |
| `claude mcp add-from-claude-desktop` (Mac and WSL) | CONFIRMED | local help |
| Min versions 2.1.265/281/285/287 | UNCONFIRMED individually (not re-checked) | |
| GitHub #16728: `--scope user` may be stored per project / not global | NEW, status CLOSED; title says user-scope servers overridden by project configs. Treat as historical, smoke test after add (`claude mcp get anytype`) | https://github.com/anthropics/claude-code/issues/16728 |

### Missed / new findings
- `claude plugin marketplace add` supports `--json`, `--scope`, and `claude plugin install --json` gives machine-readable output: use `--json` from Electron to parse results.
- `claude mcp get anytype` health-checks the server: use it as the post-install verification (shows Connected/Failed).
- Plugins added at claude.ai account level sync into terminal sessions (`<name>@synced`), but localhost is useless there.
- Claude Code docs say there is still no official MCP-install deeplink; nothing newer found.

---------------------------------------------------------------------
## Recommendation for Anytype

Primary zero-touch route (CLI present):
1. Settings > "Connect to Claude Code": user picks spaces, read or read/write, optional expiry. Anytype mints the key via internal RPC.
2. Detect `claude`: probe `~/.local/bin/claude`, `/opt/homebrew/bin/claude`, `/usr/local/bin/claude`, `%USERPROFILE%\.local\bin\claude.exe`, `%APPDATA%\npm\claude.cmd`, PATH (Electron from Finder has a minimal PATH). Run `claude --version`.
3. Run with the key on stdin (never argv): `claude mcp add-json --scope user anytype -` with `{"type":"http","url":"http://127.0.0.1:<port>/mcp/large","headers":{"Authorization":"Bearer <KEY>"}}`. If an `anytype` entry exists, `claude mcp remove anytype --scope user` first (also check local scope). Then `claude mcp get anytype` to verify.
4. UI: "Connected. Start a new Claude Code session (or run /mcp to reconnect)." User clicks: Connect, pick spaces, confirm.

Fallbacks:
- CLI missing, VS Code only: the extension's `/mcp` dialog can add servers, but there is no deeplink with key. Offer to install the CLI with consent (`curl -fsSL https://claude.ai/install.sh | bash`, `irm https://claude.ai/install.ps1 | iex`) then step 3; or a copy-paste block with the one-line `claude mcp add` command and a Copy button.
- Desktop Code tab only: UNCONFIRMED that it reads `~/.claude.json`; do a manual smoke test before promising it. Shared plugin settings are confirmed, so a plugin route works there once published.
- Optional richer route: publish own marketplace repo (does not exist yet) with an `anytype` plugin using sensitive `userConfig` (keychain-stored) and install via `claude plugin install anytype --marketplace anyproto/<repo> --config api_key=...` (config key on command line shows in argv, so prefer `claude plugin configure anytype --values-stdin`). Directory listing only as plugin bundle (public repo, review, paid plan); a standalone connector must be remote so localhost cannot be one.

OS notes: Windows quoting irrelevant when using stdin JSON. `headersHelper` is an alternative to avoid rewriting config on key rotation (Unix `cat` form; Windows form untested).

Gotchas: always `--scope user`; name `anytype` may collide with an old stdio entry (local beats user); Anytype must be running; port changes need remove+add; enterprise `strictPluginOnlyCustomization:["mcp"]` blocks `claude mcp add` (plugin route survives); cloud/web Claude Code sessions cannot reach localhost; key sits in plaintext in `~/.claude.json` with the plain route; never edit `~/.claude.json` by hand (shared live state file).
