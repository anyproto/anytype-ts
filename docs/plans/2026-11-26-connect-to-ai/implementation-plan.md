# Connect to AI apps: POC implementation plan

Status: plan, revision 4 (after review rounds 1–3; final plan round) · 2026-11-27 · worktree `/Users/roman/anytype/anytype-ts-connect-ai` · branch `feature/connect-to-ai-poc` (from `origin/develop`, middleware 0.51.12)

Read with: [README.md](README.md) (UX), [apps.md](apps.md) (per-app values), [architecture.md](architecture.md) (components). Where this plan and those documents differ, this plan wins; every difference is listed in §1.4.

Rules for the implementer:

- Work only in the worktree above. Do not read the `feature/ai-mcp-settings` branch or any other anytype-ts worktree.
- Do not commit. One phase = one reviewable batch. After each phase run the phase gate (§7.2), then stop for the Codex review.
- Follow the repo's `CLAUDE.md`: tabs; `else` + newline + `if`; parentheses around each part of a compound condition; class lists in a `cn` variable; SCSS own-properties block separate from the nested-children block; no `cursor: pointer`; no new colors or visual values except those this plan marks as new; `translate()` for all UI text; `U.Dom` helpers, never `querySelector` or jQuery.
- Never run `bun run build:deps` (`scripts/analyze-deps.js` is broken and would strip `build.files`). CI does not run it either.

---

## 0. Review round 1 changes

One line per accepted item (numbers match the adjudication).

| # | Change | Where |
|---|---|---|
| 1 | Registry stores a key fingerprint; heal / update / remove compare it with the installed entry and stop on mismatch (`conflict`); connect over a foreign `anytype` entry needs an explicit replace | §3.2, §3.8, §3.11, §5.1, §5.3, §5.5 |
| 2 | Each adapter has a preflight and a named commit point; nothing secret is written before consent; failures keep the old key working | §3.8 |
| 3 | Reconnect reuses the stored grant and absolute expiry; if the old key is gone, the form opens prefilled and needs a confirm | §3.2, §4.3, §5.5 |
| 4 | Disconnect tracks cleanup and revoke separately; revoke failure keeps the row with Retry; leftovers are named | §3.11, §4.3, §5.5 |
| 5 | Build writes `dist/mcp/mcpb.json`; UI reads signed status from it; signer fingerprint is checked; release CI wiring is a Phase 4 task | §3.5, §5.4, §6 |
| 6 | Claude extension detection uses the exact id and a wrapper version; five states | §3.8 |
| 7 | Manual setup: link on the connect sheet, ordered steps from the adapter, record-only IPC, key minted only on Create key, stable id for Other-app connections | §3.2, §3.8, §3.11, §5.3, §5.6 |
| 8 | Registry persists `nextStep`, `observedInstalled`, `lastProbe`; rows offer Continue / Retry check; "Removed" only after an observed install | §3.2, §3.10, §5.1 |
| 9 | Nudge: detection on account ready, claim in main, focused window only, valid local notification, "Clear all" skips local ids | §5.9 |
| 10 | Deep link, nudge and backlink carry the app id in the settings route; the gallery opens the popup after load | §5.8 |
| 11 | One port validator (1–65535); API states disabled / unknown / failed / listening; work only when listening | §3.3, §3.11, §4.2 |
| 12 | Native `button` / `select` with existing classes; Esc blocked while busy through `S.Popup.update`; keyboard-only acceptance | §5, §5.2, §6 |
| 13 | Key-bearing RPCs excluded from dispatcher debug logs; key IPC and minting gated on the real desktop API; sentinel-key tests | §4.2, §6, §7 |
| 14 | Probe: `capabilities: {}`, negotiated protocol header, 202 accepted, session only for small/large, cleanup in `finally` | §3.12 |
| 15 | JSON/TOML "others unchanged" guard compares against the intended mutation applied to the parsed original | §3.6 |
| 16 | TOML span keeps comments that introduce the next table; multiline strings → `unsupportedForm` | §3.6 |
| 17 | Writer re-reads before rename; one re-plan, then `changed`; bounded rename retry on Windows | §3.6 |
| 18 | Files that gain a secret are tightened to `0600`; backups `0600`; no backup of the key file | §3.4, §3.6 |
| 19 | Resolved targets must be under the user's home; key-file dir and files reject symlinks | §3.4, §3.6 |
| 20 | `aiConnect*` IPC accepted only from tab views of main app windows | §3.11 |
| 21 | Restart finds the process by full executable path; tri-state running check; refused quit honoured | §3.13 |
| 22 | Claude Code with sandbox on Linux/WSL defaults to the MCP route; real `whoami` in acceptance | §3.8, §6 |
| 23 | One config-home resolver per client; resolved absolute target persisted and reused | §3.7, §3.8 |
| 24 | Labelled CLI discovery output; `.cmd`/`.bat` shims are not executed | §3.7 |
| 25 | Packaged smoke test on macOS (unpacked app) in Phase 4 | §6 |
| 26 | Manifest: `tools_generated`, platforms `darwin` + `win32`, schema validated in the build | §3.5 |
| 27 | Adapters supply instruction keys per phase / platform | §3.8, §5.4 |
| 28 | LM Studio deeplink only when the handler is the detected LM Studio; file fallback offered early | §3.8 |
| 29 | `AiConnectProbeOk` replaces `AiConnectConnected`; no space enrichment on these events | §6 |
| 30 | Skill preamble separates 401 / 403 / missing variables; tier selector hidden on the skill route | §3.9, §5.3 |
| 31 | Wrapper clears `ANYTYPE_MCP_FILES_DIR` and `ANYTYPE_MCP_TIER`; `full` labelled as including local file tools | §3.4, §5.3 |
| 32 | Incoming deep link parsed by one pure function; only `app` survives | §5.8 |
| 33 | Apply / update / remove carry `expectedHash`; stale operations are rejected; pending revokes are recorded | §3.11, §4.3 |
| 34 | Card id vs target id; `Ctx.appId`; complete `Env`; discriminated IPC results; persisted record vs view | §3.2, §3.7, §3.8 |
| 35 | Views are props-driven; containers own RPCs; new `AppGrantFields` story | §5.12 |
| 36 | Shared cards resolve to one connection; sibling keeps the target alive; disconnect names siblings | §3.8, §5.1 |
| 37 | Not installed → Get app + Set up manually; directories Anytype created don't count as evidence; three empty states | §3.7, §5.1 |
| 38 | Ollama offers = detected launch integrations; `small` carried through | §3.3, §5.2, §5.7 |
| 39 | Windows Claude: both package families and the migrated profile; best effort with a visible fallback | §3.8 |

Rejected in review and deliberately **not** in the plan: a compromised-renderer threat model; pending-operation tokens for restart; Windows DACL verification and ACL-preserving replace (ship blocker for Windows, §8); one signed artifact shared across OS jobs (follow-up); hiding the bearer header from `curl` argv; a new analytics opt-in; restoring Codex Route C or the "Your system" selector; moving self-heal out; restructuring the phases.

### Review round 2 changes

| # | Change | Where |
|---|---|---|
| R2-1 | `CreateApp` returns only the key: one `flow.mintKey` finds the hash through `ListApps`; never mints twice; heart ask to return `appHash` | §1.3, §4.3, §8 |
| R2-2 | Quit consent and all preflight happen **before** minting; every popup close path goes through `releasePendingKey()` | §3.2, §3.8, §4.3, §5.2, §5.4 |
| R2-3 | `revokePending` is a set; same-hash re-delivery is not a rotation; reconciliation only against a successful `ListApps`; Retry works with the HTTP API off | §3.11, §4.3 |
| R2-4 | Check input is built only from managed hashes; a failed list is not an empty list | §3.11, §4.3 |
| R2-5 | Claude Code MCP route: fingerprint stored; passive check reads the Claude config file read-only; no `mcp get` in background; first install skips `remove` | §3.8 |
| R2-6 | Claude Desktop config entry: exact written command + args recorded; act only on an equal entry; previous value restored on failure; relaunch on every failure path | §3.2, §3.8 |
| R2-7 | Claude extension state is current: version + signer, enabled flag from the settings file; signed builds require the expected signer | §3.8 |
| R2-8 | Claude Desktop manual steps per platform; Linux package limit stated before minting; Reveal works before a record exists | §3.8, §3.11 |
| R2-9 | LM Studio: deeplink is first-install only and stays pending until the fingerprint appears; rotation uses the file route; Windows handler checked by exe path | §3.8 |
| R2-10 | Manual records: never `notInstalled`, no healing; `connectionId` flows through rows, Manage, backlink and routes; reconnect keeps the id | §3.8, §3.11, §4.3, §5.8 |
| R2-11 | Deep-link param consumed by replacing only the current history entry; gallery reacts to param changes | §5.8 |
| R2-12 | Skill ownership: an unmarked `SKILL.md` is the user's → conflict; delete only a marked file | §3.8 |
| R2-13 | Skill preamble: URL check, `curl -q --noproxy '*'`, PowerShell form | §3.9 |
| R2-14 | Claude Code sandbox on (any platform) → MCP route; no `allowedDomains` edit | §3.8 |
| R2-15 | Writer rechecks the target right before every rename attempt; backup written from the snapshot; key dir chain verified | §3.4, §3.6 |
| R2-16 | TOML removal prunes an implicit empty `mcp_servers` parent, keeps an explicit header | §3.6 |
| R2-17 | JSONC removal never takes the next member's comment | §3.6 |
| R2-18 | Restart: one `SIGTERM` per pid; Windows main process by path + no `--type=`; async launch; Linux running check | §3.13 |
| R2-19 | Signing positive-path test with a throwaway cert; a working verifier decides `signed: true` | §3.5, §6 |
| R2-20 | Self-heal persists the app's reload step | §3.8, §3.11 |
| R2-21 | "Retry check" is a probe only | §4.3, §5.1 |
| R2-22 | Card → record mapping by canonical path; a moved `CODEX_HOME` needs an explicit choice; ChatGPT restart only when it reads the changed file; VS Code disconnect names siblings | §3.2, §3.8, §4.1, §5.5 |
| R2-23 | Detection: Windows `OpenAI.Codex` package, Linux `chatgpt`, known CLI dirs and `App Paths`, `where.exe` by full path from a neutral cwd | §3.7 |
| R2-24 | Sender gate: active tab's top frame of a normal window; desktop gate is a positive preload capability | §3.11, §4.2 |
| R2-25 | Dispatcher redaction moves to Phase 1; a quiet checker script replaces literal-key `grep` | §6, §7.2 |
| R2-26 | Analytics events and their payload allow-list land in the same phase | §6 |
| R2-27 | Reconnect of a revoked key keeps a still-future expiry and shows it; apply on a `removed` record is rejected | §3.11, §4.3, §5.5 |
| R2-28 | Plain proxy command clears the files dir; "Full" mentions file tools only on stdio routes | §3.5, §5.3 |
| R2-29 | One result type per IPC command; process, handler and launch lookups are async; Phase 1 tests go through the real `Api` facade | §3.2, §3.7, §6 |
| R2-30 | "Done" after a manual restart shows the same follow-up as the automatic path | §5.4 |
| R2-31 | The effective recommended tier is stored on the record | §3.2, §5.5 |
| R2-32 | `bun run update:locale` in Phase 1 set-up and after every `text.json` edit | §2.3, §6 |
| R2-33 | The nudge's Connect and Dismiss are native buttons | §5.9 |

