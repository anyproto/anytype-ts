# jQuery Removal Plan

> Created: 2026-03-28 | Updated: 2026-03-29 | Status: **In Progress** | jQuery: `^3.7.1` (192 KB minified)

---

## At a Glance

| Metric | Start | Now | Target |
|--------|-------|-----|--------|
| Files with jQuery | 199 | **185** | 0 |
| `$(` call sites | ~3,000 | **~1,123** | 0 |
| `dom.ts` jQuery-free | No | **Yes** | Yes |
| Bundle saving | 0 KB | 0 KB | ~70 KB gzip |

---

## Phase Checklist

### Phase 0: Infrastructure
- [x] Add `U.Dom.get()`, `U.Dom.select()`, `U.Dom.selectAll()` to `lib/util/dom.ts` — PR #2103
- [x] Add `U.Dom.addClass()`, `U.Dom.removeClass()`, `U.Dom.toggleClass()`, `U.Dom.hasClass()` — PR #2103
- [x] Add `U.Dom.contentWidth()`, `U.Dom.contentHeight()` — PR #2103
- [ ] Create `EventNamespace` helper (`lib/util/eventNamespace.ts`)
- [ ] Add ESLint restricted-import rule for `import $ from 'jquery'`
- [ ] Add ESLint restricted-globals rule for bare `$`, `jQuery`, `document.getElementById`, `document.querySelector`

### Phase 1: Mechanical Replacements
- [x] **1a. Class manipulation** — 23 easy files migrated to `U.Dom.addClass`/etc., jQuery import removed from 12 — PR #2103
- [x] **1b. Scroll position** — container-level `.scrollTop()` migrated in 53 files — PR #2104
- [ ] **1c. `$(ref.current)` unwrapping** — ~370 sites across 113 files still wrap React refs in `$()` just to call `.find()`, `.addClass()`, `.css()`
- [ ] **1d. Animation** — 4 `.animate()` calls remain → CSS transitions or `element.animate()`

### Phase 2: dom.ts and Container Migration
- [x] Remove jQuery import from `dom.ts` — PR #2104
- [x] `getScrollContainer()` returns `HTMLElement | null` — PR #2104
- [x] `getPageContainer()` returns `HTMLElement | null` — PR #2104
- [x] `getPageFlexContainer()` returns `HTMLElement | null` — PR #2104
- [x] Migrate all ~80 consumer call sites for new return types — PR #2104
- [x] Convert `getWindowDimensions()` to `window.innerWidth`/`innerHeight` — PR #2104
- [x] Convert `triggerResizeEditor()` to `dispatchEvent` — PR #2104
- [x] Convert `clearSelection()`, `addBodyClass()`, `injectCss()`, `pauseMedia()` — PR #2104
- [x] Convert `renderLinks()`, `toggle()`, `scrollToHeader()` — PR #2104

### Phase 3: Event Migration — NOT STARTED
- [ ] **3a. Menus** (~80 files) — `$(window).on('keydown.menuName')` / `$(window).off('keydown.menuName')` — uniform pattern
- [ ] **3b. Popups** (~15 files) — same `$(window).on`/`.off` pattern
- [ ] **3c. Pages & components** (~20 files) — `$(window).on`/`.off` for resize, keyboard, etc.
- [ ] **3d. Custom event bus** (~25 trigger sites) — `$(window).trigger('customEvent')` → `dispatchEvent(new CustomEvent(...))`

### Phase 4: Heavy Files — NOT STARTED
- [ ] `lib/sidebar.ts` (~25 remaining) — events, `$('#sidebarDummyLeft')`, dimension queries
- [ ] `block/table.tsx` (~40 remaining) — cell sizing, selection, events
- [ ] `block/index.tsx` (~20 remaining) — state classes, traversal, events
- [ ] `app.tsx` (~30 remaining) — global events, classes, `window.$ = $`
- [ ] `block/embed.tsx` (~15 remaining) — events, dimension queries
- [ ] `dataview/view/grid.tsx` (~15 remaining) — column sizing, scroll sync, events
- [ ] `dataview/view/board.tsx` (~15 remaining) — card layout, drag, events
- [ ] `dataview/view/timeline.tsx` (~10 remaining) — positioning, dimension queries
- [ ] `drag/provider.tsx` (~15 remaining) — measurement, events, broadcast class clears
- [ ] `selection/provider.tsx` (~8 remaining) — selection rect, broadcast class clears
- [ ] `editor/page.tsx` (~10 remaining) — events, measurement
- [ ] `block/chat/form.tsx` (~15 remaining) — text editing, events, classes
- [ ] `block/cover.tsx` (~20 remaining) — image positioning, events
- [ ] `menu/index.tsx` (~10 remaining) — positioning, events
- [ ] `widget/index.tsx` (~10 remaining) — state classes, events

