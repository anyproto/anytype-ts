# Design: "Created in" — navigating back to an object's origin context

**Date:** 2026-08-23
**Branch:** not yet created
**Status:** Draft for review

## Problem

File, image, video, audio and bookmark objects are artifacts: they get created *inside* something else — dropped into a document block, attached to a chat message, set as a cover or icon, created in a collection. Once you land on such an object's own page, there is no way back to where it came from.

This is worse than it sounds, because the origin link is **deliberately not a backlink**. `createdInContext` sits in `relationsToSkipLinksIndexing` (`anytype-heart/core/block/editor/smartblock/links.go:27`, with a dedicated test at `smartblock_test.go:469`), so the context object does not appear in the file's backlinks and the file does not appear in the context's outbound links. The provenance exists in details and nowhere else. If we don't render it, it is unreachable.

The data to fix this already exists on every relevant object:

- **`createdInContext`** — object id of the context. Bundled, format `object`, `readonly: true`, `hidden: false`, and a system relation (`pkg/lib/bundle/relations.json:1356-1366`, `systemRelations.json:109`).
- **`createdInContextRef`** — an inner locator within that context: a block id, a relation key, or (in future) a message id. Bundled, format `shorttext`, `hidden: true`, `readonly: true` (`relations.json:1367-1376`).

## What already works

Both of these were verified against the current `anytype-heart` and `anytype-ts` trees. They are load-bearing for the design, because together they mean **this feature needs no backend change**.

### Dependent details arrive on object open

Opening any object already delivers the context object's `name` / `iconImage` / `layout` alongside it:

`smartblock.go:466` calls `dependentSmartIds` → `objectlink.DependentObjectIDs` with `Details: true` and — critically — *without* `NoSystemRelations` / `NoHiddenBundledRelations`, which are only set on the links path (`links.go:48`). `AllRelationKeys()` aggregates both details and localDetails (`state/details.go:37`), `createdInContext` is format `object`, and `collectIdsFromDetail` hard-skips only `id` / `links` / `type` / `featuredRelations` (`dependent_objects.go:226-231`).

So the context id lands in `depIds` and its details arrive with the ObjectView. Deps yes, links no — exactly the combination this feature wants.

### The ref is written, in every path that matters

- **Drag-and-drop into a block** — heart stamps the block id itself: `SetCreatedInContext(dp.contextId).SetCreatedInContextRef(f.blockId)` (`core/files/fileuploader/dragndrop.go:684-685`).
- **`FileUpload` RPC** — both fields forwarded (`core/block/editor.go:441-443`).
- **Block file upload** — both fields forwarded (`core/block/editor/file/file.go:184-186`).

All of them persist through `uploader.go:857-860`. On the client side the ref currently carries property keys: `coverId` (`page/elements/head/controls.tsx:118`, `menu/block/cover.tsx:160,263,507`), `iconImage` (`menu/smile.tsx:846,866`, `page/auth/onboard.tsx:296`), and a dataview `relationKey` (`menu/dataview/file/list.tsx:131`).

**No backfill is required.**

### `createdInContext` is only ever set for a real context

Every writer is gated, so the property's mere presence is already a meaningful signal — there is no noise to filter:

| Writer | Gate |
|---|---|
| `block/dataview.tsx:490,667,944` | `isCollection` |
| `block/dataview/head.tsx:110` | `isCollection` |
| `block/dataview/view/calendar.tsx:61` | `isCollection` |
| `menu/block/action.tsx:546` | `isCollection` |
| `widget/index.tsx:189` | Tree widget layout **and** non-Set target |
| `block/chat/form.tsx:1110,1134` | chat attachment / bookmark |

Notably it is **never** set for objects created from a Set or a Query — only from Collections, which are genuine containers.

## Scope

Adds an origin affordance to media and bookmark object pages, plus a shared navigation primitive that deep-links into the context, reused wherever the property renders.

**In scope**

