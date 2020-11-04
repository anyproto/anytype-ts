import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Tag } from 'ts/component';
import { I, keyboard, DataUtil, Util } from 'ts/lib';
import { commonStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import { setRange } from 'selection-ranges';
import { DraggableArea } from 'react-draggable-tags';

interface Props extends I.Cell {};
interface State { 
	editing: boolean; 
};

const $ = require('jquery');

@observer
class CellSelect extends React.Component<Props, State> {

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
		const { index, block, relation, readOnly } = this.props;
		const data = dbStore.getData(block.id);
		const rel = dbStore.getRelation(block.id, relation.key);
		
		let value = data[index][relation.key] || [];
		value = value.map((text: string, i: number) => {
			const option = true;
			/*
			const option = (rel.selectDict || []).find((it: any) => { return it.text == text; });
			if (!option) {
				return null;
			};
			*/
			return option ? { id: i, text: text } : null;
		});
		value = value.filter((it: any) => { return it; });

		const render = ({ tag }) => {
			return <Tag {...tag} canEdit={true} onRemove={(e: any) => { this.onRemove(e, tag.text); }} />;
		};

		return (
			<div>
				<DraggableArea
					tags={value}
					render={render}
					onChange={(value: any[]) => { this.onSort(value); }}
				/>
				<div 
					id="edit" 
					className="tagItem" 
					contentEditable={!readOnly} 
					suppressContentEditableWarning={true} 
					onKeyDown={this.onKeyDown} 
					onKeyUp={this.onKeyUp}
					onFocus={this.onFocus} 
					onBlur={this.onBlur}
				/>	
			</div>
		);
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
		const text = value.map((it: any) => { return it.text; });
		this.setValue(text, []);
	};

	focus () {
		const node = $(ReactDOM.findDOMNode(this));
		const edit = node.find('#edit');
		const length = edit.text().length;

		edit.focus();
		setRange(edit.get(0), { start: length, end: length });
	};

	onFocus () {
		keyboard.setFocus(true);
	};

	onBlur () {
		keyboard.setFocus(false);
	};

	onKeyDown (e: any) {
		const { relation, block, index } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const edit = node.find('#edit');
		const data = dbStore.getData(block.id);
		const value = data[index][relation.key] || [];
		const length = edit.text().length;

		keyboard.shortcut('enter', e, (pressed: string) => {
			e.preventDefault();

			this.setValue(value, edit.text().split(/\s/));
			edit.html('');
		});

		keyboard.shortcut('backspace', e, (pressed: string) => {
			if (length || !value.length) {
				return;
			};

			this.remove(value[value.length - 1]);
		});
	};

	onKeyUp (e: any) {
		const { relation, block, index } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const edit = node.find('#edit');
		const data = dbStore.getData(block.id);
		const value = data[index][relation.key] || [];

		keyboard.shortcut('enter', e, (pressed: string) => {
			e.preventDefault();

			this.setValue(value, edit.text().split(/\s/));
			edit.html('');
		});
	};

	onRemove (e: any, text: string) {
		this.remove(text);
	};

	remove (text: string) {
		const { relation, block, index } = this.props;
		const data = dbStore.getData(block.id);
		
		let value = data[index][relation.key] || [];
		value = value.filter((it: string) => { return it != text });
		this.setValue(value, []);
	};

	setValue (value: string[], text: string[]) {
		const { block, relation, onChange } = this.props;
		const { menus } = commonStore;
		const menu = menus.find((item: I.Menu) => { return item.id == 'dataviewOptionList'; });
		const colors = DataUtil.menuGetBgColors();

		text = text.map((it: string) => {
			return String(it || '').trim();
		});
		text = text.filter((it: string) => { return it; });
		text = value.concat(text);
		text = Util.arrayUnique(text);

		let options = text.map((it: string) => {
			const color = colors[Util.rand(0, colors.length - 1)];
			return { text: it, color: color.value };
		});

		options = relation.selectDict.concat(options);
		options = Util.arrayUniqueObjects(options, 'text');

		relation.selectDict = options;
		dbStore.relationUpdate(block.id, relation);

		if (menu) {
			menu.param.data.value = text;
			menu.param.data.relation = observable.box(relation);
			commonStore.menuUpdate('dataviewOptionList', menu.param);
		};

		onChange(text);
	};

};

export default CellSelect;