### Phase 5: Remaining Ref Wrapping — NOT STARTED
- [ ] Batch-convert ~370 `$(ref.current)` sites across ~113 files to direct ref access

### Phase 6: Final Cleanup — NOT STARTED
- [ ] Remove `window.$ = $` from `app.tsx`
- [ ] Remove all remaining `import $ from 'jquery'`
- [ ] Remove `jquery` from `package.json`
- [ ] Remove `window.$` type declaration
- [ ] Verify bundle size reduction (~70 KB gzipped)

---

## Remaining jQuery by Category

| Category | Count | Files | Replacement |
|----------|-------|-------|-------------|
| `$(window).on`/`.off`/`.trigger` | **218** | 115 | `addEventListener`/`removeEventListener` or `EventNamespace` helper |
| `.addClass`/`.removeClass`/`.toggleClass`/`.hasClass` | **550** | 138 | `U.Dom.addClass()`/`U.Dom.removeClass()`/etc. |
| `$(ref.current)` wrapping | **370** | 113 | Use ref directly: `nodeRef.current?.querySelector()` |
| `.width()`/`.height()`/`.offset()`/`.outerWidth()` | **190** | 58 | `clientWidth`/`getBoundingClientRect()`/`U.Dom.contentWidth()` |
| `.find()` traversal | ~100+ | — | `querySelector`/`U.Dom.select(selector, parent)` |
| `.css({...})` inline styles | ~80+ | — | `Object.assign(el.style, {...})` |
| `.scrollTop()`/`.scrollLeft()` | ~11 | — | `el.scrollTop`/`el.scrollLeft` property |
| `.animate()` | 4 | — | CSS transitions or `element.animate()` |
| `window.$ = $` global | 1 | `app.tsx` | Remove last |

---

## U.Dom Helper API (Implemented)

Use these instead of raw `document.*` calls or jQuery:

```typescript
// DOM queries
U.Dom.get(id)                          // getElementById wrapper
U.Dom.select(selector, root?)         // querySelector wrapper
U.Dom.selectAll(selector, root?)      // querySelectorAll wrapper

// Class manipulation (null-safe — no need for ?. chains)
U.Dom.addClass(el, ...names)
U.Dom.removeClass(el, ...names)
U.Dom.toggleClass(el, name, force?)
U.Dom.hasClass(el, name)

// Measurement (exact jQuery .width()/.height() semantics)
U.Dom.contentWidth(el)                 // content width without padding/border
U.Dom.contentHeight(el)                // content height without padding/border
```

### dom.ts Methods — All Native Now

| Method | Was (jQuery) | Now (native) |
|--------|-------------|--------------|
| `getScrollContainer(isPopup)` | `$('#page.isPopup')` → JQuery | `this.select(...)` → `HTMLElement \| null` |
| `getPageContainer(isPopup)` | `$('#page.isPopup')` → JQuery | `this.select(...)` → `HTMLElement \| null` |
| `getPageFlexContainer(isPopup)` | `$('#pageFlex.isPopup')` → JQuery | `this.select(...)` → `HTMLElement \| null` |
| `getScrollContainerTop(isPopup)` | `.scrollTop()` jQuery | `.scrollTop` native property |
| `getMaxScrollHeight(isPopup)` | `container.get(0).scrollHeight` | `el.scrollHeight - el.clientHeight` |
| `getAppContainerHeight()` | `$('#appContainer').height()` | `U.Dom.contentHeight(el)` |
| `getWindowDimensions()` | `$(window).width()/height()` | `window.innerWidth`/`innerHeight` |
| `triggerResizeEditor(isPopup)` | `$(window).trigger(...)` | `window.dispatchEvent(new CustomEvent(...))` |
| `clearSelection()` | `$(activeElement).trigger('blur')` | `activeElement.blur()` |
| `addBodyClass(prefix, v)` | `$('html').attr('class', ...)` | `document.documentElement.className = ...` |
| `injectCss(id, css)` | `$('head').append(...)` | `document.head.appendChild(style)` |
| `pauseMedia()` | `$('audio, video').each(...)` | `selectAll('audio, video').forEach(...)` |
| `renderLinks(obj)` | jQuery `.find('a')`, `.click()` | `querySelectorAll('a')`, `addEventListener` |
| `toggle(obj, delay, isOpen)` | jQuery `.css()`, `.addClass()` | `el.style`, `U.Dom.addClass()` |
| `scrollToHeader(rootId, item, isPopup)` | jQuery `.parents()`, `.offset()` | `el.closest()`, `getBoundingClientRect()` |

