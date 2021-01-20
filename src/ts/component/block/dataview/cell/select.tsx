import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Tag } from 'ts/component';
import { I, C, keyboard, Util, DataUtil } from 'ts/lib';
import { commonStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';
import { observable } from 'mobx';

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
	
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
	};

	render () {
		const { rootId, block, getRecord, index } = this.props;
		const relation = dbStore.getRelation(rootId, block.id, this.props.relation.relationKey);
		const record = getRecord(index);

		if (!relation || !record) {
			return null;
		};

		let value: any = this.getValue();
		value = value.map((id: string, i: number) => { 
			return (relation.selectDict || []).find((it: any) => { return it.id == id; });
		});
		value = value.filter((it: any) => { return it && it.id; });

		return (
			<div className="wrap">
				<React.Fragment>
					{value.map((item: any, i: number) => {
						return <Tag {...item} key={item.id} className={DataUtil.tagClass(relation.format)} />;
					})}
				</React.Fragment>
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
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

		commonStore.menuUpdateData(MENU_ID, { filter: text });
	};

	onRemove (e: any, id: string) {
		e.preventDefault();
		e.stopPropagation();

		this.remove(id);
	};

	getValue () {
		const { relation, index, getRecord } = this.props;
		const record = getRecord(index);

		let value = record[relation.relationKey];
		if ('object' != typeof(value)) {
			value = value ? [ value ] : [];
		};
		return Util.objectCopy(value);
	};

	add (value: string[], text: string) {
		const { rootId, block, relation, onChange } = this.props;
		
		text = String(text || '').trim();
		if (!text) {
			return;
		};

		let option = relation.selectDict.find((it: I.SelectOption) => { return it.text == text; });
		let cb = () => {
			value.push(option.id);
			value = Util.arrayUnique(value);

			onChange(value);
			commonStore.menuUpdateData(MENU_ID, { 
				value: value, 
				relation: observable.box(relation),
			});
		};

		if (option) {
			cb();
		} else {
			option = { 
				id: '',
				text: text, 
				color: '', 
			};
	
			C.BlockDataviewRelationSelectOptionAdd(rootId, block.id, relation.relationKey, option, (message: any) => {
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

		commonStore.menuUpdateData(MENU_ID, { value: value });
		onChange(value);
	};

};

export default CellSelect;