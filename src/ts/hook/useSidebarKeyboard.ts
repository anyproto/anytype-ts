import { useEffect, useRef } from 'react';
import $ from 'jquery';
import { keyboard, Key, KeyboardZoneType, U } from 'Lib';
import { FocusedPanel } from 'Lib/keyboard/router';

interface UseSidebarKeyboardProps {
	containerId: string;
	panel: FocusedPanel;
};

const HIGHLIGHT_CLASS = 'keyboardHighlight';

export const useSidebarKeyboard = (props: UseSidebarKeyboardProps) => {
	const { containerId, panel } = props;
	const currentIdx = useRef(-1);
	const cleanupRef = useRef<(() => void) | null>(null);

	useEffect(() => {
		const getContainer = (): JQuery => {
			return $(`#${U.Common.esc(containerId)}`);
		};

		const getItems = (): JQuery => {
			return getContainer().find('> .body .item:not(.isSection):visible');
		};

		const setFocus = (idx: number) => {
			const items = getItems();

			if (!items.length) {
				return;
			};

			clearItemFocus();

			currentIdx.current = Math.max(0, Math.min(idx, items.length - 1));

			const item = items.eq(currentIdx.current);
			item.addClass(HIGHLIGHT_CLASS);

			const el = item.get(0);
			if (el) {
				el.scrollIntoView({ block: 'nearest' });
			};
		};

		const clearItemFocus = () => {
			getContainer().find(`.item.${HIGHLIGHT_CLASS}`).removeClass(HIGHLIGHT_CLASS);
			currentIdx.current = -1;
		};

		const updatePanelIndicator = () => {
			const isActive = keyboard.router.focusedPanel === panel;

			getContainer().toggleClass(HIGHLIGHT_CLASS, isActive);
		};

		const onFocusPanelChange = () => {
			updatePanelIndicator();

			if (keyboard.router.focusedPanel !== panel) {
				clearItemFocus();
			};
		};

		window.addEventListener('focusPanelChange', onFocusPanelChange);

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
						clearItemFocus();
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
					clearItemFocus();
					keyboard.router.clearFocus();
					return true;
				};

			};

			return false;
		};

		cleanupRef.current = keyboard.router.pushZone({
			id: `sidebar:${panel}`,
			type: KeyboardZoneType.Sidebar,
			onKeyDown: (e: KeyboardEvent) => {
				if (keyboard.router.focusedPanel !== panel) {
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
			clearItemFocus();
			window.removeEventListener('focusPanelChange', onFocusPanelChange);
			getContainer().removeClass(HIGHLIGHT_CLASS);
		};
	}, [ containerId, panel ]);
};
