# Anytype-TS Codebase Refactoring Analysis

> Generated: 2026-03-15 | Updated: 2026-04-02 | Scope: `src/ts/` full codebase audit

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
| 2026-04-02 | **jQuery removal complete**: removed `jquery` and `@types/jquery` from dependencies; converted all 199 files (~3,000 call sites) to native DOM + `U.Dom` helpers; sidebar panel methods return `HTMLElement`; `scrollOnMove` and `U.StickyScrollbar` accept `HTMLElement`; `JQuery` types removed from interfaces; ~70KB gzip saved from bundle |

---

## 1. God Files & Excessive Complexity

| File | Lines | Responsibilities |
|------|-------|-----------------|
| `docs/help/whatsNew.ts` | 3,701 | Hardcoded changelog data (should be JSON) |
| `component/editor/page.tsx` | 2,827 | Editor state, drag/drop, keyboard, focus, rendering, TOC |
| `lib/keyboard.ts` | 2,212 | Keyboard, mouse, shortcuts, menus, focus -- all in one |
| `lib/util/menu.ts` | 2,064 | Menu positioning, filtering, keyboard nav, styling |
| `lib/api/command.ts` | 1,990 | 100+ gRPC command exports |
| `component/block/chat/form.tsx` | 1,954 | Chat form, attachments, editing, mention handling |
| `lib/api/mapper.ts` | 1,931 | Protobuf mapping with long if-chains |
| `component/block/dataview.tsx` | 1,867 | All dataview types (grid, board, calendar, gallery) |
| `lib/api/dispatcher.ts` | 1,772 | gRPC lifecycle, event buffering, command queueing |
| `component/block/text.tsx` | 1,656 | Text block with marks, latex, code, mentions |
| `component/block/table.tsx` | 1,566 | Table block with editing, selection, drag |
| `component/block/chat.tsx` | 1,328 | Chat block manager |
| `lib/util/common.ts` | 1,304 | Catch-all utility (DOM extracted to `dom.ts`) |
| `lib/dataview.ts` | 1,267 | Dataview handler |
| `component/menu/smile.tsx` | 1,247 | Emoji menu with library and upload |
| `component/drag/provider.tsx` | 1,188 | Drag provider with complex state |
| `component/block/index.tsx` | 1,187 | Block factory/dispatcher |
| `lib/action.ts` | 1,170 | Action dispatcher |
| `component/menu/index.tsx` | 1,167 | Menu dispatcher |
| `lib/relation.ts` | 1,140 | Relation handler |

---

## 2. DOM Selector Optimization

### Current State

After jQuery removal, the codebase uses `U.Dom` helpers for all DOM access:

| Pattern | Occurrences | Files |
|---------|-------------|-------|
| `U.Dom.select/selectAll/get()` | ~524 | 126 |
| `U.Dom.get()` with template literal IDs | ~44 | 31 |
| `window.addEventListener/removeEventListener` | ~430 | 122 |
| `window.dispatchEvent(new CustomEvent(...))` | ~49 | 32 |

### Optimization Opportunities

#### 2.1 Replace string-based ID lookups with React refs (M)

Many components use `U.Dom.get('block-xxx')` or `U.Dom.select('#block-xxx')` to find elements that are rendered in the same React tree. These can be replaced with `useRef` for direct element access without DOM traversal.

**Hot spots** (most `U.Dom.get` calls with dynamic IDs):
- `block/index.tsx` (20 selectors) -- block menu, selection targets, column resize
- `editor/page.tsx` (17 selectors) -- header, footer, cover positioning
- `block/table.tsx` (46 selectors!) -- cell selection, row/column operations
- `drag/layer.tsx` (16 selectors) -- cloning block elements for drag preview
- `block/embed.tsx` (13 selectors) -- iframe management, value/error elements
- `sidebar.ts` (15 selectors) -- panel wrappers, dummy elements

**Approach:**
- Components that query their own children: pass refs down or use `useRef` + callback refs
- Cross-component queries (e.g. finding a block by ID from selection provider): consider a ref registry (`Map<string, HTMLElement>`) managed by the block tree, avoiding DOM queries entirely
- `U.Dom.get('sidebarDummyLeft')` etc: replace with refs stored on a layout context

#### 2.2 Reduce global `selectAll` broadcasts (S-M)

Some patterns query the entire document for classes to toggle:
```typescript
U.Dom.selectAll('.block.showMenu').forEach(el => U.Dom.removeClass(el, 'showMenu'));
U.Dom.selectAll('.cellKeyHover').removeClass('cellKeyHover');
```

These can be replaced with:
- Scoped queries within the relevant container (e.g. `U.Dom.selectAll('.block.showMenu', pageContainer)`)
- State-driven class toggling via React (add/remove classes via component state instead of DOM queries)

#### 2.3 Event handler namespace pattern (M)

The jQuery removal replaced `$(window).on('event.namespace')` with `window.addEventListener` + stored handler refs. This works but is verbose. Consider a lightweight `EventNamespace` utility:

