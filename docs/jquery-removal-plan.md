# jQuery Removal Plan

> Created: 2026-03-28 | Status: Planning | Current jQuery: `^3.7.1` (192 KB minified)

---

## Current State

jQuery is used across **199 files** in `src/ts/`, totalling roughly **3,000+ call sites**. It was introduced early in the project before React patterns matured, and persists because it provides convenient APIs for tasks React intentionally does not own (measuring DOM, managing window events, imperative class toggling).

### Usage Breakdown

| Category | ~Count | Native Replacement Available |
|----------|--------|------------------------------|
| Class manipulation (`.addClass`/`.removeClass`/`.toggleClass`/`.hasClass`) | 597 | `classList` API |
| Element traversal (`.find`/`.closest`/`.parent`/`.children`/`.siblings`) | 39+ | `querySelector`/`closest`/`parentElement` |
| Dimensions & position (`.width`/`.height`/`.offset`/`.outerWidth`/`.css`) | 41+ | `getBoundingClientRect`/`offsetWidth`/`getComputedStyle` |
| Inline style manipulation (`.css(prop, value)`) | ~60 | `el.style.prop` / `el.style.setProperty()` |
| Namespaced events (`$(window).on('keydown.ns')`) | 221 | Custom helper (see below) |
| DOM show/hide/append/remove | ~100 | Direct DOM API or React state |
| Scroll position (`.scrollTop`/`.scrollLeft`) | ~50 | `element.scrollTop` |
| jQuery wrapping of refs (`$(node.current)`) | 266+ | Use ref directly |
| Animation (`.animate`/`.fadeIn`) | 4 | CSS transitions / Web Animations API |
| AJAX | 0 | N/A |

### Top Files by jQuery Density

| File | Calls | Primary Use |
|------|-------|-------------|
| `block/table.tsx` | 74 | Cell sizing, selection, class toggling |
| `lib/sidebar.ts` | 46 | Resize, animation, class toggling |
| `block/index.tsx` | 42 | Block state classes, traversal |
| `app.tsx` | 40 | Global events, resize |
| `block/embed.tsx` | 38 | Iframe sizing, visibility |
| `dataview/view/grid.tsx` | 33 | Column sizing, scroll sync |
| `dataview/view/board.tsx` | 33 | Card layout, drag |
| `dataview/view/timeline.tsx` | 29 | Timeline positioning |
| `widget/index.tsx` | 28 | Widget state classes |
| `menu/index.tsx` | 28 | Menu positioning, events |

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

**Examples**:
```typescript
// Common pattern across ~100 files
$(window).on('keydown.sidebarPageVault', handler);
// Must manually call $(window).off('keydown.sidebarPageVault')
```

**Impact**: Memory leaks, ghost event handlers, handlers firing for destroyed components.

### 3. jQuery Selectors Bypassing React's Component Tree

**Problem**: Selectors like `$('#page .block.c' + blockId)` reach across component boundaries, creating invisible coupling. The selector breaks silently if class names or DOM structure change.

**Existing solution**: `S.Common.refSet(id, ref)` / `S.Common.getRef(id)` provides a centralized ref registry. Currently it stores **React component instances** (not raw DOM nodes) — consumers call `.getNode()` to access the underlying DOM element, or call component methods like `.clear()`, `.onDragStart()` directly.

**Current registrations** (5 total):
- `'sidebarLeft'` → SidebarLeft component (has `.getNode()`, `.getComponentRef()`)
- `'selectionProvider'` → SelectionProvider (has `.clear()`, `.renderSelection()`)
- `'dragProvider'` → DragProvider (has `.onDragStart()`)
- `` `editor${ns}` `` → Editor page component
- `` `sidebarRight${ns}` `` → SidebarRight component (has `.getNode()`)

