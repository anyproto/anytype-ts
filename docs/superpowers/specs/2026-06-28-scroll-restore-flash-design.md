# Design: Flash-free scroll restoration on object/chat open

**Date:** 2026-06-28
**Branch:** `perf/scroll-restore-flash` (off `develop`)
**Status:** Draft for review

## Problem

When opening an object (editor), a set, or a chat, the saved scroll position is
restored **after** the content has already painted at the top. The browser paints
at least one frame at `scrollTop = 0`, then we imperatively write the saved scroll
in a later frame — producing a visible **flash at the top followed by a jump** to
the saved position. It reads as clunky.

Verified root cause, per surface (ground-truth code references):

- **Editor** (`component/editor/page.tsx`): `open()` (L121) stashes
  `Storage.getScroll('editor', rootId, isPopup)` into `scrollTopRef`, then fires
  async `C.ObjectOpen`. The restore write happens in the **`resizePage` callback**
  inside the render effect (L77–85) — i.e. inside a `raf`, **after** the commit
  paints. Result: paint-at-top, then jump.
- **Set** (`component/page/main/set.tsx`): worse — the restore is a **50 ms poll
  loop** (L96–118) that waits until `container.scrollHeight > target` (or 30 tries)
  before writing `scrollTop`. Visible top-then-jump after content height grows.
- **Chat** (`component/block/chat.tsx`): `init()` (L1560) loads messages then
  `scrollToBottom(false)` or `scrollToMessage(firstUnread)`. Messages render
  top-first then jump to bottom/unread; media heights settle late so it can jump
  twice. `onScroll` (L976) persists **no** scroll position today.

A pixel `scrollTop` is also **lossy**: the moment content above the fold reflows
(images decode, lazy blocks/rows mount, viewport width changes wrapping), the saved
pixel no longer maps to the same content — so even a perfectly-timed pixel write
can land slightly wrong and snap.

## Goal & constraints

