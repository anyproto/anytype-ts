import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C, keyboard, DataUtil, Util } from 'ts/lib';
import { observer } from 'mobx-react';
import { menuStore, blockStore } from 'ts/store';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import arrayMove from 'array-move';
import { throttle } from 'lodash';

import Row from './table/row';

interface Props extends I.BlockComponent {};

const $ = require('jquery');
const Constant = require('json/constant.json');

const PADDING = 46;

const BlockTable = observer(class BlockTable extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	offsetX: number = 0;
	cache: any = {};
	width: number = 0;
	oldIndex: number = -1;
	newIndex: number = -1;
	timeout: number = 0;

	constructor (props: any) {
		super(props);

		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEndColumn = this.onSortEndColumn.bind(this);
		this.onSortEndRow = this.onSortEndRow.bind(this);
		this.onHandleClick = this.onHandleClick.bind(this);
		this.onCellClick = this.onCellClick.bind(this);
		this.onOptions = this.onOptions.bind(this);
		this.onResizeStart = this.onResizeStart.bind(this);
		this.onDragStartColumn = this.onDragStartColumn.bind(this);
		this.getData = this.getData.bind(this);
	};

	render () {
		const { rootId, block, readonly } = this.props;
		const { rows, columns } = this.getData();
		const cn = [ 'wrap', 'focusable', 'c' + block.id ];

		// Subscriptions
		columns.forEach((column: I.Block) => {
			const { width } = column.fields || {};
		});

		const RowSortableElement = SortableElement((item: any) => (
			<Row 
				{...this.props}
				{...item} 
				index={item.block.idx}
				getData={this.getData}
				onOptions={this.onOptions}
				onHandleClick={this.onHandleClick}
				onCellClick={this.onCellClick}
				onCellFocus={this.onFocus}
				onCellBlur={this.onBlur}
				onResizeStart={this.onResizeStart}
				onDragStartColumn={this.onDragStartColumn}
			/>
		));

		const TableSortableContainer = SortableContainer((item: any) => (
			<div id="table" className="table">
				{rows.map((row: any, i: number) => {
					row.idx = i;
					return (
						<RowSortableElement 
							key={i} 
							index={i} 
							block={row} 
						/>
					);
				})}
			</div>
		));

		return (
			<div 
				id="wrap"
				tabIndex={0} 
				className={cn.join(' ')}
			>
				<div id="scrollWrap" className="scrollWrap">
					<TableSortableContainer 
						axis="y" 
						lockAxis="y"
						lockToContainerEdges={true}
						transitionDuration={150}
						distance={10}
						useDragHandle={true}
						onSortStart={this.onSortStart}
						onSortEnd={this.onSortEndRow}
						helperClass="isDraggingRow"
						helperContainer={() => { return $(`#block-${block.id} .table`).get(0); }}
					/>
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
		this.initSize();
		this.resize();
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
		const rows = rowContainer ? blockStore.getChildren(rootId, rowContainer.id, it => it.isTableRow()) : [];

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

	onOptions (e: any, id: string) {
		e.preventDefault();
		e.stopPropagation();

		const { rootId } = this.props;
		const current = blockStore.getLeaf(rootId, id);

		if (!current) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const { rows, columns } = this.getData();
		const subIds = [ 'select2', 'blockColor', 'blockBackground', 'blockStyle' ];
		const optionsAlign = this.optionsAlign();
		const optionsColumn = this.optionsColumn();
		const optionsRow = this.optionsRow();
		const optionsColor = this.optionsColor(id);

		let menuContext: any = null;
		let inner: any = null;

		if (current.type == I.BlockType.TableCell) {
			inner = blockStore.getLeaf(rootId, blockStore.getChildrenIds(rootId, current.id)[0]);
		};

		let menuParam: any = {
			component: 'select',
			onOpen: (context: any) => {
				menuContext = context;
				this.onOptionsOpen(id);
			},
			onClose: () => {
				this.onOptionsClose();
			},
			subIds: subIds,
		};

		let options: any[] = [];
		let element: any = null;
		let blockIds: string[] = [];
		let childrenIds: any[] = [];
		let targetRowId: string = '';
		let targetColumnId: string = '';

		switch (current.type) {
			case I.BlockType.TableRow:
				targetRowId = current.id;

				options = options.concat(optionsRow);
				options = options.concat(optionsColor);

				childrenIds = blockStore.getChildrenIds(rootId, current.id);
				childrenIds.forEach((childId: string) => {
					blockIds = blockIds.concat(blockStore.getChildrenIds(rootId, childId));
				});

				element = node.find(`#block-${id}`).first();
				menuParam = Object.assign(menuParam, {
					element,
				});
				break;

			case I.BlockType.TableColumn:
				targetColumnId = current.id;

				options = options.concat(optionsColumn);
				options = options.concat(optionsColor);

				const idx = columns.findIndex(it => it.id == current.id);
				if (idx >= 0) {
					rows.forEach(row => {
						const childrenIds = blockStore.getChildrenIds(rootId, row.id);
						blockIds = blockIds.concat(blockStore.getChildrenIds(rootId, childrenIds[idx]));
					});
				};

				element = node.find(`.cell.column${id}`).first();
				menuParam = Object.assign(menuParam, {
					element,
					offsetX: element.outerWidth() + 2,
					offsetY: -element.outerHeight(),
				});
				break;

			case I.BlockType.TableCell:
				options = options.concat(optionsColumn);
				options = options.concat(optionsRow);
				options = options.concat(optionsColor);

				blockIds = [ inner.id ];

				const { rowId, columnId } = this.getRowColumn(current.id);

				targetRowId = rowId;
				targetColumnId = columnId;

				menuParam = Object.assign(menuParam, {
					rect: { x: e.pageX, y: e.pageY, width: 1, height: 1 },
					offsetY: 10,
					horizontal: I.MenuDirection.Center,
				});
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
						}
					};

					switch (item.id) {
						case 'horizontal':
							menuId = 'select2';
							menuParam.component = 'select';
							menuParam.data = Object.assign(menuParam.data, {
								options: this.optionsHAlign(),
								onSelect: (e: any, el: any) => {
									C.BlockListSetAlign(rootId, blockIds, el.itemId);
									menuContext.close();
								}
							});
							break;

						case 'vertical':
							menuId = 'select2';
							menuParam.component = 'select';
							menuParam.data = Object.assign(menuParam.data, {
								options: this.optionsVAlign(),
								onSelect: (e: any, el: any) => {
									menuContext.close();
								}
							});
							break;

						case 'color':
							menuId = 'blockColor';
							menuParam.data = Object.assign(menuParam.data, {
								onChange: (id: string) => {
									C.BlockTextListSetColor(rootId, blockIds, id);
									menuContext.close();
								}
							});
							break;

						case 'background':
							menuId = 'blockBackground';
							menuParam.data = Object.assign(menuParam.data, {
								onChange: (id: string) => {
									C.BlockListSetBackgroundColor(rootId, blockIds, id);
									menuContext.close();
								}
							});
							break;

						case 'style':
							menuId = 'blockStyle';
							menuParam.data = Object.assign(menuParam.data, {
								blockIds: blockIds,
								blockId: blockIds[0],
								isInsideTable: true,
								value: inner?.content.style,
								onSelect: (item: any) => {
									if (item.type == I.BlockType.Text) {
										C.BlockListTurnInto(rootId, blockIds, item.itemId);
									};
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
					if (item.arrow) {
						return;
					};

					switch (item.id) {
						case 'columnBefore':
							C.BlockTableColumnCreate(rootId, targetColumnId, I.BlockPosition.Left);
							break;

						case 'columnAfter':
							C.BlockTableColumnCreate(rootId, targetColumnId, I.BlockPosition.Right);
							break;

						case 'columnRemove':
							C.BlockTableColumnDelete(rootId, targetColumnId);
							break;

						case 'rowBefore':
							C.BlockTableRowCreate(rootId, targetRowId, I.BlockPosition.Top);
							break;

						case 'rowAfter':
							C.BlockTableRowCreate(rootId, targetRowId, I.BlockPosition.Bottom);
							break;

						case 'rowRemove':
							C.BlockTableRowDelete(rootId, targetRowId);
							break;
					};
				}
			},
		});

		menuStore.open('select1', menuParam);
	};

	onOptionsOpen (id: string) {
		const { rootId } = this.props;
		const current = blockStore.getLeaf(rootId, id);

		if (!current) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const table = node.find('#table');

		this.onOptionsClose();

		switch (current.type) {
			case I.BlockType.TableColumn:
				const cells = table.find(`.cell.column${id}`);

				cells.addClass('isHighlightedColumn');
				cells.first().addClass('isFirst');
				cells.last().addClass('isLast');
				break;

			case I.BlockType.TableRow:
				table.find(`#block-${id}`).addClass('isHighlightedRow');
				break;

			case I.BlockType.TableCell:
				table.find(`#block-${id}`).addClass('isHighlightedCell');
				break;
		};
	};

	onOptionsClose () {
		const node = $(ReactDOM.findDOMNode(this));
		node.find('.isHighlightedColumn').removeClass('isHighlightedColumn isFirst isLast');
		node.find('.isHighlightedRow').removeClass('isHighlightedRow');
		node.find('.isHighlightedCell').removeClass('isHighlightedCell');
	};

	onFocus (e: any, id: string) {
		this.setEditing(id);
		this.preventSelect(true);
	};

	onBlur (e: any, id: string) {
		this.setEditing('');
		this.preventSelect(false);
	};

	onHandleClick (e: any, id: string) {
		this.onOptions(e, id);
	};

	onCellClick (e: any, id: string) {
		this.setEditing(id);
	};

	setEditing (id: string) {
		const node = $(ReactDOM.findDOMNode(this));
		
		node.find('.cell.isEditing').removeClass('isEditing');
		if (id) {
			node.find(`#block-${id}`).addClass('isEditing');
		};
	};

	onResizeStart (e: any, id: string) {
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
		const width = Math.max(Constant.size.table.min, Math.min(Constant.size.table.max, e.pageX - this.offsetX));

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
			ret.push(this.checkWidth(it.fields.width || Constant.size.table.cell));
		});

		return ret;
	};

	setColumnsWidths (widths: number[]) {
		const node = $(ReactDOM.findDOMNode(this));
		const rows = node.find('.row');

		rows.css({ gridTemplateColumns: widths.map(it => it + 'px').join(' ') });
	};

	onDragStartColumn (e: any, id: string) {
		e.stopPropagation();

		const { rows } = this.getData();
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const table = $('<div />').addClass('table isClone');

		rows.forEach((row: I.Block, i: number) => {
			const rowElement = $('<div />').addClass('row');
			const cell = $(node.find(`.cell.column${id}`).get(i));
			const clone = cell.clone();

			clone.css({ height: cell.outerHeight() });

			rowElement.append(clone);
			table.append(rowElement);
		});

		table.css({ zIndex: 10000, position: 'fixed', left: -10000, top: -10000 });
		node.append(table);

		$(document).off('dragover').on('dragover', (e: any) => { e.preventDefault(); });
		e.dataTransfer.setDragImage(table.get(0), table.outerWidth(), -3);

		win.on('drag.board', throttle((e: any) => { this.onDragMoveColumn(e, id); }, 40));
		win.on('dragend.board', (e: any) => { this.onDragEnd(e); });

		this.initCache();
		this.setEditing('');
		this.onOptionsOpen(id);
		this.preventSelect(true);
	};

	onDragMoveColumn (e: any, id: string) {
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
				isLeft = e.pageX <= rect.x + rect.width / 2;
				hoverId = column.id;
				
				this.newIndex = isLeft ? rect.index : rect.index + 1;
				break;
			};
		};

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
			node.find('.cell.isOver').removeClass('isOver left right');

			if (hoverId) {
				node.find(`.cell.column${hoverId}`).addClass('isOver ' + (isLeft ? 'left' : 'right'));
			};
		}, 40);

		this.newIndex = Math.max(0, this.newIndex);
		this.newIndex = Math.min(columns.length - 1, this.newIndex);
	};

	onDragEnd (e: any) {
		e.preventDefault();

		const node = $(ReactDOM.findDOMNode(this));

		this.cache = {};
		this.onSortEndColumn();
		this.preventSelect(false);

		node.find('.table.isClone').remove();
		node.find('.cell.isOver').removeClass('isOver left right');
	};

	initCache () {
		this.cache = {};

		const { columns } = this.getData();
		const node = $(ReactDOM.findDOMNode(this));

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
	};

	alignIcon (v: I.TableAlign): string {
		let icon = '';
		switch (v) {
			default:
			case I.TableAlign.Left:		 icon = 'left'; break;
			case I.TableAlign.Center:	 icon = 'center'; break;
			case I.TableAlign.Right:	 icon = 'right'; break;
			case I.TableAlign.Top:		 icon = 'top'; break;
			case I.TableAlign.Bottom:	 icon = 'bottom'; break;
		};
		return icon;
	};

	onSortStart () {
		$('body').addClass('grab');
		this.preventSelect(true);
	};

	onSortEndColumn () {
		const { rootId } = this.props;
		const { rows, columns } = this.getData();
		const oldColumn = columns[this.oldIndex];
		const newColumn = columns[this.newIndex];

		if (!oldColumn || !newColumn) {
			return;
		};

		const position = this.newIndex < this.oldIndex ? I.BlockPosition.Left : I.BlockPosition.Right;
		C.BlockTableColumnMove(rootId, oldColumn.id, newColumn.id, position);

		$('body').removeClass('grab');
		this.preventSelect(false);
	};

	onSortEndRow (result: any) {
		const { oldIndex, newIndex } = result;
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

	initSize () {
		const { columns } = this.getData();
		const node = $(ReactDOM.findDOMNode(this));
		const rows = node.find('.row');
		const sizes = [];

		columns.forEach((it: I.Block) => {
			sizes.push(this.checkWidth(it.fields.width || Constant.size.table.cell));
		});

		rows.css({ gridTemplateColumns: sizes.map(it => it + 'px').join(' ') });
	};

	resize () {
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
		const css: any = {};

		let width = offset;
		row.css('grid-template-columns').split(' ').forEach((it: string) => {
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
		return Math.max(min, Math.min(max, w));
	};

	optionsRow () {
		const { rows } = this.getData();
		return [
			{ id: 'rowBefore', icon: 'table-insert-top', name: 'Row before' },
			{ id: 'rowAfter', icon: 'table-insert-bottom', name: 'Row after' },
			{ id: 'rowMoveTop', icon: 'table-move-top', name: 'Move row up' },
			{ id: 'rowMoveBottom', icon: 'table-move-bottom', name: 'Move row down' },
			rows.length > 1 ? { id: 'rowRemove', icon: 'remove', name: 'Delete row' } : null,
			{ isDiv: true },
		];
	};

	optionsColumn () {
		const { columns } = this.getData();
		return [
			{ id: 'columnBefore', icon: 'table-insert-left', name: 'Column before' },
			{ id: 'columnAfter', icon: 'table-insert-right', name: 'Column after' },
			{ id: 'columnMoveLeft', icon: 'table-move-left', name: 'Move column left' },
			{ id: 'columnMoveRight', icon: 'table-move-right', name: 'Move column right' },
			columns.length > 1 ? { id: 'columnRemove', icon: 'remove', name: 'Delete column' } : null,
			{ isDiv: true },
		];
	};

	optionsColor (id: string) {
		const { rootId } = this.props;
		const current = blockStore.getLeaf(rootId, id);

		if (!current) {
			return;
		};

		let inner: any = null;
		if (current.type == I.BlockType.TableCell) {
			inner = blockStore.getLeaf(rootId, blockStore.getChildrenIds(rootId, current.id)[0]);
		};

		const innerColor = <div className={[ 'inner', 'textColor textColor-' + (inner?.content.color || 'default') ].join(' ')} />;
		const innerBackground = <div className={[ 'inner', 'bgColor bgColor-' + (inner?.bgColor || 'default') ].join(' ')} />;

		return [
			{ id: 'color', icon: 'color', name: 'Color', inner: innerColor, arrow: true },
			{ id: 'background', icon: 'color', name: 'Background', inner: innerBackground, arrow: true },
			{ id: 'style', icon: DataUtil.styleIcon(I.BlockType.Text, inner?.content.style), name: 'Text style', arrow: true },
			{ isDiv: true },
		];
	};

	optionsAlign () {
		const ah = I.TableAlign.Left;
		const av = I.TableAlign.Top;
		return [
			{ id: 'horizontal', icon: 'align ' + this.alignIcon(ah), name: 'Horizontal align', arrow: true },
			{ id: 'vertical', icon: 'align ' + this.alignIcon(av), name: 'Vertical align', arrow: true },
		];
	};

	optionsHAlign () {
		return [
			{ id: I.TableAlign.Left, name: 'Left' },
			{ id: I.TableAlign.Center, name: 'Center' },
			{ id: I.TableAlign.Right, name: 'Right' },
		].map((it: any) => {
			it.icon = 'align ' + this.alignIcon(it.id);
			return it;
		});
	};

	optionsVAlign () {
		return [
			{ id: I.TableAlign.Top, name: 'Top' },
			{ id: I.TableAlign.Center, name: 'Center' },
			{ id: I.TableAlign.Bottom, name: 'Bottom' },
		].map((it: any) => {
			it.icon = 'align ' + this.alignIcon(it.id);
			return it;
		});
	};

});

export default BlockTable;