# Code Review: v0.54.11 to HEAD

**Date:** 2026-04-05
**Scope:** 1204 commits, 3353 files changed, +65,320 / -50,006 lines
**Status:** Typecheck passes. Lint clean (1 warning: Biome suppression in generated auto-imports.d.ts).

---

## Executive Summary

This is a major release cycle with transformational infrastructure and architecture changes alongside significant new features. The codebase has undergone:

1. **Build system migration** — rspack + npm → Vite + bun
2. **Electron TypeScript rewrite** — electron.js → electron/ts/ with esbuild bundling
3. **jQuery complete removal** — replaced with native DOM and U.Dom helpers
4. **MobX modernization** — mobx-react → mobx-react-lite with auto-observer Vite plugin
5. **Icon system overhaul** — ~965 icons migrated from CSS `background-image` SVGs to TSX component registry (`src/ts/component/util/icons/`), organized into 37 packs with `Icon` component rendering via inline SVG. Eliminates dark theme icon overrides, enables color props, and removes hundreds of static SVG files.
6. **Emoji system rewrite** — Removed `emoji-mart` dependency, replaced with custom PNG-based emoji rendering. Added 60 missing Emoji 15.0/15.1 entries, inline `:colon` search popup, and shortcode generation at init time.
7. **gRPC event batching** — requestAnimationFrame + MobX runInAction for reduced re-renders
8. **Inactive tab optimization** — MobX reactionScheduler pauses reactions in background tabs
9. **New comment system** — threaded discussions with Lexical editor (~2,800 lines)
10. **Protobuf migration** — generated classes → plain objects with ts-proto

The overall quality is good. The architecture changes are well-executed with proper fallbacks. Two rounds of review fixes have been applied (see Fixed Issues below).

---

## Fixed Issues (applied during this review)

### Round 1 — `32dfba0c71`

| # | Fix | File(s) |
|---|-----|---------|
| H1 | Space create: name inner callback param so it checks the correct error | `popup/space/create.tsx` |
| H2 | Add `sidebarResize` to editor unbind events array | `editor/page.tsx` |
| H3 | Delete orphaned dark theme widget SCSS | `scss/theme/dark/widget.scss` |
| H4 | Replace `--color-bg-secondary` with `--color-shape-highlight-light` in errorBoundary | `scss/component/errorBoundary.scss` |
| H7 | Remove dead `e.originalEvent` references (10 locations, 8 files) | `embed.tsx`, `page.tsx`, `chat/form.tsx`, `text.tsx`, `phrase.tsx`, `cover.tsx`, `upload.tsx`, `drag/provider.tsx` |
| H9 | Move `setIsLoading(false)` outside `!isEdit` branch | `comment/form.tsx` |
| M2 | Remove jQuery `.get(0)` fallback from `renderLinks` and `toggle` | `lib/util/dom.ts` |
| M3 | Add cleanup to unmount emoji React roots | `comment/post.tsx`, `comment/reply.tsx` |
| M9 | Remove dead `background: var(--color-bg-secondary)` | `scss/page/main/graph.scss` |
| M11 | Move `buildTree` before `fetchAllMessages`, add to dep array | `comment/section.tsx` |
| M12 | Add missing `build:deps` to `dist:win` script | `package.json` |
| L1 | Add `[ toast ]` dependency array to toast useEffect | `util/toast.tsx` |
| L3 | Cache regex in `addBodyClass` | `lib/util/dom.ts` |
| L5 | Replace hardcoded `rgba(242,242,242,0)` with `transparent` | `scss/popup/spaceCreate.scss` |
| L6 | Rename `$teal-accent` → `$spark-accent` | `scss/popup/aiOnboarding.scss` |
| L7 | Remove empty `.regularContent {}` block | `scss/block/dataview/view/list.scss` |
| L8 | Remove unused `--color-bg-grey` | `scss/theme/dark/common.scss` |
| — | Remove unused imports (`Onboarding`, `keyboard`, `translate`, `raf`) | `chat.tsx`, `menu/search/object.tsx` |
| — | Make `BlockStore.restrictionMap` observable for reactive readonly state | `store/block.ts` |
| — | Add optimistic `isArchived` detail update in `Action.archive` | `lib/action.ts` |

### Round 2 — `c459a52887`

| # | Fix | File(s) |
|---|-----|---------|
| — | Fix phrase placeholder `display: block` → `display: flex` | `form/phrase.tsx` |
| — | Remove 10 debug `console.log` calls from onboarding graph | `popup/graph/OnboardingGraphWorker.tsx` |
| — | Remove render frequency debug tracker | `popup/dimmerWithGraph.tsx` |
| — | Remove unused `useRef` import | `popup/dimmerWithGraph.tsx` |

---

## Remaining Items

### Needs Design / Larger Effort

#### H4 (partial). `--color-bg-secondary` still used in auth.scss
**File:** `src/scss/page/auth.scss:18,21,24`
Auth pages use `var(--color-bg-secondary)` for notification styles. This variable is only defined in dark theme. Auth pages currently always have dark background, so it works, but will break if auth pages support light theme in the future. Pre-existing issue (not a regression).

