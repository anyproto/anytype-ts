import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Tag } from 'ts/component';
import { I, C, keyboard, DataUtil, Util } from 'ts/lib';
import { commonStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import { setRange } from 'selection-ranges';
import { DraggableArea } from 'react-draggable-tags';

interface Props extends I.Cell {};
interface State { 
	editing: boolean; 
};

const MENU_ID = 'dataviewOptionList';
const $ = require('jquery');

@observer
class CellSelect extends React.Component<Props, State> {

	_isMounted: boolean = false;
	state = {
		editing: false,
	};

	constructor (props: any) {
		super(props);
	
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
	};

	render () {
		const { index, relation, readOnly, data } = this.props;
		const { editing } = this.state;
		
		let value: any = data[index][relation.key];
		if (!value || ('object' != typeof(value))) {
			value = [];
		};

		value = value.map((text: string, i: number) => {
			const option = (relation.selectDict || []).find((it: any) => { return it.id == text; });
			return option ? option : null;
		});
		value = value.filter((it: any) => { return it && it.id && it.text; });

		const render = ({ tag, index }) => {
			return <Tag {...tag} key={index} canEdit={editing} onRemove={(e: any) => { this.onRemove(e, tag.id); }} />;
		};

		return (
			<div>
				{!readOnly ? (
					<React.Fragment>
						<DraggableArea
							tags={value}
							render={render}
							onChange={(value: any[]) => { this.onSort(value); }}
						/>
						<div className="filter tagItem">
							<div 
								id="filter" 
								contentEditable={!readOnly} 
								suppressContentEditableWarning={true} 
								onKeyDown={this.onKeyDown} 
								onKeyUp={this.onKeyUp}
								onFocus={this.onFocus} 
								onBlur={this.onBlur}
							/>
							<div id="placeHolder">Find an option</div>
						</div>
					</React.Fragment>
				) : (
					<React.Fragment>
						{value.map((item: any, i: number) => {
							return render({ tag: item, index: i });
						})}
					</React.Fragment>
				)}
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.placeHolderCheck();
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	componentDidUpdate () {
		const { editing } = this.state;
		const { id, relation } = this.props;
		const cellId = DataUtil.cellId('cell', relation.key, id);
		const cell = $('#' + cellId);

		if (editing) {
			cell.addClass('isEditing');
			this.focus();
		} else {
			cell.removeClass('isEditing');
		};

		this.placeHolderCheck();
	};

	setEditing (v: boolean) {
		const { viewType, readOnly } = this.props;
		const { editing } = this.state;
		const canEdit = !readOnly && (viewType == I.ViewType.Grid);

		if (canEdit && (v != editing)) {
			this.setState({ editing: v });
		};
	};

	onClick () {
		this.focus();
	};

	onChange (value: string[]) {
		this.focus();
	};

	onSort (value: any[]) {
		this.setValue(value.map((it: any) => { return it.text; }), '');
	};

	focus () {
		const node = $(ReactDOM.findDOMNode(this));
		const filter = node.find('#filter');
		const length = filter.text().length;

		filter.focus();
		setRange(filter.get(0), { start: length, end: length });
	};

	onFocus () {
		keyboard.setFocus(true);
	};

	onBlur () {
		keyboard.setFocus(false);
	};

	placeHolderCheck () {
		if (!this._isMounted) {
			return;
		};

		const { relation, index, data, readOnly } = this.props;
		
		if (readOnly) {
			this.placeHolderHide();
			return;
		};

		const value = data[index][relation.key] || [];
		const node = $(ReactDOM.findDOMNode(this));
		const text = node.find('#filter').text();

		text.length || value.length ? this.placeHolderHide() : this.placeHolderShow();			
	};

	placeHolderHide () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		node.find('#placeHolder').hide();
	};
	
	placeHolderShow () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		node.find('#placeHolder').show();
	};

	onKeyDown (e: any) {
		const { relation, block, index, data } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const filter = node.find('#filter');
		const value = data[index][relation.key] || [];
		const length = filter.text().length;

		keyboard.shortcut('enter', e, (pressed: string) => {
			e.preventDefault();

			this.setValue(value, filter.text());
			filter.html('');
		});

		keyboard.shortcut('backspace', e, (pressed: string) => {
			if (length || !value.length) {
				return;
			};

			this.remove(value[value.length - 1]);
		});
	};

	onKeyUp (e: any) {
		const { relation, block, index, data } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const filter = node.find('#filter');
		const value = data[index][relation.key] || [];
		const { menus } = commonStore;
		const menu = menus.find((item: I.Menu) => { return item.id == MENU_ID; });

		keyboard.shortcut('enter', e, (pressed: string) => {
			e.preventDefault();

			this.setValue(value, filter.text());
			filter.html('');
		});

		if (menu) {
			menu.param.data.filter = filter.text();
			commonStore.menuUpdate(MENU_ID, menu.param);
		};

		this.placeHolderCheck();
	};

	onRemove (e: any, text: string) {
		this.remove(text);
	};

	remove (text: string) {
		const { relation, block, index } = this.props;
		const data = dbStore.getData(block.id);
		
		let value = data[index][relation.key] || [];
		value = value.filter((it: string) => { return it != text });
		this.setValue(value, '');
	};

	setValue (value: string[], text: string) {
		const { rootId, block, relation, onChange } = this.props;
		const { menus } = commonStore;
		const menu = menus.find((item: I.Menu) => { return item.id == MENU_ID; });
		const colors = DataUtil.menuGetBgColors();
		
		text = String(text || '').trim();
		value = value && ('object' == typeof(value)) ? value : [];

		if (!text) {
			return;
		};

		let option = relation.selectDict.find((it: I.SelectOption) => { return it.text == text; });
		let cb = () => {
			value.push(option.id);
			value = Util.arrayUnique(value);
	
			onChange(value);
			console.log('SET', value);

			console.log(onChange);
	
			if (menu) {
				menu.param.data.value = value;
				menu.param.data.relation = observable.box(relation);
				commonStore.menuUpdate(MENU_ID, menu.param);
			};
		}

		if (option) {
			cb();
		} else {
			option = { 
				id: '',
				text: text, 
				color: colors[Util.rand(0, colors.length - 1)].value, 
			};
	
			C.BlockDataviewRelationSelectOptionAdd(rootId, block.id, relation.key, option, (message: any) => {
				if (!message.option) {
					return;
				};
	
				relation.selectDict.push(message.option);
				cb();
			});
		};
	};

};

export default CellSelect;