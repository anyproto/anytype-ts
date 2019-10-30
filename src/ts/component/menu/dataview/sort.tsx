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
		const { properties } = data;
		
		const { items } = this.state;
		const typeOptions = [
			{ id: String(I.SortType.Asc), name: 'From A to Z' },
			{ id: String(I.SortType.Desc), name: 'From Z to A' },
		];
		
		let propertyOptions: any[] = [];
		for (let property of properties) {
			propertyOptions.push({ id: property.id, name: property.name, icon: 'property dark c' + property.type });
		};
		
		const Item = SortableElement((item: any) => (
			<div className="item">
				<Icon className="dnd" />
				<Select options={propertyOptions} value={item.propertyId} />
				<Select options={typeOptions} value={String(item.type)} />
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
				transitionDuration={150}
				pressDelay={50}
				onSortEnd={this.onSortEnd}
				helperClass="dragging"
				helperContainer={() => { return $(ReactDOM.findDOMNode(this)).get(0); }}
			/>
		);
	};
	
	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { sorts } = data;
		
		this.setState({ items: sorts });
	};
	
	onAdd (e: any) {
		let { items } = this.state;
		
		items.push({ propertyId: '', sort: I.SortType.Asc });
		this.setState({ items: items });
	};
	
	onDelete (e: any, id: number) {
		const { items } = this.state;

		this.setState({ items: items.filter((item: any, i: number) => { console.log(i, id); return i != id; }) });
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		
		this.setState({ items: arrayMove(this.state.items, oldIndex, newIndex) });
	};
	
};

export default MenuSort;