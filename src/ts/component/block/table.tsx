import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { I, C, M, Util, keyboard } from 'ts/lib';
import { observer } from 'mobx-react';
import { getRange, setRange } from 'selection-ranges';
import { menuStore, blockStore } from '../../store';

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
	};

	render () {
		const { readonly, block } = this.props;
		const { columnCount, rowCount, rows } = block.content;
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

		const Row = (row: any) => (
			<tr>
				<td 
					className="first"
					onClick={(e: any) => { this.onOptions(e, Key.Row, row.index, 0); }}
					onContextMenu={(e: any) => { this.onOptions(e, Key.Row, row.index, 0); }}
				>
					&nbsp;
				</td>
				{columns.map((column: any, i: number) => {
					const cell = row.cells[i] || {};
					const cn = [ 'column' + i, 'align-v' + cell.vertical, 'align-h' + cell.horizontal ];
					const css: any = {};

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
						<td 
							key={i} 
							className={cn.join(' ')}
							style={css}
							onContextMenu={(e: any) => { this.onOptions(e, Key.Cell, row.index, i); }}
						>
							<Editor 
								id={[ 'value', row.index + 1, i ].join('-')} 
								value={cell.value} 
							/>
							<div className="resize" onMouseDown={(e: any) => { this.onResizeStart(e, i); }} />
						</td>
					);
				})}
			</tr>
		);

		return (
			<div 
				tabIndex={0} 
				className={cn.join(' ')}
			>
				<table>
					<tbody>
						{rows.map((item: any, i: number) => (
							<Row key={i} index={i} {...item} />
						))}
					</tbody>
				</table>
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

	getMaxRow () {
		const { block } = this.props;
		const { rows } = block.content;

		return rows.length;
	};

	focusApply () {
		const { row, column, range } = this.focusObj;
		const target = this.getTarget(row, column);

		this.setRange(target, range);
	};

	focusSet (row: number, column: number, range: I.TextRange): void {
		const { block } = this.props;
		const { columnCount } = block.content;

		column = Math.max(0, Math.min(columnCount - 1, column));
		row = Math.max(0, Math.min(this.getMaxRow(), row));

		this.focusObj = { row, column, range };
		this.focusApply();
	};

	onFocus (e: any) {
		keyboard.setFocus(true);
	};

	onBlur (e: any) {
		const target = $(e.currentTarget);
		const { row, column } = this.getTargetIds(target);
		const value = this.getValue(target);

		window.clearTimeout(this.timeout);
		keyboard.setFocus(false);

		this.saveValue(row, column, value);
	};

	onSelect (e: any) {
		const target = $(e.currentTarget);
		const { row, column } = this.getTargetIds(target);

		this.focusObj = { row, column, range: this.getRange(target) };
	};

	onKeyDown (e: any) {
		const { block } = this.props;
		const { columnCount, rows } = block.content;
		const { row, column, range } = this.focusObj;
		const target = this.getTarget(row, column);
		const value = this.getValue(target);

		const isFirstCol = column == 0;
		const isLastCol = column == columnCount - 1;

		let r = row;
		let c = column;
		let left = () => {
			if (!isFirstCol) {
				c--;
			} else {
				r--;
				c = columnCount - 1;
			};

			const l = this.getLength(r, c);
			this.focusSet(r, c, { from: l, to: l });
		};

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
			left();
		});

		keyboard.shortcut('enter', e, (pressed: string) => {
			e.preventDefault();
			
			this.saveValue(row, column, value);
			this.rowAdd(row, 1);
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
		console.log('[columnAdd]', index, dir);

		const { rootId, block } = this.props;
		const { rows } = block.content;
		const idx = index + (dir > 0 ? 1 : 0);

		for (let row of rows) {
			const cell = Util.objectCopy(row.cells[index]);
			row.cells.splice(idx, 0, { ...cell, value: '', width: 50 });
		};

		blockStore.update(rootId, { 
			...block, 
			content: { 
				columnCount: block.content.columnCount++, 
				rows: rows,
			},
		});

		console.log({ 
			...block, 
			content: { 
				columnCount: block.content.columnCount++, 
				rows: rows,
			},
		});

		this.saveContent();
	};

	columnRemove (index: number) {
		const { block } = this.props;
		const { rows } = block.content;

		for (let row of rows) {
			row.cells.splice(index, 1);
		};

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

		console.log('saveValue', row, column, value);

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

		const subIds = [ 'select2', 'blockColor', 'blockBackground' ];
		const color = this.getProperty(key, row, column, 'color');
		const background = this.getProperty(key, row, column, 'background');
		const ah = this.getProperty(key, row, column, 'horizontal');
		const av = this.getProperty(key, row, column, 'vertical');

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
			{ id: 'columnRemove', name: 'Remove column' },
		];
		let optionsRow = [
			{ id: 'rowBefore', name: 'Row before' },
			{ id: 'rowAfter', name: 'Row after' },
			{ id: 'rowRemove', name: 'Remove row' },
		];
		let optionsColor = [
			{ id: 'color', icon: 'color', name: 'Color', inner: innerColor, arrow: true },
			{ id: 'background', icon: 'color', name: 'Background', inner: innerBackground, arrow: true },
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
			element: $(e.currentTarget),
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
							value: this.getProperty(key, row, column, item.id),
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

	getProperty (key: Key, row: number, column: number, k: string): any {
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

});

export default BlockTable;