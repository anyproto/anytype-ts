# Design: Deletion Audit (desktop)

**Date:** 2026-08-09
**Base branch:** `develop`
**Suggested branch:** `feature/deletion-audit`
**Status:** Approved for planning
**Amended:** 2026-08-09 — backend now returns two kinds of record (see [§13](#13-amendment-log))
**Supersedes in part:** `docs/plans/2026-08-09-deletion-audit-desktop.md` — see [§9](#9-deviations-from-the-original-plan)

---

## 1. What we are building

A space-scoped, read-only page answering *"what was removed here, by whom, when, and who had created
it"*. It reads one new RPC, `ObjectDeletionAudit`, and renders one flat chronological list.

The list merges **two genuinely different events** — objects destroyed outright, and types/properties
uninstalled. They are not interchangeable, and the UI must branch on the discriminator (§2.1).

Neither is the Bin. The Bin shows what is *about to* disappear and can still be restored; this shows
what already went.

**Placement:** a dedicated page under Settings → Channel, plus an entry point from the Bin.
**Visibility:** moderators (owner or admin), plus **either side of a one-to-one channel** — those have
no owner/admin distinction to moderate with, and both members are equally entitled to it. See
[§13.2](#132-2026-08-09--review-round-role-gating-no-recoverability-claims); an earlier draft shipped
this ungated.

Renderer-only work. The middleware side merged as
[anytype-heart#3237](https://github.com/anyproto/anytype-heart/pull/3237) (GO-7433) into heart
`develop` on 2026-08-09; no Go work is required. Tracked on the desktop side as **JS-9851**.

---

## 2. Backend contract (verified)

Verified against `../anytype-heart`, `pb/protos/commands.proto:3053` (merged as #3237, §13.2):

```
Rpc.Object.DeletionAudit
  Request  { spaceId: string, keys: []string, offset: int32, limit: int32 }
  Response { error, records: []google.protobuf.Struct, total: int64 }
```

Records are ordered **newest removal first**, tie-broken by object id. `limit: 0` means unlimited.
`total` ignores limit/offset.

`keys` projects the returned relations. Verified against `core/object.go:837-876`:

- **Forced** — always returned regardless of `keys` (`forcedDeletionAuditKeys`, :860):
  `id`, `deletedBy`, `deletedDate`, `isUninstalled`.
- **Default** — used only when `keys` is empty (`defaultDeletionAuditKeys`, :837): `name`, `creator`,
  `createdDate`, `addedDate`, `createdInContext`, `createdInContextRef`, `lastModifiedBy`,
  `lastModifiedDate`, `type`, `resolvedLayout`, `sizeInBytes`, `fileId`, `sourceObject`,
  `deletionChangeId`.

Passing any `keys` **replaces** the default set (it does not extend it), so anything we render must be
listed explicitly. The forced keys are unioned on top either way.

### 2.1 Two kinds of record

**`isUninstalled` is the discriminator, and the UI must branch on it.** `true` = uninstalled; absent
or `false` = deleted. Presenting them identically misstates what happened in both directions.

| | `isUninstalled` absent — **deleted** | `isUninstalled: true` — **uninstalled** |
|---|---|---|
| what it is | an object destroyed outright | a type, property, relation option or template removed |
| reversible | **no** | **yes** — it can be reinstalled |
| tree | gone, every change including the root | intact |
| `name` | **never available** | available |
| creation-side fields | only if deleted by a build that preserves them | always, authoritative from the tree root |
| `deletionChangeId` | shared by everything removed in one operation → groups | the object's own change → groups nothing |

Anytype never actually deletes types or properties: `deleteDerivedObject` sets `isUninstalled = true`
and leaves the tree alone. "Alice deleted the Task type" is really "Alice uninstalled it, and anyone
can put it back."

Attribution takes the **last** change that set `isUninstalled` to true, not the first
(`core/block/deletionaudit/deletionaudit.go:300-303`) — because installing a bundled type again clears
the flag, so a reinstall/re-uninstall cycle must attribute the most recent actor.

### 2.2 Fields

| field | present | notes |
|---|---|---|
| `id` | always | |
| `deletedBy` | always | participant id (`_participant_<space>_<identity>`) |
| `deletedDate` | always | unix seconds |
| `isUninstalled` | uninstalled only | the kind discriminator |
| `deletionChangeId` | always | groups deletions; groups nothing for uninstalls |
| `name` | **uninstalled only** | |
| `sourceObject` | uninstalled only | bundled origin, if installed from the marketplace |
| `creator` | per §2.1 | participant id |
| `createdDate` | per §2.1 | |
| `addedDate` | per §2.1 | set for imported objects |
| `createdInContext` | per §2.1 | object id it was created inside |
| `createdInContextRef` | per §2.1 | block id / relation key / message id within that object |
| `lastModifiedBy` | per §2.1 | participant id |
| `lastModifiedDate` | per §2.1 | |
| `type` | per §2.1 | type object id |
| `resolvedLayout` | per §2.1 | `I.ObjectLayout` |
| `sizeInBytes`, `fileId` | files only | |

### 2.3 Three constraints that shape the UI

These are properties of the backend, not oversights. Design around them.

**A *deleted* row can never show a title.** Deleting an object destroys its tree, and the tombstone
deliberately keeps no user-authored content — no name, description or snippet. Such a row shows an
icon + type, the participants and the dates. **Uninstalled rows are the exception: they keep their
name, and must render it** — identifying *which* type or property someone removed is the entire point
of those rows, and falling back to a generic "Type" throws that away.

**Creation-side fields are optional — for deleted rows.** Objects deleted *before* this feature ships
carry only the forced keys. Critically that includes `type` **and** `resolvedLayout`, so a degraded row
has no name, no type and no icon. Expect these to be the majority of *deleted* rows in existing
accounts for a long time. **Uninstalled rows are never degraded.**

**No events.** This is a one-shot request, not a subscription. Nothing pushes when a removal happens
while the page is open.

### 2.4 First-call cost

The backend materialises lazily. The first call in a space walks the whole settings tree **and** walks
the tree of each uninstalled type/property to find who uninstalled it. Later calls skip the settings
walk unless the tree grew, and re-walk an uninstalled object only if its audit fields went missing —
the indexer overwrites them whenever it re-indexes that object, so this is self-healing rather than
cached. In an account with a long history the **first** open can take noticeably longer than later
ones. Do not assume sub-100ms.

---

## 3. Page shell

The page renders **full-width**, not in the 640px settings column.

`.settingsPageContainer` is `max-width: 640px` (`src/scss/page/main/settings.scss:10`), which cannot
comfortably carry four resolved columns — the more so because deleted rows have no title to anchor
them and lean entirely on those columns. The Bin already solves this: it
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

### 4.2 `src/ts/lib/api/service.ts` — generated, do not hand-edit

**Both this spec's earlier draft and the plan's Step 2 were wrong about this file.** It is generated
by `scripts/generate-service-registry.js`, which the proto script invokes as its last step, parsing
heart's `pb/protos/service/service.proto` and writing `src/ts/lib/api/service.ts` wholesale (:185).
Hand-editing it would be overwritten on the next regeneration.

**Corrected 2026-08-09, after actually running it:** `src/ts/lib/api/service.ts` **already contained**
`ObjectDeletionAudit` (:245) — and `SpaceBotAccountEnsure` (:311) — from an earlier commit. Running
`generate-protos.sh` produced a **zero-line diff** to tracked files.

An earlier draft of this section predicted both entries would be added by the regeneration. That was
wrong: it rested on a grep that never executed (`--include=*.ts` unquoted, rejected by zsh as
`no matches found`), whose empty output was misread as "absent".

What remains true and is the point of this section:

- `service.ts` is **generated output** and must not be hand-edited — `generate-service-registry.js:185`
  rewrites it wholesale from `service.proto`. The plan's Step 2 says to hand-edit it; do not.
- Running the script is still **required**, just not for `service.ts`: it produces the TypeScript
  bindings under `middleware/` (`Rpc_Object_DeletionAudit_Request`/`_Response`, `commands.ts:3521`),
  which `service.ts` references and `typecheck` needs. `middleware/` is **gitignored**, so this step
  leaves no trace in the diff — which is exactly why it is easy to skip and then see typecheck fail.
- The script's local mode runs `make install-dev-js` inside the heart checkout first, which needs a Go
  toolchain and takes minutes. `--from-dist` skips that but reads the released protos, which do **not**
  contain `DeletionAudit` — so it is not an option here.

### 4.3 `src/ts/lib/api/command.ts`

Next to `ObjectCleanupSuggestions` (:1567):

```ts
/**
 * Lists what was removed from the space, newest first: objects deleted outright, and
 * types/properties uninstalled. Branch on isUninstalled — only the latter is reversible,
 * and only the latter carries a name.
 * id, deletedBy, deletedDate and isUninstalled are always returned regardless of keys.
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
would therefore arrive carrying a fabricated **"Untitled"**. The same function also does
`object.layout = Number(object.layout) || I.ObjectLayout.Page`, which would silently give every
degraded record a **Page** icon regardless of what it actually was.

**The two-kinds change makes this decision more important, not less.** It might look as though the
arrival of real names on uninstalled rows weakens the argument. The opposite: `name` is now
*load-bearing*, and §5.2's label rule reads it directly. It must therefore mean exactly "the real name,
or nothing". `mapper` destroys precisely that property — after it runs, `record.name` is truthy on
every row, and the only surviving safe test is `isUninstalled`. Any code path that forgets to check
the discriminator then renders "Untitled" as though it were a title. With bare `Decode.struct`,
`undefined === record.name` stays a truthful test and the failure mode is a missing label rather than
a fabricated one.

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
	'name', 'creator', 'createdDate', 'addedDate', 'createdInContext', 'createdInContextRef',
	'lastModifiedBy', 'lastModifiedDate', 'type', 'resolvedLayout', 'sizeInBytes',
	'sourceObject', 'deletionChangeId',
	'iconName', 'iconEmoji', 'iconOption', 'iconImage',
];
```

`id`, `deletedBy`, `deletedDate` and `isUninstalled` come back regardless (§2). Passing keys replaces
the default set, so everything rendered has to be named here.

Two deliberate differences from the backend's default set:

- **`fileId` omitted.** It is in the default set but nothing renders it; `sizeInBytes` covers the file
  case. Keeping the list to what we draw is the point of naming it at all.
- **The four `icon*` keys added.** They are *not* in the default set, but an uninstalled row keeps its
  tree and therefore its real icon, and `IconObject` reads `iconName`/`iconEmoji`/`iconOption`/
  `iconImage` rather than deriving everything from layout. Without them a removed "Task" type falls
  back to a generic type glyph — the same loss of identity that §2.3 warns about for names. Deleted
  rows simply have none of these, and fall through to `U.Object.defaultIcon` as before.

  **Confirmed 2026-08-09:** uninstalled records do carry the `icon*` keys. This was the one open
  backend assumption in the key set; it is now settled and the keys stay.

---

## 5. The row

Four columns, fixed 42px rows, no selection and no actions — the page is read-only throughout.
Column headers are **kind-neutral** ("Removed by", "Removed"), because one list carries both kinds;
the per-row verb and badge carry the distinction (§5.5).

```
OBJECT                          REMOVED BY     REMOVED         CREATED BY
─────────────────────────────────────────────────────────────────────────
📄 Page                         👤 Anna        12 Mar 2026     👤 Roman
🏷 Task  ↩ Uninstalled          👤 Roman       12 Mar 2026     👤 Anna
🖼 Image  2.4 MB                👤 Roman       12 Mar 2026     —
▢  ⋯m8x1c                       👤 Anna        08 Mar 2026     —
🔤 Due date  ↩ Uninstalled      👤 Anna        07 Mar 2026     👤 Anna
```

Rows 2 and 5 are uninstalled: real names, real icons, complete creation half, and a badge marking
them reversible. Rows 1, 3, 4 are deleted. Row 4 is additionally degraded.

### 5.1 The two tests

Every row runs one of these, and they are not the same question.

```ts
const isUninstalled = Boolean(record.isUninstalled);
const isDegraded    = !isUninstalled && (undefined === record.resolvedLayout);
```

**Kind** (`isUninstalled`) decides the verb, the badge, and whether a name may be shown. It is a forced
key, so it is present on every record.

**Degraded** (`undefined === record.resolvedLayout`) decides whether the row can describe itself at
all. `resolvedLayout` is untouched by our decode path, so this test survives intact, and it is the same
condition under which `type` is absent — one flag governs both the icon and the type name.

The two are related but must stay separate: §2.1 guarantees uninstalled rows are **never** degraded, so
`isDegraded` is conjunctively guarded on `!isUninstalled`. Writing it as a bare `resolvedLayout` check
would still be correct today, but the explicit guard states the invariant rather than relying on it.

### 5.2 Resolution

**The label rule.** This replaces the earlier draft's unconditional "never show a title":

```ts
// name is only ever present on uninstalled rows (§2.2), so the isUninstalled
// check is belt-and-braces — but it keeps the invariant local and readable.
const label = (isUninstalled && record.name) ? record.name : typeName;
```

Show `name` when present; fall back to the type name only when it is absent. A removed type, property
or relation option renders its **actual** name — "Task", "Due date", "In progress" — because knowing
*which* one someone removed is the whole value of those rows. Falling back to a generic "Type" when a
real name is available is a regression, not a safe default.

| shown | source | how |
|---|---|---|
| label | `name`, else type name | see the rule above; id chip (§5.3) when neither exists |
| icon | `icon*` keys, else `resolvedLayout` | `<IconObject object={{ id, layout: resolvedLayout, type, iconName, iconEmoji, iconOption, iconImage }} />`; uninstalled rows keep their real icon, deleted rows fall through to `U.Object.defaultIcon` |
| type name | `type` | `S.Record.getTypeById(type)?.name`; dash when the type object is itself deleted |
| removed by | `deletedBy` | `U.Space.getParticipant(id)` → avatar + name |
| created by | `creator` | `U.Space.getParticipant(id)` |
| dates | `deletedDate`, `createdDate` | `U.Date.dateWithFormat(S.Common.dateFormat, t)` |
| size | `sizeInBytes` | `U.File.size(Number(v))` — files only, omitted otherwise |
| kind badge | `isUninstalled` | §5.5 |

`U.Space.getParticipant` (`src/ts/lib/util/space.ts:416`) reads the participant subscription, which is
live wherever this page renders. It returns `null` for a participant who has left the space; fall back
to the last 5 characters of the identity segment of `_participant_<space>_<identity>` — deliberately
the same visual grammar as the object id chip below.

`createdInContext`, `createdInContextRef` and `sourceObject` are requested but **not rendered in v1**.
They are fetched so that a follow-up can surface them without a contract change. `sourceObject`
specifically would let an uninstalled row say "from the marketplace" and eventually drive a reinstall
affordance (§12).

### 5.3 The id chip

Shown **only on degraded rows**, where it is the row's sole truthful identity. Rows that can name
themselves — by `name` or by type — show that instead; the chip never appears alongside a label.

Because uninstalled rows are never degraded (§2.1), the chip can only ever appear on a deleted row.
That falls out of the `isDegraded` definition in §5.1 rather than needing its own check.

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

**This tooltip never appears on an uninstalled row.** Those always carry their full creation half
(§2.1), so they render no dashes at all. If one ever does, that is a backend bug worth reporting
rather than a copy path to design for.

### 5.5 Distinguishing the two kinds

The plan calls mis-labelling an uninstall a **correctness bug, not a wording nit** — a member reading
"Alice deleted the Task type" concludes work was destroyed when the type was not.

**The client makes no claim of recoverability, in either direction.** Uninstalled types and properties
*are* reinstallable in principle, but there is no reinstall path in the client yet (§12), so telling a
member something "can be added back" would promise an action they cannot take. The earlier draft's
"Uninstalled" badge and its reversible-wording verb are **both removed**.

What remains is honest and sufficient:

- **The kind is visible without hovering**, because an uninstalled row renders its name with its kind
  trailing it — "Crypto (Object Type)", "Due date (Property)". A deleted row shows the kind alone.
  §5.2's label rule produces this; nothing extra is needed.
- **Only deleted rows claim permanence**, via the icon tooltip
  (`pageSettingsSpaceDeletionAuditDeleted`). Uninstalled rows carry no icon tooltip at all.
- **The page description is kind-neutral** and states no outcome for either.

The trade-off is deliberate: the two kinds are now distinguished by *what a row is* rather than by a
badge asserting what can be done about it. Restoring a badge is a pure render change if a reinstall
path later makes the claim true.

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

**Loading:** `<Loader />` while `isLoading && !records.length` — first-open only. §2.4 means this is a
real state, not a formality.

**Empty:** `<EmptySearch text={translate('pageSettingsSpaceDeletionAuditEmpty')} />` when `total == 0`.

**Refresh:** none in v1. There are no events (§2.3) and the list reloads on mount and space change.

**Row ordering under concurrent deletion:** offsets are stable between calls as long as no new deletion
lands mid-scroll. If one does, the window shifts by one — acceptable for v1; the id tiebreak in the
backend sort keeps same-timestamp rows from reshuffling arbitrarily.

**Grouping:** flat rows in v1. `deletionChangeId` is requested so that grouping cascade deletions under
one header becomes a pure-render follow-up with no contract change. If early testing shows a single
collection deletion filling a screen, this gets promoted.

When that follow-up happens, one rule from §2.1 must not be lost: `deletionChangeId` groups only
**deleted** rows. On an uninstalled row it is the object's own change, unique to it, so grouping by it
would wrap every uninstall in a meaningless group of one. Group deleted rows; render uninstalled rows
flat.

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

Column-header keys are prefixed `...Column*` to keep them clear of the per-row verb keys. The earlier
draft used `...Deleted` for the date column, which now collides with the verb the plan's Step 9 asks
for; the headers moved rather than the verbs.

| key | purpose |
|---|---|
| `pageSettingsSpaceDeletionAudit` | nav label + page title — see the naming note below |
| `pageSettingsSpaceDeletionAuditDescription` | one line under the title; must set up **both** kinds |
| `pageSettingsSpaceDeletionAuditEmpty` | empty state |
| `pageSettingsSpaceDeletionAuditColumnObject` | column header (label / type / id) |
| `pageSettingsSpaceDeletionAuditColumnRemovedBy` | column header — kind-neutral (§5) |
| `pageSettingsSpaceDeletionAuditColumnRemoved` | column header (date) — kind-neutral |
| `pageSettingsSpaceDeletionAuditColumnCreatedBy` | column header |
| `pageSettingsSpaceDeletionAuditDeleted` | per-row verb — permanent wording |
| `pageSettingsSpaceDeletionAuditUninstalled` | per-row verb — reversible wording |
| `pageSettingsSpaceDeletionAuditUninstalledBadge` | the §5.5 badge label |
| `pageSettingsSpaceDeletionAuditUnknownCreator` | records with no creation half |
| `pageSettingsSpaceDeletionAuditMissingTooltip` | §5.4 explanation for every dash |
| `commonId` | "ID" — label for the id-chip copy toast (§5.3); verified absent from `text.json` today |

**Naming note.** "Deletion history" no longer describes the page: it lists uninstalls too, and calling
those deletions is the exact error §5.5 exists to prevent. "Removal history" is the honest title and
what this spec assumes. The route id, component name and analytics event stay `...DeletionAudit` —
they track the RPC, not the copy, and renaming them would churn four registration points for no user
benefit. **The user-visible title is a product-copy call**, flagged here rather than decided.

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
| Step 2 hand-edits `src/ts/lib/api/service.ts` | Left alone — generated, and already correct | `generate-service-registry.js:185` writes it wholesale; the entry was already committed at :245 — §4.2 |
| Step 3's `KEYS` has no icon keys | Adds `iconName`, `iconEmoji`, `iconOption`, `iconImage` | Uninstalled rows keep their real icon and lose it otherwise — §4.5 |
| Step 9 uses `...Deleted` for a column header *and* a verb | Headers prefixed `...Column*` | The two collide in one namespace — §8.1 |
| Title "Deletion history" | "Removal history" proposed | The page lists uninstalls too; calling them deletions is the error §5.5 prevents. Flagged as a copy call, not decided |

---

## 10. Testing

**Automated:**
- `bun run typecheck` and `bun run lint` — required after changes per CLAUDE.md.
- Storybook story at `src/ts/component/page/main/settings/space/deletionAudit.stories.tsx`, following
  the shape of `storage.stories.tsx`, covering four states: **populated** (both kinds present),
  **degraded** (deletion-half only), **uninstalled-only**, and **empty**.

**Manual**, against a heart built from `go-7431-delegated-identity-signing`:

1. Delete an object permanently → it appears with both halves populated.
2. Delete a parent with bound children → one `deletionChangeId` across all rows.
3. Open in an account with pre-existing deletions → those rows show the deletion half only, render an
   id chip and a neutral icon, and every dash tooltips. **This is the case most likely to be missed.**
4. Remove a type **and** a property → both appear as *uninstalled* rows, **with their real names**
   ("Task", "Due date"), their real icons, a complete creation half, and wording that reads as
   reversible rather than permanent.
5. Reinstall that type, then have a **different member** uninstall it again → the row attributes the
   **latest** uninstaller, not the first (§2.1).
6. A deleted row and an uninstalled row in the same list → **visually distinguishable without
   hovering** (§5.5).
7. Personal channel → page loads, `deletedBy` is always you.
8. Channel with >50 removals → scroll past the first page; no duplicates, no gaps.
9. Switch channels with a request in flight → no stale rows from the previous channel.
10. First open in an account with a long history → loader appears, page does not look hung. §2.4 means
    this now also walks every uninstalled object's tree, so it is slower than the earlier estimate.
11. Reader (non-writer) role → page renders; note the sidebar caveat in §11.

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

**`isUninstalled` is absent, not `false`, on deleted rows.** Read it as `Boolean(record.isUninstalled)`.
A strict `=== false` test matches nothing and silently classifies every deleted row as uninstalled.

**"Uninstalled" and "degraded" are different questions and must not be conflated.** Uninstalled rows
are fully populated; degraded rows are deleted rows missing their creation half. A single
`hasName`-style flag standing in for both is the most likely way this row renderer goes wrong — §5.1
keeps them as two named booleans for that reason.

**Passing `keys` replaces the backend default set rather than extending it** (`core/object.go:869-876`).
Anything dropped from `KEYS` stops arriving, silently, as an absent field rather than an error — which
the row renderer will then treat as a degraded record.

---

## 12. Out of scope for v1

- Filtering by participant, kind or date range — the RPC takes none of them; all need backend work.
- Grouping by `deletionChangeId` — the key is fetched, the render is deferred (§6).
- Surfacing `createdInContext` / `createdInContextRef` / `sourceObject` — fetched, not rendered (§5.2).
- Restore from the audit. For **deleted** rows there is nothing to restore from — the tree is
  destroyed. **Reinstall** from an uninstalled row is genuinely feasible (the tree is intact, and
  `ObjectImport` already reinstalls bundled types) and `sourceObject` is already being fetched for it,
  but it is deliberately left out of v1: it turns a read-only audit view into an action surface, which
  brings role gating and confirmation flows with it.
- Export of the audit list.
- Live updates. Acceptable for an audit view; making the list react to deletions syncing in is a
  subscription-backed redesign on the heart side, not a client fix.
- Fixing `Action.openSettings`'s dropped route (§8.2) — file separately.
- Mobile clients.

---

## 13. Amendment log

### 13.1 2026-08-09 — two kinds of record

The backend stopped returning deletions only. `ObjectDeletionAudit` now merges **deleted** and
**uninstalled** records into one chronological list, discriminated by `isUninstalled`. Amended against
the updated `docs/plans/2026-08-09-deletion-audit-desktop.md`, re-verified against
`core/object.go:833-876` and `core/block/deletionaudit/deletionaudit.go`.

**The constraint that had to be relaxed.** The first draft stated, unconditionally, that a row can
never show a name, and built the row identity around icon + type with an id chip as the last resort.
That is now true of **deleted** rows only. Uninstalled rows keep their tree and therefore their name,
and must render it — a removed type shown as a generic "Type" throws away the only thing that makes
the row worth reading.

What that obsoleted, and what it did not:

| first draft | status |
|---|---|
| "There is no `name`" as a §2 constraint | **Obsolete.** Now scoped to deleted rows (§2.3) |
| Row identity = icon + type | **Superseded** by the label rule: `name` → type name → id chip (§5.2) |
| id chip on any row lacking `resolvedLayout` | **Kept**, and now provably deleted-only, since uninstalled rows are never degraded (§5.3) |
| Missing-value tooltip on every dash | **Kept**, narrowed: uninstalled rows render no dashes (§5.4) |
| Bare `Decode.struct` over `S.Detail.mapper` | **Kept and strengthened** — `name` became load-bearing, which is exactly what `mapper` would destroy (§4.4) |
| Full-width shell, flat v1 rows, no refresh | **Unaffected** |
| Pagination, race guard, registration points | **Unaffected** |

Also changed in this pass:

- Column headers made kind-neutral, with a badge and a branched verb carrying the distinction (§5.5).
  Mislabelling an uninstall as a deletion is treated as a correctness bug, not a wording nit.
- `KEYS` gained `name`, `sourceObject` and four `icon*` keys (§4.5).
- l10n keys restructured to stop the header/verb collision, and the page title questioned (§8.1).
- `deletionChangeId` grouping scoped to deleted rows, so the deferred grouping work does not wrap every
  uninstall in a group of one (§6).
- First-call cost revised upward: the backend now also walks each uninstalled object's tree (§2.4).

**Found independently of this amendment**, while starting implementation: `src/ts/lib/api/service.ts`
is **generated**, not hand-written. Both the plan's Step 2 and this spec's §4.2 said to edit it by
hand. Corrected in §4.2 and §9.

**Still open, unchanged by this amendment:** the placeholder sidebar icon (§7), the missing-value
tooltip copy (§5.4), the badge wording and whether deleted rows should be badged too (§5.5), and now
the page title (§8.1). All are product/design calls, flagged rather than decided.

---

### 13.2 2026-08-09 — review round: role gating, no recoverability claims

Changes from reviewing the page against a live backend. Several corrected things this spec had
asserted from the plan rather than observed.

**Access is now gated.** §1 previously said "everywhere, including personal channels. No role gating."
That is reversed: moderators, plus either side of a one-to-one. Three surfaces enforce it — the sidebar
entry, the Bin button and the page's own guard — all reading one predicate,
`U.Space.canMyParticipantSeeDeletionAudit()` (`src/ts/lib/util/space.ts`), so a hidden entry point and
a reachable page cannot drift apart. The page redirects via `U.Space.openDashboard()` **before** any
request is issued and renders `null` meanwhile, so a hand-typed route discloses nothing. `isOneToOne`
lives only on the spaceview, which is why the predicate reads it there — every other call site in
`space.ts` does the same.

**No recoverability claims** — the badge and reversible verb are gone. See §5.5.

**The icon bug, and what caused it.** Uninstalled types rendered a generic document glyph. The cause
was in this client, not the backend: `Number(record.resolvedLayout) || I.ObjectLayout.Page` collapsed a
missing layout to `Page` (0). Diagnosed from the glyph itself — `U.Object.defaultIcon` returns
`default/type` for a Type layout, so a `default/page` glyph proved the value never arrived as `Type`.
Now falls back to `layout` before giving up, and renders the ghost icon when neither exists. Separately,
`relationKey` and `relationFormat` were added to `KEYS`: `IconObject`'s Relation branch
(`iconObject.tsx:374`) renders off those, not the `icon*` keys, so uninstalled properties were falling
back to a generic glyph.

**Type moved inline, not into a column.** A "Type" column was built and then reverted — for uninstalled
rows the type is a qualifier on the name, not an independent axis. It now trails the name in
parentheses. Layout-derived names (`layoutName()`) take precedence over the type object's own name for
the Type/Relation/Option layouts, because the bundled types still carry pre-rename wording ("Relation",
"Relation option") that would otherwise leak into the UI as it is renamed to Property.

**Smaller corrections:**

- Date column widened 16% → 19% with `text-overflow-nw`; it was clipping mid-string ("February 25,"),
  which reads as corrupt data rather than truncation. Hovering shows date + time from `S.Common.timeFormat`.
- The id fragment gained a leading ellipsis, marking it a tail rather than a whole id.
- Sidebar icon changed from `common/bin` — which made the nav row indistinguishable from the Bin's —
  to `common/clock`, matching the Bin entry point.
- `List` uses `rowCount={total}`, not `records.length` as §6 originally said, rendering a placeholder
  for unloaded indices. With `records.length` the list can only render the first page, so scrolling
  never reaches the threshold that triggers `loadMoreRows` and pagination silently never fires.
- New l10n key `pluralPropertyOption`; `pageSettingsSpaceDeletionAuditUninstalled` and
  `...UninstalledBadge` removed.

**Backend reference corrected.** The middleware work merged as
[anytype-heart#3237](https://github.com/anyproto/anytype-heart/pull/3237) (GO-**7433**) into heart
`develop` on 2026-08-09. This spec and the plan both cited the branch
`go-7431-delegated-identity-signing`, which is a different branch that also carried the code. Tracked
on the desktop side as **JS-9851**.