```typescript
// Proposed: lib/eventNamespace.ts
class EventNamespace {
    private handlers = new Map<string, { event: string; handler: EventListener }>();

    on(target: EventTarget, eventNs: string, handler: EventListener) { ... }
    off(target: EventTarget, eventNs: string) { ... }
    offAll(target: EventTarget) { ... }
}
```

This would reduce ~430 manual `addEventListener`/`removeEventListener` pairs to a cleaner pattern with automatic cleanup.

#### 2.4 Custom event bus to replace `dispatchEvent` (M)

49 places use `window.dispatchEvent(new CustomEvent(...))` as a global event bus. A typed event emitter would provide:
- Type safety for event names and payloads
- No DOM overhead (pure JS)
- Easier to trace event flow

---

## 3. Type Safety -- Remaining

### 3.1 `as any` Casts (~18 remaining in lib/ + store/, excl. tests)

- **`lib/api/service.ts`** -- gRPC Object/decode casts (7 instances) -- low-level, hard to fix

### 3.2 `any` in Interfaces (78 occurrences in `src/ts/interface/`)

- `interface/common.ts` -- Toast `object`, `target`, `origin` all `any`; Option `id` as `any`; `tabs?: any[]`
- `interface/menu.ts` -- MenuParam `rect` as `any`; `offsetX/Y` as `any`; `data?: any`; MenuRef `getItems?.(): any[]`
- `interface/sparkOnboarding.ts` -- `[key: string]: any` index signatures

### 3.3 `any` in Stores

- `store/detail.ts:5-8` -- Detail interface uses `any` for value
- `store/block.ts:35` -- `Map<string, Map<string, any>>` restriction map

### 3.4 Enum Overuse (113 enums in `interface/`)

Many simple enums could be union types.

---

## 4. Unsafe Access Patterns -- Remaining

All fixable items resolved. Remaining items audited as safe:
- `lib/relation.ts:55` -- guarded by `includes()` check
- `lib/util/embed.ts:360` -- `split()` always returns >= 1 element
- `component/block/text.tsx:897` -- used with `||` fallback chain
- `lib/mark.ts:638` -- has null check before access
- `lib/util/string.ts:303,333,344,365-370` -- all have `m && m.length` guards

---

## 5. Error Handling -- Remaining

- `lib/web/electronMock.ts:83,476` -- `console.warn`/`console.error` then continues
- Create consistent error handling patterns (new error utility) -- M effort

---

## 6. React Anti-Patterns

### 6.1 `forceUpdate()` Abuse (~63 files, ~165 occurrences) -- CRITICAL

```typescript
const [ dummy, setDummy ] = useState(0);
const forceUpdate = () => setDummy(dummy + 1);
```

Key locations: `editor/page.tsx`, `controlButtons.tsx`, `set.tsx`, `popup/relation.tsx`, `sidebar/section/index.tsx`, `cell/index.tsx`, `sidebar/right.tsx`, `header/index.tsx`, 55+ more.

**Root cause:** Child components missing `observer()` wrappers.

### 6.2 Massive Components Without Memoization

- `editor/page.tsx` (2,827 lines) -- no `useCallback`/`useMemo`
- `chat/form.tsx` (1,954 lines) -- no callback memoization
- `dataview.tsx` (1,867 lines) -- many unmemoized callbacks

### 6.3 Excessive Prop Drilling

- `chat/form.tsx:13-26` -- 13+ callback props drilled down instead of using stores

### 6.4 Ref Mutation for Non-UI State

- `dataview.tsx:47-48` -- Large `Map` stored in refs, bypassing reactivity

---

## 7. MobX Modernization

### 7.1 Switch `mobx-react` to `mobx-react-lite` (S)

Currently using `mobx-react@9.2.1` (~260 files import `observer` from it). The project only uses function components -- no `Provider`, no `inject`, no class components. `mobx-react` is just `mobx-react-lite` + legacy class support we don't need.

- Mechanical find-replace: `'mobx-react'` -> `'mobx-react-lite'` in ~260 files
- Smaller bundle (~2KB), clearer intent
- Already used in anytype-bun

### 7.2 Auto-observer plugin (M) -- HIGH IMPACT

Add a Vite/Babel plugin to automatically wrap all exported components with `observer()`. This directly addresses the `forceUpdate()` problem (section 6.1, ~63 files) at the root -- components that are missing `observer()` wrappers would get them automatically.

- Eliminates ~260 manual `import { observer }` + wrapping boilerplate
- Prevents future regressions (new components are auto-observed)
- Already proven in anytype-bun

### 7.3 Migrate stores to `makeAutoObservable` (M)

All 15 stores use verbose `makeObservable(this, { prop: observable, method: action, ... })` with explicit annotations. `makeAutoObservable` infers them automatically, cutting ~200 lines of boilerplate. Already used in anytype-bun.

Needs care: `makeAutoObservable` can't handle subclassing or certain private property patterns -- audit each store individually.

### 7.4 Direct Mutation

- `store/detail.ts:287` -- `object[item.relationKey] = item.value` (direct assignment)
- `store/block.ts:737,744,783` -- `item.childBlocks = ...` (direct mutation of tree items)

---

## 8. Global State & Window Pollution

