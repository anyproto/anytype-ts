import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon, Select } from 'ts/component';
import { I, C } from 'ts/lib';
import arrayMove from 'array-move';

const $ = require('jquery');

interface Props extends I.Menu {};
interface State {
	items: any[];
};

class MenuSort extends React.Component<Props, State> {
	
	state = {
		items: [] as any[]
	};
	
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
		
		const { items } = this.state;
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
				<div className="name">Add a sort</div>
			</div>
		));
		
		const List = SortableContainer((item: any) => {
			return (
				<div className="items">
					{items.map((item: any, i: number) => (
						<Item key={i} {...item} id={i} index={i} />
					))}
					<ItemAdd index={items.length + 1} disabled={true} />
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
		
		this.setState({ items: view.sorts });
	};

	componentDidUpdate () {
		this.props.position();
	};

	componentWillUnmount () {
		const { items } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { view, rootId, blockId } = data;

		C.BlockSetDataviewView(rootId, blockId, view.id, { sorts: items });
	};
	
	onAdd (e: any) {
		let { items } = this.state;
		
		items.push({ relationId: '', sort: I.SortType.Asc });
		this.setState({ items: items });
	};

	onChange (id: number, k: string, v: string) {
		const { items } = this.state;

		let item = items.find((item: any, i: number) => { return i == id; });
		item[k] = v;

		this.setState({ items: items });
	};
	
	onDelete (e: any, id: number) {
		const { items } = this.state;

		this.setState({ items: items.filter((item: any, i: number) => { return i != id; }) });
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		
		this.setState({ items: arrayMove(this.state.items, oldIndex, newIndex) });
	};
	
};

export default MenuSort;