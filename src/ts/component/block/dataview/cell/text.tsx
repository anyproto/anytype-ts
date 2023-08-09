import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, UtilCommon, UtilData, UtilObject, keyboard, translate, Relation } from 'Lib';
import { Input, IconObject } from 'Component';
import { commonStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

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

	constructor (props: I.Cell) {
		super(props);

		this.onKeyUp = this.onKeyUp.bind(this);
		this.onKeyUpDate = this.onKeyUpDate.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onIconSelect = this.onIconSelect.bind(this);
		this.onIconUpload = this.onIconUpload.bind(this);
		this.onCheckbox = this.onCheckbox.bind(this);
	};

	render () {
		const { isEditing } = this.state;
		const { recordId, relation, getView, getRecord, textLimit, isInline, iconSize, placeholder, shortUrl } = this.props;
		const record = getRecord(recordId);
		
		if (!record) {
			return null;
		};

		let view = null;
		let viewRelation: any = {};

		if (getView) {
			view = getView();
			viewRelation = view.getRelation(relation.relationKey);
		};

		let Name = null;
		let EditorComponent = null;
		let value = record[relation.relationKey];

		if ([ I.RelationType.Date, I.RelationType.Number ].includes(relation.format)) {
			value = Relation.formatValue(relation, record[relation.relationKey], true);
			if (relation.format == I.RelationType.Number) {
				value = value === null ? null : String(value);
			};
		} else {
			value = String(value || '');
		};

		if (relation.format == I.RelationType.LongText) {
			value = value.replace(/\n/g, !isEditing && isInline ? ' ' : '<br/>');
		};

		if (isEditing) {
			if (relation.format == I.RelationType.LongText) {
				EditorComponent = (item: any) => (
					<span dangerouslySetInnerHTML={{ __html: value }} />
				);
			} else 
			if (relation.format == I.RelationType.Date) {
				let mask = [ '99.99.9999' ];
				let ph = [];

				if (viewRelation.dateFormat == I.DateFormat.ShortUS) {
					ph.push('mm.dd.yyyy');
				} else {
					ph.push('dd.mm.yyyy');
				};
				
				if (viewRelation.includeTime) {
					mask.push('99:99');
					ph.push('hh:mm');
				};

				let maskOptions = {
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
						onSelect={this.onSelect}
					/>
				);
			} else {
				EditorComponent = (item: any) => (
					<Input 
						ref={ref => this.ref = ref} 
						id="input" 
						{...item} 
						placeholder={placeholder || translate(`placeholderCell${relation.format}`)}
						onSelect={this.onSelect}
					/>
				);
			};

			Name = (item: any) => (
				<EditorComponent 
					value={item.name} 
					className="name" 
					onKeyUp={this.onKeyUp} 
					onFocus={this.onFocus} 
					onBlur={this.onBlur}
				/>
			);
		} else {
			Name = (item: any) => {
				let name = item.name;
				if (name) {
					if (textLimit) {
						name = UtilCommon.shorten(name, textLimit);
					};
					return <div className="name" dangerouslySetInnerHTML={{ __html: name }} />;
				} else {
					return (
						<div className="empty">
							{placeholder || translate(`placeholderCell${relation.format}`)}
						</div>
					);
				};
			};

			if (relation.format == I.RelationType.Date) {
				if (value !== null) {
					value = Number(value) || 0;

					const day = UtilCommon.dayString(value);
					const date = day ? day : UtilCommon.date(UtilData.dateFormat(viewRelation.dateFormat), value);
					const time = UtilCommon.date(UtilData.timeFormat(viewRelation.timeFormat), value);
					
					value = viewRelation.includeTime ? [ date, time ].join((day ? ', ' : ' ')) : date;
				} else {
					value = '';
				};
			};

			if ((relation.format == I.RelationType.Url) && shortUrl) {
				value = value !== null ? UtilCommon.shortUrl(value) : '';
			};

			if (relation.format == I.RelationType.Number) {
				if (value !== null) {
					let mapped = Relation.mapValue(relation, value);
					if (mapped !== null) {
						value = mapped;
					} else {
						value = UtilCommon.formatNumber(value);
					};
				} else {
					value = '';
				};
			};
		};

		let icon = null;
		if (relation.relationKey == 'name') {
			if (!view || (view && !view.hideIcon)) {
				icon = (
					<IconObject 
						id={[ relation.relationKey, record.id ].join('-')} 
						onSelect={this.onIconSelect} 
						onUpload={this.onIconUpload}
						onCheckbox={this.onCheckbox}
						size={iconSize} 
						canEdit={!record.isReadonly} 
						offsetY={4} 
						object={record} 
						noClick={true}
					/>
				);
			};

			value = value || UtilObject.defaultName('Page');
			if (record.layout == I.ObjectLayout.Note) {
				value = record.snippet || `<span class="emptyText">${translate('commonEmpty')}</span>`;
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
		const { id, relation, recordId, viewType, cellPosition, getView, getRecord } = this.props;
		const cell = $(`#${id}`);
		const record = getRecord(recordId);

		this.setValue(Relation.formatValue(relation, record[relation.relationKey], true));

		let view = null;
		let viewRelation: any = {};
		let card = null;
		
		if (getView) {
			view = getView();
			viewRelation = view.getRelation(relation.relationKey);
		};

		if (viewType != I.ViewType.Grid) {
			card = $(`#record-${recordId}`);
		};

		if (isEditing) {
			let value = this.value;

			if (relation.format == I.RelationType.Date) {
				let format = [
					(viewRelation.dateFormat == I.DateFormat.ShortUS) ? 'm.d.Y' : 'd.m.Y'
				];
				if (viewRelation.includeTime) {
					format.push('H:i');
				};

				value = this.value !== null ? UtilCommon.date(format.join(' ').trim(), this.value) : '';
			};

			if (relation.format == I.RelationType.Number) {
				value = Relation.formatValue(relation, this.value, true);
				value = value === null ? null : String(value);
			};

			if (this.ref) {
				this.ref.setValue(value);
				if (this.ref.setRange) {
					let length = String(value || '').length;
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

	onKeyUp (e: any, value: string) {
		const { relation, onChange } = this.props;

		if (relation.format == I.RelationType.LongText) {
			return;
		};

		if ([ I.RelationType.Url, I.RelationType.Phone, I.RelationType.Email ].includes(relation.format)) {
			menuStore.updateData('select', { disabled: !value });
		};

		this.setValue(value);

		keyboard.shortcut('enter, escape', e, () => {
			e.preventDefault();

			if (onChange) {
				onChange(value, () => {
					menuStore.closeAll(Constant.menuIds.cell);

					this.range = null;
					this.setEditing(false);
				});
			};
		});
	};

	onKeyUpDate (e: any, value: any) {
		const { onChange } = this.props;

		this.setValue(this.fixDateValue(value));

		if (this.value) {
			menuStore.updateData(MENU_ID, { value: this.value });
		};

		keyboard.shortcut('enter', e, (pressed: string) => {
			e.preventDefault();

			if (onChange) {
				onChange(this.value, () => { menuStore.close(MENU_ID); });
			};
		});
	};

	onFocus (e: any) {
		keyboard.setFocus(true);
	};

	onBlur (e: any) {
		const { relation, onChange, recordId, getRecord } = this.props;
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

		if (onChange) {
			onChange(this.value, () => {
				if (!menuStore.isOpen(MENU_ID)) {
					this.setEditing(false);
				};
			});
		};
	};

	setValue (v: any) {
		this.value = v;
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
		return v ? UtilCommon.parseDate(v, viewRelation.dateFormat) : null;
	};

	onIconSelect (icon: string) {
		UtilObject.setIcon(this.props.recordId, icon, '');
	};

	onIconUpload (hash: string) {
		UtilObject.setIcon(this.props.recordId, '', hash);
	};

	onCheckbox () {
		const { recordId, getRecord } = this.props;
		const record = getRecord(recordId);

		UtilObject.setDone(recordId, !record.done, () => this.forceUpdate());
	};

});

export default CellText;