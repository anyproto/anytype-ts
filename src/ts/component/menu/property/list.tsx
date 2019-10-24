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
				<Icon className={'property c' + item.type} />
				<div className="name">{item.name}</div>
				<Switch />
			</div>
		));
		
		const List = SortableContainer((item: any) => {
			return (
				<div className="items">
					{items.map((item: any, i: number) => (
						<Item key={item.id} {...item} index={i} />
					))}
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
				helperContainer={() => { return $('#menuPropertyList').get(0); }}
			/>
		);
	};
	
	componentDidMount () {
		this.setState({ 
			items: [
				{ id: '1', name: 'Id', type: I.PropertyType.Number },
				{ id: '2', name: 'Name', type: I.PropertyType.Title },
				{ id: '3', name: 'E-mail', type: I.PropertyType.Text }
			]
		});
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		
		this.setState({ items: arrayMove(this.state.items, oldIndex, newIndex) });
	};
	
};

export default MenuPropertyList;