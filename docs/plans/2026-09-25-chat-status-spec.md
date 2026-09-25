# Chat activity and tool-call lifecycle

Status: UI direction accepted; implemented in the working tree. Manual Electron
visual/end-to-end verification remains outstanding.

Reviewed on 2026-09-25 against desktop branch `go-7368-pubsub-typing`, commit
`a918c72717` (merged with develop `daccf5311f`), and the local anytype-heart
status API. Current UI findings are from component/style review, not a running-app
test. Primary-source UI research and the interaction sketch were updated the same day.

## 1. Intended behavior and decisions

Publish on `status/<chatId>`:

```json
{
  "text": "Found 3 matching documents",
  "data": {
    "tool_call_id": "call_123",
    "tool_name": "web_search",
    "status": "complete",
    "result": {"matches": 3}
  }
}
```

**Confirmed by the user:**

- Missing text displays localized **Typing**.
- Data remains a free JSON object, with compact top-level metadata chips.
- Only updates with non-empty data are retained, in memory until app restart.
  Text-only updates remain transient and never split an activity group.
- Activities with no intervening chat message are grouped; click to expand.
- A later event with the same `tool_call_id` updates the existing item.
- `in_progress` means running; `complete` means succeeded; `error` means failed.
- Results remain hidden until the corresponding individual item is expanded.
  Expanding the outer group alone must not reveal results.

**Design recommendations made concrete in this draft:**

- Preserve a call's first position and group when updating it, even across messages.
  Count distinct calls, not their progress events. Retain the latest state per call;
  no separate chronological log of that call's overwritten states in this version.
- Both disclosure levels start collapsed. Updates, success, and errors preserve
  manual expansion choices. Errors remain visible through labels/counts.
- Merge provided top-level `data` fields for known IDs. Replace a supplied
  `result` atomically; omission preserves it. Details are specified in section 3.
- Collapsed chip inspectors/copy exclude `result`. Expanded items provide a
  result view and explicit **Copy result** / **Copy full data** actions.
  This reconciles the earlier full-JSON hover request with the newer result-hiding rule.
- Capture only activity received while at least one view has the chat open.
  Background collection from all chats is outside this change.

## 2. Baseline before implementation

| Area | Current implementation | Consequence |
|---|---|---|
| Subscription | `Lib/presence` subscribes to `typing/<objectId>`, refcounted by object | `status/<chatId>` has no subscriber or handler |
| Payload | Requires `sessionId`; reads `active`, optional `blockId` and `range` | `{text, data}` cannot enter the existing presence model |
| Incoming events | Dispatcher sends every `PubsubMessage` to `presence.onMessage`; it rejects other topic prefixes | Adding a mapper alone will not enable rich chat statuses |
| Identity | Own session and the entire current account are filtered out | Reusing this filter would hide agents authenticated as the user's account |
| Live state | Latest entry per identity/session; UI collapses sessions by identity | Earlier statuses are overwritten, with no history |
| Expiry | Typing refresh 2 s; chat idle stop 3 s; remote expiry 5 s with a 1 s sweep | Presence is intentionally temporary |
| Close | Final unsubscribe calls `S.Presence.clearObject` | Leaving the chat deletes its presence state |
| Chat UI | A 24 px row outside `scrollWrapper`, above the composer; up to three avatars, translated names, animated dots | There are no structured chips or historical rows between messages |
| Chat timeline | Date sections containing real `Message` components; message cache capped at 500 | Status rows need a separate render model, independent of message eviction and counters |
| Message arrival | `ChatAdd` updates chat state and dispatches `messageAdd`; `ChatUpdate` also calls the component's `onMessageAdd` helper | The component helper cannot reliably define a new-message boundary |
| Space context | Dispatcher has envelope `spaceId`, but does not pass it into `presence.onMessage` | New status state must receive space explicitly |

Source entry points:

- [Presence publisher and receiver](../../src/ts/lib/presence.ts), particularly
  `subscribe`, `unsubscribe`, `publish`, and `onMessage`.
- [Presence store](../../src/ts/store/presence.ts), particularly `setTyping`,
  `clearObject`, `prune`, and `getTypers`.
