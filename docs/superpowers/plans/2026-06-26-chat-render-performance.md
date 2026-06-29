# Chat Render/Scroll Performance — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan phase-by-phase. Each phase ships independently as its own PR.
>
> **Revised after plan-verification (2026-06-26):** 6 critical defects in the first draft were corrected — see the inline ⚠️ notes. The biggest: **rows are already observers** (`vite.auto-observer.ts` rewrites default exports), so this plan does **not** add `mobx-react`; the lever is prop stability + making `isFirst`/`isLast` observable.

**Goal:** Remove the layout-thrash and re-render-cascade costs that make scrolling a large chat into the past jank (trace: ~10 s forced layout vs 1.64 s React over 60 s; 70 long tasks = 17.96 s).

**Architecture:** Ordered by *measured* impact: (1) stop `renderDates` dirtying layout every frame, (2) IntersectionObserver read-receipt visibility, (3) make the *already-present* `memo`/`observer` actually hold (stable props) + observable `isFirst`/`isLast` + O(1) store lookup, (4) memoize message HTML. Virtualization is deferred + gated.

**Tech Stack:** React 18, MobX + `mobx-react` (auto-injected via `vite.auto-observer.ts`), TypeScript (tabs), Electron renderer, vitest.

## Global Constraints

- **Tabs**; `else if` on a new line; parenthesize compound conditions; collect JSX class lists into a `cn` var.
- `U.Dom` helpers (no raw `document.querySelector`); no jQuery.
- After every change: `bun run typecheck` and `bun run lint` must pass; `bun run test` for units.
- Do not change colors/spacing/sizes. Do not regress native `overflow-anchor` viewport stability (verified on-device).
- Preserve exactly: sticky-date behavior; `scrollToMessage`/jump; the read-receipt band `bottom ∈ [0, container.offsetHeight − formHeight]` (no over-marking — `C.ChatReadMessages` is irreversible); MobX reactivity for reactions/edits/read-status/grouping (no stale rows).
- **Do NOT add `import { observer } from 'mobx-react'` or change `export default`** — `vite.auto-observer.ts` already wraps `export default memo(ChatMessage)` → `memo(observer(ChatMessage))` and `export default BlockChat` → `observer(BlockChat)`. `<Message>` is already an observer; `memo` is real but defeated by unstable props.
- Each phase: capture a before/after DevTools flamechart (commit count + scripting + **forced-layout** self-time) for scroll-up lazy-load, steady scroll, reaction toggle.

---

## File Structure

- **Modify** `src/ts/component/block/chat.tsx` — `renderDates`→CSS-var (P1); IO viewport scan + ref-setter (P2); stable `useCallback` handlers + curated Message props + store-backed lookups (P3); add `useCallback` to the `react` import.
- **Modify** `src/ts/component/block/chat/message/index.tsx` — derive `hasMore` + rebind `(e,id)` handlers at call sites + `<Reply>` override + drop the 2nd `getMessageById` (P3); hoisted `React.useMemo` HTML (P4). **No export/observer change.**
- **Modify** `src/ts/component/block/chat/reply.tsx` — none expected (receives row-bound `onReplyClick` via override).
- **Modify** `src/ts/store/chat.ts` — `Map<id,message>` index built in `set()`, maintained in `prepend`/`append` (P3).
- **Modify** `src/ts/model/chatMessage.ts` — `isFirst`/`isLast` observable (P3).
- **Modify** `src/ts/interface/block/chat.ts` — `ChatMessageComponent` signatures (P3).
- **Modify** chat SCSS (`src/scss/block/chat.scss` / `message/date.scss`) — `position: sticky` date headers (P1).

---

## Phase 1 — Stop `renderDates` dirtying layout every frame (~2.3 s)

**Files:** `src/ts/component/block/chat.tsx` (`renderDates`, its callers), chat/date SCSS.

