# Design: Deletion Audit (desktop)

**Date:** 2026-08-09
**Base branch:** `develop`
**Suggested branch:** `feature/deletion-audit`
**Status:** Approved for planning
**Supersedes in part:** `docs/plans/2026-08-09-deletion-audit-desktop.md` — see [§9](#9-deviations-from-the-original-plan)

---

## 1. What we are building

A space-scoped, read-only page answering *"what was permanently deleted here, by whom, when, and who
had created it"*. It reads one new RPC, `ObjectDeletionAudit`, and renders one flat list.

"Permanently deleted" means gone from the space — not sitting in the Bin. The two views are
complementary: the Bin shows what is *about to* disappear and can still be restored; this shows what
already has and cannot.

**Placement:** a dedicated page under Settings → Channel, plus an entry point from the Bin.
**Visibility:** everywhere, including personal channels. No role gating — the data is not privileged,
since every member already syncs the settings tree the backend reads it from.

Renderer-only work. The middleware side is complete on the anytype-heart branch
`go-7431-delegated-identity-signing`; no Go work is required.

---

## 2. Backend contract (verified)

Verified against `../anytype-heart` on `go-7431-delegated-identity-signing`,
`pb/protos/commands.proto:3053`:

```
Rpc.Object.DeletionAudit
  Request  { spaceId: string, keys: []string, offset: int32, limit: int32 }
  Response { error, records: []google.protobuf.Struct, total: int64 }
```

Records are ordered **newest deletion first**, tie-broken by object id. `limit: 0` means unlimited.
`total` ignores limit/offset. `keys` projects the returned relations; `id`, `deletedBy` and
`deletedDate` are always included regardless of what is asked for.

Each record is a flat details struct:

| field | always present | notes |
|---|---|---|
| `id` | yes | the deleted object's id |
| `deletedBy` | yes | participant id (`_participant_<space>_<identity>`) |
| `deletedDate` | yes | unix seconds |
| `deletionChangeId` | yes | objects deleted in one operation share this |
| `creator` | **no** | participant id |
| `createdDate` | **no** | |
| `addedDate` | **no** | set for imported objects |
| `createdInContext` | **no** | object id the deleted object was created inside |
| `createdInContextRef` | **no** | block id / relation key / message id within that object |
| `lastModifiedBy` | **no** | participant id |
| `lastModifiedDate` | **no** | |
| `type` | **no** | type object id |
| `resolvedLayout` | **no** | `I.ObjectLayout` |
| `sizeInBytes` | **no** | files only |
| `fileId` | **no** | files only |

### 2.1 Three constraints that shape the UI

These are properties of the backend, not oversights. Design around them.

**There is no `name`.** Deleting an object destroys its tree, and the tombstone deliberately does not
retain user-authored content — no name, description or snippet. **A row can never show a title.**

**Creation-side fields are optional.** Objects deleted *before* this feature ships have only the four
"always present" fields. Critically, this includes `type` **and** `resolvedLayout` — so a degraded row
has no name, no type and no icon. Expect these to be the majority of rows in existing accounts for a
long time.

**No events.** This is a one-shot request, not a subscription. Nothing pushes when a deletion happens
while the page is open.

### 2.2 First-call cost

The backend materialises lazily: the first call in a space walks the whole settings tree and stamps
tombstones. Subsequent calls skip the walk unless the tree grew. In an account with a long deletion
history the **first** open can take noticeably longer than later ones. Do not assume sub-100ms.

---

## 3. Page shell

The page renders **full-width**, not in the 640px settings column.

`.settingsPageContainer` is `max-width: 640px` (`src/scss/page/main/settings.scss:10`), which cannot
comfortably carry four resolved columns with no title to anchor them. The Bin already solves this: it
is registered as the settings page `archive` but listed in `SKIP_CONTAINER`
(`src/ts/component/page/main/settings/index.tsx:78`), so it renders its own chrome. `.pageSettingsArchive`
in `src/scss/page/main/archive.scss` exists for exactly this reason.

We follow that precedent. `spaceDeletionAudit` joins `SKIP_CONTAINER`, and the page component renders
the three pieces the container would otherwise have supplied:

```tsx
<>
	<Header {...props} component="mainSettings" />
	<div className="wrapper">{/* title, then list */}</div>
	<Footer component="mainObject" {...props} />
</>
```

`HeaderMainSettings` is already registered (`src/ts/component/header/index.tsx:33`) and today renders
as a sibling of the container, so rendering it from the page is structurally identical.

New stylesheet `src/scss/page/main/settings/deletionAudit.scss`, reusing the `.listObject .table`
row/cell grid conventions from `archive.scss`. No new colors, spacing scales, or design tokens — any
visual value not already established there is a design question, not an implementation one.

---

## 4. Data layer

### 4.1 Protobufs

```bash
HEART_DIR=../anytype-heart bash scripts/generate-protos.sh
```

Produces `Rpc_Object_DeletionAudit_Request` / `_Response`. No hand-editing of generated output.

### 4.2 `src/ts/lib/api/service.ts`

Register in the alphabetically-sorted map, between `ObjectCreateSet` (:242) and `ObjectDuplicate` (:246):

```ts
ObjectDeletionAudit: { req: Commands.Rpc_Object_DeletionAudit_Request, res: Commands.Rpc_Object_DeletionAudit_Response },
```

### 4.3 `src/ts/lib/api/command.ts`

Next to `ObjectCleanupSuggestions` (:1567):

```ts
/**
 * Lists objects permanently deleted from the space, newest first.
 * id, deletedBy and deletedDate are always returned regardless of keys.
 * Creation-side keys are absent for objects deleted by older builds.
 */
export const ObjectDeletionAudit = (spaceId: string, keys: string[], offset: number, limit: number, callBack?: (message: any) => void) => {
	dispatcher.request('ObjectDeletionAudit', {
		spaceId,
		keys: (keys || []).filter(it => it),
		offset,
		limit,
	}, callBack);
};
```

### 4.4 `src/ts/lib/api/response.ts`

**Bare `Decode.struct`, mirroring `ObjectSearch` (:249). Deliberately *not* `S.Detail.mapper`.**

```ts
export const ObjectDeletionAudit = (response: any) => {
	return {
		records: (response.records || []).map(Decode.struct),
		total: Number(response.total) || 0,
	};
};
```

This is the single most important decision in the design, so the reasoning is recorded here rather
than left to a reviewer to rediscover.

`S.Detail.mapper` → `mapCommon` (`src/ts/store/detail.ts:373`) does
`object.name = Relation.getStringValue(object.name) || translate('defaultNamePage')`. Every record
would therefore arrive carrying a fabricated **"Untitled"**. §2.1's first rule is that a row can never
show a title; the most robust way to honour that is for the fake title never to exist in the first
place. The same function also does `object.layout = Number(object.layout) || I.ObjectLayout.Page`,
which would silently give every degraded record a **Page** icon regardless of what it actually was.

What we give up is `mapCommon`'s `if (undefined === object.layout) object.layout = object.resolvedLayout;`
step, which is what `IconObject` needs (it reads `object.layout` and never `resolvedLayout`). We do
that explicitly in the component instead — one line, and it forces the degraded case to be handled
rather than papered over.

No `Response[type]` wiring is needed beyond the export: `dispatcher.ts:1792` resolves handlers by name.

### 4.5 Requested keys

Module constant in the page component, following `KEYS` in `archiveListTree.tsx:18` — used in exactly
one place, so not in `J.Constant`:

```ts
const KEYS = [
	'creator', 'createdDate', 'addedDate', 'createdInContext', 'createdInContextRef',
	'lastModifiedBy', 'lastModifiedDate', 'type', 'resolvedLayout', 'sizeInBytes', 'deletionChangeId',
];
```

Omitting `keys` gets the same default set from the backend, but naming it here keeps the client honest
about what it renders.

---

## 5. The row

Four columns, fixed 42px rows, no selection and no actions — the page is read-only throughout.

```
OBJECT                   DELETED BY     DELETED         CREATED BY
──────────────────────────────────────────────────────────────────
📄 Page                  👤 Anna        12 Mar 2026     👤 Roman
🖼 Image  2.4 MB         👤 Roman       12 Mar 2026     —
▢  ⋯m8x1c                👤 Anna        08 Mar 2026     —
```

### 5.1 The degraded test

```ts
const isDegraded = (undefined === record.resolvedLayout);
```

`resolvedLayout` is untouched by our decode path, so this survives intact. It is also the same
condition under which `type` is absent, so one flag governs both the icon and the name.

### 5.2 Resolution

| shown | source | how |
|---|---|---|
| icon | `resolvedLayout` | `<IconObject object={{ id, layout: resolvedLayout, type }} />` — enough for `U.Object.defaultIcon` to resolve the type's `iconName` |
| type name | `type` | `S.Record.getTypeById(type)?.name`; dash when the type object is itself deleted |
| deleted by | `deletedBy` | `U.Space.getParticipant(id)` → avatar + name |
| created by | `creator` | `U.Space.getParticipant(id)` |
| dates | `deletedDate`, `createdDate` | `U.Date.dateWithFormat(S.Common.dateFormat, t)` |
| size | `sizeInBytes` | `U.File.size(Number(v))` — files only, omitted otherwise |

`U.Space.getParticipant` (`src/ts/lib/util/space.ts:416`) reads the participant subscription, which is
live wherever this page renders. It returns `null` for a participant who has left the space; fall back
to the last 5 characters of the identity segment of `_participant_<space>_<identity>` — deliberately
the same visual grammar as the object id chip below.

`createdInContext` and `createdInContextRef` are requested but **not rendered in v1**. They are fetched
so that a follow-up can surface them without a contract change.

### 5.3 The id chip

Shown **only on degraded rows**, where it is the row's sole truthful identity. Rows that can name
themselves show the type instead; the chip does not appear alongside a resolved type.

- Text: `id.slice(-5)`, monospace. There is no last-N helper — `U.String.shorten` truncates from the
  front — so this is an inline slice.
- Hover: tooltip with the full id.
- Click: `U.Common.copyToast(translate('commonId'), id)` — the affordance already used by the AnyID
  row in `src/ts/component/page/main/settings/account.tsx:95`. `commonId` does not exist yet and is
  added as part of this work (§8.1).

### 5.4 Missing-value tooltip

Every dash rendered in place of a missing value carries a tooltip on hover explaining *why* the
information is absent, so an empty cell never reads as a bug:

```ts
onMouseEnter={e => Preview.tooltipShow({
	text: translate('pageSettingsSpaceDeletionAuditMissingTooltip'),
	element: e.currentTarget as HTMLElement,
	typeY: I.MenuDirection.Bottom,
})}
onMouseLeave={() => Preview.tooltipHide(false)}
```

Copy: *"This information isn't available — the object was deleted before version 0.56.2, or the account
was re-initialised after the deletion."* (Current version is 0.56.1, so 0.56.2 is the next release.
The version is hardcoded in the string as a historical marker; it is not read from `package.json`.)

