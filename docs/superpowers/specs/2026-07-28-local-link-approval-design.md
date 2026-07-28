# Local-link pairing approval — desktop design

Date: 2026-07-28
Branch: `local-link-approval` (worktree `/Users/roman/anytype/anytype-ts_local-link-approval`, based on `origin/develop`)
Heart counterpart: `anytpe-heart-locallink` commit `c57232336` (GO-7395), docs `docs/LocalLinkApprovalDesktopGuide.md` (client contract) and `docs/LocalLinkPairingApproval.md` (design)

## Problem

Heart no longer mints a pairing code when an external app asks for one. It broadcasts
`Event.Account.LinkApprovalRequest` naming the caller, and mints the 4-digit code only when the
desktop client answers with `AccountLocalLinkApproveChallenge(processPath, origin, allow)`.

Today the client does the opposite: `dispatcher.ts` receives `AccountLinkChallenge` (which carried
the code), relays it to the main process, and `WindowManager.createChallenge()` opens an
always-on-top window loading the tracked jQuery page `dist/challenge/index.html`, which displays
four digits and self-closes after 30s. Windows are deduped and dismissed by the code string.

With the new heart, that path receives an event that no longer exists. Until the client implements
approval, **pairing cannot complete at all** — there is no fallback that hands out a code without
user approval.

## Goals

- Show the user who is asking, what access they want, and let them Allow or Deny.
- Mint and display the code only after Allow.
- Dismiss on `Event.Account.LinkApprovalHide`, not on a client-side timer.
- Keep the prompt visible when the app is minimized, hidden, or in the tray.
- Exactly one prompt per request no matter how many app windows/tabs are open.

## Non-goals

- "Always allow" / trusted-app memory. Heart has no durable allow-list; deny-persistence is heart's,
  for the app run only.
