# Per-app playbook

What Anytype detects, writes or runs for each app. This is the source for the adapter table in [architecture.md §3](architecture.md#3-client-adapters). The research behind each section is in [research/](research/).

Each claim is marked as follows:

- No mark: confirmed against current docs or source.
- **(verify)**: plausible but unconfirmed, or contradicted between sources. Run it once on a real install before shipping.

Placeholders used throughout:

| Placeholder | Meaning |
|---|---|
| `<port>` | the live local API port (default `31009`; the headless anytype-cli uses `31012`) |
| `<tier>` | `large` (Recommended), `small` (Essentials) or `full` |
| `<KEY>` | the key minted for this connection |
| `<URL>` | `http://127.0.0.1:<port>/mcp/<tier>` |
| `<PROXY>` | the Route B command (below) |

## 0. Shared pieces

### 0.1 Route B command: the bundled stdio proxy

For the POC, the command is the proxy `bin/cli.mjs` from anytype-mcp PR #168, copied to `dist/mcp/cli.mjs` and listed in `asarUnpack`, run by Anytype's own executable in Node mode:

```json
{
  "command": "<Anytype executable>",
  "args": ["<resources>/app.asar.unpacked/dist/mcp/cli.mjs", "--tier", "large"],
  "env": {
    "ELECTRON_RUN_AS_NODE": "1",
    "ANYTYPE_API_BASE_URL": "http://127.0.0.1:<port>",
    "OPENAPI_MCP_HEADERS": "{\"Authorization\":\"Bearer <KEY>\"}"
  }
}
```

The executable path depends on how Anytype is installed. Never hard-code it: write what `process.execPath` reports and fix it on startup ([architecture.md §5](architecture.md#5-self-heal)).

| OS / package | Executable (typical) | Resources |
|---|---|---|
| macOS | `/Applications/Anytype.app/Contents/MacOS/Anytype` | `/Applications/Anytype.app/Contents/Resources` |
| Windows (NSIS, per user) | `%LOCALAPPDATA%\Programs\anytype\Anytype.exe` **(verify)** | `…\resources` |
| Linux deb/rpm | `/opt/Anytype/anytype` **(verify)** | `/opt/Anytype/resources` |
| Linux AppImage | `$APPIMAGE` (the file path changes if the user downloads a new file) | inside the mount, so launch the AppImage itself |
| Linux tar.gz | wherever it was unpacked | next to the executable |
| Snap / Flatpak | sandboxed; other apps may not be able to start it | Route A or manual only **(verify)** |

The production proxy is a signed helper binary (see [architecture.md §4](architecture.md#4-the-bundled-proxy)). When it lands, only this row changes: `command` becomes the helper and `ELECTRON_RUN_AS_NODE` goes away.

### 0.2 The `anytype-api` skill (Route C)

Anytype ships `SKILL.md` from heart (`core/api/v2/SKILL.md`) in its package. It copies the file to `<skills dir>/anytype-api/SKILL.md`. The skill has to look for `ANYTYPE_API_URL` and `ANYTYPE_API_KEY` first (heart ask, [architecture.md §9](architecture.md#9-asks-to-other-teams)).

The common skill directories are `~/.agents/skills/` and `~/.claude/skills/`. Between them they cover Codex, Cursor, Copilot, OpenCode, Zed, Droid, Devin Desktop and Claude Code. Antigravity is the outlier: it uses `~/.gemini/config/skills/`.

### 0.3 Detecting apps and CLIs

- **macOS.** A GUI-launched Electron app has a minimal `PATH`. To find CLIs:
  - Run `$SHELL -lc 'command -v <cli>'` with a short timeout.
  - Also probe `~/.local/bin`, `/opt/homebrew/bin`, `/usr/local/bin` and the vendor's own install directories.
  - Find apps by bundle id (`mdfind "kMDItemCFBundleIdentifier == '<id>'"`), falling back to `/Applications/<Name>.app`.
- **Windows.**
  - CLIs: `where <cli>`.
  - Store/MSIX apps: `Get-AppxPackage -Name <Name>*`.
  - Classic installs: the registry `App Paths` and `%LOCALAPPDATA%\Programs\<name>`.
- **Linux.** Check XDG config dirs, then Flatpak (`~/.var/app/<id>/config/…`) and Snap (`~/snap/<name>/current/…`) variants.
- **A config folder counts as installed.** JetBrains' detector does the same: for example `~/.cursor/` or `~/.codex/`.

---

## 1. Release 1 apps

### 1.1 Claude Desktop

**Detect**
- macOS: `Claude.app` (registers `.mcpb` and `.dxt` document types).
- Windows: the MSIX package (`Get-AppxPackage -Name Claude*`, family `Claude_pzs8sxrjxfjjc`), or a legacy install at `%LOCALAPPDATA%\AnthropicClaude\Claude.exe`.
- Linux: beta only, `~/.config/Claude` **(verify)**.

**Primary: a per-connection `.mcpb`, route B on Claude's own Node.**

1. Build `Anytype.mcpb`. It's a zip: `manifest.json` + `server/cli.mjs`, the same proxy file as §0.1.

   ```json
   {
     "manifest_version": "0.3",
     "name": "anytype",
     "display_name": "Anytype",
     "version": "<anytype version>",
     "description": "Your Anytype spaces in Claude",
     "author": { "name": "Anytype" },
     "server": {
       "type": "node",
       "entry_point": "server/cli.mjs",
       "mcp_config": {
         "command": "node",
         "args": ["${__dirname}/server/cli.mjs", "--tier", "large"],
         "env": {
           "ANYTYPE_API_BASE_URL": "http://127.0.0.1:<port>",
           "OPENAPI_MCP_HEADERS": "{\"Authorization\":\"Bearer <KEY>\"}"
         }
       }
     },
     "compatibility": { "platforms": ["darwin", "win32"], "runtimes": { "node": ">=18.0.0" } }
   }
   ```

2. The key goes **in `env`, not `user_config`**. A sensitive `user_config` field can't be filled in from outside; the user would have to type the key.
3. Open the file:
   - macOS: `open -a Claude <file>`, or `shell.openPath`.
   - Windows: start `claude.exe "<file>"`, resolving its path from the MSIX package. The MSIX build registers no `.mcpb` association, so `shell.openPath` doesn't work there.
4. The user clicks **Install** in Claude's dialog. Delete the temp file once the install is reported.
5. No restart is documented. If the tools don't appear, tell the user to toggle the extension or restart Claude.

**Things to know about the `.mcpb` route**
- An unsigned bundle installs with "Developer: unknown". Signing it (`mcpb sign`) with the Anytype certificate removes that.
- Enterprise policy `isDesktopExtensionEnabled` can hide extensions entirely.
- After a port change, Anytype re-generates the bundle and Claude shows the install dialog again.
- **Remove:** Anytype revokes the key, so the extension stops working. Then it says *"Remove Anytype in Claude ▸ Settings ▸ Extensions."* No programmatic uninstall was found.

**Fallback (and Linux): a stdio entry in `claude_desktop_config.json`.**
- Claude rewrites this file, so the order is: quit Claude → merge `mcpServers.anytype = <PROXY>` → relaunch.
- **Never write a `url` entry here**: there's a report that it wipes `mcpServers`.

| OS | Path |
|---|---|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows (MSIX, current default) | `%LOCALAPPDATA%\Packages\Claude_*\LocalCache\Roaming\Claude\claude_desktop_config.json` (glob the package suffix) |
| Windows (classic) | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux (beta) | `~/.config/Claude/claude_desktop_config.json` **(verify)** |

**Not usable:**
- **Custom connectors** (Settings ▸ Connectors). Their calls come from Anthropic's cloud, which can't reach `127.0.0.1`, and Claude rejects `http://localhost` URLs on purpose.
- **Cowork cloud sessions.**

### 1.2 Claude Code (CLI, Desktop "Code" tab, VS Code / JetBrains extensions)

**Detect**
- CLI: `claude` (login-shell PATH, `~/.local/bin/claude`, Homebrew paths; on Windows `where claude`).
- No CLI: `~/.claude.json` or `~/.claude/` exists, which covers people using only the Desktop Code tab or an IDE extension.

**Route C (default):**
1. Write `~/.claude/skills/anytype-api/SKILL.md`. It is picked up live.
2. Merge into `~/.claude/settings.json`. Per the docs this applies however Claude Code is started, and it overrides the shell's values:
   ```json
   { "env": { "ANYTYPE_API_URL": "http://127.0.0.1:<port>", "ANYTYPE_API_KEY": "<KEY>" } }
   ```
3. If the user has turned the sandbox on, also merge:
   ```json
   { "sandbox": { "network": { "allowedDomains": ["127.0.0.1:<port>"] } } }
   ```
   Don't use `allowLocalBinding`: it's macOS-only and opens every localhost port.
4. Left for the user: start a new session.

**MCP (Advanced, or when Route C is off):**

```sh
claude mcp remove anytype --scope user            # ignore "not found"
claude mcp add-json --scope user anytype -        # JSON on stdin, not in argv
# stdin: {"type":"http","url":"<URL>","headers":{"Authorization":"Bearer <KEY>"}}
claude mcp get anytype                             # verify
```

- **Always use `--scope user`.** The default `local` scope ties the entry to the working directory of the spawned process.
- **Always include `"type": "http"`.** Without it the entry is read as stdio.
- **Don't edit `~/.claude.json` by hand.** It's live state that the CLI owns.
- Left for the user: a new session, or `/mcp` → reconnect.

### 1.3 ChatGPT (new desktop app)

The new ChatGPT desktop app is the former Codex app, renamed. It has Chat, Work and Codex modes, and it includes its own `codex-cli`. A ChatGPT user doesn't need to install Codex.

| What | Detect | Local MCP |
|---|---|---|
| **ChatGPT** (new app) | macOS `ChatGPT.app` with bundle id `com.openai.codex`. Windows: Microsoft Store package **(verify name)** or `%USERPROFILE%\.codex` | **Yes**, in Work and Codex modes |
| ChatGPT Classic | macOS `ChatGPT Classic.app`, bundle id `com.openai.chat` | No: "can't connect" card that suggests the new app |
| ChatGPT web | — | No: remote HTTPS only, no API-key auth |

**Write** `~/.codex/config.toml`, or `$CODEX_HOME/config.toml`. On Windows it's `%USERPROFILE%\.codex\config.toml`. Use a format-preserving TOML edit and touch only our table:

```toml
[mcp_servers.anytype]
url = "<URL>"
http_headers = { Authorization = "Bearer <KEY>" }
```

**Left for the user:** restart ChatGPT. The app's own wording is Settings ▸ MCP servers ▸ Restart. Anytype offers to quit and reopen it. Then:

- **Card text:** *"Use Anytype in Work or Codex mode."*
- **Chat mode** loads the server but doesn't show its tools to the model. That's openai/codex#38162, open since 2026‑08‑12 with no response from OpenAI. Re-check every release and drop the caveat once it's fixed.

**Fallback:** the snippet + Reveal file + `codex://settings`.

**Not recommended:**
- `codex mcp add --bearer-token-env-var`: apps launched from the Dock or Start menu don't see shell environment variables.
- `bearer_token_env_var`, for the same reason.

### 1.4 Codex (CLI, IDE extension)

**Detect:** `codex` on PATH, `~/.codex/`, or the VS Code extension `openai.chatgpt`.

**Write:** the same file and table as §1.3. If the ChatGPT card already owns the entry, the Codex card just says it's connected (README §6).

**Left for the user:**
- CLI: start a new session. Config is read at session start; there's no file watcher.
- IDE: "Restart extension".

**Route C (Advanced only, with a warning):**
1. Copy the skill to `~/.agents/skills/anytype-api/`.
2. Merge this table. It's applied after the default excludes, so the key isn't filtered out:
   ```toml
   [shell_environment_policy]
   set = { ANYTYPE_API_URL = "http://127.0.0.1:<port>", ANYTYPE_API_KEY = "<KEY>" }
   ```
3. The default `workspace-write` sandbox blocks loopback. Route C needs:
   ```toml
   [sandbox_workspace_write]
   network_access = true
   ```
   That lets commands reach *any* address. The narrower `allow_local_binding` plus a `127.0.0.1` rule has no port granularity. So the sheet says: *"Codex will be allowed to use the network from commands."*

### 1.5 Cursor

**Detect:** `Cursor.app` or `~/.cursor/`; on Windows `%LOCALAPPDATA%\Programs\cursor` **(verify)**; CLIs `cursor` or `agent`.

**Write** `~/.cursor/mcp.json` (Windows `%USERPROFILE%\.cursor\mcp.json`):

```json
{ "mcpServers": { "anytype": { "url": "<URL>", "headers": { "Authorization": "Bearer <KEY>" } } } }
```

**Then:**
- If the `agent` CLI is present, run `agent mcp enable anytype`.
- **Left for the user:** fully quit and reopen Cursor (Anytype offers to). Reload Window isn't enough, because of a confirmed Cursor bug with external edits to URL servers. Then switch **anytype** on in Settings ▸ MCP if it's off.

**Fallback: install link**, opened locally with `shell.openExternal`:

```
cursor://anysphere.cursor-deeplink/mcp/install?name=anytype&config=<base64 of {"url":"<URL>","headers":{"Authorization":"Bearer <KEY>"}}>
```

**(verify)** that Cursor keeps `headers` from the link. The docs only show a stdio example.

**Don't:**
- use `${env:…}` for the key;
- write a project `.cursor/mcp.json`;
- add OAuth discovery to the endpoint. Cursor ignores configured headers when OAuth metadata exists (open bug).

### 1.6 VS Code + GitHub Copilot (also covers Copilot CLI and the GitHub Copilot app)

Since VS Code 1.14x, agent sessions run in the **Copilot harness** by default. It reads `~/.copilot/mcp-config.json`, the same file as Copilot CLI and the GitHub Copilot app. The older Local harness, which reads the profile `mcp.json`, is deprecated and goes away by Feb 2027.

**Detect:** VS Code (app or `code`), `copilot` on PATH, or `~/.copilot/`.

**Write** `$COPILOT_HOME/mcp-config.json`, else `~/.copilot/mcp-config.json` (Windows `%USERPROFILE%\.copilot\mcp-config.json` **(verify)**):

```json
{ "mcpServers": { "anytype": { "type": "http", "url": "<URL>", "headers": { "Authorization": "Bearer <KEY>" }, "tools": ["*"] } } }
```

- **Parsing.** Use a JSONC-tolerant parser. If the file still doesn't parse, fall back to "Set up manually".
- **Left for the user, VS Code:** Chat: Open Customizations ▸ MCP Servers ▸ Restart Server, or start a new chat.
- **Left for the user, Copilot CLI:** nothing; it applies config between turns.
- **Don't** use `inputs` or `password: true`: the Copilot harness rejects them.

**Fallbacks, in order:**
1. `copilot mcp add --transport http --header "Authorization: Bearer <KEY>" anytype <URL>`, run with `execFile` and an argument array.
2. `code --add-mcp '{"name":"anytype","type":"http","url":"<URL>","headers":{"Authorization":"Bearer <KEY>"}}'` installs into the profile with no dialog. Profile entries without `inputs` are forwarded to the Copilot harness **(verify end to end)**.
3. `vscode:mcp/install?<urlencoded JSON>` (Insiders: `vscode-insiders:`). The user clicks Install.
4. **Visual Studio 2026 (Windows):** write `%USERPROFILE%\.mcp.json` with a top-level `servers` key **(verify headers)**.

### 1.7 LM Studio

**Detect:** `LM Studio.app`; `~/.lmstudio/`, `~/.cache/lm-studio/` or `~/.lmstudio-home-pointer`; the `lms` CLI.

**Primary: the install link**, opened locally with `shell.openExternal`. Never use the `https://lmstudio.ai/install-mcp` page, because the key would pass through a website.

```
lmstudio://add_mcp?name=anytype&config=<urlencoded base64 of {"url":"http://127.0.0.1:<port>/mcp/small","headers":{"Authorization":"Bearer <KEY>"}}>
```

- LM Studio's docs use exactly this shape (a remote URL with an `Authorization` header) as their example.
- **Left for the user:** confirm in LM Studio, then approve the first tool call (always asked).
- **Default tier: `small`.** Advanced offers Recommended for large models.

**Fallback: merge `mcp.json`** in LM Studio's home folder (same entry shape under `mcpServers`). Find the home in this order:
1. the path in `~/.lmstudio-home-pointer`;
2. `~/.lmstudio`;
3. `~/.cache/lm-studio`.

The documented `~/.lmstudio/mcp.json` is often wrong on real machines.

**Things to know**
- Whether LM Studio reloads a file it didn't write itself is **(verify)**. Tell the user to toggle the server in the Program tab.
- Bionic keeps its own MCP files.
- LM Studio's site already has an install page for "anytype" with the old npx entry. Ask them to update it (marketplaces.md).

### 1.8 Other app (Set up manually)

Three ready-made formats, all with the key filled in:

1. **Most apps** (`mcpServers` + `url` + `headers`):
   ```json
   { "mcpServers": { "anytype": { "url": "<URL>", "headers": { "Authorization": "Bearer <KEY>" } } } }
   ```
2. **Apps that only run commands:** the `<PROXY>` object from §0.1.
3. **Apps with a form:** URL, header name `Authorization`, header value `Bearer <KEY>`, each with its own Copy button.

Apps that start pairing themselves (`POST /v2/auth/challenges`) still get the existing approval window with the space picker and the 4‑digit code. Nothing changes there.

---

## 2. Release 2 apps

Same mechanics: mint the key, merge our entry (or run the app's CLI), name the remaining action.

| App | Detect | Target / command | Entry shape | Left for the user | Notes |
|---|---|---|---|---|---|
| **Cline** (VS Code ext., CLI) | `~/.cline/`, ext. `saoudrizwan.claude-dev` | `~/.cline/data/settings/cline_mcp_settings.json` (honor `CLINE_MCP_SETTINGS_PATH`). Legacy 3.x: `…/globalStorage/saoudrizwan.claude-dev/settings/` | `mcpServers.anytype = {type:"streamableHttp", url, headers, disabled:false, autoApprove:[]}` | none (hot reload) | `type` must be exactly `streamableHttp`. Without it Cline uses SSE, which fails against our JSON-only endpoint |
| **Kilo Code** | `kilo` CLI, `~/.config/kilo/` | `kilo mcp add anytype --url <URL> --header "Authorization=Bearer <KEY>"`, else a JSONC edit of `~/.config/kilo/kilo.json(c)` | `mcp.anytype = {type:"remote", url, headers, oauth:false}` | Reload Window **(verify)** | `oauth:false` stops OAuth probing |
| Roo Code | ext. `rooveterinaryinc.roo-cline` | globalStorage `mcp_settings.json` | `type:"streamable-http"` | Reload Window | Discontinued: label it legacy |
| **Zed** | `~/.config/zed/`, `%APPDATA%\Zed` | JSONC merge into `settings.json` | `context_servers.anytype = {url, headers}` (not `mcpServers`) | check the green dot in Settings ▸ AI ▸ MCP **(verify reload)** | `zed://skill?data=<base64url>` can offer the skill |
| **Devin Desktop** (formerly Windsurf) | `devin` CLI, `~/.config/devin/` (legacy `~/.codeium/windsurf/`) | `devin mcp add -s user -t http -H "Authorization: Bearer <KEY>" anytype <URL>`, else merge `~/.config/devin/mcp_config.json` | `mcpServers.anytype = {serverUrl, headers}` | Refresh in Customize ▸ MCPs | Search alias "windsurf" |
| **JetBrains Junie** | `~/.junie/` | merge `~/.junie/mcp/mcp.json` | `mcpServers.anytype = {url, headers}` | `/mcp` ▸ Reconnect | |
| JetBrains AI Assistant | IDE detected | — | — | paste into Settings ▸ Tools ▸ AI Assistant ▸ MCP | Manual only; suggest Junie |
| **Antigravity** (CLI `agy` and IDE) | `agy`, `~/.gemini/config/` | merge `~/.gemini/config/mcp_config.json` | `mcpServers.anytype = {serverUrl, headers}` (`httpUrl` and SSE not supported) | `/mcp` manager | Replaced Gemini CLI for consumer accounts on 2026‑06‑18. Skills: `~/.gemini/config/skills/` |
| Gemini CLI (API-key / Workspace users) | `gemini` | `gemini mcp add -s user -t http -H "Authorization: Bearer <KEY>" anytype <URL>` | `mcpServers.anytype = {httpUrl, headers}` in `~/.gemini/settings.json` | new session | Starts OAuth on 401, so the header must be present from the first request |
| **OpenCode** | `opencode` | v2: `opencode mcp add anytype --global --url <URL> --header 'Authorization=Bearer <KEY>'`; v1: JSONC merge of `~/.config/opencode/opencode.json(c)` | `mcp.anytype = {type:"remote", url, enabled:true, oauth:false, headers}` | restart | |
| **Goose** | `goose`, `~/.config/goose/` | write `config.yaml` (`%APPDATA%\Block\goose\config\` on Windows), or a `goose://extension?type=streamable_http&…&header=` link (1 confirm) | `extensions.anytype = {type: streamable_http, uri, headers, enabled:true}` | new session | `uri` vs `url` **(verify)** |
| **Kiro** | `~/.kiro/` | merge `~/.kiro/settings/mcp.json` | `mcpServers.anytype = {url, headers}` | none (auto reload) | |
| Amp | `amp`, `~/.config/amp/` | merge `~/.config/amp/settings.json` | `"amp.mcpServers".anytype = {url, headers}` | new session | never `amp mcp remote` |
| Warp | `~/.warp/` | merge `~/.warp/.mcp.json` | `mcpServers.anytype = {url, headers}` | none | also reads Claude Code / Codex configs |
| Factory Droid | `droid` | `droid mcp add anytype <URL> --type http --header "Authorization: Bearer <KEY>" --no-oauth` | — | none (auto reload) | |
| Pi | `pi` | `pi mcp add anytype --url <URL> --header "Authorization=Bearer <KEY>"`, else `~/.pi/agent/mcp.json` | `mcpServers.anytype = {url, headers}` | `/reload` | |
| **Jan** | `~/Library/Application Support/Jan/data`, `%APPDATA%\Jan\data`, `~/.local/share/Jan/data` (the data folder can be moved) | merge `<data>/mcp_config.json`, or `jan cli mcp add … --active` | `mcpServers.anytype = {type:"http", url, headers, active:true}` | restart Jan | tier `small` |
| **AnythingLLM** | storage dir | merge `<storage>/plugins/anythingllm_mcp_servers.json` | `mcpServers.anytype = {type:"streamable", url, headers}` | Refresh on the Agent Skills page | tier `small` |
| **Raycast** (Pro) | `Raycast.app` | clipboard + Raycast's in-app MCP JSON import, or the Install MCP Server form | `<PROXY>` or URL + headers | Install | No documented `raycast://mcp/install`; don't rely on it |
| BoltAI | `~/.boltai/` | write `~/.boltai/mcp.json` | `<PROXY>` | Reload Configuration | |
| Msty Studio | app | — | — | paste URL + header | Manual only |
| **Hermes** | `hermes`, `~/.hermes/` | key → `~/.hermes/.env` (`ANYTYPE_API_KEY`); merge `mcp_servers.anytype` into `~/.hermes/config.yaml` with `Bearer ${ANYTYPE_API_KEY}` | YAML | `/reload-mcp` | Or the desktop app's `hermes://mcp/install?…` link (stores the key verbatim). A separate card covers "chat with your agent in Anytype" through `anytype-hermes` |
| OpenClaw | `openclaw`, `~/.openclaw/` | `openclaw mcp set anytype '<json>'`, then `openclaw mcp doctor anytype --probe` | `{url, transport:"streamable-http", headers}` | none (hot reload) | needs Node 24.16+ |
| **Open WebUI** | localhost:3000 responds / Desktop app | guided card: URL, `Bearer`, key | Settings ▸ Integrations ▸ External Tool Servers ▸ MCP (Streamable HTTP) | paste 2 values | Docker: `host.docker.internal` can't reach a server bound to the host's loopback. Needs a "let containers connect" listen option (later) or Open WebUI Tether |

## 3. Can't reach a local Anytype

All of these run tools from the vendor's cloud. Each gets an explanation card that offers the local alternative.

| App | Why | Offer instead |
|---|---|---|
| ChatGPT web, ChatGPT Classic | cloud-run connectors; HTTPS + OAuth only | the new ChatGPT desktop app (Work/Codex mode) |
| Claude.ai web/mobile, Claude Desktop custom connectors, Cowork cloud | called from Anthropic's cloud; `http://localhost` rejected on purpose | Claude Desktop (extension) or Claude Code |
| Perplexity (Mac and web) | remote connectors only | Claude Desktop, ChatGPT, LM Studio |
| Le Chat, Copilot Studio, Cursor/Kiro/Amp cloud agents | cloud | the desktop version of the same tool |
| Ollama (by itself) | no MCP client | the Ollama router card (README §5) |
