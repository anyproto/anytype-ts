# Code Review: v0.54.11 to HEAD

**Date:** 2026-04-05
**Scope:** 1202 commits, 3353 files changed, +65,320 / -50,006 lines
**Status:** Typecheck passes. Lint passes with 3 warnings (2 unused imports, 1 Biome suppression).

---

## Executive Summary

This is a major release cycle with transformational infrastructure and architecture changes alongside significant new features. The codebase has undergone:

1. **Build system migration** — rspack + npm → Vite + bun
2. **Electron TypeScript rewrite** — electron.js → electron/ts/ with esbuild bundling
3. **jQuery complete removal** — replaced with native DOM and U.Dom helpers
4. **MobX modernization** — mobx-react → mobx-react-lite with auto-observer Vite plugin
5. **gRPC event batching** — requestAnimationFrame + MobX runInAction for reduced re-renders
6. **Inactive tab optimization** — MobX reactionScheduler pauses reactions in background tabs
7. **New comment system** — threaded discussions with Lexical editor (~2,800 lines)
8. **Protobuf migration** — generated classes → plain objects with ts-proto

The overall quality is good. The architecture changes are well-executed with proper fallbacks. The main areas of concern are: security hardening in the Electron layer, some dead jQuery artifacts, comment system edge cases, and a few SCSS dark mode gaps.

---

## Lint Warnings (not blocking)

### 1. Unused import: `Onboarding`
**File:** `src/ts/component/page/main/chat.tsx:3`

### 2. Unused import: `MenuItem`
**File:** `src/ts/component/menu/search/object.tsx:6`

### 3. Biome suppression no-op
**File:** `src/ts/auto-imports.d.ts:6`
`// biome-ignore lint: disable` has no effect. Generated file — non-critical.

---

## Items to Review

### HIGH PRIORITY

#### H1. Space create popup silently ignores `WorkspaceSetInfo` errors
**File:** `src/ts/component/popup/space/create.tsx:176-210`
Inside `afterUpload()`, the `C.WorkspaceSetInfo` callback checks `message.error.code`, but `message` refers to the outer `C.WorkspaceCreate` callback's parameter, not the `WorkspaceSetInfo` response. The inner callback parameter is unnamed, so the error check always passes (it re-checks the already-verified outer response). `WorkspaceSetInfo` failures are silently ignored.

#### H2. `sidebarResize` event handler leaks on every editor rebind
**File:** `src/ts/component/editor/page.tsx:297`
`storeHandler('sidebarResize', resizeHandler)` registers a handler for the custom `sidebarResize` event, but `unbind()` only iterates over `['keydown', 'mousemove', 'paste', 'resize', 'focus']` (line 231). The `sidebarResize` handler is stored on window but never removed, causing handler accumulation on every rebind.

#### ~~H3. Orphaned dark theme widget styles never loaded~~ — RESOLVED
**File:** `src/scss/theme/dark/widget.scss` — deleted. The remaining overrides were stale after the SVG icon migration.

#### H4. `--color-bg-secondary` undefined in light mode
**Defined only in:** `src/scss/theme/dark/common.scss:35`
**Used outside dark scope:**
- `src/scss/page/auth.scss:18,21,24` — notification icon backgrounds
- `src/scss/component/errorBoundary.scss:11` — **new file** — error details background
- `src/scss/page/main/graph.scss:22` — graph timeline background (overridden, see M9)

In light mode, `var(--color-bg-secondary)` resolves to nothing (transparent/initial). The `errorBoundary.scss` will have an invisible background for `.errorDetails` in light mode.

#### ~~H5. No URL validation before `shell.openExternal()`~~ — ACCEPTED
**File:** `electron/ts/api.ts:431-433`
Users rely on arbitrary deeplink schemes (e.g., `obsidian://`, custom app protocols), so allowlisting is not feasible. A blocklist for `javascript:` could be added but the risk is marginal since the URL originates from user content, not untrusted external input.

#### ~~H6. `openPath` uses `exec` with shell on Windows~~ — ACCEPTED
**File:** `electron/ts/api.ts:451`
Uses `exec` with `shell: 'cmd.exe'` instead of `shell.openPath()` as a workaround for an Electron bug where `shell.openPath()` fails on folders with non-Unicode characters. The path is validated with `fs.existsSync` and `path.normalize` before use.

