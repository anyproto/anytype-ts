import React, { forwardRef, useEffect, useRef } from 'react';

import raf from 'raf';
import { throttle } from 'lodash';
import { Icon } from 'Component';
import Row from './table/row';
import * as I from 'Interface';
import { focus } from 'Lib/focus';

const PADDING = 46;
const SNAP = 10;

const BlockTable = forwardRef<I.BlockRef, I.BlockComponent>((props, ref) => {

	const { rootId, block, readonly, isPopup, onKeyDown, getWrapperWidth } = props;
	const data = S.Block.getTableData(rootId, block.id);
	const { rows, columns } = data;
	const nodeRef = useRef(null);
	const scrollRef = useRef(null);
	const tableRef = useRef(null);
	const offsetX = useRef(0);
	const cache = useRef<any>({});
	const scrollX = useRef(0);
	const frame = useRef(0);
	const frameResize = useRef(0);
	const hoverId = useRef('');
	const position = useRef(I.BlockPosition.None);
	const frames = useRef<any[]>([]);
	const rowRef = useRef('');
	const cellRef = useRef('');
	const selectionAnchor = useRef<{ rowId: string; columnId: string } | null>(null);
	const selectedCells = useRef<Set<string>>(new Set());
	const selectionMode = useRef<'none' | 'cells' | 'rows' | 'columns'>('none');
	const outsideClickRef = useRef<((e: MouseEvent) => void) | null>(null);
	const cn = [ 'wrap', 'focusable', `c${block.id}` ];

	// Subscriptions
	columns.forEach((column: I.Block) => {
		const { width } = column.fields || {};
	});

	useEffect(() => {
		initSize();

		const resizeObserver = new ResizeObserver(() => {
			raf(() => resize());
		});

		if (nodeRef.current) {
			resizeObserver.observe(nodeRef.current);
		};

		return () => {
			resizeObserver.disconnect();
			if (outsideClickRef.current) {
				U.Dom.removeEvent(window, 'mousedown', outsideClickRef.current);
			};
		};
	}, []);

	useEffect(() => {
		initSize();
		if (scrollRef.current) {
			scrollRef.current.scrollLeft = scrollX.current;
		};

		if (selectedCells.current.size > 0) {
			renderTableSelectionFrame();
		};
	});

	const onHandleColumn = (e: any, type: I.BlockType, rowId: string, columnId: string, cellId: string) => {
		e.persist();
		e.preventDefault();
		e.stopPropagation();

		if (!readonly && e.shiftKey && selectionAnchor.current) {
			const cellIds = getCellIdsForColumnRange(selectionAnchor.current.columnId, columnId);
			applyTableSelection(cellIds, 'set');
			return;
		};

		if (!readonly && keyboard.isCmd(e)) {
			const cellIds = getCellIdsForColumn(columnId);
			applyTableSelection(cellIds, 'groupToggle');
			selectionAnchor.current = { rowId: rows[0]?.id || '', columnId };
			return;
		};

		selectionAnchor.current = { rowId: rows[0]?.id || '', columnId };
		onOptions(e, type, rowId, columnId, cellId);
	};

	const onHandleRow = (e: any, type: I.BlockType, rowId: string, columnId: string, cellId: string) => {
		e.persist();
		e.preventDefault();
		e.stopPropagation();

		if (!readonly && e.shiftKey && selectionAnchor.current) {
			const cellIds = getCellIdsForRowRange(selectionAnchor.current.rowId, rowId);
			applyTableSelection(cellIds, 'set');
			return;
		};

		if (!readonly && keyboard.isCmd(e)) {
			const cellIds = getCellIdsForRow(rowId);
			applyTableSelection(cellIds, 'groupToggle');
			selectionAnchor.current = { rowId, columnId: columns[0]?.id || '' };
			return;
		};

		selectionAnchor.current = { rowId, columnId: columns[0]?.id || '' };
		onOptions(e, type, rowId, columnId, cellId);
	};

	const onEnterHandle = (e: any, type: I.BlockType, rowId: string, columnId: string) => {
		e.persist();
		e.preventDefault();
		e.stopPropagation();

		onOptionsOpen(type, rowId, columnId, '');
	};

	const onLeaveHandle = (e: any) => {
		e.persist();
		e.preventDefault();
		e.stopPropagation();

		onOptionsClose();
	};

	const getOptions = (type: I.BlockType, rowId: string, columnId: string, cellId: string) => {
		let options: any[] = [];

		switch (type) {
			case I.BlockType.TableRow: {
				options = options.concat(optionsRow(rowId));
				options = options.concat(optionsColor(''));
				options = options.concat(optionsAlign(''));
				break;
			};

			case I.BlockType.TableColumn: {
				options = options.concat([
					{ id: 'sort', iconParam: { name: 'common/sort' }, name: translate('commonSort'), arrow: true },
					{ isDiv: true },
				]);
				options = options.concat(optionsColumn(columnId));
				options = options.concat(optionsColor(''));
				options = options.concat(optionsAlign(''));
				break;
			};

			default: {
				options = options.concat([
					{ id: 'row', name: translate('blockTableRow'), arrow: true },
					{ id: 'column', name: translate('blockTableColumn'), arrow: true },
					{ isDiv: true },
				]);
				options = options.concat(optionsColor(cellId));
				options = options.concat(optionsAlign(cellId));
				break;
			};
		};

		return options;
	};

	const getMultiSelectOptions = () => {
		let options: any[] = [];

		options = options.concat(optionsColor(''));
		options = options.concat(optionsAlign(''));
		options = options.concat([
			{ id: 'clearContent', iconParam: { name: 'menu/action/clear' }, name: translate('blockTableOptionsClearContent') },
		]);

		return options;
	};

	const onOptions = (e: any, type: I.BlockType, rowId: string, columnId: string, cellId: string) => {
		e.preventDefault();
		e.stopPropagation();

		const isMultiSelect = (type == I.BlockType.Text) && (selectedCells.current.size > 0) && selectedCells.current.has(cellId);
		const current: any = S.Block.getLeaf(rootId, cellId) || {};
		const node = nodeRef.current;
		const options: any[] = isMultiSelect ? getMultiSelectOptions() : getOptions(type, rowId, columnId, cellId);

		let blockIds = [];
		let menuContext: any = null;
		let menuParam: any = {
			component: 'select',
			onOpen: (context: any) => {
				menuContext = context;
				if (!isMultiSelect) {
					raf(() => onOptionsOpen(type, rowId, columnId, cellId));
				};
			},
			onClose: () => {
				S.Menu.closeAll(J.Menu.table);
				if (!isMultiSelect) {
					onOptionsClose();
				};
			},
			subIds: J.Menu.table,
		};

		let element: any = null;
		let fill: any = null;
		let style: any[] = [];

		switch (type) {
			case I.BlockType.TableRow: {
				style = optionsStyle('');

				const rowEl = U.Dom.select(`#row-${rowId}`, node);
				element = rowEl ? U.Dom.select('.handleRow', rowEl) : null;
				menuParam = Object.assign(menuParam, {
					offsetX: 16,
					offsetY: -28,
				});

				fill = (callBack: () => void) => {
					blockIds = getBlockIds(type, rowId, columnId, cellId);
					C.BlockTableRowListFill(rootId, [ rowId ], callBack);
				};
				break;
			};

			case I.BlockType.TableColumn: {
				style = optionsStyle('');

				element = U.Dom.select(`#cell-${U.Common.esc(cellId)}`, node);
				menuParam = Object.assign(menuParam, {
					offsetX: (element?.offsetWidth ?? 0) + 2,
					offsetY: -(element?.offsetHeight ?? 0),
				});

				fill = (callBack: () => void) => {
					blockIds = getBlockIds(type, rowId, columnId, cellId);
					C.BlockTableColumnListFill(rootId, [ columnId ], callBack);
				};
				break;
			};

			default: {
				style = optionsStyle(isMultiSelect ? '' : cellId);

				const cellEl = U.Dom.select(`#cell-${U.Common.esc(cellId)}`, node);
				const iconMenu = cellEl ? U.Dom.select('.icon.menu', cellEl) : null;
				element = iconMenu ? U.Dom.select('.inner', iconMenu) : null;
				menuParam = Object.assign(menuParam, {
					vertical: I.MenuDirection.Center,
					offsetX: 12,
				});

				if (isMultiSelect) {
					const snapshot = [ ...selectedCells.current ];
					fill = (callBack: () => void) => {
						blockIds = snapshot;
						const selectedRowIds = [ ...new Set(blockIds.map(id => id.split('-')[0])) ];
						C.BlockTableRowListFill(rootId, selectedRowIds, callBack);
					};
				} else {
					fill = (callBack: () => void) => {
						blockIds = getBlockIds(type, rowId, columnId, cellId);
						C.BlockTableRowListFill(rootId, [ rowId ], callBack);
					};
				};
				break;
			};
		};

		menuParam = Object.assign(menuParam, {
			element,
			data: {
				noScroll: true,
				noVirtualisation: true,
				filter: '',
				options: options,
				onSwitch: (e: any, item: any) => {
					if (item.onSwitch) {
						item.onSwitch(e, !item.switchValue, () => {
							menuContext.getChildRef()?.updateOptions?.(getOptions(type, rowId, columnId, cellId));
						});
					};
				},
				onOver: (e: any, item: any) => {
					if (!menuContext) {
						return;
					};

					if (S.Menu.isAnimating(menuContext.props.id)) {
						return;
					};

					if (!item.arrow) {
						S.Menu.closeAll(J.Menu.table);
						return;
					};

					const menuParam: any = {
						element: `#${menuContext.getId()} #item-${U.Common.esc(item.id)}`,
						offsetX: menuContext.getSize().width,
						vertical: I.MenuDirection.Center,
						isSub: true,
						onOpen: context => menuSubContext = context,
						rebind: menuContext.getChildRef()?.rebind,
						parentId: menuContext.props.id,	
						data: {
							rootId, 
						}
					};

					let menuSubContext = null;
					let menuId = '';

					switch (item.id) {
						case 'sort': {
							menuId = 'select2';
							menuParam.component = 'select';
							menuParam.data = Object.assign(menuParam.data, {
								options: optionsSort(),
								onSelect: (e: any, item: any) => {
									C.BlockTableSort(rootId, columnId, item.id);
									menuContext?.close();
								}
							});
							break;
						};

						case 'row': {
							menuId = 'select2';
							menuParam.component = 'select';
							menuParam.data = Object.assign(menuParam.data, {
								options: optionsRow(rowId, true),
								onSwitch: (e: any, item: any) => {
									if (item.onSwitch) {
										item.onSwitch(e, !item.switchValue, () => {
											if (menuSubContext.ref && menuSubContext.ref.updateOptions) {
												menuSubContext.ref.updateOptions(optionsRow(rowId, true));
											};
										});
									};
								},
								onSelect: (e: any, item: any) => {
									fill(() => { 
										onSelect(e, item, rowId, columnId, getBlockIds(I.BlockType.TableRow, rowId, columnId, cellId)); 
									});
									menuContext?.close();
								}
							});
							break;
						};

						case 'column': {
							menuId = 'select2';
							menuParam.component = 'select';
							menuParam.data = Object.assign(menuParam.data, {
								options: optionsColumn(columnId, true),
								onSelect: (e: any, item: any) => {
									fill(() => { 
										onSelect(e, item, rowId, columnId, getBlockIds(I.BlockType.TableColumn, rowId, columnId, cellId)); 
									});
									menuContext?.close();
								}
							});
							break;
						};

						case 'horizontal': {
							menuId = 'select2';
							menuParam.component = 'select';
							menuParam.data = Object.assign(menuParam.data, {
								options: U.Menu.getHAlign([]),
								value: current.hAlign,
								onSelect: (e: any, el: any) => {
									fill(() => C.BlockListSetAlign(rootId, blockIds, el.id));
									menuContext?.close();
								}
							});
							break;
						};

						case 'vertical': {
							menuId = 'select2';
							menuParam.component = 'select';
							menuParam.data = Object.assign(menuParam.data, {
								options: U.Menu.getVAlign(),
								value: current.vAlign,
								onSelect: (e: any, el: any) => {
									fill(() => C.BlockListSetVerticalAlign(rootId, blockIds, el.id));
									menuContext?.close();
								}
							});
							break;
						};

						case 'color': {
							menuId = 'blockColor';
							menuParam.data = Object.assign(menuParam.data, {
								value: current?.content?.color,
								onChange: (id: string) => {
									fill(() => C.BlockTextListSetColor(rootId, blockIds, id));
									menuContext?.close();
								}
							});
							break;
						};

						case 'background': {
							menuId = 'blockBackground';
							menuParam.data = Object.assign(menuParam.data, {
								value: current.bgColor,
								onChange: (id: string) => {
									fill(() => C.BlockListSetBackgroundColor(rootId, blockIds, id));
									menuContext?.close();
								}
							});
							break;
						};

						case 'style': {
							menuId = 'select2';
							menuParam.component = 'select';
							menuParam.data = Object.assign(menuParam.data, {
								options: style,
								onSelect: (e: any, el: any) => {
									fill(() => { C.BlockTextListSetMark(rootId, blockIds, { type: el.id, param: '', range: { from: 0, to: 0 } }); });
									menuContext?.close();
								}
							});
							break;
						};
					};

					S.Menu.closeAll(J.Menu.table, () => {
						S.Menu.open(menuId, menuParam);
					});
				},
				onSelect: (e: any, item: any) => {
					fill(() => { 
						onSelect(e, item, rowId, columnId, blockIds);
					});
					menuContext?.close();
				}
			},
		});

		S.Menu.open('select1', menuParam);
	};

	const onSelect = (e: any, item: any, rowId: string, columnId: string, blockIds: string[]) => {
		if (item.arrow) {
			return;
		};

		let position: I.BlockPosition = I.BlockPosition.None;
		let next: any = null;
		let idx = -1;
		let nextIdx = -1;

		S.Menu.closeAll(J.Menu.table);

		switch (item.id) {
			case 'columnBefore':
			case 'columnAfter': {
				C.BlockTableColumnCreate(rootId, columnId, (item.id == 'columnBefore' ? I.BlockPosition.Left : I.BlockPosition.Right));
				break;
			};

			case 'columnMoveLeft':
			case 'columnMoveRight': {
				position = (item.id == 'columnMoveLeft') ? I.BlockPosition.Left : I.BlockPosition.Right;
				idx = columns.findIndex(it => it.id == columnId);
				nextIdx = idx + (position == I.BlockPosition.Left ? -1 : 1);
				next = columns[nextIdx];

				if (next) {
					onSortEndColumn(columnId, next.id, position);
				};
				break;
			};

			case 'columnRemove': {
				C.BlockTableColumnDelete(rootId, columnId);
				break;
			};

			case 'columnCopy': {
				C.BlockTableColumnDuplicate(rootId, columnId, columnId, I.BlockPosition.Right);
				break;
			};

			case 'rowBefore':
			case 'rowAfter': {
				C.BlockTableRowCreate(rootId, rowId, (item.id == 'rowBefore' ? I.BlockPosition.Top : I.BlockPosition.Bottom));
				break;
			};

			case 'rowMoveTop':
			case 'rowMoveBottom': {
				position = (item.id == 'rowMoveTop') ? I.BlockPosition.Top : I.BlockPosition.Bottom;
				next = getNextRow(rowId, position == I.BlockPosition.Top ? -1 : 1);

				if (next && !next.content.isHeader) {
					onSortEndRow(rowId, next.id, position);
				};
				break;
			};

			case 'rowCopy': {
				C.BlockTableRowDuplicate(rootId, rowId, rowId, I.BlockPosition.Bottom);
				break;
			};

			case 'rowRemove': {
				C.BlockListDelete(rootId, [ rowId ]);
				break;
			};

			case 'clearStyle': {
				C.BlockTextListClearStyle(rootId, blockIds);
				break;
			};

			case 'clearContent': {
				C.BlockTextListClearContent(rootId, blockIds);
				break;
			};
		};
	};

	const onOptionsOpen = (type: I.BlockType, rowId: string, columnId: string, cellId: string) => {
		onOptionsClose();

		const table = tableRef.current;

		switch (type) {
			case I.BlockType.TableColumn: {
				const cells = U.Dom.selectAll(`.cell.column${columnId}`, table);

				cells.forEach(el => U.Dom.addClass(el, 'isHighlightedColumn'));
				if (cells.length) {
					U.Dom.addClass(cells[0], 'isFirst');
					U.Dom.addClass(cells[cells.length - 1], 'isLast');
				};
				cells.forEach(el => {
					const handle = U.Dom.select('.handleColumn', el);
					if (handle) {
						U.Dom.addClass(handle, 'isActive');
					};
				});
				break;
			};

			case I.BlockType.TableRow: {
				const row = U.Dom.select(`#row-${rowId}`, table);

				rowRef.current = rowId;

				if (row) {
					U.Dom.addClass(row, 'isHighlightedRow');
					const handle = U.Dom.select('.handleRow', row);
					if (handle) {
						U.Dom.addClass(handle, 'isActive');
					};
				};
				break;
			};

			default: {
				const cellEl = U.Dom.select(`#cell-${U.Common.esc(cellId)}`, table);
				if (cellEl) {
					U.Dom.addClass(cellEl, 'isHighlightedCell');
				};
				break;
			};
		};

		frameRemove([ I.BlockPosition.None ]);
		frameAdd(type, rowId, columnId, cellId, I.BlockPosition.None);
	};

	const onOptionsClose = () => {
		const table = tableRef.current;

		U.Dom.selectAll('.isHighlightedColumn', table).forEach(el => {
			U.Dom.removeClass(el, 'isHighlightedColumn');
			U.Dom.removeClass(el, 'isFirst');
			U.Dom.removeClass(el, 'isLast');
		});
		U.Dom.selectAll('.isHighlightedRow', table).forEach(el => U.Dom.removeClass(el, 'isHighlightedRow'));
		U.Dom.selectAll('.isHighlightedCell', table).forEach(el => U.Dom.removeClass(el, 'isHighlightedCell'));

		U.Dom.selectAll('.handleColumn.isActive', table).forEach(el => U.Dom.removeClass(el, 'isActive'));
		U.Dom.selectAll('.handleRow.isActive', table).forEach(el => U.Dom.removeClass(el, 'isActive'));

		rowRef.current = '';
		setEditing('');
	};

	const clearTableSelection = () => {
		selectedCells.current.clear();
		selectionMode.current = 'none';
		keyboard.disableSelection(false);
		removeTableSelectionFrames();

		if (outsideClickRef.current) {
			U.Dom.removeEvent(window, 'mousedown', outsideClickRef.current);
			outsideClickRef.current = null;
		};
	};

	const applyTableSelection = (cellIds: string[], mode: 'set' | 'toggle' | 'groupToggle') => {
		const node = nodeRef.current;
		const isNew = !selectedCells.current.size;

		if (mode == 'set') {
			selectedCells.current.clear();
			cellIds.forEach(id => selectedCells.current.add(id));
		} else
		if (mode == 'groupToggle') {
			const allSelected = cellIds.every(id => selectedCells.current.has(id));

			if (allSelected) {
				cellIds.forEach(id => selectedCells.current.delete(id));
			} else {
				cellIds.forEach(id => selectedCells.current.add(id));
			};
		} else {
			cellIds.forEach(id => {
				if (selectedCells.current.has(id)) {
					selectedCells.current.delete(id);
				} else {
					selectedCells.current.add(id);
				};
			});
		};

		if (!selectedCells.current.size) {
			clearTableSelection();
			return;
		};

		setEditing('');
		focus.clear(true);
		keyboard.disableSelection(true);
		detectSelectionMode();

		const selectedRowIds = [ ...new Set([ ...selectedCells.current ].map(id => id.split('-')[0])) ];
		C.BlockTableRowListFill(rootId, selectedRowIds, () => {
			renderTableSelectionFrame();
		});

		if (isNew || !outsideClickRef.current) {
			if (outsideClickRef.current) {
				U.Dom.removeEvent(window, 'mousedown', outsideClickRef.current);
			};

			outsideClickRef.current = (e: MouseEvent) => {
				const target = e.target as HTMLElement;

				if (target.closest('.menus') || target.closest('.cell')) {
					return;
				};

				clearTableSelection();
			};
			U.Dom.addEvent(window, 'mousedown', outsideClickRef.current);
		};

		nodeRef.current?.focus();
	};

	const detectSelectionMode = () => {
		const selected = selectedCells.current;
		if (!selected.size) {
			selectionMode.current = 'none';
			return;
		};

		const selectedRowIds = new Set<string>();
		const selectedColIds = new Set<string>();

		selected.forEach(id => {
			const parts = id.split('-');
			selectedRowIds.add(parts[0]);
			selectedColIds.add(parts[1]);
		});

		const allRowsFull = [ ...selectedRowIds ].every(rowId =>
			columns.every(col => selected.has([ rowId, col.id ].join('-')))
		);

		const allColsFull = [ ...selectedColIds ].every(colId =>
			rows.every(row => selected.has([ row.id, colId ].join('-')))
		);

		if (allRowsFull && (selectedRowIds.size >= 1)) {
			selectionMode.current = 'rows';
		} else
		if (allColsFull && (selectedColIds.size >= 1)) {
			selectionMode.current = 'columns';
		} else {
			selectionMode.current = 'cells';
		};
	};

	const renderTableSelectionFrame = () => {
		removeTableSelectionFrames();

		const selected = selectedCells.current;
		if (!selected.size) {
			return;
		};

		const table = tableRef.current;
		const node = nodeRef.current;
		const frameContainer = U.Dom.select('#selectionFrameContainer', node);
		const containerRect = frameContainer?.getBoundingClientRect();

		if (!containerRect) {
			return;
		};

		const containerOffset = { left: containerRect.left + window.scrollX, top: containerRect.top + window.scrollY };

		const cellPositions: Map<string, { rowId: string; columnId: string; rowIdx: number; colIdx: number }> = new Map();

		selected.forEach(id => {
			const parts = id.split('-');
			const rowId = parts[0];
			const columnId = parts[1];
			const rowIdx = rows.findIndex(r => r.id === rowId);
			const colIdx = columns.findIndex(c => c.id === columnId);

			if ((rowIdx >= 0) && (colIdx >= 0)) {
				cellPositions.set(id, { rowId, columnId, rowIdx, colIdx });
			};
		});

		const positionSet = new Set<string>();
		cellPositions.forEach(pos => positionSet.add(`${pos.rowIdx},${pos.colIdx}`));

		cellPositions.forEach((pos, id) => {
			const cellEl = U.Dom.select(`#cell-${U.Common.esc(id)}`, table);
			if (!cellEl) {
				return;
			};

			const rect = cellEl.getBoundingClientRect();
			const left = rect.left + window.scrollX;
			const top = rect.top + window.scrollY;

			const x = left - containerOffset.left;
			const y = top - containerOffset.top;
			const w = cellEl.offsetWidth;
			const h = cellEl.offsetHeight;

			const hasTop = positionSet.has(`${pos.rowIdx - 1},${pos.colIdx}`);
			const hasBottom = positionSet.has(`${pos.rowIdx + 1},${pos.colIdx}`);
			const hasLeft = positionSet.has(`${pos.rowIdx},${pos.colIdx - 1}`);
			const hasRight = positionSet.has(`${pos.rowIdx},${pos.colIdx + 1}`);

			const borderW = 2;
			const bTop = hasTop ? 0 : borderW;
			const bBottom = hasBottom ? 0 : borderW;
			const bLeft = hasLeft ? 0 : borderW;
			const bRight = hasRight ? 0 : borderW;

			const frameId = `tableSelection-${id}`;
			const frameData = { id: frameId, x, y, w, h, type: I.BlockType.Table, rowId: pos.rowId, columnId: pos.columnId, cellId: id, position: I.BlockPosition.None };

			frames.current.push(frameData);

			const obj = document.createElement('div');
			obj.className = 'selectionFrame tableSelection';
			obj.id = `frame-${frameId}`;
			frameContainer?.appendChild(obj);

			const r = 4;
			const rTL = (!hasTop && !hasLeft) ? r : 0;
			const rTR = (!hasTop && !hasRight) ? r : 0;
			const rBR = (!hasBottom && !hasRight) ? r : 0;
			const rBL = (!hasBottom && !hasLeft) ? r : 0;

			U.Dom.css(obj, {
				left: `${x - bLeft}px`,
				top: `${y - bTop}px`,
				width: `${w + bLeft + bRight}px`,
				height: `${h + bTop + bBottom}px`,
				borderWidth: `${bTop}px ${bRight}px ${bBottom}px ${bLeft}px`,
				borderRadius: `${rTL}px ${rTR}px ${rBR}px ${rBL}px`,
			});
		});
	};

	const removeTableSelectionFrames = () => {
		const node = nodeRef.current;
		const frameContainer = U.Dom.select('#selectionFrameContainer', node);

		frames.current = frames.current.filter(it => !it.id.startsWith('tableSelection'));
		U.Dom.selectAll('.selectionFrame.tableSelection', frameContainer).forEach(el => el.remove());
	};

	const getCellIdsForRange = (anchor: { rowId: string; columnId: string }, target: { rowId: string; columnId: string }): string[] => {
		const rowIdx1 = rows.findIndex(r => r.id === anchor.rowId);
		const rowIdx2 = rows.findIndex(r => r.id === target.rowId);
		const colIdx1 = columns.findIndex(c => c.id === anchor.columnId);
		const colIdx2 = columns.findIndex(c => c.id === target.columnId);

		if ((rowIdx1 < 0) || (rowIdx2 < 0) || (colIdx1 < 0) || (colIdx2 < 0)) {
			return [];
		};

		const minRow = Math.min(rowIdx1, rowIdx2);
		const maxRow = Math.max(rowIdx1, rowIdx2);
		const minCol = Math.min(colIdx1, colIdx2);
		const maxCol = Math.max(colIdx1, colIdx2);

		const ids: string[] = [];
		for (let r = minRow; r <= maxRow; r++) {
			for (let c = minCol; c <= maxCol; c++) {
				ids.push([ rows[r].id, columns[c].id ].join('-'));
			};
		};
		return ids;
	};

	const getCellIdsForRow = (rowId: string): string[] => {
		return columns.map(col => [ rowId, col.id ].join('-'));
	};

	const getCellIdsForColumn = (columnId: string): string[] => {
		return rows.map(row => [ row.id, columnId ].join('-'));
	};

	const getCellIdsForRowRange = (rowId1: string, rowId2: string): string[] => {
		const idx1 = rows.findIndex(r => r.id === rowId1);
		const idx2 = rows.findIndex(r => r.id === rowId2);

		if ((idx1 < 0) || (idx2 < 0)) {
			return [];
		};

		const min = Math.min(idx1, idx2);
		const max = Math.max(idx1, idx2);
		const ids: string[] = [];

		for (let r = min; r <= max; r++) {
			columns.forEach(col => ids.push([ rows[r].id, col.id ].join('-')));
		};
		return ids;
	};

	const getCellIdsForColumnRange = (colId1: string, colId2: string): string[] => {
		const idx1 = columns.findIndex(c => c.id === colId1);
		const idx2 = columns.findIndex(c => c.id === colId2);

		if ((idx1 < 0) || (idx2 < 0)) {
			return [];
		};

		const min = Math.min(idx1, idx2);
		const max = Math.max(idx1, idx2);
		const ids: string[] = [];

		for (let c = min; c <= max; c++) {
			rows.forEach(row => ids.push([ row.id, columns[c].id ].join('-')));
		};
		return ids;
	};

	const onTableKeyDown = (e: any) => {
		if (!selectedCells.current.size) {
			return;
		};

		keyboard.shortcut('escape', e, () => {
			e.preventDefault();
			e.stopPropagation();
			clearTableSelection();
		});

		keyboard.shortcut(`${keyboard.cmdKey()}+c, ${keyboard.cmdKey()}+x`, e, (pressed: string) => {
			e.preventDefault();
			e.stopPropagation();

			const ids = [ ...selectedCells.current ].filter(id => S.Block.getLeaf(rootId, id));
			if (!ids.length) {
				return;
			};

			const mode = pressed.match('x') ? I.ClipboardMode.Cut : I.ClipboardMode.Copy;
			Action.copyBlocks(rootId, ids, mode);

			if (mode == I.ClipboardMode.Cut) {
				clearTableSelection();
			};
		});

		keyboard.shortcut('backspace, delete', e, () => {
			if (readonly) {
				return;
			};

			e.preventDefault();
			e.stopPropagation();

			const ids = [ ...selectedCells.current ].filter(id => S.Block.getLeaf(rootId, id));
			if (ids.length) {
				C.BlockTextListClearContent(rootId, ids);
			};
			clearTableSelection();
		});
	};

	const onPlus = (e: any) => {
		C.BlockTableExpand(rootId, block.id, 1, 1);
	};

	const onPlusV = (e: any) => {
		C.BlockTableColumnCreate(rootId, columns[columns.length - 1].id, I.BlockPosition.Right);
	};

	const onPlusH = (e: any) => {
		C.BlockTableRowCreate(rootId, rows[rows.length - 1].id, I.BlockPosition.Bottom);
	};

	const onRowUpdate = (rowId: string) => {
		if (rowRef.current == rowId) {
			onOptionsOpen(I.BlockType.TableRow, rowId, '', '');
		};
	};

	const onCellUpdate = (cellId: string) => {
		if (cellRef.current == cellId) {
			setEditing(cellId);
		};
	};

	const onCellMouseDown = (e: any, rowId: string, columnId: string, cellId: string): boolean => {
		if (readonly) {
			return false;
		};

		if (keyboard.isCmd(e) || e.shiftKey) {
			e.preventDefault();
			e.stopPropagation();

			if (keyboard.isCmd(e)) {
				applyTableSelection([ cellId ], 'toggle');
				selectionAnchor.current = { rowId, columnId };
			} else
			if (e.shiftKey && selectionAnchor.current) {
				const cellIds = getCellIdsForRange(selectionAnchor.current, { rowId, columnId });
				applyTableSelection(cellIds, 'set');
			};

			return true;
		};

		if (selectedCells.current.size > 0) {
			clearTableSelection();
		};

		selectionAnchor.current = { rowId, columnId };
		return false;
	};

	const onCellFocus = (e: any, rowId: string, columnId: string, cellId: string) => {
		const selection = S.Common.getRef('selectionProvider');

		if (readonly) {
			return;
		};

		if (selectedCells.current.size > 0) {
			return;
		};

		selectionAnchor.current = { rowId, columnId };

		const cell = S.Block.getLeaf(rootId, cellId);
		const cb = () => {
			setEditing(cellId);
			keyboard.disableSelection(true);
		};

		if (!cell) {
			C.BlockTableRowListFill(rootId, [ rowId ], () => {
				cb();
				selection.clear();
				focus.setWithTimeout(cellId, { from: 0, to: 0 }, 15);
			});
		} else {
			cb();
		};
	};

	const onCellBlur = (e: any, rowId: string, columnId: string, cellId: string) => {
		setEditing('');
		keyboard.disableSelection(false);
	};

	const onCellClick = (e: any, rowId: string, columnId: string, cellId: string) => {
		if (keyboard.isCmd(e) || e.shiftKey) {
			return;
		};

		if (selectedCells.current.size > 0) {
			clearTableSelection();
		};

		if (!readonly) {
			onCellFocus(e, rowId, columnId, cellId);
		};
	};

	const onCellEnter = (e: any, rowId: string, columnId: string, id: string) => {
		const rowIdx = rows.findIndex(it => it.id == rowId);
		const columnIdx = columns.findIndex(it => it.id == columnId);
		const isLastRow = rowIdx == rows.length - 1;
		const isLastColumn = columnIdx == columns.length - 1;

		if (!isLastRow || !isLastColumn) {
			return;
		};

		const node = nodeRef.current;
		const plusC = U.Dom.select('#plus-c', node);
		const plusV = U.Dom.select('#plus-v', node);
		const plusH = U.Dom.select('#plus-h', node);

		if (plusC) {
			U.Dom.addClass(plusC, 'active');
		};

		if (isLastColumn && plusV) {
			U.Dom.addClass(plusV, 'active');
		};

		if (isLastRow && plusH) {
			U.Dom.addClass(plusH, 'active');
		};
	};

	const onCellLeave = (e: any, rowId: string, columnId: string, id: string) => {
		const rowIdx = rows.findIndex(it => it.id == rowId);
		const columnIdx = columns.findIndex(it => it.id == columnId);
		const isLastRow = rowIdx == rows.length - 1;
		const isLastColumn = columnIdx == columns.length - 1;

		if (!isLastRow || !isLastColumn) {
			return;
		};

		const node = nodeRef.current;
		const plusC = U.Dom.select('#plus-c', node);
		const plusV = U.Dom.select('#plus-v', node);
		const plusH = U.Dom.select('#plus-h', node);

		if (plusC) {
			U.Dom.removeClass(plusC, 'active');
		};

		if (isLastColumn && plusV) {
			U.Dom.removeClass(plusV, 'active');
		};

		if (isLastRow && plusH) {
			U.Dom.removeClass(plusH, 'active');
		};
	};

	const onCellKeyDown = (e: any, rowId: string, columnId: string, id: string, text: string, marks: I.Mark[], range: I.TextRange, props: any) => {
		let ret = false;

		// Handle row reordering with Ctrl+Shift+Up/Down
		keyboard.shortcut('moveSelectionUp, moveSelectionDown', e, (pressed: string) => {
			e.preventDefault();
			e.stopPropagation();

			const dir = pressed == 'moveSelectionUp' ? -1 : 1;
			const position = dir < 0 ? I.BlockPosition.Top : I.BlockPosition.Bottom;
			const idx = rows.findIndex(row => row.id === rowId);
			const nextIdx = idx + dir;

			ret = true;

			if ((idx < 0) || (nextIdx < 0) || (nextIdx >= rows.length)) {
				return;
			};

			const nextRow = rows[nextIdx];
			if (nextRow && !nextRow.content.isHeader) {
				onSortEndRow(rowId, nextRow.id, position);
			};
		});

		keyboard.shortcut('tableCellOptions', e, () => {
			e.preventDefault();

			ret = true;
			onOptions(e, I.BlockType.Text, rowId, columnId, id);
		});

		if (!ret) {
			onKeyDown(e, text, marks, range, props);
			framesUpdate();
		}
	};

	const onCellKeyUp = (e: any, rowId: string, columnId: string, id: string, text: string, marks: I.Mark[], range: I.TextRange, props: any) => {
		framesUpdate();
	};

	const setEditing = (id: string) => {
		cellRef.current = id;

		const node = nodeRef.current;
		U.Dom.selectAll('.cell.isEditing', node).forEach(el => U.Dom.removeClass(el, 'isEditing'));

		if (id) {
			const cellEl = U.Dom.select(`#cell-${U.Common.esc(id)}`, node);
			if (cellEl) {
				U.Dom.addClass(cellEl, 'isEditing');
			};
			
			frameRemove([ I.BlockPosition.None ]);
			frameAdd(I.BlockType.Text, '', '', id, I.BlockPosition.None);
		} else {
			frameRemove([ I.BlockPosition.None ]);
		};
	};

	const tableResizeMoveRef = useRef<((e: MouseEvent) => void) | null>(null);
	const tableResizeEndRef = useRef<((e: MouseEvent) => void) | null>(null);

	const onResizeStart = (e: any, id: string) => {
		e.preventDefault();
		e.stopPropagation();

		const node = nodeRef.current;
		const cells = U.Dom.selectAll(`.cell.column${id}`, node);

		if (cells.length) {
			const rect = cells[0].getBoundingClientRect();
			offsetX.current = rect.left + window.scrollX;
		};

		setEditing('');
		focus.clear(true);

		U.Dom.addClass(document.body, 'colResize');

		if (tableResizeMoveRef.current) {
			U.Dom.removeEvent(window, 'mousemove', tableResizeMoveRef.current);
		};
		if (tableResizeEndRef.current) {
			U.Dom.removeEvent(window, 'mouseup', tableResizeEndRef.current);
		};

		tableResizeMoveRef.current = throttle((e: MouseEvent) => onResizeMove(e, id), 40);
		tableResizeEndRef.current = (e: MouseEvent) => onResizeEnd(e, id);

		U.Dom.addEvents(window, [
			['mousemove', tableResizeMoveRef.current],
			['mouseup', tableResizeEndRef.current],
		]);

		keyboard.setResize(true);
	};

	const onResizeMove = (e: any, id: string) => {
		e.preventDefault();
		e.stopPropagation();

		const idx = columns.findIndex(it => it.id == id);
		const widths = getColumnWidths();

		widths[idx] = checkWidth(e.pageX - offsetX.current);

		setColumnWidths(widths);
		resize();
	};

	const onResizeEnd = (e: any, id: string) => {
		const width = checkWidth(e.pageX - offsetX.current);

		C.BlockListSetFields(rootId, [
			{ blockId: id, fields: { width } },
		]);

		if (tableResizeMoveRef.current) {
			U.Dom.removeEvent(window, 'mousemove', tableResizeMoveRef.current);
			tableResizeMoveRef.current = null;
		};
		if (tableResizeEndRef.current) {
			U.Dom.removeEvent(window, 'mouseup', tableResizeEndRef.current);
			tableResizeEndRef.current = null;
		};
		U.Dom.removeClass(document.body, 'colResize');
		keyboard.setResize(false);
	};

	const getColumnWidths = (): number[] => {
		const ret = [];

		columns.forEach((it: I.Block) => {
			ret.push(checkWidth(it.fields?.width ?? J.Size.table.default));
		});

		return ret;
	};

	const setColumnWidths = (widths: number[]) => {
		const node = nodeRef.current;
		const rowEls = U.Dom.selectAll('.row', node);
		const gridTemplateColumns = widths.map(it => `${it}px`).join(' ');

		rowEls.forEach((item) => {
			U.Dom.css(item, { gridTemplateColumns });
		});
	};

	const tableDragOverRef = useRef<((e: Event) => void) | null>(null);
	const tableDragColumnMoveRef = useRef<((e: Event) => void) | null>(null);
	const tableDragColumnEndRef = useRef<((e: Event) => void) | null>(null);
	const tableDragRowMoveRef = useRef<((e: Event) => void) | null>(null);
	const tableDragRowEndRef = useRef<((e: Event) => void) | null>(null);

	const onDragStartColumn = (e: any, id: string) => {
		e.stopPropagation();
		clearTableSelection();

		const node = nodeRef.current;
		const table = document.createElement('div');
		table.className = 'table isClone';
		const widths = getColumnWidths();
		const idx = columns.findIndex(it => it.id == id);
		const cells = U.Dom.selectAll(`.cell.column${id}`, node);

		rows.forEach((row: I.Block, i: number) => {
			const rowElement = document.createElement('div');
			rowElement.className = 'row';
			const cell = cells[i];
			if (cell) {
				const clone = cell.cloneNode(true) as HTMLElement;
				U.Dom.css(clone, { height: `${cell.offsetHeight}px` });
				rowElement.appendChild(clone);
			};
			table.appendChild(rowElement);
		});

		U.Dom.css(table, { width: `${widths[idx]}px`, zIndex: '10000', position: 'fixed', left: '-10000px', top: '-10000px' });
		node?.appendChild(table);

		if (tableDragOverRef.current) {
			U.Dom.removeEvent(document, 'dragover', tableDragOverRef.current);
		};
		tableDragOverRef.current = (e: Event) => e.preventDefault();
		U.Dom.addEvent(document, 'dragover', tableDragOverRef.current);
		e.dataTransfer.setDragImage(table, table.offsetWidth, 0);

		tableDragColumnMoveRef.current = throttle((e: Event) => onDragMoveColumn(e, id), 40);
		tableDragColumnEndRef.current = (e: Event) => onDragEndColumn(e, id);
		U.Dom.addEvents(window, [
			['drag', tableDragColumnMoveRef.current],
			['dragend', tableDragColumnEndRef.current],
		]);

		onSortStart();
		initCache(I.BlockType.TableColumn);
		setEditing('');
		onOptionsOpen(I.BlockType.TableColumn, '', id, '');

		keyboard.disableCommonDrop(true);
		keyboard.disableSelection(true);
	};

	const onDragMoveColumn = (e: any, id: string) => {
		const current = cache.current[id];
		if (!current) {
			return;
		};

		hoverId.current = '';
		position.current = I.BlockPosition.None;

		for (let i = 0; i < columns.length; ++i) {
			const column = columns[i];
			const rect = cache.current[column.id];

			if (id == column.id) {
				continue;
			};

			if (rect && U.Common.rectsCollide({ x: e.pageX, y: 0, width: current.width, height: current.height }, rect)) {
				hoverId.current = column.id;
				position.current = (i < current.index) ? I.BlockPosition.Left : I.BlockPosition.Right;
				break;
			};
		};

		if (frame.current) {
			raf.cancel(frame.current);
			frame.current = 0;
		};

		frame.current = raf(() => {
			frameRemove([ I.BlockPosition.Left, I.BlockPosition.Right ]);
			frameAdd(I.BlockType.TableColumn, '', hoverId.current, '', position.current);
		});
	};

	const onDragEndColumn = (e: any, id: string) => {
		e.preventDefault();

		const node = nodeRef.current;

		if (frame.current) {
			raf.cancel(frame.current);
			frame.current = 0;
		};

		cache.current = {};
		onSortEndColumn(id, hoverId.current, position.current);
		onOptionsClose();
		frameRemove([ I.BlockPosition.Left, I.BlockPosition.Right ]);

		keyboard.disableCommonDrop(false);
		keyboard.disableSelection(false);

		if (tableDragColumnMoveRef.current) {
			U.Dom.removeEvent(window, 'drag', tableDragColumnMoveRef.current);
			tableDragColumnMoveRef.current = null;
		};
		if (tableDragColumnEndRef.current) {
			U.Dom.removeEvent(window, 'dragend', tableDragColumnEndRef.current);
			tableDragColumnEndRef.current = null;
		};
		U.Dom.selectAll('.table.isClone', node).forEach(el => el.remove());
		U.Dom.selectAll('.cell.isOver', node).forEach(el => {
			U.Dom.removeClass(el, 'isOver');
			U.Dom.removeClass(el, 'left');
			U.Dom.removeClass(el, 'right');
		});
	};

	const onDragStartRow = (e: any, id: string) => {
		e.stopPropagation();
		clearTableSelection();

		const node = nodeRef.current;
		const layer = document.createElement('div');
		const el = U.Dom.select(`#row-${id}`, node);
		const clone = el?.cloneNode(true) as HTMLElement;
		const table = document.createElement('div');
		table.className = 'table isClone';

		U.Dom.css(layer, { zIndex: '10000', position: 'fixed', left: '-10000px', top: '-10000px' });
		node?.appendChild(layer);
		layer.appendChild(table);
		if (clone) {
			table.appendChild(clone);
		};

		if (tableDragOverRef.current) {
			U.Dom.removeEvent(document, 'dragover', tableDragOverRef.current);
		};
		tableDragOverRef.current = (e: Event) => e.preventDefault();
		U.Dom.addEvent(document, 'dragover', tableDragOverRef.current);
		e.dataTransfer.setDragImage(layer, 0, table.offsetHeight);

		tableDragRowMoveRef.current = throttle((e: Event) => onDragMoveRow(e, id), 40);
		tableDragRowEndRef.current = (e: Event) => onDragEndRow(e, id);
		U.Dom.addEvents(window, [
			['drag', tableDragRowMoveRef.current],
			['dragend', tableDragRowEndRef.current],
		]);

		onSortStart();
		initCache(I.BlockType.TableRow);
		setEditing('');
		onOptionsOpen(I.BlockType.TableRow, id, '', '');

		keyboard.disableCommonDrop(true);
		keyboard.disableSelection(true);
	};

	const onDragMoveRow = (e: any, id: string) => {
		const current = cache.current[id];

		if (!current) {
			return;
		};

		hoverId.current = '';
		position.current = I.BlockPosition.None;

		for (let i = 0; i < rows.length; ++i) {
			const row = rows[i];
			const rect = cache.current[row.id];

			if (id == row.id) {
				continue;
			};

			if (rect && U.Common.rectsCollide({ x: e.pageX, y: e.pageY, width: current.width, height: current.height }, rect)) {
				hoverId.current = row.id;
				position.current = (i < current.index) ? I.BlockPosition.Top : I.BlockPosition.Bottom;

				if (row.content.isHeader) {
					position.current = I.BlockPosition.Bottom;
				};
				break;
			};
		};

		if (frame.current) {
			raf.cancel(frame.current);
			frame.current = 0;
		};

		frame.current = raf(() => {
			frameRemove([ I.BlockPosition.Top, I.BlockPosition.Bottom ]);
			frameAdd(I.BlockType.TableRow, hoverId.current, '', '', position.current);
		});
	};

	const onDragEndRow = (e: any, id: string) => {
		e.preventDefault();

		const node = nodeRef.current;

		if (frame.current) {
			raf.cancel(frame.current);
			frame.current = 0;
		};

		cache.current = {};
		onSortEndRow(id, hoverId.current, position.current);
		onOptionsClose();
		frameRemove([ I.BlockPosition.Top, I.BlockPosition.Bottom ]);

		keyboard.disableCommonDrop(false);
		keyboard.disableSelection(false);

		if (tableDragRowMoveRef.current) {
			U.Dom.removeEvent(window, 'drag', tableDragRowMoveRef.current);
			tableDragRowMoveRef.current = null;
		};
		if (tableDragRowEndRef.current) {
			U.Dom.removeEvent(window, 'dragend', tableDragRowEndRef.current);
			tableDragRowEndRef.current = null;
		};
		U.Dom.selectAll('.table.isClone', node).forEach(el => el.remove());
		U.Dom.selectAll('.row.isOver', node).forEach(el => {
			U.Dom.removeClass(el, 'isOver');
			U.Dom.removeClass(el, 'top');
			U.Dom.removeClass(el, 'bottom');
		});
	};

	const onScroll = (e: any) => {
		scrollX.current = scrollRef.current?.scrollLeft ?? 0;
	};

	const initCache = (type: I.BlockType) => {
		cache.current = {};

		const node = nodeRef.current;
		switch (type) {
			case I.BlockType.TableColumn: {
				columns.forEach((column: I.Block, i: number) => {
					const cells = U.Dom.selectAll(`.cell.column${column.id}`, node);
					const cell = cells.length ? cells[0] : null;
					if (!cell) {
						return;
					};

					const rect = cell.getBoundingClientRect();

					cache.current[column.id] = {
						x: rect.left + window.scrollX,
						y: 0,
						height: 1,
						width: cell.offsetWidth,
						index: i,
					};
				});
				break;
			};

			case I.BlockType.TableRow: {
				const width = U.Dom.contentWidth(node);

				rows.forEach((row: I.Block, i: number) => {
					const el = U.Dom.select(`#row-${row.id}`, node);
					if (!el) {
						return;
					};

					const rect = el.getBoundingClientRect();

					cache.current[row.id] = {
						x: rect.left + window.scrollX,
						y: rect.top + window.scrollY,
						height: U.Dom.contentHeight(el),
						width: width,
						index: i,
					};
				});
				break;
			};
		};
	};

	const onSortStart = () => {
		U.Dom.addClass(document.body, 'grab');
		keyboard.disableSelection(true);
	};

	const onSortEndColumn = (id: string, targetId: string, position: I.BlockPosition): void => {
		if (!id || !targetId || (position == I.BlockPosition.None)) {
			return;
		};

		C.BlockTableColumnMove(rootId, id, targetId, position);
		U.Dom.removeClass(document.body, 'grab');
		keyboard.disableSelection(false);
	};

	const onSortEndRow = (id: string, targetId: string, position: I.BlockPosition) => {
		if (!id || !targetId || (position == I.BlockPosition.None)) {
			return;
		};

		Action.move(rootId, rootId, targetId, [ id ], position, () => {
			frameRemove([ I.BlockPosition.None ]);
		});

		U.Dom.removeClass(document.body, 'grab');
		keyboard.disableSelection(false);
	};

	const initSize = () => {
		const widths = columns.map(it => checkWidth(it.fields?.width ?? J.Size.table.default));

		setColumnWidths(widths);
		resize();
	};

	const checkWidth = (w: number) => {
		const { min, max } = J.Size.table;
		const steps = 5;

		let width = Math.max(min, Math.min(max, w));
		for (let x = 1; x <= steps; ++x) {
			const s = max / steps * x;
			if ((width >= s - SNAP) && (width <= s + SNAP)) {
				width = s;
			};
		};
		return Math.floor(width);
	};

	const optionsRow = (id: string, isInner?: boolean) => {
		const row = S.Block.getLeaf(rootId, id);
		
		if (!row) {
			return [];
		};

		const isHeader = row.content.isHeader;
		const idx = rows.findIndex(it => it.id == id);
		const length = rows.length;

		let options: any[] = [
			{ 
				id: 'rowHeader', iconParam: { name: 'menu/table/header-row' }, name: translate('blockTableOptionsRowHeaderRow'), withSwitch: true, switchValue: isHeader,
				onSwitch: (e: any, v: boolean, callBack?: () => void) => { 
					C.BlockTableRowSetHeader(rootId, id, v, () => {
						framesUpdate();
						callBack?.();
					}); 
				}
			},
			{ isDiv: true },
		];

		if (!isHeader) {
			const nextTop = getNextRow(id, -1);
			const nextBot = getNextRow(id, 1);

			let moveTop = null;
			let moveBot = null;

			if (nextTop && !nextTop.content.isHeader && (idx > 0)) {
				moveTop = { id: 'rowMoveTop', iconParam: { name: 'menu/table/move-v' }, name: translate('blockTableOptionsRowRowMoveTop') };
			};

			if (nextBot && !nextBot.content.isHeader && (idx < length - 1)) {
				moveBot = { id: 'rowMoveBottom', iconParam: { name: 'menu/table/move-v' }, className: 'rotated', name: translate('blockTableOptionsRowRowMoveBottom') };
			};

			options = options.concat([
				{ id: 'rowBefore', iconParam: { name: 'menu/table/insert-v' }, name: translate('blockTableOptionsRowRowBefore') },
				{ id: 'rowAfter', iconParam: { name: 'menu/table/insert-v' }, className: 'rotated', name: translate('blockTableOptionsRowRowAfter') },
				moveTop,
				moveBot,
				{ id: 'rowCopy', iconParam: { name: 'menu/action/copy' }, name: translate('commonDuplicate') },
				{ isDiv: true },
			]);
		};

		options = options.concat([
			{ id: 'clearContent', iconParam: { name: 'menu/action/clear' }, name: translate('blockTableOptionsClearContent') },
			(length > 1) ? { id: 'rowRemove', iconParam: { name: 'menu/action/remove' }, name: translate('blockTableOptionsRowRowRemove') } : null,
			!isInner ? { isDiv: true } : null,
		]);

		return options;
	};

	const optionsColumn = (id: string, isInner?: boolean) => {
		const idx = columns.findIndex(it => it.id == id);
		const length = columns.length;
		const options: any[] = [
			{ id: 'columnBefore', iconParam: { name: 'menu/table/insert-h' }, name: translate('blockTableOptionsColumnColumnBefore') },
			{ id: 'columnAfter', iconParam: { name: 'menu/table/insert-h' }, className: 'rotated', name: translate('blockTableOptionsColumnColumnAfter') },
			(idx > 0) ? { id: 'columnMoveLeft', iconParam: { name: 'menu/table/move-h' }, name: translate('blockTableOptionsColumnColumnMoveLeft') } : null,
			(idx < length - 1) ? { id: 'columnMoveRight', iconParam: { name: 'menu/table/move-h' }, className: 'rotated', name: translate('blockTableOptionsColumnColumnMoveRight') } : null,
			{ id: 'columnCopy', iconParam: { name: 'menu/action/copy' }, name: translate('commonDuplicate') },
			{ isDiv: true },
			{ id: 'clearContent', iconParam: { name: 'menu/action/clear' }, name: translate('blockTableOptionsClearContent') },
			(length > 1) ? { id: 'columnRemove', iconParam: { name: 'menu/action/remove' }, name: translate('blockTableOptionsColumnColumnRemove') } : null,
			!isInner ? { isDiv: true } : null,
		];
		return options;
	};

	const optionsColor = (cellId: string) => {
		const current = S.Block.getLeaf(rootId, cellId);
		const innerColor = <div className={[ 'inner', `textColor textColor-${current?.content.color || 'default'}` ].join(' ')} />;
		const innerBackground = <div className={[ 'inner', `bgColor bgColor-${current?.bgColor || 'default'}` ].join(' ')} />;

		return [
			{ id: 'color', iconParam: { name: 'color' }, name: translate('blockTableOptionsColorColor'), inner: innerColor, arrow: true },
			{ id: 'background', iconParam: { name: 'color' }, name: translate('blockTableOptionsColorBackground'), inner: innerBackground, arrow: true },
			{ id: 'style', iconParam: { name: 'paragraph' }, name: translate('blockTableOptionsColorStyle'), arrow: true },
			{ id: 'clearStyle', iconParam: { name: 'menu/action/clear' }, name: translate('blockTableOptionsColorClearStyle') },
			{ isDiv: true },
		];
	};

	const optionsAlign = (cellId: string) => {
		const current = S.Block.getLeaf(rootId, cellId);

		return [
			{ id: 'horizontal', iconParam: { name: U.Data.alignHIcon(current?.hAlign) }, name: translate('blockTableOptionsAlignText'), arrow: true },
			{ id: 'vertical', iconParam: { name: U.Data.alignVIcon(current?.vAlign) }, name: translate('blockTableOptionsAlignVertical'), arrow: true },
		];
	};

	const optionsStyle = (cellId: string) => {
		const current = S.Block.getLeaf(rootId, cellId);
		const length = Number(current?.getLength()) || 0;
		const ret: any[] = [
			{ id: I.MarkType.Bold, iconParam: { name: 'menu/mark/bold' }, name: translate('commonBold') },
			{ id: I.MarkType.Italic, iconParam: { name: 'menu/mark/italic' }, name: translate('commonItalic') },
			{ id: I.MarkType.Strike, iconParam: { name: 'menu/mark/strike' }, name: translate('commonStrikethrough') },
			{ id: I.MarkType.Underline, iconParam: { name: 'menu/mark/underline' }, name: translate('commonUnderline') },
		];

		return ret.map(it => {
			it.checkbox = current ? !!Mark.getInRange(current.content.marks, it.id, { from: 0, to: length }) : false;
			return it;
		});
	};

	const optionsSort = () => {
		return [
			{ id: I.SortType.Asc, name: translate('commonAscending') },
			{ id: I.SortType.Desc, name: translate('commonDescending') },
		];
	};

	const getBlockIds = (type: I.BlockType, rowId: string, columnId: string, cellId: string): string[] => {
		const blockIds: string[] = [];

		switch (type) {
			case I.BlockType.TableRow:
				columns.forEach(column => {
					blockIds.push([ rowId, column.id ].join('-'));
				});
				break;

			case I.BlockType.TableColumn:
				rows.forEach(row => {
					blockIds.push([ row.id, columnId ].join('-'));
				});
				break;

			default:
				blockIds.push(cellId);
				break;
		};

		return blockIds;
	};

	const frameAdd = (type: I.BlockType, rowId: string, columnId: string, cellId: string, position: I.BlockPosition) => {
		const node = nodeRef.current;
		const table = U.Dom.select('#table', node);
		const frameContainer = U.Dom.select('#selectionFrameContainer', node);
		const containerRect = frameContainer?.getBoundingClientRect();
		const containerOffset = { left: (containerRect?.left ?? 0) + window.scrollX, top: (containerRect?.top ?? 0) + window.scrollY };
		const id = [ type, rowId, columnId, cellId, position ].join('-');

		let obj: HTMLElement | null = null;
		let offset: any = null;
		let x = 0;
		let y = 0;
		let w = 0;
		let h = 0;

		switch (type) {
			case I.BlockType.TableRow: {
				if (!rowId) {
					return;
				};

				obj = U.Dom.select(`#row-${rowId}`, table);
				if (!obj) {
					return;
				};

				const objRect = obj.getBoundingClientRect();
				offset = { left: objRect.left + window.scrollX, top: objRect.top + window.scrollY };

				x = offset.left - containerOffset.left;
				y = offset.top - containerOffset.top;
				w = obj.offsetWidth;
				h = obj.offsetHeight;
				break;
			};

			case I.BlockType.TableColumn: {
				if (!columnId) {
					return;
				};

				const cells = U.Dom.selectAll(`.cell.column${columnId}`, table);

				cells.forEach((cellEl: HTMLElement, i: number) => {
					if (i == 0) {
						const cellRect = cellEl.getBoundingClientRect();
						offset = { left: cellRect.left + window.scrollX, top: cellRect.top + window.scrollY };
						x = offset.left - containerOffset.left;
						y = offset.top - containerOffset.top;
						w = cellEl.offsetWidth;
					};

					h += cellEl.offsetHeight;
				});
				break;
			};

			default: {
				if (!cellId) {
					return;
				};

				obj = U.Dom.select(`#cell-${U.Common.esc(cellId)}`, table);
				if (!obj) {
					return;
				};

				const objRect = obj.getBoundingClientRect();
				offset = { left: objRect.left + window.scrollX, top: objRect.top + window.scrollY };

				x = offset.left - containerOffset.left;
				y = offset.top - containerOffset.top;
				w = obj.offsetWidth;
				h = obj.offsetHeight;
				break;
			};
		};

		x -= 1;
		y -= 1;
		w += 2;
		h += 2;

		const frame = { id, x, y, w, h, type, rowId, columnId, cellId, position };
		
		let current = frames.current.find(it => it.id == frame.id);
		if (!current) {
			current = frame;
			frames.current.push(current);
		} else {
			current = Object.assign(current, frame);
		};

		frameRender(current);
	};

	const frameRemove = (positions: I.BlockPosition[]) => {
		const node = nodeRef.current;
		const frameContainer = U.Dom.select('#selectionFrameContainer', node);

		frames.current = frames.current.filter(it => !positions.includes(it.position));

		positions.forEach((it: I.BlockPosition) => {
			const c = getClassByPosition(it);
			U.Dom.selectAll(`.selectionFrame${c ? `.${c}` : ''}`, frameContainer).forEach(el => el.remove());
		});
	};

	const frameRender = (item: any) => {
		const node = nodeRef.current;
		const frameContainer = U.Dom.select('#selectionFrameContainer', node);
		const c = getClassByPosition(item.position);

		let obj = U.Dom.select(`#frame-${item.id}`, frameContainer);
		if (!obj) {
			obj = document.createElement('div');
			obj.className = 'selectionFrame';
			obj.id = `frame-${item.id}`;
			if (c) {
				U.Dom.addClass(obj, c);
			};
			frameContainer?.appendChild(obj);
		};

		U.Dom.css(obj, { left: `${item.x}px`, top: `${item.y}px`, width: `${item.w}px`, height: `${item.h}px` });
	};

	const framesUpdate = () => {
		frames.current.forEach(it => {
			frameAdd(it.type, it.rowId, it.columnId, it.cellId, it.position);
		});
	};

	const getClassByPosition = (position: I.BlockPosition) => {
		return I.BlockPosition[position].toLowerCase();
	};

	const getNextRow = (id: string, dir: number) => {
		const idx = rows.findIndex(it => it.id == id);
		const nextIdx = idx + dir;
		const next = rows[nextIdx];

		return next;
	};

	const resize = () => {
		const parent = S.Block.getParentLeaf(rootId, block.id);

		if (!parent || !rows.length) {
			return;
		};

		const node = nodeRef.current;
		const wrap = scrollRef.current;
		const row = U.Dom.select(`#row-${U.Common.esc(rows[0].id)}`, node);
		const obj = U.Dom.get(`block-${block.id}`);

		if (frameResize.current) {
			raf.cancel(frameResize.current);
		};

		frameResize.current = raf(() => {
			let width = J.Size.blockMenu + 10;
			let maxWidth = 0;
			let wrapperWidth = 0;

			const gridCols = row ? getComputedStyle(row).gridTemplateColumns : '';
			String(gridCols || '').split(' ').forEach(it => width += parseInt(it));
			if (obj) {
				U.Dom.css(obj, { width: 'auto', marginLeft: '0' });
			};

			if (parent.isPage() || parent.isLayoutDiv()) {
				const container = U.Dom.getPageContainer(isPopup);

				maxWidth = (container?.clientWidth ?? 0) - PADDING;
				wrapperWidth = getWrapperWidth() + J.Size.blockMenu;

				U.Dom.toggleClass(wrap, 'withScroll', width > maxWidth);
				width = Math.max(wrapperWidth, Math.min(maxWidth, width));

				if (obj) {
					U.Dom.css(obj, {
						width: (width >= wrapperWidth) ? `${width}px` : 'auto',
						marginLeft: (width >= wrapperWidth) ? `${Math.min(0, (wrapperWidth - width) / 2)}px` : '',
					});
				};
			} else {
				const parentObj = U.Dom.get(`block-${parent.id}`);
				if (parentObj) {
					maxWidth = U.Dom.contentWidth(parentObj) - J.Size.blockMenu;
				};

				U.Dom.toggleClass(wrap, 'withScroll', width > maxWidth);
			};
		});
	};

	const buttons = [
		{ id: 'v', className: 'vertical', onClick: onPlusV },
		{ id: 'h', className: 'horizontal', onClick: onPlusH },
		{ id: 'c', className: 'circle', onClick: onPlus },
	];

	return (
		<div
			ref={nodeRef}
			id="wrap"
			tabIndex={0}
			className={cn.join(' ')}
			onKeyDown={onTableKeyDown}
		>
			<div 
				ref={scrollRef} 
				id="scrollWrap" 
				className="scrollWrap" 
				onScroll={onScroll}
			>
				<div className="inner">
					<div id="selectionFrameContainer" />

					<div ref={tableRef} id="table" className="table">
						<div className="rows">
							{rows.map((row: any, i: number) => {
								return (
									<Row 
										key={`block-${block.id}-row-${row.id}`}
										{...props}
										block={row}
										index={i}
										getData={() => data}
										onOptions={onOptions}
										onEnterHandle={onEnterHandle}
										onLeaveHandle={onLeaveHandle}
										onHandleRow={onHandleRow}
										onHandleColumn={onHandleColumn}
										onRowUpdate={onRowUpdate}
										onCellUpdate={onCellUpdate}
										onCellClick={onCellClick}
										onCellMouseDown={onCellMouseDown}
										onCellFocus={onCellFocus}
										onCellBlur={onCellBlur}
										onCellEnter={onCellEnter}
										onCellLeave={onCellLeave}
										onCellKeyDown={onCellKeyDown}
										onCellKeyUp={onCellKeyUp}
										onResizeStart={onResizeStart}
										onDragStartRow={onDragStartRow}
										onDragStartColumn={onDragStartColumn}
									/>
								);
							})}
						</div>
					</div>
					{!readonly ? (
						<>
							{buttons.map(item => (
								<div 
									key={`plus-${item.id}`}
									id={`plus-${item.id}`} 
									className={`plusButton ${item.className}`} 
									onClick={item.onClick}
								>
									<Icon name="plus/table" size={10} />
								</div>
							))}
						</>
					) : ''}
				</div>
			</div>
		</div>
	);
	
});

export default BlockTable;