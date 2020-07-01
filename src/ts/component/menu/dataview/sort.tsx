import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon, Select } from 'ts/component';
import { I, C } from 'ts/lib';
import arrayMove from 'array-move';
import { commonStore } from 'ts/store';

interface Props extends I.Menu {};

const $ = require('jquery');

class MenuSort extends React.Component<Props, {}> {
	
	items: I.Sort[] = [];
	
	constructor (props: any) {
		super(props);
		
		this.onAdd = this.onAdd.bind(this);
		this.onDelete = this.onDelete.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { view } = data;
		
		const typeOptions = [
			{ id: String(I.SortType.Asc), name: 'From A to Z' },
			{ id: String(I.SortType.Desc), name: 'From Z to A' },
		];
		
		let relationOptions: any[] = [];
		for (let relation of view.relations) {
			relationOptions.push({ id: relation.id, name: relation.name, icon: 'relation c-' + relation.type });
		};

		const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));
		
		const Item = SortableElement((item: any) => (
			<div className="item">
				<Handle />
				<Select id={[ 'filter', 'relation', item.id ].join('-')} options={relationOptions} value={item.relationId} onChange={(v: string) => { this.onChange(item.id, 'relationId', v); }} />
				<Select id={[ 'filter', 'type', item.id ].join('-')} options={typeOptions} value={item.type} onChange={(v: string) => { this.onChange(item.id, 'type', v); }} />
				<Icon className="delete" onClick={(e: any) => { this.onDelete(e, item.id); }} />
			</div>
		));
		
		const ItemAdd = SortableElement((item: any) => (
			<div className="item add" onClick={this.onAdd}>
				<Icon className="dnd" />
				<Icon className="plus" />
				<div className="name">New sort</div>
			</div>
		));
		
		const List = SortableContainer((item: any) => {
			return (
				<div className="items">
					{this.items.map((item: any, i: number) => (
						<Item key={i} {...item} id={i} index={i} />
					))}
					{!this.items.length ? (
						<div className="item empty">No sorts applied to this view</div>
					) : ''}
					<ItemAdd index={this.items.length + 1} disabled={true} />
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
		
		this.items = view.sorts;
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
		const { view } = data;

		if (!view.relations.length) {
			return;
		};

		this.items.push({ 
			relationId: view.relations[0].id, 
			type: I.SortType.Asc 
		});
		this.forceUpdate();
		this.save();
	};

	onChange (id: number, k: string, v: string) {
		let item = this.items.find((item: any, i: number) => { return i == id; });
		
		if (k == 'type') {
			//v = Number(v) || 0;
		};

		item[k] = v;
		this.save();
	};
	
	onDelete (e: any, id: number) {
		this.items = this.items.filter((item: any, i: number) => { return i != id; });
		this.forceUpdate();
		this.save();

		commonStore.menuClose('select');
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		
		this.items = arrayMove(this.items, oldIndex, newIndex);
		this.forceUpdate();
		this.save();
	};

	save () {
		const { param } = this.props;
		const { data } = param;
		const { view, rootId, blockId, onSave } = data;

		C.BlockSetDataviewView(rootId, blockId, view.id, { ...view, sorts: this.items }, onSave);
	};
	
};

export default MenuSort;