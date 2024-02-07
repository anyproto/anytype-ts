import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, UtilCommon, UtilData, UtilObject, keyboard, translate, Relation, UtilDate } from 'Lib';
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
	isComposition = false;

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
		this.onCompositionStart = this.onCompositionStart.bind(this);
		this.onCompositionEnd = this.onCompositionEnd.bind(this);
	};

	render () {
		const { isEditing } = this.state;
		const { showRelativeDates } = commonStore;
		const { record, relation, getView, textLimit, isInline, iconSize, placeholder, shortUrl, canEdit } = this.props;
		
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
				EditorComponent = (item: any) => (
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
					const time = UtilDate.date(UtilData.timeFormat(viewRelation.timeFormat), value);
					
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
		const { relation, record } = this.props;

		this._isMounted = true;
		this.setValue(Relation.formatValue(relation, record[relation.relationKey], true));
	};

	componentDidUpdate () {
		const { isEditing } = this.state;
		const { id, relation, viewType, record, cellPosition, getView } = this.props;
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

		if (!this.isComposition) {
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
	};

	onKeyUpDate (e: any, value: any) {
		const { onChange } = this.props;

		this.setValue(this.fixDateValue(value));

		if (this.value) {
			menuStore.updateData(MENU_ID, { value: this.value });
		};

		if (!this.isComposition) {
			keyboard.shortcut('enter', e, () => {
				e.preventDefault();

				if (onChange) {
					onChange(this.value, () => menuStore.close(MENU_ID));
				};
			});
		};
	};

	onFocus (e: any) {
		keyboard.setFocus(true);
	};

	onBlur (e: any) {
		const { relation, record, onChange } = this.props;

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
		return v ? UtilDate.parseDate(v, viewRelation.dateFormat) : null;
	};

	onIconSelect (icon: string) {
		UtilObject.setIcon(this.props.record.id, icon, '');
	};

	onIconUpload (objectId: string) {
		UtilObject.setIcon(this.props.record.id, '', objectId);
	};

	onCheckbox () {
		const { record } = this.props;

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