Rejected in round 2: reworking the app-wide sidebar / notification keyboard model (only the AI-connect notification's own buttons change).

### Review round 3 changes

| # | Change | Where |
|---|---|---|
| R3-1 | The connect flow lives in a module-level operation, not in the popup. Closing only requests cancel; cleanup waits for in-flight IPC, then keeps a committed key or revokes an uncommitted one. A CLI timeout is judged by re-reading the installed entry | §3.8, §4.3, §5.2 |
| R3-2 | Each fallback names its key: manual after a failed apply shows the new key and commits it only on **I've updated <App>**; manual reconnect revokes the old key only after that button; LM Studio's file fallback after a deeplink uses the committed key; `removedOld` shows the old key | §3.8, §4.3, §5.6 |
| R3-3 | One revocation rule: disconnect = `revokePending ∪ { appHash }`; a failed release goes to `orphanHashes`; Retry and every check retry all outstanding hashes; `aiConnectCheck` needs no port when the API is off | §3.10, §3.11, §4.3 |
| R3-4 | Signed build: the installed Claude extension's signer and version are verified **before** the key file is written or Enable is offered | §3.8 |
| R3-5 | `entryDigest` of the complete entry Anytype wrote decides ownership of the Claude Desktop config entry; Route A entries compare the key fingerprint **and** the other fields Anytype owns | §3.2, §3.8 |
| R3-6 | `replace` is bound to what the user saw: `{ targetPath, foreignDigest }`, rechecked at apply and on every writer retry | §3.2, §3.8, §3.11 |
| R3-7 | A moved Codex home is not migrated: the old row stays, the sheet offers **Connect this location**, an owned record at that path is reused, nothing is cleaned up automatically | §3.8, §5.3 |
| R3-8 | Reconnect re-reads grant and expiry right before minting; a difference is shown and confirmed again | §4.3 |
| R3-9 | Key-bearing RPCs bypass the gRPC DevTools interceptor as well as console logging | §6, §7.1 |

Also fixed: the §3.11 table said disconnect sets `revokePending: [appHash]`; it is a union everywhere now.

### Phase 1 delta for the implementer (revision 3 → 4)

Phase 1 is being built from revision 3. Apply these in the Phase 1 review-fix pass. **No Phase 1 name was renamed or removed**; everything below is an addition or a loosened rule.

| Area | Change |
|---|---|
| `interface/aiConnect.ts` — `AiRecord` | Add `entryDigest?: string`. `configEntry` keeps its name and gains an optional `env?: Record<string, string>` |
| `interface/aiConnect.ts` — `AiPlan` | Add `foreignDigest?: string` |
| `interface/aiConnect.ts` — `AiListResult` | The `ok: true` variant gains `orphanHashes: string[]` |
| `interface/aiConnect.ts` — new type | `export type AiOrphanResult = { ok: true } \| Fail;` |
| `interface/aiConnect.ts` — `AiApplyResult` | The `needs` variant gains `'installExtension'` (also in the main-side `ApplyOutcome`) |
| `types.ts` — `Ctx` | `replace?: boolean` becomes `replace?: { targetPath: string; foreignDigest: string }` |
| `validate.ts` | `aiConnectApply.replace`: absent, or an object with exactly `targetPath` (string ≤ 4096; compared, never used as a path) and `foreignDigest` (64 hex). `aiConnectCheck.port`: required only when `apiListening === true`; absent or ignored otherwise. New `aiConnectOrphan` shape: `{ accountId, hash, done? }` |
| `registry.ts` | Top-level `orphanHashes: { accountId: string; hash: string }[]` (default `[]`; a file without it loads as empty, no version bump). Methods `addOrphan(accountId, hash)`, `removeOrphan(accountId, hash)`, `listOrphans(accountId)`. `aiConnectList` returns them |
| `jsonFile.ts` / helper | Add `canonicalDigest(value): string` = sha256 hex of JSON with recursively sorted keys (put it next to the fingerprint helper; used for `entryDigest` and `foreignDigest`) |
| `api.ts` | One more method, `aiConnectOrphan`, wired like the others (returns the validation-stage stub until Phase 2 if the service method isn't there yet) |
| `dispatcher.ts` | The `SKIP_LOG` commands also bypass the gRPC DevTools interceptor (`grpc-devtools` `unaryInterceptors`): send them through a call path without it, or have the interceptor skip those method names. The sentinel test runs with the interceptor enabled |
| Tests | `validate`: the new `replace` object, check without a port; `registry`: orphan add / remove / per-account; dispatcher sentinel with the DevTools interceptor on |

Nothing else in Phase 1 changes: `fsSafe`, `tomlFile`, `keyFile`, `proxy`, `detect`, `probe`, `skill`, the wrapper, the build script, the sender gate and the preload capability are as in revision 3.

---

## 1. Goal, non-goals, assumptions, deviations

### 1.1 Goal

A working POC of Settings ▸ **AI apps**: the user clicks Connect on an app card, Anytype mints a scoped key, delivers it to that app in the app's own way, probes that the key works, and lists the connection so it can be changed, reconnected or removed. Release 1 apps: Claude Desktop, Claude Code, ChatGPT (new desktop app), Codex, Cursor, VS Code + GitHub Copilot, LM Studio, Other app (manual). Unsupported cards: ChatGPT Classic, ChatGPT web, Claude web, Ollama.

### 1.2 Non-goals (POC)

- Release 2 adapters, YAML configs, credential helpers, plugin marketplaces, hosted connector.
- A real "Connected" signal. heart has no per-key usage event; the UI has the state but the POC only reaches "Added" (§5.4).
- Stdio proxy on Linux AppImage / Snap / Flatpak (those get "Set up manually").
- Windows ACL verification for files that hold a key; packaged smoke tests on Windows and Linux.
- E2E tests in `../anytype-desktop-suite` (after the POC is accepted).
- Production helper binary; the POC launches the proxy with `ELECTRON_RUN_AS_NODE=1`.

### 1.3 Assumptions

1. Keys: `C.AccountLocalLinkCreateApp`, `UpdateApp`, `RevokeApp`, `ListApps` (`src/ts/lib/api/command.ts`). **`CreateApp` returns only the key** (`{ key }`, `src/ts/lib/api/response.ts`); the hash comes from `ListApps`, whose `I.AppInfo` rows carry `apiKey`, `hash`, `grant`, `expireAt`. heart has no hash derivation to reuse (§4.3 `mintKey`).
2. heart serves `POST http://127.0.0.1:<port>/mcp/{small|large|full}` (Streamable HTTP, JSON only, bearer key) and `GET /v2/auth/whoami`. Its `initialize` result has `serverInfo.name = "anytype"` (verified in heart source by the orchestrator).
3. The live port is the port of `S.Auth.jsonApiStatus.listenAddr` when `jsonApiStatus.success === true` (§4.2).
4. No Electron fuses are configured, so `ELECTRON_RUN_AS_NODE=1` works.
5. Electron main is bundled by esbuild (`scripts/build-electron.js`). Pure-JS libraries not in its `external` list are bundled, so new main-process libraries are **devDependencies** and need no `build.files` entry.
6. `vendor/anytype-mcp/cli.mjs` runs on import, reads `process.argv.slice(2)` (`[run] [--tier small|large|full]`) and `process.env`, and has no runtime dependencies.

### 1.4 Deviations from the design docs

| # | Design says | Plan does | Why |
|---|---|---|---|
| 1 | Claude Desktop: per-connection `.mcpb` with the key in `env` | One **static, signed** `Anytype.mcpb` with no key; its entry point is a wrapper that reads a per-connection key file | User decision: the bundle must be signed, and a signing key can't ship in the app. Reconnect, rotation and port change only rewrite the key file |
| 2 | Claude config fallback writes `<PROXY>` with the key in `env` | The fallback runs the same wrapper + key file | User decision |
| 3 | Restart: AppleScript `quit` on macOS | `SIGTERM` to the app's main process, wait, `open -a <path>` | No Apple Events entitlement or usage string in the signed build; AppleScript also raises a "wants to control" prompt. Electron apps treat `SIGTERM` as a normal quit |
| 4 | Writer supports YAML | JSON/JSONC and TOML only | No Release 1 app uses YAML |
| 5 | Registry record has no account or ownership proof | Record carries `accountId` and a key fingerprint | Two accounts or profiles on one machine share the same physical files |
| 6 | Codex: Route C under Advanced | Codex is MCP only. **Deferral awaiting product sign-off** | Route C needs `network_access = true` for every command |
| 7 | Cursor deeplink; Copilot CLI and `code --add-mcp` fallbacks | Not in the POC; failure → "Set up manually". **Deferral** | Unverified `headers` in Cursor's link; the CLI fallbacks put the key in argv |
| 8 | Self-heal rewrites every entry on port change | Config-file and key-file connections are rewritten silently (key read back from the entry). CLI-managed ones (Claude Code MCP route) become "Needs attention → Reconnect" | Main never stores keys; `~/.claude.json` must not be hand-edited |
| 9 | Brand icons per card | Real app icon from `app.getFileIcon` at runtime; letter avatar otherwise | No brand assets in the repo |
| 10 | "Other app" command format | Plain `<PROXY>` object from apps.md §0.1 (key in `env`) | The user copies the key by hand anyway |
| 11 | Manual screen has a "Your system" selector | Dropped; steps are for this computer. **Deferral** | POC scope |
| 12 | `AiConnectConnected` analytics event | `AiConnectProbeOk` in the POC; `AiConnectConnected` reserved for real client use | The POC can't observe the app's first request |

### 1.5 Product decisions already made

- Default access: **read and edit · All spaces** (`DEFAULT_GRANT` in `catalog.ts`).
- Claude Code default route: **Skill + API**, labelled **provisional** until the Route C vs MCP eval; MCP under Advanced (`defaultRoute` in the catalog).
- Restart of another app: only after the user clicks "Restart <App>". macOS and Windows; Linux shows the instruction.
- Nudge: yes, once per profile, dismissible.
- `.mcpb` is signed in release CI; unsigned in local, dev and nightly builds.

---

## 2. Codebase map

### 2.1 Electron main

| What | Where | Pattern to follow |
|---|---|---|
| IPC entry | `electron/ts/main.ts` `ipcMain.handle('Api', (e, id, cmd, args) …)` calls `Api[cmd](win, ...args)` after `Util.isTrustedUrl(e.senderFrame?.url)` | Add methods to `class Api` in `electron/ts/api.ts`; each validates its argument and delegates to the `aiConnect` service |
| Tab senders | `AppWindow.views: TabView[]` (`electron/ts/types.ts`); a tab is a `WebContentsView` | Used for the sender gate in §3.11 |
| Renderer call | `src/ts/lib/renderer.ts` `Renderer.send(cmd, ...args)` returns a promise | Always pass one plain object |
| Writing other apps' files | `electron/ts/lib/installNativeMessagingHost.ts` | Home via `userInfo().homedir` on macOS, `homedir()` elsewhere; unpacked path via `fixPathForAsarUnpack(__dirname)` + `dist/…` |
| Logging | `Util.log(method, ...args)` | Never pass keys, file contents, env or CLI stdin |
| Tests | vitest, `electron/**/*.test.ts` and `src/**/*.test.ts` | Tested modules do **not** import `electron`; dependencies are injected. Only `aiConnect/index.ts` and `api.ts` touch Electron |
| Lint | ESLint **excludes** `electron/**` and `scripts/**` | Main-process quality rests on `tsc -p tsconfig.electron.json` and vitest |
| Shared code | `src/ts/interface/linkApproval.ts` is imported by main and renderer | Shared types and the static catalog live in `src/ts/…`, imported from main by relative path |
| Deep links | `main.ts` `open-url` / `second-instance` → `Util.send(win, 'route', Util.getRouteFromUrl(url))`; renderer `app.tsx` `onRoute` → `U.Router.go` | `anytype://ai/connect?app=x` arrives as `/ai/connect?app=x` |
| App menu | `electron/ts/menu.ts` Help submenu → `Util.send(this.win, 'commandGlobal', '<cmd>')` → `keyboard.onCommand` | |
| Packaging | `package.json` `build.files`, `build.asarUnpack`, mirrored in `package.deps.json` | |
| Build | `scripts/build-electron.js` runs first in `start:*`, `build*`, `dist:*`. Release CI: `.github/workflows/build.yml` runs `bun run build`, then `bunx electron-builder …` | |

### 2.2 Renderer

| What | Where |
|---|---|
| Settings page map | `src/ts/component/page/main/settings/index.tsx` `Components`; rendered in `.settingsPageContainer` > `#pageSettings<Id>.settingsPage` |
| Settings sidebar | `src/ts/component/sidebar/page/settings/index.tsx` `getAppSettings()`; "New" badge via `apiKeyIsNew()` / `apiKeyMarkSeen()` (`src/ts/lib/apiKey.ts`) |
| Settings names | `U.Menu.settingsSectionsMap()` (`src/ts/lib/util/menu.ts`) |
| Search popup settings list | `src/ts/component/popup/search.tsx` (array holding `{ id: 'api', … }`) |
| Open a settings page | `Action.openSettings(id, route)`; extra route params travel in `object._routeParam_` (merged into the match params by `U.Object.openRoute`) |
| Reference page | `src/ts/component/page/main/settings/api.tsx` |
| Popups | `src/ts/component/popup/index.tsx` `Components`; props `I.Popup`; `S.Popup.open(id, { data, preventCloseByClick, preventCloseByEscape })`; `S.Popup.update(id, param)`; the global Esc handler in `keyboard.ts` reads `param.preventCloseByEscape` |
| Native-control popup precedent | `src/ts/component/form/apiKeyEditor.tsx`: native `<form>`, `<button className="button black">`, `<select>` in `.expirySelect`, `<input>`; styles in `src/scss/popup/apiCreate.scss`. **`Component` `Button` and `Select` render non-focusable `div`s**, so this feature uses the native pattern |
| Grant UI | `src/ts/component/form/appGrantFields.tsx` (native inputs), `src/scss/form/appGrantFields.scss`; helpers `linkApprovalGrant`, `isValidLinkGrant`, `sameLinkGrant`, `apiKeyCreateError`, `API_KEY_NAME_MAX_BYTES` |
| Stores | `src/ts/store/<name>.ts`, exported from `src/ts/store/index.ts`, used as `S.<Name>` |
| Other components | `Title`, `Label`, `Icon`, `Loader`, `EmptyState`, `Filter` from `Component` |
| Text | `src/json/text.json` (never edit `dist/lib/json/lang/*`) |
| Toast / copy | `Preview.toastShow({ text })`, `U.Common.copyToast(label, value)` |
| Notifications | `S.Notification.add(new M.Notification({…}))`; item `src/ts/component/notification/index.tsx`; list with "Clear all" `src/ts/component/list/notification.tsx`; model `src/ts/model/notification.ts` |
| Analytics | `analytics.event(code, data)` (`src/ts/lib/analytics.ts`); only `KEYS` are sent; the method adds `spaceId`, `spaceType`, `permissions` from the current space |
| Dispatcher debug log | `src/ts/lib/api/dispatcher.ts` `needRequestLog(type)` gates `console.log` of request and response bodies |
| Router | `src/ts/lib/util/router.ts` `getParam()`, `isDoubleRedirect()`; redirect page example `page/main/membership.tsx`; page map `page/index.tsx` |
| Web mode and extension | `src/ts/lib/web/electronMock.ts` and the extension mock both define `window.Electron.Api`, so "Api exists" does not prove desktop. The real bridge is `electron/js/preload.cjs` |
| Storybook | story next to the component; popups use `withPopup('<PopupId>')` and `popupProps()` |
| SCSS | `src/scss/page/main/settings.scss`; one file per popup in `src/scss/popup/`, imported in `popup/common.scss`; dark overrides only in `src/scss/theme/dark/` |
| Reusable classes | `.titleWrapper`, `.actionItems > .item`, `Label.section`, `.localApiStatus.isSuccess/.isError`, `.apiKeyEditor` (`.title`, `.description`, `.accessNotice`, `.apiKeyButtons`, `.apiKeyError`, `.expiryRow`, `.expirySelect`, `.nameField`, `textarea`) |

### 2.3 Environment baseline (verified)

- `bun run typecheck` and `bun run lint` pass on the untouched worktree.
- `bun run test` has **90 pre-existing failures in 6 files** (`src/ts/lib/history.test.ts`, `src/ts/lib/util/{common,date,embed,file,router}.test.ts`: "ReferenceError: U is not defined"). The gate is **no new failures, every new test passes**. Do not add tests to those six files.
- Set-up already done: `./update.sh macos-latest arm64`, `bash scripts/generate-protos.sh --from-dist`, `bun run update:locale`.
- `bun run update:locale` generates `dist/lib/json/lang/*.json`. **Rerun it after every `text.json` edit**: Electron main's `Util.translate` reads `en-US.json` (the Help menu label depends on it).

---

## 3. Design

### 3.1 Files

New, main process:

```
electron/mcp/connect.mjs                 key-file wrapper (plain ESM, zero deps)
electron/mcp/manifest.json               .mcpb manifest (wrapper version lives here)
electron/mcp/skill-preamble.md           Anytype-authored block for the installed skill
scripts/build-mcp.js                     copies to dist/mcp, packs, validates and signs Anytype.mcpb
scripts/ai-connect-keycheck.js           quiet check that a key is absent from a directory (§7.2)
electron/ts/lib/aiConnect/
  types.ts  validate.ts  fsSafe.ts  jsonFile.ts  tomlFile.ts  registry.ts  keyFile.ts
  proxy.ts  detect.ts  exec.ts  restart.ts  probe.ts  skill.ts  index.ts
  adapters/index.ts  jsonEntry.ts  claudeDesktop.ts  claudeCode.ts  codex.ts
           cursor.ts  copilot.ts  lmstudio.ts  other.ts
  *.test.ts next to each module (incl. buildMcp.test.ts and connect.test.ts)
```

New, shared and renderer:

```
src/ts/interface/aiConnect.ts            shared types
src/ts/lib/aiConnect/catalog.ts          static app table + defaults (pure data)
src/ts/lib/aiConnect/deeplink.ts         parseAiConnectRoute (pure)
src/ts/lib/aiConnect/flow.ts             connect / reconnect / disconnect orchestration
src/ts/lib/aiConnect/steps.ts            fill and mask manual steps
src/ts/store/aiConnect.ts                S.AiConnect
src/ts/component/page/main/settings/aiApps.tsx (+ .stories.tsx)
src/ts/component/page/main/aiConnect.tsx        deep-link redirect page
src/ts/component/popup/aiConnect/index.tsx      container (owns RPCs)
  form.tsx finish.tsx manage.tsx manual.tsx unsupported.tsx   props-driven views (+ stories)
src/ts/component/util/aiAppIcon.tsx (+ .stories.tsx)
src/ts/component/form/appGrantFields.stories.tsx
src/scss/popup/aiConnect.scss
```

Edited: `electron/ts/api.ts`, `electron/ts/main.ts` (sender gate), `electron/ts/menu.ts`, `scripts/build-electron.js`, `package.json`, `package.deps.json`, `.gitignore`, `.github/workflows/build.yml` (Phase 4), `src/ts/store/index.ts`, `src/ts/interface/index.ts`, `src/ts/interface/notification.ts`, `src/ts/model/notification.ts`, `src/ts/component/notification/index.tsx`, `src/ts/component/list/notification.tsx`, `src/ts/component/popup/index.tsx`, `src/ts/component/page/index.tsx`, `src/ts/component/page/main/settings/index.tsx`, `src/ts/component/page/main/settings/api.tsx`, `src/ts/component/sidebar/page/settings/index.tsx`, `src/ts/component/popup/search.tsx`, `src/ts/component/form/appGrantFields.tsx`, `src/ts/lib/action.ts`, `src/ts/lib/util/menu.ts`, `src/ts/lib/util/router.ts`, `src/ts/lib/keyboard.ts`, `src/ts/lib/analytics.ts`, `src/ts/lib/api/dispatcher.ts`, `electron/js/preload.cjs`, `src/ts/app.tsx`, `src/json/text.json`, `src/scss/page/main/settings.scss`, `src/scss/popup/common.scss`, docs READMEs.

New devDependencies (bundled by esbuild or used by the build script): `jsonc-parser` (^3.3.1), `smol-toml` (^1.3.0), `jszip` (^3.10.1), `@anthropic-ai/mcpb` (pinned exact version; build script only). `.npmrc` has `min-release-age=7d`; pick versions older than that.

### 3.2 Shared types (`src/ts/interface/aiConnect.ts`)

```ts
// Card the user sees
export type AiAppId = 'claude-desktop' | 'claude-code' | 'chatgpt' | 'codex' | 'cursor' | 'vscode' | 'lmstudio' | 'other'
	| 'chatgpt-classic' | 'chatgpt-web' | 'claude-web' | 'ollama';
// Physical target = one registry record. 'codex-home' is the $CODEX_HOME file when it differs from ~/.codex (§3.8)
export type AiTargetId = 'claude-desktop' | 'claude-code' | 'codex' | 'codex-home' | 'cursor' | 'copilot' | 'lmstudio' | `other-${string}`;
export type AiRoute = 'http' | 'stdio' | 'skill';
export type AiTier = 'small' | 'large' | 'full';
export type AiNextStep = 'none' | 'confirmInApp' | 'restart' | 'newSession' | 'reloadServer' | 'toggle';
export type AiMethod = 'cli' | 'package' | 'keyfile' | 'config' | 'deeplink' | 'manual';
export type AiStatus = 'ok' | 'pending' | 'removed' | 'accessEnded' | 'unreadable' | 'notInstalled' | 'reconnect' | 'conflict' | 'revokeFailed';
export type AiApiState = 'disabled' | 'unknown' | 'failed' | 'listening';
export type AiErrorStage = 'validate' | 'detect' | 'read' | 'parse' | 'write' | 'verify' | 'cli' | 'open' | 'restart' | 'probe' | 'key';
export type AiErrorCategory = 'unparseable' | 'unsupportedForm' | 'permission' | 'notFound' | 'cliFailed' | 'cliTooOld' | 'timeout'
	| 'changed' | 'conflict' | 'stale' | 'outsideHome' | 'unsupportedPackage' | 'keyNotFound' | 'unreachable' | 'unauthorized' | 'apiOff' | 'unknown';
export interface AiError { stage: AiErrorStage; category: AiErrorCategory; path?: string; removedOld?: boolean; };

export interface AiAppCatalogItem {
	id: AiAppId;
	name: string;                 // brand name, not translated; '' when nameKey is set
	nameKey?: string;
	aliases: string[];
	kind: 'app' | 'manual' | 'unsupported' | 'router';
	routes: AiRoute[];
	defaultRoute?: AiRoute;
	defaultTier: AiTier;
	covers?: string;              // text key
	offer?: AiAppId[];
	getUrl?: string;
};

export interface AiDetection {
	appId: AiAppId;
	installed: boolean;
	icon?: string;                // PNG data URL
	targetId?: AiTargetId;        // which record id this card maps to on this machine
	targetPaths: string[];        // canonical absolute paths this card reads; a record belongs to the card only when its targetPath is one of them (or is '')
	canRestart: boolean;          // this platform + this install can be restarted by Anytype
};

// Persisted in the registry. No secrets.
export interface AiRecord {
	id: AiTargetId;
	appId: AiAppId;               // card that created it
	accountId: string;
	appHash: string;
	keyFp: string;                // first 16 hex of sha256(key); '' only for manual records
	name: string;
	route: AiRoute;
	tier: AiTier;
	recommendedTier: AiTier;      // effective recommended tier at connect time ('small' when routed from Ollama)
	method: AiMethod;
	targetPath: string;           // resolved absolute path, or '' (CLI / manual)
	port: number;
	createdAt: number;
	grant: I.LinkAppGrant;        // last known, for reconnect when the key is gone
	expireAt: number;             // absolute seconds, 0 = never
	nextStep: AiNextStep;         // outstanding step
	observedInstalled: boolean;   // the entry / extension was seen at least once
	lastProbe: 'none' | 'ok' | AiErrorCategory;
	revokePending: string[];      // a set: hashes whose revoke heart has not confirmed
	removed: boolean;             // cleanup done, waiting for the revoke
	left?: 'extension' | 'entry'; // what cleanup could not remove
	createdDirs: string[];        // directories Anytype created; not counted as install evidence
	configEntry?: { command: string; args: string[]; env?: Record<string, string> };   // Claude Desktop config fallback: what Anytype wrote (readable copy)
	entryDigest?: string;         // sha256 of the canonical JSON (sorted keys) of the complete entry Anytype wrote; decides ownership of a keyless entry (R3-5)
};

// What the renderer gets
export interface AiConnection extends AiRecord {
	status: AiStatus;
	displayTarget: string;        // targetPath with the home prefix replaced by '~'
	firstUsedAt?: number;         // reserved for the heart event; undefined in the POC
};

export interface AiStep { textKey: string; args?: string[]; snippet?: string; lang?: 'json' | 'toml' | 'sh' | 'text'; path?: string; };

export interface AiPlan {         // never contains a key; KEY_PLACEHOLDER marks where it goes
	appId: AiAppId; targetId: AiTargetId | null; route: AiRoute; tier: AiTier; method: AiMethod; nextStep: AiNextStep;
	displayTarget: string;
	canApply: boolean;
	preflight?: 'quitApp' | 'quitAppSelf';   // the app must be closed first; consent is asked BEFORE a key is minted
	error?: AiError;              // why canApply is false
	existing: 'none' | 'ours' | 'foreign';   // 'foreign': an anytype entry this account's record doesn't own
	foreignDigest?: string;       // canonical digest of the foreign entry the user is shown; `replace` must send it back (R3-6)
	sentenceKey: string;          // what will happen (§5.3)
	instructions: Partial<Record<AiNextStep | 'stalled' | 'afterRestart' | 'added', string>>;   // text keys (§5.4)
	steps: AiStep[];              // ordered manual steps
	note?: string;                // text key, e.g. why the route was switched
	bundleSigned?: boolean;       // Claude Desktop only, from mcpb.json
};

// One result type per IPC command, imported by main and renderer
type Fail = { ok: false; error: AiError };
export type AiListResult = { ok: true; scanOk: boolean; detections: AiDetection[]; connections: AiConnection[]; orphanHashes: string[] } | Fail;
export type AiOrphanResult = { ok: true } | Fail;
export type AiPlanResult = AiPlan;
export type AiApplyResult =
	| { ok: true; connection: AiConnection; openFailed?: boolean }
	| { ok: false; needs: 'quitApp' | 'quitAppSelf' | 'installExtension' }   // quit*: the app started between plan and apply; installExtension: signed build, Claude must install the signed bundle first (R3-4)
	| Fail;
export type AiRecordManualResult = { ok: true; connection: AiConnection } | Fail;
export type AiUpdateResult = { ok: true; connection: AiConnection } | Fail;
export type AiRemoveResult = { ok: true; connection: AiConnection } | Fail;          // the record, now `removed`
export type AiRevokedResult = { ok: true; connection: AiConnection | null } | Fail;  // null: record deleted
export type AiCheckResult = { ok: true; connections: AiConnection[]; healed: string[] } | Fail;
export type AiProbeResult = { ok: true } | { ok: false; category: AiErrorCategory };
export type AiStepDoneResult = { ok: true; connection: AiConnection } | Fail;
export type AiRestartResult = { ok: true } | Fail;
export type AiRevealResult = { ok: boolean };
export type AiOpenAppResult = { ok: boolean };
export type AiClaimNudgeResult = { claimed: boolean };
export type AiBundleInfoResult = { signed: boolean } | null;
```

`KEY_PLACEHOLDER = '<KEY>'` is exported from `catalog.ts`. Main-only types (`Env`, `Ctx`, `Adapter`) are in `electron/ts/lib/aiConnect/types.ts` (§3.7, §3.8).

### 3.3 Static catalog (`src/ts/lib/aiConnect/catalog.ts`)

| id | name | kind | routes (default first) | tier | aliases | offer |
|---|---|---|---|---|---|---|
| `claude-desktop` | Claude Desktop | app | stdio | large | claude, anthropic | |
| `claude-code` | Claude Code | app | skill, http | large | claude, cc | |
| `chatgpt` | ChatGPT | app | http | large | openai, gpt | |
| `codex` | Codex | app | http | large | openai | |
| `cursor` | Cursor | app | http | large | | |
| `vscode` | VS Code + GitHub Copilot | app | http | large | copilot, github, vs code, visual studio code | |
| `lmstudio` | LM Studio | app | http | small | lm studio, local | |
| `other` | key `aiAppOther` | manual | http, stdio | large | mcp, custom | |
| `chatgpt-classic` | ChatGPT Classic | unsupported | — | — | | `chatgpt` |
| `chatgpt-web` | key `aiAppChatgptWeb` | unsupported | — | — | | `chatgpt` |
| `claude-web` | key `aiAppClaudeWeb` | unsupported | — | — | | `claude-desktop`, `claude-code` |
| `ollama` | Ollama | router | — | small | | `claude-code`, `codex`, `vscode`, `chatgpt` (Ollama's launch integrations among supported cards) |

Next steps, restart ability and target ids are **not** in the catalog: they depend on the platform and the install, so the adapter returns them (`AiPlan`, `AiDetection`).

Also exported: `DEFAULT_GRANT`, `TIERS`, `EXPIRY_DAYS = [ 0, 7, 30, 90, 365 ]`, `getCatalogItem(id)`, `searchCatalog(query)`, `isValidPort(n)` (integer 1–65535; the **only** port validator, used by renderer and main and mirrored in the wrapper).

### 3.4 Key file and wrapper (Route B)

**Path:** `<home>/.anytype/ai-connect/<targetId>.json`. Directory `0700`, file `0600`. `ANYTYPE_AI_CONNECT_DIR` overrides the directory and is a **test-only** override (documented as such in the wrapper and in `keyFile.ts`; Anytype never sets it in a written entry).

Why this path: the wrapper runs under a foreign runtime (Claude's Node, or Electron in Node mode) and can only compute a path from `os.homedir()`. Anytype's `userData` is not knowable there, and on Windows it is under `%APPDATA%`, which packaged Claude virtualises.

**Content:** `{ "version": 1, "baseUrl": "http://127.0.0.1:31009", "tier": "large", "key": "<KEY>" }`

**`electron/mcp/connect.mjs`** (≤ 90 lines, Node ≥ 18, no dependencies):

1. Parse `--connection <id>`; require `/^[a-z0-9-]{1,64}$/`.
2. `lstat` the directory and the file: a symlink at either → fail closed. Read and `JSON.parse`. Valid: `version === 1`; `baseUrl` matches `/^http:\/\/127\.0\.0\.1:(\d{1,5})$/` with the port in 1–65535; `tier` is one of the three; `key` is a non-empty string.
3. Valid: `delete process.env.ANYTYPE_MCP_FILES_DIR; delete process.env.ANYTYPE_MCP_TIER;` set `ANYTYPE_API_BASE_URL` and `OPENAPI_MCP_HEADERS` (`{"Authorization":"Bearer <key>"}`), set `process.argv = [ argv[0], argv[1], 'run', '--tier', tier ]`, then `await import('./cli.mjs')`.
4. Invalid or missing: **fail closed**. One line on stderr; answer every JSON-RPC request from stdin with error `-32001`, message "Anytype is not connected to this app. Open Anytype ▸ Settings ▸ AI apps and reconnect." Ignore notifications. Exit 0 when stdin ends.
5. Never print the file's content, the key or the environment.

The wrapper reads the file once at start; a rewritten file takes effect when the AI app next starts the server. A revoked key is reported by the proxy in its own words (ask to anytype-mcp, not POC work).

**`keyFile.ts`:** `keyFileDir(env)`, `keyFilePath(env, id)`, `writeKeyFile(env, id, data)` (atomic, **no backup**, modes above), `readKeyFile(env, id)`, `removeKeyFile(env, id)`. `id` passes the regex; the path stays inside the directory. Before every read or write, walk the chain from the real home down: `~/.anytype` and `~/.anytype/ai-connect` must each be a real directory (`lstat`: not a link), and the key file must not be a link. Any link → refuse.

### 3.5 Bundled files and the static `.mcpb`

**`scripts/build-mcp.js`** exports `build({ outDir })`, called at the end of `scripts/build-electron.js` (once in watch mode):

1. Copy `vendor/anytype-mcp/cli.mjs`, `electron/mcp/connect.mjs` → `dist/mcp/`; `vendor/anytype-api-skill/SKILL.md` → `dist/mcp/skill/SKILL.md`; `electron/mcp/skill-preamble.md` → `dist/mcp/skill/PREAMBLE.md`.
2. Pack `dist/mcp/Anytype.mcpb` with `jszip`, `compression: 'STORE'`, fixed dates: `manifest.json`, `server/connect.mjs`, `server/cli.mjs`, `icon.png` (`electron/img/icons/256x256.png`).
3. Validate the manifest: `mcpb validate <manifest>` (execFile, argument array). Failure fails the build.
4. Sign:
   - `MCPB_SIGN_CERT` + `MCPB_SIGN_KEY` set → `mcpb sign`. Then verify with a verifier that actually checks the signature and yields the signer certificate: use `mcpb verify` only if the Phase 1 positive-path test (§6) shows it accepts a valid signature and rejects a tampered archive; otherwise use `openssl cms -verify` in the script (CI images have openssl) or a small pinned PKCS#7 library. Compare the signer certificate's SHA-256 fingerprint with `MCPB_SIGN_FINGERPRINT`; a mismatch, a missing variable or a failed verification fails the build. `signed: true` is written only after this passes. Confirm exact flag names against the pinned mcpb `CLI.md`.
   - `MCPB_SIGN_REQUIRED=1` without cert and key → fail the build.
   - Otherwise log `[build-mcp] Anytype.mcpb is UNSIGNED`.
5. Write `dist/mcp/mcpb.json` = `{ "signed": boolean, "sha256": "<of the .mcpb>", "signerFingerprint"?: string, "wrapperVersion": "<manifest version>" }`. The UI's unsigned note and the extension-outdated check read this file through main; nothing uses `isPackaged` for it.

**`electron/mcp/manifest.json`:**

```json
{
  "manifest_version": "0.3",
  "name": "anytype",
  "display_name": "Anytype",
  "version": "1.0.0",
  "description": "Your Anytype spaces in Claude",
  "author": { "name": "Anytype" },
  "icon": "icon.png",
  "server": {
    "type": "node",
    "entry_point": "server/connect.mjs",
    "mcp_config": { "command": "node", "args": ["${__dirname}/server/connect.mjs", "--connection", "claude-desktop"] }
  },
  "tools_generated": true,
  "compatibility": { "platforms": ["darwin", "win32"], "runtimes": { "node": ">=18.0.0" } }
}
```

`version` is the **wrapper version**, not the app version: bump it only when `connect.mjs`, the vendored `cli.mjs` or the manifest changes, so an Anytype update doesn't re-offer the bundle. `name` equals heart's `serverInfo.name` (`anytype`); Phase 1 re-checks it against a running heart.

**Packaging:** add `"dist/mcp/**/*"` to `build.files` and `build.asarUnpack` in `package.json` and to `package.deps.json`; add `dist/mcp/` to `.gitignore`.

**`proxy.ts`:** `mcpDir(appRoot)`, `bundleInfo(env)` (parsed `mcpb.json` or `null`), `proxySupported(env)` (false on Linux when `APPIMAGE`, `SNAP` or `FLATPAK_ID` is set), `wrapperCommand(env, targetId)` → `{ command: execPath, args: [ <mcpDir>/connect.mjs, '--connection', id ], env: { ELECTRON_RUN_AS_NODE: '1' } }`, `plainProxyCommand(env, { port, tier })` (for `other`: `cli.mjs`, `--tier`, env with `KEY_PLACEHOLDER` and `ANYTYPE_MCP_FILES_DIR: ''`, so an inherited value can't redirect the file tools).

### 3.6 Config-writing contract (`fsSafe.ts`, `jsonFile.ts`, `tomlFile.ts`)

`fsSafe.resolveTarget(env, file)` → `{ real, exists }` or an error:

- Resolve symlinks with `realpath` (for a missing file, resolve the nearest existing parent). The resolved path must be inside `realpath(home)`; otherwise `{ stage: 'read', category: 'outsideHome' }` → manual. This covers `CODEX_HOME`, `COPILOT_HOME`, `CLAUDE_CONFIG_DIR` and LM Studio's pointer.
- All later steps (backup, temp file, rename) use the **resolved** directory.

`fsSafe.readSnapshot(real)` → `{ text: string | null, mode: number | null }`.

`fsSafe.readSnapshot(real)` also records the file's identity (`dev` + `ino` from `stat`).

`fsSafe.writeFileSafe(real, text, { snapshot, secret })`:

1. Backup (existing file only): refuse if `<real>.anytype-backup` is a link. Write the **snapshot text** to an exclusive (`wx`) `0600` sibling temp file, then rename it over `<real>.anytype-backup`. One copy.
2. Write the new content to a temp file in the same directory, `fsync`, close.
3. **Recheck, then rename.** Compare the current target with the snapshot (text, mode, identity). Equal → `rename`. On Windows, on `EBUSY` / `EPERM`, wait 100 ms and repeat **this whole step** (recheck, then rename), at most 3 times. Never unlink the target first.
4. Target changed → discard the temp file and return `'changed'`. The caller re-plans once from the fresh content, **including the ownership check**; a second `'changed'` becomes `{ stage: 'write', category: 'changed' }`.
5. Modes (POSIX): new file `0600`; an existing file keeps its mode, except when `secret` is true and the mode has any group/other bit → `0600`. New directories `0700`, at most two missing levels; each created directory is returned so the service can store it in `createdDirs`.
6. Windows ACLs are not checked in the POC (§8).

`jsonFile.ts` (`jsonc-parser`):

```ts
readJson (text: string | null): { value: any } | { error: true }          // null/blank → {}; root must be an object
setJsonPath (text: string | null, path: (string | number)[], value: any): string   // modify() + applyEdits(); indentation detected, 2 spaces for a new file
removeJsonPath (text: string, path): string
getJsonPath (text: string | null, path): any
mutationOnly (beforeText: string | null, afterText: string, mutate: (doc: any) => void): boolean
```

`mutationOnly` is the guard before every write: parse the original (or `{}`), apply the **intended** mutation to that parsed object, and deep-equal it with the parsed result. This allows newly created ancestors on a first install and still catches any other change.

**Removal and comments (JSONC).** `jsonc-parser`'s removal edit can take a comment that belongs to the next member. After computing the edit, inspect the removed range: if it contains a comment that sits after our member's value (between it and the next member), shrink the range to end at our value plus its comma; if that can't be done cleanly, return `unsupportedForm` → manual. Fixture: `anytype` is the first server and a comment precedes the next one.

`tomlFile.ts` (`smol-toml`), `setTomlTable(text, 'mcp_servers.anytype', body)`:

1. Parse `text` (null/blank → empty). Error → `unparseable`.
2. Find header lines `^\s*\[mcp_servers\.anytype(\.[^\]]+)?\]\s*(#.*)?$`. A span starts at the header and ends at the **last non-blank, non-comment line** before the next line matching `^\s*\[`; comments and blank lines that introduce the next table stay. If a span contains `"""` or `'''` → `unsupportedForm`.
3. The parsed document has `mcp_servers.anytype` but no header matched (inline, dotted or quoted form) → `unsupportedForm`.
4. Remove the spans; append `\n[mcp_servers.anytype]\n<body>\n` at EOF.
5. Guard: parse the result and compare it with the parsed original after applying the intended mutation (the same idea as `mutationOnly`, so a first table in an empty file passes). Failure → `unparseable`, nothing written.

`removeTomlTable` uses steps 1–3 and the guard with a delete mutation. The expected mutation deletes `mcp_servers.anytype` and then **prunes `mcp_servers` if it is left empty and the text has no explicit `[mcp_servers]` header** (an implicit parent disappears with its last child; an explicit header parses to an empty table and stays).

### 3.7 Detection (`detect.ts`) and `Env`

```ts
interface Env {
	platform: NodeJS.Platform; home: string; vars: Record<string, string>; execPath: string; appRoot: string;
	exists (p: string): boolean;
	lstat (p: string): { isSymlink: boolean; isDir: boolean; mode: number } | null;
	realpath (p: string): string | null;
	readText (p: string): string | null;
	readDir (p: string): string[];
	writeFile (p: string, text: string, mode: number): void;       // plus fsync; used by fsSafe
	rename (from: string, to: string): void;
	chmod (p: string, mode: number): void;
	mkdir (p: string, mode: number): void;
	unlink (p: string): void;
	copyFile (from: string, to: string): void;
	run (file: string, args: string[], opts: { timeout: number; stdin?: string; env?: Record<string, string> }): Promise<{ code: number; stdout: string }>;   // cwd is always env.home
	launch (file: string, args: string[]): Promise<boolean>;             // detached; resolves on 'spawn', false on 'error'; cwd = env.home
	listProcesses (): Promise<{ pid: number; ppid: number; exe: string; cmd: string }[] | null>;     // null = unknown
	kill (pid: number, signal: 'SIGTERM'): boolean;
	openExternal (url: string): Promise<boolean>;                         // allow-list: lmstudio: only
	protocolHandler (scheme: string): Promise<{ name: string; path: string } | null>;   // app.getApplicationInfoForProtocol
	showItemInFolder (p: string): void;
	now (): number;
	sleep (ms: number): Promise<void>;
}
```

**Config-home resolver** (`detect.resolveHomes(env)`), one function used by detect, plan, apply, check and remove:

- Shell environment (macOS/Linux): one call `run(shell, [ '-lc', SCRIPT ], { timeout: 4000 })` where `shell` = `vars.SHELL`, else `/bin/zsh` on macOS, `/bin/sh` on Linux. `SCRIPT` is a constant that prints labelled lines, each command guarded with `|| true`: `printf 'claude=%s\n' "$(command -v claude || true)"` and the same for `codex`, `code`, `copilot`, `agent`, `cursor`, `lms`, `ollama`; then `PATH=`, `CODEX_HOME=`, `COPILOT_HOME=`, `CLAUDE_CONFIG_DIR=`. Parse only lines of the form `name=value`; CLI values must be absolute paths that exist. Cache 60 s.
- Windows: run `%SystemRoot%\System32\where.exe <name>` by its full path, per CLI; accept only results ending in `.exe`. A `.cmd` / `.bat` shim counts as **detected but not runnable** (`cli: null`, `cliShim: true`): CLI routes return manual; a shim is never passed to `execFile`. Overrides come from `process.env`.
- After a miss, probe known locations before giving up: `~/.local/bin`, `~/.claude/local`, `/opt/homebrew/bin`, `/usr/local/bin`; on Windows the `App Paths` keys under HKCU and HKLM (`reg.exe query`, full path, read-only).
- **Every child process gets an explicit neutral `cwd` (`env.home`)**, never the inherited one, so a file in the working directory can't shadow a system tool.
- Homes: Codex = `CODEX_HOME` or `~/.codex`; Copilot = `COPILOT_HOME` or `~/.copilot`; Claude Code = `CLAUDE_CONFIG_DIR` or `~/.claude` (settings and skills live under it).
- The ChatGPT desktop app is started from the Dock and never sees a shell-only `CODEX_HOME`, so the **ChatGPT card always resolves `~/.codex/config.toml`**; the Codex card resolves the shell value. They share a record only when both resolve to the same real file.

**App evidence:**

| App | macOS | Windows | Linux |
|---|---|---|---|
| claude-desktop | app with bundle id `com.anthropic.claudefordesktop` | package dir `%LOCALAPPDATA%\Packages\Claude_*` or `AnthropicPBC.Claude*`, or `%LOCALAPPDATA%\AnthropicClaude\Claude.exe` | `~/.config/Claude` |
| claude-code | CLI `claude`, or `~/.claude.json`, or the Claude Code home dir | same | same |
| chatgpt | app with bundle id `com.openai.codex` | current-user package `OpenAI.Codex` (PowerShell `Get-AppxPackage -Name OpenAI.Codex`, timeout 5000). `%USERPROFILE%\.codex` alone does **not** count | the documented `chatgpt` executable on PATH or its desktop entry (`~/.local/share/applications`, `/usr/share/applications`) |
| chatgpt-classic | bundle id `com.openai.chat` | — | — |
| codex | CLI `codex`, or the Codex home dir | same | same |
| cursor | `Cursor.app`, CLI `cursor` or `agent`, or `~/.cursor/` | `%LOCALAPPDATA%\Programs\cursor\Cursor.exe`, CLIs, or `%USERPROFILE%\.cursor` | CLIs, `~/.cursor/` |
| vscode | `Visual Studio Code.app`, CLI `code` or `copilot`, or the Copilot home | `%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe`, CLIs, Copilot home | CLIs, Copilot home |
| lmstudio | `LM Studio.app`, `~/.lmstudio`, `~/.cache/lm-studio`, `~/.lmstudio-home-pointer`, CLI `lms` | same dirs | same |
| ollama | `Ollama.app`, CLI `ollama`, `~/.ollama` | same | same |

- macOS apps: `/Applications/<Name>.app`, `~/Applications/<Name>.app`, then `mdfind "kMDItemCFBundleIdentifier == '<id>'"` (timeout 3000). Confirm with `plutil -extract CFBundleIdentifier raw -o - <app>/Contents/Info.plist`.
- A directory listed in any record's `createdDirs` is **not** evidence.
- `detectAll` returns `{ scanOk, items }`; `scanOk` is false when the shell call and the app scan both failed.
- Icons (Electron side, `index.ts`): `app.getFileIcon(appPath, { size: 'normal' })` → data URL, cached by path.

### 3.8 Adapters

```ts
interface Ctx {
	env: Env; appId: AiAppId; targetId: AiTargetId; port: number; tier: AiTier; route: AiRoute;
	key: string;                        // apply only; '' elsewhere
	method?: 'config';                  // ask for the file fallback explicitly
	manual?: boolean;                   // manual setup: prepare Anytype's side, open nothing
	allowQuit?: boolean;
	replace?: { targetPath: string; foreignDigest: string };   // what the user agreed to replace (R3-6)
}
type ApplyOutcome =
	| { ok: true; method: AiMethod; nextStep: AiNextStep; targetPath: string; observedInstalled: boolean; createdDirs: string[]; configEntry?: { command: string; args: string[] }; openFailed?: boolean }
	| { ok: false; needs: 'quitApp' | 'quitAppSelf' | 'installExtension' }
	| { ok: false; error: AiError };
interface Adapter {
	ids: AiAppId[];
	target (env: Env, det: Detected, appId: AiAppId): { targetId: AiTargetId; path: string } | null;   // uses the resolver
	plan (ctx: Ctx, det: Detected, rec: AiRecord | null): Promise<AiPlan>;                             // reads, never writes
	apply (ctx: Ctx, det: Detected, rec: AiRecord | null): Promise<ApplyOutcome>;
	remove (ctx: Ctx, rec: AiRecord): Promise<{ ok: boolean; left?: 'extension' | 'entry'; error?: AiError }>;
	check (ctx: Ctx, rec: AiRecord): Promise<{ status: AiStatus; healed?: boolean; nextStep?: AiNextStep; observedInstalled?: boolean }>;
	update (ctx: Ctx, rec: AiRecord, change: { tier?: AiTier; port?: number }): Promise<{ ok: boolean; nextStep?: AiNextStep; error?: AiError }>;
	canRestart (env: Env, det: Detected): boolean;
	restart? (env: Env, det: Detected): Promise<{ ok: boolean; error?: AiError }>;
}
```

Rules for every adapter:

- **One `entry(ctx)` function** builds the installed entry; `plan().steps` and `apply()` both use it.
- **Ownership (item 1, R2-5, R2-6).** `installedKeyFp(env, rec)` reads the key from the installed entry or key file and returns its fingerprint. `check`, `update` and `remove` first compare it with `rec.keyFp`: different → status `conflict` / error `conflict`, and **nothing is touched**. `plan()` reports `existing: 'foreign'` when an `anytype` entry exists and (there is no record for this account, or the fingerprint differs, or ownership can't be verified); `apply()` then requires `ctx.replace` (bound to that entry, see below), else returns `{ stage: 'validate', category: 'conflict' }`. Every route stores a fingerprint; only manual records have `keyFp: ''`.
- **Owned fields and digests (R3-5).** For Route A entries (JSON / TOML, the entry contains the key) ownership = the key fingerprint matches **and** the other fields Anytype writes (`url` host and path shape, `type`, header name) are what Anytype would write for some port and tier; a hand-edited owned entry (extra args, another host) → `conflict`. For a keyless entry (the Claude Desktop config fallback) ownership = `canonicalDigest(installed entry) === rec.entryDigest`, over the complete entry (command, args, env). Heal, remove and rollback act only on a match.
- **Replace is bound to what was shown (R3-6).** When `plan()` returns `existing: 'foreign'` it also returns `foreignDigest` = `canonicalDigest` of the entry occupying the target (for a key file: of its content without printing it). `apply()` accepts a replace only as `{ targetPath, foreignDigest }` and rechecks both against the live target at the start **and inside every writer re-plan**; a difference → `{ stage: 'validate', category: 'conflict' }` and the sheet fetches a fresh preview.
- **Preflight and commit point (item 2, R2-2).** `plan()` is the preflight: it reads and parses the target, checks ownership, checks tools and versions, and reports whether the app must be closed (`plan.preflight`). The renderer mints a key only after `plan()` says `canApply` and the user has given any quit consent. `apply()` repeats the cheap checks, then: commit (the single write that makes the new key live) → post-commit (opening an app, enabling a server; failures here are reported but the connection stands). The old key is revoked only after `apply` returns `ok: true`; a failed `apply` leaves the old key working and the new key is released (§4.3).
- **Instructions (item 27).** `plan().instructions` maps phases to text keys chosen for this platform and install.
- **Persisted target (item 23).** `check`, `update`, `remove` use `rec.targetPath`, not a fresh resolution.
- **Heal keeps the reload step (R2-20).** When `check` or `update` rewrites an entry (port, tier), it returns the adapter's normal `nextStep` (Cursor `restart`, Codex `newSession`, Copilot `reloadServer`, LM Studio `toggle`, Claude Desktop `restart`), and the service persists it, so a finished row offers the step again.
- **Manual records (R2-10)** never reach an adapter's `check`, `update` or `remove`.

`URL = http://127.0.0.1:<port>/mcp/<tier>`.

**`jsonEntry.ts` helper** (Cursor, Copilot, LM Studio file route), given `{ path, entry(ctx), keyFrom(value) }`:

- apply: resolve target → snapshot → parse (error → `unparseable`) → ownership → `setJsonPath` → `mutationOnly` → `writeFileSafe({ secret: true })` (**commit**) → read back.
- remove: ownership → `removeJsonPath`; a missing file or entry is success.
- check: missing file or entry → `removed` if `rec.observedInstalled`, else `pending`; parse error → `unreadable`; fingerprint differs → `conflict`; URL port or tier differs → rewrite with the key from the entry (`healed`, with the adapter's `nextStep`); else `ok` with `observedInstalled: true`.

#### Claude Desktop (targetId `claude-desktop`)

User-data dir: macOS `~/Library/Application Support/Claude`; Windows first existing of `%LOCALAPPDATA%\Claude-Data\<package family name>` (migrated profile), `%LOCALAPPDATA%\Packages\<Claude_* or AnthropicPBC.Claude*>\LocalCache\Roaming\Claude`, `%APPDATA%\Claude`; Linux `~/.config/Claude`. Config = `<dir>/claude_desktop_config.json`.

`extensionState(env)` describes the **current** state, from two files (capture both as fixtures from this Mac's Claude install in Phase 2 and adjust field names to what is really there):

- `<dir>/extensions-installations.json`: the record with id **`local.mcpb.anytype.anytype`** (author + name from the manifest) gives the installed `version` and signer (`signatureInfo`).
- `<dir>/Claude Extensions Settings/<id>.json`: the enabled flag.

| State | Condition | Effect |
|---|---|---|
| `installed` | record found, enabled, version ≥ `bundleInfo.wrapperVersion`, and — when `bundleInfo.signed` — the record's signer equals `bundleInfo.signerFingerprint` | key-file-only connect |
| `disabled` | as `installed` (version and, on a signed build, signer are the expected ones), but the settings file says disabled | key file written; instruction `aiConnectStepEnableExtension` only; the bundle is **not** reopened |
| `outdated` | version lower, or — on a signed build — signer missing or different, **whether enabled or disabled** | install the signed bundle first; **the key file is not written yet** (see below) |
| `absent` | installations file readable, id not there | previously observed → status `removed` (Reconnect / Forget); never observed → awaiting install (`pending`) |
| `unreadable` | a file is missing or not parseable | treated as `absent` for connect; `check` reports `pending`, never `removed` |

The finishing step completes only when the state is `installed` (current, enabled, expected version).

- **Primary (macOS, Windows).** Preflight (`plan`): Claude detected; `Anytype.mcpb` and `mcpb.json` exist; the key-file dir chain is real; ownership of an existing key file; `extensionState`.
  - **Signer before the key (R3-4).** On a signed build the extension's signer and version are checked **before** the key file is written or Enable is offered. State `installed` or `disabled` (both imply the expected signer) → **commit: write the key file**; `method: 'keyfile'`, `nextStep: 'restart'` or `'toggle'`.
  - State `outdated` on a signed build (wrong or missing signer, or an old version): the key must not reach an extension Anytype didn't sign. Copy and open the bundle and return `{ ok: false, needs: 'installExtension' }`: **nothing is written, no record is created, and the key stays only in the renderer's operation.** The finishing view shows the confirm-in-Claude step and polls `aiConnectPlan` every 3 s (2 minutes); when the plan's method becomes `keyfile` (state `installed`, expected signer and version), it calls `aiConnectApply` again with the same key → **commit: write the key file**, `nextStep: 'restart'`. Cancel, close or timeout before that → key file untouched, and the key is released like any uncommitted key.
  - State `absent` / `unreadable`, or an unsigned dev build in any non-installed state: as before — **commit: write the key file**, then copy `Anytype.mcpb` to `<keyFileDir>/Anytype.mcpb` and, unless `ctx.manual`, open it: macOS `run('/usr/bin/open', [ '-a', appPath, file ])`; Windows resolve `Claude.exe` (PowerShell `Get-AppxPackage` for both families → `<InstallLocation>\app\Claude.exe`, else `%LOCALAPPDATA%\AnthropicClaude\Claude.exe`) and `launch(exe, [ file ])`. Result `method: 'package'`, `nextStep: 'confirmInApp'`. (With no extension installed there is nothing that could read the key file yet; the bundle Anytype opens is its own.)
  - If opening fails, return `ok: true` with `openFailed: true`. **Windows is best effort and unverified in the POC.**
- **Fallback (`ctx.method === 'config'`; the only route on Linux, needs `proxySupported`).** Claude rewrites its config while running.
  - Preflight (`plan`, nothing written, **no key minted yet**): running state (§3.13). `running` → `preflight: 'quitApp'` on macOS and Windows, `'quitAppSelf'` on Linux; `unknown` → `'quitAppSelf'`. Parse the config; an existing `mcpServers.anytype` whose digest isn't `rec.entryDigest` → `existing: 'foreign'` with its `foreignDigest`. Linux without `proxySupported` → `canApply: false`, `error.category: 'unsupportedPackage'`, note `aiConnectLinuxPackageLimit`, and no manual steps: stated **before** minting.
  - Apply: if Claude is running and `allowQuit` → quit and wait; running without `allowQuit`, or `unknown` → `needs` (only reachable when Claude was started after the plan). Snapshot and parse the config, remember the previous `mcpServers.anytype` value (or its absence) → merge `mcpServers.anytype = wrapperCommand(env, 'claude-desktop')` (no key, never a `url` entry) → **commit: write the key file** → store `configEntry` and `entryDigest` (the canonical digest of the complete entry as written: command, args, env).
  - Failure after the merge: restore the previous entry value (or remove ours if there was none) **only if the installed entry's digest still equals what this call wrote**; if someone edited it in between, leave it and report `left: 'entry'`. **On every failure path after Anytype quit Claude, relaunch it** before returning.
- **remove:** ownership check on the key file → delete the key file → if a config entry exists: its digest equals `rec.entryDigest` and Claude is `stopped` → remove it; equal but Claude running or `unknown` → leave it, `left: 'entry'`; not equal (including an env-only edit) → leave it untouched (not ours). `left: 'extension'` when the extension is present.
- **check:** key file missing or invalid → `removed` if observed, else `pending`; fingerprint mismatch → `conflict`; a config entry whose digest differs from `rec.entryDigest` → `conflict`; port differs → rewrite the key file (`healed`, `nextStep: 'restart'`); extension `installed`, or our config entry present → `ok`, `observedInstalled`; `disabled` → `ok` with `nextStep: 'toggle'`; otherwise per the table. A config entry whose digest equals `rec.entryDigest` but whose paths are stale (Anytype moved) is rewritten only when Claude is `stopped`; `configEntry` and `entryDigest` are updated.
- **update:** rewrite the key file; `nextStep: 'restart'`.
- **Manual steps (R2-8).** macOS / Windows: (1) `aiConnectManualPrepare` — **Create key** runs `aiConnectApply` with `manual: true`, which writes the key file and copies the bundle but opens nothing, so no raw key is shown; (2) `aiConnectManualInstallFile` with the bundle path and Reveal; (3) restart note. Linux with `proxySupported`: (1) the same prepare step; (2) `aiConnectManualAdd` with the wrapper command object (no key) for `claude_desktop_config.json`; (3) quit and reopen Claude. Linux without it: no steps, the package limit note.
- **Instructions:** `confirmInApp` → `aiConnectStepConfirm`; `stalled` → `aiConnectHintClaudeDesktop`; `restart` → `aiConnectStepRestart`; `toggle` → `aiConnectStepEnableExtension`.

#### Claude Code (targetId `claude-code`)

`home` = Claude Code home from the resolver. Claude's own config file = `<CLAUDE_CONFIG_DIR>/.claude.json` when that variable is resolved, else `~/.claude.json`. `sandboxOn` = `sandbox.enabled === true` in `<home>/settings.json`.

Route choice in `plan()` (R2-14): requested route `skill` + `sandboxOn`, **on any platform** → plan the `http` route instead and set `note: 'aiConnectNoteSandbox'`. A direct loopback `curl` bypasses the sandbox proxy's allow-list, so the skill route can't be made to work by editing `allowedDomains`; Anytype never edits the sandbox settings. The form shows the note and its route selector follows `plan.route`.

- **Route `skill`.**
  - Preflight: resolve and parse `<home>/settings.json`; ownership via the fingerprint of `env.ANYTYPE_API_KEY`. **Skill ownership (R2-12):** an existing `<home>/skills/anytype-api/SKILL.md` without the marker `<!-- anytype-desktop:begin -->` is the user's → `canApply: false`, `error.category: 'conflict'`, note `aiConnectSkillConflict` (the form offers the MCP route or manual setup). Never overwrite it.
  - Apply: (1) write or refresh the marked `SKILL.md` (no secret; `0644`, dirs `0755`; remember whether this call created it); (2) **commit: merge `settings.json`** with `env.ANYTYPE_API_URL = "http://127.0.0.1:<port>"` and `env.ANYTYPE_API_KEY = <key>`. If the commit fails, delete the skill file only if step 1 created it. `method: 'config'`, `nextStep: 'newSession'`.
  - remove: ownership → delete the two `env` keys → delete `SKILL.md` only if it has the marker, then the directory only if it is empty.
  - check: both vars + marked skill file → `ok`; URL port differs → rewrite the URL (`healed`, `nextStep: 'newSession'`); a marked skill file that differs from the current build → refresh; an unmarked one → leave it; vars missing → `removed` / `pending`; parse error → `unreadable`.
- **Route `http` ("MCP tools").** Writes go through the CLI only; reads of Claude's config file are **read-only**.
  - `readEntry(env)`: parse Claude's config file and return the user-scope `mcpServers.anytype` (top-level `mcpServers`), or `absent`, or `unreadable`. Its bearer token gives the installed fingerprint.
  - Preflight, no writes: a runnable `claude` CLI (not a shim) and `claude --version` ≥ **2.1.327** (stdin support for `add-json`); otherwise `canApply: false` with `cliTooOld` / `notFound` → manual. `readEntry`: present with another fingerprint, or `unreadable` while a record exists → `existing: 'foreign'` (explicit Replace, or Forget).
  - Apply, via `exec.runCli` (`execFile`, argument arrays, stdin, timeout 15000, `PATH` from the resolver, `CLAUDE_CONFIG_DIR` passed in `env` when resolved):
    ```
    claude mcp remove anytype --scope user            only when readEntry found an entry; first install skips it
    claude mcp add-json --scope user anytype -        stdin: {"type":"http","url":"<URL>","headers":{"Authorization":"Bearer <KEY>"}}   ← commit
    claude mcp get anytype                            once, right after the add (exit 0 = verified)
    ```
    If `add-json` fails **or times out** (R3-1): re-read the entry before deciding. It carries the **new** key's fingerprint → the write committed: return `ok: true` (skip `mcp get`). Gone, and there was one before → `{ stage: 'cli', category: 'cliFailed', removedOld: true }`. Otherwise (the old entry is still there, or there never was one) → plain `cliFailed`. On a failure the renderer releases the **new** key and leaves the **old** key valid. With `removedOld` the manual view shows the **old** key (looked up by the record's hash) so the user can put the entry back, and offers the new one as the alternative (§5.6). **No argv fallback.**
  - `keyFp` = the minted key's fingerprint. remove: ownership via `readEntry` → `claude mcp remove anytype --scope user`.
  - check (passive, **never runs the CLI**: `mcp get` health-checks and can start servers): `readEntry` → absent → `removed` / `pending`; fingerprint differs → `conflict`; `unreadable` → `unreadable`; URL port ≠ live port → `reconnect`; else `ok`.
  - update: unsupported → the UI runs a reconnect.
- Never write Claude's config file.
- Instructions: `newSession` → `aiConnectStepNewSession`.

#### ChatGPT and Codex (`codex.ts`, both card ids)

- Targets: ChatGPT → `~/.codex/config.toml` (targetId `codex`). Codex → `<Codex home>/config.toml`: targetId `codex` when it is the same real file, else `codex-home`.
- Entry body (TOML basic strings, escaped): `url = "<URL>"` and `http_headers = { Authorization = "Bearer <KEY>" }`.
- apply / remove / check / update: the TOML contract with snapshot, ownership (`http_headers.Authorization`), guard, `writeFileSafe({ secret: true })` (**commit**).
- **Shared cards (item 36, R2-22).** A card maps to a record by **canonical path**: the record's `targetPath` must be one of the card's `detection.targetPaths`. Both cards map to the same record when the files match. A record is `notInstalled` only when **no** card mapping to it is installed. Disconnect and conflict messages name the sibling card.
- **Moved `CODEX_HOME` (R2-22, simplified by R3-7): no migration.** If the Codex card now resolves a canonical path different from its record's `targetPath`, the existing row stays as it is: Manage and Disconnect keep working on its stored path. The Codex card's sheet shows `aiConnectTargetMoved` (%s = the new path) with **Connect this location**. That connect targets the record whose canonical path matches: if an **owned** record already exists there (for example ChatGPT's at the default `~/.codex/config.toml`), it is **reused as is** — no new key, no rotation, the card simply maps to it; if none exists, a normal first connect creates one. Nothing at the old location is cleaned up automatically; the user disconnects the old row when they want.
- `nextStep`: `restart` only when the ChatGPT app is installed **and the changed file is the one it reads** (`~/.codex/config.toml`); otherwise `newSession`. `canRestart`: macOS when the `com.openai.codex` app was found; **false on Windows and Linux** (no verified executable), so no Restart button appears there and the instruction is `aiConnectStepRestartSelf`.
- Instructions: `added` for the ChatGPT card → `aiConnectChatgptModes`.

#### Cursor (targetId `cursor`)

`jsonEntry` on `~/.cursor/mcp.json`, path `[ 'mcpServers', 'anytype' ]`, entry `{ url, headers: { Authorization: 'Bearer <KEY>' } }`. Post-commit, best effort: `agent mcp enable anytype` when a runnable `agent` CLI exists (timeout 5000, failure ignored). `nextStep: 'restart'`. `canRestart`: macOS `Cursor.app` found; Windows `…\Programs\cursor\Cursor.exe` exists. Instructions: `restart` → `aiConnectStepRestart`; `afterRestart` and `added` → `aiConnectHintCursor`.

#### VS Code + GitHub Copilot (targetId `copilot`)

`jsonEntry` on `<Copilot home>/mcp-config.json`, path `[ 'mcpServers', 'anytype' ]`, entry `{ type: 'http', url, headers: { Authorization: 'Bearer <KEY>' }, tools: [ '*' ] }`. `nextStep: 'reloadServer'`. No restart. Instructions by evidence: VS Code found → `aiConnectStepReloadServer` (names the local Copilot chat and notes that Remote / WSL windows read the remote machine's file); only the `copilot` CLI found → `aiConnectStepCopilotCli`. The disconnect confirmation for this card names Copilot CLI and the GitHub Copilot app (`aiConnectDisconnectSharedVscode`).

#### LM Studio (targetId `lmstudio`)

- LM home: first line of `~/.lmstudio-home-pointer` (trimmed; must be absolute, under home, an existing directory), else `~/.lmstudio`, else `~/.cache/lm-studio`. File `<home>/mcp.json`.
- **Deeplink route: first install only (R2-9).** Used when there is no record, `mcp.json` has no `anytype` entry, and `protocolHandler('lmstudio')` resolves to the detected LM Studio (the handler's canonical path equals the detected app path on macOS, the detected exe path on Windows). Commit = `openExternal('lmstudio://add_mcp?name=anytype&config=<encodeURIComponent(base64(JSON))>')`. `method: 'deeplink'`, `nextStep: 'confirmInApp'`, `targetPath` = the `mcp.json` path, `keyFp` stored. The record stays `pending` until `check` finds an entry **with the expected fingerprint** in `mcp.json`.
- **File route** in every other case: an existing record (reconnect, tier or port change), an existing entry (ownership-checked; foreign → explicit replace), `ctx.method === 'config'`, or no trusted handler. `jsonEntry` on `<home>/mcp.json`; `nextStep: 'toggle'`.
- If the open fails, or the entry hasn't appeared after 2 minutes, the UI offers "Add to LM Studio's settings file instead": apply again with `method: 'config'` and the **same key**. Which key (R3-2): while the popup's operation still holds it, that one; if the deeplink apply already committed and the key was dropped from memory, the committed key looked up by the record's hash (`flow.keyFor`). Same hash, so nothing is added to `revokePending`.
- Instructions: `confirmInApp` → `aiConnectHintLmstudio`; `toggle` → `aiConnectStepToggle`; `added` → `aiConnectStepApproveFirstCall`.

#### Other app (`other`)

No file writes, no installation check, no healing, no cleanup. `plan()` returns ordered `steps`: (1) "Most apps" JSON; (2) the plain proxy command (omitted when `!proxySupported`); (3) URL, header name, header value as three `text` steps. Recorded through `aiConnectRecordManual`; main generates a stable id `other-<8 random hex>` that is **not** derived from the key. Reconnect calls `aiConnectRecordManual` again with the existing `connectionId` and `expectedHash`, so the row keeps its identity, and the manual view shows the replacement snippet. The service handles `method: 'manual'` records before any installation check: they are never `notInstalled`; their status is `ok` or `accessEnded`.

### 3.9 Skill file (`skill.ts`)

One skill, vendored body untouched, Anytype block inserted after the frontmatter: `skill.build()` splits the vendored file after its YAML frontmatter and emits `frontmatter + preamble + body`.

`electron/mcp/skill-preamble.md`:

```md
<!-- anytype-desktop:begin -->
## Connected by Anytype Desktop

Anytype set this skill up on this computer. Use `ANYTYPE_API_URL` and `ANYTYPE_API_KEY` from your environment and skip "Pair and make a first read" below.

- Base URL: `$ANYTYPE_API_URL`. Before the first request, check that it matches `http://127.0.0.1:<digits>` exactly; if it doesn't, stop and tell the user to reconnect. Do not assume the default port.
- Requests: `curl -q --noproxy '*' -sS "$ANYTYPE_API_URL/v2/…" -H "Authorization: Bearer $ANYTYPE_API_KEY"`. `-q` must be the first option (it skips `.curlrc`); `--noproxy '*'` keeps the request on this computer. Let the shell expand the variables.
- Windows without a POSIX shell (PowerShell): `curl.exe -q --noproxy '*' -sS "$env:ANYTYPE_API_URL/v2/…" -H "Authorization: Bearer $env:ANYTYPE_API_KEY"`.
- Never print, echo, log or write the value of `ANYTYPE_API_KEY`. Do not run `env`, `printenv`, `set` or `Get-ChildItem Env:` to inspect it, and do not use `curl -v` or `--trace`.
- First check: `curl -q --noproxy '*' -sS "$ANYTYPE_API_URL/v2/auth/whoami" -H "Authorization: Bearer $ANYTYPE_API_KEY"`.
- If either variable is missing, or the API answers 401: stop and tell the user "Open Anytype ▸ Settings ▸ AI apps ▸ Claude Code ▸ Reconnect, then start a new session." Never start pairing.
- If the API answers 403: this connection isn't allowed to do that. Tell the user they can change its access in Anytype ▸ Settings ▸ AI apps. Do not ask them to reconnect.
- If the connection is refused, ask the user to open Anytype.
<!-- anytype-desktop:end -->
```

### 3.10 Registry (`registry.ts`)

File `<userData>/aiConnect.json`, `0600`, atomic writes, no secrets:

```json
{ "version": 1, "nudgeClaimed": false, "orphanHashes": [ { "accountId": "…", "hash": "…" } ], "connections": [ { "…": "AiRecord" } ] }
```

`load()`, `list(accountId)`, `get(accountId, id)`, `upsert(record)`, `patch(accountId, id, partial)`, `remove(accountId, id)`, `claimNudge(): boolean` (true once). An unreadable or wrong-version file is renamed to `aiConnect.json.broken` and replaced by an empty one. `status` is computed by `check`, not stored.

`orphanHashes` (R3-3) holds hashes of keys that were minted but never delivered and whose release revoke failed. They belong to no record. Methods: `addOrphan(accountId, hash)`, `removeOrphan(accountId, hash)`, `listOrphans(accountId)`. A registry file without the field loads as an empty list.

### 3.11 Service and IPC (`aiConnect/index.ts`, `electron/ts/api.ts`, `electron/ts/main.ts`)

`AiConnectService` holds `Env`, the registry and a **single promise queue**; every operation runs through it.

**Sender gate (item 20, R2-24).** In the `ipcMain.handle('Api', …)` handler in `main.ts`, before dispatch, when `cmd` starts with `aiConnect`, require all of: the window is a normal app window (not `isQuickSearch`, not `isApproval`, not a child helper); the sender is the **active** tab view's `webContents` (`Util.getActiveView(win)`); and the call comes from that view's top frame (`e.senderFrame === e.sender.mainFrame`). `aiConnectClaimNudge` additionally requires `win.isFocused()`. Everything else gets no result. This is a correctness gate, not containment of a hostile renderer. Put the predicate in a small pure function (`aiConnectSenderAllowed(winInfo, senderInfo)`) so it can be unit-tested.

Every `Api` method takes `(win, param)`, validates first (`validate.ts`), and returns a discriminated result. Validation failure → `{ ok: false, error: { stage: 'validate', category: 'unknown' } }`, logged with the method name only.

| Method | `param` | Returns |
|---|---|---|
| `aiConnectList` | `{ accountId, refresh? }` | `AiListResult` (statuses from the last check) |
| `aiConnectPlan` | `{ accountId, appId, route, tier, port, method?, connectionId? }` | `AiPlanResult` |
| `aiConnectApply` | `{ accountId, appId, route, tier, recommendedTier, port, key, appHash, name, grant, expireAt, expectedHash, method?, allowQuit?, replace?: { targetPath, foreignDigest }, manual? }` | `AiApplyResult` |
| `aiConnectRecordManual` | `{ accountId, connectionId?, appId, route, tier, recommendedTier, port, appHash, name, grant, expireAt, expectedHash }` | `AiRecordManualResult` — records a manual delivery (new id when `connectionId` is absent, same id on reconnect); no key, no writes to other apps |
| `aiConnectUpdate` | `{ accountId, connectionId, expectedHash, port, tier? }` | `AiUpdateResult` |
| `aiConnectRemove` | `{ accountId, connectionId, expectedHash, forget? }` | `AiRemoveResult` — runs cleanup (skipped with `forget`), then marks the record `removed: true`, sets `revokePending = revokePending ∪ { appHash }` (earlier unconfirmed hashes stay), and stores `left` |
| `aiConnectRevoked` | `{ accountId, connectionId, hash }` | `AiRevokedResult` — heart confirmed the revoke: drop `hash` from `revokePending`; delete the record when it is `removed` and nothing is pending |
| `aiConnectOrphan` | `{ accountId, hash, done? }` | `AiOrphanResult` — without `done`: remember a minted-but-undelivered key whose revoke failed; with `done: true`: heart confirmed it gone, forget it |
| `aiConnectCheck` | `{ accountId, apiListening, port?, keys: { hash, present, grant?, expireAt? }[] \| null }` | `AiCheckResult` — `port` is required only when `apiListening` is true; without it the call is **reconcile-only** (no heals, no rewrites). `keys` covers **only managed hashes** (each record's `appHash` and `revokePending`, plus `orphanHashes`); `null` means the list RPC failed |
| `aiConnectProbe` | `{ port, tier, route, key, accountId?, connectionId? }` | `AiProbeResult`; with a `connectionId` the result is stored in `lastProbe` |
| `aiConnectStepDone` | `{ accountId, connectionId }` | `AiStepDoneResult` — sets `nextStep: 'none'` |
| `aiConnectRestartApp` | `{ appId }` | `AiRestartResult` |
| `aiConnectReveal` | `{ accountId, connectionId }`, or `{ appId, what: 'bundle' \| 'target' }` (works before a record exists; the path is resolved by the adapter) | `AiRevealResult` |
| `aiConnectOpenApp` | `{ appId }` | `AiOpenAppResult` |
| `aiConnectClaimNudge` | `{ accountId }` | `AiClaimNudgeResult` (atomic in the queue; focused normal window only) |
| `aiConnectBundleInfo` | `{}` | `AiBundleInfoResult` |

Validation:

- `appId` ∈ catalog; `route` ∈ that app's `routes`; `tier` ∈ three values; `method` is `'config'` or absent; booleans are booleans.
- `port`: `isValidPort`. The host is always `127.0.0.1`.
- `key`: string, 16–512 chars, `/^[\x21-\x7E]+$/`, none of `"`, `'`, `` ` ``, `\`, `$`, `<`, `>` (check a real key in Phase 1; loosen only if needed).
- `appHash`, `accountId`, `hash`, `expectedHash` (or `null`): 1–256 chars, `/^[A-Za-z0-9+/=_.:-]+$/`; `keys.length ≤ 1000`.
- `name`: 1–128 UTF-8 bytes after trimming; control characters removed.
- `grant`: `isValidLinkGrant`; `expireAt`: non-negative safe integer.
- `connectionId`: `/^[a-z0-9-]{1,64}$/` and present in the registry for this `accountId`.
- Unknown properties rejected. No path, command, URL, host or scheme ever comes from the renderer.

**Stale operations (item 33, R2-27).** `apply`, `recordManual`, `update`, `remove` compare `expectedHash` with the record's current `appHash` (`null` = "no record expected") inside the queue. Mismatch → `{ stage: 'validate', category: 'stale' }`, nothing changes; the renderer releases a key it just minted and reloads. `apply` and `recordManual` on a record marked `removed` are rejected the same way (finish or retry the disconnect first).

**Apply bookkeeping and the revocation set (R2-3).** On `ok`: upsert the record with the new `appHash`, `keyFp`, `grant`, `expireAt`, `tier`, `recommendedTier`, `targetPath`, `nextStep`, `observedInstalled`, `createdDirs`, `configEntry`. `revokePending` is a **set**: a rotation adds the previous hash **only when it differs from the new one** (re-delivering the same key through another route is not a rotation); `remove` adds the current hash to whatever is already pending. **A record is deleted only when it is `removed` and its set is empty** (R3-3).

**Check (R2-3, R2-4, R3-3).** Without `apiListening` the call is reconcile-only: steps that read or rewrite other apps' files for healing are skipped and statuses keep their last value, except those derived from keys. First, reconciliation, only when `keys !== null` (a **successful** `ListApps`): an orphan hash with `present: false` is dropped from `orphanHashes`; a pending hash with `present: false` is acknowledged (dropped from `revokePending`; a `removed` record with nothing pending is deleted); stored `grant` / `expireAt` are refreshed for present hashes. When `keys === null` nothing about keys changes: no `accessEnded`, no acknowledgement. Then, per record: (1) a `removed` record with a non-empty `revokePending` → `revokeFailed`, nothing else; (2) `method: 'manual'` → `ok`, or `accessEnded` when its hash is known absent; no installation check; (3) `appHash` known absent → `accessEnded`; (4) no installed card maps to the target → `notInstalled`; (5) `adapter.check()`, with heals only when `apiListening`. `nextStep` (including the step a heal returns) and `observedInstalled` are persisted. Anytype never re-adds an entry removed inside the AI app.

### 3.12 Probe (`probe.ts`)

`probe({ port, tier, route, key }, fetchImpl = fetch)`; each request has a 5 s abort timeout and `redirect: 'manual'`; the host is `127.0.0.1`.

- `http` / `stdio`:
  1. `POST /mcp/<tier>` `initialize` with `protocolVersion: '2025-06-18'`, `capabilities: {}`, `clientInfo: { name: 'anytype-desktop', version }`; headers `Authorization`, `Content-Type: application/json`, `Accept: application/json, text/event-stream`. Expect 200 and a JSON-RPC `result`; keep `result.protocolVersion`.
  2. Follow-ups send `MCP-Protocol-Version: <negotiated>`. `small` / `large`: require the `mcp-session-id` response header and send it back. `full` is stateless: no session header.
  3. `notifications/initialized` → accept 200 or **202**.
  4. `tools/list` → a non-empty `tools` array.
  5. In `finally`, for `small` / `large` only: `DELETE` the session (errors ignored).
- `skill`: `GET /v2/auth/whoami` with the bearer header → 200.
- Failures: refused → `unreachable`; 401/403 → `unauthorized`; timeout → `timeout`; else `unknown`. Bodies are never logged.

### 3.13 Restart (`restart.ts`)

`runningState(env, det): 'running' | 'stopped' | 'unknown'`, `quit`, `launch`, `restart`; `buildCommands()` is pure and tested.

- **Identity by full executable path, never by image name** (`claude.exe` is also the Claude Code CLI).
  - macOS: `listProcesses()` = `ps -axo pid=,ppid=,comm=`; the main process is the one whose command equals `<appPath>/Contents/MacOS/<CFBundleExecutable>`; the app's bundle id (from `plutil`) must equal the expected id.
  - Windows: `listProcesses()` = PowerShell `Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, ExecutablePath, CommandLine | ConvertTo-Json`. Main process = `ExecutablePath` equals the detected exe **and** `CommandLine` has no `--type=` (Electron helpers carry it). **Exactly one** match → that pid; zero → `stopped`; more than one → `unknown`.
  - Linux (running check only, for the Claude fallback): resolve the `claude-desktop` executable and compare it with `/proc/<pid>/exe` links; no `/proc` access → `unknown`.
  - `listProcesses()` returning `null` → `unknown`: no quit, no config write; the UI shows the instruction.
- Quit: macOS `kill(pid, 'SIGTERM')`; Windows `taskkill /PID <pid>` **without `/F`**. **One signal per pid, ever**: the service remembers signalled pids; a second click only re-checks the running state. Poll every 250 ms up to 10 s. Still running (the app refused, for example an unsaved-work dialog) → `{ stage: 'restart', category: 'timeout' }`; never escalate.
- Launch: macOS `run('/usr/bin/open', [ '-a', appPath ])`; Windows `await launch(exe, [])` (resolves on the child's `spawn` event, `false` on `error`).
- Linux: no automatic quit or restart.


---

## 4. Renderer design

### 4.1 Store (`src/ts/store/aiConnect.ts`, `S.AiConnect`)

Observable: `detections: Map<AiAppId, I.AiDetection>`, `connectionList: I.AiConnection[]`, `scanOk`, `isLoading`, `isChecked`. Methods:

- `connections`: records that are not `removed`, plus `removed` ones whose status is `revokeFailed`.
- `getByApp(appId)`: the connection whose `id === detection.targetId` **and** whose `targetPath` is `''` or one of `detection.targetPaths` (canonical-path mapping, R2-22).
- `getById(connectionId)`: used by rows, Manage, the backlink and routes; the only way to address Other-app connections.
- `others()`: records with `appId === 'other'`.
- `siblings(connection)`: other catalog cards whose detection maps to the same target.
- `isInstalled(appId)`, `icon(appId)`, `set`, `upsert`, `remove`, `markFirstUse(appHash, at)` (unused in the POC), `clear()`.

The store never holds a key. `Storage` gets only the onboarding flag `settingsAiApps`.

### 4.2 Desktop gate, port and API state (`flow.ts`)

- `isDesktop()` (R2-24): a **positive capability from the real preload**. Add `aiConnect: true` to the object `electron/js/preload.cjs` exposes as `window.Electron`; `isDesktop()` is `U.Common.getElectron().aiConnect === true`. The web mock and the extension mock don't define it (both define `Api`, so that is not a test). When false, the gallery shows the catalog read-only with `aiAppsDesktopOnly`, and **no key is minted and no key-bearing IPC is sent**.
- `apiState(): AiApiState`: `!localApiConfig.enabled` → `disabled`; `jsonApiStatus == null` → `unknown`; `success === false` → `failed`; `success === true` with a valid port in `listenAddr` → `listening`.
- `getPort()`: the port from `jsonApiStatus.listenAddr`, only in `listening`.
- Minting, delivery, probe and heal run only in `listening`; `mintKey` re-reads `apiState()` and the port immediately before `CreateApp`. `check` itself also runs with the API off (it only uses account RPCs and file reads), so pending revokes and Retry keep working; it passes `apiListening: false` and main then rewrites nothing.

### 4.3 Flows (`flow.ts`)

All functions are `async`, wrap callback RPCs in promises, and keep a key only in local variables or component state.

- `load(refresh?)`: `aiConnectList` → store.
- **`mintKey({ name, grant, expireAt })`** — the only place a key is created (R2-1):
  1. `isDesktop()` and `apiState() === 'listening'`, else `{ stage: 'key', category: 'apiOff' }`.
  2. `CreateApp` → `{ key }` (the response has nothing else).
  3. `ListApps` → the row whose `apiKey === key` → `{ key, appHash: row.hash }`. Match on the key, never on the name (two keys can share a name).
  4. Row not found, or the list RPC failed: retry **the lookup only**, up to 3 times, 300 ms apart, with the same key. Never call `CreateApp` again.
  5. Still not found → `{ stage: 'key', category: 'keyNotFound' }` (`aiConnectErrorKeyNotFound`: a key was created but couldn't be identified; remove it in Settings ▸ Local API). No delivery happens.
  6. On success the key becomes the flow's **pending key**: `pending = { key, appHash }`.
- **The operation object (R3-1).** `flow.ts` keeps one module-level `operation` per connect / reconnect / manual flow: `{ id, pending: { key, appHash } | null, committed: boolean, inFlight: Promise | null, cancelRequested: boolean }`. It is **not** component state, so it survives the popup being closed by Esc, by `Router.go` closing all popups, or by `onClose`. The popup subscribes to it and renders from it.
- **`releasePendingKey()`** (R2-2, R3-1): closing the popup on any path only sets `cancelRequested` and calls this. It **first awaits `operation.inFlight`** (a mint or apply IPC that hasn't answered yet), then decides from the settled result: apply (or `recordManual`) **committed** → keep the new key (the record exists), and finish the rotation normally (revoke the old hash, probe result stored); **not committed** → `RevokeApp(pending.appHash)`. If that revoke fails → `aiConnectOrphan({ hash })`, so every later `check` retries it (R3-3). The popup container calls it from one place, its unmount / `onClose` path. There is no per-button revoke logic.
- `check(reason)`: single-flight; works with the HTTP API off (these are account RPCs). In that case it sends `apiListening: false` and **no port**.
  1. `aiConnectList` → managed hashes: every record's `appHash` and `revokePending`, plus `orphanHashes`.
  2. `ListApps`. **Failed** → `keys = null`. **Succeeded** → for each managed hash: `{ hash, present, grant, expireAt }`; `present` is false when the row is missing or expired. Unmanaged rows (other keys, legacy keys without a grant) are ignored.
  3. For each pending hash still present: `RevokeApp`; success or "not found" → `aiConnectRevoked`.
     The same for each orphan hash still present: `RevokeApp`; success or "not found" → `aiConnectOrphan({ hash, done: true })`. **Every** outstanding hash is retried on every check and by every Retry button, not only the row's current one.
  4. `aiConnectCheck({ port, apiListening, keys })` → store.
- `connect({ appId, route, tier, recommendedTier, grant, name, expireAt, method?, replace?, allowQuit?, existing? })`:
  1. `aiConnectPlan`. `!canApply` → `{ manual: true, plan }` (or the plan's error when there are no steps). `existing === 'foreign'` without the user's replace consent → `{ needsReplace: true, plan }`. `plan.preflight` without the user's consent (`allowQuit` for `quitApp`; an explicit Continue for `quitAppSelf`) → `{ needsQuit: plan.preflight, plan }`. **Nothing is minted on any of these returns.**
  2. `mintKey` (or reuse the pending key when this is a second delivery attempt of the same flow, e.g. the file route after a deeplink).
  3. `aiConnectApply({ …, expectedHash: existing?.appHash ?? null })`.
     - `ok` → the pending key is committed (cleared without revoking).
     - `needs` (the app was started after the plan) → back to the quit step; the pending key stays pending and is reused.
     - `error` → the old key and entry are untouched (except with `removedOld: true`). The new key stays pending. The view offers manual setup **with the new key** (R3-2): the manual view shows it and an **I've updated <App>** button; that button calls `aiConnectRecordManual` with the same key's hash (commit: pending cleared, record now holds the new hash) and **only then** the old hash is revoked. Closing without it → the new key is released, the old one keeps working.
  4. Rotation: when `existing` had a different hash, `RevokeApp(oldHash)`; success or "not found" → `aiConnectRevoked`; failure leaves it in `revokePending` for the next `check`.
  5. `aiConnectProbe` with `connectionId`. Return `{ connection, probe, plan }`; the key stays in the popup's state for the manual view only.
- `reconnect(connection)` (R2-27, R3-8): `ListApps` first.
  - Key present → `connect` with the **current** `grant` and the **same absolute `expireAt`** from the row, same route / tier / name. No form. **Immediately before `mintKey` — after any replace or quit consent — re-read the row from `ListApps` (R3-8)** and mint with what it says now. If grant or expiry differ from what the sheet showed (changed in another window, or the key was revoked meanwhile), stop, show the new values, and ask again; nothing is minted until the user confirms.
  - Key gone or expired → `{ needsForm: true, prefill }` with the stored `grant`, tier, route, name, and the stored `expireAt` **if it is still in the future** (shown as text in the confirmation); if it has passed, the form shows the expiry choice. The user confirms before anything is minted.
  - Manual records (R3-2): `mintKey` → the manual view shows the **replacement snippet first**, with **I've updated <App>**. That button → `aiConnectRecordManual` with the same `connectionId` and `expectedHash` → then revoke the old hash. Closing before it → the new key is released and the old key keeps working.
- `retryProbe(connection)` (R2-21): readiness → `keyFor(connection)` → `aiConnectProbe` with the record id → `load()`. No minting, no rewrite. Manage and Disconnect stay available while a step is pending or a probe failed.
- `updateAccess(connection, grant)`: `UpdateApp(appHash, grant)`, then `check('access')` (which stores the new grant).
- `updateTier(connection, tier)`: `aiConnectUpdate`; unsupported → `reconnect` with the new tier.
- `disconnect(connection)`: (1) `aiConnectRemove` → the record becomes `removed`, with `left`, and its hash is **added to** `revokePending`; a `conflict` error stops here and the popup offers Forget. (2) For **every** hash in the record's `revokePending`: `RevokeApp`; success or "not found" → `aiConnectRevoked`. The record is deleted when the set is empty; any failure → the row stays as `revokeFailed` with **Retry**, which repeats step 2 for all outstanding hashes and works with the HTTP API off. Returns `{ revoked, left }`.
- `forget(connection)`: `aiConnectRemove({ forget: true })`, then the same revoke step.
- `keyFor(connection)`: `ListApps` → `apiKey` for the hash, or `null`.
- `createManual({ appId, connectionId?, … })`: `aiConnectPlan` (stops on `unsupportedPackage`) → `mintKey` → `aiConnectRecordManual`, or for Claude Desktop `aiConnectApply` with `manual: true` → probe.
- `stepDone(connection)`: `aiConnectStepDone`.


---

## 5. UI/UX spec

Every string is a key in `text.json` (§5.10). Only existing CSS variables. New visual values are listed in §5.11 only.

**Controls.** Interactive elements are native: `<button type="button" className="button black|blank|red c28">`, `<select>` inside `.expirySelect`, `<input>`, as `form/apiKeyEditor.tsx` does. `Component` `Button` and `Select` are not used here because they render non-focusable `div`s. A busy button is `disabled` with a changed label (the `apiKeyEditor` pattern).

### 5.1 Gallery — `page/main/settings/aiApps.tsx` (`#pageSettingsAiApps`)

Registration: `Components.aiApps`; sidebar item `{ id: 'aiApps', iconParam: { name: 'settings/api' } }` in `dataManagement` above `api` (placeholder icon, §9-1); `settingsSectionsMap()`; search popup list. Sidebar "New" badge with onboarding key `settingsAiApps`.

Layout:

1. `.titleWrapper` + `Title` `aiAppsTitle`; `Label.apiKeyIntro` `aiAppsDescription`.
2. API notice (`.actionItems`, one `.item`) by `apiState()`: `disabled` → `aiAppsApiOff`; `failed` → `aiAppsApiFailed`; `unknown` → `aiAppsApiStarting`. Button `aiAppsApiOffButton` → Local API settings (not for `unknown`). Connect, Fix, Continue and Retry check are disabled unless `listening`. Manage, Disconnect, Forget and the revoke **Retry** stay enabled (they need only account RPCs).
3. **Connected**: one row per connection. A shared target is one row, named after the creator card, with `aiAppsAlsoIn` (%s) for siblings. Other-app connections follow, by name.
4. **On this computer**: installed `app` cards with no connection; installed unsupported cards; Ollama.
5. **Other apps**: `Filter`, then everything else; `other` last.
6. Footer link `aiAppsDevelopersLink`.

Row: `AiAppIcon` · `.name` + `.status` · action button(s).

| Row state | Status line | Buttons |
|---|---|---|
| installed, not connected | `covers` text or empty | **Connect** (black) |
| not installed | `aiAppsNotInstalled` | **Get app** (black, `getUrl`; hidden without one) · **Set up manually** (blank) |
| `ok`, `nextStep: none`, `lastProbe: ok` | green dot + `aiAppsStatusAdded` | **Manage** |
| `ok` with `firstUsedAt` (future) | green dot + `aiAppsStatusConnected` | Manage |
| `ok` / `pending` with an outstanding `nextStep` | `aiAppsStatusFinish` (%s) | **Continue** (finishing view at that step) |
| `lastProbe` failed | red dot + `aiAppsStatusProbeFailed` | **Retry check** |
| `removed` (observed before) | red dot + `aiAppsStatusRemoved` (%s) | **Fix** |
| `accessEnded` | red dot + `aiAppsStatusAccessEnded` | Fix |
| `unreadable` | red dot + `aiAppsStatusUnreadable` (%s) | Fix |
| `reconnect` | red dot + `aiAppsStatusAttention` | Fix |
| `conflict` | red dot + `aiAppsStatusConflict` | Fix |
| `revokeFailed` | red dot + `aiAppsStatusRevokeFailed` | **Retry** |
| `notInstalled` (had a connection) | `aiAppsNotInstalled` | **Forget** |
| sibling of a shared connection | `aiAppsStatusShared` (%s) | Manage |
| unsupported / router | `aiAppsStatusCantConnect` / `aiAppsStatusRouter` | **Details** |
| `other` | `aiAppsOtherDescription` | **Set up** |

Page states: **loading** → `Loader`. **Scan failed** (`scanOk === false`) → `.accessNotice` `aiAppsScanFailed` with a **Scan again** button; all cards under Other apps. **Nothing detected** → section 4 replaced by `Label` `aiAppsNothingDetected`. **No search matches** → `EmptyState` `aiAppsSearchEmpty`. **Not desktop** → `aiAppsDesktopOnly`, no action buttons.

On mount: mark seen; `flow.load()` then `flow.check('open')`; then consume a route param (§5.8). The `AiConnectOpen` event and every other `AiConnect*` event are wired in **Phase 4**, together with their payload filter (R2-26); Phase 3 fires none.

Rows address connections by `connectionId` (`getById`), so Other-app rows open Manage for the right record. **Retry check** calls `flow.retryProbe`.

### 5.2 Popup shell — `popup/aiConnect/index.tsx` (id `aiConnect`, class `popupAiConnect`)

- The **container** owns all RPC / IPC calls and state; the five views are pure components with typed props and callbacks (§5.12).
- Styles: add `.popups .popup.popupAiConnect .innerWrap` to the same rule as `.popupApiCreate .innerWrap`; the root element uses `.apiKeyEditor`.
- `data`: `{ appId, connectionId?, view?: 'connect' | 'manage' | 'finish' | 'manual' | 'unsupported', tier?, prefill? }`. `tier` (from the Ollama card) is the **effective recommended tier** for the whole flow: plan, apply, manual, and what Manage calls "Recommended".
- The container renders from `flow`'s module-level operation (§4.3) and calls `flow.releasePendingKey()` in its unmount / `onClose` path: the one place that covers Cancel, Esc, navigation and Close. Closing during a delivery doesn't abort it: the operation settles in the background, and the gallery row then shows the result (Added, Finish in <App>, or nothing if the key was released).
- Opened with `preventCloseByClick: true`. While busy, the container calls `S.Popup.update('aiConnect', { preventCloseByEscape: true })` and resets it afterwards; footer buttons are disabled.
- Focus: on view change, focus the primary button. Enter submits the form. `ResizeObserver → position()`.

### 5.3 Connect view — `form.tsx`

```
Connect <App>
<App> can [ read and edit ▾ ] in [ All spaces ▾ ]
  (space picker, when open)
<what will happen>                         (p.description, plan.sentenceKey)
<notice: replaces an existing entry / route note / can't apply>
▸ Advanced
    Tool set         [ Recommended ▾ ]     (hidden on the skill route)
    Key expires      [ Never ▾ ]
    Name in Anytype  [ <App> ]
    Connect using    [ Skill + API ▾ ]     (apps with > 1 route)
<error>
Set up manually                 [ Cancel ] [ Connect ]
```

- Permission: native `<select>`; options `aiConnectPermReadWrite`, `aiConnectPermRead`.
- Spaces: `button.spaceSummary` (`aria-expanded`) toggles `AppGrantFields` with the new prop `withPermission={false}`.
- Plan: fetched on mount and when the route or tier changes. Notices (`.accessNotice`): `existing === 'foreign'` → `aiConnectReplaceNotice` (%s) and the primary button reads **Replace and connect** (sends `replace: { targetPath, foreignDigest }` from the plan); `plan.note` → its text; a `conflict` returned for a replace (the foreign entry changed since the preview) → refetch the plan and show the notice again; a moved Codex target → `aiConnectTargetMoved` (%s = the new path) with **Connect this location** (reuses an owned record at that path, else a first connect; the old row is left alone, R3-7); `!canApply` with steps → `aiConnectPlanManual` and the primary button becomes **Set up manually**; `!canApply` without steps (`unsupportedPackage`, skill conflict with no CLI) → the note only, Connect disabled.
- Submit order (R2-2): plan → replace consent → **quit consent** (`plan.preflight`, shown as the `needsQuit` / `needsQuitSelf` phase of the finishing view) → mint → deliver.
- **"Set up manually" link** (`button.linkButton`, bottom left) is always present and opens the manual view with the form's current values. Clicking it mints nothing.
- Advanced: tool set — `aiConnectTierRecommended` (= effective recommended tier), `aiConnectTierEssentials` (hidden when recommended is `small`), `aiConnectTierLarge` (only when recommended is `small`), and Full: `aiConnectTierFullStdio` ("including local file tools") on stdio routes, `aiConnectTierFull` on http routes. Expiry: `apiKeyExpiry*` options; the form converts days to an absolute `expireAt` at submit. A prefilled reconnect shows `aiConnectReconnectConfirm` and, when the stored expiry is still in the future, that date as text instead of the selector.
- Connect is disabled while the grant or name is invalid or the API isn't `listening`.

### 5.4 Finishing view — `finish.tsx`

Driven by `phase` and `plan.instructions[...]` (text keys chosen by the adapter).

| Phase | Shown | Buttons |
|---|---|---|
| `delivering` | `Loader` + `aiConnectDelivering` | none; Esc blocked |
| `needsQuit` (before minting) | `aiConnectNeedsQuit` (%s) | Cancel · **Quit %s and continue** (sets `allowQuit`, then mint and deliver) |
| `needsQuitSelf` (before minting) | `aiConnectNeedsQuitSelf` (%s) | Cancel · **Continue** (re-plans; proceeds only when main sees the app closed) |
| `step: confirmInApp` | the instruction; Claude Desktop with `bundleSigned === false`: `aiConnectUnsignedNote`; with `openFailed`: `aiConnectOpenFailed` + Reveal file | Later · **Open %s**; Claude: **Use Claude's settings file instead**; LM Studio: **Add to LM Studio's settings file instead** |
| `step: restart` | ✓ `aiConnectAdded` · the instruction | Later · **Restart %s** when `detection.canRestart`; after a timeout or refusal the row shows `aiConnectStepRestartSelf` and the button becomes **I've restarted it** (re-checks only, never signals again); without `canRestart`: `aiConnectStepRestartSelf` + **Done** |
| `step: newSession` / `reloadServer` / `toggle` | ✓ added · the instruction | **Done** |
| `afterRestart` | ✓ added · `instructions.afterRestart` when the adapter has one (Cursor) | **Done** |
| `added` | ✓ `aiConnectAdded` · `aiConnectProbeOk` · `instructions.added` if any · `aiConnectTryPrompt` | Open %s · **Done** |
| `connected` (future) | ✓ `aiConnectConnected` · `aiConnectFirstRequest` | Open %s · Done |
| `stalled` | `aiConnectStalled` + `instructions.stalled` | Set up manually · the app's file-route button · Done |
| `error` | `.apiKeyError` `aiConnectError<Category>`; with `removedOld`: `aiConnectErrorRemovedOld` | Set up manually · Close |

Rules:

- The probe runs once after a successful apply. Probe failed → `error` with `aiConnectErrorProbe`; the row later shows **Retry check**.
- `confirmInApp`: poll `flow.check('poll')` every 3 s for 2 minutes; `observedInstalled` → `added`; timeout → `stalled`. Closing the popup leaves the row at "Finish in <App>" with **Continue** (the step is persisted).
- **Done** on a step calls `flow.stepDone` and then shows the **same follow-up as the automatic path** (R2-30): `instructions.afterRestart` / `instructions.added` when the adapter has one (Cursor's toggle hint, ChatGPT's Work / Codex mode, LM Studio's first-call approval), then `added`. **Later** leaves the step outstanding.
- **Restart**: disable the button → `aiConnectRestartApp` → ok → `afterRestart` or `added`, and `stepDone`; failure → the self-restart row above.
- Cancel in the quit phases needs no revoke (nothing was minted). Any later close is covered by `releasePendingKey()`.
- The ✓ marker reuses `.localApiStatus.isSuccess`.

### 5.5 Manage view — `manage.tsx`

```
<App>                                   ● Added
Access      Read and edit · All spaces        [Change]
Expires     Never
Tool set    Recommended                       [Change]    (hidden on the skill route)
Added to    ~/.cursor/mcp.json                [Reveal]    (hidden when empty)
<attention notice>
Set up manually          [ Reconnect ]   [ Disconnect <App> ]
```

- On open the container loads `ListApps` and passes the live `grant` and `expireAt` for `appHash`; if the key is gone it passes the record's stored values with the `accessEnded` notice.
- **Change access**: inline select + `AppGrantFields` with Save / Cancel → `flow.updateAccess` → toast.
- **Change tool set** → `flow.updateTier` → toast + the app's next-step instruction.
- **Reconnect**: `flow.reconnect`. Valid key → straight to the finishing view (current grant, same absolute expiry). Otherwise the connect form opens prefilled (R2-27).
- **Retry check** (shown when `lastProbe` failed) → `flow.retryProbe`. Manage, Reconnect and Disconnect stay available while a step is pending.
- "Recommended" in the tool-set selector means the record's stored `recommendedTier` (R2-31).
- **Disconnect**: `confirm` popup (`aiConnectDisconnectTitle`, `aiConnectDisconnectText`, plus `aiConnectDisconnectShared` %s naming siblings), red confirm. Messages are built from the two separate results:
  - cleanup ok + revoked → toast `aiConnectDisconnected`.
  - `left: 'extension'` → `aiConnectLeftExtension`; `left: 'entry'` → `aiConnectLeftEntry` (%s path) with Reveal.
  - revoke failed → `aiConnectRevokeFailed`; the row stays with **Retry**.
  - `conflict` → nothing was touched; show the conflict notice.
- Attention notices by status: `removed` → `aiConnectAttentionRemoved` + Reconnect / Forget; `accessEnded` → `aiConnectAttentionAccessEnded` + Reconnect; `unreadable` → `aiConnectAttentionUnreadable` + Set up manually / Reveal; `reconnect` → `aiConnectAttentionReconnect`; `conflict` → `aiConnectAttentionConflict` + **Replace** (reconnect with `replace` from a fresh plan) / **Forget** (revokes this account's key, leaves the entry); `notInstalled` → Forget.
- Other-app and other manual connections: the same view without "Added to" and without a tool-set change (`aiConnectOtherTierHint`); Reconnect shows the replacement snippet in the manual view.

### 5.6 Manual view — `manual.tsx`

```
Set up <App> manually
[Name / access controls when no key exists yet]
1. <step text>                                 [Reveal file]  (step.path)
   <snippet, key masked>                              [Copy]
2. …
Key  ••••••••••••                              [Show] [Copy]   (after a key exists)
                                      [ Create key ]  /  [ Done ]
```

- Steps come from `plan.steps` in order; `steps.ts` `fillStep(step, key, masked)` replaces `KEY_PLACEHOLDER`. Before a key exists the snippets show `<KEY>` and Copy is disabled.
- A key is minted **only** by the explicit **Create key** button (`flow.createManual`). Which key the view shows otherwise (R3-2):
  - after a **failed automatic apply**: the operation's pending **new** key, with the primary button **I've updated <App>** (`aiConnectManualUpdated`). Only that button records the connection with the new key and then revokes the old one. Done / Close without it releases the new key.
  - **manual reconnect** (Other app, or any manual record): the replacement snippet with the new key, same button, same rule.
  - after **`removedOld`** (Claude Code): two blocks — "Put the previous entry back" with the **old** key (by the record's hash, `flow.keyFor`), and "Or use a new key" with the pending new key and the **I've updated <App>** button.
  - from **Manage** on a healthy connection: the committed key (`flow.keyFor`), with **Done** only.
- Reveal on a step calls `aiConnectReveal({ appId, what })` and works before a record exists.
- `other`: name `<input>` (default `aiAppOther`), the access controls, then the steps. Reconnect for an Other-app connection passes its `connectionId`, so the row keeps its identity.

### 5.7 Unsupported and router view — `unsupported.tsx`

Title = card name; text `aiConnectUnsupported<Id>`. Buttons: for each `offer` id that is **installed** → **Connect %s** (Ollama passes `tier: 'small'`); if none is installed and the first offer has `getUrl` → **Get %s**; **Close**. `analytics.event('AiConnectUnsupportedShown', { app })`.

### 5.8 Entry points

- `Action.openAiApps(target?: { app?: string; connection?: string }, route?: string)` (new, in `action.ts`): like `openSettings('aiApps', route)`, plus `_routeParam_.app` (a catalog id) or `_routeParam_.connection` (a `connectionId`). Used by the deep link, the nudge and the API Keys backlink.
- **Consuming the param (R2-11).** The gallery reads `app` / `connection` from `keyboard.getMatch(isPopup).params` in an effect keyed on those values, so a second link while the gallery is open is handled too. After `load()` resolves it (1) removes the param by **replacing only the current history entry** — do not call `U.Router.go` or `Action.openSettings` with `replace` here: they close popups and reset history. Look for an existing router helper that calls `history.replace` directly; if there is none, add `U.Router.replaceCurrent(route)` that does only that. (2) Then it opens the popup (`connection` → Manage for that record; `app` → the card's default view). Back / Forward must not reopen the popup.
- **Deep link.** `src/ts/lib/aiConnect/deeplink.ts`: `parseAiConnectRoute(route: string): { app: string } | null` matches exactly the path `/ai/connect` (optional trailing slash), reads only the `app` query field, and returns it only when it is a catalog id (else `''`); every other field is dropped. In `router.getParam()`, before the generic parsing: `const ai = parseAiConnectRoute(route); if (ai) return { page: 'main', action: 'aiConnect', id: '', app: ai.app };`. Add `'aiConnect'` to the action list in `isDoubleRedirect`. `page/main/aiConnect.tsx` (the shape of `membership.tsx`, registered as `'main/aiConnect'`): `U.Space.openDashboardOrVoid({ replace: true, onRouteChange: () => Action.openAiApps({ app }, 'Deeplink') })`. The link never carries a key and creates nothing.
- **Help menu**: `{ label: Util.translate('electronMenuConnectAi'), click: () => Util.send(this.win, 'commandGlobal', 'aiConnect') }`; `keyboard.onCommand` `case 'aiConnect'` → `Action.openAiApps()`. The label needs `bun run update:locale` after the `text.json` edit.
- **API Keys page**: rows whose `hash` matches a connection get a `.keyMeta` `button.apiKeyAccess` `apiKeyCreatedByAiApps` → `Action.openAiApps({ connection: connection.id })`.

### 5.9 Discovery nudge

Surface: the existing notification stack.

- `I.NotificationType.AiConnect = 'aiConnect'`. In `M.Notification.fillContent()` add a case that fills `notificationAiConnectSuccessTitle` / `Text` with `payload.appName`, or uses `…TextMany`.
- Item component, **for this notification type only** (R2-33): render Connect and Dismiss as native `<button type="button">` elements with the existing button classes, text / `aria-label` from `aiAppsConnect` and `commonClose`, and the existing `:focus-visible` outline; other notification types keep their markup. Connect → `Action.openAiApps({ app: payload.appId }, analytics.route.notification)`. `onDelete` calls `C.NotificationReply` only when `!item.isLocal`. In `list/notification.tsx` `onClear`, send only non-local ids to `C.NotificationReply`.
- **Startup path** (`app.tsx`): when the account is ready and `isDesktop()`, run `flow.load(true)` (detection), then `flow.check('start')`. About 15 s later, and again on the next window `focus` if it was skipped, the tab tries the nudge when **all** hold: `document.hasFocus()` and the tab is visible; the API is `listening`; no connections; at least one installed `app` card; no popup open. It then calls `aiConnectClaimNudge`: main flips `nudgeClaimed` inside the queue and returns `claimed: true` to exactly one caller, ever. Only on `true` the tab adds `new M.Notification({ id: 'aiConnectNudge', type: I.NotificationType.AiConnect, status: I.NotificationStatus.Created, createTime: <now, seconds>, isLocal: true, payload: { appId, appName, count } })`.
- Shown once per profile. Closing it is the dismissal.

### 5.10 Text keys (`src/json/text.json`)

Reuse: `commonCancel`, `commonClose`, `commonDone`, `commonLater`, `commonCopy`, `commonChange`, `commonRetry`, `apiKeyExpiry*`, `apiKeyExpires`, `apiKeyNeverExpires`.

| Key | English |
|---|---|
| `aiAppsTitle` | AI apps |
| `aiAppsDescription` | Use your spaces in the AI app you choose. Anytype stays on this computer; you decide which spaces each app can use. |
| `aiAppsSectionConnected` | Connected |
| `aiAppsSectionDetected` | On this computer |
| `aiAppsSectionOther` | Other apps |
| `aiAppsSearchEmpty` | No apps match your search |
| `aiAppsNothingDetected` | Anytype didn't find a supported AI app on this computer. |
| `aiAppsScanFailed` | Anytype couldn't check which AI apps are installed. |
| `aiAppsScanAgain` | Scan again |
| `aiAppsDesktopOnly` | Connecting AI apps works in the Anytype desktop app. |
| `aiAppsConnect` | Connect |
| `aiAppsManage` | Manage |
| `aiAppsFix` | Fix |
| `aiAppsContinue` | Continue |
| `aiAppsRetryCheck` | Retry check |
| `aiAppsForget` | Forget |
| `aiAppsDetails` | Details |
| `aiAppsSetUp` | Set up |
| `aiAppsGetApp` | Get app |
| `aiAppsNotInstalled` | Not on this computer |
| `aiAppsStatusAdded` | Added |
| `aiAppsStatusConnected` | Connected |
| `aiAppsStatusFinish` | Finish in %s |
| `aiAppsStatusProbeFailed` | Added, but Anytype couldn't check the key |
| `aiAppsStatusRemoved` | Removed in %s |
| `aiAppsStatusAccessEnded` | Access ended |
| `aiAppsStatusUnreadable` | Can't read %s's settings |
| `aiAppsStatusAttention` | Needs attention |
| `aiAppsStatusConflict` | Set up by another account or by hand |
| `aiAppsStatusRevokeFailed` | Disconnected, but the key wasn't deleted |
| `aiAppsStatusShared` | Uses the same settings as %s |
| `aiAppsAlsoIn` | Also used by %s |
| `aiAppsStatusCantConnect` | Can't reach Anytype on this computer |
| `aiAppsStatusRouter` | Runs the model; pick the app you chat with |
| `aiAppsOtherDescription` | Any app that supports MCP |
| `aiAppsApiOff` | The Local API is off, so AI apps can't reach Anytype. |
| `aiAppsApiFailed` | The Local API couldn't start, so AI apps can't reach Anytype. |
| `aiAppsApiStarting` | The Local API is starting… |
| `aiAppsApiOffButton` | Open Local API settings |
| `aiAppsDevelopersLink` | Developers: API keys and the API |
| `aiAppOther` | Other app |
| `aiAppChatgptWeb` | ChatGPT on the web |
| `aiAppClaudeWeb` | Claude on the web and mobile |
| `aiAppCoversChatgpt` | Also works in Codex CLI and the Codex IDE extension. |
| `aiAppCoversCodex` | Also works in the ChatGPT desktop app. |
| `aiAppCoversClaudeCode` | Covers the CLI, the Claude Desktop Code tab and the IDE extensions. |
| `aiAppCoversVscode` | Also works in Copilot CLI and the GitHub Copilot app. |
| `aiConnectTitle` | Connect %s |
| `aiConnectSentenceCan` | %s can |
| `aiConnectSentenceIn` | in |
| `aiConnectPermReadWrite` | read and edit |
| `aiConnectPermRead` | only read |
| `aiConnectAllSpaces` | All spaces |
| `aiConnectSpaceCount` | %s spaces |
| `aiConnectAdvanced` | Advanced |
| `aiConnectTier` | Tool set |
| `aiConnectTierRecommended` | Recommended |
| `aiConnectTierEssentials` | Essentials |
| `aiConnectTierLarge` | Larger set |
| `aiConnectTierFull` | Full |
| `aiConnectTierFullStdio` | Full, including local file tools |
| `aiConnectName` | Name in Anytype |
| `aiConnectRoute` | Connect using |
| `aiConnectRouteSkill` | Skill + API |
| `aiConnectRouteMcp` | MCP tools |
| `aiConnectReplaceNotice` | %s already has an Anytype entry that this account didn't create. Connecting replaces it. |
| `aiConnectReplaceButton` | Replace and connect |
| `aiConnectNoteSandbox` | Claude Code's sandbox is on, and it blocks direct calls to apps on this computer, so Anytype will use MCP tools instead of the skill. |
| `aiConnectSkillConflict` | You already have your own "anytype-api" skill in Claude Code. Anytype won't overwrite it. Use MCP tools or set it up by hand. |
| `aiConnectLinuxPackageLimit` | This Anytype package can't be started by other apps, so it can't be added to %s. Use the .deb, .rpm or tar.gz build. |
| `aiConnectTargetMoved` | Codex now uses %s. Anytype in the old location stays as it is until you disconnect it. |
| `aiConnectTargetMovedButton` | Connect this location |
| `aiConnectPlanPackage` | Anytype will add itself to %s. %s asks you to confirm once. |
| `aiConnectPlanKeyfile` | Anytype is already installed in %s. Only the access changes; restart %s afterwards. |
| `aiConnectPlanConfigRestart` | Anytype will add itself to %s's settings (%s). You'll need to restart %s. |
| `aiConnectPlanConfigSession` | Anytype will add itself to %s's settings (%s). Start a new session afterwards. |
| `aiConnectPlanConfigReload` | Anytype will add itself to %s (%s). Start a new chat afterwards. |
| `aiConnectPlanSkill` | Anytype will install its skill for %s and give it a key. Start a new %s session afterwards. |
| `aiConnectPlanCli` | Anytype will run %s's own command to add itself. Start a new session afterwards. |
| `aiConnectPlanDeeplink` | Anytype will open %s. Confirm there. |
| `aiConnectPlanManual` | Anytype can't change %s's settings on this computer. You can set it up by hand. |
| `aiConnectChatgptModes` | Use Anytype in Work or Codex mode. Chat mode doesn't show local tools yet. |
| `aiConnectDelivering` | Adding Anytype to %s… |
| `aiConnectNeedsQuit` | %s must be closed while Anytype changes its settings. |
| `aiConnectNeedsQuitSelf` | Quit %s, then continue. Anytype changes its settings while it's closed. |
| `aiConnectQuitContinue` | Quit %s and continue |
| `aiConnectAdded` | Added to %s |
| `aiConnectConnected` | Connected |
| `aiConnectFirstRequest` | %s made its first request. |
| `aiConnectProbeOk` | Anytype checked the new key and it works. |
| `aiConnectTryPrompt` | Try in %s: "List my Anytype spaces" |
| `aiConnectStepConfirm` | %s is asking you to install Anytype. Click Install there. |
| `aiConnectStepEnableExtension` | Anytype is installed in %s but switched off. Switch it on in Settings ▸ Extensions. |
| `aiConnectUnsignedNote` | This build's extension isn't signed, so %s shows "Developer: unknown". |
| `aiConnectOpenFailed` | Anytype couldn't open %s. Install the file by hand, or use the settings file instead. |
| `aiConnectStepRestart` | %s needs a restart to load Anytype. |
| `aiConnectStepRestartSelf` | Quit and reopen %s to load Anytype. |
| `aiConnectRestartedSelf` | I've restarted it |
| `aiConnectStepNewSession` | Start a new %s session to use Anytype. |
| `aiConnectStepReloadServer` | In VS Code, start a new Copilot chat on this computer. Windows connected to WSL or a remote machine read that machine's settings instead. |
| `aiConnectStepCopilotCli` | Copilot CLI picks Anytype up on its next turn. |
| `aiConnectStepToggle` | In %s, switch the anytype server on. |
| `aiConnectStepApproveFirstCall` | LM Studio asks you to approve the first tool call. |
| `aiConnectRestartApp` | Restart %s |
| `aiConnectOpenApp` | Open %s |
| `aiConnectStalled` | %s hasn't finished yet. |
| `aiConnectHintClaudeDesktop` | If Claude showed no install dialog, open Claude ▸ Settings ▸ Extensions ▸ Advanced settings ▸ Install Extension and pick the Anytype file. |
| `aiConnectHintLmstudio` | In LM Studio, confirm the anytype server in the dialog that opened. |
| `aiConnectHintCursor` | In Cursor, open Settings ▸ MCP and switch anytype on. |
| `aiConnectUseConfigInstead` | Use Claude's settings file instead |
| `aiConnectUseFileInsteadLmstudio` | Add to LM Studio's settings file instead |
| `aiConnectSetUpManually` | Set up manually |
| `aiConnectErrorUnparseable` | Anytype couldn't read %s, so it changed nothing. |
| `aiConnectErrorUnsupportedForm` | %s already has an Anytype entry in a form Anytype can't edit safely. |
| `aiConnectErrorPermission` | Anytype isn't allowed to write to %s. |
| `aiConnectErrorOutsideHome` | %s's settings are outside your home folder, so Anytype won't change them. |
| `aiConnectErrorChanged` | %s's settings changed while Anytype was working. Nothing was written; try again. |
| `aiConnectErrorConflict` | The Anytype entry in %s belongs to another account or was added by hand. Nothing was changed. |
| `aiConnectErrorStale` | This connection changed in another window. Nothing was written; try again. |
| `aiConnectErrorCliFailed` | %s's command didn't accept the settings. |
| `aiConnectErrorCliTooOld` | This version of %s can't be set up automatically. Update it, or set it up by hand. |
| `aiConnectErrorRemovedOld` | The previous Anytype entry in %s was removed and the new one wasn't added. Your earlier key still works: add it back by hand below. |
| `aiConnectErrorNotFound` | Anytype couldn't find %s on this computer. |
| `aiConnectErrorTimeout` | That took too long. Nothing was left half-done. |
| `aiConnectErrorApiOff` | The Local API isn't running. |
| `aiConnectErrorProbe` | Anytype added itself, but couldn't reach its own API with the new key. Check Settings ▸ Local API. |
| `aiConnectErrorKey` | Anytype couldn't create a key. |
| `aiConnectErrorKeyNotFound` | Anytype created a key but couldn't identify it, so nothing was set up. Remove the new key in Settings ▸ Local API and try again. |
| `aiConnectErrorUnsupportedPackage` | This Anytype package can't be started by other apps. |
| `aiConnectErrorUnknown` | Something went wrong. Nothing else in the app's settings was changed. |
| `aiConnectManageAccess` | Access |
| `aiConnectManageTarget` | Added to |
| `aiConnectOtherTierHint` | The tool set is part of the address you pasted into the app. |
| `aiConnectReveal` | Reveal |
| `aiConnectReconnect` | Reconnect |
| `aiConnectReconnectConfirm` | The old key is gone. Check the access below, then connect again. |
| `aiConnectReplace` | Replace |
| `aiConnectDisconnect` | Disconnect %s |
| `aiConnectDisconnectTitle` | Disconnect %s? |
| `aiConnectDisconnectText` | Anytype removes itself from %s and deletes the key. |
| `aiConnectDisconnectShared` | This also disconnects %s. |
| `aiConnectDisconnectSharedVscode` | This also disconnects Copilot CLI and the GitHub Copilot app. |
| `aiConnectDisconnected` | %s is disconnected |
| `aiConnectLeftExtension` | The key is deleted, so Claude can no longer reach Anytype. To finish, remove Anytype in Claude ▸ Settings ▸ Extensions. |
| `aiConnectLeftEntry` | The key is deleted, so the entry no longer works, but Anytype couldn't remove it from %s. You can delete it by hand. |
| `aiConnectRevokeFailed` | Anytype removed itself from %s but couldn't delete the key. Retry from the list. |
| `aiConnectAccessSaved` | Access updated |
| `aiConnectTierSaved` | Tool set updated |
| `aiConnectAttentionRemoved` | Anytype was removed inside %s. |
| `aiConnectAttentionAccessEnded` | This connection's key was revoked or has expired. |
| `aiConnectAttentionUnreadable` | Anytype can't read %s's settings file. |
| `aiConnectAttentionReconnect` | Anytype's address changed. Reconnect to update %s. |
| `aiConnectAttentionConflict` | The Anytype entry in %s was set up by another account or by hand. Replace it with this account's, or forget this connection. |
| `aiConnectManualTitle` | Set up %s manually |
| `aiConnectManualOpen` | Open %s |
| `aiConnectManualAdd` | Add this under "%s": |
| `aiConnectManualRun` | Run this in a terminal: |
| `aiConnectManualPrepare` | Create a key. Anytype stores it where its Claude extension reads it; you don't need to copy it. |
| `aiConnectManualInstallFile` | In Claude, open Settings ▸ Extensions ▸ Advanced settings ▸ Install Extension and pick this file: |
| `aiConnectManualKey` | Key |
| `aiConnectManualShow` | Show |
| `aiConnectManualHide` | Hide |
| `aiConnectManualCreateKey` | Create key |
| `aiConnectManualUpdated` | I've updated %s |
| `aiConnectManualRestoreOld` | Put the previous entry back |
| `aiConnectManualUseNew` | Or use a new key |
| `aiConnectGrantChanged` | This connection's access changed since you opened this window. Check it, then connect again. |
| `aiConnectManualFormatMost` | Most apps: add this to the app's MCP settings |
| `aiConnectManualFormatCommand` | Apps that run a command: |
| `aiConnectManualUrl` | Apps with a form — URL: |
| `aiConnectManualHeaderName` | Header name: |
| `aiConnectManualHeaderValue` | Header value: |
| `aiConnectUnsupportedChatgptWeb` | ChatGPT on the web runs tools from OpenAI's servers, so it can't reach Anytype on your computer. The ChatGPT desktop app can. |
| `aiConnectUnsupportedChatgptClassic` | ChatGPT Classic can't use local tools. The new ChatGPT desktop app can, in Work or Codex mode. |
| `aiConnectUnsupportedClaudeWeb` | Claude on the web and on mobile runs tools from Anthropic's servers, so it can't reach Anytype on your computer. Claude Desktop and Claude Code can. |
| `aiConnectUnsupportedOllama` | Ollama runs the model but has no way to use tools. Connect the app you chat with instead. |
| `aiConnectGetApp` | Get %s |
| `apiKeyCreatedByAiApps` | Created by AI apps |
| `electronMenuConnectAi` | Connect to AI… |
| `notificationAiConnectSuccessTitle` | Use Anytype in %s |
| `notificationAiConnectSuccessText` | Anytype found %s on this computer. Connect it to use your spaces there. |
| `notificationAiConnectSuccessTextMany` | Anytype found AI apps on this computer. Connect one to use your spaces there. |

### 5.11 SCSS

- `settings.scss`: add `> .pageSettingsAiApps` to the selector groups whose rules it shares (`.titleWrapper`, `.apiKeyIntro`, `.localApiStatus*`: share the selector, don't copy values), plus one block for the row layout.
- `src/scss/popup/aiConnect.scss` (imported after `apiCreate`): popup-only layout.
- **New values (the only ones):** `.aiAppRow` icon box 32×32 px, `border-radius: 8px`, 12px gap to the text; letter avatar `var(--color-shape-tertiary)` / `var(--color-text-secondary)`; `.sentenceRow` and Advanced rows `gap: 8px`, `min-height: 32px` (as `.expiryRow`); `button.linkButton` and `button.spaceSummary` reset to `border: 0; background: none; font: inherit; color: inherit; padding: 0`, covered by the existing `:focus-visible` outline rule of `.apiKeyEditor`.
- Two-block rule, native nesting, no `cursor: pointer`.

### 5.12 Storybook

Views take typed props and callbacks; stories pass fixtures and `fn()` callbacks and never depend on `.storybook/mocks/renderer.ts`.

- `popup/aiConnect/{form,finish,manage,manual,unsupported}.stories.tsx` with `withPopup('AiConnect')`: Connect (Cursor), ConnectAdvanced (Claude Code), ConnectReplace, FinishRestart, FinishConfirm (unsigned), FinishAdded, FinishStalled, FinishError, FinishNeedsQuit, Manage, ManageConflict, ManageRevokeFailed, Manual (with key), ManualOther (before Create key), Unsupported, Ollama.
- `page/main/settings/aiApps.stories.tsx`: split the page into a container and a props-driven `AiAppsList`; stories render `AiAppsList` inside the settings wrapper (`<div className="settingsPageContainer"><div className="settingsPage pageSettingsAiApps">…`): Empty, NothingDetected, ScanFailed, Detected, Connected (ok + pending + conflict + revokeFailed), ApiOff.
- `component/util/aiAppIcon.stories.tsx`; **new** `component/form/appGrantFields.stories.tsx` (default, `withPermission={false}`).

---

## 6. Phases

Gate for every phase: §7.2.

### Phase 1 — Main-process foundation

Tasks:

1. Set-up: devDependencies (§3.1); `bun run update:locale` (and again after every `text.json` edit in later phases).
2. **Redaction and gates before any real key is used (R2-25, R2-24):**
   - `dispatcher.ts`: a `SKIP_LOG` list checked first in `needRequestLog()`: `'AccountLocalLinkCreateApp'`, `'AccountLocalLinkListApps'`, `'AccountLocalLinkSolveChallenge'` (check `AccountLocalLinkUpdateApp`'s response and add it if it carries a key). **The same commands bypass the gRPC DevTools interceptor (R3-9)** (`grpc-devtools` `unaryInterceptors` imported at the top of `dispatcher.ts`): have the interceptor skip these method names, or send them without it.
   - `electron/js/preload.cjs`: expose `aiConnect: true` on `window.Electron`.
   - `main.ts`: the sender gate (§3.11) with its pure predicate.
   - `scripts/ai-connect-keycheck.js <dir>`: reads a key from **stdin**, scans the files under `<dir>`, prints only `PASS` or `FAIL` plus file names; never the key or a matching line.
3. `interface/aiConnect.ts`, `lib/aiConnect/catalog.ts`, `electron/ts/lib/aiConnect/types.ts`. Both tsconfigs must compile code that builds each per-command result's success, fallback and error variants (`needs: 'quitApp'`, `openFailed`, `removedOld`, `keyNotFound`): put these fixtures in `src/ts/lib/aiConnect/catalog.test.ts` and `electron/ts/lib/aiConnect/validate.test.ts`.
4. `electron/mcp/*`, `scripts/build-mcp.js`, the hook in `build-electron.js`, packaging entries (§3.5).
5. `validate`, `fsSafe`, `jsonFile`, `tomlFile`, `keyFile`, `registry`, `proxy`, `exec`, `detect`, `probe`, `skill` with tests.
6. `aiConnect/index.ts` with the queue and the real `Env`; implement `list`, `probe`, `claimNudge`, `bundleInfo`; the other methods return a validation-stage error until Phase 2. Wire all `Api` methods.

Tests (temp dirs, injected `Env`; all under `electron/**` or `src/ts/lib/aiConnect/`):

- `validate`: every rule; ports 0 and 65536 rejected, 1 and 80 accepted; `aiConnectCheck` without a port is valid when `apiListening` is false and invalid when true; `replace` accepts only `{ targetPath, foreignDigest }` (a boolean is rejected); `aiConnectOrphan` shape; unknown properties; a key with a quote or newline.
- `fsSafe`: modes for new files and dirs; existing `0644` + `secret` → `0600`; existing `0644` without `secret` stays; the backup holds the **snapshot** text, is `0600`, and a link at the backup path is refused; a change made **after the temp file is written and before the rename** → `changed` (hook between the two steps); on a simulated `EBUSY` the recheck runs again before each retry; a symlinked target is written through and the link kept; a target resolving outside home → `outsideHome`; temp file removed on failure. Mode asserts are skipped on win32.
- `jsonFile`: comments and trailing commas kept; **a first install into `{}` and into a missing file passes `mutationOnly`**; a change elsewhere fails it; root array / broken JSON → error; remove only ours; **`anytype` first with a comment before the next server: the comment survives removal (or the result is `unsupportedForm`)**.
- `tomlFile`: other tables and comments byte-identical; **a comment block before the next table stays**; the first table into an empty file; `[mcp_servers.anytype.env]` replaced; inline / dotted / quoted forms → `unsupportedForm`; a multiline string in the span → `unsupportedForm`; CRLF; **connect → disconnect on an empty file returns to empty; with an explicit `[mcp_servers]` header the header stays; with a sibling server the sibling stays**.
- `keyFile`: modes; no backup file created; bad id; a link at `~/.anytype`, at `ai-connect` or at the file is refused.
- `registry`: per-account isolation; `claimNudge` true once; broken file quarantined; `patch`; orphan add / remove / list per account; a file without `orphanHashes` loads.
- `detect`: per-OS fake file systems; ChatGPT vs Classic, and a **Classic-only** machine (ChatGPT not installed); labelled shell output with junk lines; a `.cmd` shim is not runnable; Windows: `OpenAI.Codex` package → ChatGPT installed, `.codex` alone doesn't; Linux `chatgpt` executable; a shell miss followed by a hit in `~/.local/bin`; `where.exe` is called by its full path and every `run` has `cwd = home`; `cursor` / `agent` CLI → Cursor installed; a `createdDirs` directory isn't evidence; `CODEX_HOME` makes Codex and ChatGPT resolve to different targets.
- `probe`: ok for `large` (session header echoed, DELETE sent) and for `full` (no session, no DELETE); 202 on the notification; the negotiated version header on follow-ups; 401; refused; timeout; DELETE still sent when `tools/list` fails.
- `skill`: frontmatter first; markers; body identical.
- `connect.test.ts` (spawns the wrapper with `ANYTYPE_AI_CONNECT_DIR`): missing file → `-32001` and no key on stderr; a valid file + a stub `cli.mjs` → the stub sees the base URL, the header, `--tier`, and **no** `ANYTYPE_MCP_FILES_DIR`; port 70000 → fail closed; a symlinked key file → fail closed.
- `buildMcp.test.ts`: stored (not deflated) entries; manifest fields; `mcpb.json` has `signed: false` and a `sha256` equal to the final archive's digest; `MCPB_SIGN_REQUIRED=1` without a cert → throws. **Signing positive path (R2-19):** generate a throwaway self-signed cert and key in a temp dir, build with it and its fingerprint → `signed: true`, the recorded signer fingerprint and the final-archive digest match; the same build with a wrong `MCPB_SIGN_FINGERPRINT` fails; a byte flipped in the signed archive fails verification. If the pinned `mcpb verify` can't tell these apart, the script's verifier is the fallback named in §3.5 and this test proves it.
- **IPC through the real `Api` facade** (`api.aiConnect.test.ts`, with `electron` mocked as other `electron/ts/*.test.ts` files do): `aiConnectList` success with detections and `scanOk`; `aiConnectProbe` ok against a fake fetch; `aiConnectClaimNudge` true, then false; a bad `appId` → the validation error.
- **Sender gate predicate:** allowed for the active tab's top frame of a normal window; denied for Quick Search, the approval window, the tab strip, a non-active tab, a sub-frame; nudge claim denied for an unfocused window.
- **Dispatcher sentinel (R2-25, R3-9):** run the real `dispatcher.request` path with a mocked transport, all `flagsMw` debug flags on **and the gRPC DevTools interceptor enabled** (a fake `window.__GRPCWEB_DEVTOOLS__` hook that records what it receives); a `CreateApp` response and a `ListApps` response carrying `SENTINEL-…` reach neither `console.log` nor the hook.
- `isDesktop()` is false for the web mock and the extension mock, true only with the preload capability.

Acceptance:

- `bun run build:electron` produces `dist/mcp/{cli.mjs,connect.mjs,Anytype.mcpb,mcpb.json,skill/*}` and logs the unsigned line.
- In `bun run start:dev`, DevTools on a tab: `await window.Electron.Api(1, 'aiConnectList', [ { accountId: 'x' } ])` returns this machine's detections; the same call from Quick Search or the tab-strip page returns nothing.
- Wrapper smoke: `ELECTRON_RUN_AS_NODE=1 <electron binary> dist/mcp/connect.mjs --connection nope` answers an `initialize` line with the reconnect error.
- Phase notes record: the heart `serverInfo.name` re-check (expected `anytype`); a real key against the key regex; the pinned mcpb version and its `sign` / `verify` / `validate` flags.

### Phase 2 — Adapters, restart, service operations

Tasks: `restart.ts`; `adapters/*`; complete the service (`plan`, `apply`, `recordManual`, `update`, `remove`, `revoked`, `check`, `stepDone`, `restartApp`, `reveal`, `openApp`) and the icon cache.

Tests (temp HOME; fake `run` / `openExternal` / `kill` / `listProcesses`):

- **Ownership across accounts on the same temp home:** A connects Cursor → B connects (plan says `foreign`; without `replace` → `conflict`; with `replace` → ok) → A's check is `conflict`, and A's update and disconnect leave B's entry byte-identical. The same for the Claude key file and the Codex TOML.
- Per adapter: `plan().steps` snapshot per OS with `<KEY>`; `apply()` writes exactly the planned entry.
- `cursor`, `copilot`, `lmstudio` file route: other servers and comments kept; idempotent reapply; first install into a missing file; `removed` only after `observedInstalled`, else `pending`; port heal with the key from the file; unparseable → bytes unchanged; file edited mid-flight → one re-plan (ownership re-checked), then `changed`.
- **Heal keeps the step (R2-20):** a Cursor record with `nextStep: 'none'` goes through a port change → entry rewritten, `nextStep: 'restart'` persisted.
- `codex`: the same on TOML; ChatGPT then Codex → one record when the files match, two when `CODEX_HOME` differs; `CODEX_HOME` moved from A to B → the old record and its file are untouched, before and after connecting B; **custom → occupied default: connecting reuses ChatGPT's record — its entry bytes and its key hash are unchanged, no `CreateApp`**; `restart` only when ChatGPT reads the changed file; the record isn't `notInstalled` while a sibling is installed; no `canRestart` on win32 or linux.
- `claudeCode` skill: unrelated `env` keys kept; **sandbox on (macOS, Linux, Windows) → the plan switches to `http` with the note, and `sandbox` settings are never written**; an unmarked `SKILL.md` → `conflict`, file bytes unchanged; a marked one is refreshed; a settings failure removes only a skill file created in this call; remove deletes only a marked `SKILL.md` and the directory only when empty. MCP route: version `2.1.326` → `cliTooOld` and nothing is run; first install runs no `remove`; exact argv arrays; `CLAUDE_CONFIG_DIR` passed when resolved; the JSON only on stdin; **the key never in argv**; `add-json` failure with a previous entry now gone → `removedOld`, with it still present → plain `cliFailed`; **`add-json` times out but the entry now carries the new fingerprint → `ok` (R3-1)**; no second attempt; **`check` never calls `run`**: it reads the config file and returns `ok` / `removed` / `conflict` (other bearer) / `unreadable` / `reconnect`.
- `claudeDesktop`: extension states from the two real fixture files (installed, disabled, outdated version, absent, unreadable); **signed build with a wrong-signer extension, enabled and disabled: apply returns `needs: 'installExtension'`, the bundle is opened, no key file and no record are written; a second apply after the expected extension appears writes the key file; cancel before that → key file untouched (R3-4)**; **config entry ownership by digest: an env-only edit → `conflict`; an edit between the merge and a failed key-file commit → no rollback, `left: 'entry'` (R3-5)**; `installed` → key file only, no open; `disabled` → no open, `toggle`; `absent` → copy + open per OS; `manual: true` → copy, no open; open failure → `ok` + `openFailed`. Fallback: `plan` reports `preflight` when running or unknown and **writes nothing**; a foreign config entry → `foreign`; apply with `allowQuit` → quit, merge (no key, no `url`), key file, `configEntry` stored, relaunch; a key-file failure **restores the previous entry value** and relaunches; a parse failure after the quit relaunches; check with a config entry ≠ `configEntry` → `conflict`, untouched; remove leaves a non-equal entry alone; `left: 'extension'`; Linux without `proxySupported` → `unsupportedPackage` and no steps; Windows path resolution for both package families and `Claude-Data`.
- `lmstudio`: the URL decodes to the entry; deeplink only on a first install with no entry and a handler whose path equals the detected install; a record or an entry present → file route with ownership; after the deeplink the record is `pending` until an entry with the **expected fingerprint** appears (another fingerprint → `conflict`); the file fallback with the same key adds nothing to `revokePending`; scheme guard; a pointer with a second line, a relative path, or a path outside home is ignored.
- `restart`: match by full path only (a second `claude.exe` elsewhere is ignored); Windows: helper processes with `--type=` are ignored, two candidates → `unknown`; no `/F`; no `SIGKILL`; a second restart call on the same pid sends no second signal; a refused quit → timeout; `unknown` → no kill; `launch` failure (`error` event) is reported; Linux `/proc` check and its `unknown` case.
- **Replace binding (R3-6):** plan returns `foreignDigest`; apply with a stale digest or another `targetPath` → `conflict`, bytes unchanged; the foreign entry changes during a writer retry → `conflict`.
- **Owned fields (R3-5):** an owned Cursor entry whose `url` host was hand-edited → `conflict` on heal and remove.
- Service: the queue serialises concurrent applies; `check` without a port heals nothing and still reconciles keys and orphans; a `removed` record with two pending hashes is deleted only after both are confirmed; an `expectedHash` mismatch → `stale` and no write; apply on a `removed` record → `stale`; `remove` marks `removed` and adds the hash to `revokePending`; rotation with the same hash adds nothing; `revoked` deletes the record; check with `keys: null` changes nothing about keys; check with a pending hash `present: false` acknowledges it; unmanaged hashes in the input are ignored; `revokeFailed`; `accessEnded`; a manual record is never `notInstalled` and never reaches an adapter; other accounts are invisible; `nextStep`, `lastProbe`, `recommendedTier` persisted.
- **Sentinel key (main):** run every adapter's apply / update / check / remove with the key `SENTINEL-…`, with spies on `Util.log`, `console.*` and the registry writer; the sentinel appears only in the target file, the key file, CLI stdin and the deeplink URL.
- A source scan test over `electron/ts/lib/aiConnect/**` (non-test files): no `exec(`, `execSync(`, `shell: true`.

Acceptance (manual, developer's macOS, throwaway keys via DevTools `Api` calls):

- Cursor, Codex / ChatGPT, Copilot: the entry appears; a broken config stays byte-identical; remove leaves the rest; the backup exists with mode `0600`.
- Claude Code skill route: in a **new real `claude` session**, the skill's `whoami` call (`curl -q --noproxy '*' -sS "$ANYTYPE_API_URL/v2/auth/whoami" -H "Authorization: Bearer $ANYTYPE_API_KEY"`) returns 200. MCP route: `claude --version` passes the gate, the entry is in Claude's config file, and a passive check starts no process (watch with `ps`).
- Claude Desktop: the bundle opens the install dialog; after Install, capture `extensions-installations.json` and `Claude Extensions Settings/<id>.json` as test fixtures (real id, version, signer and enabled fields; fix the constants if they differ); disable the extension in Claude → Anytype shows the Enable instruction and doesn't reopen the bundle; the tools list after a restart; deleting the key file yields the reconnect message.
- LM Studio (if installed): the link opens the add-server dialog with URL and header.
- Restart works for Cursor and Claude; with an unsaved file in Cursor, a refused quit is reported, not forced.

### Phase 3 — Renderer

Tasks:

1. (Dispatcher redaction and the desktop capability are already in from Phase 1.)
2. `store/aiConnect.ts`, `lib/aiConnect/{flow,steps,deeplink}.ts`.
3. `AppGrantFields` `withPermission` prop + story.
4. `AiAppIcon`, the gallery (container + `AiAppsList`), the popup container + five views, registrations.
5. `text.json`, SCSS, stories.

Tests (`src/ts/lib/aiConnect/*.test.ts`, self-contained: mock `C`, `Renderer`, `S` with `vi.mock`; do not rely on a global `U`):

- `mintKey` (R2-1), with the **real response shapes** (`CreateApp` → `{ key }`, `ListApps` → rows with `apiKey`, `hash`): two rows with the same name → the hash of the row whose `apiKey` matches; row missing on the first two lookups → found on the third, `CreateApp` called once; never found → `keyNotFound`, `CreateApp` called once, no apply; API not `listening` → no `CreateApp`.
- **Close during delivery (R3-1):** `releasePendingKey()` called before the apply reply arrives awaits it; reply `ok` → the new key is kept and the old hash is revoked; reply `error` → the new key is revoked once; a failed release revoke → `aiConnectOrphan`.
- **Revocation end to end (R3-3):** rotate A→B with A's revoke failing → disconnect B → simulate a restart (fresh store, same registry) → Retry with the HTTP API off → both hashes revoked, the record gone.
- **Fallback keys (R3-2):** manual after a failed apply commits the new key only through `aiConnectManualUpdated` and revokes the old hash after it; closing first releases the new key; manual reconnect likewise; LM Studio file fallback after a committed deeplink uses `keyFor`; `removedOld` exposes the old key by hash.
- **Reconnect re-read (R3-8):** the grant changes between the sheet and the mint → no `CreateApp`, the new values are returned for confirmation.
- `flow`: order plan → consents → mint → apply → revoke old → `revoked` → probe; `plan.preflight` without consent → `needsQuit` and **no `CreateApp`**; `needsReplace` → no `CreateApp`; a failed apply keeps the old key and the pending key is revoked exactly once by `releasePendingKey()`; a committed key is not revoked on close; a second delivery of the same flow reuses the pending key; `removedOld` surfaces; `stale` → release; reconnect reuses the current `grant` and the absolute `expireAt`; reconnect of a revoked key → `needsForm` with a still-future expiry kept and a passed one dropped; manual reconnect keeps the `connectionId`; `retryProbe` calls neither `CreateApp` nor apply; disconnect: a revoke failure keeps the record as `revokeFailed`, "not found" counts as revoked, Retry works with the API off; `check`: single-flight, a failed `ListApps` sends `keys: null`, only managed hashes are sent, legacy rows are ignored; `isDesktop() === false` → no `CreateApp` and no key IPC.
- **Sentinel key (renderer):** run `connect` with a sentinel returned by the mocked `CreateApp` and `ListApps`, with `console.*` spied; the sentinel never reaches `console`, `Storage`, the store, analytics or a route.
- `steps`: masking; the copy value; `<KEY>` before a key exists.
- `deeplink`: `/ai/connect?app=cursor` → `{ app: 'cursor' }`; `/ai/connect/?app=cursor&key=x&route=y` → only `app`; unknown app → `''`; `/ai/other` and `/ai/connect/x` → `null`.

Acceptance:

- Dev app, signed-in account: the gallery lists detected apps; Cursor: Connect → Restart → "Added"; Manage → change access (visible in Settings ▸ Local API), tool set, Reveal, Reconnect (same grant and expiry; old key gone), Disconnect (entry and key gone).
- Close the popup at "Restart Cursor": the row shows "Finish in Cursor" + Continue, also after restarting Anytype.
- Codex after ChatGPT → "Uses the same settings as ChatGPT".
- A broken `~/.cursor/mcp.json` → manual view; nothing is minted until Create key.
- "Set up manually" on the connect sheet works for every Release 1 card. Other app: create, reconnect (same row), disconnect.
- A not-installed card shows Get app + Set up manually.
- **Keyboard only:** open AI apps, connect an app with **only read** and **one space**, finish, open Manage, disconnect — without the mouse. Esc does nothing while delivering.
- Storybook: every story in §5.12 in light and dark; screenshots of Connected, Connect, FinishRestart, FinishAdded, Manage, ManageConflict, Manual, Unsupported in the phase notes.
- `/dark-mode-check` clean.

### Phase 4 — Integration

Tasks:

1. Entry points (§5.8): `Action.openAiApps`, the router hook, `page/main/aiConnect.tsx`, the Help menu, the API Keys backlink.
2. Self-heal triggers in `app.tsx` next to `disposeApprovalSpaces`: a `reaction` on `[ S.Auth.account?.id, S.Auth.jsonApiStatus?.listenAddr, S.Auth.jsonApiStatus?.success ]` with `{ delay: 2000 }`. When `isDesktop()` and an account exists: on an account change run `flow.load(true)`; on every change run `flow.check('auto')` (it heals only when the API is `listening`). `S.AiConnect.clear()` on logout.
3. Nudge (§5.9).
4. Analytics, events and filter together (R2-26). Add `'app'`, `'stage'`, `'category'`, `'by'` to `KEYS`. In `analytics.event`, codes starting with `AiConnect` take a separate branch that builds the **final payload from a per-event allow-list** and nothing else: no `spaceId`, `spaceType`, `permissions`, `context` or object context. Allow-lists:
   `AiConnectOpen { route }` · `AiConnectStart { app, route }` (here `route` is the delivery route: http / stdio / skill) · `AiConnectDelivered { app, method }` · `AiConnectNextStep { app, step }` · `AiConnectProbeOk { app }` · `AiConnectFailed { app, stage, category }` · `AiConnectRemoved { app, by: 'user' | 'selfheal' }` · `AiConnectUnsupportedShown { app }`. `AiConnectConnected` is **not** sent in the POC.
5. Release CI: in `.github/workflows/build.yml`, on the tag (release) path only, set `MCPB_SIGN_REQUIRED=1`, `MCPB_SIGN_CERT`, `MCPB_SIGN_KEY` (secrets written to temp files) and `MCPB_SIGN_FINGERPRINT` for the `bun run build` step. Nightly and branch builds stay unsigned. Document the three secrets in `docs/electron/README.md`. Each OS job signs its own copy with the same certificate (sharing one artifact is a follow-up).
6. Docs: `/update-docs` for `docs/electron/README.md`, `docs/src/ts/store/README.md`, `docs/src/ts/component/page/README.md`, `docs/src/ts/component/popup/README.md`, `docs/src/ts/lib/README.md`.

Tests (self-contained, new files): with an active space and a populated analytics context, each `AiConnect*` event passes **exactly** its allow-listed object to the analytics client (assert the whole object); the notification "Clear all" sends only non-local ids; the nudge buttons are native `button`s with accessible names.

Acceptance:

- `open "anytype://ai/connect?app=cursor"`, with the app running and on a cold start → AI apps with the Cursor sheet; the popup still opens when the settings page had to mount first; **a second link (`app=codex`) while the gallery is open switches to the Codex sheet; Back and Forward don't reopen a sheet and history isn't reset**; `app=nope` → gallery only; `&key=…` is ignored; no key exists until Connect.
- Help ▸ Connect to AI… opens the page (label present after `bun run update:locale`). The API Keys backlink opens Manage for that exact connection, including an Other-app one.
- A port change in Local API: `~/.cursor/mcp.json`, `~/.codex/config.toml` and the Claude key file get the new port silently; a Claude Code MCP connection shows "Needs attention". With the API off or failed, nothing is rewritten.
- Revoke a key on the Local API page → "Access ended". Delete the entry in the app's file → "Removed in <App>", not re-added. Replace the key in the file by hand → "Set up by another account or by hand", untouched.
- Fresh profile, Cursor installed, two windows open: exactly one notification, in the focused window, once; none after a restart; its Connect and Dismiss are reachable with Tab and work with Enter / Space; "Clear all" produces no RPC error.
- **Packaged smoke (macOS):** `bun run build`, then `ELECTRON_SKIP_NOTARIZE=1 ELECTRON_SKIP_SENTRY=1 bunx electron-builder --macos --arm64 --dir` (no `build:deps`). Confirm `dist/mac-arm64/Anytype.app/Contents/Resources/app.asar.unpacked/dist/mcp/{connect.mjs,cli.mjs,Anytype.mcpb,mcpb.json}` exist. With a running heart and a key file, from `cd /`, run the emitted wrapper command (`ELECTRON_RUN_AS_NODE=1 <App>/Contents/MacOS/Anytype <…>/connect.mjs --connection claude-desktop`) and send `initialize`: a valid result comes back.
- With the analytics debug flag on, each event appears once with only the listed properties.

---

## 7. Security requirements and verification

### 7.1 Requirements

1. **The key exists only in:** heart; renderer memory during a flow (the module-level operation and local variables; never the store, `Storage`, a route, analytics or logs); one IPC message; the target app's config; the key file. Never in the registry (only a 16-hex fingerprint and digests), `Util.log`, `console.*`, dispatcher debug logs, the gRPC DevTools interceptor, or an error returned to the renderer.
2. **IPC:** `aiConnect*` only from the active tab's top frame of a normal app window (not Quick Search, the approval window or the tab strip); exact-shape validation in main; the renderer never supplies a path, command, argument, URL, host or scheme; stale operations rejected by `expectedHash`.
3. **Desktop only:** no key minting and no key-bearing IPC unless the real preload's `aiConnect` capability is present (the web and extension mocks lack it).
4. **Processes:** `execFile` / `spawn` with argument arrays and an explicit neutral `cwd`; system tools by full path on Windows; one constant `$SHELL -lc` script; secrets on stdin only; no argv fallback; `.cmd` / `.bat` shims never executed; timeouts everywhere; CLI output not logged; background checks start no CLI.
5. **Files:** the resolved target is under the user's home; new files `0600`, dirs `0700`; a file that gains a secret is tightened to `0600`; backups `0600`, written from the snapshot, never through a link; no backup of the key file; atomic replace with a recheck right before every rename attempt; abort on parse failure; the intended-mutation guard before every write; the key-file directory chain and files reject links.
6. **Ownership:** heal, update, remove and rollback act only on an entry Anytype provably wrote: the key fingerprint plus the owned fields for entries that hold the key, the full-entry digest for the keyless Claude Desktop config entry. A foreign or unverifiable entry is replaced only after an explicit choice bound to the exact entry the user was shown (`foreignDigest`). A user's own `anytype-api` skill is never overwritten or deleted. On a signed build the key file is written only for an extension with the expected signer.
7. **Order:** all preflight and any quit consent come before a key is minted; grant and expiry are re-read right before minting; a key is minted in one place (`mintKey`) and never twice for one request; closing the UI never abandons an in-flight delivery — cleanup waits for it and then keeps a committed key or revokes an uncommitted one; a revoke that fails is recorded (`revokePending` or `orphanHashes`) and retried by every check; the old key is revoked only after the new delivery committed; a failed delivery leaves the old key working.
8. **Links:** `anytype://ai/connect` carries only a validated app id and creates nothing. Outgoing key-bearing links (`lmstudio://`) are opened by main, behind a scheme allow-list, and only to the detected LM Studio; never through https.
9. **Other apps:** restart only after a click; the process is matched by full path; one graceful signal per process, never forced; never re-add an entry removed in the AI app; never a `url` entry in `claude_desktop_config.json`; Claude's own config file and sandbox settings are never written.
10. **Wrapper and bundle:** fail closed; reads only its key file; clears `ANYTYPE_MCP_FILES_DIR`; the bundle has no key; release builds require a signature whose signer fingerprint matches.
11. **Probe and wrapper** talk only to `http://127.0.0.1:<port>`; no redirects.
12. **Accounts:** records are filtered by `accountId`.

Accepted for the POC: keys in plain text in Route A config files and in the key file; `ELECTRON_RUN_AS_NODE`; the bearer header visible in the argv of the agent's own `curl`; no Windows ACL verification (a Windows ship blocker, §8).

### 7.2 Phase gate

| Phase | Commands | Extra |
|---|---|---|
| all | `bun run typecheck` (both tsconfigs) · `bun run lint` (covers `src/` only; `electron/**` and `scripts/**` are excluded, so typecheck + vitest are their gate) · `bun run test` · `bun run update:locale` after any `text.json` edit | **Baseline: 90 failures in 6 files** (§2.3). Pass = the same 90 and no others, and every new test green. Record the before / after failure counts in the phase notes. `git status` shows only planned files |
| 1 | `bun run build:electron` · `bunx vitest run electron/ts/lib/aiConnect src/ts/lib/aiConnect` | `unzip -v dist/mcp/Anytype.mcpb` shows `Stored`; wrapper smoke |
| 2 | `bunx vitest run electron/ts/lib/aiConnect` | Manual adapter runs; after each, pipe the test key into `node scripts/ai-connect-keycheck.js "<userData>"` → `PASS` (the key is in no Anytype file: registry, logs). Never put the key on a command line |
| 3 | `bunx vitest run src/ts/lib/aiConnect` · `bun run storybook` | `/dark-mode-check`; the diff has no `querySelector`, `getElementById`, `cursor: pointer`, hex colors, or `Component` `Button` / `Select` inside the new popup and page |
| 4 | full gate | Manual checks above; packaged smoke; `/update-docs` |

---

## 8. Test before ship (from README §12 and the review)

| Item | In POC? |
|---|---|
| Static `.mcpb` opens Claude's install dialog on macOS (cold and warm) | **In** (Phase 2) |
| Real extension id and `extensions-installations.json` shape (enabled / disabled / version) | **In** on macOS; Windows out |
| `.mcpb` on Windows via `Claude.exe <file>`; both package families; migrated `Claude-Data` profile; packaged Claude reading `~/.anytype/ai-connect/` | Out — Windows machine; the route is best effort with a visible fallback |
| Signed bundle removes "Developer: unknown"; certificate choice; CI secrets | CI wiring: **in** (Phase 4). Verified signed install: out |
| One signed artifact shared by digest across OS jobs | Out — follow-up |
| heart `serverInfo.name` equals manifest `name` | **In** (Phase 1; expected to pass) |
| Cursor: restart, then the server toggle | **In** (manual) |
| Cursor deeplink keeps `headers` | Out — not used |
| VS Code: `~/.copilot/mcp-config.json` picked up without reload; minimum version; Remote / WSL windows | Out — manual matrix |
| ChatGPT app: Work / Codex mode picks up `config.toml` after restart | **In** on macOS |
| ChatGPT on Windows: package name for detection; a restartable executable | Out |
| LM Studio: `lmstudio://add_mcp` with loopback URL + header; home pointer | **In** if installed on the dev machine |
| Native MCP against every Release 1 client; newer `MCP-Protocol-Version`; clear 401 | Out — heart asks |
| Route C vs MCP eval in Claude Code | Out — the default is provisional |
| Claude Code with the sandbox on: the plan switches to MCP tools | **In** (unit test + one manual run on macOS) |
| heart: return `appHash` in `CreateApp.Response` (removes the `ListApps` lookup in `mintKey`) | Out — heart ask |
| Pinned `mcpb verify` really rejects a tampered or foreign-signed bundle | **In** (Phase 1 positive-path test decides which verifier the build uses) |
| Skill requests from native Windows PowerShell (`curl.exe` form) | Out — Windows machine |
| `claude mcp add-json … -` on CLI ≥ 2.1.327 | **In** (Phase 2) |
| Proxy under `ELECTRON_RUN_AS_NODE`: unpacked macOS app | **In** (Phase 4 packaged smoke) |
| Signed + notarized macOS build, Windows NSIS, Linux deb / rpm | Out |
| Linux AppImage / Snap / Flatpak stdio | Out — returns manual |
| `SIGTERM` restart with unsaved work | **In** (manual, once) |
| Windows: ACLs on files that hold a key; ACL-preserving replace | Out — **Windows ship blocker** |
| Real key format against the IPC key regex | **In** (Phase 1) |

---

## 9. Open questions (defaults in place; the user is away)

1. **Sidebar icon for "AI apps".** Default: reuse `settings/api`. A dedicated icon and brand card icons need design.
2. **Key-file folder `~/.anytype/ai-connect/`.** Default as specified, unless `~/.anytype` is reserved by another Anytype tool.
3. **Sidebar position.** Default: "Data management", above "Local API".
4. **Nudge frequency.** Default: once per profile.
5. **Signing certificate for the `.mcpb`.** Default: PEM cert + key + expected fingerprint from CI secrets. Which certificate is for the release-CI owner.
6. **Permission wording.** The sheet says "read and edit / only read"; the Local API page keeps "Read and write / Read only".
7. **Deferrals awaiting product sign-off:** Codex Route C; the manual screen's "Your system" selector; the Cursor deeplink and Copilot CLI fallbacks.
