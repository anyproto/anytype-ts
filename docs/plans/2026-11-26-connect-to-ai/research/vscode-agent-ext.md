# VS Code agent extensions with their own MCP config: Cline, Roo Code, Kilo Code

Researched 2026-11-26. Live sources only; anything not confirmed is marked "unconfirmed".
Test machine: has Roo Code 3.54.0 installed in VS Code (no Cline, no Kilo, no `cline`/`kilo` CLI on PATH). Roo's `mcp_settings.json` was checked for top-level keys only (`mcpServers`, empty). No secrets were read.

## 0. Executive findings (read first)

1. **Roo Code is dead.** Official sunset notice: all Roo Code products shut down 2026-05-15, the extension repo was archived (confirmed: `gh api repos/RooCodeInc/Roo-Code` -> `archived: true`, last push 2026-05-15). Recommended successor in the notice is Cline; community forks exist (Zoo Code, `zoocodeorganization.zoo-code`, unconfirmed from official docs; Kilo Code is also a lineage fork). Installed Roo copies keep their local config file, but the project is frozen. Recommendation: support it as "legacy, best effort" (one file merge, no promotion), or skip.
2. **Cline changed a lot in 4.x.** Extension is now v4.1.28 (source on main 2026-11-26; Open VSX 4.1.28). The VS Code extension, CLI and Desktop now share ONE MCP file: `~/.cline/data/settings/cline_mcp_settings.json` (all OSes, `%USERPROFILE%\.cline\...` on Windows). The old extension-globalStorage file is auto-migrated into it. Override via `CLINE_MCP_SETTINGS_PATH`, `CLINE_DIR`, `CLINE_DATA_DIR`. The file is watched live (chokidar), so no restart is needed. This makes Cline the easiest of the three: one stable path, no VS Code path variants.
3. **Cline is now four products**: VS Code-family extension (and JetBrains), CLI (`npm i -g cline`, v3.0.76), Cline Desktop (macOS, Windows beta), Kanban. They are separate installs, so detect each separately.
4. **Kilo Code** (extension `kilocode.kilo-code` v7.8.36, CLI `@kilocode/cli` v7.8.32, binary `kilo`) was rewritten on an opencode base. Config key is `mcp` (not `mcpServers`), global file `~/.config/kilo/kilo.json(c)`, shared by extension and CLI. Remote servers are `type: "remote"` with `headers`. `kilo mcp add NAME --url URL --header "K=V"` exists and is non-interactive. Headers can use `{env:VAR}`.
5. **No deeplink / URL scheme to add an MCP server exists for any of the three** (checked Cline `SharedUriHandler` and Kilo `registerUriHandler`; see section 3). VS Code's own `vscode:mcp/install` is for VS Code's native MCP, not these extensions.
6. All three accept `http://127.0.0.1` URLs (they run MCP client code locally in the extension host / CLI process; the vendor cloud does not execute the connector). Streamable HTTP + static `Authorization` header is supported in all three.

## 1. Surfaces, platforms, versions

### Cline (saoudrizwan.claude-dev)
| Surface | Exists | Version / source |
|---|---|---|
| VS Code extension (also Cursor, Windsurf, VSCodium, Antigravity via Open VSX) | yes | v4.1.28 (`apps/vscode/package.json`, Open VSX 4.1.28), engine `vscode ^1.101.0` |
| JetBrains plugin | yes | JetBrains Marketplace plugin 28247 |
| CLI | yes, `npm install -g cline` (Node 20+, 22 recommended), bin `cline` | npm `cline` 3.0.76 |
| Cline Desktop | yes, macOS and Windows (Windows beta), cline.bot/desktop | docs page `usage/cline-desktop` |
| Kanban | preview, `npx kanban` | not relevant |
| Web | none (the cline.bot MCP marketplace page is a catalog, install goes through the extension) | |

### Roo Code (RooVeterinaryInc.roo-cline)
Only the VS Code extension (last 3.54.0 locally; no newer release found). Shut down 2026-05-15, repo archived. No CLI/desktop. Forks: Zoo Code (unconfirmed details).

### Kilo Code (kilocode.kilo-code)
| Surface | Exists | Version |
|---|---|---|
| VS Code extension (also Open VSX 7.8.36) | yes | 7.8.36, engine `vscode ^1.105.1` |
| CLI `kilo` / `kilocode` | yes, `npm i -g @kilocode/cli` (also curl, brew, bun, choco, scoop, AUR, GitHub binaries) | 7.8.32 |
| JetBrains | `packages/kilo-jetbrains` exists in repo (status unconfirmed) | |
| Web / cloud agent | cloud sessions exist (URI `vscode://kilocode.kilo-code/kilocode/s/<id>`) | not relevant |

