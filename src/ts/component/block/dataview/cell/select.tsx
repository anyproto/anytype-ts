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
		const { block, readOnly, getRecord, index, viewType } = this.props;
		const { editing } = this.state;
		const relation = dbStore.getRelation(block.id, this.props.relation.key);
		const record = getRecord(index);

		if (!relation || !record) {
			return null;
		};

		const canEdit = !readOnly && !relation.isReadOnly && (viewType == I.ViewType.Grid);

		let value: any = this.getValue();
		value = value.map((id: string, i: number) => { 
			return (relation.selectDict || []).find((it: any) => { return it.id == id; });
		});
		value = value.filter((it: any) => { return it && it.id; });

		const render = ({ tag, index }) => {
			const option = (relation.selectDict || []).find((it: any) => { return it.id == tag.id; });
			return option && option.text ? <Tag {...option} key={option.id} canEdit={editing} onRemove={(e: any) => { this.onRemove(e, option.id); }} /> : null;
		};

		return (
			<div>
				{!canEdit ? (
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
		const { id } = this.props;
		const cell = $('#' + id);

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
		const { onChange } = this.props;
		onChange(value.map((it: any) => { return it.id; }));
	};

	focus () {
		const node = $(ReactDOM.findDOMNode(this));
		const filter = node.find('#filter');
		if (!filter.length) {
			return;
		};

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

		const { readOnly } = this.props;
		
		if (readOnly) {
			this.placeHolderHide();
			return;
		};

		const value = this.getValue();
		const node = $(ReactDOM.findDOMNode(this));
		const text = node.find('#filter').text();

		text.length || value.length ? this.placeHolderHide() : this.placeHolderShow();			
	};

	placeHolderHide () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		node.addClass('noPlaceholder');
	};
	
	placeHolderShow () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		node.removeClass('noPlaceholder');
	};

	onKeyDown (e: any) {
		const node = $(ReactDOM.findDOMNode(this));
		const filter = node.find('#filter');
		const value = this.getValue();
		const length = filter.text().length;

		keyboard.shortcut('enter', e, (pressed: string) => {
			e.preventDefault();

			this.add(value, filter.text());
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
		const node = $(ReactDOM.findDOMNode(this));
		const filter = node.find('#filter');
		const text = filter.text();
		const value = this.getValue();

		keyboard.shortcut('enter', e, (pressed: string) => {
			e.preventDefault();

			this.add(value, text);
			filter.text('');
		});

		this.updateMenuFilter(text);
		this.placeHolderCheck();
	};

	onRemove (e: any, id: string) {
		e.preventDefault();
		e.stopPropagation();

		this.remove(id);
	};

	updateMenuFilter (text: string) {
		const { menus } = commonStore;
		const menu = menus.find((item: I.Menu) => { return item.id == MENU_ID; });

		if (menu) {
			menu.param.data.filter = text;
			commonStore.menuUpdate(MENU_ID, menu.param);
		};
	};

	getValue () {
		const { relation, index, getRecord } = this.props;
		const record = getRecord(index);

		let value = record[relation.key];
		if (!value || ('object' != typeof(value))) {
			value = [];
		};
		return Util.objectCopy(value);
	};

	add (value: string[], text: string) {
		const { rootId, block, relation, onChange } = this.props;
		const { menus } = commonStore;
		const menu = menus.find((item: I.Menu) => { return item.id == MENU_ID; });
		
		text = String(text || '').trim();
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
		};

		if (option) {
			cb();
		} else {
			option = { 
				id: '',
				text: text, 
				color: '', 
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

	remove (id: string) {
		const { onChange } = this.props;

		let value = this.getValue();
		value = value.filter((it: string) => { return it != id; });
		value = Util.arrayUnique(value);

		onChange(value);
	};

};

export default CellSelect;