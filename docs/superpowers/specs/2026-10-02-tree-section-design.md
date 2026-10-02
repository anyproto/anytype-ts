# Design: "Tree" sidebar section — a hierarchy layer built from `createdInContext`

**Date:** 2026-10-02
**Branch:** `feature/sidebar-tree-section`
**Status:** Implemented, under review

## Problem

Anytype's structure is a graph: objects link to objects, and nothing is "inside" anything. Users coming from Notion-like tools miss a stable hierarchy — "this page lives under that page" — and the sidebar has no view that answers *where does this object belong*.

The data for an implicit hierarchy already exists. `createdInContext` is stamped on objects created inside another object (a link/mention created from the editor, a row added to a collection, an object created from a Tree widget, a block turned into an object). It is the implicit parent.

**Goal:** a predefined sidebar section that shows the space as a tree built from `createdInContext`, as a first step towards a hierarchy layer on top of the graph. Follow-ups (heart backfill migration, import support, link/property icons, editable parent) build on the same rule and helper.

## Decisions (agreed during brainstorming)

| Topic | Decision |
|---|---|
| Placement | New predefined sidebar **section**, alongside Recently edited / Types / Bin |
| Name | **"Tree"** — "Structure"/"Hierarchy" collide with the existing Tree widget layout label "Hierarchical Structure" (`widget1Name`); the Bin's "Switch to tree view" (`binSwitchToTree`) already means `createdInContext` nesting |
| Default state | Visible, **collapsed by default** (no subscription until opened) |
| Links ↔ Created switch | **Not in this section.** Ship created-in only; the switch comes later as a mode on every Tree widget (see Follow-ups) |
| Parent rule | B is under A only if **B was created in A *and* A still references B** (link block, @mention, property value, collection membership) |
| Gone parent | A parent that is archived, deleted, in another space, unlinked, or a Chat/Discussion **counts as no parent**. An orphan that has children becomes a root; an orphan leaf drops out |
| Chats | Chat and Discussion objects **never act as parents** (always-growing, noisy; their messages aren't in `links` anyway, but the rule is explicit so a future heart change can't flood the tree) |
| Root order | `orderId` ascending (empty last), then name |
| Child order | **Document order** — the parent's `links` order (collection order for collections) |
| Sort menu | Custom (default, above) · Name · Last edited · Created; stored on the device per space, like "Edited by" |
| Bookmarks | **Hidden by default** (pasted links create bookmark objects created in the page and bury the structure); "Show bookmarks" toggle in the section menu, stored like Sort |
| Reordering / DnD | **v1.1**, together with a heart `ObjectSetOrder` RPC |
| Implementation | Extend `widget/tree/index.tsx` with a **children source** abstraction (approach 2), so the existing Tree widgets can later switch between Links and Created |

## Verified facts this design relies on

All paths in `anytype-heart` unless prefixed with `anytype-ts`.

### `createdInContext`
- Format `object`, `maxCount: 1`, `readonly: true`, system relation (`pkg/lib/bundle/relations.json:1373-1383`, `systemRelations.json:109`).
- Synced (stored in the object's state), per-space only. Writers always use a context in the same space; a foreign or missing id is "absent" to queries.
- **Never cleared** when the context is archived or deleted — it dangles (`detailservice/set_details.go:345-412`, `block/delete.go:44-66`).
- **Not enforced read-only** by `ObjectSetDetails` (`editor/basic/details.go:72-89` only rejects type/layout keys). Any value can be written — including self-references and cycles. The public REST/MCP API refuses it (`core/api/v2/model/model.go:710-721`).
- Normal create flows cannot produce cycles (a new object always points at an existing one). Cycles can come from `ObjectSetDetails`, from importing data that already contains them, or (edge case) from `ObjectApplyTemplate`. The cleanup GC already defends against them by picking the lowest id as root (`objectgc/orphanlist.go:280-347`).
- Copied verbatim on `ObjectDuplicate` — a duplicate becomes a sibling that the parent doesn't link to (so under this design's rule it is *not* shown under the parent).
- Imported pages (importv2: Notion/Markdown/AI) get **no** `createdInContext` — only files do (`importv2/persist/file.go:73-94`). See Follow-ups.
- No any-store index on this key: `createdInContext NotEmpty` scans the space (`spaceindex/store.go:308-372`).

