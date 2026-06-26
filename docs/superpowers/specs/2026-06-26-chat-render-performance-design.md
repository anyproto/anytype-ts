# Chat render / scroll performance — design spec

**Date:** 2026-06-26
**Status:** Draft for review
**Area:** `src/ts/component/block/chat.tsx`, `src/ts/component/block/chat/message/index.tsx`, `src/ts/store/chat.ts`, chat SCSS
**Evidence:** 405 MB DevTools trace of scroll-to-past on a large chat (60.2s, 800k CPU samples) + a 23-agent design tournament.

## Problem

Scrolling a large chat into the past janks: 70 long tasks (≥50 ms) totalling **17.96 s** of multi-hundred-ms freezes over a 60 s session, main thread 65.6% busy.

The trace shows the dominant cost is **forced synchronous layout (layout thrashing), not React**:

| cost | self-time | share |
|---|---|---|
| Forced-layout getter reads (`getBoundingClientRect` + `scrollTop` + `offsetWidth`) | ~5.9 s | 9.8% |
| Forced **synchronous** `Layout` events (3305 of 3552 = 93%) | 3.24 s | — |
| DOMPurify `sanitize`/`parseFromString` (+ `Mark.toHtml`) | ~1.7 s | — |
| GC | 1.83 s | — |
| **All React reconcile + commit combined** | **1.64 s** | **2.7%** |

Attribution (nearest app source of each forced read):
- **`renderDates` (`chat.tsx`)** = **2.34 s** of forced `getBoundingClientRect`, every scroll frame — the single largest app cause. It writes `position:static` to *every* `.sectionDate`, then reads `getBoundingClientRect()` per date in a second loop → each read forces a full relayout.
- **`onScroll` → `getMessagesInViewport`** (read-receipt visibility) = ~2 s — `getMessages()` returns the whole list and the scan calls `getBoundingClientRect`+`offsetHeight` per message, plus `onScroll`'s own `scrollTop` read (1.45 s).
- **Lazy-load re-render cascade**: `memo(<Message>)` is defeated (fresh inline props each render), so each prepend re-renders all rows; the *direct* React cost is small (2.7%), but it re-triggers the per-row no-dep `useEffect`'s `offsetWidth` read (1.38 s) and `sanitize` re-runs during render (1.7 s) — these make the worst lazy-load task ~1.0 s.

Refuted by the trace: `getSections`/`getItems` are negligible (<0.1 s); `getMessageById` O(n) `.find` is 0.43 s (minor as CPU, but a reactivity trigger).

## Goals

- Eliminate the per-scroll-frame forced-layout thrash (the ~6 s of getter self-time + the 93%-forced `Layout` events).
- Cut the multi-hundred-ms lazy-load freezes (re-render cascade + `sanitize`).
- Keep frames within budget while scrolling a large chat; make a larger `MAX_MESSAGES` viable later.

## Non-goals

- Render virtualization — deferred (lowest CPU priority: React is only 2.7%). Its value is compounding (fewer rows shrink the `renderDates` loop and the viewport scan), so it lands last, gated on a separate on-device `overflow-anchor` spike.
- Changing the windowing correctness logic shipped in PR #2269 (edge flags, re-fetch, epoch guard) — this is purely render/scroll cost.
- Raising `MAX_MESSAGES` — a separate memory-budget decision, enabled by this work, made behind measurement.

## Hard constraints (must be preserved)

- **Sticky date headers**: the current date floats at the top of the viewport while scrolling within its day, offset by the chat header + pinned banner.
- **`scrollToMessage` / reply / deeplink / pinned jumps** and the `messageRefs` per-row DOM refs.
- **Native `overflow-anchor`** viewport stability on prepend (verified on-device — do not regress).
- **Read-receipts**: a message is marked read when its bottom is within `[0, container.offsetHeight − formHeight]`. New mechanism must reproduce this band (no over-marking — `C.ChatReadMessages` is an irreversible side effect).
- **MobX reactivity**: messages mutate in place (reactions/edits/read-status); any `memo`/`observer` change must not go stale. **Verified prerequisite:** `isFirst`/`isLast` are declared on `M.ChatMessage` but **absent from `makeObservable`**, yet mutated by `getSections` — they must be made observable before `<Message>` becomes an observer.

## Design — ordered by measured impact

### 1. Kill `renderDates` per-frame layout work (biggest single win, ~2.3 s)

Correction after verification: `renderDates` is *already* write-pass-then-read-pass, so it forces **one** synchronous relayout per scroll frame, not N. The cost is that it **dirties layout every frame** — it resets `position:static` on every `.sectionDate` (a write) then reads `getBoundingClientRect`, forcing a full relayout of the large DOM each frame. So "batch reads before writes" does **not** help (already batched), and naively reordering reads ahead of the static reset is incorrect (it measures the previously-pinned date while it is `position:fixed`/out-of-flow, mis-selecting the floating header — fails outright in popups where the container top > 0).

**Primary fix: CSS `position: sticky`.** Replace the JS reposition with `position: sticky; top: var(--chat-sticky-top)` on `.sectionDate` (flat siblings give native sticky-until-next-header behavior), an opaque background + z-index so it overlays messages, and `--chat-sticky-top` (= header + pinned-banner height) updated **only** when the banner/header height changes (not per frame). This removes the per-frame JS and the per-frame layout-dirtying entirely. Gated on a visual match to today's floating date.

