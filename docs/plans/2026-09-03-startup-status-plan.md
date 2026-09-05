# Account start-up status (cold sync transparency) — desktop plan

Status: Stages 0 and 1 implemented on 2026-09-03 (uncommitted; bindings generated from heart branch
`go-7471-cold-sync-events`). Decisions 1–4 and 6 taken as recommended; decision 5 changed after the
first look: no dots, the current line pulses in opacity instead. The login page swaps its key input for
the status block (title "Opening your Vault", Cancel via `AccountStop`). Stage 2 onwards not started.
Middleware side: GO-7471, `../anytype-heart/docs/RecoveryEventsClientIntegration.md`
(design spec: `../anytype-heart/docs/superpowers/specs/2026-09-02-cold-sync-recovery-events-design.md`).

Goal: from the moment `AccountSelect` is called until every space is loaded, the user sees what the
app is doing (phases, retries, channel counts) instead of a silent pulsing bubble, on every app open,
with the most value on a cold recovery (fresh device).

Naming: the product calls spaces **channels** (`commonNewChannel`, `pluralChannel`). All user-facing
text below says "channel"; code, middleware fields and enum names keep "space".

---

## 1. What the middleware gives us

One event, one RPC, both additive:

- `Event.Message.accountRecoveryUpdate` (field 206) → `Account.Recovery.Update { runId, id, timestampMs, oneof payload }`
  with payload kinds `started, phaseChanged, localDiscoveryState, peerDiscovered, dialStarted, peerConnected,
  dialFailed, peerDisconnected, accountFetchStarted, accountFetchError, accountReady, spaceDiscovered,
  spaceStateChanged, finished, snapshot`.
- `Rpc.Account.RecoveryState` → folded `Snapshot` (phase, done, peers[], spaces[], counters, `lastEventId`).
  Lock-free: answers while `AccountSelect` blocks. Returns `ACCOUNT_IS_NOT_RUNNING` before the first run.

Phases: `LookingForPeers → Connecting → FetchingAccount → LoadingSpaces → Done | Failed`, plus a calm
`WaitingForNetwork` overlay (returns to the interrupted phase). Phases can be skipped (warm start:
`Connecting → LoadingSpaces`).

Facts that shape the desktop design (from the spec, not the guide):

| Fact | Consequence for desktop |
|---|---|
| Events are coalesced in 250 ms trailing windows; one `Event` may carry N ordered updates | Apply in order inside the existing batch loop; no extra throttling needed |
| `Started` (id 1) fires a few ms into `AccountSelect`; `AccountReady` always fires before `AccountSelect` returns | The blocking screen sees the whole `LookingForPeers → LoadingSpaces` walk |
| `Finished` arrives after `AccountSelect` returns (needs head-sync + 10 s deferred-space release), and may never arrive when offline | The blocking screen must not wait for it; a post-select surface owns "done" (Stage 2) |
| `WaitingForNetwork` needs 0 open connections + a failed dial + 10 s (or the OS reports offline) | Nothing to derive client-side; bind the label to the phase |
| Space state walk is `Loading → Pulling → Loading → Loaded`, `SpaceDiscovered` can repeat per space (first with empty `spaceViewId`) | Reducer is keyed by `spaceId` and idempotent; never assume monotone space state |
| `spacesTotal` includes the tech space; `Removed` spaces are dropped from counters | Filter `kind = Tech` for user-facing counts |
| No names on the stream; resolve via `spaceViewId` from the SpaceView subscription | On the loader only counts are possible: the spaceview subscription starts after `AccountSelect` (`U.Data.onAuthOnce`) |
| Event sender closes a session whose queue overflows | A slow renderer during a noisy cold sync will disconnect; the reconnect + snapshot re-pull path is core, not an edge case |
| `AccountStop` closes the run without a terminal event; next `AccountSelect` starts a new `runId` | Reset on `runId` change and on logout |
| Field 206 may be renumbered at merge | Harmless: our event dispatch is name-based (`accountRecoveryUpdate`) |
| `debugMessage` is raw error text | Logs/Sentry only, never rendered |

Middleware availability: everything is implemented on heart branch `go-7471-cold-sync-events`
(7 commits on top of `go-7467-quic-degradation-fallback`), not merged into `develop`, not in any tag.
Desktop pins `0.51.0-rc6` (`middleware.version`), which has no recovery surface.

---

## 2. What desktop does today

### 2.1 Three `AccountSelect` call sites, three screens