## 2. MCP support

| | Cline 4.x | Roo Code (frozen) | Kilo Code 7.x |
|---|---|---|---|
| stdio | yes | yes | yes (`type: "local"`, `command` array) |
| Streamable HTTP | yes, `type: "streamableHttp"` | yes, `type: "streamable-http"` | yes (`type: "remote"`, tries Streamable HTTP first, falls back to SSE) |
| SSE (legacy) | yes; **default if `type` omitted** | yes | fallback |
| Static headers | yes (`headers`) | yes (`headers`) | yes (`headers`) |
| Env-sourced secrets | `${env:VAR}` expanded recursively over the whole server config (code: `envExpansion.ts`, applied in McpHub on connect), so works in `headers` | `${env:VAR}` documented only in `args`; in `headers` unconfirmed | `{env:VAR}` documented in `headers` (VS Code extension too) |
| Keychain / prompted inputs | none found | none found | none found |
| OAuth | CLI: yes (`cline mcp` wizard "Authorize OAuth"). VS Code: code comment says "VSCode doesn't implement OAuth flows yet", but `McpOAuthManager.ts` exists (unconfirmed) | no | yes, auto-starts if server advertises it; `"oauth": false` disables |
| Reaches 127.0.0.1 | yes (URL validator only requires a valid URL; note McpHub creates an OAuth provider for every remote transport, so a 401 from Anytype could trigger OAuth discovery attempts: unverified, test with a bad key) | yes (unconfirmed explicitly, same architecture) | yes (`URL.canParse` only) |
| HTTPS required | no | no | no |

Anytype implication: Anytype has no OAuth/.well-known today. Kilo auto-tries OAuth discovery for remote servers; issue Kilo-Org/kilocode #12763 (header-authed servers listed "OAuth-capable" with a misleading error) is now CLOSED, but `oauth:false` is still the safe setting (CLI code `oauthServers()` skips servers with `oauth === false`). Safe approach is to write `"oauth": false` for the anytype entry (documented option). Unconfirmed that a 401/404 on `.well-known` is otherwise harmless.

## 3. Every way to add the server, ranked by user effort

Target entry: name `anytype`, URL `http://127.0.0.1:31009/mcp/large`, header `Authorization: Bearer <KEY>`.

### 3.1 Cline

**(a) Anytype writes the shared file (best, zero-touch).** Path (all OSes): `~/.cline/data/settings/cline_mcp_settings.json`.
macOS/Linux `$HOME/.cline/data/settings/cline_mcp_settings.json`; Windows `%USERPROFILE%\.cline\data\settings\cline_mcp_settings.json`. Honors `CLINE_MCP_SETTINGS_PATH`, else `CLINE_DATA_DIR/settings/...`, else `CLINE_DIR/data/settings/...` (source: `sdk/packages/shared/src/storage/paths.ts`, `mcp-settings-legacy-migration.ts`).
```json
{
  "mcpServers": {
    "anytype": {
      "type": "streamableHttp",
      "url": "http://127.0.0.1:31009/mcp/large",
      "headers": { "Authorization": "Bearer <ANYTYPE_API_KEY>" },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```
Both this flat form and the CLI's nested form (`"transport": {"type":"streamableHttp","url":...}`) are accepted by the extension (schema union in `services/mcp/schemas.ts`). Do NOT omit `type`: it defaults to SSE.

**(b) CLI command** (if `cline` is installed; writes the same file):
```bash
cline mcp add anytype http://127.0.0.1:31009/mcp/large --transport http --header "Authorization: Bearer <KEY>" --yes
# also: cline mcp install <name> ...  (alias), cline mcp remove anytype, cline config mcp --json
```
Header syntax here is `Name: value` (parser splits at the first `:`). Docs: docs.cline.bot/mcp/mcp-overview.

**(c) In-app UI**: MCP Servers icon -> **Remote Servers** tab -> Server Name, Server URL, Transport "Streamable HTTP (recommended)", **Add Server**. The docs do not show a headers field in this form (unconfirmed), so the token cannot be set there; use the **Configure** tab -> **Configure MCP Servers** to edit JSON. Cline Desktop: Customize -> Installed view; Marketplace tab for skills/MCP/plugins.

