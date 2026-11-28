# Claude Desktop (chat + Cowork + Code tab) - connection research for Anytype

Research date: 2026-11-26. Local machine has Claude Desktop 6.28899.6 (bundle id `com.anthropic.claudefordesktop`). Newest config changelog entry seen: v7.37095.0 (2026-11-24).
Legend: [V] verified from live official doc or local inspection; [3P] third-party/community only; unconfirmed = not found.

## 1. Surfaces and platforms

| Surface | Platforms | Notes |
|---|---|---|
| Claude Desktop app: Chat, Cowork, Code tabs | macOS, Windows; Linux **beta** (Ubuntu 22.04+/Debian 12+, x64/arm64, apt only; Fedora/Arch not supported) | [V] code.claude.com/docs/en/desktop-linux. Linux beta has no Computer Use, no dictation. Cowork on Linux needs QEMU/KVM. |
| Claude Code CLI / IDE extensions | all | separate MCP config (`~/.claude.json`, `.mcp.json`); out of scope here |
| claude.ai web / mobile | n/a | remote connectors only |

Official `mcpb` doc says "Claude Desktop runs on macOS (darwin) and Windows (win32)" (page not yet updated for Linux beta); whether `.mcpb` / Extensions UI works on the Linux beta: **unconfirmed**.
Cowork: GA in desktop on macOS/Windows (Apr 2026 per [3P]); all paid plans; Linux beta [V].

## 2. MCP support

- **Local servers in Claude Desktop = stdio only** (`command`/`args`/`env` in `claude_desktop_config.json`, or a `.mcpb` extension, whose docs state "communicates via stdio transport"). [V] mcpb build doc.
- **`url` / Streamable HTTP entries in `claude_desktop_config.json`: NOT supported.** GitHub issue anthropics/claude-code#37286 (Mar 2026, macOS, Desktop): an `mcpServers` entry with `"url": "http://127.0.0.1:7677/mcp"` made Desktop **silently delete the whole `mcpServers` section** (and some preferences) at startup. Closed "not planned" by a bot, no fix. [3P-ish, but a first-hand repro]. Treat as: never write `url` entries there. No official doc documents `url` there either.
- **Remote custom connectors** (Customize > Connectors > Add custom connector): HTTPS only, standard port 443 only, **reached from Anthropic's cloud** ("Claude connects to your remote MCP server from Anthropic's cloud infrastructure", incl. Desktop and Cowork). So **`http://127.0.0.1:31009` is unreachable by design**. Private-network servers need allowlisting Anthropic IPs or "MCP tunnels" (claude.com/docs/connectors/mcp-tunnels/overview, not read; a tunnel to localhost would need a public-ish relay - not suitable for local-first Anytype). [V]
  - Auth: OAuth (CIMD "Claude's published identity", DCR, own client) or "No sign-in" + **Request headers** (beta, limited orgs): up to 4 headers, value sent verbatim (`Bearer <token>`), Anthropic must approve custom header names (`authorization`, `x-api-key`, `x-auth-token` pre-approved). Transport: streamable HTTP; URL ending `/sse` selects legacy SSE. [V] claude.com/docs/connectors/custom/add-unlisted
- Managed (enterprise) config `managedMcpServers` supports `transport: http|sse|stdio` with `url` (HTTPS, no redirects) and `headersHelper` (script that prints headers JSON) - **MDM/bootstrap only, remote HTTPS** [V] claude.com/docs/third-party/claude-desktop/configuration. Not for end users.
- Keychain: `.mcpb` `user_config` fields with `"sensitive": true` are "masked and stored securely" [V MANIFEST.md]; support article says secrets go to OS keychain (macOS Keychain, Windows, "your distro's keychain manager on Linux") [V support article 10949351 via fetch summary].
- Node runtime: official docs: Node.js extensions need no separate runtime - "Included with Claude Desktop on macOS and Windows" and "One-click install with bundled Node.js runtime" [V claude.com/docs/connectors/building/mcpb]. So a `server.type: "node"` bundle removes the user's Node requirement (and `binary` type needs none either). For plain `claude_desktop_config.json` stdio entries, `command: "npx"` still needs the user's own Node (unconfirmed whether Desktop injects its bundled Node into PATH for config entries; assume no).

