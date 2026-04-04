# Anytype-TS Codebase Refactoring Analysis

> Generated: 2026-04-04 | Scope: `src/ts/` full codebase audit

---

## Completed Work

| Date | What |
|------|------|
| 2026-03-19 | Phase 1 (type safety): replaced `as any` in mapper, command, common, mark, menu; typed config getter; null checks; strict equality |
| 2026-03-19 | Phase 2 (error handling): replaced all empty catch blocks with logging; added error context |
| 2026-03-26 | Phase 5.3 (architecture): replaced barrel imports with `unplugin-auto-import` across ~510 files; fixed circular init in storage.ts |
| 2026-03-28 | Tier 1 type fixes: typed dispatcher comment casts, translate fallback, sparkOnboarding messages, DetailStore makeObservable |
| 2026-03-28 | Code dedup: extracted `parseSubId()` in dispatcher (3 call sites unified) |
| 2026-03-28 | God file split: extracted 24 DOM helpers from `common.ts` (1,678->1,310) into new `dom.ts` (404 lines), updated 103 callers |
| 2026-04-02 | **jQuery removal complete**: removed `jquery` and `@types/jquery` from dependencies; converted all 199 files (~3,000 call sites) to native DOM + `U.Dom` helpers; ~70KB gzip saved from bundle |
| 2026-04-02 | **MobX modernization**: switched `mobx-react` to `mobx-react-lite`; added auto-observer Vite plugin (wraps exported function components automatically); removed manual `observer()` wraps from ~260 files |
| 2026-04-04 | **Scoped broadcast selectAll**: 9 unscoped `U.Dom.selectAll()` calls across 4 files scoped to nearest container |

---

## 1. God Files & Excessive Complexity

| File | Lines | Responsibilities |
|------|-------|-----------------|
| `docs/help/whatsNew.ts` | 3,701 | Hardcoded changelog data (should be JSON) |
| `component/form/commentEditor.tsx` | 3,566 | Lexical-based rich text editor: formatting, lists, code blocks, attachments, embeds, mentions, 60+ handlers |
| `component/editor/page.tsx` | 2,825 | Editor layout, children rendering, TOC, drag-drop, focus, throttled scroll/resize, block navigation |
| `lib/keyboard.ts` | 2,210 | Keyboard shortcuts, mouse tracking, drag/resize state, touch events, window focus/blur, sidebar auto-hide, ~80 methods |
| `lib/util/menu.ts` | 2,069 | Menu item generation for blocks, turn/transform menus, actions, colors, alignment, widgets, ~50 builder methods |
| `lib/api/command.ts` | 1,990 | ~100+ gRPC command wrapper functions across 30+ domains |
| `component/block/chat/form.tsx` | 1,953 | Lexical chat input with attachments, mentions, emoji, drag-drop, reply/edit state, ~50 handlers |
| `component/block/dataview.tsx` | 1,874 | View types (Grid, Board, Gallery, List, Calendar, Graph, Timeline), selection, filters, controls |
| `lib/api/mapper.ts` | 1,868 | Bidirectional protobuf ↔ TypeScript conversion for Block, Object, Event types |
| `lib/api/dispatcher.ts` | 1,807 | gRPC connection, streaming events, request/response handling, event batching, reconnection |
| `component/block/text.tsx` | 1,659 | Text block with marks, Prism syntax highlighting, selection, paste handling |
| `component/block/table.tsx` | 1,562 | Table block with cell selection, drag-drop reordering, scrolling, resize, keyboard nav |
| `lib/util/data.ts` | 1,427 | Block styling, sorting, tree navigation, content formatting, auth checks, ~50+ methods |
| `component/block/chat.tsx` | 1,323 | Chat message rendering, auto-loading, scroll position, pagination, date grouping |
| `lib/util/common.ts` | 1,304 | Catch-all utility: mouse/Electron access, object copying, KaTeX, clipboard, date formatting, ~60+ methods |

---

## 2. DOM & Event Patterns

### Current State

All production DOM queries go through `U.Dom` helpers. jQuery fully removed. No raw `document.querySelector` in source.

| Pattern | Occurrences | Files |
|---------|-------------|-------|
| `U.Dom.selectAll()` (scoped, with container) | ~111 | 54 |
| `U.Dom.selectAll()` (unscoped, document-wide) | ~18 | 8 |
| `U.Dom.get()` with template literal IDs | ~52 | 31 |
| `document.getElementById` | 6 | 5 (all bootstrap/entry code) |