- `app.tsx:55` -- `window.Anytype = { ... }`
- `window.Electron` -- `lib/util/common.ts:40`
- `window.AnytypeGlobalConfig` -- `lib/util/common.ts:47`, `lib/web/electronMock.ts:381-382,427-428`
- `window.isExtension` -- `lib/keyboard.ts`

**Removed:**
- ~~`window.$ = jQuery`~~ (removed with jQuery)

---

## 9. Architecture & Coupling -- Remaining

### 9.1 High Coupling in Dispatcher

`dispatcher.ts` imports 14 modules -- gRPC handler triggers business logic directly.

### 9.2 Action Module Couples Everything

`action.ts` imports 15 dependencies.

### 9.3 Event System

After jQuery removal, events use `window.addEventListener` / `window.dispatchEvent(new CustomEvent(...))`. This is functional but:
- No type safety on event names/payloads
- No automatic cleanup (must manually store and remove handlers)
- Verbose boilerplate (~430 addEventListener/removeEventListener pairs across 122 files)
- See section 2.3-2.4 for proposed improvements

---

## 10. Code Duplication -- Remaining

Triaged items found to be false positives on inspection:
- `embed.ts` -- each processor does fundamentally different URL transforms; not extractable
- `menu.ts` -- two consecutive checks within one callback, not separate duplicated functions
- `storage.ts` -- standard delegation pattern, not duplication

---

## 11. Inconsistent Patterns

- **Null checks:** Mix of `!value`, `value == null`, `value === undefined`, `undefined !== value`
- **Optional chaining:** Used inconsistently
- **State updates:** MobX `.set()` vs direct assignment vs computed getters
- **Data fetching:** gRPC through dispatcher vs direct command calls vs event streaming

---

## 12. Refactoring Plan -- Remaining Tasks

### Phase 1: DOM Optimization -- 4 tasks (NEW)

| Task | Impact | Effort |
|------|--------|--------|
| Replace string-based ID lookups with React refs in hot components | Fewer DOM queries, better perf | L |
| Scope broadcast `selectAll` queries to nearest container | Fewer full-document scans | S |
| Create `EventNamespace` utility for window events | Cleaner event cleanup, less boilerplate | M |
| Create typed event bus to replace `CustomEvent` dispatch | Type safety, no DOM overhead | M |

### Phase 2: Type Safety -- 1 remaining task

| Task | Files | Effort |
|------|-------|--------|
| Type `data?: any` in MenuParam interface | interface/menu.ts + all menu consumers | L |

### Phase 3: Error Handling -- 1 remaining task

| Task | Files | Effort |
|------|-------|--------|
| Create consistent error handling patterns | New error utility | M |

### Phase 4: God File Decomposition -- 3 remaining tasks

| Task | Source File | Target Modules | Effort |
|------|-----------|----------------|--------|
| Split keyboard.ts | `lib/keyboard.ts` (2,212 lines) | KeyboardHandler, MouseHandler, MenuKeyboard, FocusManager | L |
| Split editor/page.tsx | `component/editor/page.tsx` (2,827 lines) | Extract hooks: useEditorFocus, useEditorDrag, useEditorKeyboard | XL |
| Split chat/form.tsx | `component/block/chat/form.tsx` (1,954 lines) | ChatComposer, AttachmentPanel, MentionHandler | L |

### Phase 5: MobX Modernization -- 3 tasks (NEW)

| Task | Files | Effort |
|------|-------|--------|
| Switch `mobx-react` to `mobx-react-lite` | ~260 component files (mechanical replace) | S |
| Add auto-observer Vite plugin | vite.config.ts + remove manual `observer()` wraps | M |
| Migrate stores to `makeAutoObservable` | 15 store files | M |

### Phase 6: React Cleanup -- 3 remaining tasks

| Task | Files | Effort |
|------|-------|--------|
| Audit `forceUpdate()` -- add missing `observer()` (or rely on auto-observer) | ~63 component files | L |
| Add `useCallback`/`useMemo` to large components | editor/page.tsx, dataview.tsx, chat/form.tsx | M |
| Replace prop drilling with direct store access | chat/form.tsx (13 props) | M |

### Phase 7: Architecture -- 2 remaining tasks

| Task | Files | Effort |
|------|-------|--------|
| Replace window globals with DI/module imports | app.tsx, common.ts, electronMock.ts | L |
| Reduce dispatcher coupling (extract event handlers) | dispatcher.ts, action.ts | XL |

### Effort Key

- **S** = Small (< 1 day) | **M** = Medium (1-3 days) | **L** = Large (3-5 days) | **XL** = Extra Large (1-2 weeks)

---

## 13. Suggested Execution Order

```
Next:  Phase 5.1 (mobx-react-lite swap) -- quick win, unblocks auto-observer
Then:  Phase 5.2 (auto-observer plugin) -- fixes forceUpdate at the root
Then:  Phase 1 (DOM optimization) -- scoped queries + EventNamespace
Then:  Phase 5.3 (makeAutoObservable) + Phase 4 (god file splits)
Later: Phase 2 + 7 (type safety + architecture)
```
