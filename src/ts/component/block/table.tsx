import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { I, C, keyboard } from 'ts/lib';
import { observer } from 'mobx-react';
import { Icon } from 'ts/component';
import { getRange, setRange } from 'selection-ranges';

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
					{columns.map((item: any, i: number) => (
						<th key={i} style={{ width: (1 / cl) * 100 + '%' }}>
							<Editor 
								id={[ 'value', 0, i ].join('-')} 
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
							id={[ 'value', item.index + 1, i ].join('-')} 
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

		keyboard.shortcut('arrowleft', e, (pressed: string) => {
			if (range.to) {
				return;
			};

			e.preventDefault();
			left();
		});

		keyboard.shortcut('backspace', e, (pressed: string) => {
			if (range.to) {
				return;
			};

			e.preventDefault();

			if ((row > 0) && (column == 0) && !value) {
				this.rowRemove(row - 1);
			} else {
				left();
			};
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
		const { column } = this.focusObj;
		const row: I.TableRow = this.fillRow({ data: [] });

		rows.splice(index + 1, 0, row);

		this.focusSet(index + 1, column, { from: 0, to: 0 });
		this.saveContent();
	};

	rowRemove (index: number) {
		const { block } = this.props;
		const { columns, rows } = block.content;
		const pr = index;
		const pc = columns.length - 1;
		const l = this.getLength(pr, pc);

		rows.splice(index, 1);

		this.focusSet(pr, pc, { from: l, to: l });
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