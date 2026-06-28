# Flash-free scroll restoration (foundation + editor) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the flash-then-jump when opening an editor object by writing the saved scroll position *before the first paint*, anchored to a DOM element so it stays exact even when content height settles asynchronously.

**Architecture:** A pure, unit-tested core (`scrollAnchor.ts`: restore math + a settle-tracker state machine) and an additive `Storage` anchor API, composed by a shared `useScrollRestore` hook that (1) saves a `{ topmost-visible element id, viewport offset }` anchor on scroll and (2) restores it in a `useLayoutEffect` (React commit phase, pre-paint), then re-pins through the async settle window with a bounded `ResizeObserver`. This plan wires it into the editor only; set and chat are separate follow-on plans. The legacy pixel `getScroll` is kept as an additive fallback.

**Tech Stack:** TypeScript, React 18 (`useLayoutEffect`/`useRef`), MobX, vitest (node env), Electron/Chromium DOM (`ResizeObserver`, `elementFromPoint`).

## Global Constraints

- **No animations.** No added frames before content is visible; no post-paint scroll write on open. (Source: spec "Goal & constraints".)
- **Restore must be exact** even when final content height is unknown at first paint. (Source: spec.)
- **No unsolicited design/layout/color changes.** The only visual change permitted here is removing the editor open fade (explicitly approved). No CSS `aspect-ratio`/`content-visibility`/height-reservation changes. (Source: CLAUDE.md + spec.)
- **Code style:** tabs for indentation; `else if` on a new line after the closing brace; wrap logical parts of compound conditions in parentheses; collect class lists into a `cn` variable; never use raw `document.getElementById`/`querySelector` — use `U.Dom` helpers. (Source: CLAUDE.md.)
- **Scope:** editor only (`'editor'` storage key). Chat already scrolls instantly on open; set is a follow-on plan.
- Base branch is `develop`; work branch `perf/scroll-restore-flash` already exists. `develop` has ~101 pre-existing unrelated vitest failures — verify our new test file in isolation; never assume a green full suite.

---

### Task 1: Pure scroll-anchor core (restore math + settle tracker)

**Files:**
- Create: `src/ts/lib/util/scrollAnchor.ts`
- Test: `src/ts/lib/util/scrollAnchor.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `computeRestoreScrollTop(contentTop: number, viewportDelta: number): number` — `Math.max(0, contentTop - viewportDelta)`.
  - `class ScrollSettleTracker` with `constructor(options?: { stableFrames?: number; maxFrames?: number })`, `tick(top: number): boolean` (returns `true` while the re-pin loop should continue), `disarm(): void`, and getter `active: boolean`.

- [ ] **Step 1: Write the failing test**

```ts
// src/ts/lib/util/scrollAnchor.test.ts
import { describe, it, expect } from 'vitest';
import { computeRestoreScrollTop, ScrollSettleTracker } from './scrollAnchor';

describe('computeRestoreScrollTop', () => {
	it('subtracts the saved viewport delta from the element content-top', () => {
		expect(computeRestoreScrollTop(1000, 40)).toBe(960);
	});

	it('clamps to zero when the element is above the viewport top', () => {
		expect(computeRestoreScrollTop(10, 40)).toBe(0);
	});
});

