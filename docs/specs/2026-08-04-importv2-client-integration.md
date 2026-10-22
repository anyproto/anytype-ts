# Import V2 — Client Integration Spec (anytype-ts)

**Date:** 2026-08-04
**Branch:** `importv2-client-integration` (worktree `../anytype-ts_importv2-client`, off `origin/develop` @ `775df05cc2`)
**Source of truth:** `../anytype-heart_importv2-notion/docs/ImportV2ClientIntegration.md`
**Middleware branch:** `anytype-heart_importv2-notion` (protos with the new fields live there)

## 1. Context

The middleware rewrote the import engine (Markdown, Obsidian, Notion) behind the existing
`ObjectImport` RPC. The RPC surface is unchanged; three additive fields are new:

1. `NotificationImport.reportObjectId` + `.issuesCount` — in-space **import report page**.
2. `EventImportFinish.reportObjectId` + `.issuesCount` — same, on the completion event.
3. `Rpc.Object.Import.Request.aiParams` (field 16) — opt-in BYOK LLM structure enrichment,
   reusing `Rpc.AI.ProviderConfig`.

Key behavioral change: **a successful import can still have issues** (`errorCode = NULL`,
`issuesCount > 0`). v1 made partial data loss invisible; v2 reports it on a real page object.

The client must keep working against **both engines** (v1/v2 selection is a middleware-side flag):
all new fields arrive empty from v1 and the code must treat empty as "not present".

### Client work, per the integration guide (§10)

| # | Item | Status on develop |
|---|---|---|
| 1 | Keep working with no changes | ✔ already true (API-compatible) |
| 2 | Read `reportObjectId`/`issuesCount`, show "Imported with N issues" + link | **to do — Phase 1** |
| 3 | Tolerate `progress.total` increasing mid-run | ✔ verified, no change needed (§6.1) |
| 4 | Ignore deprecated `Rpc.Object.Import.Response` fields | ✔ already true (no response mapper exists) |
| 5 | AI settings UI + send `aiParams` | **to do — Phase 2** |
| 6 | Keep sending `type = Obsidian` for explicit Obsidian imports | ✔ already true (`obsidian.tsx:12`) |

## 2. Current state (develop @ 775df05cc2)

- **Command:** `C.ObjectImport` at `src/ts/lib/api/command.ts:1250-1302`. Notion sends
  `notionParams: { apiKey }`; Markdown sends `markdownParams: { path, createDirectoryPages: true }`;
  Obsidian additionally sends `includePropertiesAsBlock: true`. No `aiParams` anywhere.
- **Call sites:** `Action.import()` at `src/ts/lib/action.ts:550-579` (file dialog → toast →
  `C.ObjectImport`), and the Notion warning page
  `src/ts/component/page/main/settings/import/notion/warning.tsx:10`.
- **Finish event:** mapped at `src/ts/lib/api/mapper.ts:1826-1832`
  (`collectionId`, `count`, `type`); handler at `src/ts/lib/api/dispatcher.ts:1120-1129` does
  analytics only — no navigation, no store write.
- **Notification:** payload mapped at `mapper.ts:531-548` (`processId`, `errorCode`, `spaceId`,
  `name`, `importType`); interface `I.NotificationPayloadImport` at
  `src/ts/interface/notification.ts:37-43`; text composed in
  `src/ts/model/notification.ts:32-88`; rendered by `src/ts/component/notification/index.tsx`
  (only button today: `spaceSwitch`, shown when `!errorCode && spaceId != space`).
- **Progress:** `ProcessNew/Update/Done` at `dispatcher.ts:1467-1500` → `S.Progress`
  (`src/ts/store/progress.ts`) → `src/ts/component/sidebar/progress.tsx`. Percentage is
  recomputed from store values on every render; `total` is overwritten on each update.
  `progress.message` is mapped (`mapper.ts:698`) but dropped — not in `I.Progress`, not rendered.
- **AI precedent:** none. `Rpc.AI.ProviderConfig` exists in the generated bindings
  (`middleware/pb/protos/commands.ts:5609-5615`) but has zero client-side producers.
