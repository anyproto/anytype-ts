import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, S, U, J, keyboard, translate, Relation } from 'Lib';
import { Input, IconObject } from 'Component';

const CellText = observer(forwardRef<I.CellRef, I.Cell>((props, ref: any) => {

	const [ isEditing, setIsEditing ] = useState(false);
	const inputRef = useRef(null);
	const { showRelativeDates, dateFormat } = S.Common;
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
	const isEmail = relation.format == I.RelationType.Email;
	const isPhone = relation.format == I.RelationType.Phone;
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

	const onPaste = (e: any, v: any) => {
		if (isDate) {
			v = fixDateValue(v);
		};

		range.current = inputRef.current.getRange();
		setValue(v);
		save(v);

		if (isDate && !relation.includeTime) {
			S.Menu.close('calendar');
		};
	};

	const onKeyUp = (e: any, v: string) => {
		if (isLongText) {
			return;
		};

		if (isUrl || isEmail || isPhone) {
			S.Menu.updateData('select', { disabled: !v });
		};

		setValue(v);

		if (keyboard.isComposition) {
			return;
		};

		keyboard.shortcut('escape, enter, enter+shift', e, (pressed) => {
			e.preventDefault();
			e.persist();

			save(v, () => {
				S.Menu.closeAll(J.Menu.cell);

				range.current = null;
				setEditingHandler(false);

				if (onRecordAdd && (pressed == 'enter+shift')) {
					onRecordAdd(e, 0, groupId, {}, recordIdx + 1);
				};
			});
		});
	};

	const onKeyUpDate = (e: any, v: any) => {
		v = fixDateValue(v);

		setValue(v);

		if (v) {
			S.Menu.updateData('calendar', { value: v });
		};

		if (keyboard.isComposition) {
			return;
		};

		keyboard.shortcut('enter', e, () => {
			e.preventDefault();
			save(v, () => S.Menu.close('calendar'));
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
			if (!S.Menu.isOpen('calendar')) {
				setEditingHandler(false);
			};
		});
	};

	const onUnmount = () => {
		if (isEditing && (record[relation.relationKey] !== value.current)) {
			save(value.current);
		};
	};

	const setValue = (v: any) => {
		value.current = v;
	};

	const save = (v: any, callBack?: () => void) => {
		if (onChange) {
			onChange(v, callBack);
		};
	};

	const fixDateValue = (v: any) => {
		v = String(v || '').replace(/_/g, '');

		if (v) {
			v = U.Date.parseDate(v, dateFormat);
		};

		return v ? v : null;
	};

	let Name = null;
	let EditorComponent = null;
	let val = record[relation.relationKey];
	let icon = null;

	if (isDate || isNumber) {
		val = Relation.formatValue(relation, val, true);
		if (isNumber) {
			val = val !== null ? String(val) : null;
		};
	} else {
		val = String(val || '');
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

			switch (dateFormat) {
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
			
			if (relation.includeTime) {
				mask.push('99:99');
				ph.push('hh:mm');
			};

			EditorComponent = (item: any) => (
				<Input 
					key={[ recordId, relation.relationKey, 'input' ].join('-')}
					ref={inputRef} 
					id="input" 
					{...item} 
					maskOptions={{
						mask: mask.join(' '),
						separator: '.',
						hourFormat: 12,
						alias: 'datetime',
					}} 
					placeholder={ph.join(' ')} 
					onKeyUp={onKeyUpDate}
				/>
			);
		} else {
			EditorComponent = (item: any) => (
				<Input 
					key={[ recordId, relation.relationKey, 'input' ].join('-')}
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
				onUnmount={onUnmount}
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
				const date = day ? day : U.Date.dateWithFormat(dateFormat, val);
				const time = U.Date.timeWithFormat(S.Common.timeFormat, val);
				
				val = relation.includeTime ? [ date, time ].join((day ? ', ' : ' ')) : date;
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

	if (isName) {
		if (!view || (view && !view.hideIcon)) {
			icon = (
				<IconObject 
					id={[ relation.relationKey, record.id ].join('-')} 
					size={iconSize} 
					canEdit={canEdit} 
					object={record} 
					noClick={true}
					menuParam={{ offsetY: 4 }}
				/>
			);
		};

		if (!isEditing) {
			if (U.Object.isNoteLayout(record.layout)) {
				val = record.snippet;
			} else
			if (U.Object.isTypeLayout(record.layout)) {
				val = record.name || record.pluralName || translate('defaultNamePage');
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

		if (isEditing) {
			let val = value.current;

			if (relation.relationKey == 'name') {
				if (val == translate('defaultNamePage')) {
					val = '';
				};
			} else
			if (isDate) {
				const format = [];

				switch (dateFormat) {
					case I.DateFormat.ISO: format.push('Y.m.d'); break;
					case I.DateFormat.ShortUS: format.push('m.d.Y'); break;
					default: format.push('d.m.Y'); break;
				};

				if (relation.includeTime) {
					format.push('H:i');
				};

				val = val !== null ? U.Date.date(format.join(' ').trim(), val) : '';
			} else
			if (isNumber) {
				val = Relation.formatValue(relation, val, true);
				val = val !== null ? String(val) : null;
			};

			if (inputRef.current?.setRange) {
				const length = String(val || '').length;

				inputRef.current.setRange(range.current || { from: length, to: length }, false);
			};

			if (cellPosition) {
				cellPosition(id);
			};
		} else {
			setValue(Relation.formatValue(relation, record[relation.relationKey], true));

			cell.find('.cellContent').css({ left: '', right: '' });
		};

		cell.toggleClass('isEditing', isEditing);
		if (card && card.length) {
			card.toggleClass('isEditing', isEditing);
		};

		if (S.Common.cellId) {
			$(`#${S.Common.cellId}`).addClass('isEditing');
		};
	});

	useImperativeHandle(ref, () => ({
		setEditing: (v: boolean) => setEditingHandler(v),
		isEditing: () => isEditing,
		onChange: (v: any) => setValue(v),
		getValue: () => val,
		onBlur,
	}));

	return (
		<>
			{icon}
			<Name name={val} />
		</>
	);

}));

export default CellText;