- [Chat component](../../src/ts/component/block/chat.tsx), particularly
  `getSections`, `onMessageAdd`, subscription effects, and `typingIndicator`.
- [Composer](../../src/ts/component/block/chat/form.tsx): publishes legacy
  typing on input and stops it on blur/send.
- [Dispatcher](../../src/ts/lib/api/dispatcher.ts): `PubsubMessage`, `ChatAdd`,
  `ChatUpdate`, and event batching.
- [Current typing styles](../../src/scss/block/chat.scss) and
  [translations](../../src/json/text.json), `blockChatTypingOne/Two/Many`.

Additional integration observations:

1. The introductory comment in `presence.ts` still says 3 s refresh / 8 s TTL;
   executable constants are 2 s / 5 s. Use the constants when describing current behavior.
2. Receiving a chat message does not currently clear the remote author's presence;
   only local send calls `presence.stop`. The new receiver should clear that author's
   transient text/generic activity at message ingestion, without completing tool calls.
3. [Preview.tooltipShow](../../src/ts/lib/preview.ts) transforms escaped newlines
   and renders HTML. A full JSON inspector needs a literal text rendering path.
4. [U.Common.clipboardCopy](../../src/ts/lib/util/common.ts) strips zero-width
   spaces from text. JSON copying must preserve string contents exactly, using a
   clipboard path without that transformation.
5. The local, ignored generated service registry and middleware bindings checked
   during this review do not contain Pubsub RPC/event definitions. Regenerate from
   a pubsub-enabled middleware checkout before runtime validation; frontend wrappers
   alone do not provide transport support.

## 3. Wire contract, identity, and updates

### Envelope and compatibility

- Topic: `status/<chatId>`, scoped to the pubsub space.
- One UTF-8 JSON object with optional `text` and `data`. Unknown envelope fields
  are ignored. Malformed JSON/non-object envelopes cause no state change.
- `text` is literal plain text. Missing, empty, whitespace-only, null, or non-string
  text uses localized Typing. This applies to each received event, including a
  known-call update: publishers repeat text when they want to retain the label.
  Text is a display snapshot; the partial merge below applies to `data`.
- Object data qualifies for retention when it has at least one own property.
  `{"result":null}`, `{"ok":false}`, and `{"count":0}` qualify.
  Missing data, null, and `{}` never qualify, regardless of prior activity.
- The backend accepts arbitrary JSON values beyond the preferred object contract.
  Arrays/scalars fall back to one `data` chip. Non-empty arrays/strings, numbers,
  and booleans qualify; `[]`, `""`, and null do not. They have no call lifecycle.
- A non-empty string `data.tool_call_id` opts into correlated tool rendering.
  Without it, retain generic snapshot behavior. A tool name alone does not imply a
  call identity; a generic `status` field alone does not imply success/failure.
- For tool items, recognize `tool_call_id`, `tool_name`, `status`, and `result`.
  Preserve every other field as freeform metadata without flattening nested values.
  IDs are opaque and case-sensitive; do not derive an ID from tool name or query.
- Identity comes from the verified pubsub event. Scope by
  `(accountId, spaceId, chatId, publisherIdentity, tool_call_id)`, never payload
  identity fields. Same-ID calls from different publishers/chats remain separate.
- Publishers must generate IDs unique for distinct executions across their runs;
  prefer UUIDs or a run-prefixed ID. Retries use a new ID. There is no run/session
  namespace in this envelope to disambiguate two agents sharing an identity and ID.

The local Heart publisher already forwards this shape as raw JSON:
[publisher](../../../anytype-heart/core/api/v2/service/chat_status.go),
[model](../../../anytype-heart/core/api/v2/model/chat_status.go),
[client conventions](../../../anytype-heart/docs/pubsub/CLIENTS.md).
The HTTP route remains `POST /v2/spaces/{spaceId}/chats/{chatId}/status`.
It publishes `status/<chatId>`; acceptance is not delivery. Heart does not aggregate
tool lifecycle state. The current encoded application payload limit is 65,508 bytes.
Pubsub supplies neither persistent history nor replay.

### Same-ID reducer

1. Look up the scoped call ID before selecting a group.
2. For a new ID, create one item in the current message interval, including when
   the first observed event is already `complete` or `error`.
