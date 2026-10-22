import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as I from 'Interface';

interface Props {
	isInline?: boolean;
	autoHide?: boolean;
};

const HIDE_DELAY = 1300;

const StickyScrollbar = forwardRef<I.StickyScrollbarRef, Props>((props, ref) => {

	const { autoHide } = props;
	const nodeRef = useRef<HTMLDivElement>(null);
	const trackRef = useRef<HTMLDivElement>(null);
	const scrollElementRef = useRef<HTMLElement>(null);
	const hostRef = useRef<HTMLElement>(null);
	const isSyncing = useRef(false);
	const scrollHandler = useRef<(() => void) | null>(null);
	const hostHandlers = useRef<[ string, EventListener ][]>([]);
	const lastScrollLeft = useRef<number | null>(null);
	const timeout = useRef(0);

	const [ isHovering, setIsHovering ] = useState(false);
	const [ isRecentlyScrolled, setIsRecentlyScrolled ] = useState(false);

	// Auto-hide only where the OS hides scrollbars itself, so Windows, Linux and
	// anyone who picked "Show scroll bars: Always" keep a permanently visible bar
	const isEnabled = autoHide ?? (U.Common.isPlatformMac() && U.Common.hasOverlayScrollbars());
	const isEnabledRef = useRef(isEnabled);

	isEnabledRef.current = isEnabled;

	const isVisible = U.StickyScrollbar.isVisible({ isEnabled, isHovering, isRecentlyScrolled });

	const toPx = (v: any): any => {
		return typeof v == 'number' ? `${v}px` : v;
	};

	// Reveals the bar on scroll and restarts the idle countdown.
	// Only a real change of position counts: grid calls onScrollHorizontal()
	// programmatically on mount and on view/column changes, which would
	// otherwise flash the bar open every time an object is opened
	const onActivity = () => {
		if (!isEnabledRef.current) {
			return;
		};

		const scrollLeft = scrollElementRef.current?.scrollLeft ?? 0;
		const isFirst = lastScrollLeft.current === null;

		if (lastScrollLeft.current === scrollLeft) {
			return;
		};

		lastScrollLeft.current = scrollLeft;

		// The first observation only establishes the baseline
		if (isFirst) {
			return;
		};

		setIsRecentlyScrolled(true);

		window.clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => setIsRecentlyScrolled(false), HIDE_DELAY);
	};

	const resize = (config) => {
		if (!nodeRef.current || !trackRef.current) {
			return;
		};

		U.Dom.css(nodeRef.current, {
			width: toPx(config.width),
			left: toPx(config.left),
			paddingLeft: toPx(config.paddingLeft),
			display: config.display,
		});
		U.Dom.css(trackRef.current, { width: toPx(config.trackWidth) });
	};

	const bind = (scrollElement, status) => {
		if (!nodeRef.current) {
			return;
		};

		unbind();

		scrollElementRef.current = scrollElement;
		isSyncing.current = status;

		scrollHandler.current = () => {
			if (scrollElementRef.current && nodeRef.current) {
				isSyncing.current = U.StickyScrollbar.syncFromSticky(
					scrollElementRef.current,
					nodeRef.current,
					isSyncing.current
				);
			};

			onActivity();
		};

		U.Dom.addEvent(nodeRef.current, 'scroll', scrollHandler.current);

		// The bar is a sibling of the scroll area, so their shared parent is the
		// hover target that covers both the content and the bar itself
		hostRef.current = nodeRef.current.parentElement;

		if (hostRef.current) {
			hostHandlers.current = [
				[ 'mouseover', () => setIsHovering(true) ],
				[ 'mouseleave', () => setIsHovering(false) ],
			];

			U.Dom.addEvents(hostRef.current, hostHandlers.current);
		};
	};

	const unbind = () => {
		if (nodeRef.current && scrollHandler.current) {
			U.Dom.removeEvent(nodeRef.current, 'scroll', scrollHandler.current);
		};
		if (hostRef.current && hostHandlers.current.length) {
			U.Dom.removeEvents(hostRef.current, hostHandlers.current);
		};

		window.clearTimeout(timeout.current);

		timeout.current = 0;
		hostHandlers.current = [];
		hostRef.current = null;
		scrollHandler.current = null;
		scrollElementRef.current = null;
		lastScrollLeft.current = null;
		isSyncing.current = null;

		// Hover state is deliberately left alone: rebind() runs on a column add,
		// and clearing it there would hide the bar out from under a resting pointer
		// until it moved again
		setIsRecentlyScrolled(false);
	};

	const sync = (element, isSyncing) => {
		onActivity();

		return U.StickyScrollbar.syncFromMain(element, nodeRef.current, isSyncing);
	};

	useEffect(() => () => unbind(), []);

	useImperativeHandle(ref, () => ({
		resize,
		bind,
		unbind,
		sync,
	}));

	const cn = [ 'stickyScrollbar', (isVisible ? '' : 'isHidden') ];

	return (
		<AnimatePresence mode="popLayout">
			<motion.div
				ref={nodeRef}
				className={cn.join(' ')}
				{...U.Common.animationProps({
					animate: { opacity: isVisible ? 1 : 0 },
					transition: { duration: 0.2 },
				})}
			>
				<div className="stickyScrollbarTrack" ref={trackRef}></div>
			</motion.div>
		</AnimatePresence>
	);

});

export default StickyScrollbar;
