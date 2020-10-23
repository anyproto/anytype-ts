import * as React from 'react';
import { I, Util, DataUtil, keyboard } from 'ts/lib';
import { Icon, Smile, Input, Textarea } from 'ts/component';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Cell {};

interface State { 
	editing: boolean; 
};

const $ = require('jquery');
const raf = require('raf');
const Constant = require('json/constant.json');

@observer
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
		const { index, relation, view, onOpen, readOnly } = this.props;
		const data = this.props.data[index];

		let Name = null;
		let EditorComponent = null;
		let value = data[relation.key];

		if (editing) {
			if (relation.format == I.RelationType.Description) {
				EditorComponent = (item: any) => (
					<Textarea ref={(ref: any) => { this.ref = ref; }} id="input" {...item} />
				);
			} else 
			if (relation.format == I.RelationType.Date) {
				EditorComponent = (item: any) => (
					<Input ref={(ref: any) => { this.ref = ref; }} id="input" {...item} mask="99.99.9999" maskOptions={{ alias: 'datetime', inputFormat: 'dd.mm.yyyy' }} placeHolder="dd.mm.yyyy" onKeyUp={this.onKeyUpDate} />
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
			if (relation.format == I.RelationType.Description) {
				value = String(value || '').split('\n')[0];
			};
			if (relation.format == I.RelationType.Date) {
				value = value ? Util.date('M d Y', value) : '';
			};
			Name = (item: any) => (
				<div className="name">{item.name}</div>
			);
		};

		let content: any = <Name name={value} />;

		if (relation.key == 'name') {
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

			if (view.type != I.ViewType.Grid) {
				value = value || Constant.default.name;
			};

			content = (
				<React.Fragment>
					<Smile id={[ relation.key, data.id ].join('-')} icon={data.iconEmoji} hash={data.iconImage} className={cn} size={size} canEdit={!readOnly} offsetY={4} onSelect={this.onSelect} onUpload={this.onUpload} />
					<Name name={value} />
					<Icon className="expand" onClick={(e: any) => { onOpen(e, data); }} />
				</React.Fragment>
			);
		};

		return content;
	};

	componentDidUpdate () {
		const { editing } = this.state;
		const { id, relation, index } = this.props;
		const cellId = DataUtil.cellId('cell', relation.key, id);
		const cell = $('#' + cellId);
		const data = this.props.data[index];

		if (editing) {
			let value = String(data[relation.key] || '');
			if (relation.format == I.RelationType.Date) {
				value = value ? Util.date('d.m.Y', Number(value)) : '';
			};
			let length = value.length;

			cell.addClass('isEditing');
			this.ref.focus();
			this.ref.setValue(value);
			cell.find('#input').get(0).setSelectionRange(length, length);
		} else {
			cell.removeClass('isEditing');
			window.clearTimeout(this.timeoutMenu);
			commonStore.menuClose('select');
		};

		this.resize();
	};

	setEditing (v: boolean) {
		const { view, readOnly } = this.props;
		const { editing } = this.state;
		const canEdit = !readOnly && (view.type == I.ViewType.Grid);

		if (canEdit && (v != editing)) {
			this.setState({ editing: v });
		};
	};

	onKeyDown (e: any, value: string) {
		this.resize();
	};

	onKeyUp (e: any, value: string) {
		const { relation, onChange } = this.props;
		this.resize();

		if (relation.format != I.RelationType.Description) {
			keyboard.shortcut('enter', e, (pressed: string) => {
				e.preventDefault();

				commonStore.menuCloseAll();
				this.setState({ editing: false });

				if (onChange) {
					onChange(value);
				};
			});
		};
	};

	onKeyUpDate (e: any, value: any) {
		const { onChange } = this.props;
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

		if (value && (relation.format == I.RelationType.Date)) {
			value = this.parseDate(value);
		};

		keyboard.setFocus(false);
		if (!commonStore.menuIsOpen('dataviewCalendar')) {
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

		m = Math.min(12, Math.max(1, m));
		let maxDays = Constant.monthDays[m];
		if ((m == 2) && (y % 4 === 0)) {
			maxDays = 29;
		};
		d = Math.min(maxDays, Math.max(1, d));
		h = Math.min(24, Math.max(0, h));
		i = Math.min(60, Math.max(0, i));
		s = Math.min(60, Math.max(0, s));

		return Util.timestamp(y, m, d, h, i, s);
	};

	onSelect (icon: string) {
		const { index } = this.props;
		const data = this.props.data[index];

		DataUtil.pageSetIcon(data.id, icon, '');
	};

	onUpload (hash: string) {
		const { index } = this.props;
		const data = this.props.data[index];

		DataUtil.pageSetIcon(data.id, '', hash);
	};

	resize () {
		const { id, relation } = this.props;
		const { editing } = this.state;
		const cellId = DataUtil.cellId('cell', relation.key, id);
		const cell = $('#' + cellId);

		raf(() => {
			if (editing) {
				if (relation.format == I.RelationType.Description) {
					const input = cell.find('#input');
					input.css({ height: 'auto', overflow: 'visible' });

					const sh = input.get(0).scrollHeight;
					input.css({ height: Math.min(160, sh), overflow: 'auto' });
					input.scrollTop(sh);
				};
			};
		});
	};
	
};

export default CellText;