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
		const { index, rootId, block, readOnly, data } = this.props;
		const { editing } = this.state;
		const relation = dbStore.getRelation(block.id, this.props.relation.key);
		const { selectDict } = relation

		let value: any = data[index][relation.key];
		if (!value || ('object' != typeof(value))) {
			value = [];
		};

		value = value.map((id: string, i: number) => {
			return { id: id };
		});
		value = value.filter((it: any) => { return it.id; });

		const render = ({ tag, index }) => {
			const option = (selectDict || []).find((it: any) => { return it.id == tag.id; });
			return option && option.text ? <Tag {...option} key={option.id} canEdit={editing} onRemove={(e: any) => { this.onRemove(e, option.id); }} /> : null;
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
		const node = $(ReactDOM.findDOMNode(this));
		const filter = node.find('#filter');

		filter.text('');
		this.focus();
		this.updateMenuFilter('');
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
		const text = filter.text();
		const value = data[index][relation.key] || [];

		keyboard.shortcut('enter', e, (pressed: string) => {
			e.preventDefault();

			this.setValue(value, text);
			filter.text('');
		});

		this.updateMenuFilter(text);
		this.placeHolderCheck();
	};

	onRemove (e: any, text: string) {
		this.remove(text);
	};

	updateMenuFilter (text: string) {
		const { menus } = commonStore;
		const menu = menus.find((item: I.Menu) => { return item.id == MENU_ID; });

		if (menu) {
			menu.param.data.filter = text;
			commonStore.menuUpdate(MENU_ID, menu.param);
		};
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
		value = Util.objectCopy(value);

		if (!text) {
			return;
		};

		let option = relation.selectDict.find((it: I.SelectOption) => { return it.text == text; });
		let cb = () => {
			value.push(option.id);
			value = Util.arrayUnique(value);

			onChange(value);
	
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
				
				option.id = message.option.id;
				relation.selectDict.push(message.option);
				cb();
			});
		};
	};

};

export default CellSelect;