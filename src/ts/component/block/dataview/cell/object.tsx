import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { DragBox } from 'ts/component';
import { I, Relation, DataUtil, translate, Util, keyboard, analytics } from 'ts/lib';
import { menuStore, detailStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';
import { getRange, setRange } from 'selection-ranges';
import arrayMove from 'array-move';

import ItemObject from './item/object';

interface Props extends I.Cell {};
interface State { 
	isEditing: boolean; 
};

const $ = require('jquery');

const MAX_LENGTH = 32;

const CellObject = observer(class CellObject extends React.Component<Props, State> {

	_isMounted: boolean = false;
	state = {
		isEditing: false,
	};
	timeoutFilter: number = 0;

	constructor (props: any) {
		super(props);
	
		this.onClick = this.onClick.bind(this);
		this.onKeyPress = this.onKeyPress.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onDragEnd = this.onDragEnd.bind(this);
	};

	render () {
		const { isEditing } = this.state;
		const { rootId, subId, getRecord, index, relation, iconSize, elementMapper, arrayLimit } = this.props;
		const record = getRecord(index);
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
				<div id="value" onClick={this.onFocus}>
					<div id="placeholder" className="placeholder">{placeholder}</div>

					<span id="list">
						<DragBox onDragEnd={this.onDragEnd} onClick={this.onClick}>
							{value.map((item: any, i: number) => (
								<span 
									key={i}
									id={`item-${item.id}`}
									data-id={item.id}
									data-index={i}
									className="itemWrap isDraggable"
									draggable={true}
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
					<span className="over">
						{value.map((item: any, i: number) => (
							<ItemObject 
								key={item.id} 
								object={item} 
								iconSize={iconSize} 
								relation={relation} 
								elementMapper={elementMapper} 
							/>
						))}
						{arrayLimit && (length > arrayLimit) ? <div className="more">+{length - arrayLimit}</div> : ''}
					</span>
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
				window.setTimeout(() => { this.onFocus(); }, 15);
			};
		};
	};

	onClick (e: any, id: string) {
		const { canEdit, canOpen } = this.props;
		const item = this.getItems().find(item => item.id == id);

		if (canOpen && item) {
			e.stopPropagation();
			DataUtil.objectOpenPopup(item);
		};
	};

	placeholderCheck () {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
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
		const { relation, getRecord, index, subId } = this.props;
		const record = getRecord(index);

		if (!relation || !record) {
			return [];
		};

		let value = Relation.getArrayValue(record[relation.relationKey]);
		value = value.map(id => detailStore.get(subId, id, []));
		value = value.filter((it: any) => { return !it._empty_; });
		return value;
	};

	getItemIds (): string[] {
		return this.getItems().map(it => it.id);
	};

	getValue () {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
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

		DataUtil.pageCreate('', '', details, I.BlockPosition.Bottom, '', {}, flags, (message: any) => {
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

	clear () {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		node.find('#entry').text(' ');

		menuStore.updateData('dataviewObjectList', { filter: '' });
		this.onFocus();
	};

	blur () {
			if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
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