**Fallback (if sticky is visually wrong):** keep the JS but only run the reset+repin writes when the *chosen pinned date changes* (track the current pinned id); on the common frames where it is unchanged, skip the write so the read hits clean layout (no forced relayout). Either way, the measured win is forced-layout self-time → ~0 in steady scroll; total frame-end `Layout` over the large DOM only drops once #5 (fewer rows) lands.

### 2. Replace the `getMessagesInViewport` scan with an IntersectionObserver (~2 s/frame)

Maintain a `visibleIds: Set<string>` via an `IntersectionObserver` rooted on the scroll container (`U.Dom.getScrollContainer(isPopup)`), `rootMargin` bottom = `-formHeight` to reproduce the read band; observe/unobserve each row in the existing ref callback. Replace `getMessagesInViewport()` (and the `scrollTop`-driven per-frame scan) with reads of `visibleIds`; feed the unchanged `onReadStop` orderId-range logic. Rebuild `rootMargin` when the form's height changes. This removes the per-frame forced-layout scan and the full-list `getMessages()` walk, and structurally eliminates the offset-0 trap. **Ship an equivalence test** comparing the IO id-set to the legacy `getBoundingClientRect` set across scripted scroll positions before merge.

### 3. Stop the lazy-load re-render cascade (memo + observer + store O(1) map)

Indirect but it gates the `offsetWidth` (1.38 s) and `sanitize` (1.7 s) storms that the cascade re-triggers.
- **Rows (and `BlockChat`) are *already* observers** — `vite.auto-observer.ts` rewrites `export default memo(ChatMessage)` → `memo(observer(ChatMessage))` at build. So **do not add `mobx-react`/convert the export**. The lever is **prop stability** so the existing `memo` holds: `useCallback` the handlers with `(e, id)` signatures (rebound to the row's id inside `<Message>` at each call site, incl. an explicit `onReplyClick` override after `{...props}` on `<Reply>`); `useCallback` `getMessageMenuOptions` (else it re-creates each render and defeats memo); derive `hasMore` inside `<Message>`; drop the unused `index`; a stable per-id ref-setter factory; replace `{...props}` with an **explicitly enumerated** curated prop list (the `render*` fns are *optional* on `BlockComponent`, so dropping them silently crashes `init()`).
- **Make `isFirst`/`isLast` observable on `M.ChatMessage`** (declared but absent from `makeObservable`, mutated by `getSections`). Mandatory: since the row is already an observer, grouping stays stale after a prepend without it.
- Store-side **`Map<id, message>` index** per subId so `getMessageById` is O(1) (benefits the Message body, `getReplyContent`, `scrollToMessage`, reply/pinned jumps regardless of memo).
- Keep the Message `init()` effect running per commit (now rare under memo) or key it strictly on `[id, message.modifiedAt]`; bias to correctness over shaving a now-rare commit.

### 4. Memoize message HTML (`Mark.toHtml` + `sanitize`) per message

`sanitize`/DOMPurify is ~1.7 s and re-runs on every render of a message. Cache the sanitized HTML keyed by `(text, marks)` identity (or compute once and store on the message), so re-renders reuse it. Removes the DOMPurify spikes from the lazy-load long tasks. (With memo holding (#3), re-renders drop sharply, but memoizing the pure transform is cheap insurance and helps `getReplyContent` too.)

### 5. Virtualization — deferred follow-up (lowest CPU priority)

Only after #1–#4 ship and are re-profiled, if mounted-node count / cold-mount latency / memory still gate a larger cap: flow-layout (spacer) windowing on the shared `#page` scroller, preserving native `overflow-anchor`, keeping date headers model-driven, reusing the #2 IO for read-receipts. Gated on a standalone on-device anchor-stability spike. Prefer hand-rolled over a library fought off its layout.

## Phasing (ship order = measured priority)

- **Phase 0** — capture a before flamechart (commit count + scripting time) for: scroll-up lazy-load, steady scroll, reaction toggle. The after-comparison evidence.
- **Phase 1** — `renderDates` batched reads-before-writes (#1 primary). Biggest single win, low risk, independent.
- **Phase 2** — IntersectionObserver read-receipt visibility (#2), with the equivalence test.
- **Phase 3** — memo/observer + stable props + store O(1) map (#3), incl. `isFirst`/`isLast` observable.
- **Phase 4** — memoize message HTML (#4).
- **Recommended ship point: after Phase 3** (the cascade + thrash are gone); Phase 4 is a bonus, **MAX_MESSAGES can then rise conservatively behind measurement.**
- **Phase 5 (deferred, gated)** — virtualization (#5) + optional CSS-sticky cleanup of `renderDates`.

## Testing

- **Unit:** store `Map<id,message>` O(1) lookup correctness across set/add/prepend/append/update/clear; the IO-vs-legacy visible-id equivalence (scripted positions); a render-count assertion that a reaction mutation re-renders exactly one row and a prepend still recomputes sections.
- **Manual / E2E (real layout):** on a >500-message chat — scroll-up/down feel (no jank, no jump), sticky date correctness, jump-to-bottom / deeplink, read-receipt accuracy (no over-marking), reaction/edit/read-status updates not stale. Re-capture the Phase-0 flamechart to confirm the forced-layout self-time and long-task totals drop.

## References

- Trace `Trace-20260626T225428.json`: forced-layout reads ~5.9 s; 93% of 3552 layouts forced; React 1.64 s (2.7%); `renderDates` 2.34 s; 70 long tasks = 17.96 s.
- Design tournament (`chat-perf-design-tournament`): winner = observer+memo+grafts; the trace **reprioritized** it (renderDates, not React, is #1).