1. Ref semantics (layout-driven, no schema change)
2. `U.Object.openCreatedInContext` — the single navigation primitive
3. Reveal behaviors per ref kind
4. The "Created in" eyebrow on media / bookmark pages
5. Deep-linking `createdInContext` cell, so the property behaves the same everywhere it renders

**Out of scope**

- **Chat message refs.** Chat attachments pass `''` (`block/chat/form.tsx:1110`) because the messageId does not exist at upload time, and nothing stamps it when the message is sent. A file from a chat therefore resolves to the chat object but not to the message. This degrades gracefully — you land in the right chat — so it is deferred. §3 still specifies the message branch so that stamping the ref later is the only work needed.
- **Always-on display for normal objects.** See §4.
- **One-step featuring.** `addToType` writes `recommendedRelations`, not `recommendedFeaturedRelations` (`sidebar/page/object/relation.tsx:88`), so featuring the property is two user operations. Accepted as-is.
- Adding `createdInContext` to `J.Relation.default` (`src/json/relation.ts:2-28`). A key there widens the dep set of *every* subscription in the app — each row's context object gets subscribed via `core/subscription/deps.go:53-66` — for no benefit, since nothing in those surfaces renders it. Dataview columns already request the view's own relation keys, so a user-added `createdInContext` column resolves automatically. Add the key per-surface, if and when a surface renders it.

## Design

### 1. Ref semantics

`createdInContextRef` is an untyped shorttext. Rather than probing it, derive its meaning from the **context object's layout**, which is already available from the dependent details before we navigate:

- context layout is a chat → the ref is a **message id**
- otherwise → the ref is a **relation key** if `S.Record.getRelationByKey(ref)` resolves, else a **block id**
- empty ref → the context root itself (a collection, or a tree-widget parent)

No schema change, no resolution heuristics, no probing of the target tree.

**Latent ambiguity, deliberately not handled:** a non-chat object can host comment messages, so in principle a Page + ref could be a block id *or* a comment message id. No writer stamps comment message refs today, so the case is unreachable. If it ever becomes reachable, checking whether a block with that id exists in the already-loaded tree settles it in one line. Do not pre-empt it.

### 2. The navigation primitive

`U.Object.openCreatedInContext(object, route)` in `src/ts/lib/util/object.ts`. Single entry point for every surface:

1. Read `createdInContext` / `createdInContextRef` from the object.
2. Resolve the context object from details (already delivered as a dep). If it is missing, deleted or archived → show a toast and stop; do not navigate.
3. If the context is already the open object → reveal in place, without navigating.
4. Otherwise open it, passing the ref through `_routeParam_` — the existing channel `popup/search.tsx:2871` already uses for `messageId`, consumed via `lib/util/object.ts:88,317`. The target page reads the param on mount and reveals.

### 3. Reveal behaviors

All but one reuse existing machinery:

| Ref kind | Behavior |
|---|---|
| Block id | `U.Comment.scrollToBlock(ref)` — scroll into view + 2s `isHighlighted` (`lib/util/comment.ts:288`) |
| Message id, chat layout | Dispatch the `scrollToMessage` window event that `page/main/chat.tsx:33` already listens for |
| Message id, comment section | `U.Comment.scrollToMessage(ref)` (`lib/util/comment.ts:306`) |
| Relation key | If the relation is featured → scroll to and highlight its chip. Otherwise open the right panel (`sidebar.rightPanelToggle(isPopup, { page: 'object/relation', rootId })`) and highlight the row. |
| Empty | Open the context object, no reveal |

The relation-key branch is **the only genuinely new behavior** — the right panel has no "reveal a specific relation" entry point today. It needs a scroll-and-highlight targeting a relation row by key, matching the existing 2s `isHighlighted` convention so all four reveals feel the same.

### 4. Presentation

**An eyebrow above the title** — a muted label, then the clickable context: `IconObject` + `ObjectName` + arrow, on one line, ellipsis-truncated, with a tooltip carrying the full name and the action.