The same tooltip attaches to the degraded row's neutral icon, since a missing icon has the same cause.

---

## 6. Pagination and lifecycle

`InfiniteLoader` + `WindowScroller` + `AutoSizer` + `List`, with the JSX shape copied from
`archiveListTree.tsx:295-328`:

- `rowCount={total}` on the loader, `rowCount={records.length}` on the list
- `isRowLoaded={({ index }) => !!records[index]}`
- `rowHeight={42}`, `threshold={10}`, `overscanRowCount={10}`
- `scrollElement={U.Dom.getScrollContainer(isPopup)}`

The loader **body** is new work, not a copy: `archiveListTree` is subscription-backed and bumps an
`S.Record` offset, whereas we issue a direct request and splice into a sparse array.

```ts
loadMoreRows = ({ startIndex, stopIndex }) => new Promise<void>(resolve => {
	// C.ObjectDeletionAudit(space, KEYS, startIndex, stopIndex - startIndex + 1, ...)
	// → splice results into records at startIndex, then resolve()
});
```

The initial load requests `offset: 0, limit: 50`. Subsequent page sizes are not ours to choose —
`InfiniteLoader` dictates the range, and we honour whatever `startIndex`/`stopIndex` it asks for.

**State:** `records` (sparse array), `total`, `isLoading`. `const space = S.Common.space;` — on change,
clear `records`/`total` and reload from offset 0.

