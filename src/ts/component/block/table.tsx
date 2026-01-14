import React, { forwardRef, useEffect, useRef } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { throttle } from 'lodash';
import { Icon } from 'Component';
import { I, C, S, U, J, keyboard, focus, Mark, Action, translate } from 'Lib';
import Row from './table/row';

const PADDING = 46;
const SNAP = 10;

const BlockTable = observer(forwardRef<I.BlockRef, I.BlockComponent>((props, ref) => {

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
	const cn = [ 'wrap', 'focusable', `c${block.id}`, 'resizable' ];

	// Subscriptions
	columns.forEach((column: I.Block) => {
		const { width } = column.fields || {};
	});

	useEffect(() => {
		initSize();
		resize();
		rebind();

		return () => {
			unbind();
		};
	}, []);

	useEffect(() => {
		initSize();
		resize();

		$(scrollRef.current).scrollLeft(scrollX.current);
	});
	
	const unbind = () => {
		$(window).off(`resize.${block.id}`);
		$(nodeRef.current).off('resizeInit resizeMove');
	};

	const rebind = () => {
		const win = $(window);

		unbind();
		win.on(`resize.${block.id}`, () => raf(() => resize()));
		$(nodeRef.current).on('resizeInit resizeMove', e => resize());
	};

	const onHandleColumn = (e: any, type: I.BlockType, rowId: string, columnId: string, cellId: string) => {
		e.persist();
		e.preventDefault();
		e.stopPropagation();

		onOptions(e, type, rowId, columnId, cellId);
	};

	const onHandleRow = (e: any, type: I.BlockType, rowId: string, columnId: string, cellId: string) => {
		e.persist();
		e.preventDefault();
		e.stopPropagation();

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
					{ id: 'sort', icon: 'sort', name: translate('commonSort'), arrow: true },
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

	const onOptions = (e: any, type: I.BlockType, rowId: string, columnId: string, cellId: string) => {
		e.preventDefault();
		e.stopPropagation();

		const current: any = S.Block.getLeaf(rootId, cellId) || {};
		const node = $(nodeRef.current);
		const options: any[] = getOptions(type, rowId, columnId, cellId);
		
		let blockIds = [];
		let menuContext: any = null;
		let menuParam: any = {
			component: 'select',
			onOpen: (context: any) => {
				menuContext = context;
				raf(() => onOptionsOpen(type, rowId, columnId, cellId)); 
			},
			onClose: () => {
				S.Menu.closeAll(J.Menu.table);
				onOptionsClose();
			},
			subIds: J.Menu.table,
		};

		let element: any = null;
		let fill: any = null;
		let style: any[] = [];

		switch (type) {
			case I.BlockType.TableRow: {
				style = optionsStyle('');

				element = node.find(`#row-${rowId} .handleRow`);
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

				element = node.find(`#cell-${cellId}`).first();
				menuParam = Object.assign(menuParam, {
					offsetX: element.outerWidth() + 2,
					offsetY: -element.outerHeight(),
				});

				fill = (callBack: () => void) => {
					blockIds = getBlockIds(type, rowId, columnId, cellId);
					C.BlockTableColumnListFill(rootId, [ columnId ], callBack);
				};
				break;
			};

			default: {
				style = optionsStyle(cellId);

				element = node.find(`#cell-${cellId} .icon.menu .inner`);
				menuParam = Object.assign(menuParam, {
					vertical: I.MenuDirection.Center,
					offsetX: 12,
				});

				fill = (callBack: () => void) => {
					blockIds = getBlockIds(type, rowId, columnId, cellId);
					C.BlockTableRowListFill(rootId, [ rowId ], callBack);
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
						element: `#${menuContext.getId()} #item-${item.id}`,
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

		const table = $(tableRef.current);

		switch (type) {
			case I.BlockType.TableColumn: {
				const cells = table.find(`.cell.column${columnId}`);

				cells.addClass('isHighlightedColumn');
				cells.first().addClass('isFirst');
				cells.last().addClass('isLast');
				cells.find('.handleColumn').addClass('isActive');
				break;
			};

			case I.BlockType.TableRow: {
				const row = table.find(`#row-${rowId}`);

				rowRef.current = rowId;

				row.addClass('isHighlightedRow');
				row.find('.handleRow').addClass('isActive');
				break;
			};

			default: {
				table.find(`#cell-${cellId}`).addClass('isHighlightedCell');
				break;
			};
		};

		frameRemove([ I.BlockPosition.None ]);
		frameAdd(type, rowId, columnId, cellId, I.BlockPosition.None);
	};

	const onOptionsClose = () => {
		const table = $(tableRef.current);
	
		table.find('.isHighlightedColumn').removeClass('isHighlightedColumn isFirst isLast');
		table.find('.isHighlightedRow').removeClass('isHighlightedRow');
		table.find('.isHighlightedCell').removeClass('isHighlightedCell');

		table.find('.handleColumn.isActive').removeClass('isActive');
		table.find('.handleRow.isActive').removeClass('isActive');

		rowRef.current = '';
		setEditing('');
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

	const onCellFocus = (e: any, rowId: string, columnId: string, cellId: string) => {
		const selection = S.Common.getRef('selectionProvider');

		if (readonly) {
			return;
		};

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

		const node = $(nodeRef.current);
		const plusC = node.find('#plus-c');
		const plusV = node.find('#plus-v');
		const plusH = node.find('#plus-h');

		plusC.addClass('active');

		if (isLastColumn) {
			plusV.addClass('active');
		};

		if (isLastRow) {
			plusH.addClass('active');
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

		const node = $(nodeRef.current);
		const plusC = node.find('#plus-c');
		const plusV = node.find('#plus-v');
		const plusH = node.find('#plus-h');

		plusC.removeClass('active');

		if (isLastColumn) {
			plusV.removeClass('active');
		};

		if (isLastRow) {
			plusH.removeClass('active');
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

		const node = $(nodeRef.current);
		node.find('.cell.isEditing').removeClass('isEditing');

		if (id) {
			node.find(`#cell-${id}`).addClass('isEditing');
			
			frameRemove([ I.BlockPosition.None ]);
			frameAdd(I.BlockType.Text, '', '', id, I.BlockPosition.None);
		} else {
			frameRemove([ I.BlockPosition.None ]);
		};
	};

	const onResizeStart = (e: any, id: string) => {
		e.preventDefault();
		e.stopPropagation();

		const win = $(window);
		const body = $('body');
		const node = $(nodeRef.current);
		const el = node.find(`.cell.column${id}`);

		if (el.length) {
			offsetX.current = el.first().offset().left;
		};

		setEditing('');
		focus.clear(true);

		body.addClass('colResize');
		win.off('mousemove.table mouseup.table');
		win.on('mousemove.table', throttle(e => onResizeMove(e, id), 40));
		win.on('mouseup.table', e => onResizeEnd(e, id));

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

		$(window).off('mousemove.table mouseup.table');
		$('body').removeClass('colResize');
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
		const node = $(nodeRef.current);
		const rows = node.find('.row');
		const gridTemplateColumns = widths.map(it => `${it}px`).join(' ');

		rows.each((i, item) => {
			item.style.gridTemplateColumns = gridTemplateColumns;
		});
	};

	const onDragStartColumn = (e: any, id: string) => {
		e.stopPropagation();

		const win = $(window);
		const node = $(nodeRef.current);
		const table = $('<div />').addClass('table isClone');
		const widths = getColumnWidths();
		const idx = columns.findIndex(it => it.id == id);

		rows.forEach((row: I.Block, i: number) => {
			const rowElement = $('<div />').addClass('row');
			const cell = $(node.find(`.cell.column${id}`).get(i));
			const clone = cell.clone();

			clone.css({ height: cell.outerHeight() });

			rowElement.append(clone);
			table.append(rowElement);
		});

		table.css({ width: widths[idx], zIndex: 10000, position: 'fixed', left: -10000, top: -10000 });
		node.append(table);

		$(document).off('dragover').on('dragover', e => e.preventDefault());
		e.dataTransfer.setDragImage(table.get(0), table.outerWidth(), 0);

		win.on('drag.tableColumn', throttle(e => onDragMoveColumn(e, id), 40));
		win.on('dragend.tableColumn', e => onDragEndColumn(e, id));

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

		const node = $(nodeRef.current);
		const win = $(window);

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

		win.off('drag.tableColumn dragend.tableColumn');
		node.find('.table.isClone').remove();
		node.find('.cell.isOver').removeClass('isOver left right');
	};

	const onDragStartRow = (e: any, id: string) => {
		e.stopPropagation();

		const win = $(window);
		const node = $(nodeRef.current);
		const layer = $('<div />');
		const el = node.find(`#row-${id}`);
		const clone = el.clone();
		const table = $('<div />').addClass('table isClone');

		layer.css({ zIndex: 10000, position: 'fixed', left: -10000, top: -10000 });
		node.append(layer);
		layer.append(table);
		table.append(clone);
		
		$(document).off('dragover').on('dragover', e => e.preventDefault());
		e.dataTransfer.setDragImage(layer.get(0), 0, table.outerHeight());

		win.on('drag.tableRow', throttle(e => onDragMoveRow(e, id), 40));
		win.on('dragend.tableRow', e => onDragEndRow(e, id));

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

		const node = $(nodeRef.current);
		const win = $(window);

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

		win.off('drag.tableRow dragend.tableRow');
		node.find('.table.isClone').remove();
		node.find('.row.isOver').removeClass('isOver top bottom');
	};

	const onScroll = (e: any) => {
		scrollX.current = $(scrollRef.current).scrollLeft();
	};

	const initCache = (type: I.BlockType) => {
		cache.current = {};

		const node = $(nodeRef.current);
		switch (type) {
			case I.BlockType.TableColumn: {
				columns.forEach((column: I.Block, i: number) => {
					const cell = node.find(`.cell.column${column.id}`).first();
					if (!cell.length) {
						return;
					};

					const { left } = cell.offset();

					cache.current[column.id] = {
						x: left,
						y: 0,
						height: 1,
						width: cell.outerWidth(),
						index: i,
					};
				});
				break;
			};

			case I.BlockType.TableRow: {
				const width = node.width();

				rows.forEach((row: I.Block, i: number) => {
					const el = node.find(`#row-${row.id}`).first();
					if (!el.length) {
						return;
					};

					const { left, top } = el.offset();

					cache.current[row.id] = {
						x: left,
						y: top,
						height: el.height(),
						width: width,
						index: i,
					};
				});
				break;
			};
		};
	};

	const onSortStart = () => {
		$('body').addClass('grab');
		keyboard.disableSelection(true);
	};

	const onSortEndColumn = (id: string, targetId: string, position: I.BlockPosition): void => {
		if (!id || !targetId || (position == I.BlockPosition.None)) {
			return;
		};

		C.BlockTableColumnMove(rootId, id, targetId, position);
		$('body').removeClass('grab');
		keyboard.disableSelection(false);
	};

	const onSortEndRow = (id: string, targetId: string, position: I.BlockPosition) => {
		if (!id || !targetId || (position == I.BlockPosition.None)) {
			return;
		};

		Action.move(rootId, rootId, targetId, [ id ], position, () => {
			frameRemove([ I.BlockPosition.None ]);
		});

		$('body').removeClass('grab');
		keyboard.disableSelection(false);
	};

	const initSize = () => {
		const widths = columns.map(it => checkWidth(it.fields?.width ?? J.Size.table.default));

		setColumnWidths(widths);
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
				id: 'rowHeader', icon: 'table-header-row', name: translate('blockTableOptionsRowHeaderRow'), withSwitch: true, switchValue: isHeader,
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
				moveTop = { id: 'rowMoveTop', icon: 'table-move-top', name: translate('blockTableOptionsRowRowMoveTop') };
			};

			if (nextBot && !nextBot.content.isHeader && (idx < length - 1)) {
				moveBot = { id: 'rowMoveBottom', icon: 'table-move-bottom', name: translate('blockTableOptionsRowRowMoveBottom') };
			};

			options = options.concat([
				{ id: 'rowBefore', icon: 'table-insert-top', name: translate('blockTableOptionsRowRowBefore') },
				{ id: 'rowAfter', icon: 'table-insert-bottom', name: translate('blockTableOptionsRowRowAfter') },
				moveTop,
				moveBot,
				{ id: 'rowCopy', icon: 'copy', name: translate('commonDuplicate') },
				{ isDiv: true },
			]);
		};

		options = options.concat([
			{ id: 'clearContent', icon: 'clear', name: translate('blockTableOptionsClearContent') },
			(length > 1) ? { id: 'rowRemove', icon: 'remove', name: translate('blockTableOptionsRowRowRemove') } : null,
			!isInner ? { isDiv: true } : null,
		]);

		return options;
	};

	const optionsColumn = (id: string, isInner?: boolean) => {
		const idx = columns.findIndex(it => it.id == id);
		const length = columns.length;
		const options: any[] = [
			{ id: 'columnBefore', icon: 'table-insert-left', name: translate('blockTableOptionsColumnColumnBefore') },
			{ id: 'columnAfter', icon: 'table-insert-right', name: translate('blockTableOptionsColumnColumnAfter') },
			(idx > 0) ? { id: 'columnMoveLeft', icon: 'table-move-left', name: translate('blockTableOptionsColumnColumnMoveLeft') } : null,
			(idx < length - 1) ? { id: 'columnMoveRight', icon: 'table-move-right', name: translate('blockTableOptionsColumnColumnMoveRight') } : null,
			{ id: 'columnCopy', icon: 'copy', name: translate('commonDuplicate') },
			{ isDiv: true },
			{ id: 'clearContent', icon: 'clear', name: translate('blockTableOptionsClearContent') },
			(length > 1) ? { id: 'columnRemove', icon: 'remove', name: translate('blockTableOptionsColumnColumnRemove') } : null,
			!isInner ? { isDiv: true } : null,
		];
		return options;
	};

	const optionsColor = (cellId: string) => {
		const current = S.Block.getLeaf(rootId, cellId);
		const innerColor = <div className={[ 'inner', `textColor textColor-${current?.content.color || 'default'}` ].join(' ')} />;
		const innerBackground = <div className={[ 'inner', `bgColor bgColor-${current?.bgColor || 'default'}` ].join(' ')} />;

		return [
			{ id: 'color', icon: 'color', name: translate('blockTableOptionsColorColor'), inner: innerColor, arrow: true },
			{ id: 'background', icon: 'color', name: translate('blockTableOptionsColorBackground'), inner: innerBackground, arrow: true },
			{ id: 'style', icon: 'paragraph', name: translate('blockTableOptionsColorStyle'), arrow: true },
			{ id: 'clearStyle', icon: 'clear', name: translate('blockTableOptionsColorClearStyle') },
			{ isDiv: true },
		];
	};

	const optionsAlign = (cellId: string) => {
		const current = S.Block.getLeaf(rootId, cellId);

		return [
			{ id: 'horizontal', icon: U.Data.alignHIcon(current?.hAlign), name: translate('blockTableOptionsAlignText'), arrow: true },
			{ id: 'vertical', icon: U.Data.alignVIcon(current?.vAlign), name: translate('blockTableOptionsAlignVertical'), arrow: true },
		];
	};

	const optionsStyle = (cellId: string) => {
		const current = S.Block.getLeaf(rootId, cellId);
		const length = Number(current?.getLength()) || 0;
		const ret: any[] = [
			{ id: I.MarkType.Bold, icon: 'bold', name: translate('commonBold') },
			{ id: I.MarkType.Italic, icon: 'italic', name: translate('commonItalic') },
			{ id: I.MarkType.Strike, icon: 'strike', name: translate('commonStrikethrough') },
			{ id: I.MarkType.Underline, icon: 'underline', name: translate('commonUnderline') },
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
		const node = $(nodeRef.current);
		const table = node.find('#table');
		const frameContainer = node.find('#selectionFrameContainer');
		const containerOffset = frameContainer.offset();
		const id = [ type, rowId, columnId, cellId, position ].join('-');

		let obj: any = null;
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

				obj = table.find(`#row-${rowId}`);
				if (!obj.length) {
					return;
				};

				offset = obj.offset();

				x = offset.left - containerOffset.left;
				y = offset.top - containerOffset.top;
				w = obj.outerWidth();
				h = obj.outerHeight();
				break;
			};

			case I.BlockType.TableColumn: {
				if (!columnId) {
					return;
				};

				const cells = table.find(`.cell.column${columnId}`);

				cells.each((i: number, obj: any) => {
					obj = $(obj);

					if (i == 0) {
						offset = obj.offset();
						x = offset.left - containerOffset.left;
						y = offset.top - containerOffset.top;
						w = obj.outerWidth();
					};

					h += obj.outerHeight();
				});
				break;
			};

			default: {
				if (!cellId) {
					return;
				};

				obj = table.find(`#cell-${cellId}`);
				if (!obj.length) {
					return;
				};

				offset = obj.offset();

				x = offset.left - containerOffset.left;
				y = offset.top - containerOffset.top;
				w = obj.outerWidth();
				h = obj.outerHeight();
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
		const node = $(nodeRef.current);
		const frameContainer = node.find('#selectionFrameContainer');

		frames.current = frames.current.filter(it => !positions.includes(it.position));

		positions.forEach((it: I.BlockPosition) => {
			const c = getClassByPosition(it);
			frameContainer.find(`.selectionFrame${c ? `.${c}` : ''}`).remove();
		});
	};

	const frameRender = (item: any) => {
		const node = $(nodeRef.current);
		const frameContainer = node.find('#selectionFrameContainer');
		const c = getClassByPosition(item.position);

		let obj = frameContainer.find(`#frame-${item.id}`);
		if (!obj.length) {
			const frame = $('<div class="selectionFrame"></div>');

			frameContainer.append(frame);
			frame.attr({ id: `frame-${item.id}` }).addClass(c);

			obj = frame;
		};

		obj.css({ left: item.x, top: item.y, width: item.w, height: item.h });
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

		const node = $(nodeRef.current);
		const wrap = $(scrollRef.current);
		const row = node.find(`#row-${rows[0].id}`);
		const obj = $(`#block-${block.id}`);

		if (frameResize.current) {
			raf.cancel(frameResize.current);
		};

		frameResize.current = raf(() => {
			let width = J.Size.blockMenu + 10;
			let maxWidth = 0;
			let wrapperWidth = 0;

			String(row.css('grid-template-columns') || '').split(' ').forEach(it => width += parseInt(it));
			obj.css({ width: 'auto', marginLeft: 0 });

			if (parent.isPage() || parent.isLayoutDiv()) {
				const container = U.Common.getPageContainer(isPopup);

				maxWidth = container.width() - PADDING;
				wrapperWidth = getWrapperWidth() + J.Size.blockMenu;

				wrap.toggleClass('withScroll', width > maxWidth);
				width = Math.max(wrapperWidth, Math.min(maxWidth, width));

				obj.css({
					width: (width >= wrapperWidth) ? width : 'auto',
					marginLeft: (width >= wrapperWidth) ? Math.min(0, (wrapperWidth - width) / 2) : '',
				});
			} else {
				const parentObj = $(`#block-${parent.id}`);
				if (parentObj.length) {
					maxWidth = parentObj.width() - J.Size.blockMenu;
				};

				wrap.toggleClass('withScroll', width > maxWidth);
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
									<Icon />
								</div>
							))}
						</>
					) : ''}
				</div>
			</div>
		</div>
	);
	
}));

export default BlockTable;