⚠️ **Corrected:** the current `renderDates` already does write-pass-then-read-pass (one forced layout/frame); the cost is that it **dirties layout every frame** (resets `position:static` on all dates, then reads). Do **not** reorder reads ahead of the static reset — that measures the previously-`fixed` date out of flow and mis-selects the header (broken in popups). The fix is to stop doing per-frame layout writes.

- [ ] **Step 1: Baseline flamechart (no code).** Scroll up; record `getBoundingClientRect` self-time attributed to the `renderDates` rAF (~2.3 s) and forced `Layout` count.

- [ ] **Step 2 (primary): CSS `position: sticky` date headers.** Give `.sectionDate` (in the chat scroll list) `position: sticky; top: var(--chat-sticky-top, 0px); z-index: 1;` and an **opaque background** so it overlays messages. Set `--chat-sticky-top` on the scroll container/`.scroll` element equal to `J.Size.header + 8 + pinnedBannerHeight`. Update the var only when the header/pinned-banner height changes — replace the `renderDates` rAF body with a tiny function that sets the CSS var; call it from the existing `pinnedMessages.length` `useLayoutEffect` and `resize()` (NOT per scroll frame). Remove the per-frame `renderDates()` call from `onScroll`.

- [ ] **Step 3: Verify visually + re-profile.** Floating current-date matches today (sticks at the right offset, overlays messages, swaps at section boundaries, correct in **popup** and full layouts). Re-capture: the `renderDates`/`getBoundingClientRect` self-time during scroll drops to ~0.

- [ ] **Step 4 (fallback, only if sticky is visually wrong): per-change JS.** Keep `renderDates` JS but track the currently-pinned date id; run the reset+repin writes **only when the chosen date changes**, so unchanged frames do no layout write and the read hits clean layout. Keep today's all-static-reset-before-read order (do not reorder).

- [ ] **Step 5: Typecheck, lint, commit.**

```bash
git add src/ts/component/block/chat.tsx src/scss/block/chat.scss
git commit -m "perf(chat): sticky-position date headers (drop per-frame layout work in renderDates)"
```

---

## Phase 2 — IntersectionObserver read-receipt visibility (~2 s/frame)

**Files:** `src/ts/component/block/chat.tsx`.

Replace the per-frame `getMessagesInViewport` `getBoundingClientRect` scan with an IO maintaining `visibleIds`. **Keep `getMessageScrollOffset` and the legacy band** for the synchronous post-jump path (Step 5).

- [ ] **Step 1: Refs.**

```tsx
	const visibleIds = useRef<Set<string>>(new Set());
	const viewportObserver = useRef<IntersectionObserver | null>(null);
```

- [ ] **Step 2: Create the IO in `rebind`, using GEOMETRY (not `isIntersecting`).** ⚠️ `threshold:0 + isIntersecting` over-marks (fires on any overlap; legacy requires the *bottom* edge inside the band). Use `boundingClientRect.bottom` vs `rootBounds`:

```tsx
		const container = U.Dom.getScrollContainer(isPopup);
		if (container) {
			const formNode = formRef.current?.getNode() as HTMLElement;
			const formHeight = formNode ? formNode.offsetHeight : 0;

			viewportObserver.current?.disconnect();
			viewportObserver.current = new IntersectionObserver((entries) => {
				entries.forEach((e) => {
					const id = (e.target as HTMLElement).getAttribute('data-viewport-id') || '';
					if (!id) return;
					const rb = e.rootBounds;
					// Legacy band: a message counts as read only when its BOTTOM edge is within
					// [rootBounds.top, rootBounds.bottom] (rootBounds already has -formHeight applied).
					const visible = !!rb && (e.boundingClientRect.bottom >= rb.top) && (e.boundingClientRect.bottom <= rb.bottom);
					if (visible) {
						visibleIds.current.add(id);
					} else {
						visibleIds.current.delete(id);
					};
				});
			}, { root: container, rootMargin: `0px 0px -${formHeight}px 0px`, threshold: [ 0, 1 ] });

			// ⚠️ Rows mount during commit, BEFORE this useEffect runs, and the stable ref-setter
			// (P3) never re-invokes — so observe all currently-mounted rows now.
			Object.keys(messageRefs.current).forEach((id) => {
				const node = messageRefs.current[id]?.getNode?.() as HTMLElement;
				if (node) { node.setAttribute('data-viewport-id', id); viewportObserver.current.observe(node); };
			});
		};
```