## 3. Every way to add a server, ranked by user effort

### A. `.mcpb` extension (best fit) - open/double-click, ~2 clicks
- Double-click `.mcpb`, drag onto Desktop window, or Settings > Extensions > Advanced settings > Install Extension... [V]. Each opens an install dialog (details, permissions, user_config prompts). The README also says "open the file with Claude for macOS and Windows to show an installation dialog" [V], so `shell.openPath(file.mcpb)` / `open -a Claude x.mcpb` / `start x.mcpb` should trigger it (the OS file association; exact behaviour from another app **unconfirmed - test**).
- **No `claude://` install deeplink exists** for extensions/MCP that I could find. Local app.asar (6.28899.6) contains only `claude://code/new`, `claude://code/continue`, `claude://code/needs-input`, `claude://claude.ai/new`, `claude://claude.ai/artifact/...`, `claude://cowork/shared-artifact`. Scheme `claude` is registered in Info.plist. Admins can disable via `disableDeepLinkRegistration`. [V local + config docs]. Searches found no documented "add MCP" deeplink -> treat as nonexistent.
- Manifest (spec 0.3 current; 0.4 adds `uv`) [V github.com/modelcontextprotocol/mcpb MANIFEST.md]. Worked example for Anytype (stdio->HTTP proxy bundled as node; key baked in by Anytype at generation time so the user sees no prompt, OR prompt-free `user_config` omitted):
```json
{
  "manifest_version": "0.3",
  "name": "anytype",
  "display_name": "Anytype",
  "version": "1.0.0",
  "description": "Connect Claude to your local Anytype app",
  "author": { "name": "Anytype" },
  "server": {
    "type": "node",
    "entry_point": "server/index.js",
    "mcp_config": {
      "command": "node",
      "args": ["${__dirname}/server/index.js"],
      "env": {
        "ANYTYPE_MCP_URL": "http://127.0.0.1:31009/mcp/large",
        "ANYTYPE_API_KEY": "${user_config.api_key}"
      }
    }
  },
  "user_config": {
    "api_key": { "type": "string", "title": "Anytype API key", "sensitive": true, "required": true }
  },
  "compatibility": { "platforms": ["darwin", "win32"], "runtimes": { "node": ">=18.0.0" } }
}
```
  The `server/index.js` is the thin stdio->HTTP proxy (the new `@anyproto/anytype-mcp` v2 proxy bundled with `node_modules`) sending `Authorization: Bearer $ANYTYPE_API_KEY` to the URL. Alternative: `type: "binary"` with Anytype's helper (needs per-platform binaries + `platform_overrides`, notarization/signing concerns).
  Zero-prompt variant: Anytype generates the zip per user with the real key inlined in `env` (no `user_config`) -> install dialog only needs "Install". Whether `user_config` defaults can be pre-seeded so the key is stored in keychain instead of plaintext in the extension's manifest: **unconfirmed** (default values "support variable substitution" only for ${HOME}/${DESKTOP}/${DOCUMENTS}). Trade-off: inlined key sits in the extension folder in plaintext.
- Packaging: `npm i -g @anthropic-ai/mcpb && mcpb pack`; a `.mcpb` is a plain zip, so Electron can build it with a zip lib at connect time [V]. Signing: admins may enforce `isDesktopExtensionSignatureRequired`; consumer install of unsigned .mcpb works (shows warning - unconfirmed wording).
- Installed extension files live under `~/Library/Application Support/Claude/Claude Extensions/` (macOS) - inferred (dir did not exist locally because none installed; app.asar references `mcpb-cache`, `dxt-staging`) - path unconfirmed.