- Any change to the external app's side (`POST /v1/auth/challenges`, `POST /v1/auth/api_keys`).
- Local-link pairing in web mode. The browser build has no second window; the mock keeps no-op'ing.
- A "verified publisher" badge. `clientInfo.signatureVerified` is always false today and is ignored.

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Prompt surface | Separate always-on-top window (evolution of today's challenge window) | Visible with the app hidden; one window regardless of window/tab count; main-process dedup already exists |
| Page implementation | New Vite entry in `src/`, React + design system | jQuery is banned in `src/`; the prompt now has buttons, two states, theming and i18n |
| Concurrency | One window at a time, other callers queued FIFO in main | Never stacks always-on-top windows under the cursor mid-decision |
| Deny feedback | Fine print in the prompt, before deciding | The consequence ("blocks this app until Anytype restarts") is visible while choosing; no post-hoc toast |

## Architecture

Three actors:

- **Renderer** — owns the gRPC session (one dispatcher per window/tab, each with its own token).
- **Main process** — owns window lifecycle, request dedup and the queue. Has no gRPC client; it only
  spawns `anytypeHelper`.
- **Approval window** — React page, no gRPC, talks to main over IPC only.

```
heart ──LinkApprovalRequest──▶ every renderer
                                    │  dispatcher: Renderer.send('showLinkApproval', { clientInfo, scope, theme, lang })
                                    ▼
                              main: LinkApprovalManager
                                    │  key = processPath + "\0" + origin   (verbatim)
                                    │  dedup: N renderers report one request → one entry
                                    │  queue: one window on screen at a time
                                    ▼
                              approval window (request state)
                                    │  Electron.send('linkApprovalDecision', { processPath, origin, allow })
                                    ▼
                              main relays to a renderer
                                    │  prefer the webContents that reported it; else most-recently-focused live tab
                                    ▼
                              renderer: C.AccountLocalLinkApproveChallenge(processPath, origin, allow)
                                    │  Renderer.send('linkApprovalResult', { processPath, origin, challenge, error })
                                    ▼
                              main → window: code state (allow) | close + dequeue (deny or error)

heart ──LinkApprovalHide──▶ renderer → main: close matching window or drop from queue, advance queue
```

Rationale: the request event reaches *every* session, so dedup cannot live in a renderer, and the
queue must survive one window closing. Main cannot call the RPC itself, so the decision bounces back
to a renderer — any full-scope session is accepted by heart. An event can only arrive if at least one
renderer is alive, so a relay target always exists at request time; if it dies mid-decision we
retarget, and if none remain we drop the entry and let heart's 60s expiry clean up.

### Identity rendering

Heart's `ClientInfo` gives `processName`, `processPath`, `origin`, `name`, `signatureVerified`.

- Headline: `name`, quoted and explicitly attributed as caller-supplied (`"My Notes Sync" wants to
  connect`). Clamp its length; it is attacker-controlled text.
- Attribution lines: `processName` and `processPath` for native callers; `origin` for browser callers
  (`chrome-extension://<id>`, `http://localhost:3000`). Both may be empty depending on caller type.
- Scope line: `JsonAPI` → full API access, `Limited` → limited access.
- Label fallback chain so the window is never blank: `processName → processPath → origin → name →
  generic "An app"`.
- `signatureVerified` is not rendered.

### Timers

Dismissal is driven by `LinkApprovalHide`. Main keeps backstop timers only — ~90s for a pending
prompt (heart expires at 60s), ~6min for a displayed code (heart expires at 5min) — so a lost event
cannot strand an always-on-top window. This replaces today's authoritative 30s auto-close.

## Components

### API layer (renderer)

- `src/ts/lib/api/command.ts` — add `AccountLocalLinkApproveChallenge(processPath, origin, allow, cb)`.
- `src/ts/lib/api/service.ts` — register `Rpc_Account_LocalLink_ApproveChallenge_Request/Response`.
- `src/ts/lib/api/response.ts` — `AccountLocalLinkApproveChallenge` → `{ challenge }`.
- `src/ts/lib/api/mapper.ts` — replace `AccountLinkChallenge` / `AccountLinkChallengeHide` with
  `AccountLinkApprovalRequest` (→ `{ clientInfo: { processName, processPath, name, origin,
  signatureVerified }, scope }`) and `AccountLinkApprovalHide` (→ `{ clientInfo }`).
- `src/ts/lib/api/dispatcher.ts` (~287, ~334) — the two case arms become `showLinkApproval` /
  `hideLinkApproval`, still carrying `theme` and `lang`.

### Main process

- New `electron/ts/linkApproval.ts` — the manager: `key(processPath, origin)`, `request()`, `hide()`,
  `decide()`, `result()`, FIFO queue, backstop timers, relay-target selection. Kept out of
  `window.ts` (already ~900 lines); it calls `WindowManager` only to open/close its window.
- `electron/ts/window.ts` — `createChallenge` / `closeChallenge` (keyed by code) become
  `createApprovalWindow` / `closeApprovalWindow` (keyed by caller). `AppWindow.isChallenge` /
  `challenge` become `isApproval` / `approvalKey`, including the broadcast-skip checks at
  `window.ts:887` and `api.ts:878`.
- `electron/ts/api.ts` (~610) — `showChallenge` / `hideChallenge` become `showLinkApproval` /
  `hideLinkApproval`; add `linkApprovalResult` from the renderer. `electron/ts/main.ts` gains the
  `linkApprovalDecision` ipc listener used by the approval window.
- `electron/ts/types.ts` — the two `AppWindow` field renames.

### Approval window UI

- New Vite input in `vite.config.ts` (`linkApproval: src/html/linkApproval.html`) emitting to
  `dist/linkApproval/`; entry `src/ts/entry-linkApproval.tsx`, styles `src/scss/linkApproval.scss`.
- Deliberately self-contained: a local `t(key, lang)` helper reading `json/text.json` plus the lang
  JSON, instead of `lib/translate.ts`, which pulls the whole MobX store index into a 424px window.
  Components are deep-imported (`Component/util/button`), not via the barrel index.
- One component, two states: `request` (identity + scope + Allow/Deny + deny fine print) and `code`
  (4 digits, "enter this in <label>"). Theme class comes from the payload; SCSS uses existing design
  tokens so dark mode follows automatically.
- Delete the tracked `dist/challenge/index.html`, gitignore `dist/linkApproval/`, update the two
  `dist/challenge/**/*` globs in `package.json` build config.

### Copy

New keys in `src/json/text.json`: prompt title, caller-supplied-name framing, scope labels, deny fine
print ("Denying blocks this app until Anytype restarts."), code-state title. Retire `challengeTitle`
and `challengeDescription`.

### Web mode

`src/ts/lib/web/electronMock.ts` (~318) keeps no-op'ing the renamed commands with a console warning.

## Error handling and edge cases

- `NO_PENDING_CHALLENGE` (expired, already answered, never existed): close the window, dequeue,
  advance. Nothing surfaced to the user.
- `ACCOUNT_IS_NOT_RUNNING` or transport failure: same dismissal, logged.
- Duplicate decisions: impossible by construction (one window per key; main drops a `decide()` for a
  resolved key). If one slipped through, heart answers the loser with `NO_PENDING_CHALLENGE`.
- Relay renderer dies between click and response: retarget to another live tab and re-issue; if none
  remain, drop the entry and let heart expire it.
- `LinkApprovalHide` for a queued-but-unshown caller: removed from the queue silently.
- `LinkApprovalHide` during the code state: the normal success path *and* the 5-min expiry path —
  both close.
- Byte-exact key matching: `processPath` and `origin` are echoed verbatim, never trimmed, lowercased
  or normalized, on both the RPC and the dedup key.
- Repeat requests from a caller whose prompt already closed are new prompts. The client keeps no
  memory of past decisions; heart owns deny-persistence.

## Testing

Unit (vitest):

- `linkApproval.ts` as a state machine: dedup across N renderer reports; FIFO advance on answer, hide
  and expiry; key matching is byte-exact (a trimmed/lowercased `origin` must not match); relay-target
  reselection when the reporting tab is gone; backstop timers fire only when no hide arrived.
- Mapper round-trip for both events; command/response shape for `AccountLocalLinkApproveChallenge`.

Manual, against the local heart branch:

- Native caller (process path shown) and browser caller via `curl` with an `Origin` header (origin
  shown).
- Deny → subsequent requests silently refused until app restart.
- 60s pending expiry and 5-min code expiry both dismiss the window.
- Two callers racing → second prompt appears after the first is answered.
- Multi-window app → exactly one prompt.

Not covered: the Playwright suite in `../anytype-desktop-suite` drives the main window; an
always-on-top `BrowserWindow` driven by IPC from a Go backend is out of its reach. No E2E coverage is
claimed for this feature.

## Prerequisites

The approval RPC and the new events do not exist in the shipped bindings. `develop` generates them
with ts-proto into `middleware/`, so regenerate from the heart branch:

```
HEART_DIR=/Users/roman/anytype/anytpe-heart-locallink bun run generate:protos
```

That also builds `dist/anytypeHelper` from the same branch, which is what the app must run against.

`scripts/generate-service-registry.js` hardcoded `../anytype-heart` and ignored `HEART_DIR`, so the
registry was silently generated from the wrong checkout; it now honours the same override as
`generate-protos.sh`.

## Notes on test scope

The repo has no jsdom or testing-library, so the approval window component is not render-tested. The
logic worth pinning — which parts of a caller's identity may be shown and in what order, and the name
clamp — lives in `src/ts/lib/linkApproval.ts` and is unit-tested there; the component is thin markup
over it.