- **Bindings:** generated via `scripts/generate-protos.sh` (`bun run generate:protos`) from
  `../anytype-heart`. Current `middleware/pb/protos/commands.ts` has **no** `aiParams` on
  `Rpc_Object_Import_Request`, and events/models lack `reportObjectId`/`issuesCount`.

## 3. Goals / non-goals

**Goals**

1. Surface the import report: "Imported with N issues" notification variant + a button that opens
   the report page (switching space first if needed).
2. Ship the AI enrichment settings UI and send `aiParams` on Notion / Markdown / Obsidian imports.
3. Offer an optional **"Provided by Anytype"** provider — an Anytype-operated proxy to an
   OpenAI-compatible API — whose endpoint/model/token are embedded at build time and whose
   presence in the UI is gated on those constants being set (§6.3).
4. Make the data disclosure explicit in the UI: what leaves the device with and without content
   samples, and to whom (§6.5).
5. Stay fully compatible with v1 responses (empty new fields) — no behavior change when fields are
   absent.

**Non-goals**

- Rendering a progress phase label (`progress.message`) — the middleware has no dedicated AI phase
  yet (guide §11); tracked as a follow-up, not in this branch.
- A "test connection" RPC for the AI endpoint — does not exist middleware-side.
- Reworking post-import navigation (`U.Space.openDashboard()` at call time stays as is; see §5.3).
- The `Rpc.AI.*` writing-tools family — stubbed middleware-side, unrelated.
- CSV/HTML/TXT/PB imports — stay on v1, untouched.

## 4. Phase 0 — protobuf regeneration (prerequisite)

Regenerate bindings from the middleware feature branch:

```bash
./scripts/generate-protos.sh   # pointed at ../anytype-heart_importv2-notion
```

Expected diff in `middleware/pb/protos/`:

- `commands.ts`: `Rpc_Object_Import_Request.aiParams` (+ nested `AIParams { config, includeContentSamples }`).
- `events.ts`: `Event_Import_Finish.reportObjectId`, `.issuesCount`.
- `models.ts`: `NotificationImport.reportObjectId`, `.issuesCount`.

**This is a hard prerequisite for Phase 2**: `service.ts:392` encodes requests with ts-proto
`fromPartial`, which **silently drops unknown keys**. Sending `aiParams` before regeneration would
be a no-op with no error. Phase 1 reads are safe either way (missing fields decode as
empty/zero), but land regeneration first regardless.

Sanity check after regen: `bun run typecheck` and one v1 import (any format) still round-trips.

## 5. Phase 1 — import report surfacing

### 5.1 Mapper + interface

- `mapper.ts` `Notification` import branch (`:540-542`): add
  `reportObjectId: obj.reportObjectId`, `issuesCount: obj.issuesCount`.
- `mapper.ts` `ImportFinish` (`:1826-1832`): add the same two fields.
- `src/ts/interface/notification.ts:37-43`: extend `NotificationPayloadImport` with
  `reportObjectId: string; issuesCount: number;`.

### 5.2 Notification text — `src/ts/model/notification.ts`

The Import branch of `fillContent()` (`:44-50`) gains the "success with issues" case. Decision
table (mirrors guide §5):

| `errorCode` | `issuesCount` | Title | Text |
|---|---|---|---|
| NULL | 0 | `notificationImportSuccessTitle` (unchanged) | `notificationImportSuccessText` (unchanged) |
| NULL | > 0 | `notificationImportSuccessTitle` | **new** `notificationImportSuccessIssuesText`, sprintf'd with count + plural |
| ≠ NULL | any | `commonError` / `notificationImportErrorText{code}` (unchanged) | unchanged |

Sketch (uses the codebase plural pattern `U.Common.plural(cnt, translate('plural…'))`):

```ts
case I.NotificationType.Import: {
	const { issuesCount } = this.payload;

	if (Object.values(J.Error.Code.Import).includes(errorCode)) {
		this.title = translate('commonError');
		this.text = translate(`notificationImportErrorText${errorCode}`);
	} else
	if (issuesCount) {
		this.text = U.String.sprintf(translate('notificationImportSuccessIssuesText'), issuesCount, U.Common.plural(issuesCount, translate('pluralIssue')));
	};
	break;
};
```

New keys in `src/json/text.json` (next to the existing `notificationImport*` cluster, ~line 2881):