#### H7. Dead `e.originalEvent` references after jQuery removal
**Files:** Multiple clipboard/drag handlers
After jQuery removal, `e.originalEvent` is always `undefined` on native events. Most usages are guarded by `||` so they work, but some lack optional chaining and would throw if the left side were ever falsy:

- `src/ts/component/block/embed.tsx:349` — `e.originalEvent.clipboardData` (no `?.`)
- `src/ts/component/editor/page.tsx:2334` — `e.originalEvent.clipboardData` (no `?.`)
- `src/ts/component/block/chat/form.tsx:473-474` — `e.originalEvent.clipboardData` (no `?.`)
- `src/ts/component/menu/block/cover.tsx:479` — `e.originalEvent.clipboardData` (no `?.`)
- `src/ts/component/form/phrase.tsx:121` — `e.originalEvent.clipboardData` (no `?.`)
- `src/ts/component/drag/provider.tsx:814` — `e.originalEvent.dataTransfer` (no `?.`)

**Risk:** Low (native events always have `clipboardData`/`dataTransfer`), but dead code that should be cleaned up.

#### H8. Comment system `fetchAllMessages` loads entire history
**File:** `src/ts/component/comment/section.tsx:344-372`
Recursively fetches all messages in pages of 100 before building the tree. For discussions with thousands of messages: high memory usage, slow initial load, potential UI freeze during tree building. Consider virtual pagination.

#### H9. Comment form `isLoading` never reset in edit mode
**File:** `src/ts/component/comment/form.tsx:113-195`
`handleSubmit` sets `setIsLoading(true)` at line 118, but `setIsLoading(false)` at line 184 is only called when `!isEdit`. In edit mode, if the API call fails, the form remains mounted with `isLoading=true` and the user cannot submit again.

### MEDIUM PRIORITY

#### M1. `renderLinks` duplicate handler execution
**File:** `src/ts/lib/util/dom.ts:326-357`
Stores event handlers as properties on DOM elements (`link['_rl_click']`). If `renderLinks` is called multiple times on the same DOM tree, old `addEventListener` calls remain active because only the stored reference is updated — the previous listeners are never removed. This causes duplicate click handlers on links.

#### M2. `renderLinks` and `toggle` still have jQuery `.get(0)` fallback
**File:** `src/ts/lib/util/dom.ts:331,367`
```ts
const root = obj instanceof HTMLElement ? obj : (obj.get ? obj.get(0) : obj);
```
The `obj.get` branch is a jQuery fallback. Since jQuery is fully removed, this is dead code.

#### M3. Comment emoji React roots never unmounted
**Files:** `src/ts/component/comment/post.tsx:105-123`, `reply.tsx:84-101`
`useEffect` creates React roots via `createRoot()` on `<smile>` elements and stores them as `_reactRoot`. When `parts` change, old roots are never unmounted. The effect should return a cleanup that calls `root.unmount()`.

#### M4. `ensureDiscussion` silently drops second call
**File:** `src/ts/component/comment/section.tsx:495-526`
Uses `isCreating.current` as a mutex. If a second call arrives while creating, it silently returns without calling `callBack`. The user's comment is silently lost.

#### M5. `reactionScheduler` queue grows unboundedly while paused
**File:** `src/ts/lib/reactionScheduler.ts`
When the tab is inactive, all MobX reaction callbacks are queued. A long-idle tab with active subscriptions accumulates an unbounded queue. On resume, all queued reactions fire at once, potentially causing a UI freeze.

#### M6. Subscription record removal leaks details
**File:** `src/ts/lib/api/dispatcher.ts:983-990`
When a subscription removes a record, `S.Detail.delete` is intentionally NOT called (to preserve dependencies). However, this means details for non-dependency records also accumulate indefinitely. Over long sessions with frequently changing subscriptions, this is a slow memory leak.

#### M7. Cell mousedown handler on window scope
**File:** `src/ts/component/cell/index.tsx`
Listens on `window` (global) instead of a scoped container. Every global mousedown triggers the handler — performance concern with many cells.