### 2.1 Replace string-based ID lookups with React refs (L)

52 `U.Dom.get()` calls with template literal IDs across 31 files. Hot spots:
- `block/table.tsx` (46 selectors) -- cell selection, row/column operations
- `editor/page.tsx` (17 selectors) -- header, footer, cover positioning
- `block/index.tsx` (20 selectors) -- block menu, selection targets
- `drag/layer.tsx` (16 selectors) -- cloning block elements for drag preview
- `sidebar.ts` (15 selectors) -- panel wrappers, dummy elements

**Approach:** Components querying their own children use `useRef`; cross-component lookups use a ref registry (`Map<string, HTMLElement>`) on context.

### ~~2.2 Scope broadcast selectAll queries~~ -- DONE

Remaining ~18 unscoped calls are legitimately document-wide: `focus.ts` (global focus state), `keyboard.ts` (global drag/print), `animation.ts` (page animations), `onboarding.tsx` (overlays).

### 2.3 Event system

The codebase uses `U.Dom.addEvent`/`U.Dom.removeEvent` wrappers and `U.Dom.eventDispatch()` for custom events. Current state is functional but could benefit from:
- **Typed event bus** -- replace remaining `window.dispatchEvent(new CustomEvent(...))` calls with type-safe emitter (no DOM overhead)
- **EventNamespace utility** -- reduce verbose addEventListener/removeEventListener pairs with automatic cleanup

---

## 3. Type Safety

### 3.1 `as any` Casts (95 remaining)

| Location | Count | Notes |
|----------|-------|-------|
| `component/` | 51 | drag/provider.tsx (8), graph/provider.tsx (9), comment/post.tsx (5), comment/reply.tsx (3), popup/search.tsx (3), editor/page.tsx (3), 17 more files (1-2 each) |
| `lib/` (tests) | 32 | comment.test.ts (25), 5 other test files (1-2 each) -- test mocking, acceptable |
| `lib/` (production) | 12 | api/service.ts (7, gRPC constraints), web/electronMock.ts (5, window globals) |
| `store/` | 0 | Clean |

**Worst patterns:** DOM element property storage (`(el as any)._handler`), canvas touch handlers, gRPC type casts.

### 3.2 `any` in Interfaces (~241 occurrences in 16 files)

| File | Count | Key issues |
|------|-------|------------|
| `interface/menuData.ts` | ~91 | `(...args: any[]) => void` callbacks, `[key: string]: any` catch-alls |
| `interface/block/dataview.ts` | ~44 | Untyped getters, `customOrder?: any[]`, generic message callbacks |
| `interface/common.ts` | ~20 | Toast `object`, `target`, `origin` all `any`; Option `id` as `any` |
| `interface/block/index.ts` | ~17 | Mixed typed/untyped event handler params |
| `interface/block/table.ts` | ~16 | Event handler params |
| `interface/menu.ts` | ~8 | MenuParam `rect`, `offsetX/Y`, `data` all `any` |
| Others (10 files) | ~45 | 1-7 each |

**menuData.ts is the worst offender** -- makes it impossible to know what callback arguments expect.

### 3.3 `any` in Stores (~30 occurrences)

- `detail.ts` (~13) -- entire object store untyped, generic value sanitization
- `block.ts` (~20) -- untyped updates, generic tree operations, filter predicates
- `record.ts` (~15) -- untyped view/relation list operations

### 3.4 Enums vs Union Types (44 enums in interface/)

14 enums with < 5 members could be union types for better tree-shaking:
`AnimType` (2), `AnimDirection` (2), `MenuType` (2), `TimeFormat` (2), `LinkCardStyle` (3), `LinkDefaultStyle` (3), `LinkIconSize` (3), `LinkDescription` (3), `SortType` (3), `EmptyType` (3), `FilterOperator` (3), `MarkerType` (4), and 2 others.

### 3.5 Non-null Assertions (4 instances)

- `lib/service/sparkOnboarding.ts:19` -- `this.listeners.get(event)!.push(fn)` -- Map get without registration check
- `lib/web/electronMock.ts:508` -- `this.eventListeners.get(event)!.add(callback)` -- same pattern
- `component/util/icons/registry.ts:39` -- `folders.get(folder)!.push(name)` -- same pattern
- `lib/mark.test.ts:369` -- test assertion, acceptable

