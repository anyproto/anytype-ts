# Agent harnesses: Hermes Agent (Nous Research) + anytype-hermes, and OpenClaw
Research date: 2026-11-26. Neither `hermes` nor `openclaw` is installed on this machine, so nothing was run locally. Everything below comes from live docs and GitHub, with source and version noted. Anything not confirmed is marked "unconfirmed".

---
## 0. Two different jobs (read this first)

| Job | What it means | Route |
|---|---|---|
| A. "Use Anytype from my agent" | The agent calls Anytype tools (search, create, edit objects). | MCP server `anytype` -> `http://127.0.0.1:31009/mcp/large` + bearer key. |
| B. "Chat with my agent inside Anytype" | The user @-mentions a bot in an Anytype chat and Hermes replies there. | `anyproto/anytype-hermes` gateway plugin. A separate bot account, a gateway process and a CLI-installed Anytype (or Desktop API) are needed. This is not the same as A. |

Job A is a single config entry and can be fully automated by the Anytype desktop app. Job B is a multi-step onboarding with a separate bot account. Treat it as an advanced, opt-in feature and do not mix it into the "Connect" button. The plugin's own optional "Anytype MCP tools" step (http / wrapper / none) is just Job A again.

---
## 1. HERMES AGENT

### 1.1 Surfaces and versions
- Core repo `NousResearch/hermes-agent`. Latest release seen: **v0.23.4** (2026-11-24). Canary builds exist (`canary.20261125...-v0.23.4`). (GitHub releases API, 2026-11-26)
- Surfaces:
  - CLI/TUI (`hermes`). Install: `curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash` (Linux/macOS/WSL2). Windows native: `iex (irm https://hermes-agent.nousresearch.com/install.ps1)`. Docker and Termux also exist. (docs: getting-started/installation)
  - Desktop app (Electron): macOS 13+ Apple Silicon only (Intel uses the CLI installer). Windows 11 22H2+ (x64/ARM64) via Microsoft Store or `.appinstaller`. Linux uses the CLI and `hermes desktop` (the doc says "add the desktop app later with `hermes desktop`").
  - Messaging gateway (`hermes gateway run`) for Slack, Telegram and similar, plus platform plugins such as anytype-hermes.
  - A web marketplace: https://hermes-agent.nousresearch.com/marketplace.
- Data dir `HERMES_HOME`: `~/.hermes/` on macOS/Linux/WSL2/Termux. Native Windows: `%LOCALAPPDATA%\hermes\`. Desktop bundle: "platform's default Hermes data directory" (exact path unconfirmed). Docker: `/opt/data/`.

### 1.2 MCP support
- stdio: yes. HTTP (streamable-http): yes (`url:` key). Legacy SSE: the CLI help says "HTTP/SSE endpoint URL" (unconfirmed which is picked automatically).
- Static headers: **yes**, `headers:` map on HTTP servers.
- Env interpolation: **yes**. `${VAR}` in `url`, `args`, `command` and `headers` resolves at connect time from the process env and `~/.hermes/.env`. Stdio servers only get the explicit `env:` map plus a safe baseline.
- Secret handling: `hermes mcp add <name> --url ... ` followed by the "requires authentication?" prompt stores the typed token in `~/.hermes/.env` as `MCP_<NAME>_API_KEY` and writes `headers: {Authorization: "Bearer ${MCP_<NAME>_API_KEY}"}` to config.yaml. This is the best-practice shape to copy when Anytype writes config itself (source: `hermes_cli/mcp_config.py`, `_save_bearer_auth_token`, main branch 2026-11-26).
- OAuth: yes (`auth: oauth`, `hermes mcp login`). Not needed for Anytype today.
- Localhost: Hermes runs the MCP client on the user's own machine, so `http://127.0.0.1:31009` is reachable. A Docker or remote Hermes cannot reach host loopback (see the anytype-hermes SETUP note: "inside a container 127.0.0.1 refers to the container"). HTTPS is not required.

### 1.3 Ways to add the server, ranked by effort

