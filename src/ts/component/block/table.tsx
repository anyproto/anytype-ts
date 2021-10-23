import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { I, C, keyboard } from 'ts/lib';
import { observer } from 'mobx-react';
import { Icon } from 'ts/component';
import { getRange, setRange } from 'selection-ranges';

interface Props extends I.BlockComponent, RouteComponentProps<any> {};

interface Focus {
	key: Key;
	row: number;
	column: number;
	range: I.TextRange;
};

const $ = require('jquery');

enum Key {
	None	 = '',
	Column	 = 'columns',
	Row		 = 'rows',
};

const BlockTable = observer(class BlockTable extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	timeout: number = 0;
	focusObj: Focus = { key: Key.None, row: 0, column: 0, range: { from: 0, to: 0 } };

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
					{columns.map((item: any, i: number) => (
						<th key={i} style={{ width: (1 / cl) * 100 + '%' }}>
							<Editor 
								id={[ Key.Column, 0, i ].join('-')} 
								value={item.value} 
							/>
							<Icon className="plus" onClick={() => { this.columnAdd(i); }} />
						</th>
					))}
				</tr>
			</thead>
		);

		const Row = (item: any) => (
			<tr>
				{columns.map((column: any, i: number) => (
					<td key={i}>
						<Editor 
							id={[ Key.Row, item.index, i ].join('-')} 
							value={item.data[i]?.value} 
						/>
					</td>
				))}
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
		this.focusApply();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};

	getTarget (key: Key, row: number, column: number) {
		const node = $(ReactDOM.findDOMNode(this));
		return node.find(`#${[ key, row, column ].join('-')}`);
	};

	getTargetIds (obj: any) {
		const ids = obj.attr('id').split('-');
		return { 
			key: ids[0], 
			row: Number(ids[1]) || 0, 
			column: Number(ids[2]) || 0,
		};
	};

	getLength (key: Key, row: number, column: number) {
		const { block } = this.props;
		const { columns, rows } = block.content;

		let l = 0;
		if (key == Key.Column) {
			l = columns[column]?.value.length;
		} else {
			l = rows[row]?.data[column].value.length;
		};
		return Number(l) || 0;
	};

	getMaxRow (key: Key) {
		const { block } = this.props;
		const { rows } = block.content;

		return key == Key.Column ? 0 : rows.length - 1;
	};

	focusApply () {
		const { key, row, column, range } = this.focusObj;
		const target = this.getTarget(key, row, column);

		this.setRange(target, range);
	};

	focusSet (key: Key, row: number, column: number, range: I.TextRange): void {
		const { block } = this.props;
		const { columns } = block.content;

		column = Math.max(0, Math.min(columns.length - 1, column));
		row = Math.max(0, Math.min(this.getMaxRow(key), row));

		this.focusObj = { key, row, column, range: range };
		this.focusApply();
	};

	onFocus () {
		keyboard.setFocus(true);
	};

	onBlur () {
		const { key, row, column } = this.focusObj;
		const target = this.getTarget(key, row, column);
		const value = this.getValue(target);

		window.clearTimeout(this.timeout);
		keyboard.setFocus(false);

		this.saveValue(key, row, column, value);
	};

	onSelect (e: any) {
		const target = $(e.currentTarget);
		const { key, row, column } = this.getTargetIds(target);

		this.focusObj = { key, row, column, range: this.getRange(target) };
	};

	onKeyDown (e: any) {
		const { block } = this.props;
		const { columns, rows } = block.content;
		const { key, row, column, range } = this.focusObj;
		const target = this.getTarget(key, row, column);
		const value = this.getValue(target);

		const isFirstCol = column == 0;
		const isLastCol = column == columns.length - 1;

		let k = key;
		let r = 0;
		let c = 0;
		let l = 0;

		keyboard.shortcut('arrowup, arrowdown', e, (pressed: string) => {
		});

		keyboard.shortcut('arrowright', e, (pressed: string) => {
			const length = this.getLength(key, row, column);
			if (range.from != length) {
				return;
			};

			if ((key == Key.Column) && isLastCol) {
				k = Key.Row;
			};

			if ((key == Key.Row) && isLastCol) {
				r = row + 1;
			};

			if ((key == Key.Row) && (row == this.getMaxRow(k)) && isLastCol) {
				return;
			};

			if (!isLastCol) {
				c = column + 1;
			};

			if (k != Key.None) {
				e.preventDefault();
				this.focusSet(k, r, c, { from: l, to: l });
			};
		});

		keyboard.shortcut('arrowleft', e, (pressed: string) => {
			if (range.to) {
				return;
			};

			if ((key == Key.Row) && isFirstCol) {
				if (row - 1 >= 0) {
					k = Key.Row;
					r = row - 1;
				} else {
					k = Key.Column;
					r = 0;
				};
				c = columns.length - 1;
			};

			if (!isFirstCol) {
				c = column - 1;
			};

			if ((key == Key.Column) && isFirstCol) {
				return;
			};

			l = this.getLength(k, r, c);

			if (k != Key.None) {
				e.preventDefault();
				this.focusSet(k, r, c, { from: l, to: l });
			};
		});

		if (key == Key.Row) {
			keyboard.shortcut('backspace', e, (pressed: string) => {
				if ((column == 0) && !range.to && !value) {
					e.preventDefault();
					
					this.rowRemove(row);
				};
			});

			keyboard.shortcut('enter', e, (pressed: string) => {
				e.preventDefault();

				this.saveValue(key, row, column, value);
				this.rowAdd(row);
			});
		};
	};

	onKeyUp (e: any) {
		const { key, row, column } = this.focusObj;
		const target = this.getTarget(key, row, column);
		const value = this.getValue(target);

		let ret = false;

		keyboard.shortcut('arrowup, arrowdown, arrowleft, arrowright, backspace, enter', e, (pressed: string) => {
			ret = true;
		});

		window.clearTimeout(this.timeout);
		if (!ret) {
			this.timeout = window.setTimeout(() => { this.saveValue(key, row, column, value); }, 500);
		};
	};

	columnAdd (index: number) {
		const { block } = this.props;
		const { columns } = block.content;

		columns.splice(index + 1, 0, { value: '' });
		this.saveContent();
	};

	columnRemove (index: number) {

		this.saveContent();
	};

	rowAdd (index: number) {
		const { block } = this.props;
		const { rows } = block.content;
		const row: I.TableRow = this.fillRow({ data: [] });

		this.focusSet(Key.Row, index + 1, 0, { from: 0, to: 0 });
		rows.splice(index + 1, 0, row);

		this.saveContent();
	};

	rowRemove (index: number) {
		const { block } = this.props;
		const { columns, rows } = block.content;
		const prev = rows[index - 1];

		if (prev) {
			const col = columns.length - 1;
			const length = this.getLength(Key.Row, index - 1, col);

			this.focusSet(Key.Row, index - 1, col, { from: length, to: length });
		};

		rows.splice(index, 1);
		this.saveContent();
	};

	fillRow (row: I.TableRow) {
		const { block } = this.props;
		const { content } = block;
		const { columns } = content;

		columns.forEach((col: any, i: number) => {
			row.data[i] = row.data[i] || { value: '' };
		});

		return row;
	};

	saveValue (key: string, row: number, column: number, value: string) {
		const { rootId, block } = this.props;
		const { content } = block;

		console.log('SAVE', key, column, row, value);

		if (key == Key.Column) {
			content[key][column].value = value;
		} else 
		if (key == Key.Row) {
			content[key][row] = this.fillRow(content[key][row] || { data: [] });
			content[key][row].data[column].value = value;
		};

		C.BlockUpdateContent({ ...block, content }, rootId, block.id);
	};

	saveContent () {
		const { rootId, block } = this.props;
		const { content } = block;

		C.BlockUpdateContent({ ...block }, rootId, block.id);
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
		setRange(obj.get(0) as Element, { start: range.from, end: range.to });
	};

});

export default BlockTable;