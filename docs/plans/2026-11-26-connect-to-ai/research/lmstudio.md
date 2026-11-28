# LM Studio (desktop app + lms CLI + Bionic) - VERIFIED report for Anytype connect flow

Verified 2026-11-26 against live docs, GitHub issue tracker, and this machine. Researcher's structure kept; corrections marked **[CORRECTED]**.

## 0. Headline findings
- LM Studio reads `mcp.json` (Cursor notation) with remote entries `url` + static `headers`. Anytype's `Authorization: Bearer <key>` is directly representable. CONFIRMED (docs/app/mcp, example uses url+headers).
- Auto-load on save: official 0.3.17 blog says "When you save the mcp.json file, LM Studio will automatically load the MCP servers defined in it." CONFIRMED for in-app save; external-writer reload UNCONFIRMED.
- **[CORRECTED]** Official documented path is `~/.lmstudio/mcp.json` (macOS/Linux) and `%USERPROFILE%/.lmstudio/mcp.json` (Windows), but the real home is relocatable and in practice often differs. Open bug lmstudio-bug-tracker #1371 (0.3.33, macOS): "docs say ~/.lmstudio, actual path is ~/.cache/lm-studio". On this machine `~/.lmstudio` does not exist; `~/.lmstudio-home-pointer` contains `~/.cache/lm-studio` and `mcp.json` is there (top-level key `mcpServers` only). Pointer file is confirmed by issue #2015 (a user report on Windows: pointer at `C:\Windows\System32\config\systemprofile\.lmstudio-home-pointer` for the service account, i.e. it sits in the user profile). Not in official docs. Anytype MUST resolve: pointer file -> `~/.lmstudio` -> `~/.cache/lm-studio`.
- **[CORRECTED]** Deeplink docs page says nothing about a confirmation dialog (researcher said the same) and the docs page's generator input is a WRAPPED entry `{"name": {entry}}`; the base64 in the official example decodes to the INNER entry `{"url":...,"headers":{...}}` (re-decoded here). Researcher's inner-entry claim CONFIRMED.
- Hub has no MCP listing type; localhost-only server cannot be listed. Official docs mention only the "Add to LM Studio" button as distribution; no submission process found. CONFIRMED (absence).
- Bionic is a separate agent app; MCP config storage UNCONFIRMED. **New local fact:** on this machine `<home>/.internal/app-install-location.json` points to `/Applications/Bionic.app`, i.e. Bionic and LM Studio can SHARE the same home dir (and presumably the same `mcp.json`). Whether Bionic reads that mcp.json is unconfirmed.

