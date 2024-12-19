import React, { forwardRef, useRef, useEffect, useState, useImperativeHandle } from 'react';
import $ from 'jquery';
import arrayMove from 'array-move';
import { observer } from 'mobx-react';
import { getRange, setRange } from 'selection-ranges';
import { DragBox } from 'Component';
import { I, S, U, J, Relation, keyboard, analytics } from 'Lib';
import ItemObject from './item/object';

const CellObject = observer(forwardRef<I.CellRef, I.Cell>((props, ref) => {

	const nodeRef = useRef(null);
	const listRef = useRef(null);
	const entryRef = useRef(null);
	const placeholderRef = useRef(null);
	const timeout = useRef(0);
	const [ isEditing, setIsEditing ] = useState(false);
	const { id, recordId, relation, size, iconSize, arrayLimit, canEdit, placeholder, subId, onChange, getRecord, elementMapper } = props;
	const record = getRecord(recordId) || {};
	const cn = [ 'wrap' ];

	const setEditing = (v: boolean) => {
		if (canEdit && (v != isEditing)) {
			setIsEditing(v);

			if (v) {
				window.setTimeout(() => focus(), 15);
			};
		};
	};

	const onClick = (e: any, item: any) => {
		if (isEditing) {
			e.stopPropagation();
			U.Object.openConfig(item);
		};
	};

	const placeholderCheck = () => {
		const value = getValue();
		const list = $(listRef.current);
		const placeholder = $(placeholderRef.current);

		value.existing.length ? list.show() : list.hide();
		value.new || value.existing.length ? placeholder.hide() : placeholder.show();
	};

	const getItems = (): any[] => {
		return Relation.getArrayValue(record[relation.relationKey]).
			map(id => S.Detail.get(subId, id, [])).
			filter(it => !it._empty_ && !it.isArchived && !it.isDeleted);
	};

	const getItemIds = (): string[] => {
		return getItems().map(it => it.id);
	};

	const getValue = () => {
		const list = $(listRef.current);
		const items = list.find('.itemWrap');
		const entry = $(entryRef.current);
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

	const setValue = (value: string[]) => {
		value = U.Common.arrayUnique(value);

		const { maxCount } = relation;
		const length = value.length;

		if (maxCount && (length > maxCount)) {
			value = value.slice(length - maxCount, length);
		};

		const cb = () => {
			clear();

			S.Menu.updateData('dataviewObjectValues', { value });
			S.Menu.updateData('dataviewObjectList', { value });
		};

		if (onChange) {
			onChange(value, cb);
		} else {
			cb();
		};
	};

	const focus = () => {
		const entry = $(entryRef.current);
		
		if (entry.length) {
			window.setTimeout(() => {
				entry.focus();
				setRange(entry.get(0), { start: 0, end: 0 });

				scrollToBottom();
			});
		};
	};

	const onKeyPress = (e: any) => {
		if (keyboard.isComposition) {
			return;
		};

		const entry = $(entryRef.current);

		if (entry.length && (entry.text().length >= J.Constant.limit.cellEntry)) {
			e.preventDefault();
		};
	};

	const onKeyDown = (e: any) => {
		if (keyboard.isComposition) {
			return;
		};

		const entry = $(entryRef.current);

		keyboard.shortcut('enter', e, () => {
			e.preventDefault();
			e.stopPropagation();

			const value = getValue();
			if (value.new) {
				onOptionAdd(value.new);
			};
		});
		
		keyboard.shortcut('backspace', e, () => {
			e.stopPropagation();

			const range = getRange(entry.get(0));
			if (range.start || range.end) {
				return;
			};

			e.preventDefault();
			
			const value = getValue();
			value.existing.pop();
			setValue(value.existing);
		});
	};

	const onKeyUp = (e: any) => {
		if (keyboard.isComposition) {
			return;
		};

		window.clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => {
			S.Menu.updateData('dataviewObjectList', { filter: getValue().new });
		}, J.Constant.delay.keyboard);

		placeholderCheck();
		resize();
		scrollToBottom();
	};

	const onInput = () => {
		placeholderCheck();
	};

	const onValueAdd = (id: string) => {
		setValue(getItemIds().concat([ id ]));
	};

	const onValueRemove = (id: string) => {
		setValue(getItemIds().filter(it => it != id));
	};

	const onDragEnd = (oldIndex: number, newIndex: number) => {
		setValue(arrayMove(getItemIds(), oldIndex, newIndex));
	};

	const onOptionAdd = (text: string) => {
		if (!text) {
			return;
		};

		const { details, flags } = Relation.getParamForNewObject(text, relation);
		U.Object.create('', '', details, I.BlockPosition.Bottom, '', flags, analytics.route.relation, message => onValueAdd(message.targetId));
	};

	const onFocus = () => {
		keyboard.setFocus(true);
	};

	const onBlur = () => {
		keyboard.setFocus(false);
	};

	const clear = () => {
		$(entryRef.current).text(' ');

		S.Menu.updateData('dataviewObjectList', { filter: '' });
		focus();
	};

	const blur = () => {
		$(entryRef.current).trigger('blur');
	};

	const scrollToBottom = () => {
		const cell = $(`#${id}`);
		const content = cell.hasClass('.cellContent') ? cell : cell.find('.cellContent');

		if (content.length) {
			content.scrollTop(content.get(0).scrollHeight + parseInt(content.css('paddingBottom')));
		};
	};

	const resize = () => {
		$(window).trigger('resize.menuDataviewObjectList');
	};

	let value = getItems();
	let content = null;

	if (isEditing) {
		content = (
			<div id="value" onClick={focus}>
				<div ref={placeholderRef} id="placeholder" className="placeholder">{placeholder}</div>

				<span ref={listRef} id="list">
					<DragBox onDragEnd={onDragEnd}>
						{value.map((item: any, i: number) => (
							<span 
								key={i}
								id={`item-${item.id}`}
								className="itemWrap isDraggable"
								draggable={canEdit}
								{...U.Common.dataProps({ id: item.id, index: i })}
							>
								<ItemObject 
									key={item.id} 
									cellId={id}
									getObject={() => item}
									size={size}
									iconSize={iconSize} 
									relation={relation} 
									elementMapper={elementMapper}
									canEdit={canEdit}
									onClick={(e, item) => onClick(e, item)}
									onRemove={(e: any, id: string) => onValueRemove(id)}
								/>
							</span>
						))}
					</DragBox>
				</span>
				
				{canEdit ? (
					<span
						ref={entryRef}
						id="entry" 
						contentEditable={true}
						suppressContentEditableWarning={true} 
						onFocus={onFocus}
						onBlur={onBlur}
						onInput={onInput}
						onKeyPress={onKeyPress}
						onKeyDown={onKeyDown}
						onKeyUp={onKeyUp}
						onCompositionStart={() => keyboard.setComposition(true)}
						onCompositionEnd={() => keyboard.setComposition(false)}
						onClick={e => e.stopPropagation()}
					>
						{'\n'}
					</span>
				) : ''}
			</div>
		);
	} else {
		const length = value.length;

		if (arrayLimit) {
			value = value.slice(0, arrayLimit);
			if (length > arrayLimit) {
				cn.push('overLimit');
			};
		};

		if (!length) {
			content = <div className="empty">{placeholder}</div>;
		} else {
			content = (
				<span className="over">
					{value.map((item: any, i: number) => (
						<ItemObject 
							key={item.id} 
							cellId={id}
							getObject={() => item}
							size={size}
							iconSize={iconSize} 
							relation={relation} 
							elementMapper={elementMapper} 
							canEdit={canEdit}
							onClick={e => onClick(e, item)}
						/>
					))}
					{arrayLimit && (length > arrayLimit) ? <div className="more">+{length - arrayLimit}</div> : ''}
				</span>
			);
		};
	};

	useEffect(() => {
		return () => {
			window.clearTimeout(timeout.current);
		};
	}, []);

	useEffect(() => {
		const cell = $(`#${id}`);

		if (isEditing) {
			cell.addClass('isEditing');

			placeholderCheck();
			focus();
			resize();
		} else {
			cell.removeClass('isEditing');
		};
	});

	useImperativeHandle(ref, () => ({
		clear,
		blur,
		setEditing,
		isEditing: () => isEditing,
	}));

	return (
		<div ref={nodeRef} className={cn.join(' ')}>
			{content}
		</div>
	);

}));

export default CellObject;