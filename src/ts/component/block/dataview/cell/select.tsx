import * as React from 'react';
import { Tag, Icon } from 'ts/component';
import { I, Relation, DataUtil, translate, keyboard, Util } from 'ts/lib';
import { observer } from 'mobx-react';
import { menuStore } from 'ts/store';
import { getRange, setRange } from 'selection-ranges';

interface Props extends I.Cell {
	optionCommand?: (code: string, rootId: string, blockId: string, relationKey: string, recordId: string, option: any, callBack?: (message: any) => void) => void;
};
interface State { 
	isEditing: boolean; 
};

const $ = require('jquery');

const CellSelect = observer(class CellSelect extends React.Component<Props, State> {

	_isMounted: boolean = false;
	state = {
		isEditing: false,
	};

	constructor (props: any) {
		super(props);

		this.onClear = this.onClear.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
	};

	render () {
		const { rootId, block, relation, getRecord, index, placeholder, elementMapper, arrayLimit } = this.props;
		const { isEditing } = this.state;
		const record = getRecord(index);
		const canClear = relation.format == I.RelationType.Status;
		const cn = [ 'wrap' ];

		if (!relation || !record) {
			return null;
		};

		let value = this.getItems();
		let length = value.length;

		if (elementMapper) {
			value = value.map((it: any) => { return elementMapper(relation, it); });
		};

		if (arrayLimit) {
			value = value.slice(0, arrayLimit);
		};

		let content = null;
		if (isEditing) {
			content = (
				<div
					id="value"
					contentEditable={true}
					suppressContentEditableWarning={true}
					onKeyDown={this.onKeyDown}
					onDragStart={(e: any) => { e.preventDefault(); }}
				>
					{value.map((item: any, i: number) => (
						<Tag 
							{...item} 
							key={item.id} 
							canEdit={true} 
							className={DataUtil.tagClass(relation.format)} 
						/>
					))}
					
					<span 
						id="entry" 
						contentEditable={true}
						suppressContentEditableWarning={true} 
					>
						{' '}
					</span>
				</div>
			);
		} else {
			if (!value.length) {
				content = <div className="empty">{placeholder || translate(`placeholderCell${relation.format}`)}</div>;
			} else {
				content = (
					<React.Fragment>
						<span className="over">
							{value.map((item: any, i: number) => (
								<Tag {...item} key={item.id} className={DataUtil.tagClass(relation.format)} />
							))}
						</span>
						{arrayLimit && (length > arrayLimit) ? <div className="more">+{length - arrayLimit}</div> : ''}
						{canClear ? <Icon className="clear" onMouseDown={this.onClear} /> : ''}
					</React.Fragment>
				);
			};
		};

		return (
			<div className={cn.join(' ')}>
				{content}
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	componentDidUpdate () {
		const { isEditing } = this.state;
		const { id } = this.props;
		const cell = $(`#${id}`);

		if (isEditing) {
			cell.addClass('isEditing');

			const entry = cell.find('#entry');
			setRange(entry.get(0), { start: 0, end: 0 });
		} else {
			cell.removeClass('isEditing');
		};
	};

	setEditing (v: boolean) {
		const { canEdit } = this.props;
		const { isEditing } = this.state;

		if (canEdit && (v != isEditing)) {
			this.setState({ isEditing: v });
		};
	};

	onKeyDown (e: any) {
		const { id } = this.props;
		const cell = $(`#${id}`);
		const entry = cell.find('#entry');

		keyboard.shortcut('enter', e, (pressed: string) => {
			e.preventDefault();
			e.stopPropagation();

			const value = this.getValue();
			if (value.new) {
				this.onOptionAdd(value.new);
			} else {
				this.setValue(value.existing);
			};
		});
	};

	onValueAdd (id: string) {
		let value = this.getItems().map((it: any) => { return it.id });
		value.push(id);
		this.setValue(value);
	};

	onOptionAdd (text: string) {
		if (!text) {
			return;
		};

		const { id, rootId, block, relation, getRecord, index, optionCommand } = this.props;
		const record = getRecord(index);
		const items = this.getItems();
		const colors = DataUtil.menuGetBgColors();
		const option = { text, color: colors[Util.rand(1, colors.length - 1)].value };
		const match = items.some((it: any) => { return it.text == option.text; });
		const cell = $(`#${id}`);
		const entry = cell.find('#entry');

		if (match) {
			return;
		};

		optionCommand('add', rootId, block.id, relation.relationKey, record.id, option, (message: any) => {
			if (!message.error.code) {
				this.onValueAdd(message.option.id);
			};

			entry.text(' ');
		});
	};

	onClear (e: any) {
		e.preventDefault();
		e.stopPropagation();

		this.setValue([]);
	};

	getItems (): any[] {
		const { relation, getRecord, index } = this.props;
		const record = getRecord(index);

		if (!relation || !record) {
			return [];
		};

		let value = Relation.getArrayValue(record[relation.relationKey]);
		value = value.map((id: string) => { 
			return (relation.selectDict || []).find((it: any) => { return it.id == id; });
		});
		value = value.filter((it: any) => { return it && it.id; });
		return value;
	};

	getValue () {
		const { id } = this.props;
		const cell = $(`#${id}`);
		const value = cell.find('#value');
		const entry = cell.find('#entry');
		const html = $(`<div>${value.html()}</div>`);
		const ret = [];

		html.find('.tagItem').each((i: number, item: any) => {
			item = $(item);
			ret.push(item.data('id'));
		});

		return {
			existing: ret,
			new: String(entry.text() || '').trim(),
		};
	};

	setValue (value: string[]) {
		const { onChange, relation } = this.props;
		const { maxCount } = relation;
		
		value = Util.arrayUnique(value);

		if (maxCount && value.length > maxCount) {
			value = value.slice(value.length - maxCount, value.length);
		};

		if (onChange) {
			onChange(value, () => {
				menuStore.updateData('dataviewOptionValues', { value });
				menuStore.updateData('dataviewOptionList', { value });
			});
		};
	};

});

export default CellSelect;