### What counts as a link (`editor/smartblock/links.go`, `injectLinksDetails`)
`links` is built by `objectlink.DependentObjectIDs` with `Blocks: true` (link blocks, mentions), `Details: true` (object property values, excluding system/hidden relations and icon/picture/cover), `Collection: true` (collection membership, unless `collectionDontIndexLinks`). **Not** included: set rows, chat messages. `createdInContext` itself is in `relationsToSkipLinksIndexing`.

`links` is injected on the object's own state at apply time, so it updates immediately. **Caveat:** block-derived links come first in document order, but property-derived links follow in Go map iteration order (`state.AllRelationKeys()` collects `GenericMap` keys, used by `objectlink.DependentObjectIDs`), so their relative order can change on any apply, and an object with two or more object properties re-emits `links` on every apply. This predates the feature and affects every `links` consumer; the heart fix is to iterate detail keys in sorted order in `DependentObjectIDs` (see Follow-ups). `backlinks`, by contrast, is aggregated by `backlinks/watcher.go` with a 5 s window — this is why the parent rule is checked on the **parent's `links`**, not the child's `backlinks` (otherwise a freshly created subpage would appear 5–10 s late).

### Subscriptions
- Dependencies are computed from every object-format key in `keys` (`core/subscription/deps.go:40-65`) and are one level deep. Requesting `links` with deps on would pull every linked object, so all subscriptions here use **`noDeps: true`**.
- Default subscription filters exclude archived and deleted objects; querying parents by id therefore returns nothing for archived/deleted/other-space parents — which is exactly "gone".
- `ObjectSubscribeIds` preserves the given id order; sorted views use `ObjectSearchSubscribe` with `id In` + sorts + limit.

### `orderId` (for the v1.1 follow-up)
- Hidden, readonly, `longtext`, synced. Set by `core/order/order.go` via `anyproto/lexid` (`lexid.Must(CharsBase64, 4, 4000)`), today only for space views, relation options and object types (`OrderSettable` in `editor/spaceview.go`, `objecttype.go`, `relationoption.go`).
- Writes use `ChangeTypeOrderOperation`; `lastModifiedDate` is only bumped for `ChangeTypeUserChange` (`smartblock.go:908`). Writing `orderId` through `ObjectSetDetails` would instead bump `lastModifiedDate`/`lastModifiedBy` on every reordered sibling.

### Client
- Sections (Recently edited, Types, Bin, …) are synthetic widget blocks (`sidebar/page/widget.tsx:509-545`). A closed section does not render its content, so nothing mounts or subscribes until it is opened.
- New sections default to `isClosed: false` (`store/common.ts:1372`) — the Tree section needs its own default.
- `widget/tree/index.tsx` is links-driven: per-node `subscribeIds` on `node.links`, branch-path de-duplication, toggles in `Storage` per `subKey`. `widget/tree/item.tsx` only needs a subId resolver, toggle key and handlers.
- **Existing bug:** `widget/tree/index.tsx:74` maps system-target records with a block body that never returns, so every child is `undefined` and skipped — a system widget in Tree layout (e.g. "Old Pinned") renders empty. Fixed as part of this work, since the code is being reworked anyway.

## User-facing behaviour

### Section
- New sidebar section **"Tree"**, placed after Recently edited by default; reorderable and hideable via Manage sections like the others.
- Visible for all users (new and existing), **collapsed** until the user opens it. The collapsed default applies only while the user has never toggled it.
- Listed only once the space has an object created inside another one (`U.Data.checkTreeSection`, run on space open): a one-record subscription with the tree's filters answers on open; in a space without such objects it stays to catch the first one and is dropped as soon as it does. Once shown, the section stays for the session even if the tree becomes empty. The check doesn't apply the link rule, so it can list a section whose tree is empty (only unlinked or orphaned leaves) — the empty state then explains the rule.