**Race guard:** a `requestRef` counter incremented per request, following `archiveSuggested.tsx:79-86`.
Space switches and in-flight pagination can overlap; stale replies are dropped by comparing the
captured request number against `requestRef.current`.

**Loading:** `<Loader />` while `isLoading && !records.length` — first-open only. §2.2 means this is a
real state, not a formality.

**Empty:** `<EmptySearch text={translate('pageSettingsSpaceDeletionAuditEmpty')} />` when `total == 0`.

**Refresh:** none in v1. There are no events (§2.1) and the list reloads on mount and space change.

**Row ordering under concurrent deletion:** offsets are stable between calls as long as no new deletion
lands mid-scroll. If one does, the window shifts by one — acceptable for v1; the id tiebreak in the
backend sort keeps same-timestamp rows from reshuffling arbitrarily.

**Grouping:** flat rows in v1. `deletionChangeId` is requested so that grouping cascade deletions under
one header becomes a pure-render follow-up with no contract change. If early testing shows a single
collection deletion filling a screen, this gets promoted.

---

## 7. Registration and entry points

Four registration edits, all required — omitting any one produces a silent failure rather than an error.

1. **`src/ts/component/page/main/settings/index.tsx`** — import the page, add to `Components` (~:69,
   after `spaceNotifications`), and add `'spaceDeletionAudit'` to `SKIP_CONTAINER` (:78).

