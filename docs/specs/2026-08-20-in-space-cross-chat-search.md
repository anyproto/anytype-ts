# Spec: in-space cross-chat search in the global search popup

Date: 2026-08-20
Status: implemented (this session); typecheck/lint/build green; E2E smoke against the PR
middleware (web mode + Playwright) run the same day
Backend: anytype-heart PR [#3245](https://github.com/anyproto/anytype-heart/pull/3245) (GO-7449),
local worktree `../anytype-heart_crosschat`, heart spec `docs/fts/SpecChatSearchScopes.md`.

## Product ask

Extend the existing space search popup (`PopupSearch`) with a type selector under the search
input (Linear-style chips):

1. **Chips row**: `All objects` (default) · `Messages` · `Media` · then every other type, in the
   same order as the sidebar Types widget. Horizontally scrollable, fade-out gradient on the
   right edge.
2. **Messages chip** → call the (now cross-chat capable) `ChatSearch` RPC with empty `chatId`
   (= all chats in the space). Result rows show the message, the chat it was posted in, and the
   author.
3. **Empty search string in Messages mode** → browse latest messages in the space, sorted by
   date desc (backend supports this natively).

## Backend contract (heart PR #3245)

`Rpc.Chat.Search.Request { spaceId, chatId, sorts, fullText, offset, limit }`:

| spaceId | chatId | scope |
|---|---|---|
| set | set | one chat (existing behavior) |
| set | empty | **all chats in the space** ← what we use |
| empty | empty | all spaces (not used here) |

- Empty `fullText` **browses** latest messages in scope, default sort `CREATED_AT desc`.
- Non-empty `fullText` is a relevance search, default sort `SCORE desc` with deterministic
  `(chatId, messageId)` tiebreak. Offset pagination is stable.
- `model.Search.Message.Result { chatId, messageId, score, highlight, highlightRanges, message, spaceId }`.
  `chatId` is the id of the message container object: a **chatDerived** object (heart layout 22 ==
  `I.ObjectLayout.Chat`) or a **discussion** object (layout 27 == `I.ObjectLayout.Discussion`).
- Deleted chats are filtered server-side; per-chat hydration failures are skipped, not fatal.
- `ORDER_ID` sort is only meaningful within a single chat — never pass it for space scope.

Frontend plumbing already exists and needs no proto regeneration:
- `C.ChatSearch(spaceId, chatId, fullText, offset, limit, sorts, callBack)` (`command.ts:1998`).
- `Response.ChatSearch` → `Mapper.From.ChatSearchResult` (maps `chatId`, `messageId`, `highlight`,
  `highlightRanges`, `message`). We additionally map `spaceId` for forward compat (undefined on
  old middleware — harmless).

**Compatibility**: against a middleware without PR #3245, empty `chatId` returns an error or
nothing (heart filtered all hits before this PR). The popup degrades to the empty state; no crash.

## UI

### Chips row

- Rendered inside the popup, directly under the `.head` filter row, above `.items`.
- Items, in order:
  1. `all` — `translate('popupSearchTypeAll')` ("All objects") — default.
  1b. `mine` — "My objects" (added later): objects created by or last edited by the current
     account — `Or(creator In [participantId], lastModifiedBy In [participantId])`. Same
     Actions section as All ("Create Object" + "Add file"), plain "Recent Objects" title.
  2. `message` — `translate('popupSearchTypeMessages')` ("Messages"). Shown only when the
     space has at least one chat or discussion (checked against the always-on per-space
     `subId.chat` / `subId.discussion` subscriptions); a persisted `message` selection in a
     space without any falls back to All objects.
  3. `media` — `translate('commonMedia')` (existing key).
  4. One chip per type from `U.Data.getWidgetTypes()` (same source + `S.Record.sortTypes` order
     as the sidebar Types widget), **excluding** types whose `recommendedLayout` is a file layout
     (covered by Media) or a chat layout (`Chat`, `ChatOld`, `Discussion` — covered by Messages).
     Label: `U.Object.name(type, true)` (plural name), text-only pills, no icons.
- Layout: single-line row, `overflow-x: auto` with hidden scrollbar; `::after` fade overlay on
  the right (`linear-gradient(to right, transparent, var(--color-bg-primary))`,
  `pointer-events: none`). Revised after E2E: the fade is shown only while content is actually
  scrolled out of view (`.withFade` toggled from scroll/render). Vertical mouse wheel is
  translated to horizontal scroll.
- Chip styling follows the settings-tabs pattern: inactive = no background +
  `--color-text-secondary`; hover/active = `--color-shape-highlight-medium` background, active
  also switches to `--color-text-primary`. (Revised after E2E: the initial tertiary-vs-highlight
  grey pairing was visually indistinguishable.) No custom cursor (project rule).
- Keyboard (revised after research pass): focus stays in the input (command-palette convention);
  `Tab` / `Shift+Tab` cycles the active chip forward/backward with wrap-around and immediate
  activation, scrolling the new active chip into view. Plain arrows are untouched (Up/Down =
  result list, Left/Right = caret). ARIA: the row is `role="tablist"`, chips are `role="tab"`
  with `aria-selected`. The popup footer shows a "Tab — Switch filter" hint. In picker mode
  (`onObjectSelect`) Tab is inert (chips hidden).

### State

- Selected chip id is kept in a ref + dummy state (same pattern as the rest of the popup) and
  persisted in the popup storage next to `filter` (`storageSet({ searchType })`), restored on
  open. Unknown persisted id (deleted type) falls back to `all`.
- Switching chips: clears the backlink state (backlink search is object-only), resets
  `n/offset/top`, reloads, keeps the filter text.
- Switching is flicker-free (revised after review): the reload is "quiet" — no loader overlay,
  the previous list stays on screen (rendered by the mode it was loaded for, tracked
  separately from the selected chip) and is swapped in one re-render when results arrive.
  `Item`/`Footer`/`Context` render via function calls and `Shortcut` is module-level, so no
  component identity changes force DOM remounts on re-render.

### Result rows — Messages mode

Reuses the visual language of the existing rows (`.item` in `popupSearch`) and of
`menu/search/chat.tsx`:

- Icon: author avatar — `IconObject` of the participant
  (`U.Space.getParticipant(U.Space.getParticipantId(space, message.creator))`).
- Line 1: author name + message date (`showRelativeDates ? dayString : dateWithFormat`, same as
  the chat search menu).
- Line 2: highlight with `<span class="highlight">` ranges (sanitized, same builder as
  `menu/search/chat.tsx`); falls back to `message.content.text`; empty text falls back to the
  attachment/empty placeholder if trivially available, otherwise stays empty.
- Line 3 (caption, where object rows show the type): the chat this message belongs to — chat
  object icon + name.
- Section header when the filter is empty: `translate('popupSearchRecentMessages')`
  ("Recent Messages"), mirroring "Recent Objects".
- Empty result set → existing `EmptySearch`.

### Chat attribution & navigation

`result.chatId` resolves to an openable object:

- **Chat** (`resolvedLayout == I.ObjectLayout.Chat`): the chat object id IS `result.chatId`.
  Primary source: records of the space chat subscription
  (`U.Subscription.spaceSubId(J.Constant.subId.chat)`).
- **Discussion** (layout 27): parent object id =
  `S.Chat.discussionParentMap.get(space)?.get(result.chatId)`; row shows the parent object.
- Ids not resolvable from either source are batch-fetched once per load via
  `U.Subscription.subscribeIds` (no-deps, popup-scoped subId) so names/icons still render.
  Rows whose container object can't be resolved at all render without the chat caption and open
  nothing on the caption — the row click still tries the chat id directly.

Click on a message row: `close()` then `U.Object.openEvent(e, containerObject, { messageId })`.
- Chat page: `block/chat.tsx` reads `match.params.messageId` and loads/scrolls/highlights.
- Discussion parent: `editor/page.tsx` passes `messageId` into the comments section, which
  loads around the message and scrolls to it.

### Other modes

- **All objects**: existing behavior, untouched (including settings/import/actions sections,
  backlink flow, create-object action).
- **Media**: object search (`C.ObjectSearchWithMeta`) with an extra filter
  `resolvedLayout In U.Object.getFileLayouts()`.
- **Type chip**: extra filter `type.uniqueKey Equal <uniqueKey>`.
- Settings/import/pages sections are shown **only** in All objects mode. The Actions section
  (revised after review) appears in every object mode, with per-mode content mirroring the
  `U.Menu.typeSuggest` creation dispatch:
  - All objects: "Create Object [name]" + "Add file" (unchanged);
  - Media: "Add file" (upload popup, `U.Menu.onFileUploadPopup`);
  - Type chip: "Create <Type> [name]" — bookmark-layout types open the bookmark-creation menu
    (screen-centered `dataviewCreateBookmark`), all others `C.ObjectCreate` with the type's
    uniqueKey/defaultTemplateId, name prefilled from the filter, then open the new object.
    File/chat layouts never appear as chips (covered by Media/Messages), so those typeSuggest
    branches are not needed;
  - Messages: no actions section.
  - The `createObject` keyboard shortcut triggers the active tab's create action (typed create
    on a type chip, upload on Media, default create on All/Messages), and its symbols are shown
    as the caption on each tab's create row.
