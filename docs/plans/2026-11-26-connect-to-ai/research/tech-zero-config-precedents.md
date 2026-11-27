# Precedents: local desktop apps that connect themselves to AI clients

Research date: 2026-11-26. Every claim is tagged with its source number [S#] (see Sources). Anything not confirmed from a live source is marked **unconfirmed**. No client config contents were read and nothing was modified on this machine; only `--help`/`--version` were run for `codex` (0.172.0) and `claude` (2.1.332).

---

## 0. TL;DR of patterns

1. **Detect, then one button.** JetBrains and Docker detect installed clients (config dir or app bundle exists) and show a per-client Connect/Auto-Configure button. Raycast (v2.13, 2026-11-18) now ships "one-click setup" for 7 clients [S19].
2. **Prefer the client's own CLI when it owns the config.** Coplay Unity-MCP runs `claude mcp add/remove` for Claude Code rather than editing `~/.claude.json` [S14]. Obsidian connector does the same: it only *copies* the `claude mcp add` command because "the Claude Code CLI owns" `~/.claude.json` [S1]. JetBrains is the outlier: it edits `~/.claude.json` as JSON directly [S4].
3. **Direct file write = merge, never replace.** JetBrains: read JSON, keep all non-`mcpServers` keys and all other server entries, replace only its own entry, write `*.tmp` then atomic move [S5]. Obsidian Codex installer adds preview, timestamped backup, lock, atomic write, read-back [S1, S2]. Docker is the weakest: plain `os.WriteFile` with no backup [S8].
4. **Auth on loopback ranges from none to per-client token:**
   - Figma desktop: no auth at all, URL only [S11].
   - Unity (official): no token; a **connection-approval UI** in the editor instead (Pending Connections, Accept/Deny; approved clients reconnect automatically) [S16].
   - Joplin: one shared token in a URL query string, user must copy it [S12].
   - JetBrains: one global auth token written into each client's config as header `IJ_MCP_AUTH_TOKEN` (project configs reference an env var instead of the literal) [S4, S5].
   - **Raycast MCP and Obsidian: a separate token per connected client, individually revocable** [S17, S1]. This is the best model.
5. **stdio-only clients are the pain point (Claude Desktop).** Everyone either ships a stdio bridge or an MCPB bundle. JetBrains and Docker do NOT use npx; they invoke their own binary (`<ide launcher> stdioMcpServer`; `docker mcp gateway run`) [S4, S8]. Obsidian ships an `.mcpb` generated per token and fails closed when the token is revoked [S1]. Joplin and Zotero-community rely on `npx mcp-remote` (Node required) [S12, S13].
6. **Putting a `url` entry in `claude_desktop_config.json` is dangerous**: a March 2026 bug report says Claude Desktop then wipes the whole `mcpServers` section (secondhand via search summary, see S20; treat as likely but re-verify before relying on it).
7. **Disconnect is rarely first-class.** Docker has `docker mcp client disconnect` (code exists: `disconnect.go`) [S8]; Obsidian removes the entry when the owning token is revoked and keeps a `.backup` [S1]; JetBrains shows a per-client configured state but I could not confirm a "remove" action (**unconfirmed**).

---

## 1. JetBrains IDEs (built-in MCP server, "Auto-Configure")

**Docs**: IntelliJ IDEA 2026.3 help, dated 2026-05-13 [S3]. Built in since 2025.2; Settings | AI | MCP Server.

### Flow (UI)
1. Settings | AI | MCP Server -> tick **Enable MCP Server** -> review access dialog -> Enable -> Apply.
2. "Clients Auto-Configuration" section lists *detected* clients; click **Auto-Configure** next to each; **restart the client** afterward [S3].
3. Chevron next to Auto-Configure picks the transport (SSE / Stdio / HTTP Stream); available set depends on client [S3].
4. Extra menu items: **Open Client Settings File**, **Copy Config**; manual section has **Copy SSE Config / Copy Stdio Config / Copy HTTP Stream Config** [S3].
5. "Project Clients Auto-Configuration" writes into the currently-open project's client config (server only available in that project) [S3].
6. Terminal can show a setup suggestion when Codex/Claude starts without a matching MCP config [S3].

### Supported clients (source enum `McpClientInfo.Name`, `intellij-community` master, seen 2026-11-26) [S4]
`VS_CODE, CLAUDE_APP, WINDSURF, CURSOR, CLAUDE_CODE, JUNIE, CODEX, AIR, GITHUB_COPILOT_IDE_PLUGIN, GITHUB_COPILOT_CLI`. The help page names Junie, VS Code, Claude Code, Codex, Air, GitHub Copilot CLI (the doc list is shorter than the enum) [S3, S4].

### Detection (source `McpClientDetector.kt`) [S4]
Pure filesystem probing, no process inspection:

| Client | Detected when | Config file |
|---|---|---|
| Claude Desktop ("Claude App") | parent dir of the config exists | mac `~/Library/Application Support/Claude/claude_desktop_config.json`; Win `%APPDATA%/Claude/claude_desktop_config.json`; Linux `~/.config/Claude/claude_desktop_config.json` |
| Claude Code | `~/.claude.json` is a regular file | `~/.claude.json` (project scope: `<project>/.mcp.json` if it contains "mcpServers") |
| Cursor | `~/.cursor/` dir exists | `~/.cursor/mcp.json` (project: `.cursor/mcp.json`) |
| VS Code | `mcp.json` exists | mac `~/Library/Application Support/Code/User/mcp.json`; Win `%APPDATA%/Code/User/mcp.json`; Linux `~/.config/Code/User/mcp.json` (project `.vscode/mcp.json`) |
| Windsurf | `~/.codeium/windsurf/` exists | `~/.codeium/windsurf/mcp_config.json` |
| Junie | `~/.junie/mcp/` exists | `~/.junie/mcp/mcp.json` |
| Codex | `resolveCodexConfigPath()` (honours Codex home) | `~/.codex/config.toml` (project: `.codex/config.toml`) |

### How it writes (source `McpClient.kt`, `CodexClient.kt`) [S5, S6]
- Strategy `autoConfigure()`: try Streamable HTTP config, else SSE, else **stdio**; first one whose write succeeds wins.
- JSON clients: read existing JSON (parse failure => starts from `{}`, i.e. a corrupt file is silently replaced; **a risk to avoid**), keep every top-level key except `mcpServers`, keep every server entry except its own key and legacy keys, put its own entry; write `<file>.tmp` then `Files.move(..., ATOMIC_MOVE)`; on `AtomicMoveNotSupported` plain move; on Windows `AccessDenied` (client has file open) falls back to in-place overwrite [S5]. **No backup file** (not seen in source).
- Codex: parses TOML with nightconfig, removes legacy keys, sets `mcp_servers.<productKey>`, rewrites the file (comments preserved only in nightconfig's CommentedConfig sense; **unconfirmed** whether formatting is fully preserved) [S6].
- Cursor: if Cursor version < 1.0.0 skips streamable HTTP and uses SSE entry (`type: "sse"`); otherwise `{"url": ".../stream", "type": "http", "headers": {...}}` [S7]. Version is read from the Cursor install.
- Entry key is product-specific (one key per IDE product, plus legacy `jetbrains` key); web guides say multiple IDEs collide on key `jetbrains` in Claude Desktop [S20, secondhand].
- Staleness check: `isConfigUpToDate()` compares port **and token** of the existing entry; if the IDE port changed the UI can offer to re-promote the config [S5]. This is a useful pattern: a "needs update" state.

### Auth
- IDE generates a global token (`McpServerService.getGlobalAuthToken()`); written as header `IJ_MCP_AUTH_TOKEN: <token>` in global configs. In project-scope configs the literal is replaced with an env placeholder `${IJ_MCP_AUTH_TOKEN}` (Cursor: `${env:IJ_MCP_AUTH_TOKEN}`; Codex uses `env_http_headers` since Codex expands no variables in `http_headers`) so a committed file carries no secret [S5, S6, S7].
- JetBrains help page does not document tokens or port [S3]. As of Jan 2026 the port is not user-configurable (secondhand, S20).

### Bundled binary instead of npx (key precedent)
Stdio entry is built by `createStdioMcpServerCommandLine`: `<IDE bin launcher> stdioMcpServer` (fallback: bundled `java -classpath ... <main class>`), env `IJ_MCP_SERVER_PORT`, optional `IJ_MCP_SERVER_PROJECT_PATH`, token in env [S9]. Claude Desktop ("ClaudeClient") does not override the HTTP config so it always lands on this **stdio** entry [S4]. Resulting JSON shape:

```json
{ "type": "stdio",
  "command": "<ide launcher or java>",
  "args": ["stdioMcpServer"],
  "env": { "IJ_MCP_SERVER_PORT": "<port>", "IJ_MCP_AUTH_TOKEN": "<token>" } }
```
(Shape from the KDoc in `stdioRunnerUtil.kt`; exact args vary.) No Node needed.

### Disconnect
Not seen in UI docs or source reviewed (**unconfirmed**). Settings can show the "configured / not configured" state via `isConfigured()` / `isConnectedToThisIde()` [S5].

---

## 2. Docker Desktop MCP Toolkit ("Clients" tab)

Docs: docs.docker.com/ai/mcp-catalog-and-toolkit/toolkit/ (seen 2026-11-26, no date on page) [S10]. Source: `github.com/docker/mcp-gateway`, `pkg/client/` (seen 2026-11-26; repo has no GitHub "latest release", so no version) [S8].

### Flow
- GUI: MCP Toolkit -> **Clients** tab -> **Connect** next to a client; for Claude Desktop "Restart Claude Desktop" [S10].
- CLI: `docker mcp client connect <vendor> [--global|-g] [--profile NAME]`; per-project example `docker mcp client connect vscode --profile my_profile` creates `.vscode/mcp.json` [S10]. Codex only supports `--global` (`ErrCodexOnlySupportsGlobalConfiguration`) [S8].
- Profiles = named server collections; chosen at connect time [S10].

### Clients (from `pkg/client/config.yml`, 2026-11-26) [S8]
claude-desktop, claude-code, cline, continue, cursor, vscode, gemini, goose, lmstudio, opencode, sema4, zed, kiro, crush (+ Codex via separate `codex_handler.go`, + "Gordon" Docker's own assistant). Not exhaustive of the 14+ listed.

### Detection
`installCheckPaths` per client, e.g. Claude Desktop `/Applications/Claude.app` or `$AppData\Claude\`; Cursor `/Applications/Cursor.app`, `$AppData/Cursor/`; VS Code `/Applications/Visual Studio Code.app`, `$APPDATA\Code\`, `$HOME/.config/Code`; Claude Code `$HOME/.claude`; Codex `$HOME/.codex`; LM Studio `$HOME/.lmstudio` or `$HOME/.cache/lm-studio`; Gemini `$HOME/.gemini` [S8].

### Config paths and edit method
- Declarative per-client YAML with a `yq` expression for `list/set/del` (e.g. `.mcpServers[$NAME] = $JSON`; VS Code uses `.servers[$NAME] = $JSON+{"type":"stdio"}`; Continue appends to a YAML array; Goose writes `.extensions[...]`) [S8].
- Paths (all with per-OS entries): Claude Desktop mac `$HOME/Library/Application Support/Claude/claude_desktop_config.json`, win `$APPDATA\Claude\claude_desktop_config.json`, linux `$HOME/.config/claude/claude_desktop_config.json`; Claude Code `$CLAUDE_CONFIG_DIR/.claude.json` or `$HOME/.claude.json`; Cursor `$HOME/.cursor/mcp.json`; VS Code `.../Code/User/mcp.json`; LM Studio `~/.lmstudio/mcp.json` (also `~/.cache/lm-studio/mcp.json`); Gemini `~/.gemini/settings.json`; Goose `~/.config/goose/config.yaml` (win `%APPDATA%\Block\goose\config\config.yaml`) [S8].
- Write: `updateConfig()` ends in `os.WriteFile(file, data, 0o644)` (no tmp+rename, no backup seen) [S8].
- Codex: reads/writes `~/.codex/config.toml` with go-toml and sets `[mcp_servers.<DOCKER_MCP key>]`, `command = "docker"` (`docker.exe` on Windows), `args = ["mcp","gateway","run"(,"--profile",NAME)]` [S8].

### Entry written (no auth in client config; no token)
```json
"command": "docker", "args": ["mcp","gateway","run","--profile","my_profile"], "type": "stdio"
```
[S10]. The client config carries **no secret**; server credentials live inside Docker (OAuth done in the Toolkit's OAuth tab; "no API tokens" for those services) [S10]. This is the "stable launcher binary, secrets stay in the app" pattern: config is token-free, so key rotation never touches client files.

### Disconnect
`disconnect.go` and `DisconnectCodex` exist in source [S8]. The user doc page does not document disconnect for clients (only OAuth **Revoke**) [S10].

---

## 3. Figma desktop app (local MCP server)

Sources: developers.figma.com local-server-installation and help.figma.com articles, seen 2026-11-26, pages undated [S11, S21].

- Enable: Figma desktop (latest) -> Design file -> nothing selected -> Dev Mode (Shift+D) -> right sidebar **MCP server** -> **Enable desktop MCP server**. Runs at `http://127.0.0.1:3845/mcp`; a confirmation toast appears [S11].
- **Auth: none documented.** Page says explicitly nothing about auth/token; only URL [S11]. (Remote server `https://mcp.figma.com/mcp` uses OAuth and is now "recommended"; desktop server is labelled for "specific org and enterprise needs"/"not recommended" in the Codex article [S11, S21, S22].)
- Requires Dev or Full seat on a paid plan. Desktop server cannot write to canvas [S11].
- Client setup is **manual, no deeplinks and no auto-config** on the page [S11]:
  - Claude Code: `claude mcp add --transport http figma-desktop http://127.0.0.1:3845/mcp` (manage: `claude mcp list|get|remove figma-desktop`).
  - Codex app: Settings > MCP servers > Add server > Streamable HTTP, name `figma-desktop`, URL above.
  - Cursor: Settings > Tools & MCP > Add Custom MCP with JSON; VS Code: "MCP: Add Server" > HTTP.
  - Generic:
```json
{ "mcpServers": { "figma-desktop": { "url": "http://127.0.0.1:3845/mcp" } } }
```
- **Codex remote**: Codex app has a Plugins directory; Figma is installed with **Plugins -> + next to Figma -> Install Figma -> Allow access** (OAuth) [S22]. CLI: `codex mcp add figma --url https://mcp.figma.com/mcp` then OAuth sign-in [S22]. This is the "marketplace" precedent for Codex app (relevant to the marketplace sub-question).
- Takeaway: Figma proves a no-auth loopback MCP is accepted, but it is the *worst* UX (every client manual). Anytype must not copy that; also Anytype holds personal notes, so auth is warranted.

---

## 4. Obsidian MCP Connector (community plugin `istefox/obsidian-mcp-connector`)

Seen 2026-11-26. Repo pushed 2026-11-23; latest release **3.3.0 (2026-10-29)**; plugin id `mcp-tools-istefox`; 141 stars [S1]. Community plugin, not Obsidian-official. (Obsidian's own official MCP/CLI position: **unconfirmed**, not researched.)

### Architecture
- MCP server runs **inside the plugin (Obsidian's Electron renderer)**, loopback only, no binary downloaded; a shared broker on `127.0.0.1:27200/v1/<route-id>/mcp` forwards to per-vault ports 27201-27212 so client configs survive port changes [S1].
- Streamable HTTP, **POST only**; stateless (no `Mcp-Session-Id`); serves MCP revision `2026-07-28` and older eras side by side [S1].

### Auth: per-client bearer tokens
- Up to 10 tokens per vault, one per client, each with its own tool profile (All / Adaptive / Core + allowlist). Row controls: show/copy secret, copy client config, export `.mcpb`, replace secret, revoke. Revoke => that client's configs/bundles stop working; others untouched [S1].
- Header: `Authorization: Bearer <token>`.

### Per-client connection methods (all from a token row) [S1]
| Client | Method |
|---|---|
| Claude Desktop | **`.mcpb` export** (drag onto Claude Desktop, Settings > Extensions). Bundle embeds token **id** (not secret) and resolves secret+live port from the vault at connect time; revoking fails the bundle closed. Alternatively opt-in **"Keep `claude_desktop_config.json` in sync with this token"**: one token owns the file, `.backup` written before each rewrite, revoking the owner removes the entry. Legacy: `npx mcp-remote ... --header "Authorization: Bearer ..."` (Node required). |
| Claude Code | **Copy** `claude mcp add --transport http --scope user <name> <url> --header "Authorization: Bearer TOKEN"`; plugin deliberately does not write `~/.claude.json`. Token-free `.mcp.json` variant with `"headers": {"Authorization": "Bearer ${OBSIDIAN_MCP_TOKEN}"}`. |
| Codex | Menu: copy `config.toml` snippet / copy `codex mcp add '<name>' --url '<url>' --bearer-token-env-var OBSIDIAN_MCP_TOKEN` / **Install into user Codex config** / **Install into project** (see below). |
| Cursor/Continue/VS Code | Copy generic `"type": "streamable-http"` JSON (user pastes). |
| Cline | Copy with `"type": "streamableHttp"` (other spellings make Cline fall back to SSE). |
| Windows | Python stdlib bridge `obsidian_mcp_bridge.py` (because `mcp-remote` hangs 60 s on Windows). |

### Codex installer (ADR-0028, 2026-10-07) - the best write-safety precedent [S2]
- Always **preview -> confirm modal -> install**; nothing happens at startup/reconnect/token change. Preview shows: target file, whether the Codex home came from `CODEX_HOME` or default, add/replace/migrate, entry name, URL, whether token is literal or env-var.
- Steps: copy existing file to `config.toml.backup-<time>-<id>`; short-lived lock `config.toml.obsidian-mcp.lock`; **atomic write**; preserves CRLF and BOM; **read-back verification**; refuses symlinks / non-regular files / layouts it can't edit safely (inline, dotted, array tables) and asks the user to copy the snippet instead; refuses if file changed after preview.
- Ownership: entry named `obsidian_<vault>`; before replacing, reads the route id in the URL; refuses to overwrite another vault's entry or an unattributable one (stdio entry etc.). Replacement keeps user policy keys (tool approvals, timeouts, `tools`, `oauth` tables).
- Codex home resolution mirrors Codex: `CODEX_HOME` if absolute+existing, else `~/.codex`; on Windows `%USERPROFILE%\.codex`; never probes WSL (WSL needs mirrored networking or `CODEX_HOME=/mnt/c/Users/<user>/.codex`).
- Token: default literal in `http_headers`; optional "keep token out of config.toml" -> `bearer_token_env_var = "OBSIDIAN_MCP_TOKEN"`; off by default because a GUI-launched Codex may not inherit shell env. Project installs always use the env var.
- Startup timeout: sets `startup_timeout_sec = 30` (Codex default 10).
- Codex does not refetch tools after `tools/list_changed` => plugin offers to switch the token profile to "All tools" on Codex install.
- Cites Codex source: `codex mcp add [OPTIONS] <NAME> (--url <URL> | -- <COMMAND>...)` with `--bearer-token-env-var`; no header flag; no scope flag [S2]. **Re-verified locally**: `codex mcp add --help` (codex-cli 0.172.0) shows `--url`, `--bearer-token-env-var`, `--env` (stdio only) and no header flag.

### Disconnect
Revoke token (breaks all configs for that client); Claude Desktop sync removes its entry on revoke; no generic uninstall for copied configs [S1].

---

## 5. Other installers

### Raycast MCP (NEW, v2.13, 2026-11-18; v2.14 2026-11-25) [S17, S19, S23]
- Raycast became a **local MCP server**: `http://127.0.0.1:8267/mcp` (listens on loopback only) [S17].
- Enable: Settings -> MCP -> Raycast MCP Server (off by default per device) [S17, S19].
- **One-click setup** for Claude Code, Codex, Cursor, and (added together in v2.13 per the Windows changelog) Claude Desktop, VS Code, Gemini CLI, GitHub Copilot; fx added in v2.14 [S19]. UI is a "Connect App" menu: Claude Code, Claude Desktop, Codex, Cursor, Gemini CLI, GitHub Copilot, VS Code, or "Other App..." -> Copy Configuration [S17].
- **Per-app tokens**: "The configuration includes a token unique to that app"; each connected app has its own token, revocable separately under **Connected Apps** [S17].
- Raycast does not confirm tool calls itself; relies on each client's approval prompts [S17]. User picks which extensions to share.
- **Exactly how Raycast writes configs (file edit vs CLI vs deeplink vs MCPB) is unconfirmed**; the public docs/changelog don't say. Worth black-box testing on a Mac with Raycast >= 2.13 (read-only observation of which files change) if we want the detail.
- Raycast as an MCP *client* has its own deeplink to install servers: `raycast://mcp/install?<percent-encoded JSON>` (secondhand via search summary of manual.raycast.com; the page I fetched did not show it; **unconfirmed**) [S17, S24].

### Unity (two products)
- **Official Unity AI Assistant "Unity MCP"** (package com.unity.ai.assistant 2.6): Integrations -> select client -> **Configure**; clients named: Claude Code, Cursor (documented), Windsurf, Claude Desktop (no specifics) [S16]. Config written for Claude Code/Cursor: server `unity-mcp`, `command` = relay binary, `args` = `["--mcp"]`. The relay is a **bundled native binary** at `~/.unity/relay/relay_mac_arm64.app/Contents/MacOS/relay_mac_arm64` (mac arm64), `relay_mac_x64...` (Intel), `%USERPROFILE%\.unity\relay\relay_win.exe`, `~/.unity/relay/relay_linux`; docs warn clients may not expand `~` [S16]. **Auth = approval UI**: first connection shows "Pending Connection" in Project Settings > AI > Unity MCP, user Accepts/Denies; approved clients reconnect automatically [S16]. Config write method (merge/backup): not documented (**unconfirmed**).
- **Coplay `unity-mcp` (community)**: one `IMcpClientConfigurator` per client (Cursor, VS Code Copilot, Windsurf, Kiro, Trae, Antigravity, Codex TOML, Claude Code CLI-based, Claude Desktop stdio-only JSON, OpenClaw plugin). Status check = parse and compare config -> "Configured / Not Configured". HTTP writes `url` (or `serverUrl` for Windsurf/Antigravity); stdio writes `uvx` command (needs uv). Claude Code via `claude mcp list` / `claude mcp add|remove` [S14]. Merge/backup/atomic: **not specified**. A GitHub issue reports the generated Claude Desktop config didn't work on Windows 11 [S14 search result; **unconfirmed** details].

### Joplin (built-in, official) [S12]
- Off by default; rides on the Web Clipper service. Endpoint `http://127.0.0.1:PORT/mcp?token=TOKEN` (same port as Web Clipper, loopback only). User must enable Web Clipper, copy port+token, tick **AI -> Enable MCP server**, and enable tools individually (all ten off by default).
- Claude Desktop: manual JSON using `npx -y mcp-remote http://127.0.0.1:PORT/mcp?token=TOKEN`. **No one-click features.** Token in the URL (leaks to logs/process list). Anti-pattern for Anytype; good point: write tools default off.

### Zotero [S13, S15]
- Community "zotero-mcp" (54yyyu): `zotero-mcp setup` auto-configures Claude Desktop (PyPI listing) [S15]; what it writes is **unconfirmed**. "MCP for Zotero" (hosted proxy, forum thread, updates Mar 5 and May 25 2026): user pastes a Zotero API key, receives an endpoint+token, configures `npx mcp-remote@latest .../mcp/sse` with Bearer header; Windows path-with-spaces bug (`C:\Program`) [S13]. A separate local option `zotero-native-mcp` uses Zotero's local API on `127.0.0.1:23119`, no API key [S13].

### Blender MCP, Postman
- Blender: not researched deeply (**unconfirmed**; typical community pattern is an add-on socket server plus `uvx blender-mcp` stdio entry).
- Postman: ships a local MCP server as **`.mcpb` bundles per toolset** (Minimal/Code/Full/Learn) for Claude Desktop, and manual `npx` config with API key env var otherwise; remote server `mcp.postman.com` with OAuth. No in-app one-click connect found [S18].

---

## 6. Install-deeplink formats seen in precedents (for the "fire X's install deeplink" idea)

| Client | Format | Source |
|---|---|---|
| Cursor | `cursor://anysphere.cursor-deeplink/mcp/install?name=<NAME>&config=<BASE64(JSON of the entry, without name key)>`; Cursor prompts the user to install; doc has no URL-server+headers example, standard base64 with `=` | [S25] official doc seen 2026-11-26 |
| LM Studio | `lmstudio://add_mcp?name=<NAME>&config=<BASE64(JSON)>` with `=` URL-encoded `%3D`; doc's own example is `{"url":"https://huggingface.co/mcp","headers":{"Authorization":"Bearer ..."}}` so URL + Authorization header is officially supported. Whether LM Studio shows a confirmation is not documented (**unconfirmed**) | [S26] official doc seen 2026-11-26 |
| VS Code | `vscode:mcp/install?<URL-encoded JSON {name,type,url,...}>` and CLI `code --add-mcp '<json>'`: **unconfirmed** (official page fetched did not contain it; only a third-party search summary) | [S27] |
| Raycast | `raycast://mcp/install?...` **unconfirmed** | [S17] |
| Claude Desktop | MCPB drag-drop/double-click into Settings > Extensions seen in Obsidian docs [S1] and Postman [S18]; official Anthropic doc **unconfirmed** by me | - |

Caveat: a deeplink puts the **token inside a URL** that may be logged by the OS URL handler; but the user confirmation dialog in Cursor/LM Studio makes it acceptable for a one-time loopback key. Prefer an env-var or a bundled launcher where the client allows it.

---

## 7. Cross-precedent matrix

| App | Clients | Trigger | Write method | Auth | Bundled binary / no Node | Disconnect |
|---|---|---|---|---|---|---|
| JetBrains | Claude Desktop, Claude Code, Cursor, VS Code, Windsurf, Junie, Codex, Air, Copilot | Auto-Configure per detected client | JSON merge + tmp/atomic move (no backup); TOML rewrite | one global token header; env placeholder in project files | Yes (IDE launcher `stdioMcpServer`) | unconfirmed |
| Docker | 14+ clients incl. Codex | Connect button / CLI | yq per-client; plain WriteFile | none in client config (secrets stay in Docker) | Yes (`docker mcp gateway run`) | CLI disconnect exists |
| Figma desktop | any | manual only | none | none | n/a (HTTP) | `claude mcp remove` |
| Obsidian plugin | Claude Desktop (MCPB, sync), Claude Code, Codex, Cursor, VS Code, Cline | per-token row buttons | Codex: preview+backup+lock+atomic+readback; Desktop sync: `.backup` | per-client token, revocable | No for Codex/CC (HTTP); `.mcpb` for Desktop (pure-Node shim) | revoke token |
| Raycast MCP | Claude Code, Claude Desktop, Codex, Cursor, Gemini CLI, Copilot, VS Code, fx | one-click per app | unconfirmed | per-app token, revocable | unconfirmed | Connected Apps -> revoke |
| Unity official | Claude Code, Cursor, (+Desktop, Windsurf) | Configure | unconfirmed | approval UI (no token) | Yes (relay binary) | unconfirmed |
| Joplin | any | manual | none | token in URL query | No (needs npx mcp-remote for Desktop) | untick setting |

---

## 8. Recommendation for Anytype

**Core idea: "Connect to X" button per detected client in the Anytype desktop app, which (1) mints a dedicated, named, revocable API key via the internal RPC (spaces + read/read-write + optional expiry chosen in a small sheet), (2) installs the client entry through the safest channel that client offers, (3) verifies it, and (4) lists every connection under "Connected apps" with Revoke.** This is Raycast v2.13's UX combined with Obsidian's write safety and JetBrains/Docker's "bundled launcher, no Node".

### 8.1 Per-client channel (ranked by safety)
1. **Claude Code**: run the CLI from Electron main: `claude mcp add --transport http --scope user anytype http://127.0.0.1:<port>/mcp/large --header "Authorization: Bearer <key>"`. `claude mcp add --help` (2.1.332, local) confirms `-H/--header`, `-s user`. Remove with `claude mcp remove anytype -s user`. Never hand-edit `~/.claude.json` (Obsidian and Coplay both avoid it; JetBrains does edit it, which is the riskier route). If the `claude` binary isn't on Electron's PATH (GUI apps often lack shell PATH), look in `~/.local/bin/claude`, `~/.claude/local`, etc. (**unconfirmed** exact install locations; resolve via login shell `zsh -lc 'command -v claude'` on mac/Linux).
2. **Codex CLI and Codex app**: they share `~/.codex/config.toml` (or `CODEX_HOME`) [S2, S6]. Either run `codex mcp add anytype --url <url> --bearer-token-env-var ANYTYPE_MCP_KEY` (but that needs an env var that GUI-launched Codex app may not see) or, for a literal token, do the Obsidian-style **preview -> backup -> lock -> atomic write -> read-back** TOML install writing `url` plus `http_headers = { Authorization = "Bearer <key>" }` and `startup_timeout_sec = 30` [S2]. Detect via `~/.codex` exists [S8]. Treat "Codex app" vs "Codex CLI" as separate rows for detection (app bundle vs `codex` on PATH) even though they share config (**unconfirmed**: that the Codex desktop app always reads the same `config.toml` — Obsidian ADR says native Windows Codex and the Codex app use `%USERPROFILE%\.codex` [S2]). Codex app also has a Plugins directory (marketplace route) [S22].
3. **Cursor**: either deeplink `cursor://anysphere.cursor-deeplink/mcp/install?name=anytype&config=<base64 {"url":"http://127.0.0.1:31009/mcp/large","headers":{"Authorization":"Bearer <key>"}}>` (user gets Cursor's own confirmation prompt) [S25], or merge into `~/.cursor/mcp.json` [S4, S8]. Deeplink is the lower-risk option; file merge is the fallback. Cursor prompt content is undocumented.
4. **LM Studio**: deeplink `lmstudio://add_mcp?name=anytype&config=<base64 JSON with url+headers>` is officially documented with exactly our shape (url + Authorization header) [S26]; fallback `~/.lmstudio/mcp.json` merge [S8].
5. **VS Code**: merge `mcp.json` in the User dir (mac `~/Library/Application Support/Code/User/mcp.json`, Win `%APPDATA%\Code\User\mcp.json`, Linux `~/.config/Code/User/mcp.json`) under key `servers` with `"type":"http"` [S4, S8]; deeplink `vscode:mcp/install` is unconfirmed [S27]. VS Code has an `inputs` mechanism for secrets (**unconfirmed**; page fetched lacked it).
6. **Claude Desktop** (hard case: local config is stdio-only; a `url` entry may wipe `mcpServers` [S20]; Custom Connectors need a remote HTTPS URL with OAuth and cannot see localhost per guides [S20], and Anytype has no OAuth): two viable routes, both avoiding Node:
   - **(a) MCPB generated by Anytype** (Obsidian precedent) [S1]: a tiny bundle containing a launcher for the Anytype stdio->HTTP proxy, with a token *id* resolved at runtime. Anytype writes the `.mcpb` to a temp folder and opens it with Claude Desktop (opening behaviour for `.mcpb` via OS file association is **unconfirmed**), or reveals it with "Drag this onto Claude Desktop".
   - **(b) Merge a stdio entry into `claude_desktop_config.json`** pointing at a **bundled helper binary** (JetBrains/Docker/Unity pattern [S9, S8, S16]), e.g. `{"command": "<AnytypeResources>/anytype-mcp-proxy", "args": ["--tier","large"], "env": {"ANYTYPE_API_KEY": "<key>", "ANYTYPE_MCP_URL": "http://127.0.0.1:31009/mcp/large"}}`. Needs Claude Desktop restart (Cmd+Q on mac). Use merge-with-backup + atomic write (JetBrains' algorithm plus Obsidian's `.backup`). Parse failure must abort, **not** start from `{}` as JetBrains does [S5].
   - Don't rely on `@anyproto/anytype-mcp` npx for this path (needs Node); ship the proxy as a compiled binary (the existing heart binary could expose a `mcp-stdio` subcommand; **design suggestion, not verified**).
7. **Gemini CLI / Windsurf / Cline / Goose / Zed / OpenCode / Kiro etc.**: JSON merge via a declarative table copied from Docker's `config.yml` (paths and yq-like set/del per client) [S8]. Long tail: "Copy config" fallback with the exact per-OS file path (JetBrains and Raycast both keep "Copy config" / "Other app") [S3, S17].

### 8.2 Auth model
- **One key per connected app** (Raycast, Obsidian) with human name ("Claude Code on <host>"), chosen spaces, scope, optional expiry; shown in a "Connected apps" list with Revoke [S17, S1]. No 4-digit pairing code needed since the desktop app mints keys directly.
- Where the client supports env references (Codex `bearer_token_env_var`, Claude Code `.mcp.json` `${VAR}`), offer token-free project files [S1, S2, S6]; but default to literal in user-level config because GUI-launched clients often don't inherit shell env [S2].
- Stronger than Figma's no-auth [S11]; weaker-but-simpler than a Unity-style approval prompt [S16]. A hybrid is possible: Anytype could also show an "AI app X requested access" prompt, but this only works if the middleware supports an unauthenticated pairing handshake (it does not today).
- Never put the key in a URL query (Joplin anti-pattern) [S12].

### 8.3 Write-safety checklist (adopt as the contract)
Detect -> **preview** (file, entry, "key will be written") -> backup (`<file>.backup-<ts>`) -> lock -> parse (abort on parse failure; never replace corrupt file) -> **merge only own entry** (key `anytype`, refuse if existing `anytype` entry points elsewhere) -> tmp file + atomic rename (fallback to in-place on Windows `AccessDenied`, as JetBrains does [S5]) -> read-back verify -> "Restart X" hint. Preserve user policy keys on replace (Codex tool approvals) [S2]. Refuse symlinks/odd layouts and fall back to copy-snippet [S2]. Keep entry key stable so reinstall = replace, and expose **"needs update"** when port/token differ (JetBrains `isConfigUpToDate`) [S5].

### 8.4 Port / stability
Port is user-configurable (31009, anytype-cli 31012). Put the live port into entries; on port change show "needs update" and offer one-click rewrite. Obsidian solved this with a stable broker URL [S1]; for Anytype the simpler answer is a stable proxy helper (Claude Desktop path) that reads the current port from a small file at runtime (design idea, unverified). Raycast uses a fixed port 8267 [S17]; a fixed default plus a rewrite-on-change is enough.

### 8.5 Origin check
Anytype refuses browser origins. All precedents (Cursor, Codex, Claude Code, LM Studio, VS Code, bundled stdio proxies) are native processes without `Origin`, so no conflict; only web-based clients (ChatGPT web, claude.ai custom connectors) would be affected and cannot reach loopback anyway [S20].

### 8.6 Disconnect/uninstall
- Revoke key in Anytype => client entry stops working (Obsidian/Raycast model) [S1, S17].
- "Remove from X" button: CLI (`claude mcp remove`, `codex mcp remove`) or delete only our key from the file with the same merge+backup routine; Docker has this action in code [S8].
- Show connection state per client by parsing config and comparing to the current key/port (Coplay `CheckStatus`, JetBrains `isConfigured`) [S14, S5].

### 8.7 What to avoid
- Editing `~/.claude.json` by hand (Claude CLI owns it) [S1]; `url` entries in `claude_desktop_config.json` [S20]; token in URL [S12]; starting from `{}` on parse failure [S5]; relying on `npx`/`uvx`/`mcp-remote` for the default path [S12, S14].

---

## Open items to verify next (not confirmed)
- Raycast v2.13 actual write mechanism per client (black-box test).
- Whether Claude Desktop opens `.mcpb` on double-click and its current official install docs; whether Claude Desktop config now accepts `url` entries (the March-2026 wipe report may be fixed).
- `vscode:mcp/install` and `code --add-mcp` exact syntax; VS Code user mcp.json location in the new "Copilot Global" model.
- Whether Codex app and Codex CLI always share `~/.codex/config.toml`, and how Codex GUI resolves PATH/env.
- JetBrains "remove/disconnect" action.
- Blender MCP installer pattern.

---

## Sources (all seen 2026-11-26 unless noted)
- S1 https://github.com/istefox/obsidian-mcp-connector (README via `gh api`; repo pushed 2026-11-23; release 3.3.0 published 2026-10-29)
- S2 https://github.com/istefox/obsidian-mcp-connector/blob/main/docs/architecture/ADR-0028-codex-installer-and-project-scope.md (ADR dated 2026-10-07)
- S3 https://www.jetbrains.com/help/idea/mcp-server.html (IntelliJ IDEA 2026.3 Help, dated 2026-05-13)
- S4 https://github.com/JetBrains/intellij-community/tree/master/plugins/mcp-server/src/com/intellij/mcpserver (`clients/McpClientInfo.kt`, `clients/impl/*.kt`, `impl/McpClientDetector.kt`; master as of 2026-11-26)
- S5 .../mcpserver/clients/McpClient.kt (same tree)
- S6 .../mcpserver/clients/impl/CodexClient.kt (same tree)
- S7 .../mcpserver/clients/impl/CursorClient.kt (same tree)
- S8 https://github.com/docker/mcp-gateway (`pkg/client/config.yml`, `connect.go`, `codex_handler.go`, `global.go`, `local.go`; master 2026-11-26; no tagged "latest" release)
- S9 .../mcpserver/stdioRunnerUtil.kt (JetBrains, same tree)
- S10 https://docs.docker.com/ai/mcp-catalog-and-toolkit/toolkit/ (undated page)
- S11 https://developers.figma.com/docs/figma-mcp-server/local-server-installation (undated)
- S12 https://joplinapp.org/help/apps/ai_mcp (undated; min Joplin version not stated)
- S13 https://forums.zotero.org/discussion/130133/ ("MCP for Zotero" thread; posts 2026-03-05 to 2026-10-11)
- S14 https://coplaydev.github.io/unity-mcp/guides/client-configurators (undated)
- S15 https://pypi.org/project/zotero-mcp-server/ and https://github.com/54yyyu/zotero-mcp (via search summary only)
- S16 https://docs.unity3d.com/Packages/com.unity.ai.assistant@2.6/manual/integration/unity-mcp-get-started.html (package version 2.6)
- S17 https://manual.raycast.com/ai/model-context-protocol (undated)
- S18 https://learning.postman.com/docs/developer/postman-api/postman-mcp-server/postman-mcp-local-server (via search summary only, not fetched)
- S19 https://www.raycast.com/changelog/windows (v2.13 2026-11-18, v2.14 2026-11-25) and https://www.raycast.com/changelog (macOS v2.13/v2.14 confirm MCP introduction; one-click lines appear on the Windows page only)
- S20 Web search summaries (secondhand; re-verify): GitHub anthropics issue about `url` entries wiping `mcpServers` (March 2026); startdebugging.net 2026/05 article on HTTP MCP URL in Claude Desktop; JetBrains YouTrack SUPPORT-A-3223 (Claude Desktop auto-configure entry named "jetbrains")
- S21 https://help.figma.com/hc/en-us/articles/32132100833559 (undated)
- S22 https://help.figma.com/hc/en-us/articles/39888629089175-Codex-and-Figma-Set-up-the-MCP-server (undated)
- S23 Raycast "Model Context Protocol" 1.98.0 changelog https://www.raycast.com/changelog/macos-v1/1-98-0.md (MCP client introduction; no deeplink on page)
- S24 Search summary pointing to Raycast manual for `raycast://mcp/install` (unverified)
- S25 https://cursor.com/docs/mcp/install-links
- S26 https://lmstudio.ai/docs/app/mcp/deeplink
- S27 https://code.visualstudio.com/docs/copilot/customization/mcp-servers (did not contain install-URL details)
- Local CLI checks: `codex --version` = codex-cli 0.172.0; `codex mcp add --help`; `claude --version` = 2.1.332; `claude mcp add --help` (2026-11-26, this machine).
