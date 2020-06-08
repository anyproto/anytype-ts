import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon, Select, Input } from 'ts/component';
import { I, C } from 'ts/lib';
import arrayMove from 'array-move';

const $ = require('jquery');

interface Props extends I.Menu {};
interface State {
	items: any[];
};

class MenuFilter extends React.Component<Props, State> {
	
	state = {
		items: [] as any[]
	};
	refObj: any = {};
	
	constructor (props: any) {
		super(props);
		
		this.onAdd = this.onAdd.bind(this);
		this.onDelete = this.onDelete.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { view } = data;
		const { items } = this.state;

		const operatorOptions: I.Option[] = [
			{ id: String(I.FilterOperator.And), name: 'And' },
			{ id: String(I.FilterOperator.Or), name: 'Or' },
		];
		
		const conditionOptions: I.Option[] = [
			{ id: String(I.FilterCondition.Equal), name: 'Is equal' },
			{ id: String(I.FilterCondition.NotEqual), name: 'Is not equal' },
			{ id: String(I.FilterCondition.In), name: 'Contains' },
			{ id: String(I.FilterCondition.NotIn), name: 'Doesn\'t contain' },
			{ id: String(I.FilterCondition.Greater), name: 'Is greater' },
			{ id: String(I.FilterCondition.Less), name: 'Is less' },
			{ id: String(I.FilterCondition.Like), name: 'Matches' },
			{ id: String(I.FilterCondition.NotLike), name: 'Doesn\'t match' },
		];
		
		let relationOptions: I.Option[] = [];
		for (let relation of view.relations) {
			relationOptions.push({ id: relation.id, name: relation.name, icon: 'relation c-' + relation.type });
		};

		const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));
		
		const Item = SortableElement((item: any) => (
			<form className="item" onSubmit={(e: any) => { this.onSubmit(e, item); }}>
				<Handle />
				{item.idx > 0 ? <Select id={[ 'filter', 'operator', item.id ].join('-')} options={operatorOptions} value={item.operator} onChange={(v: string) => { this.onChange(item.id, 'operator', v); }} /> : ''}
				<Select id={[ 'filter', 'relation', item.id ].join('-')} className="relation" options={relationOptions} value={item.relationId} onChange={(v: string) => { this.onChange(item.id, 'relationId', v); }} />
				<Select id={[ 'filter', 'condition', item.id ].join('-')} options={conditionOptions} value={item.condition}  onChange={(v: string) => { this.onChange(item.id, 'condition', v); }} />
				<Input ref={(ref: any) => { this.refObj[item.idx] = ref; }} placeHolder="Value" />
				<Icon className="delete" onClick={(e: any) => { this.onDelete(e, item.id); }} />
			</form>
		));
		
		const ItemAdd = SortableElement((item: any) => (
			<div className="item add" onClick={this.onAdd}>
				<Icon className="dnd" />
				<Icon className="plus" />
				<div className="name">Add a filter</div>
			</div>
		));
		
		const List = SortableContainer((item: any) => {
			return (
				<div className="items">
					{items.map((item: any, i: number) => (
						<Item key={i} {...item} id={i} idx={i} index={i} />
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
		
		this.setState({ items: view.filters });
	};

	componentDidUpdate () {
		this.props.position();
	};

	componentWillUnmount () {
		const { items } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { view, rootId, blockId } = data;

		C.BlockSetDataviewView(rootId, blockId, view.id, { filters: items });
	};
	
	onAdd (e: any) {
		let { items } = this.state;
		
		items.push({ relationId: '', operator: I.FilterOperator.And, condition: I.FilterCondition.Equal });
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

	onSubmit (e: any, item: any) {
		e.preventDefault();

		console.log(item);
		console.log(this.refObj[item.idx].getValue());
	};
	
};

export default MenuFilter;