---

## 4. React Anti-Patterns

### 4.1 `forceUpdate()` Abuse (58 files, ~135 occurrences) -- CRITICAL

```typescript
const [ dummy, setDummy ] = useState(0);
const forceUpdate = () => setDummy(dummy + 1);
```

Key locations: `editor/page.tsx`, `dataview.tsx`, `board.tsx`, `chat.tsx`, `sidebar/section/index.tsx`, `controlButtons.tsx`, `set.tsx`, `relation.tsx`, `settings/index.tsx`, 49+ more.

**Root cause:** Components not properly observing MobX state. Auto-observer plugin wraps exports but doesn't fix internal observation patterns where stores are accessed in callbacks/effects rather than render.

### 4.2 Zero Memoization in Largest Components -- CRITICAL

| Component | Lines | useCallback | useMemo | React.memo |
|-----------|-------|-------------|---------|------------|
| `editor/page.tsx` | 2,825 | 0 | 0 | No |
| `block/dataview.tsx` | 1,874 | 0 | 0 | No |
| `block/chat/form.tsx` | 1,953 | 0 | 0 | Export only |
| `block/text.tsx` | 1,659 | 0 | 0 | No |
| `block/table.tsx` | 1,562 | 0 | 0 | No |

9,873 combined lines with no callback/computation memoization. Note: `useCallback`/`useMemo` are used in newer code (comment/form.tsx: 25 uses, comment/section.tsx: 23 uses, commentEditor.tsx: 13 uses).

### 4.3 Excessive Prop Drilling

| Interface | Props | File |
|-----------|-------|------|
| `BlockComponent` | 19+ | `interface/block/index.ts` |
| `WidgetComponent` | 14 | `interface/block/widget.ts` |
| `SidebarSectionComponent` | 13 | `interface/sidebar.ts` |
| `PageSettingsComponent` | 10+ | `interface/common.ts` |

`BlockComponent` is passed through dozens of component hierarchies. Deeply nested components receive props they don't use.

### 4.4 Class Components

Only 1 remaining: `component/util/errorBoundary.tsx` -- required by React (Error Boundaries must be class components).

---

## 5. MobX Modernization

### ~~5.1 Switch `mobx-react` to `mobx-react-lite`~~ -- DONE
### ~~5.2 Auto-observer Vite plugin~~ -- DONE

### 5.3 Migrate stores to `makeAutoObservable` (M)

All 14 stores use verbose `makeObservable(this, { prop: observable, method: action, ... })`. `makeAutoObservable` infers annotations automatically.

Most complex stores by annotation volume:
- `common.ts` -- 30+ observable properties
- `record.ts` -- 7 properties + 17 actions
- `sparkOnboarding.ts` -- 12 properties + 11 actions

Needs care: audit each store for subclassing or private property patterns that `makeAutoObservable` can't handle.

### 5.4 Direct Mutations Outside Actions

- `store/block.ts:738,745,785,807,810` -- `item.childBlocks = ...` in `getTree`/`wrapTree` methods not marked as actions (operates on copies via `U.Common.objectCopy()`, low risk but bypasses MobX action wrapping)
- `store/detail.ts:287` -- `object[item.relationKey] = item.value` (direct assignment)

---

## 6. Error Handling

### Current State

65 total catch blocks: 54 (83%) include logging, 11 (17%) are silent.

**Silent catch blocks (7 empty, 4 comment-only):**

| File | Context | Risk |
|------|---------|------|
| `drag/provider.tsx:548` | JSON.parse of drag data | Medium -- data loss risk |
| `drag/provider.tsx:826` | Drag event handling | Medium -- silenced errors |
| `graph/provider.tsx:62,341,354,356` | Canvas/image operations | Low -- rendering fallback |
| `lib/util/embed.ts:60` | URL parsing | Low -- validation fallback |
| `lib/util/string.ts:274,314` | URL encoding, slug generation | Low -- string fallback |
| `component/block/text.tsx:16` | Prism dynamic import | Low -- syntax highlighting optional |
| `component/popup/usecase.tsx:37` | URL parsing | Low -- validation fallback |

---

## 7. Architecture & Coupling

### 7.1 Import Coupling

