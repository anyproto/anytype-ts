# Global Search Shortcut — Design Spec

**Date:** 2026-08-25
**Status:** Draft
**Related:** tray support (`electron/ts/menu.ts:initTray`), in-app search (`src/ts/lib/keyboard.ts` `onCommand('search')`)

## Problem

Users who keep Anytype minimized or hidden in the system tray cannot open global search
without first hunting for the window. Requested behavior: a **system-wide keyboard
shortcut** that brings Anytype forward and opens global search from anywhere, plus a
**Search entry in the tray menu**.

## Goals

1. A global (OS-level) shortcut opens the app + global search popup, even when the app
   is minimized, hidden to tray, or behind other windows.
2. A sensible default combo, with a defined policy for conflicts with other apps.
3. The user can rebind it in the existing shortcut editor (`popup/shortcut.tsx`) —
   no new settings surface.
4. "Search" item in the tray context menu does the same thing via mouse.

## Non-goals (v1)

- A dedicated Spotlight-style overlay window (Electron cannot create `NSPanel` on macOS
  — electron#31538 — so an overlay steals focus and behaves worse than restoring the
  main window; revisit later as its own project).
- Wayland support (see §Platform notes).
- Other global actions (quick capture / new object). The architecture must allow adding
  more global shortcut ids later, but only `globalSearch` ships now.

---

## Decisions

### D1. New shortcut id `globalSearch`, separate from in-app `search`

The in-app `search` (default `Cmd/Ctrl+K`, `src/json/shortcut.ts:72`) must NOT be
registered globally — a global `Cmd+K` would swallow Cmd+K in every other app on the
system. `globalSearch` is a new id with its own default, listed in the shortcut editor
next to `search`.

### D2. Default accelerator: `CmdOrCtrl+Shift+Space`

Rationale:
- Memorable and consistent cross-platform ("Space = search, Shift = everywhere").
- macOS: does not touch system-owned combos (`Cmd+Space` Spotlight, `Cmd+Option+Space`
  Finder search, `Ctrl+Cmd+Space` character viewer).
- Windows: avoids `Alt+Space` (window system menu), `Win+*` (reserved), and any
  `Ctrl+Alt+*` combo (`Ctrl+Alt` == AltGr on many European layouts — a global grab
  would fire while typing).
- Known collision: 1Password Quick Access uses the same default. Acceptable because
  first-registrant wins at the OS level — if 1Password (typically launched at login,
  before Anytype) holds it, our registration fails cleanly and we surface it (D3);
  we never steal from an app that already owns the combo.

**Enabled by default** (decided 2026-08-25). Alternatives considered and rejected: `Alt+Shift+Space` (collides
with the Alt+Shift layout-switch hotkey on Windows), letter combos like
`Ctrl+Shift+K/F` (globally swallow very common in-app shortcuts of other apps).

### D3. Conflict policy

`globalShortcut.register()` returns `false` when the combo is taken (the OS does not
say by whom). Policy:

- Attempt registration at startup and after every shortcut change. No polling/retries.
- On failure: keep the result in `MenuManager` and expose it via a new
  `getGlobalShortcutStatus` Api method (invoke); the shortcut editor shows a warning
  state on the `globalSearch` row: "This shortcut is used by another application"
  (new translation key). No modal, no toast on startup — silent degradation, visible
  where the user would fix it.
- Re-attempt on every app launch (the other app may be gone) and whenever the user
  edits the binding.
- Before registering a new combo, `unregister()` the previous one; `unregisterAll()`
  on `will-quit`.

### D4. Rebinding reuses the existing pipeline

Current flow (verified in code):

1. Editor `popup/shortcut.tsx` → `Storage.updateShortcuts(id, keys)` →
   `Storage.setShortcuts` (`src/ts/lib/storage.ts:769`) — persisted to safe storage
   under key `shortcuts` (non-local).
2. Editor sends `Renderer.send('initMenu')` after each change (shortcut.tsx:52 etc.).
3. Main: `Api.initMenu` (`electron/ts/api.ts:584`) → `MenuManager.initMenu()` +
   `initTray()` — which re-read `getSafeStorage().get('shortcuts')` (menu.ts:48) and
   convert via `getAccelerator(id)` (menu.ts:51).

Extension: `Api.initMenu` additionally calls a new
`MenuManager.initGlobalShortcuts()` that unregisters + re-registers `globalSearch`
from the same source of truth. Nothing new to persist, no new IPC.

Validation in the editor for `globalSearch` only: require at least one of
Cmd/Ctrl/Alt/Shift plus a key (a bare letter registered globally would swallow typing
system-wide). Reuse the existing key-capture UI.

