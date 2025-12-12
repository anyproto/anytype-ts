import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import $ from 'jquery';
import { U } from 'Lib';

interface Props {
	isInline?: boolean;
};

export interface StickyScrollbarRefMethods {
	resize: (config: { width: number; left: number; paddingLeft: number; display: string; trackWidth: number }) => void;
	bindEvents: (scrollElement: JQuery<HTMLElement>, isSyncingScrollRef: { current: boolean }) => void;
	unbindEvents: () => void;
	syncFromScroll: (scrollElement: JQuery<HTMLElement>, isSyncingScroll: boolean) => boolean;
};

const StickyScrollbar = forwardRef<StickyScrollbarRefMethods, Props>(({
	isInline = false,
}, ref) => {

	const stickyScrollbarRef = useRef<HTMLDivElement>(null);
	const trackRef = useRef<HTMLDivElement>(null);
	const scrollElementRef = useRef<JQuery<HTMLElement>>(null);
	const isSyncingScrollRef = useRef<{ current: boolean }>(null);

	useImperativeHandle(ref, () => ({
		resize: (config) => {
			if (!stickyScrollbarRef.current || !trackRef.current) {
				return;
			};

			const stickyScrollbar = $(stickyScrollbarRef.current);
			const track = $(trackRef.current);

			stickyScrollbar.css({
				width: config.width,
				left: config.left,
				paddingLeft: config.paddingLeft,
				display: config.display,
			});
			track.css({ width: config.trackWidth });
		},

		bindEvents: (scrollElement, isSyncingScroll) => {
			if (!stickyScrollbarRef.current) {
				return;
			};

			scrollElementRef.current = scrollElement;
			isSyncingScrollRef.current = isSyncingScroll;

			const stickyScrollbar = $(stickyScrollbarRef.current);
			stickyScrollbar.off('scroll.sticky');
			stickyScrollbar.on('scroll.sticky', () => {
				if (!scrollElementRef.current || !isSyncingScrollRef.current) {
					return;
				};
				isSyncingScrollRef.current.current = U.StickyScrollbar.syncFromStickyScroll(
					scrollElementRef.current,
					stickyScrollbar,
					isSyncingScrollRef.current.current
				);
			});
		},

		unbindEvents: () => {
			if (!stickyScrollbarRef.current) {
				return;
			};

			const stickyScrollbar = $(stickyScrollbarRef.current);
			stickyScrollbar.off('scroll.sticky');
			scrollElementRef.current = null;
			isSyncingScrollRef.current = null;
		},

		syncFromScroll: (scrollElement, isSyncingScroll) => {
			if (!stickyScrollbarRef.current) {
				return isSyncingScroll;
			};

			const stickyScrollbar = $(stickyScrollbarRef.current);
			return U.StickyScrollbar.syncFromMainScroll(scrollElement, stickyScrollbar, isSyncingScroll);
		},
	}));

	if (isInline) {
		return null;
	};

	return (
		<div className="stickyScrollbar" ref={stickyScrollbarRef}>
			<div className="stickyScrollbarTrack" ref={trackRef}></div>
		</div>
	);

});

export default StickyScrollbar;
