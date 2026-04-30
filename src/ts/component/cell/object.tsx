import React, { forwardRef, useRef, useEffect, useState, useImperativeHandle } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { getRange, setRange } from 'selection-ranges';
import { DragBox } from 'Component';
import ItemObject from './item/object';
import * as I from 'Interface';

const CellObject = forwardRef<I.CellRef, I.Cell>((props, ref) => {

	const nodeRef = useRef(null);
	const listRef = useRef(null);
	const entryRef = useRef(null);
	const placeholderRef = useRef(null);
	const timeout = useRef(0);
	const [ isEditing, setIsEditing ] = useState(false);
	const { id, recordId, relation, size, iconSize, arrayLimit, canEdit, placeholder, subId, menuParam, onChange, getRecord, elementMapper } = props;
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
			S.Menu.closeAll(null, () => U.Object.openConfig(e, item));
		};
	};

	const onContext = (e: any, item: any) => {
		e.preventDefault();
		e.stopPropagation();

		S.Menu.open('objectContext', {
			classNameWrap: menuParam?.classNameWrap || '',
			recalcRect: () => {
				const { x, y } = keyboard.mouse.page;
				return { width: 0, height: 0, x: x + 4, y };
			},
			data: {
				objectIds: [ item.id ],
				subId,
				allowedNewTab: true,
			},
		});
	};

	const placeholderCheck = () => {
		const value = getValue();
		const list = listRef.current;
		const ph = placeholderRef.current;

		if (list) {
			U.Dom.css(list, { display: value.existing.length ? '' : 'none' });
		};
		if (ph) {
			U.Dom.css(ph, { display: (value.new || value.existing.length) ? 'none' : '' });
		};
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
		const items = listRef.current ? U.Dom.selectAll('.itemWrap', listRef.current) : [];
		const existing = [];

		items.forEach((item: any) => {
			existing.push(item.dataset.id);
		});

		return {
			existing,
			new: (entryRef.current ? String(entryRef.current.textContent || '').trim() : ''),
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
		window.setTimeout(() => {
			if (!entryRef.current) {
				return;
			};

			entryRef.current.focus();
			setRange(entryRef.current, { start: 0, end: 0 });

			scrollToBottom();
		});
	};

	const onKeyPress = (e: any) => {
		if (keyboard.isComposition) {
			return;
		};

		if (entryRef.current && (entryRef.current.textContent.length >= J.Constant.limit.cellEntry)) {
			e.preventDefault();
		};
	};

	const onKeyDown = (e: any) => {
		if (keyboard.isComposition) {
			return;
		};

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

			const range = getRange(entryRef.current);
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
		if (entryRef.current) {
			entryRef.current.textContent = ' ';
		};

		S.Menu.updateData('dataviewObjectList', { filter: '' });
		focus();
	};

	const blur = () => {
		entryRef.current?.blur();
	};

	const scrollToBottom = () => {
		const cell = U.Dom.get(id);
		if (!cell) {
			return;
		};

		const content = U.Dom.hasClass(cell, 'cellContent') ? cell : U.Dom.select('.cellContent', cell);
		if (content) {
			content.scrollTop = content.scrollHeight + parseInt(getComputedStyle(content).paddingBottom);
		};
	};

	const resize = () => {
		U.Dom.eventDispatch(window, 'resize');
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
							onContext={(length == 1) ? onContext : undefined}
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
		const cell = U.Dom.get(id);
		if (!cell) {
			return;
		};

		const value = getItems();

		if (isEditing) {
			U.Dom.addClass(cell, 'isEditing');

			placeholderCheck();
			focus();
			resize();
		} else {
			U.Dom.removeClass(cell, 'isEditing');
		};

		U.Dom.toggleClass(cell, 'isEmpty', !value.length);
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

});

export default CellObject;