**(d) Marketplace one-click**: catalog at `https://cline.github.io/marketplace/catalog.json` (203 entries seen: 149 mcp, 38 skill, 16 plugin). Each MCP entry carries `install.args` and a `command` such as `cline mcp install adobe-for-creativity --transport http https://adobe-creativity.adobe.io/mcp`. See section 7.

**(e) Deeplink**: none for MCP. Cline's URI handler (`apps/vscode/src/services/uri/SharedUriHandler.ts`) handles only `/openrouter`, `/requesty`, `/auth`, `/auth/oca`, `/task`, `/lg-task`, `/hicap`. Scheme is `vscode://saoudrizwan.claude-dev/<path>` (`vscode-insiders://`, `cursor://` etc. for forks). `/task?prompt=...` could start a chat task but would put prompts, not config, in; do not use for tokens.

### 3.2 Roo Code (legacy)
Global file (VS Code globalStorage, extension id `rooveterinaryinc.roo-cline`), file `settings/mcp_settings.json`. Verified locally on macOS: `~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json` (also `custom_modes.yaml` there).
- Windows: `%APPDATA%\Code\User\globalStorage\rooveterinaryinc.roo-cline\settings\mcp_settings.json`
- Linux: `~/.config/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json`
(Windows/Linux derived from VS Code's globalStorage convention, not independently verified; Insiders = `Code - Insiders`, VSCodium = `VSCodium`, Cursor = `Cursor`.)
Project file: `<workspace>/.roo/mcp.json` (wins over global on name clash).
```json
{
  "mcpServers": {
    "anytype": {
      "type": "streamable-http",
      "url": "http://127.0.0.1:31009/mcp/large",
      "headers": { "Authorization": "Bearer <ANYTYPE_API_KEY>" },
      "disabled": false,
      "alwaysAllow": []
    }
  }
}
```
Required `type` is exactly `"streamable-http"` (note hyphen, different from Cline). No CLI, no deeplink for MCP. UI: MCP settings view -> Edit Global MCP / Edit Project MCP (opens the JSON). Roo had a marketplace feature (docs "features/marketplace") but it is shut down with the product.

### 3.3 Kilo Code
**(a) Anytype writes global config** `~/.config/kilo/kilo.json` (or `kilo.jsonc`; the extension and CLI share it. Also read: `opencode.json[c]`, `config.json`; `~/.kilo/`, `~/.kilocode/` config dirs). Windows path for `~/.config/kilo`: unconfirmed (docs list the same tilde path for all OSes; likely `%USERPROFILE%\.config\kilo`). Project: `./kilo.json`, `./.kilo/kilo.json`. Enterprise managed dir wins over everything (`/etc/kilo/`, `/Library/Application Support/kilo/`, `%ProgramData%\kilo\`).
```jsonc
{
  "mcp": {
    "anytype": {
      "type": "remote",
      "url": "http://127.0.0.1:31009/mcp/large",
      "headers": { "Authorization": "Bearer <ANYTYPE_API_KEY>" },
      "oauth": false,
      "enabled": true
    }
  }
}
```
(`oauth: false` documented as per-server disable. Env variant: `"Authorization": "Bearer {env:ANYTYPE_API_KEY}"`.)

**(b) CLI**:
```bash
kilo mcp add anytype --url http://127.0.0.1:31009/mcp/large --header "Authorization=Bearer <KEY>"
```
`--header` is `KEY=VALUE` split at the first `=` (source `packages/opencode/src/cli/cmd/mcp.ts`). Writes global config via jsonc-preserving edits (`applyEdits`, so comments survive). Without a name it goes interactive.

**(c) In-app UI**: settings gear -> Agent Behaviour -> MCP Servers -> Add Server, choose "Remote (HTTP)"; UI changes are written to the config file.

**(d) Marketplace** repo `Kilo-Org/kilo-marketplace`, see section 7. **(e) Deeplink**: only `vscode://kilocode.kilo-code/kilocode/{s/<id>|switch|model}`; no MCP install.

## 4. Can Anytype safely write/merge the config? Reload? Risks

| | Cline | Roo | Kilo |
|---|---|---|---|
| Live re-read | **Yes**: chokidar watcher, awaitWriteFinish 100 ms, atomic-write aware; reconnects only if the connection fingerprint changed (McpHub.ts) | VS Code FileSystemWatcher present in McpHub.ts; behavior unconfirmed in practice | Docs silent on hand-edit reload (unconfirmed). UI edits apply instantly. Assume "reload VS Code window or restart `kilo`" unless tested |
| Restart action if needed | none | Command Palette "Developer: Reload Window" | Reload Window / restart CLI; exact action unconfirmed |
| Concurrency | Cline itself rewrites the file (OAuth state, toggles) under a lock dir `<file>.lock` (stale after 10 s) and writes atomically via temp+rename. Anytype should do read-modify-write with temp+rename, touch only `mcpServers.anytype`, retry on parse failure | normal file | jsonc-aware CLI; Anytype should preserve comments (use a JSONC edit lib or shell out to `kilo mcp add`) |
| Format risks | strict JSON; keep unknown keys (`oauth`, `metadata`, `remoteConfigured`) | strict JSON | **JSONC possible** (`kilo.jsonc`): comments and trailing commas; also if both `kilo.json` and `kilo.jsonc` exist, which one to edit? Prefer an existing file; else create `kilo.json` |
| Scope/profile | single global file for ext+CLI+Desktop; project servers not auto-trusted | global + `.roo/mcp.json` | global, project, `KILO_CONFIG`, managed (enterprise) overrides; project `kilo.json` can shadow |
| Sandboxing | none; plain home-dir file. Env override vars may relocate it: check them first | VS Code Flatpak/Snap: `~/.var/app/com.visualstudio.code/config/Code/...` or `~/snap/code/common/.config/Code/...` (unconfirmed), Store-less on macOS | n/a |

Also: Cline enterprise "remote config" can force/block MCP servers and the legacy marketplace (`mcpMarketplaceEnabled`), which can strip local servers. Treat a missing entry after write as possible policy.

Token placement: the key is stored in plaintext in a user-readable file (chmod 600 where possible). Safer variant for Cline and Kilo: put `${env:ANYTYPE_API_KEY}` / `{env:ANYTYPE_API_KEY}` in config and set the env var, but GUI-launched VS Code on macOS does not inherit shell profile vars (needs `launchctl setenv` + restart), so plaintext file is the pragmatic zero-touch choice. Say so in UI.

## 5. Detection

| Check | Cline | Kilo | Roo |
|---|---|---|---|
| Extension dir (VS Code) | `~/.vscode/extensions/saoudrizwan.claude-dev-*` | `~/.vscode/extensions/kilocode.kilo-code-*` | `~/.vscode/extensions/rooveterinaryinc.roo-cline-*` (verified locally: 3.41.3 and 3.54.0 present) |
| Other editors | `~/.vscode-insiders/extensions`, `~/.vscode-oss/extensions` (VSCodium), `~/.cursor/extensions`, `~/.windsurf/extensions` (the last two unconfirmed paths) | same | same |
| Windows | `%USERPROFILE%\.vscode\extensions\...` | same | same |
| Reliable | `code --list-extensions` (needs `code` on PATH; absent here) or `~/.vscode/extensions/extensions.json` (identifier.id field; verified format) | same | same |
| Globalstorage dir | `.../globalStorage/saoudrizwan.claude-dev/` (legacy, pre-4.x) | n/a (uses `~/.config/kilo`) | `.../globalStorage/rooveterinaryinc.roo-cline/` |
| CLI | `cline` on PATH, `~/.cline/` exists | `kilo` / `kilocode` on PATH, `~/.config/kilo/` exists | none |
| Desktop app | Cline Desktop bundle id / install path: **unconfirmed** | | |
| URL scheme probe | not useful (vscode://) | | |

Detection by `~/.cline` existence does not distinguish extension vs CLI vs Desktop. The shared MCP file means writing it once serves all three Cline surfaces, so exact surface detection only matters for messaging.

## 6. Skills and plugins

- **Cline**: Agent Skills (`SKILL.md` with `name` matching dir and `description`) supported. Global: `~/.cline/skills/<name>/SKILL.md` (`C:\Users\<user>\.cline\skills\` on Windows); project: `.cline/skills/`, `.clinerules/skills/`, `.claude/skills/`. Managed from the Skills tab in the extension; a Marketplace lists skills too. Anytype can just drop the folder. Plugins (`cline plugin install <url|git|npm:pkg|path>`) apply only to SDK/CLI/Kanban, **not** the VS Code extension (docs warning). No MCP+skill bundle format that installs both in one step except a marketplace entry that lists both.
- **Kilo**: Agent Skills at `{skill,skills}/<name>/SKILL.md` inside any config dir (`~/.config/kilo/skills/`, `~/.kilo/skills/`, `.kilo/skills/`, legacy `.kilocode/`), plus `skills.paths`/`skills.urls` in config. Plugins: `kilo plugin <npm-module> [-g]`, manifest `PLUGIN.yaml` in the marketplace. The Kilo marketplace has a "companion skills" concept: an MCP entry can list `skills` that install with it (needs client bundle support).
- **Roo**: custom modes (`custom_modes.yaml`), no SKILL.md support found (unconfirmed).

## 7. Marketplaces

### Cline
- Catalog `https://cline.github.io/marketplace/catalog.json` is fetched by the VS Code extension and Cline Desktop (code: `marketplace-helpers.ts`, `MARKETPLACE_CATALOG_URL`). Entry types: `mcp`, `skill`, `plugin`; official plugins repo `cline/plugins`.
- **Submission** (cline/mcp-marketplace README, issues active, many submissions on 2026-11-26): open a GitHub issue with the "MCP server submission" template: (1) GitHub repo URL (subdirectory of a monorepo OK), (2) 400x400 PNG logo, (3) reason. Test first by giving Cline only your README.md / optional `llms-install.md`. Review criteria: community adoption, developer credibility, project maturity, security. Low-star repos allowed but vetted; "a couple of days".
- Whether the issue process still feeds the new catalog (the repo's last commit is 2025-06-24 but issues keep arriving) is **unconfirmed**; the catalog JSON schema (id, type, install.args/command, repo, author, verified) suggests entries are now generated elsewhere.
- **Localhost-only listing**: no catalog entry with `127.0.0.1`/`localhost` MCP found (scan of 203 entries, only a plugin mentioning a "localhost live viewer"). Install flow is `cline mcp install <id> --transport http <url>`; the installer warns when args contain `<...>` placeholders, so a listing for a localhost server that needs a user token would install an unauthenticated entry. Feasible but low value: the user would still need the key. A listing could point to a stdio entry `npx -y @anyproto/anytype-mcp` once the proxy ships (needs Node). Verdict: optional discovery channel, not the install route.

### Kilo
- `Kilo-Org/kilo-marketplace` (last commit 2026-11-03): `mcps/<name>/MCP.yaml`, `skills/<name>/SKILL.md`, `agents/`, `plugins/` (`PLUGIN.yaml`). Submit by PR following CONTRIBUTING.md. Requirements: real value, documented setup, secrets via env vars/`{{PLACEHOLDER}}`, multiple install options when possible. Remote entry template (marketplace MCP.yaml format, NOT the kilo.json config format which uses `remote`) uses `"type": "streamable-http"` + `"url"` + `"headers": {"Authorization": "Bearer {{API_TOKEN}}"}` with prompts for the placeholder. Optional `suggest_for` (file patterns / VS Code extension ids) and `skills` companions.
- In-app marketplace UI in the VS Code extension: CONFIRMED to exist (source `packages/kilo-vscode/webview-ui/src/components/marketplace/`, `context/marketplace-session.tsx`). Whether it reads `Kilo-Org/kilo-marketplace` live is not verified.
- Localhost-only server: schema permits any URL; no explicit rule found against localhost (unconfirmed). Reviewers may reject something that needs a local desktop app; an entry with `prerequisites: ["Anytype desktop app running"]` is plausible.

### Roo
Marketplace discontinued with the product.

## 8. Recommendation

**Zero-touch (Cline, Kilo; also covers Cline CLI and Desktop):**
1. In Anytype: "Connect to Cline" button. Detect Cline (extension dir or `~/.cline`). Show only the spaces picker plus read / read-write plus optional expiry; click "Connect".
2. Anytype mints the key via its internal RPC, then merges `mcpServers.anytype` (shape in 3.1a) into `~/.cline/data/settings/cline_mcp_settings.json` (atomic write, preserve other keys, honor `CLINE_MCP_SETTINGS_PATH`).
3. Cline hot-reloads within about a second: no restart. UI says "Done. Open Cline and ask about your notes." Clicks: 1 to open the dialog, 1 to confirm = 2 clicks.
4. Same for Kilo: if `kilo` is on PATH, run `kilo mcp add anytype --url ... --header "Authorization=Bearer KEY"` (jsonc-safe, no parsing risk) else edit `~/.config/kilo/kilo.json(c)` with a JSONC-aware edit. Add `"oauth": false`. Tell the user to run "Developer: Reload Window" (or restart `kilo`) unless a live-reload test shows it is unnecessary (must test; unconfirmed).
5. Optionally drop a `anytype` skill folder into `~/.cline/skills/` and `~/.config/kilo/skills/` (SKILL.md that explains tool tiers and search patterns).

**Fallback:** copy-paste JSON/CLI command shown in Anytype with the key pre-filled (3.1b/3.3b as one-liners), plus an "Open config file" button. For Cline users on the extension without the file, create it.

**Roo:** write the global file only if `rooveterinaryinc.roo-cline` is detected and label it "Roo Code (discontinued)". Use `type: "streamable-http"`. Reload: unconfirmed; tell user to reload the window.

**Gotchas**
- Cline `type` MUST be `streamableHttp`; omitting it means SSE and the connection fails against Anytype's JSON-only HTTP endpoint. Roo needs `streamable-http`; Kilo needs `remote` under `mcp`. Three different shapes.
- Plaintext bearer token in a user file: create with 0600 on macOS/Linux, store the minimum scope (selected spaces, read-only by default), recommend expiry. Never put the key in a deeplink (none exists anyway) or in a catalog entry.
- Port: the URL must follow the user's configured Anytype port (31009 default; 31012 for headless anytype-cli). Re-write the entry if the port changes.
- Cline `autoApprove: []` means every tool call prompts the user; for read-only keys consider offering to pre-approve read tools (names unconfirmed, tier `large` tool names must be listed).
- Enterprise policy files (Cline remote config, Kilo managed dir) can override.
- Versions: Cline 4.x (the file move and hot reload are verified in 4.1.28 source; users on 3.x would still use the globalStorage path `.../globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`, so also check that legacy path and write to both if the legacy file exists and `~/.cline` does not). Kilo 7.x (older 5.x/`.kilocode/mcp.json` + `mcpServers` format is legacy).
- Kilo OAuth probing against a no-OAuth server (issue #12763) is mitigated by `"oauth": false`.

## Sources (all fetched 2026-11-26)
- Cline MCP docs: https://docs.cline.bot/mcp/configuring-mcp-servers (redirects to /mcp/mcp-overview); source `cline/cline` `docs/mcp/mcp-overview.mdx`, `docs/cli/cli-reference.mdx`, `docs/getting-started/installing-cline.mdx`, `docs/usage/cline-desktop.mdx`, `docs/customization/skills.mdx`, `docs/customization/plugins.mdx` (main @ 2026-11-26)
- Cline source (main, v4.1.28): `apps/vscode/package.json`, `apps/vscode/src/services/mcp/McpHub.ts`, `.../schemas.ts`, `.../settingsLock.ts`, `apps/vscode/src/hosts/vscode/mcp-settings-legacy-migration.ts`, `apps/vscode/src/utils/envExpansion.ts`, `apps/vscode/src/services/uri/SharedUriHandler.ts`, `apps/vscode/src/core/controller/marketplace/marketplace-helpers.ts`, `sdk/packages/shared/src/storage/paths.ts`, `sdk/packages/core/src/services/mcp-install.ts`, `marketplace.ts`, `apps/cli/package.json` (3.0.76)
- Cline marketplace catalog: https://cline.github.io/marketplace/catalog.json ; repo https://github.com/cline/mcp-marketplace ; page https://cline.bot/mcp-marketplace
- npm registry: cline 3.0.76, @kilocode/cli 7.8.32; Open VSX: saoudrizwan/claude-dev 4.1.28, kilocode/Kilo-Code 7.8.36
- Roo docs (moved): https://roocodeinc.github.io/Roo-Code/features/mcp/using-mcp-in-roo ; sunset: https://raw.githubusercontent.com/RooCodeInc/Roo-Code-Docs/main/docs/sunset.md (https://docs.roocode.com/sunset) ; Roo source https://raw.githubusercontent.com/RooCodeInc/Roo-Code/main/src/services/mcp/McpHub.ts ; repo archived (GitHub API)
- Zoo Code mention: search results only (jsboige/roo-extensions #2373, morphllm.com), unconfirmed
- Kilo docs (repo `Kilo-Org/kilocode`): `packages/kilo-docs/pages/automate/mcp/using-in-kilo-code.md`, `using-in-cli.md`, `packages/kilo-docs/pages/code-with-ai/platforms/cli-reference.md`, `packages/opencode/src/kilocode/skills/kilo-config.md`, `packages/opencode/src/cli/cmd/mcp.ts`, `packages/kilo-vscode/package.json`, `packages/kilo-vscode/src/extension.ts`; issue https://github.com/Kilo-Org/kilocode/issues/12763
- Kilo marketplace: https://github.com/Kilo-Org/kilo-marketplace (CONTRIBUTING.md, last commit 2026-11-03)
- Local machine checks: `~/.vscode/extensions/extensions.json`, Roo globalStorage dir listing, `mcp_settings.json` top-level keys only


## Verification log (verifier pass, 2026-11-26/27)

| Claim | Status | Source |
|---|---|---|
| Roo Code shut down 2026-05-15, repo archived | CONFIRMED (`archived: true`, pushed_at 2026-05-15; sunset.md says all products shut down) | gh api repos/RooCodeInc/Roo-Code; https://github.com/RooCodeInc/Roo-Code-Docs/blob/main/docs/sunset.md |
| Cline extension v4.1.28, engine vscode ^1.101.0 | CONFIRMED | cline/cline apps/vscode/package.json |
| Cline CLI `cline` npm 3.0.76 | CONFIRMED (`npm view cline version`) | npm registry |
| Kilo CLI `@kilocode/cli` 7.8.32 | CONFIRMED | npm registry |
| Cline shared file `~/.cline/data/settings/cline_mcp_settings.json`; overrides CLINE_MCP_SETTINGS_PATH, CLINE_DATA_DIR, CLINE_DIR | CONFIRMED (resolveMcpSettingsPath: explicit path > CLINE_DATA_DIR/settings > CLINE_DIR/data/settings > ~/.cline/data/settings) | sdk/packages/shared/src/storage/paths.ts L447-452; docs/mcp/mcp-overview.mdx L28 |
| Legacy extension path migrated to the shared file | CONFIRMED (migration reads `globalStorageUri/settings/cline_mcp_settings.json` and Documents/Cline/MCP/ and merges into shared file, skipping existing names) | apps/vscode/src/hosts/vscode/mcp-settings-legacy-migration.ts |
| Cline file live-watched (chokidar), no restart | CONFIRMED in source (awaitWriteFinish 100 ms; reconnect keyed on connection fingerprint) | McpHub.ts L292-300 |
| Cline `type` must be `streamableHttp`; omitted -> SSE | CONFIRMED (schema comment + docs L115) | schemas.ts; mcp-overview.mdx |
| Cline flat and nested `transport` forms accepted | CONFIRMED | schemas.ts |
| Cline `${env:VAR}` expansion over config | CONFIRMED that expandEnvironmentVariables is applied on read/connect (exact syntax not re-read) | McpHub.ts L240, L464 |
| `cline mcp add NAME URL --transport http --header "Authorization: Bearer TOKEN" --yes` | CONFIRMED verbatim in docs | docs/cli/cli-reference.mdx L171 |
| Cline VS Code OAuth not implemented | CONFIRMED comment "VSCode doesn't implement OAuth flows yet" in schemas.ts, but McpHub still instantiates McpOAuthManager for remote servers | schemas.ts; McpHub.ts L165, L479-482 |
| Cline URI handler has no MCP path | CONFIRMED (cases: /openrouter /requesty /auth /auth/oca TASK /lg-task /hicap) | SharedUriHandler.ts L44-133 |
| Kilo URI handler has no MCP path | CONFIRMED (/kilocode/s/<id>, /kilocode/switch, /kilocode/model only) | kilo-vscode/src/extension.ts L867-885 |
| Kilo `kilo mcp add NAME --url URL --header "K=V"` | CONFIRMED (options url, env, header "KEY=VALUE"; rejects --header with local command) | packages/opencode/src/cli/cmd/mcp.ts L458-510 |
| Kilo config: top-level `mcp`, `type: "remote"`, `headers`, `oauth:false`, `enabled`, `{env:VAR}` in headers | CONFIRMED | kilo-docs using-in-kilo-code.md L56-74, L209-216, L301-310 |
| Kilo global file `~/.config/kilo/kilo.json` (also .jsonc, opencode.json[c], config.json) | CONFIRMED (docs note both kilo.json as recommended and kilo.jsonc in intro; both accepted). Windows location UNCONFIRMED | same doc L79-84 |
| Kilo hand-edit hot reload | UNCONFIRMED (config.ts has a "reload instance config when global config changed elsewhere" path at ~L1090, suggesting some change detection, but MCP reconnect not verified) | opencode/src/config/config.ts |
| Kilo in-app marketplace UI | CORRECTED: "unconfirmed" -> exists in extension webview source | kilo-vscode/webview-ui/.../marketplace |
| Kilo issue #12763 | CORRECTED: now closed | https://github.com/Kilo-Org/kilocode/issues/12763 |
| Kilo marketplace repo structure (mcps/ skills/ agents/ plugins/ modes/), last commit 2026-11-03, `prerequisites` field, streamable-http + `{{API_TOKEN}}` template | CONFIRMED | Kilo-Org/kilo-marketplace CONTRIBUTING.md L336-409 |
| No localhost rule in Kilo marketplace | UNCONFIRMED (no rule found) | CONTRIBUTING.md |
| Cline marketplace issue-submission flow still live | UNCONFIRMED | cline/mcp-marketplace |
| Roo global path on macOS; extension dir present locally | CONFIRMED locally (extension dirs 3.41.3 and 3.54.0, globalStorage dir exists). Windows/Linux paths remain derived | local `ls` |
| Roo `type: "streamable-http"`, hot reload | UNCONFIRMED beyond researcher's source reading (not re-verified; project is dead) | Roo McpHub.ts |
| Cline Desktop bundle id / Windows path | UNCONFIRMED | |
| Nothing installed locally for Cline/Kilo (`~/.cline`, `~/.config/kilo` absent; `code`, `cline`, `kilo` not on PATH) | CONFIRMED | local |
| Missed: any newer one-click route | NONE FOUND for Cline/Kilo (no deeplink; no `vscode:mcp/install` support in either extension per their URI handlers) | above |

## Recommendation for Anytype

Primary zero-touch route, Cline (4.x extension, CLI and Desktop share one file):
1. In Anytype click "Connect to Cline", pick spaces and read / read-write (optional expiry), click Connect. Two clicks.
2. Anytype mints the key via internal RPC, then read-modify-writes only `mcpServers.anytype` in `resolveMcpSettingsPath()` (env `CLINE_MCP_SETTINGS_PATH` > `CLINE_DATA_DIR/settings/` > `CLINE_DIR/data/settings/` > `~/.cline/data/settings/cline_mcp_settings.json`; `%USERPROFILE%` on Windows), using temp-file + rename, preserving unknown keys, creating the dir/file if missing.
   Entry: `{"type":"streamableHttp","url":"http://127.0.0.1:<port>/mcp/large","headers":{"Authorization":"Bearer <KEY>"},"disabled":false,"autoApprove":[]}`.
3. Cline picks it up live; no restart. Show "Open Cline, the anytype server should be connected".
Alternative if `cline` is on PATH: `cline mcp add anytype http://127.0.0.1:<port>/mcp/large --transport http --header "Authorization: Bearer <KEY>" --yes` (note header separator `:`), but direct file write is simpler and has no Node requirement.

Primary route, Kilo Code (extension 7.x and CLI share config):
- If `kilo` on PATH: `kilo mcp add anytype --url http://127.0.0.1:<port>/mcp/large --header "Authorization=Bearer <KEY>"` (header separator `=`; JSONC-safe), then set `"oauth": false` on the entry (CLI flag for it not confirmed, so edit file).
- Else edit `~/.config/kilo/kilo.json` (prefer whichever of kilo.json/kilo.jsonc exists; use a JSONC-aware edit) with `{"mcp":{"anytype":{"type":"remote","url":...,"headers":{"Authorization":"Bearer <KEY>"},"oauth":false,"enabled":true}}}`.
- Reload behaviour unconfirmed: tell user to run "Developer: Reload Window" (or restart `kilo`) unless tested otherwise. Test before shipping.

Fallback (all): show copyable JSON / CLI line with key pre-filled plus "Open config file" button.
Roo Code: legacy, discontinued; optionally write `.../globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json` with `type:"streamable-http"` only if its extension dir is detected; label "discontinued"; ask user to reload window. Or skip.

OS notes: macOS/Linux chmod 0600 on files holding the key. Windows Kilo path (`%USERPROFILE%\.config\kilo`) unconfirmed. Detect via `~/.vscode/extensions/saoudrizwan.claude-dev-*`, `kilocode.kilo-code-*` (and .cursor/.windsurf/.vscode-insiders equivalents), `~/.cline`, `~/.config/kilo`, `cline`/`kilo` on PATH. Also write legacy `globalStorage/saoudrizwan.claude-dev/settings/` file only for Cline 3.x users.

Gotchas: three different schemas (Cline `streamableHttp`, Roo `streamable-http`, Kilo `remote` under `mcp`); omitted Cline `type` means SSE and fails against Anytype's JSON-only endpoint; plaintext key in file (macOS GUI VS Code does not inherit shell env, so `${env:}` is not zero-touch); port must follow user setting (31009 / 31012 headless); Cline `autoApprove: []` prompts per tool call; enterprise policy can strip entries; Cline may try OAuth discovery on a 401, so make sure the minted key is valid before writing; marketplace listings (Cline catalog via GitHub issue, Kilo via PR) are optional discovery channels only, since no localhost-token flow fits them and neither supports adding the key.
