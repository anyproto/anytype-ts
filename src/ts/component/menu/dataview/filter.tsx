import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon, Select, Input } from 'ts/component';
import { I, C, Util } from 'ts/lib';
import arrayMove from 'array-move';

interface Props extends I.Menu {};

const $ = require('jquery');

class MenuFilter extends React.Component<Props, {}> {
	
	refObj: any = {};
	items: I.Filter[] = [] as I.Filter[];
	
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
				<Input ref={(ref: any) => { this.refObj[item.idx] = ref; }} value={item.value} placeHolder="Value" onKeyUp={(e: any) => { this.onSubmit(e, item); }} />
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
					{this.items.map((item: any, i: number) => (
						<Item key={i} {...item} id={i} idx={i} index={i} />
					))}
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
		
		this.items = view.filters;
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
			operator: I.FilterOperator.And, 
			condition: I.FilterCondition.Equal,
			value: '',
		});
		this.forceUpdate();
		this.save();
	};

	onChange (id: number, k: string, v: string) {
		let item = this.items.find((item: any, i: number) => { return i == id; });
		item[k] = v;
		this.save();
	};
	
	onDelete (e: any, id: number) {
		this.items = this.items.filter((item: any, i: number) => { return i != id; });
		this.forceUpdate();
		this.save();
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		
		this.items = arrayMove(this.items, oldIndex, newIndex);
		this.forceUpdate();
		this.save();
	};

	onSubmit (e: any, item: any) {
		e.preventDefault();

		this.items[item.idx].value = this.refObj[item.idx].getValue();
	};

	save () {
		const { param } = this.props;
		const { data } = param;
		const { view, rootId, blockId } = data;

		C.BlockSetDataviewView(rootId, blockId, view.id, { 
			type: view.type, 
			filters: this.items, 
		});
	};
	
};

export default MenuFilter;