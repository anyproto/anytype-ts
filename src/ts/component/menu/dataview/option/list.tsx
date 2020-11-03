import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon, Tag, Label } from 'ts/component';
import { I } from 'ts/lib';
import arrayMove from 'array-move';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

interface State {
	items: any[];
};

const $ = require('jquery');

@observer
class MenuOptionList extends React.Component<Props, State> {
	
	_isMounted: boolean = false;
	state = {
		items: [] as any[],
	};
	
	constructor (props: any) {
		super(props);
		
		this.onSortEnd = this.onSortEnd.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { relation } = data;
		const { selectDict } = relation;

		const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));

		const Item = SortableElement((item: any) => (
			<div id={'tag-' + item.id} className="item" onClick={(e: any) => { this.onSelect(e, item.id); }}>
				<Handle />
				<Tag text={item.text} color={item.color} />
				<Icon className="more" onClick={(e: any) => { this.onEdit(e, item.id); }} />
			</div>
		));
		
		const List = SortableContainer((item: any) => {
			return (
				<div className="items">
					{selectDict.map((item: any, i: number) => (
						<Item key={i} text={item.text} color={item.color} id={i} index={i} />
					))}
				</div>
			);
		});
		
		return (
			<div>
				<Label text="Create or select an option" />
				<List 
					axis="y" 
					transitionDuration={150}
					distance={10}
					useDragHandle={true}
					onSortEnd={this.onSortEnd}
					helperClass="dragging"
					helperContainer={() => { return $(ReactDOM.findDOMNode(this)).get(0); }}
				/>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	onSelect (e: any, id: number) {
	};
	
	onEdit (e: any, id: number) {
		e.stopPropagation();

		const { param } = this.props;
		const { data } = param;
		
		commonStore.menuOpen('dataviewOptionEdit', { 
			type: I.MenuType.Vertical,
			element: '#tag-' + id,
			offsetX: param.width,
			offsetY: 0,
			vertical: I.MenuDirection.Center,
			horizontal: I.MenuDirection.Left,
			data: {
				...data,
				id: id,
			}
		});
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		this.setState({ items: arrayMove(this.state.items, oldIndex, newIndex) });
	};
	
};

export default MenuOptionList;