| Path | Where | What is on screen while the RPC blocks |
|---|---|---|
| Daily app open (stored account) | `src/ts/app.tsx:436` inside `onObtainToken()` | Pre-React `#bubble-loader` (`src/html/index.html:29-33`, z 10001) over the React `#root-loader` (`src/ts/app.tsx:662-669`, z 10000; logo + version hidden behind `.anim.from`). Both stay until the final main route fires `hide()` (`app.tsx:385-393`), i.e. through `WorkspaceOpen` and the space subscriptions. No auth page is mounted. |
| Fallback / fresh device / after onboarding | `src/ts/component/page/auth/setup.tsx:57` | Same pulsing bubble, rendered by React (`setup.tsx:155-177`), no text at all |
| Login with a key | `src/ts/component/page/auth/login.tsx:75` | The login form with a spinner on the submit button (`submitRef.setLoading`) |

Consequence: "the block instead of (...)" needs two mount points to cover every app open: the root
loader in `app.tsx` and the setup page. Login is a third, optional one.

### 2.2 Plumbing facts

- The event stream is open before `AccountSelect` on both real paths: `U.Data.createSession` →
  `dispatcher.startStream()` (`src/ts/lib/util/data.ts:528`). So `Started` (id 1) arrives live; the
  snapshot-on-attach is not needed for the normal flow.
- `dispatcher.reconnect()` (`src/ts/lib/api/dispatcher.ts:156-170`) only re-opens the stream; nothing is
  refetched. There is no "stream re-attached" hook today. We need one for the snapshot re-pull.
- Event type names are derived from the ts-proto field name by capitalising the first letter
  (`src/ts/lib/api/mapper.ts:53-55`): `accountRecoveryUpdate` → `AccountRecoveryUpdate`. A `Mapper.Event.<Type>`
  entry is mandatory; without it the dispatcher silently drops the event (`dispatcher.ts:260-264`).
  Commit `1fe7a9d841` (`P2pStatusUpdate` dropped) is the failure mode to avoid.
- Batches: `flushEvents` sorts by `SORT_IDS` (`dispatcher.ts:247-256`). Unknown types get index -1 and
  `Array.prototype.sort` is stable, so arrival order within a batch is preserved. Verify once in Stage 0.
- RPCs: `command.ts` + `response.ts` (function name must equal the command name) + the generated,
  gitignored registry `src/ts/lib/api/service.ts`. Bindings live in `middleware/` (alias `Proto/*`),
  regenerated by `bun run generate:protos` (`scripts/generate-protos.sh`, `HEART_DIR` override) and by
  `--from-dist` in CI after `update-ci.sh`.
- Store patterns to copy: `S.Auth.syncStatusUpdate` (`src/ts/store/auth.ts:92-108`) for an event-fed
  status object; `S.Progress` (`src/ts/store/progress.ts`) for a list; `PageAuthMigrate`
  (`component/page/auth/migrate.tsx`) is the only existing auth screen driven by live events during a
  blocking RPC.
- Every default export under `src/ts/component/**` is wrapped in `observer()` by `vite.auto-observer.ts`,
  so a component that reads store observables re-renders automatically.
- Unit tests exist (vitest: `src/ts/model/*.test.ts`, `src/ts/lib/reactionScheduler.test.ts`), so a
  reducer can be tested without the app.

---

## 3. Stage 1 UX proposal: the status ticker

### 3.1 Placement

A single component, `RecoveryStatus`, rendered under the bubble in all mount points:

```
                    ┌───────────────┐
                    │               │
                    │    (bubble)   │
                    │               │
                    └───────────────┘

                Looking for peers…              ← oldest, most faded
                Connecting…                     ← faded
                Fetching your account… ●●●      ← current, full colour, live dots
```

- `app.tsx` `#root-loader`: sibling of `.inner`, centred, below the bubble. The bubble is a separate
  fixed element above the root loader, so the block is positioned relative to the viewport centre, the
  same way `#bubble-loader` is.
- `setup.tsx`: inside `<Frame>` below `.bubbleWrapper`. Note `.bubbleWrapper` is `position: absolute`
  centred (`src/scss/page/auth.scss:76-79`), so the block needs its own vertical offset, not flow layout.
- `login.tsx` (optional): under the submit button once `AccountSelect` starts.

### 3.2 Behaviour

- Ring buffer of the last 3 lines, chronological, newest at the bottom (reads like a log tail; the eye
  lands on the brightest, lowest line). Minimum 1 line.
- Fixed height (3 line-heights) reserved from the start so the bubble never jumps when lines appear.
- No scrolling. History is not the point of this surface: a cold sync is a handful of phase lines, and
  the noisy parts (dials, per-space ticks) are folded into in-place updates. Full history stays in the
  middleware debug log (`ANYTYPE_LOG_LEVEL=core.recovery=debug`) and, later, in a "details" disclosure
  (Stage 3). A scrolling log on the auth screen would read as a terminal, which is the opposite of the
  screen's tone.
