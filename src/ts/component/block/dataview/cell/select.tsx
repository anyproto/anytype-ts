import * as React from 'react';
import { Tag, Icon } from 'ts/component';
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

const CellSelect = observer(class CellSelect extends React.Component<Props, State> {

	_isMounted: boolean = false;
	state = {
		isEditing: false,
	};
	ox: number = 0;
	oy: number = 0;
	cache: any = {};
	insertIdx: number = 0;
	insertId: string = '';

	constructor (props: any) {
		super(props);

		this.onClear = this.onClear.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
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
						{value.map((item: any, i: number) => (
							<span 
								key={i}
								id={`item-${item.id}`}
								data-id={item.id}
								className="tagWrap"
								onDragStart={(e: any) => { this.onDragStart(e, item); }}
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
			
			this.onFocus();
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
		const value = this.getValue();

		win.trigger('resize.menuDataviewOptionValues');
		win.trigger('resize.menuDataviewOptionList');

		menuStore.updateData('dataviewOptionValues', { filter: value.new });

		this.placeholderCheck();
	};

	placeholderCheck () {
		const { id } = this.props;
		const cell = $(`#${id}`);
		const value = this.getValue();
		const placeholder = cell.find('#placeholder');

		if (value.new.length || value.existing.length) {
			placeholder.hide();
		} else {
			placeholder.show();
		};
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
		
		if (entry.length) {
			setRange(entry.get(0), { start: 0, end: 0 });
		};
	};

	onClear (e: any) {
		e.preventDefault();
		e.stopPropagation();

		this.setValue([]);
	};

	onDragStart (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		const { id } = this.props;
		const win = $(window);
		const cell = $(`#${id}`);
		const list = cell.find('#list');
		const items = list.find('.tagWrap');
		const element = list.find(`#item-${item.id}`);
		const clone = element.clone();
		const offset = list.offset();

		items.each((i: number, el: any) => {
			el = $(el);
			if (el.hasClass('isClone')) {
				return;
			};

			const p = el.position();

			this.cache[el.data('id')] = {
				x: p.left,
				y: p.top,
				width: el.width(),
				height: el.height(),
			};
		});

		this.ox = offset.left;
		this.oy = offset.top;

		list.append(clone);
		clone.addClass('isClone');
		element.addClass('isDragging');

		win.off('mousemove.dragTag mouseup.dragTag');
		win.on('mousemove.dragTag', (e: any) => { this.onDragMove(e, item); });
		win.on('mouseup.dragTag', (e: any) => { this.onDragEnd(e, item); });
	};

	onDragMove (e: any, item: any) {
		const { id } = this.props;
		const cell = $(`#${id}`);
		const list = cell.find('#list');
		const items = list.find('.tagWrap');
		const clone = list.find('.tagWrap.isClone');

		let width = clone.width();
		let height = clone.height();
		let x = e.pageX - this.ox - width / 2;
		let y = e.pageY - this.oy - height / 2;

		list.find('.tagWrap.isOver').removeClass('isOver');

		this.insertId = '';
		this.insertIdx = 0;

		for (let i = 0; i < items.length; ++i) {
			const el = $(items.get(i));
			const id = el.data('id');
			const rect = this.cache[id];

			if (!rect) {
				continue;
			};

			if (Util.rectsCollide({ x: x + width / 2, y, width: 2, height }, rect)) {
				this.insertId = item.id;

				let c = [ 'isOver' ];
				if (x + width / 2 <= rect.x + rect.width / 2) {
					c.push('left');
					this.insertIdx = i;
				} else {
					c.push('right');
					this.insertIdx = i + 1;
				};

				el.addClass(c.join(' '));
				break;
			};
		};

		clone.css({ transform: `translate3d(${x}px,${y}px,0px)` });
	};

	onDragEnd (e: any, item: any) {
		const { id } = this.props;
		const cell = $(`#${id}`);
		const list = cell.find('#list');

		if (this.insertId) {
			let value = this.getItems().map((it: any) => { return it.id });
			let oldIndex = value.findIndex(it => it == this.insertId);

			value = arrayMove(value, oldIndex, this.insertIdx);
			this.setValue(value);
		};

		this.cache = {};
		this.insertId = '';
		this.insertIdx = 0;

		list.find('.tagWrap.isClone').remove();
		list.find('.tagWrap.isDragging').removeClass('isDragging');
		list.find('.tagWrap.isOver').removeClass('isOver left right');

		$(window).off('mousemove.dragTag mouseup.dragTag');
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
		const existing = [];

		$(`<div>${list.html()}</div>`).find('.tagItem').each((i: number, item: any) => {
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