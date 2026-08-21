# Spec: search filter tokens — removable scope/filter chips inside the search input

Date: 2026-08-21 (rev 2: chips reworked into token setters — Gmail search-chips model)
Status: spec for review; implementation to follow
Builds on: `2026-08-20-in-space-cross-chat-search.md`, `2026-08-20-global-cross-space-search.md`,
`2026-08-20-search-drilldown-type-creator.md` (all shipped in v0.56.6-beta, PR #2349).
Research basis: GitHub's in-input scope token (Backspace removes it → all of GitHub); GitLab's
finding that a right-side scope dropdown goes unnoticed — scope must be *stated in the input*
and removable in one action; **Gmail search chips** — the chips row as one-click filter setters
that combine across kinds, replace within a kind, and toggle off on a second click; Slack /
macOS token fields — contextual typed completions (`from:@…`, `in:#…`) converting to filters.

## Product ask

1. The current Channel is a **removable token inside the search input**. Removing it switches
   the popup to **global (cross-space) search in place** (different chips logic).
2. Every drill filter becomes a token: **Type**, **Created by**, **Related to** (backlink).
   The pinned section headers + "Clear" go away.
3. Tokens **combine across groups** (AND): `[Channel] [Task] [by Kaye]`. Within a group they
   **replace**: pressing "My objects" while `[by Kaye]` is active swaps the creator token.
4. **Chips stop being a mode switch and become token setters** — the Gmail model. A chip's
   active state means "my token is present"; the chips row is a mirror of the token bar for
   the common cases. `searchType` disappears as separate state.
5. In cross-space results the **space caption on a row is clickable** → adds that Channel as
   the scope token.
6. **Backspace with the caret at position 0 removes the rightmost token** (confirmed).

## Token model

```ts
type TokenKind = 'space' | 'kind' | 'type' | 'creator' | 'backlink';
interface Token { kind: TokenKind; id: string; object?: any; }
// space:    a Channel (spaceview target)          — the scope
// kind:     a layout bucket (message|media|page|bookmark|collection|query|chat|typeLayout)
// type:     a specific type object (uniqueKey filter)
// creator:  a person (identity filter); You included
// backlink: related-objects pivot (in-space only)
```

- `tokensRef.current: Token[]` in insertion order; the space token renders first.
- **Exclusivity groups** — at most one token per group; adding another replaces in place:

| Group | Kinds | Meaning |
|---|---|---|
| scope | `space` | where |
| what | `kind`, `type` | what sort of result (a specific type is a narrower "what" than a bucket — same slot) |
| who | `creator` | made by |
| relation | `backlink` | related to |

- Persisted as `storage.tokens = [{ kind, id }]`; resolved on open (space → spaceview store;
  kind → static; type → `S.Record.getTypeById` / `GLOBAL_DEPS.types`; creator → participant
  store / `GLOBAL_DEPS.participants`; backlink → `U.Object.getByIds`). Unresolvable tokens are
  dropped silently. Legacy `searchType`/`drill` storage migrates once into tokens.

## Chips = token setters (replaces the old chip-switch semantics)

The chips row keeps its place and look; its behavior changes:

| Chip | Action on click |
|---|---|
| All objects | removes the *what* token (the empty state — All is not a token) |
| Messages / Media / Pages / Bookmarks / Collections / Queries / Chats / Types (global buckets) | sets `kind` token (replacing any what-token) |
| per-type chips (in-space, Types-widget order) | sets `type` token — **the same token a type drill from a row produces**; one system |
| My objects | sets `creator: You` (replacing any creator token — the Kaye → You example) |
| Members | **picker, not a filter**: shows the people list; choosing a person (→ / click / Enter) adds their `creator` token |

- Active chip = its token is present. Clicking an **active** chip removes its token (Gmail's
  toggle — also a discoverable removal path besides `×`/Backspace).
- Chips never touch other groups: pressing Media keeps `[by Kaye]` and `[Channel]`.
- Tab / Shift+Tab cycles the **what** group (All → … → All); the creator/member chips are
  reachable by click, `/`, or their tokens — Tab stays a single-axis cycle.
- The type drill and the per-type chip converge: `getSearchType`, chip gating and
  `itemsModeRef`'s string mode collapse into token rules (`itemsModeRef` becomes the token
  signature the current list was loaded for).