| File | Distinct Imports | Assessment |
|------|-----------------|------------|
| `component/editor/page.tsx` | 10 | High -- multiple nested Component imports |
| `lib/api/dispatcher.ts` | 9 | Moderate -- includes `@dnd-kit/sortable` (questionable in gRPC client) |
| `lib/action.ts` | 4 | Low -- well-focused |
| `lib/keyboard.ts` | 4 | Low -- well-contained |

**Issue:** `dispatcher.ts` imports `@dnd-kit/sortable` -- a UI library has no place in the gRPC communication layer.

### 7.2 Reverse Imports (lib importing from component)

- `lib/util/graph.ts` imports `Component/util/icons` -- utility depending on component
- `lib/util/object.ts` imports `Component/util/icons` -- same pattern

These break the clean `Component → Lib → Store` dependency hierarchy.

### 7.3 Window Globals

| Global | Usage | Risk |
|--------|-------|------|
| `window.Anytype` | `app.tsx:53` -- dev-only debug interface | Low |
| `window.AnytypeGlobalConfig` | Read in `common.ts`, `menu/index.tsx` -- config from host environment | Low |
| `window.isExtension` | Read in `keyboard.ts`, `survey.ts`, `popup.ts` -- feature flag | Low |
| `window.isWebVersion` | Read in `app.tsx` -- platform detection | Low |

All are read-only or dev-only. `window.Electron` and `window.AnytypeGlobalConfig` assignments now only in test setup.

### 7.4 Store Isolation

Stores are well-isolated -- no inter-store imports detected. All stores import only from `Interface` and `Model`. Cross-store access is through the global `S` namespace (standard MobX pattern).

---

## 8. Inconsistent Patterns

### 8.1 Null/Undefined Checks (biggest inconsistency)

| Pattern | Count |
|---------|-------|
| `== null` (loose) | 90 |
| `=== null` (strict) | 30 |
| `== undefined` (loose) | 69 |
| `=== undefined` (strict) | 17 |
| `!== undefined` | 52 |
| `undefined !== value` (reversed) | 40 |
| `!value` (ambiguous negation) | 839 |

No clear convention. Loose equality is 3x more common than strict.

### 8.2 Array Iteration (in component/)

| Pattern | Count | Files |
|---------|-------|-------|
| `.forEach()` | 213 | 71 |
| `for...of` | 118 | 60 |
| `for (let i=0...)` | 34 | 25 |
| `for...in` | 23 | 16 |

`.forEach()` dominates (1.8x more than `for...of`). Mixed but not problematic.

### 8.3 Optional Chaining for Property Access

1,315 occurrences across 250 files -- well-adopted. A few verbose `x && x.y && x.y.z` chains remain (e.g., `chat/form.tsx:561`).

### 8.4 Verbose Optional Method/Callback Calls (~357 occurrences, 124 files)

Pattern: `if (callback) { callback(...) }` can be simplified to `callback?.()`.

```typescript
// Before
if (item.onSwitch) {
    item.onSwitch(e, !item.switchValue);
};

// After
item.onSwitch?.(e, !item.switchValue);
```

**Top files:**

| File | Count | Pattern |
|------|-------|---------|
| `lib/keyboard.ts` | 29 | Event handler checks |
| `lib/relation.ts` | 14 | Callback checks |
| `component/util/iconObject.tsx` | 13 | Props callback checks |
| `component/page/main/date.tsx` | 9 | Props callback checks |
| `component/form/editable.tsx` | 9 | onChange/onKeyDown/onBlur checks |
| `component/form/textarea.tsx` | 8 | Form event handler checks |
| `lib/util/graph.ts` | 7 | Callback checks |
| `lib/dataview.ts` | 7 | Callback checks |
| `component/menu/index.tsx` | 7 | onOpen/onClose checks |
| `lib/api/dispatcher.ts` | 7 | Subscription callback checks |
| `component/block/featured.tsx` | 7 | Props callback checks |
| `component/form/select.tsx` | 6 | onChange/onOpen checks |

**Categories:** form components (54), menu/popup (89), utility/lib (108), block/editor (67), store/state (39).

### 8.5 Import Style

Excellent consistency: 451/497 namespace imports use the `import * as I from 'Interface'` single-letter convention.

---

## 9. Code Duplication

### 9.1 Comment Mark Rendering (reply.tsx ↔ post.tsx) -- 100% duplicate

`comment/reply.tsx` (lines 40-102) and `comment/post.tsx` (lines 60-123) have **line-for-line identical** mark binding logic for mentions, links, objects, and emoji. Both use `U.Dom.selectAll()` with `Mark.getTag()` in a `useEffect`.

