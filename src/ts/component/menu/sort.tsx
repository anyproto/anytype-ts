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
		
		this.onSortEnd = this.onSortEnd.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { properties } = data;
		
		const { items } = this.state;
		const typeOptions = [
			{ id: String(I.SortType.Asc), name: 'Ascending' },
			{ id: String(I.SortType.Desc), name: 'Descending' },
		];
		let propertyOptions: any[] = [];
		
		for (let property of properties) {
			propertyOptions.push({ id: property.id, name: property.name, icon: 'property c' + property.type });
		};
		
		const Item = SortableElement((item: any) => (
			<div className="item">
				<Select options={propertyOptions} value={item.propertyId} />
				<Select options={typeOptions} value={String(item.type)} />
			</div>
		));
		
		const List = SortableContainer((item: any) => {
			return (
				<div className="items">
					{items.map((item: any, i: number) => (
						<Item key={i} {...item} index={i} />
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
				helperContainer={() => { return $(ReactDOM.findDOMNode(this)).get(0); }}
			/>
		);
	};
	
	componentDidMount () {
		this.setState({ 
			items: [
				{ propertyId: '1', type: I.SortType.Asc },
				{ propertyId: '2', type: I.SortType.Asc },
			]
		});
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		
		this.setState({ items: arrayMove(this.state.items, oldIndex, newIndex) });
	};
	
};

export default MenuSort;