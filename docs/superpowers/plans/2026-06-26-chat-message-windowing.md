# Chat Message Windowing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the chat from silently losing newer messages when scrolling up, by turning the in-memory message list into a bidirectional sliding window that re-fetches transparently when scrolling back toward an evicted edge.

**Architecture:** The decision logic (edge detection, eviction count, forward re-fetch, live-add suppression) is extracted into a pure, global-free module (`Lib/util/chatWindow`) that is unit-tested. The store (`S.Chat`) holds per-`subId` edge flags (`atChatStart`/`atChatEnd`, default `true`) and reports eviction; the chat component reads/sets those flags, adds a symmetric scroll-down re-fetch with an in-flight guard and a forced re-render, and fixes the conflated `isLoaded` guard. The window cap rises 500→1000 only after the `onScroll` cost is bounded.

**Tech Stack:** TypeScript, React 18 (the chat block is NOT a MobX `observer` — it re-renders via `setDummy`), MobX stores, vitest for unit tests, Electron renderer. Tabs for indentation.

## Global Constraints

- **Indentation: tabs**, never spaces (all `.ts`/`.tsx`/`.scss`).
- `else if` on a new line after `}`; wrap compound-condition parts in parentheses (`(a > b) && (c < d)`).
- Collect JSX class lists into a `cn` variable before `return`.
- Never use raw `document.getElementById`/`querySelector` — use `U.Dom` helpers. No jQuery/`$`.
- All UI text via `translate()`; keys in `src/json/text.json`.
- Do not change colors, spacing, sizes, or any design value.
- Chat page size = `J.Constant.limit.chat.messages` = **50**. Target window cap = **1000**.
- After every code change run `bun run typecheck` and `bun run lint`; both must pass.
- Run unit tests with `bun run test` (vitest). Tests live beside source as `*.test.ts`.
- `BlockChat` (`src/ts/component/block/chat.tsx`) is **not** wrapped in `observer`; store mutations do not re-render it — a `setDummy(v => v + 1)` is required to render store changes.

---

## File Structure

- **Create** `src/ts/lib/util/chatWindow.ts` — pure windowing decision helpers (no store/DOM/global deps).
- **Create** `src/ts/lib/util/chatWindow.test.ts` — vitest unit tests for the helpers.
- **Modify** `src/ts/store/chat.ts` — `MAX_MESSAGES`; per-`subId` edge-flag maps + getters/setters; `prepend`/`append` return `evicted` and set flags; `add` tail-insert routing + live-add suppression; `clear` resets flags.
- **Modify** `src/ts/component/block/chat.tsx` — edge-flag wiring (replace `isLoadedPrev`), `isLoaded`→`atChatEnd` guard, `isLoadingNext` + dir>0 prefetch + `setDummy`-on-append, edge recompute in `loadMessagesByOrderId`, "new messages" affordance, `onScroll` rAF coalescing.
- **Modify** `src/scss/page/main/chat.scss` (or the chat scroll container rule) — explicit `overflow-anchor`.

---

### Task 1: Pure windowing helpers

**Files:**
- Create: `src/ts/lib/util/chatWindow.ts`
- Test: `src/ts/lib/util/chatWindow.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `evictedCount(lengthAfterInsert: number, max: number): number`
  - `reachedEdge(pageLength: number, limit: number): boolean`
  - `edgesAfterJump(beforeLength: number, afterLength: number, limit: number): { atChatStart: boolean; atChatEnd: boolean }`
  - `shouldRefetchForward(atChatEnd: boolean, isBottom: boolean, isLoadingNext: boolean): boolean`
  - `shouldSuppressLiveAdd(atChatEnd: boolean, messageOrderId: string, lastWindowOrderId: string): boolean`

- [ ] **Step 1: Write the failing test**

Create `src/ts/lib/util/chatWindow.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { evictedCount, reachedEdge, edgesAfterJump, shouldRefetchForward, shouldSuppressLiveAdd } from './chatWindow';

