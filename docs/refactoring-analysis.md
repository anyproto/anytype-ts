# Anytype-TS Codebase Refactoring Analysis

> Generated: 2026-03-15 | Updated: 2026-03-28 | Scope: `src/ts/` full codebase audit

---

## Completed Work

| Date | What |
|------|------|
| 2026-03-19 | Phase 1 (type safety): replaced `as any` in mapper, command, common, mark, menu; typed config getter; null checks; strict equality |
| 2026-03-19 | Phase 2 (error handling): replaced all empty catch blocks with logging; added error context |
| 2026-03-26 | Phase 5.3 (architecture): replaced barrel imports with `unplugin-auto-import` across ~510 files; fixed circular init in storage.ts |
| 2026-03-28 | Tier 1 type fixes: typed dispatcher comment casts, translate fallback, sparkOnboarding messages, DetailStore makeObservable |
| 2026-03-28 | Code dedup: extracted `parseSubId()` in dispatcher (3 call sites unified) |
| 2026-03-28 | God file split: extracted 24 DOM helpers from `common.ts` (1,678→1,310) into new `dom.ts` (404 lines), updated 103 callers |

---

## 1. God Files & Excessive Complexity

| File | Lines | Responsibilities |
|------|-------|-----------------|
| `docs/help/whatsNew.ts` | 3,701 | Hardcoded changelog data (should be JSON) |
| `component/editor/page.tsx` | 2,767 | Editor state, drag/drop, keyboard, focus, rendering, TOC |
| `lib/keyboard.ts` | 2,198 | Keyboard, mouse, shortcuts, menus, focus — all in one |
| `lib/util/menu.ts` | 2,149 | Menu positioning, filtering, keyboard nav, styling |
| `lib/api/command.ts` | 1,975 | 100+ gRPC command exports (shrunk from 2,572) |
| `component/block/chat/form.tsx` | 1,945 | Chat form, attachments, editing, mention handling |
| `lib/api/mapper.ts` | 1,931 | Protobuf mapping with long if-chains |
| `component/block/dataview.tsx` | 1,796 | All dataview types (grid, board, calendar, gallery) |
| `lib/api/dispatcher.ts` | 1,766 | gRPC lifecycle, event buffering, command queueing |
| `component/block/text.tsx` | 1,660 | Text block with marks, latex, code, mentions |
| `component/block/table.tsx` | 1,456 | Table block with editing, selection, drag |
| `lib/util/common.ts` | 1,310 | Catch-all utility (DOM extracted to `dom.ts`) |
| `lib/dataview.ts` | 1,267 | Dataview handler |
| `component/block/chat.tsx` | 1,252 | Chat block manager |
| `component/menu/smile.tsx` | 1,216 | Emoji menu with library and upload |
| `component/drag/provider.tsx` | 1,154 | Drag provider with complex state |
| `component/block/index.tsx` | 1,168 | Block factory/dispatcher |
| `lib/action.ts` | 1,163 | Action dispatcher |
| `lib/relation.ts` | 1,148 | Relation handler |
| `component/menu/index.tsx` | 1,116 | Menu dispatcher |

---

## 2. Type Safety — Remaining

### 2.1 `as any` Casts (~18 remaining in lib/ + store/, excl. tests)

- **`lib/api/service.ts`** — gRPC Object/decode casts (7 instances) — low-level, hard to fix

### 2.2 `any` in Interfaces (78 occurrences in `src/ts/interface/`)

- `interface/common.ts` — Toast `object`, `target`, `origin` all `any`; Option `id` as `any`; `tabs?: any[]`
- `interface/menu.ts` — MenuParam `element`, `rect` as `any`; `offsetX/Y` as `any`; `data?: any`; MenuRef `getItems?.(): any[]`
- `interface/sparkOnboarding.ts` — `[key: string]: any` index signatures

### 2.3 `any` in Stores

- `store/detail.ts:5-8` — Detail interface uses `any` for value
- `store/block.ts:35` — `Map<string, Map<string, any>>` restriction map

### 2.4 Enum Overuse (113 enums in `interface/`)

Many simple enums could be union types.

---

## 3. Unsafe Access Patterns — Remaining

All fixable items resolved. Remaining items audited as safe:
- `lib/relation.ts:55` — guarded by `includes()` check
- `lib/util/embed.ts:360` — `split()` always returns ≥1 element
- `component/block/text.tsx:897` — used with `||` fallback chain
- `lib/mark.ts:638` — has null check before access
- `lib/util/string.ts:303,333,344,365-370` — all have `m && m.length` guards

---

## 4. Error Handling — Remaining

- `lib/web/electronMock.ts:83,476` — `console.warn`/`console.error` then continues
- Create consistent error handling patterns (new error utility) — M effort

---

## 5. React Anti-Patterns

### 5.1 `forceUpdate()` Abuse (30 files) — CRITICAL

```typescript
const [ dummy, setDummy ] = useState(0);
const forceUpdate = () => setDummy(dummy + 1);
```

Key locations: `editor/page.tsx`, `controlButtons.tsx`, `set.tsx`, `popup/relation.tsx`, `sidebar/section/index.tsx`, `cell/index.tsx`, `sidebar/right.tsx`, `header/index.tsx`, 22+ more.

**Root cause:** Child components missing `observer()` wrappers.

### 5.2 Massive Components Without Memoization

- `editor/page.tsx` (2,767 lines) — no `useCallback`/`useMemo`
- `chat/form.tsx` (1,945 lines) — no callback memoization
- `dataview.tsx` (1,796 lines) — many unmemoized callbacks

### 5.3 Excessive Prop Drilling

- `chat/form.tsx:13-26` — 13+ callback props drilled down instead of using stores

