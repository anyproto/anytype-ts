import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon, Select } from 'ts/component';
import { I, C, DataUtil } from 'ts/lib';
import arrayMove from 'array-move';
import { commonStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const $ = require('jquery');

@observer
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
		const { rootId, blockId, getView } = data;
		const view = getView();
		const sortCnt = view.sorts.length;
		
		const typeOptions = [
			{ id: String(I.SortType.Asc), name: 'Ascending' },
			{ id: String(I.SortType.Desc), name: 'Descending' },
		];
		
		const relationOptions: any[] = view.relations.map((it: I.ViewRelation) => {
			const relation = dbStore.getRelation(rootId, blockId, it.relationKey);
			return { 
				id: relation.relationKey, 
				name: relation.name, 
				icon: 'relation c-' + DataUtil.relationClass(relation.format),
			};
		});

		const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));
		
		const Item = SortableElement((item: any) => (
			<div className="item">
				<Handle />
				<Select id={[ 'filter', 'relation', item.id ].join('-')} options={relationOptions} value={item.relationKey} onChange={(v: string) => { this.onChange(item.id, 'relationKey', v); }} />
				<Select id={[ 'filter', 'type', item.id ].join('-')} options={typeOptions} value={item.type} onChange={(v: string) => { this.onChange(item.id, 'type', v); }} />
				<Icon className="delete" onClick={(e: any) => { this.onDelete(e, item.id); }} />
			</div>
		));
		
		const ItemAdd = SortableElement((item: any) => (
			<div className="item add" onClick={this.onAdd}>
				<Icon className="plus" />
				<div className="name">New sort</div>
			</div>
		));
		
		const List = SortableContainer((item: any) => {
			return (
				<div className="items">
					{view.sorts.map((item: any, i: number) => (
						<Item key={i} {...item} id={i} index={i} />
					))}
					{!view.sorts.length ? (
						<div className="item empty">No sorts applied to this view</div>
					) : ''}
					<ItemAdd index={view.sorts.length + 1} disabled={true} />
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
				helperClass="isDragging"
				helperContainer={() => { return $(ReactDOM.findDOMNode(this)).get(0); }}
			/>
		);
	};
	
	componentDidUpdate () {
		this.props.position();
	};

	onAdd (e: any) {
		const { param } = this.props;
		const { data } = param;
		const { getView } = data;
		const view = getView();

		if (!view.relations.length) {
			return;
		};

		view.sorts.push({ 
			relationKey: view.relations[0].relationKey, 
			type: I.SortType.Asc 
		});
		this.save();
	};

	onChange (id: number, k: string, v: string) {
		const { param } = this.props;
		const { data } = param;
		const { getView } = data;
		const view = getView();

		let item = view.sorts.find((item: any, i: number) => { return i == id; });

		if (k == 'relationKey') {
			view.sorts = view.sorts.filter((it: I.Sort, i: number) => { return (i == id) || (it.relationKey != v); });
		};
		
		item[k] = v;
		this.save();
	};
	
	onDelete (e: any, id: number) {
		const { param } = this.props;
		const { data } = param;
		const { getView } = data;
		const view = getView();

		view.sorts = view.sorts.filter((item: any, i: number) => { return i != id; });
		this.save();

		commonStore.menuClose('select');
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		const { param } = this.props;
		const { data } = param;
		const { getView } = data;
		const view = getView();
		
		view.sorts = arrayMove(view.sorts, oldIndex, newIndex);
		this.save();
	};

	save () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, onSave, getView } = data;
		const view = getView();

		C.BlockDataviewViewUpdate(rootId, blockId, view.id, view, onSave);
	};
	
};

export default MenuSort;