import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as I from 'Interface';

interface Props {
	isInline?: boolean;
};

const StickyScrollbar = forwardRef<I.StickyScrollbarRef, Props>((props, ref) => {

	const nodeRef = useRef<HTMLDivElement>(null);
	const trackRef = useRef<HTMLDivElement>(null);
	const scrollElementRef = useRef<HTMLElement>(null);
	const isSyncing = useRef(false);
	const scrollHandler = useRef<(() => void) | null>(null);

	const resize = (config) => {
		if (!nodeRef.current || !trackRef.current) {
			return;
		};

		U.Dom.css(nodeRef.current, {
			width: config.width,
			left: config.left,
			paddingLeft: config.paddingLeft,
			display: config.display,
		});
		U.Dom.css(trackRef.current, { width: config.trackWidth });
	};

	const bind = (scrollElement, status) => {
		if (!nodeRef.current) {
			return;
		};

		scrollElementRef.current = scrollElement;
		isSyncing.current = status;

		if (scrollHandler.current) {
			U.Dom.removeEvent(nodeRef.current, 'scroll', scrollHandler.current);
		};

		scrollHandler.current = () => {
			if (scrollElementRef.current && nodeRef.current) {
				isSyncing.current = U.StickyScrollbar.syncFromSticky(
					scrollElementRef.current,
					nodeRef.current,
					isSyncing.current
				);
			};
		};

		U.Dom.addEvent(nodeRef.current, 'scroll', scrollHandler.current);
	};

	const unbind = () => {
		if (nodeRef.current && scrollHandler.current) {
			U.Dom.removeEvent(nodeRef.current, 'scroll', scrollHandler.current);
		};
		scrollHandler.current = null;
		scrollElementRef.current = null;
		isSyncing.current = null;
	};

	const sync = (element, isSyncing) => {
		return U.StickyScrollbar.syncFromMain(element, nodeRef.current, isSyncing);
	};

	useImperativeHandle(ref, () => ({
		resize,
		bind,
		unbind,
		sync,
	}));

	return (
		<AnimatePresence mode="popLayout">
			<motion.div
				ref={nodeRef} 
				className="stickyScrollbar"
				{...U.Common.animationProps({
					transition: { duration: 0.2, delay: 0.2 },
				})}
			>
				<div className="stickyScrollbarTrack" ref={trackRef}></div>
			</motion.div>
		</AnimatePresence>
	);

});

export default StickyScrollbar;