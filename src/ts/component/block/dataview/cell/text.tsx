import * as React from 'react';
import { I, Util, DataUtil, keyboard, translate } from 'ts/lib';
import { Icon, Input, IconObject } from 'ts/component';
import { commonStore, menuStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Cell {}

interface State { 
	isEditing: boolean; 
}

const $ = require('jquery');
const raf = require('raf');
const Constant = require('json/constant.json');
const MENU_ID = 'dataviewCalendar';

const CellText = observer(class CellText extends React.Component<Props, State> {

	_isMounted: boolean = false;
	state = {
		isEditing: false,
	};
	range: any = null;
	ref: any = null;
	value: any = null;

	constructor (props: any) {
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
		const { index, relation, viewType, getView, getRecord, canEdit, isInline, iconSize, onParentClick, placeholder } = this.props;
		const record = getRecord(index);
		
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
			value = DataUtil.formatRelationValue(relation, record[relation.relationKey], true);
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
						ref={(ref: any) => { this.ref = ref; }} 
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
						ref={(ref: any) => { this.ref = ref; }} 
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
				if (item.name) {
					return <div className="name" dangerouslySetInnerHTML={{ __html: item.name }} />;
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

					const day = Util.day(value);
					const date = day ? day : Util.date(DataUtil.dateFormat(viewRelation.dateFormat), value);
					const time = Util.date(DataUtil.timeFormat(viewRelation.timeFormat), value);
					
					if (viewRelation.includeTime) {
						value = [ date, time ].join((day ? ', ' : ' '));
					} else {
						value = date;
					};
				} else {
					value = '';
				};
			};
		};

		let content: any = null;

		if (relation.relationKey == Constant.relationKey.name) {
			let size = iconSize;
			let is = undefined;

			switch (viewType) {
				case I.ViewType.Gallery:
				case I.ViewType.List:
					size = 24;
					break;

				case I.ViewType.Board:
					size = 48;
					if (record.layout == I.ObjectLayout.Task) {
						is = 24;
					};
					break;
			};

			value = value || DataUtil.defaultName('page');
			if (record.layout == I.ObjectLayout.Note) {
				value = record.snippet || '<span class="emptyText">Empty</span>';
			};

			content = (
				<React.Fragment>
					{!view || (view && !view.hideIcon) ? (
						<IconObject 
							id={[ relation.relationKey, record.id ].join('-')} 
							onSelect={this.onIconSelect} 
							onUpload={this.onIconUpload}
							onCheckbox={this.onCheckbox}
							size={size} 
							iconSize={is}
							canEdit={!record.isReadonly} 
							offsetY={4} 
							object={record} 
						/>
					) : ''}
					<Name name={value} />
					<Icon 
						className="edit" 
						onMouseDown={(e: any) => { 
							e.stopPropagation(); 
							onParentClick(e);
						}} 
					/>
				</React.Fragment>
			);
		} else {
			content = <Name name={value} />;
		};

		return content;
	};

	componentDidMount () {
		const { relation, index, getRecord } = this.props;
		const record = getRecord(index);

		this._isMounted = true;
		this.value = DataUtil.formatRelationValue(relation, record[relation.relationKey], true);
	};

	componentDidUpdate () {
		const { isEditing } = this.state;
		const { id, relation, cellPosition, getView } = this.props;
		const cell = $(`#${id}`);

		let view = null;
		let viewRelation: any = {};
		
		if (getView) {
			view = getView();
			viewRelation = view.getRelation(relation.relationKey);
		};

		if (isEditing) {
			let value = this.value;

			if (relation.format == I.RelationType.Date) {
				let format = [];
				if (viewRelation.dateFormat == I.DateFormat.ShortUS) {
					format.push('m.d.Y');
				} else {
					format.push('d.m.Y');
				};

				if (viewRelation.includeTime) {
					format.push('H:i');
				};

				value = this.value !== null ? Util.date(format.join(' ').trim(), this.value) : '';
			};

			if (relation.format == I.RelationType.Number) {
				value = DataUtil.formatRelationValue(relation, this.value, true);
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

			if (cellPosition) {
				cellPosition(id);
			};
		} else {
			cell.removeClass('isEditing');
			cell.find('.cellContent').css({ left: '', right: '' });
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
		this.value = v;
	};

	onKeyUp (e: any, value: string) {
		const { relation, onChange } = this.props;

		if (relation.format == I.RelationType.LongText) {
			return;
		};

		if ([ I.RelationType.Url, I.RelationType.Phone, I.RelationType.Email ].indexOf(relation.format) >= 0) {
			menuStore.updateData('button', { disabled: !value });
		};

		this.value = value;

		keyboard.shortcut('enter', e, (pressed: string) => {
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
		this.value = this.fixDateValue(value);

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
		let { relation, onChange, index, getRecord } = this.props;

		if (!this.ref || keyboard.isBlurDisabled) {
			return;
		};

		let value = this.ref.getValue();
		let record = getRecord(index);

		keyboard.setFocus(false);
		this.range = null;

		if (relation.format == I.RelationType.Date) {
			value = this.fixDateValue(value);
		} else 
		if (JSON.stringify(record[relation.relationKey]) === JSON.stringify(value)) {
			this.setEditing(false);
			return;
		};

		if (onChange) {
			onChange(value, () => {
				if (!menuStore.isOpen(MENU_ID)) {
					this.setEditing(false);
				};
			});
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
		return v ? Util.parseDate(v, viewRelation.dateFormat) : null;
	};

	onIconSelect (icon: string) {
		const { index, getRecord } = this.props;
		const record = getRecord(index);

		DataUtil.pageSetIcon(record.id, icon, '');
	};

	onIconUpload (hash: string) {
		const { index, getRecord } = this.props;
		const record = getRecord(index);

		DataUtil.pageSetIcon(record.id, '', hash);
	};

	onCheckbox () {
		const { index, getRecord, onCellChange } = this.props;
		const record = getRecord(index);

		console.log('onCheckbox');

		onCellChange(record.id, Constant.relationKey.done, !record.done);
	};

});

export default CellText;