#### M8. `sandbox: false` on all renderer windows
**File:** `electron/ts/window.ts:770`
Disables Chromium's sandbox. Combined with `@electron/remote` being enabled (deprecated), this creates a broader attack surface. `contextIsolation: true` and `nodeIntegration: false` are properly set, but the disabled sandbox and remote access partially negate those protections. Plan migration to `ipcMain.handle`/`ipcRenderer.invoke`.

#### M9. Conflicting background declarations in graph timeline
**File:** `src/scss/page/main/graph.scss:22-23`
`background: var(--color-bg-secondary)` is immediately overridden by `background-color: var(--color-bg-primary)`. The first is dead code (merge artifact).

#### M10. Date format masks are identical
**File:** `src/ts/component/cell/text.tsx`
`ShortUS`, `MonthAbbrBeforeDay`, `Long`, `Default` all map to the same mask `99.99.9999`. Different date formats should have different masks.

#### M11. `fetchAllMessages` has stale reference to `buildTree`
**File:** `src/ts/component/comment/section.tsx:344-373`
`fetchAllMessages` calls `buildTree` internally but `buildTree` is not in `fetchAllMessages`'s dependency array `[ loadDeps ]`. This is a React hooks stale closure violation.

#### M12. `dist:win` script missing `build:deps`
**File:** `package.json:35`
`dist:win` does not include `bun run build:deps`, while `dist:mac` and `dist:linux` do. Could lead to missing runtime dependencies in Windows builds.

### LOW PRIORITY

#### L1. Toast `useEffect` runs on every render
**File:** `src/ts/component/util/toast.tsx:220`
The `useEffect` has no dependency array — adds/removes `mouseenter`/`mouseleave` listeners and repositions on every render cycle. Should depend on `[ toast ]`.

#### L2. Enter key processing guard uses fixed 30ms timeout
**File:** `src/ts/component/editor/page.tsx`
On slow systems this buffer may be insufficient.

#### L3. `addBodyClass` creates regex on every call
**File:** `src/ts/lib/util/dom.ts:246`
`new RegExp(\`^${prefix}\`)` created per call.

#### L4. Auto-observer plugin edge cases
**File:** `vite.auto-observer.ts`
Not matched: `React.memo(Component)`, inline `export default function`, `export { X as default }`. These patterns don't appear in the codebase currently.

#### L5. Hardcoded light-mode gradient in new spaceCreate popup
**File:** `src/scss/popup/spaceCreate.scss:53`
Uses `rgba(242, 242, 242, 0)` as gradient start — no dark mode override. CSS gradient interpolation goes through this color, creating a subtle light-grey haze in dark mode.

#### L6. `$teal-accent` variable is orange
**File:** `src/scss/popup/aiOnboarding.scss:11`
`$teal-accent: #fe9a00;` — variable named teal but value is orange. Used 8 times.

#### L7. Empty rule block
**File:** `src/scss/block/dataview/view/list.scss:179-180`
Empty `.regularContent {}` nesting block.

#### L8. Unused CSS variable `--color-bg-grey`
**File:** `src/scss/theme/dark/common.scss:37`
Defined but never referenced.

#### L9. `'unsafe-eval'` in CSP default-src
**File:** `electron/json/cors.json:3`
Allows `eval()` and `new Function()` in all contexts. Required by some libraries but weakens CSP significantly.

#### L10. Pervasive `as any` / `any` typing in comment system
**Files:** All comment component files
Nearly all callback parameters, message objects, and refs are typed as `any`. The comment system is brand new code (~2,800 lines) and should have proper typing.

---

## Resolved Issues (from previous review)

| Previous | Status | Resolution |
|----------|--------|------------|
| H1. jQuery incomplete (47+ files) | **Resolved** | jQuery fully removed, 0 imports remain |
| H2. `.get(0)` calls | **Resolved** | No `.get(0)` calls remain in components |
| H4. Graph mixed jQuery/CustomEvent | **Resolved** | All events use native CustomEvent via U.Dom helpers |
| H6. Build system migration | **Resolved** | Vite configs stable, CI passing |
| M5. `scrollbar-gutter: stable` removed | **Not an issue** | Still present in `src/scss/page/common.scss:1` |
| M8. Deferred update sets unbounded | **Addressed** | `flushDeferredUpdates()` called reliably in `isActiveTabSet(true)` |

---

## Security Summary