2. **`src/ts/lib/util/common.ts:1348`** — add `'spaceDeletionAudit'` to `getSpaceSettingsPages()`.
   Without it the router bounces to the account page.

3. **`src/ts/component/sidebar/page/settings/index.tsx`** — in the `common` group (~:62-68), after
   `archive`:

   ```ts
   { id: 'spaceDeletionAudit', iconParam: { name: 'common/bin' } },
   ```

   No `isPersonal` guard — this ships everywhere. The icon is a **placeholder**; a dedicated asset
   following the existing `iconParam: { name: ... }` convention should come from design.

4. **`src/ts/lib/util/menu.ts:1963`** — add `spaceDeletionAudit: translate('pageSettingsSpaceDeletionAudit')`
   to `settingsSectionsMap()`. The sidebar does `c.name = map[c.id] || c.name`
   (`sidebar/page/settings/index.tsx:82`), so without this entry the row renders **nameless**.

5. **`src/ts/component/page/main/archive.tsx`** — in the `side right` block of `titleWrapper` (~:283),
   a link/icon calling `Action.openSettings('spaceDeletionAudit', analytics.route.archive)`.

   Kept out of the `tabs` element: it navigates away rather than switching tabs, and sitting beside
   Bin/Cleanup would misrepresent it as a third tab. Shown unconditionally, with no `canWrite` guard —
   it is a read-only view.

New page file: **`src/ts/component/page/main/settings/space/deletionAudit.tsx`**.

---

## 8. l10n and analytics

### 8.1 Keys

Added to `src/json/text.json` (source of truth) following the `pageSettingsSpace*` convention. English
only; other locales come through the normal l10n pipeline. `dist/lib/json/lang/` is generated — never
edited directly. Copy uses **"channel"**, matching the current source rename (`pageSettingsSpaceGeneralTab`
is already "Channel Settings").

| key | purpose |
|---|---|
| `pageSettingsSpaceDeletionAudit` | nav label + page title, e.g. "Deletion history" |
| `pageSettingsSpaceDeletionAuditDescription` | one line under the title |
| `pageSettingsSpaceDeletionAuditEmpty` | empty state |
| `pageSettingsSpaceDeletionAuditDeletedBy` | column header |
| `pageSettingsSpaceDeletionAuditCreatedBy` | column header |
| `pageSettingsSpaceDeletionAuditDeleted` | column header (date) |
| `pageSettingsSpaceDeletionAuditObject` | column header (type/id) |
| `pageSettingsSpaceDeletionAuditMissingTooltip` | §5.4 explanation for every dash |
| `commonId` | "ID" — label for the id-chip copy toast (§5.3); verified absent from `text.json` today |

### 8.2 Analytics

- `analytics.event('ScreenSettingsSpaceDeletionAudit')` on mount, **with no route parameter**.
- `analytics.event('ClickDeletionAudit', { route: analytics.route.archive })` at the Bin entry point.

The original plan's "route distinguishing sidebar from Bin entry" cannot work as written.
`Action.openSettings` (`src/ts/lib/action.ts:1373`) pushes `{ route }` into `_routeParam_.additional`,
but `U.Router.build` (`src/ts/lib/util/router.ts:122`) serialises that array as `[it.key, it.value]`.
For `{ route: 'Bin' }` both are `undefined`, so the URL receives the literal string
`undefined/undefined` and the route never reaches the page.

This is a **pre-existing bug in shared routing code** with several other callers (`membership`,
`spaceShare`). Fixing it would start appending `/route/X` segments to those existing URLs, so it is
out of scope here — hence reporting the route at the click site instead, where it is known. Worth
filing separately.