- `"notificationImportSuccessIssuesText": "Your files were imported with %s %s"`
- `"pluralIssue": "issue|issues"` (in the plural cluster, ~line 297)
- `"notificationButtonImportReport": "View report"`

### 5.3 Notification button — `src/ts/component/notification/index.tsx`

Add a `report` button to the `Import` case whenever `payload.reportObjectId` is non-empty —
**including on errors** (guide §5: error + report id → show error message + link to report).
Existing `spaceSwitch` logic stays as is for the no-report success path.

```ts
case I.NotificationType.Import: {
	if (payload.reportObjectId) {
		buttons = buttons.concat([
			{ id: 'report', text: translate('notificationButtonImportReport') }
		]);
	} else
	if (!errorCode && (spaceId != space)) {
		buttons = buttons.concat([
			{ id: 'spaceSwitch', text: translate('notificationButtonSpaceSwitch') }
		]);
	};
	break;
};
```

(Keep `Gallery` on the current `spaceSwitch`-only behavior — split the shared `case` accordingly.)

`onButton` handler for `report`:

- Same space (`payload.spaceId == S.Common.space`): `U.Object.openAuto({ id: payload.reportObjectId, layout: I.ObjectLayout.Page })`.
- Different space: `U.Router.switchSpace(payload.spaceId, route, true, {}, false)` where `route` is
  the object route for the report page (`switchSpace` already takes a post-switch route —
  `src/ts/lib/util/router.ts:205`). Follow whatever route-building helper `U.Object.openRoute`
  uses rather than hand-assembling the string.
- The report is a normal page object, so no special "discard" affordance is needed — opening it
  gives the user archive/delete like any object. The existing `spaceCheck`/`participantCheck`
  filter (`index.tsx:41-43`) must also strip `report` when the space is being removed/left.

### 5.4 `ImportFinish` handler — `src/ts/lib/api/dispatcher.ts:1120-1129`

- Add `issuesCount` to the existing `analytics.event('Import', …)` payload so partial-loss rate is
  measurable.
- **No auto-navigation on finish.** The guide suggests navigating to `rootCollectionID`, but the
  import is async and can finish minutes later — yanking the user's navigation then is worse than
  the current model (optimistic `openDashboard()` at call time + notification for the result).
  Recorded as a deliberate deviation.

### 5.5 v1 compatibility

All Phase 1 logic is gated on the new fields being non-empty. From a v1 run, `reportObjectId = ''`
and `issuesCount = 0` decode from the missing proto fields, and every branch above degrades to
today's behavior exactly. No flag checks, no version sniffing.

## 6. Phase 2 — AI enrichment (`aiParams`)

### 6.1 Settings model + persistence

New per-user (not per-import) settings blob:

```ts
interface ImportAiSettings {
	enabled: boolean;                 // master checkbox
	provider: I.AiProvider;           // Anytype | Ollama | OpenAI | LMStudio | LlamaCpp
	endpoint: string;                 // '' = provider default; ignored for Anytype
	model: string;                    // required for the feature to be on; fixed for Anytype
	token: string;                    // required for OpenAI; not user-editable for Anytype
	includeContentSamples: boolean;   // default false — privacy switch
};
```

