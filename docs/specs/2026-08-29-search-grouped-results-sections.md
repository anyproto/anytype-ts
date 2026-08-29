# Spec: grouped Types in vault-wide search + sectioned mixed results

Date: 2026-08-29 (rev 3: grouped-row clicks focus the group — inside the Types chip too.
A grouped row has exactly two verbs: **click** shows the actual type/person in every space
(the focused per-space instance listing); the **drill icon** filters objects by that type /
creator across every Channel. The focus rides as a session-transient payload on the
what-token; rev-2's bare token-add click is superseded)
Status: implemented on `feature/JS-9865-cross-space-search-people` (PR #2358)

Rev 4 addendum (2026-08-29, post-review): the "Create 1-1 Channel" caption moved off the
person row into a focused-listing suggestion that opens the participant menu (Connect
confirms); person rows wear an 85% avatar on the member circle badge (`.personBadge` —
"No SCSS changes" below is superseded), every row of the focused people listing included;
the recents browse groups by date (Today / Yesterday / Previous 7 and 14 days /
month+year, keyed to the LOADED mode's order and query so quiet-reload windows never
bucket text-ordered rows; first header states the full logic and carries the sort
switch); footer shortcuts regrouped (→ selection-tracked in Refine, "+" combos, Shift
swaps Open→Filter, Cmd+Alt+L deeplink with an Alt-held hint swap); the focus payload and
a later-added scope persist across quick reopens — a focus restores only into scope-less
opens (a scoped open degrades it to the bare token) and its representative re-resolves
when the cross-space maps land; a scope add makes ANY focused what-token yield; the
focused people pick lands creator + scope in one mutation (one RPC, snapshot-chain-safe);
a 400ms hold-the-top guard pushes back late native scroll deliveries after list swaps.
Builds on: `docs/specs/2026-08-20-global-cross-space-search.md`,
`docs/specs/2026-08-21-search-filter-tokens.md`, and the JS-9865 branch state (person rows
injected from the cross-space participants subscription, participants excluded from the
cross-space RPC, two-rows-per-1:1-person model, `peopleMatchLimit` 3/10 rule).

## Product ask (Roman, 2026-08-29)

Searching "task" vault-wide floods the list with one "Tasks · Type · in \<Channel\>" row per
space — the same per-space duplication people had before JS-9865. Group type results by
`uniqueKey` the way people are grouped by identity:

1. Exclude type objects from the cross-space query; inject grouped type rows via substring
   match instead. Up to 3 type matches for queries of 3 letters or fewer, up to 10 from four letters.
2. Clicking a grouped type row **expands** the search — switch to Types mode so the user
   sees this type in every space and can select the concrete instance. The expanded view
   keeps an option to search objects of this type in all Channels.
3. The row's search (drill) icon filters objects of this type across spaces, as the Types
   mode drill already does.
4. Do the same expand logic for people.
5. Introduce sections in the result list — **Channels, People, Types** — for this kind of
   mixed results.

## Design

### 1. Sectioned injected groups

The global plain-text search (no filter tokens, non-empty query) injects up to three labeled
groups ahead of the object results, in this order:

| Section | Source | Limit | Row |
|---|---|---|---|
| **Channels** | `matchSpaces` over the vault list (unchanged) | 3 | Channel row (`isSpaceRow`), 1:1s included |
| **People** | participants map, deduplicated by identity (unchanged) | 3 / 10 | person row (`isPersonMatch`) |
| **Types** | types map, grouped by `uniqueKey` (new injection) | 3 / 10 | grouped type row (`isTypeAgg`) |

- A section header (existing `isSection` row) renders only when its group has matches:
  `popupSearchTypeChannels`, `popupSearchTypePeople`, `popupSearchTypeTypes`.
- When at least one group rendered, the object results below get an **Objects** header
  (`commonObjects`) so the mixed list reads as sections all the way down; with no group
  matches the list stays flat as today.
- Sections are presentation only: keyboard navigation already skips `isSection` rows, the
  measurement cache already keys them by `section-<name>` (all four names distinct), and the
  whole injected block lives in the existing per-query `injectCacheRef` memo.
- Empty-query browse, pickers (`onObjectSelect`), token-filtered searches and foreign-Channel
  scope are untouched — injection still requires `filter && modeGlobal && !mode.tokens`.

### 2. Types group

- **RPC exclusion:** `loadGlobalObjects` adds `resolvedLayout NotIn [Type]` exactly when the
  Types group is injected (global mode, no tokens, non-empty query). Token-filtered searches
  keep returning per-space type objects as today (a backlink token may legitimately point at
  a type). The existing empty-browse type exclusion stays.
- **Matching:** the existing `getGlobalTypeAggregate(text)` (name/pluralName substring over
  `GLOBAL_DEPS.types`, hidden/template/deleted filtered, grouped by `uniqueKey`, usage-recency
  order) sliced by the shared limit rule. Row shape and caption are the aggregate's
  ("in \<Channel\> + N other Channels") — the same row the Types bucket renders.
- **Limit rule shared with People:** `peopleMatchLimit` is renamed `groupMatchLimit`
  (searchMatch.ts, tests updated): trimmed query of 3 letters or fewer → 3, from four letters → 10.
  Channels keep their own cap of 3.

### 3. Click = focus the group (Types)

A grouped type row — in the injected Types section *and* inside the Types chip — carries
two verbs:

- **Click**: focus the group. A drill-style gesture (`fromRow`: Back snapshot, query
  cleared) that sets the what-token to the Types kind carrying a **focus payload**
  `{ uniqueKey, name, object }` in the token's object. The Types-bucket loader, when the
  token is focused, lists that `uniqueKey`'s instances — one ordinary type-object row per
  space, vault order, standard "Type · in \<Channel\>" caption — served synchronously from
  `GLOBAL_DEPS.types` (the same in-memory path as the aggregate; no RPC). Unfocused, the
  bucket keeps today's grouped aggregate; text search in the bucket stays grouped (browse
  intact). Typing while focused filters the instances by Channel name. Clicking a concrete
  instance opens that space's type object.
- **Drill icon**: unchanged — type token by `uniqueKey` → objects of this type across every
  Channel. The same drill sits on the focused instance rows, so "search it in all Channels"
  stays one gesture away after focusing.

Exit: token × or Backspace-at-0 pops the Back snapshot and restores the exact view the row
was clicked in (mixed sections or the grouped bucket, query included). The focus payload is
session-transient — tokens persist as bare `{ kind, id }`, so a reopen degrades to the
grouped Types chip. The token pill renders the focused type's name.

**Top suggestion — the way back out wide** (added same day per Roman): the focused listing
leads with a suggest row **"Search \<Type\> in all Channels"** that applies the very filter
the grouped row's drill icon offered before focusing (type token by `uniqueKey` → objects
across every Channel). Without it the user who focused but wanted the object filter would
have to Back out and re-drill. Drill-style: Back from the filter restores the focused view.
People mirror it with **"Search objects created by \<person\> in all Channels"** (creator
token; the focused member token is stripped silently in the same step — the two would AND
into an empty set, participants not being authored).