`block/index.tsx` has related but architecturally different render methods (renderMentions, renderLinks, etc.) -- more complex, with React component rendering and routing. `chat/message/index.tsx` imports and reuses the block methods.

**Fix:** Extract shared `bindMarkHandlers(node, isEditing, parts, subId)` utility in `component/comment/markBindings.ts`. Both reply.tsx and post.tsx call it in their useEffect. ~60 lines eliminated.

### 9.2 Tooltip Setup Boilerplate (27 files, 64 occurrences)

Every interactive component repeats the same 5-line pattern:

```typescript
const onMouseEnter = (e) => {
    const t = Preview.tooltipCaption(text, caption);
    if (t) Preview.tooltipShow({ ...tooltipParam, text: t, element: nodeRef.current });
};
const onMouseLeave = () => Preview.tooltipHide(false);
useEffect(() => () => Preview.tooltipHide(false), []);
```

Found in: `icon.tsx`, `button.tsx`, `label.tsx`, `iconObject.tsx`, `select.tsx`, `objectName.tsx`, and 21 more.

**Fix:** Create `useTooltip(tooltipParam, nodeRef)` hook returning `{ onMouseEnter, onMouseLeave }`. Eliminates ~5 lines per component across 27 files.

### 9.3 Event Rebind/Unbind Lifecycle (~6 components, 600-800 lines)

Components manage multiple event handlers through identical `rebind()`/`unbind()` function pairs with `useRef` storage:

```typescript
const scrollHandlerRef = useRef(null);
const rebind = () => { unbind(); scrollHandlerRef.current = () => onScroll(); U.Dom.addEvent(sc, 'scroll', scrollHandlerRef.current); };
const unbind = () => { if (scrollHandlerRef.current) { U.Dom.removeEvent(sc, 'scroll', scrollHandlerRef.current); scrollHandlerRef.current = null; } };
```

Worst offenders:
- `block/dataview.tsx` -- 9 HandlerRef instances, ~200 lines of bind/unbind
- `editor/page.tsx` -- multiple events bound in rebind, ~230 lines
- `block/dataview/view/board.tsx` -- 5 HandlerRef instances, ~120 lines
- `drag/provider.tsx`, `popup/page.tsx`, `view/grid.tsx` -- similar patterns

**Fix:** Create `useEventBinder(bindings)` hook that accepts an array of `{ target, event, handler }` and manages refs + cleanup automatically. ~200 lines saved across 4-6 files.

### 9.4 Dataview Menu Parameter Construction (~20 sites, 8+ files)

Dataview menus repeat near-identical parameter objects:

