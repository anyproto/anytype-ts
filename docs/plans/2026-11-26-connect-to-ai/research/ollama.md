# Ollama (desktop app, CLI, `ollama launch`) and Open WebUI — research for Anytype MCP connection

Researched 2026-11-26. Local machine has Ollama.app 0.40.14 (bundle id `com.electron.ollama`) and CLI `/usr/local/bin/ollama` 0.40.14; latest GitHub release seen: v0.40.18 (2026-11-24), v0.40.19-rc0 (2026-11-26). Open WebUI latest: v0.13.5 (2026-11-25).

## TL;DR

- Ollama is a model runner, NOT an MCP client. Neither the Ollama desktop app, the `ollama` CLI, nor `ollama launch` has MCP server configuration. GitHub issue ollama/ollama#7865 "Model Context Protocol (MCP) support" is still OPEN (60 comments, last updated 2026-08-08).
- `ollama launch` just launches OTHER agent apps pointed at Ollama models. So "I use Ollama" must route to the agent app they launch (Claude Code, Codex, OpenCode, Claude Desktop, ChatGPT Desktop (Codex mode), VS Code, Cline, Copilot CLI, ...). Each of those is researched by other agents; Anytype should detect them and connect them, not Ollama.
- Open WebUI is the one Ollama-adjacent UI that has native MCP (Streamable HTTP, since v0.6.31) and static Bearer auth. But it is admin-only, configured in a web UI form, and the connection is opened by the Open WebUI BACKEND (not the browser). So 127.0.0.1 resolves to the Open WebUI container/process, not the Anytype host.

---

## 1. Ollama

### 1.1 Surfaces and platforms

| Surface | Platforms | Version seen |
|---|---|---|
| Ollama desktop app (menu-bar/tray app with chat UI and "Apps" section) | macOS, Windows, Linux | 0.40.14 installed locally; 0.40.18 latest stable release |
| `ollama` CLI (`serve, create, show, run, stop, pull, push, signin, signout, list, ps, cp, rm, launch`) | macOS, Windows, Linux | 0.40.14 |
| `ollama launch` (interactive menu or direct integration) | all CLI platforms; Claude Desktop integration macOS only ("Windows coming soon", docs) | 0.40.14 |
| Ollama VS Code extension (`ollama launch vscode`) | VS Code | unconfirmed version |
| Local API | http://localhost:11434 (Ollama-native, OpenAI-compatible `/v1`, Anthropic-compatible) | |

Output of local `ollama launch --help` (v0.40.14) — supported integrations:
`claude` (Claude Code), `chatgpt` (aliases codex-app, codex-desktop, codex-gui), `hermes`, `openclaw` (aliases clawdbot, moltbot), `opencode`, `codex`, `hermes-desktop`, `copilot` (alias copilot-cli), `omp`, `droid`, `dsh` (DeepSeek Harness), `kimi`, `muse`, `pi`, `pool`, `cline`, `qwen`, `vscode` (alias code). Source tree `cmd/launch/` additionally contains `claude_desktop.go`, so `claude-desktop` is a valid integration name (the help examples show `ollama launch claude-desktop --restore`).
Flags: `--config` (configure without launching), `--model <m>`, `--restore` (restore integration to default profile), `-y/--yes`, `-- EXTRA_ARGS` pass-through to the launched tool.

