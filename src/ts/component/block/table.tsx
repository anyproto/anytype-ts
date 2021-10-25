import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { I, C, M, Util, keyboard } from 'ts/lib';
import { Icon } from 'ts/component';
import { observer } from 'mobx-react';
import { getRange, setRange } from 'selection-ranges';
import { menuStore, blockStore } from 'ts/store';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import arrayMove from 'array-move';

interface Props extends I.BlockComponent, RouteComponentProps<any> {};

interface Focus {
	row: number;
	column: number;
	range: I.TextRange;
};

const $ = require('jquery');

enum Key {
	None	 = '',
	Column	 = 'columns',
	Row		 = 'rows',
	Cell	 = 'cell',
};

const BlockTable = observer(class BlockTable extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	timeout: number = 0;
	focusObj: Focus = { row: 0, column: 0, range: { from: 0, to: 0 } };

	constructor (props: any) {
		super(props);

		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEndColumn = this.onSortEndColumn.bind(this);
		this.onSortEndRow = this.onSortEndRow.bind(this);
	};

	render () {
		const { readonly, block } = this.props;
		const { columnCount, rows } = block.content;
		const cn = [ 'wrap', 'focusable', 'c' + block.id ];
		const columns = [];
		const cr = rows.length;

		for (let i = 0; i < columnCount; ++i) {
			columns.push(i);
		};

		let Editor = null;
		if (readonly) {
			Editor = (item: any) => (
				<div className="value">{item.value}</div>
			);
		} else {
			Editor = (item: any) => (
				<div
					id={item.id}
					className="value"
					contentEditable={!readonly}
					suppressContentEditableWarning={true}
					onKeyDown={this.onKeyDown}
					onKeyUp={this.onKeyUp}
					onFocus={this.onFocus}
					onBlur={this.onBlur}
					onSelect={this.onSelect}
					onPaste={() => {}}
					onMouseDown={() => {}}
					onMouseUp={() => {}}
					onInput={() => {}}
					onCompositionStart={() => {}}
					onCompositionEnd={() => {}}
					onDragStart={(e: any) => { e.preventDefault(); }}
				>
					{item.value}
				</div>
			);
		};

		const HandleColumn = SortableHandle((item: any) => (
			<div 
				className="handleColumn"
				onClick={(e: any) => { this.onOptions(e, Key.Column, 0, item.id); }}
				onContextMenu={(e: any) => { this.onOptions(e, Key.Column, 0, item.id); }}
			/>
		));

		const HandleRow = SortableHandle((item: any) => (
			<div 
				className="cell handleRow"
				onClick={(e: any) => { this.onOptions(e, Key.Row, item.id, 0); }}
				onContextMenu={(e: any) => { this.onOptions(e, Key.Row, item.id, 0); }}
			/>
		));

		const Cell = (item: any) => {
			const cell = (item.row.cells || [])[item.id] || {};
			const cn = [ 'cell', 'column' + item.id, 'align-v' + cell.vertical, 'align-h' + cell.horizontal ];
			const css: any = {};
			const isHead = item.row.id == 0;

			if (isHead) {
				cn.push('head');
			};
			if (cell.color) {
				cn.push('textColor textColor-' + cell.color);
			};
			if (cell.background) {
				cn.push('bgColor bgColor-' + cell.background);
			};
			if (cell.width) {
				css.width = cell.width;
			};

			return (
				<div
					className={cn.join(' ')}
					style={css}
					onContextMenu={(e: any) => { this.onOptions(e, Key.Cell, item.row.id, item.id); }}
				>
					{isHead ? <HandleColumn {...item} /> : ''}
					<Editor 
						id={[ 'value', item.row.id, item.id ].join('-')} 
						value={cell.value} 
					/>
					<div className="resize" onMouseDown={(e: any) => { this.onResizeStart(e, item.id); }} />
				</div>
			);
		};

		const Row = (row: any) => (
			<div className="row">
				<HandleRow {...row} />

				{columns.map((column: any, i: number) => {
					if (row.id == 0) {
						return <CellSortableElement key={i} row={row} id={i} index={i} />;
					} else {
						return <Cell key={i} row={row} id={i} index={i} />	;
					};
				})}
			</div>
		);

		const CellSortableElement = SortableElement((item: any) => {
			return <Cell {...item} />;
		});

		const RowSortableElement = SortableElement((item: any) => {
			return <Row {...item} />;
		});

		const RowSortableContainer = SortableContainer((item: any) => {
			return <Row {...item} />;
		});

		const TableSortableContainer = SortableContainer((item: any) => {
			return (
				<div className="table">
					{rows.map((row: any, i: number) => {
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
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};

	componentDidUpdate () {
		this.focusApply();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};

	getTarget (row: number, column: number) {
		const node = $(ReactDOM.findDOMNode(this));
		return node.find(`#${[ 'value', row, column ].join('-')}`);
	};

	getTargetIds (obj: any) {
		const ids = obj.attr('id').split('-');
		return { 
			row: Number(ids[1]) || 0, 
			column: Number(ids[2]) || 0,
		};
	};

	getLength (row: number, column: number) {
		const { block } = this.props;
		const { rows } = block.content;

		return Number(rows[row]?.cells[column]?.value.length) || 0;
	};

	focusApply () {
		const { row, column, range } = this.focusObj;
		const target = this.getTarget(row, column);

		this.setRange(target, range);
	};

	focusSet (row: number, column: number, range: I.TextRange): void {
		const { block } = this.props;
		const { columnCount, rows } = block.content;

		column = Math.max(0, Math.min(columnCount - 1, column));
		row = Math.max(0, Math.min(rows.length - 1, row));

		this.focusObj = { row, column, range };
		this.focusApply();
	};

	onFocus (e: any) {
		e.stopPropagation();
		keyboard.setFocus(true);
	};

	onBlur (e: any) {
		const target = $(e.currentTarget);
		const { row, column } = this.getTargetIds(target);

		window.clearTimeout(this.timeout);
		keyboard.setFocus(false);

		this.saveValue(row, column, this.getValue(target));
	};

	onSelect (e: any) {
		const target = $(e.currentTarget);
		const { row, column } = this.getTargetIds(target);

		this.focusObj = { row, column, range: this.getRange(target) };
	};

	onKeyDown (e: any) {
		const { block } = this.props;
		const { columnCount } = block.content;
		const { row, column, range } = this.focusObj;
		const target = this.getTarget(row, column);
		const value = this.getValue(target);

		const isFirstCol = column == 0;
		const isLastCol = column == columnCount - 1;

		let r = row;
		let c = column;

		keyboard.shortcut('arrowup', e, (pressed: string) => {
			e.preventDefault();

			r--;
			this.focusSet(r, c, range);
		});

		keyboard.shortcut('arrowdown', e, (pressed: string) => {
			e.preventDefault();

			r++;
			this.focusSet(r, c, range);
		});

		keyboard.shortcut('arrowright', e, (pressed: string) => {
			const length = this.getLength(row, column);
			if (range.from != length) {
				return;
			};

			if (!isLastCol) {
				c++;
			} else {
				r++;
				c = 0;
			};

			e.preventDefault();
			this.focusSet(r, c, { from: 0, to: 0 });
		});

		keyboard.shortcut('arrowleft, backspace', e, (pressed: string) => {
			if (range.to) {
				return;
			};

			e.preventDefault();
			if (!isFirstCol) {
				c--;
			} else {
				r--;
				c = columnCount - 1;
			};

			const l = this.getLength(r, c);
			this.focusSet(r, c, { from: l, to: l });
		});

		keyboard.shortcut('enter', e, (pressed: string) => {
			e.preventDefault();
			
			this.saveValue(row, column, value);
			this.rowAdd(row, 1);
			this.focusSet(row + 1, column, { from: 0, to: 0 });
		});
	};

	onKeyUp (e: any) {
		const { row, column } = this.focusObj;
		const target = this.getTarget(row, column);
		const value = this.getValue(target);

		let ret = false;

		keyboard.shortcut('arrowup, arrowdown, arrowleft, arrowright, backspace, enter', e, (pressed: string) => {
			ret = true;
		});

		window.clearTimeout(this.timeout);
		if (!ret) {
			this.timeout = window.setTimeout(() => { this.saveValue(row, column, value); }, 500);
		};
	};

	columnAdd (index: number, dir: number) {
		const { rootId, block } = this.props;
		const { columnCount, rows } = block.content;
		const idx = index + (dir > 0 ? 1 : 0);

		for (let row of rows) {
			const cell = Util.objectCopy(row.cells[index]);
			row.cells.splice(idx, 0, { ...cell, value: '', width: 50 });
		};

		blockStore.update(rootId, { 
			...block, 
			content: { 
				columnCount: columnCount + 1, 
				rows: rows,
			},
		});

		this.saveContent();
	};

	columnRemove (index: number) {
		const { rootId, block } = this.props;
		const { columnCount, rows } = block.content;

		for (let row of rows) {
			row.cells.splice(index, 1);
		};

		blockStore.update(rootId, { 
			...block, 
			content: { 
				columnCount: columnCount - 1, 
				rows: rows,
			},
		});

		this.saveContent();
	};

	rowAdd (index: number, dir: number) {
		index = Math.max(0, index);

		const { block } = this.props;
		const { rows } = block.content;
		const idx = index + (dir > 0 ? 1 : 0);

		let row: I.TableRow = new M.TableRow(rows[index] || {});
		
		row = this.fillRow(row);
		row.cells.map((it: I.TableCell) => {
			it.value = '';
			return it;
		});
		rows.splice(idx, 0, row);

		this.saveContent();
	};

	rowRemove (index: number) {
		const { block } = this.props;
		const { rows } = block.content;
		const { column } = this.focusObj;

		rows.splice(index, 1);

		const l = this.getLength(index, column);
		this.focusSet(index, column, { from: l, to: l });
		this.saveContent();
	};

	fillRow (row: I.TableRow) {
		const { block } = this.props;
		const { columnCount } = block.content;

		for (let i = 0; i < columnCount; ++i) {
			row.cells[i] = Object.assign({
				value: '', 
				horizontal: I.TableAlign.Left,
				vertical: I.TableAlign.Top,
				color: '',
				background: '',
				width: 0,
			}, row.cells[i] || {});
		};

		return row;
	};

	saveValue (row: number, column: number, value: string) {
		const { rootId, block } = this.props;
		const { rows } = block.content;

		rows[row] = this.fillRow(rows[row] || { data: [] });
		rows[row].cells[column].value = value;

		C.BlockUpdateContent({ ...block }, rootId, block.id);
	};

	saveContent () {
		const { rootId, block } = this.props;

		C.BlockUpdateContent({ ...block }, rootId, block.id, () => {
			this.forceUpdate();
		});
	};

	getValue (obj: any): string {
		if (!obj.length) {
			return '';
		};
		return String(obj.get(0).innerText || '').trim();
	};

	getRange (obj: any) {
		if (!obj.length) {
			return null;
		};

		const range = getRange(obj.get(0) as Element);
		return range ? { from: range.start, to: range.end } : null;
	};

	setRange (obj: any, range: I.TextRange) {
		if (!obj.length) {
			return;
		};
		const el = obj.get(0);

		el.focus();
		setRange(el, { start: range.from, end: range.to });
	};

	onResizeStart (e: any, index: number) {
		e.preventDefault();
		e.stopPropagation();

		const { block } = this.props;
		const { rows } = block.content;

		rows.forEach((row: I.TableRow) => {
			row = this.fillRow(row);
		});

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
		const { rows } = block.content;
		const node = $(ReactDOM.findDOMNode(this));
		const el = node.find(`.column${index}`);
		const offset = el.first().offset();

		let width = e.pageX - offset.left;
		width = Math.max(20, Math.min(500, width)); 

		rows.forEach((row: I.TableRow) => {
			row.cells[index].width = width;
		});

		el.css({ width: width });
	};

	onResizeEnd (e: any, index: number) {
		$(window).unbind('mousemove.table mouseup.table');
		$('body').removeClass('colResize');

		keyboard.setResize(false);
		this.saveContent();
	};

	onOptions (e: any, key: Key, row: number, column: number) {
		e.preventDefault();
		e.stopPropagation();

		const { block } = this.props;
		const { columnCount, rows } = block.content;
		const subIds = [ 'select2', 'blockColor', 'blockBackground' ];
		const color = this.getProperty(row, column, 'color');
		const background = this.getProperty(row, column, 'background');
		const ah = this.getProperty(row, column, 'horizontal');
		const av = this.getProperty(row, column, 'vertical');

		const innerColor = <div className={[ 'inner', 'textColor textColor-' + (color || 'default') ].join(' ')} />;
		const innerBackground = <div className={[ 'inner', 'bgColor bgColor-' + (background || 'default') ].join(' ')} />;

		let menuContext: any = null;
		
		let options: any[] = [
			{ id: 'horizontal', icon: 'align ' + this.alignIcon(ah), name: 'Horizontal align', arrow: true },
			{ id: 'vertical', icon: 'align ' + this.alignIcon(av), name: 'Vertical align', arrow: true },
		];
		let optionsColumn = [
			{ id: 'columnBefore', name: 'Column before' },
			{ id: 'columnAfter', name: 'Column after' },
			columnCount > 1 ? { id: 'columnRemove', name: 'Remove column' } : null,
			{ isDiv: true },
		];
		let optionsRow = [
			{ id: 'rowBefore', name: 'Row before' },
			{ id: 'rowAfter', name: 'Row after' },
			rows.length > 1 ? { id: 'rowRemove', name: 'Remove row' } : null,
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

		switch (key) {
			case Key.Column:
				options = optionsColumn.concat(options);
				options = optionsColor.concat(options);
				break;

			case Key.Row:
				options = optionsRow.concat(options);
				options = optionsColor.concat(options);
				break;

			case Key.Cell:
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
							value: this.getProperty(row, column, item.id),
						}
					};

					switch (item.id) {
						case 'horizontal':
							menuId = 'select2';
							menuParam.component = 'select';
							menuParam.data = Object.assign(menuParam.data, {
								options: optionsHorizontal,
								onSelect: (e: any, el: any) => {
									this.setProperty(key, row, column, item.id, el.id);
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
									this.setProperty(key, row, column, item.id, el.id);
									menuContext.close();
								}
							});
							break;

						case 'color':
							menuId = 'blockColor';
							menuParam.data = Object.assign(menuParam.data, {
								onChange: (id: string) => {
									this.setProperty(key, row, column, item.id, id);
									menuContext.close();
								}
							});
							break;

						case 'background':
							menuId = 'blockBackground';
							menuParam.data = Object.assign(menuParam.data, {
								onChange: (id: string) => {
									this.setProperty(key, row, column, item.id, id);
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
							this.columnAdd(column, -1);
							break;

						case 'columnAfter':
							this.columnAdd(column, 1);
							break;

						case 'columnRemove':
							this.columnRemove(column);
							break;

						case 'rowBefore':
							this.rowAdd(row, -1);
							break;

						case 'rowAfter':
							this.rowAdd(row, 1);
							break;

						case 'rowRemove':
							this.rowRemove(row);
							break;
					};
				}
			},
		});
	};

	getProperty (row: number, column: number, k: string): any {
		const { block } = this.props;
		const { rows } = block.content;
		const rowObj = this.fillRow(rows[row]);

		return rowObj.cells[column][k];
	};

	setProperty (key: Key, row: number, column: number, k: string, v: any) {
		const { block } = this.props;
		const { rows } = block.content;

		switch (key) {
			case Key.Column:
				rows.forEach((row: I.TableRow) => {
					row = this.fillRow(row);
					row.cells[column][k] = v;
				});
				break;

			case Key.Row:
				rows[row].cells.map((it: I.TableCell) => {
					it[k] = v;
					return it;
				});
				break;

			case Key.Cell:
				rows[row].cells[column][k] = v;
				break;
		};

		this.saveContent();
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
		const { dataset } = this.props;
		const { selection } = dataset || {};

		if (selection) {
			selection.preventSelect(true);
		};
	};

	onSortEndColumn (result: any) {
		const { oldIndex, newIndex } = result;
		const { dataset, block } = this.props;
		const { rows } = block.content;
		const { selection } = dataset || {};

		rows.forEach((row: I.TableRow) => {
			row = this.fillRow(row);
			row.cells = arrayMove(row.cells, oldIndex, newIndex);
		});

		if (selection) {
			selection.preventSelect(false);
		};

		this.saveContent();
	};

	onSortEndRow (result: any) {
		const { oldIndex, newIndex } = result;
		const { dataset, block } = this.props;
		const { selection } = dataset || {};

		block.content.rows = arrayMove(block.content.rows, oldIndex, newIndex);

		if (selection) {
			selection.preventSelect(false);
		};

		this.saveContent();
	};

});

export default BlockTable;