### B. Plugin (bundles skill + MCP) - Customize > Plugins > Add > Upload plugin (zip)
- Plugin = folder with `.claude-plugin/plugin.json`, `skills/<name>/SKILL.md`, `commands/`, `agents/`, `hooks/`, `.mcp.json` [V claude.com/docs/plugins/build.md]. Upload `.zip`/`.plugin` (<=200 MB, 5000 files) or add a Git marketplace; saved to the account and synced to chat, Cowork, Claude Code.
- Local MCP server in a plugin: **ignored in chat; loads in Cowork only when the session runs on the user's computer; loads in Claude Code**; `${user_config.*}` references are ignored in Cowork (no prompting) and Chat; no `bin/` dir allowed [V platform-support.md]. So a plugin with a local server does NOT give chat access - not suitable as the main route; good only as a skills carrier (Anytype usage skill) paired with the extension.
- No deeplink to install a plugin; upload is manual (file picker). Marketplace by repo URL: `Add > Add marketplace`, `owner/repo` [V].

### C. `claude_desktop_config.json` stdio entry - edit file + full restart
Paths [V macOS verified locally; others V via docs/3P]:
```
macOS : ~/Library/Application Support/Claude/claude_desktop_config.json
Windows (exe/MSI installer): %APPDATA%\Claude\claude_desktop_config.json
Windows (Microsoft Store / MSIX): %LOCALAPPDATA%\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\claude_desktop_config.json   (virtualized; Settings>Developer>Edit Config opens the wrong file - issues #26073/#25579) [3P]
Linux (official beta): ~/.config/Claude/claude_desktop_config.json   [3P, consistent; official doc silent]
```
Local file on this machine has top-level keys `globalShortcut, mcpServers, coworkUserFilesPath, preferences`; `mcpServers.anytype` is `{command, args, env}` - i.e. the app also stores prefs in the same file (Desktop rewrites it) -> merge, preserve unknown keys, write atomically.
Entry (needs Node/npx unless the command is an absolute path to a bundled helper):
```json
{ "mcpServers": { "anytype": {
  "command": "/Applications/Anytype.app/Contents/Resources/anytype-mcp-proxy",
  "args": ["--url", "http://127.0.0.1:31009/mcp/large"],
  "env": { "ANYTYPE_API_KEY": "<minted key>" } } } }
```
(`command` may point at a helper binary shipped inside Anytype; or `"command":"npx","args":["-y","@anyproto/anytype-mcp"],"env":{"OPENAPI_MCP_HEADERS":"{\"Authorization\":\"Bearer <key>\",\"Notion-Version\":...}"}` per current npm package - env name for v2 proxy unconfirmed.) Key is plaintext in the file.

### D. Settings > Developer > Edit Config button / Customize > Connectors > custom connector
- Edit Config opens the JSON above (UI form for local servers does not exist; only the file) [V support article / 3P].
- Custom connector UI: unusable for localhost (see section 2).

## 4. Can Anytype write/merge the config safely?

