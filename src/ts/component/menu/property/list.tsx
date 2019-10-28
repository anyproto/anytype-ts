import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { Icon, Switch } from 'ts/component';
import { I } from 'ts/lib';
import arrayMove from 'array-move';

const $ = require('jquery');

interface Props extends I.Menu {};
interface State {
	items: I.Property[];
};

class MenuPropertyList extends React.Component<Props, State> {
	
	state = {
		items: [] as I.Property[]
	};
	
	constructor (props: any) {
		super(props);
		
		this.onSortEnd = this.onSortEnd.bind(this);
	};
	
	render () {
		const { id } = this.props;
		const { items } = this.state;
		
		const Item = SortableElement((item: any) => (
			<div className="item">
				<Icon className="dnd" />
				<Icon className={'property dark c' + item.type} />
				<div className="name">{item.name}</div>
				<Switch className="green" />
			</div>
		));
		
		const ItemAdd = SortableElement((item: any) => (
			<div className="item add">
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
				pressDelay={50}
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
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		
		this.setState({ items: arrayMove(this.state.items, oldIndex, newIndex) });
	};
	
};

export default MenuPropertyList;