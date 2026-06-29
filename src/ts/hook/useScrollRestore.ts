import { useLayoutEffect, useRef } from 'react';
import Storage from 'Lib/storage';
import { ScrollSettleTracker } from 'Lib/util/scrollAnchor';

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
			return; // nothing saved (fresh object) — leave at the top
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
