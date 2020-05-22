import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { Icon, Switch, Select } from 'ts/component';
import { I } from 'ts/lib';
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
	
	constructor (props: any) {
		super(props);
		
		this.onAdd = this.onAdd.bind(this);
		this.onDelete = this.onDelete.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { properties } = data;
		
		const { items } = this.state;
		const conditionOptions = [
			{ id: String(I.FilterOperator.And), name: 'And' },
			{ id: String(I.FilterOperator.Or), name: 'Or' },
		];
		
		const equalityOptions = [
			{ id: String(I.FilterCondition.Equal), name: 'Is equal' },
			{ id: String(I.FilterCondition.NotEqual), name: 'Is not equal' },
			{ id: String(I.FilterCondition.In), name: 'Contains' },
			{ id: String(I.FilterCondition.NotIn), name: 'Doesn\'t contain' },
			{ id: String(I.FilterCondition.Greater), name: 'Is greater' },
			{ id: String(I.FilterCondition.Less), name: 'Is less' },
			{ id: String(I.FilterCondition.Like), name: 'Matches' },
			{ id: String(I.FilterCondition.NotLike), name: 'Doesn\'t match' },
		];
		
		let propertyOptions: any[] = [];
		for (let property of properties) {
			propertyOptions.push({ id: property.id, name: property.name, icon: 'property dark c' + property.type });
		};
		
		const Item = SortableElement((item: any) => (
			<div className="item">
				<Icon className="dnd" />
				{item.idx > 0 ? <Select id={[ 'filter', 'condition', item.id ].join('-')} options={conditionOptions} value={String(item.condition)} /> : ''}
				<Select id={[ 'filter', 'property', item.id ].join('-')} options={propertyOptions} value={item.propertyId} />
				<Select id={[ 'filter', 'equality', item.id ].join('-')} options={equalityOptions} value={String(item.equality)} />
				<Icon className="delete" onClick={(e: any) => { this.onDelete(e, item.id); }} />
			</div>
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
				transitionDuration={150}
				distance={10}
				onSortEnd={this.onSortEnd}
				helperClass="dragging"
				helperContainer={() => { return $(ReactDOM.findDOMNode(this)).get(0); }}
			/>
		);
	};
	
	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { filters } = data;
		
		this.setState({ items: filters });
	};
	
	onAdd (e: any) {
		let { items } = this.state;
		
		items.push({ propertyId: '', sort: I.SortType.Asc });
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

export default MenuFilter;