# Anytype-TS Codebase Refactoring Analysis

> Generated: 2026-03-15 | Updated: 2026-03-19 | Scope: `src/ts/` full codebase audit | Phase 1 nearly complete

---

## Table of Contents

1. [God Files & Excessive Complexity](#1-god-files--excessive-complexity)
2. [Type Safety & `any` Abuse](#2-type-safety--any-abuse)
3. [Unsafe Access Patterns](#3-unsafe-access-patterns)
4. [Error Handling](#4-error-handling)
5. [React Anti-Patterns](#5-react-anti-patterns)
6. [MobX Misuse](#6-mobx-misuse)
7. [Global State & Window Pollution](#7-global-state--window-pollution)
8. [Architecture & Coupling](#8-architecture--coupling)
9. [Code Duplication](#9-code-duplication)
10. [Inconsistent Patterns](#10-inconsistent-patterns)
11. [Refactoring Plan](#11-refactoring-plan)

---

## 1. God Files & Excessive Complexity

Files exceeding reasonable size, doing too much, and mixing multiple responsibilities.

| File | Lines | Responsibilities |
|------|-------|-----------------|
| `src/ts/docs/help/whatsNew.ts` | 3,701 | Hardcoded changelog data (should be JSON) |
| `src/ts/component/editor/page.tsx` | 2,746 | Editor state, drag/drop, keyboard, focus, rendering, TOC |
| `src/ts/lib/api/command.ts` | 2,572 | 100+ flat gRPC command exports with no grouping |
| `src/ts/lib/keyboard.ts` | 2,195 | Keyboard, mouse, shortcuts, menus, focus — all in one |
| `src/ts/lib/util/menu.ts` | 2,105 | Menu positioning, filtering, keyboard nav, styling |
| `src/ts/component/block/chat/form.tsx` | 1,910 | Chat form, attachments, editing, mention handling |
| `src/ts/lib/api/mapper.ts` | 1,904 | Protobuf mapping with long if-chains |
| `src/ts/lib/util/common.ts` | 1,696 | Catch-all utility: DOM, math, string, selection, storage |
| `src/ts/component/block/dataview.tsx` | 1,674 | All dataview types (grid, board, calendar, gallery) |
| `src/ts/lib/api/dispatcher.ts` | 1,682 | gRPC lifecycle, event buffering, command queueing, response mapping |
| `src/ts/component/block/text.tsx` | 1,642 | Text block with marks, latex, code, mentions |
| `src/ts/component/block/table.tsx` | 1,455 | Table block with editing, selection, drag |
| `src/ts/lib/dataview.ts` | 1,245 | Dataview handler |
| `src/ts/component/block/chat.tsx` | 1,222 | Chat block manager |
| `src/ts/component/menu/smile.tsx` | 1,216 | Emoji menu with library and upload |
| `src/ts/lib/relation.ts` | 1,170 | Relation handler |
| `src/ts/lib/action.ts` | 1,167 | Action dispatcher |
| `src/ts/component/block/index.tsx` | 1,165 | Block factory/dispatcher |
| `src/ts/component/menu/index.tsx` | 1,111 | Menu dispatcher |
| `src/ts/component/drag/provider.tsx` | 1,102 | Drag provider with complex state |

---

## 2. Type Safety & `any` Abuse

### 2.1 `as any` Casts in Core Libraries

Bypasses TypeScript type checking in critical paths:

- ~~**`lib/api/mapper.ts`** — `content: {} as any`, `obj.type as any`, `obj.listSize as any`, `obj.cardSize as any`, `value as any`~~ ✅ Fixed (2026-03-19)
- ~~**`lib/api/command.ts`** — `marks.map(Mapper.To.Mark) as any`~~ ✅ Fixed (2026-03-19)
- ~~**`lib/util/common.ts`** — `list || [] as any[]`, `const map = {} as any`, `let ret: any[] = [] as any[]`~~ ✅ Fixed (2026-03-19)
- ~~**`lib/mark.ts`** — `I.MarkType[i] as any`, `i as any` (unsafe enum conversions)~~ ✅ Fixed (2026-03-19)
- ~~**`lib/util/menu.ts`** — `] as any).map(...)`, `] as any[]).map(...)`~~ ✅ Fixed (2026-03-19)
- **`lib/service/sparkOnboarding.ts`** — Message type casts as `any` (4 instances)

### 2.2 `any` in Interfaces (78 occurrences in `src/ts/interface/`)

- `interface/common.ts` — Toast `object`, `target`, `origin` all `any`; Option `id` as `any`; `tabs?: any[]`
- `interface/menu.ts` — MenuParam `element`, `rect` as `any`; `offsetX/Y` as `any`; `data?: any`; MenuRef `getItems?.(): any[]`
- `interface/sparkOnboarding.ts` — `[key: string]: any` index signatures

### 2.3 `any` in Stores

- ~~`store/common.ts:226` — `get config(): any` (should return typed config)~~ ✅ Fixed (2026-03-19): added `I.AppConfig` interface
- `store/detail.ts:5-8` — Detail interface uses `any` for value
- `store/detail.ts:61` — `makeObservable(this as any, {...})` bypasses type checking
- `store/block.ts:35` — `Map<string, Map<string, any>>` restriction map
- `store/sparkOnboarding.ts:611,626` — `(type as any).icon`, `(type as any).exampleTitles`

### 2.4 Enum Overuse (113 enums in `interface/`)

Many simple enums could be union types:
```typescript
// Current:
export enum DropType { None='', Block='block', Menu='menu', Relation='relation' }
// Better:
export type DropType = '' | 'block' | 'menu' | 'relation';
```

---

## 3. Unsafe Access Patterns

### 3.1 Unguarded Array Access `[n]`

- **`lib/relation.ts:55`** — `svg.split('base64,')[1]` — guarded by `includes()` check, safe
- ~~**`lib/util/common.ts:1427`** — `url.split(':/')[1]` — no bounds check~~ ✅ Fixed (2026-03-19): added `|| ''` fallback
- ~~**`lib/api/dispatcher.ts:952,969`** — `mapped.subId.split('/')` destructured without length validation~~ ✅ Fixed (2026-03-19): added default values
- ~~**`lib/api/dispatcher.ts:979`** — `mapped.subId.split('-')` same pattern~~ ✅ Fixed (2026-03-19): added default values
- **`lib/util/embed.ts:360`** — `name[name.length - 1]` — safe, `split()` always returns ≥1 element
- **`component/block/text.tsx:897`** — `match[2]` — safe, used with `||` fallback chain
- ~~**`component/util/media/audio.tsx:233,241`** — `playlist[0]` without length check~~ ✅ Fixed (2026-03-19): added length guard

### 3.2 Unsafe `.match()` Without Null Checks

- **`lib/mark.ts:638`** — `const m = p2.match(reg2)` — safe, has null check with early return before access
- **`lib/util/string.ts:303,333,344,365-370`** — All safe, all have proper `m && m.length` guards

### 3.3 Loose Equality (`==`)

- ~~**`lib/api/mapper.ts`** — `==` in notification type comparisons~~ ✅ Fixed (2026-03-19)
- ~~**`lib/util/menu.ts`** — `s.toLowerCase() == f.toLowerCase()` and block type comparison~~ ✅ Fixed (2026-03-19)

---

## 4. Error Handling

### 4.1 Silent Error Swallowing (Empty Catch Blocks)

~~All empty `catch (e) { /**/ }` blocks replaced with contextual `console.warn`/`console.error` logging.~~ ✅ Fixed (2026-03-19)

Files fixed: `embed.ts` (7), `common.ts` (3), `menu.ts` (1), `response.ts` (1), `dispatcher.ts` (1), `relation.ts` (1), `storage.ts` (1)

### 4.2 Log-Only Error Handling

~~`console.error(e)` calls missing context — added module tags.~~ ✅ Fixed (2026-03-19)

Files fixed: `storage.ts` (JSON parse), `dispatcher.ts` (event processing)

**Remaining:**
- `lib/web/electronMock.ts:83,476` — `console.warn`/`console.error` then continues

---

## 5. React Anti-Patterns

### 5.1 `forceUpdate()` Abuse (43+ instances) — CRITICAL

Components use `useState` dummy counters to force re-renders, bypassing MobX reactivity:

```typescript
// Typical pattern found in 43+ components:
const [ dummy, setDummy ] = useState(0);
const forceUpdate = () => setDummy(dummy + 1);
```

Key locations:
- `component/editor/page.tsx:127-128` — `controlsRef.current?.forceUpdate()`, `tocRef.current?.forceUpdate()`
- `component/page/elements/head/controlButtons.tsx:221`
- `component/page/main/set.tsx:77-79` — Multiple forceUpdates
- `component/popup/relation.tsx:169`
- `component/sidebar/section/index.tsx:57`
- `component/cell/index.tsx:582`
- 30+ more files

**Root cause:** Child components missing `@observer` decorators, or state that should be observable but isn't.

### 5.2 Massive Components Without Memoization

- `component/editor/page.tsx` (2,746 lines) — no `useCallback`/`useMemo`
- `component/block/chat/form.tsx` (1,910 lines) — no callback memoization
- `component/block/dataview.tsx` (1,674 lines) — many unmemoized callbacks

### 5.3 Excessive Prop Drilling

- `component/block/chat/form.tsx:13-26` — 13+ callback props drilled down instead of using stores

### 5.4 jQuery DOM Manipulation in React Components

- `component/drag/provider.tsx:46` — `getContainer().find('.dropTarget.isDroppable').each(...)` with `el: any`

### 5.5 Ref Mutation for Non-UI State

- ~~`component/sidebar/page/type.tsx:102-103` — `Object.assign(objectRef.current, update)` mutating refs directly~~ ✅ Fixed (2026-03-19): replaced with spread
- `component/block/dataview.tsx:47-48` — Large `Map` stored in refs, bypassing reactivity

---

## 6. MobX Misuse

### 6.1 Direct Object Mutation in Stores

- `store/detail.ts:287` — `object[item.relationKey] = item.value` (direct assignment)
- `store/block.ts:737,744,783` — `item.childBlocks = ...` (direct mutation of tree items)

### 6.2 `as any` in makeObservable

- `store/detail.ts:61` — `makeObservable(this as any, {...})` defeats type safety

### 6.3 Incomplete Type Interfaces for Store Data

- `store/sparkOnboarding.ts:611,626` — `(type as any).icon` suggests incomplete interface

---

## 7. Global State & Window Pollution

### 7.1 Window Object Assignments

- `src/ts/app.tsx:52` — `window.$ = jQuery`
- `src/ts/app.tsx:55` — `window.Anytype = { ... }`

### 7.2 Window Property Reads (27+ locations)

- `window.Electron` — `lib/util/common.ts:40`
- `window.AnytypeGlobalConfig` — `lib/util/common.ts:47` (used in store getter!)
- `window.isExtension` — `lib/keyboard.ts:2123`
- `(window as any).AnytypeGlobalConfig` — `lib/web/electronMock.ts:375-376,421-422`

### 7.3 Config Loaded from Global

```typescript
// store/common.ts
get config(): any {
    const config = window.AnytypeGlobalConfig || this.configObj || {};
}
```
Store computed property depends on untyped global — can fail silently if not initialized.

---

## 8. Architecture & Coupling

### 8.1 Barrel Export Creates Massive Dependency Tree

`lib/index.ts` re-exports everything:
```typescript
import * as J from 'json';       // All JSON data
import * as I from 'Interface';  // 31 wildcard exports
import * as S from 'Store';      // All 13 stores
import * as U from './util';     // 13 util modules
import * as C from './api/command'; // 100+ command functions
```

Any module importing from `'Lib'` gets the entire dependency tree.

### 8.2 High Coupling in Dispatcher

`lib/api/dispatcher.ts` imports: `I, M, S, U, J, analytics, Renderer, Action, Dataview, Mapper, keyboard, Preview, focus` — gRPC handler triggers business logic directly.

### 8.3 Action Module Couples Everything

`lib/action.ts` imports: `I, C, S, U, J, focus, analytics, Renderer, Preview, Storage, translate, Mapper, keyboard, Relation, Survey` — 15 dependencies.

### 8.4 Inconsistent Event Systems

Four different event handling patterns coexist:
1. jQuery `$(window).on()` in `keyboard.ts`
2. React `useEffect` hooks in components
3. Renderer IPC events
4. gRPC streaming events via dispatcher

---

## 9. Code Duplication

- **`lib/api/dispatcher.ts:952,969`** — Identical `split('/')` destructuring pattern repeated
- **`lib/util/embed.ts`** — URL parsing patterns repeated across multiple processor functions
- **`lib/util/menu.ts:623-627,656-660`** — Repeated match filter logic
- **`lib/storage.ts:121-128,143-150`** — Identical if-else pattern for space/account/default key in getter and setter

---

## 10. Inconsistent Patterns

- ~~**Equality:** `==` vs `===` (mapper.ts uses loose, most code uses strict)~~ ✅ Fixed (2026-03-19)
- **Null checks:** Mix of `!value`, `value == null`, `value === undefined`, `undefined !== value`
- **Optional chaining:** Used inconsistently — some files use `?.`, others use manual null checks
- **State updates:** MobX `.set()` vs direct property assignment vs computed getters with transforms
- **Data fetching:** gRPC through dispatcher vs direct command calls vs event streaming

---

## 11. Refactoring Plan

### Phase 1: Type Safety (Low Risk, High Impact)

**Branch: `refactor/type-safety`**

| Task | Files | Effort |
|------|-------|--------|
| ~~Replace `as any` casts with proper types~~ | ~~mapper.ts, command.ts, common.ts, mark.ts, menu.ts, block.ts~~ | ~~M~~ ✅ |
| Type `data?: any` in MenuParam interface | interface/menu.ts + all menu consumers | L |
| ~~Type store getters (config, etc.)~~ | ~~store/common.ts, interface/common.ts, app.tsx~~ | ~~S~~ ✅ |
| ~~Add null checks to `.match()` and `.split()[n]` patterns~~ | ~~common.ts, dispatcher.ts, audio.tsx~~ | ~~M~~ ✅ |
| ~~Replace loose `==` with strict `===`~~ | ~~mapper.ts, menu.ts~~ | ~~S~~ ✅ |

### Phase 2: Error Handling (Low Risk, Medium Impact)

**Branch: `refactor/error-handling`**

| Task | Files | Effort |
|------|-------|--------|
| ~~Replace empty catch blocks with logging or explicit no-ops~~ | ~~embed.ts, common.ts, response.ts, dispatcher.ts, relation.ts, menu.ts, storage.ts~~ | ~~S~~ ✅ |
| ~~Add error context to console.error calls~~ | ~~storage.ts, dispatcher.ts~~ | ~~S~~ ✅ |
| Create consistent error handling patterns | New error utility | M |

### Phase 3: God File Decomposition (Medium Risk, High Impact)

**Branch: `refactor/split-{module}`** — one branch per module

| Task | Source File | Target Modules | Effort |
|------|-----------|----------------|--------|
| Split keyboard.ts | `lib/keyboard.ts` (2,195 lines) | KeyboardHandler, MouseHandler, MenuKeyboard, FocusManager | L |
| Split util/common.ts | `lib/util/common.ts` (1,696 lines) | DomUtil, MathUtil, SelectionUtil, (keep StringUtil in string.ts) | L |
| Group command.ts by domain | `lib/api/command.ts` (2,572 lines) | BlockCommands, ObjectCommands, SpaceCommands, etc. | L |
| Split editor/page.tsx | `component/editor/page.tsx` (2,746 lines) | Extract hooks: useEditorFocus, useEditorDrag, useEditorKeyboard | XL |
| Split chat/form.tsx | `component/block/chat/form.tsx` (1,910 lines) | ChatComposer, AttachmentPanel, MentionHandler | L |

### Phase 4: React & MobX Cleanup (Medium Risk, Medium Impact)

**Branch: `refactor/react-patterns`**

| Task | Files | Effort |
|------|-------|--------|
| Audit `forceUpdate()` usage — add missing `observer()` to children | 43+ components | L |
| Add `useCallback`/`useMemo` to large components | editor/page.tsx, dataview.tsx, chat/form.tsx | M |
| Replace prop drilling with direct store access | chat/form.tsx (13 props) | M |
| Replace jQuery DOM access with React refs | drag/provider.tsx | M |
| ~~Replace `Object.assign` mutations with spread~~ | ~~sidebar/page/type.tsx~~ | ~~S~~ ✅ |

### Phase 5: Architecture (High Risk, High Impact)

**Branch: `refactor/architecture`**

| Task | Files | Effort |
|------|-------|--------|
| Replace window globals with DI/module imports | app.tsx, common.ts, electronMock.ts | L |
| Reduce dispatcher coupling (extract event handlers) | dispatcher.ts, action.ts | XL |
| Tree-shake barrel exports (use direct imports) | lib/index.ts, interface/index.ts | XL |
| Unify event system | keyboard.ts, components, dispatcher.ts | XL |

### Effort Key

- **S** = Small (< 1 day)
- **M** = Medium (1–3 days)
- **L** = Large (3–5 days)
- **XL** = Extra Large (1–2 weeks)

### Recommended Order

1. **Phase 1** first — improves safety with minimal risk
2. **Phase 2** next — quick wins for debuggability
3. **Phase 3** in parallel per-module branches — biggest maintainability wins
4. **Phase 4** after Phase 3 — React patterns are easier to fix in smaller files
5. **Phase 5** last — highest risk, needs careful coordination
