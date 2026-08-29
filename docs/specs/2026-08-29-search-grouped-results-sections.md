# Spec: grouped Types in vault-wide search + sectioned mixed results

Date: 2026-08-29
Status: spec for review; implementation to follow on `feature/JS-9865-cross-space-search-people` (PR #2358)
Builds on: `docs/specs/2026-08-20-global-cross-space-search.md`,
`docs/specs/2026-08-21-search-filter-tokens.md`, and the JS-9865 branch state (person rows
injected from the cross-space participants subscription, participants excluded from the
cross-space RPC, two-rows-per-1:1-person model, `peopleMatchLimit` 3/10 rule).

## Product ask (Roman, 2026-08-29)

Searching "task" vault-wide floods the list with one "Tasks · Type · in \<Channel\>" row per
space — the same per-space duplication people had before JS-9865. Group type results by
`uniqueKey` the way people are grouped by identity:

1. Exclude type objects from the cross-space query; inject grouped type rows via substring
   match instead. Under 3 query letters up to 3 type matches, 3+ letters up to 10.
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
  (searchMatch.ts, tests updated): trimmed query under 3 letters → 3, otherwise → 10.
  Channels keep their own cap of 3.

### 3. Click = expand (Types)

Clicking a grouped type row is a drill-style gesture (Back snapshot, query replaced):

- adds the **Types kind token** (`SEARCH_TYPE_TYPE`) and sets the query to the type's name.
- **Types-bucket listing with a non-empty query renders expanded**: matching groups emit one
  row per space instance (ordinary type object rows — the standard cross-space
  "in \<Channel\>" caption identifies the space), group order preserved, instances within a
  group in vault order. An empty query keeps today's grouped aggregate. `/type` command
  completions stay grouped regardless (a completion pick wants one token, not an instance).
- Each expanded group is led by one suggest row — **"Search \<Type\> objects in every
  Channel"** — which adds the type token by `uniqueKey` (identical to the drill icon), so the
  all-Channels option survives expansion.
- Selecting a concrete instance opens that space's type object (existing object-row click).
- The grouped row's **drill icon** keeps today's behavior: type token by `uniqueKey` →
  objects of this type across every space.

### 4. Click = expand (People)

Mirrors Types, and **supersedes the 2026-08-29-morning decision** that a person-row click
opens the participant menu:

- Clicking a person row adds the **member type token** (the bundled participant type,
  `S.Record.getTypeByKey(J.Constant.typeKey.participant)`, filtered by `uniqueKey` so it
  works cross-space) and sets the query to the person's name — the member search keeps
  participants in the RPC (`isMemberWhat`), so the list shows that person once per space.
- The expanded view is led by **"Search objects created by \<person\> in every Channel"** —
  adds the creator token (same as the person row's drill icon).
- Clicking a concrete per-space participant row opens the participant menu (participant
  layout routing) — the menu moves one level deeper rather than disappearing.
- Known softness: the expansion query is the person's *name*, so same-named strangers can
  appear in the expanded list. Accepted — the query stays visible and editable, and an exact
  identity filter would be invisible state outside the token model.
- The "Create 1-1 Channel" caption stays on person rows without a 1:1; creating one remains
  the participant menu's Connect button (now reached via a concrete instance row).
- The 1:1 Channel row (Channels section) is unaffected.

### 5. Analytics

Expand clicks emit the existing `SearchDrill`/`SearchToken` pair with a new source `Group`;
the suggest rows emit source `Expanded`. `SearchResult` keeps firing on instance opens.

## Decisions to confirm in review

1. **Person click → expand replaces person click → participant menu** (point 4). The menu
   stays one level deeper. Confirm the supersession.
2. The **Objects** header appears only in mixed (grouped) lists — flat lists stay unlabeled.
3. Injected type rows keep the aggregate caption style ("in \<Channel\> + N other Channels")
   rather than People's "member in N Channels" — consistency with the Types bucket wins.

## Implementation notes

- `src/ts/lib/searchMatch.ts`: rename `peopleMatchLimit` → `groupMatchLimit` (+ tests).
- `src/ts/component/popup/search.tsx`:
  - `getTypeMatches(text)` = `getGlobalTypeAggregate(text).slice(0, groupMatchLimit(text))`;
    injected block becomes Channels + People + Types with section rows, still under
    `injectCacheRef`.
  - RPC exclusion arm for `Type` next to the participant one.
  - Types-bucket loader: non-empty query → new `getGlobalTypeInstances(text)` (expanded
    per-space rows + leading suggest rows); empty query → aggregate as today.
  - `onClick`: grouped type row (`isTypeAgg` outside the Types bucket) and person row
    (`isPersonMatch`) become expand gestures via `addToken(..., { fromRow: true })` + query
    set; suggest rows add their token.
- No SCSS changes expected (sections and rows reuse existing styles).
- E2E: extend `specs/search/cross-space-people.md` in anytype-desktop-suite (sections render,
  type grouping, expand flow) — multi-space scenarios stay manual.
