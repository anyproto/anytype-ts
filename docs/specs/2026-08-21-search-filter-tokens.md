# Spec: search filter tokens — removable scope/filter chips inside the search input

Date: 2026-08-21 (rev 4, 2026-08-22: chips row reworked into an adaptive suggestion row
after Roman's phase-1 testing — see "Adaptive suggestion row" and Decisions 6-8; supersedes
Decisions 1 and 5 and the rev-2 "Chips = token setters" section)
Status: phase 1 implemented on `feature/JS-9862-search-tokens` (token core + chips as token
setters + `/by` `/type` completions, in-space; the popup's `isGlobal` param behavior is as
shipped). Phases 2-3 pending.

## Deviations (phase 1 implementation, 2026-08-21)

Recorded where the spec and shipped behavior pulled apart; the reading that preserves the
token model's coherence was chosen and each divergence is deliberate:

1. **Back snapshots are session-only.** Tokens persist as `[{ kind, id }]` exactly as
   specced; the shipped drill code additionally persisted its Back snapshot. A quick reopen
   restores tokens but not the Back stack — removals after reopen just reload.
2. **Token `×` analytics source is `Token`** — the spec's source enum (Chip|Row|Caption|
   Entry|Backspace|Command) has no value for the pill's own remove affordance.
3. **Empty-browse first page is RECENT_LIMIT (20) for every empty-query clear load**
   in-space, tokens active or not. Shipped in-space drills loaded a full 100-row first page
   (global already used 20); unified since chip- and drill-added tokens are now one system.
4. **Type-object noise exclusion** in the empty browse keys off `!whatToken && !query` in
   both loaders. Shipped had per-mode drill nuances (in-space applied it under backlink
   drills; global skipped it under creator drills) that dissolve under tokens.
5. **onSearchGlobal (phase-1 reopen pivot): creator tokens carry for any person**, not just
   You (shipped carried the Mine chip and dropped creator drills). A type token whose
   recommendedLayout is Participant is dropped (shipped mapped it to the Members chip, which
   is now a picker and has no token). Backlink drops, as specced.
6. **Settings rows** surface only with zero tokens (shipped keyed off chip == All, which
   allowed them alongside a creator drill).
7. **Restored-from-storage tokens emit `SearchDrill { type: 'Saved' }` aliases** per
   non-kind token, mirroring the shipped single-drill restore emission.
8. **`popupSearchPlaceholderMessage` is no longer reachable** — a Messages token means
   tokens are present, so the placeholder shrinks to `commonSearch` per the spec. The key
   stays in text.json for l10n continuity, as do the drill-header keys.
9. **Re-adding an identical token from a row** (drill on a row whose token is already
   active) clears the query and reloads — drill semantics — without pushing a snapshot or
   re-emitting add analytics.
10. **Chats bucket + creator token**: the any-creator chat-container exclusion is skipped
   when the what token is the Chats bucket — the two filters would contradict and every
   result set would be empty. (Review finding; the exclusion decision's rationale is
   noise-hiding in generic browses, not defeating an explicit Chats scope.)
11. **Explicit removals strip the token from remaining Back snapshots** (spec gap found in
   review): with interleaved row-adds, popping a later snapshot must not resurrect a token
   the user removed by hand in between. Restores (snapshot pops) still bring back what the
   popped add had replaced — that is the undo semantics.
12. **Global-mode resolution never persists away dropped tokens** — the cross-space maps
   are cold on the first global use of a session; creator tokens additionally fall back to
   the current-space participant store so the Cmd+Shift+K pivot resolves immediately.

Rev-4 (adaptive suggestion row) implementation notes:

13. **The >1-member gate covers the whole person section**, "My objects" included — a solo
   space shows no person chips (filtering by You there is a no-op; rule 5 read plainly).
14. **Person chips are capped at "My objects" + 3 members** (spec says 3-5; 3 keeps one row
   with the kind chips at common widths). Overflow via `/by`.