describe('chatWindow', () => {
	it('evictedCount returns overflow past max, else 0', () => {
		expect(evictedCount(550, 500)).toBe(50);
		expect(evictedCount(500, 500)).toBe(0);
		expect(evictedCount(10, 500)).toBe(0);
	});

	it('reachedEdge is true only for a short page', () => {
		expect(reachedEdge(49, 50)).toBe(true);
		expect(reachedEdge(50, 50)).toBe(false);
		expect(reachedEdge(0, 50)).toBe(true);
	});

	it('edgesAfterJump derives both edges from before/after page lengths', () => {
		expect(edgesAfterJump(25, 25, 50)).toEqual({ atChatStart: true, atChatEnd: true });
		expect(edgesAfterJump(50, 10, 50)).toEqual({ atChatStart: false, atChatEnd: true });
		expect(edgesAfterJump(50, 50, 50)).toEqual({ atChatStart: false, atChatEnd: false });
	});

	it('shouldRefetchForward only when not at end, at window bottom, and not already loading', () => {
		expect(shouldRefetchForward(false, true, false)).toBe(true);
		expect(shouldRefetchForward(true, true, false)).toBe(false);
		expect(shouldRefetchForward(false, false, false)).toBe(false);
		expect(shouldRefetchForward(false, true, true)).toBe(false);
	});

	it('shouldSuppressLiveAdd only for a genuinely-newer message while not at end', () => {
		expect(shouldSuppressLiveAdd(false, '!z', '!m')).toBe(true);
		expect(shouldSuppressLiveAdd(true, '!z', '!m')).toBe(false);
		expect(shouldSuppressLiveAdd(false, '!a', '!m')).toBe(false);
		expect(shouldSuppressLiveAdd(false, '!z', '')).toBe(false);
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test -- chatWindow`
Expected: FAIL — `Cannot find module './chatWindow'`.

- [ ] **Step 3: Write the implementation**

Create `src/ts/lib/util/chatWindow.ts`:

```ts
/**
 * Pure decision helpers for the chat sliding-window.
 * No store / DOM / global dependencies — keep this module unit-testable.
 */

/**
 * How many messages are evicted when a list of `lengthAfterInsert` is trimmed to `max`.
 * Returns 0 when the list is within bounds.
 */
export const evictedCount = (lengthAfterInsert: number, max: number): number => {
	return Math.max(0, lengthAfterInsert - max);
};

/**
 * A fetched page shorter than the requested `limit` means the chat boundary
 * (oldest when paging back, newest when paging forward) was reached.
 */
export const reachedEdge = (pageLength: number, limit: number): boolean => {
	return pageLength < limit;
};

/**
 * Edge flags after rebuilding the window around an orderId (jump / deeplink / unread divider),
 * derived from the actual before/after page lengths so the flags are not guessed.
 */
export const edgesAfterJump = (beforeLength: number, afterLength: number, limit: number): { atChatStart: boolean; atChatEnd: boolean } => {
	return { atChatStart: reachedEdge(beforeLength, limit), atChatEnd: reachedEdge(afterLength, limit) };
};

/**
 * Whether scrolling down should fetch newer messages to refill an evicted tail.
 */
export const shouldRefetchForward = (atChatEnd: boolean, isBottom: boolean, isLoadingNext: boolean): boolean => {
	return (!atChatEnd) && isBottom && (!isLoadingNext);
};

/**
 * Whether a live message must be suppressed: it is genuinely newer than the window's
 * last message while the window is not anchored at the chat end, so appending it would
 * place it out of order after an evicted tail. orderIds are lexids (lexicographic compare).
 */
export const shouldSuppressLiveAdd = (atChatEnd: boolean, messageOrderId: string, lastWindowOrderId: string): boolean => {
	return (!atChatEnd) && (!!lastWindowOrderId) && (messageOrderId > lastWindowOrderId);
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun run test -- chatWindow`
Expected: PASS (5 tests).

- [ ] **Step 5: Typecheck, lint, commit**

Run: `bun run typecheck && bun run lint`
Expected: no errors.

```bash
git add src/ts/lib/util/chatWindow.ts src/ts/lib/util/chatWindow.test.ts
git commit -m "feat(chat): add pure windowing decision helpers"
```

---

### Task 2: Store edge-flag state + eviction reporting

**Files:**
- Modify: `src/ts/store/chat.ts` (`MAX_MESSAGES`, new flag maps + accessors, `prepend`, `append`, `clear`)

**Interfaces:**
- Consumes: `evictedCount` (Task 1).
- Produces (on `S.Chat`):
  - `isAtChatStart(subId: string): boolean` (default `true`)
  - `isAtChatEnd(subId: string): boolean` (default `true`)
  - `setAtChatStart(subId: string, v: boolean): void`
  - `setAtChatEnd(subId: string, v: boolean): void`
  - `prepend(subId, add): boolean` and `append(subId, add): boolean` now **return** whether they evicted.

- [ ] **Step 1: Raise the cap and add the flag maps**

In `src/ts/store/chat.ts`, change the constant (currently `const MAX_MESSAGES = 500;`):

```ts
const MAX_MESSAGES = 1000;
```

> NOTE: leave the value at `1000` here, but the scroll-cost hardening (Task 7) must land before this plan is shipped — it is sequenced after this task only because the store edits are foundational. If executing strictly incrementally and worried about perf in interim manual testing, temporarily keep `500` and flip to `1000` in Task 8.

Add the import at the top of the file (the file already imports from `mobx`, `Interface`, `Model`):

```ts
import { evictedCount } from 'Lib/util/chatWindow';
```

Add two plain maps as class fields next to the existing `messageMap` declaration:

```ts
	private atChatStartMap: Map<string, boolean> = new Map();
	private atChatEndMap: Map<string, boolean> = new Map();
```

- [ ] **Step 2: Add the accessors**

Add these methods to `ChatStore` (place them near `getList`):

```ts
	isAtChatStart (subId: string): boolean {
		const v = this.atChatStartMap.get(subId);
		return v === undefined ? true : v;
	};

	isAtChatEnd (subId: string): boolean {
		const v = this.atChatEndMap.get(subId);
		return v === undefined ? true : v;
	};

	setAtChatStart (subId: string, v: boolean): void {
		this.atChatStartMap.set(subId, v);
	};

	setAtChatEnd (subId: string, v: boolean): void {
		this.atChatEndMap.set(subId, v);
	};
```

- [ ] **Step 3: Make `prepend` report eviction and flip `atChatEnd`**

Replace the body of `prepend` (currently `list.unshift(...add); if (list.length > MAX_MESSAGES) { list.splice(MAX_MESSAGES); };`):

```ts
	prepend (subId: string, add: I.ChatMessage[]): boolean {
		const list = this.getList(subId);
		const ids = new Set(list.map(it => it.id));

		add = (add || []).filter(it => !ids.has(it.id));
		add = add.map(it => new M.ChatMessage(it));

		list.unshift(...add);

		const evicted = evictedCount(list.length, MAX_MESSAGES);
		if (evicted) {
			list.splice(MAX_MESSAGES);
			this.setAtChatEnd(subId, false);
		};

		return evicted > 0;
	};
```

- [ ] **Step 4: Make `append` report eviction and flip `atChatStart`**

Replace the body of `append` (currently `list.push(...add); if (list.length > MAX_MESSAGES) { list.splice(0, list.length - MAX_MESSAGES); };`):

```ts
	append (subId: string, add: I.ChatMessage[]): boolean {
		const list = this.getList(subId);
		const ids = new Set(list.map(it => it.id));

		add = (add || []).filter(it => !ids.has(it.id));
		add = add.map(it => new M.ChatMessage(it));

		list.push(...add);

		const evicted = evictedCount(list.length, MAX_MESSAGES);
		if (evicted) {
			list.splice(0, evicted);
			this.setAtChatStart(subId, false);
		};

		return evicted > 0;
	};
```

- [ ] **Step 5: Reset flags in `clear`**

In `clear(subId)` (currently deletes `messageMap`/`replyMap`/`attachmentsMap`), add:

```ts
		this.atChatStartMap.delete(subId);
		this.atChatEndMap.delete(subId);
```

- [ ] **Step 6: Typecheck, lint, commit**

Run: `bun run typecheck && bun run lint`
Expected: no errors. (No store unit test — the store depends on ambient globals not wired in vitest; correctness of the eviction math is covered by `evictedCount` tests in Task 1.)

```bash
git add src/ts/store/chat.ts
git commit -m "feat(chat): store tracks window edges and reports eviction"
```

---

### Task 3: Live-add routing + suppression in `S.Chat.add`

**Files:**
- Modify: `src/ts/store/chat.ts` (`add`)

**Interfaces:**
- Consumes: `shouldSuppressLiveAdd`, `evictedCount` (Task 1); `isAtChatEnd`, `setAtChatStart` (Task 2).
- Produces: `add` now suppresses out-of-order tail inserts and trims the head (like `append`) for tail inserts; head inserts (`idx == 0`, previews) are untouched.

Context: `add` is called from the dispatcher for live messages with `idx = list.length` (tail) and from `data.ts` previews with `idx = 0` (head). Default `atChatEnd = true` means non-open / preview subIds are never suppressed.

- [ ] **Step 1: Rewrite `add`**

Replace the current `add` (currently: dedup via `getMessageById`, then `list.splice(idx, 0, param); this.set(subId, list);`):

```ts
	add (subId: string, idx: number, param: I.ChatMessage): void {
		const list = this.getList(subId);
		const item = this.getMessageById(subId, param.id);

		if (item) {
			return;
		};

		const isTail = idx >= list.length;

		// A genuinely-newer live message while the window is not at the chat end would land
		// after an evicted tail (out of order). Suppress it; it is fetched on scroll-down /
		// jump-to-bottom. Non-open and preview subIds keep atChatEnd === true (default).
		if (isTail) {
			const last = list.length ? list[list.length - 1] : null;
			if (shouldSuppressLiveAdd(this.isAtChatEnd(subId), param.orderId, last ? last.orderId : '')) {
				return;
			};
		};

		list.splice(idx, 0, param);

		// Tail insert behaves like append: trim the oldest head if over the cap.
		if (isTail) {
			const evicted = evictedCount(list.length, MAX_MESSAGES);
			if (evicted) {
				list.splice(0, evicted);
				this.setAtChatStart(subId, false);
			};
		};

		this.set(subId, list);
	};
```

Update the chatWindow import line from Task 2 to include the new helper:

```ts
import { evictedCount, shouldSuppressLiveAdd } from 'Lib/util/chatWindow';
```

- [ ] **Step 2: Typecheck, lint, commit**

Run: `bun run typecheck && bun run lint`
Expected: no errors.

```bash
git add src/ts/store/chat.ts
git commit -m "feat(chat): suppress out-of-order live inserts past an evicted tail"
```

---

### Task 4: Component edge-flag wiring + guard fix

**Files:**
- Modify: `src/ts/component/block/chat.tsx` (`loadMessages` dir>0 guard, dir<0/dir>0 reached-edge, `subscribeMessages`, `loadMessagesByOrderId`, remove `isLoadedPrev`)

**Interfaces:**
- Consumes: `S.Chat.isAtChatEnd`/`setAtChatEnd`/`setAtChatStart` (Task 2); `edgesAfterJump`, `reachedEdge` (Task 1).
- Produces: the dir>0 re-fetch is now gated on `atChatEnd`; jumps set both edges correctly.

Context: the working tree currently has `isLoadingPrev`/`isLoadedPrev` refs (uncommitted). This task replaces the `isLoadedPrev` ref with the store flag; `isLoadingPrev` stays.

- [ ] **Step 1: Add the chatWindow import**

At the top of `chat.tsx`, add:

```ts
import { edgesAfterJump, reachedEdge } from 'Lib/util/chatWindow';
```

- [ ] **Step 2: Remove the `isLoadedPrev` ref, keep `isLoadingPrev`, add `isLoadingNext`**

Find the ref declarations (working tree has `const isLoadingPrev = useRef(false);` and `const isLoadedPrev = useRef(false);`). Replace those two lines with:

```ts
	const isLoadingPrev = useRef(false);
	const isLoadingNext = useRef(false);
```

(`atChatStart`/`atChatEnd` now live in the store, keyed by `subId` — no component ref.)

- [ ] **Step 3: Replace every `isLoadedPrev.current` read/write**

Search `chat.tsx` for `isLoadedPrev` and replace each usage:
- The dir<0 guard `if (isLoadingPrev.current || isLoadedPrev.current) { return; }` → `if (isLoadingPrev.current || S.Chat.isAtChatStart(subId)) { return; }`
- The dir<0 reached-oldest write `isLoadedPrev.current = true;` → `S.Chat.setAtChatStart(subId, true);`
- The resets in `init` / `loadMessagesByOrderId` / the `clear` path (`isLoadedPrev.current = false;` and `isLoadingPrev.current = false;`) → drop the `isLoadedPrev` line (store `clear` resets the flag, default `true`); keep `isLoadingPrev.current = false;` and add `isLoadingNext.current = false;` beside it.

- [ ] **Step 4: Fix the dir>0 guard (the core bug)**

Find `if (!clear && (dir > 0) && isLoaded) { setIsBottom(true); return; };` in `loadMessages`. Replace with:

```ts
			if (!clear && (dir > 0) && S.Chat.isAtChatEnd(subId)) {
				setIsBottom(true);
				return;
			};
```

(Leave the `isLoaded` React state and `setLoaded` everywhere else — they still drive `isEmpty`/`<Empty/>`.)

- [ ] **Step 5: Set `atChatEnd` when a dir>0 fetch reaches the newest**

In the dir>0 branch of the `C.ChatGetMessages` callback, find the block that handles a short page (currently `if (messages.length < J.Constant.limit.chat.messages) { setLoaded(true); setIsBottom(true); subscribeMessages(false); } else { setIsBottom(false); };`). Add the flag set in the short-page branch:

```ts
				if (dir > 0) {
					if (reachedEdge(messages.length, J.Constant.limit.chat.messages)) {
						S.Chat.setAtChatEnd(subId, true);
						setLoaded(true);
						setIsBottom(true);
						subscribeMessages(false);
					} else {
						setIsBottom(false);
					};
				} else {
```

- [ ] **Step 6: Anchor `atChatEnd = true` on the clear/last-page load**

In `subscribeMessages`, inside the `loadDepsAndReplies` callback, where it currently does `if (clear) { S.Chat.set(subId, messages); }`, add directly after the `S.Chat.set`:

```ts
				if (clear) {
					S.Chat.set(subId, messages);
					S.Chat.setAtChatEnd(subId, true);
					S.Chat.setAtChatStart(subId, reachedEdge(messages.length, J.Constant.limit.chat.messages));
				};
```

- [ ] **Step 7: Derive both edges from the jump fetch lengths**

In `loadMessagesByOrderId`, the two nested `C.ChatGetMessages` calls fetch `limit` before and after the orderId into `list`. Capture each page length and set the flags in the inner callback before `callBack?.()`. Replace the inner `loadDepsAndReplies(list, () => { S.Chat.set(subId, list); callBack?.(); });` region so the lengths are recorded:

```ts
		const limit = Math.ceil(J.Constant.limit.chat.messages / 2);
		let beforeLength = 0;
		let afterLength = 0;

		C.ChatGetMessages(chatId, orderId, '', limit, true, (message: any) => {
			if (!message.error.code && message.messages.length) {
				beforeLength = message.messages.length;
				list = list.concat(message.messages);
			};

			C.ChatGetMessages(chatId, '', orderId, limit, false, (message: any) => {
				if (!message.error.code && message.messages.length) {
					afterLength = message.messages.length;
					list = list.concat(message.messages);
				};

				loadDepsAndReplies(list, () => {
					S.Chat.set(subId, list);

					const edges = edgesAfterJump(beforeLength, afterLength, limit);
					S.Chat.setAtChatStart(subId, edges.atChatStart);
					S.Chat.setAtChatEnd(subId, edges.atChatEnd);

					callBack?.();
				});
			});
		});
```

(Keep the existing `isLoadingPrev`/`isLoadingNext` resets at the top of `loadMessagesByOrderId` from Step 3.)

- [ ] **Step 8: Typecheck, lint, commit**

Run: `bun run typecheck && bun run lint`
Expected: no errors. `grep -n isLoadedPrev src/ts/component/block/chat.tsx` must return nothing.

```bash
git add src/ts/component/block/chat.tsx
git commit -m "fix(chat): gate scroll-down re-fetch on atChatEnd, derive edges from fetches"
```

---

### Task 5: Scroll-down recovery (re-fetch + in-flight guard + forced render)

**Files:**
- Modify: `src/ts/component/block/chat.tsx` (`loadMessages` dir>0 path, `onScroll`)

**Interfaces:**
- Consumes: `isLoadingNext` (Task 4), `S.Chat.append` returning `evicted` (Task 2), `shouldRefetchForward` (Task 1).
- Produces: scrolling down past an evicted edge transparently appends the next page and re-renders.

- [ ] **Step 1: Guard the dir>0 fetch with `isLoadingNext`**

In `loadMessages`, in the non-`clear` `else` branch, mirror the existing dir<0 in-flight guard. Where the dir<0 guard sets `isLoadingPrev.current = true;` before `C.ChatGetMessages`, add a dir>0 sibling:

```ts
			if (dir > 0) {
				if (isLoadingNext.current) {
					return;
				};
				isLoadingNext.current = true;
			};
```

In the `C.ChatGetMessages` callback, at the very top (alongside the existing dir<0 `isLoadingPrev.current = false;` and in the `message.error.code` early-return), clear it:

```ts
				if (dir > 0) {
					isLoadingNext.current = false;
				};
```

(Place this clear both in the error early-return block and at the start of the success path, matching how `isLoadingPrev` is cleared.)

- [ ] **Step 2: Force a re-render after the dir>0 append**

The dir<0 path already does `setDummy(v => v + 1)` after a growing `prepend`. Add the dir>0 sibling. In the `loadDepsAndReplies` callback where the store mutation happens, after `S.Chat[(dir < 0 ? 'prepend' : 'append')](subId, messages);` and the existing dir<0 `setDummy`, add:

```ts
						if ((dir > 0) && (S.Chat.getList(subId).length > lengthBefore)) {
							setDummy(v => v + 1);
						};
```

(`lengthBefore` is the `S.Chat.getList(subId).length` captured before the prepend/append, already present in the working tree's dir<0 block — hoist its capture so it covers both directions.)

- [ ] **Step 3: Add the symmetric scroll-down prefetch trigger**

In `onScroll`, the working tree triggers load-older with a one-viewport threshold (`const threshold = container?.offsetHeight ?? 0; if (st <= threshold) loadMessages(-1, false);`) and triggers load-newer only `if (isBottom) loadMessages(1, false);`. Replace the load-newer trigger with a symmetric threshold gated by `shouldRefetchForward`:

```ts
			const threshold = container?.offsetHeight ?? 0;

			if (st <= threshold) {
				loadMessages(-1, false);
			};

			if ((max > 0) && (st >= (max - threshold)) && shouldRefetchForward(S.Chat.isAtChatEnd(subId), true, isLoadingNext.current)) {
				loadMessages(1, false);
			};
```

(`max` is the existing `U.Dom.getMaxScrollHeight(isPopup)` value in `onScroll`. Passing `true` for the `isBottom` argument of `shouldRefetchForward` is intentional — the `st >= max - threshold` check already establishes "near the bottom"; the helper then enforces `!atChatEnd && !isLoadingNext`.)

- [ ] **Step 4: Verify the auto-stick effect does not yank to bottom**

Confirm (read-only) that the dir>0 full-page branch still calls `setIsBottom(false)` before the async append (Task 4 Step 5 keeps `else { setIsBottom(false); }`), so the `useLayoutEffect([messages.length]) → scrollToBottomCheck()` no-ops on recovery (it only sticks when `isBottom.current` is true). No code change; this is an assertion to check after Steps 1-3.

- [ ] **Step 5: Typecheck, lint, manual verification, commit**

Run: `bun run typecheck && bun run lint`
Expected: no errors.

Manual (build + run — scroll behavior cannot be unit-tested in jsdom):
```bash
ELECTRON_SKIP_NOTARIZE=1 bun run dist:mac
./dist/mac-arm64/Anytype.app/Contents/MacOS/Anytype
```
In a chat with >1000 messages: scroll up well past the window, then scroll back down — the newer messages must reappear (no permanent gap, no "false bottom" stall longer than one page fetch), with no scroll jump.

```bash
git add src/ts/component/block/chat.tsx
git commit -m "feat(chat): bidirectional scroll-down re-fetch with in-flight guard"
```

---

### Task 6: "New messages" affordance for the suppressed-while-at-window-bottom case

**Files:**
- Modify: `src/ts/component/block/chat.tsx` (`setIsBottom`)

**Interfaces:**
- Consumes: `S.Chat.isAtChatEnd` (Task 2).
- Produces: the scroll-to-bottom / new-messages button shows when either not at the window bottom OR not at the chat end.

Context: `setIsBottom(v)` toggles the `#navigation-${I.ChatReadType.Message}` button's `active` class on `!v`. When `isBottom===true` but `atChatEnd===false`, a suppressed live message would otherwise show no indicator.

- [ ] **Step 1: Gate the button on `(!isBottom || !atChatEnd)`**

In `setIsBottom`, find the button toggle (currently `U.Dom.toggleClass(btn, 'active', !v);`). Replace with:

```ts
		if (btn) {
			const showNav = (!v) || (!S.Chat.isAtChatEnd(getSubId()));
			U.Dom.toggleClass(btn, 'active', showNav);
		};
```

- [ ] **Step 2: Typecheck, lint, manual verification, commit**

Run: `bun run typecheck && bun run lint`
Expected: no errors.

Manual: open a chat via the unread badge so it lands mid-history; the scroll-to-bottom button must be visible (because `!atChatEnd`) even though you may be at the window bottom.

```bash
git add src/ts/component/block/chat.tsx
git commit -m "fix(chat): show new-messages button when window bottom is not the chat end"
```

---

### Task 7: Bound the per-scroll cost (rAF-coalesce `onScroll`)

**Files:**
- Modify: `src/ts/component/block/chat.tsx` (the scroll handler binding in `rebind`/`resize`)

**Interfaces:**
- Consumes: nothing new.
- Produces: `onScroll` runs at most once per animation frame.

Context: `onScroll` calls `getMessagesInViewport()` which does a `getBoundingClientRect` per message every event; raising the window to 1000 doubles that. Coalescing to one run per frame removes the multi-fire-per-frame cost (the dominant factor) without a viewport-scan rewrite.

- [ ] **Step 1: Add a rAF-coalescing wrapper around the bound scroll handler**

Add a ref near the other refs:

```ts
	const scrollRafRef = useRef(0);
```

In `rebind` (and `resize`, wherever `scrollHandlerRef.current = (e: Event) => onScroll(e);` is set), wrap it so multiple scroll events within a frame collapse to one:

```ts
		scrollHandlerRef.current = (e: Event) => {
			if (scrollRafRef.current) {
				return;
			};
			scrollRafRef.current = raf(() => {
				scrollRafRef.current = 0;
				onScroll(e);
			});
		};
```

In the cleanup `useEffect` (where `raf.cancel(frameRef.current)` is called), also cancel this one:

```ts
			raf.cancel(scrollRafRef.current);
```

- [ ] **Step 2: Typecheck, lint, manual verification, commit**

Run: `bun run typecheck && bun run lint`
Expected: no errors.

Manual: scroll a large chat quickly; scrolling should stay smooth, sticky date header (`renderDates`) and read-tracking still update. Confirm no regression in load-older/newer triggering (they now fire at most once per frame, which is sufficient).

```bash
git add src/ts/component/block/chat.tsx
git commit -m "perf(chat): coalesce scroll handler to one run per frame"
```

> If profiling still shows jank at 1000 messages, that is the trigger to escalate to render virtualization (out of scope for this plan — note it for follow-up).

---

### Task 8: Raise the window cap to 1000

**Files:**
- Modify: `src/ts/store/chat.ts` (`MAX_MESSAGES`) — only if Task 2 temporarily kept 500.

- [ ] **Step 1: Confirm the cap value**

Ensure `src/ts/store/chat.ts` has `const MAX_MESSAGES = 1000;`. If Task 2 set it directly, this task is a no-op confirmation (the sequencing exists so the cap rises only after Task 7's scroll-cost fix is in place).

- [ ] **Step 2: Typecheck, lint, manual verification, commit (if changed)**

Run: `bun run typecheck && bun run lint`
Manual: in the 486-burst chat, scroll through the burst — the rest of the chat must not be evicted from view while within ~1000 messages; scrolling smooth (Task 7 in place).

```bash
git add src/ts/store/chat.ts
git commit -m "feat(chat): raise in-memory window to 1000 messages"
```

---

### Task 9: Explicit scroll anchoring + verification

**Files:**
- Modify: `src/scss/page/main/chat.scss` (chat scroll container rule)

**Interfaces:** none.

Context: the prepend/append paths rely on native `overflow-anchor` (default `auto`) to hold the viewport when content is inserted above / the head is evicted above. Make it explicit and verify on real Electron.

- [ ] **Step 1: Confirm nothing disables anchoring**

Run: `grep -rn "overflow-anchor" src/scss/`
Expected: no `overflow-anchor: none` on the chat scroll container or its ancestors.

- [ ] **Step 2: Add an explicit `overflow-anchor: auto` to the chat scroll container**

In `src/scss/page/main/chat.scss`, on the chat wrapper rule that owns the scroll area (the `.wrap`/`.scrollWrapper` block — match the existing selector that contains `.scrollWrapper { flex-grow: 1; }`), add a one-line own-property rule for the scroll wrapper:

```scss
.scrollWrapper { flex-grow: 1; overflow-anchor: auto; }
```

(Do not change any other property. If the actual scrolling element is the shared page container rather than `.scrollWrapper`, leave this as the explicit default and rely on Step 3's verification; do not add `overflow-anchor` to shared page selectors that affect non-chat pages.)

- [ ] **Step 3: Manual verification on real Electron (the load-bearing check)**

Build and run (commands as in Task 5). In a >1000-msg chat:
- Scroll up so an older page loads — the viewport must stay visually anchored (no jump by ~one page).
- Scroll down so a page appends and the head evicts — the viewport must stay anchored.
- Use fling/momentum scroll — confirm anchoring holds and the `focus` handler / `messages.length` layout effect do not fight it.

If anchoring fails under any of these, implement the documented fallback (measure `scrollHeight` before the store mutation and restore `scrollTop += scrollHeight_after − scrollHeight_before` in the post-commit layout effect) — but only if the native behavior proves unreliable.

- [ ] **Step 4: Lint, commit**

Run: `bun run lint`
Expected: no errors.

```bash
git add src/scss/page/main/chat.scss
git commit -m "fix(chat): make scroll anchoring explicit on the message scroll container"
```

---

## Self-Review

**Spec coverage:**
- §1 edge state (store-owned, default true) → Task 2.
- §2 set/reset table (subscribe-clear, jump, reached-edge, eviction, clear) → Tasks 2, 4.
- §3 reversible eviction + scroll-down recovery (guard fix, `isLoadingNext`, prefetch, `setDummy` on append) → Tasks 4, 5.
- §4 window size + `add` routed through append (no `add` cap) → Tasks 2, 3, 8.
- §5 live-add suppression keyed on `orderId`, scoped via default-true → Tasks 1, 3.
- §6 `isBottom × atChatEnd` affordance → Task 6.
- §7 scroll-cost hardening before the cap bump → Tasks 7, 8.
- §8 explicit `overflow-anchor` + verification → Task 9.
- §9 known limitations (popup/main shared subId, caches, interleaved) → documented in spec; no task (accepted/out of scope).
- Testing: pure helpers unit-tested (Task 1); store/component manual + typecheck/lint (each task).

**Type consistency:** `isAtChatStart`/`isAtChatEnd`/`setAtChatStart`/`setAtChatEnd` (Task 2) used verbatim in Tasks 3-6. `prepend`/`append` return `boolean` (Task 2) — the existing single call site captures it dynamically. Helper signatures (`shouldRefetchForward`, `shouldSuppressLiveAdd`, `edgesAfterJump`, `reachedEdge`, `evictedCount`) match between Task 1 definition and Tasks 2-6 usage.

**Placeholder scan:** no TBD/TODO; every code step shows complete code; manual-verification steps give exact build/run commands and observable expectations (scroll behavior is genuinely not jsdom-unit-testable — the decision logic that *is* testable was extracted into Task 1).
