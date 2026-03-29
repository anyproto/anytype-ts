# jQuery Removal Plan

> Created: 2026-03-28 | Updated: 2026-03-29 | Status: **In Progress** | Current jQuery: `^3.7.1` (192 KB minified)

---

## Migration Progress

### What's Done

| PR | Phase | Description | Files | Call Sites |
|----|-------|-------------|-------|------------|
| [#2103](https://github.com/anyproto/anytype-ts/pull/2103) | 0 + 1a | `U.Dom` helpers (`get`, `select`, `selectAll`, `addClass`, `removeClass`, `toggleClass`, `hasClass`, `contentWidth`, `contentHeight`) + class manipulation migration in 23 files | 24 | ~42 |
| [#2104](https://github.com/anyproto/anytype-ts/pull/2104) | 1b + 2a | Remove jQuery from `dom.ts` entirely. `getScrollContainer`/`getPageContainer`/`getPageFlexContainer` return `HTMLElement \| null`. Migrate all ~80 consumer call sites. Convert `getWindowDimensions`, `triggerResizeEditor`, `addBodyClass`, `injectCss`, `pauseMedia`, `renderLinks`, `toggle`, `scrollToHeader`, `clearSelection` | 53 | ~120 |

**Total migrated so far: ~75 files, ~160 call sites**

### What's Left

**185 files** still import jQuery. **223 files** total use `$(` (38 via global `window.$`). Roughly **1,123 `$(` call sites** remain.

| Category | Remaining | Notes |
|----------|-----------|-------|
| `$(window).on`/`.off`/`.trigger` | **218** across 115 files | Namespaced events — largest single category. Menus are ~80% of these (uniform pattern) |
| `.addClass`/`.removeClass`/`.hasClass`/`.toggleClass` | **550** across 138 files | Many in heavy files (sidebar 40, table 33, block/index 20). Some already migrated in easy files |
| `$(ref.current)` wrapping | **370** across 113 files | Wraps React refs just to call `.find()`, `.addClass()`, `.css()`, etc. |
| `.width()`/`.height()`/`.offset()`/`.outerWidth()` | **190** across 58 files | Dimension queries — use `clientWidth`/`getBoundingClientRect()`/`U.Dom.contentWidth()` |
| `.find()` traversal | ~100+ | Often chained on `$(ref.current).find(...)` |
| `.css({...})` inline styles | ~80+ | Replace with `Object.assign(el.style, ...)` |
| `.animate()` | 4 | Replace with CSS transitions or `element.animate()` |
| `window.$ = $` global | 1 (`app.tsx`) | Remove last — blocks tree-shaking |

---

## Current State (Post-Migration)

### `lib/util/dom.ts` — Fully jQuery-Free

All methods now use native DOM APIs. jQuery import removed. Key return type changes:

| Method | Before | After |
|--------|--------|-------|
| `getScrollContainer(isPopup)` | `JQuery<HTMLElement>` | `HTMLElement \| null` |
| `getPageContainer(isPopup)` | `JQuery<HTMLElement>` | `HTMLElement \| null` |
| `getPageFlexContainer(isPopup)` | `JQuery<HTMLElement>` | `HTMLElement \| null` |
| `getScrollContainerTop(isPopup)` | `number` (via jQuery) | `number` (native) |
| `getMaxScrollHeight(isPopup)` | `number` (via jQuery) | `number` (native) |
| `getAppContainerHeight()` | `number` (via jQuery) | `number` (native) |
| `getWindowDimensions()` | `{ ww, wh }` (via jQuery) | `{ ww, wh }` (native `window.innerWidth/Height`) |
| `triggerResizeEditor(isPopup)` | `$(window).trigger(...)` | `window.dispatchEvent(new CustomEvent(...))` |

### `U.Dom` Helper API

Available helpers (use these instead of raw `document.*` calls):

```typescript
U.Dom.get(id)                          // getElementById
U.Dom.select(selector, root?)         // querySelector
U.Dom.selectAll(selector, root?)      // querySelectorAll
U.Dom.addClass(el, ...names)          // classList.add (null-safe)
U.Dom.removeClass(el, ...names)       // classList.remove (null-safe)
U.Dom.toggleClass(el, name, force?)   // classList.toggle (null-safe)
U.Dom.hasClass(el, name)              // classList.contains (null-safe)
U.Dom.contentWidth(el)                // jQuery .width() equivalent
U.Dom.contentHeight(el)               // jQuery .height() equivalent
```

---

## Remaining Phases

### Phase 3: Event Migration (~115 files, 218 event sites)

This is the **largest remaining category**. jQuery namespaced events (`$(window).on('keydown.menuName')`) have no native equivalent — need either an `EventNamespace` helper or inline `addEventListener`/`removeEventListener` with stored handler refs.

**3a. Window/document events** (~100 files)
- Start with **menus** (~80 files) — they all follow the same `$(window).on('keydown.menuName')` / `$(window).off('keydown.menuName')` pattern
- Then popups (~15 files), then pages (~20 files)

**3b. Custom event bus** (~25 trigger sites)
- Replace `$(window).trigger('customEvent')` with `dispatchEvent(new CustomEvent(...))`
- Events like `updateGraphRoot`, `updateGraphSettings`, `resize.editor`, `archiveObject.search`

**Decision needed**: Create `EventNamespace` helper (per original plan) or use inline `addEventListener`/`removeEventListener` with stored refs (as done in #2104 for scroll events). The menu pattern is uniform enough that either approach works.

### Phase 4: Heavy Files (~20 files, ~800 call sites)

These files have deep jQuery integration across multiple categories (classes, events, dimensions, traversal):

| File | ~Remaining `$(` | Primary Patterns |
|------|-----------------|------------------|
| `lib/sidebar.ts` | ~25 | Events, `$(window)`, `$('#sidebarDummyLeft')`, dimension queries |
| `block/table.tsx` | ~40 | Cell sizing (`.outerWidth()`), selection, events |
| `block/index.tsx` | ~20 | State classes, traversal (`.find`), events |
| `app.tsx` | ~30 | Global events, classes, `window.$ = $` |
| `block/embed.tsx` | ~15 | Events, dimension queries |
| `dataview/view/grid.tsx` | ~15 | Column sizing, scroll sync, events |
| `dataview/view/board.tsx` | ~15 | Card layout, drag, events |
| `dataview/view/timeline.tsx` | ~10 | Positioning, dimension queries |
| `drag/provider.tsx` | ~15 | Measurement, events, broadcast class clears |
| `selection/provider.tsx` | ~8 | Selection rect, events, broadcast class clears |
| `editor/page.tsx` | ~10 | Events, measurement, placeholder text |
| `block/chat/form.tsx` | ~15 | Text editing, events, class manipulation |
| `block/cover.tsx` | ~20 | Image positioning, events, dimension queries |
| `menu/index.tsx` | ~10 | Positioning, events |
| `widget/index.tsx` | ~10 | State classes, events |

Each file should be its own PR with before/after testing.

### Phase 5: Remaining $(ref.current) Wrapping (~113 files, 370 sites)

Many files wrap React refs in jQuery just to call one method:
```typescript
// Before
$(nodeRef.current).find('.child')
$(nodeRef.current).addClass('active')
$(nodeRef.current).css({ width: px })

// After
nodeRef.current?.querySelector('.child')
U.Dom.addClass(nodeRef.current, 'active')
nodeRef.current.style.width = `${px}px`
```

These are mechanical but spread across many files. Can be done in batches grouped by component area.

### Phase 6: Cleanup (1 PR)

1. Remove `window.$ = $` from `app.tsx`
2. Remove `import $ from 'jquery'` from all remaining files
3. Remove `jquery` from `package.json`
4. Remove `window.$` type declaration
5. Run `bun run typecheck` and `bun run lint` to verify clean removal
6. Verify bundle size reduction (~192 KB minified, ~70 KB gzipped)

---

## Antipatterns & Problems

### 1. React/jQuery Impedance Mismatch

**Problem**: jQuery mutates the DOM imperatively while React expects to own it. When both touch the same nodes, React can silently lose track of state, or jQuery changes get overwritten on re-render.

**Examples**:
- `$(node).addClass('active')` inside a React component → the class disappears on next render
- `$(node).css('width', px)` inside `useEffect` → overwritten when MobX triggers re-render
- `$(node).html(content)` → React's virtual DOM diverges from real DOM

**Impact**: Subtle bugs where UI flickers, state drifts, or clicks stop working after re-render.

### 2. Namespaced Events Without Lifecycle Guarantees

**Problem**: jQuery namespaced events (`.on('keydown.myComponent')`) are attached to `window`/`document` and cleaned up in `componentWillUnmount` or `useEffect` cleanup. If cleanup is missed or runs in wrong order, handlers leak.

**Impact**: Memory leaks, ghost event handlers, handlers firing for destroyed components.

### 3. jQuery Selectors Bypassing React's Component Tree

**Problem**: Selectors like `$('#page .block.c' + blockId)` reach across component boundaries, creating invisible coupling. The selector breaks silently if class names or DOM structure change.

**Impact**: Fragile code that breaks when any ancestor restructures its markup. No compile-time safety.

### 4. Measurement Loops

**Problem**: jQuery `.width()` / `.height()` / `.offset()` trigger forced layout reflow. When called in loops or rapid succession (e.g., drag handlers, resize observers), this causes layout thrashing.

**Impact**: Janky resize/drag interactions, dropped frames.

### 5. `window.$ = $` Global Leak

**Problem**: `app.tsx` exposes jQuery globally. Any file can use `$` without importing, making usage invisible to tree-shaking and bundler analysis (38 files currently do this).

**Impact**: Cannot tree-shake jQuery even after removing all imports.

---

## Replacement Strategies

### DOM Helpers in `lib/util/dom.ts`

**Rule: Never use raw `document.getElementById`, `document.querySelector`, or `document.querySelectorAll` directly in component or library code.** All DOM lookups go through `U.Dom` helpers.

**Status: IMPLEMENTED** — See [U.Dom Helper API](#udom-helper-api) above.

### A. Namespaced Events → `EventNamespace` Helper

**Status: NOT YET IMPLEMENTED** — Currently using inline `addEventListener`/`removeEventListener` with stored handler refs for scroll events. Decision pending on whether to create the `EventNamespace` utility for the ~218 remaining event sites.

Proposed utility:

```typescript
// lib/util/eventNamespace.ts
class EventNamespace {
    private handlers = new Map<string, { event: string; target: EventTarget; handler: EventListener }[]>();

    on (target: EventTarget, event: string, ns: string, handler: EventListener, options?: AddEventListenerOptions) {
        if (!this.handlers.has(ns)) this.handlers.set(ns, []);
        this.handlers.get(ns).push({ event, target, handler });
        target.addEventListener(event, handler, options);
    };

    off (target: EventTarget, ns: string) { /* remove handlers for target+ns */ };
    offAll (ns: string) { /* remove all handlers for ns */ };
}
```

### B. Class Manipulation → `U.Dom.addClass`/`U.Dom.removeClass`/etc.

**Status: IMPLEMENTED** for 23 easy files. ~550 calls remain across 138 files (mostly in heavy files).

### C. Dimensions & Position → Native APIs + `U.Dom` Helpers

**Status: PARTIALLY DONE** — Container methods migrated. ~190 dimension calls remain in individual components.

Use `U.Dom.contentWidth(el)` as exact jQuery `.width()` drop-in for pixel math. Use `getBoundingClientRect()` for approximate sizing.

### D. Inline Style Manipulation → `el.style`

**Status: NOT YET STARTED** — ~80+ `.css({...})` calls remain.

```typescript
// Before
$(el).css({ left, top, width });
// After
Object.assign(el.style, { left: `${left}px`, top: `${top}px`, width: `${width}px` });
```

### E. Scroll Position → Direct Property

**Status: DONE** for container-level scroll. Some component-level `.scrollTop()` calls remain (~11).

### F. Custom Event Triggers → `dispatchEvent`

**Status: PARTIALLY DONE** — `triggerResizeEditor` converted. ~25 other `$(window).trigger()` sites remain.

---

## Migration Checklist Per File

When converting a file from jQuery to native:

- [ ] List all jQuery calls in the file
- [ ] For each call, identify the replacement (`U.Dom.addClass`, `U.Dom.get`, `U.Dom.select`, `U.Dom.contentWidth`, etc.)
- [ ] If the file uses `$('#id')`, replace with `U.Dom.get(...)` or `U.Dom.select(...)`
- [ ] If the file uses `.css(prop, value)`, replace with `el.style.prop = value`
- [ ] If the file uses namespaced events, migrate to `addEventListener`/`removeEventListener` with stored handler refs
- [ ] If the file uses `$(ref.current)`, replace with direct ref access
- [ ] If class toggling drives visual state, use `U.Dom.addClass`/`U.Dom.removeClass`/`U.Dom.toggleClass`
- [ ] If the file uses `.width()` / `.height()` for pixel math, use `U.Dom.contentWidth()` / `U.Dom.contentHeight()`
- [ ] Never use raw `document.getElementById` / `document.querySelector` — always go through `U.Dom`
- [ ] Run `bun run typecheck` and `bun run lint`
- [ ] Manually test the interaction (resize, drag, menu, etc.)
- [ ] Remove `import $ from 'jquery'` if no calls remain
- [ ] Verify no runtime errors in dev console

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Behavioral regression in drag/resize | Test each heavy file individually; keep jQuery fallback until verified |
| Timing differences between jQuery and native events | jQuery `.trigger()` is synchronous; `dispatchEvent` is too, but custom data moves to `event.detail` — verify listeners read from the right place |
| `.width()` vs native width — subtle but critical | jQuery `.width()` = content width (no padding); `clientWidth` = content + padding; `offsetWidth` = content + padding + border; `getBoundingClientRect().width` = content + padding + border + transforms. Use `U.Dom.contentWidth()` as exact drop-in for `.width()` in pixel-math code (table, grid, timeline). Use `getBoundingClientRect()` for approximate sizing |
| Layout thrashing from naive migration | Batch DOM reads before writes; use `requestAnimationFrame` where needed |
| Scattered raw DOM queries after migration | All lookups go through `U.Dom` helpers so we have a single point to change |
| `window.$` bypasses import-based linting | 38 files still use global `$` — remove `window.$ = $` in Phase 6 |

---

## Success Metrics

| Metric | Start | Current | Target |
|--------|-------|---------|--------|
| Files importing jQuery | 199 | **185** | 0 |
| Total `$(` call sites | ~3,000 | **~1,123** | 0 |
| `dom.ts` jQuery-free | No | **Yes** | Yes |
| Bundle size (jQuery) | 192 KB | 192 KB | 0 KB |