### 5.4 jQuery DOM Manipulation in React Components

- `drag/provider.tsx:46` — `getContainer().find('.dropTarget.isDroppable').each(...)` with `el: any`

### 5.5 Ref Mutation for Non-UI State

- `dataview.tsx:47-48` — Large `Map` stored in refs, bypassing reactivity

---

## 6. MobX Misuse

- `store/detail.ts:287` — `object[item.relationKey] = item.value` (direct assignment)
- `store/block.ts:737,744,783` — `item.childBlocks = ...` (direct mutation of tree items)

---

## 7. Global State & Window Pollution

- `app.tsx:52` — `window.$ = jQuery`
- `app.tsx:55` — `window.Anytype = { ... }`
- `window.Electron` — `lib/util/common.ts:40`
- `window.AnytypeGlobalConfig` — `lib/util/common.ts:47`, `lib/web/electronMock.ts:381-382,427-428`
- `window.isExtension` — `lib/keyboard.ts:2123`

---

## 8. Architecture & Coupling — Remaining

### 8.1 High Coupling in Dispatcher

`dispatcher.ts` imports 14 modules — gRPC handler triggers business logic directly.

### 8.2 Action Module Couples Everything

`action.ts` imports 15 dependencies.

### 8.3 Inconsistent Event Systems

Four patterns coexist: jQuery `$(window).on()`, React `useEffect`, Renderer IPC, gRPC streaming.

---

## 9. Code Duplication — Remaining

Triaged items found to be false positives on inspection:
- `embed.ts` — each processor does fundamentally different URL transforms; not extractable
- `menu.ts` — two consecutive checks within one callback, not separate duplicated functions
- `storage.ts` — standard delegation pattern, not duplication

---

## 10. Inconsistent Patterns

- **Null checks:** Mix of `!value`, `value == null`, `value === undefined`, `undefined !== value`
- **Optional chaining:** Used inconsistently
- **State updates:** MobX `.set()` vs direct assignment vs computed getters
- **Data fetching:** gRPC through dispatcher vs direct command calls vs event streaming

---

## 11. Refactoring Plan — Remaining Tasks

### Phase 1: Type Safety — 1 remaining task

| Task | Files | Effort |
|------|-------|--------|
| Type `data?: any` in MenuParam interface | interface/menu.ts + all menu consumers | L |

### Phase 2: Error Handling — 1 remaining task

| Task | Files | Effort |
|------|-------|--------|
| Create consistent error handling patterns | New error utility | M |

### Phase 3: God File Decomposition — 3 remaining tasks

| Task | Source File | Target Modules | Effort |
|------|-----------|----------------|--------|
| Split keyboard.ts | `lib/keyboard.ts` (2,198 lines) | KeyboardHandler, MouseHandler, MenuKeyboard, FocusManager | L |
| Split editor/page.tsx | `component/editor/page.tsx` (2,767 lines) | Extract hooks: useEditorFocus, useEditorDrag, useEditorKeyboard | XL |
| Split chat/form.tsx | `component/block/chat/form.tsx` (1,945 lines) | ChatComposer, AttachmentPanel, MentionHandler | L |

### Phase 4: React & MobX Cleanup — 4 remaining tasks

| Task | Files | Effort |
|------|-------|--------|
| Audit `forceUpdate()` usage — add missing `observer()` | 30 component files | L |
| Add `useCallback`/`useMemo` to large components | editor/page.tsx, dataview.tsx, chat/form.tsx | M |
| Replace prop drilling with direct store access | chat/form.tsx (13 props) | M |
| Replace jQuery DOM access with React refs | drag/provider.tsx | M |

### Phase 5: Architecture — 2 remaining tasks

| Task | Files | Effort |
|------|-------|--------|
| Replace window globals with DI/module imports | app.tsx, common.ts, electronMock.ts | L |
| Reduce dispatcher coupling (extract event handlers) | dispatcher.ts, action.ts | XL |
| Unify event system | keyboard.ts, components, dispatcher.ts | XL |

### Effort Key

- **S** = Small (< 1 day) | **M** = Medium (1–3 days) | **L** = Large (3–5 days) | **XL** = Extra Large (1–2 weeks)

---

## 12. Low-Hanging Fruit Plan — Remaining

### Tier 2: Small Refactors (1–2 days each)

#### 2.1 Reduce `forceUpdate` in sidebar components (M)
**Files:** `sidebar/section/index.tsx`, `sidebar/section/type/title.tsx`, `sidebar/section/type/relation.tsx`, `sidebar/section/type/layout.tsx`, `sidebar/section/type/template.tsx`, `sidebar/right.tsx`, `sidebar/page/object/relation.tsx`
**What:** 7 sidebar files use forceUpdate. Add `observer()` wrapper or convert triggering state to MobX observable.

#### 2.2 Reduce `forceUpdate` in header components (M)
**Files:** `header/index.tsx`, `header/main/object.tsx`, `header/main/history.tsx`, `header/main/chat.tsx`
**What:** 4 header files. Same pattern — likely missing `observer()` on child components.

### Tier 3: Medium Refactors (2–3 days each)

#### 3.2 Split `keyboard.ts` mouse handling (M)
**File:** `lib/keyboard.ts` (2,198 lines)
**What:** Extract mouse event handlers into `lib/mouse.ts`. ~200-300 lines.

#### 3.3 Type `MenuParam.data` with discriminated union (M–L)
**File:** `interface/menu.ts`
**What:** Replace `data?: any` with a discriminated union keyed on menu ID.

### Suggested Execution Order

```
Next: Tier 2.1 + 2.2 (forceUpdate in sidebar + header)
Then: Tier 3.2 + 3.3 (keyboard split + MenuParam typing)
```
