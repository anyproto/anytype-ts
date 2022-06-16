import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon } from 'ts/component';
import { I, C, keyboard, focus, Util, Mark } from 'ts/lib';
import { observer } from 'mobx-react';
import { menuStore, blockStore } from 'ts/store';
import arrayMove from 'array-move';
import { throttle } from 'lodash';

import Row from './table/row';

interface Props extends I.BlockComponent {};

const $ = require('jquery');
const raf = require('raf');
const Constant = require('json/constant.json');

const PADDING = 46;
const SNAP = 10;

const BlockTable = observer(class BlockTable extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	offsetX: number = 0;
	cache: any = {};
	width: number = 0;
	oldIndex: number = -1;
	newIndex: number = -1;
	scrollX: number = 0;
	frame: number = 0;

	constructor (props: any) {
		super(props);

		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEndColumn = this.onSortEndColumn.bind(this);
		this.onSortEndRow = this.onSortEndRow.bind(this);
		this.onHandleRow = this.onHandleRow.bind(this);
		this.onHandleColumn = this.onHandleColumn.bind(this);
		this.onCellClick = this.onCellClick.bind(this);
		this.onCellFocus = this.onCellFocus.bind(this);
		this.onCellBlur = this.onCellBlur.bind(this);
		this.onCellEnter = this.onCellEnter.bind(this);
		this.onCellLeave = this.onCellLeave.bind(this);
		this.onCellKeyDown = this.onCellKeyDown.bind(this);
		this.onOptions = this.onOptions.bind(this);
		this.onResizeStart = this.onResizeStart.bind(this);
		this.onDragStartRow = this.onDragStartRow.bind(this);
		this.onDragStartColumn = this.onDragStartColumn.bind(this);
		this.getData = this.getData.bind(this);
		this.onScroll = this.onScroll.bind(this);
		this.onPlus = this.onPlus.bind(this);
		this.onPlusV = this.onPlusV.bind(this);
		this.onPlusH = this.onPlusH.bind(this);
	};

	render () {
		const { rootId, block, readonly } = this.props;
		const { rows, columns } = this.getData();
		const cn = [ 'wrap', 'focusable', 'c' + block.id ];

		// Subscriptions
		columns.forEach((column: I.Block) => {
			const { width } = column.fields || {};
		});

		return (
			<div 
				id="wrap"
				tabIndex={0} 
				className={cn.join(' ')}
			>
				<div id="scrollWrap" className="scrollWrap" onScroll={this.onScroll}>
					<div className="inner">
						<div id="table" className="table">
							<div className="rows">
								{rows.map((row: any, i: number) => {
									return (
										<Row 
											key={`block-${block.id}-row-${row.id}`}
											{...this.props}
											block={row}
											index={i}
											getData={this.getData}
											onOptions={this.onOptions}
											onHandleRow={this.onHandleRow}
											onHandleColumn={this.onHandleColumn}
											onCellClick={this.onCellClick}
											onCellFocus={this.onCellFocus}
											onCellBlur={this.onCellBlur}
											onCellEnter={this.onCellEnter}
											onCellLeave={this.onCellLeave}
											onCellKeyDown={this.onCellKeyDown}
											onResizeStart={this.onResizeStart}
											onDragStartRow={this.onDragStartRow}
											onDragStartColumn={this.onDragStartColumn}
										/>
									);
								})}
							</div>
						</div>
						<div id="plus-v" className="plusButton vertical" onClick={this.onPlusV}>
							<Icon />
						</div>
						<div id="plus-h" className="plusButton horizontal" onClick={this.onPlusH}>
							<Icon />
						</div>
						<div id="plus-c" className="plusButton circle" onClick={this.onPlus}>
							<Icon />
						</div>
					</div>
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.initSize();
		this.resize();
		this.rebind();
	};

	componentDidUpdate () {
		const node = $(ReactDOM.findDOMNode(this));
		const wrap = node.find('#scrollWrap');

		this.initSize();
		this.resize();

		wrap.scrollLeft(this.scrollX);
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	unbind () {
		const { block } = this.props;
		$(window).off('resize.' + block.id);
	};

	rebind () {
		const { block } = this.props;
		const win = $(window);

		this.unbind();
		win.on('resize.' + block.id, () => { this.resize(); });
	};

	getData () {
		const { rootId, block } = this.props;
		const childrenIds = blockStore.getChildrenIds(rootId, block.id);
		const children = blockStore.getChildren(rootId, block.id);
		const rowContainer = children.find(it => it.isLayoutTableRows());
		const columnContainer = children.find(it => it.isLayoutTableColumns());
		const columns = columnContainer ? blockStore.getChildren(rootId, columnContainer.id, it => it.isTableColumn()) : [];
		const rows = rowContainer ? blockStore.unwrapTree([ blockStore.wrapTree(rootId, rowContainer.id) ]).filter(it => it.isTableRow()) : [];

		return { columnContainer, columns, rowContainer, rows };
	};

	getRowColumn (cellId: string) {
		const { rootId } = this.props;
		const { columns } = this.getData();
		const cellElement = blockStore.getMapElement(rootId, cellId);
		const rowElement = blockStore.getMapElement(rootId, cellElement.parentId);
		const idx = rowElement.childrenIds.indexOf(cellId);
		
		return { rowId: cellElement.parentId, columnId: columns[idx].id };
	};

	onHandleColumn (e: any, type: I.BlockType, rowId: string, columnId: string, cellId: string) {
		e.persist();
		e.preventDefault();
		e.stopPropagation();

		this.onOptions(e, type, rowId, columnId, cellId);
	};

	onHandleRow (e: any, type: I.BlockType, rowId: string, columnId: string, cellId: string) {
		e.persist();
		e.preventDefault();
		e.stopPropagation();

		this.onOptions(e, type, rowId, columnId, cellId);
	};

	onOptions (e: any, type: I.BlockType, rowId: string, columnId: string, cellId: string) {
		if (!this._isMounted) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		const { rootId } = this.props;
		const current = blockStore.getLeaf(rootId, cellId);

		if (!current) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const { rows, columns } = this.getData();
		const subIds = [ 'select2', 'blockColor', 'blockBackground' ];

		let menuContext: any = null;
		let menuParam: any = {
			component: 'select',
			onOpen: (context: any) => {
				menuContext = context;
				this.onOptionsOpen(type, rowId, columnId, cellId);
			},
			onClose: () => {
				this.onOptionsClose();
			},
			subIds: subIds,
		};

		let options: any[] = [];
		let optionsAlign = this.optionsAlign(cellId);
		let optionsColor = this.optionsColor(cellId);
		let element: any = null;
		let blockIds: string[] = [];
		let fill: any = null;

		switch (type) {
			case I.BlockType.TableRow:
				options = options.concat(this.optionsRow(rowId));
				options = options.concat(optionsColor);

				columns.forEach(column => {
					blockIds.push([ rowId, column.id ].join('-'));
				});

				menuParam = Object.assign(menuParam, {
					element: node.find(`#row-${rowId}`).first(),
					offsetY: 2,
				});

				fill = (callBack: () => void) => {
					C.BlockTableRowListFill(rootId, [ rowId ], callBack);
				};
				break;

			case I.BlockType.TableColumn:
				options = options.concat([
					{ id: 'sort', icon: 'sort', name: 'Sort', arrow: true },
					{ isDiv: true },
				]);
				options = options.concat(this.optionsColumn(columnId));
				options = options.concat(optionsColor);

				rows.forEach(row => {
					blockIds.push([ row.id, columnId ].join('-'));
				});

				element = node.find(`#cell-${cellId}`).first();
				menuParam = Object.assign(menuParam, {
					element,
					offsetX: element.outerWidth() + 2,
					offsetY: -element.outerHeight(),
				});

				fill = (callBack: () => void) => {
					C.BlockTableColumnListFill(rootId, [ columnId ], callBack);
				};
				break;

			default:
				blockIds = [ cellId ];
				options = options.concat([
					{ id: 'row', name: 'Row', arrow: true },
					{ id: 'column', name: 'Column', arrow: true },
					{ isDiv: true },
				]);
				options = options.concat(optionsColor);

				element = node.find(`#cell-${cellId}`);
				menuParam = Object.assign(menuParam, {
					element,
					horizontal: I.MenuDirection.Center,
				});

				fill = (callBack: () => void) => {
					callBack();
				};
				break;
		};

		options = options.concat(optionsAlign);

		menuParam = Object.assign(menuParam, {
			data: {
				options: options,
				onOver: (e: any, item: any) => {
					if (!item.arrow) {
						menuStore.closeAll(subIds);
						return;
					};

					let menuId = '';
					let menuParam: any = {
						element: `#${menuContext.getId()} #item-${item.id}`,
						offsetX: menuContext.getSize().width,
						vertical: I.MenuDirection.Center,
						isSub: true,
						data: {
							rootId, 
							rebind: menuContext.ref.rebind,
						}
					};

					switch (item.id) {
						case 'sort':
							menuId = 'select2';
							menuParam.component = 'select';
							menuParam.data = Object.assign(menuParam.data, {
								options: this.optionsSort(),
								onSelect: (e: any, item: any) => {
									C.BlockTableSort(rootId, columnId, item.id);
									menuContext.close();
								}
							});
							break;

						case 'row':
							menuId = 'select2';
							menuParam.component = 'select';
							menuParam.data = Object.assign(menuParam.data, {
								options: this.optionsRow(rowId).filter(it => !it.isDiv),
								onSelect: (e: any, item: any) => {
									this.onSelect(e, item, rowId, columnId, cellId, blockIds);
								}
							});
							break;

						case 'column':
							menuId = 'select2';
							menuParam.component = 'select';
							menuParam.data = Object.assign(menuParam.data, {
								options: this.optionsColumn(columnId).filter(it => !it.isDiv),
								onSelect: (e: any, item: any) => {
									this.onSelect(e, item, rowId, columnId, cellId, blockIds);
								}
							});
							break;

						case 'horizontal':
							menuId = 'select2';
							menuParam.component = 'select';
							menuParam.data = Object.assign(menuParam.data, {
								options: this.optionsHAlign(),
								value: current.hAlign,
								onSelect: (e: any, el: any) => {
									fill(() => {
										C.BlockListSetAlign(rootId, blockIds, el.id);
									});
									menuContext.close();
								}
							});
							break;

						case 'vertical':
							menuId = 'select2';
							menuParam.component = 'select';
							menuParam.data = Object.assign(menuParam.data, {
								options: this.optionsVAlign(),
								value: current.vAlign,
								onSelect: (e: any, el: any) => {
									fill(() => {
										C.BlockListSetVerticalAlign(rootId, blockIds, el.id);
									});
									menuContext.close();
								}
							});
							break;

						case 'color':
							menuId = 'blockColor';
							menuParam.data = Object.assign(menuParam.data, {
								onChange: (id: string) => {
									fill(() => {
										C.BlockTextListSetColor(rootId, blockIds, id);
									});
									menuContext.close();
								}
							});
							break;

						case 'background':
							menuId = 'blockBackground';
							menuParam.data = Object.assign(menuParam.data, {
								onChange: (id: string) => {
									fill(() => {
										C.BlockListSetBackgroundColor(rootId, blockIds, id);
									});
									menuContext.close();
								}
							});
							break;

						case 'style':
							menuId = 'select2';
							menuParam.component = 'select';
							menuParam.data = Object.assign(menuParam.data, {
								options: this.optionsStyle(cellId),
								onSelect: (e: any, el: any) => {
									C.BlockTextListSetMark(rootId, blockIds, { type: el.id, param: '', range: { from: 0, to: 0 } });
									menuContext.close();
								}
							});
							break;
					};

					menuStore.closeAll(subIds, () => {
						menuStore.open(menuId, menuParam);
					});
				},
				onSelect: (e: any, item: any) => {
					this.onSelect(e, item, rowId, columnId, cellId, blockIds);
				}
			},
		});

		menuStore.open('select1', menuParam);
	};

	onSelect (e: any, item: any, rowId: string, columnId: string, targetCellId: string, blockIds: string[]) {
		if (item.arrow) {
			return;
		};

		const { rootId } = this.props;
		const { rowContainer, columnContainer } = this.getData();

		let childrenIds: string[] = [];
		let oldIndex = 0;
		let newIndex = 0;

		switch (item.id) {
			case 'columnBefore':
			case 'columnAfter':
				C.BlockTableColumnCreate(rootId, columnId, (item.id == 'columnBefore' ? I.BlockPosition.Left : I.BlockPosition.Right));
				break;

			case 'columnMoveLeft':
			case 'columnMoveRight':
				childrenIds = blockStore.getChildrenIds(rootId, columnContainer.id);
				oldIndex = childrenIds.indexOf(columnId);
				newIndex = item.id == 'columnMoveLeft' ? oldIndex - 1 : oldIndex + 1;

				this.onSortEndColumn(oldIndex, newIndex);
				break;

			case 'columnRemove':
				C.BlockTableColumnDelete(rootId, columnId);
				break;

			case 'columnCopy':
				C.BlockTableColumnDuplicate(rootId, columnId, I.BlockPosition.Right);
				break;

			case 'rowBefore':
			case 'rowAfter':
				C.BlockTableRowCreate(rootId, rowId, (item.id == 'rowBefore' ? I.BlockPosition.Top : I.BlockPosition.Bottom));
				break;

			case 'rowMoveTop':
			case 'rowMoveBottom':
				childrenIds = blockStore.getChildrenIds(rootId, rowContainer.id);
				oldIndex = childrenIds.indexOf(targetCellId);
				newIndex = item.id == 'rowMoveTop' ? oldIndex - 1 : oldIndex + 1;

				this.onSortEndRow(oldIndex, newIndex);
				break;

			case 'rowCopy':
				C.BlockTableRowDuplicate(rootId, rowId, rowId, I.BlockPosition.Bottom);
				break;

			case 'rowRemove':
				C.BlockListDelete(rootId, [ rowId ]);
				break;

			case 'clearStyle':
				C.BlockTextListClearStyle(rootId, blockIds);
				break;

			case 'clearContent':
				C.BlockTextListClearContent(rootId, blockIds);
				break;
		};
	};

	onOptionsOpen (type: I.BlockType, rowId: string, columnId: string, cellId: string) {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const table = node.find('#table');

		this.onOptionsClose();

		switch (type) {
			case I.BlockType.TableColumn:
				const cells = table.find(`.cell.column${columnId}`);

				cells.addClass('isHighlightedColumn');
				cells.first().addClass('isFirst');
				cells.last().addClass('isLast');
				break;

			case I.BlockType.TableRow:
				table.find(`#row-${rowId}`).addClass('isHighlightedRow');
				break;

			default:
				table.find(`#cell-${cellId}`).addClass('isHighlightedCell');
				break;
		};
	};

	onOptionsClose () {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		node.find('.isHighlightedColumn').removeClass('isHighlightedColumn isFirst isLast');
		node.find('.isHighlightedRow').removeClass('isHighlightedRow');
		node.find('.isHighlightedCell').removeClass('isHighlightedCell');

		this.setEditing('');
	};

	onPlus (e: any) {
		const { rootId, block } = this.props;

		C.BlockTableExpand(rootId, block.id, 1, 1);
	};

	onPlusV (e: any) {
		const { rootId } = this.props;
		const { columns } = this.getData();

		C.BlockTableColumnCreate(rootId, columns[columns.length - 1].id, I.BlockPosition.Right);
	};

	onPlusH (e: any) {
		const { rootId } = this.props;
		const { rows } = this.getData();

		C.BlockTableRowCreate(rootId, rows[rows.length - 1].id, I.BlockPosition.Bottom);
	};

	onCellFocus (e: any, rowId: string, columnId: string, cellId: string) {
		const { rootId } = this.props;
		const cell = blockStore.getLeaf(rootId, cellId);
		const cb = () => {
			this.setEditing(cellId);
			this.preventSelect(true);
		};

		if (!cell) {
			C.BlockTableRowListFill(rootId, [ rowId ], () => {
				cb();

				focus.set(cellId, { from: 0, to: 0 });
				focus.apply();
			});
		} else {
			cb();
		};
	};

	onCellBlur (e: any, rowId: string, columnId: string, cellId: string) {
		this.setEditing('');
		this.preventSelect(false);
	};

	onCellClick (e: any, rowId: string, columnId: string, cellId: string) {
		this.onCellFocus(e, rowId, columnId, cellId);
	};

	onCellEnter (e: any, rowId: string, columnId: string, id: string) {
		const { rows, columns } = this.getData();
		const rowIdx = rows.findIndex(it => it.id == rowId);
		const columnIdx = columns.findIndex(it => it.id == columnId);
		const isLastRow = rowIdx == rows.length - 1;
		const isLastColumn = columnIdx == columns.length - 1;

		if (!isLastRow || !isLastColumn) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
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

	onCellLeave (e: any, rowId: string, columnId: string, id: string) {
		const { rows, columns } = this.getData();
		const rowIdx = rows.findIndex(it => it.id == rowId);
		const columnIdx = columns.findIndex(it => it.id == columnId);
		const isLastRow = rowIdx == rows.length - 1;
		const isLastColumn = columnIdx == columns.length - 1;

		if (!isLastRow || !isLastColumn) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
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

	onCellKeyDown (e: any, rowId: string, columnId: string, id: string, text: string, marks: I.Mark[], range: I.TextRange, props: any) {
		const { rootId, onKeyDown } = this.props;
		const { focused } = focus.state;


		let ret = false;
		
		keyboard.shortcut(`shift+space`, e, (pressed: string) => {
			ret = true;
			this.onOptions(e, I.BlockType.Text, rowId, columnId, id);
		});

		if (!ret) {
			onKeyDown(e, text, marks, range, props);
		};
	};

	setEditing (id: string) {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		
		node.find('.cell.isEditing').removeClass('isEditing');
		if (id) {
			node.find(`#cell-${id}`).addClass('isEditing');
		};
	};

	onResizeStart (e: any, id: string) {
		if (!this._isMounted) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		const win = $(window);
		const body = $('body');
		const node = $(ReactDOM.findDOMNode(this));
		const el = node.find(`.cell.column${id}`);

		if (el.length) {
			this.offsetX = el.first().offset().left;
		};

		body.addClass('colResize');
		win.unbind('mousemove.table mouseup.table');
		win.on('mousemove.table', throttle((e: any) => { this.onResizeMove(e, id); }, 40));
		win.on('mouseup.table', (e: any) => { this.onResizeEnd(e, id); });

		keyboard.setResize(true);
	};

	onResizeMove (e: any, id: string) {
		e.preventDefault();
		e.stopPropagation();

		const { columns } = this.getData();
		const idx = columns.findIndex(it => it.id == id);
		const widths = this.getColumnWidths();

		widths[idx] = this.checkWidth(e.pageX - this.offsetX);

		this.setColumnsWidths(widths);
		this.resize();
	};

	onResizeEnd (e: any, id: string) {
		const { rootId } = this.props;
		const width = this.checkWidth(e.pageX - this.offsetX);

		C.BlockListSetFields(rootId, [
			{ blockId: id, fields: { width } },
		]);

		$(window).unbind('mousemove.table mouseup.table');
		$('body').removeClass('colResize');
		keyboard.setResize(false);
	};

	getColumnWidths (): number[] {
		const { columns } = this.getData();
		const ret = [];

		columns.forEach((it: I.Block) => {
			ret.push(this.checkWidth(it.fields.width || Constant.size.table.default));
		});

		return ret;
	};

	setColumnsWidths (widths: number[]) {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const rows = node.find('.row');

		rows.css({ gridTemplateColumns: widths.map(it => it + 'px').join(' ') });
	};

	onDragStartColumn (e: any, id: string) {
		e.stopPropagation();

		const { rows, columns } = this.getData();
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const table = $('<div />').addClass('table isClone');
		const widths = this.getColumnWidths();
		const idx = columns.findIndex(it => it.id == id);

		rows.forEach((row: I.Block, i: number) => {
			const rowElement = $('<div />').addClass('row');
			const cell = $(node.find(`.cell.column${id}`).get(i));
			const clone = cell.clone();

			clone.css({ height: cell.outerHeight() });

			rowElement.append(clone);
			table.append(rowElement);
		});

		this.width = widths[idx];

		table.css({ width: widths[idx], zIndex: 10000, position: 'fixed', left: -10000, top: -10000 });
		node.append(table);

		$(document).off('dragover').on('dragover', (e: any) => { e.preventDefault(); });
		e.dataTransfer.setDragImage(table.get(0), table.outerWidth(), -3);

		win.on('drag.tableColumn', throttle((e: any) => { this.onDragMoveColumn(e, id); }, 40));
		win.on('dragend.tableColumn', (e: any) => { this.onDragEndColumn(e); });

		this.initCache(I.BlockType.TableColumn);
		this.setEditing('');
		this.onOptionsOpen(I.BlockType.TableColumn, '', id, '');
		this.preventSelect(true);
		this.preventDrop(true);
	};

	onDragMoveColumn (e: any, id: string) {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const { columns } = this.getData();

		this.oldIndex = columns.findIndex(it => it.id == id);

		let hoverId = '';
		let isLeft = false;

		for (let i = 0; i < columns.length; ++i) {
			const column = columns[i];
			const rect = this.cache[column.id];

			if (id == column.id) {
				continue;
			};

			if (rect && Util.rectsCollide({ x: e.pageX, y: 0, width: this.width, height: 1 }, rect)) {
				isLeft = (i == 0) && (e.pageX <= rect.x + rect.width / 2);
				hoverId = column.id;
				
				this.newIndex = isLeft ? rect.index : rect.index + 1;
				break;
			};
		};

		if (this.frame) {
			raf.cancel(this.frame);
		};

		this.frame = raf(() => {
			node.find('.cell.isOver').removeClass('isOver left right');

			if (hoverId) {
				node.find(`.cell.column${hoverId}`).addClass('isOver ' + (isLeft ? 'left' : 'right'));
			};
		});

		this.newIndex = Math.max(0, this.newIndex);
		this.newIndex = Math.min(columns.length - 1, this.newIndex);
	};

	onDragEndColumn (e: any) {
		e.preventDefault();

		const node = $(ReactDOM.findDOMNode(this));
		const win = $(window);

		this.cache = {};
		this.onSortEndColumn(this.oldIndex, this.newIndex);
		this.preventSelect(false);
		this.preventDrop(false);
		this.onOptionsClose();

		win.off('drag.tableColumn dragend.tableColumn');
		node.find('.table.isClone').remove();
		node.find('.cell.isOver').removeClass('isOver left right');
	};

	onDragStartRow (e: any, id: string) {
		e.stopPropagation();

		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const layer = $('<div />');
		const row = node.find(`#row-${id}`);
		const clone = row.clone();
		const table = $('<div />').addClass('table isClone');

		layer.css({ zIndex: 10000, position: 'fixed', left: -10000, top: -10000, paddingTop: 10, paddingLeft: 10 });
		node.append(layer);
		layer.append(table);
		table.append(clone);
		
		this.width = table.width();

		$(document).off('dragover').on('dragover', (e: any) => { e.preventDefault(); });
		e.dataTransfer.setDragImage(layer.get(0), 0, 0);

		win.on('drag.tableRow', throttle((e: any) => { this.onDragMoveRow(e, id); }, 40));
		win.on('dragend.tableRow', (e: any) => { this.onDragEndRow(e); });

		this.initCache(I.BlockType.TableRow);
		this.setEditing('');
		this.onOptionsOpen(I.BlockType.TableRow, id, '', '');
		this.preventSelect(true);
		this.preventDrop(true);
	};

	onDragMoveRow (e: any, id: string) {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const { rows } = this.getData();

		this.oldIndex = rows.findIndex(it => it.id == id);

		let hoverId = '';
		let isBottom = false;

		for (let i = 0; i < rows.length; ++i) {
			const row = rows[i];
			const rect = this.cache[row.id];

			if (id == row.id) {
				continue;
			};

			if (rect && Util.rectsCollide({ x: e.pageX, y: e.pageY, width: this.width, height: 1 }, rect)) {
				isBottom = (i == rows.length - 1) && (e.pageY > rect.y + rect.height / 2);
				hoverId = row.id;
				
				this.newIndex = isBottom ? rect.index + 1 : rect.index;
				break;
			};
		};

		if (this.frame) {
			raf.cancel(this.frame);
		};

		this.frame = raf(() => {
			node.find('.row.isOver').removeClass('isOver top bottom');

			if (hoverId) {
				node.find(`#row-${hoverId}`).addClass('isOver ' + (isBottom ? 'bottom' : 'top'));
			};
		});

		this.newIndex = Math.max(0, this.newIndex);
		this.newIndex = Math.min(rows.length - 1, this.newIndex);
	};

	onDragEndRow (e: any) {
		e.preventDefault();

		const node = $(ReactDOM.findDOMNode(this));
		const win = $(window);

		this.cache = {};
		this.onSortEndRow(this.oldIndex, this.newIndex);
		this.preventSelect(false);
		this.preventDrop(false);
		this.onOptionsClose();

		win.off('drag.tableRow dragend.tableRow');
		node.find('.table.isClone').remove();
		node.find('.row.isOver').removeClass('isOver top bottom');
	};

	onScroll (e: any) {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const wrap = node.find('#scrollWrap');

		this.scrollX = wrap.scrollLeft();
	};

	initCache (type: I.BlockType) {
		if (!this._isMounted) {
			return;
		};

		this.cache = {};

		const { rows, columns } = this.getData();
		const node = $(ReactDOM.findDOMNode(this));

		switch (type) {
			case I.BlockType.TableColumn:
				columns.forEach((column: I.Block, i: number) => {
					const cell = node.find(`.cell.column${column.id}`).first();
					const p = cell.offset();

					this.cache[column.id] = {
						x: p.left,
						y: 0,
						height: 1,
						width: cell.outerWidth(),
						index: i,
					};
				});
				break;

			case I.BlockType.TableRow:
				const width = node.width();

				rows.forEach((row: I.Block, i: number) => {
					const el = node.find(`#row-${row.id}`).first();
					const p = el.offset();

					this.cache[row.id] = {
						x: p.left,
						y: p.top,
						height: el.height(),
						width: width,
						index: i,
					};
				});
				break;
		};
	};

	alignHIcon (v: I.BlockHAlign): string {
		return [ 'align', String(I.BlockHAlign[v]).toLowerCase() ].join(' ');
	};

	alignVIcon (v: I.BlockVAlign): string {
		return [ 'valign', String(I.BlockVAlign[v]).toLowerCase() ].join(' ');
	};

	onSortStart () {
		$('body').addClass('grab');
		this.preventSelect(true);
	};

	onSortEndColumn (oldIndex: number, newIndex: number): void {
		const { rootId } = this.props;
		const { columns } = this.getData();
		const oldColumn = columns[oldIndex];
		const newColumn = columns[newIndex];

		if (!oldColumn || !newColumn) {
			return;
		};

		const position = newIndex < oldIndex ? I.BlockPosition.Left : I.BlockPosition.Right;
		C.BlockTableColumnMove(rootId, oldColumn.id, newColumn.id, position);

		$('body').removeClass('grab');
		this.preventSelect(false);
	};

	onSortEndRow (oldIndex: number, newIndex: number) {
		const { rootId } = this.props;
		const { rowContainer } = this.getData();
		const childrenIds = blockStore.getChildrenIds(rootId, rowContainer.id);
		const current = childrenIds[oldIndex];
		const target = childrenIds[newIndex];
		const position = newIndex < oldIndex ? I.BlockPosition.Top : I.BlockPosition.Bottom;

		if (current == target) {
			return;
		};

		blockStore.updateStructure(rootId, rowContainer.id, arrayMove(childrenIds, oldIndex, newIndex));
		C.BlockListMoveToExistingObject(rootId, rootId, [ current ], target, position);

		$('body').removeClass('grab');
		this.preventSelect(false);
	};

	preventSelect (v: boolean) {
		const { dataset } = this.props;
		const { selection } = dataset || {};

		if (selection) {
			selection.preventSelect(v);
		};
	};

	preventDrop (v: boolean) {
		const { dataset } = this.props;
		const { preventCommonDrop } = dataset || {};

		preventCommonDrop(v);
	};

	initSize () {
		if (!this._isMounted) {
			return;
		};

		const { columns } = this.getData();
		const node = $(ReactDOM.findDOMNode(this));
		const rows = node.find('.row');
		const sizes = [];

		columns.forEach((it: I.Block) => {
			sizes.push(this.checkWidth(it.fields.width || Constant.size.table.default));
		});

		rows.css({ gridTemplateColumns: sizes.map(it => it + 'px').join(' ') });
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		const { isPopup, block, getWrapperWidth } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const obj = $(`#block-${block.id}`);
		const container = $(isPopup ? '#popupPage #innerWrap' : '#page.isFull');
		const ww = container.width();
		const mw = ww - PADDING * 2;
		const wrapperWidth = getWrapperWidth();
		const offset = Constant.size.blockMenu + 10;
		const wrap = node.find('#scrollWrap');
		const row = node.find('.row').first();

		let width = offset;

		String(row.css('grid-template-columns') || '').split(' ').forEach((it: string) => {
			width += parseInt(it);
		});

		width > mw ? wrap.addClass('withScroll') : wrap.removeClass('withScroll');
		width = Math.min(mw, width);

		obj.css({
			width: (width >= wrapperWidth) ? width : 'auto',
			marginLeft: (width >= wrapperWidth) ? Math.min(0, (wrapperWidth - width) / 2) + offset / 2 : '',
		});
	};

	checkWidth (w: number) {
		const { min, max } = Constant.size.table;
		const steps = 5;

		let width = Math.max(min, Math.min(max, w));
		for (let x = 1; x <= steps; ++x) {
			let s = max / steps * x;
			if ((width >= s - SNAP) && (width <= s + SNAP)) {
				width = s;
			};
		};
		return width;
	};

	optionsRow (id: string) {
		const { rootId } = this.props;
		const { rows } = this.getData();
		const idx = rows.findIndex(it => it.id == id);
		const length = rows.length;
		const options: any[] = [
			{ id: 'rowBefore', icon: 'table-insert-top', name: 'Row before' },
			{ id: 'rowAfter', icon: 'table-insert-bottom', name: 'Row after' },
		];

		if (idx > 0) {
			options.push({ id: 'rowMoveTop', icon: 'table-move-top', name: 'Move row up' });
		};
		if (idx < length - 1) {
			options.push({ id: 'rowMoveBottom', icon: 'table-move-bottom', name: 'Move row down' });
		};

		options.push({ id: 'rowCopy', icon: 'copy', name: 'Duplicate row' });

		if (length > 1) {
			options.push({ id: 'rowRemove', icon: 'remove', name: 'Delete row' });
		};

		options.push({ isDiv: true });
		return options;
	};

	optionsColumn (id: string) {
		const { columns } = this.getData();
		const idx = columns.findIndex(it => it.id == id);
		const length = columns.length;
		const options: any[] = [
			{ id: 'columnBefore', icon: 'table-insert-left', name: 'Column before' },
			{ id: 'columnAfter', icon: 'table-insert-right', name: 'Column after' },
		];

		if (idx > 0) {
			options.push({ id: 'columnMoveLeft', icon: 'table-move-left', name: 'Move column left' });
		};
		if (idx < length - 1) {
			options.push({ id: 'columnMoveRight', icon: 'table-move-right', name: 'Move column right' });
		};

		options.push({ id: 'columnCopy', icon: 'copy', name: 'Duplicate column' });

		if (length > 1) {
			options.push({ id: 'columnRemove', icon: 'remove', name: 'Delete column' });
		};

		options.push({ isDiv: true });
		return options;
	};

	optionsColor (id: string) {
		const { rootId } = this.props;
		const current = blockStore.getLeaf(rootId, id);

		if (!current) {
			return;
		};

		const innerColor = <div className={[ 'inner', 'textColor textColor-' + (current.content.color || 'default') ].join(' ')} />;
		const innerBackground = <div className={[ 'inner', 'bgColor bgColor-' + (current.bgColor || 'default') ].join(' ')} />;

		return [
			{ id: 'color', icon: 'color', name: 'Color', inner: innerColor, arrow: true },
			{ id: 'background', icon: 'color', name: 'Background', inner: innerBackground, arrow: true },
			{ id: 'style', icon: 'customize', name: 'Style', arrow: true },
			{ id: 'clearStyle', icon: 'clear', name: 'Clear style' },
			{ id: 'clearContent', icon: 'clear', name: 'Clear content' },
			{ isDiv: true },
		];
	};

	optionsAlign (id: string) {
		const { rootId } = this.props;
		const current = blockStore.getLeaf(rootId, id);

		if (!current) {
			return [];
		};

		return [
			{ id: 'horizontal', icon: this.alignHIcon(current.hAlign), name: 'Horizontal align', arrow: true },
			{ id: 'vertical', icon: this.alignVIcon(current.vAlign), name: 'Vertical align', arrow: true },
		];
	};

	optionsHAlign () {
		return [
			{ id: I.BlockHAlign.Left, name: 'Left' },
			{ id: I.BlockHAlign.Center, name: 'Center' },
			{ id: I.BlockHAlign.Right, name: 'Right' },
		].map((it: any) => {
			it.icon = this.alignHIcon(it.id);
			return it;
		});
	};

	optionsVAlign () {
		return [
			{ id: I.BlockVAlign.Top, name: 'Top' },
			{ id: I.BlockVAlign.Middle, name: 'Middle' },
			{ id: I.BlockVAlign.Bottom, name: 'Bottom' },
		].map((it: any) => {
			it.icon = this.alignVIcon(it.id);
			return it;
		});
	};

	optionsStyle (id: string) {
		const { rootId } = this.props;
		const current = blockStore.getLeaf(rootId, id);

		if (!current) {
			return;
		};

		const length = current.getLength();
		const ret: any[] = [
			{ id: I.MarkType.Bold, icon: 'bold', name: 'Bold' },
			{ id: I.MarkType.Italic, icon: 'italic', name: 'Italic' },
			{ id: I.MarkType.Strike, icon: 'strike', name: 'Strikethrough' },
		];

		return ret.map(it => {
			const mark = Mark.getInRange(current.content.marks, it.id, { from: 0, to: length });
			it.checkbox = !!mark;
			return it;
		});
	};

	optionsSort () {
		return [
			{ id: I.SortType.Asc, name: 'Ascending' },
			{ id: I.SortType.Desc, name: 'Descending' },
		];
	};

});

export default BlockTable;