- Two kinds of ticker mutation:
  - **push**: a new line enters at the bottom, older lines shift up one fade step, the fourth is removed.
  - **update in place**: the current line's text changes (attempt counters, channel counts) without
    pushing. This is what keeps the ticker from scrolling.
- The current line carries a live indicator (reuse the existing three-dot animation:
  `@keyframes typingDot` in `auth.scss:65-68`, `TypingDots` in `page/auth/explainerScene.tsx:48-58`)
  while the run is active and the phase is not `Failed`.
- Enter/exit animation with `motion/react` `AnimatePresence` + `U.Common.animationProps()`
  (`src/ts/lib/util/common.ts:808-820`), the in-repo idiom (`page/main/void.tsx`, `explainerScene.tsx`).
  Do not use the `.animation` class mechanism: `setup.tsx` calls `Animation.to()` on every render and
  would re-trigger it on every status change.
- Fade ramp from existing tokens, to be confirmed by design: current line `--color-text-primary`,
  previous `--color-text-secondary`, oldest `--color-text-tertiary`. Size `@include text-common` or
  `text-small` (design call). No new colour values.
- `Failed`: the ticker freezes on its last line, the dots stop; the existing `Error` + Back button on
  `setup.tsx` remain the error surface. The `AccountSelect` error is authoritative, as the guide says.

### 3.3 Which updates become lines

| Update | Ticker effect | Text |
|---|---|---|
| `started` | reset; push the initial phase line. Optional (decision 4): if `mode = ColdRecovery`, push a framing line first | "Restoring your account on this device…" |
| `phaseChanged` | push. `WaitingForNetwork`: push with a hint from `error.class`. Leaving the overlay (`fromPhase = WaitingForNetwork`): push the resumed phase again | see 3.4 |
| `accountFetchStarted`, `attempt > 1` | update in place | "Fetching your account… attempt 3" |
| `accountFetchError` | ignore in the ticker (the next `accountFetchStarted` shows the attempt); log `debugMessage` | — |
| `accountReady` | ignore (`LoadingSpaces` follows immediately) | — |
| `spaceDiscovered`, `spaceStateChanged` | update the "Loading channels" line in place with loaded / total, excluding `Tech` and `Removed` | "Loading channels… 3 of 7" |
| `finished` | push `viewsConfirmed ? "All your channels are here" : "Ready"`. Rarely seen on the loader; Stage 2 owns it | |
| `snapshot` (re-attach, gap) | rebuild the ticker from the folded state: one headline line (+ counts). History cannot be reconstructed and that is fine | |
| peer updates, `localDiscoveryState` | folded into state, not shown in Stage 1 (Stage 3 material) | — |
| unknown payload / enum value | ignore; keep the previous label | — |

### 3.4 Wording (keys in `src/json/text.json`, prefix `recoveryStatus`)

| Phase / case | Key | Text |
|---|---|---|
| LookingForPeers | `recoveryStatusLookingForPeers` | Looking for peers… |
| LookingForPeers, local-only network mode | `recoveryStatusLookingForPeersLocal` | Local-only mode, looking for devices on your network… |
| Connecting | `recoveryStatusConnecting` | Connecting… |
| FetchingAccount | `recoveryStatusFetchingAccount` | Fetching your account… |
| FetchingAccount, attempt n | `recoveryStatusFetchingAccountAttempt` | Fetching your account… attempt %s |
| LoadingSpaces | `recoveryStatusLoadingChannels` | Loading channels… |
| LoadingSpaces with counts | `recoveryStatusLoadingChannelsCount` | Loading channels… %s of %s |
| WaitingForNetwork + NoNetwork | `recoveryStatusWaitingNoNetwork` | Waiting for network… no internet connection |
| WaitingForNetwork + PeerUnreachable | `recoveryStatusWaitingPeerUnreachable` | Waiting for network… nodes are unreachable, retrying |
| WaitingForNetwork + IncompatibleVersion | `recoveryStatusWaitingIncompatible` | Waiting for network… an app update is required |
| WaitingForNetwork, other | `recoveryStatusWaiting` | Waiting for network… |
| Cold-recovery framing (optional) | `recoveryStatusColdStart` | Restoring your account on this device… |
| Done, `viewsConfirmed` | `recoveryStatusDoneConfirmed` | All your channels are here |
| Done, not confirmed | `recoveryStatusDone` | Ready |