15. **Escape absorbs the Tab highlight only while the query is empty.** With text present
   the Filter component's built-in Escape (clear text) runs first on the input's own
   keydown and the popup then closes per Decision 3 — the highlight cannot intercept
   without restructuring Filter. Empty-query Tab browsing (the common case) behaves as
   rev 4 specifies.
16. **`/by` browse order** is the person-browse order (1:1-first, then alphabetical),
   replacing phase-1's alphabetical sort; global `/by` rows carry the old aggregate
   space-count captions ("in N Channels").
17. **SwitchSearchType alias** is now emitted only for what-group chip adds; person chip
   adds emit `SearchToken` only (there is no legacy chip-switch they correspond to).
18. Footer Tab/`/` label uses a new key `popupSearchShortcutRefine` ("Refine search");
   `popupSearchShortcutSwitchType` and `popupSearchTypePeople` stay in text.json unused,
   for l10n continuity.
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

## Adaptive suggestion row (replaces "Chips = token setters", rev 4)

Phase-1 testing verdict: keeping the tab bar's visual grammar (persistent row, selected
state) while changing semantics to token setters read as messy — some chips switched, some
added, some highlighted. Rev 4 adopts the **pure Gmail search-chips model**: the row is a
**refinement-suggestion row**, not a tab bar. Its one job: "what would usefully narrow this
search further?" Applied filters live ONLY as tokens in the input; the row only ever shows
tokens you could still add. This is also the foundation for v2 adaptive chips (result-aware
suggestions like "by Kaye") — same row, smarter contents.

Rules:

1. **Chips show only addable tokens.** A filled group's chips disappear: type/kind token
   present → no what-group chips; creator token present → no person chips. They return when
   the token is removed.
2. **No selected/active state in the row.** Every chip is the same kind of thing: click =
   add its token (replacing within its group never applies — the group's chips are hidden
   while filled).
3. **No "All objects" chip** — it existed only as the tab bar's rest state. Empty what-group
   simply shows the what chips again.