- Add `I.AiProvider` enum to `src/ts/interface/common.ts`. The wire enum `Rpc_AI_Provider` has
  four values (OLLAMA=0, OPENAI=1, LMSTUDIO=2, LLAMACPP=3); `Anytype` is a **client-side-only**
  fifth value that maps onto the wire format when the request is built:

  | UI provider | Wire `provider` | Wire `endpoint` | Wire `model` | Wire `token` |
  |---|---|---|---|---|
  | Provided by Anytype | `OPENAI` (the proxy is OpenAI-compatible) | build constant | build constant (or user's `model` if we allow choice later) | build constant / per-account (§9) |
  | Ollama / LM Studio / llama.cpp / OpenAI | as chosen | user's `endpoint` ('' = provider default) | user's `model` | user's `token` |

  Mapping to `OPENAI` also inherits the middleware's protections for that provider: token required
  up front, and `http://` to a non-local host refused — the Anytype proxy endpoint must be
  `https://`.
- Persist `enabled/provider/endpoint/model/includeContentSamples` via `Storage` under a new
  `importAi` key added to `ACCOUNT_KEYS` (`src/ts/lib/storage.ts:6-8`) — account-scoped, reused
  across Notion/Markdown/Obsidian flows, exactly what the guide asks for.
- **Token**: the only encrypted-secret precedent is `electron/ts/safeStorage.ts` (used by the main
  process only; no renderer IPC today). Recommendation: keep scope small — store the token in the
  same `importAi` Storage blob for v1 of this feature, and note the safeStorage upgrade as a
  follow-up. The Notion API key precedent (`S.Common.notionToken`) is in-memory only, so plain
  Storage is already an improvement in persistence and no worse in secrecy than what web mode can
  offer. **Open question for review — see §9.**

Provider endpoint defaults (prefill, from guide §7.2):

| Provider | Default endpoint |
|---|---|
| Ollama | `http://localhost:11434/v1` |
| LM Studio | `http://localhost:1234/v1` |
| llama.cpp | `http://localhost:8080/v1` |
| OpenAI | `https://api.openai.com/v1` |

Keep these in `src/json/constant.ts` next to the other static config.

### 6.2 UI component

New shared component `ImportAiSettings` (add to Storybook per project convention — variations as
boolean props, not classNames), rendered on the **import index page**
(`src/ts/component/page/main/settings/import/index.tsx`) as a section below the format grid.
Rationale: Markdown imports launch straight from the grid into a file dialog with no intermediate
options page, so the index page is the only surface all three v2 formats share. The Notion warning
page and Obsidian page get a one-line hint linking back ("AI enrichment: on/off — configure in
Import settings") rather than duplicating the form.

Form (guide §7.6), all labels via `translate()`:

```
[ ] Improve structure with AI (optional)
    Provider  [ Provided by Anytype ▾ ]         ← Select; Anytype entry only when embedded (§6.3)
    Endpoint  [ http://localhost:11434/v1 ]     ← Input, prefilled on provider change if untouched
    Model     [ qwen3:8b ]                      ← Input, required
    API key   [ •••••••• ]                      ← Input type=password, shown/required for OpenAI
    [ ] Also send sample page titles for better accuracy
    ⓘ <data disclosure — see §6.5>
```

With **Provided by Anytype** selected, the Endpoint / Model / API key rows are hidden — there is
nothing for the user to configure; only the master checkbox, the samples checkbox, and the
disclosure remain. With any BYOK provider selected, all rows show as above.

Client-side validation before persisting `enabled = true`:

- `model` non-empty (middleware treats empty model as feature-off; don't let the user think it's on).
- `token` non-empty when provider = OpenAI (middleware rejects up front).
- Warn (non-blocking) when provider = OpenAI and endpoint is `http://` on a non-localhost host —
  the middleware refuses this combination (cleartext key leak); surfacing it at config time beats
  a `llmPlanFailed` warning after a long import.

Copy must mention the report page as the audit trail ("decisions the model made are listed on the
import report") and that there is no test connection — the first import validates the setup, and
failures appear as a report warning, never as a failed import (guide §7.4).

New `text.json` cluster: `popupSettingsImportAi{Title, Provider, Endpoint, Model, Token, Samples,
Disclaimer, …}` (disclosure keys in §6.5).

### 6.3 "Provided by Anytype" — build-embedded provider

An Anytype-operated proxy to an OpenAI-compatible API, offered as the zero-config provider choice.
Its parameters are **not** shipped in source — they are injected at build time, following the
existing pattern (`vite.config.ts:58-63` `define` + `src/ts/global.d.ts` `declare const`, as used
by `SPARK_ONBOARDING_URL` / `SENTRY_DSN`):

```ts
// vite.config.ts — define block
'IMPORT_AI_ANYTYPE_ENDPOINT': JSON.stringify(process.env.IMPORT_AI_ANYTYPE_ENDPOINT || ''),
'IMPORT_AI_ANYTYPE_MODEL':    JSON.stringify(process.env.IMPORT_AI_ANYTYPE_MODEL || ''),
'IMPORT_AI_ANYTYPE_TOKEN':    JSON.stringify(process.env.IMPORT_AI_ANYTYPE_TOKEN || ''),
```

```ts
// src/ts/global.d.ts
declare const IMPORT_AI_ANYTYPE_ENDPOINT: string;
declare const IMPORT_AI_ANYTYPE_MODEL: string;
declare const IMPORT_AI_ANYTYPE_TOKEN: string;
```

Rules:

- **Gating:** the "Provided by Anytype" entry appears in the provider Select iff
  `IMPORT_AI_ANYTYPE_ENDPOINT && IMPORT_AI_ANYTYPE_MODEL` are non-empty. A build without the env
  vars (default: empty) is a pure-BYOK build — local/dev builds behave exactly like today unless
  the developer exports the vars. Wrap the check in one helper
  (e.g. `U.Data.isImportAiAnytypeAvailable()`) so the Select, the persistence validation, and the
  request builder can't disagree.
- **Defaults empty, not baked in:** unlike the Spark constants, do **not** commit real values as
  fallbacks in `vite.config.ts` — endpoint/token come from CI env only. The token constant is
  optional (empty allowed) pending the auth decision in §9; note that anything embedded via
  `define` is trivially extractable from the shipped bundle, so an embedded token can only ever be
  a coarse rate-limit/abuse knob, not a secret.
- **Other build configs:** mirror the `define` block in `vite.web.config.ts`; skip
  `vite.extension.config.ts` and `vite.worker.config.ts` (no import UI there).
- **Persistence interaction:** when the persisted `provider` is `Anytype` but the running build
  has no embedded constants (e.g. settings synced/carried to a dev build), treat the feature as
  disabled and show the provider Select reset to Ollama — never send a half-filled config.

### 6.4 Wiring `aiParams` into the request

- `src/ts/lib/api/command.ts` `ObjectImport`: accept `aiParams` via the existing `options` object
  and attach it to the request envelope for **Notion, Markdown, and Obsidian only** (v1 formats
  ignore it; don't send it there).

```ts
if (options.aiParams) {
	request.aiParams = {
		config: {
			provider: options.aiParams.provider,
			endpoint: options.aiParams.endpoint,
			model: options.aiParams.model,
			token: options.aiParams.token,
			temperature: 0, // ignored by import; forced to ~0 middleware-side
		},
		includeContentSamples: Boolean(options.aiParams.includeContentSamples),
	};
};
```

- Build the `aiParams` value in **one place** — a helper (e.g. `U.Data.getImportAiParams()`)
  that reads the persisted `importAi` settings and returns `null` unless
  `enabled && model` (and `token` when OpenAI). For `provider = Anytype` it substitutes the
  embedded constants per the §6.1 mapping table (wire `provider: OPENAI`, endpoint/model/token
  from `IMPORT_AI_ANYTYPE_*`) and returns `null` when the constants are absent from the build
  (§6.3). Callers:
  - `Action.import()` (`action.ts:575`) — covers Markdown + Obsidian (and harmlessly skips
    v1 formats via the type gate in `command.ts`);
  - Notion warning page (`notion/warning.tsx:10`).
- **Off means absent.** When the helper returns `null`, the `aiParams` field is not set at all.
  Never send a half-filled config: a present-but-broken config produces a *visible*
  `llmPlanFailed` warning by design (guide §7.2).
- Analytics: extend the `ObjectImport` event params (`analytics.ts:537-540`) with
  `aiEnabled: boolean` and `aiProvider: 'anytype' | 'byok'` (no endpoint/model values —
  potentially identifying).

### 6.5 Data disclosure — required UI copy

The settings form must state exactly what leaves the device, in both modes (guide §7.3). This is
not fine print — it is the disclosure the whole feature's consent rests on, and for the Anytype
provider it doubles as our own privacy statement.

What is actually sent (from the middleware implementation):

| Mode | Data sent to the configured endpoint |
|---|---|
| Samples **off** (default) | Structure metadata only: database/folder **names**, property **names** and their **formats**, and select-option **names**. |
| Samples **on** | All of the above, **plus a few page titles per database/folder**. |
| Never, in either mode | Page bodies/content, property **values**, file contents, account or space identifiers. |

Disclosure copy shown under the form, switching with the samples checkbox
(`translate()` keys `popupSettingsImportAiDisclosure` / `...DisclosureSamples`):

> **Samples off:** "To suggest structure, Anytype sends the *names* of your databases, folders,
> properties and select options — plus their formats — to this endpoint. Page contents are never
> sent."
>
> **Samples on:** "To suggest structure, Anytype sends the *names* of your databases, folders,
> properties and select options, their formats, **and a few page titles per database or folder**
> to this endpoint. Page contents are never sent."

Provider-dependent wording for "this endpoint": for BYOK providers keep "this endpoint" (the user
typed it); for **Provided by Anytype** say "to Anytype's AI service" explicitly
(`popupSettingsImportAiDisclosureAnytype{,Samples}` variants) — the user never sees an endpoint
field there, so the copy is the only place they learn where the data goes.

The samples checkbox itself keeps the guide's framing — an explicit, **off-by-default** opt-in:
"Also send sample page titles for better accuracy". The copy should also mention the audit trail:
"Decisions made by the model are listed on the import report."

## 6.6 Live progress — `Event.Import.Statistic`

Not in the integration guide (it predates the event); the contract is `pb/protos/events.proto`
`Import.Statistic` plus §15 of heart's `2026-08-14-importv2-deferred-materialization-design.md`.

Mapped in `mapper.ts` (`Mapper.Event.ImportStatistic`), attached in `dispatcher.ts` to the
progress item `ProcessNew` registered — matched against `S.Progress.list` rather than
`getItem()`, which filters by the open space and would drop statistics for an import
targeting another one. Runs with `noProgress` have no item and stay silent by construction.

Rendering rules taken from §15.6, all in `component/sidebar/progress.tsx`:

| Phase | Line | Notes |
|---|---|---|
| Scanning | "N found" | `totalsKnown=false`; count-up, never a fake bar |
| Analyzing | elapsed, self-ticking | the LLM plan can run a minute with no counter moving |
| Fetching | "128/439 pages · 33 files · ~17min left" | `filesTotal=0` means unknown, so files count up |
| Creating | "4,120/9,650 objects" | same `pagesDone/pagesTotal` pair, re-based at the phase boundary |
| Finalizing | label only | |

`Throttled` and `Retrying` replace the counts with a calm badge (rate limiting is normal
operation, not an error); `Error` shows `errorMessage`. `currentItem` renders as a subtitle
and is **user content — displayable, never logged or sent to analytics**. Live
warning/error counts render de-emphasized so a bad run can be abandoned at minute 20.

**No blended percentage, by design**: fetching is rate-limit bound and creating runs orders
of magnitude faster, so one bar would crawl for an hour and then leap. The legacy percentage
still renders for v1 imports and every other process type.

Cancel uses `cancelEffect`: `NothingToUndo` cancels immediately, `RemovesCreated` opens a
confirm popup naming `objectsCreated` first.

Not adopted: `bytesDone` (its total is unknown, so it can only count up), `itemsPerSecond`
(the ETA already expresses it), and `safeToClose`. No determinate progress bar was added —
this surface has never had one, and §15.3 warns that the bar is the risky part; that is a
design call, not an implementation one.

### 6.6.1 Surviving a reload and a restart

`S.Progress` is in-memory, and `Event.Process.New` fires once, at import start — so after a
renderer reload or an app restart nothing re-registers the item. The statistic stream is
what rebuilds it: the handler **creates** the progress item, it does not merely attach to
one. Two facts make that safe and sufficient:

- A `noProgress` run reports `processId = ""` — `process.NewNoOp().Id()` is empty
  (`core/block/process/noop.go:14`) — so migrations and gallery installs stay invisible by
  construction. Every other run has a real process id.
- The emitter is **not** gated on `noProgress` (`adapter/runlifecycle.go:62` builds it for
  every run, fresh or resumed), so the stream is always there to rebuild from.

**Restart resume is the middleware's job, not ours.** `Close()` suspends in-flight runs and
keeps their durable state; `service.Run()` then starts `sweepAbandoned()` on the next launch
(`adapter/adapter.go:168-180`), which settles terminal runs, compensates crashed ones and
resumes resumable ones. A resumed run calls `setupProgress()` with a reconstructed request
(`adapter/resumerun.go:74`), so it registers a fresh process and publishes `Process.New` plus
statistics exactly like a new import. The client triggers nothing. Since that sweep can run
before the renderer's event session attaches, item-creation-from-statistic is also what
closes that race — the sidebar self-heals within one coalescing window (~250 ms).

Resume is attempt-capped (`CrawlResumeAttempts` / `maxResumeAttempts`), so a run past the cap
is compensated instead of resumed. The client must not promise resume.

**Pull RPCs, not yet wired.** `ObjectImportRunStatus(importId)` and `ObjectImportRunList()`
return `Run { status: Event.Import.Statistic, manifestState, live }` for live *and* dormant
runs. They are only needed to surface runs that are **not** auto-resuming (attempt-capped,
failed) or to offer an explicit discard. Blocked on the registry: `middleware/` has the
message bindings but `src/ts/lib/api/service.ts` was generated from a heart checkout without
these RPCs (see §12).

Two gaps worth raising with the middleware team: the statistic is sent with
`event.NewEventSingleMessage("")` and carries no `spaceId`, so a rebuilt item cannot be
attributed to a space (it currently shows in every space, which beats being invisible); and
`Run` has no `spaceId` either, so a listed dormant run cannot be attributed at all.

## 12. Proto regeneration mismatch (worktree tooling)

`scripts/generate-service-registry.js` hardcoded `../anytype-heart` and ignored the
`HEART_DIR` that `generate-protos.sh:73` honors, so generating against the importv2 branch
produced message bindings from that branch and a service registry from develop. The script
now honors `HEART_DIR`. Until it is re-run, `service.ts` references `Rpc_Object_DeletionAudit`
(develop-only) that the bindings lack — two type errors — and lacks the `ObjectImportRun*`
RPCs the bindings do have.

Regenerating fixes both but rewrites tracked `service.ts`, dropping `DeletionAudit`: correct
for running this branch locally, wrong to merge. The clean fix is rebasing heart's
`importv2-notion` onto heart develop so one generation serves both.

## 7. Behaviors verified as already-correct (no code change)

- **`progress.total` raised mid-run**: `S.Progress.update()` is a mobx merge; percentage is
  `Math.min(100, Math.ceil(current/total*100))` recomputed per render (`progress.ts:88-93`,
  `progress.tsx:25-34`). Nothing caches the total. Cosmetic note: the percentage can visibly drop
  when Notion discovers more pages — acceptable, matches guide's "the progress bar is the honest
  indicator".
- **Deprecated `Rpc.Object.Import.Response` fields**: no response mapper exists; nothing reads them.
- **`type = Obsidian`** is sent distinctly (`obsidian.tsx:12`) and selects the dialect profile.
- **Cancellation**: `C.ProcessCancel(id)` from `progress.tsx:62` — unchanged contract; v2 finishes
  with `IMPORT_IS_CANCELED`, which is already in `J.Error.Code.Import` handling (code 6 →
  `notificationImportErrorText6`). Verify a cancelled v2 run shows that notification, nothing more.

## 8. Edge cases

| Case | Expected handling |
|---|---|
| v1 engine serves the request | New fields empty → exactly today's UI (§5.5) |
| `errorCode ≠ NULL` + `reportObjectId ≠ ''` | Error text + View report button (§5.3) |
| `errorCode ≠ NULL` + no report | Error text only — fatal before anything ran |
| Report in another space, space since left/removed | `spaceCheck` filter strips the button (§5.3) |
| `noProgress = true` imports (migrations, gallery) | No notification arrives at all — `EventImportFinish` still fires; analytics only. No UI expectations |
| `issuesCount` > report cap (1000) | Count is still correct; report page states the overflow — client shows the number as-is |
| AI enabled but endpoint down / model missing | Import still succeeds; one `llmPlanFailed` warning on the report — no client error handling needed (guide §7.4) |
| Multi-path markdown selection | Known middleware parity gap (one root collection per path). Existing UI already allows multi-select in the file dialog; leave as is, note for support |
| Import into a different space (`isNewSpace`) | Progress hidden while another space is open (`progress.ts:68`) — pre-existing behavior, unchanged |

## 9. Open questions (for review, none block Phase 1)

1. **Token storage**: plain `Storage` (recommended for v1, §6.1) vs. wiring renderer IPC to
   `electron/ts/safeStorage.ts`. The latter needs a web-mode fallback anyway.
2. **AI settings placement**: import index section (recommended, §6.2) vs. a dedicated
   `importAi` settings sub-page. Sub-page is more discoverable from search
   (`popup/search.tsx:423`) but adds routing surface; can be promoted later without migration.
3. Should the notification card itself (not just the button) open the report on click? Today no
   notification type has whole-card click; keeping button-only preserves that convention.
4. **Anytype proxy auth.** An embedded `IMPORT_AI_ANYTYPE_TOKEN` is extractable from the bundle
   (fine as an abuse/rate-limit knob, useless as a secret). If the proxy needs real per-user auth,
   the token must come from the account layer at runtime instead — that is a product/backend
   decision this spec only leaves room for (the request builder takes the token from one place,
   §6.4). Note the wire format requires a non-empty token for `OPENAI`, so *something* must be
   sent.
5. **Default provider when embedded.** Should the Select default to "Provided by Anytype" (lowest
   friction) or to Ollama (most private)? Spec assumes Anytype-first ordering but no
   pre-enablement — the master checkbox is always off until the user opts in.
6. Longer term: ask middleware for a dedicated `ANYTYPE` value in `Rpc.AI.Provider` so the proxy
   stops masquerading as `OPENAI` and clients stop embedding the endpoint. Not needed for v1.

## 10. Testing

**Automated**

- `bun run typecheck` + `bun run lint` after each phase.
- Unit (vitest, exists on develop): `Notification.fillContent()` matrix from §5.2 —
  success/success-with-issues/error × with/without report id; `getImportAiParams()` helper —
  off/half-filled/complete configs.

**Manual matrix** (against the heart worktree with `ANYTYPE_IMPORTV2MARKDOWN` /
`ANYTYPE_IMPORTV2NOTION` on, and once with flags off for the v1 regression pass)

1. Clean Markdown import → "Import complete", no report button.
2. Import with warnings (unresolvable links) → "Imported with N issues" + View report opens the page.
3. Notion import into another space → report button switches space and opens the report.
4. Fatal error (bad Notion token past validation, empty zip) → error text; report button iff id present.
5. Cancel mid-run in both modes → `IMPORT_IS_CANCELED` notification; ALL_OR_NOTHING leaves no objects.
6. AI: Ollama running → typed objects + `typeSuggested` info issues on report; Ollama stopped →
   import succeeds with `llmPlanFailed` warning; OpenAI without token → blocked in UI.
7. Progress bar during a large Notion import — total grows, no UI breakage.
8. Build matrix for the embedded provider: build **without** `IMPORT_AI_ANYTYPE_*` env vars →
   no "Provided by Anytype" entry, BYOK-only; build **with** them → entry present,
   endpoint/model/token rows hidden, import goes through the proxy; persisted `provider: Anytype`
   settings opened in a no-constants build → feature reads as disabled, no request sent (§6.3).
9. Disclosure copy switches with the samples checkbox and with the provider
   (BYOK "this endpoint" vs "Anytype's AI service") in both light/dark and all supported locales
   (keys, not hardcoded strings).

**Post-merge chores** (per CLAUDE.md): `/qa-engineer` for the notification + settings flows,
`/update-docs` for touched component folders, `/dark-mode-check` after the settings SCSS.

## 11. Suggested landing order

1. **PR 1 (Phase 0 + 1):** proto regen, mapper/interface/model/component/notification changes,
   translations, analytics. Small, safe against v1, immediately useful.
2. **PR 2 (Phase 2):** `ImportAiSettings` component + Storybook entry, persistence, `aiParams`
   wiring, disclosure copy, SCSS + dark-mode audit. Depends on PR 1 only for the regenerated
   bindings.
3. **PR 3 (embedded provider):** `IMPORT_AI_ANYTYPE_*` defines in `vite.config.ts` /
   `vite.web.config.ts`, `global.d.ts` declarations, availability gating, provider mapping in the
   request builder, Anytype disclosure variants — plus the CI change (outside this repo's PR) that
   exports the env vars in release builds. Separable from PR 2 so the BYOK feature doesn't wait on
   the §9 auth decision.