---

## Replacement Patterns Reference

### Namespaced Events (NOT YET IMPLEMENTED)

```typescript
// Before
$(window).on('keydown.myComponent', handler);
$(window).off('keydown.myComponent');

// After (option A — inline, used for scroll events in #2104)
let handler = (e) => { ... };
window.addEventListener('keydown', handler);
window.removeEventListener('keydown', handler);

// After (option B — EventNamespace helper, proposed)
events.on(window, 'keydown', 'myComponent', handler);
events.off(window, 'myComponent');
```

### Class Manipulation

```typescript
// Before                                  // After
$(node).addClass('active');                U.Dom.addClass(node, 'active');
$(node).removeClass('active');             U.Dom.removeClass(node, 'active');
$(node).hasClass('active');                U.Dom.hasClass(node, 'active');
$(node).toggleClass('active', cond);       U.Dom.toggleClass(node, 'active', cond);
```

### Dimensions & Position

```typescript
// Before                                  // After
$(el).width();                             U.Dom.contentWidth(el);    // exact match
$(el).outerWidth();                        el.offsetWidth;
$(el).offset();                            el.getBoundingClientRect();
```

### Inline Styles

```typescript
// Before                                  // After
$(el).css('width', px);                    el.style.width = `${px}px`;
$(el).css({ left, top, width });           Object.assign(el.style, { left: `${left}px`, ... });
```

### Scroll Position

```typescript
// Before                                  // After
$(el).scrollTop();                         el.scrollTop;
$(el).scrollTop(100);                      el.scrollTop = 100;
```

### Ref Unwrapping

```typescript
// Before                                  // After
$(nodeRef.current).find('.child');         nodeRef.current?.querySelector('.child');
$(nodeRef.current).addClass('x');          U.Dom.addClass(nodeRef.current, 'x');
$(nodeRef.current).css({ width: px });     nodeRef.current.style.width = `${px}px`;
```

### Custom Events

```typescript
// Before                                  // After
$(window).trigger('resize.editor');        window.dispatchEvent(new CustomEvent('resize.editor'));
$(window).trigger('myEvent', data);        window.dispatchEvent(new CustomEvent('myEvent', { detail: data }));
```

---

## Migration Checklist Per File

- [ ] List all `$(` calls in the file
- [ ] Replace `$('#id')` → `U.Dom.get(...)` or `U.Dom.select(...)`
- [ ] Replace `.addClass`/`.removeClass`/`.toggleClass`/`.hasClass` → `U.Dom.addClass`/etc.
- [ ] Replace `.css(prop, value)` → `el.style.prop = value`
- [ ] Replace `.width()`/`.height()` → `U.Dom.contentWidth()`/`clientWidth`/`getBoundingClientRect()`
- [ ] Replace `$(window).on/off` → `addEventListener`/`removeEventListener` with stored handler ref
- [ ] Replace `$(ref.current)` → use ref directly
- [ ] Replace `.find(selector)` → `U.Dom.select(selector, parent)` or `parent.querySelector()`
- [ ] Replace `.scrollTop()` → `el.scrollTop` property
- [ ] Never use raw `document.getElementById`/`querySelector` — use `U.Dom.*`
- [ ] Run `bun run typecheck` and `bun run lint`
- [ ] Manually test the interaction (resize, drag, menu, etc.)
- [ ] Remove `import $ from 'jquery'` if no `$(` calls remain
- [ ] Verify no runtime errors in dev console

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Drag/resize regression | Test each heavy file individually; keep jQuery until verified |
| `.width()` vs native width | jQuery `.width()` = content only; `clientWidth` includes padding. Use `U.Dom.contentWidth()` for pixel math |
| Layout thrashing | Batch DOM reads before writes; use `requestAnimationFrame` |
| `window.$` bypasses linting | 38 files use global `$` — remove `window.$ = $` in Phase 6 |
| jQuery `.trigger()` data convention | Custom data moves from 2nd arg to `event.detail` — verify listeners |
