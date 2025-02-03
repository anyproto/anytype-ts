import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle } from 'react';
import $ from 'jquery';
import arrayMove from 'array-move';
import { observer } from 'mobx-react';
import { getRange, setRange } from 'selection-ranges';
import { Tag, Icon, DragBox } from 'Component';
import { I, S, U, J, Relation, keyboard } from 'Lib';

const CellSelect = observer(forwardRef<I.CellRef, I.Cell>((props, ref) => {

	const { id, relation, recordId, getRecord, elementMapper, onChange, arrayLimit, canEdit, placeholder, menuClassName, menuClassNameWrap } = props;
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
		const list = $(listRef.current);
		const placeholder = $(placeholderRef.current);

		value.existing.length ? list.show() : list.hide();
		value.new || value.existing.length ? placeholder.hide() : placeholder.show();
	};

	const clear = () => {
		$(entryRef.current).text(' ');
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
		const entry = $(entryRef.current);

		if (entry.length) {
			window.setTimeout(() => {
				entry.focus();
				setRange(entry.get(0), { start: 0, end: 0 });

				scrollToBottom();
			});
		};
	};

	const scrollToBottom = () => {
		const cell = $(`#${id}`);
		const content = cell.hasClass('.cellContent') ? cell : cell.find('.cellContent');

		if (content.length) {
			content.scrollTop(content.get(0).scrollHeight + parseInt(content.css('paddingBottom')));
		};
	};

	const onClear = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		setValue([]);
	};

	const onContextMenu = (e: React.MouseEvent, item: any) => {
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

	const getItems = (): any[] => {
		return relation && record ? Relation.getOptions(record[relation.relationKey]).filter(it => !it.isArchived && !it.isDeleted) : [];
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
		$(window).trigger('resize.menuDataviewOptionList');
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

				{isSelect ? <Icon className="clear" onMouseDown={onClear} /> : ''}
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
						/>
					))}
					{arrayLimit && (length > arrayLimit) ? <div className="more">+{length - arrayLimit}</div> : ''}
				</span>
			);
		};
	};

	useEffect(() => {
		$(`#${id}`).toggleClass('isEditing', isEditing);

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

}));

export default CellSelect;