### Section "…" menu
- One explanatory line: *"Objects appear inside the object they were created in, as long as it still links to them."*
- **Sort:** Custom (default) · Name · Last edited · Created. Stored on the device per space (`Storage` space key), like the "Edited by" mode.
- **Show bookmarks:** off by default, a checkmark row; stored like Sort.
- Hide section · Manage sections.

### Membership rule
B is shown under A iff **all** hold:
1. `B.createdInContext == A`, and `A != B`;
2. A is present: either a live object with its own `createdInContext`, or a live top-level parent (not archived, not deleted, same space);
3. A is not a Chat or Discussion, and not one of the excluded layouts below (a parent must itself be a valid node);
4. `A.links` contains B.

Otherwise B has **no parent**. Then:
- **Roots** = objects with no parent that have at least one child.
- **Excluded entirely** (never a node, never a parent): file layouts, system layouts (types, relations, options, …), templates, participants, archived and deleted objects — and bookmarks unless "Show bookmarks" is on.
- **Cycles** (only reachable via API or import): within a cycle, the lowest id is treated as having no parent. The branch-path guard in `tree/index.tsx` additionally prevents infinite nesting.

### Ordering
- **Custom:** roots by `orderId` ascending (empty last), then name. Children in the parent's `links` order (document order; collection order for collections).
- **Name / Last edited / Created:** applied at every level.

### Rows
- Reuse the Tree widget rows: icon, name, chat counter as today. An expand arrow appears **only if the node has children under the membership rule**.
- Click opens the object; context menu is the standard object context menu.
- **No drop targets** in this section (a drop would add a link without changing the parent).
- **No "+"** in v1 (creating inside a node needs a link block in the parent to satisfy the rule; it comes with v1.1).
- Expanded state persists per node (same `Storage` toggles as the Tree widget).

### Limits (proposed values)
- First **10 roots**, then a "Show more" row (+10 per click).
- Each expanded branch shows its first **20 children**, then "Show more".
- Reason: the in-sidebar tree is not virtualized (only the full-height preview is), so an expanded 500-member collection would otherwise render 500 rows.

### Empty state
*"Nothing here yet. Objects you create inside other objects — through links, mentions or collections — will appear here."*

## Architecture

### Data flow

```
Tree section mounts (user expands it)
 ├─ edges sub    filter: createdInContext ≠ ∅, resolvedLayout ∉ excluded, type ≠ template
 │               keys: id, layout, createdInContext, links            noDeps
 └─ parents sub  filter: id ∈ {createdInContext values not present in edges}
                 keys: id, layout, links                              noDeps
                 (archived / deleted / other space → absent → "gone")
          │
          ▼
 buildCreatedForest(edges + parents) → roots, childrenOf (ordered by parent.links)
   (one MobX computed per mount, raw store reads, re-renders only when the forest changes)
          │
          ▼
 WidgetTree(source)
  ├─ roots sub    id ∈ roots, sorts: orderId↑ (empty last), name↑, limit 10 (+10)
  └─ branch subs  per expanded node: subscribeIds(childrenOf(node)[0..20])
Section collapses (unmounts) → all subscriptions destroyed
```

When Sort is Name / Last edited / Created, the roots and branch subscriptions use `subscribe` with that sort and a limit instead of the forest order.

### Units

