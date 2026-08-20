# Spec: global cross-space search (objects + messages)

Date: 2026-08-20
Status: spec for review; implementation to follow
Depends on: anytype-heart worktree `../anytype-heart_crosschat` (branch `go-7449-chat-search-scopes`),
which carries both the cross-space `ChatSearch` scope and the new one-shot
`Rpc.Object.CrossSpaceSearch`.
Builds on: `docs/specs/2026-08-20-in-space-cross-chat-search.md` (the space search popup with
type chips — reused wholesale here).

## Product ask

A vault-level search across all spaces, for objects and messages:

1. Entry point: a search icon in the vault sidebar header (the "Channels" panel, next to the
   `+` and sidebar-toggle icons).
2. No per-type chips (types can't be merged cross-space). Filtering is by `resolvedLayout`:
   All objects · Messages · Files · Images · Bookmarks · Collections · Queries · Chats.
3. Objects come from the new one-shot `Rpc.Object.CrossSpaceSearch` (no subscription).
4. `allStoresLoaded: false` in the response → show a loader and retry every 3 s until true.
5. Every result shows which space it lives in; opening a result routes into that space.
6. Messages reuse `ChatSearch` with **empty `spaceId` and empty `chatId`** (= all chats in all
   spaces; scope table in the heart PR).

## Backend contract

### `Rpc.Object.CrossSpaceSearch` (new, in the worktree's `commands.proto`)

- Request: `{ filters, sorts, fullText, offset, limit, keys }` — offset/limit apply to the
  merged cross-space result; empty `keys` returns all details.
- Response: `{ records, allStoresLoaded }`.
  - `records` are plain detail structs (like `ObjectSearch`) — **no `meta` highlights**, unlike
    the in-space `ObjectSearchWithMeta`. Global object rows therefore render without highlight
    snippets.
  - `allStoresLoaded == false`: per-space stores warm up sequentially on app start; early calls
    see a partial space set. The client retries (see UX) — or could use
    `ObjectCrossSpaceSearchSubscribe`, which we deliberately avoid (one-shot is cheaper for a
    transient popup).
- Records carry `spaceId` as an ordinary detail (`spaceId` is in `J.Relation.default`).

### `Rpc.Chat.Search`

Unchanged plumbing; `spaceId = ''`, `chatId = ''` selects the vault-wide scope.
`model.Search.Message.Result.spaceId` (field 7) is set in all scopes and is already mapped
(`Mapper.From.ChatSearchResult`).

## Protobuf bindings & API layer

- Regenerate ts-proto bindings from the worktree:
  `HEART_DIR=../anytype-heart_crosschat bun run generate:protos`
  (regenerates `middleware/`, applies the struct override, and re-runs
  `scripts/generate-service-registry.js`, which auto-registers the new unary method in
  `src/ts/lib/api/service.ts`).
- New command `C.ObjectCrossSpaceSearch(filters, sorts, fullText, offset, limit, keys, callBack)`
  (`command.ts`, mirrors `ObjectSearch`; filters/sorts through `Mapper.To.Filter/Sort`).
- New response handler `Response.ObjectCrossSpaceSearch` → `{ records, allStoresLoaded }`.

## Entry point

`sidebar/page/vault.tsx`, header `.side.right`, before `iconCreate()` (expanded state only in
v1 — the minimal vault stays as is):

```tsx
<Icon id="button-vault-search" name="common/search" withBackground={true}
	tooltipParam={{ text: translate('popupSearchGlobalTooltip'), typeY: I.MenuDirection.Bottom }}
	onClick={() => keyboard.onSearchPopup(analytics.route.vault, { data: { isGlobal: true } })} />
```

`keyboard.onSearchPopup` already forwards `param.data` into the popup.

## Popup: global mode of `PopupSearch`

One popup, two modes. `isGlobal` comes from `param.data`. Everything below is a delta against
the in-space behavior; unlisted behavior (virtual list, quiet chip switching, Tab cycling,
flicker-free rendering, footer hints) is inherited unchanged.

### Chips (global set)

| chip id | filter |
|---|---|
| `all` | base filters only (system layouts + template exclusion, as in-space) |
| `mine` | `Or(creator In [...], lastModifiedBy In [...])` — the account's participant id in **every** space (participant ids are per-space) |
| `message` | `ChatSearch('', '', …)` |
| `file` | `resolvedLayout In [ File, Pdf, Audio, Video ]` |
| `image` | `resolvedLayout In [ Image ]` |
| `bookmark` | `resolvedLayout In [ Bookmark ]` |
| `collection` | `resolvedLayout In [ Collection ]` |
| `query` | `resolvedLayout In [ Set ]` |
| `chat` | `resolvedLayout In [ Chat ]` (find a chat object by name) |

- No per-type chips, no Media chip (Files/Images replace it).
- Messages chip gating mirrors in-space, but against the **global** stores: shown when
  `subId.chatGlobal` or `subId.discussionGlobal` has records.
- Labels via new translate keys (`popupSearchTypeFiles`, `popupSearchTypeImages`,
  `popupSearchTypeBookmarks`, `popupSearchTypeCollections`, `popupSearchTypeQueries`,
  `popupSearchTypeChats`), reusing existing keys where a fitting one exists.

### Loading — objects

- `C.ObjectCrossSpaceSearch(filters, sorts, fullText, offset, limit, keys)` with
  `keys = J.Relation.default` (covers `spaceId`, name, icons, layout) and per-chip client sorts
  (revised after review): Chats always `lastMessageDate desc` (chats never have an FT score -
  their text path filters by name), Types `lastUsedDate desc, lastModifiedDate desc` for empty queries (lastUsedDate is a
  local detail - unset on a freshly pulled account); every other
  chip sends no sorts and relies on the backend defaults - `QueryCrossSpaceNoWait` injects
  `lastModifiedDate desc` for empty queries and score-first for text queries, both applied
  across the merge with a deterministic tiebreak. Generic client sorts like `lastOpenedDate`
  would skew the merged order (only locally-opened objects carry it); chip-specific browse
  orders are deliberately client-side, not hardcoded in heart.
- Base filters pass `ignoreChat: false` (revised after review): the default keys off the
  *current* spaceview's `isOneToOne` and would inject `resolvedLayout/recommendedLayout NotIn
  [Chat, ChatOld, Discussion]`, hiding every chat object from the vault-wide search.
- Chats chip + text query filters by `name Like` instead of `fullText` (revised after review):
  chat objects are not in the fulltext index, so an FT query finds nothing.
- Same pagination flow (`offset += limit` via `InfiniteLoader`).
- **`allStoresLoaded: false` handling (revised)**: no auto-retry in the first iteration — a
  timer-driven reload was judged a dangerous re-render flow. The partial results are rendered
  as-is; `allStoresLoaded` is mapped through the response layer for future use. Every keystroke
  and chip switch issues a fresh query anyway, so a store set still warming up self-heals on
  the next user interaction.

### Loading — messages

- `C.ChatSearch('', '', text, offset, limit, sorts)` — same sorts as in-space
  (`CreatedAt desc` always).
- Container (chat) attribution resolves from the **already-populated global stores** — no extra
  RPC in the common path:
  1. `S.Detail.get(J.Constant.subId.chatGlobal, chatId)` — all chat objects, all spaces;
  2. discussion: `S.Chat.discussionParentMap.get(result.spaceId)?.get(chatId)` →
     `S.Chat.getDiscussionParentDetail(...)` (both fed by the cross-space `discussionGlobal`
     subscription).
- Author attribution: `U.Space.getParticipantId(result.spaceId, creator)`; per-space stores only
  hold the current space's participants plus each space's creator/self (`createSubSpace`), so
  unresolved authors are batch-fetched once per page with the same new RPC
  (`ObjectCrossSpaceSearch`, `id In [participantIds]`, participant keys) and cached in a
  popup-scoped ref map. Rows render name-less avatars until the fetch lands (single re-render).

### Rows — space attribution

- Every row gains a space element in the caption line: space icon + name from
  `U.Space.getSpaceviewBySpaceId(record.spaceId)`.
  - Object rows: `<Type name> · <space>`.
  - Message rows: chat icon + name (existing) `·` space icon + name.
- Global object rows have no highlight/context snippet (no meta in the RPC) — name/snippet
  render plainly.

### Opening results

- Objects: existing `U.Object.openEvent`. `U.Object.route()` already embeds the object's
  `spaceId`, and `U.Router.go` switches space when it differs from the current one — no new
  routing code.
- Messages: same as in-space — open the container with `_routeParam_: { messageId }`; the
  container object from `chatGlobal`/`discussionGlobal` carries its `spaceId`, so the space
  switch + open-at-message compose for free.

### Disabled in global mode

- Backlink flow (object-graph is per-space).
- Settings / import / pages sections.
- Actions section (creation targets a specific space — out of scope v1; the in-space popup
  keeps it).
- Storage: global mode persists `filter`/`searchType` under separate keys
  (`filterGlobal` / `searchTypeGlobal`) so the two popups don't clobber each other's state.

## Files

| File | Change |
|---|---|
| `middleware/` (generated) | regenerate from worktree (`generate:protos` with `HEART_DIR`) |
| `src/ts/lib/api/service.ts` | regenerated registry entry (automatic) |
| `src/ts/lib/api/command.ts` | `ObjectCrossSpaceSearch` command |
| `src/ts/lib/api/response.ts` | `ObjectCrossSpaceSearch` response (`records`, `allStoresLoaded`) |
| `src/ts/component/sidebar/page/vault.tsx` | search icon in header |
| `src/ts/component/popup/search.tsx` | `isGlobal` mode: chips set, loads, retry loop, space captions, disabled sections, storage keys |
| `src/scss/popup/search.scss` | space caption styles (icon + name in caption line) |
| `src/json/text.json` | chip labels, tooltip key |

## Edge cases

- Retry timer must not stack: one in-flight query at a time; a new filter/chip/page action
  cancels the pending retry.
- `allStoresLoaded` only applies to object mode; `ChatSearch` has no store warm-up flag (the FT
  index is global) — messages need no retry loop.
- Old middleware (no `CrossSpaceSearch`): dispatcher returns an unknown-method error → empty
  state; the vault icon is still shown (dev builds pair with the matching heart).
- A space deleted between search and click: `Router.go`/`switchSpace` error path handles the
  missing space; row renders without space caption if the spaceview is gone.
- `skipIds`/`onObjectSelect` are never combined with `isGlobal` (picker flows are space-scoped).

## Testing

- `bun run typecheck`, `bun run lint`.
- Manual (web mode + worktree middleware): second space with chats needed to verify space
  captions, cross-space routing, and the `allStoresLoaded` retry (visible right after app
  start, before all stores warm up).
