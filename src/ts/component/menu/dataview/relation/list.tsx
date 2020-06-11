import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon, Switch } from 'ts/component';
import { I, C } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';
import arrayMove from 'array-move';

interface Props extends I.Menu {};

const $ = require('jquery');

@observer
class MenuRelationList extends React.Component<Props, {}> {
	
	items: I.ViewRelation[] = [];
	
	constructor (props: any) {
		super(props);
		
		this.onAdd = this.onAdd.bind(this);
		this.onEdit = this.onEdit.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onSwitch = this.onSwitch.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { readOnly } = data;

		const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));
		
		const Item = SortableElement((item: any) => (
			<div id={'relation-' + item.id} className="item">
				<Handle />
				<span className="clickable" onClick={(e: any) => { this.onEdit(e, item.id); }}>
					<Icon className={'relation c-' + item.type} />
					<div className="name">{item.name}</div>
				</span>
				<Switch value={item.visible} className="green" onChange={(e: any, v: boolean) => { this.onSwitch(e, item.id, v); }} />
			</div>
		));
		
		const ItemAdd = SortableElement((item: any) => (
			<div id="relation-add" className="item add" onClick={this.onAdd}>
				<Icon className="dnd" />
				<Icon className="plus" />
				<div className="name">New relation</div>
			</div>
		));
		
		const List = SortableContainer((item: any) => {
			return (
				<div className="items">
					{this.items.map((item: any, i: number) => (
						<Item key={item.id} {...item} index={i} />
					))}
					{!readOnly ? <ItemAdd index={this.items.length + 1} disabled={true} /> : ''}
				</div>
			);
		});
		
		return (
			<List 
				axis="y" 
				lockAxis="y"
				lockToContainerEdges={true}
				transitionDuration={150}
				distance={10}
				onSortEnd={this.onSortEnd}
				useDragHandle={true}
				helperClass="dragging"
				helperContainer={() => { return $(ReactDOM.findDOMNode(this)).get(0); }}
			/>
		);
	};
	
	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { view } = data;
		
		this.items = view.relations;
		this.forceUpdate();
	};

	componentDidUpdate () {
		this.props.position();
	};

	componentWillUnmount () {
		this.save();
	};
	
	onAdd (e: any) {
		const { param } = this.props;
		const { data } = param;
		
		commonStore.menuOpen('dataviewRelationEdit', { 
			type: I.MenuType.Vertical,
			element: '#relation-add',
			offsetX: 8,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			data: data
		});
	};
	
	onEdit (e: any, id: string) {
		const { param } = this.props;
		const { data } = param;
		const { readOnly } = data;

		if (readOnly) {
			return;
		};
		
		commonStore.menuOpen('dataviewRelationEdit', { 
			type: I.MenuType.Vertical,
			element: '#relation-' + id,
			offsetX: 0,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Center,
			data: {
				...data,
				relationId: id,
			}
		});
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		
		this.items = arrayMove(this.items, oldIndex, newIndex);
		this.forceUpdate();
		this.save();
	};

	onSwitch (e: any, id: string, v: boolean) {
		const item = this.items.find((it: any) => { return it.id == id; });
		if (item) {
			item.visible = v;
			this.save();
		};
	};

	save () {
		const { param } = this.props;
		const { data } = param;
		const { view, rootId, blockId, onSave } = data;

		C.BlockSetDataviewView(rootId, blockId, view.id, { ...view, relations: this.items }, onSave);
	};
	
};

export default MenuRelationList;