**1. `buildCreatedForest(nodes)`** — `lib/util/createdTree.ts`, a standalone pure module (same pattern as `chatWindow.ts` / `scrollAnchor.ts`; `data.ts` imports too much to unit-test in isolation), unit-tested.
- Input: `CreatedTreeNode[]` — `{ id, contextId, links, canParent }`. The caller passes edges first, then live top-level parents (the first entry wins for a duplicate id), normalises values (`Relation.getArrayValue` / `getStringValue`), sets `canParent = false` for chats, and leaves excluded layouts and templates out entirely.
- Applies the membership rule, then breaks any remaining cycle at its lowest id.
- Output: `{ roots: string[], childrenOf: Map<string, string[]> }`; `childrenOf` is in parent `links` order.
- The existing `treeFromRecords` (Bin tree view, Cleanup popup) is left unchanged.

**2. `widget/tree/source/created.ts` — `useCreatedTreeSource({ sort })`**
- Both subscriptions exclude file/system/participant layouts and templates, plus bookmarks while "Show bookmarks" is off (toggling re-subscribes once; the current tree stays until the new records arrive); chats come back and are marked `canParent: false`.
- Owns the edges and parents subscriptions (lifecycle = mount/unmount).
- Re-subscribes `parents` only when the candidate id set changes (hash, same technique as `subscriptionHashes` in `tree/index.tsx`).
- Recomputes the forest once per data change, not per expand/collapse.
- Returns a `WidgetTreeSource`. Shaped so a future per-object Tree widget can use it with an object as root (`childrenOf(objectId)` as its roots).

**3. `widget/tree/source/links.ts` — `createLinksTreeSource(object)`** (a plain factory: it holds no state)
- Today's behaviour extracted unchanged: roots from `object.links`, children from `node.links`, sets and (optionally) files stripped, deleted/archived filtered.

**4. `widget/tree/index.tsx`** — consumes a source:

```ts
interface WidgetTreeSource {
	isLoading: boolean;
	getRootIds: () => string[];
	getChildIds: (node: I.WidgetTreeDetails) => string[];
	getSorts: (depth: number) => I.Sort[];	// empty → keep id order (subscribeIds)
	getPageSize: (depth: number) => number;	// 0 → no paging ("Show more" off)
};
```

The first-level nodes are subscribed under the widget's target object id, or the section block id when there is no target. Node subscriptions always use `J.Relation.sidebar`.

Keeps toggles, branch-path guard, virtualization and per-node subscription ids. Adds "Show more" rows (per-node limit in component state, not persisted). Fixes the `:74` bug.

**5. `widget/tree/item.tsx` and `widget/tree/more.tsx`**
- `canDrop` prop (default `true`; `false` in the section).
- "Show more" is its own row component, `more.tsx` (left click only); both rows share `getTreePaddingLeft`.
- A Set or Collection shows its set icon only when it has no children, so either expands when it does. The Tree section turns the set icon off (`withSetIcon={false}`): sets aren't special there, so a leaf set gets the regular leaf dot.
- Arrow logic unchanged: sets never have children under this rule, and collections with children already get an arrow.

**6. `widget/tree/section.tsx`** — thin wrapper the sidebar renders for the Tree section: created source + `WidgetTree`, no widget head, no create button, no drop targets, empty-state text, toggle key `${space}-tree`. It bypasses `WidgetIndex` to avoid more synthetic-block special cases there.

**7. Section plumbing**
- `I.WidgetSection.Tree = 6` (`interface/block/widget.ts`).
- `S.Common.widgetSectionsInit`: add to `allIds`; default `isClosed: true` for Tree when there is no saved entry.
- `U.Menu.widgetSections()`: add Tree.
- `U.Menu.widgetSectionContext()`: Tree branch with the explanation line and Sort options.
- `S.Common.treeSortMode` getter/setter backed by `Storage` (mirrors `recentEditMode`); new `I.TreeSortMode` enum.
- `sidebar/page/widget.tsx`: `getSections` includes Tree when `S.Common.hasTreeSection` (unless hidden); render `widget/tree/section.tsx` for it.
- `U.Subscription.createdTreeFilters(showBookmarks)`: the shared layout/template/bookmark filters of the edges, parents and probe queries; `J.Constant.subId.treeProbe`.
- `J.Constant.subId.treeEdges`, `J.Constant.subId.treeParents`.
- `src/json/text.json`: `widgetSection6` ("Tree"), `widgetTreeHint`, `widgetTreeEmpty`, `widgetTreeSortMode0-3` (mirroring `widgetRecentEditMode*`); `commonShowMore` and `commonSort` are reused.
- Section placement: a section missing from the saved order is appended as before, except Tree, which is inserted after Recently edited.