### 4. Click = focus the group (People)

Symmetric, and **supersedes the 2026-08-29-morning decision** that a person-row click opens
the participant menu:

- **Click** on a person row focuses the person: the what-token becomes the member type
  (`S.Record.getTypeByKey(J.Constant.typeKey.participant)`) with a focus payload
  `{ identity, name, object }`; the listing shows that person's participant object in every
  shared space (from `GLOBAL_DEPS.participants`, synchronous, vault order, filtered by
  identity — exact, no name-collision fuzziness). The pill renders the person's name.
- **The person's 1:1 Channel leads the focused listing** as its own Channel row (open it,
  search inside it via the space drill) and replaces the participant record from within
  that space — the user may want to search in the 1:1 as well. Scoping from here (the 1:1
  row's drill, a space caption) makes the focused member token yield before the boundary
  crossing maps it — the intent is "search in this Channel", not "search members in it";
  an explicit unfocused "/is Space member" still combines with a scope.
- **Enter/click on a row filters, never opens** (iterated same day per Roman): each row
  applies the creator token PLUS that row's Channel scope — the listing is "pick the
  Channel to filter their objects in", titled by the section header **"Filter by objects
  created in Channels"**; the top suggestion covers all Channels. The 1:1 Channel row
  filters inside the 1:1 the same way (it no longer opens on Enter — its drill icon keeps
  the scope-only "search in this Channel"). The participant menu stays reachable wherever
  members appear outside the focused listing. `addToken` makes a member-type what-token
  yield whenever a creator token is added (they would AND into an empty set — participants
  are not authored), which also covers the focused rows' drill icon.
- **Drill icon**: unchanged — creator token → objects created by them across every Channel;
  also present on the focused per-space rows.
- An unfocused member-type token ("/is Space member") keeps today's RPC listing.
- The "Create 1-1 Channel" caption stays on person rows without a 1:1 (the path is now
  focus → concrete member → Connect). The 1:1 Channel row (Channels section) is unaffected.

### 5. Analytics

Expand clicks emit the existing `SearchToken` add with a new source `Group` (plus the
`SearchDrill` alias only for actual drills, which are unchanged). `SearchResult` keeps
firing on opens.

## Decisions to confirm in review

1. **Person click → expand replaces person click → participant menu** (point 4). The menu
   stays one level deeper. Confirm the supersession.
2. The **Objects** header appears only in mixed (grouped) lists — flat lists stay unlabeled.
3. Injected type rows keep the aggregate caption style ("in \<Channel\> + N other Channels")
   rather than People's "member in N Channels" — consistency with the Types bucket wins.

## Implementation notes

- `src/ts/lib/searchMatch.ts`: rename `peopleMatchLimit` → `groupMatchLimit` (+ tests).
- `src/ts/component/popup/search.tsx`:
  - `getTypeMatches(text)` = `getGlobalTypeAggregate(text).slice(0, groupMatchLimit(text))`
    marked `isObject`; the injected block becomes Channels + People + Types with section
    rows, still under `injectCacheRef`; the Objects header is appended outside the cache
    (it depends on the RPC list being non-empty).
  - RPC exclusion arm for `Type` next to the participant one, gated on the injection
    condition (global, no tokens, non-empty query).
  - `onClick`, before the popup closes: `isTypeAgg` rows and `isPersonMatch` rows call
    `addToken(..., { source: 'Group', fromRow: true })` with the focus payload on the
    token's object. `addToken`'s same-token early return learns to treat a differing focus
    as a replace (focusing from inside the unfocused bucket re-uses the same kind+id).
  - Loader: new synchronous branches `getGlobalTypeInstances(uniqueKey, text)` and
    `getGlobalPeopleInstances(identity, text)` over the cross-space maps, stamped
    `isTypeInstances` / `isPeopleInstances` in the mode; the repeated synchronous-swap
    boilerplate (command list, Channels bucket, Types aggregate) is extracted into one
    `swapSync` helper. Focused listings get a section header named after the focus.
  - `TokenItem` renders the focus name (and the person's icon) when a focus is present.
- No SCSS changes; instance rows are ordinary object rows.
- E2E: extend `specs/search/cross-space-people.md` in anytype-desktop-suite (sections render,
  type grouping, focus flow) — multi-space scenarios stay manual.
