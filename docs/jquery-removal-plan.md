# jQuery Removal Plan

> Created: 2026-03-28 | Updated: 2026-03-30 | Status: **In Progress** | jQuery: `^3.7.1` (192 KB minified)

---

## At a Glance

| Metric | Start | Now | Target |
|--------|-------|-----|--------|
| Files with jQuery | 199 | **211** (+38 made explicit) | 0 |
| `$(` call sites | ~3,000 | **~1,089** | 0 |
| `dom.ts` jQuery-free | No | **Yes** | Yes |
| `preview.ts` jQuery-free | No | **Yes** | Yes |
| `window.$ = $` global | Yes | **Removed** | Removed |
| Bundle saving | 0 KB | 0 KB | ~70 KB gzip |

> File count went up because 38 files that relied on the hidden `window.$` global now have explicit `import $ from 'jquery'` — this makes remaining usage fully trackable via grep.

---

## What's Done

### Files Fully jQuery-Free (import removed)

| File | What was converted | PR |
|------|-------------------|----|
| `lib/util/dom.ts` | All container methods, scroll helpers, `addBodyClass`, `injectCss`, `pauseMedia`, `renderLinks`, `toggle`, `scrollToHeader`, `clearSelection`, `getWindowDimensions`, `triggerResizeEditor` | #2104 |
| `lib/preview.ts` | `tooltipShow`, `tooltipHide`, `previewShow`, `previewHide`, `toastShow`, `toastHide` | #2104 |
| `component/block/bookmark.tsx` | Class manipulation | #2103 |
| `component/block/media/audio.tsx` | Class manipulation | #2103 |
| `component/block/featured.tsx` | Class manipulation + tooltip element | #2103, #2104 |
| `component/block/dataview/filters/rule.tsx` | Tooltip element | #2104 |
| `component/block/dataview/view/grid/foot/cell.tsx` | Tooltip element | #2104 |
| `component/block/chat/message/reaction.tsx` | Tooltip element | #2104 |
| `component/cell/file.tsx` | Class manipulation | #2103 |
| `component/cell/text.tsx` | Class manipulation | #2103 |
| `component/form/textarea.tsx` | Class manipulation | #2103 |
| `component/list/popup.tsx` | Class manipulation | #2103 |
| `component/menu/item/vertical.tsx` | Tooltip element | #2104 |
| `component/menu/publish.tsx` | Tooltip element | #2104 |
| `component/page/auth/login.tsx` | Class manipulation | #2103 |
| `component/page/main/settings/api.tsx` | Class manipulation | #2103 |
| `component/page/main/settings/membership/intro.tsx` | Class manipulation | #2103 |
| `component/page/main/settings/membership/loader.tsx` | Class manipulation | #2103 |
| `component/page/main/settings/space/list.tsx` | Class manipulation | #2103 |
| `component/page/main/settings/index.tsx` | Tooltip element | #2104 |
| `component/popup/introduceChats.tsx` | Class manipulation | #2103 |
| `component/popup/membership/activation.tsx` | Class manipulation | #2103 |
| `component/popup/space/joinByLink.tsx` | Class manipulation | #2103 |
| `component/popup/settings/onboarding.tsx` | Tooltip element | #2104 |
| `component/util/icon.tsx` | Tooltip element | #2104 |
| `component/util/progressBar.tsx` | Tooltip element | #2104 |
| `component/util/sync.tsx` | Tooltip element | #2104 |

### Infrastructure Implemented

- [x] `U.Dom.get()`, `U.Dom.select()`, `U.Dom.selectAll()` — DOM query helpers
- [x] `U.Dom.addClass()`, `U.Dom.removeClass()`, `U.Dom.toggleClass()`, `U.Dom.hasClass()` — null-safe class manipulation
- [x] `U.Dom.contentWidth()`, `U.Dom.contentHeight()` — jQuery `.width()`/`.height()` drop-in
- [x] `window.$ = $` removed from `app.tsx` and `extension/entry.tsx`
- [x] 38 files using global `$` now have explicit `import $ from 'jquery'`

