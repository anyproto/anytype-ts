import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C, keyboard } from 'ts/lib';
import { observer } from 'mobx-react';
import { menuStore, blockStore } from 'ts/store';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import arrayMove from 'array-move';

import Cell from './table/cell';

interface Props extends I.BlockComponent {};

const $ = require('jquery');

const BlockTable = observer(class BlockTable extends React.Component<Props, {}> {

	_isMounted: boolean = false;

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
		const children = blockStore.getChildren(rootId, block.id);

		// Subscriptions
		rows.forEach(child => {
			const { bgColor } = child;
			const cells = blockStore.getChildren(rootId, child.id);

			cells.forEach(cell => {
				const cids = blockStore.getChildrenIds(rootId, cell.id);
			});
		});
		columns.forEach(child => {
			const { bgColor } = child;
		});

		const Row = (row: any) => {
			const children = blockStore.getChildren(rootId, row.id);

			return (
				<div className="row">
					{columns.map((column: any, i: number) => {
						if (row.isHead) {
							return (
								<CellSortableElement 
									key={i} 
									block={children[i]} 
									index={i} 
									rowIdx={row.idx} 
									columnIdx={i} 
								/>
							);
						} else {
							return (
								<Cell 
									key={i}
									rootId={rootId}
									block={children[i]} 
									rowIdx={row.idx} 
									columnIdx={i} 
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
						};
					})}
				</div>
			);
		};

		const CellSortableElement = SortableElement((item: any) => {
			return (
				<Cell 
					rootId={rootId}
					{...item}
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
			return <Row {...item} />;
		});

		const RowSortableContainer = SortableContainer((item: any) => {
			return <Row {...item} isHead={true} />;
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
									id={i}
									{...row}
								/>
							);
						} else {
							return <RowSortableElement key={i} id={i} index={i} {...row} />
						};
					})}
				</div>
			);
		});

		return (
			<div 
				tabIndex={0} 
				className={cn.join(' ')}
			>
				<div className="scrollWrap">
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
	};

	componentDidUpdate () {
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};

	getData () {
		const { rootId, block } = this.props;
		const childrenIds = blockStore.getChildrenIds(rootId, block.id);
		const children = blockStore.getChildren(rootId, block.id);
		const columnContainer = children.find(it => it.isLayoutTableColumns());
		const columns = blockStore.getChildren(rootId, columnContainer.id, it => it.isTableColumn());
		const rowContainer = children.find(it => it.isLayoutTableRows());
		const rows = blockStore.getChildren(rootId, rowContainer.id, it => it.isTableRow());

		return { columns, rows };
	};

	onOptions (e: any, id: string) {
		e.preventDefault();
		e.stopPropagation();

		const { rootId, block } = this.props;
		const current = blockStore.getLeaf(rootId, id);

		if (!current) {
			return;
		};

		const { rows, columns } = this.getData();
		const columnCnt = columns.length;
		const rowCnt = rows.length;

		const subIds = [ 'select2', 'blockColor', 'blockBackground' ];
		const innerColor = <div className={[ 'inner', 'textColor textColor-' + (current.color || 'default') ].join(' ')} />;
		const innerBackground = <div className={[ 'inner', 'bgColor bgColor-' + (current.background || 'default') ].join(' ')} />;
		const ah = I.TableAlign.Left;
		const av = I.TableAlign.Top;

		let menuContext: any = null;

		let options: any[] = [
			{ id: 'horizontal', icon: 'align ' + this.alignIcon(ah), name: 'Horizontal align', arrow: true },
			{ id: 'vertical', icon: 'align ' + this.alignIcon(av), name: 'Vertical align', arrow: true },
		];
		let optionsColumn = [
			{ id: 'columnBefore', name: 'Column before' },
			{ id: 'columnAfter', name: 'Column after' },
			columnCnt > 1 ? { id: 'columnRemove', name: 'Remove column' } : null,
			{ isDiv: true },
		];
		let optionsRow = [
			{ id: 'rowBefore', name: 'Row before' },
			{ id: 'rowAfter', name: 'Row after' },
			rowCnt ? { id: 'rowRemove', name: 'Remove row' } : null,
			{ isDiv: true },
		];
		let optionsColor = [
			{ id: 'color', icon: 'color', name: 'Color', inner: innerColor, arrow: true },
			{ id: 'background', icon: 'color', name: 'Background', inner: innerBackground, arrow: true },
			{ isDiv: true },
		];

		let optionsHorizontal = [
			{ id: I.TableAlign.Left, name: 'Left' },
			{ id: I.TableAlign.Center, name: 'Center' },
			{ id: I.TableAlign.Right, name: 'Right' },
		].map((it: any) => {
			it.icon = 'align ' + this.alignIcon(it.id);
			return it;
		});

		let optionsVertical = [
			{ id: I.TableAlign.Top, name: 'Top' },
			{ id: I.TableAlign.Center, name: 'Center' },
			{ id: I.TableAlign.Bottom, name: 'Bottom' },
		].map((it: any) => {
			it.icon = 'align ' + this.alignIcon(it.id);
			return it;
		});

		switch (current.type) {
			case I.BlockType.TableRow:
				options = optionsRow.concat(options);
				options = optionsColor.concat(options);
				break;

			case I.BlockType.TableColumn:
				options = optionsColumn.concat(options);
				options = optionsColor.concat(options);
				break;

			case I.BlockType.TableCell:
				options = optionsColumn.concat(options);
				options = optionsRow.concat(options);
				options = optionsColor.concat(options);
				break;
		};

		menuStore.open('select1', {
			component: 'select',
			rect: { x: e.pageX, y: e.pageY, width: 1, height: 1 },
			offsetY: 10,
			horizontal: I.MenuDirection.Center,
			onOpen: (context: any) => {
				menuContext = context;
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
							value: current[item.id],
						}
					};

					switch (item.id) {
						case 'horizontal':
							menuId = 'select2';
							menuParam.component = 'select';
							menuParam.data = Object.assign(menuParam.data, {
								options: optionsHorizontal,
								onSelect: (e: any, el: any) => {
									menuContext.close();
								}
							});
							break;

						case 'vertical':
							menuId = 'select2';
							menuParam.component = 'select';
							menuParam.data = Object.assign(menuParam.data, {
								options: optionsVertical,
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
							//this.columnAdd(column, -1);
							break;

						case 'columnAfter':
							//this.columnAdd(column, 1);
							break;

						case 'columnRemove':
							//this.columnRemove(column);
							break;

						case 'rowBefore':
							//this.rowAdd(row, -1);
							break;

						case 'rowAfter':
							//this.rowAdd(row, 1);
							break;

						case 'rowRemove':
							//this.rowRemove(row);
							break;
					};
				}
			},
		});
	};

	onFocus (e: any, id: string) {
		this.setEditing(id);
	};

	onBlur (e: any, id: string) {
		this.setEditing('');
	};

	onClick (e: any, id: string) {
		this.setEditing(id);
	};

	setEditing (id: string) {
		const node = $(ReactDOM.findDOMNode(this));
		
		node.find('.cell.isEditing').removeClass('isEditing');
		if (id) {
			node.find(`#cell-${id}`).addClass('isEditing');
		};
	};

	onResizeStart (e: any, id: string) {
		e.preventDefault();
		e.stopPropagation();

		const win = $(window);

		$('body').addClass('colResize');
		win.unbind('mousemove.table mouseup.table');
		win.on('mousemove.table', (e: any) => { this.onResizeMove(e, id); });
		win.on('mouseup.table', (e: any) => { this.onResizeEnd(e); });

		keyboard.setResize(true);
	};

	onResizeMove (e: any, id: string) {
		e.preventDefault();
		e.stopPropagation();

		/*
		const { block } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const el = node.find(`.column${id}`);
		const offset = el.first().offset();
		const width = Math.max(Constant.size.table.min, Math.min(500, e.pageX - offset.left));

		el.css({ width: width });
		*/
	};

	onResizeEnd (e: any) {
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
		this.preventSelect(true);
	};

	onSortEndColumn (result: any) {
		const { oldIndex, newIndex } = result;

		this.preventSelect(false);
	};

	onSortEndRow (result: any) {
		const { oldIndex, newIndex } = result;

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

});

export default BlockTable;