3. For a known ID, update its original item. Preserve local item ID, group,
   first-seen order/time, and both expansion states. Do not append, relocate, or
   increment counts; sealed groups still accept updates to their existing calls.
4. Merge only own top-level fields present in `data`. Missing fields keep their
   previous values. Nested objects/arrays are replacement values, not deep patches.
   There is no field-deletion operation; null is a value.
5. A present `result` replaces the prior result as a whole, including null, false,
   0, an empty string, object, or array. Test presence, not truthiness. Omission
   leaves the result unchanged. Never concatenate result strings automatically.
6. `tool_name` is optional display metadata. Preserve it when absent; a supplied
   valid name can update it. Invalid names remain inspectable data and use a
   localized Tool call label. They must not break correlation.
7. Apply the event's text fallback independently as described above. A text-only
   event has no ID and cannot mutate a retained call.
8. Equal repeat events refresh freshness without adding items or re-announcing
   completion. Changed metadata or result updates the same item.

Example: an initial event with query and `in_progress`, followed by the confirmed
example with the same ID, yields **one** completed item. Its query remains a chip,
its latest text is “Found 3 matching documents,” and its result stays collapsed.

### Lifecycle and freshness

| Wire status | Compact UI | Behavior |
|---|---|---|
| `in_progress` | Running + activity icon | Active while fresh; remains the last reported state until an explicit terminal update |
| `complete` | Completed + check | Successful terminal state; no typing animation |
| `error` | Failed + error icon | Failed terminal state; visible even with result collapsed |

An initial ID-only update, missing status, or an unknown status has no inferred
lifecycle badge. Show neutral “Status not reported” in item details. A known item
preserves its valid lifecycle when a later update omits status; unknown values
remain inspectable without inventing a state.

Recommended terminal rule: `in_progress → complete|error` is allowed. Once terminal,
ignore an event with a conflicting explicit status (including a stale
`in_progress`) as a whole. Updates with the same terminal status, or no status, may
still add a late result or metadata. The first accepted terminal outcome wins.
Retries need a new ID. Correcting terminal outcomes reliably would require an
additional revision/sequence contract; this payload has none.

This cannot solve all transport ordering: two same-state/result-only updates have
no revision number, so the last received one wins. Do not advertise exactly-once
delivery or an authoritative execution audit trail.

Keep freshness separate from lifecycle:

- Use receiver receipt time. Existing Heart guidance refreshes about every 2 s;
  expire live freshness after 10 s. Legacy desktop typing retains its own 5 s TTL.
- After expiry, disconnect, or last-view unsubscribe, stop activity animation.
  Retain the call's last reported `in_progress` with “No recent updates.”
  This is a UI freshness annotation, not a fourth wire status or a failure.
- A fresh update can restore animation for a still-running call.
- A message does not complete, fail, or cancel running calls. Multiple concurrent
  calls from one publisher keep independent states.
- `result` alone never proves completion. A terminal update can have no result;
  show “No result provided” only in that item's expanded details.
- Generic/text-only status expires normally. `{}` means transient Typing, not stop.
  A new real message clears that author's transient text/generic activity.

### Coexistence with editor presence

Keep editor caret/focus/block behavior on `typing/<objectId>` with its existing
`sessionId`, `active`, `blockId`, and `range` protocol. Desktop human chat typing
also continues using this legacy publisher for now.

Route new status events separately, passing the envelope space ID. Accept verified
same-account agent events; do not reuse the legacy current-account exclusion.
Avoid showing the same rich activity in both timeline and footer. Where an author
has visible fresh rich activity, it takes priority over their legacy typing row.
Migrating the human publisher needs a separate origin/stop contract.

## 4. Session history and message grouping

### New items versus updates

Maintain one current message interval per `(accountId, spaceId, chatId)`.

- A new tool ID or qualifying generic snapshot creates an item in the current
  group. Create that group lazily on its first item.
- A known tool ID updates its existing item wherever it is anchored. This does
  not create a new group or join a newer one.
- A new actual message from any author seals membership of the current group and
  starts a new interval. Sealing freezes membership, not the state of existing calls.
