import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, Util, DataUtil, keyboard } from 'ts/lib';
import { Icon, Smile, Input, Textarea } from 'ts/component';
import { commonStore } from 'ts/store';

interface Props extends I.Cell {};

interface State { 
	editing: boolean; 
};

const $ = require('jquery');

class CellText extends React.Component<Props, State> {

	state = {
		editing: false,
	};
	ref: any = null;
	timeoutMenu: number = 0;

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
		const { data, relation, view, onOpen, readOnly } = this.props;

		let Name = null;
		let EditorComponent = null;
		let value = data[relation.id];

		if (editing) {
			if (relation.type == I.RelationType.Description) {
				EditorComponent = (item: any) => (
					<Textarea ref={(ref: any) => { this.ref = ref; }} id="textarea" {...item} />
				);
			} else 
			if (relation.type == I.RelationType.Date) {
				EditorComponent = (item: any) => (
					<Input ref={(ref: any) => { this.ref = ref; }} id="input" {...item} mask="99.99.9999" placeHolder="dd.mm.yyyy" onKeyUp={this.onKeyUpDate} />
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
			if (relation.type == I.RelationType.Date) {
				value = value ? Util.date('M d Y', value) : '';
			};
			Name = (item: any) => (
				<div className="name">{item.name}</div>
			);
		};

		let content: any = <Name name={value} />;

		if (relation.id == 'name') {
			let cn = 'c20';
			let size = 18;

			switch (view.type) {
				case I.ViewType.List:
					cn = 'c24';
					break;

				case I.ViewType.Gallery:
				case I.ViewType.Board:
					cn = 'c48';
					size = 24;
					break;
			};

			content = (
				<React.Fragment>
					<Smile id={[ relation.id, data.id ].join('-')} icon={data.iconEmoji} hash={data.iconImage} className={cn} size={size} canEdit={!readOnly} offsetY={4} onSelect={this.onSelect} onUpload={this.onUpload} />
					<Name name={value} />
					<Icon className="expand" onClick={(e: any) => { onOpen(e, data); }} />
				</React.Fragment>
			);
		};

		return content;
	};

	componentDidUpdate () {
		const { editing } = this.state;
		const { id, relation, data } = this.props;
		const cellId = DataUtil.cellId('cell', relation.id, id);
		const cell = $('#' + cellId);

		if (editing) {
			let value = data[relation.id];
			if (relation.type == I.RelationType.Date) {
				value = value ? Util.date('d.m.Y', value) : '';
			};

			cell.addClass('isEditing');
			this.ref.focus();
			this.ref.setValue(value);
		} else {
			cell.removeClass('isEditing');
			window.clearTimeout(this.timeoutMenu);
			commonStore.menuClose('select');
		};

		console.log('UPDATE');
		console.trace();

		this.resize();
	};

	setEditing (v: boolean) {
		const { view, readOnly } = this.props;
		const canEdit = !readOnly && (view.type == I.ViewType.Grid);

		if (canEdit) {
			this.setState({ editing: v });
		};
	};

	onKeyDown (e: any, value: string) {
		this.resize();
	};

	onKeyUp (e: any, value: string) {
		this.resize();
	};

	onKeyUpDate (e: any, value: any) {
		const { relation, onChange } = this.props;
		const { menus } = commonStore;
		const menu = menus.find((item: I.Popup) => { return item.id == 'dataviewCalendar'; });

		value = this.parseDate(String(value || '').replace(/_/g, ''));
		menu.param.data.value = value;

		commonStore.menuUpdate('dataviewCalendar', menu.param);

		keyboard.shortcut('enter', e, (pressed: string) => {
			e.preventDefault();
			commonStore.menuClose('dataviewCalendar');

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

		if (value && (relation.type == I.RelationType.Date)) {
			value = this.parseDate(value);
		};

		keyboard.setFocus(false);

		if (!commonStore.menuIsOpen()) {
			this.setState({ editing: false });
		};

		if (onChange) {
			onChange(value);
		};
	};

	parseDate (value: any) {
		let [ date, time ] = String(value || '').split(' ');
		let [ d, m, y ] = String(date || '').split('.').map((it: any) => { return Number(it) || 0; });
		let [ h, i, s ] = String(time || '').split(':').map((it: any) => { return Number(it) || 0; });

		return Util.timestamp(y, m, d, h, i, s);
	};

	onSelect (icon: string) {
		const { data } = this.props;
		DataUtil.pageSetIcon(data.id, icon, '');
	};

	onUpload (hash: string) {
		const { data } = this.props;
		DataUtil.pageSetIcon(data.id, '', hash);
	};

	resize () {
		const { id, relation } = this.props;
		const cellId = DataUtil.cellId('cell', relation.id, id);
		const cell = $('#' + cellId);
		const area = cell.find('#textarea');

		if (area.length) {
			area.css({ height: 'auto' });
			area.css({ height: area.get(0).scrollHeight });
		};
	};
	
};

export default CellText;