describe('ScrollSettleTracker', () => {
	it('continues until N consecutive equal measurements, then stops', () => {
		const t = new ScrollSettleTracker({ stableFrames: 2, maxFrames: 60 });
		expect(t.tick(100)).toBe(true);  // first sample, equalCount 0
		expect(t.tick(100)).toBe(true);  // equalCount 1
		expect(t.tick(100)).toBe(false); // equalCount 2 -> settled
	});

	it('resets the equal-run when the measurement changes', () => {
		const t = new ScrollSettleTracker({ stableFrames: 2, maxFrames: 60 });
		t.tick(100);
		t.tick(100); // equalCount 1
		expect(t.tick(200)).toBe(true);  // changed -> reset to 0
		expect(t.tick(200)).toBe(true);  // equalCount 1
		expect(t.tick(200)).toBe(false); // equalCount 2 -> settled
	});

	it('stops at the frame cap even if never stable', () => {
		const t = new ScrollSettleTracker({ stableFrames: 99, maxFrames: 3 });
		expect(t.tick(1)).toBe(true);
		expect(t.tick(2)).toBe(true);
		expect(t.tick(3)).toBe(false); // 3rd frame hits maxFrames
	});

	it('stops immediately once disarmed', () => {
		const t = new ScrollSettleTracker({ stableFrames: 2, maxFrames: 60 });
		t.tick(100);
		t.disarm();
		expect(t.tick(100)).toBe(false);
		expect(t.active).toBe(false);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/ts/lib/util/scrollAnchor.test.ts`
Expected: FAIL — `Failed to resolve import './scrollAnchor'` / `computeRestoreScrollTop is not a function`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/ts/lib/util/scrollAnchor.ts

/**
 * scrollTop that puts an element now at `contentTop` (its top relative to the
 * scroll content) back at the saved on-screen position `viewportDelta` (the
 * element-top minus the viewport-top at save time). Clamped to >= 0.
 */
const computeRestoreScrollTop = (contentTop: number, viewportDelta: number): number => {
	return Math.max(0, contentTop - viewportDelta);
};

interface SettleOptions {
	stableFrames?: number;
	maxFrames?: number;
};

/**
 * Decides when a post-restore re-pin loop should stop. Feed it the resulting
 * scrollTop after each re-pin via tick(); it returns true while the loop should
 * keep running, false once content is stable (N consecutive equal measurements),
 * the frame cap is reached, or the user has scrolled (disarm()).
 */
class ScrollSettleTracker {

	private stableFrames: number;
	private maxFrames: number;
	private last: number | null = null;
	private equalCount = 0;
	private frames = 0;
	private disarmed = false;

	constructor (options: SettleOptions = {}) {
		this.stableFrames = options.stableFrames ?? 2;
		this.maxFrames = options.maxFrames ?? 60;
	};

	tick (top: number): boolean {
		if (this.disarmed) {
			return false;
		};

		this.frames++;

		if ((this.last !== null) && (this.last === top)) {
			this.equalCount++;
		} else {
			this.equalCount = 0;
		};
		this.last = top;

		if ((this.equalCount >= this.stableFrames) || (this.frames >= this.maxFrames)) {
			return false;
		};
		return true;
	};

	disarm () {
		this.disarmed = true;
	};

	get active (): boolean {
		return !this.disarmed && (this.frames < this.maxFrames);
	};

};

export { computeRestoreScrollTop, ScrollSettleTracker };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test src/ts/lib/util/scrollAnchor.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/ts/lib/util/scrollAnchor.ts src/ts/lib/util/scrollAnchor.test.ts
git commit -m "feat(scroll): pure restore math + settle tracker for flash-free restore"
```

---

### Task 2: Storage anchor API

**Files:**
- Modify: `src/ts/lib/storage.ts` (key sets at 6-36; add methods after `getScrollKey`, ~L510)

**Interfaces:**
- Consumes: existing `this.get`/`this.set`/`this.isLocal`/`this.getScrollKey`.
- Produces:
  - `Storage.setScrollAnchor(key: string, rootId: string, anchor: { id: string; offset: number } | null, isPopup: boolean)` — persists, or deletes when `anchor` is null/empty.
  - `Storage.getScrollAnchor(key: string, rootId: string, isPopup: boolean): { id: string; offset: number } | null`.

This task has no unit test (Storage depends on the Electron/localStorage backend, which the node test env does not provide). It is verified by `typecheck` and exercised end-to-end by Task 5's manual trace.

- [ ] **Step 1: Register the `scrollAnchor` storage key**

In `src/ts/lib/storage.ts`, add `'scrollAnchor'` to **both** `SPACE_KEYS` (after `'scroll',` at L13) and `LOCAL_KEYS` (after `'scroll',` at L31), so the anchor blob persists in the same local store as `scroll`:

```ts
// SPACE_KEYS — after line 13 ('scroll',)
	'scrollAnchor',
```
```ts
// LOCAL_KEYS — after line 31 ('scroll',)
	'scrollAnchor',
```

- [ ] **Step 2: Add the anchor get/set methods**

Insert immediately after `getScrollKey` (after L510), mirroring the existing `setScroll`/`getScroll` shape:

```ts
	/**
	 * Sets the element-anchored scroll position for a root object.
	 * @param {string} key - The scroll key.
	 * @param {string} rootId - The root object ID.
	 * @param {{ id: string; offset: number } | null} anchor - Topmost element id + viewport offset, or null to clear.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 */
	setScrollAnchor (key: string, rootId: string, anchor: { id: string; offset: number } | null, isPopup: boolean) {
		key = this.getScrollKey(key, isPopup);

		const obj = this.get('scrollAnchor', this.isLocal('scrollAnchor')) || {};
		try {
			obj[key] = obj[key] || {};

			if (anchor && anchor.id) {
				obj[key][rootId] = { id: String(anchor.id), offset: Number(anchor.offset) || 0 };
			} else {
				delete obj[key][rootId];
			};

			this.set('scrollAnchor', obj, this.isLocal('scrollAnchor'));
		} catch (e) { console.warn('[Storage] scroll anchor save failed:', e); };
		return obj;
	};

	/**
	 * Gets the element-anchored scroll position for a root object.
	 * @param {string} key - The scroll key.
	 * @param {string} rootId - The root object ID.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 * @returns {{ id: string; offset: number } | null} The saved anchor, or null.
	 */
	getScrollAnchor (key: string, rootId: string, isPopup: boolean): { id: string; offset: number } | null {
		key = this.getScrollKey(key, isPopup);

		const obj = this.get('scrollAnchor', this.isLocal('scrollAnchor')) || {};
		const v = (obj[key] || {})[rootId];

		return (v && v.id) ? { id: String(v.id), offset: Number(v.offset) || 0 } : null;
	};
```

- [ ] **Step 3: Verify types**

Run: `bun run typecheck`
Expected: PASS (no new errors referencing storage.ts).

- [ ] **Step 4: Commit**

```bash
git add src/ts/lib/storage.ts
git commit -m "feat(storage): additive setScrollAnchor/getScrollAnchor for element-anchored restore"
```

---

### Task 3: `U.Dom.elementFromPoint` helper

**Files:**
- Modify: `src/ts/lib/util/dom.ts` (add a method next to `getScrollContainer`, ~L169)

**Interfaces:**
- Produces: `U.Dom.elementFromPoint(x: number, y: number): HTMLElement | null` — the single `U.Dom`-sanctioned wrapper so the editor anchor resolver does an O(1) hit-test instead of scanning every block (and satisfies CLAUDE.md's no-raw-DOM rule).

No unit test (node env has no layout); verified by `typecheck` and used in Task 5.

- [ ] **Step 1: Add the wrapper**

In `src/ts/lib/util/dom.ts`, after `getScrollContainerTop` (L173):

```ts
	elementFromPoint (x: number, y: number): HTMLElement | null {
		return document.elementFromPoint(x, y) as HTMLElement | null;
	};
```

- [ ] **Step 2: Verify types**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/ts/lib/util/dom.ts
git commit -m "feat(dom): add U.Dom.elementFromPoint wrapper"
```

---

### Task 4: `useScrollRestore` hook

**Files:**
- Create: `src/ts/hook/useScrollRestore.ts`
- Modify: `src/ts/hook/index.ts` (export)

**Interfaces:**
- Consumes: `computeRestoreScrollTop`, `ScrollSettleTracker` (Task 1); `Storage.getScroll`/`setScroll`/`getScrollAnchor`/`setScrollAnchor` (Task 2); `U.Dom.getScrollContainer`/`addEvent`/`removeEvent`.
- Produces: default export `useScrollRestore(props): { saveScroll: () => void }` where
  ```ts
  interface UseScrollRestoreProps {
      rootId: string;
      isPopup: boolean;
      storageKey: string;                              // 'editor' | 'set'
      ready: boolean;                                  // content committed & measurable
      getAnchor: () => { id: string; offset: number } | null;        // SAVE: read current topmost-visible anchor
      getRestoreTop: (anchor: { id: string; offset: number }) => number | null;  // RESTORE: target scrollTop
      beforeRestore?: () => void;                      // synchronous pre-write work
      getObserveTarget?: () => HTMLElement | null;     // element whose resize re-pins
  };
  ```

No unit test (React + DOM + `ResizeObserver`, none available in node env). Verified by `typecheck`/`lint` here and by the editor manual trace in Task 5. The unit-tested `ScrollSettleTracker` carries the loop-termination logic.

- [ ] **Step 1: Write the hook**

```ts
// src/ts/hook/useScrollRestore.ts
import { useLayoutEffect, useRef } from 'react';
import { U, Storage } from 'Lib';
import { computeRestoreScrollTop, ScrollSettleTracker } from 'Lib/util/scrollAnchor';

interface Anchor {
	id: string;
	offset: number;
};

interface UseScrollRestoreProps {
	rootId: string;
	isPopup: boolean;
	storageKey: string;
	ready: boolean;
	getAnchor: () => Anchor | null;
	getRestoreTop: (anchor: Anchor) => number | null;
	beforeRestore?: () => void;
	getObserveTarget?: () => HTMLElement | null;
};

const SETTLE = { stableFrames: 2, maxFrames: 60 };

const useScrollRestore = (props: UseScrollRestoreProps) => {
	const { rootId, isPopup, storageKey, ready, getAnchor, getRestoreTop, beforeRestore, getObserveTarget } = props;

	const observerRef = useRef<ResizeObserver | null>(null);
	const trackerRef = useRef<ScrollSettleTracker | null>(null);
	const scrollOffRef = useRef<(() => void) | null>(null);
	const lastWrittenRef = useRef(-1);

	// Persist both the legacy pixel position (fallback) and the element anchor (exact).
	const saveScroll = () => {
		const container = U.Dom.getScrollContainer(isPopup);
		if (!container) {
			return;
		};

		Storage.setScroll(storageKey, rootId, container.scrollTop, isPopup);
		Storage.setScrollAnchor(storageKey, rootId, getAnchor(), isPopup);
	};

	const cleanup = () => {
		observerRef.current?.disconnect();
		observerRef.current = null;
		trackerRef.current = null;

		if (scrollOffRef.current) {
			scrollOffRef.current();
			scrollOffRef.current = null;
		};
	};

	// Resolve the target scrollTop: prefer the element anchor, fall back to pixel.
	const resolveTop = (): number | null => {
		const anchor = Storage.getScrollAnchor(storageKey, rootId, isPopup);
		if (anchor) {
			const t = getRestoreTop(anchor);
			if (t !== null) {
				return t;
			};
		};

		const px = Storage.getScroll(storageKey, rootId, isPopup);
		return px || null;
	};

	const writeTop = (top: number): number => {
		const container = U.Dom.getScrollContainer(isPopup);
		if (container) {
			container.scrollTop = top;
			lastWrittenRef.current = container.scrollTop;
			return container.scrollTop;
		};
		return 0;
	};

	useLayoutEffect(() => {
		cleanup();

		if (!ready) {
			return;
		};

		const target = resolveTop();
		if (target === null) {
			return;  // nothing saved (fresh object) — leave at the top
		};

		// Pre-paint: size the document, then position. The first painted frame is correct.
		beforeRestore?.();
		writeTop(target);

		// Settle: async content (media decode, lazy mount) can change geometry after this
		// commit. Re-pin to the anchor until stable, the frame cap, or first user scroll.
		const observeTarget = getObserveTarget?.();
		if (!observeTarget || (typeof ResizeObserver === 'undefined')) {
			return cleanup;
		};

		const tracker = new ScrollSettleTracker(SETTLE);
		trackerRef.current = tracker;

		const rePin = () => {
			const t = resolveTop();
			const landed = writeTop(t === null ? 0 : t);
			if (!tracker.tick(landed)) {
				cleanup();
			};
		};

		const observer = new ResizeObserver(rePin);
		observer.observe(observeTarget);
		observerRef.current = observer;

		// First genuine user scroll disarms the loop so we never fight the user. Our own
		// writeTop sets lastWrittenRef, so a matching scrollTop is ignored as self-induced.
		const container = U.Dom.getScrollContainer(isPopup);
		if (container) {
			const onUserScroll = () => {
				const c = U.Dom.getScrollContainer(isPopup);
				if (c && (Math.abs(c.scrollTop - lastWrittenRef.current) <= 1)) {
					return;
				};
				tracker.disarm();
				cleanup();
			};

			U.Dom.addEvent(container, 'scroll', onUserScroll);
			scrollOffRef.current = () => U.Dom.removeEvent(container, 'scroll', onUserScroll);
		};

		return cleanup;
	}, [ rootId, ready ]);

	return { saveScroll };
};

export default useScrollRestore;
```

- [ ] **Step 2: Export from the hook barrel**

Replace the contents of `src/ts/hook/index.ts`:

```ts
export { default as useScrollRestore } from './useScrollRestore';
```

- [ ] **Step 3: Verify types and lint**

Run: `bun run typecheck && bun run lint src/ts/hook/useScrollRestore.ts`
Expected: PASS. (If `U.Dom.addEvent`/`removeEvent` signatures differ, match them — they are used in `component/block/chat.tsx` L219-231 with `(target, eventName, handler)`.)

- [ ] **Step 4: Commit**

```bash
git add src/ts/hook/useScrollRestore.ts src/ts/hook/index.ts
git commit -m "feat(hook): useScrollRestore — pre-paint element-anchored scroll restore"
```

---

### Task 5: Wire the editor (save + pre-paint restore + filler hoist + focus reconcile)

**Files:**
- Modify: `src/ts/component/editor/page.tsx` — import (L1); render effect restore (L77-85); `open()` focus (via `focusInit` L191-228); `onScroll` save (L2064-2072); `resizePage` filler measure (L2844-2874).

**Interfaces:**
- Consumes: `useScrollRestore` (Task 4); `computeRestoreScrollTop` (Task 1); `U.Dom.elementFromPoint` (Task 3); `Storage.getScrollAnchor`/`getScroll` (Task 2).
- Produces: editor opens already positioned at the saved scroll, with no top-then-jump.

This task is verified by `typecheck` + `lint` + a **manual DevTools trace** (node env cannot test layout). Its deliverable only works with all four sub-changes together (hook, save, filler hoist, focus reconcile), so they ship as one task.

- [ ] **Step 1: Import `useLayoutEffect` and the hook helpers**

At the top of `page.tsx`, add `useLayoutEffect` to the React import (L1 currently imports `useEffect`, `useRef`, etc.) and add:

```ts
import { useScrollRestore } from 'Hook';
import { computeRestoreScrollTop } from 'Lib/util/scrollAnchor';
```

- [ ] **Step 2: Extract the `#blockLast` filler measure so it can run pre-paint**

In `resizePage`, the filler-height block currently lives inside the `raf` (L2850-2870). Extract its body into a standalone function defined in the component, and call it from both places. Add:

```ts
	const applyLastBlockHeight = () => {
		const node = nodeRef.current;
		if (!node) {
			return;
		};

		const blocks = U.Dom.select('.blocks', node);
		const last = U.Dom.select('#blockLast', node);
		const scrollContainer = U.Dom.getScrollContainer(isPopup);

		if (!blocks || !last || !scrollContainer) {
			return;
		};

		U.Dom.css(last, { height: '' });

		const commentSection = U.Dom.select('.commentSection', node);
		const csh = commentSection ? commentSection.offsetHeight : 0;
		const counter = U.Dom.select('.commentCounter', node);

		if (!csh) {
			const ct = scrollContainer.getBoundingClientRect().top;
			const ch = scrollContainer.clientHeight;
			const bt = blocks.getBoundingClientRect().top + window.scrollY;
			const bh = blocks.offsetHeight;

			let height = ch - ct - bt - bh - 8;
			height = Math.max(J.Size.lastBlock, height);

			U.Dom.css(last, { height: `${height}px` });
			U.Dom.addClass(counter, 'isFixed');
		} else {
			U.Dom.removeClass(counter, 'isFixed');
		};
	};
```

Then **replace** the inline filler block inside `resizePage`'s `raf` (the `setLayoutWidth(...)` line stays; L2850-2870's `if (blocks && last && scrollContainer) { ... }` block) with a single call:

```ts
			setLayoutWidth(U.Data.getLayoutWidth(rootId));
			applyLastBlockHeight();

			tocRef.current?.resize?.();
			callBack?.();
```

- [ ] **Step 3: Add the editor anchor resolver/restorer and call the hook**

Add these helpers and the hook call inside the component (near `initNodes`, after L103):

```ts
	const getScrollAnchor = (): { id: string; offset: number } | null => {
		const container = U.Dom.getScrollContainer(isPopup);
		if (!container) {
			return null;
		};

		const cr = container.getBoundingClientRect();
		const x = cr.left + Math.min(40, cr.width / 2);
		const y = cr.top + 1;

		let el = U.Dom.elementFromPoint(x, y);
		while (el && (el !== container) && !((el.id || '').startsWith('block-'))) {
			el = el.parentElement;
		};

		if (!el || !(el.id || '').startsWith('block-')) {
			return null;
		};

		const id = el.id.replace(/^block-/, '');
		const r = el.getBoundingClientRect();

		return { id, offset: (r.top - cr.top) };
	};

	const getScrollRestoreTop = (anchor: { id: string; offset: number }): number | null => {
		const container = U.Dom.getScrollContainer(isPopup);
		const el = U.Dom.get(`block-${U.Common.esc(anchor.id)}`);

		if (!container || !el) {
			return null;
		};

		const cr = container.getBoundingClientRect();
		const r = el.getBoundingClientRect();
		const contentTop = (r.top - cr.top) + container.scrollTop;

		return computeRestoreScrollTop(contentTop, anchor.offset);
	};

	const { saveScroll } = useScrollRestore({
		rootId,
		isPopup,
		storageKey: 'editor',
		ready: !!root,
		getAnchor: getScrollAnchor,
		getRestoreTop: getScrollRestoreTop,
		beforeRestore: applyLastBlockHeight,
		getObserveTarget: () => container.current,
	});
```

- [ ] **Step 4: Remove the old post-paint restore from the render effect**

In the render effect (L77-85), drop the `scrollTopRef`-based restore from the `resizePage` callback (the hook now owns restore). Change:

```ts
		resizePage(() => {
			if (scrollTopRef.current) {
				const sc = U.Dom.getScrollContainer(isPopup);
				if (sc) {
					sc.scrollTop = scrollTopRef.current;
				};
				scrollTopRef.current = 0;
			};
		});
```
to:
```ts
		resizePage();
```

Also delete the now-unused `scrollTopRef` declaration (L40) and the `scrollTopRef.current = Storage.getScroll('editor', rootId, isPopup);` line in `open()` (L122).

- [ ] **Step 5: Save the anchor on scroll**

In `onScroll` (L2064-2072) replace the pixel-only save with the hook's `saveScroll` (which writes both pixel and anchor):

```ts
	const onScroll = () => {
		const { isPopup } = props;

		saveScroll();
		tocRef.current?.onScroll();
		Preview.previewHide(false);
	};
```

- [ ] **Step 6: Reconcile focus-on-open so restore wins**

In `focusInit` (L227), skip `focus.scroll` when a saved scroll exists for this object (otherwise it yanks the viewport to the restored cursor). Replace L225-227:

```ts
		const hasSavedScroll = !!Storage.getScrollAnchor('editor', rootId, isPopup) || !!Storage.getScroll('editor', rootId, isPopup);

		focus.set(block.id, { from, to });
		focus.apply();

		if (!hasSavedScroll) {
			focus.scroll(isPopup, block.id);
		};
```

- [ ] **Step 7: Verify types and lint**

Run: `bun run typecheck && bun run lint src/ts/component/editor/page.tsx`
Expected: PASS, with no remaining reference to `scrollTopRef`.

- [ ] **Step 8: Manual trace verification**

Build/run dev (`bun run start:dev`). Then:
1. Open a long document, scroll to the middle, navigate away, navigate back. **Expected:** it opens already at the middle — no visible frame at the top, no jump.
2. Repeat scrolled near the bottom (exercises the `#blockLast` filler hoist) — lands exactly, no clamp-then-snap.
3. Repeat on a doc with images/embeds above the fold — lands exactly; the `ResizeObserver` re-pins silently as media decodes.
4. Record a DevTools performance trace of an open: confirm there is **no post-paint scroll write** and the first painted frame is already positioned. This is the objective success metric.
5. Type in the doc after open — cursor focus still works; scrolling by hand disarms re-pin (no fighting).

- [ ] **Step 9: Commit**

```bash
git add src/ts/component/editor/page.tsx
git commit -m "feat(editor): pre-paint element-anchored scroll restore (no flash, no jump)"
```

---

### Task 6: Remove the editor open fade

**Files:**
- Modify: `src/ts/component/page/main/edit.tsx` (L44-51)

**Interfaces:**
- Consumes: nothing.
- Produces: object open paints content immediately (no 0.12s opacity ramp), removing the latency that partly masked the flash.

- [ ] **Step 1: Drop the opacity transition on the editor wrapper**

In `edit.tsx`, remove the `initial`/`animate`/`exit` opacity props from the `motion.div` (L49-51) while keeping `key={rootId}` for remount:

```tsx
			<AnimatePresence mode="wait">
				<motion.div
					key={rootId}
					id="bodyWrapper"
					className="wrapper"
				>
```

(If lint flags `AnimatePresence`/`motion` as now-unused because no other transition remains in this file, replace the `motion.div` with a plain `div` and remove the `AnimatePresence` wrapper and the `framer-motion` import. Otherwise leave them.)

- [ ] **Step 2: Verify types and lint**

Run: `bun run typecheck && bun run lint src/ts/component/page/main/edit.tsx`
Expected: PASS.

- [ ] **Step 3: Manual check**

Run dev; open several objects. **Expected:** content appears instantly with no fade-in; combined with Task 5, no flash and no jump.

- [ ] **Step 4: Commit**

```bash
git add src/ts/component/page/main/edit.tsx
git commit -m "perf(editor): remove 0.12s open fade for instant, flash-free open"
```

---

### Task 7: Integration verification & handoff

**Files:** none (verification only).

- [ ] **Step 1: Full typecheck and lint**

Run: `bun run typecheck && bun run lint`
Expected: PASS (no new errors from this branch).

- [ ] **Step 2: Run the new unit tests in isolation**

Run: `bun run test src/ts/lib/util/scrollAnchor.test.ts`
Expected: PASS (4 tests). (The full suite has ~101 pre-existing unrelated failures on `develop`; do not gate on it.)

- [ ] **Step 3: Cross-surface smoke (regression guard)**

Run dev and confirm **no regression** on surfaces this plan did not change: open a set, open a chat — both still behave as before (set restores via its own poll loop; chat opens at bottom/unread). These are addressed by the follow-on plans, not here.

- [ ] **Step 4: QA + docs**

- Run `/qa-engineer` for the editor open/scroll-restore flow.
- Run `/update-docs` if the hook addition warrants a note in `docs/src/ts/hook/README.md`.
- `/dark-mode-check` is **not** needed (no SCSS/SVG changed; the fade removal is TSX only).

- [ ] **Step 5: Final commit (if QA/doc artifacts were generated)**

```bash
git add -A
git commit -m "test(editor): scroll-restore E2E coverage + hook docs"
```

---

## Follow-on plans (out of scope here)

- **Set** (`page/main/set.tsx`): delete the 50 ms poll loop (L96-118); adopt `useScrollRestore` with `storageKey: 'set'`, a row-id anchor resolver, and `getObserveTarget = () => bodyRef.current`. Needs the per-view stable-row-id audit (grid/board/list/gallery/calendar) and the unmounted-virtual-row fallback decision from the spec.
- **Chat** (`block/chat.tsx`): de-flash only — make the open/restore landing happen in the layout phase where possible; keep open-at-bottom/first-unread; force `animate=false` on any open/restore path that could reach `scrollToMessage(..., true)`.

## Self-review

- **Spec coverage:** Pre-paint restore (Tasks 4-5) ✓; element anchoring exact under async height (Tasks 1,4,5 + ResizeObserver settle) ✓; pixel fallback (Tasks 2,4) ✓; `#blockLast` hoist (Task 5 Step 2) ✓; focus-vs-restore reconcile (Task 5 Step 6) ✓; remove fade (Task 6) ✓; no CSS layout changes ✓; editor-first, set/chat deferred ✓. Set/chat phases intentionally deferred to follow-on plans (noted above).
- **Placeholder scan:** No TBD/TODO; every code step shows complete code; manual-verification steps list exact procedures.
- **Type consistency:** `{ id, offset }` anchor shape is identical across `Storage` (Task 2), the hook props (Task 4), and the editor resolver/restorer (Task 5). `computeRestoreScrollTop(contentTop, viewportDelta)` and `ScrollSettleTracker.tick/disarm/active` names match between Task 1 and Task 4. Hook returns `{ saveScroll }`, consumed in Task 5 Step 5.
- **Known tuning point (not a blocker):** the user-scroll-vs-self-write discrimination in the hook (`lastWrittenRef` ±1) and the `maxFrames: 60` cap are the manual-trace tuning targets in Task 5 Step 8; the unit-tested `ScrollSettleTracker` guarantees the loop always terminates.
