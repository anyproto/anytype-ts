import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { I, C, keyboard } from 'ts/lib';
import { observer } from 'mobx-react';
import { Icon } from 'ts/component';
import { getRange, setRange } from 'selection-ranges';
import { menuStore } from '../../store';

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
		const { columns, rows } = block.content;
		const cn = [ 'wrap', 'focusable', 'c' + block.id ];
		const cl = columns.length;
		const cr = rows.length;

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

		const Head = () => (
			<thead>
				<tr>
					<th className="first">&nbsp;</th>
					{columns.map((item: any, i: number) => {
						const css: any = {};
						const cn = [ 'align-v' + item.vertical, 'align-h' + item.horizontal ];

						if (item.width) {
							css.width = item.width;
						};

						console.log(item);

						return (
							<th 
								id={'column-' + i} 
								key={i} 
								style={css} 
								className={cn.join(' ')}
								onContextMenu={(e: any) => { this.onOptions(e, Key.Column, 0, i); }}
							>
								<Editor 
									id={[ 'value', 0, i ].join('-')} 
									value={item.value} 
								/>
								<div className="resize" onMouseDown={(e: any) => { this.onResizeStart(e, i); }} />
							</th>
						);
					})}
				</tr>
			</thead>
		);

		const Row = (row: any) => (
			<tr>
				<td 
					onContextMenu={(e: any) => { this.onOptions(e, Key.Row, row.index, 0); }}
				>
					&nbsp;
				</td>
				{columns.map((column: any, i: number) => {
					const cell = row.data[i] || {};
					const ah = cell.horizontal || column.horizontal || row.horizontal;
					const av = cell.vertical || column.vertical || row.vertical;
					const cn = [ 'align-v' + av, 'align-h' + ah ];

					return (
						<td 
							key={i} 
							className={cn.join(' ')}
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
					<Head />
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
		window.setTimeout(() => {
			this.focusApply();
		});
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};

	getKey (row: number) {
		return row <= 0 ? Key.Column : Key.Row;
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
		const { columns, rows } = block.content;
		const key = this.getKey(row);

		let l = 0;
		if (key == Key.Column) {
			l = columns[column]?.value.length;
		} else {
			l = rows[row - 1]?.data[column].value.length;
		};
		return Number(l) || 0;
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
		const { columns } = block.content;

		column = Math.max(0, Math.min(columns.length - 1, column));
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
		const { columns, rows } = block.content;
		const { row, column, range } = this.focusObj;
		const target = this.getTarget(row, column);
		const value = this.getValue(target);

		const isFirstCol = column == 0;
		const isLastCol = column == columns.length - 1;

		let r = row;
		let c = column;
		let left = () => {
			if (!isFirstCol) {
				c--;
			} else {
				r--;
				c = columns.length - 1;
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
			this.rowAdd(row);
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

	columnAdd (index: number) {
		const { block } = this.props;
		const { columns, rows } = block.content;

		columns.splice(index + 1, 0, { value: '', width: 50 });
		
		for (let row of rows) {
			row.data.splice(index + 1, 0, { value: '' });
		};

		this.saveContent();
	};

	columnRemove (index: number) {
		const { block } = this.props;
		const { columns, rows } = block.content;

		columns.splice(index, 1);

		for (let row of rows) {
			row.data.splice(index, 1);
		};

		this.saveContent();
	};

	rowAdd (index: number) {
		const { block } = this.props;
		const { rows } = block.content;
		const { column } = this.focusObj;
		const row: I.TableRow = this.fillRow({ 
			data: [] as I.TableCell[],
			horizontal: I.TableAlign.Left,
			vertical: I.TableAlign.Top,
		});

		rows.splice(index + 1, 0, row);

		this.focusSet(index + 1, column, { from: 0, to: 0 });
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
		const { content } = block;
		const { columns } = content;

		columns.forEach((col: any, i: number) => {
			row.data[i] = row.data[i] || { 
				value: '',  
				horizontal: I.TableAlign.Left,
				vertical: I.TableAlign.Top,
			};
		});

		return row;
	};

	saveValue (row: number, column: number, value: string) {
		const { rootId, block } = this.props;
		const { content } = block;
		const key = this.getKey(row);

		console.log('saveValue', row, column, value);

		if (key == Key.Column) {
			content[key][column].value = value;
		} else 
		if (key == Key.Row) {
			row--;
			content[key][row] = this.fillRow(content[key][row] || { data: [] });
			content[key][row].data[column].value = value;
		};

		C.BlockUpdateContent({ ...block, content }, rootId, block.id);
	};

	saveContent () {
		const { rootId, block } = this.props;

		C.BlockUpdateContent({ ...block }, rootId, block.id, () => {
			this.forceUpdate();
		});
	};

	getValue (obj: any): string {
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
		const { columns } = block.content;
		const node = $(ReactDOM.findDOMNode(this));
		const w = node.width();
		const el = node.find(`#column-${index}`);
		const offset = el.offset();

		let width = e.pageX - offset.left;
		width = Math.max(20, Math.min(500, width)); 

		columns[index].width = width;
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
		const { columns, rows } = block.content;

		let menuContext: any = null;
		let options: any[] = [
			{ id: 'horizontal', name: 'Horizontal align', arrow: true },
			{ id: 'vertical', name: 'Vertical align', arrow: true },
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
		let optionsVertical = [
			{ id: I.TableAlign.Left, name: 'Left' },
			{ id: I.TableAlign.Center, name: 'Center' },
			{ id: I.TableAlign.Right, name: 'Right' },
		];
		let optionsHorizontal = [
			{ id: I.TableAlign.Top, name: 'Top' },
			{ id: I.TableAlign.Center, name: 'Center' },
			{ id: I.TableAlign.Bottom, name: 'Bottom' },
		];

		switch (key) {
			case Key.Column:
				options = optionsColumn.concat(options);
				break;

			case Key.Row:
				options = optionsRow.concat(options);
				break;

			case Key.Cell:
				options = optionsColumn.concat(options);
				options = optionsRow.concat(options);
				break;
		};

		const setAlign = (k: string, v: I.TableAlign) => {
			switch (key) {
				case Key.Column:
					columns[column][k] = v;
					break;

				case Key.Row:
					rows[row][k] = v;
					break;

				case Key.Cell:
					rows[row].data[column][k] = v;
					break;
			};

			console.log(columns);
			console.log(rows);

			this.saveContent();
		};

		menuStore.open('select1', {
			component: 'select',
			element: $(e.currentTarget),
			onOpen: (context: any) => {
				menuContext = context;
			},
			data: {
				options: options,
				onOver: (e: any, item: any) => {
					if (!item.arrow) {
						menuStore.close('select2');
						return;
					};

					let options: any[] = [];

					switch (item.id) {
						case 'horizontal':
							options = options.concat(optionsVertical);
							break;

						case 'vertical':
							options = options.concat(optionsHorizontal);
							break;
					};

					menuStore.open('select2', {
						component: 'select',
						element: `#${menuContext.getId()} #item-${item.id}`,
						offsetX: menuContext.getSize().width,
						vertical: I.MenuDirection.Center,
						isSub: true,
						data: {
							options: options,
							onSelect: (e: any, el: any) => {
								setAlign(item.id, el.id);
								menuContext.close();
							}
						},
					});
				},
				onSelect: (e: any, item: any) => {
					if (item.arrow) {
						return;
					};

					switch (item.id) {
						case 'columnBefore':
							this.columnAdd(column - 1);
							break;

						case 'columnAfter':
							this.columnAdd(column);
							break;

						case 'columnRemove':
							this.columnRemove(column);
							break;

						case 'rowBefore':
							this.rowAdd(row - 1);
							break;

						case 'rowAfter':
							this.rowAdd(row);
							break;

						case 'rowRemove':
							this.rowRemove(row);
							break;
					};
				}
			},
		});

		console.log('[onOptions]', key, row, column);

	};

});

export default BlockTable;