In `unbind`: `viewportObserver.current?.disconnect(); viewportObserver.current = null; visibleIds.current.clear();`.

- [ ] **Step 3: Observe/unobserve per row.** In the `<Message>` ref callback (or P3's `getRefSetter`), on attach: `node.setAttribute('data-viewport-id', id); viewportObserver.current?.observe(node);`. On detach (ref === null), read the node from `messageRefs.current[id]?.getNode?.()` **before** deleting, then `unobserve`. ⚠️ Do not call `ref.getNode()` in the null branch (ref is null).

- [ ] **Step 4: Rebuild the IO on form-height change.** ⚠️ `resize()` does NOT call `rebind()`. Recreate the IO when the form height changes: either rebuild inside `resize()` (recompute `formHeight`, new IO, re-observe mounted rows — factor Step 2 into a `bindViewportObserver()` helper and call it from both `rebind` and `resize`), or attach a `ResizeObserver` to the form node that rebuilds `rootMargin`.

- [ ] **Step 5: Swap the per-frame scan; keep a synchronous post-jump fallback.**

```tsx
	const getMessagesInViewport = () => {
		const ids = visibleIds.current;
		return getMessages().filter((it: any) => ids.has(it.id));
	};
```

⚠️ IO callbacks are **async**, so `visibleIds` is stale immediately after a programmatic `scrollTop` write. `readScrolledMessages` is called synchronously right after `scrollToMessage`/`scrollToBottom`/the focus handler set `scrollTop`. For those settle-point reads, compute the set synchronously from `getMessageScrollOffset` + the legacy band (retain that code path) rather than from `visibleIds`. The per-*frame* `onScroll` read uses `visibleIds`.

- [ ] **Step 6: Equivalence check + origin verify.** Before merge, compare the IO-derived id set to the legacy `getMessageScrollOffset` band across ≥3 scripted scroll positions (no over/under-marking). ⚠️ Verify `#page` `getBoundingClientRect().top ≈ 0` in popup and full layouts; if not, compare `boundingClientRect.bottom` against absolute `0`/`offsetHeight−formHeight` to match the legacy viewport-absolute band, or document the `rootBounds.top` origin.

- [ ] **Step 7: Typecheck, lint, manual verify (read accuracy, multi-line form, popup), commit.**

```bash
git add src/ts/component/block/chat.tsx
git commit -m "perf(chat): IntersectionObserver read-receipt visibility (drop per-frame layout scan)"
```

---

## Phase 3 — Make the existing memo hold (stable props + observable grouping + O(1) store)

**Files:** `src/ts/model/chatMessage.ts`, `src/ts/store/chat.ts`, `src/ts/component/block/chat.tsx`, `src/ts/component/block/chat/message/index.tsx`, `src/ts/interface/block/chat.ts`.

⚠️ No observer conversion (auto-observer already did it). The win comes entirely from stabilizing `<Message>`'s props so the existing `memo` stops re-rendering all rows on each parent commit, plus making grouping observable.

- [ ] **Step 1 (MANDATORY first): `isFirst`/`isLast` observable.** In `src/ts/model/chatMessage.ts`, add `isFirst` and `isLast` to the `makeObservable({...})` call (declared but absent; mutated by `getSections`). Without this, an already-observer row renders stale avatar/tail grouping after a prepend.

- [ ] **Step 2: Store O(1) `getMessageById` — build the index in `set()`.** ⚠️ `add()`/`delete()` route through `set()`, which re-wraps the list into **new** `M.ChatMessage` instances; maintaining the index inside `add()`/`delete()` would store stale instances. So:
  - Add `private messageByIdMap: Map<string, Map<string, any>> = new Map();`
  - In `set(subId, list)`, after `this.messageMap.set(subId, arr)`: `this.messageByIdMap.set(subId, new Map(arr.map((m: any) => [ m.id, m ])));` (from the FINAL deduped/re-wrapped array).
  - In `prepend`/`append` (in-place mutators that skip `set()`): add each new `M.ChatMessage` to the inner map; on the eviction `splice`, capture the removed entries and delete their ids from the inner map.
  - In `clear`/`clearAll`: drop the id / inner map.
  - `getMessageById(subId, id)`: `return this.messageByIdMap.get(subId)?.get(id) || this.getList(subId).find((it: any) => it.id == id);` (fallback preserves correctness if cold).
  - **Unit test:** after set/prepend/append/add/delete/evict, `getMessageById` returns the same instance as `.find` (and the instance stored in `messageMap`); eviction removes the id from the index.

- [ ] **Step 3: Add `useCallback` import + stable handlers in `chat.tsx`.** ⚠️ Add `useCallback` to the `react` import (currently absent → build fails). Then:

```tsx
	const onContextMenuCb = useCallback((e: any, id: string) => onContextMenu(e, S.Chat.getMessageById(subId, id)), [ subId, readonly, analyticsChatId ]);
	const onMoreCb = useCallback((e: any, id: string) => onContextMenu(e, S.Chat.getMessageById(subId, id), true), [ subId, readonly, analyticsChatId ]);
	const onReplyEditCb = useCallback((e: any, id: string) => onReplyEdit(e, S.Chat.getMessageById(subId, id)), [ subId ]);
	const onReplyClickCb = useCallback((e: any, id: string) => onReplyClick(e, S.Chat.getMessageById(subId, id)), [ subId, analyticsChatId ]);
	const getReplyContentCb = useCallback(getReplyContent, [ subId ]);
	const scrollToBottomCb = useCallback(scrollToBottomCheck, []);
	const getMessageMenuOptionsCb = useCallback(getMessageMenuOptions, [ subId, analyticsChatId, readonly ]); // ⚠️ MUST be stable or memo is defeated
```

(Confirm no stale-closure on `readonly`/`analyticsChatId` — include them in deps as above.)

- [ ] **Step 4: Stable per-id ref-setter factory** (also wires the P2 observe/unobserve):

```tsx
	const refSetters = useRef<Map<string, (r: any) => void>>(new Map());
	const getRefSetter = (id: string) => {
		let fn = refSetters.current.get(id);
		if (!fn) {
			fn = (r: any) => {
				if (r) {
					messageRefs.current[id] = r;
					const node = r.getNode?.() as HTMLElement;
					if (node) { node.setAttribute('data-viewport-id', id); viewportObserver.current?.observe(node); };
				} else {
					const node = messageRefs.current[id]?.getNode?.() as HTMLElement;
					if (node) viewportObserver.current?.unobserve(node);
					delete messageRefs.current[id];
				};
			};
			refSetters.current.set(id, fn);
		};
		return fn;
	};
```

Prune `refSetters.current` alongside `messageRefs.current = {}` in `unbind` and in `loadMessagesByOrderId`.

- [ ] **Step 5: Curate the `<Message>` props — ENUMERATE them** (⚠️ dropping `{...props}` silently removes *optional* `BlockComponent` fns that crash `init()` at runtime). Replace the render-map element with exactly:

```tsx
		<Message
			ref={getRefSetter(item.id)}
			key={item.id}
			id={item.id}
			rootId={chatId}
			blockId={block.id}
			subId={subId}
			analyticsChatId={analyticsChatId}
			isNew={item.orderId == firstUnreadOrderId}
			readonly={readonly}
			isPopup={isPopup}
			style={undefined}
			renderMentions={renderMentions}
			renderObjects={renderObjects}
			renderLinks={renderLinks}
			renderEmoji={renderEmoji}
			onContextMenu={onContextMenuCb}
			onMore={onMoreCb}
			onReplyEdit={onReplyEditCb}
			onReplyClick={onReplyClickCb}
			getReplyContent={getReplyContentCb}
			scrollToBottom={scrollToBottomCb}
			getMessageMenuOptions={getMessageMenuOptionsCb}
		/>
```

Drop the inline `hasMore={...}` and `index={i}`. (Confirm `renderMentions/Objects/Links/Emoji`, `readonly`, `isPopup` are referentially stable from BlockChat's props — they are passed straight down.)

- [ ] **Step 6: `message/index.tsx` — derive `hasMore`, rebind `(e,id)` at every call site, override `onReplyClick` on `<Reply>`, drop the 2nd `getMessageById`. NO export change.**
  - Destructure the new props incl. `onMore`, `onReplyClick`, `getMessageMenuOptions`.
  - `const hasMore = !!getMessageMenuOptions(message, true).length;` (replaces the parent's inline computation).
  - Rebind handlers to **this row's id** at their bare call sites: `controls.push({ ... onClick: e => onReplyEdit(e, id) ... })` (was `onClick: onReplyEdit`, line ~301); `controls.push({ ... onClick: e => onMore(e, id) ... })` (line ~304); `<motion.div ... onContextMenu={e => onContextMenu(e, id)} ...>` (line ~379).
  - ⚠️ `<Reply {...props} id={replyToMessageId} onReplyClick={e => onReplyClick(e, id)} />` — the override **after** `{...props}` (Reply does `onClick={onReplyClick}` with only `(e)`; without binding, `getMessageById(undefined)` crashes).
  - In `canAddReaction`, drop the second `S.Chat.getMessageById(subId, id)` — use the `message` already in scope.
  - Keep `init()` running per commit (now rare under memo) or key its `useEffect` on `[ id, message.modifiedAt ]`. Bias to correctness.

- [ ] **Step 7: `interface/block/chat.ts` — exact types.** `onContextMenu/onMore/onReplyEdit/onReplyClick: (e: any, id: string) => void`; remove `hasMore` and `index`; add `getMessageMenuOptions: (message: I.ChatMessage, noControls: boolean, url?: string, targetId?: string) => I.Option[]`; keep `getReplyContent` and `scrollToBottom`.

- [ ] **Step 8: Typecheck, lint, unit tests, manual verify, commit.** Manual (DevTools "Highlight updates"): a reaction toggle re-renders exactly one row; a prepend re-renders only changed rows; reactions/edits/read-status/grouping update without staleness; jump/highlight still work (`useImperativeHandle` forwarding — already an observer+forwardRef, unchanged). Re-profile: per-prepend commit count collapses; `offsetWidth` + `sanitize` self-time drop sharply.

```bash
git add src/ts/model/chatMessage.ts src/ts/store/chat.ts src/ts/component/block/chat.tsx src/ts/component/block/chat/message/index.tsx src/ts/interface/block/chat.ts
git commit -m "perf(chat): stabilize message props + observable grouping + O(1) store (stop re-render cascade)"
```

**Recommended ship point: after Phase 3.** `MAX_MESSAGES` may then rise conservatively behind measurement.

---

## Phase 4 — Memoize message HTML (`Mark.toHtml` + `sanitize`)

**Files:** `src/ts/component/block/chat/message/index.tsx`.

⚠️ Hooks must run unconditionally — **hoist above the `if (!message) return null` guard (line ~241)**; the current `text` computation (line ~259) is after that guard.

- [ ] **Step 1: One top-level `React.useMemo`** (placed right after `const message = S.Chat.getMessageById(subId, id)` at line ~31; `useMemo` is not in the named imports, use `React.useMemo`), null-guarded, computing all sanitized strings the render needs:
  - main text + per-code-run HTML keyed on `[ message?.content?.text, message?.content?.marks ]`;
  - per-block HTML keyed on `[ message?.blocks ]` (⚠️ blocks are replaced wholesale on each `ChatUpdate`; do NOT key block HTML on `content.text/marks` → stale after a blocks edit).
  - Return a `{ text, blockHtml: Map<number,string>, codeRunHtml: string[] }`-shaped object; JSX maps over the precomputed values.
  - ⚠️ Do NOT call `useMemo` inside `renderBlocks`/`codeRuns.map` (variable hook count is illegal).

- [ ] **Step 2: Typecheck, lint, manual verify (text/marks/blocks/code/edits render correctly), commit.**

```bash
git add src/ts/component/block/chat/message/index.tsx
git commit -m "perf(chat): memoize message HTML transform (avoid re-sanitizing on re-render)"
```

---

## Phase 5 — Deferred / gated: virtualization (+ keep sticky dates from P1)

**Only after P1–P4 ship and re-profile, and only if mounted-node count / cold-mount / memory still gate a larger cap.**

- [ ] **Gate spike (standalone, packaged Electron):** prove native `overflow-anchor` holds when an estimated-height spacer above the viewport resizes — under prepend, prepend-at-cap-with-tail-evict, and fling. If it fails, do NOT virtualize; raise `MAX_MESSAGES` as far as memory allows on the P1–P4 architecture.
- [ ] **If it passes:** flow-layout windowing (top/bottom spacer divs around a contiguous run of mounted rows) on the shared `#page` scroller — NOT a nested/absolute virtualizer. Date headers stay model-driven (P1 sticky still applies). Reuse the P2 IO for read-receipts. ⚠️ **Force-mount the jump target before `scrollToMessage`** — its retry loop needs `getMessageScrollPosition` non-zero, which requires the target row mounted (`messageRefs.current[id].getNode()`); ensure spacer height doesn't break the `offsetTop` math. Prefer hand-rolled over a library fought off its layout.

---

## Risk register (from verification)

- **P1 sticky visual mismatch / popup offset** → visual gate in both layouts; JS-per-change fallback (Step 4). Never reorder reads ahead of the static reset.
- **P2 over-marking reads** (irreversible) → geometry-based callback (bottom ∈ rootBounds), not `isIntersecting`; equivalence check before merge.
- **P2 initially-mounted rows unobserved** → observe all mounted rows right after creating the IO; rebuild on form-height change; sync fallback for post-jump reads.
- **P3 already-observer** → do NOT add `mobx-react`/change export; keep `memo`. **`isFirst`/`isLast` must be observable** (Step 1).
- **P3 memo silently defeated** → `useCallback` ALL handlers incl. `getMessageMenuOptions`; enumerate the curated prop list (render* fns are optional → no typecheck catch); render-count assertion.
- **P3 `(e,id)` signature breaks Reply / bare handlers** → rebind at every call site (controls `onMore`/`onReplyEdit`, `onContextMenu`, and `<Reply onReplyClick>` override after spread).
- **P3 store index stale instances** → build in `set()` from the final array; only `prepend`/`append` maintain manually.
- **P4 rules-of-hooks** → single hoisted `React.useMemo` above the early return; no hooks in loops; blocks keyed on `[message.blocks]`.
- **Build:** add `useCallback` to the `react` import.

## Self-Review

Spec §Design.1→P1, .2→P2, .3→P3, .4→P4, .5→P5. Every verification must-fix is reflected in a step or the risk register. Type touch-points: `getMessageById (subId,id):I.ChatMessage` unchanged; `(e,id)` signatures introduced (P3 S3), consumed (P3 S6) and typed (P3 S7) consistently; `useCallback`/`React.useMemo` imports addressed; `visibleIds`/`viewportObserver` defined P2, reused by P3 `getRefSetter`.