4. **No People pseudo-chip** (supersedes Decision 5): the row shows **inline person chips**
   directly — "My objects" (creator: You) first, then a few members (in-space: the vault
   1:1-first ordering, then alphabetical; global: the People aggregate's ordering), capped
   (implementation picks 3-5 to fit one row with the kind chips). Overflow is reachable via
   `/by`. The old person-browse list stays reachable via `/by` with an empty query.
5. Row order: what-group chips (Messages, Media, …types per mode) first, then person chips.
   Visibility gates stay (Messages needs chat containers; person chips need >1 member).
6. Removal paths are ONLY token `×` and Backspace-at-0 (chip toggle-off — Decision 1 — is
   superseded: there are no active chips to toggle).

### Tab (decided rev 4)

Tab moves a **highlight** across the visible suggestion chips (Shift+Tab backwards); Enter
applies the highlighted chip (adds its token). The highlight is transient: ArrowUp/Down,
typing, or Escape drop it and return Enter to its list meaning (open the active row). Tab
past the last chip wraps to the first. This replaces "Tab cycles the what group".

## The space token and the two modes

| Space token | Mode | Chips | Object loader | Messages | Members picker |
|---|---|---|---|---|---|
| = current space | **in-space** (today's default) | All / Mine / Messages / Media / Members + widget types | `ObjectSearchWithMeta(space)` | `ChatSearch(space, '')` | space participants |
| none | **global** | All / Mine / Messages / Pages / Members / Media / Bookmarks / Collections / Queries / Chats / Types | `ObjectCrossSpaceSearch` | `ChatSearch('', '')` | GLOBAL_DEPS aggregate |
| = another space | **channel-scoped** (new) | **that Channel's chips** — derived from `GLOBAL_DEPS.types` filtered by `spaceId` (name order; the Types-widget order only exists for the current space); Messages/People gates from the global subscriptions per that space | `ObjectCrossSpaceSearch` + `spaceId Equal` | `ChatSearch(Y, '')` | GLOBAL_DEPS filtered to Y |

The framing (decided): a concrete Channel scope — current or another — always shows the
**Channel token** and **that Channel's chips**; removing the token switches to the **global
chips** in place. `isGlobal = !spaceToken` for the chips row; the data path additionally
distinguishes the current space (local stores: `ObjectSearchWithMeta`, highlights, settings
rows, per-chip create actions, Types-widget chip order) from another space (cross-space
one-shot RPC — chips from `GLOBAL_DEPS.types` by `spaceId`, `type` tokens via `uniqueKey`, no
fulltext highlights). No close+reopen, no storage handoff, in either direction.
On the scoped ⇄ global boundary the what-token maps: a `type` token maps to its layout bucket
(`recommendedLayout` → `kind`, the shipped `getGlobalSearchType` logic); a `kind` token maps
back to itself where the scoped row offers it, else clears.

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

**Escape never touches tokens** (decided): it only closes the popup. The scope token in
particular must never fall to a reflexive Escape; removal paths are ×, Backspace, and chip
toggle only.

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
(× or Backspace) pops its snapshot; removing others just reloads.

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
| Escape | close the popup — never removes tokens |
| Tab / Shift+Tab | walk the suggestion chips (Enter applies; arrows/typing/Escape drop the highlight) |
| Enter | open active row |
| Cmd+Shift+K | toggle the space token |

## Analytics

`SearchToken` `{ type: Space|Kind|Type|Creator|Backlink, action: Add|Remove|Replace,
source: Chip|Row|Caption|Entry|Backspace|Command, isGlobal }`; `SearchDrill` and
`SwitchSearchType` kept as alias emissions for continuity.

## Files (when implemented)

| File | Change |
|---|---|
| `src/ts/component/popup/search.tsx` | token model replacing `drillRef` + `searchTypeRef`; head tokens; chips as setters; `isGlobal` as state; unified storage + migration; space caption click; `/` completions; stack Back-restore |
| `src/scss/popup/search.scss` | `.head .tokens`, `.token`; drill-section styles removed |
| `src/json/text.json` | token labels, `/by` `/type` `/in` command names, placeholder, Members → "People" |
| `src/ts/component/sidebar/page/vault.tsx` | scope param |
| specs | this file; status lines of the three earlier specs |

## Implementation phases (each shippable)

1. **Token core + chips as setters (in-space)** — tokensRef with groups, head rendering,
   ×/Backspace/Escape, chips set/replace/toggle tokens, type-drill ⇄ type-chip unification,
   `searchType` migration, stack Back-restore, `/by` `/type` completions.
2. **Space token + in-place mode switch** — `isGlobal` as derived state, unified storage,
   entry points, Cmd+Shift+K / action rewired, what-token mapping across the boundary.
3. **Other-Channel scope** — clickable space captions, `spaceId Equal` on the cross-space
   path, that Channel's chips from `GLOBAL_DEPS.types`, `ChatSearch(Y, '')`, People filtered,
   `/in` `/here` `/channel`.
4. *(fast-follow)* full token-selection keyboard model.

## Decisions (Roman, 2026-08-21)

1. ~~Active chip second click: toggle off~~ — superseded by rev 4 (no active chips).
2. Other-Channel scope: **load that Channel's chips** (from `GLOBAL_DEPS.types` by spaceId) —
   a concrete-Channel scope always shows the Channel token + that Channel's chips; removing
   the token switches to global chips. Highlights remain current-space-only (one-shot RPC has
   no meta).
3. Escape: **never removes tokens** — it only closes the popup; the scope token especially
   must not fall to Escape.
4. Token visuals: **same pill as chips**.
5. ~~Members chip renamed to "People"~~ — superseded by rev 4 (no picker chip; inline
   person chips instead).
6. (rev 4) Chips row is an **adaptive suggestion row**: only addable tokens, no selected
   state, no All chip; a filled group's chips are hidden until its token is removed.
7. (rev 4) Tab **walks the suggestion chips**; Enter applies the highlighted one; the
   highlight is transient.
8. (rev 4) **Inline person chips** (My objects + a few members) instead of a People picker
   chip; overflow via `/by`.

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
