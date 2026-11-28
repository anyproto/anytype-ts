# Verified: Windsurf (Devin Desktop), JetBrains (AI Assistant, Junie), Zed
Date: 2026-11-26. Target: HTTP server "anytype" at http://127.0.0.1:31009/mcp/large, header `Authorization: Bearer <KEY>`.

## 0. TL;DR (corrected)
| App | Static bearer over HTTP | Easiest route | Reload |
|---|---|---|---|
| Zed 1.30.2 | YES (`context_servers.<n>.url` + `headers`) | JSONC-safe merge into settings.json | Zed watches settings; live reload of settings assumed (unconfirmed explicitly for new server) |
| Devin Desktop (ex-Windsurf) | YES (`headers`) | Merge `~/.config/devin/mcp_config.json` (or `devin mcp add -s user -H ...`) | Refresh button in Customize > MCPs (docs); file-watch unconfirmed |
| JetBrains AI Assistant | Official docs show NO `headers` (unconfirmed, third parties say it works) | Clipboard JSON + 5-step guide; no file, no deeplink | Click Apply |
| Junie CLI / plugin | YES (`url` + `headers`) | Merge `~/.junie/mcp/mcp.json` | `/mcp` Reconnect; live-reload unstated |

## 1. Surfaces
- Zed: v1.30.2 stable (2026-11-25). Surfaces: Zed Agent, ACP external agents, terminal CLIs.
- Windsurf was renamed Devin Desktop (2026-06-02) per several secondary sources only (no primary Cognition post found); primary evidence: docs.windsurf.com redirects to docs.devin.ai. Windsurf plugins (JetBrains/VS Code) keep their name. Cascade replaced by "Devin Local".
- JetBrains: AI Assistant (Settings | Tools | AI Assistant | Model Context Protocol), Junie CLI, Junie plugin, Air (shares `~/.jetbrains/mcp/mcp.json`).

## 2. MCP capabilities
| | Streamable HTTP | static headers | env in headers | OAuth | loopback http |
|---|---|---|---|---|---|
| Zed | yes (`url`) | YES documented | not documented (literal) | yes, only when no Authorization header | unconfirmed explicitly (client local; no HTTPS requirement documented) |
| Devin Desktop/CLI | yes (+SSE; CLI tries HTTP then falls back to SSE on some 4xx) | yes `headers` ("custom HTTP headers"; Authorization example only illustrative) | `${env:VAR}` incl. `headers` ONLY on the Cortex-managed file (windsurf-plugins page); CLI page documents it only for OAuth fields | yes | unconfirmed explicitly |
| JetBrains AI Assistant | yes | NOT in official page (UNCONFIRMED) | none | not mentioned (YouTrack LLM-24541 per researcher, unchecked) | IDE local; unconfirmed |
| Junie | yes | YES `headers` e.g. "Authorization": "Bearer token" | not documented | yes via /mcp > Authorize | unconfirmed explicitly |

Key naming: Devin Desktop examples use `serverUrl` (`url` also accepted per same page, though page is unclear); Devin CLI uses `url` and optional `transport` ("http" default | "sse"). Junie: omit `type`. Zed: `context_servers`, NOT `mcpServers`.