- File is **read at app start only**; docs: restart needed ("quit and reopen" - Desktop doc for env changes; support article: restart to refresh extension registry only for broken installs). Full quit (Cmd+Q / tray Quit), not window close. Anytype can prompt "Restart Claude" and run `osascript -e 'tell app "Claude" to quit'` then `open -a Claude` (mac). Live reload: unconfirmed, assume no.
- Risks: Desktop rewrites the file (prefs, and wipes it for unsupported `url` entries - #37286); do JSON merge of only `mcpServers.anytype`, atomic write, backup, never write `url`. Multiple profiles: single user profile per OS; MSIX path divergence on Windows; enterprise `isLocalDevMcpEnabled=false` blocks local servers and `.mcpb`, `isDesktopExtensionEnabled=false` hides Extensions [V].
- `.mcpb` avoids touching the config at all (Desktop manages its own extension store) - safer.
- Scope: user-level only; no workspace scope in Desktop. Cowork and the Code tab: servers from `claude_desktop_config.json` and extensions work in a **local** Cowork session ("a Cowork session running locally on your device can use them"; "Local MCP servers configured in claude_desktop_config.json ... aren't available in claude.ai or cloud Cowork sessions") [V]. The Code tab reads connectors from the claude.ai account and `.mcp.json`/`~/.claude.json`/plugins, not Desktop's extension list as such; desktop extensions are said to be available in "Claude Desktop and Claude Code" [V when-to-use page], exact Code-tab sharing mechanism **unconfirmed**. Anytype could additionally offer `claude mcp add --transport http anytype http://127.0.0.1:31009/mcp/large --header "Authorization: Bearer <key>"` for Code (separate research file).

## 5. Install detection

- macOS: `/Applications/Claude.app` (also `~/Applications`); bundle id `com.anthropic.claudefordesktop` [V local]; URL scheme `claude://` registered [V]; query via `mdfind "kMDItemCFBundleIdentifier == 'com.anthropic.claudefordesktop'"` or Electron `app.getApplicationNameForProtocol('claude://')`.
- Windows: protocol handler for `claude://` (registry HKCU\Software\Classes\claude) - unconfirmed; install dir `%LOCALAPPDATA%\AnthropicClaude\` (Squirrel, older) unconfirmed for 2026; MSIX package family `Claude_pzs8sxrjxfjjc` [3P]; `app.getApplicationNameForProtocol('claude://')` is the portable check. Config dir existence `%APPDATA%\Claude` or the MSIX path is a decent signal.
- Linux: `dpkg -s claude-desktop`, binary `claude-desktop`, `~/.config/Claude` [V install doc / 3P].
- Version: `CFBundleShortVersionString` on mac (6.28899.6 here). Extensions need a recent app (feature since Aug 2025 desktop-extensions release; exact min version unconfirmed).

## 6. Skills / plugins

- Agent Skills (SKILL.md) supported in chat, Cowork, Claude Code; installed via Customize > Skills (upload) or inside a plugin [V]. A plugin can ship an `anytype` skill teaching Claude the Anytype tools; install = manual upload of a zip (**no one-command / deeplink**) or marketplace repo. Plugin MCP + skill pairing for a local server is limited (section 3B).

## 7. Marketplace / directory

- Single directory (claude.ai/directory, also claude.com/marketplace - "no separate Marketplace submission") with two submission kinds via claude.ai/directory/manage: **Plugin bundle** (GitHub repo with `.claude-plugin/plugin.json`, README >=40 words, license; automated scan + human review) and **MCP connector** (**remote** server URL, community by default, optional Verified review). Needs paid plan (Pro/Max/Ultra/Team/Enterprise). [V]
- **MCPB extension listings are deprecated; the directory no longer accepts MCPB** - "include it in a plugin bundle" [V]. A plugin can carry a local MCP server (`.mcp.json` with a command), but a **localhost-only server cannot be a Connector listing** (must be public HTTPS). A plugin bundle with a local server + Anytype skill is listable in principle (surfaces: Cowork-local + Claude Code, not chat) - realistic value is low; benefit mainly discoverability. Whether reviewers accept a plugin whose server needs a user-minted localhost token: unconfirmed.

## 8. Recommendation

**Zero-touch route (macOS/Windows): Anytype generates and opens a per-user `.mcpb`.**
1. User clicks "Connect to Claude Desktop" in Anytype; Anytype detects Claude (protocol handler / bundle id), user picks spaces + read/read-write (+ optional expiry) in one dialog; Anytype mints the API key through its internal RPC (no pairing code).
2. Electron zips a template bundle (manifest + bundled node stdio->HTTP proxy, pointing at `http://127.0.0.1:<port>/mcp/large`, key inlined in env or entered into a sensitive `user_config` field) to a temp `.mcpb` and `shell.openPath()`s it; Claude opens its install dialog.
3. User clicks **Install** (and Enable). Anytype shows "Finish in Claude: click Install", then a "Test connection" button that hits `/mcp/large` `initialize` with the key. Total: Anytype 2-3 clicks + 1-2 Claude clicks; no Node install (bundled runtime), no JSON, no token copy, usually no restart (extensions are registered live; if tools missing, restart Claude per support article).
**Fallback:** Anytype merges `mcpServers.anytype` into `claude_desktop_config.json` (correct per-OS/MSIX path, backup, preserve other keys, stdio command = helper binary or `npx -y @anyproto/anytype-mcp` with Node check), then offers "Quit and reopen Claude". Linux beta: config-file route only (extensions on Linux unconfirmed).
**Do not use:** custom connector URL (cloud, HTTPS:443 only - cannot reach 127.0.0.1); `url` entries in `claude_desktop_config.json` (wipes mcpServers).
**Gotchas:** key inside a file/extension in plaintext (prefer sensitive `user_config` + keychain if it can be pre-seeded - unconfirmed; otherwise show key in dialog and let user paste once); never put the key in a deeplink (none exists anyway); enterprise policies can disable extensions/local MCP; unsigned `.mcpb` shows a trust prompt; Cowork cloud sessions cannot use local servers; Windows MSIX path trap; Anytype must be running for the local API; token-per-install should be revocable from Anytype settings; keep proxy small and bundled with node_modules (size limit none stated).
**Optional extra:** publish an `anytype` skills plugin (marketplace repo) so users can add skills via Add marketplace; low priority.

## Sources (all seen 2026-11-26 unless noted)
- https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop (fetch summary; extensions UI path, restart, keychain mention)
- https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp (cloud-brokered connectors; local servers in claude_desktop_config.json usable in local Cowork)
- https://support.claude.com/en/articles/11725091-when-to-use-desktop-and-web-connectors
- https://claude.com/docs/connectors/building/mcpb (mcpb build/install, bundled Node, directory deprecation)
- https://claude.com/docs/connectors/custom/add-unlisted.md (custom connector auth, request headers, HTTPS, install .mcpb by drag)
- https://github.com/modelcontextprotocol/mcpb README and MANIFEST.md (manifest 0.3 current; latest release v2.1.2, 2025-12-04)
- https://claude.com/docs/plugins/overview.md ; /plugins/build.md ; /plugins/platform-support.md ; /plugins/submit.md ; /directory/publish.md ; https://claude.com/docs/cowork/guide/plugins.md
- https://claude.com/docs/third-party/claude-desktop/configuration (+ configuration-changelog v7.37095.0, 2026-11-24): managedMcpServers, isLocalDevMcpEnabled, disableDeepLinkRegistration
- https://code.claude.com/docs/en/desktop-linux (Linux beta); https://code.claude.com/docs/en/desktop (Code tab; connectors from account)
- https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork
- https://github.com/anthropics/claude-code/issues/37286 (url entry wipes mcpServers, Mar 2026); #26073, #25579 (MSIX config path) via search
- Local inspection: /Applications/Claude.app Info.plist (bundle id, `claude` scheme, v6.28899.6), app.asar string scan (claude:// routes), config file key names only (secrets not read).
- Unconfirmed items: `claude://` MCP/extension install deeplink (none found), `.mcpb` support on Linux beta, programmatic open behaviour, user_config pre-seeding, Windows install paths/registry, Code-tab extension sharing, live reload of config.

---
# VERIFIED ADDENDUM (2026-11-26) - supersedes anything above that conflicts

## Corrections applied to the body above
- Install UI path: docs differ by page. build/mcpb doc: Settings > Extensions > Advanced settings > Install Extension... ; support article 10949351: Settings > Desktop app > Manage (Extensions) > Advanced settings > Extension Developer > Install Extension. Menu names vary by app version; do not hardcode wording in Anytype copy.
- .mcpb file association is CONFIRMED locally: /Applications/Claude.app Info.plist registers document types `dxt` and `mcpb`. So `open x.mcpb` (mac) / shell.openPath should route to Claude (Launch Services default handler; if another app claims .mcpb, use `open -a Claude x.mcpb`). Still "test in practice" for the install dialog.
- Linux: Linux beta has NO documented .mcpb support; a 3P source says no .mcpb handler is registered on Linux. MANIFEST.md lists linux as a valid platform but Anthropic's mcpb page says Desktop runs on darwin/win32. Treat Linux extensions as UNCONFIRMED; use config-file route there. Linux beta = Debian/Ubuntu only (Ubuntu 22.04+, Debian 12+, x64/arm64), apt install claude-desktop.
- Manifest: MANIFEST.md has manifest_version 0.3 with server types node/python/binary; 0.4 adds `uv` (CONFIRMED). mcpb latest release v2.1.2 (2025-12-04). `mcpb sign --self-signed` exists; signature enforcement is admin key `isDesktopExtensionSignatureRequired`.
- Admin keys CONFIRMED: isLocalDevMcpEnabled, isDesktopExtensionEnabled, isDesktopExtensionSignatureRequired, disableDeepLinkRegistration, managedMcpServers, developerModeEnabled.
- Local-key storage: support article says `sensitive: true` fields are encrypted via OS secure storage (Keychain / Credential Manager / Linux keychain manager). CONFIRMED. Pre-seeding such a field from outside the install dialog: UNCONFIRMED (no documented mechanism).
- Install dir "Claude Extensions": not present locally (no extension installed); path remains UNCONFIRMED. Local machine has `Extension State` and `extensions-blocklist.json` in the Claude support dir.
- Local config file on this machine: top-level keys globalShortcut, mcpServers, coworkUserFilesPath, preferences; mcpServers has entries `anytype` (command,args,env) and `playwright` - confirms Desktop file holds prefs and other servers, so merge only.

## Verification log
| Claim | Verdict | Source |
|---|---|---|
| Local servers in Desktop are stdio; MCPB "communicates via stdio transport" | CONFIRMED | https://claude.com/docs/connectors/building/mcpb |
| `url` entry in claude_desktop_config.json wipes mcpServers | CONFIRMED as a single first-hand report (issue by user, opened 2026-03-22, closed "not planned" by bot 2026-03-25, locked 2026-04-02, no maintainer reply, no fix confirmation). Current-version behaviour UNCONFIRMED but treat as hazard | https://github.com/anthropics/claude-code/issues/37286 |
| Remote custom connector must be HTTPS, from Anthropic cloud, so 127.0.0.1 unreachable | CONFIRMED for HTTPS requirement ("enter the HTTPS address"); port-443-only and cloud-origin claims from other pages (support 11175166) not re-fetched but consistent; tunnels page unread | https://claude.com/docs/connectors/custom/add-unlisted.md |
| Request headers: beta, limited orgs, max 4, verbatim value (`Bearer ` must be typed), Anthropic-approved names (authorization, x-api-key, x-auth-token) | CONFIRMED | same |
| Request-header auth on OAuth connection cannot use Authorization | CONFIRMED (new detail) | same |
| Custom connector transport: URL ending /sse = legacy SSE | CONFIRMED | same |
| Node.js bundled with Desktop on macOS/Windows, no runtime needed for node-type MCPB | CONFIRMED | https://claude.com/docs/connectors/building/mcpb ; mcpb README |
| Install methods: double-click, drag-drop, Settings > Extensions > Advanced > Install Extension | CONFIRMED | same + add-unlisted.md (drag onto Extensions page, Install, confirm) |
| No claude:// deeplink for installing MCP/extension | CONFIRMED absent in docs; web search finds none; local app.asar scan (researcher) showed only code/cowork/artifact routes. Info.plist registers `claude` scheme | WebSearch 2026-11-26; Info.plist |
| MCPB directory listings deprecated; directory no longer accepts MCPB; local server may go in a plugin | CONFIRMED | https://claude.com/docs/connectors/building/mcpb |
| Directory connector listing requires remote public server | CONFIRMED (via add-unlisted/mcpb pages: "For a directory listing, build a remote MCP server ... or include the local server in a plugin") | same |
| Plugin local MCP ignored in chat, loads in Cowork-local/Code | NOT RE-VERIFIED (platform-support.md not re-read) - keep as researcher-reported | researcher |
| Config paths mac/Windows (%APPDATA%) | mac CONFIRMED locally; Windows %APPDATA% consistent with docs knowledge but not stated on fetched pages; MSIX path and Linux ~/.config/Claude UNCONFIRMED (3P only) | local; configuration page excerpt |
| Config read only at startup, needs restart | UNCONFIRMED officially (docs only say restart to refresh extension registry if tools missing); assume restart | support 10949351 |
| Extension registered live, no restart | UNCONFIRMED; support article suggests restart only when tools missing | same |
| MCPB manifest 0.3 shape (node, mcp_config, ${__dirname}, user_config sensitive, compatibility.platforms/runtimes) | CONFIRMED against MANIFEST.md; note user_config field in example is valid; the example sets `compatibility.platforms` without linux | https://github.com/modelcontextprotocol/mcpb/blob/main/MANIFEST.md (via gh api) |
| Linux beta Debian/Ubuntu only, no Computer Use/dictation, Cowork needs QEMU/KVM | CONFIRMED | https://code.claude.com/docs/en/desktop-linux |
| Cowork GA Apr 2026 | UNCONFIRMED (3P) - irrelevant to design |
| Bundle id com.anthropic.claudefordesktop, version 6.28899.6, `claude` scheme | CONFIRMED locally | Info.plist |

## Recommendation for Anytype
**Primary (macOS + Windows): per-user .mcpb.** In Anytype: "Connect to Claude" -> pick spaces + read/read-write (+expiry) -> mint key via internal RPC -> Electron zips a bundled template (manifest 0.3, `server.type: node`, tiny stdio->HTTP proxy with bundled node_modules; signed, ideally with Anytype's certificate via mcpb sign) into a temp .mcpb -> `shell.openPath` (mac fallback `open -a Claude file.mcpb`) -> Claude shows its install dialog -> user clicks Install. No Node install (Desktop bundles Node), no JSON, no token copy. Key delivery choice: (a) inline key in `mcp_config.env` (zero prompts, plaintext in extension folder; acceptable only with a revocable, scoped, expiring key), or (b) sensitive user_config prompt (keychain-stored, but user must paste the key once - UNCONFIRMED that it can be pre-seeded). Recommend (a) with a clear Revoke button in Anytype, option (b) as "more secure" mode. Anytype should then offer "Test connection" (initialize against /mcp/large) and tell the user to enable the extension / restart Claude if tools do not show.
**Fallback / Linux beta:** merge `mcpServers.anytype` (stdio only: absolute path to Anytype helper binary, or `npx -y @anyproto/anytype-mcp` after Node check) into claude_desktop_config.json (mac `~/Library/Application Support/Claude/`, Windows `%APPDATA%\Claude\` or MSIX LocalCache path, Linux `~/.config/Claude/` unconfirmed), JSON-merge only our key, atomic write, backup, then prompt "Quit and reopen Claude".
**Never:** `url` entries in claude_desktop_config.json; custom connector URL to 127.0.0.1 (cloud-brokered, HTTPS); putting key in a deeplink (none exists).
**Gotchas:** enterprise policies (isLocalDevMcpEnabled / isDesktopExtensionEnabled / isDesktopExtensionSignatureRequired) can block both routes - detect by failure and show guidance; unsigned bundles may show a trust prompt; Anytype must be running; Cowork cloud sessions cannot reach local servers; Windows MSIX path trap; directory listing of MCPB no longer possible - only a plugin bundle (low value, chat does not load local plugin MCP). Missed newer route: none found (no deeplink, no CLI installer, no extension API).