```
┌─────────────────────────────────────┐
│  Created in  ▣ Q3 Meeting notes  ↗  │  ← muted label, then link
│                                     │
│  IMG_4821.png                       │  ← HeadSimple title
│                                     │
│  [ Download ]                       │  ← primary action, untouched
│                                     │
│  ─── File info ──────────────────── │
└─────────────────────────────────────┘
```

Chosen over a second button because it reads in natural order (context → title), never competes with the primary action for row width, and degrades cleanly on long names. It reuses the visual language of the header's existing `.path` element (`component/header/main/object.tsx:63`), which is already `IconObject` + `ObjectName`.

Keep **one** label string for every ref kind, with the specificity in the tooltip, so the row never reflows between a block, a property and a message.

Mount points:

- `component/page/main/media.tsx` — above `HeadSimple` (`:246`), leaving `.buttons` (`:255`, styles at `src/scss/page/main/media.scss:93`) untouched.
- `component/page/elements/head/editor.tsx` — above the bookmark title, leaving `.bookmarkButtons` (`:204`, styles at `src/scss/component/editor/bookmark.scss:24`) untouched.

**Where it is hard-coded, and why only there.** The rule is: hard-code the eyebrow only where the page **renders no featured-relations row**.

Media pages qualify structurally: `media.tsx` renders its own layout (`HeadSimple` + the file block + relation blocks) and never renders the object's block tree, so no featured row can appear there regardless of what the tree contains.

**Bookmarks do not qualify** — corrected 2026-08-23 during implementation. The original draft claimed heart's bookmark editor adds no featured block, based on grepping `core/block/editor/bookmark.go`; that file does not exist, so the empty grep result meant nothing. Bookmarks route through `core/block/editor/page.go`, whose base template list applies `template.WithFeaturedRelationsBlock` unconditionally (`page.go:210`), and they render through the normal editor. A bookmark therefore *does* have a featured row.

The bookmark eyebrow is kept anyway, as an explicit product decision rather than a derived rule: bookmarks were named in the original request alongside media. The cost is that if someone features `createdInContext` on the Bookmark type, the origin appears twice — once as the eyebrow, once as a featured chip. That requires a deliberate act by the user and both affordances deep-link identically via §5, so it is accepted.

Normal objects **do** have a featured row, which is the app's designed, type-controlled answer to "which properties appear at the top of an object". Hard-coding an always-on row there would bypass both the type system and the user, and would stand up a second mechanism competing with the first. So normal objects surface it through the existing path: the **Local** group in the Properties panel (`sidebar/page/object/relation.tsx:22,47`) → *Add to type* (`:81`) → feature it on the type.

### 5. Deep-linking cell

Special-case `createdInContext` in `component/cell/index.tsx` so clicking it routes through §2 rather than plain-opening the context. There is precedent at `:334`, which already special-cases `source`.

Without this, the property behaves inconsistently: the eyebrow deep-links, but the same property clicked in the Local group, the Properties panel, or a featured chip dumps the user at the top of the context object with no indication of why they are there. Doing it once in the cell makes placement a free per-surface choice rather than a behavioral fork.

## Error handling

- **Context deleted / archived / not found** → toast, no navigation. The eyebrow still renders the name if details survive, otherwise it does not render at all.
- **Ref no longer resolves** (block deleted, relation removed from the object, message deleted) → open the context object and stop. Never a dead click, never an error dialog.
- **Context in another space** → out of scope; treat as unresolvable and open nothing.
- **Empty `createdInContext`** → the eyebrow does not render. No placeholder, no empty row.

## Testing

- **Unit** — ref semantics from §1: chat layout → message; known relation key → property; otherwise → block; empty → root. Table-driven.
- **Unit** — `openCreatedInContext` branching: already-open context reveals without navigating; deleted context toasts without navigating.
- **Component** — the eyebrow renders for an object with a context, does not render without one, and truncates a long name while keeping the full name in the tooltip.

E2E coverage is **out of scope** for this change by explicit decision — do not add tests to `../anytype-desktop-suite`.

## Open questions

None blocking. Two deferred items are recorded above under **Out of scope**: chat message refs, and one-step featuring.