## 3. Ways to add
### 3.1 Zed
- File: macOS/Linux `~/.config/zed/settings.json` (Linux or `$XDG_CONFIG_HOME/zed/settings.json`); Windows `%APPDATA%\Zed\settings.json` (docs configuring-zed.md). JSONC.
```json
{ "context_servers": { "anytype": { "url": "http://127.0.0.1:31009/mcp/large", "headers": { "Authorization": "Bearer KEY" } } } }
```
- UI: Settings > AI > MCP Servers > Add Server > Add Remote Server (writes same entry).
- Deeplinks (open_listener.rs, main): zed://file, ssh, extension/<id>, agent, settings[/path], schemas/, git/clone|commit/, and `zed://skill?data=<base64url SKILL.md>` (handled via SKILL_SHARE_LINK_PREFIX). NO MCP/context-server deeplink. zed:// also accepts `zed://` / `zed://open`.
- Extensions only for command-based servers; migration to MCP registry open (zed issue #59351, state open). Not usable for a localhost server.
- Skills: `~/.agents/skills/<name>/SKILL.md` global, flat layout only; `zed://skill?data=` opens a prefilled create page (user saves).
- Tool permissions: `agent.tool_permissions.default` confirm|allow|deny; key `mcp:<server>:<tool>`.
- Reload: docs only say tool list reloads on `notifications/tools/list_changed`; nothing on config edits.

### 3.2 Devin Desktop / CLI
- CLI (verified syntax): `devin mcp add <name> [options] [<URL>] [-- cmd]`; flags `-t/--transport stdio|sse|http`, `-s/--scope local|project|user` (default local), `--url`, `-e/--env`, `-H/--header "K: V"` (repeatable), `--scopes`, `--oauth-resource`. Docs define -H but the example is marked "illustrative".
```bash
devin mcp add -s user -t http -H "Authorization: Bearer KEY" anytype http://127.0.0.1:31009/mcp/large
```
  Note: researcher's example is valid; note default scope is `local` so `-s user` is needed. Also `devin mcp list|remove|login`.
- Files: user `~/.config/devin/mcp_config.json` (Windows `%APPDATA%\devin\mcp_config.json`; Cortex/desktop page also honors `$XDG_CONFIG_HOME`), project `.devin/mcp_config.json`, local `.devin/mcp_config.local.json`. Pre-v3000.3 `config.json` migrated on startup (the "mintlify mirror" discrepancy is explained: `.devin/config.json` is the legacy name).
```json
{ "mcpServers": { "anytype": { "url": "http://127.0.0.1:31009/mcp/large", "transport": "http", "headers": { "Authorization": "Bearer KEY" } } } }
```
- Desktop UI: Agents window > Customize > MCPs > "Install MCPs for: This computer"; list has toggle, open config file, refresh. Available = registry entries with Install. (Researcher's "Settings > Tools > Windsurf Settings > Add Server" is the plugin path, not Devin Desktop.)
- Legacy `~/.codeium/windsurf/mcp_config.json` (and windsurf-next) is a separate discovery file, used only with `chat.mcp.discovery.enabled` + windsurf source; does not change Cortex file. Prefer the devin path.
- No deeplink documented. Admin allowlist (Teams/Enterprise): once any server allowlisted, others blocked.

### 3.3 JetBrains AI Assistant
- UI only: Settings | Tools | AI Assistant | Model Context Protocol (MCP) > Add > paste JSON > OK > Apply (or enable "Automatically enable new and changed MCP servers"); also chat `/` > Add Command. Server level global/project. "Import from Claude" imports Claude Desktop servers. No config file path, no deeplink documented.
- Official JSON example: `{"mcpServers":{"name":{"url":"https://example.com/mcp"}}}`; headers not mentioned (third-party claims only).
- Junie sees custom servers only if "Pass custom MCP servers" enabled (researcher claim, not re-verified in this pass).

### 3.4 Junie
- Files: user `~/.junie/mcp/mcp.json`, project `.junie/mcp/mcp.json`; Air shares `~/.jetbrains/mcp/mcp.json`. Windows path not specified in docs (use `%USERPROFILE%\.junie\mcp\mcp.json`, unconfirmed).
- Keys: `mcpServers.<n>.url`, `headers`, `timeout` (ms 1000-3600000, default 60s). No `junie mcp add`; use `/mcp` (Ctrl+A for registry). Startup flags `--mcp-default-locations`, `--mcp-location <path>`.
- Precedent: IDE built-in MCP Server "Auto-Configure" (per researcher; not re-fetched).

## 4. Safe writes
Zed JSONC (use jsonc-parser modify); Devin/Junie plain JSON merge, preserving other servers; don't touch JetBrains IDE XML. Token is plaintext on disk; mint least-privilege, selected spaces, expiry. Junie project files may be committed: only write user scope.

## 5. Detection
Zed: `/Applications/Zed.app` (bundle `dev.zed.Zed`, scheme `zed`), `~/.config/zed/`. Devin: `devin` on PATH, `~/.config/devin/`, app bundle name unconfirmed. JetBrains: `~/Library/Application Support/JetBrains/`, `%APPDATA%\JetBrains`, `~/.config/JetBrains`; Junie `~/.junie/`, `junie` on PATH.

## 6. Marketplaces
Zed extensions (stdio only; registry migration pending). Devin Desktop "Available" lists registry entries (official MCP registry schema; admins configure). JetBrains: none first-party. Localhost-only remote server cannot be listed anywhere here; the only path is the stdio npm `io.github.anyproto/anytype-mcp` registry entry.

## Verification log
- Zed remote `url`+`headers` format: CONFIRMED (https://raw.githubusercontent.com/zed-industries/zed/main/docs/src/ai/mcp.md)
- Zed OAuth prompted when no Authorization header: CONFIRMED (same)
- Zed settings paths per OS: CONFIRMED (docs/src/configuring-zed.md, lines 33-35)
- Zed no MCP deeplink: CONFIRMED (crates/zed/src/zed/open_listener.rs); `zed://skill`: CONFIRMED (SKILL_SHARE_LINK_PREFIX, skills.md)
- Zed extensions deprecation issue #59351: CONFIRMED open (gh api)
- Zed v1.30.2 on 2026-11-25: CONFIRMED (gh releases/latest)
- Zed live reload on config edit / loopback http: UNCONFIRMED
- Zed env vars in headers: UNCONFIRMED (not documented)
- Devin CLI `mcp add` flags incl. -H, -s, -t: CONFIRMED (https://docs.devin.ai/cli/reference/commands); default scope `local`: CONFIRMED (researcher omitted)
- Devin user config path / schema keys url, transport, headers: CONFIRMED (https://docs.devin.ai/cli/extensibility/mcp/configuration)
- `${env:}` in headers: CORRECTED (Windsurf/Cortex page: allowed in headers; CLI page: documented only for OAuth fields) (https://docs.devin.ai/windsurf/plugins/cascade/mcp)
- Devin Desktop in-app route: CORRECTED ("Settings>Tools>Windsurf Settings>Add Server" is the plugin path -> Agents window > Customize > MCPs) (https://docs.devin.ai/desktop/cascade/mcp)
- Windsurf legacy discovery file semantics: CONFIRMED, separate from Cortex file
- Rename Windsurf -> Devin Desktop 2026-06-02: UNCONFIRMED on primary; multiple secondary sources agree (devaireviews.com/blog/windsurf-devin-desktop)
- Devin deeplink / config reload: UNCONFIRMED (none documented)
- JetBrains AI Assistant UI path, JSON `url`, Import from Claude, global/project level: CONFIRMED (https://www.jetbrains.com/help/ai-assistant/mcp.html)
- JetBrains `headers` support: UNCONFIRMED (not in official page); no config file/deeplink: CONFIRMED absence
- Junie paths and `headers` Bearer: CONFIRMED (https://junie.jetbrains.com/docs/junie-cli-mcp-configuration.html); Windows path, live reload: UNCONFIRMED; Junie OAuth via /mcp Authorize: CONFIRMED
- Missed items: none new found; no newer one-click route for any of the four.

## Recommendation for Anytype
- Primary (Zed): Anytype mints key, JSONC-merges `context_servers.anytype` into the settings file, optional `zed://skill` link for the Anytype skill. User sees "Connected to Zed", then checks green dot under Settings > AI > MCP Servers.
- Primary (Devin Desktop/CLI): if `devin` is on PATH run `devin mcp add -s user -t http -H ...`; else merge `~/.config/devin/mcp_config.json`. Tell user to press refresh in Customize > MCPs. Label "Devin Desktop (formerly Windsurf)".
- Primary (Junie): merge `~/.junie/mcp/mcp.json`; tell user to `/mcp` > Reconnect if running.
- JetBrains AI Assistant: no automation; copy-JSON button plus 5-step guided card; recommend Junie as the automatable route; verify `headers` acceptance in a real IDE before shipping.
- Fallback for all: "Copy config" and "Open settings file".
- Gotchas: wrong key (`context_servers` vs `mcpServers`), Zed disables OAuth when an Authorization header exists (fine), Teams allowlists may block Devin, token plaintext on disk, do not write project-scoped Junie files, port 31009 is configurable (use the live port), Zed MCP extension route not viable.
