import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Tag, Icon, DragBox } from 'ts/component';
import { I, Relation, DataUtil, translate, keyboard, Util } from 'ts/lib';
import { observer } from 'mobx-react';
import { menuStore } from 'ts/store';
import { getRange, setRange } from 'selection-ranges';
import arrayMove from 'array-move';

interface Props extends I.Cell {
	optionCommand?: (code: string, rootId: string, blockId: string, relationKey: string, recordId: string, option: any, callBack?: (message: any) => void) => void;
};
interface State { 
	isEditing: boolean; 
};

const $ = require('jquery');

const MAX_LENGTH = 32;

const CellSelect = observer(class CellSelect extends React.Component<Props, State> {

	_isMounted: boolean = false;
	state = {
		isEditing: false,
	};

	constructor (props: any) {
		super(props);

		this.onClear = this.onClear.bind(this);
		this.onKeyPress = this.onKeyPress.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onDragEnd = this.onDragEnd.bind(this);
	};

	render () {
		const { id, rootId, block, relation, getRecord, index, elementMapper, arrayLimit } = this.props;
		const { isEditing } = this.state;
		const record = getRecord(index);
		const canClear = relation.format == I.RelationType.Status;
		const cn = [ 'wrap' ];

		if (!relation || !record) {
			return null;
		};

		let placeholder = this.props.placeholder || translate(`placeholderCell${relation.format}`);
		let value = this.getItems();
		let length = value.length;

		if (elementMapper) {
			value = value.map((it: any) => { return elementMapper(relation, it); });
		};

		if (arrayLimit) {
			value = value.slice(0, arrayLimit);
		};

		let content = null;
		if (isEditing && (relation.format == I.RelationType.Tag)) {
			content = (
				<div id="value" onClick={this.onFocus}>
					<div id="placeholder" className="placeholder">{placeholder}</div>

					<span id="list">
						<DragBox onDragEnd={this.onDragEnd}>
							{value.map((item: any, i: number) => (
								<span 
									key={i}
									id={`item-${item.id}`}
									data-id={item.id}
									data-index={i}
									className="tagWrap isDraggable"
									draggable={true}
								>
									<Tag 
										key={item.id}
										{...item} 
										canEdit={true} 
										className={DataUtil.tagClass(relation.format)}
										onRemove={(e: any, id: string) => { this.onValueRemove(id); }}
									/>
								</span>
							))}
						</DragBox>
					</span>
					
					<span 
						id="entry" 
						contentEditable={true}
						suppressContentEditableWarning={true} 
						onKeyPress={this.onKeyPress}
						onKeyDown={this.onKeyDown}
						onKeyUp={this.onKeyUp}
					>
						{' '}
					</span>
				</div>
			);
		} else {
			if (!value.length) {
				content = <div className="empty">{placeholder}</div>;
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

		this.placeholderCheck();
	};

	componentDidUpdate () {
		const { isEditing } = this.state;
		const { id } = this.props;
		const cell = $(`#${id}`);
		const win = $(window);

		if (isEditing) {
			cell.addClass('isEditing');
			
			this.placeholderCheck();

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
			
			if (v) {
				window.setTimeout(() => { this.onFocus(); }, 15);
			};
		};
	}; 

	onKeyPress (e: any) {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const entry = node.find('#entry');

		if (entry.length && (entry.text().length >= MAX_LENGTH)) {
			e.preventDefault();
		};
	};

	onKeyDown (e: any) {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const entry = node.find('#entry');
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

			this.clear();
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
		const value = this.getValue();

		win.trigger('resize.menuDataviewOptionValues');
		win.trigger('resize.menuDataviewOptionList');

		menuStore.updateData('dataviewOptionValues', { filter: value.new });

		this.placeholderCheck();
		this.scrollToBottom();
	};

	placeholderCheck () {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const value = this.getValue();
		const placeholder = node.find('#placeholder');

		if (value.new.length || value.existing.length) {
			placeholder.hide();
		} else {
			placeholder.show();
		};
	};

	clear () {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		node.find('#entry').text(' ');

		menuStore.updateData('dataviewOptionValues', { filter: '' });
		this.onFocus();
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
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const entry = node.find('#entry');
		
		if (entry.length) {
			window.setTimeout(() => {
				entry.focus();
				setRange(entry.get(0), { start: 0, end: 0 });

				this.scrollToBottom();
			});
		};
	};

	scrollToBottom () {
		const { id } = this.props;
		const cell = $(`#${id}`);
		const content = cell.hasClass('.cellContent') ? cell : cell.find('.cellContent');

		content.scrollTop(content.get(0).scrollHeight + parseInt(content.css('paddingBottom')));
	};

	onClear (e: any) {
		e.preventDefault();
		e.stopPropagation();

		this.setValue([]);
	};

	onDragEnd (oldIndex: number, newIndex: number) {
		let value = this.getItems().map((it: any) => { return it.id });
		value = arrayMove(value, oldIndex, newIndex);
		this.setValue(value);
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
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const list = node.find('#list');
		const items = list.find('.tagWrap');
		const entry = node.find('#entry');
		const existing = [];

		items.each((i: number, item: any) => {
			item = $(item);
			existing.push(item.data('id'));
		});

		return {
			existing,
			new: (entry.length ? String(entry.text() || '').trim() : ''),
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