- Text-only updates, idle time, and expiry do not split groups. Never buffer
  text-only history or retroactively promote it because a later event has data.
- Message edits, reactions, receipts, pins, and deletions are not boundaries.
  Deleting a separator never merges existing groups.
- Observe each live message boundary once at ingestion before per-view fanout.
  Initial snapshots, pagination, and late historical inserts at/before the known
  tail are not new boundaries. Repeated message IDs are deduplicated.
- Locally sent messages use their confirmed message boundary. The current composer
  does not insert optimistic messages into the timeline. If optimistic rows are
  introduced later, reconcile provisional boundaries on confirmation/failure.

Example receive order:

```text
call A starts → call B starts → chat message → call A completes → call C starts

group 1: A (completed), B (running)  [same original positions]
chat message
group 2: C (running)
```

Generic items have no correlation ID: compare normalized text and lossless data
against the last generic/text snapshot from that publisher in the current interval.
Equal active snapshots coalesce as heartbeats; object key order alone is irrelevant.
Changed non-empty snapshots append; text-only snapshots update the comparison
baseline but are never retained. A → B → A retains three generic entries;
data A → text B → data A retains two. Equal snapshots after expiry or a message
boundary form a new generic entry. Different publishers never deduplicate together.

All-tool groups count distinct tool calls. Mixed/generic groups use the localized
label **activities**, not an inferred execution count. Status updates to one call
never increase either count.

### Lifetime, ownership, and anchors

- Keep retained items and disclosure preferences in application memory until app
  process exit/restart. Navigation, chat reopen, window replacement, and renderer
  reload must not erase them.
- The last view closing unsubscribes and stops freshness, but preserves history.
  No unseen updates can be reconstructed. On reopening, reconcile the message
  tail; if an observation gap makes adjacency uncertain, create a new interval
  for new items. Known IDs can still update their original items.
- Isolate account state. Logout/account removal clears it; loss of space access
  clears that space. Do not use disk storage, browser sessionStorage, synced
  objects, or the chat-message database as the authoritative store.
- Keep retained items for the whole session independently of the message cache's
  500-entry pruning. Render lazily. A future retention cap is a product decision.
- Give each group stable preceding/following real-message IDs and order IDs,
  independent of the loaded message window. Render the group at that gap.
  Sealing supplies its following anchor; deletions use recorded order boundaries.
  Off-window groups stay stored until their gap is loaded.
- Receiver-observed order is the available ordering. There are no producer
  timestamps or message references to reconstruct cross-channel causal order.

## 5. UI behavior

### Outer group

Use one restrained timeline activity block in the corresponding message gap.
Start collapsed, including single-item groups.

Collapsed summary: count, latest activity text, and counts for running/failed
items when applicable. Use localized singular/plural forms. Keep errors visible
without opening the group; do not equate “nothing running” with success.

Clicking the group header reveals individual items in first-seen order.
Preserve this choice on updates and chat reopen. Expansion alone does not reveal
any result. Keep each publisher's identity available per item, especially in
multi-publisher groups.

### Individual item

Each row has its own disclosure control and stable identity:

```text
▾  3 tool calls · 1 running · 1 failed

   ▸  web_search       Completed
      Found 3 matching documents
      [query: tickets berlin amsterdam]

   ▸  read_document    Running
      Reading timetable
      [document: train-options.pdf]

   ▸  fetch_page       Failed
      Could not load the operator page
      [url: https://example.org/timetable]
```

- Primary text is the publisher's status text (or Typing). Tool name is secondary
  context; the sketch can compare that hierarchy. Status uses an icon plus a label.
- For a tool item, name/status are promoted to the row header and ID to expanded
  metadata. Other top-level fields appear as compact chips.
- No `result` chip, output snippet, nested result key, or automatic error payload
  appears while that item is collapsed. A publisher-supplied summary in `text`
  is visible intentionally.
- Clicking the item's disclosure reveals its own result as literal formatted JSON,
  plus tool ID and full-data inspection/copy. Other items keep their current state.
- A result can arrive before or after terminal status. If the item is open, refresh
  its contents without moving focus/scroll position; if closed, keep it closed.
- Completion, failure, a new item, or an outer-group toggle never resets an item's
  expansion choice. Closing/reopening the group restores which items were open.
