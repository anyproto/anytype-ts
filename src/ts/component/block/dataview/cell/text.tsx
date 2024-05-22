import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, UtilCommon, UtilData, UtilObject, keyboard, translate, Relation, UtilDate } from 'Lib';
import { Input, IconObject } from 'Component';
import { commonStore, menuStore } from 'Store';
const Constant = require('json/constant.json');

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
		this.onIconSelect = this.onIconSelect.bind(this);
		this.onIconUpload = this.onIconUpload.bind(this);
		this.onCheckbox = this.onCheckbox.bind(this);
		this.onCompositionStart = this.onCompositionStart.bind(this);
		this.onCompositionEnd = this.onCompositionEnd.bind(this);
	};

	render () {
		const { isEditing } = this.state;
		const { showRelativeDates } = commonStore;
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

		let view = null;
		let viewRelation: any = {};

		if (getView) {
			view = getView();
			viewRelation = view.getRelation(relation.relationKey);
		};

		let Name = null;
		let EditorComponent = null;
		let value = record[relation.relationKey];

		if (isDate || isNumber) {
			value = Relation.formatValue(relation, record[relation.relationKey], true);
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
				EditorComponent = () => (
					<span>{value}</span>
				);
			} else 
			if (isDate) {
				const mask = [ '99.99.9999' ];
				const ph = [];

				if (viewRelation.dateFormat == I.DateFormat.ShortUS) {
					ph.push('mm.dd.yyyy');
				} else {
					ph.push('dd.mm.yyyy');
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
						placeholder={placeholder || translate(`placeholderCell${relation.format}`)}
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
						name = UtilCommon.shorten(name, textLimit);
					};
					content = <div className="name">{name}</div>;
				} else {
					if (isName && (record.layout == I.ObjectLayout.Note)) {
						content = <span className="emptyText">{translate('commonEmpty')}</span>;
					} else {
						content = (
							<div className="empty">
								{placeholder || translate(`placeholderCell${relation.format}`)}
							</div>
						);
					};
				};
				return content;
			};

			if (isDate) {
				if (value !== null) {
					value = Number(value) || 0;

					const day = showRelativeDates ? UtilDate.dayString(value) : null;
					const date = day ? day : UtilDate.date(UtilDate.dateFormat(viewRelation.dateFormat), value);
					const time = UtilDate.date(UtilDate.timeFormat(viewRelation.timeFormat), value);
					
					value = viewRelation.includeTime ? [ date, time ].join((day ? ', ' : ' ')) : date;
				} else {
					value = '';
				};
			};

			if (isUrl && shortUrl) {
				value = value !== null ? UtilCommon.shortUrl(value) : '';
			};

			if (isNumber) {
				if (value !== null) {
					const mapped = Relation.mapValue(relation, value);
					value = mapped !== null ? mapped : UtilCommon.formatNumber(value);
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
						onSelect={this.onIconSelect} 
						onUpload={this.onIconUpload}
						onCheckbox={this.onCheckbox}
						size={iconSize} 
						canEdit={canEdit} 
						offsetY={4} 
						object={record} 
						noClick={true}
					/>
				);
			};

			if (!isEditing) {
				if (record.layout == I.ObjectLayout.Note) {
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

		this.setValue(Relation.formatValue(relation, record[relation.relationKey], true));

		let view = null;
		let viewRelation: any = {};
		let card = null;
		
		if (getView) {
			view = getView();
			viewRelation = view.getRelation(relation.relationKey);
		};

		if (viewType != I.ViewType.Grid) {
			card = $(`#record-${record.id}`);
		};

		if (isEditing) {
			let value = this.value;

			if (relation.relationKey == 'name') {
				if (value == translate('defaultNamePage')) {
					value = '';
				};
			} else
			if (relation.format == I.RelationType.Date) {
				const format = [
					(viewRelation.dateFormat == I.DateFormat.ShortUS) ? 'm.d.Y' : 'd.m.Y'
				];
				if (viewRelation.includeTime) {
					format.push('H:i');
				};

				value = this.value !== null ? UtilDate.date(format.join(' ').trim(), this.value) : '';
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

		if (commonStore.cellId) {
			$(`#${commonStore.cellId}`).addClass('isEditing');
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
		const { relation } = this.props;

		if (relation.format == I.RelationType.LongText) {
			return;
		};

		if ([ I.RelationType.Url, I.RelationType.Phone, I.RelationType.Email ].includes(relation.format)) {
			menuStore.updateData('select', { disabled: !value });
		};

		this.setValue(value);

		if (this.isComposition) {
			return;
		};

		let ret = false;

		keyboard.shortcut('enter, escape', e, () => {
			e.preventDefault();

			this.save(value, () => {
				menuStore.closeAll(Constant.menuIds.cell);

				this.range = null;
				this.setEditing(false);
			});

			ret = true;
		});

		/*
		if (!ret) {
			window.clearTimeout(this.timeout);
			this.timeout = window.setTimeout(() => this.save(value), Constant.delay.keyboard);
		};
		*/
	};

	onKeyUpDate (e: any, value: any) {
		this.setValue(this.fixDateValue(value));

		if (this.value) {
			menuStore.updateData(MENU_ID, { value: this.value });
		};

		if (this.isComposition) {
			return;
		};

		let ret = false;

		keyboard.shortcut('enter', e, () => {
			e.preventDefault();
			this.save(this.value, () => menuStore.close(MENU_ID));

			ret = true;
		});

		if (!ret) {
			window.clearTimeout(this.timeout);
			this.timeout = window.setTimeout(() => this.save(this.value), Constant.delay.keyboard);
		};
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

		if (JSON.stringify(record[relation.relationKey]) === JSON.stringify(this.value)) {
			this.setEditing(false);
			return;
		};

		this.save(this.value, () => {
			if (!menuStore.isOpen(MENU_ID)) {
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
		return v ? UtilDate.parseDate(v, viewRelation.dateFormat) : null;
	};

	onIconSelect (icon: string) {
		const { recordId, getRecord } = this.props;
		const record = getRecord(recordId);

		UtilObject.setIcon(record.id, icon, '');
	};

	onIconUpload (objectId: string) {
		const { recordId, getRecord } = this.props;
		const record = getRecord(recordId);

		UtilObject.setIcon(record.id, '', objectId);
	};

	onCheckbox (e: any) {
		const { recordId, getRecord } = this.props;
		const record = getRecord(recordId);

		this.onBlur(e);
		UtilObject.setDone(record.id, !record.done, () => {
			if (this._isMounted) {
				this.forceUpdate();
			};
		});
	};

	onCompositionStart () {
		this.isComposition = true;
	};

	onCompositionEnd () {
		this.isComposition = false;
	};

});

export default CellText;
