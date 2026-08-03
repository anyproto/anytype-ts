# Design: Auto-hide the dataview sticky horizontal scrollbar on macOS

**Date:** 2026-08-03
**Branch:** `develop`
**Status:** Draft for review

## Problem

`StickyScrollbar` (`src/ts/component/util/stickyScrollbar.tsx`) renders a permanently visible 10px bar at the bottom of any dataview grid or board whose columns overflow. On macOS this reads as foreign: the OS hides scroll indicators when they are not in use, and has done so by default since Ventura.

The bar is visible at all times because `src/scss/component/stickyScrollbar.scss` styles `::-webkit-scrollbar` unconditionally. In Chromium, styling that pseudo-element opts the element out of macOS overlay scrollbars and forces a classic, always-drawn bar. The track additionally paints `--color-shape-secondary` across the full width, so even a fully transparent thumb would leave a grey strip.

This contradicts a policy the codebase already holds. `src/scss/common.scss:227-232` scopes the app's custom `::-webkit-scrollbar` styling to `platformWindows, platformLinux`:

```scss
&.platformWindows, &.platformLinux {
	::-webkit-scrollbar { width: 10px; height: 10px; }
	::-webkit-scrollbar-thumb { background: var(--color-control-active); border-radius: 5px; }
	...
}
```

macOS is deliberately excluded so it keeps native overlay scrollbars. `StickyScrollbar` is unscoped and breaks that rule. **This change restores an existing intent rather than introducing a new preference.**

### Why the bar exists

Two recent commits added it, and their reasoning constrains the fix:

- `3aea4aa75a` — `fix(dataview): inline board sizing, scrollbar and instant card insert (JS-9714)`
- `85c72cd551` — `fix(dataview): sticky horizontal scrollbar for inline grid (JS-9811)`

JS-9811's message states the problem it solved: wide inline queries "could only be scrolled with shift+wheel, which is undiscoverable and unusable without a horizontal-axis pointer." A naive full auto-hide would reintroduce exactly that bug. The design below preserves discoverability explicitly.

## Research basis