### Cost
- On open: one unindexed scan (edges) plus one id lookup (parents). Payload ≈ created objects × their link counts (10k objects × ~5 links ≈ 3 MB), only while the section is open.
- Updates fire when `links`, `createdInContext` or layout change on those objects — not on plain text typing.

### Loading and errors
- Render nothing until both edges and parents have returned, so orphans don't flash as roots and then jump.
- On subscription error: show the empty state and log.
- Space switch: subscription ids are space-scoped (`U.Subscription.spaceSubId`); the sidebar remounts.

## Testing

- **Unit (vitest)** for `buildCreatedForest`:
  - plain parent/child, multi-level chain;
  - unlinked child (created in A, not in `A.links`) → no parent; promoted to root only if it has children;
  - archived/deleted/other-space parent (absent from inputs) → same;
  - Chat, Discussion and excluded-layout (e.g. file, type) parents ignored;
  - self-reference; 2-cycle; 3-cycle → lowest id becomes root, no node lost;
  - child order follows `A.links`, including links to non-children interleaved;
  - collection parent with members in `links`.
- **Typecheck and lint:** `bun run typecheck`, `bun run lint`.
- **Manual (web mode, `bun run start:web`):**
  - section collapsed by default and no subscription while collapsed;
  - create a subpage via link → appears immediately under the parent; delete the link block → disappears;
  - add/remove a collection member;
  - archive a parent → its children follow the gone-parent rule;
  - sort modes; "Show more" at root and branch level; toggles persist across reload.
- **Regression:** existing pinned Tree widgets (links source) behave exactly as before, including "Old Pinned" in Tree layout now rendering its items.
- **E2E:** run `/qa-engineer` (sidebar change) to add coverage in `anytype-desktop-suite`.
- **Docs:** `/update-docs` for `docs/src/ts/component/widget/README.md`; `/dark-mode-check` if any SCSS or icons are touched.

## Out of scope / follow-ups

**v1.1 — editing structure from the tree**
- Heart: `OrderSettable` for page-like objects and a generic `ObjectSetOrder { spaceId, objectIds }` (full visible sibling list, reusing `core/order` `reorder`, `ChangeTypeOrderOperation`).
- Client: drag-and-drop to reorder roots (siblings only; cross-parent drag = re-parenting, see below). Children keep document order — reorder them by moving blocks in the page.
- "+" on a row to create inside a node (sets `createdInContext` **and** adds a link block, as the Tree widget already does in `widget/index.tsx:189-219`).

**Later**
- Heart: iterate detail keys in sorted order in `objectlink.DependentObjectIDs`, so property-derived `links` keep a stable order and stop re-emitting on every apply.
- Links / Created-here mode on every Tree widget ("Show: All links / Only objects created here"), via `useCreatedTreeSource` with an object root.
- Heart migration to backfill `createdInContext` for older non-file objects.
- Import (importv2 and others) preserving `createdInContext` for pages.
- Icons on link blocks and property values for objects created inside the current object (or the opposite, for linked-only ones), reusing the membership rule.
- Unset / change the parent with sanity checks (no cycles). Once editable, the property name "Created in" may need renaming (e.g. "Located in" / "Parent").

## Open items

- Limit values (10 roots / 20 children) are proposals; adjust after testing on a large space.
- Analytics: v1 reuses the existing tree events (`OpenSidebarObject`, `OpenSidebarObjectToggle`, `CloseSidebarObjectToggle`). Decide whether a section-specific route/param is needed.
- Exact copy for the explanation line and empty state is subject to design/copy review.