- Eliminate **both** the flash and the jump.
- Restore the **exact** content position even when final content height is unknown
  at first paint (the user's explicit "open exactly at the scroll state").
- **No animations.** Maximum speed — no blank frame, no added frames before content
  is visible, no post-paint waiting.
- Honor CLAUDE.md: no unsolicited design/layout/color changes; tabs; `else if` on a
  new line; parenthesized compound conditions; `cn` class-list var; `U.Dom` helpers
  over raw DOM.

**Decisions locked with the user:**

1. **Chat = de-flash only.** Keep today's behavior (open at bottom / first unread);
   just make it land there instantly with no top-then-jump. Do **not** add
   "reopen where you scrolled to" persistence.
2. **Remove the editor open fade** (`page/main/edit.tsx` `motion.div` `opacity 0→1,
   0.12s`, L44–51). It adds latency and currently partly *masks* the flash; a proper
   pre-paint restore makes it unnecessary. This affects every object open globally.
3. **Rollout editor-first**, then set, then chat. Build and prove the shared
   mechanism on the editor (highest impact, riskiest integration), then extend.

## Chosen approach

**Pre-paint, element-anchored scroll restore**, factored into a small shared hook,
rolled out editor-first.

Two ideas combine:

1. **Write the scroll synchronously in `useLayoutEffect`** (React commit phase,
   **before paint**) so the *first* painted frame is already at the right position.
   This replaces the editor's post-paint `resizePage`-callback write and the set's
   50 ms poll loop. No blank, no added frames, no animation.

2. **Anchor to a DOM element, not a pixel.** On scroll we persist the **topmost
   visible element's id + intra-element offset**; on open we write
   `container.scrollTop = anchorEl.offsetTop − offset`. This target stays correct no
   matter how content **below** it grows. Growth **above** the fold is absorbed by
   `#page`'s default `overflow-anchor: auto`; a **short-lived `ResizeObserver`**
   re-pins through the async settle window (media decode, lazy mount), then disarms
   on "stable" or first user scroll. The legacy pixel `Storage.getScroll` remains as
   an **additive fallback** for the first open after upgrade (no anchor yet) and for
   cases where the anchor element can't be resolved.

Rejected alternatives (from the research panel):

- **Pixel-based pre-paint restore** — right timing, but the lossy pixel target still
  snaps whenever wrapping/height above the fold changed since last visit.
- **Cloak / hide-until-positioned** — trades the flash for a brief *blank*, and only
  *hides* an imperfect restore rather than fixing exactness. Dings "max speed". (May
  be kept in a pocket as a tight, bounded last-resort for the narrow set case where
  a virtualized anchor row is unmounted at commit — see Risks.)
- **CSS height reservation** (`aspect-ratio` / `contain-intrinsic-size` /
  `content-visibility: auto` on media/blocks) — violates CLAUDE.md's hard rule
  against unsolicited design/layout changes. Explicitly out of scope (could be a
  separate, opt-in rendering-perf task later).

## Architecture

### Shared hook: `useScrollRestore` (`src/ts/hook/`)

A surface-agnostic hook that owns the save trigger, the pre-paint restore write, and
the bounded settle observer. Variation between surfaces is injected via callbacks.

```
useScrollRestore({
  key,                 // 'editor' | 'set'  (storage namespace)
  rootId,
  isPopup,
  ready,               // boolean: content committed & measurable (e.g. !!root, !isLoading)
  resolveAnchor,       // (container) => { id, offset } | null   — topmost visible el + offset (SAVE)
  findAnchorEl,        // (id) => HTMLElement | null              — locate saved el (RESTORE)
  beforeRestore?,      // () => void   — synchronous pre-write work (editor: hoisted #blockLast measure)
  getObserveTarget?,   // () => HTMLElement | null  — element whose resize re-pins (.editor / .editorWrapper)
}) => { saveAnchor: () => void }
```

- **Save** (`saveAnchor`, called from each surface's existing `onScroll`): read the
  scroll container, call `resolveAnchor` to get `{ id, offset }`, persist via a new
  `Storage.setScrollAnchor(key, rootId, { id, offset }, isPopup)`; **also keep** the
  existing `Storage.setScroll` pixel write for fallback.
- **Restore** (internal `useLayoutEffect` keyed on `[rootId, ready]`): when `ready`,
  run `beforeRestore?()` synchronously, then
  `Storage.getScrollAnchor(...)` → `findAnchorEl(id)` →
  `container.scrollTop = el.offsetTop − offset`; if no anchor/element, fall back to
  `Storage.getScroll` pixel. All in the commit phase, before paint.
- **Settle**: arm a `ResizeObserver` on `getObserveTarget?()` that re-applies the
  restore write until **two consecutive equal measurements** or the **disarm cap**
  (time budget ~1 s **and** first user scroll), with an **ignore-next-scroll guard**
  so the RO's own writes don't disarm it (no feedback loop). It must not fight
  `overflow-anchor: auto` — it only corrects the saved target, it never sets
  `overflow-anchor: none`.

Geometry reads (`offsetTop`, `getBoundingClientRect`) route through the existing
`U.Dom` helpers / `lib/util/layoutCache.ts` per-frame cache to avoid an extra forced
reflow on the first frame. If a read must be live inside the layout effect, measure
the first-frame cost on a large doc before committing the `#blockLast` hoist.

### Storage additions (`src/ts/lib/storage.ts`)

Additive, alongside the existing number-shaped `getScroll`/`setScroll` (L475–510):

- `setScrollAnchor(key, rootId, { id, offset }, isPopup)` — stored under a separate
  `scrollAnchor` blob keyed identically (`getScrollKey` + popup suffix).
- `getScrollAnchor(key, rootId, isPopup): { id, offset } | null`.

No migration needed: absent anchor → pixel fallback restores acceptably; the anchor
backfills on the first `onScroll` after open.

## Per-surface plans

### Phase 1 — Editor (`component/editor/page.tsx`, `page/main/edit.tsx`)

- **Anchor resolve helper:** add a `U.Dom` helper that, given the scroll container,
  returns the topmost `#block-<id>` whose rect intersects the container's top edge,
  plus `offset = containerTop − el.rect.top`. `findAnchorEl(id)` =
  `U.Dom.get(\`block-${id}\`)` (CSS-escaped as existing code does).
- **Save:** in `onScroll` (around L2064, where the pixel `setScroll` lives) call
  `saveAnchor()` (keeps the pixel save).
- **Restore:** replace the `resizePage(callback)` restore (L77–85) with the hook's
  pre-paint `useLayoutEffect`, keyed on `rootId` + root-ready.
- **`#blockLast` hoist (required):** extract the filler-height measure (2850–2870)
  into `applyLastBlockHeight()` and call it both from `resizePage`'s `raf` **and**
  from `beforeRestore` so a near-bottom anchor is reachable on frame one (otherwise
  short / near-bottom docs clamp-then-snap).
- **Focus-vs-restore (highest integration risk):** `focus.apply()` (L90) and
  `focusSet`'s `setTimeout(15)` → `focus.scroll()` (2882–2888) scroll the container
  on open and can override the restored anchor. **When a saved scroll anchor exists
  for this `rootId`, skip `focus.scroll` on open** (or run it before the restore so
  restore wins). Resolve before wiring the layout effect.
- **Remove the open fade:** delete `initial/animate/exit` opacity on the
  `motion.div` (edit.tsx L49–51); keep `key={rootId}` for remount. (Keep
  `AnimatePresence`/`motion.div` only if removing it complicates the tree; the
  required change is dropping the opacity transition.)
- **Add `useLayoutEffect`** to the editor page import (L1).

### Phase 2 — Set (`component/page/main/set.tsx`)

- **Delete the 50 ms poll loop** (L96–118); adopt the hook with `key: 'set'`,
  `ready` = content loaded (`!isLoading` / after `setDummy`, **not** during the
  `Loader`).
- **Anchor** = topmost dataview record row (rows carry record ids in the DOM);
  `getObserveTarget` = `bodyRef` (`.editorWrapper`) so the RO re-pins as
  records/virtualized rows load.
- **No min-height spacer** on `.editorWrapper` (it fights dataview/virtual sizing);
  rely on element anchoring + RO. Validate across grid / board / list / gallery /
  calendar views.

### Phase 3 — Chat (`component/block/chat.tsx`) — de-flash only

- **Keep** open-at-bottom / first-unread behavior. **Do not** add scrolled-up
  persistence.
- **Force the open/restore path to instant:** the default `cb2` already uses
  `scrollToBottom(false)` and the first-unread `useLayoutEffect` (1712–1717) calls
  `scrollToMessage(target.id)` instant, but the stored-id/jump path can reach
  `scrollToMessage` with `animate = true` (smooth, L1313). **Force `animate = false`
  on the open/restore path.** Make the first successful write happen in the layout
  phase where possible. Keep the existing rAF + `hasScroll` retry loops (they
  correctly handle React concurrent commit). Keep relying on `overflow-anchor` for
  prepend (the ~L477 comment); never set `overflow-anchor: none`.

## Error handling / correctness

- Restore is null-safe at every hop (no container / no anchor / no element → pixel
  fallback → no-op). Matches existing defensive style.
- `ResizeObserver` is bounded (stable-frames OR time+user-scroll cap) and self-guards
  against its own writes — cannot trap the user or loop.
- Storage is additive; absent anchor degrades to today's pixel behavior.
- Pure timing/positioning change — no store shape, gRPC, or DOM-output change beyond
  removing the fade.

## Verification

1. `bun run typecheck` + `bun run lint` clean.
2. **DevTools trace, before/after**, opening the same scrolled object: confirm the
   first painted frame is already at the saved position — no frame at `scrollTop = 0`,
   no post-paint scroll write. Objective success metric.
3. Manual: open a long editor doc scrolled to the middle and near the bottom; open
   with images/embeds above the fold; switch spaces (motion.div remount); window
   resize; narrow/wide docs. No flash, no jump, lands exactly.
4. Manual: set in grid/board/list/gallery/calendar, scrolled mid-list; reopen.
5. Manual: chat opens instantly at bottom / first unread, no top-then-jump; reply /
   mention click still works.
6. `/dark-mode-check` (only if SCSS touched — fade removal may touch edit.tsx only).
7. `/qa-engineer` for the open/restore flow per CLAUDE.md.

## Risks & open questions

1. **Editor focus-vs-restore precedence** — must be resolved before wiring the
   editor layout effect (skip `focus.scroll` when a saved anchor exists).
2. **Set virtualization** — confirm each view exposes a stable DOM id for the topmost
   record at the viewport edge; define approximate-then-RO-snap when that row is
   unmounted at commit (ReactVirtualized). Only here might a tight, bounded
   `visibility:hidden` cloak (~150–200 ms, hard-capped) be a last resort.
3. **ResizeObserver settle contract** (shared) — define "stable" (N equal frames),
   disarm cap (time budget + first user scroll), and the ignore-next-scroll guard.
4. **layoutCache integration** — verify `offsetTop` / `getBoundingClientRect` reads
   inside the layout effect (and the hoisted `#blockLast` measure) don't force an
   extra reflow that janks the first frame on large docs; measure before committing
   the hoist.
5. **Storage** — confirm first-open-after-upgrade (pixel only, no anchor) restores
   acceptably; decide whether to backfill the anchor on the first `onScroll`.

## Files

- `src/ts/hook/useScrollRestore.ts` — new shared hook (save + pre-paint restore + RO).
- `src/ts/lib/storage.ts` — additive `setScrollAnchor` / `getScrollAnchor`.
- `src/ts/lib/util/dom.ts` — topmost-visible-element resolver helper.
- `src/ts/component/editor/page.tsx` — restore site (77–85), `onScroll` save (2064),
  `#blockLast` hoist (2850–2870), focus reconcile (2877–2888), import.
- `src/ts/component/page/main/edit.tsx` — remove open fade (44–51).
- `src/ts/component/page/main/set.tsx` — remove poll loop (96–118), adopt hook.
- `src/ts/component/block/chat.tsx` — force instant on open/restore path (1313 path).