### Container Methods Migrated (return `HTMLElement | null`)

All ~80 consumer call sites updated across 53 files:

- [x] `getScrollContainer(isPopup)` — `.scrollTop()`, `.on()/.off()`, `.height()`, `.offset()`, `.find()`, `.get(0)`
- [x] `getPageContainer(isPopup)` — `.width()`, `.css()`, `.on()/.off()`
- [x] `getPageFlexContainer(isPopup)` — `.width()`, `.height()`, `.css()`, `.on()/.off()`
- [x] `getScrollContainerTop(isPopup)` — internal
- [x] `getMaxScrollHeight(isPopup)` — internal
- [x] `getAppContainerHeight()` — internal
- [x] `getWindowDimensions()` — uses `window.innerWidth`/`innerHeight`
- [x] `triggerResizeEditor(isPopup)` — uses `dispatchEvent(new CustomEvent(...))`

### Tooltip/Preview Element Param Migrated

`TooltipParam.element` and `Preview.element` now accept `HTMLElement` instead of jQuery. ~25 callers updated.

---

## What's Left

### Remaining jQuery by Category

| Category | Count | Files | Status |
|----------|-------|-------|--------|
| `$(window).on`/`.off`/`.trigger` | **218** | 115 | Not started — menus are ~80% (uniform pattern) |
| `.addClass`/`.removeClass`/`.hasClass`/`.toggleClass` | **550** | 138 | 23 easy files done; heavy files remain |
| `$(ref.current)` wrapping | **359** | 109 | ~11 converted via tooltip migration; bulk remains |
| `.width()`/`.height()`/`.offset()`/`.outerWidth()` | **182** | 57 | Container-level done; component-level remains |
| `.css({...})` inline styles | **188** | 77 | Not started |
| `.find()` traversal | ~100+ | — | Some converted via container migration |
| `.scrollTop()`/`.scrollLeft()` | ~11 | — | Container-level done; a few component-level remain |
| `.animate()` | 4 | — | Not started |

### Phase Checklist — Remaining Work

**Phase 3: Event Migration** — NOT STARTED
- [ ] Menus (~80 files) — `$(window).on('keydown.menuName')` / `$(window).off('keydown.menuName')`
- [ ] Popups (~15 files) — same pattern
- [ ] Pages & components (~20 files) — resize, keyboard, scroll events
- [ ] Custom event bus (~25 trigger sites) — `$(window).trigger()` → `dispatchEvent`
- [ ] Decide: `EventNamespace` helper vs inline `addEventListener`/`removeEventListener`

**Phase 4: Heavy Files** — NOT STARTED
- [ ] `lib/sidebar.ts` (~25 calls) — events, `$('#sidebarDummyLeft')`, dimensions
- [ ] `block/table.tsx` (~40 calls) — cell sizing, selection, events
- [ ] `block/index.tsx` (~20 calls) — state classes, traversal, events
- [ ] `app.tsx` (~30 calls) — global events, classes
- [ ] `block/embed.tsx` (~15 calls) — events, dimensions
- [ ] `dataview/view/grid.tsx` (~15 calls) — column sizing, events
- [ ] `dataview/view/board.tsx` (~15 calls) — card layout, drag, events
- [ ] `dataview/view/timeline.tsx` (~10 calls) — positioning, dimensions
- [ ] `drag/provider.tsx` (~15 calls) — measurement, events, broadcast class clears
- [ ] `selection/provider.tsx` (~8 calls) — selection rect, broadcast class clears
- [ ] `editor/page.tsx` (~10 calls) — events, measurement
- [ ] `block/chat/form.tsx` (~15 calls) — text editing, events, classes
- [ ] `block/cover.tsx` (~20 calls) — image positioning, events, dimensions
- [ ] `menu/index.tsx` (~10 calls) — positioning, events
- [ ] `widget/index.tsx` (~10 calls) — state classes, events

**Phase 5: Remaining $(ref.current) Wrapping** — NOT STARTED
- [ ] ~359 sites across ~109 files — mechanical ref unwrapping