## 1. Surfaces, platforms, versions
| Surface | Platforms | Version | Notes |
|---|---|---|---|
| LM Studio app | macOS, Windows, Linux | 0.4.x (issue #2647 cites 0.4.29, so researcher's "0.4.27 latest" is stale; latest unconfirmed) | Free |
| `lms` CLI | all | here `~/.cache/lm-studio/bin/lms`, "CLI commit: 71bd99c" | `lms --help` re-run: chat, get, load, unload, ls, ps, import, server, log, link, runtime, clone, push, dev, login, logout, whoami. NO mcp command. CONFIRMED |
| llmster headless | Linux/macOS/Windows | 0.4.x | `lms daemon up` per researcher; not in local help (not re-verified) |
| Bionic | macOS, Windows, Linux | 1.2.3 (2026-11-25 per researcher) | separate app; not re-verified |

## 2. MCP support
- Remote+local since 0.3.17 (b10). CONFIRMED.
- Transport: docs name none. Issue #1453 "Support for Streamable HTTP MCP" is CLOSED (2026-01-30), so Streamable HTTP is supported in current builds (inferred from closed issue; not an official doc statement). JSON-only responses without SSE: unconfirmed, must be tested.
- Static headers: supported. CONFIRMED. Caveat: open issue #1892 (0.4.12, Windows) reports Authorization header NOT sent for MCP via the developer REST API integrations route; that is the API path, not mcp.json, but shows header plumbing bugs exist. Test bearer delivery end to end.
- Env/keychain header substitution: none documented. Plaintext token in mcp.json.
- OAuth: since 0.4.10; callback `http://127.0.0.1:33389/mcp-oauth-callback`; `auth: {CLIENT_ID, CLIENT_SECRET}` (docs/integrations/mcp-remote CONFIRMED). Not needed.
- Loopback `http://127.0.0.1`: docs state no restriction; not explicitly stated. UNCONFIRMED but expected to work (local app).
- Open issue #1073: `/v1/responses` ignores mcp.json; chat UI works. API route irrelevant to us.

## 3. Ways to add Anytype
Inner entry:
```json
{ "url": "http://127.0.0.1:31009/mcp/large", "headers": { "Authorization": "Bearer <ANYTYPE_API_KEY>" } }
```
### 3a. Write mcp.json (primary)
`{"mcpServers":{"anytype":{...inner entry...}}}`. Merge, atomic write, strict JSON, preserve other keys. Home resolution as above.
### 3b. Deeplink
`lmstudio://add_mcp?name=anytype&config=<URL-encoded base64 of inner entry>`. Params name/config CONFIRMED by docs/app/mcp/deeplink. Docs mention "Add to LM Studio" button and warn "If you don't trust the source, don't install it", suggesting a trust prompt, but dialog contents UNCONFIRMED. Web `https://lmstudio.ai/install-mcp?...` exists (researcher saw an Anytype entry using old npx stdio); web auto-launch unconfirmed. Token lands in a URL: prefer custom scheme via shell.openExternal; avoid web page.
### 3c. In-app UI: Program tab (right sidebar) > Install > Edit mcp.json. CONFIRMED (docs). A Japanese Oct-2026 article (secondary) says some versions put it under an Integration tab; unconfirmed.
### 3d. CLI: none (`lms --help` verified).
### 3e. Extension package: none for MCP (Hub = models/presets/plugins).
### 3f. npx stdio: works but needs Node; avoid.

## 4. Write/merge
Plain JSON; safe to merge. Reload by external write unconfirmed; app loads at launch otherwise. Fallback "toggle off/on in Program tab or restart". Official note: when pasting manually, paste only the inside of `mcpServers`. Re-read before write to avoid clobbering in-app editor.

## 5. Detection
- macOS `/Applications/LM Studio.app` (third-party-derived; not installed here). Resolved home dir may exist after uninstall (here `~/.cache/lm-studio` exists and belongs to Bionic installs). So home-dir presence alone is a weak signal; also check `<home>/.internal/app-install-location.json` (`path` field names the last-run app binary; observed here, not documented) and `<home>/bin/lms`.
- Windows/Linux paths: unconfirmed.
- Because Bionic may share home, existence of home does not prove LM Studio chat app is installed. If only Bionic: writing mcp.json is harmless but may not be read.

## 6. Skills/plugins: Bionic supports SKILL.md (blog 2026-08-17, not re-verified); no MCP+skill bundle format.
## 7. Marketplace: no MCP directory in LM Studio; button/deeplink is the distribution mechanism; no submission. Hub requires login and publishes models/presets/plugins only.

## Verification log
| Claim | Status | Source |
|---|---|---|
| mcp.json supports url + headers.Authorization | CONFIRMED | https://lmstudio.ai/docs/app/mcp |
| Cursor notation; paste only inside mcpServers | CONFIRMED | same |
| Path `~/.lmstudio/mcp.json`, `%USERPROFILE%/.lmstudio/mcp.json` | CONFIRMED as documented, but CORRECTED as sole truth (real home via pointer / `~/.cache/lm-studio`) | https://lmstudio.ai/blog/lmstudio-v0.3.17 ; https://github.com/lmstudio-ai/lmstudio-bug-tracker/issues/1371 ; local FS |
| Home pointer file `~/.lmstudio-home-pointer` | CONFIRMED (user report + local) | issue #2015 ; local |
| Auto-load on save | CONFIRMED (in-app); external write UNCONFIRMED | 0.3.17 blog |
| Tool-call confirmation dialog | CONFIRMED ("will show a confirmation dialog") | 0.3.17 blog |
| Deeplink `lmstudio://add_mcp?name=&config=` base64 inner JSON | CONFIRMED (decoded locally) | https://lmstudio.ai/docs/app/mcp/deeplink |
| Deeplink confirmation dialog contents | UNCONFIRMED | same (silent) |
| Streamable HTTP supported | CORRECTED (unconfirmed in docs -> supported per closed issue #1453, 2026-01-30) | https://github.com/lmstudio-ai/lmstudio-bug-tracker/issues/1453 |
| JSON-only (no SSE) server works | UNCONFIRMED | - |
| Loopback http allowed | UNCONFIRMED (no documented restriction) | - |
| OAuth since 0.4.10, callback 127.0.0.1:33389 | CONFIRMED (callback) | https://lmstudio.ai/docs/integrations/mcp-remote |
| No `lms mcp` command | CONFIRMED | local `lms --help` |
| Latest version 0.4.27 | CORRECTED -> at least 0.4.29 exists | issue #2647 |
| Hub has no MCP type; no submission process | CONFIRMED (absence) | docs search; https://lmstudio.ai/docs/app/mcp |
| Bionic reads same mcp.json | UNCONFIRMED; shares home dir on this machine | local `.internal/app-install-location.json` |
| Env-var header syntax | UNCONFIRMED | - |

## Recommendation for Anytype
**Primary (zero-touch):** "Connect to LM Studio" in Anytype. User picks spaces and read/read-write (tier default `large`; `small` suggested for small local models). Anytype mints key via RPC (name "LM Studio"), resolves home (pointer -> `~/.lmstudio` -> `~/.cache/lm-studio`), merges `mcpServers.anytype` = `{url: http://127.0.0.1:<port>/mcp/<tier>, headers:{Authorization:"Bearer <key>"}}` atomically, then shows "Open LM Studio > Program tab: anytype should be listed; approve the first tool call." Use the actual configured Anytype port. 3 clicks.
**Fallback 1:** `lmstudio://add_mcp` deeplink via openExternal (user confirms in LM Studio). Never the https install-mcp page.
**Fallback 2:** Copy-config button with OS path and "Program > Install > Edit mcp.json".
**OS notes:** Windows `%USERPROFILE%\.lmstudio\mcp.json` unless pointer says otherwise; pointer at `%USERPROFILE%\.lmstudio-home-pointer`. Linux/macOS `~/.lmstudio` or relocated.
**Gotchas:** (1) docs path is often wrong; always use pointer; (2) external-write reload unconfirmed, show a "toggle server / restart" hint, ideally test with a real build before shipping; (3) verify bearer header is sent and JSON-only Streamable HTTP works (open header bug #1892 on API route); (4) plaintext token: scope spaces, optional expiry, remove entry on Disconnect; (5) tool definitions consume context, small models need `small` tier and larger context; (6) first tool-call confirmation is unavoidable, tell the user; (7) update the existing LM Studio install-mcp "anytype" npx entry once native endpoint ships; (8) Bionic is a separate target, shared home dir may mislead detection.