Docs integration index (https://docs.ollama.com/integrations): coding agents via `ollama launch` (Claude Code, OpenCode, DeepSeek Harness), desktop apps on macOS via the Ollama app's "Apps" sidebar (Claude Desktop; ChatGPT Desktop in Codex mode), personal assistants (OpenClaw, Hermes Agent), editor (VS Code with Ollama extension). The docs page does not mention MCP.

### 1.2 MCP support in Ollama itself

- Desktop app chat: NO MCP client / tool-server settings found. No docs page; issue #7865 still open. Third-party summaries (morphllm, vdf.ai, 2026) agree that Ollama is a model server and recommends an MCP-aware client on top. (Absence of a feature is inferred from docs + open issue; treat as "no evidence of support".)
- CLI: no `ollama mcp` command (`ollama --help` above).
- Ollama publishes a Python example MCP server for its own web search/fetch API (third-party report; unconfirmed). That is Ollama as an MCP *server*, irrelevant for Anytype.
- Transports/headers/OAuth/localhost/HTTPS: N/A for Ollama itself (no client).

### 1.3 What `ollama launch` actually does (verified from source `ollama/ollama` `cmd/launch/*.go` + docs)

- `claude` (Claude Code): spawns `claude` with env overrides (`claude.go`): `ANTHROPIC_BASE_URL=<ollama host>`, `ANTHROPIC_API_KEY=`, `ANTHROPIC_AUTH_TOKEN=ollama`, `CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST=1`, clears Bedrock/Vertex/Foundry vars, and sets `ENABLE_CLAUDEAI_MCP_SERVERS=false` (disables claude.ai-account connectors — Anthropic cloud connectors don't work in this mode; local `.mcp.json` / `claude mcp add` servers are unconfirmed but very likely unaffected because they are not "claude.ai MCP servers"). No config files written; env scoped to the launched process. Model env: `ANTHROPIC_DEFAULT_{OPUS,SONNET,HAIKU}_MODEL`.
- `codex` (Codex CLI): uses a dedicated profile `ollama-launch` (manual equivalent `~/.codex/ollama-launch.config.toml` with `model_provider = "ollama-launch"`, `model_catalog_json`, `[model_providers.ollama-launch] base_url="http://localhost:11434/v1/" wire_api="responses"`). `--restore` removes the profile and generated catalog. Requires `npm i -g @openai/codex`, 64k context.
- `chatgpt` / `codex-app`: ChatGPT Desktop in Codex mode via a profile (`codex_app*.go`); details unconfirmed.
- `claude-desktop` (macOS only): Ollama app runs a local gateway (`proxy.DefaultClaudeDesktopListenAddr`) and switches Claude Desktop into a **third-party ("3p") deployment mode**. It writes a separate profile directory (`Claude-3p`; locally present: `~/Library/Application Support/Claude-3p`) with its own `claude_desktop_config.json`, `configLibrary/_meta.json`, and `configLibrary/<profileId>.json`; the normal config is `~/Library/Application Support/Claude/claude_desktop_config.json`. Restore: disconnect in Ollama Apps, or `ollama launch claude-desktop --restore`, or quit Ollama. Source comment: "Cowork needs unrestricted egress for user-configured plugins and MCP servers" — i.e. MCP servers configured in Claude Desktop remain supported. GOTCHA FOR ANYTYPE: when Claude Desktop is in Ollama 3p mode, the active config file may be under `Claude-3p`, not `Claude`; the Claude researcher's config writer must handle both (unconfirmed which file Claude reads for MCP in 3p mode).
- `opencode`, `cline`, `copilot`, `vscode`, `droid`, `pi`, `kimi`, `qwen`, `omp`, `muse`, `pool`, `openclaw`, `hermes(-desktop)`, `dsh`: each has a Go file in `cmd/launch/`; these write the target tool's provider/model settings. MCP not touched. Details unconfirmed per tool.

Conclusion: `ollama launch` is a model-routing shim. Anytype should NOT hook into Ollama; it should connect the downstream app directly (that app's own MCP config is untouched by Ollama, with the 3p-profile caveat).

### 1.4 Ways to add an MCP server (to Ollama itself)

None. There is no deeplink, CLI command, config file, UI form, or plugin format. Ranking: n/a. The "worked example" is therefore replaced by routing (section 8).

### 1.5 Third-party writing of config

N/A for Ollama itself. Ollama's own state: `~/.ollama/` (contains `server.json`, `id_ed25519`, `models`, `logs`). Do not touch. Env knobs: `OLLAMA_HOST` (affects launch). Anytype need not write anything here.

### 1.6 Detect installed

| OS | Detection |
|---|---|
| macOS | `/Applications/Ollama.app` (bundle id `com.electron.ollama` verified locally, v0.40.14); CLI `/usr/local/bin/ollama` (symlink created by app); `ollama --version` |
| Windows | unconfirmed: `%LOCALAPPDATA%\Programs\Ollama\ollama.exe`; `where ollama` |
| Linux | `which ollama`; systemd service `ollama.service`; `/usr/local/bin/ollama` |
| Any | `GET http://127.0.0.1:11434/` returns "Ollama is running"; `GET /api/version` |

Better signal for Anytype: detect the downstream agents (claude, codex, opencode, `/Applications/Claude.app`, ChatGPT.app, VS Code...) rather than Ollama.

### 1.7 Skills / plugins

None in Ollama. Skills (SKILL.md) live in the launched agent (Claude Code, Codex, OpenCode, Hermes Agent "reusable skills", etc.) — covered by those agents' reports.

### 1.8 Marketplace / directory

No MCP or plugin marketplace in Ollama. https://ollama.com/library is a model registry only. No submission path. Nothing to list Anytype in. (Third-party MCP servers listed in mcp.so etc. are unrelated.)

---

## 2. Open WebUI (docs v0.13.x; MCP since v0.6.31)

### 2.1 Surfaces and platforms

- Self-hosted web app (Docker `ghcr.io/open-webui/open-webui:main`, pip, etc.) — latest v0.13.5 (2026-11-25). License: custom (SPDX NOASSERTION; branding-preserving BSD-style variant — unconfirmed text).
- Open WebUI Desktop (https://github.com/open-webui/desktop, v0.1.4, 2026-11-02): runs Open WebUI natively without Docker, serves at http://localhost:8080 (per quick-start docs).
- Open WebUI Tether (desktop companion app; see 2.7).
- Docker quick start: `docker run -d -p 3000:8080 --add-host=host.docker.internal:host-gateway -v open-webui:/app/backend/data -e WEBUI_SECRET_KEY=... --name open-webui --restart always ghcr.io/open-webui/open-webui:main`.

### 2.2 MCP support

- Transport: **Streamable HTTP only**. stdio and legacy SSE NOT supported directly (SSE URL "does not connect"); use **mcpo** (https://github.com/open-webui/mcpo, MIT, v0.0.21 2026-11-25) to wrap stdio/SSE as OpenAPI. Docs state it connects on the stateless `2026-07-28` revision "and on older revisions" — compatible with Anytype's 2025-06-18/2025-11-25 (confirm by live test; unconfirmed).
- Static headers: YES. Auth modes: None, **Bearer** (Key field), Session, OAuth, OAuth 2.1 (DCR), OAuth 2.1 Static. Plus a free-form **Headers** JSON object merged into every request (supports `{{USER_ID}}` etc. placeholders). So `Authorization: Bearer <anytype key>` works via auth_type bearer + key. Note: do not choose Bearer with an empty key.
- Secrets: key stored in Open WebUI's config DB (OAuth tokens encrypted with `WEBUI_SECRET_KEY`); no keychain/env-var-sourced header indirection. Unconfirmed whether `key` is encrypted at rest.
- OAuth: supported but not needed (Anytype has no OAuth).
- Reachability: **the Open WebUI backend opens the connection** ("the URL must be reachable from the backend, not from your browser"). Therefore:
  - Open WebUI in Docker + Anytype on host: use `http://host.docker.internal:31009/mcp/large`. Mac/Windows Docker Desktop resolves it automatically; Linux needs `--add-host=host.docker.internal:host-gateway`. Podman: `host.containers.internal`.
  - BUT Anytype's API listens on 127.0.0.1 only. A container reaching the host via host.docker.internal hits the host's non-loopback interface (docker bridge/VM gateway), so a 127.0.0.1-bound server is typically NOT reachable (macOS Docker Desktop forwards to host loopback, so it often works there; Linux does not). Unconfirmed per platform; test needed. Anytype would need a bind-address option (0.0.0.0 / docker bridge) for Docker users — security-sensitive, only with bearer auth.
  - Open WebUI Desktop / pip install (native process): `http://127.0.0.1:31009/mcp/large` works directly.
  - Browser Origin check in Anytype is irrelevant because the backend (aiohttp/httpx) makes the call, not the browser. (Tether local MCP commands also bypass this.)
- HTTPS not required (docs use http://host.docker.internal examples). Redirects followed only same-origin.
- Tool limits: models need native tool calling; small models misuse tools -> Anytype `small` tier for local Ollama models.

### 2.3 Every way to add a server (ranked by effort)

1. **Admin REST API (programmatic, best for Anytype automation)**: `POST /api/v1/configs/tool_servers` (admin bearer token required, verified in `backend/open_webui/routers/configs.py`) with body `{"TOOL_SERVER_CONNECTIONS":[{url, path, type:"mcp", auth_type:"bearer", key, headers, config:{enable:true,...}, info:{...}}]}`. It REPLACES the whole list (GET first and merge). Requires an Open WebUI admin API key/JWT, which Anytype would have to ask the user for -> not zero-touch. Exact `info`/`config` required keys: unconfirmed (see `utils/tools.py` `connect_mcp_server`: needs `config.enable`, `type == 'mcp'`, id lookup).
2. **In-app UI form**: Admin Settings (Settings > Integrations, admin section) > External Tool Servers > "+ Add Connection". Type = "MCP (Streamable HTTP)", URL, Auth = Bearer, Key = token, optional Headers JSON, optional Function Name Filter List, Access Control (users/groups), Save (restart if prompted). Per docs https://docs.openwebui.com/features/extensibility/mcp/.
3. No deeplink, no CLI, no config file (connections live in DB/`tool_server.connections` persistent config). Env var `TOOL_SERVER_CONNECTIONS` exists as a persistent-config env var (unconfirmed exact name/format; only the config key `tool_server.connections` is confirmed from source).

Worked example (UI):
```
Type: MCP (Streamable HTTP)
URL:  http://host.docker.internal:31009/mcp/large     (native/Desktop install: http://127.0.0.1:31009/mcp/large)
Auth: Bearer
Key:  <anytype api key>
ID/Name: anytype
```
Equivalent API payload (shape confirmed from pydantic model; inner `config`/`info` unconfirmed):
```json
{"TOOL_SERVER_CONNECTIONS":[{"url":"http://host.docker.internal:31009/mcp/large","path":"","type":"mcp","auth_type":"bearer","key":"<anytype api key>","headers":null,"config":{"enable":true},"info":{"id":"anytype","name":"Anytype"}}]}
```
Per-user tool servers: admin-only for MCP ("MCP servers are admin-only"). Non-admins can only add their own via Tether.

### 2.4 Can Anytype write config safely?

- No file to write. Only via admin API (needs admin token) or user doing the UI form. Changes via API call `set_tool_servers` take effect live (no restart observed in source; UI says "restart if prompted"). Risk: POST replaces whole list — must merge. Multi-instance (Redis) and multi-user access control apply. Recommended: Anytype shows a copy panel with URL (pre-adjusted for Docker), header, and token with one-click copy buttons plus a screenshot-style 5-step guide. Optional "Advanced: paste Open WebUI admin API key and I'll add it" later.

### 2.5 Detect installed

- Docker: `docker ps --format '{{.Image}}'` contains `open-webui`; or probe `http://127.0.0.1:3000`, `:8080` and check `GET /api/config` returns JSON with `name: "Open WebUI"`. Desktop app: unconfirmed bundle id/paths (repo open-webui/desktop). Python: `which open-webui`. No URL scheme known.

### 2.6 Skills / plugins

Open WebUI has Functions/Tools/Pipelines (Python) and "Skills" (unconfirmed), but no SKILL.md/MCP bundle install flow found. MCP Apps (iframe UIs from MCP servers) supported per docs; irrelevant for Anytype.

### 2.7 Open WebUI Tether (https://docs.openwebui.com/ecosystem/tether/, repo open-webui/tether v0.1.16, 2026-11-16)

- Desktop app (macOS dmg/zip x64+arm64, Windows exe x64+arm64, Linux AppImage/deb/snap/flatpak) that connects the user's computer OUTBOUND to an Open WebUI instance (no inbound ports). Gives that instance's chat access to local files/terminal (via Open Terminal), local Ollama/LM Studio models, internal services, and **local MCP servers run by Tether directly (stdio commands)** — "Local MCP server commands run through Tether directly, without a separate HTTP bridge." Per-user (not admin-only). Needs instance flags `ENABLE_WEBSOCKET_SUPPORT`, `ENABLE_TOOL_SERVERS`.
- This is the answer for "Open WebUI is hosted/remote or in Docker and Anytype is on my laptop": Tether runs on the laptop, so `127.0.0.1:31009` is reachable; add Anytype there. Whether Tether supports remote-HTTP MCP entries with headers vs only stdio commands: unconfirmed; the npm stdio server `npx -y @anyproto/anytype-mcp` with env would work as a stdio command (needs Node).
- Security: optional sandbox; local MCP commands are outside the sandbox. Integration keys stay on the Tether computer.
- Licensing: repo LICENSE = "Open WebUI Enterprise License" (NOASSERTION): free for personal non-commercial use under a personal-use exception; commercial/organizational production use needs an Enterprise License (docs). Anytype must not bundle/redistribute it; just document it.
- Config location of Tether's MCP list: unconfirmed.

### 2.8 Marketplace

Open WebUI has a community site (openwebui.com) for sharing Tools/Functions/models; no curated MCP directory with submission requirements found; localhost-only server can't be a "listing" meaningfully. Unconfirmed; low value.

---

## 3. Recommendation: Anytype route for "I use Ollama"

Key insight: Ollama has no MCP surface, so there is no "Connect to Ollama" button to build. Anytype's UI should say: "Ollama runs the model — pick the app you chat with" and route.

Zero-touch route (what Anytype does, user sees):
1. Anytype Settings > AI > "I use Ollama" card. Anytype detects (Ollama app/CLI, `ollama launch` integrations on PATH or in /Applications: claude, codex, opencode, Claude Desktop, ChatGPT Desktop, VS Code, Cline...).
2. Shows only detected agents as "Connect" rows (each uses that app's own best route defined in the other reports: e.g. `claude mcp add --transport http anytype http://127.0.0.1:31009/mcp/small --header "Authorization: Bearer <key>"` for Claude Code; writing `~/.codex/config.toml` for Codex; etc.). Since local models are small, default tier = `small` (offer `large` toggle). Clicks: Connect -> choose spaces/read-write -> Done (2-3 clicks). Anytype mints key via internal RPC.
3. Hint text: "Start it with `ollama launch claude` (or via the Ollama app's Apps menu). Your Anytype tools will be there." Anytype can also offer a "Copy launch command" button.
- Caveat: `ollama launch claude` sets `ENABLE_CLAUDEAI_MCP_SERVERS=false` (disables claude.ai cloud connectors only); servers added at user/project scope with `claude mcp add` should be unaffected (unconfirmed — verify by running `ollama launch claude` and `/mcp`). Claude Desktop under Ollama 3p mode uses `~/Library/Application Support/Claude-3p/claude_desktop_config.json` (macOS; path from Ollama source) — write both normal and 3p configs, or detect which is active.

Open WebUI route (fallback / second card "Open WebUI"):
- If Open WebUI Desktop or native pip install on same machine: show a "Copy" panel: URL `http://127.0.0.1:31009/mcp/small`, Auth Bearer, token (minted in-app; copy button), plus a 5-step instruction with deep link to `http://localhost:3000/admin/settings/integrations` (path unconfirmed) — the user pastes 2 values. ~6 clicks, 2 pastes.
- If Docker: URL becomes `http://host.docker.internal:31009/mcp/small` and Anytype must listen beyond loopback (not available today; needs a user-enabled "allow Docker/LAN access" option — recommend heart-side setting) — otherwise recommend Tether, or mcpo is NOT needed (Anytype is already Streamable HTTP).
- Optional later automation: ask the user for an Open WebUI admin API key and POST `/api/v1/configs/tool_servers` (merge with GET). Not zero-touch; probably skip in v1.

Gotchas:
- Tokens: never in deeplinks for these apps (none exist); Open WebUI stores the key in its DB; read-only keys recommended by default; show expiry option.
- Open WebUI MCP is admin-only: multi-user instance owners only.
- Small local models: ship `small` tier; docs warn weak models misuse MCP tools; 64k context recommended for agents launched via Ollama.
- Version minimums: Open WebUI >= v0.6.31; Ollama >= version that has `launch` (CLI 0.40.x here); Claude Desktop integration macOS only.
- Open WebUI in Docker and the 127.0.0.1 bind (see 2.2) is the main technical risk.
- Tether licensing (Enterprise license for commercial use).

---

## Sources (URL, date/version seen 2026-11-26)

- https://docs.ollama.com/integrations — integrations overview, no MCP mention
- https://docs.ollama.com/cli — (seed; not separately fetched, CLI verified via local `ollama --help`/`ollama launch --help`, v0.40.14)
- https://docs.ollama.com/integrations/claude-code — launch claude behaviour
- https://docs.ollama.com/integrations/claude-desktop — macOS only, Apps section, restore options
- https://docs.ollama.com/integrations/codex — codex profile, `--restore`
- https://docs.ollama.com/integrations/vscode — `ollama launch vscode`
- https://github.com/ollama/ollama/issues/7865 — MCP support request, OPEN, 60 comments, updated 2026-08-08
- https://github.com/ollama/ollama/tree/main/cmd/launch (`claude.go`, `claude_desktop.go`, others) — read via `gh api` 2026-11-26
- https://github.com/ollama/ollama/releases — v0.40.18 (2026-11-24), v0.40.19-rc0 (2026-11-26)
- Local checks: `/Applications/Ollama.app/Contents/Info.plist` CFBundleIdentifier `com.electron.ollama`, version 0.40.14; `~/Library/Application Support/{Claude,Claude-3p,Ollama}` exist (contents not read)
- https://www.morphllm.com/ollama-mcp, https://www.promptquorum.com/power-local-llm/local-ai-agents-with-mcp-2026, https://vdf.ai/blog/mcp-ollama-lm-studio-setup/ — third-party statements that Ollama has no MCP client (secondary)
- https://docs.openwebui.com/features/extensibility/mcp/ (and .md) — MCP setup, auth modes, backend reachability, Docker, admin-only, 2026-07-28 revision statement
- https://docs.openwebui.com/ecosystem/tether/ — Tether
- https://docs.openwebui.com/getting-started/quick-start/ — docker command, desktop app, host.docker.internal
- https://github.com/open-webui/open-webui `backend/open_webui/routers/configs.py` (`/tool_servers`, `ToolServerConnection`) and `utils/tools.py` — API shape; release v0.13.5 (2026-11-25)
- https://github.com/open-webui/tether — v0.1.16 (2026-11-16), LICENSE = Open WebUI Enterprise License
- https://github.com/open-webui/desktop — v0.1.4 (2026-11-02)
- https://github.com/open-webui/mcpo — v0.0.21 (2026-11-25), MIT

## Unconfirmed list

Windows/Linux Ollama detection paths; ChatGPT Desktop/Codex-app launch internals; whether `ENABLE_CLAUDEAI_MCP_SERVERS=false` affects user-scope `claude mcp add` servers; which Claude Desktop config file is read for MCP under Ollama 3p mode; Open WebUI Desktop bundle id; Open WebUI UI URL path of the integrations page; exact `config`/`info` fields for the tool_servers API; `TOOL_SERVER_CONNECTIONS` env var; whether Open WebUI reaches a 127.0.0.1-bound host service via host.docker.internal on each OS; Open WebUI protocol compatibility with Anytype's 2025-06-18/2025-11-25 revisions (live test needed); Tether remote-HTTP MCP entries support; Tether MCP config location; whether Open WebUI encrypts bearer keys at rest.

---

# VERIFIED CORRECTIONS (supersede any conflicting text above)

Verified 2026-11-27 against live sources and local `ollama --version` (0.40.14).

## Corrections applied to the text above

1. Claude Desktop under `ollama launch` is NOT macOS-only in source. `cmd/launch/claude_desktop.go` has Windows branches (`claudeDesktopWindowsConfigPaths`, `%LOCALAPPDATA%\Claude` and `%LOCALAPPDATA%\Claude-3p`). Docs (docs.ollama.com/integrations/claude-desktop) still say macOS only, "Windows not yet available". Treat Windows as "coming, code present".
2. Config file locations when Claude Desktop is connected through Ollama: source writes a "deployment mode" key (`3p`/`1p`) into `Claude-3p/claude_desktop_config.json` and a profile at `Claude-3p/configLibrary/<id>.json`. Normal config stays at `Claude/claude_desktop_config.json` and is also touched. Which file Claude reads for `mcpServers` in 3p mode remains UNCONFIRMED. Anytype should detect `deploymentMode == "3p"` and tell the user to disconnect from Ollama or warn that MCP may not apply.
3. Tether DOES support Streamable HTTP MCP entries with an optional bearer Key (Tether `docs/mcp.md`): "URL: http://127.0.0.1:8000/mcp, Key: optional bearer token", URL reached from the Tether computer; alternate paths, query strings, redirects rejected; no OAuth/SSE. Also supports stdio with env. The report's "unconfirmed" is resolved. Config is in Tether Settings > Integrations > Tools > type MCP. Secrets use encrypted storage when available.
4. Open WebUI docs state: MCP is admin-only in Settings > Integrations > External Tool Servers > "+ Add Connection" > Type "MCP (Streamable HTTP)"; section is greyed out if `ENABLE_TOOL_SERVERS=False`; no provisioning API or env var is documented. Source does show `POST/GET /api/v1/configs/tool_servers` (admin only) with `ToolServerConnection{url, path, type, auth_type, forward_cookies, headers, key, config, info}` (all fields required except defaults: `path`, `auth_type`, `key`, `config` have no defaults) and env `TOOL_SERVER_CONNECTIONS` (JSON list, loads to config key `tool_server.connections`) - the env var is CONFIRMED, the report's "unconfirmed" is resolved. Undocumented in user docs, so treat as unstable.
5. Version facts: latest Ollama release v0.40.18 (2026-11-24), rc v0.40.19-rc0 (2026-11-26); Open WebUI v0.13.5 (2026-11-25); Open WebUI Desktop v0.1.4 (2026-11-02). Matches report.
6. Docs list ChatGPT Desktop (Codex mode) and Claude Desktop under Ollama's "Apps" sidebar, macOS only; `ollama launch --help` lists `chatgpt` with aliases codex-app/codex-desktop/codex-gui as a SEPARATE integration from `codex` (CLI). Confirms ChatGPT app and Codex CLI must be separate in Anytype.
7. Ollama has no MCP client: issue ollama/ollama#7865 still OPEN, 60 comments, updated 2026-08-08; docs integrations page has no MCP mention; third-party 2026 sources agree. CONFIRMED.
8. `ENABLE_CLAUDEAI_MCP_SERVERS=false` set by `ollama launch claude` CONFIRMED (claude.go line 82). It targets claude.ai-account connectors; local/user-scope servers added by `claude mcp add` very likely unaffected but UNCONFIRMED.

## Verification log

| Claim | Status | Source |
|---|---|---|
| Ollama app/CLI/launch has no MCP client | CONFIRMED | https://github.com/ollama/ollama/issues/7865 (open); https://docs.ollama.com/integrations |
| `ollama launch` integration list | CONFIRMED (local `ollama launch --help` 0.40.14) | local CLI |
| `claude-desktop` valid launch name with `--restore` | CONFIRMED | local help examples; claude_desktop.go |
| Claude Desktop integration macOS only | CORRECTED: docs say macOS only; source has Windows support | https://docs.ollama.com/integrations/claude-desktop; cmd/launch/claude_desktop.go |
| Claude-3p profile dir on macOS `~/Library/Application Support/Claude-3p` | CONFIRMED | claude_desktop.go L650-651 |
| Which Claude config is read for MCP in 3p mode | UNCONFIRMED | n/a |
| Open WebUI MCP Streamable HTTP only, v>=0.6.31 | CONFIRMED | https://docs.openwebui.com/features/extensibility/mcp/ |
| Bearer key + custom headers JSON | CONFIRMED | same |
| Open WebUI MCP admin-only | CONFIRMED | same |
| Backend (not browser) opens connection; use host.docker.internal in Docker | CONFIRMED | same |
| Docs mention 2026-07-28 revision "and older" | CONFIRMED (doc text); live compat with Anytype 2025-06-18/2025-11-25 UNCONFIRMED | same |
| Programmatic add via /api/v1/configs/tool_servers | CONFIRMED in source, undocumented | open-webui routers/configs.py |
| TOOL_SERVER_CONNECTIONS env var | CORRECTED unconfirmed -> CONFIRMED (JSON list) | open-webui backend/open_webui/config.py |
| Tether supports remote-HTTP MCP with bearer | CORRECTED unconfirmed -> CONFIRMED | https://github.com/open-webui/tether docs/mcp.md |
| Tether license = personal non-commercial free; enterprise for commercial | CONFIRMED | https://docs.openwebui.com/ecosystem/tether/ |
| Marketplace/directory for Ollama | CONFIRMED none | docs; ollama.com/library is models only |
| Docker host reaching 127.0.0.1-bound Anytype | UNCONFIRMED (needs live test); Linux likely fails | n/a |
| No deeplink/URL scheme for adding MCP in Ollama or Open WebUI | CONFIRMED none found | docs |

## Missed / new findings

- Tether route is the best "Docker/remote Open WebUI + Anytype on laptop" path and accepts `http://127.0.0.1:31009/mcp/small` plus a bearer Key directly (no Node needed). Tether's Key field is stored encrypted.
- Open WebUI `TOOL_SERVER_CONNECTIONS` env var could be provided in a copy-paste Docker snippet for new installs.
- No official Ollama extension API or directory exists; nothing new found.

## Recommendation for Anytype

Primary zero-touch route: there is no "Connect to Ollama" button. In Settings > AI show an "Ollama" card: "Ollama runs the model; connect the app you chat with." Detect `/Applications/Ollama.app` or `ollama` on PATH, then list only detected downstream agents (Claude Code, Codex CLI, ChatGPT app, OpenCode, Claude Desktop, VS Code, Cline) as separate Connect rows using each app's own route (see their reports), default tier `small` with a `large` toggle. Flow: Connect > pick spaces + read/write > Anytype mints key via RPC and writes the target config > done. Offer a "Copy launch command" such as `ollama launch claude`.

Fallback (Open WebUI): Anytype mints a key and shows a panel with URL, Auth = Bearer, Key (one-click copy buttons), and numbered steps: Settings > Integrations > External Tool Servers > + Add Connection > MCP (Streamable HTTP). Native/Desktop install: `http://127.0.0.1:31009/mcp/small`. Docker: `http://host.docker.internal:31009/mcp/small` (needs Anytype reachable beyond loopback; unverified). Remote/Docker alternative: Tether on the laptop with the loopback URL and bearer Key. Optional later: ask for an Open WebUI admin API key and POST `/api/v1/configs/tool_servers` (GET and merge first; it replaces the list).

OS notes: Ollama Claude Desktop integration is macOS in docs; Windows paths exist in source. Linux Docker needs `--add-host=host.docker.internal:host-gateway`. Windows Ollama detection path `%LOCALAPPDATA%\Programs\Ollama` unconfirmed.

Gotchas: never put the token in a URL; Open WebUI MCP is admin-only and the key sits in its DB; weak local models misuse tools (use `small`); `ollama launch claude` disables claude.ai connectors only; Claude Desktop in Ollama 3p mode may read a different config (`Claude-3p`); Tether needs matching Open WebUI version and enterprise license for commercial use; no restart needed in Open WebUI unless prompted.
