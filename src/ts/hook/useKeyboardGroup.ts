import { useEffect, useRef, RefObject } from 'react';
import { navigation, GroupDirection } from 'Lib/keyboard/navigation';
import { FocusedPanel } from 'Lib/keyboard/router';

interface UseKeyboardGroupOptions {
	id: string;
	panel: FocusedPanel;
	direction: GroupDirection;
	itemSelector: string;
	onEnter?: (item: HTMLElement) => boolean;
	onLeft?: (item: HTMLElement) => boolean;
	onRight?: (item: HTMLElement) => boolean;
	getItemCount?: () => number;
	scrollToIndex?: (idx: number) => void;
	getItemElement?: (index: number) => HTMLElement | null;
};

export const useKeyboardGroup = (ref: RefObject<HTMLElement>, options: UseKeyboardGroupOptions) => {
	const { id, panel, direction, itemSelector, onEnter, onLeft, onRight, getItemCount, scrollToIndex, getItemElement } = options;

	const getItemCountRef = useRef(getItemCount);
	const scrollToIndexRef = useRef(scrollToIndex);
	const getItemElementRef = useRef(getItemElement);

	getItemCountRef.current = getItemCount;
	scrollToIndexRef.current = scrollToIndex;
	getItemElementRef.current = getItemElement;

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
			getItemCount: getItemCount ? () => getItemCountRef.current() : undefined,
			scrollToIndex: scrollToIndex ? (idx: number) => scrollToIndexRef.current(idx) : undefined,
			getItemElement: getItemElement ? (idx: number) => getItemElementRef.current(idx) : undefined,
		});

		return () => {
			navigation.unregisterGroup(id);
		};
	}, [ id, panel, direction, itemSelector ]);
};
