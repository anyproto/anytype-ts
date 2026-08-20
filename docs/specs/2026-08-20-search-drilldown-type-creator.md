# Spec: search drill-downs — by Type and by Creator (Related-objects pattern)

Date: 2026-08-20
Status: implemented same day. Deviations: (1) drill-kind resolution order is type > creator >
backlink (type objects often carry links - backlink-first would shadow the obvious action);
(2) open question 1 resolved by heart PR
[#3246](https://github.com/anyproto/anytype-heart/pull/3246): `ChatSearch` gained a repeated
`creators` (identities) param, so the Messages chip DOES narrow by author during a creator
drill; (3) global drills restore from the in-memory deps maps rather than getById
Builds on: `2026-08-20-in-space-cross-chat-search.md`, `2026-08-20-global-cross-space-search.md`

## Product ask

Extend the existing "Related objects" (backlink) flow — the → arrow on a result row that pivots
the whole search — to two new row kinds, in both popups:

1. **Type rows** (`resolvedLayout == Type`): → searches objects **of this type**. Deliberately
   NOT expressed via chip selection — the type may be a specific one ("Videos") with no
   matching chip, and global chips are layout buckets that cannot represent a single type.
2. **Participant rows** (`resolvedLayout == Participant`): → filters objects **created by this
   person** (the My-objects mechanic pointed at someone else). Unlike the type drill, chip
   switching stays available and composes with the creator filter.

Both behave like the Related flow: a pinned section header naming the pivot, a Clear action,
Escape clears the drill before closing the popup.

## Current Related-flow anatomy (the pattern to generalize)

- `backlinkRef` + `storage.backlink` (persist/restore on open, `search.tsx:1521`).
- Trigger: `advanced` arrow on rows with links/backlinks (`:1696`) and `shift+enter` (`:162`).
- Effect on load: `filters.push({ id In links+backlinks })`.
- Section: `popupSearchBacklinksFrom` + `withClear` → `onClearSearch` (`:1109`); Escape routes
  to `onClearSearch` first.
- Chip interplay today: selecting any chip clears the backlink state.

## Design

### Unified drill state

Replace `backlinkRef` with one `drillRef: { kind: 'backlink' | 'type' | 'creator', object } | null`
(single active drill; starting one replaces another). Persisted per popup mode as
`storage[drillKey] = { kind, id }` (`drill` / `drillGlobal`), restored on open via
`U.Object.getById` — same lifecycle the backlink id has today; the legacy `storage.backlink`
value is migrated on read (`kind: 'backlink'`).

### Triggers

The → `advanced` arrow appears on an object row when ANY holds (first match wins for the
action):
1. row object has links/backlinks → backlink drill (unchanged);
2. `U.Object.isTypeLayout(object.layout)` → type drill;
3. `U.Object.isParticipantLayout(object.layout)` → creator drill.

`shift+enter` follows the same resolution. Tooltip per kind:
`popupSearchTooltipSearchByBacklinks` (existing) / `popupSearchTooltipSearchByType`
("Search objects of this type") / `popupSearchTooltipSearchByCreator`
("Search objects created by them").

Reachability notes: type rows appear in text searches and the Types chip (they are excluded
only from the empty All/Mine browse); participant rows appear in All results (participant
layout is not in the popup's exclusion set). Row click on a participant still opens the
participant menu (`U.Object.openEvent` → `U.Menu.participant`) — the drill lives only on the
arrow/shortcut, so no click-behavior change.

### Filters

- **Type drill** (both modes): `type.uniqueKey Equal <type.uniqueKey>` — uniqueKey is stable
  across spaces, so the cross-space drill matches same-key types in every space (nested-key
  filters already proven in the global template exclusion). Falls back to `type Equal <id>` if
  the drilled type object carries no uniqueKey (user-created types always do).
- **Creator drill**:
  - in-space: `creator In [ participantId ]` (the drilled row's id).
  - global: the same person exists as a different participant object per space — collect all
    ids for the person's `identity` from the participants snapshot
    (`participantsRef` gains `identity` in its keys; build `identity → ids[]` alongside the
    counts map) and filter `creator In [ ...ids, identity ]` (the trailing raw identity covers
    legacy records that store the bare identity in `creator`, mirroring
    `getCreatorParticipantId`).
- Drill filters compose with the mode's base/chip filters, with two exceptions below.

### Chip interplay (differs per kind — deliberate)

| drill | chips while active | starting the drill |
|---|---|---|
| backlink | selecting a chip clears the drill (unchanged) | — |
| type | chip row is ignored for filtering and rendered inactive-all (a specific type is already narrower than any chip); selecting a chip clears the drill | chip resets to `all` |
| creator | **fully composable** — chips keep filtering (Media by this person, Bookmarks by this person, …); Messages chip while creator-drilled additionally passes nothing extra in v1 (message search has no creator filter server-side) and renders the drill section header for context | current chip kept |

The Type-objects exclusion from the empty All/Mine browse is suspended while a type drill is
active (the drill IS about types' instances, exclusion is irrelevant); the Mine chip combined
with a creator drill keeps both filters (intersection — usually meaningful for "objects we
both touched"… creator wins semantically since Mine is also a creator filter: spec decision —
selecting Mine while creator-drilled clears the drill to avoid a contradictory
`creator In [me] AND creator In [them]`).

### Section header

Reuses the Related section row (name + right-side Clear, same `withClear` machinery):
- backlink: `Related to: %s` (existing key);
- type: `popupSearchDrillType`: `Type: %s` (plural name of the type);
- creator: `popupSearchDrillCreator`: `Created by: %s`.

The section renders in every mode while the drill is active (including on top of chip-filtered
lists for the creator drill) and always precedes the order-toggle recent section (drill active
⇒ recent section hidden, as with backlink today). Clear (or Escape) drops the drill, restores
the chip row to normal, keeps the filter text — exactly the current `onClearSearch` contract,
extended to reset `drillRef`.

### Sorting

Unchanged per mode/chip: drills only add filters. (Creator drill + empty query uses the
chip's browse order; type drill + empty query uses `lastModifiedDate desc` via the All-chip
path it forces.)

### Analytics

`analytics.event('SearchDrill', { type: Backlink|Type|Creator, route, isGlobal })`; the
existing `SearchBacklink` event is kept as an alias emission for the backlink kind (dashboards
continuity).

## Files (when implemented)

| File | Change |
|---|---|
| `src/ts/component/popup/search.tsx` | `drillRef` generalization, triggers, filters, section, chip interplay, storage migration |
| `src/json/text.json` | 2 tooltips, 2 section labels |
| specs | this file |

## Open questions (for review)

1. Creator drill on **message** results (filter messages by author) — server-side `ChatSearch`
   has no creator filter; v1 shows unfiltered messages under the drill header. Acceptable, or
   hide the Messages chip during a creator drill?
2. Should the type drill offer jumping INTO the type object (open it) somewhere, now that both
   → and click are taken (click opens the type object today — unchanged)?
3. Persist drills across popup close/reopen like backlink does — spec says yes for symmetry;
   flag if a fresh popup should always start undrilled.