```typescript
S.Menu.open('menuId', {
    element: `#${getId()} #item-${U.Common.esc(item.id)}`,
    classNameWrap: 'fromBlock',
    horizontal: I.MenuDirection.Left,
    offsetY: 4,
    noFlipY: true,
    data: { rootId, blockId, isInline, getView, getTarget, readonly, loadData, ... }
});
```

Also: 5 sites use `onOpen`/`onClose` hover state callbacks (`U.Dom.addClass(el, 'hover')` / `U.Dom.removeClass(el, 'hover')`), and 8+ sites use menu close-then-open chains.

**Fix:** Create `createDataviewMenuParam()` factory and `createHoverCallbacks()` helper in `lib/util/menuFactory.ts`. ~50 duplication points consolidated.

### 9.5 Summary

| Pattern | Sites | Files | Lines Saved | Effort |
|---------|-------|-------|-------------|--------|
| Comment mark bindings | 2 | 2 | ~60 | S |
| Tooltip setup | 64 | 27 | ~135 | S |
| Event rebind/unbind | 30+ | 6 | ~200 | M |
| Dataview menu params | 20+ | 8 | ~100 | S |
| **Total** | **~116** | **~43** | **~495** | |

---

## 10. Refactoring Plan

### Phase 1: React Performance (High Impact)

| Task | Impact | Effort |
|------|--------|--------|
| Investigate forceUpdate patterns -- determine which are needed vs. which are MobX observation gaps | Reduces unnecessary re-renders | M |
| Add `useCallback`/`useMemo` to editor/page.tsx, dataview.tsx, text.tsx, table.tsx | Prevents child re-render cascades | M |

### Phase 2: God File Decomposition

| Task | Source | Target | Effort |
|------|--------|--------|--------|
| Split commentEditor.tsx (3,566 lines) | `component/form/commentEditor.tsx` | Extract form logic, state management, toolbar into separate modules | L |
| Split keyboard.ts (2,210 lines) | `lib/keyboard.ts` | KeyboardHandler, MouseHandler, MenuKeyboard, FocusManager | L |
| Split editor/page.tsx (2,825 lines) | `component/editor/page.tsx` | Extract hooks: useEditorFocus, useEditorDrag, useEditorScroll | XL |
| Split chat/form.tsx (1,953 lines) | `component/block/chat/form.tsx` | ChatComposer, AttachmentPanel, MentionHandler | L |
| Split menu.ts (2,069 lines) | `lib/util/menu.ts` | Group builders by domain (block types, turn actions, etc.) | L |

### Phase 3: MobX Modernization

| Task | Files | Effort |
|------|-------|--------|
| Migrate stores to `makeAutoObservable` | 14 store files | M |
| Wrap direct mutations in `block.ts` tree methods with `action()` | store/block.ts | S |

### Phase 4: Type Safety

| Task | Files | Effort |
|------|-------|--------|
| Type `menuData.ts` callback signatures | interface/menuData.ts (~91 `any`) + consumers | XL |
| Type `dataview.ts` interfaces | interface/block/dataview.ts (~44 `any`) | L |
| Type store methods in detail.ts, block.ts, record.ts | 3 store files (~48 `any`) | L |
| Convert 14 small enums to union types | interface/ files | S |
| Replace `(el as any)._handler` patterns with WeakMap | drag/provider.tsx, graph/provider.tsx | S |
| Replace verbose `if (cb) { cb() }` with `cb?.()` | 124 files (~357 occurrences) | S-M |

### Phase 5: DOM Optimization

| Task | Impact | Effort |
|------|--------|--------|
| Replace string-based ID lookups with React refs in hot components (table.tsx, editor/page.tsx) | O(1) element access, fewer DOM traversals | L |
| Create typed event bus to replace CustomEvent dispatch | Type safety, no DOM overhead | M |

### Phase 6: Architecture Cleanup

| Task | Files | Effort |
|------|-------|--------|
| Remove `@dnd-kit/sortable` from dispatcher.ts | lib/api/dispatcher.ts | S |
| Extract icon utilities from lib/util to avoid reverse imports | lib/util/graph.ts, lib/util/object.ts | S |
| Add logging to silent catch blocks in drag/provider.tsx | component/drag/provider.tsx | S |
| Replace prop drilling with context for BlockComponent (19 props) | interface/block/index.ts + component tree | L |

### Phase 7: Code Deduplication

| Task | Sites | Effort |
|------|-------|--------|
| Extract comment mark bindings into shared utility | 2 files | S |
| Create `useTooltip()` hook | 27 files | S |
| Create dataview menu param factory + hover callbacks helper | 8+ files | S |
| Create `useEventBinder()` hook for rebind/unbind lifecycle | 6 files | M |

### Effort Key

- **S** = Small (< 1 day) | **M** = Medium (1-3 days) | **L** = Large (3-5 days) | **XL** = Extra Large (1-2 weeks)

---

## 11. Suggested Execution Order

```
Quick wins (S effort):
  - Wrap block.ts tree mutations with action()
  - Convert 14 small enums to union types
  - Replace (el as any)._handler with WeakMap
  - Remove @dnd-kit/sortable from dispatcher
  - Fix reverse imports in lib/util/graph.ts, object.ts
  - Add logging to silent catch blocks
  - Replace verbose if (cb) { cb() } with cb?.() (~357 sites, 124 files)
  - Extract comment mark bindings (reply.tsx + post.tsx)
  - Create useTooltip() hook (27 files)
  - Create dataview menu param factory (8+ files)

Next (M effort):
  - Investigate and fix forceUpdate patterns
  - Add useCallback/useMemo to large components
  - Migrate stores to makeAutoObservable
  - Create typed event bus
  - Create useEventBinder() hook (6 files, ~200 lines saved)

Then (L effort):
  - God file splits: commentEditor, keyboard, chat/form, menu
  - Type safety: dataview interfaces, store methods
  - Replace string ID lookups with React refs

Later (XL effort):
  - Type menuData.ts callback signatures
  - Split editor/page.tsx
  - Replace prop drilling with context
```
