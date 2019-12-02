import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { Icon, Switch } from 'ts/component';
import { I } from 'ts/lib';
import { observer, inject } from 'mobx-react';
import arrayMove from 'array-move';

const $ = require('jquery');

interface Props extends I.Menu {
	commonStore?: any;
};
interface State {
	items: I.Property[];
};

@inject('commonStore')
@observer
class MenuPropertyList extends React.Component<Props, State> {
	
	state = {
		items: [] as I.Property[]
	};
	
	constructor (props: any) {
		super(props);
		
		this.onAdd = this.onAdd.bind(this);
		this.onEdit = this.onEdit.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
	};
	
	render () {
		const { items } = this.state;
		
		const Item = SortableElement((item: any) => (
			<div id={'property-' + item.id} className="item">
				<Icon className="dnd" />
				<span onClick={(e: any) => { this.onEdit(e, item.id); }}>
					<Icon className={'property dark c' + item.type} />
					<div className="name">{item.name}</div>
				</span>
				<Switch className="green" />
			</div>
		));
		
		const ItemAdd = SortableElement((item: any) => (
			<div id="property-add" className="item add" onClick={this.onAdd}>
				<Icon className="dnd" />
				<Icon className="plus" />
				<div className="name">New property</div>
			</div>
		));
		
		const List = SortableContainer((item: any) => {
			return (
				<div className="items">
					{items.map((item: any, i: number) => (
						<Item key={item.id} {...item} index={i} />
					))}
					<ItemAdd index={items.length + 1} disabled={true} />
				</div>
			);
		});
		
		return (
			<List 
				axis="y" 
				transitionDuration={150}
				pressDelay={60}
				onSortEnd={this.onSortEnd}
				helperClass="dragging"
				helperContainer={() => { return  $(ReactDOM.findDOMNode(this)).get(0); }}
			/>
		);
	};
	
	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { properties } = data;
		
		this.setState({ items: properties });
	};
	
	onAdd (e: any) {
		const { commonStore, param } = this.props;
		const { data } = param;
		const { properties } = data;
		
		commonStore.menuOpen('propertyEdit', { 
			element: 'property-add',
			offsetX: 8,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			data: {
				properties: properties,
				property: ''
			}
		});
	};
	
	onEdit (e: any, id: string) {
		const { commonStore, param } = this.props;
		const { data } = param;
		const { properties } = data;
		const property = properties.find((item: any) => { return item.id == id; });
		
		commonStore.menuOpen('dataviewPropertyEdit', { 
			element: 'property-' + id,
			offsetX: 0,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Center,
			data: {
				properties: properties,
				property: property
			}
		});
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		
		this.setState({ items: arrayMove(this.state.items, oldIndex, newIndex) });
	};
	
};

export default MenuPropertyList;