**(a) One-click deeplink (desktop app only, confirm dialog)**
Format, from the desktop source `apps/desktop/src/lib/mcp-deeplink.ts` and the MCP config reference:
```
hermes://mcp/install?name=<NAME>&config=<BASE64URL(JSON)>
```
- `name` must match `^[A-Za-z0-9._-]{1,64}$`. `config` is base64url or standard base64 JSON, max 32 KB decoded. The JSON must be an object with a string `url` (http/https only) or a string `command`. Other server keys are allowed.
- It never installs silently. The desktop shows a dialog with the full pretty-printed config and the user must confirm. An existing name is never overwritten (the user must rename or cancel).
- The scheme is registered by the Hermes **desktop app** (electron-builder `protocols: schemes: ['hermes']`, appId `com.nousresearch.hermes`, derived from `product-identity.cjs`). CLI-only installs do not register it (unconfirmed, inferred from the source layout).
- Worked example. Config JSON:
```json
{"url":"http://127.0.0.1:31009/mcp/large","headers":{"Authorization":"Bearer <ANYTYPE_KEY>"}}
```
  Link:
```
hermes://mcp/install?name=anytype&config=eyJ1cmwiOiJodHRwOi8vMTI3LjAuMC4xOjMxMDA5L21jcC9sYXJnZSIsImhlYWRlcnMiOnsiQXV0aG9yaXphdGlvbiI6IkJlYXJlciA8S0VZPiJ9fQ
```
  (the base64 above encodes the example with a placeholder key. Anytype must generate it at runtime.)
- CORRECTED (verified in source, `mcp-install-deeplink-dialog.tsx`): the dialog merges the decoded config verbatim into the server map and calls `saveMcpServers`. No secret relocation to `.env` was found, so a literal `Authorization` header lands in config.yaml. Workaround: put `"Bearer ${ANYTYPE_API_KEY}"` in the deeplink and have Anytype write `ANYTYPE_API_KEY` to `~/.hermes/.env` separately (then it is a file write anyway, so Route 2 is simpler).
- The Electron `shell.openExternal('hermes://...')` call from the Anytype main process works if the scheme is registered. Detect it by checking the app exists (see 1.5), because there is no cheap "is scheme registered" API except `app.getApplicationNameForProtocol('hermes://')` (Electron API, macOS/Windows).

**(b) CLI, scriptable**
Verified from `hermes_cli/subcommands/mcp.py` (main, 2026-11-26):
```
hermes mcp add <name> --url <endpoint> [--auth oauth|header] [--preset X] [--connect-timeout S]
hermes mcp add <name> --command <cmd> [--env KEY=VAL ...] --args <args...>
hermes mcp list | test <name> | remove <name> | configure <name> | login <name>
```
- There is **no `--header` flag**. With `--auth header` or no auth flag it asks interactively ("Does this server require authentication?" then a password prompt for the token). So `hermes mcp add` is not fully non-interactive. For a scripted write, do (c) instead, or feed stdin (fragile, unconfirmed).
- Catalog route: `hermes mcp install <name>` for entries in `optional-mcps/` of the hermes-agent repo. See 1.7.

**(c) Config file (best for Anytype to automate)**
Path: `~/.hermes/config.yaml` (macOS/Linux), `%LOCALAPPDATA%\hermes\config.yaml` (Windows native). Key `mcp_servers`:
```yaml
mcp_servers:
  anytype:
    url: "http://127.0.0.1:31009/mcp/large"
    headers:
      Authorization: "Bearer ${ANYTYPE_API_KEY}"
```
and in `~/.hermes/.env`:
```
ANYTYPE_API_KEY=<key>
```
Extra keys: `enabled`, `timeout`, `connect_timeout`, `tools: {include, exclude}`, `lazy`, `idle_timeout_seconds`.
- stdio fallback (what anytype-hermes ships in `hermes-mcp.example.yaml`; needs Node):
```yaml
mcp_servers:
  anytype:
    command: npx
    args: ["-y", "@anyproto/anytype-mcp@2.0.1"]
    env:
      ANYTYPE_API_BASE_URL: "http://127.0.0.1:31009"
      OPENAPI_MCP_HEADERS: '{"Authorization":"Bearer <key>"}'
```
- In chat the user can also say "add the Linear MCP" and the agent shows a setup card. Not useful for us.