---

## 9. Deviations from the original plan

`docs/plans/2026-08-09-deletion-audit-desktop.md` remains the reference for backend behaviour. Where
this spec and that plan disagree, **this spec wins**:

| plan | spec | why |
|---|---|---|
| Page lives in the 640px settings column | Full-width, via `SKIP_CONTAINER` | Four columns and no title need horizontal room; the Bin already proves the escape hatch |
| `response.ts` uses `S.Detail.mapper` | Bare `Decode.struct` | `mapper` fabricates `name: "Untitled"` and defaults missing layouts to `Page` — §4.4 |
| Step 7 edits the sidebar array only | Also edits `U.Menu.settingsSectionsMap()` | The array carries no label; the map does |
| Step 10 passes route via `openSettings` | Route reported at the click site | `openSettings` → `Router.build` drops it — §8.2 |
| `archiveSuggested.tsx` under `settings/space/` | `src/ts/component/page/main/archiveSuggested.tsx` | Corrected path; the `requestRef` pattern cited is real, at :79-86 |
| Step 5 copies `archiveListTree`'s `loadMoreRows` | Copies its JSX only | That loader is subscription-backed; ours is offset/limit — §6 |
| Row shows icon + type, degrading to bare dates | Degraded rows show an id chip | Requested during review: a row with nothing to name it still needs a handle |
| Missing values render blank/dash | Every dash carries an explanatory tooltip | Requested during review — §5.4 |

---

## 10. Testing

**Automated:**
- `bun run typecheck` and `bun run lint` — required after changes per CLAUDE.md.
- Storybook story at `src/ts/component/page/main/settings/space/deletionAudit.stories.tsx`, following
  the shape of `storage.stories.tsx`, covering three states: **populated**, **degraded**
  (deletion-half only), and **empty**.

**Manual**, against a heart built from `go-7431-delegated-identity-signing`:

1. Delete an object permanently → it appears with both halves populated.
2. Delete a parent with bound children → one `deletionChangeId` across all rows.
3. Open in an account with pre-existing deletions → those rows show the deletion half only, render an
   id chip and a neutral icon, and every dash tooltips. **This is the case most likely to be missed.**
4. Personal channel → page loads, `deletedBy` is always you.
5. Channel with >50 deletions → scroll past the first page; no duplicates, no gaps.
6. Switch channels with a request in flight → no stale rows from the previous channel.
7. First open in an account with a long deletion history → loader appears, page does not look hung.
8. Reader (non-writer) role → page renders; note the sidebar caveat in §11.

**Skills to run afterwards** (per CLAUDE.md): `/dark-mode-check` (new SCSS), `/update-docs`
(new component in `page/main/settings/space/`), `/qa-engineer` (user-facing settings surface).

---

## 11. Known landmines

**Read-only members get no settings sidebar.** `settings/index.tsx:96` returns early from `init()`
when `!U.Space.canMyParticipantWrite()` for any page in `getSpaceSettingsPages()`, so the left panel
never switches to `settings/space`. This already affects `archive` identically. Pre-existing; **not
fixed here**, but it means a reader arriving from the Bin lands on the page without settings
navigation around it.

**`IconObject` reads `object.layout`, never `resolvedLayout`.** Since we skip `S.Detail.mapper`, the
mapping is ours to do. Forgetting it yields a silently wrong icon rather than an error.

**A type object can itself be deleted**, so `S.Record.getTypeById` returns `null` even on a
non-degraded row. That row keeps its icon (layout is present) but shows a dash for the type name —
and therefore a tooltip.

**`sizeInBytes` may decode as a string.** Coerce with `Number()` before `U.File.size`.

---

## 12. Out of scope for v1

- Filtering by participant or date range — the RPC takes neither; both need backend work.
- Grouping by `deletionChangeId` — the key is fetched, the render is deferred (§6).
- Surfacing `createdInContext` / `createdInContextRef` — fetched, not rendered (§5.2).
- Restore from the audit. Nothing to restore from: the object's tree is destroyed on deletion.
- Export of the audit list.
- Live updates. Acceptable for an audit view; making the list react to deletions syncing in is a
  subscription-backed redesign on the heart side, not a client fix.
- Fixing `Action.openSettings`'s dropped route (§8.2) — file separately.
- Mobile clients.
