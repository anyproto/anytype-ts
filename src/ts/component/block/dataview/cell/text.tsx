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
		const { index, relation, onOpen, readOnly, viewType } = this.props;
		const data = this.props.data[index];
		const type = DataUtil.schemaField(data.type && data.type.length ? data.type[0] : '');

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
				let mask = [ '99.99.9999' ];
				let placeHolder = [ 'dd.mm.yyyy' ];
				if (relation.includeTime) {
					mask.push('99:99');
					placeHolder.push('hh:mm');
				};
				EditorComponent = (item: any) => (
					<Input 
						ref={(ref: any) => { this.ref = ref; }} 
						id="input" {...item} 
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
			Name = (item: any) => (
				<div className="name">{item.name}</div>
			);

			if (relation.format == I.RelationType.Description) {
				value = String(value || '').split('\n')[0];
			};

			if (relation.format == I.RelationType.Date) {
				let format = [ DataUtil.dateFormat(relation.dateFormat) ];
				if (relation.includeTime) {
					format.push(DataUtil.timeFormat(relation.timeFormat));
				};

				value = value ? Util.date(format.join(' '), value) : '';
			};
		};

		let content: any = <Name name={value} />;

		if (relation.key == 'name') {
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

			let icon = null;

			switch (type) {
				default:
					icon = <Smile id={[ relation.key, data.id ].join('-')} icon={data.iconEmoji} hash={data.iconImage} className={cn} size={size} canEdit={!readOnly} offsetY={4} onSelect={this.onSelect} onUpload={this.onUpload} />;
					break;

				case 'image':
					icon = <img src={commonStore.imageUrl(data.id, 20)} className="preview" />;
					break;

				case 'file':
					icon = <Icon className={[ 'file-type', Util.fileIcon(data) ].join(' ')} />;
					break;
			};

			content = (
				<React.Fragment>
					{icon}
					<Name name={value} />
					<Icon className="expand" onClick={(e: any) => { onOpen(e, data, type); }} />
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

			let input = cell.find('#input');
			let length = value.length;

			this.ref.focus();
			this.ref.setValue(value);

			cell.addClass('isEditing');

			if (input.length) {
				input.get(0).setSelectionRange(length, length);
			};
		} else {
			cell.removeClass('isEditing');
		};

		this.resize();
	};

	setEditing (v: boolean) {
		const { viewType, readOnly } = this.props;
		const { editing } = this.state;
		const canEdit = !readOnly && (viewType == I.ViewType.Grid);

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
					if (!input.length) {
						return;
					};

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