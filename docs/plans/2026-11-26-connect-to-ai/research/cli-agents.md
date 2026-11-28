# VERIFIED 2026-11-27 - Connecting Anytype to other coding CLIs/agents (Gemini CLI, OpenCode, Goose, Amp, Kiro, Warp, Pi, Factory Droid)

Research date: 2026-11-26. Anytype target: Streamable HTTP, `http://127.0.0.1:31009/mcp/large`, header `Authorization: Bearer <key>`. No OAuth / no `.well-known` on the Anytype side.

Legend: "confirmed" = read in live official docs/source/CLI help today. "unconfirmed" = not verified from a live primary source.

## 0. Cross-cutting findings

| Tool | Latest seen | Static Bearer header on HTTP entry | `$ENV` in headers | Deeplink that can carry URL+header | CLI one-liner with header | Live reload of config | Localhost OK |
|---|---|---|---|---|---|---|---|
| Gemini CLI | 0.71.1 (2026-11-24) | yes (`headers`, `-H`) | yes, `$VAR`/`${VAR}` (source) | none found | yes | unconfirmed (restart safest) | yes (local process) |
| OpenCode | 2.4.2 (2026-11-26); v1 line still common | yes (`headers`) | `{env:NAME}` | none found | v2: yes (`--header NAME=VALUE`); v1: interactive only | unconfirmed | yes |
| Goose | 1.61.1 (2026-11-26) | yes (`headers` in YAML, `header=` in deeplink) | no (literal) | YES `goose://extension?...&header=` | no header flag (`goose configure` interactive) | new session needed | yes |
| Amp | n/a (no version found) | yes (`headers`) | `${VAR}` | none found | `amp mcp add` shows no header flag in docs (unconfirmed) | unconfirmed | yes for local entries; NOT for cloud-stored "remote" definitions |
| Kiro (IDE+CLI) | IDE 1.5.11 / CLI >=3.5.0 mentioned | yes (`headers`) | `${VAR}` (needs approval) | YES `https://kiro.dev/launch/mcp/add?name=&config=` (headers in config: NOT documented on the share page; test before shipping) | `kiro-cli mcp add` has NO header flag | YES, saving mcp.json hot-reloads | yes ("HTTP for localhost") |
| Warp | 0.2026.11.04 installed here | yes (UI `headers`, JSON `headers`) | unconfirmed | NO (only `warp://settings/mcp?autoinstall=<gallery name>`; docs mention no MCP deeplinks) | none (only agent skill `/agent-add-mcp`) | global ~/.warp/.mcp.json AUTO-SPAWNS by default (docs) | yes (local agents) |
| Pi | 1.6.1 (2026-11-25; researcher's 0.71.1 was wrong) | yes (`headers`) | `${VAR}` and `!command` | none | yes (`pi mcp add --url --header K=V`) | `/reload` | yes |
| Factory Droid | version unconfirmed | yes (`headers`) | `${NAME}` | none found | yes (`droid mcp add ... --header`) | YES, auto-reloads on mcp.json change | yes |

Gotcha shared by all: several clients auto-start an OAuth flow when a remote server answers 401 (Gemini, OpenCode, Droid, Pi, Warp). Anytype has no OAuth metadata, so always send the header from the first request; where a flag exists, disable OAuth explicitly (`oauth: false` in OpenCode, `--no-oauth` in Droid). Pi only runs OAuth when no `Authorization` header is configured.

Local machine probe (this Mac, no secrets read): gemini 0.32.1 (old), opencode 1.1.29 (old, v1 schema), pi 0.70.6, Warp.app present (bundle id `dev.warp.Warp-Stable`, URL scheme `warp`). goose, amp, kiro, droid: not installed. `~/.gemini/settings.json` top-level keys: theme, selectedAuthType, general, security (no mcpServers). So "app installed but old version" is a real case: version minimums matter (see per-tool).

---

## 1. Gemini CLI (google-gemini/gemini-cli)

### 1.1 Surfaces / version
Terminal CLI (macOS/Linux/Windows). Latest release v0.71.1 (2026-11-24, `gh release list`). IDE integrations exist (VS Code companion) but MCP config is shared via `settings.json` (unconfirmed detail). No desktop app or web.

### 1.2 MCP support
- stdio (`command`), Streamable HTTP (`httpUrl`), SSE (`url`). Transport chosen by which key is set; no `type` key documented.
- Static headers: `headers` object (applies to `url` and `httpUrl`).
- Env expansion in headers: confirmed in source (`packages/core/src/tools/mcp-client.ts` runs `expandEnvVars` over each header value with `$VAR`/`${VAR}`, `%VAR%` on Windows; missing -> empty string). It uses a "sanitizedEnv"; whether token-looking var names are stripped from it is unconfirmed. Docs only mention expansion for `env`. A literal header is safest.
- OAuth: yes, auto-discovery on 401 for SSE/HTTP; needs browser + localhost callback; tokens in `~/.gemini/mcp-oauth-tokens.json`.
- Per-server `trust: true` bypasses tool-call confirmations. stdio servers only connect in trusted folders (`gemini trust`); HTTP unaffected.
- Localhost: runs in the local CLI process, so yes. No HTTPS requirement found.

### 1.3 Ways to add (ranked by effort)
1. CLI (1 command, no restart needed for next launch). NOTE default scope is `project`; pass `-s user`:
```bash
gemini mcp add -s user --transport http \
  -H "Authorization: Bearer <KEY>" \
  anytype http://127.0.0.1:31009/mcp/large
```
Flags confirmed by local `gemini mcp add --help` (0.32.1): `-s/--scope user|project`, `-t/--transport stdio|sse|http`, `-H/--header`, `-e/--env`, `--timeout`, `--trust`, `--description`, `--include-tools`, `--exclude-tools`.
2. Extension (gallery/one-command install, can bundle skills): `gemini extensions install <github-url|path>`; manifest `gemini-extension.json` with `mcpServers` (all server options except `trust`). A `settings` array with `{name, description, envVar, sensitive}` prompts the user; `sensitive:true` is stored in the system keychain, others in `.env` in the extension dir. Whether `${SETTING}` can be interpolated into `headers` is unconfirmed (docs only list `${extensionPath}`, `${workspacePath}`, `${/}`).
```json
{
  "name": "anytype",
  "version": "1.0.0",
  "description": "Anytype notes and objects",
  "mcpServers": {
    "anytype": {
      "httpUrl": "http://127.0.0.1:31009/mcp/large",
      "headers": { "Authorization": "Bearer <KEY>" }
    }
  }
}
```
Since the key is per user, a static public extension cannot hold it; Anytype would generate a local extension dir (see 1.4) or use `gemini extensions link <path>`.
3. Config file (`httpUrl` + `headers`):
   - User: macOS/Linux `~/.gemini/settings.json`; Windows `%USERPROFILE%\.gemini\settings.json` (unconfirmed for Windows spelling; same relative layout).
   - Project: `<repo>/.gemini/settings.json`.
```json
{ "mcpServers": { "anytype": {
  "httpUrl": "http://127.0.0.1:31009/mcp/large",
  "headers": { "Authorization": "Bearer <KEY>" },
  "timeout": 30000 } } }
```
4. In-session: `/mcp` (status), `/mcp auth <server>`, `/mcp enable|disable <name>`. No UI form for adding. No deeplink found (unconfirmed absence).

### 1.4 Can Anytype write the config?
`settings.json` is a shared file (theme, auth, etc.) - merge, never overwrite: read JSON, set `mcpServers.anytype`, write back atomically. Whether the file is plain JSON or tolerates comments: unconfirmed (assume plain JSON). Reload: not documented; tell user to start a new `gemini` session (running sessions read config at startup). Preferred safest write path: run `gemini mcp add -s user ...` via Electron main (CLI does the merge itself).
Risks: user vs project scope, and 0.32.1-era installs may lack features: `mcp add` exists there already (confirmed locally).

### 1.5 Detection
`gemini` on PATH (`/opt/homebrew/bin/gemini` here; npm global on Windows/Linux, `where gemini`/`command -v gemini`), `~/.gemini/` exists, `gemini --version`. Installed by npm/Homebrew; no URL scheme.

### 1.6 Skills / plugins
- Agent Skills: `gemini skills install <git-url|path> [--scope] [--path]`, `skills list|link|enable|disable|uninstall` (confirmed locally). Skills live under `~/.gemini/skills/` (exists locally).
- Extensions bundle MCP + `skills/<name>/SKILL.md` (+ context file, hooks, themes). Install: `gemini extensions install <git url>` (`--auto-update`, `--pre-release`, `--consent`, `--skip-settings` flags per docs); `link <path>` for local dirs; `validate`, `config`.

### 1.7 Marketplace
Extension gallery at geminicli.com/extensions (listing page fetch exceeded size limit; submission rules - public GitHub repo + manifest + possibly a `gemini-cli-extension` topic - are UNCONFIRMED). Extensions are git-repo based; the extension description is displayed in the gallery. A listing for an extension whose server is localhost-only is plausible (the server URL is just config) but unconfirmed.

### 1.8 Recommendation
Zero-touch: Anytype main process runs `gemini mcp add -s user --transport http -H "Authorization: Bearer <KEY>" anytype http://127.0.0.1:31009/mcp/large` (after minting the key, picking spaces); if `gemini` is not on PATH but `~/.gemini/settings.json` exists, merge JSON directly. User sees: "Connect to Gemini CLI" -> spaces/permissions -> "Done, start a new gemini session". 2 clicks. Optional second step: `gemini skills install` of an Anytype skill.
Fallback: show a copyable one-liner/JSON snippet.
Gotchas: scope default is project (must pass `-s user`); the key sits in plaintext in `~/.gemini/settings.json`; 0.32.1-era versions work for `mcp add`.

---

## 2. OpenCode (anomalyco/opencode, opencode.ai)

### 2.1 Surfaces / version
Terminal TUI (macOS/Linux/Windows), plus a desktop app and web/IDE surfaces (unconfirmed detail). Latest v2.4.2 (2026-11-26). IMPORTANT: two config schemas coexist. This Mac has v1.1.29.

### 2.2 MCP support
- local (stdio) and `remote` (Streamable HTTP; docs say "absolute Streamable HTTP endpoint"); OAuth with dynamic client registration + PKCE, tokens in `~/.local/share/opencode/mcp-auth.json`. `oauth: false` disables auto-detection.
- `headers` map; env substitution `{env:NAME}` (shell `$NAME` is NOT expanded in JSON).
- Servers connect automatically; reload behaviour undocumented (unconfirmed - restart safest).
- Localhost: yes, local process.

### 2.3 Ways to add
Schema v2 (docs on opencode.ai today; server names under `mcp.servers`, flag is `disabled`):
```jsonc
{ "$schema": "https://opencode.ai/config.json",
  "mcp": { "servers": { "anytype": {
    "type": "remote",
    "url": "http://127.0.0.1:31009/mcp/large",
    "oauth": false,
    "headers": { "Authorization": "Bearer <KEY>" } } } } }
```
Schema v1 (still what third-party guides and the installed 1.1.29 use; `enabled` flag; names directly under `mcp`):
```jsonc
{ "$schema": "https://opencode.ai/config.json",
  "mcp": { "anytype": {
    "type": "remote",
    "url": "http://127.0.0.1:31009/mcp/large",
    "enabled": true,
    "oauth": false,
    "headers": { "Authorization": "Bearer <KEY>" } } } }
```
CLI (v2 docs): `opencode mcp add <name> --url <url> [--header NAME=VALUE]... [--global]`:
```bash
opencode mcp add anytype --global --url http://127.0.0.1:31009/mcp/large \
  --header 'Authorization=Bearer <KEY>'
```
The doc example is `--header 'CONTEXT7_API_KEY={env:CONTEXT7_API_KEY}'` (NAME=VALUE form); the exact handling of a value containing a space is unconfirmed. Without `--global` it writes the PROJECT config. v1 (local `opencode mcp add --help`): no flags, interactive prompts only - so CLI route is not scriptable on v1.
Config file locations: global `~/.config/opencode/opencode.json(c)` (docs); project `opencode.json(c)` or `.opencode/opencode.json(c)`; `/etc/opencode/opencode.json` managed. Windows path unconfirmed (assume `%USERPROFILE%\.config\opencode\`). Env overrides (`OPENCODE_CONFIG`) exist (grep hit, unconfirmed detail).
No deeplink, no in-app form for custom remote servers found (TUI `/mcps` lists/toggles; unconfirmed that it adds).

### 2.4 Can Anytype write the config?
File is JSONC (comments allowed) -> do NOT parse/rewrite with plain JSON; use a JSONC-aware edit (jsonc-parser `modify`) or fall back to the CLI on v2. Must detect schema version first (`opencode --version`: major 1 vs 2; or inspect an existing `mcp.servers` key). Project config overrides global and replaces the whole same-name server object.

### 2.5 Detection
`opencode` on PATH (`~/.opencode/bin/opencode` here), `~/.config/opencode/`, `~/.local/share/opencode/`. Desktop-app bundle id / URL scheme: unconfirmed.

### 2.6 Skills / plugins
Agent Skills: `SKILL.md` in `~/.config/opencode/skills`, `~/.claude/skills`, `~/.agents/skills` (global) and `.opencode/skills`, `.claude/skills`, `.agents/skills` (project) - confirmed in docs. Plugins (`plugins/` dir, npm) exist; a bundle of MCP+skill: unconfirmed. Dropping a skill folder is the "install".

### 2.7 Marketplace
No MCP marketplace found (unconfirmed absence). Plugins are npm/config based.

### 2.8 Recommendation
Zero-touch: detect version; v2 -> `opencode mcp add anytype --global --url ... --header 'Authorization=Bearer <KEY>'`; v1 or CLI unavailable -> JSONC-aware merge into `~/.config/opencode/opencode.json` using the matching schema, always `oauth:false`. Optionally copy an Anytype `SKILL.md` into `~/.config/opencode/skills/anytype/`. Tell user to restart opencode. Gotchas: schema split v1/v2, JSONC, project-vs-global scope, key in plaintext (or use `{env:ANYTYPE_API_KEY}` only if Anytype also sets a persistent env var - not recommended).

---

## 3. Goose (aaif-goose/goose; formerly block/goose)

### 3.1 Surfaces / version
Desktop app (Electron) + CLI (`goose`), macOS/Windows/Linux. Latest v1.61.1 (2026-11-26). Repo moved to org `aaif-goose`.

### 3.2 MCP support
stdio, Streamable HTTP (`type: streamable_http`), builtin, plus OAuth (pre-registered client fields `client_id`, `client_secret_key`, `scopes`). Static headers: yes - `headers:` map in YAML and `header=` param in deeplink (source). Bug #13390 (closed) - with >1 headers only first kept its value; use a single `Authorization` header. Localhost: yes.

### 3.3 Ways to add
1. Deeplink (confirmed from `ui/desktop/src/components/settings/extensions/deeplink.ts` source; the official docs page does not list `header`, the deeplink-generator mentions headers). Params: `url`, `type=streamable_http` (only implied: remote branch is used whenever `url` present), `name` (required), `id`, `description`, `timeout`, repeated `header=NAME=VALUE`, repeated `env=KEY=` (values blanked). The header VALUE is `decodeURIComponent`'d a second time in code, so double-encode the value:
```
goose://extension?type=streamable_http&id=anytype&name=Anytype&description=Anytype%20notes&timeout=300&url=http%3A%2F%2F127.0.0.1%3A31009%2Fmcp%2Flarge&header=Authorization%3DBearer%2520<KEY_PERCENT_ENCODED_TWICE>
```
Behavior: if headers or env present, Goose opens the Extensions settings view with the config pre-filled (`showEnvVars:true`) and the user confirms/saves; without headers it installs immediately. Modal states "trusted/untrusted/blocked" depend on an allowlist (`GOOSE_ALLOWLIST`) for stdio commands; remote URL trust handling unconfirmed. After install: "Start a new chat session". Security: key appears in URL, OS process args and possibly shell history/logs.
2. Config file: macOS/Linux `~/.config/goose/config.yaml`; Windows `%APPDATA%\Block\goose\config\config.yaml` (docs). Keys per source/docs:
```yaml
extensions:
  anytype:
    name: Anytype
    description: Anytype notes and objects
    type: streamable_http
    uri: http://127.0.0.1:31009/mcp/large
    headers:
      Authorization: Bearer <KEY>
    enabled: true
    timeout: 300
```
3. `goose configure` -> Add Extension -> "Remote Extension (Streamable HTTP)" (interactive), or Desktop UI Extensions -> Add custom extension (fields URL, headers, env).
Goose secret store/keychain is used for provider keys, `secrets.yaml` when no keyring; extension headers are stored in plain config.yaml (unconfirmed otherwise).

### 3.4 Can Anytype write it?
YAML shared with all settings; merge with a YAML round-tripping lib (comments lost with naive libs). New sessions pick it up; running sessions do not. Desktop and CLI share the file.

### 3.5 Detection
macOS app bundle `Goose.app` in /Applications (bundle id unconfirmed), URL scheme `goose://` registered by Desktop (confirmed in source: deeplink protocol scripts); `goose` on PATH; config dir above. Windows: `%LOCALAPPDATA%` install (unconfirmed).

### 3.6 Skills/plugins
Skills support: unconfirmed (not verified). Recipes exist (`recipe_deeplink.rs`). Extension directory exists at goose-docs.ai (`/extensions`) for submitting built-in MCP servers; submission process (PR to repo docs) unconfirmed.

### 3.7 Marketplace
"Extensions directory" on goose-docs.ai; deeplink generator at goose-docs.ai/deeplink-generator. Localhost-only listing: unconfirmed (directory entries are mainly npx/uvx stdio servers). The npm stdio server `@anyproto/anytype-mcp` could be listed.

### 3.8 Recommendation
Zero-touch: Anytype opens the `goose://extension?...&header=...` link (via `shell.openExternal`) -> Goose shows pre-filled extension -> user clicks save (2 clicks). More robust alternative: write `config.yaml` extension entry directly (0 extra clicks, but then tell user to start a new session). Gotchas: key in URL; one header only (bug); double-encode header value; `+` in key must be `%2B` in outer encoding.

---

## 4. Amp (ampcode.com; Sourcegraph)

### 4.1 Surfaces / version
CLI (`amp`) and editor extensions; web/"orbs" cloud agents (news items, Aug-Oct 2026). Version number not found.

### 4.2 MCP support
- Local entries (`amp.mcpServers` in settings) run from the user's machine: command/args/env, or `url` (+ `headers`). SSE and streamable (July 2025 news). Env expansion `${VAR_NAME}`.
- `amp mcp remote ...` stores a definition at ampcode.com (personal/workspace/project) - cloud executes it; localhost NOT reachable from it (inference; docs do not say). Do NOT use for Anytype.
- OAuth via CIMD / dynamic registration; redirect `http://localhost:8976/oauth/callback`; `amp mcp oauth login|logout`.
- Workspace entries (`.amp/settings.json`) require `amp mcp approve <name>`; user settings and `--mcp-config` do not.

### 4.3 Ways to add
1. Config: user `~/.config/amp/settings.json` (docs; Windows path unconfirmed), workspace `.amp/settings.json`:
```json
{ "amp.mcpServers": { "anytype": {
  "url": "http://127.0.0.1:31009/mcp/large",
  "headers": { "Authorization": "Bearer <KEY>" } } } }
```
2. CLI: `amp mcp add anytype http://127.0.0.1:31009/mcp/large` (confirmed form; docs show no header flag for `add`; third-party guides show `--header "Authorization=Bearer ..."` - unconfirmed; `--headers` and `--secret-headers` are documented only for `amp mcp remote add`). So Anytype should write the settings file for the header.
3. Skill-bundled: skill dir with `SKILL.md` + sibling `mcp.json` (or `mcpServers` in frontmatter); tools hidden until the skill loads. `amp skill add <github|git|path> [--global]` installs.
4. No deeplink found; no in-app form for local entries (unconfirmed).
Secret handling: `headers` may be marked "Secret" for remote definitions; for local file it is plaintext (or `${VAR}`).

### 4.4 Write safety
settings.json is the main settings file with many `amp.*` keys; merge. JSONC (comments) acceptable? unconfirmed. Reload: unconfirmed (restart `amp` thread safest).

### 4.5 Detection
`amp` on PATH (npm/`@sourcegraph/amp`), `~/.config/amp/` exists, VS Code extension `sourcegraph.amp` (unconfirmed id).

### 4.6 Skills/plugins
Agent Skills: locations `~/.config/agents/skills/`, `~/.agents/skills/`, `~/.config/amp/skills/`, `.agents/skills/`, also `.claude/skills`; install `amp skill add <source> [--global]`; skills can bundle MCP servers. Plugins exist (News "Plugins, Everywhere" 2026-05-28; "Global Plugins and Skills" 2026-08-11) - format unconfirmed.

### 4.7 Marketplace
No MCP marketplace confirmed.

### 4.8 Recommendation
Zero-touch: Anytype merges `amp.mcpServers.anytype` into `~/.config/amp/settings.json` (JSON merge; never `amp mcp remote`). Alternatively install an Anytype skill with bundled `mcp.json` via `amp skill add --global` (the key still has to be written locally). Gotchas: local not cloud definition; user-scope avoids approval prompt; key in plaintext.

---

## 5. Kiro (kiro.dev; AWS) - IDE, CLI, Web/Mobile

### 5.1 Surfaces / version
IDE (macOS/Windows/Linux), Kiro CLI (`kiro-cli`), Web and Mobile (Android app Nov 2026). IDE changelog top entry 1.5.11 (page undated); `mode` OAuth keys need IDE >= 1.4.236 / CLI >= 3.5.0. The Web/Mobile surfaces use remote servers only (cannot reach localhost).

### 5.2 MCP support
stdio; remote `url` with optional `headers` ("Remote servers use HTTPS, or HTTP for localhost"). `${VAR}` in `env`/`headers`, but only approved variables are expanded (user is prompted) -> do not use env vars; put the literal header. OAuth optional block. Per-server `disabled`, `autoApprove`, `disabledTools`. Localhost: yes in IDE/CLI.

### 5.3 Ways to add
1. One-click install link (confirmed from kiro.dev/docs/mcp/share):
`https://kiro.dev/launch/mcp/add?name=<encodeURIComponent(name)>&config=<encodeURIComponent(JSON.stringify(config))>`
Both params required; example config in docs: `{url, disabled:false, autoApprove:[]}`. Kiro shows a confirmation dialog listing command/args and "hides environment variable and header values" (implies headers are supported in `config`; headers example not shown in docs - treat as unconfirmed until tested). The web link opens the `kiro://` handler of the IDE (exact custom scheme path unconfirmed; docs only say `kiro://`).
```js
const config = { url: "http://127.0.0.1:31009/mcp/large",
  headers: { Authorization: "Bearer <KEY>" }, disabled: false, autoApprove: [] };
const link = "https://kiro.dev/launch/mcp/add?name=" + encodeURIComponent("anytype")
  + "&config=" + encodeURIComponent(JSON.stringify(config));
```
Concern: a link on a normal https URL leaves the machine (browser hop through kiro.dev), exposing the key to a third-party host; prefer opening the `kiro://` form or writing the file. Exact `kiro://` URL: unconfirmed.
2. Config file (merged, workspace wins), schema confirmed:
   - User `~/.kiro/settings/mcp.json` (Windows `%USERPROFILE%\.kiro\settings\mcp.json`, standard mapping, unconfirmed spelling)
   - Workspace `.kiro/settings/mcp.json`
```json
{ "mcpServers": { "anytype": {
  "url": "http://127.0.0.1:31009/mcp/large",
  "headers": { "Authorization": "Bearer <KEY>" } } } }
```
3. CLI: `kiro-cli mcp add --name anytype --url http://127.0.0.1:31009/mcp/large --scope global [--oauth-mode ...]`. Confirmed flags: `--name --command --args --url --oauth-mode --oauth-client-id --scope workspace|global --agent --env --timeout --disabled --force`. NO header flag (CloudBees guide also says add headers manually) -> write the file for the header.
4. IDE command palette: "Kiro: Open user MCP config (JSON)".
5. Power (`plugin.json` + `mcp.json` + `skills/`); install from GitHub/GitLab URL, local folder, "Add to Kiro" on kiro.dev/powers. Agent Plugins servers are managed internally and do not appear in mcp.json.

### 5.4 Write safety
mcp.json is plain JSON, shared among all servers; LIVE reload: "Saving an MCP config file reloads it without restarting your session; only added/removed/edited servers restart; takes effect between turns" - best of the group. Agent configs can restrict servers (`mcpServers`, `includeMcpJson`): if the user's agent excludes the global mcp.json the server won't show.

### 5.5 Detection
IDE: macOS `/Applications/Kiro.app` (bundle id unconfirmed); CLI `kiro-cli` on PATH; `~/.kiro/` directory; `kiro` command; URL scheme `kiro://`.

### 5.6 Skills/plugins
Agent Skills supported (kiro.dev/docs/skills); Powers = `plugin.json` (Agent Plugins format) or legacy `POWER.md`; bundle `mcp.json` + `skills/<n>/SKILL.md`. Install via UI, GitHub URL, local path, or "Add to Kiro" link (deeplink format for powers not documented).

### 5.7 Marketplace
Registry: submit via `https://kiro.dev/registry/submit/?type=mcp`, public GitHub repo, reviewed. Powers curated at kiro.dev/powers. Localhost-only listing: the entry is a server definition; a public npm stdio package (`@anyproto/anytype-mcp`) fits; an HTTP localhost server fitting the registry: unconfirmed.

### 5.8 Recommendation
Zero-touch: Anytype writes `~/.kiro/settings/mcp.json` (merge JSON). Kiro hot-reloads; user does nothing more - 1 click in Anytype. If the file path/`~/.kiro` is missing but Kiro is installed, open the `kiro://` install link (confirmation dialog = 2 clicks). Fallback: install link / copy-paste JSON. Gotchas: header must be literal; "approved env var" prompts; Kiro Web/Mobile cannot reach localhost.

---

## 6. Warp (warp.dev) - terminal with Agents

### 6.1 Surfaces / version
Desktop terminal app macOS/Windows/Linux (installed here 0.2026.11.04; weekly releases), plus "Warp Agent CLI" and cloud agents. MCP in the app = "local agents".

### 6.2 MCP support
Streamable HTTP or SSE (URL) and stdio; `headers` key-value (for Authorization); OAuth in-browser for servers that need it (not supported for cloud agents). Config pasted in UI accepts "Configurations from most MCP clients". `~/.mcp-auth` stores tokens. Localhost: yes for local agents.

### 6.3 Ways to add
1. UI: Settings > Agents > MCP servers (or Command Palette "Open MCP Servers") > "+ Add" > "Streamable HTTP or SSE Server (URL)" > fields `url`, `headers`; or paste JSON:
```json
{ "mcpServers": { "anytype": {
  "url": "http://127.0.0.1:31009/mcp/large",
  "headers": { "Authorization": "Bearer <KEY>" } } } }
```
2. Deeplink: `warp://settings/mcp` (opens the page), `warp://settings/mcp?autoinstall=<name>` only installs a GALLERY server by name - cannot carry custom URL/headers. So: copy JSON to clipboard + open `warp://settings/mcp`, user pastes (3 clicks).
3. File-based: global `~/.warp/.mcp.json`, project `.warp/.mcp.json`; Warp Agent CLI uses `~/.warp_cli/.mcp.json` on macOS. Project-scoped servers need manual start/approval; global servers from third-party agents need "auto-spawn" enabled in settings. Whether Warp's own `~/.warp/.mcp.json` auto-spawns without that toggle: unconfirmed. Linux CLI reportedly ignores global file (third-party report).
4. No CLI add command found.

### 6.4 Write safety
Warp may also keep UI-defined servers in its own DB; the file route is a documented separate source (unconfirmed live reload). Warp adds approval gates around file-based servers.

### 6.5 Detection
macOS bundle id `dev.warp.Warp-Stable` (confirmed locally; Preview/Dev variants have other ids), URL scheme `warp`, `/Applications/Warp.app`. Windows `%LOCALAPPDATA%\Programs\Warp` / Linux `warp-terminal` binary: unconfirmed. Logs dir for MCP (mac): `~/Library/Group Containers/2BBY89MBSN.dev.warp/Library/Application Support/dev.warp.Warp-Stable/mcp`.

### 6.6 Skills/plugins
Warp has Agent Skills/rules support (unconfirmed detail). No bundled plugin format found.

### 6.7 Marketplace
Gallery exists (autoinstall by name); submission process unconfirmed.

### 6.8 Recommendation
Zero-touch is not available. Best: write `~/.warp/.mcp.json` (confirmed docs path) AND/OR copy JSON + open `warp://settings/mcp` for the guided paste; label Warp as "semi-automatic". Gotchas: auto-spawn toggle, cloud agents cannot reach localhost, Warp is mainly a terminal, so many users do not want it listed first.

---

## 7. Pi (earendil-works/pi, pi.dev) - `pi` coding agent

### 7.1 Surfaces / version
Terminal CLI/TUI + RPC/SDK modes (cross-platform; Windows docs, Termux docs). v1.6.1 (2026-11-25, `gh release list`; earlier 0.71.1 figure was wrong); installed 0.70.6 here, whose `pi --help` lists no `mcp` command, so older installs need the file route. Native MCP exists in this version (older Pi had none and relied on extensions like `pi-mcp-adapter`, which replaces built-in `/mcp` if installed).

### 7.2 MCP support
stdio + Streamable HTTP; legacy SSE rejected. `headers` map with `${ENV}` and `!command` forms (command must be the whole value). OAuth for HTTP servers without `Authorization` header (CIMD, DCR). Localhost: yes. Config file keys: `url, headers, oauth, timeout, enabled, exposure, toolExposure, description` (+ `command,args,env,cwd`).

### 7.3 Ways to add
1. CLI (confirmed in `docs/cli.md`):
```bash
pi mcp add anytype --url http://127.0.0.1:31009/mcp/large \
  --header "Authorization=Bearer <KEY>" \
  --description "Anytype notes and objects"
```
`--header KEY=VALUE` is repeatable; alternative `--bearer-token-env-var NAME` (needs env var); `-l/--local` for project file; `add` does not connect; `pi mcp list` validates. Whether `--header` splits on the first `=` only (value with `=`): unconfirmed - Bearer keys are usually safe.
2. File: user `~/.pi/agent/mcp.json`, project `.pi/mcp.json` (only after project trust). Windows: `%USERPROFILE%\.pi\agent\mcp.json` (unconfirmed spelling).
```json
{ "mcpServers": { "anytype": {
  "url": "http://127.0.0.1:31009/mcp/large",
  "headers": { "Authorization": "Bearer <KEY>" },
  "description": "Anytype notes and objects" } } }
```
3. In-session `/mcp` (inspect, sign in, reconnect, enable/disable); `/reload` applies external edits.
4. Package (npm/git) can bundle extensions + skills + prompts + themes (not documented to bundle `mcp.json`; unconfirmed).

### 7.4 Write safety
Plain JSON; Pi itself rewrites the file for exposure/enabled changes "without replacing unrelated content". Reload: `/reload` in a running session, or new session. Server name chars: letters, digits, `_`, `-` only.

### 7.5 Detection
`pi` on PATH (`/opt/homebrew/bin/pi` here; npm global), `~/.pi/agent/` exists.

### 7.6 Skills/plugins
Agent Skills spec implemented; `SKILL.md` directories; `--skill <path>`; discovery dirs (`~/.pi/agent/skills`, `.pi/skills` - exact paths unconfirmed, `~/.pi/agent/` has an `edge-to-edge` skill dir locally). Packages: `pi install npm:<pkg>|git:github.com/<o>/<r>@<ref>|./path` (`-l` for project), `pi list/remove/update`.

### 7.7 Marketplace
No MCP marketplace; packages via npm/git. A pi.dev packages gallery: unconfirmed.

### 7.8 Recommendation
Zero-touch: Anytype runs `pi mcp add anytype --url ... --header "Authorization=Bearer <KEY>"` (user-level, safe merge by Pi itself); fallback merge `~/.pi/agent/mcp.json`. If Pi session is running tell the user to `/reload`. Optionally `pi install` an Anytype skill package. Gotchas: SSE unsupported (fine), server name charset, key plaintext in mcp.json (alternative `!command` reading a file/keychain is possible).

---

## 8. Factory Droid (factory.ai / docs.factory.com)

### 8.1 Surfaces / version
`droid` CLI (macOS/Linux/Windows; curl script, PowerShell, Homebrew cask, npm), Factory desktop app and `droid exec`. Version unconfirmed.

### 8.2 MCP support
stdio, `http`, `sse`. `headers` with `${NAME}` expansion (not in url/command/args; unset var -> connection fails). OAuth auto-discovery, tokens in system keyring; `oauth:false` disables; `--no-oauth` flag. Localhost: yes (CLI local). Warning: never put Authorization in project `.factory/mcp.json` (committed).

### 8.3 Ways to add
1. CLI (confirmed in docs.factory.com/cli/configuration/mcp):
```bash
droid mcp add anytype http://127.0.0.1:31009/mcp/large --type http \
  --header "Authorization: Bearer <KEY>" --no-oauth
```
Writes user config. `--header` repeatable `"KEY: VALUE"`.
2. File `~/.factory/mcp.json` (user), `.factory/mcp.json` ancestors/project:
```json
{ "mcpServers": { "anytype": {
  "type": "http",
  "url": "http://127.0.0.1:31009/mcp/large",
  "headers": { "Authorization": "Bearer <KEY>" },
  "oauth": false,
  "disabled": false } } }
```
3. `/mcp` in a session: "+ Add MCP server from registry" (curated list); `droid mcp auth`. No deeplink found; no custom-server GUI documented (the Factory App may have one; unconfirmed).
Live reload: YES, docs.factory.com: Droid reloads automatically when an mcp.json changes. File on disk never rewritten with expanded values.

### 8.4 Write safety
Plain JSON, shared; `droid mcp add/remove` only manage user entries. Windows path `%USERPROFILE%\.factory\mcp.json` (guides confirm `.factory` under USERPROFILE).

### 8.5 Detection
`droid` on PATH, `~/.factory/`; Factory desktop app bundle id unconfirmed.

### 8.6 Skills/plugins
Skills `~/.factory/skills/<n>/SKILL.md` and `.factory/skills/`, compatibility `.agents/skills` (confirmed); `/skills`. Plugins: `.factory-plugin/plugin.json` + `skills/` + `mcp.json` + commands/droids/hooks at plugin root; install `droid plugin install <plugin@marketplace> --scope user|project`; `droid plugin marketplace add <owner/repo|git url|path>` (`#ref`, `@sha` pin). A plugin bundling the Anytype MCP + skill is the one-package route, but the key is per-user (plugin `mcp.json` would need `${ANYTYPE_API_KEY}` env or a local plugin written by Anytype).

### 8.7 Marketplace
Plugin marketplaces = any git repo/path; MCP registry list inside `/mcp`; submission process for the registry: unconfirmed.

### 8.8 Recommendation
Zero-touch: run the `droid mcp add ... --header ... --no-oauth` command from Anytype main process. Fallback: merge `~/.factory/mcp.json`. Gotchas: don't use project scope; always disable OAuth; key in plaintext.

---

## 9. What Anytype should implement (summary across these 8)

| Tool | Route | User clicks (after key mint) | Needs restart |
|---|---|---|---|
| Kiro | write `~/.kiro/settings/mcp.json` (hot reload) | 0 | no |
| Gemini CLI | `gemini mcp add -s user ...` | 0 | new session |
| Pi | `pi mcp add ... --header` | 0 | `/reload` |
| Droid | `droid mcp add ... --header ... --no-oauth` | 0 | no (auto reload) |
| OpenCode | `opencode mcp add --global ...` (v2) / JSONC merge (v1) | 0 | restart |
| Amp | merge `amp.mcpServers` in `~/.config/amp/settings.json` | 0 | restart thread |
| Goose | `goose://extension?...&header=...` or YAML write | 1 (confirm) | new session |
| Warp | write `~/.warp/.mcp.json` / clipboard + `warp://settings/mcp` | 1-3 | approval toggles |

Common design: key mint -> "Connect to <tool>" -> choose "Automatic" (write/exec) or "Show me" (copyable command per OS). Prefer invoking the tool's own CLI to merge (it owns the file format and validation); fall back to guarded JSON/JSONC/YAML merge with atomic write + backup; always scope to user level; never project level. Detect via PATH lookup + config dir + (macOS) bundle id/URL scheme.

---

## Sources (URL; seen 2026-11-26)

- https://raw.githubusercontent.com/google-gemini/gemini-cli/main/docs/tools/mcp-server.md and https://geminicli.com/docs/tools/mcp-server/ (Gemini MCP docs)
- https://raw.githubusercontent.com/google-gemini/gemini-cli/main/docs/extensions/reference.md (extensions manifest/settings/skills)
- gemini-cli source: packages/core/src/tools/mcp-client.ts, packages/core/src/utils/envExpansion.ts (via `gh api`); release v0.71.1 (2026-11-24)
- Local `gemini --version` 0.32.1, `gemini mcp add --help`, `gemini extensions --help`, `gemini skills --help`
- https://opencode.ai/docs/mcp-servers/ (v2 docs); repo anomalyco/opencode `services/site/src/docs/content/{mcp-servers,config,skills}.mdx` and `services/site/src/docs/v1/content/mcp-servers.mdx` (via `gh api`); releases v2.4.2 (2026-11-26); local `opencode --version` 1.1.29, `opencode mcp --help`
- https://github.com/aaif-goose/goose: `ui/desktop/src/components/settings/extensions/deeplink.ts`, `documentation/docs/getting-started/using-extensions.md`, `documentation/docs/guides/config-files.md`, issue #13390; https://goose-docs.ai/docs/getting-started/using-extensions/ ; https://goose-docs.ai/deeplink-generator/ ; release v1.61.1 (2026-11-26)
- https://ampcode.com/docs/customize/mcp ; https://ampcode.com/docs/customize/skills ; https://ampcode.com/news (list of 2026 posts)
- https://kiro.dev/docs/mcp/ ; /docs/mcp/configuration/ ; /docs/mcp/servers/ ; /docs/mcp/share/ ; /docs/reference/cli-commands/ ; /docs/powers/installation/ ; https://kiro.dev/changelog/ide/ (search snippet, undated) ; https://kiro.dev/registry/submit/?type=mcp
- https://docs.warp.dev/agents/capabilities/mcp/ ; https://docs.warp.dev/terminal/more-features/uri-scheme/ ; https://docs.warp.dev/agents/cli/configuration/ (search snippet); local /Applications/Warp.app Info.plist (version 0.2026.11.04, scheme `warp`, id dev.warp.Warp-Stable)
- https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/docs/{mcp,cli,skills,packages}.md ; release v0.71.1 (2026-11-24); local `pi --help`, `pi --version` 0.70.6
- https://docs.factory.com/cli/configuration/mcp ; /cli/configuration/plugins ; /cli/configuration/skills ; install-method notes from search results (github.com/factory-ai/factory, third-party guides - lower confidence)

Unconfirmed list (needs a live test before shipping): Kiro install-link `headers` support and exact `kiro://` URL; Goose remote-URL trust modal behavior and bundle ids; (Warp auto-spawn now CONFIRMED on by default for global Warp file); OpenCode desktop app/URL scheme, Windows config path, hot reload; Amp Windows path, `--header` on `amp mcp add`, JSONC tolerance; Droid reload and desktop app; Gemini live reload, sanitizedEnv behavior, gallery submission rules; Pi `--header` splitting on first `=`; Goose and Warp skills support.


---

## Verification log (2026-11-26/27)

| Claim | Status | Source |
|---|---|---|
| Gemini `gemini mcp add -s user -t http -H "Authorization: Bearer K" anytype URL`; default scope project | CONFIRMED (local 0.32.1 --help + docs) | local help; google-gemini/gemini-cli docs/tools/mcp-server.md |
| Gemini `httpUrl` + `headers` in `~/.gemini/settings.json` | CONFIRMED | same doc |
| Gemini latest v0.71.1 (2026-11-24) | CONFIRMED | `gh release list -R google-gemini/gemini-cli` |
| Gemini extension `settings` sensitive -> keychain | CONFIRMED; interpolation of setting into headers UNCONFIRMED | docs/extensions/reference.md |
| Gemini gallery submission rules | UNCONFIRMED (page too large to fetch) | - |
| OpenCode v2 `mcp.servers.<name>`, type remote, url, headers, oauth, `disabled` | CONFIRMED | https://opencode.ai/docs/mcp-servers/ |
| OpenCode v2 `mcp add <name> --url --header --global`; no --global = project | CONFIRMED; header value with space UNCONFIRMED; global path not stated on docs page | same |
| OpenCode v1.1.29 `mcp add` interactive only | CONFIRMED | local --help |
| OpenCode v2.4.2 | CONFIRMED | gh releases |
| Goose deeplink `goose://extension?url=&type=streamable_http&id=&name=&description=&timeout=&header=K=V` | CONFIRMED in source; header value decoded twice (double-encode); official docs omit `header` | goose deeplink.ts; using-extensions.md |
| Goose config paths (mac/Linux, Windows `%APPDATA%\Block\goose\config\config.yaml`) | CONFIRMED | documentation/docs/guides/config-files.md |
| Goose v1.61.1 | CONFIRMED | gh releases |
| Amp `amp.mcpServers` url+headers in `~/.config/amp/settings.json`; workspace needs approve | CONFIRMED | https://ampcode.com/docs/customize/mcp |
| Amp `amp mcp add` no header flag; `amp mcp remote add` forbids Authorization in headers | CONFIRMED / new detail | same |
| Amp reload, Windows path | UNCONFIRMED | same |
| Kiro install link `https://kiro.dev/launch/mcp/add?name=&config=`; no headers or kiro:// on page | CONFIRMED | https://kiro.dev/docs/mcp/share/ |
| `kiro://kiro.mcp/add?name=&config=` with headers | UNCONFIRMED officially (third-party only) | https://protocol-launcher.vercel.app/apps/kiro.html |
| Kiro `~/.kiro/settings/mcp.json`, url+headers, HTTP localhost OK, hot reload | CONFIRMED | https://kiro.dev/docs/mcp/configuration/ |
| `kiro-cli mcp add` flags, no header flag; `mcp import --file` exists (new) | CONFIRMED | https://kiro.dev/docs/reference/cli-commands/ |
| Warp global `~/.warp/.mcp.json` auto-spawns by default | CORRECTED (unconfirmed -> confirmed); other providers' files (`~/.claude.json`, `~/.codex/config.toml`, `~/.agents/.mcp.json`) need the third-party auto-spawn toggle | https://docs.warp.dev/agents/capabilities/mcp/ |
| Warp has no MCP deeplink/CLI | CONFIRMED (undocumented) | same |
| Pi version 0.71.1 | CORRECTED -> v1.6.1 (2026-11-25) | gh releases earendil-works/pi |
| Pi `pi mcp add --url --header K=V`, file `~/.pi/agent/mcp.json`, `/reload`, OAuth only without Authorization header | CONFIRMED (docs); local 0.70.6 lacks `mcp` command | packages/coding-agent/docs/{cli,mcp}.md |
| Droid `droid mcp add NAME URL --type http --header "K: V" --no-oauth`; `~/.factory/mcp.json` | CONFIRMED | https://docs.factory.com/cli/configuration/mcp |
| Droid live reload | CORRECTED (unconfirmed -> auto reload) | same |

## Recommendation for Anytype

Primary zero-touch route (after minting the key and choosing spaces/permissions): use each tool's own CLI when present and new enough, else guarded merge of the user-level file (backup + atomic write).
- Gemini: `gemini mcp add -s user -t http -H "Authorization: Bearer <KEY>" anytype http://127.0.0.1:31009/mcp/large`; user starts a new session.
- Kiro: merge `mcpServers.anytype` {url, headers} into `~/.kiro/settings/mcp.json`; hot reload, nothing else.
- Droid: `droid mcp add anytype <url> --type http --header "Authorization: Bearer <KEY>" --no-oauth`; auto reload.
- Pi: `pi mcp add anytype --url ... --header "Authorization=Bearer <KEY>"` if `pi mcp` exists, else merge `~/.pi/agent/mcp.json`; user runs `/reload`.
- OpenCode: v2 CLI `mcp add --global`; v1 JSONC-aware merge with `mcp.<name>` + `enabled` + `oauth:false`; restart.
- Amp: merge `amp.mcpServers.anytype` into `~/.config/amp/settings.json` (never `amp mcp remote`).
- Goose: write `config.yaml` extension entry (0 clicks) or open the `goose://extension?...&header=` link (1 confirm).
- Warp: write `~/.warp/.mcp.json`; fallback clipboard JSON + `warp://settings/mcp`.

Fallback: copyable per-OS command/JSON with the key filled in.
OS notes: Windows uses %USERPROFILE% equivalents (spelling unconfirmed except Goose `%APPDATA%\Block\goose\config`); run CLIs via the user's login-shell PATH since Electron lacks it on macOS.
Gotchas: user scope only; disable OAuth where a flag exists (Anytype has no OAuth metadata); key stored plaintext in each tool's config; Kiro Web/Mobile, Amp cloud definitions and Warp cloud agents cannot reach 127.0.0.1; honor a user-changed port. Marketplaces (Kiro registry, Goose directory, Gemini gallery, Droid marketplaces) suit stdio/npm entries; none confirmed to accept localhost-only HTTP with a per-user key.
