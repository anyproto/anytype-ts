import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import $ from 'jquery';
import { U, I } from 'Lib';

interface Props {
	isInline?: boolean;
};

const StickyScrollbar = forwardRef<I.StickyScrollbarRef, Props>((props, ref) => {

	const nodeRef = useRef<HTMLDivElement>(null);
	const trackRef = useRef<HTMLDivElement>(null);
	const scrollElementRef = useRef<JQuery<HTMLElement>>(null);
	const isSyncing = useRef(false);

	const resize = (config) => {
		if (!nodeRef.current || !trackRef.current) {
			return;
		};

		const stickyScrollbar = $(nodeRef.current);
		const track = $(trackRef.current);

		stickyScrollbar.css({
			width: config.width,
			left: config.left,
			paddingLeft: config.paddingLeft,
			display: config.display,
		});
		track.css({ width: config.trackWidth });
	};

	const bind = (scrollElement, status) => {
		if (!nodeRef.current) {
			return;
		};

		scrollElementRef.current = scrollElement;
		isSyncing.current = status;

		const node = $(nodeRef.current);

		node.off('scroll.sticky').on('scroll.sticky', () => {
			if (scrollElementRef.current) {
				isSyncing.current = U.StickyScrollbar.syncFromSticky(
					scrollElementRef.current,
					node,
					isSyncing.current
				);
			};
		});
	};

	const unbind = () => {
		$(nodeRef.current).off('scroll.sticky');
		scrollElementRef.current = null;
		isSyncing.current = null;
	};

	const sync = (element, isSyncing) => {
		return U.StickyScrollbar.syncFromMain(element, $(nodeRef.current), isSyncing);
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