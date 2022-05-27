import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C, M, Util, keyboard } from 'ts/lib';
import { Icon, Block } from 'ts/component';
import { observer } from 'mobx-react';
import { getRange, setRange } from 'selection-ranges';
import { menuStore, blockStore } from 'ts/store';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import arrayMove from 'array-move';

interface Props extends I.BlockComponent {};

interface Focus {
	row: number;
	column: number;
	range: I.TextRange;
};

const Constant = require('json/constant.json');
const $ = require('jquery');

const BlockTable = observer(class BlockTable extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	timeout: number = 0;
	focusObj: Focus = { row: 0, column: 0, range: { from: 0, to: 0 } };
	isEditing: boolean = false;

	constructor (props: any) {
		super(props);

		/*
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onSelect = this.onSelect.bind(this);
		*/

		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEndColumn = this.onSortEndColumn.bind(this);
		this.onSortEndRow = this.onSortEndRow.bind(this);
	};

	render () {
		const { rootId, block, readonly } = this.props;
		const cn = [ 'wrap', 'focusable', 'c' + block.id ];
		const childrenIds = blockStore.getChildrenIds(rootId, block.id);
		const children = blockStore.getChildren(rootId, block.id);

		const columnContainer = children.find(it => it.isLayoutTableColumns());
		const columns = blockStore.getChildren(rootId, columnContainer.id, it => it.isTableColumn());

		const rowContainer = children.find(it => it.isLayoutTableRows());
		const rows = blockStore.getChildren(rootId, rowContainer.id, it => it.isTableRow());

		console.log(JSON.stringify(childrenIds, null, 3));
		console.log(JSON.stringify(children, null, 3));
		console.log(JSON.stringify(columns, null, 3));
		console.log(JSON.stringify(rows, null, 3));

		const HandleColumn = SortableHandle((item: any) => (
			<div 
				className={[ 'icon', 'handleColumn' ].join(' ')}
				onClick={(e: any) => { this.onOptions(e, item.id); }}
				onContextMenu={(e: any) => { this.onOptions(e, item.id); }}
			/>
		));

		const HandleRow = SortableHandle((item: any) => (
			<div 
				className={[ 'icon', 'handleRow' ].join(' ')}
				onClick={(e: any) => { this.onOptions(e, item.id); }}
				onContextMenu={(e: any) => { this.onOptions(e, item.id); }}
			/>
		));

		const Cell = (cell: any) => {
			const row = rows[cell.rowIdx];
			const column = columns[cell.columnIdx];
			const childrenIds = blockStore.getChildrenIds(rootId, cell.id);
			const inner = blockStore.getLeaf(rootId, childrenIds[0]);
			const cn = [ 'cell', 'column' + cell.id, 'align-v' + cell.vertical, 'align-h' + cell.horizontal ];
			const css: any = {};
			const isEditing = false;
			const length = childrenIds.length;
			const bgColor = cell.bgColor || column.bgColor || row.bgColor;
			
			let nextSort: I.SortType = I.SortType.Asc;
			let acn = [ 'arrow'];

			/*
			if (sortIndex == item.id) {
				acn.push('c' + sortType);
				acn.push('show');
				nextSort = sortType == I.SortType.Asc ? I.SortType.Desc : I.SortType.Asc;
			} else {
				acn.push('c' + I.SortType.Asc);
			};
			*/

			console.log();

			if (isEditing) {
				cn.push('isEditing');
			};
			if (cell.isHead) {
				cn.push('isHead');
			};
			if (cell.color) {
				cn.push('textColor textColor-' + cell.color);
			};
			if (bgColor) {
				cn.push('bgColor bgColor-' + bgColor);
			};

			/*
			if (cell.width) {
				css.width = cell.width;
			};
			*/

			css.width = (1 / columns.length) * 100 + '%';

			const arrow = (
				<Icon 
					className={acn.join(' ')} 
					onClick={(e: any) => { this.onSort(e, column.id, nextSort); }}
				/>
			);

			return (
				<div
					className={cn.join(' ')}
					style={css}
					//onClick={() => { this.setEditing(item.row.id, item.id, null); }}
					onContextMenu={(e: any) => { this.onOptions(e, cell.id); }}
				>
					{cell.isHead ? <HandleColumn {...column} /> : ''}

					<Block 
						key={'table-' + inner.id} 
						{...this.props} 
						block={inner} 
						rootId={rootId} 
						index={0} 
						readonly={readonly} 
						isDragging={true}
						className="noPlus"
						getWrapperWidth={() => { return Constant.size.editor; }} 
					/>

					{cell.isHead ? arrow : ''}
					<div className="resize" onMouseDown={(e: any) => { this.onResizeStart(e, cell.id); }} />
				</div>
			);
		};

		const Row = (row: any) => {
			const children = blockStore.getChildren(rootId, row.id);

			return (
				<div className="row">
					<HandleRow {...row} />

					{columns.map((column: any, i: number) => {
						if (row.isHead) {
							return <CellSortableElement key={i} {...children[i]} row={row} index={i} rowIdx={row.idx} columnIdx={i} />;
						} else {
							return <Cell key={i} {...children[i]} row={row} index={i} rowIdx={row.idx} columnIdx={i} />;
						};
					})}
				</div>
			);
		};

		const CellSortableElement = SortableElement((item: any) => {
			return <Cell {...item} isHead={true} />;
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
									helperClass="isDragging"
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
						helperClass="isDragging"
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
		//this.focusApply();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};

	onResizeStart (e: any, index: number) {
		e.preventDefault();
		e.stopPropagation();

		const win = $(window);

		$('body').addClass('colResize');
		win.unbind('mousemove.table mouseup.table');
		win.on('mousemove.table', (e: any) => { this.onResizeMove(e, index); });
		win.on('mouseup.table', (e: any) => { this.onResizeEnd(e, index); });

		keyboard.setResize(true);
	};

	onResizeMove (e: any, index: number) {
		e.preventDefault();
		e.stopPropagation();

		const { block } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const el = node.find(`.column${index}`);
		const offset = el.first().offset();
		const width = Math.max(Constant.size.table.min, Math.min(500, e.pageX - offset.left));

		el.css({ width: width });
	};

	onResizeEnd (e: any, index: number) {
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

	onOptions (e: any, id: string) {
		e.preventDefault();
		e.stopPropagation();

		const { rootId, block } = this.props;
		const current = blockStore.getLeaf(rootId, id);

		if (!current) {
			return;
		};

		const children = blockStore.getChildren(rootId, block.id);
		const columnContainer = children.find(it => it.isLayoutTableColumns());
		const columns = blockStore.getChildren(rootId, columnContainer.id, it => it.isTableColumn());
		const columnCnt = columns.length;
		const rowContainer = children.find(it => it.isLayoutTableRows());
		const rows = blockStore.getChildren(rootId, rowContainer.id, it => it.isTableRow());
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

	onSort (e: any, id: string) {
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