| Source | Bearing on this design |
| --- | --- |
| [Apple HIG — Scroll views](https://developerguidelines.com/human-interface-guidelines/version/8/scroll-views/) | Indicators are transient, appearing "after people begin scrolling." But the HIG pairs this with a requirement to "make it apparent when content is scrollable" by other means — auto-hide alone is only half the pattern. |
| [Adrian Roselli — Baseline Rules for Scrollbar Usability](https://adrianroselli.com/2019/01/baseline-rules-for-scrollbar-usability.html) | "Do not make it disappear using your own custom styles because *you* prefer it." The stated reason is that developers cannot detect the user's scrollbar preference. Also cites SC 1.4.11 (3:1 non-text contrast) and SC 2.5.8 (24x24 target size). |
| [NN/g — Scrolling and Scrollbars](https://www.nngroup.com/articles/scrolling-and-scrollbars/) | "Offer a scrollbar if an area has scrolling content." Horizontal scrolling is singled out as cognitively taxing and easy to miss, so discoverability matters more here, not less. |
| [OverlayScrollbars](https://kingsora.github.io/OverlayScrollbars/) | Industry-standard modes `never` / `scroll` / `leave` / `move`; default `autoHideDelay` 1300ms. Its `autoHideSuspend` option keeps the bar visible until the user's first scroll; the docs say the `false` default exists only for backwards compatibility and `true` is "recommended for better accessibility." |

Two conclusions shaped the design:

1. **Roselli's objection is answerable here.** In Chromium the preference *is* detectable: an offscreen `overflow: scroll` probe reports `offsetWidth - clientWidth == 0` under macOS overlay scrollbars, and ~15px when the user has set **Show scroll bars: Always**. Respecting that turns this from an author-preference override into preference-respecting behavior.
2. **`autoHideSuspend` looked like it resolved the NN/g conflict.** Keeping the bar visible until first use should have retained JS-9811's discoverability fix while still decluttering afterwards. It was implemented and shipped, then removed — see the revision note under *Visibility rule*. The theory did not survive contact with the actual interaction: a bar that disappears the first time you use it reads as breakage, not as a hint.

## Design

### Boundary

All logic lands in two places:

- `src/ts/component/util/stickyScrollbar.tsx` — visibility state and listeners
- `src/ts/lib/util/common.ts` — one memoized `hasOverlayScrollbars()` probe

**`grid.tsx` and `board.tsx` require no changes.** The existing `I.StickyScrollbarRef` API already supplies both signals the feature needs:

- `bind(scrollElement, status)` receives the horizontally-scrolling container — the hover host.
- `sync(element, isSyncing)` is already invoked from `onScrollHorizontal` (`grid.tsx:122`) on every horizontal scroll — the activity signal.

The component therefore owns its auto-hide state entirely, and both call sites inherit the behavior. `src/scss/component/stickyScrollbar.scss` gains one property; no colors or sizes change.

### Visibility rule

```
isEnabled = props.autoHide ?? (U.Common.isPlatformMac() && U.Common.hasOverlayScrollbars())

visible = !isEnabled                                  // Win/Linux, or "Always" chosen
        || isHovering                                 // see host below
        || isRecentlyScrolled                         // see timer below
```

> **Revised 2026-08-03, after the first version shipped.** The original rule carried a fourth clause, `|| !hasScrolledOnce` — the bar stayed visible until the user's first real scroll, following OverlayScrollbars' `autoHideSuspend`. In use this read as a bug rather than an affordance: a freshly opened object showed a bar that then vanished the first time you scrolled and moved away, which looks like a glitch rather than a deliberate hint. The clause was removed; the bar now starts hidden.
>
> The cost is real and accepted: a wide grid no longer advertises that it scrolls until hovered. That is a partial walk-back of JS-9811, mitigated by the fact that hovering a table is the normal precondition to interacting with it, so the reveal happens before anyone needs the bar.

**Hover host.** In both `grid.tsx:577-603` and `board.tsx`, the bar is rendered as a *sibling* of the scrolling element, under a shared view-root wrapper. That wrapper — reachable as `nodeRef.current.parentElement` — is used as the hover target, because it spans the block content *and* the bar. A single `isHovering` flag therefore covers hovering the bar itself, with no second listener pair and no gap when the pointer crosses from content onto the bar.

Listeners are `mouseover` (rather than `mouseenter`) and `mouseleave`. `mouseover` bubbles from descendants, so hover state self-heals on the next pointer movement if listeners are re-attached while the pointer is already inside — which happens when `rebind()` fires on a column add.

`unbind()` deliberately does **not** clear `isHovering`. Because `bind()` calls `unbind()` first, clearing it there would hide the bar out from under a resting pointer on every column add, until the pointer moved again. Leaving it set fails visible, which is the safe direction; the unbound window between `unbind()` and `bind()` is a few microseconds inside one effect, so a missed `mouseleave` is not reachable in practice.

`isRecentlyScrolled` is **timer-driven, not polled**: every scroll event sets it true and restarts a single 1300ms `setTimeout` that sets it false. Reusing one timer handle means rapid scrolling does not accumulate timers.

**Programmatic scrolls must not count as activity.** `grid.tsx:48-61` calls `onScrollHorizontal()` directly from a `useEffect` keyed on `[ relations.length, view?.id ]`, so `sync()` fires on mount and on every view or column-count change with no user involvement. Without a guard, opening any object with a wide grid would flash the bar visible for 1300ms and then fade it — and board, whose `onScrollHorizontal` is only ever a real listener, would not flash, so the two views would visibly disagree.

(Under the original suspend rule this same defect had a different symptom: it set `hasScrolledOnce` at mount and deleted the suspend clause outright. The guard is what makes both rules behave, and it matters more now that the bar starts hidden.)

Activity is therefore gated on the scroll position actually moving. The component tracks `lastScrollLeft`; the first observation after `bind()` only establishes a baseline and returns, and an unchanged position is ignored. Real user scrolls change `scrollLeft` and register normally. `lastScrollLeft` resets in `unbind()` so each bind re-establishes its own baseline.

`isEnabled` accepts an optional `autoHide` prop that overrides platform detection. Call sites omit it and get the detected default; Storybook sets it explicitly to exercise both states. This follows the CLAUDE.md rule that component variations are separate props rather than implicit behavior.

| State | Bar |
| --- | --- |
| Not macOS, or user chose "Show scroll bars: Always" | Visible — today's behavior exactly |
| Freshly opened, pointer elsewhere | Hidden |
| Pointer over the dataview block, or over the bar | Visible |
| Scrolling, or within 1300ms of the last scroll | Visible |
| Idle and unhovered | Faded out |
| No overflow | `display: none` via existing `resize()` |

Non-macOS users and macOS users who chose "Always" short-circuit on the first clause, so they see no behavior change at all. Regression risk is confined to the target platform.

### Two independent visibility axes

`resize()` already writes `display` to hide the bar when content does not overflow (`grid.tsx:426`, `:437`, `:440`, `:466`). Auto-hide **must not** reuse `display`, or the two mechanisms will overwrite each other on every resize — and `resize()` is called on every column drag and scroll.

Auto-hide therefore uses **opacity only**. `display` stays exclusively owned by `resize()`. The two compose correctly: `display: none` wins regardless of opacity, and when a view becomes overflowing again the bar returns to whatever the hover/scroll rule says.

### Fade mechanism

The fade must be driven through motion, not CSS. `U.Common.animationProps()` (`common.ts:781-794`) already has `motion` writing an inline `opacity` on the node:

```ts
animate: { opacity: 1, ...param.animate },
```

An inline style set by motion beats any stylesheet rule, so a CSS class toggling opacity would silently do nothing. The fix is to drive `animate={{ opacity: visible ? 1 : 0 }}` from component state, keeping the existing 0.2s tween. The current mount-time `delay: 0.2` is dropped for state-driven transitions — the 1300ms idle timer already provides the delay, and a delayed *reveal* would feel unresponsive.

Fading the node fades track and thumb together, which matches macOS drawing no groove when idle. No color values are touched, satisfying the CLAUDE.md rule against unrequested style changes.

### SCSS

One addition: `pointer-events: none` while faded out, so the invisible 10px strip does not swallow wheel and click events. Restored when visible, keeping the bar grabbable the moment it appears.

### Probe

```ts
hasOverlayScrollbars (): boolean {
	// memoized on first call
	const el = document.createElement('div');

	el.style.cssText = 'position:absolute;top:-9999px;width:100px;height:100px;overflow:scroll;';
	document.body.appendChild(el);

	const result = (el.offsetWidth - el.clientWidth) == 0;

	el.remove();
	return result;
};
```

Valid on macOS specifically because `common.scss:227-232` scopes the app's `::-webkit-scrollbar` override to Windows and Linux, so no app stylesheet perturbs the measurement. Placed next to `isPlatformMac()` in `U.Common`.

### Cleanup

One `setTimeout` handle and two hover listeners, all torn down in `unbind()` and on unmount, following the existing `scrollHandler` ref discipline in the same file. `bind()` must clear any prior timer and listeners before re-attaching, as it already does for `scrollHandler`. This codebase has previously shipped a class of bug where leaked listeners survived unmount, so teardown is treated as a correctness requirement, not hygiene.

## Out of scope

- **`prefers-reduced-motion`.** The codebase honors it nowhere today (zero hits across `src/scss` and `src/ts`). Adding it to this one component would be inconsistent; it belongs in a separate app-wide task.
- **Explicit resize/drag pinning.** During a column resize the pointer is over the block, so the hover clause already keeps the bar visible. No `keyboard.isResizing` wiring needed.
- **Target size (WCAG SC 2.5.8).** The bar is 10px tall, below the 24x24 guidance. This is pre-existing and unchanged by this work. Enlarging it, or mirroring the macOS expand-on-hover behavior, is a design decision requiring explicit sign-off per CLAUDE.md.
- **Runtime preference changes.** The probe runs once, so toggling **Show scroll bars** in System Settings takes effect on app restart. Re-probing on window focus is possible but deliberately omitted.

## Testing

**Automated** — unit-testable pure logic: the visibility rule is a pure predicate over `(isEnabled, isHovering, isRecentlyScrolled)`, so the truth table above is asserted directly without DOM or timers.

Note what the unit tests do **not** reach: the `lastScrollLeft` baseline guard lives in component state, and this repo has no React component test setup (vitest runs in `node` with no jsdom). Step 1 below is the only coverage it has.

**Manual, macOS with Show scroll bars: When scrolling** (the default):
1. Open an object with a wide inline grid, pointer away from the block — **no bar appears at any point**, including no brief flash on open. Repeat by switching views and by adding a column, which also trigger the programmatic scroll path.
2. Move the pointer over the block — bar fades in; move it away — bar fades out after ~1300ms.
3. Scroll horizontally, then move the pointer off the block — bar stays for ~1300ms, then fades.
4. Hover the bar itself and drag the thumb — grabbable, and stays visible for the whole drag.
5. Narrow the view so columns fit — bar `display: none`; widen again — bar returns, still hidden until hovered.
6. Resize a column with the pointer inside the block — bar stays visible throughout.
7. Repeat 1-6 on a wide inline board and on a full-page grid; grid and board must behave identically.

**Manual, macOS with Show scroll bars: Always** — bar is permanently visible in every case above; no fading at any point.

**Manual, Windows or Linux** — behavior byte-for-byte identical to today.

## Files

| File | Change |
| --- | --- |
| `src/ts/component/util/stickyScrollbar.tsx` | Optional `autoHide` prop, visibility state, hover listeners, idle timer, motion-driven opacity |
| `src/ts/lib/util/stickyScrollbar.ts` | Add `StickyScrollbarState` and the pure `isVisible()` predicate |
| `src/ts/lib/util/stickyScrollbar.test.ts` | New — unit tests for the visibility truth table |
| `src/ts/lib/util/common.ts` | Add memoized `hasOverlayScrollbars()` |
| `src/scss/component/stickyScrollbar.scss` | Add `.isHidden { pointer-events: none; }` |
| `src/ts/component/util/stickyScrollbar.stories.tsx` | Stories exercising `autoHide` in both states |

`grid.tsx` and `board.tsx` are untouched.