**Phase 6: Final Cleanup** — NOT STARTED
- [ ] Remove all remaining `import $ from 'jquery'`
- [ ] Remove `jquery` from `package.json`
- [ ] Remove `window.$` type declaration
- [ ] Verify bundle size reduction

---

## U.Dom Helper API

```typescript
// DOM queries (use instead of raw document.*)
U.Dom.get(id)                          // getElementById
U.Dom.select(selector, root?)         // querySelector
U.Dom.selectAll(selector, root?)      // querySelectorAll

// Class manipulation (null-safe)
U.Dom.addClass(el, ...names)
U.Dom.removeClass(el, ...names)
U.Dom.toggleClass(el, name, force?)
U.Dom.hasClass(el, name)

// Measurement (exact jQuery .width()/.height() semantics)
U.Dom.contentWidth(el)                 // content width without padding/border
U.Dom.contentHeight(el)                // content height without padding/border
```

---

## Replacement Patterns

```typescript
// Class manipulation
$(node).addClass('x')                  → U.Dom.addClass(node, 'x')
$(node).removeClass('x')               → U.Dom.removeClass(node, 'x')
$(node).toggleClass('x', cond)         → U.Dom.toggleClass(node, 'x', cond)
$(node).hasClass('x')                  → U.Dom.hasClass(node, 'x')

// DOM queries
$('#id')                               → U.Dom.get('id')
$('.selector')                         → U.Dom.select('.selector')
$(parent).find('.child')               → U.Dom.select('.child', parent)

// Dimensions
$(el).width()                          → U.Dom.contentWidth(el)
$(el).outerWidth()                     → el.offsetWidth
$(el).offset()                         → el.getBoundingClientRect()

// Inline styles
$(el).css('width', px)                 → el.style.width = `${px}px`
$(el).css({ left, top })               → Object.assign(el.style, { left: `${left}px`, ... })

// Scroll
$(el).scrollTop()                      → el.scrollTop
$(el).scrollTop(100)                   → el.scrollTop = 100

// Events
$(window).on('keydown.ns', handler)    → window.addEventListener('keydown', handler)
$(window).off('keydown.ns')            → window.removeEventListener('keydown', handler)
$(window).trigger('myEvent')           → window.dispatchEvent(new CustomEvent('myEvent'))

// Ref unwrapping
$(nodeRef.current).find('.x')          → nodeRef.current?.querySelector('.x')
$(nodeRef.current).addClass('x')       → U.Dom.addClass(nodeRef.current, 'x')

// Tooltip/preview element
element: $(e.currentTarget)            → element: e.currentTarget as HTMLElement
element: $(nodeRef.current)            → element: nodeRef.current
```

---

## Migration Checklist Per File

- [ ] List all `$(` calls
- [ ] Replace `$('#id')` → `U.Dom.get(...)` / `U.Dom.select(...)`
- [ ] Replace `.addClass`/`.removeClass`/`.toggleClass`/`.hasClass` → `U.Dom.*`
- [ ] Replace `.css(prop, value)` → `el.style.prop = value`
- [ ] Replace `.width()`/`.height()` → `U.Dom.contentWidth()`/`clientWidth`/`getBoundingClientRect()`
- [ ] Replace `$(window).on/off` → `addEventListener`/`removeEventListener` with stored handler
- [ ] Replace `$(ref.current)` → use ref directly
- [ ] Replace `.find(selector)` → `U.Dom.select(selector, parent)`
- [ ] Replace `.scrollTop()` → `el.scrollTop` property
- [ ] Never use raw `document.getElementById`/`querySelector` — use `U.Dom.*`
- [ ] Run `bun run typecheck` and `bun run lint`
- [ ] Manually test the interaction
- [ ] Remove `import $ from 'jquery'` if no `$(` calls remain

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Drag/resize regression | Test each heavy file individually |
| `.width()` vs native width | Use `U.Dom.contentWidth()` for pixel math (exact jQuery match) |
| Layout thrashing | Batch DOM reads before writes; use `requestAnimationFrame` |
| jQuery `.trigger()` data convention | Custom data moves to `event.detail` — verify listeners |
