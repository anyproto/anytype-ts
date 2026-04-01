# Code Review: v0.54.11 to HEAD

**Date:** 2026-04-01
**Scope:** 1046 commits, 3279 files changed, +59,369 / -46,065 lines
**Status:** Typecheck and lint pass after fixes applied below

---

## Fixed Issues (applied in this review)

### 1. Electron preload missing indentation
**File:** `electron/js/preload.cjs:39`
`defaultPath` property was missing its tab, breaking object literal formatting in `contextBridge.exposeInMainWorld`.

### 2. ProgressState.InProgress does not exist
**File:** `src/ts/component/util/progressText.stories.tsx:19`
Used `I.ProgressState.InProgress` but enum only has `None`, `Running`, `Done`, `Canceled`, `Error`. Fixed to `Running`.

### 3. syncStatusUpdate wrong call signature
**File:** `src/ts/component/util/sync.stories.tsx:25`
Called `S.Auth.syncStatusUpdate(spaceId, {...})` with 2 args but method only accepts 1 (the status object with `id` inside). Removed extra `spaceId` arg.

### 4. Unused import: useImperativeHandle
**File:** `src/ts/component/page/main/archive.tsx:1`
`useImperativeHandle` imported but never used.

### 5. Unused import: Checkbox
**File:** `src/ts/component/sidebar/preview.tsx:5`
`Checkbox` imported from Component but never used.

### 6. Missing semicolon
**File:** `src/ts/component/sidebar/preview.tsx:104`
Missing semicolon after JSX expression.

