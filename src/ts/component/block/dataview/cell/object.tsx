import * as React from 'react';
import $ from 'jquery';
import arrayMove from 'array-move';
import { observer } from 'mobx-react';
import { getRange, setRange } from 'selection-ranges';
import { DragBox } from 'Component';
import { I, Relation, ObjectUtil, translate, Util, keyboard, analytics } from 'Lib';
import { menuStore, detailStore } from 'Store';
import ItemObject from './item/object';

interface State { 
	isEditing: boolean; 
};

const MAX_LENGTH = 320;

const CellObject = observer(class CellObject extends React.Component<I.Cell, State> {

	_isMounted = false;
	node: any = null;
	state = {
		isEditing: false,
	};
	timeoutFilter = 0;

	constructor (props: I.Cell) {
		super(props);
	
		this.onClick = this.onClick.bind(this);
		this.onKeyPress = this.onKeyPress.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onInput = this.onInput.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.focus = this.focus.bind(this);
		this.onDragEnd = this.onDragEnd.bind(this);
	};

	render () {
		const { isEditing } = this.state;
		const { getRecord, recordId, relation, iconSize, elementMapper, arrayLimit, readonly } = this.props;
		const record = getRecord(recordId);
		const cn = [ 'wrap' ];

		if (!relation || !record) {
			return null;
		};

		let placeholder = this.props.placeholder || translate(`placeholderCell${relation.format}`)
		let value = this.getItems();
		let length = value.length;

		if (arrayLimit) {
			value = value.slice(0, arrayLimit);
			if (length > arrayLimit) {
				cn.push('overLimit');
			};
		};

		let content = null;
		if (isEditing) {
			content = (
				<div id="value" onClick={this.focus}>
					<div id="placeholder" className="placeholder">{placeholder}</div>

					<span id="list">
						<DragBox onDragEnd={this.onDragEnd} onClick={this.onClick}>
							{value.map((item: any, i: number) => (
								<span 
									key={i}
									id={`item-${item.id}`}
									className="itemWrap isDraggable"
									draggable={true}
									{...Util.dataProps({ id: item.id, index: i })}
								>
									<ItemObject 
										key={item.id} 
										object={item} 
										iconSize={iconSize} 
										relation={relation} 
										elementMapper={elementMapper}
										canEdit={true}
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
						onFocus={this.onFocus}
						onBlur={this.onBlur}
						onInput={this.onInput}
						onKeyPress={this.onKeyPress}
						onKeyDown={this.onKeyDown}
						onKeyUp={this.onKeyUp}
					>
						{'\n'}
					</span>
				</div>
			);
		} else {
			if (!value.length) {
				content = <div className="empty">{placeholder}</div>;
			} else {
				content = (
					<span className="over">
						{value.map((item: any, i: number) => (
							<ItemObject 
								key={item.id} 
								object={item} 
								iconSize={iconSize} 
								relation={relation} 
								elementMapper={elementMapper} 
								canEdit={!readonly}
								onClick={e => this.onClick(e, item.id)}
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
		window.clearTimeout(this.timeoutFilter);
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

	onClick (e: any, id: string) {
		const { canOpen } = this.props;
		const item = this.getItems().find(item => item.id == id);

		if (canOpen && item) {
			e.stopPropagation();
			ObjectUtil.openPopup(item);
		};
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

	getItems (): any[] {
		const { relation, getRecord, recordId, subId } = this.props;
		const record = getRecord(recordId);

		if (!relation || !record) {
			return [];
		};

		let value: any[] = Relation.getArrayValue(record[relation.relationKey]);
		value = value.map(id => detailStore.get(subId, id, []));
		value = value.filter(it => !it._empty_);
		return value;
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

				menuStore.updateData('dataviewObjectValues', { value });
				menuStore.updateData('dataviewObjectList', { value });
			});
		};
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

		keyboard.shortcut('enter', e, (pressed: string) => {
			e.preventDefault();
			e.stopPropagation();

			const value = this.getValue();
			if (value.new) {
				this.onOptionAdd(value.new);
			};
		});
		
		keyboard.shortcut('backspace', e, (pressed: string) => {
			e.stopPropagation();

			const range = getRange(node.find('#entry').get(0));
			if (range.start || range.end) {
				return;
			};

			e.preventDefault();
			
			const value = this.getValue();
			value.existing.pop();
			this.setValue(value.existing);
		});
	};

	onKeyUp (e: any) {
		window.clearTimeout(this.timeoutFilter);
		this.timeoutFilter = window.setTimeout(() => {
			menuStore.updateData('dataviewObjectList', { filter: this.getValue().new });
		}, 500);

		this.placeholderCheck();
		this.resize();
		this.scrollToBottom();
	};

	onInput () {
		this.placeholderCheck();
	};

	onValueAdd (id: string) {
		this.setValue(this.getItemIds().concat([ id ]));
	};

	onValueRemove (id: string) {
		this.setValue(this.getItemIds().filter(it => it != id));
	};

	onDragEnd (oldIndex: number, newIndex: number) {
		this.setValue(arrayMove(this.getItemIds(), oldIndex, newIndex));
	};

	onOptionAdd (text: string) {
		if (!text) {
			return;
		};

		const { relation } = this.props;
		const typeId = relation.objectTypes.length ? relation.objectTypes[0] : '';
		const details: any = { name: text };
		const flags: I.ObjectFlag[] = [];

		if (typeId) {
			details.type = typeId;
		} else {
			flags.push(I.ObjectFlag.SelectType);
		};

		ObjectUtil.create('', '', details, I.BlockPosition.Bottom, '', {}, flags, (message: any) => {
			if (!message.error.code) {
				this.onValueAdd(message.targetId);
			};

			analytics.event('CreateObject', {
				objectType: details.type,
				layout: details.layout,
				template: '',
			});
		});
	};

	onFocus () {
		keyboard.setFocus(true);
	};

	onBlur () {
		keyboard.setFocus(false);
	};

	clear () {
		if (!this._isMounted) {
			return;
		};

		const node = $(this.node);
		node.find('#entry').text(' ');

		menuStore.updateData('dataviewObjectList', { filter: '' });
		this.focus();
	};

	blur () {
		if (!this._isMounted) {
			return;
		};

		const node = $(this.node);
		node.find('#entry').blur();
	};

	scrollToBottom () {
		const { id } = this.props;
		const cell = $(`#${id}`);
		const content = cell.hasClass('.cellContent') ? cell : cell.find('.cellContent');

		content.scrollTop(content.get(0).scrollHeight + parseInt(content.css('paddingBottom')));
	};

	resize () {
		const win = $(window);
		win.trigger('resize.menuDataviewObjectList');
	};

});

export default CellObject;