- The "which chips are visible" gates stay: Messages needs chat containers, Members needs >1
  member; a type chip for the active `type` token renders active even if that type is not in
  the widget list (the token is the source of truth, the chip row highlights best-effort).

## The space token and the two modes

| Space token | Mode | Chips | Object loader | Messages | Members picker |
|---|---|---|---|---|---|
| = current space | **in-space** (today's default) | All / Mine / Messages / Media / Members + widget types | `ObjectSearchWithMeta(space)` | `ChatSearch(space, '')` | space participants |
| none | **global** | All / Mine / Messages / Pages / Members / Media / Bookmarks / Collections / Queries / Chats / Types | `ObjectCrossSpaceSearch` | `ChatSearch('', '')` | GLOBAL_DEPS aggregate |
| = another space | **global + space filter** (new) | global chips | `ObjectCrossSpaceSearch` + `spaceId Equal` | `ChatSearch(Y, '')` | GLOBAL_DEPS filtered to Y |

`isGlobal = !spaceToken || (spaceToken.id != S.Common.space)` — derived state, not a popup
param. Only the current space gets the rich in-space mode (widget-type chips, highlights,
settings rows, per-chip create actions); any other space is a filter on the cross-space path.
Removing/adding the space token switches **in place** — no close+reopen, no storage handoff.
On the in-space ⇄ global boundary the what-token maps: a `type` token maps to its layout
bucket (`recommendedLayout` → `kind`, the shipped `getGlobalSearchType` logic); a `kind` token
maps back to itself where the in-space row offers it, else clears.

## Rendering (popup head)

```
[🔍] [◉ Anytype Team ×] [▤ Task ×] [◯ Kaye ×]  |Search…
```

- Tokens sit left of the text, between the search icon and the input (input keeps `flex: 1`
  with a min width; token labels ellipsize past a max width).
- Token visuals: the chip-pill family (highlight-medium bg, 14px radius, text-small) with a
  16px icon (space icon / type icon / avatar / backlink arrow) and a trailing `×`. Exact
  values are a design call; the constraint is that tokens and chips read as one system.
- Labels: space → Channel name; kind → bucket name; type → type name; creator → name
  ("You" for self); backlink → `Related to: <name>`.
- Placeholder shrinks to `commonSearch` when tokens are present.

## Adding tokens

| Gesture | Token | Notes |
|---|---|---|
| chip click | per the chips table above | no snapshot pushed (not a drill) |
| → / Shift+Enter on a type row · click type in a caption | `type` | as shipped |
| → / Shift+Enter on a participant row · click "by <name>" · click a message author · pick from Members | `creator` | as shipped |
| → / Shift+Enter on a row with links/backlinks | `backlink` | in-space and global |
| **click the space caption on a global row** (object or message) | `space` | current space → in-space mode; other → global + filter |
| Cmd+K entry | ensures `space` = current | entry point sets the scope |
| Cmd+Shift+K · vault icon · "Search across all Channels" action | removes `space` | in place |
| `/` completions | see below | |

Query interaction: adding a **filter** token *from a row* clears the query (the row was found
by the old query; the new search is about the drilled thing — today's drill behavior). Adding
a token **from a chip** and adding/removing the **space** token keep the query (narrowing or
widening the same search — the research's widen case).

### `/` contextual completions (the typed path — Slack pattern)

`/` mode grows from "chips + actions" into completions that resolve to tokens:

- `/by <text>` → people suggestions (participants map / GLOBAL_DEPS); Enter → `creator` token
- `/type <text>` → type suggestions; Enter → `type` token
- `/in <text>` → Channel suggestions; Enter → `space` token (global-reachable spaces)
- bare `/<text>` keeps matching chips and actions as today (chips now add tokens)
- `/channel` → remove the space token (go global); `/here` → set current space

Single-match + Enter auto-applies, as today. Gmail-style *adaptive* suggestions (offering
"by Kaye" because the current results skew toward Kaye) are deliberately v2.

## Removing tokens

| Gesture | Effect |
|---|---|
| click `×` on a token | removes that token |
| **Backspace, caret at 0, no selection** | removes the **rightmost** token |
| click an active chip | removes that chip's token |
| Escape | removes all *filter* tokens (what/who/relation) — never the scope; if none, closes |
| Tab cycle to All | removes the what token |

Removing the space token = switch to global in place, same query re-run vault-wide.

v1 keyboard is deliberately minimal: Backspace pops rightmost only. The full token-selection
model (← at 0 focuses tokens; ←/→ walk; Backspace/Delete/Enter remove the selected one) is a
**fast-follow**, not v1 — it layers on without changing anything else.

## Combination semantics (all ANDed)

- `space` → loader choice + `spaceId Equal` on the cross-space path
- `kind` → `resolvedLayout In <bucket>` (global buckets; in-space Media the same, Messages
  switches the loader to `ChatSearch`)
- `type` → `type.uniqueKey Equal` (cross-space safe)
- `creator` → `creator In [ per-space participant ids…, identity ]`; the chat-container
  exclusion (`Chat/ChatOld/Discussion NotIn`) applies to **any** creator token, not just You
  (chat containers all carry the space creator — noise for every "who" filter)
- `backlink` → `id In links+backlinks`
- Messages kind: `ChatSearch(spaceOrEmpty, '', text, …, creators)` honours space + creator;
  type/backlink tokens do not apply to messages and are visibly ignored (they stay in the bar)
- Empty-browse section titles and the edited/created order toggle key off the **what** token
  (bucket orders as shipped: media → Recently added, chats → Recently active, …)

## Back-restore

Stack, as shipped, with one clarification: only tokens added **from a row** (drills, caption
clicks, Members pick, space-caption click) push a snapshot (chip/query/depth/scroll/active
row); chip- and entry-point-added tokens do not. Removing the most recently row-added token
(×, Backspace, Escape-as-last) pops its snapshot; removing others just reloads.

## Mode switch in place (structural)

- `isGlobal` → state derived from tokens; the ~42 reads keep working, only the source changes.
- One storage set (`tokens`, `filter`, `recentSort`, `lastUsed`); `*Global` keys and
  `searchType` become one-shot migrations.
- `subscribeGlobalDeps` starts on first entry into global mode (open or in-session).
- Entry points set the initial space token (`param.data.isGlobal` accepted as an alias).
- `keyboard.ts` unchanged; the popup's Cmd+Shift+K binding becomes `removeToken('space')` /
  close-when-global. `onSearchGlobal`'s reopen + storage handoff is deleted.

## Keyboard summary (v1)

| Keys | Effect |
|---|---|
| Backspace at 0 | remove rightmost token |
| ← at 0 | (v1: nothing; fast-follow: token selection) |
| → / Shift+Enter | drill → add token (as shipped, caret-at-end guard) |
| Escape | remove all filter tokens, else close |
| Tab / Shift+Tab | cycle the what group |
| Enter | open active row |
| Cmd+Shift+K | toggle the space token |

## Analytics

`SearchToken` `{ type: Space|Kind|Type|Creator|Backlink, action: Add|Remove|Replace,
source: Chip|Row|Caption|Entry|Backspace|Escape|Command, isGlobal }`; `SearchDrill` and
`SwitchSearchType` kept as alias emissions for continuity.

## Files (when implemented)

| File | Change |
|---|---|
| `src/ts/component/popup/search.tsx` | token model replacing `drillRef` + `searchTypeRef`; head tokens; chips as setters; `isGlobal` as state; unified storage + migration; space caption click; `/` completions; stack Back-restore |
| `src/scss/popup/search.scss` | `.head .tokens`, `.token`; drill-section styles removed |
| `src/json/text.json` | token labels, `/by` `/type` `/in` command names, placeholder |
| `src/ts/component/sidebar/page/vault.tsx` | scope param |
| specs | this file; status lines of the three earlier specs |

## Implementation phases (each shippable)

1. **Token core + chips as setters (in-space)** — tokensRef with groups, head rendering,
   ×/Backspace/Escape, chips set/replace/toggle tokens, type-drill ⇄ type-chip unification,
   `searchType` migration, stack Back-restore, `/by` `/type` completions.
2. **Space token + in-place mode switch** — `isGlobal` as derived state, unified storage,
   entry points, Cmd+Shift+K / action rewired, what-token mapping across the boundary.
3. **Space as a filter** — clickable space captions, `spaceId Equal` on the cross-space path,
   `ChatSearch(Y, '')`, Members filtered, `/in` `/here` `/channel`.
4. *(fast-follow)* full token-selection keyboard model.

## Open questions (for review)

1. Second click on an active kind chip toggles it off to All (Gmail behavior — spec default).
   Confirm or make it a no-op.
2. "Another space" mode = global + filter (layout chips, no highlights). Acceptable for v1?
3. Escape removes all filter tokens at once vs. one per press (LIFO, mirroring Backspace).
4. Token visuals: same pill as chips (spec default) or a distinct token style?
5. Members chip as picker: keep the name "Members", or rename (e.g. "People") now that it
   opens a picker rather than filtering?

## Implementation handoff notes (for a fresh session)

State: branch `feature/JS-9862-search-tokens` exists off develop, zero commits. The working
tree carries one intentional uncommitted change — `GLOBAL_QUERY_LIMIT` 100→50 in search.tsx
(user-approved value, explicitly not yet committed) — plus `src/json/text.json` /
`account_stop.json` edits belonging to a CONCURRENT agent: always `git add` specific files,
never `-A`, and eyeball `git diff` before staging. Commit each increment on this branch.

Verification: `set -o pipefail; bun run typecheck 2>&1 | tail -2` (pipefail or tail swallows
the exit code) + `bunx eslint` on changed files. ~101 pre-existing vitest failures on develop
are not yours. No Playwright driving from a Fable session — delegate browser testing to a
Sonnet subagent or the user (memories: fable-no-playwright, web-mode-e2e-harness).

Hard-won invariants in `popup/search.tsx` that MUST survive the refactor (each was a shipped
regression, fixed in the two v0.56.6-beta review rounds):

1. `loadGenRef` generation guards drop stale responses, and the drop path must release the
   loader it engaged (`if (clear && !quiet) setIsLoading(false)`) or the spinner sticks.
2. `listEpochRef` bumps ONLY where list data is actually swapped (each loader's `done()` on
   clear + the synchronous swap sites: members list, "/" mode). The measurement-cache reset
   effect is keyed to it; appends must never wipe the cache.
3. `CellMeasurerCache` is identity-keyed (`keyMapper` over `renderItemsRef`); the sentinel row
   renders OUTSIDE CellMeasurer (an empty div measured once caches height 0 forever).
4. `deferredMeasurementCache` is spelled correctly in THIS file only; the rest of the app has
   the `deferredMeasurmentCache` typo — do not "fix" other files in this branch.
5. The `Input` component keeps its value in React state: `setValue()` does not fire onChange
   and `getValue()` lags one commit. Any programmatic value change must also write
   `filterValueRef.current` and storage; `getItems()` derives mode from `filterValueRef`.
6. Quiet reloads keep the List mounted — `reload()` must `scrollToPosition(0)` when the new
   list lands; chat captions resolving late bump `listEpochRef` (in the subscribeIds callback).
7. `onArrow`: all-sections guard (infinite recursion) and no wrap-to-top while
   `hasMoreRef.current`.
8. Focus the filter input after every mouse-started token/filter mutation (bare divs steal
   focus to body).
9. Item/Footer are called as functions (`{Item({...})}`), not JSX components — keep it that
   way or rows remount and hover/measure state churns.

Edit discipline that worked: python heredoc scripts with `assert s.count(anchor) == 1` for
every replacement, single write at the end (a failed assert must leave the file untouched).

Process: implement phase by phase (spec phases 1–3; phase 4 is a fast-follow), commit per
increment, and after phase 1 compiles run a multi-agent review round before moving on — the
two review rounds on the drill work each caught real regressions (18 confirmed findings).
Open questions 1–5 above: if unanswered when implementation starts, take the spec defaults.
