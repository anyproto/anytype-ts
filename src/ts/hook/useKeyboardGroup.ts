import { useEffect, RefObject } from 'react';
import { navigation } from 'Lib/keyboard/navigation';
import { FocusedPanel } from 'Lib/keyboard/router';

interface UseKeyboardGroupOptions {
	id: string;
	panel: FocusedPanel;
	direction: 'h' | 'v';
	itemSelector: string;
	onEnter?: (item: HTMLElement) => boolean;
	onLeft?: (item: HTMLElement) => boolean;
	onRight?: (item: HTMLElement) => boolean;
	getItemCount?: () => number;
	scrollToIndex?: (idx: number) => void;
};

export const useKeyboardGroup = (ref: RefObject<HTMLElement>, options: UseKeyboardGroupOptions) => {
	const { id, panel, direction, itemSelector, onEnter, onLeft, onRight, getItemCount, scrollToIndex } = options;

	useEffect(() => {
		navigation.registerGroup({
			id,
			panel,
			direction,
			getContainer: () => ref.current,
			itemSelector,
			onEnter,
			onLeft,
			onRight,
			getItemCount,
			scrollToIndex,
		});

		return () => {
			navigation.unregisterGroup(id);
		};
	}, [ id, panel, direction, itemSelector ]);
};