- An error shows Failed plus supplied summary while collapsed. Detailed errors in
  `result` remain behind item expansion. Do not invent retry/cancel actions.

For generic object data, retain top-level chip rendering. The top-level `result`
key follows the same result disclosure rule even without a call ID; other fields
have no special lifecycle meaning. Arrays/scalars remain one generic data chip.

### Chips, JSON, copy, and accessibility

| Value | Compact preview |
|---|---|
| String | `query: tickets berlin amsterdam` |
| Number, boolean, null | `count: 4`, `cached: false`, `options: null` |
| Object | `options: Object(3)` |
| Array | `documents: Array(8)` |

- Keep source property order. Use visual truncation for long labels and wrap chips
  at the chat width. Never reconstruct data from previews.
- Chip hover/focus shows all metadata JSON for that item, excluding top-level
  `result`. For tool items this includes the ID/name/status even though the header
  already displays some of them. Clicking a chip copies exactly that metadata.
- In an expanded item, **Copy result** copies the entire result JSON value;
  **Copy full data** copies the entire merged `data` object including result.
  The full-data control's hover/focus inspector previews exactly what it copies.
  Result inspection is available on touch through item expansion.
- Treat JSON as literal text; do not interpret HTML or Markdown. Preserve escaped
  newlines, zero-width characters, and numeric tokens beyond JS safe-integer
  precision. Keep a lossless representation for field merging and serialization.
- Show copy success only after a successful clipboard write; provide failure
  feedback. Native disclosure/copy buttons must be separate, not nested.
  Chip clicks never expand their parent. Enter/Space work; focus remains visible.
- Disclosure controls expose `aria-expanded` and `aria-controls`. Inspectors stay
  open while hovered/focused and close with Escape. Announce lifecycle transitions
  politely once, avoiding repeated heartbeat announcements. Color is not the sole cue.
- Localize Typing, Tool call, status labels, freshness notes, counts, copy feedback,
  and accessible names. Do not translate supplied text or JSON keys/values.
- Honor reduced motion and existing chat theme tokens.

### Timeline and footer integration

Text-only activity stays near the composer, with existing avatar/text styling.
It remains transient even when that publisher has retained calls. An unknown
participant name uses a localized fallback until identity details load.

Retained activity lives in the scrollable timeline and is not duplicated in the
footer. Preserve reading position during disclosure or updates. Follow incoming
activity only if the reader is already at the live tail. Updating an old anchored
call never jumps the reader back to it.

Chats with retained groups and zero real messages still render activity. Groups
break visual message-author adjacency and have no unread counts, notification
sounds, reactions, read acknowledgements, message actions, or synced exports.

## 6. State and integration plan

Use an Electron main-process memory owner and renderer MobX projections. One
ingestion owner per chat must serialize status/message events before multiple
views consume deltas. Ownership transfers when a view closes; multiple windows
must not each append the same broadcast. Existing infrastructure:
[WindowManager](../../electron/ts/window.ts). Web mode can use page-lifetime memory.

Suggested model:

```ts
type ToolStatus = 'in_progress' | 'complete' | 'error';
type ChatScope = { accountId: string; spaceId: string; chatId: string };

interface ActivityItem {
  id: string;                         // stable local key
  kind: 'tool' | 'generic';
  publisherIdentity: string;
  toolCallId?: string;                 // required for tool kind
  groupId: string;
  text: string | null;                 // null = localized Typing
  dataJson: string;                    // losslessly serialized current data
  lifecycle?: ToolStatus;              // accepted explicit state
  firstSeenAt: number;
  lastSeenAt: number;
  firstSeenSequence: number;
}

interface ActivityGroup {
  id: string;
  beforeMessageId?: string;
  beforeOrderId?: string;
  afterMessageId?: string;
  afterOrderId?: string;
  sealed: boolean;                    // closes membership only
  itemIds: string[];
}

// Per scope: items, groups, callIndex[publisherIdentity + toolCallId],
// currentInterval, knownTail, seenMessageIds, transientByPublisher.
// Use structured keys/nested maps, not ambiguous string concatenation.
// Separate UI state: expandedGroupIds and expandedItemIds.
// Track freshness independently; result presence comes from the lossless data model.
```