Never: percentages, ETAs, `debugMessage`. Counts and attempts are allowed (spec: "activity and counts,
never a fake bar").

As implemented: keys carry no ellipsis; the component appends "..." to the current line only when
that line describes something in progress, counts and attempts sit in parentheses, and the loader
screens without a header (the boot loader and setup) show the auth header's own 70x18 wordmark in the
same spot (`.recoveryLogo`; login keeps the header's). `RecoveryStatus` owns the rest and wraps it
around the bubble from the viewport centre, the same on every screen: the bubble 70px above the
centre (where the sign-in screen keeps its bubble), `recoveryStatusTitle` ("Opening your Vault")
48px above the bubble, the lines 48px below it, Cancel under them. The lines form a drum seen from
the bubble: all one size (18px), the current one on the front edge right under the bubble at full
strength, each previous one stepping back downwards in even opacity stops (1 → 0.6 → 0.3), all in the
primary text colour. The current line pulses between 1 and 0.8, so at its faintest it still sits
above the line behind it. Inside the main UI (the loading void) the block stacks in the page flow.

LAN layer (heart phase 7, `LocalPeersStateChanged` + `PeerSpaceExchange`): the headline binds to
`LocalPeersStateChanged` and pushes a `LocalPeers` ticker line per state change (`NoLocalPeers`
renders nothing, a repeated state is not news, unknown values keep the previous state):

| `LocalPeersState` | Key | Text |
|---|---|---|
| Connecting | `recoveryStatusLocalPeersConnecting` | Found a device with Anytype on your network, connecting… |
| Unreachable | `recoveryStatusLocalPeersUnreachable` | Couldn't reach devices on your network |
| AccountNotFound | `recoveryStatusLocalPeersAccountNotFound` | No device on your network has your account, looking elsewhere… |
| AccountFound | `recoveryStatusLocalPeersAccountFound` | Connected to your device that has your account |

`PeerSpaceExchange` only updates the peer's `exchanged` / `hasAccountSpace` / `sharedSpaceCount`
for the detail view. `AccountFound` deliberately survives an idle connection close. Heart phase 8
made the snapshot RPC total: an empty `runId` (phase `NotStarted`) means no run and renders nothing;
`NotStarted` is never a ticker line.

### 3.5 What it looks like over time

Cold recovery, first open on a new laptop:

```
0.0 s   Looking for peers… ●●●
0.4 s   Looking for peers…
        Connecting… ●●●
1.2 s   Looking for peers…
        Connecting…
        Fetching your account… ●●●
9 s     (in place)             Fetching your account… attempt 2 ●●●
14 s    Connecting…                       ← oldest line dropped
        Fetching your account… attempt 2
        Loading channels… 0 of 7 ●●●
15 s    AccountSelect returns as soon as the tech space is loaded; the main UI with the vault
        sidebar opens and the remaining channels keep loading there (Stage 2)
```

Warm start: `Connecting… → Loading channels… 3 of 3` in about a second; the ticker barely registers.
Offline: after 10 s the current line becomes `Waiting for network… no internet connection ●●●` and stays
calm; when a node connects the interrupted phase line is pushed again.

### 3.6 Design questions to settle (Design label → design review)

1. Line count (3), order (newest at bottom), fixed height.
2. Colour ramp and text size (tokens above), spacing under the bubble.
3. Live indicator: three dots after the current line, or the shimmer used by `progressText.scss`.
4. Minimum time a line stays on screen (a warm start can push two lines in 300 ms; a 400 ms floor
   avoids flicker but delays the truth slightly).
5. Whether the ticker fades out with the bubble on the daily-open path or is simply removed with the
   root loader.

---

## 4. Architecture

### 4.1 Data flow

```
ListenSessionEvents ──► dispatcher.event()
                           └─ Mapper.Event.AccountRecoveryUpdate ──► S.Recovery.apply(update)
Rpc.Account.RecoveryState ─► C.AccountRecoveryState ──► S.Recovery.applySnapshot(snapshot)
                                                              │
                              RecoveryStatus (observer) ◄─────┘  reads phase / done / lines / counts
```

### 4.2 Files

| Area | File | Change |
|---|---|---|
| Bindings | `middleware/**`, `src/ts/lib/api/service.ts` | regenerated, not committed |
| Interfaces | `src/ts/interface/recovery.ts`, `src/ts/interface/index.ts` | new: enums mirroring the proto (`RecoveryPhase`, `RecoveryMode`, `RecoveryErrorClass`, `RecoverySpaceState`, `RecoverySpaceKind`, `RecoveryPeerKind`, `RecoveryDiscoveryState`), `RecoveryPeer`, `RecoverySpace`, `RecoveryUpdate`, `RecoveryLine` |
| Mapper | `src/ts/lib/api/mapper.ts` | `Mapper.Event.AccountRecoveryUpdate` (next to `AccountConfigUpdate`, ~line 1385): `{ runId, id, timestampMs, type: <payload key>, data }`; `Mapper.From.RecoverySnapshot`, `RecoveryPeer`, `RecoverySpace`, `RecoveryError` |
| Dispatcher | `src/ts/lib/api/dispatcher.ts` | `case 'AccountRecoveryUpdate': S.Recovery.apply(mapped)` near the other `Account*` cases (~line 285); add the type to the `syncEvents` logging bucket (~line 1894); call `S.Recovery.pull()` when a stream attaches, including reconnects |
| Command / response | `src/ts/lib/api/command.ts` (`C.AccountRecoveryState`, copy `AccountRecover` at :162), `src/ts/lib/api/response.ts` (`AccountRecoveryState`) | new |
| Store | `src/ts/store/recovery.ts`, `src/ts/store/index.ts` | new `S.Recovery` |
| Store reset | `src/ts/store/auth.ts` `clearAll()` / `logout()` | call `S.Recovery.reset()` |
| Component | `src/ts/component/util/recoveryStatus.tsx`, `recoveryStatus.stories.tsx`, `src/ts/component/index.ts` | new |
| Styles | `src/scss/component/recoveryStatus.scss` (+ placement rules in `src/scss/page/auth.scss` `.pageAuthSetup` and `src/scss/common.scss` `#root-loader`) | new |
| Mounts | `src/ts/app.tsx` (`#root-loader`), `src/ts/component/page/auth/setup.tsx`, optionally `login.tsx` | edit |
| Text | `src/json/text.json` | `recoveryStatus*` keys |
| Telemetry | `src/ts/lib/analytics.ts` (`KEYS` allowlist), `U.Perf` marks | Stage 4 |
| Tests | `src/ts/store/recovery.test.ts` | new |

### 4.3 `S.Recovery` fold

Mirror the middleware fold so the snapshot and the live stream produce the same state.

```ts
class RecoveryStore {
	runId = '';
	lastId = 0;
	mode: I.RecoveryMode;
	phase: I.RecoveryPhase;          // observable
	phaseStartedAt = 0;
	error: I.RecoveryError;          // account-level only
	done = false;                    // observable
	viewsConfirmed = false;
	accountReady = false;
	accountFetchAttempt = 0;
	accountFetchError: I.RecoveryError;
	discovery: I.RecoveryDiscoveryState;
	peers = new Map<string, I.RecoveryPeer>();      // observable.map, used by Stage 3
	spaces = new Map<string, I.RecoverySpace>();    // observable.map, used by Stage 2/3
	spacesTotal = 0; spacesLoaded = 0; spacesFailed = 0;   // observable
	lines: I.RecoveryLine[] = [];    // observable, max 3, the ticker

	apply(update)         // gating + fold + ticker rule (3.3)
	applySnapshot(snap)   // replace state, rebuild ticker
	pull()                // C.AccountRecoveryState with in-flight guard
	reset(runId?)
	// derived: userSpaces (kind != Tech && state != Removed), userSpacesLoaded, headline
}
```

Gating, exactly as the guide's pseudocode plus the buffering the guide leaves implicit:

```
apply(u):
	if (isPulling)                → buffer.push(u); return
	if (u.runId != runId)         → reset(u.runId)
	if (u.type == 'snapshot')     → applySnapshot(u.data); return
	if (u.id == lastId + 1)       → fold(u); lastId = u.id
	else if (u.id > lastId + 1)   → pull()          // gap
	else                          → ignore           // duplicate after a re-pull

pull():
	isPulling = true
	C.AccountRecoveryState(msg => {
		isPulling = false
		if (!msg.error.code)                          applySnapshot(msg.snapshot)
		else if (code == ACCOUNT_IS_NOT_RUNNING)      reset()          // no run yet, wait for Started
		// any other error (old middleware, unknown method): keep current state
		drain buffer: drop entries with a different runId than the snapshot, apply those with id > lastId
	})
```

Pull triggers:

1. Stream re-attach mid-run (hook in `dispatcher.startStream()`, only when `S.Recovery.runId` is
   already set). The first attach happens before `AccountSelect`, when the live `Started` event is
   still ahead, so it does not pull: a warm start costs the middleware no snapshot. If an update
   arrives while a pull is in flight it is buffered and drained, which is why the error branch must
   drain too.
2. Gaps in the id sequence.

As implemented, the block on the root loader and the setup page (the paths with a stored account)
is hidden for the first 5 s after mount (`J.Constant.delay.recoveryStatus`): a warm start is over
before that and shows only the bubble. When the delay is up the block appears only if no channel
has loaded yet; with one loaded the main app is at most one `WorkspaceOpen` away and the vault's
progress block takes over, so nothing flashes on the loader. The login page shows it at once.
The snapshot RPC is spared on the middleware's behalf in two ways: the first attach, before the run
begins, never pulls (the live `Started` is still ahead), and a re-attach or an id gap pulls only
while `S.Recovery.isRecoveryNeeded()` — that is, while the run is live (`!done` and not `Failed`).
Once the run is terminal a gap is folded instead, since a snapshot could not say anything new.
The gate is deliberately liveness and not "every known channel is loaded": a dropped batch is
exactly the case where the known set is wrong, and the middleware documents the RPC as cheap.

Reset triggers: `runId` change (new run), `S.Auth.clearAll()` / `logout()` (so the next login screen does
not show a stale ticker).

Details to verify in Stage 0:

- ts-proto int64 representation for `id`, `timestampMs`, `durationMs` (check the `forceLong` flag in
  `scripts/generate-protos.sh`; coerce with `Number()` in the mapper either way).
- Unknown enum values: keep the previous phase label; unknown payload kinds: `Mapper.Event` returns a
  `type` we do not handle, `apply` still advances `lastId` (a skipped id is not a gap).
- Batch ordering (2.2).

### 4.4 Bindings and merge order

- Local development now: check out `go-7471-cold-sync-events` in `../anytype-heart`, then
  `bun run generate:protos` (uses `HEART_DIR=../anytype-heart` by default and rebuilds the dev JS binary
  via `make install-dev-js`). Nothing generated is committed.
- CI regenerates from the release tarball pinned by `middleware.version`, so the desktop PR can only
  merge after the heart branch lands in `develop` and ships in an rc, followed by the usual
  `middleware.version` bump. On an older middleware the event simply never arrives, but
  `C.AccountRecoveryState` would hit a missing registry entry; the store tolerates the error, yet the
  clean rule is: heart first, then desktop.
- Field renumbering at merge does not affect desktop (name-based dispatch).

---

## 5. Stages

### Stage 0 — Plumbing and fold (no UI). ~1.5–2 days

- Regenerate bindings against the heart branch; confirm `Event_Account_Recovery_Update` and
  `Rpc_Account_RecoveryState_*` appear in `middleware/pb/protos/*.ts` and `service.ts`.
- Interfaces, mapper, dispatcher case, command, response, `S.Recovery` with fold + gating + pull +
  buffering + reset, `startStream` attach hook.
- `recovery.test.ts` with fixture sequences (see §6).
- Verify end to end with the debug log: `ANYTYPE_LOG_LEVEL=core.recovery=debug` on the middleware and
  `flagsMw.sync` logging on the client; the ids in both logs must match.
- Docs: `/update-docs` for `lib/api`, `store`, `interface`.

Exit: `S.Recovery` mirrors the middleware snapshot at every point of a warm and a cold start, and a
forced reconnect mid-run recovers via the snapshot.

### Stage 1 — Status ticker on the blocking screens. ~2–3 days + design

- `RecoveryStatus` component, SCSS, stories (cold, warm, waiting-for-network, failed, snapshot-only).
- Mount in `#root-loader` and `setup.tsx`; decide on `login.tsx`.
- Text keys (§3.4); pass wording by product.
- Design task in Linear (Design label): §3.6 decisions; implement to the spec, no invented values.
- `/dark-mode-check`, `/qa-engineer` (smoke: the block is visible during account select on the login
  flow; exact phases cannot be asserted in E2E).

Exit: every app open shows live phase lines instead of a silent bubble; a cold start shows attempts and
channel counts; `Failed` hands over to the existing error UI untouched.

### Stage 2 — After `AccountSelect` returns: the vault sidebar. ~2–3 days

Vault block implemented (2026-09-03): `RecoveryProgress` sits at the top of the vault, above the
filter, while the run is active: spinner, "Loading channels x of N" from the run's per-space
states, and a quiet info button that opens the `recoveryPeers` menu: connected peers as three
counts, local peers (only the ones whose space exchange answered with your account or any shared
channel; a nearby device without your channels is left out), file nodes and sync nodes (`tree`),
the node rows split by transport as "N (QUIC) / M (TCP)" with an empty transport left out and other
node types ignored, plus "Copy debug info". In the icons-only vault it collapses to the
spinner with the count as tooltip. The loader screens carry the same "Copy debug info" link under
Cancel; the dump (`S.Recovery.getDebugInfo()`) is the folded state, the last snapshot applied and
every update received, bounded to the last 2000. It is user-copied, so the mapper drops peer
`addr`/`addrs` and scrubs IP and multiaddr literals out of every `debugMessage` (transport errors
quote the endpoint they failed on); ids, counts and phases stay.

Done first (2026-09-03), because a cold sync ran straight into it: `WorkspaceOpen` answers
`FAILED_TO_LOAD` (100, "space is not ready") after its own 10 s wait when the preferred channel is
still being pulled, and the old fallback then declared the account empty ("You're all out of
channels"), a void that also hides the vault by design. The flow now:

- The stored `spaceId` (an account-scoped key) is cleared on logout and again on a fresh login by
  key, for the case the logout was not clean; the login passes no preferred space, so the
  middleware's own priority decides.
- The preferred channel gets one `WorkspaceOpen` attempt (the middleware's 10 s wait), no retry loop.
- A channel that answers with an error is counted (`U.Space.openErrorAdd`) and stops being picked
  automatically after two attempts — without that, two unopenable channels select each other in
  turn forever, and with a hard ban after one attempt a channel that was merely "not ready" would
  stay unopenable for the session. An explicit click always goes through `switchSpace` and still
  reports its error. `WorkspaceOpen` code 100 no longer logs or raises an analytics exception
  (`SKIP_ERROR_CODES` in the dispatcher): it is the expected answer here, not a fault.
- If the preferred one is not ready, the first channel the run reports `Loaded` opens instead
  (`U.Space.canAutoOpen` = ready and not previously failed; `isReady` trusts the run's per-space
  state only while the run is live, and the spaceview's local status once it is over), and the
  preferred one shows up in the vault when it lands.
- With nothing ready yet, `U.Space.openFirstSpaceOrVoid` goes to `/main/void/loading` (the ticker
  inside the main UI, vault visible), which opens the first channel that becomes ready, preferring
  the stored one, and shows the empty state only once the run ends with nothing to open. That page
  attempts each candidate once: it is an observer whose list is rebuilt on every render, so without
  the guard every recovery event would issue another `WorkspaceOpen`.
- Cancel disappears from the status block once `AccountSelect` has returned on any of the three
  screens: stopping the account from there would strand a boot already under way, with the pending
  `switchSpace` routing into the main UI on a logged-out store.

`AccountSelect` returns as soon as the tech space is loaded (`AccountReady`), so on a cold recovery the
main UI with the vault sidebar is up while most channels are still `Queued/Pulling/Loading`. The list
of channels is exactly where the user is looking, so the run's progress lives there:

- Vault sidebar (`src/ts/component/sidebar/page/vault.tsx`, styles `src/scss/component/sidebar/page/vault.scss`):
  a slim status row under the list of channels while `!S.Recovery.done`: "Loading channels… 5 of 7"
  with the live dots, or "Waiting for network…" under the overlay. Placement: pinned between the
  virtualised list (`#body`) and the footer strip (settings / create), so it is visible regardless of
  scroll position and stays out of the dnd-kit sortable list. In the minimal (icons-only) vault mode the
  row collapses to a small spinner with the same text as a tooltip. Hidden as soon as `done` is true or
  no user channels are pending.
- Per-channel state in the same list: channels that are still `Pulling/Loading` get a subtle loading
  treatment on their row (resolve the row via `U.Space.getSpaceviewBySpaceId(spaceId)`,
  `src/ts/lib/util/space.ts:358`, or by `spaceViewId`); `Error` rows get a quiet marker with the
  error class as tooltip. New channels appear in the list through the spaceview subscription as they
  always did; the recovery stream only decorates them.
- Sync status panel (`src/ts/component/menu/syncStatus.tsx`, `menu/syncStatus/info.tsx`): add a
  "Start-up" row while the run is not done (headline + counts), and put the header `Sync` pill into its
  `syncing` animation for the same period (`src/ts/component/util/sync.tsx`).
- `finished`: a toast (`Preview.toastShow`, `src/ts/lib/preview.ts:257`) only when the run finished after
  the loader was hidden and the mode was `ColdRecovery`: "All your channels are here. Objects inside
  them may still be syncing." when `viewsConfirmed`, otherwise the softer "Your account is ready."
  A warm start finishing is not worth a toast.
- Void page (`page/main/void.tsx`, "No channels opened…"): only reachable when the account has no
  preferred channel; if it shows during a run, suppress the empty-state copy and let the vault row speak.
  Small item, not a surface of its own.

### Stage 3 — Details on demand. ~3–5 days

- "Show details" disclosure under the ticker (loader and setup page) and in the sync panel:
  peers (kind, node types, open connections, last error class, local discovery state) and spaces
  (name via `spaceViewId` when the spaceview subscription exists, state, attempt, error class).
- Rich hints the spec calls out: "reached the coordinator but the tree node is unreachable" from
  `nodeTypes` while the headline stays `Connecting`; "found a device nearby" for `LocalPeer`.
- Channel names on the loader are impossible (the spaceview subscription starts after
  `AccountSelect`); show counts there, names in the vault sidebar and the sync panel.

### Stage 4 — Telemetry and diagnostics. ~1 day

- `analytics.event('AccountRecoveryFinished', { type: mode, status: viewsConfirmed, count: spacesTotal, middleTime: totalDurationMs })`;
  any new key must be added to the `KEYS` allowlist (`src/ts/lib/analytics.ts:4-11`).
- Per-phase `U.Perf.step('boot:recovery:<phase>', 'boot:init')` marks from `phaseChanged.previousPhaseDurationMs`.
- Sentry breadcrumbs with `error.class` and `debugMessage` on `Failed`, `AccountFetchError`, space `Error`.
- Debug menu action "Copy start-up snapshot" (JSON of the fold) for support tickets.

Stages 0 and 1 are the first milestone. Stage 2 is the second because it closes the cold-recovery
"empty app" confusion; Stage 3 is the nice-to-have; Stage 4 can ride along with any of them.

---

## 6. Testing

- **Reducer (vitest)** `src/ts/store/recovery.test.ts`, fixtures as update arrays:
  warm start; cold start with retries; `WaitingForNetwork` overlay in and out; gap → pull → drain
  buffer (including `Started` arriving during a pull that errors with `ACCOUNT_IS_NOT_RUNNING`); new
  `runId` mid-stream; duplicate ids after a re-pull; unknown payload kind and unknown enum value;
  `SpaceDiscovered` twice for one space; `Removed` and `Tech` excluded from counts; in-place ticker
  updates vs pushes; snapshot rebuild yields exactly one line.
- **Fixtures from reality**: the spec admits no real cold-recovery log was ever captured. Capture one
  on desktop with `ANYTYPE_LOG_LEVEL=core.recovery=debug` and the client `sync` log flag, on a
  multi-space account with a fresh data path, and turn it into the fixture. This is also the first
  real feedback the heart team gets on coalescing.
- **Storybook**: stories seed `S.Recovery` directly (pattern: `sidebar/progress.stories.tsx`).
- **Manual matrix**: warm start; cold start; cold start with Wi-Fi off for 15 s then on
  (`WaitingForNetwork` → resume); app killed mid-recovery then reopened (new `runId`); DevTools
  throttled to force a session drop and reconnect.
- **E2E** (`/qa-engineer`): smoke only, the network is not deterministic.

---

## 7. Risks

| Risk | Mitigation |
|---|---|
| Middleware not merged / released; schedule coupling | Develop against the branch now; merge desktop after the rc; keep the PR small |
| Session queue overflow disconnects the renderer mid cold sync | Stage 0 reconnect + pull + buffer path with a test |
| `Finished` never arrives offline | No UI waits for it; Stage 2 indicator hides on `done` or stays calm under `WaitingForNetwork` |
| Wording drift between platforms (iOS/Android integrate the same stream) | Share §3.4 with mobile before it lands in `text.json` |
| Ticker flicker on warm starts | Design decision 4 (minimum line dwell) |
| int64 typing in generated bindings | Verified in Stage 0, coerced in the mapper |
| `app.tsx:494` reads `tab.token` but the main process returns `{ id, data }`; the branch is dead today | If it is ever fixed, that path would call `AccountSelect` without a stream. The attach-time pull makes the snapshot authoritative anyway; note it in the PR |

---

## 8. Decisions needed before starting

1. Ticker: 3 lines, chronological, newest at the bottom, fixed height. (Recommended: yes.)
2. No scrolling; history via Stage 3 details and the debug log. (Recommended: yes.)
3. Lines = phases + retry attempts + channel counts, with in-place updates; peers stay out of Stage 1.
   (Recommended: yes. Alternative: phases only, which leaves a cold sync silent for long stretches.)
4. Cold-recovery framing line "Restoring your account on this device…" as the first line when
   `mode = ColdRecovery`. (Recommended: yes, it sets the expectation that this open will take longer.)
5. Live dots on the current line. (Recommended: yes, reuse the existing typing-dots animation.)
6. Login page: mount the ticker under the button, or keep the spinner. (Recommended: mount; it is the
   same component and the fresh-device login is exactly the cold case.)
7. Stage order after Stage 1: Stage 2 (vault row + per-channel state + sync panel + toast) before
   Stage 3. (Recommended.)
9. Vault row placement: pinned above the footer strip (recommended) versus an extra non-sortable row
   after the last channel inside the virtualised list.
8. Open a Linear issue per stage now, with a Design-labelled sub-issue for §3.6.
