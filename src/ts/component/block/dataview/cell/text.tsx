import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C, Util, DataUtil, keyboard } from 'ts/lib';
import { Icon, Smile, Input, Textarea } from 'ts/component';
import { commonStore } from 'ts/store';
import { RelationType } from '../../../../interface';

interface Props extends I.Cell {};

interface State { 
	editing: boolean; 
};

const $ = require('jquery');
const Constant = require('json/constant.json');
const { ipcRenderer } = window.require('electron');

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
		this.onChange = this.onChange.bind(this);
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
		if (editing) {
			if (relation.type == I.RelationType.Description) {
				EditorComponent = (item: any) => (
					<Textarea ref={(ref: any) => { this.ref = ref; }} id="textarea" {...item} />
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
					onChange={this.onChange}
					onFocus={this.onFocus} 
					onBlur={this.onBlur}
				/>
			);
		} else {
			Name = (item: any) => (
				<div className="name">{item.name}</div>
			);
		};

		let content: any = <Name name={data[relation.id]} />;

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
					<Name name={data[relation.id]} />
					<Icon className="expand" onClick={(e: any) => { onOpen(e, data); }} />
				</React.Fragment>
			);
		};

		return (
			<div className="cellWrap">
				{content}
			</div>
		);
	};

	componentDidUpdate () {
		const { editing } = this.state;
		const { id, relation, data } = this.props;
		const cellId = DataUtil.cellId('cell', relation.id, id);
		const cell = $('#' + cellId);

		if (editing) {
			cell.addClass('isEditing');
			this.ref.focus();
			this.ref.setValue(data[relation.id]);
			this.showMenu();
		} else {
			cell.removeClass('isEditing');
			window.clearTimeout(this.timeoutMenu);
			commonStore.menuClose('select');
		};

		this.resize();
	};

	setEditing (v: boolean) {
		console.log(v);
		const { view, readOnly } = this.props;
		const canEdit = !readOnly && (view.type == I.ViewType.Grid);

		if (canEdit) {
			this.setState({ editing: v });
		};
	};

	showMenu () {
		const { id, relation, data } = this.props;
		if ([ I.RelationType.Url, I.RelationType.Email, I.RelationType.Phone ].indexOf(relation.type) < 0) {
			return;
		};

		const cellId = DataUtil.cellId('cell', relation.id, id);
		const cell = $('#' + cellId);
		const width = Math.max(cell.width(), Constant.size.dataview.cell.default);
		const value = this.ref.getValue();

		if (!value) {
			return;
		};

		window.clearTimeout(this.timeoutMenu);
		this.timeoutMenu = window.setTimeout(() => {
			commonStore.menuClose('select');
			commonStore.menuOpen('select', { 
				element: '#' + cellId,
				type: I.MenuType.Horizontal,
				offsetX: 0,
				offsetY: 4,
				width: width,
				vertical: I.MenuDirection.Bottom,
				horizontal: I.MenuDirection.Left,
				className: 'button',
				passThrough: true,
				data: {
					value: '',
					noKeys: true,
					options: [
						{ id: 'go', name: 'Go to' },
						{ id: 'copy', name: 'Copy' },
					],
					onSelect: (event: any, item: any) => {
						let scheme = '';
						if (relation.type == I.RelationType.Email) {
							scheme = 'mailto:';
						};
						if (relation.type == I.RelationType.Phone) {
							scheme = 'tel:';
						};

						if (item.id == 'go') {
							ipcRenderer.send('urlOpen', scheme + value);
						};

						if (item.id == 'copy') {
							Util.clipboardCopy({ text: value, html: value });
						};
					},
				}
			});
		}, Constant.delay.menu);
	};

	onKeyDown (e: any, value: string) {
		this.resize();
	};

	onKeyUp (e: any, value: string) {
		this.resize();
	};

	onChange (e: any, value: string) {
	};

	onFocus (e: any) {
		keyboard.setFocus(true);
	};

	onBlur (e: any) {
		let { onChange } = this.props;

		keyboard.setFocus(false);
		this.setState({ editing: false });

		if (onChange) {
			onChange(this.ref.getValue());
		};
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
		const node = $(ReactDOM.findDOMNode(this));
		const area = node.find('#textarea');

		if (area.length) {
			area.css({ height: 'auto' });
			area.css({ height: area.get(0).scrollHeight });
		};
	};
	
};

export default CellText;