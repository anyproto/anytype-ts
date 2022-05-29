import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C, keyboard, DataUtil, focus } from 'ts/lib';
import { observer } from 'mobx-react';
import { menuStore, blockStore } from 'ts/store';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import arrayMove from 'array-move';

import Row from './table/row';

interface Props extends I.BlockComponent {};

const $ = require('jquery');
const Constant = require('json/constant.json');

const PADDING = 46;

const BlockTable = observer(class BlockTable extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	offsetX: number = 0;

	constructor (props: any) {
		super(props);

		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onSort = this.onSort.bind(this);
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEndColumn = this.onSortEndColumn.bind(this);
		this.onSortEndRow = this.onSortEndRow.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onOptions = this.onOptions.bind(this);
		this.onResizeStart = this.onResizeStart.bind(this);
		this.getData = this.getData.bind(this);
	};

	render () {
		const { rootId, block, readonly } = this.props;
		const { rows, columns } = this.getData();
		const cn = [ 'wrap', 'focusable', 'c' + block.id ];

		// Subscriptions
		rows.forEach(child => {
			const { bgColor } = child;
			const cells = blockStore.getChildren(rootId, child.id);

			cells.forEach(cell => {
				const cids = blockStore.getChildrenIds(rootId, cell.id);
			});
		});
		columns.forEach(child => {
			const { bgColor, fields } = child;
			const { width } = fields;
		});

		const RowSortableContainer = SortableContainer((item: any) => {
			return (
				<Row 
					{...this.props} 
					{...item} 
					index={item.block.idx}
					isHead={true} 
					getData={this.getData}
					onOptions={this.onOptions}
					onClick={this.onClick}
					onCellFocus={this.onFocus}
					onCellBlur={this.onBlur}
					onSort={this.onSort}
					onResizeStart={this.onResizeStart}
				/>
			);
		});

		const RowSortableElement = SortableElement((item: any) => {
			return (
				<Row 
					{...this.props}
					{...item} 
					index={item.block.idx}
					isHead={false}
					getData={this.getData}
					onOptions={this.onOptions}
					onClick={this.onClick}
					onCellFocus={this.onFocus}
					onCellBlur={this.onBlur}
					onSort={this.onSort}
					onResizeStart={this.onResizeStart}
				/>
			);
		});

		const TableSortableContainer = SortableContainer((item: any) => {
			return (
				<div className="table">
					{rows.map((row: any, i: number) => {
						row.idx = i;

						if (i == 0) {
							return (
								<RowSortableContainer 
									key={i}
									axis="x" 
									lockAxis="x"
									lockToContainerEdges={true}
									transitionDuration={150}
									distance={10}
									useDragHandle={true}
									onSortStart={this.onSortStart}
									onSortEnd={this.onSortEndColumn}
									helperClass="isDraggingColumn"
									helperContainer={() => { return $(`#block-${block.id} .table`).get(0); }}
									block={row}
								/>
							);
						} else {
							return (
								<RowSortableElement 
									key={i} 
									index={i} 
									block={row} 
								/>
							);
						};
					})}
				</div>
			);
		});

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
		this.resize();
		this.rebind();
	};

	componentDidUpdate () {
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
		const columnContainer = children.find(it => it.isLayoutTableColumns());
		const columns = blockStore.getChildren(rootId, columnContainer.id, it => it.isTableColumn());
		const rowContainer = children.find(it => it.isLayoutTableRows());
		const rows = blockStore.getChildren(rootId, rowContainer.id, it => it.isTableRow());

		return { columnContainer, columns, rowContainer, rows };
	};

	onOptions (e: any, id: string) {
		e.preventDefault();
		e.stopPropagation();

		const { rootId } = this.props;
		const current = blockStore.getLeaf(rootId, id);

		if (!current) {
			return;
		};

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

		let options: any[] = [];
		switch (current.type) {
			case I.BlockType.TableRow:
				options = options.concat(optionsRow);
				options = options.concat(optionsColor);
				break;

			case I.BlockType.TableColumn:
				options = options.concat(optionsColumn);
				options = options.concat(optionsColor);
				break;

			case I.BlockType.TableCell:
				options = options.concat(optionsColumn);
				options = options.concat(optionsRow);
				options = options.concat(optionsColor);
				break;
		};
		options = options.concat(optionsAlign);

		menuStore.open('select1', {
			component: 'select',
			rect: { x: e.pageX, y: e.pageY, width: 1, height: 1 },
			offsetY: 10,
			horizontal: I.MenuDirection.Center,
			onOpen: (context: any) => {
				menuContext = context;
				$(`#block-${current.id}`).addClass('active');
			},
			onClose: () => {
				$(`#block-${current.id}`).removeClass('active');
			},
			subIds: subIds,
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
							value: current[item.id],
						}
					};

					switch (item.id) {
						case 'horizontal':
							menuId = 'select2';
							menuParam.component = 'select';
							menuParam.data = Object.assign(menuParam.data, {
								options: this.optionsHAlign(),
								onSelect: (e: any, el: any) => {
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
									C.BlockTextListSetColor(rootId, [ current.id ], id);
									menuContext.close();
								}
							});
							break;

						case 'background':
							menuId = 'blockBackground';
							menuParam.data = Object.assign(menuParam.data, {
								onChange: (id: string) => {
									C.BlockListSetBackgroundColor(rootId, [ current.id ], id);
									menuContext.close();
								}
							});
							break;

						case 'style':
							menuId = 'blockStyle';
							menuParam.data = Object.assign(menuParam.data, {
								blockIds: [ inner.id ],
								blockId: inner.id,
								isInsideTable: true,
								value: inner.content.style,
								onSelect: (item: any) => {
									if (item.type == I.BlockType.Text) {
										C.BlockListTurnInto(rootId, [ inner.id ], item.itemId);
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
							break;

						case 'columnAfter':
							break;

						case 'columnRemove':
							break;

						case 'rowBefore':
							break;

						case 'rowAfter':
							break;

						case 'rowRemove':
							break;
					};
				}
			},
		});
	};

	onFocus (e: any, id: string) {
		this.setEditing(id);
		this.preventSelect(true);
	};

	onBlur (e: any, id: string) {
		this.setEditing('');
		this.preventSelect(false);
	};

	onClick (e: any, id: string) {
		//this.setEditing(id);
		focus.set(id, { from: 0, to: 0 });
		focus.apply();
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
		const el = node.find(`.column${id}`);

		if (el.length) {
			this.offsetX = el.first().offset().left;
		};

		body.addClass('colResize');
		win.unbind('mousemove.table mouseup.table');
		win.on('mousemove.table', (e: any) => { this.onResizeMove(e, id); });
		win.on('mouseup.table', (e: any) => { this.onResizeEnd(e, id); });

		keyboard.setResize(true);
	};

	onResizeMove (e: any, id: string) {
		e.preventDefault();
		e.stopPropagation();

		const node = $(ReactDOM.findDOMNode(this));
		const el = node.find(`.column${id}`);

		el.css({ width: this.checkWidth(e.pageX - this.offsetX) });
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

	onSortEndColumn (result: any) {
		const { oldIndex, newIndex } = result;

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

		blockStore.updateStructure(rootId, rowContainer.id, arrayMove(childrenIds, oldIndex, newIndex));
		C.BlockListMoveToExistingObject(rootId, rootId, [ current ], target, position);

		$('body').removeClass('grab');
		this.preventSelect(false);
	};

	onSort (e: any, id: string, sort: I.SortType) {
		e.preventDefault();
		e.stopPropagation();

	};

	preventSelect (v: boolean) {
		const { dataset } = this.props;
		const { selection } = dataset || {};

		if (selection) {
			selection.preventSelect(v);
		};
	};

	resize () {
		const { isPopup, block, getWrapperWidth } = this.props;
		const { columns } = this.getData();
		const obj = $(`#block-${block.id}`);
		const container = $(isPopup ? '#popupPage #innerWrap' : '#page.isFull');
		const ww = container.width();
		const mw = ww - PADDING * 2;
		const wrapperWidth = getWrapperWidth();
		const offset = Constant.size.blockMenu;

		let width = offset + 12;

		columns.forEach((it: I.Block) => {
			const node = $(ReactDOM.findDOMNode(this));
			const el = node.find(`.column${it.id}`);
			const w = this.checkWidth(it.fields.width || Constant.size.table.cell);

			width += w;
			el.css({ width: w });
		});

		width = Math.min(mw, width);

		obj.css({ 
			width, 
			marginLeft: Math.min(0, (wrapperWidth - width) / 2) + offset / 2,
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

		const innerColor = <div className={[ 'inner', 'textColor textColor-' + (current.color || 'default') ].join(' ')} />;
		const innerBackground = <div className={[ 'inner', 'bgColor bgColor-' + (current.background || 'default') ].join(' ')} />;

		return [
			{ id: 'color', icon: 'color', name: 'Color', inner: innerColor, arrow: true },
			{ id: 'background', icon: 'color', name: 'Background', inner: innerBackground, arrow: true },
			inner && inner.isText() ? { id: 'style', icon: DataUtil.styleIcon(I.BlockType.Text, inner.content.style), name: 'Text style', arrow: true } : null,
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