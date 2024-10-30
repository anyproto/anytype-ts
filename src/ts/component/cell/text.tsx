import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, S, U, J, keyboard, translate, Relation } from 'Lib';
import { Input, IconObject } from 'Component';

interface State { 
	isEditing: boolean; 
};

const MENU_ID = 'dataviewCalendar';

const CellText = observer(class CellText extends React.Component<I.Cell, State> {

	_isMounted = false;
	state = {
		isEditing: false,
	};
	range: any = null;
	ref = null;
	value: any = null;
	isComposition = false;
	timeout = 0;

	constructor (props: I.Cell) {
		super(props);

		this.onKeyUp = this.onKeyUp.bind(this);
		this.onKeyUpDate = this.onKeyUpDate.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onPaste = this.onPaste.bind(this);
		this.onCompositionStart = this.onCompositionStart.bind(this);
		this.onCompositionEnd = this.onCompositionEnd.bind(this);
	};

	render () {
		const { isEditing } = this.state;
		const { showRelativeDates } = S.Common;
		const { recordId, relation, textLimit, isInline, iconSize, placeholder, shortUrl, canEdit, getView, getRecord } = this.props;
		const record = getRecord(recordId);
		
		if (!record || !relation) {
			return null;
		};

		const isName = relation.relationKey == 'name';
		const isLongText = relation.format == I.RelationType.LongText;
		const isDate = relation.format == I.RelationType.Date;
		const isNumber = relation.format == I.RelationType.Number;
		const isUrl = relation.format == I.RelationType.Url;
		const view = getView ? getView() : null;
		const viewRelation = this.getViewRelation();

		let Name = null;
		let EditorComponent = null;
		let value = record[relation.relationKey];

		if (isDate || isNumber) {
			value = Relation.formatValue(relation, value, true);
			if (isNumber) {
				value = value === null ? null : String(value);
			};
		} else {
			value = String(value || '');
		};

		if (isLongText && !isEditing && isInline) {
			value = value.replace(/\n/g, ' ');
		};

		if (isEditing) {
			if (isLongText) {
				EditorComponent = () => <span>{value}</span>;
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
						ref={ref => this.ref = ref} 
						id="input" 
						{...item} 
						maskOptions={maskOptions} 
						placeholder={ph.join(' ')} 
						onKeyUp={this.onKeyUpDate} 
					/>
				);
			} else {
				EditorComponent = (item: any) => (
					<Input 
						ref={ref => this.ref = ref} 
						id="input" 
						{...item} 
						placeholder={placeholder}
						onKeyUp={this.onKeyUp} 
					/>
				);
			};

			Name = (item: any) => (
				<EditorComponent 
					value={item.name} 
					className="name" 
					onFocus={this.onFocus} 
					onBlur={this.onBlur}
					onSelect={this.onSelect}
					onPaste={this.onPaste}
					onCut={this.onPaste}
					onCompositionStart={this.onCompositionStart}
					onCompositionEnd={this.onCompositionEnd}
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
				if (value !== null) {
					value = Number(value) || 0;

					const day = showRelativeDates ? U.Date.dayString(value) : null;
					const date = day ? day : U.Date.dateWithFormat(viewRelation.dateFormat, value);
					const time = U.Date.timeWithFormat(viewRelation.timeFormat, value);
					
					value = viewRelation.includeTime ? [ date, time ].join((day ? ', ' : ' ')) : date;
				} else {
					value = '';
				};
			};

			if (isUrl && shortUrl) {
				value = value !== null ? U.Common.shortUrl(value) : '';
			};

			if (isNumber) {
				if (value !== null) {
					const mapped = Relation.mapValue(relation, value);
					value = mapped !== null ? mapped : U.Common.formatNumber(value);
				} else {
					value = '';
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
					value = record.snippet;
				} else {
					value = value || translate('defaultNamePage');
				};
			};
		};

		return (
			<React.Fragment>
				{icon}
				<Name name={value} />
			</React.Fragment>
		);
	};

	componentDidMount () {
		const { relation, recordId, getRecord } = this.props;
		const record = getRecord(recordId);

		this._isMounted = true;
		this.setValue(Relation.formatValue(relation, record[relation.relationKey], true));
	};

	componentDidUpdate () {
		const { isEditing } = this.state;
		const { id, relation, viewType, recordId, getRecord, cellPosition, getView } = this.props;
		const record = getRecord(recordId);
		const cell = $(`#${id}`);
		const viewRelation = this.getViewRelation();
		const card = viewType == I.ViewType.Grid ? null : $(`#record-${record.id}`);

		this.setValue(Relation.formatValue(relation, record[relation.relationKey], true));

		if (isEditing) {
			let value = this.value;

			if (relation.relationKey == 'name') {
				if (value == translate('defaultNamePage')) {
					value = '';
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

				value = this.value !== null ? U.Date.date(format.join(' ').trim(), this.value) : '';
			} else
			if (relation.format == I.RelationType.Number) {
				value = Relation.formatValue(relation, this.value, true);
				value = value === null ? null : String(value);
			};

			if (this.ref) {
				this.ref.setValue(value);

				if (this.ref.setRange) {
					const length = String(value || '').length;
					this.ref.setRange(this.range || { from: length, to: length });
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
	};

	componentWillUnmount () {
		this._isMounted = false;
		window.clearTimeout(this.timeout);
	};

	onSelect (e: any) {
		this.range = {
			from: e.currentTarget.selectionStart,
			to: e.currentTarget.selectionEnd,
		};
	};

	setEditing (v: boolean) {
		if (!this._isMounted) {
			return;
		};

		const { canEdit } = this.props;
		const { isEditing } = this.state;

		if (canEdit && (v != isEditing)) {
			this.setState({ isEditing: v });
		};
	};

	onChange (v: any) {
		this.setValue(v);
	};

	onPaste (e: any, value: any) {
		const { relation } = this.props;

		if (relation.format == I.RelationType.Date) {
			value = this.fixDateValue(value);
		};

		this.range = this.ref?.getRange();
		this.setValue(value);
		this.save(value);
	};

	onKeyUp (e: any, value: string) {
		const { relation, groupId, onRecordAdd, recordIdx } = this.props;

		if (relation.format == I.RelationType.LongText) {
			return;
		};

		if ([ I.RelationType.Url, I.RelationType.Phone, I.RelationType.Email ].includes(relation.format)) {
			S.Menu.updateData('select', { disabled: !value });
		};

		this.setValue(value);

		if (this.isComposition) {
			return;
		};

		let ret = false;

		keyboard.shortcut('escape, enter, enter+shift', e, (pressed) => {
			e.preventDefault();
			e.persist();

			this.save(value, () => {
				S.Menu.closeAll(J.Menu.cell);

				this.range = null;
				this.setEditing(false);

				if (onRecordAdd && (pressed == 'enter+shift')) {
					onRecordAdd(e, 0, groupId, {}, recordIdx + 1);
				};
			});

			ret = true;
		});
	};

	onKeyUpDate (e: any, value: any) {
		this.setValue(this.fixDateValue(value));

		if (this.value) {
			S.Menu.updateData(MENU_ID, { value: this.value });
		};

		if (this.isComposition) {
			return;
		};

		keyboard.shortcut('enter', e, () => {
			e.preventDefault();
			this.save(this.value, () => S.Menu.close(MENU_ID));
		});
	};

	onFocus (e: any) {
		keyboard.setFocus(true);
	};

	onBlur (e: any) {
		const { relation, recordId, getRecord } = this.props;
		const record = getRecord(recordId);

		if (!this.ref || keyboard.isBlurDisabled || !record) {
			return;
		};

		keyboard.setFocus(false);
		this.range = null;

		if (U.Common.compareJSON(record[relation.relationKey], this.value)) {
			this.setEditing(false);
			return;
		};

		this.save(this.value, () => {
			if (!S.Menu.isOpen(MENU_ID)) {
				this.setEditing(false);
			};
		});
	};

	setValue (v: any) {
		this.value = v;
	};

	save (value: any, callBack?: () => void) {
		const { onChange } = this.props;

		if (onChange) {
			onChange(value, callBack);
		};
	};

	fixDateValue (v: any) {
		const { relation, getView } = this.props;

		let view = null;
		let viewRelation: any = {};

		if (getView) {
			view = getView();
			viewRelation = view.getRelation(relation.relationKey);
		};

		v = String(v || '').replace(/_/g, '');
		return v ? U.Date.parseDate(v, viewRelation.dateFormat) : null;
	};

	onCompositionStart () {
		this.isComposition = true;
	};

	onCompositionEnd () {
		this.isComposition = false;
	};

	getViewRelation (): any {
		const { relation, getView } = this.props;

		if (!relation || !getView) {
			return {};
		};

		return getView().getRelation(relation.relationKey) || {};
	};

});

export default CellText;
