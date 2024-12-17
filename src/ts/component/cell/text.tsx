import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, S, U, J, keyboard, translate, Relation } from 'Lib';
import { Input, IconObject } from 'Component';

const MENU_ID = 'dataviewCalendar';

const CellText = observer(forwardRef<I.CellRef, I.Cell>((props, ref: any) => {

	const [ isEditing, setIsEditing ] = useState(false);
	const inputRef = useRef(null);
	const { showRelativeDates } = S.Common;
	const { 
		id, recordId, relation, textLimit, isInline, iconSize, placeholder, shortUrl, canEdit, viewType, getView, getRecord, onChange, cellPosition, onRecordAdd,
		groupId, recordIdx,
	} = props;
	const record = getRecord(recordId);
	const isName = relation.relationKey == 'name';
	const isLongText = relation.format == I.RelationType.LongText;
	const isDate = relation.format == I.RelationType.Date;
	const isNumber = relation.format == I.RelationType.Number;
	const isUrl = relation.format == I.RelationType.Url;
	const view = getView ? getView() : null;
	const range = useRef(null);
	const value = useRef(null);

	const onSelect = (e: any) => {
		range.current = {
			from: e.currentTarget.selectionStart,
			to: e.currentTarget.selectionEnd,
		};
	};

	const setEditingHandler = (v: boolean) => {
		if (canEdit && (v != isEditing)) {
			setIsEditing(v);
		};
	};

	const onChangeHandler = (v: any) => {
		setValue(v);
	};

	const onPaste = (e: any, value: any) => {
		if (relation.format == I.RelationType.Date) {
			value = fixDateValue(value);
		};

		range.current = inputRef.current.getRange();
		setValue(value);
		save(value);
	};

	const onKeyUp = (e: any, value: string) => {
		if (relation.format == I.RelationType.LongText) {
			return;
		};

		if ([ I.RelationType.Url, I.RelationType.Phone, I.RelationType.Email ].includes(relation.format)) {
			S.Menu.updateData('select', { disabled: !value });
		};

		setValue(value);

		if (keyboard.isComposition) {
			return;
		};

		let ret = false;

		keyboard.shortcut('escape, enter, enter+shift', e, (pressed) => {
			e.preventDefault();
			e.persist();

			save(value, () => {
				S.Menu.closeAll(J.Menu.cell);

				range.current = null;
				setEditingHandler(false);

				if (onRecordAdd && (pressed == 'enter+shift')) {
					onRecordAdd(e, 0, groupId, {}, recordIdx + 1);
				};
			});

			ret = true;
		});
	};

	const onKeyUpDate = (e: any, value: any) => {
		setValue(fixDateValue(value));

		if (value.current) {
			S.Menu.updateData(MENU_ID, { value: value.current });
		};

		if (keyboard.isComposition) {
			return;
		};

		keyboard.shortcut('enter', e, () => {
			e.preventDefault();
			save(value.current, () => S.Menu.close(MENU_ID));
		});
	};

	const onFocus = (e: any) => {
		keyboard.setFocus(true);
	};

	const onBlur = (e: any) => {
		const record = getRecord(recordId);

		if (!inputRef.current || keyboard.isBlurDisabled || !record) {
			return;
		};

		keyboard.setFocus(false);
		range.current = null;

		if (U.Common.compareJSON(record[relation.relationKey], value.current)) {
			setEditingHandler(false);
			return;
		};

		save(value.current, () => {
			if (!S.Menu.isOpen(MENU_ID)) {
				setEditingHandler(false);
			};
		});
	};

	const setValue = (v: any) => {
		value.current = v;
	};

	const save = (value: any, callBack?: () => void) => {
		if (onChange) {
			onChange(value, callBack);
		};
	};

	const fixDateValue = (v: any) => {
		v = String(v || '').replace(/_/g, '');

		let view = null;
		let viewRelation: any = {};

		if (getView) {
			view = getView();
			viewRelation = view.getRelation(relation.relationKey);

			if (v && viewRelation) {
				v = U.Date.parseDate(v, viewRelation.dateFormat);
			};
		};

		return v ? v : null;
	};

	const getViewRelation = (): any => {
		if (!relation || !getView) {
			return {};
		};

		return getView().getRelation(relation.relationKey) || {};
	};

	const viewRelation = getViewRelation();

	let Name = null;
	let EditorComponent = null;
	let val = record[relation.relationKey];

	if (isDate || isNumber) {
		val = Relation.formatValue(relation, value, true);
		if (isNumber) {
			val = value === null ? null : String(value);
		};
	} else {
		val = String(value || '');
	};

	if (isLongText && !isEditing && isInline) {
		val = val.replace(/\n/g, ' ');
	};

	if (isEditing) {
		if (isLongText) {
			EditorComponent = () => <span>{val}</span>;
		} else 
		if (isDate) {
			const mask = [];
			const ph = [];

			switch (viewRelation.dateFormat) {
				case I.DateFormat.ISO: {
					mask.push('9999.99.99');
					ph.push('yyyy.mm.dd');
					break;
				};

				case I.DateFormat.ShortUS: {
					mask.push('99.99.9999');
					ph.push('mm.dd.yyyy');
					break;
				};

				default: {
					mask.push('99.99.9999');
					ph.push('dd.mm.yyyy');
					break;
				};
			};
			
			if (viewRelation.includeTime) {
				mask.push('99:99');
				ph.push('hh:mm');
			};

			const maskOptions = {
				mask: mask.join(' '),
				separator: '.',
				hourFormat: 12,
				alias: 'datetime',
			};

			EditorComponent = (item: any) => (
				<Input 
					ref={inputRef} 
					id="input" 
					{...item} 
					maskOptions={maskOptions} 
					placeholder={ph.join(' ')} 
					onKeyUp={onKeyUpDate} 
				/>
			);
		} else {
			EditorComponent = (item: any) => (
				<Input 
					ref={inputRef} 
					id="input" 
					{...item} 
					placeholder={placeholder}
					onKeyUp={onKeyUp} 
				/>
			);
		};

		Name = (item: any) => (
			<EditorComponent 
				value={item.name} 
				className="name" 
				onFocus={onFocus} 
				onBlur={onBlur}
				onSelect={onSelect}
				onPaste={onPaste}
				onCut={onPaste}
			/>
		);
	} else {
		Name = (item: any) => {
			let name = item.name;
			let content = null;

			if (name) {
				if (textLimit) {
					name = U.Common.shorten(name, textLimit);
				};
				content = <div className="name">{name}</div>;
			} else {
				if (isName && U.Object.isNoteLayout(record.layout)) {
					content = <span className="emptyText">{translate('commonEmpty')}</span>;
				} else {
					content = <div className="empty">{placeholder}</div>;
				};
			};
			return content;
		};

		if (isDate) {
			if (val !== null) {
				val = Number(val) || 0;

				const day = showRelativeDates ? U.Date.dayString(val) : null;
				const date = day ? day : U.Date.dateWithFormat(S.Common.dateFormat, val);
				const time = U.Date.timeWithFormat(S.Common.timeFormat, val);
				
				val = viewRelation.includeTime ? [ date, time ].join((day ? ', ' : ' ')) : date;
			} else {
				val = '';
			};
		};

		if (isUrl && shortUrl) {
			val = val !== null ? U.Common.shortUrl(val) : '';
		};

		if (isNumber) {
			if (val !== null) {
				const mapped = Relation.mapValue(relation, val);
				val = mapped !== null ? mapped : U.Common.formatNumber(val);
			} else {
				val = '';
			};
		};
	};

	let icon = null;
	if (isName) {
		if (!view || (view && !view.hideIcon)) {
			icon = (
				<IconObject 
					id={[ relation.relationKey, record.id ].join('-')} 
					size={iconSize} 
					canEdit={canEdit} 
					offsetY={4} 
					object={record} 
					noClick={true}
				/>
			);
		};

		if (!isEditing) {
			if (U.Object.isNoteLayout(record.layout)) {
				val = record.snippet;
			} else {
				val = val || translate('defaultNamePage');
			};
		};
	};

	useEffect(() => {
		setValue(Relation.formatValue(relation, record[relation.relationKey], true));
	}, []);

	useEffect(() => {
		const cell = $(`#${id}`);
		const card = viewType == I.ViewType.Grid ? null : $(`#record-${record.id}`);

		setValue(Relation.formatValue(relation, record[relation.relationKey], true));

		if (isEditing) {
			let val = value.current;

			if (relation.relationKey == 'name') {
				if (val == translate('defaultNamePage')) {
					val = '';
				};
			} else
			if (relation.format == I.RelationType.Date) {
				const format = [];

				switch (viewRelation.dateFormat) {
					case I.DateFormat.ISO: {
						format.push('Y.m.d');
						break;
					};

					case I.DateFormat.ShortUS: {
						format.push('m.d.Y');
						break;
					};

					default: {
						format.push('d.m.Y');
						break;
					};
				};

				if (viewRelation.includeTime) {
					format.push('H:i');
				};

				val = value.current !== null ? U.Date.date(format.join(' ').trim(), value.current) : '';
			} else
			if (relation.format == I.RelationType.Number) {
				val = Relation.formatValue(relation, value.current, true);
				val = value === null ? null : String(value);
			};

			if (inputRef.current) {
				inputRef.current.setValue(value);

				if (inputRef.current.setRange) {
					const length = String(value || '').length;
					inputRef.current.setRange(range.current || { from: length, to: length });
				};
			};

			cell.addClass('isEditing');
			if (card && card.length) {
				card.addClass('isEditing');
			};

			if (cellPosition) {
				cellPosition(id);
			};
		} else {
			cell.removeClass('isEditing');
			cell.find('.cellContent').css({ left: '', right: '' });

			if (card && card.length) {
				card.removeClass('isEditing');
			};
		};

		if (S.Common.cellId) {
			$(`#${S.Common.cellId}`).addClass('isEditing');
		};
	});

	useImperativeHandle(ref, () => ({
		setEditing: (v: boolean) => setEditingHandler(v),
		onChange: (v: any) => onChangeHandler(v),
	}));

	return (
		<>
			{icon}
			<Name name={value} />
		</>
	);

}));

export default CellText;