| Finding | Severity | Location |
|---------|----------|----------|
| No URL validation before `shell.openExternal()` | Accepted | `electron/ts/api.ts:432` |
| `exec()` with shell on Windows for `openPath` | Medium | `electron/ts/api.ts:451` |
| `sandbox: false` on all renderer windows | Medium | `electron/ts/window.ts:770` |
| `@electron/remote` enabled (deprecated) | Medium | `electron/ts/window.ts:47,414` |
| `'unsafe-eval'` in CSP default-src | Low | `electron/json/cors.json:3` |
| Broad filesystem API exposed via preload | Low | `electron/js/preload.cjs:64-75` |

---

## Architecture Highlights

### Build System (Vite + bun)
- **4 Vite configs:** app, extension, web, worker
- **Code splitting:** Granular vendor chunks (react, d3, mermaid, sentry, excalidraw, protobuf)
- **Auto-imports:** `unplugin-auto-import` for `S`, `U`, `J`, `C`, etc.
- **Electron build:** esbuild for main process bundling
- **Testing:** Vitest configured with 371+ unit tests
- **SafeStorage:** Excellent atomic write pattern with crash recovery in `electron/ts/safeStorage.ts`

### MobX Architecture
- **Auto-observer plugin** (`vite.auto-observer.ts`) wraps all functional component exports with `observer()` at build time — no manual imports needed
- **Reaction scheduler** (`lib/reactionScheduler.ts`) pauses MobX reactions in inactive tabs, flushes on activation
- **Event batching** (`dispatcher.ts`) buffers gRPC stream events per animation frame, processes in single `runInAction`
- **Deferred updates** in BlockStore skip expensive structural updates in inactive tabs

### Comment System
- **8 components** in `src/ts/component/comment/` (~2,800 lines total)
- **Lexical editor** for rich text editing (`component/form/commentEditor.tsx`)
- **MobX store** (`store/comment.ts`) with posts/replies maps, pagination state
- **Features:** Threading, mentions, emoji, attachments, reactions, markdown, code blocks, embeds

### U.Dom Helpers
- Complete replacement for jQuery DOM operations
- Error handling in `select`/`selectAll` with try-catch for invalid selectors
- Space-splitting in `addClass`/`removeClass` for multi-class strings

### Electron TypeScript
- Main process fully typed in `electron/ts/`
- CSP enforcement via `session.defaultSession.webRequest.onHeadersReceived`
- `activeTabOnly` Set prevents duplicate IPC for broadcast events
- Multi-tab system with lazy loading, persistence, and crash recovery
- Power monitor with hibernation recovery

---

## SCSS Highlights

### Positive
- **Comment system SCSS** (`component/comment.scss`): 490 lines, exclusively CSS variables, no hardcoded colors, proper native nesting
- **Easing variables** (`_mixins.scss`): `$easeDecelerate`, `$easeSpring`, `$easeSmooth` standardize animations
- **Net `!important` reduction**: 131 removed vs 115 added = net -16
- **SVG icon migration**: Massive cleanup of `background-image: url()` patterns replaced with `.icon.hasSvg` color-based approach

### Issues
- Orphaned dark widget styles (H3)
- Undefined `--color-bg-secondary` in light mode (H4)
- Dead background declaration in graph (M9)
- Hardcoded gradient color in spaceCreate (L5)

---

## Positive Changes

- **jQuery fully removed** — eliminates 87KB dependency, aligns with modern DOM APIs
- **MobX auto-observer** — eliminates manual `observer()` imports across 400+ components
- **Reaction scheduler** — measurable perf win for multi-tab by pausing background reactions
- **gRPC event batching** — reduces MobX reaction cascades from per-event to per-frame
- **ErrorBoundary** — catches rendering crashes globally with copy-error and reload UX
- **Set/Map lookups** — O(1) replacements for O(n) Array.includes/indexOf in hot paths
- **DetailStore sanitizeValue** — filters `_missing_object` IDs at store level
- **Dependency detail preservation** — subscription removal no longer deletes shared details
- **Type safety** — MenuDataMap generics, typed MenuItem, Detail with `unknown` value
- **Vitest** — 371+ unit tests
- **SafeStorage** — atomic writes with crash recovery
- **Tab system** — lazy loading, persistence, crash recovery
