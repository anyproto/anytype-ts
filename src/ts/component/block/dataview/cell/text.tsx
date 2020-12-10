import * as React from 'react';
import { I, Util, DataUtil, keyboard } from 'ts/lib';
import { Icon, Smile, Input, IconObject } from 'ts/component';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Cell {};

interface State { 
	editing: boolean; 
};

const $ = require('jquery');
const Constant = require('json/constant.json');
const MENU_ID = 'dataviewCalendar';

@observer
class CellText extends React.Component<Props, State> {

	state = {
		editing: false,
	};
	ref: any = null;

	constructor (props: any) {
		super(props);

		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onKeyUpDate = this.onKeyUpDate.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
	};

	render () {
		const { editing } = this.state;
		const { index, relation, viewType, getRecord, canEdit } = this.props;
		const record = getRecord(index);
		if (!record) {
			return null;
		};

		const type = DataUtil.schemaField(record.type);

		let Name = null;
		let EditorComponent = null;
		let value = String(record[relation.relationKey] || '');

		if (editing) {
			if (relation.format == I.RelationType.Description) {
				value = value.replace(/\n/g, '<br/>');
				EditorComponent = (item: any) => (
					<span dangerouslySetInnerHTML={{ __html: value }} />
				);
			} else 
			if (relation.format == I.RelationType.Date) {
				let mask = [ '99.99.9999' ];
				let placeHolder = [ 'dd.mm.yyyy' ];
				if (relation.includeTime) {
					mask.push('99:99');
					placeHolder.push('hh:mm');
				};
				EditorComponent = (item: any) => (
					<Input 
						ref={(ref: any) => { this.ref = ref; }} 
						id="input" 
						{...item} 
						mask={mask.join(' ')} 
						placeHolder={placeHolder.join(' ')} 
						onKeyUp={this.onKeyUpDate} 
					/>
				);
			} else {
				EditorComponent = (item: any) => (
					<Input ref={(ref: any) => { this.ref = ref; }} id="input" {...item} />
				);
			};
			Name = (item: any) => (
				<EditorComponent 
					value={item.name} 
					className="name" 
					onKeyDown={this.onKeyDown} 
					onKeyUp={this.onKeyUp} 
					onFocus={this.onFocus} 
					onBlur={this.onBlur}
				/>
			);
		} else {
			value = value.replace(/\n/g, '<br/>');

			Name = (item: any) => (
				<div className="name" dangerouslySetInnerHTML={{ __html: item.name }} />
			);

			if (relation.format == I.RelationType.Date) {
				let format = [ DataUtil.dateFormat(relation.dateFormat) ];
				if (relation.includeTime) {
					format.push(DataUtil.timeFormat(relation.timeFormat));
				};

				value = value ? Util.date(format.join(' '), Number(value)) : '';
			};
		};

		let content: any = null;

		if (relation.relationKey == 'name') {
			let cn = 'c20';
			let size = 18;

			switch (viewType) {
				case I.ViewType.List:
					cn = 'c24';
					break;

				case I.ViewType.Gallery:
				case I.ViewType.Board:
					cn = 'c48';
					size = 24;
					break;
			};

			if (viewType != I.ViewType.Grid) {
				value = value || Constant.default.name;
			};

			content = (
				<React.Fragment>
					<IconObject 
						id={[ relation.relationKey, record.id ].join('-')} 
						onSelect={this.onSelect} 
						onUpload={this.onUpload}
						className={cn} 
						size={size} 
						canEdit={canEdit} 
						offsetY={4} 
						object={record} 
					/>
					<Name name={value} />
					<Icon className="expand" onClick={(e: any) => { DataUtil.dataviewOpen(e, record, type); }} />
				</React.Fragment>
			);
		} else 
		if (editing) {
			content = <Name name={value} />;
		} else {
			content = <span className="name" dangerouslySetInnerHTML={{ __html: value }} />;
		};

		return content;
	};

	componentDidUpdate () {
		const { editing } = this.state;
		const { id, relation, index, getRecord } = this.props;
		const cell = $('#' + id);
		const record = getRecord(index);

		if (editing) {
			let value = String(record[relation.relationKey] || '');
			let input = cell.find('#input');

			if (relation.format == I.RelationType.Date) {
				let format = [ 'd.m.Y', (relation.includeTime ? 'H:i' : '') ];
				value = value ? Util.date(format.join(' ').trim(), Number(value)) : '';
			};

			if (this.ref) {
				this.ref.focus();
				this.ref.setValue(value);
			};

			if (input.length) {
				let length = value.length;
				input.get(0).setSelectionRange(length, length);
			};

			cell.addClass('isEditing');
		} else {
			cell.removeClass('isEditing');
		};
	};

	setEditing (v: boolean) {
		const { canEdit } = this.props;
		const { editing } = this.state;

		if (canEdit && (v != editing)) {
			this.setState({ editing: v });
		};
	};

	onKeyDown (e: any, value: string) {
	};

	onKeyUp (e: any, value: string) {
		const { relation, onChange } = this.props;

		if (relation.format == I.RelationType.Description) {
			return;
		};

		keyboard.shortcut('enter', e, (pressed: string) => {
			e.preventDefault();

			commonStore.menuCloseAll();
			this.setState({ editing: false });

			if (onChange) {
				onChange(value);
			};
		});
	};

	onKeyUpDate (e: any, value: any) {
		const { onChange } = this.props;
		const { menus } = commonStore;
		const menu = menus.find((item: I.Menu) => { return item.id == MENU_ID; });

		value = Util.parseDate(String(value || '').replace(/_/g, ''));
		menu.param.data.value = value;

		commonStore.menuUpdate(MENU_ID, menu.param);

		keyboard.shortcut('enter', e, (pressed: string) => {
			e.preventDefault();
			commonStore.menuClose(MENU_ID);

			if (onChange) {
				onChange(value);
			};
		});
	};

	onFocus (e: any) {
		keyboard.setFocus(true);
	};

	onBlur (e: any) {
		let { relation, onChange } = this.props;
		let value = this.ref.getValue();

		if (value && (relation.format == I.RelationType.Date)) {
			value = Util.parseDate(value);
		};

		keyboard.setFocus(false);
		if (!commonStore.menuIsOpen(MENU_ID)) {
			this.setState({ editing: false });
		};

		if (onChange) {
			onChange(value);
		};
	};

	onSelect (icon: string) {
		const { index, getRecord } = this.props;
		const record = getRecord(index);

		DataUtil.pageSetIcon(record.id, icon, '');
	};

	onUpload (hash: string) {
		const { index, getRecord } = this.props;
		const record = getRecord(index);

		DataUtil.pageSetIcon(record.id, '', hash);
	};

};

export default CellText;