| Layer | Work |
|---|---|
| `lib/chatStatus.ts` | Status topic subscriptions, validation, scoped events, freshness |
| `lib/api/dispatcher.ts` | Separate status routing; pass space ID; true message boundaries before fanout |
| Main-process session module | Pure reducer, call index, message anchors, memory/ownership/account cleanup |
| `store/chatStatus.ts` | Observable projection of mutable tool items, generic snapshots, and transient state |
| Chat status components | Outer group, independent item disclosure, badges, metadata/result inspectors |
| `component/block/chat.tsx` | Merge activity gaps into sections; handle empty chat, adjacency, scrolling |
| Translations and SCSS | Localized labels/counts, theme, focus, reduced motion |
| Generated middleware bindings | Regenerate with Pubsub support before runtime validation |

Do not insert fake messages into `S.Chat.messageMap`. Keep transport subscription,
live freshness, session retention, and disclosure state as separate concerns.

## 7. UI research and rationale

These are observed precedents, not a universal UI standard or a requirement to
adopt another project's protocol.

- **assistant-ui:** a compact tool row expands to arguments and result. Invocation
  identity and explicit status drive the component. Its fallback automatically
  opens for required user action, and otherwise preserves user-controlled opening.
  This closely fits individual result disclosure.
  [Tool fallback](https://www.assistant-ui.com/elements/tool-fallback).
- **LibreChat:** each tool call has its own expansion state; defaults depend on its
  auto-expand preference. Groups preserve explicit user overrides and expose
  failed/cancelled counts. Its data component provides compact top-level chips.
  These support our two disclosure levels and visible failure summaries.
  [ToolCall](https://github.com/danny-avila/LibreChat/blob/main/client/src/components/Chat/Messages/Content/ToolCall.tsx),
  [ToolCallGroup](https://github.com/danny-avila/LibreChat/blob/main/client/src/components/Chat/Messages/Content/ToolCallGroup.tsx),
  [ToolCallInfo](https://github.com/danny-avila/LibreChat/blob/main/client/src/components/Chat/Messages/Content/ToolCallInfo.tsx).
- **OpenHands:** adjacent event groups expand into individual event cards. Its CLI
  correlates pending action widgets by tool-call ID and updates the existing widget
  when an observation/error arrives. This supports stable item identity and
  separate group/item disclosure.
  [Event grouping](https://github.com/OpenHands/OpenHands/blob/main/src/components/conversation-events/chat/group-events.ts),
  [Group UI](https://github.com/OpenHands/OpenHands/blob/main/src/components/conversation-events/chat/event-message-components/event-group.tsx),
  [CLI correlation](https://github.com/OpenHands/OpenHands-CLI/blob/main/openhands_cli/tui/widgets/richlog_visualizer.py#L391).
- **ACP:** defines an initial tool call and later updates using the same call ID;
  updates may contain only changed fields. It separates human-readable descriptions,
  lifecycle, and raw outputs. This supports correlation and partial updates.
  ACP uses different terminal names and null semantics from this proposed contract;
  our frontend does not implement ACP merely by following that pattern.
  [Tool-call protocol](https://agentclientprotocol.com/protocol/v1/tool-calls).
- **Vercel AI Elements:** uses a tool disclosure with lifecycle badges, parameters,
  and output. Its documentation also demonstrates automatically opening completed
  or errored calls. Our user requirement chooses manual result disclosure instead.
  [Tool component](https://elements.ai-sdk.dev/components/tool).
- **Open WebUI:** separates current status from retained status history. Its
  persistence can be database-backed; ours lasts only for the application session.
  [Events](https://docs.openwebui.com/features/extensibility/plugin/development/events/).

The resulting recommendation is **one mutable item per call, stable ordering,
explicit outcome, and progressive disclosure at both levels**. Metadata hover/copy,
session-only retention, and cross-message in-place updates are our product rules,
not claims of identical behavior in every referenced harness.

## 8. Acceptance checks

1. The confirmed payload creates one completed tool item with supplied text.
   Omitted/blank text displays localized Typing, including in known-ID updates.
2. Start/progress/complete/result updates to the same scoped ID leave one item
   and one count. Different IDs with the same tool name remain separate.
3. A final event observed first creates an item. An ID-only later update finds it.
   ID reuse across publishers/chats/accounts never collides.
4. Omitted data fields preserve prior metadata/result. Supplied result replaces it,
   including null/false/0/empty string. Nested results are not merged/concatenated.
5. Terminal state stops animation; result without terminal status does not.
   Expiry, disconnect, text-only updates, and messages never infer success/failure.
   A stale in_progress event cannot regress a terminal item.
6. A → message → A update keeps A in its original group. A new B after the message
   starts a new group. Messages seal membership, not mutable call contents.
7. Text A → data B → text C retains only B. Generic heartbeat dedup works; known
   call heartbeats never append even across groups or expiry.
8. Group and each item start collapsed. Opening the group reveals no results.
   Opening item A reveals only A's result. Completion/error/result arrival preserves
   all disclosure choices, including after close/reopen/navigation.
9. Failed labels/counts are visible while results are hidden. No result is leaked
   through collapsed chips, hover, or copy. Expanded full-data copy includes it.
10. Chip clicks only copy; item/group clicks only disclose. Keyboard controls,
    focus, Escape, live announcements, narrow layout, and reduced motion work.
11. Inspect/copy preserves arbitrary nested JSON, Unicode, zero-width characters,
    escaped newlines, and large numeric tokens; copy failure has accurate feedback.
12. Anchors survive pagination, edits, duplicates, deletes, and optimistic sends.
    Updates do not move rows or disturb readers away from the tail.
13. Navigation/window replacement retains history; app restart clears it. Multiple
    views ingest once, account isolation works, and no status is written to disk.
14. Legacy human typing/editor caret behavior continues. Same-account agent
    activity is visible. Zero-message chats can display retained groups.

## 9. Implementation sequence

1. Build the lossless decoder, scoped call reducer, generic dedup, and boundary
   logic with focused tests for checks 1–7.
2. Add the application-memory owner, ownership/IPC, projection, and cleanup.
3. Add status subscription/dispatch while preserving legacy editor presence.
4. Integrate anchored timeline groups and both disclosure levels, then JSON
   inspection/copy, localization, and accessibility.
5. Regenerate pubsub bindings and validate in Electron with a publisher sequence:
   start → progress → message → complete → late result, parallel calls, failure,
   dropped completion, and window reopen.

## 10. Implementation and verification

- [Receiver](../../src/ts/lib/chatStatus.ts) subscribes to the new topic after
  establishing the actual chat tail, independent of the displayed history page.
- [Journal](../../src/ts/lib/chatStatus/model.ts) and
  [session owner](../../src/ts/lib/chatStatus/session.ts) implement correlation,
  partial data updates, explicit lifecycle, generic retention, and ownership handoff.
- [Main-process bridge](../../electron/ts/chatStatus.ts) holds the session in memory;
  [MobX projection](../../src/ts/store/chatStatus.ts) receives snapshots/deltas.
- [Chat activity components](../../src/ts/component/block/chat/status.tsx) implement
  both disclosure levels, result hiding, literal JSON inspection, exact-value copy,
  localized labels, freshness, and keyboard support.
- [Interactive Storybook example](../../src/ts/component/block/chat/status.stories.tsx):
  **Block / Chat / Tool activity / Lifecycle and results**. Complete the search,
  then add its result while checking that counts and disclosure choices stay stable.
- The JSON reader preserves number lexemes and string values. It accepts the
  transport's 65,508-byte limit and caps nesting at 128 levels.
- Heart's local development binary and generated protobuf/service bindings have
  been rebuilt with Pubsub support. Restart the desktop development app to load
  the new main-process service and helper binary.
- Focused journal, session, receiver, timeline, and rendered-disclosure tests are
  included. Type checking and the desktop build pass. The full suite retains the
  same 90 baseline failures recorded after merging develop; no new failure names.
- Browser automation was unavailable during implementation. Actual hover, focus,
  responsive layout, and live Heart-to-Electron delivery still need a manual smoke
  test; rendered-disclosure tests cover result visibility without a browser.

The original interactive sketch remains design exploration. The application now
uses the React components linked above.
