import * as React from 'react';
import { observer } from 'mobx-react';
import $ from 'jquery';
import { getRange, setRange } from 'selection-ranges';
import arrayMove from 'array-move';
import { Tag, Icon, DragBox } from 'Component';
import { I, Relation, translate, keyboard, Util } from 'Lib';
import { menuStore } from 'Store';

interface State { 
	isEditing: boolean; 
};

const MAX_LENGTH = 320;

const CellSelect = observer(class CellSelect extends React.Component<I.Cell, State> {

	_isMounted = false;
	node: any = null;
	state = {
		isEditing: false,
	};

	constructor (props: I.Cell) {
		super(props);

		this.onClear = this.onClear.bind(this);
		this.onKeyPress = this.onKeyPress.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onInput = this.onInput.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onDragEnd = this.onDragEnd.bind(this);
		this.focus = this.focus.bind(this);
	};

	render () {
		const { relation, getRecord, index, elementMapper, arrayLimit } = this.props;
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
		let content = null;

		if (elementMapper) {
			value = value.map((it: any) => { return elementMapper(relation, it); });
		};

		if (arrayLimit) {
			value = value.slice(0, arrayLimit);
			if (length > arrayLimit) {
				cn.push('overLimit');
			};
		};

		if (isEditing) {
			content = (
				<div id="value" onClick={this.focus}>
					<div id="placeholder" className="placeholder">{placeholder}</div>

					<span id="list">
						<DragBox onDragEnd={this.onDragEnd}>
							{value.map((item: any, i: number) => (
								<span 
									key={i}
									id={`item-${item.id}`}
									className="itemWrap isDraggable"
									draggable={true}
									{...Util.dataProps({ id: item.id, index: i })}
								>
									<Tag 
										key={item.id}
										text={item.name}
										color={item.color}
										canEdit={true} 
										className={Relation.selectClassName(relation.format)}
										onRemove={(e: any) => { this.onValueRemove(item.id); }}
									/>
								</span>
							))}
						</DragBox>
					</span>
					
					<span 
						id="entry" 
						contentEditable={true}
						suppressContentEditableWarning={true} 
						onFocus={this.onFocus}
						onBlur={this.onBlur}
						onInput={this.onInput}
						onKeyPress={this.onKeyPress}
						onKeyDown={this.onKeyDown}
						onKeyUp={this.onKeyUp}
					>
						{'\n'}
					</span>

					{canClear ? <Icon className="clear" onMouseDown={this.onClear} /> : ''}
				</div>
			);
		} else {
			if (!value.length) {
				content = <div className="empty">{placeholder}</div>;
			} else {
				content = (
					<span className="over">
						{value.map((item: any, i: number) => (
							<Tag 
								key={item.id} 
								text={item.name} 
								color={item.color}
								className={Relation.selectClassName(relation.format)} 
							/>
						))}
						{arrayLimit && (length > arrayLimit) ? <div className="more">+{length - arrayLimit}</div> : ''}
					</span>
				);
			};
		};

		return (
			<div 
				ref={node => this.node = node} 
				className={cn.join(' ')}
			>
				{content}
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
	};

	componentDidUpdate () {
		const { isEditing } = this.state;
		const { id } = this.props;
		const cell = $(`#${id}`);

		if (isEditing) {
			cell.addClass('isEditing');
			
			this.placeholderCheck();
			this.resize();
		} else {
			cell.removeClass('isEditing');
		};
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	setEditing (v: boolean) {
		const { canEdit } = this.props;
		const { isEditing } = this.state;

		if (canEdit && (v != isEditing)) {
			this.setState({ isEditing: v });
			
			if (v) {
				window.setTimeout(() => { this.focus(); }, 15);
			};
		};
	}; 

	onKeyPress (e: any) {
		if (!this._isMounted) {
			return;
		};

		const node = $(this.node);
		const entry = node.find('#entry');

		if (entry.length && (entry.text().length >= MAX_LENGTH)) {
			e.preventDefault();
		};
	};

	onKeyDown (e: any) {
		if (!this._isMounted) {
			return;
		};

		const node = $(this.node);
		const entry = node.find('#entry');

		keyboard.shortcut('backspace', e, (pressed: string) => {
			e.stopPropagation();

			const range = getRange(entry.get(0));
			if (range.start || range.end) {
				return;
			};

			e.preventDefault();
			
			const value = this.getValue();
			value.existing.pop();
			this.setValue(value.existing);
		});

		this.placeholderCheck();
		this.resize();
		this.scrollToBottom();
	};

	onKeyUp (e: any) {
		menuStore.updateData('dataviewOptionList', { filter: this.getValue().new });

		this.placeholderCheck();
		this.resize();
		this.scrollToBottom();
	};

	onInput () {
		this.placeholderCheck();
	};

	placeholderCheck () {
		if (!this._isMounted) {
			return;
		};

		const node = $(this.node);
		const value = this.getValue();
		const list = node.find('#list');
		const placeholder = node.find('#placeholder');

		if (value.existing.length) {
			list.show();
		} else {
			list.hide();
		};

		if (value.new || value.existing.length) {
			placeholder.hide();
		} else {
			placeholder.show();
		};
	};

	clear () {
		if (!this._isMounted) {
			return;
		};

		const node = $(this.node);
		node.find('#entry').text(' ');

		this.focus();
	};

	onValueRemove (id: string) {
		this.setValue(this.getItemIds().filter(it => it != id));
	};

	onDragEnd (oldIndex: number, newIndex: number) {
		this.setValue(arrayMove(this.getItemIds(), oldIndex, newIndex));
	};

	onFocus () {
		keyboard.setFocus(true);
	};

	onBlur () {
		keyboard.setFocus(false);
	};

	focus () {
		if (!this._isMounted) {
			return;
		};

		const node = $(this.node);
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

	getItems (): any[] {
		const { relation, getRecord, index } = this.props;
		const record = getRecord(index);

		return record && relation ? Relation.getOptions(record[relation.relationKey]) : [];
	};

	getItemIds (): string[] {
		return this.getItems().map(it => it.id);
	};

	getValue () {
		if (!this._isMounted) {
			return;
		};

		const node = $(this.node);
		const list = node.find('#list');
		const items = list.find('.itemWrap');
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
				this.clear();

				menuStore.updateData('dataviewOptionList', { value });
			});
		};
	};

	resize () {
		const win = $(window);
		win.trigger('resize.menuDataviewOptionList');
	};

});

export default CellSelect;