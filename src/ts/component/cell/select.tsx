import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle, MouseEvent } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { getRange, setRange } from 'selection-ranges';
import { Tag, Icon, DragBox } from 'Component';
import * as I from 'Interface';

const CellSelect = forwardRef<I.CellRef, I.Cell>((props, ref) => {

	const { id, relation, recordId, getRecord, elementMapper, onChange, arrayLimit, canEdit, placeholder, menuParam, viewType } = props;
	const entryRef = useRef(null);
	const listRef = useRef(null);
	const placeholderRef = useRef(null);
	const [ isEditing, setEditing ] = useState(false);
	const record = getRecord(recordId);
	const { maxCount } = relation;
	const isSelect = relation.format == I.RelationType.Select;
	const cn = [ 'wrap' ];

	const setEditingHandler = (v: boolean) => {
		if (canEdit && (v != isEditing)) {
			setEditing(v);
			
			if (v) {
				window.setTimeout(() => focus(), 15);
			};
		};
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

		keyboard.shortcut('enter', e, () => {
			e.preventDefault();
			e.stopPropagation();

			S.Menu.updateData('dataviewOptionList', { filter: getValue().new, selectFirst: true });
		});

		placeholderCheck();
		resize();
		scrollToBottom();
	};

	const onKeyUp = (e: any) => {
		if (keyboard.isComposition) {
			return;
		};

		S.Menu.updateData('dataviewOptionList', { filter: getValue().new });

		placeholderCheck();
		resize();
		scrollToBottom();
	};

	const onInput = () => {
		placeholderCheck();
	};

	const onClick = (e: any, id: string) => {
	};

	const placeholderCheck = () => {
		const value = getValue();

		if (listRef.current) {
			U.Dom.css(listRef.current, { display: value.existing.length ? '' : 'none' });
		};

		if (placeholderRef.current) {
			U.Dom.css(placeholderRef.current, { display: (value.new || value.existing.length) ? 'none' : '' });
		};
	};

	const clear = () => {
		if (entryRef.current) {
			entryRef.current.textContent = ' ';
		};
		focus();
	};

	const onValueRemove = (id: string) => {
		setValue(getItemIds().filter(it => it != id));
	};

	const onDragEnd = (oldIndex: number, newIndex: number) => {
		setValue(arrayMove(getItemIds(), oldIndex, newIndex));
	};

	const onFocus = () => {
		keyboard.setFocus(true);
	};

	const onBlur = () => {
		keyboard.setFocus(false);
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

	const onClear = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		setValue([]);
	};

	const onContextMenu = (e: MouseEvent, item: any) => {
		if (!canEdit) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		S.Menu.open('dataviewOptionEdit', {
			element: `#${id} #item-${U.Common.esc(item.id)}`,
			className: menuParam.className,
			classNameWrap: menuParam.classNameWrap,
			offsetY: 4,
			data: {
				option: item,
			}
		});
	};

	const getItems = (): any[] => {
		return relation && record ? Relation.getOptions(record[relation.relationKey]).filter(it => !it.isArchived && !it.isDeleted) : [];
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

		const length = value.length;
		if (maxCount && (length > maxCount)) {
			value = value.slice(length - maxCount, length);
		};

		if (onChange) {
			onChange(value, () => {
				clear();

				S.Menu.updateData('dataviewOptionList', { value });
			});
		};
	};

	const resize = () => {
		U.Dom.eventDispatch(window, 'resize');
	};

	let value = getItems();
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
			<div id="value" onClick={focus}>
				<div ref={placeholderRef} id="placeholder" className="placeholder">{placeholder}</div>

				<span ref={listRef} id="list">
					<DragBox onDragEnd={onDragEnd}>
						{value.map((item: any, i: number) => (
							<span 
								key={i}
								id={`item-${item.id}`}
								className={cni.join(' ')}
								draggable={canEdit && !isSelect}
								onContextMenu={e => onContextMenu(e, item)}
								{...U.Common.dataProps({ id: item.id, index: i })}
							>
								<Tag 
									key={item.id}
									text={item.name}
									color={item.color}
									canEdit={canEdit && !isSelect} 
									className={Relation.selectClassName(relation.format)}
									onClick={e => onClick(e, item.id)}
									onRemove={() => onValueRemove(item.id)}
									isSmall={viewType != I.ViewType.Grid}
								/>
							</span>
						))}
					</DragBox>
				</span>
				
				{canEdit ? (
					<span 
						id="entry" 
						ref={entryRef}
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

				{isSelect ? <Icon name="common/clear" className="clear" onMouseDown={onClear} /> : ''}
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
							onClick={e => onClick(e, item.id)}
							onContextMenu={e => onContextMenu(e, item)}
							isSmall={viewType != I.ViewType.Grid}
						/>
					))}
					{arrayLimit && (length > arrayLimit) ? <div className="more">+{length - arrayLimit}</div> : ''}
				</span>
			);
		};
	};

	useEffect(() => {
		const cell = U.Dom.get(id);
		if (cell) {
			U.Dom.toggleClass(cell, 'isEditing', isEditing);
		};

		if (isEditing) {
			placeholderCheck();
			focus();
			resize();
		};
	});

	useImperativeHandle(ref, () => ({
		clear,
		setEditing: setEditingHandler,
		isEditing: () => isEditing,
		getValue,
		setValue,
	}));

	return (
		<div className={cn.join(' ')}>
			{content}
		</div>
	);

});

export default CellSelect;