#### H8. Comment system `fetchAllMessages` loads entire history
**File:** `src/ts/component/comment/section.tsx`
Recursively fetches all messages in pages of 100 before building the tree. For discussions with thousands of messages: high memory usage, slow initial load, potential UI freeze. Needs pagination redesign.

#### M4. `ensureDiscussion` silently drops concurrent calls
**File:** `src/ts/component/comment/section.tsx:495-526`
Uses `isCreating.current` as a mutex. If a second call arrives while creating, it silently returns without calling `callBack`. The user's comment is silently lost. Needs queueing or callback-with-error pattern.

#### M5. `reactionScheduler` queue grows unboundedly while paused
**File:** `src/ts/lib/reactionScheduler.ts`
When the tab is inactive, all MobX reaction callbacks are queued. A long-idle tab with active subscriptions accumulates an unbounded queue. On resume, all queued reactions fire at once, potentially causing a UI freeze. Could add a cap or coalesce reactions.

#### M6. Subscription record removal leaks details
**File:** `src/ts/lib/api/dispatcher.ts:983-990`
When a subscription removes a record, `S.Detail.delete` is intentionally NOT called (to preserve dependencies). Details for non-dependency records accumulate indefinitely. Accepted trade-off to fix dependency display.

#### M10. Date format masks are identical
**File:** `src/ts/component/cell/text.tsx`
`ShortUS`, `MonthAbbrBeforeDay`, `Long`, `Default` all map to the same mask `99.99.9999`. Needs design input on correct masks per format.

#### L10. Pervasive `as any` / `any` typing in comment system
**Files:** All comment component files
Nearly all callback parameters, message objects, and refs are typed as `any`. Ongoing improvement.

### Accepted / Won't Fix

| # | Item | Reason |
|---|------|--------|
| H5 | No URL validation for `shell.openExternal()` | Users need arbitrary deeplink schemes |
| H6 | `exec` with shell on Windows for `openPath` | Workaround for Electron bug with non-Unicode paths |
| M1 | `renderLinks` handler pattern | Not a bug — old handlers are properly removed before new ones are added |
| M7 | Cell mousedown on window scope | Intentional change |
| M8 | `sandbox: false` on renderer windows | Electron architectural constraint; `@electron/remote` migration planned |
| L2 | Enter key 30ms timeout guard | Marginal risk |
| L4 | Auto-observer plugin edge cases | No matching patterns in codebase |
| L9 | `'unsafe-eval'` in CSP | Required by dependencies |

---

## Security Summary

| Finding | Severity | Location |
|---------|----------|----------|
| `shell.openExternal()` without scheme validation | Accepted | `electron/ts/api.ts:432` |
| `exec()` with shell on Windows for `openPath` | Accepted | `electron/ts/api.ts:451` |
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

### Icon System
- **Registry-based** — `src/ts/component/util/icons/registry.ts` stores TSX SVG components in a `Map<string, FC>`
- **37 icon packs** — organized by domain: `header/`, `control/`, `menu/`, `dataview/`, `type/`, `layout/`, etc.
- **~965 registered icons** — all converted from static SVG files + CSS `background-image` to inline TSX components
- **`Icon` component** renders via `dangerouslySetInnerHTML` from `getIconSvg()`, with props: `name`, `size`, `color`, `className`, `withBackground`, `iconWidth`/`iconHeight`
- **Dark mode** — eliminates ~50+ dark theme CSS icon overrides; color is now a prop/CSS `currentColor`
- **Storybook gallery** — `icons/gallery.stories.tsx` for browsing all registered icons

### Emoji System
- **emoji-mart removed** — eliminates a heavy dependency; all emoji rendering now uses PNG images from `dist/img/emoji/`
- **Shortcode generation** — `U.Smile.init()` generates shortcodes at startup, replacing emoji-mart's data
- **Emoji 15.0/15.1** — 60 new emojis added (including phoenix, lime, head-shaking, etc.)
- **Inline `:colon` picker** — typing `:` in editor/chat/comments triggers emoji search popup
- **Cross-platform rendering** — `<smile>` elements rendered as PNG images via React roots for consistent display

### MobX Architecture
- **Auto-observer plugin** (`vite.auto-observer.ts`) wraps all functional component exports with `observer()` at build time — no manual imports needed
- **Reaction scheduler** (`lib/reactionScheduler.ts`) pauses MobX reactions in inactive tabs, flushes on activation
- **Event batching** (`dispatcher.ts`) buffers gRPC stream events per animation frame, processes in single `runInAction`
- **Deferred updates** in BlockStore skip expensive structural updates in inactive tabs
- **Observable restrictionMap** — `BlockStore.restrictionMap` made observable so editor re-renders reactively on restriction changes (e.g., archive/restore)

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

## Positive Changes

- **jQuery fully removed** — eliminates 87KB dependency, aligns with modern DOM APIs
- **Icon system overhaul** — ~965 icons as TSX components, eliminates dark theme CSS overrides, enables color/size props
- **Emoji-mart removed** — replaced with lightweight PNG rendering + custom shortcode generation
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
