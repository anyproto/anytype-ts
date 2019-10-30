import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { Icon, Tag, Input } from 'ts/component';
import { I } from 'ts/lib';
import arrayMove from 'array-move';
import { observer, inject } from 'mobx-react';

const $ = require('jquery');

interface Props extends I.Menu {
	commonStore?: any;
};
interface State {
	items: any[];
	filter: string;
};

@inject('commonStore')
@observer
class MenuTagList extends React.Component<Props, State> {
	
	filterRef: any = null;
	state = {
		items: [] as any[],
		filter: ''
	};
	
	constructor (props: any) {
		super(props);
		
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { items, filter } = this.state;
		
		let regExp = new RegExp(filter, 'i');
		let filtered = items.filter((item: any) => { return filter ? item.match(regExp) : true; });
		
		const Item = SortableElement((item: any) => (
			<div id={'tag-' + item.id} className="item" onClick={(e: any) => { this.onSelect(e, item.id); }}>
				<Icon className="dnd" />
				<Tag text={item.text} />
			</div>
		));
		
		const List = SortableContainer((item: any) => {
			return (
				<div className="items">
					{filtered.map((item: any, i: number) => (
						<Item key={i} text={item} id={i} index={i} />
					))}
				</div>
			);
		});
		
		return (
			<div>
				<form className="form" onSubmit={this.onSubmit}>
					<Input ref={(ref: any) => { this.filterRef = ref; }} onKeyUp={this.onKeyUp} placeHolder="Create or select an option" />
				</form>
				<div className="line" />
				<List 
					axis="y" 
					transitionDuration={150}
					pressDelay={50}
					onSortEnd={this.onSortEnd}
					helperClass="dragging"
					helperContainer={() => { return $(ReactDOM.findDOMNode(this)).get(0); }}
				/>
			</div>
		);
	};
	
	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { values } = data;
		
		this.setState({ items: values });
		this.filterRef.focus();
	};
	
	onSelect (e: any, id: number) {
		const { commonStore, param } = this.props;
		const { data } = param;
		const { values } = data;
		
		//commonStore.menuClose(this.props.id);
		
		commonStore.menuOpen('dataviewTagEdit', { 
			element: 'tag-' + id,
			offsetX: 0,
			offsetY: 4,
			light: true,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Center,
			data: {
				value: values[id]
			}
		});
	};
	
	onSubmit (e: any) {
		e.preventDefault();
		
		let { items } = this.state; 
		let filter = this.filterRef.getValue();
		
		if (items.indexOf(filter) < 0) {
			items.push(filter);
			this.setState({ items: items });			
		};
	};
	
	onKeyUp (e: any) {
		const filter = this.filterRef.getValue().toLowerCase();
		this.setState({ filter: filter });
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		
		this.setState({ items: arrayMove(this.state.items, oldIndex, newIndex) });
	};
	
};

export default MenuTagList;