**Current consumers** (73+ call sites) already access these refs. There are also ~30 jQuery selectors that reach across components by DOM ID. Most of these are **not** truly global — they can be replaced with `U.Dom` helpers (see [DOM Helpers](#dom-helpers-in-libutildomts)), local refs, or scoped `querySelector` on a parent. Only genuinely global singletons (sidebar, selection, drag providers) belong in the `refSet` registry.

**Cross-component selectors to migrate** (grouped by replacement strategy):

**Use `S.Common.refSet`** — only for global singletons accessed from many unrelated parts of the app:

| Pattern | Files | Notes |
|---------|-------|-------|
| `$('#sidebarDummyLeft')` | `sidebar.ts` (5 sites) | Accessed from sidebar service, genuinely global |

**Use `U.Dom` helpers** — for stable, unique elements that are always in the DOM:

| Pattern | Files | Replacement |
|---------|-------|-------------|
| `$('#page...')`, `$('#pageFlex...')` | `dom.ts`, `editor/page.tsx` | `U.Dom.get('page')` / `U.Dom.get('pageFlex')` |
| `$('#appContainer')` | `dom.ts` | `U.Dom.get('appContainer')` |
| `$('#preview')`, `$('#toast')`, `$('#tooltipContainer')` | `preview.ts`, `preview/index.tsx` | `U.Dom.get(...)` |
| `$('#dragLayer')` | `drag/provider.tsx` | `U.Dom.get('dragLayer')` |

**Use local refs or scoped `querySelector`** — for elements scoped to a subtree:

| Pattern | Files | Replacement |
|---------|-------|-------------|
| `$('#sidebarRight #relationGroup-${id}')` | `sidebar/page/object/relation.tsx` | `nodeRef.current.querySelector(...)` on sidebar right's own ref |
| `$('#sidebarRight #preview-${id}')` | `sidebar/section/type/template.tsx` | Same — local to sidebar right |
| `$('#header #button-header-more')` | `header/main/settings.tsx` | Local ref inside header |
| `$('#button-header-search')`, `$('#button-header-relation')` | `keyboard.ts`, `graph/provider.tsx` | `U.Dom.get(...)` — these have stable IDs |
| `$('#graphPreview')`, `$('#graphPreviewItem')` | `graph/provider.tsx` (4 sites) | Local refs inside graph provider |
| `$('.popupPage .content')` | `page/main/graph.tsx` | `U.Dom.select(...)` or local ref |
| `$(`.placeholder.c${blockId}`)` | `editor/page.tsx` (2 sites) | Local ref on the placeholder element |

**Global state-class selectors** — replace broadcast `.removeClass()` with provider-tracked state:

| Pattern | Files | Replacement |
|---------|-------|-------------|
| `$('.dropTarget.isOver').removeClass(...)` | `drag/provider.tsx`, `keyboard.ts` | DragProvider tracks current drop target ref, clears it directly |
| `$('.isDragging').removeClass(...)` | `drag/provider.tsx` (3 sites) | DragProvider clears via tracked refs |
| `$('.isSelectionSelected').removeClass(...)` | `selection/provider.tsx` | SelectionProvider clears via tracked refs |
| `$('.colResize.active').removeClass(...)` | `drag/provider.tsx` | Track active column ref |
| `$('.block.isDragging').removeClass(...)` | `drag/provider.tsx` | Clear from DragProvider |

**Impact**: Fragile code that breaks when any ancestor restructures its markup. No compile-time safety.

### 4. Measurement Loops

**Problem**: jQuery `.width()` / `.height()` / `.offset()` trigger forced layout reflow. When called in loops or rapid succession (e.g., drag handlers, resize observers), this causes layout thrashing.

**Examples**:
- `table.tsx` calling `.outerWidth()` on every column during resize
- `timeline.tsx` measuring positions in animation frames
- `sidebar.ts` reading `.width()` during drag

**Impact**: Janky resize/drag interactions, dropped frames.

### 5. `window.$ = $` Global Leak

**Problem**: `app.tsx:54` exposes jQuery globally. Any file can use `$` without importing, making usage invisible to tree-shaking and bundler analysis.

**Impact**: Cannot tree-shake jQuery even after removing all imports. Makes it hard to track remaining usage.

---

## Replacement Strategies

### DOM Helpers in `lib/util/dom.ts`

**Rule: Never use raw `document.getElementById`, `document.querySelector`, or `document.querySelectorAll` directly in component or library code.** All DOM lookups go through `U.Dom` helpers. This gives us a single place to swap implementations, add instrumentation, or guard against missing elements — without touching every call site.

New helpers to add to the existing `UtilDom` class:

```typescript
// lib/util/dom.ts — new methods on the existing UtilDom class

/** Get element by ID. Single indirection point for all getElementById calls. */
get (id: string): HTMLElement | null {
    return document.getElementById(id);
};

/** querySelector on a root (defaults to document). */
select (selector: string, root: ParentNode = document): HTMLElement | null {
    return root.querySelector(selector);
};

/** querySelectorAll on a root (defaults to document). */
selectAll (selector: string, root: ParentNode = document): HTMLElement[] {
    return Array.from(root.querySelectorAll(selector));
};

/**
 * Content width of an element (matches jQuery `.width()` semantics).
 * jQuery `.width()` returns content width WITHOUT padding or border.
 * Native APIs differ: `clientWidth` = content + padding, `offsetWidth` = content + padding + border.
 * This helper provides a drop-in replacement to avoid off-by-a-few-pixels regressions.
 */
contentWidth (el: HTMLElement): number {
    const style = getComputedStyle(el);
    return el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
};

/**
 * Content height of an element (matches jQuery `.height()` semantics).
 */
contentHeight (el: HTMLElement): number {
    const style = getComputedStyle(el);
    return el.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
};
```

**Usage across the migration**:
```typescript
// Before (jQuery)
$('#preview').hide();
$('#page.isFull').scrollTop();
$('.block.isDragging');

// After (U.Dom helpers)
const el = U.Dom.get('preview');
if (el) el.style.display = 'none';

U.Dom.select('#page.isFull')?.scrollTop;

U.Dom.selectAll('.block.isDragging');
```

Existing methods like `getScrollContainer`, `getPageContainer`, `getPageFlexContainer`, `getAppContainerHeight` will be refactored to return `HTMLElement | null` instead of `JQuery<HTMLElement>`, using the new `get`/`select` helpers internally.

### A. Namespaced Events → `EventNamespace` Helper

jQuery's namespaced events are the hardest to replace because `addEventListener` has no equivalent. Create a small utility:

```typescript
// lib/util/eventNamespace.ts (~40 lines)
class EventNamespace {
    private handlers = new Map<string, { event: string; target: EventTarget; handler: EventListener }[]>();

    on (target: EventTarget, event: string, ns: string, handler: EventListener, options?: AddEventListenerOptions) {
        if (!this.handlers.has(ns)) {
            this.handlers.set(ns, []);
        };

        this.handlers.get(ns).push({ event, target, handler });
        target.addEventListener(event, handler, options);
    };

    off (target: EventTarget, ns: string) {
        const entries = this.handlers.get(ns);

        if (!entries) {
            return;
        };

        for (const { event, target: t, handler } of entries) {
            if (t === target) {
                t.removeEventListener(event, handler);
            };
        };

        // Keep only entries for other targets
        const remaining = entries.filter(e => e.target !== target);

        if (remaining.length) {
            this.handlers.set(ns, remaining);
        } else {
            this.handlers.delete(ns);
        };
    };

    offAll (ns: string) {
        const entries = this.handlers.get(ns);

        if (!entries) {
            return;
        };

        for (const { event, target, handler } of entries) {
            target.removeEventListener(event, handler);
        };

        this.handlers.delete(ns);
    };
}

export const events = new EventNamespace();
```

**Usage**:
```typescript
// Before
$(window).on('keydown.myComponent', handler);
$(window).off('keydown.myComponent');

// After
events.on(window, 'keydown', 'myComponent', handler);
events.off(window, 'myComponent');

// Remove all events for a namespace (any target)
events.offAll('myComponent');
```

Alternatively, provide a React hook:

```typescript
// lib/hook/useNamespacedEvent.ts
function useNamespacedEvent(target: EventTarget, event: string, handler: EventListener, deps: any[]) {
    useEffect(() => {
        target.addEventListener(event, handler);
        return () => target.removeEventListener(event, handler);
    }, deps);
}
```

### B. Class Manipulation → `classList` or React State

```typescript
// Before
$(node).addClass('active');
$(node).removeClass('active');
$(node).hasClass('active');
$(node).toggleClass('active', condition);

// After (imperative, for refs)
node.classList.add('active');
node.classList.remove('active');
node.classList.contains('active');
node.classList.toggle('active', condition);

// After (declarative, preferred for React-owned DOM)
const cn = ['block', (isActive ? 'active' : '')];
return <div className={cn.join(' ')} />;
```

### C. Dimensions & Position → Native APIs + `U.Dom` Helpers

```typescript
// Before (jQuery)
$(el).width();              // content width (no padding)
$(el).outerWidth();         // including border
$(el).outerWidth(true);     // including margin
$(el).offset();             // { top, left } relative to document

// After (native)
el.getBoundingClientRect(); // { width, height, top, left, ... } - one call, no reflow per-property
el.offsetWidth;             // including border (same as outerWidth)
el.clientWidth;             // content + padding (NOT same as jQuery .width())

// After (U.Dom helper — exact jQuery .width() equivalent)
U.Dom.contentWidth(el);     // content width without padding or border
U.Dom.contentHeight(el);    // content height without padding or border
```

**Important**: jQuery `.width()` returns content width *without* padding, which differs from every native property. `clientWidth` includes padding, `offsetWidth` includes padding + border, `getBoundingClientRect().width` includes padding + border + transforms. For files doing pixel math (table, grid, timeline), use `U.Dom.contentWidth()` as a drop-in replacement. For files that just need approximate sizing, `getBoundingClientRect()` is fine and more performant.

For the common pattern of measuring multiple elements, batch reads before writes to avoid layout thrashing.

### D. Inline Style Manipulation → `el.style`

```typescript
// Before
$(el).css('width', px);
$(el).css({ left, top, width });

// After (single property)
el.style.width = `${px}px`;

// After (multiple properties)
Object.assign(el.style, { left: `${left}px`, top: `${top}px`, width: `${width}px` });
// or for bulk:
el.style.cssText = `left:${left}px;top:${top}px;width:${width}px`;
```

### E. Cross-Component DOM Access

All DOM lookups go through `U.Dom` helpers — never raw `document.getElementById` or `document.querySelector` in component or library code. Pick the simplest approach for each case:

**`U.Dom.get`** — for stable, unique elements by ID:
```typescript
// Before
$('#preview').hide();

// After
const el = U.Dom.get('preview');
if (el) el.style.display = 'none';
```

**`U.Dom.select` / `U.Dom.selectAll`** — for CSS selector lookups:
```typescript
// Before
$('.popupPage .content');

// After
U.Dom.select('.popupPage .content');
```

**`U.Dom.select` scoped to a parent ref** — for subtree lookups:
```typescript
// Before
$(`#sidebarRight #relationGroup-${id}`);

// After — scoped to the sidebar right's own ref
U.Dom.select(`#relationGroup-${id}`, nodeRef.current);
```

**Local refs** — for elements within the same component or its direct children:
```typescript
// Before
$('#graphPreviewItem').css({ left, top });

// After — ref created in the same component
graphPreviewItemRef.current.style.cssText = `left:${left}px;top:${top}px`;
```

**`S.Common.refSet`/`getRef`** — reserve for global singletons accessed from many unrelated parts (sidebar, selection/drag providers). Already used this way:
```typescript
// Existing pattern — component instance with methods
S.Common.getRef('selectionProvider')?.clear();
const node = S.Common.getRef('sidebarLeft')?.getNode();
```

**Note**: Some current consumers wrap `getRef` results in jQuery: `$(S.Common.getRef('sidebarLeft')?.getNode())`. These should drop the jQuery wrapper and use the DOM node directly.

### F. Scroll Position → Direct Property

```typescript
// Before
$(el).scrollTop();
$(el).scrollTop(100);

// After
el.scrollTop;
el.scrollTop = 100;
// or: el.scrollTo({ top: 100, behavior: 'smooth' });
```

### G. `$(ref.current)` Wrapping → Use Ref Directly

The pattern `$(nodeRef.current).find(...)` wraps a React ref in jQuery just to call one method. Replace with `U.Dom.select(selector, nodeRef.current)` or `nodeRef.current.querySelector(...)`.

### H. Custom Event Triggers → `dispatchEvent`

```typescript
// Before
$(window).trigger('resize.editor');
$(window).trigger('updateGraphRoot', data);

// After
window.dispatchEvent(new CustomEvent('resize.editor'));
window.dispatchEvent(new CustomEvent('updateGraphRoot', { detail: data }));
```

Note: Both jQuery `.trigger()` and native `dispatchEvent` are synchronous, so timing behavior is preserved. The only difference is that custom data moves from the second argument to `event.detail`.

---

## Phased Removal Plan

### Phase 0: Infrastructure (1 PR)

1. Add `U.Dom` helpers (`get`, `select`, `selectAll`, `contentWidth`, `contentHeight`) to the existing `lib/util/dom.ts`
2. Create `src/ts/lib/util/eventNamespace.ts` with the `EventNamespace` class
3. Create `src/ts/hook/useEvent.ts` with `useNamespacedEvent` hook
4. Add ESLint rules to block new jQuery usage:
   - Restricted import: warn on `import $ from 'jquery'`
   - Restricted globals: warn on bare `$` and `jQuery` (catches `window.$ = $` usage)
   - Restricted globals: warn on `document.getElementById`, `document.querySelector`, `document.querySelectorAll` with message pointing to `U.Dom` helpers
5. Document the migration helpers in this file

**Goal**: No new jQuery or raw DOM query usage enters the codebase after this point.

### Phase 1: Low-Hanging Fruit (~80 files, ~400 call sites)

Target files with **fewer than 5 jQuery calls** each, where replacements are mechanical. Break into one PR per category.

**1a. Class manipulation in components** (~144 files, 597 calls)
- Replace `.addClass`/`.removeClass`/`.hasClass`/`.toggleClass` with `classList`
- Where possible, move to React state-driven className instead
- Priority: files with 1-3 class calls (quick wins)

**1b. Scroll position** (~30 files)
- Replace `.scrollTop()`/`.scrollLeft()` with native properties

**1c. `$(ref.current)` unwrapping** (~50 files)
- Replace `$(nodeRef.current).someMethod()` with `nodeRef.current.nativeMethod()`

**1d. Remove 4 animation calls**
- Replace with CSS transitions or `element.animate()`

### Phase 2: Cross-Component Selectors (~30 files)

Replace jQuery selectors that reach across component boundaries. All replacements go through `U.Dom` helpers — never raw `document.getElementById` or `document.querySelector`.

**2a. `U.Dom` helpers for stable unique elements**:
- `lib/util/dom.ts` — refactor `getScrollContainer()`, `getPageContainer()`, `getPageFlexContainer()`, `getAppContainerHeight()` to use `this.get()`/`this.select()` and return `HTMLElement | null` instead of `JQuery<HTMLElement>`
- `lib/preview.ts` — 6 calls for `#preview`, `#toast`, `#tooltipContainer` → `U.Dom.get(...)`
- `lib/keyboard.ts` — `$('#button-header-search').trigger('click')` → `U.Dom.get(...)?.click()`
- `drag/provider.tsx` — `$('#dragLayer')` → `U.Dom.get('dragLayer')`

**2b. Local refs for component-scoped elements**:
- `graph/provider.tsx` — 4 calls for `#graphPreview*` → local refs within graph provider
- `sidebar/page/object/relation.tsx`, `sidebar/section/type/template.tsx` — `U.Dom.select(...)` scoped to the sidebar's own ref
- `header/main/settings.tsx` — local ref for the more button
- `editor/page.tsx` — 2 placeholder selectors → local refs on placeholder elements

**2c. `S.Common.refSet` only for global singletons**:
- `lib/sidebar.ts` — `$('#sidebarDummyLeft')` (5 sites) → register via `refSet`, accessed from sidebar service
- Drop jQuery wrapping from existing `$(S.Common.getRef('sidebarLeft')?.getNode())` patterns in `sidebar.ts` and `drag/provider.tsx`

**2d. Global state-class selectors** — replace broadcast `.removeClass()` with provider-tracked state:
- `$('.dropTarget.isOver').removeClass(...)` → DragProvider tracks current drop target ref, clears it directly
- `$('.isDragging').removeClass(...)` → DragProvider clears via tracked refs
- `$('.isSelectionSelected').removeClass(...)` → SelectionProvider clears via tracked refs
- `$('.colResize.active').removeClass(...)` → Track active column ref

### Phase 3: Event Migration (~120 files, 221 event sites)

**3a. Window/document events** (~100 files)
- Replace `$(window).on('event.ns', handler)` with `EventNamespace` helper or `useEffect` cleanup
- Start with menus (~40 files) since they follow a uniform pattern:
  ```typescript
  // Every menu does this same pattern
  $(window).on('keydown.menuName', handler);
  $(window).off('keydown.menuName');
  ```
- Then popups (~15 files), then pages (~20 files)

**3b. Custom event bus** (~25 trigger sites)
- Replace `$(window).trigger('customEvent')` with `dispatchEvent(new CustomEvent(...))`
- Events like `updateGraphRoot`, `updateGraphSettings`, `resize.editor`, `archiveObject.search`
- Custom data moves from jQuery's second argument to `event.detail`

### Phase 4: Heavy Files (~20 files, ~800 call sites)

These files have deep jQuery integration and need careful refactoring:

| File | Calls | Strategy |
|------|-------|----------|
| `block/table.tsx` | 74 | Extract measurement into a `useTableLayout` hook; use `U.Dom.contentWidth()` as drop-in for `.width()`; batch reads with `getBoundingClientRect` |
| `lib/sidebar.ts` | 46 | Migrate to CSS custom properties for width + `classList`; events to `EventNamespace`; `$('#sidebarDummyLeft')` to `S.Common.getRef`; drop jQuery wrapping on existing `getRef` calls |
| `block/index.tsx` | 42 | Move state classes to React state; traversal to `U.Dom.select()` |
| `app.tsx` | 40 | Events to `useEffect`; classes to state; register all root refs via `S.Common.refSet` |
| `block/embed.tsx` | 38 | Iframe measurement to `ResizeObserver`; visibility to `IntersectionObserver` |
| `dataview/view/grid.tsx` | 33 | Column sizing: use `U.Dom.contentWidth()` for pixel math; consider CSS grid or `ResizeObserver` |
| `dataview/view/board.tsx` | 33 | Card layout measurement to `getBoundingClientRect` |
| `drag/provider.tsx` | 22 | Measurement to native APIs; events to `EventNamespace`; broadcast class clears to tracked refs |
| `selection/provider.tsx` | 21 | Selection rect to native APIs; broadcast class clears to tracked refs |
| `editor/page.tsx` | 28 | Events and measurement to native APIs; placeholder text via `S.Common.getRef` |

Each file in this phase should be its own PR with before/after testing of the specific interaction (resize, drag, scroll sync, etc.).

### Phase 5: Cleanup (1 PR)

1. Remove `window.$ = $` from `app.tsx`
2. Remove `import $ from 'jquery'` from all files
3. Remove `jquery` from `package.json`
4. Remove `window.$` type declaration
5. Remove ESLint restricted-import rule for jQuery (no longer needed)
6. Promote ESLint restricted-globals for `document.getElementById`/`querySelector` from warn to error
7. Run `bun run typecheck` and `bun run lint` to verify clean removal
8. Verify bundle size reduction (~192 KB minified, ~70 KB gzipped)

---

## Migration Checklist Per File

When converting a file from jQuery to native:

- [ ] List all jQuery calls in the file
- [ ] For each call, identify the replacement (`classList`, `U.Dom.get`, `U.Dom.select`, `U.Dom.contentWidth`, etc.)
- [ ] If the file uses `$('#id')` to reach into another component, replace with `U.Dom.get(...)`, `U.Dom.select(...)` scoped to a parent, or a local ref. Only use `S.Common.refSet` for global singletons
- [ ] If the file uses `.css(prop, value)`, replace with `el.style.prop = value`
- [ ] If the file uses namespaced events, migrate to `EventNamespace` or `useEffect` cleanup
- [ ] If the file uses `$(ref.current)`, replace with direct ref access
- [ ] If class toggling drives visual state, prefer moving to React state + className
- [ ] If the file uses `.width()` / `.height()` for pixel math, use `U.Dom.contentWidth()` / `U.Dom.contentHeight()` — not `clientWidth` (which includes padding)
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
| Scattered raw DOM queries after migration | ESLint restricted-globals rule catches `document.getElementById`/`querySelector` — all lookups go through `U.Dom` helpers so we have a single point to change |
| `window.$` bypasses import-based ESLint rule | Phase 0 adds restricted-globals rule for `$` and `jQuery` in addition to restricted-imports, catching both import and global usage |
| Team unfamiliarity with native APIs | This document serves as reference; code review during migration |

---

## Success Metrics

- **Phase 0**: ESLint rules block new jQuery imports, raw `$` globals, and raw `document.getElementById`/`querySelector`
- **Phase 1**: jQuery call count drops from ~3,000 to ~1,800
- **Phase 2**: Cross-component jQuery selectors drop to 0; all lookups through `U.Dom`
- **Phase 3**: Event-related jQuery drops to 0; `EventNamespace` or hooks used everywhere
- **Phase 4**: Top 20 files fully converted
- **Phase 5**: `jquery` removed from `package.json`; bundle size drops ~70 KB gzipped
