# Anytype-TS Codebase Refactoring Analysis

> Generated: 2026-03-15 | Updated: 2026-03-28 | Scope: `src/ts/` full codebase audit | Phase 1–2 complete, Phase 5.3 complete, Low-hanging Tier 1 complete

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
12. [Low-Hanging Fruit Plan](#12-low-hanging-fruit-plan)

---

## 1. God Files & Excessive Complexity

Files exceeding reasonable size, doing too much, and mixing multiple responsibilities.

| File | Lines (Mar 19) | Lines (Mar 28) | Δ | Responsibilities |
|------|---------------|----------------|---|-----------------|
| `src/ts/docs/help/whatsNew.ts` | 3,701 | 3,701 | 0 | Hardcoded changelog data (should be JSON) |
| `src/ts/component/editor/page.tsx` | 2,746 | 2,767 | +21 | Editor state, drag/drop, keyboard, focus, rendering, TOC |
| `src/ts/lib/api/command.ts` | 2,572 | 1,975 | **-597** | 100+ gRPC command exports — shrunk via refactoring |
| `src/ts/lib/keyboard.ts` | 2,195 | 2,198 | +3 | Keyboard, mouse, shortcuts, menus, focus — all in one |
| `src/ts/lib/util/menu.ts` | 2,105 | 2,149 | +44 | Menu positioning, filtering, keyboard nav, styling |
| `src/ts/component/block/chat/form.tsx` | 1,910 | 1,945 | +35 | Chat form, attachments, editing, mention handling |
| `src/ts/lib/api/mapper.ts` | 1,904 | 1,931 | +27 | Protobuf mapping with long if-chains |
| `src/ts/lib/util/common.ts` | 1,696 | 1,678 | -18 | Catch-all utility: DOM, math, string, selection, storage |
| `src/ts/component/block/dataview.tsx` | 1,674 | 1,796 | +122 | All dataview types (grid, board, calendar, gallery) |
| `src/ts/lib/api/dispatcher.ts` | 1,682 | 1,766 | +84 | gRPC lifecycle, event buffering, command queueing, response mapping |
| `src/ts/component/block/text.tsx` | 1,642 | 1,660 | +18 | Text block with marks, latex, code, mentions |
| `src/ts/component/block/table.tsx` | 1,455 | 1,456 | +1 | Table block with editing, selection, drag |
| `src/ts/lib/dataview.ts` | 1,245 | 1,267 | +22 | Dataview handler |
| `src/ts/component/block/chat.tsx` | 1,222 | 1,252 | +30 | Chat block manager |
| `src/ts/component/menu/smile.tsx` | 1,216 | 1,216 | 0 | Emoji menu with library and upload |
| `src/ts/lib/relation.ts` | 1,170 | 1,148 | -22 | Relation handler |
| `src/ts/lib/action.ts` | 1,167 | 1,163 | -4 | Action dispatcher |
| `src/ts/component/block/index.tsx` | 1,165 | 1,168 | +3 | Block factory/dispatcher |
| `src/ts/component/menu/index.tsx` | 1,111 | 1,116 | +5 | Menu dispatcher |
| `src/ts/component/drag/provider.tsx` | 1,102 | 1,154 | +52 | Drag provider with complex state |

**Notable:** `command.ts` dropped 597 lines (2,572 → 1,975). Most other files grew slightly from feature work. No god files were split yet.

---

## 2. Type Safety & `any` Abuse

### 2.1 `as any` Casts in Core Libraries

~~Bypasses TypeScript type checking in critical paths~~ — Mostly fixed.

- ~~**`lib/api/mapper.ts`** — `content: {} as any`, `obj.type as any`, `obj.listSize as any`, `obj.cardSize as any`, `value as any`~~ ✅ Fixed (2026-03-19)
- ~~**`lib/api/command.ts`** — `marks.map(Mapper.To.Mark) as any`~~ ✅ Fixed (2026-03-19)
- ~~**`lib/util/common.ts`** — `list || [] as any[]`, `const map = {} as any`, `let ret: any[] = [] as any[]`~~ ✅ Fixed (2026-03-19)
- ~~**`lib/mark.ts`** — `I.MarkType[i] as any`, `i as any` (unsafe enum conversions)~~ ✅ Fixed (2026-03-19)
- ~~**`lib/util/menu.ts`** — `] as any).map(...)`, `] as any[]).map(...)`~~ ✅ Fixed (2026-03-19)
- ~~**`lib/service/sparkOnboarding.ts`** — Message type casts as `any` (4 instances)~~ ✅ Fixed (2026-03-28): replaced with proper message interfaces
- **`lib/api/service.ts`** — gRPC Object/decode casts (7 instances) — low-level, hard to fix
- ~~**`lib/api/dispatcher.ts`** — Comment message casts (4 instances)~~ ✅ Fixed (2026-03-28): typed as `I.CommentMessage` / `Partial<I.CommentMessage>`
- ~~**`lib/translate.ts`** — `(defaultData as any)[key]` (1 instance)~~ ✅ Fixed (2026-03-28): added `TranslationData` type alias

**Current count (lib/ + store/, excluding tests): ~18 instances** (down from 50+ pre-fix)

### 2.2 `any` in Interfaces (78 occurrences in `src/ts/interface/`)

- `interface/common.ts` — Toast `object`, `target`, `origin` all `any`; Option `id` as `any`; `tabs?: any[]`
- `interface/menu.ts` — MenuParam `element`, `rect` as `any`; `offsetX/Y` as `any`; `data?: any`; MenuRef `getItems?.(): any[]`
- `interface/sparkOnboarding.ts` — `[key: string]: any` index signatures

### 2.3 `any` in Stores

- ~~`store/common.ts:226` — `get config(): any` (should return typed config)~~ ✅ Fixed (2026-03-19): added `I.AppConfig` interface
- `store/detail.ts:5-8` — Detail interface uses `any` for value
- ~~`store/detail.ts:61` — `makeObservable(this as any, {...})` bypasses type checking~~ ✅ Fixed (2026-03-28): used `makeObservable<DetailStore, 'map'>`
- `store/block.ts:35` — `Map<string, Map<string, any>>` restriction map
- ~~`store/sparkOnboarding.ts:611,626` — `(type as any).icon`, `(type as any).exampleTitles`~~ ✅ Fixed (2026-03-28): `SuggestedType` already has these fields

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

### 5.1 `forceUpdate()` Abuse (30 files) — CRITICAL

Components use `useState` dummy counters to force re-renders, bypassing MobX reactivity:

```typescript
// Typical pattern found in 30 component files:
const [ dummy, setDummy ] = useState(0);
const forceUpdate = () => setDummy(dummy + 1);
```

**Update (2026-03-28):** Down from 43+ to 30 files. One fix landed (`57c884c860` — MenuBlockAdd useEffect ordering and stale state updater).

Key locations:
- `component/editor/page.tsx` — `controlsRef.current?.forceUpdate()`, `tocRef.current?.forceUpdate()`
- `component/page/elements/head/controlButtons.tsx`
- `component/page/main/set.tsx` — Multiple forceUpdates
- `component/popup/relation.tsx`
- `component/sidebar/section/index.tsx`
- `component/cell/index.tsx`
- `component/sidebar/right.tsx`
- `component/header/index.tsx`
- 22+ more files

**Root cause:** Child components missing `observer()` wrappers, or state that should be observable but isn't.

### 5.2 Massive Components Without Memoization

- `component/editor/page.tsx` (2,767 lines) — no `useCallback`/`useMemo`
- `component/block/chat/form.tsx` (1,945 lines) — no callback memoization
- `component/block/dataview.tsx` (1,796 lines) — many unmemoized callbacks

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
- `(window as any).AnytypeGlobalConfig` — `lib/web/electronMock.ts:381-382,427-428`

### 7.3 Config Loaded from Global

```typescript
// store/common.ts — now typed as I.AppConfig (✅ fixed) but still reads from window global
get config(): I.AppConfig {
    const config = window.AnytypeGlobalConfig || this.configObj || {};
}
```

---

## 8. Architecture & Coupling

### ~~8.1 Barrel Export Creates Massive Dependency Tree~~ ✅ Fixed (2026-03-26)

~~`lib/index.ts` re-exports everything. Any module importing from `'Lib'` gets the entire dependency tree.~~

**Fixed via `unplugin-auto-import`** (commit `182e12e861`):
- Removed 473 `import { ... } from 'Lib'` statements across ~510 files
- Auto-import plugin injects `S`, `U`, `C`, `J`, `translate`, `keyboard`, etc. at build time
- `lib/index.ts` reduced from barrel hub to 66-line legacy shim
- Enables tree-shaking and eliminates circular dependency chains (`Lib → Store → Lib`)
- RFC document: `docs/RFC-AUTO-IMPORTS.md`

**Also fixed:** Circular init in `storage.ts` — lazy-evaluated electron reference (`f7c0af169d`)

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

- ~~**`lib/api/dispatcher.ts:952,969`** — Identical `split('/')` destructuring pattern repeated~~ ✅ Fixed (2026-03-28): extracted `parseSubId()` method (3 call sites unified)
- **`lib/util/embed.ts`** — URL parsing patterns repeated across multiple processor functions — On inspection, each processor does fundamentally different URL transformations within a switch-case; not extractable without adding complexity
- **`lib/util/menu.ts:623-627,656-660`** — Reported as repeated match filter logic — On inspection, these are two consecutive checks (aliases then name) within a single filter callback, not separate duplicated functions
- **`lib/storage.ts:121-128,143-150`** — Reported as identical if-else pattern — On inspection, this is standard delegation (get/set/delete each route to different typed methods); not true duplication

---

## 10. Inconsistent Patterns

- ~~**Equality:** `==` vs `===` (mapper.ts uses loose, most code uses strict)~~ ✅ Fixed (2026-03-19)
- **Null checks:** Mix of `!value`, `value == null`, `value === undefined`, `undefined !== value`
- **Optional chaining:** Used inconsistently — some files use `?.`, others use manual null checks
- **State updates:** MobX `.set()` vs direct property assignment vs computed getters with transforms
- **Data fetching:** gRPC through dispatcher vs direct command calls vs event streaming

---

## 11. Refactoring Plan

### Phase 1: Type Safety (Low Risk, High Impact) ✅ COMPLETE

**Branch: `refactor/type-safety`**

| Task | Files | Status |
|------|-------|--------|
| ~~Replace `as any` casts with proper types~~ | ~~mapper.ts, command.ts, common.ts, mark.ts, menu.ts, block.ts~~ | ✅ |
| Type `data?: any` in MenuParam interface | interface/menu.ts + all menu consumers | Remaining (L) |
| ~~Type store getters (config, etc.)~~ | ~~store/common.ts, interface/common.ts, app.tsx~~ | ✅ |
| ~~Add null checks to `.match()` and `.split()[n]` patterns~~ | ~~common.ts, dispatcher.ts, audio.tsx~~ | ✅ |
| ~~Replace loose `==` with strict `===`~~ | ~~mapper.ts, menu.ts~~ | ✅ |

### Phase 2: Error Handling (Low Risk, Medium Impact) ✅ COMPLETE

**Branch: `refactor/error-handling`**

| Task | Files | Status |
|------|-------|--------|
| ~~Replace empty catch blocks with logging~~ | ~~embed.ts, common.ts, response.ts, dispatcher.ts, relation.ts, menu.ts, storage.ts~~ | ✅ |
| ~~Add error context to console.error calls~~ | ~~storage.ts, dispatcher.ts~~ | ✅ |
| Create consistent error handling patterns | New error utility | Remaining (M) |

### Phase 3: God File Decomposition (Medium Risk, High Impact)

**Branch: `refactor/split-{module}`** — one branch per module

| Task | Source File | Target Modules | Effort |
|------|-----------|----------------|--------|
| Split keyboard.ts | `lib/keyboard.ts` (2,198 lines) | KeyboardHandler, MouseHandler, MenuKeyboard, FocusManager | L |
| Split util/common.ts | `lib/util/common.ts` (1,678 lines) | DomUtil, MathUtil, SelectionUtil, (keep StringUtil in string.ts) | L |
| ~~Shrink command.ts~~ | ~~`lib/api/command.ts` (2,572→1,975 lines)~~ | ~~-597 lines from cleanup~~ | ✅ Partial |
| Split editor/page.tsx | `component/editor/page.tsx` (2,767 lines) | Extract hooks: useEditorFocus, useEditorDrag, useEditorKeyboard | XL |
| Split chat/form.tsx | `component/block/chat/form.tsx` (1,945 lines) | ChatComposer, AttachmentPanel, MentionHandler | L |

### Phase 4: React & MobX Cleanup (Medium Risk, Medium Impact)

**Branch: `refactor/react-patterns`**

| Task | Files | Status |
|------|-------|--------|
| Audit `forceUpdate()` usage — add missing `observer()` | 30 component files | Remaining (L) |
| Add `useCallback`/`useMemo` to large components | editor/page.tsx, dataview.tsx, chat/form.tsx | Remaining (M) |
| Replace prop drilling with direct store access | chat/form.tsx (13 props) | Remaining (M) |
| Replace jQuery DOM access with React refs | drag/provider.tsx | Remaining (M) |
| ~~Replace `Object.assign` mutations with spread~~ | ~~sidebar/page/type.tsx~~ | ✅ |

### Phase 5: Architecture (High Risk, High Impact)

**Branch: `refactor/architecture`**

| Task | Files | Status |
|------|-------|--------|
| Replace window globals with DI/module imports | app.tsx, common.ts, electronMock.ts | Remaining (L) |
| Reduce dispatcher coupling (extract event handlers) | dispatcher.ts, action.ts | Remaining (XL) |
| ~~Tree-shake barrel exports (auto-import)~~ | ~~lib/index.ts, ~510 consumer files~~ | ✅ (2026-03-26) |
| Unify event system | keyboard.ts, components, dispatcher.ts | Remaining (XL) |

### Effort Key

- **S** = Small (< 1 day)
- **M** = Medium (1–3 days)
- **L** = Large (3–5 days)
- **XL** = Extra Large (1–2 weeks)

---

## 12. Low-Hanging Fruit Plan

Quick wins that can be done independently, have low risk, and deliver measurable improvement. Ordered by impact/effort ratio.

### Tier 1: Immediate Wins (< 1 day each, can merge directly to develop) ✅ COMPLETE

#### ~~1.1 Type the dispatcher comment `as any` casts (S)~~ ✅ Fixed (2026-03-28)
**Files:** `lib/api/dispatcher.ts` — 4 instances typed as `I.CommentMessage` / `Partial<I.CommentMessage>`.

#### ~~1.2 Type the translate fallback `as any` (S)~~ ✅ Fixed (2026-03-28)
**File:** `lib/translate.ts` — added `TranslationData` type alias, eliminated 2 `as any` casts.

#### ~~1.3 Type sparkOnboarding message casts (S)~~ ✅ Fixed (2026-03-28)
**Files:** `lib/service/sparkOnboarding.ts`, `store/sparkOnboarding.ts`, `interface/sparkOnboarding.ts` — 6 instances replaced with proper message interfaces (`ReconnectedMessage`, `TypeGeneratedMessage`, `ObjectTitlesGeneratedMessage`, `WorkspaceReadyMessage`). Added `type_name`/`type_key` snake_case fields to `ObjectTitlesGeneratedMessage`.

#### ~~1.4 Fix `makeObservable(this as any)` in DetailStore (S)~~ ✅ Fixed (2026-03-28)
**File:** `store/detail.ts` — replaced with `makeObservable<DetailStore, 'map'>(this, {...})`.

#### ~~1.5 Extract `storage.ts` key-resolution duplication (S)~~ — Skipped
On re-inspection, the `get`/`set`/`delete` methods delegate to different typed methods per branch. This is standard delegation, not true duplication.

### Tier 2: Small Refactors (1–2 days each)

#### 2.1 Reduce `forceUpdate` in sidebar components (M)
**Files:** `sidebar/section/index.tsx`, `sidebar/section/type/title.tsx`, `sidebar/section/type/relation.tsx`, `sidebar/section/type/layout.tsx`, `sidebar/section/type/template.tsx`, `sidebar/right.tsx`, `sidebar/page/object/relation.tsx`
**What:** 7 sidebar files use forceUpdate. These are likely simpler components where adding `observer()` wrapper or converting the triggering state to MobX observable eliminates the pattern.
**Why:** Sidebar is a contained area — low blast radius, easy to test manually.

#### 2.2 Reduce `forceUpdate` in header components (M)
**Files:** `header/index.tsx`, `header/main/object.tsx`, `header/main/history.tsx`, `header/main/chat.tsx`
**What:** 4 header files. Same pattern — likely missing `observer()` on child components that read store data.

#### 2.3 Extract `embed.ts` URL parsing helpers (S)
**File:** `lib/util/embed.ts`
**What:** Multiple processor functions repeat URL parsing patterns (extracting IDs from YouTube, Vimeo, etc.). Extract common `extractUrlId(url, pattern)` helper.

#### 2.4 Extract `menu.ts` match filter helper (S)
**File:** `lib/util/menu.ts:623-627,656-660`
**What:** Repeated filter-by-match logic — extract into a shared `filterByMatch(items, filter, getLabel)` function.

### Tier 3: Medium Refactors (2–3 days each)

#### 3.1 Split `util/common.ts` DOM helpers (M)
**File:** `lib/util/common.ts` (1,678 lines)
**What:** Extract DOM-related functions (`getScrollContainer`, `getPageContainer`, `getSelectionRange`, etc.) into `lib/util/dom.ts`. ~200-300 lines, pure extraction, no logic change. Leave the rest in `common.ts` for now.
**Why:** Easiest god-file split — DOM helpers are self-contained with no cross-dependencies.

#### 3.2 Split `keyboard.ts` mouse handling (M)
**File:** `lib/keyboard.ts` (2,198 lines)
**What:** Extract mouse event handlers (`onMouseDown`, `onMouseUp`, `onMouseMove`, related state like `isMouseDown`, `isResizing`) into `lib/mouse.ts`. ~200-300 lines.
**Why:** Mouse and keyboard are logically separate concerns that happen to share a file.

#### 3.3 Type `MenuParam.data` with discriminated union (M–L)
**File:** `interface/menu.ts`
**What:** Replace `data?: any` with a discriminated union keyed on menu ID. Start with the 5 most-used menus, use `& Record<string, unknown>` for the rest.
**Why:** Eliminates the single highest-impact `any` in the codebase — every menu consumer benefits.

### Suggested Execution Order

```
Week 1: Tier 1 (all 5 items) → ✅ DONE (2026-03-28)
Week 2: Tier 2.1 + 2.2 (forceUpdate in sidebar + header) → feature branches
Week 3: Tier 2.3 + 2.4 + 3.1 (dedup + DOM split) → feature branches
Week 4: Tier 3.2 + 3.3 (keyboard split + MenuParam typing) → feature branches
```
