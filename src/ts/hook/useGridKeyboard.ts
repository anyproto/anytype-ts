import { useEffect, useRef } from 'react';
import $ from 'jquery';
import { keyboard, Key, KeyboardZoneType, Relation, U, FocusedPanel } from 'Lib';
import { gridFocus } from '../component/block/dataview/view/grid/gridFocus';

interface UseGridKeyboardProps {
	blockId: string;
	isPopup: boolean;
	getRecords: () => string[];
	getVisibleRelations: () => any[];
	getIdPrefix: () => string;
	onCellClick: (e: any, key: string, id?: string) => void;
};

export const useGridKeyboard = (props: UseGridKeyboardProps) => {
	const { blockId, isPopup, getRecords, getVisibleRelations, getIdPrefix, onCellClick } = props;
	const zoneId = `grid:${blockId}`;
	const cleanupRef = useRef<(() => void) | null>(null);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			const key = keyboard.eventKey(e);
			const records = getRecords();
			const relations = getVisibleRelations();

			if (!records.length || !relations.length) {
				return false;
			};

			// Don't intercept modified arrow keys (Cmd+Arrow, Alt+Arrow are text editing shortcuts)
			if (keyboard.isArrow(e) && (e.metaKey || e.ctrlKey || e.altKey)) {
				return false;
			};

			const relationKeys = relations.map(r => r.relationKey);

			// If no cell is focused, focus the first cell on arrow down
			if (!gridFocus.isActive) {
				if (key === Key.down) {
					e.preventDefault();
					gridFocus.set(relationKeys[0], records[0]);
					scrollToCell(relationKeys[0], records[0]);
					return true;
				};
				return false;
			};

			const colIdx = relationKeys.indexOf(gridFocus.relationKey);
			const rowIdx = records.indexOf(gridFocus.recordId);

			if ((colIdx === -1) || (rowIdx === -1)) {
				gridFocus.clear();
				return false;
			};

			switch (key) {

				case Key.up: {
					e.preventDefault();
					if (rowIdx > 0) {
						gridFocus.set(relationKeys[colIdx], records[rowIdx - 1]);
						scrollToCell(relationKeys[colIdx], records[rowIdx - 1]);
					};
					return true;
				};

				case Key.down: {
					e.preventDefault();
					if (rowIdx < records.length - 1) {
						gridFocus.set(relationKeys[colIdx], records[rowIdx + 1]);
						scrollToCell(relationKeys[colIdx], records[rowIdx + 1]);
					};
					return true;
				};

				case Key.left: {
					e.preventDefault();
					if (colIdx > 0) {
						gridFocus.set(relationKeys[colIdx - 1], records[rowIdx]);
						scrollToCell(relationKeys[colIdx - 1], records[rowIdx]);
					};
					return true;
				};

				case Key.right: {
					e.preventDefault();
					if (colIdx < relationKeys.length - 1) {
						gridFocus.set(relationKeys[colIdx + 1], records[rowIdx]);
						scrollToCell(relationKeys[colIdx + 1], records[rowIdx]);
					};
					return true;
				};

				case Key.tab: {
					e.preventDefault();
					const nextCol = e.shiftKey ? colIdx - 1 : colIdx + 1;

					if ((nextCol >= 0) && (nextCol < relationKeys.length)) {
						gridFocus.set(relationKeys[nextCol], records[rowIdx]);
						scrollToCell(relationKeys[nextCol], records[rowIdx]);
					} else
					if (!e.shiftKey && (rowIdx < records.length - 1)) {
						gridFocus.set(relationKeys[0], records[rowIdx + 1]);
						scrollToCell(relationKeys[0], records[rowIdx + 1]);
					} else
					if (e.shiftKey && (rowIdx > 0)) {
						gridFocus.set(relationKeys[relationKeys.length - 1], records[rowIdx - 1]);
						scrollToCell(relationKeys[relationKeys.length - 1], records[rowIdx - 1]);
					};
					return true;
				};

				case Key.enter: {
					e.preventDefault();
					enterEditMode();
					return true;
				};

				case Key.escape: {
					e.preventDefault();
					gridFocus.clear();
					return true;
				};

			};

			return false;
		};

		const scrollToCell = (relationKey: string, recordId: string) => {
			const idPrefix = getIdPrefix();
			const cellId = Relation.cellId(idPrefix, relationKey, recordId);
			const cell = $(`#${U.Common.esc(cellId)}`);

			if (!cell.length) {
				return;
			};

			const containerEl = U.Dom.getScrollContainer(isPopup);

			if (!containerEl) {
				return;
			};

			const cellRect = cell.get(0).getBoundingClientRect();
			const containerRect = containerEl.getBoundingClientRect();

			if (cellRect.bottom > containerRect.bottom) {
				containerEl.scrollTop += cellRect.bottom - containerRect.bottom + 8;
			} else
			if (cellRect.top < containerRect.top) {
				containerEl.scrollTop -= containerRect.top - cellRect.top + 8;
			};

			// Horizontal scroll within the grid scroll container
			const scroll = $(`#block-${U.Common.esc(blockId)} #scroll`);
			const scrollEl = scroll.get(0);

			if (!scrollEl) {
				return;
			};

			const scrollRect = scrollEl.getBoundingClientRect();

			if (cellRect.right > scrollRect.right) {
				scrollEl.scrollLeft += cellRect.right - scrollRect.right + 8;
			} else
			if (cellRect.left < scrollRect.left) {
				scrollEl.scrollLeft -= scrollRect.left - cellRect.left + 8;
			};
		};

		const enterEditMode = () => {
			if (!gridFocus.isActive) {
				return;
			};

			const fakeEvent = {
				button: 0,
				preventDefault: () => {},
				stopPropagation: () => {},
				shiftKey: false,
			};

			onCellClick(fakeEvent, gridFocus.relationKey, gridFocus.recordId);
		};

		cleanupRef.current = keyboard.router.pushZone({
			id: zoneId,
			type: KeyboardZoneType.DataviewGrid,
			onKeyDown: (e: KeyboardEvent) => {
				const fp = keyboard.router.focusedPanel;

				if (fp && (fp !== FocusedPanel.Page)) {
					return false;
				};

				// Don't intercept when panel group navigation is active
				if (fp && keyboard.router.navigation.activeGroupId) {
					return false;
				};

				// Don't intercept when a cell is being edited
				if (keyboard.isFocused) {
					return false;
				};

				// Don't intercept when a menu is open
				if (keyboard.router.hasZoneOfType(KeyboardZoneType.Menu)) {
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
			gridFocus.clear();
		};
	}, [ blockId ]);

	return gridFocus;
};