### 7. Missing React import in 10 story files
Files using JSX in decorators without importing React (required by project's tsconfig `jsx: "react"` setting):
- `src/ts/component/cell/item/object.stories.tsx`
- `src/ts/component/footer/auth/disclaimer.stories.tsx`
- `src/ts/component/footer/auth/email.stories.tsx`
- `src/ts/component/footer/auth/index.stories.tsx`
- `src/ts/component/form/phrase.stories.tsx`
- `src/ts/component/menu/item/vertical.stories.tsx`
- `src/ts/component/preview/default.stories.tsx`
- `src/ts/component/util/cover.stories.tsx`
- `src/ts/component/util/deleted.stories.tsx`
- `src/ts/component/util/object/type.stories.tsx`

---

## Items to Review (not auto-fixed)

### HIGH PRIORITY

#### H1. jQuery removal is incomplete (47+ files still import jQuery)
The jQuery removal effort has been done incrementally. ~47 component files still `import $ from 'jquery'`. Files that were migrated use `U.Dom.*` helpers and native DOM. This mixed state is functional but should be completed to fully remove the dependency.

**Key files still using jQuery:**
- `component/editor/page.tsx`
- `component/block/text.tsx`, `component/block/index.tsx`, `component/block/table.tsx`
- `component/block/dataview/view/grid.tsx`, `board.tsx`, `timeline.tsx`
- `component/cell/index.tsx`, `component/cell/select.tsx`, `component/cell/object.tsx`
- `component/widget/index.tsx`, `component/sidebar/left.tsx`, `component/sidebar/preview.tsx`
- `component/drag/provider.tsx`, `component/selection/provider.tsx`
- `component/graph/provider.tsx`

#### H2. `.get(0)` calls on jQuery-wrapped elements
Some dataview files use `.get(0)` which is a jQuery method. If these objects have been converted to native HTMLElement (from `U.Dom.*`), `.get(0)` would throw a runtime error. Currently these files still import jQuery so it works, but this is fragile during the ongoing migration.
- `src/ts/component/block/dataview/view/timeline.tsx:529`
- `src/ts/component/block/dataview/view/grid.tsx:139`
- `src/ts/component/block/dataview/view/board.tsx:192`

#### H3. Cell mousedown handler scope changed from pageContainer to window
**File:** `src/ts/component/cell/index.tsx`
Changed from listening on `pageContainer` (scoped) to `window` (global). This means ALL mousedown events globally trigger the handler, which has performance implications and could cause unexpected behavior with nested editors or popups.

#### H4. Graph event system mixed jQuery/CustomEvent
**File:** `src/ts/component/graph/provider.tsx`
Custom events dispatched via `new CustomEvent()` but some listeners may still expect jQuery event format. Defensive `data || e.originalEvent?.detail` fallback is in place but indicates incomplete migration.

#### H5. Major architectural change: Protobuf to plain objects
**File:** `src/ts/lib/api/dispatcher.ts` and related
Changed from Protocol Buffer generated classes (`hasX()`, `getX()`) to plain JavaScript objects (`x !== undefined`, `x`). This is a sweeping change across the API layer. All request/response handlers should be manually verified to ensure none were missed.

#### H6. Build system migration: rspack to Vite
Major build tool change. Verify:
- `scripts/build-electron.js` exists and works
- `scripts/wait-for-localhost.js` exists
- `scripts/analyze-deps.js` exists
- Extension build (`vite.extension.config.ts`) works correctly
- SCSS `api: 'legacy'` is compatible with all SCSS features used

### MEDIUM PRIORITY

#### M1. Icon background-image removals in dark theme
**File:** `src/scss/theme/dark/common.scss`
50+ icon `background-image` references removed from dark theme SCSS. These icons should now be rendered via the component system (Icon component with `S.Common.getThemePath()`). Verify all affected icons render correctly in dark mode.

#### M4. Chat reaction button lost its icon
**File:** `src/scss/block/chat.scss`
`.icon.reactionAdd` had its `background-image` CSS removed. The icon should now be rendered via the Icon component. Verify the reaction add button is visible.

#### M5. `scrollbar-gutter: stable` removed
**File:** `src/scss/common/common.scss`
This property prevents layout shift when scrollbars appear/disappear. Its removal may cause content to jump when overflow changes.

#### M6. Animation removed from gallery cards
**File:** `src/ts/component/block/dataview/view/gallery/card.tsx`
`<AnimatePresence>` and `<motion.div>` wrapper removed. Cards no longer animate. Verify this was intentional (performance optimization) vs accidental.

#### M7. CellMeasurerCache initialization in gallery
**File:** `src/ts/component/block/dataview/view/gallery.tsx`
```tsx
const cache = useRef(null);
if (!cache.current) {
    cache.current = new CellMeasurerCache({...});
};
```
This conditional check runs every render. While functionally correct (useRef persists), this is an unusual pattern. Consider initializing in `useRef(new CellMeasurerCache({...}))` or `useMemo`.

#### M8. Deferred update sets in block store could grow unbounded
**File:** `src/ts/store/block.ts`
New `deferredParentUpdates`, `deferredNumberUpdates`, `deferredMarkupUpdates` Sets added. Verify `flushDeferredUpdates()` is called reliably to prevent memory accumulation.

#### M9. Date format cases share identical mask
**File:** `src/ts/component/cell/text.tsx`
`ShortUS`, `MonthAbbrBeforeDay`, `Long`, `Default` all map to the same mask `99.99.9999`. If these formats should have different display (e.g., "Mar 5, 2026" vs "03/05/2026"), the masks need differentiation.

#### M10. Graph drag state tracking
**File:** `src/ts/component/graph/provider.tsx`
`wasDragging` ref is set on drag end but only cleared on next click. Rapid clicks after drag could be silently dropped. No timeout to auto-clear.

### LOW PRIORITY

#### L1. Enter key processing guard uses fixed 30ms timeout
**File:** `src/ts/component/editor/page.tsx`
`isEnterProcessing` guard uses a 30ms timeout to prevent duplicate Enter processing. On slow systems this buffer may be insufficient. Consider using a callback-based guard instead of a fixed timer.

#### L2. Throttle changed from 50ms to 40ms
**File:** `src/ts/component/editor/page.tsx:16`
`THROTTLE` constant changed from 50 to 40. Minor performance tuning - more frequent scroll handler invocations.

#### L3. Biome lint suppression warning
**File:** `src/ts/auto-imports.d.ts:6`
`// biome-ignore lint: disable` has no effect. This is a generated file so not critical.

### POSITIVE CHANGES NOTED

- **Performance:** `Array.includes()` replaced with `Set.has()` in chat store for O(n) -> O(1) lookups
- **Performance:** `records.indexOf(id)` replaced with `Map` lookup in gallery view for O(n^2) -> O(n)
- **Type safety:** `MenuParam<D = any>` generic added, `MenuItem` interface improved with proper React types
- **New `menuData.ts`:** Typed menu data interfaces for better type safety
- **Mark range validation:** `Mark.checkRanges()` added after text insertions in chat form
- **URL detection:** Internal object URLs from different spaces now properly converted to attachments
- **Block sorting:** Explicit array separation (layout vs non-layout) instead of sort comparator
- **Error boundary:** Added to app entry point wrapping `<App />`
- **useEffect dependencies:** Corrected in gallery and card components to prevent stale closures