Defaults live in both existing default tables: `src/json/shortcut.ts` (editor UI) and
`DEFAULT_SHORTCUTS` (`electron/ts/menu.ts:15`, main-process fallback).

### D5. Quick search window (revised 2026-08-25)

The hotkey/tray Search never surfaces the main window. Instead they open a
dedicated **quick search panel**: a small (684x520) frameless, always-on-top,
skip-taskbar singleton window hosting a single tab routed to `/main/quickSearch`
- a page whose only job is to mark the renderer as the quick search panel and
open the search popup, which is styled to fill the whole window
(`.popup.popupSearch.isQuickSearch`). The panel behaves like Spotlight:

- Esc closes the popup -> `onClose` sends `quickSearchClose` -> main hides the window.
- Blur (clicking elsewhere) hides it.
- Re-trigger shows the same hidden window instantly (renderer stays warm) and
  sends `commandGlobal:'quickSearchShow'` so the popup is reopened if needed.
- The window is excluded from: MenuManager/UpdateManager focus targeting, tab
  save/restore (`saveTabs`), the hideTray last-window-exit count, and the
  `winShowForce` fallback scan (as is the challenge window).

`winShowForce()` (restore -> alwaysOnTop bounce -> `app.focus({steal:true})`)
remains for the tray double-click and for fronting the main window when a
result is picked.

### D6. Opening a result

Every `U.Object.open*` entry point (`openEvent`, `openAuto`, `openRoute`,
`openConfig`) checks `S.Common.isQuickSearchWindow` first: in the panel the open
is redirected - `Renderer.send('quickSearchOpen', route)` - and the popup closes
so the next invocation starts fresh. Main-side `Api.quickSearchOpen` hides the
panel, fronts the main window via `winShowForce`, and sends the `route` event,
which the main window's active tab navigates to (same path deeplinks use).

Pin lock is never bypassed: the panel's renderer runs the normal page-level
auth/pin gating, so a locked app shows the pin screen inside the panel.

**Spaceless boot (added 2026-08-25).** The panel window skips the space entirely:
`app.tsx` forks on the `/main/quickSearch` route into `U.Data.onAuthQuickSearch`,
which runs only AccountSelect (cheap - the heart account is already open and main
single-flights it), a **lite** `createGlobal` (profile + spaceviews only - the
full one also carries chatGlobal/discussionGlobal and a per-space subSpace
fan-out, all vault machinery), and the pin gate, the last two in parallel.
Skipped: `WorkspaceOpen`, widget `ObjectOpen`s, the five per-space
subscriptions, the subSpace fan-out, chat globals and previews, notifications,
file usage and membership loads. `isCurrentSpace()` in the popup requires a
non-empty `S.Common.space` (with no space open nothing is "current" - otherwise
'' == '' routed loads to the in-space RPC and returned nothing). Safe because
the global loader is
`ObjectCrossSpaceSearch` (no spaceId), the popup's cross-space deps
(`subscribeGlobalDeps`) are account-keyed and lazy, a Channel scope rides the
foreign-scope one-shot path, and space-scoped storage keys degrade to no-ops with
`S.Common.space` empty.

### D7. Target window (multi-window)

`winShowForce` targets the most recently focused non-auxiliary window
(`MenuManager.win`, updated on window focus), falling back to any live main
window, and creating one only if none exists (dispatching the route only after
`did-finish-load`).

### D8. Tray menu

Add to `initTray()` template, directly under "Open App":

```
{ label: translate('electronMenuSearch'), accelerator: getAccelerator('globalSearch'),
  click: () => this.onGlobalSearch() }
```

`onGlobalSearch()` = winShowForce + send, shared with the shortcut callback. Shown
regardless of registration success (the menu item works even when the OS combo is
taken).

---

### D9. Full-view onboarding inside the search screen (revised 2026-08-25, v3)

On the first search open, a full-view overlay (`.searchOnboarding`) covers
everything below the search input (which stays visible and focused):

- Two points under a "Meet the new search" title: (1) the revamped search - a
  static row of kind chips (Messages, Pages, Tasks, Media) drawn in the real
  `.typeItem` style + one line about chip filtering; (2) the global shortcut -
  the current combo as large key caps (live via `keyboard.getKeys('globalSearch')`)
  + one context line. Footer: "Press any key to start searching".
- Registration failed: title + short conflict text + a "Change shortcut" button
  opening the shortcut editor. On Wayland (`unavailable`) / web (null status)
  nothing is shown.
- Dismissal: any non-modifier keypress (the key still lands in the filter -
  no preventDefault) or a click anywhere on the overlay. Being displayed once
  counts as seen - the dismiss-effect cleanup stamps
  `Storage.setOnboarding('globalSearch')` on dismiss or popup close alike.