- Messages mode paginates with the standard `InfiniteLoader` flow
  (`offset += J.Constant.limit.menuRecords`, limit 100), including the empty-filter browse.

## Sorts

- Messages mode always sorts `[{ key: CreatedAt, type: Desc }]` — for empty filter (requirement
  3) and for text searches alike. Revised after E2E: the backend's default `SCORE desc` +
  `(chatId, messageId)` tiebreak groups equal-score hits per chat, which reads as arbitrary
  grouping; recency is consistent with the empty-query browse and the single-chat search menu.
- Object modes: existing sorts unchanged.

## Analytics

- Chip switch: `analytics.event('SwitchSearchType', { type, route })` where type ∈
  `all | message | media | type`.
- Existing `SearchInput` / `SearchResult` / `ScreenSearch` events unchanged; message row clicks
  emit `SearchResult` like object rows.

## Files

| File | Change |
|---|---|
| `src/ts/component/popup/search.tsx` | chips row, per-mode `load()`, message row renderer, message click/navigation, storage of `searchType` |
| `src/scss/popup/search.scss` | chips row (scroll + fade), active chip, message row styles |
| `src/json/text.json` | `popupSearchTypeAll`, `popupSearchTypeMessages`, `popupSearchRecentMessages` |
| `src/ts/lib/api/mapper.ts` | add `spaceId` to `ChatSearchResult` (forward compat) |

No changes to command/response/dispatcher layers; no proto regeneration needed.

## Edge cases

- Backlink state active → selecting any chip clears it (and its storage), keeps filter.
- `archiveObject` window event filters items by id — message ids never collide; no-op.
- Enter on a message row opens the chat; `cmd+L` (copy link) stays object-only.
- URL paste + Enter keeps its route behavior regardless of mode.
- Old middleware (no PR #3245): error → loading off, empty state.
- Types list is reactive per open; chips are computed on render from `U.Data.getWidgetTypes()`.

## Testing

- `bun run typecheck`, `bun run lint`.
- Manual: requires middleware built from `../anytype-heart_crosschat`.
- Follow-ups per repo rules after implementation: `/dark-mode-check` (SCSS), `/update-docs`
  (popup README), `/qa-engineer` (E2E plan) — pending middleware availability in the suite.