### 1.4 Can Anytype safely write the config? Reload?
- Format is plain YAML (not JSONC). Hermes itself rewrites config.yaml (`_save_mcp_server`), so comments may be lost when Hermes writes. Anytype should do a read-modify-write that preserves unknown keys, back up the file first, and use a YAML library that keeps comments (e.g. the `yaml` npm package's Document API).
- Reload: a **running gateway** watches config.yaml and connects new entries within about a minute. Interactive sessions: run `/reload-mcp` (or restart `hermes`). The Desktop app presumably picks up changes via its Connectors tab (unconfirmed exact behavior).
- Profiles: `hermes -p <name>` uses a separate HERMES_HOME. Anytype can only write the default profile unless the user picks one (check `~/.hermes/profiles/` exists, exact layout unconfirmed).
- Secrets: put the key in `.env`, not in config.yaml. File mode should be 0600 (unconfirmed what Hermes does).

### 1.5 Detecting Hermes
- CLI: `which hermes` / `~/.local/bin/hermes` (the installer tells the user to add `~/.local/bin` to PATH). Windows: `%LOCALAPPDATA%\hermes\bin\`.
- Data dir exists: `~/.hermes/` or `%LOCALAPPDATA%\hermes\`.
- Desktop app: appId `com.nousresearch.hermes` (variants: `hermes-light`, `hermes-bundled`). macOS bundle path assumed `/Applications/Hermes.app` (productName "Hermes", unconfirmed). Windows MSIX identity `NousResearchInc.HermesAgent`.
- URL scheme: `hermes://` (desktop app only).

### 1.6 Skills and plugins
- Agent Skills: **yes**, SKILL.md compatible with agentskills.io. Install: `hermes skills install <id|URL>` (also `/skills install ...` in chat). Local dir `~/.hermes/skills/`, external dirs via `skills.external_dirs`. Project dirs `.hermes/skills/` and `.agents/skills/` are scanned only after `hermes skills trust`.
- Plugins (Python): `hermes plugins install owner/repo --enable [--ref <40-char SHA>]`, or `hermes plugins install <catalog-name>`. They can register skills (namespace `plugin:skill`). A single bundle that carries both an MCP server and a skill is unconfirmed. MCP stays separate config. The anytype-hermes plugin itself ships a workflow skill in `skills/anytype`.
- No known `hermes://plugin/install?catalog=<name>` shape beyond what the marketplace page shows (below).

### 1.7 Marketplace / catalog
- https://hermes-agent.nousresearch.com/marketplace: about 2,684 listings (Official/Verified/Community). Each has `hermes plugins install <name>` and an "Install in Hermes" button using `hermes://plugin/install?catalog=<name>`. The page documents no submission process itself.
- **Plugin catalog** (`plugin-catalog/*.yaml` in hermes-agent): admission by PR only, human-merged, a mandatory full 40-char SHA pin, no self-updating code, owner or major contributor must submit, `hermes plugins validate` and a security scan run, the declared capabilities must match. anytype-hermes's own `docs/HERMES_PLUGIN_SUBMISSION.md` lays out the submission steps. As of 2026-11-26 there is **no** `anytype` entry in `plugin-catalog/` or `optional-mcps/` (checked via the GitHub contents API). The `anytype-hermes` repo was last pushed 2026-11-26 (it is public, although its README still says private).
- **MCP catalog** (`optional-mcps/<name>/manifest.yaml`, currently about 60 vendor-hosted entries such as notion, linear, figma, context7): same PR-gated model ("presence = Nous approval"). The manifest uses `transport: {type: http, url: ...}`, `auth: {type: oauth}`, `post_install`, `suggest` keywords. All visible entries are HTTPS vendor-hosted. A localhost-only server listed there is **unconfirmed and unlikely**. It has no OAuth and needs a user-specific local key. The `requires_env` mechanism is the only possible fit (unconfirmed for MCP manifests).
- Verdict: listing is a long-term nice-to-have, not a requirement. The deeplink or a direct config write already gives one-click.

### 1.8 anytype-hermes plugin in detail
- Repo: https://github.com/anyproto/anytype-hermes (plugin.yaml: name `anytype-platform`, **version 0.7.0**, kind: platform). Connects Anytype chats to a Hermes agent. You @-mention the bot, it researches and replies in the chat or discussion, and tool activity shows in Anytype.
- Requirements: Hermes pinned at a commit (stock, no patches since 0.6), Git, **macOS or Linux** (Windows not validated), Anytype CLI >= v0.5.0 (CLI mode) or Desktop with API v2 chat and search streams, a **separate bot account** with editor rights in each space. The bot must be invited to each space.
- Install: `hermes plugins install anyproto/anytype-hermes --enable`. The scanner returns CAUTION and asks for source review (`--enable` does not bypass this prompt).
- Setup wizard `hermes anytype setup --mode cli|desktop|external`:
  - cli: manages the Anytype CLI service and bot account itself (create or login, then join a space with an invite link). The default API is `http://127.0.0.1:31012`. HTTP MCP is auto-discovered and the key is reused, so no pasting.
  - desktop: the user signs in as the bot in the desktop app, enables Settings > Local API, creates a read/write key (all spaces or one), and then the wizard prompts for address (default `http://127.0.0.1:31009`) and key. The wizard does **not** create keys, accounts, or enable the API.
  - external: same, against a remote or other-host Anytype service. The address must be reachable from the Hermes process.
  - Later: `--resume`, `--rollback`, `--cancel`, `hermes anytype join`, `hermes anytype doctor --json`, `hermes anytype status`; finally `hermes gateway run` (or `hermes gateway install/start` for a service).
- Not a Job-A tool. Zero-touch is impossible for Job B because it needs a second account, an invitation and a gateway process. Anytype could at most open a guided checklist.
- Note: it pins `@anyproto/anytype-mcp@2.0.1` for its "wrapper" MCP option. The new native HTTP endpoint makes this obsolete for Desktop mode. The `http` MCP option is only auto-discovered for the CLI. Ask the plugin owners to accept `http://127.0.0.1:31009/mcp/large` for Desktop.

---
## 2. OPENCLAW

### 2.1 Surfaces and versions
- npm `openclaw` **2026.11.10** (GitHub release v2026.11.10 on 2026-11-25; a v2026.10.34 hotfix tag on 2026-11-26). Calendar versioning. ~395k GitHub stars.
- Install: macOS/Linux/WSL2 `curl -fsSL https://openclaw.ai/install.sh | bash`; Windows `iwr -useb https://openclaw.ai/install.ps1 | iex`; or `npm i -g openclaw@latest` (needs Node 24.16+ or 26.1+; Node 26 recommended). Then `openclaw onboard --install-daemon`.
- It runs as a **Gateway service on the user's own machine** (macOS LaunchAgent, Linux systemd user service, Windows Scheduled Task), default port 18789, bind loopback, auth required. Remote or VPS hosting is also possible, and desktop apps (macOS menu bar app, Windows Hub app) can connect to a local or remote Gateway. A remote Gateway cannot see the user's local `127.0.0.1:31009` (MCP calls originate from the Gateway host).
- Surfaces: CLI, macOS app (OpenClaw.app, DMG; no longer bundles the runtime, it expects an external `openclaw` CLI and manages a launchd service), Windows Hub app, Control UI web page (`/settings/mcp`), and chat channels.

### 2.2 MCP support
- stdio yes; streamable-http yes; `sse` is the **default** if `transport` is omitted, so always set `transport: "streamable-http"`.
- Headers: yes, with `${ENV_VAR}` interpolation (e.g. `"Bearer ${MCP_TOKEN}"`). Literal tokens work but `openclaw mcp doctor` warns about literals with fallbacks. OAuth supported (`auth: "oauth"`), static Authorization is ignored when oauth is on.
- Only `http:` and `https:` URLs are allowed. Loopback for MCP server URLs is not explicitly documented (the only documented loopback-HTTP rule concerns `gateway.publicOrigin`); no SSRF block is documented. UNCONFIRMED, test with `doctor --probe`. Verify with `openclaw mcp doctor anytype --probe`.
- Tool names are `serverName__toolName`, capped at 64 characters.

### 2.3 Ways to add
**(a) CLI**
```
openclaw mcp set anytype '{"url":"http://127.0.0.1:31009/mcp/large","transport":"streamable-http","headers":{"Authorization":"Bearer <KEY>"}}'
openclaw mcp doctor anytype --probe
```
The JSON form with `set` is documented (`openclaw mcp set <name> <json>`, one JSON object). `headers` in the JSON is documented in the transports page (`"Authorization": "Bearer <token>"`) but no `set` example with headers is shown verbatim: UNCONFIRMED end-to-end. `set` also normalizes `type:"http"` to `transport`. `add` has a `--header` flag. `openclaw mcp add <name> --url ... --transport streamable-http` also exists. It probes first and **refuses while the Gateway runs unless `--no-probe`**. Prefer `set`. When the Gateway runs, these commands send the change to it, and it owns config writes. Other subcommands: `list`, `show`, `unset`, `configure`, `reload`, `login`.

**(b) Config file**
`~/.openclaw/openclaw.json` (JSON5, comments allowed; `openclaw config file` prints the real path; override with `OPENCLAW_CONFIG_PATH`; Windows path unconfirmed):
```json5
{
  mcp: { servers: {
    anytype: {
      url: "http://127.0.0.1:31009/mcp/large",
      transport: "streamable-http",
      headers: { Authorization: "Bearer ${ANYTYPE_API_KEY}" },
    },
  } },
}
```
Strict validation: unknown keys stop the Gateway from starting, and a hot-reload with invalid config is skipped (last good config kept). The `.env` file location for `${VAR}` is unconfirmed (see the Environment variables docs page).

**(c) Plugin or bundle**
`openclaw plugins install <path|.tgz|clawhub:<pkg>|--marketplace>`. Formats: native, Codex, Claude, Cursor, and "Agent Plugins" (root `plugin.json` plus `mcp.json` using `mcpServers`/`type`). Bundles carry `skills/` and MCP together. Bundle MCP uses fixed `command` entries inside the plugin; the Agent Plugins format documents stdio only, so an HTTP bundle with a per-user token is poor. Config-level `mcp.servers` is better.

**(d) UI**: Control UI at `/settings/mcp` (alias `/mcp`). **No `openclaw://` deeplink for MCP install exists.** Source (`apps/shared/OpenClawKit/.../DeepLinks.swift`, `CatalogInstallDeepLinkTests.swift`) shows `openclaw://agent`, gateway connect/add, dashboard, and `openclaw://plugins|skills|templates/install?name=<pkg>`, which only OPEN A REVIEW PAGE for a ClawHub package in the dashboard (macOS app). Usable for a future ClawHub skill/plugin, not for MCP config.

### 2.4 Safe write, reload
- Writing via `openclaw mcp set` is the safe method because the Gateway owns the write. Direct file edit is also picked up (the Gateway watches the file, `gateway.reload.mode: hybrid` default). Docs say for MCP: "Changes apply without a restart. Only changed or removed server connections are retired." Session runtimes refresh on the next turn.
- Risks: JSON5 comments (use a JSON5-preserving writer or prefer the CLI); strict schema; named profiles (`~/.openclaw-<profile>`? unconfirmed); `openclaw mcp reload` only affects the current CLI process.

### 2.5 Detection
- `which openclaw`, `openclaw --version`; `~/.openclaw/openclaw.json` exists; macOS `~/Library/LaunchAgents/ai.openclaw.gateway.plist`; `/Applications/OpenClaw.app`. `openclaw gateway status` for running. Bundle id and Windows paths: unconfirmed.

### 2.6 Skills and marketplace
- Skills (SKILL.md): yes. `openclaw skills install <slug>`. Registry **ClawHub** (https://clawhub.ai): public, publish with `clawhub skill publish` or `clawhub package publish` (plugins need `openclaw.compat.pluginApi` and `openclaw.build.openclawVersion`). Installing plugins from it: `openclaw plugins install clawhub:<package>`.
- A community skill named **anytype** by tadas-subonis already exists on ClawHub (uses anytype-cli plus `ANYTYPE_API_KEY` in plaintext `.env`; ClawScan flagged risk). So an official one would be valuable and could supersede it.
- Security: a Feb 2026 audit flagged 341 of 2,857 skills as malicious, so a verified publisher badge matters.

---
## Verification log (2026-11-27, verifier)
| Claim | Status | Source |
|---|---|---|
| Hermes latest v0.23.4 (2026-11-24) | CONFIRMED | gh api NousResearch/hermes-agent releases/latest |
| Deeplink `hermes://mcp/install?name=&config=BASE64`, name regex, 32KB cap, http/https url or command, base64url or std base64, never installs silently, both url+command rejected | CONFIRMED (+ NEW: url AND command together are rejected) | apps/desktop/src/lib/mcp-deeplink.ts; docs mcp-config-reference |
| Deeplink literal header stays literal in config.yaml | UNCONFIRMED -> CORRECTED (verbatim save, no relocation) | mcp-install-deeplink-dialog.tsx |
| `hermes://` registered by desktop app only (`setAsDefaultProtocolClient`, electron-builder `schemes:['hermes']`); also `hermes://launch` exists | CONFIRMED | deep-link-protocol.ts, electron-builder.config.cjs |
| `hermes mcp add <name> --url --auth oauth\|header --preset --connect-timeout`, `--command --args --env`; no `--header` flag | CONFIRMED | hermes_cli/subcommands/mcp.py. NEW: also `reauth`, `catalog`, `picker`, `install <name>` |
| `${VAR}` and `${env:VAR}` interpolation in url/headers/args/env, resolved from profile secret scope (~/.hermes/.env) then process env; unset var in remote url/headers fails closed | CONFIRMED (+ `${env:VAR}` form is new) | mcp-config-reference |
| `/reload-mcp` after config change | CONFIRMED; gateway auto-watch within ~1 min not re-verified | mcp-config-reference |
| Bearer token saved as `MCP_<NAME>_API_KEY` in .env | CONFIRMED | hermes_cli/mcp_config.py |
| No `anytype` entry in plugin-catalog or optional-mcps | CONFIRMED | gh api contents listing |
| anytype-hermes v0.7.0 platform plugin, repo public (`private:false`) | CONFIRMED | plugin.yaml, repo API |
| Hermes Windows native path `%LOCALAPPDATA%\hermes\`, desktop bundle path | UNCONFIRMED (not re-checked) | - |
| OpenClaw `openclaw mcp set <name> <json>`, `add` refuses while Gateway runs unless `--no-probe`, `doctor [name] --probe [--json]`, `reload` current-CLI-process only, `unset` | CONFIRMED | docs.openclaw.ai/cli/mcp/registry |
| `transport` default is `sse` when omitted; use `streamable-http` | CONFIRMED | /cli/mcp/transports |
| Header env interpolation `Bearer ${MCP_TOKEN}`, literal-fallback warning | CONFIRMED | /cli/mcp/transports, /gateway/config-extensions |
| Config `~/.openclaw/openclaw.json` JSON5, `openclaw config file`, `OPENCLAW_CONFIG_PATH` | CONFIRMED; Windows path and .env location UNCONFIRMED | /gateway/configuration |
| Changes apply without restart; only changed/removed servers retired; takes effect next turn | CONFIRMED (with "Gateway hot reload enabled") | docs/tools/mcp.md, config-extensions |
| OpenClaw MCP deeplink | CONFIRMED NONE; only ClawHub catalog-review links `openclaw://plugins\|skills\|templates/install?name=` | DeepLinks.swift, CatalogInstallDeepLinkTests.swift |
| Loopback http://127.0.0.1 MCP URL accepted by OpenClaw | UNCONFIRMED (no documented restriction either) | docs |
| Hermes MCP marketplace accepts localhost-only user-keyed server | UNCONFIRMED, unlikely | - |
| OpenClaw v2026.11.10, Node 24.16+, install commands, ClawHub community anytype skill | NOT re-verified (taken from researcher) | - |

---
## 3. Recommendations

### Job A (Anytype tools inside the agent), zero-touch
**Hermes**
1. Anytype detects Hermes (CLI on PATH, `~/.hermes`, or the desktop app). It shows "Connect to Hermes".
2. The user picks spaces and read or read-write, then clicks Connect. Anytype mints the key via RPC.
3. Route 1 (desktop app installed): Anytype opens a `hermes://mcp/install?...` deeplink. The user clicks **Confirm** in Hermes's dialog (2 clicks in Anytype, 1 in Hermes). Needs the literal-token-in-config question resolved.
4. Route 2 (CLI or any install, preferred for reliability): Anytype writes `~/.hermes/.env` (`ANYTYPE_API_KEY`) and merges the `mcp_servers.anytype` block into `config.yaml` (backup first). A running gateway picks it up within about a minute. Otherwise Anytype shows "run `/reload-mcp` or restart Hermes". 1 click, no Hermes dialog.
5. Verify by calling `initialize` on the MCP endpoint with the new key, and optionally `hermes mcp test anytype`.

**OpenClaw**
1. Detect via `openclaw` on PATH or `~/.openclaw`.
2. Run `openclaw mcp set anytype '<json>'` from the Electron main process with the key passed via an env var for the `${ANYTYPE_API_KEY}` reference, or write the JSON5 key in the config. The Gateway applies it without restart (reload is hybrid).
3. Run `openclaw mcp doctor anytype --probe`. Show "Connected, N tools".

Fallbacks: show the copyable CLI line or YAML/JSON snippet with OS-specific path hints. Windows Hermes path is `%LOCALAPPDATA%\hermes\`.

### Job B (chat with the agent inside Anytype)
Do not automate fully. Offer a "Set up Hermes bot" page in Anytype that explains: create a bot account, invite it, enable Local API, then run `hermes plugins install anyproto/anytype-hermes --enable` and `hermes anytype setup --mode desktop`. Anytype can mint a read-write key for the bot only when the bot account is signed in on that app, which fits the CLI mode (`anytype` CLI on port 31012) better than the user's own desktop. Recommend CLI mode on a headless or always-on machine. macOS and Linux only.

### Gotchas
- Token security: a deeplink holds the token in the URL (browser history, OS URL handler logs, a clipboard). Use it only from our own app via `openExternal`, with a key restricted to selected spaces and a short expiry if offered. Prefer `${ENV}` indirection plus `.env` (mode 0600) where the harness supports it.
- Both harnesses run an MCP client on the user's machine, so loopback works. Docker, VPS and remote Gateways do not reach `127.0.0.1:31009`. Detect Docker installs (`/opt/data`) and warn.
- Anytype's endpoint does not refuse non-browser origins, and neither harness sends a browser Origin (unconfirmed for the Hermes desktop's renderer-based deeplink installer, but MCP connections come from the Python backend).
- Use tier `large` for general agents. Offer `small` for small local models, but note both harnesses allow `tools.include/exclude` (Hermes) and `toolFilter` (OpenClaw) as an alternative.
- Version minimums: Hermes MCP-HTTP and `hermes mcp add` exist in v0.23.x. Desktop deeplink handler exists in the main branch (minimum version unconfirmed). OpenClaw needs Node 24.16+. The anytype-hermes plugin pins a specific Hermes commit and needs macOS/Linux.
- Do not ship the `npx` wrapper path for these two harnesses. It needs Node and puts the token in an env JSON blob.
- Listings: for Hermes, submit `anytype` to `optional-mcps` only if a manifest can express a local, user-keyed server (unconfirmed), and the anytype-hermes plugin to `plugin-catalog` (steps in its HERMES_PLUGIN_SUBMISSION.md). For OpenClaw, publish an official `anytype` skill on ClawHub (a SKILL.md that explains the MCP setup, or a plugin that installs it).

---
## Sources (all seen 2026-11-26)
- https://github.com/anyproto/anytype-hermes (README, docs/INSTALL.md, docs/SETUP.md, docs/HERMES_PLUGIN_SUBMISSION.md, plugin.yaml v0.7.0, hermes-mcp.example.yaml; last push 2026-11-26)
- https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp
- https://hermes-agent.nousresearch.com/docs/reference/mcp-config-reference (deeplink format)
- https://hermes-agent.nousresearch.com/docs/user-guide/features/plugins, /features/skills, /getting-started/installation
- https://hermes-agent.nousresearch.com/marketplace
- https://github.com/NousResearch/hermes-agent (release v0.23.4; `hermes_cli/subcommands/mcp.py`, `hermes_cli/mcp_config.py`, `apps/desktop/src/lib/mcp-deeplink.ts`, `apps/desktop/electron/deep-link-protocol.ts`, `apps/desktop/electron-builder.config.cjs`, `plugin-catalog/README.md`, `optional-mcps/notion/manifest.yaml`)
- https://docs.openclaw.ai/plugins/bundles, /cli/mcp, /cli/mcp/transports, /cli/mcp/registry, /gateway/configuration, /gateway/config-extensions, /gateway/config-gateway, /install, /platforms/macos
- npm `openclaw@2026.11.10`; GitHub openclaw/openclaw releases (v2026.11.10)
- https://clawhub.ai/skill/anytype (community skill) and https://raw.githubusercontent.com/openclaw/clawhub/main/README.md (publishing)


---
## Recommendation for Anytype
**Primary zero-touch route (both harnesses): direct write, no deeplink.**
- Hermes: user clicks "Connect to Hermes" in Anytype, picks spaces and read/read-write. Anytype mints the key by RPC, backs up and merges `mcp_servers.anytype` (`url: http://127.0.0.1:31009/mcp/large`, `headers.Authorization: "Bearer ${ANYTYPE_API_KEY}"`) into `~/.hermes/config.yaml`, and writes `ANYTYPE_API_KEY` into `~/.hermes/.env` (0600). It then runs `initialize` against the endpoint to confirm. User sees "Connected"; for an open interactive session show "type /reload-mcp" (a running gateway should pick it up on its own, unverified).
- OpenClaw: Anytype runs `openclaw mcp set anytype '{"url":"http://127.0.0.1:31009/mcp/large","transport":"streamable-http","headers":{"Authorization":"Bearer <KEY>"}}'` (Gateway owns the write, hot reload, no restart), then `openclaw mcp doctor anytype --probe` and shows the result. Test the loopback and header form once before shipping; if the CLI is absent, fall back to editing `~/.openclaw/openclaw.json` with a JSON5-aware writer.
**Fallback:** Hermes deeplink `hermes://mcp/install?...` for the desktop app (user must confirm; token ends up literal in config.yaml unless `${ANYTYPE_API_KEY}` is used with a separate .env write). Else show a copyable snippet and OS path.
**OS notes:** Hermes macOS/Linux `~/.hermes/`, Windows `%LOCALAPPDATA%\hermes\` (unconfirmed); OpenClaw `~/.openclaw/openclaw.json`, Windows path unconfirmed (use `openclaw config file`).
**Gotchas:** remote/Docker/VPS installs cannot reach host loopback; Hermes deeplink needs the desktop app; `hermes mcp add` has no header flag and prompts interactively; OpenClaw omitted `transport` defaults to `sse` (breaks); `openclaw mcp add` refuses while the Gateway runs unless `--no-probe`; Hermes desktop deeplink is hostile-input-confirmed, so no silent install; anytype-hermes (chat-with-bot) is a separate, advanced flow; do not use npx wrapper. Listings: no Hermes/OpenClaw route for a localhost server; optional: official ClawHub skill and anytype-hermes plugin-catalog PR.
