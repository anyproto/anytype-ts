import { useEffect, useRef } from 'react';
import $ from 'jquery';
import { keyboard, Key, KeyboardZoneType, U } from 'Lib';

interface UseSidebarKeyboardProps {
	containerId: string;
	isPopup: boolean;
};

export const useSidebarKeyboard = (props: UseSidebarKeyboardProps) => {
	const { containerId, isPopup } = props;
	const currentIdx = useRef(-1);
	const cleanupRef = useRef<(() => void) | null>(null);

	useEffect(() => {
		const getItems = (): JQuery => {
			return $(`#${U.Common.esc(containerId)} #body .item:not(.isSection):visible`);
		};

		const setFocus = (idx: number) => {
			const items = getItems();

			if (!items.length) {
				return;
			};

			clearFocus();

			currentIdx.current = Math.max(0, Math.min(idx, items.length - 1));

			const item = items.eq(currentIdx.current);
			item.addClass('isSidebarFocused');

			const el = item.get(0);
			if (el) {
				el.scrollIntoView({ block: 'nearest' });
			};
		};

		const clearFocus = () => {
			$(`#${U.Common.esc(containerId)} .isSidebarFocused`).removeClass('isSidebarFocused');
			currentIdx.current = -1;
		};

		const handler = (e: KeyboardEvent) => {
			const key = keyboard.eventKey(e);
			const items = getItems();

			if (!items.length) {
				return false;
			};

			switch (key) {

				case Key.down: {
					e.preventDefault();
					setFocus(currentIdx.current + 1);
					return true;
				};

				case Key.up: {
					e.preventDefault();
					if (currentIdx.current <= 0) {
						clearFocus();
						return true;
					};
					setFocus(currentIdx.current - 1);
					return true;
				};

				case Key.right: {
					if (currentIdx.current < 0) {
						return false;
					};

					e.preventDefault();

					const item = items.eq(currentIdx.current);
					const arrow = item.find('.arrowWrap .icon.arrow');

					if (arrow.length && !item.hasClass('isOpen')) {
						item.find('.arrowWrap').trigger('mousedown');
					};
					return true;
				};

				case Key.left: {
					if (currentIdx.current < 0) {
						return false;
					};

					e.preventDefault();

					const item = items.eq(currentIdx.current);
					const arrow = item.find('.arrowWrap .icon.arrow');

					if (arrow.length && item.hasClass('isOpen')) {
						item.find('.arrowWrap').trigger('mousedown');
					};
					return true;
				};

				case Key.enter: {
					if (currentIdx.current < 0) {
						return false;
					};

					e.preventDefault();

					const item = items.eq(currentIdx.current);
					const clickable = item.find('.clickable');

					if (clickable.length) {
						clickable.trigger('mousedown');
					} else {
						item.trigger('click');
					};
					return true;
				};

				case Key.escape: {
					e.preventDefault();
					clearFocus();
					keyboard.router.clearFocus();
					return true;
				};

			};

			return false;
		};

		const updatePanelIndicator = () => {
			const container = $(`#${U.Common.esc(containerId)}`);
			container.toggleClass('isSidebarActive', keyboard.router.focusedPanel === 'sidebar');
		};

		cleanupRef.current = keyboard.router.pushZone({
			id: `sidebar:${containerId}`,
			type: KeyboardZoneType.Sidebar,
			onKeyDown: (e: KeyboardEvent) => {
				updatePanelIndicator();

				if (keyboard.router.focusedPanel !== 'sidebar') {
					return false;
				};

				if (keyboard.isFocused) {
					return false;
				};

				if (keyboard.router.hasZoneOfType(KeyboardZoneType.Menu)) {
					return false;
				};

				if (keyboard.router.hasZoneOfType(KeyboardZoneType.Popup)) {
					return false;
				};

				return handler(e);
			},
		});

		return () => {
			if (cleanupRef.current) {
				cleanupRef.current();
				cleanupRef.current = null;
			};
			clearFocus();
			$(`#${U.Common.esc(containerId)}`).removeClass('isSidebarActive');
		};
	}, [ containerId ]);
};