- Status is pulled per popup mount only while unseen.

---

## Platform notes

| Platform | Mechanism | Notes |
|---|---|---|
| macOS | Carbon `RegisterEventHotKey` via Electron | No Accessibility permission needed (that's only for media keys). System combos not grabbable. |
| Windows | `RegisterHotKey` | First registrant wins. Foreground-steal workaround required (D5). |
| Linux X11 | X grab | Works as-is. |
| Linux Wayland | XDG GlobalShortcuts portal | **Unsupported in v1.** Requires `--enable-features=GlobalShortcutsPortal`, portal handshake is broken on xdg-desktop-portal ≥ 1.20 (electron#51875), and the user must confirm/assign keys in DE settings. Detect Wayland (`XDG_SESSION_TYPE`/ozone) and render the editor row disabled with "Not available on this system". Tray "Search" item still works. |

## Implementation sketch

| File | Change |
|---|---|
| `electron/ts/menu.ts` | `DEFAULT_SHORTCUTS.globalSearch`; `initGlobalShortcuts()`, `winShowForce()`; `onGlobalSearch()` -> `showQuickSearch()`; tray "Search" item; registration state |
| `electron/ts/window.ts` | `createQuickSearch`/`showQuickSearch` (toggle)/`hideQuickSearch`/`mainWindowCount`; auxiliary windows excluded from focus targeting, `saveTabs`, tab bar |
| `electron/ts/api.ts` | `initMenu` re-registers; `getGlobalShortcutStatus`, `quickSearchClose`, `quickSearchOpen` |
| `electron/ts/main.ts` | register at startup; `unregisterAll` on `will-quit`; hideTray exit counts main windows only |
| `electron/ts/types.ts` | `AppWindow.isQuickSearch` |
| `src/ts/component/page/main/quickSearch.tsx` | panel host page: sets `S.Common.isQuickSearchWindow`, opens the popup |
| `src/ts/lib/keyboard.ts` | `onQuickSearchPopup()`; `commandGlobal:'quickSearchShow'` |
| `src/ts/lib/util/object.ts` | `quickSearchRedirect()` guard in `openEvent`/`openAuto`/`openRoute`/`openConfig` |
| `src/json/shortcut.ts` | `globalSearch` row (Navigation section) |
| `src/ts/component/popup/shortcut.tsx` | modifier-required validation, OS-conflict warning, Wayland-disabled state |
| `src/ts/component/popup/search.tsx` | full-view `.searchOnboarding` overlay (D9) |
| `src/scss/popup/search.scss` | `.isQuickSearch` full-window popup, `.searchOnboarding` styles |
| `src/ts/store/common.ts` | `globalShortcutStatus` + `isQuickSearchWindow` |
| `src/ts/lib/web/electronMock.ts` | `getGlobalShortcutStatus` -> null (web: no hint, no panel) |
| `src/json/text.json` | tray label reuses `electronMenuSearch`; hint/conflict/validation strings |

## Edge cases

- Combo taken → register false → warning in editor, no crash, tray item unaffected.
- User binds a combo already used *in-app* by Anytype → allowed (global fires when
  unfocused; when focused the renderer handler wins) but editor shows the existing
  duplicate-binding warning if one exists.
- App pin-locked → window fronts to pin screen; search after unlock (D6).
- All windows closed, tray-only → create window, then dispatch (D7).
- Shortcut cleared by user (empty keys) → unregister, nothing registered.
- Import/reset of shortcuts (`shortcutImport`, `resetShortcuts`) → both already funnel
  through `initMenu` refresh → re-registration for free.
- Onboarding: shown on first search open only; success/failure variant is picked at
  display time from the cached status; rebinding before first search open → the
  onboarding prints the rebound combo.

## Testing

- Unit: accelerator conversion for `globalSearch` (space/modifier mapping in
  `getAccelerator`).
- Manual matrix (global OS hotkeys and tray cannot be driven by Playwright):
  - macOS: minimized / hidden (Cmd+H) / tray-only / another app fullscreen; combo
    taken by 1Password.
  - Windows: minimized to tray; foreground-restriction (verify no taskbar-flash-only);
    combo pre-registered by another app.
  - Linux X11: minimized / tray. Wayland: row disabled, tray Search works.
- E2E: in-app portion only — `commandGlobal:'search'` IPC opens the popup (can be
  driven through the existing suite's Electron harness if it exposes webContents.send);
  onboarding variants testable by seeding `globalShortcutStatus` + clearing the
  `onboarding` storage key.

## Open questions

1. Whether to add an analytics event (`GlobalSearchShortcut` source on the existing
   search-open event) — recommended, trivial.
