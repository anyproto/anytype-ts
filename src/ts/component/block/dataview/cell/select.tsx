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
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
	};

	render () {
		const { id, rootId, block, relation, getRecord, index, placeholder, elementMapper, arrayLimit } = this.props;
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
				<div id="value" onClick={this.onFocus}>
					<span id="list">
						{value.map((item: any, i: number) => (
							<Tag 
								key={item.id}
								{...item} 
								canEdit={true} 
								className={DataUtil.tagClass(relation.format)}
								onRemove={(e: any, id: string) => { this.onValueRemove(id); }}
							/>
						))}
					</span>
					
					<span 
						id="entry" 
						contentEditable={true}
						suppressContentEditableWarning={true} 
						onKeyDown={this.onKeyDown}
						onKeyUp={this.onKeyUp}
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
		const win = $(window);

		if (isEditing) {
			cell.addClass('isEditing');
			
			this.onFocus();
			win.trigger('resize.menuDataviewOptionValues');
			win.trigger('resize.menuDataviewOptionList');
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
		const range = getRange(entry.get(0));

		keyboard.shortcut('enter', e, (pressed: string) => {
			e.preventDefault();
			e.stopPropagation();

			const value = this.getValue();
			if (value.new) {
				this.onOptionAdd(value.new);
			} else {
				this.setValue(value.existing);
			};

			entry.text(' ');
		});	
		
		if (!range.start && !range.end) {
			keyboard.shortcut('backspace', e, (pressed: string) => {
				e.preventDefault();
				e.stopPropagation();

				const value = this.getValue();
				value.existing.pop();
				this.setValue(value.existing);
			});
		};
	};

	onKeyUp (e: any) {
		const win = $(window);

		win.trigger('resize.menuDataviewOptionValues');
		win.trigger('resize.menuDataviewOptionList');
	};

	onValueAdd (id: string) {
		let value = this.getItems().map((it: any) => { return it.id });
		value.push(id);
		this.setValue(value);
	};

	onValueRemove (id: string) {
		let value = this.getItems().map((it: any) => { return it.id });
		value = value.filter((it: string) => { return it != id; });
		this.setValue(value);
	};

	onOptionAdd (text: string) {
		if (!text) {
			return;
		};

		const { rootId, block, relation, getRecord, index, optionCommand } = this.props;
		const record = getRecord(index);
		const colors = DataUtil.menuGetBgColors();
		const option = { text, color: colors[Util.rand(1, colors.length - 1)].value };
		const match = (relation.selectDict || []).find((it: any) => { return it.text == text; });

		if (match) {
			this.onValueAdd(match.id);
		} else {
			optionCommand('add', rootId, block.id, relation.relationKey, record.id, option, (message: any) => {
				if (!message.error.code) {
					this.onValueAdd(message.option.id);
				};
			});
		};
	};

	onFocus () {
		const { id } = this.props;
		const cell = $(`#${id}`);
		const entry = cell.find('#entry');
		
		setRange(entry.get(0), { start: 0, end: 0 });
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
		const list = cell.find('#list');
		const entry = cell.find('#entry');
		const ret = [];

		$(`<div>${list.html()}</div>`).find('.tagItem').each((i: number, item: any) => {
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