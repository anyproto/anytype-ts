import * as React from 'react';
import $ from 'jquery';
import arrayMove from 'array-move';
import { observer } from 'mobx-react';
import { getRange, setRange } from 'selection-ranges';
import { Tag, Icon, DragBox } from 'Component';
import { I, S, U, Relation, translate, keyboard } from 'Lib';

interface State { 
	isEditing: boolean; 
};

const MAX_LENGTH = 320;

const CellSelect = observer(class CellSelect extends React.Component<I.Cell, State> {

	_isMounted = false;
	node = null;
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
		const { relation, recordId, getRecord, elementMapper, arrayLimit, canEdit, placeholder } = this.props;
		const { isEditing } = this.state;
		const record = getRecord(recordId);
		const isSelect = relation.format == I.RelationType.Select;
		const cn = [ 'wrap' ];

		if (!relation || !record) {
			return null;
		};

		let value = this.getItems();
		let content = null;

		const length = value.length;

		if (elementMapper) {
			value = value.map(it => elementMapper(relation, it));
		};

		if (arrayLimit) {
			value = value.slice(0, arrayLimit);
			if (length > arrayLimit) {
				cn.push('overLimit');
			};
		};

		if (isEditing) {
			const cni = [ 'itemWrap' ];

			if (!isSelect) {
				cni.push('isDraggable');
			};

			content = (
				<div id="value" onClick={this.focus}>
					<div id="placeholder" className="placeholder">{placeholder}</div>

					<span id="list">
						<DragBox onDragEnd={this.onDragEnd}>
							{value.map((item: any, i: number) => (
								<span 
									key={i}
									id={`item-${item.id}`}
									className={cni.join(' ')}
									draggable={canEdit && !isSelect}
									onContextMenu={e => this.onContextMenu(e, item)}
									{...U.Common.dataProps({ id: item.id, index: i })}
								>
									<Tag 
										key={item.id}
										text={item.name}
										color={item.color}
										canEdit={canEdit && !isSelect} 
										className={Relation.selectClassName(relation.format)}
										onClick={e => this.onClick(e, item.id)}
										onRemove={() => this.onValueRemove(item.id)}
									/>
								</span>
							))}
						</DragBox>
					</span>
					
					{canEdit ? (
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
							onCompositionStart={() => keyboard.setComposition(true)}
							onCompositionEnd={() => keyboard.setComposition(false)}
							onClick={e => e.stopPropagation()}
						>
							{'\n'}
						</span>
					) : ''}

					{isSelect ? <Icon className="clear" onMouseDown={this.onClear} /> : ''}
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
								id={`item-${item.id}`}
								key={item.id} 
								text={item.name} 
								color={item.color}
								className={Relation.selectClassName(relation.format)}
								onClick={e => this.onClick(e, item.id)}
								onContextMenu={e => this.onContextMenu(e, item)}
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
			this.focus();
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
				window.setTimeout(() => this.focus(), 15);
			};
		};
	}; 

	onKeyPress (e: any) {
		if (!this._isMounted || keyboard.isComposition) {
			return;
		};

		const node = $(this.node);
		const entry = node.find('#entry');

		if (entry.length && (entry.text().length >= MAX_LENGTH)) {
			e.preventDefault();
		};
	};

	onKeyDown (e: any) {
		if (!this._isMounted || keyboard.isComposition) {
			return;
		};

		const node = $(this.node);
		const entry = node.find('#entry');

		keyboard.shortcut('backspace', e, () => {
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
		if (!this._isMounted || keyboard.isComposition) {
			return;
		};

		S.Menu.updateData('dataviewOptionList', { filter: this.getValue().new });

		this.placeholderCheck();
		this.resize();
		this.scrollToBottom();
	};

	onInput () {
		this.placeholderCheck();
	};

	onClick (e: any, id: string) {
	};

	placeholderCheck () {
		if (!this._isMounted) {
			return;
		};

		const node = $(this.node);
		const value = this.getValue();
		const list = node.find('#list');
		const placeholder = node.find('#placeholder');

		value.existing.length ? list.show() : list.hide();
		value.new || value.existing.length ? placeholder.hide() : placeholder.show();
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

		if (content.length) {
			content.scrollTop(content.get(0).scrollHeight + parseInt(content.css('paddingBottom')));
		};
	};

	onClear (e: any) {
		e.preventDefault();
		e.stopPropagation();

		this.setValue([]);
	};

	onContextMenu (e: React.MouseEvent, item: any) {
		const { id, canEdit, menuClassName, menuClassNameWrap } = this.props;

		if (!canEdit) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		S.Menu.open('dataviewOptionEdit', { 
			element: `#${id} #item-${item.id}`,
			className: menuClassName,
			classNameWrap: menuClassNameWrap,
			offsetY: 4,
			data: {
				option: item,
			}
		});
	};

	getItems (): any[] {
		const { relation, recordId, getRecord } = this.props;
		const record = getRecord(recordId);

		return relation && record ? Relation.getOptions(record[relation.relationKey]).filter(it => !it.isArchived && !it.isDeleted) : [];
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
		
		value = U.Common.arrayUnique(value);

		const length = value.length;
		if (maxCount && (length > maxCount)) {
			value = value.slice(length - maxCount, length);
		};

		if (onChange) {
			onChange(value, () => {
				this.clear();

				S.Menu.updateData('dataviewOptionList', { value });
			});
		};
	};

	resize () {
		$(window).trigger('resize.menuDataviewOptionList');
	};

});

export default CellSelect;