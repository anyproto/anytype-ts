import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
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

		const Item = SortableElement((item: any) => (
			<div id={'tag-' + item.id} className="item" onClick={(e: any) => { this.onSelect(e, item.id); }}>
				<Icon className="dnd" />
				<Tag text={item.text} color={item.color} />
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
				<div className="line" />
				<List 
					axis="y" 
					transitionDuration={150}
					distance={10}
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
		const { param } = this.props;
		const { data } = param;
		
		commonStore.menuOpen('dataviewOptionEdit', { 
			type: I.MenuType.Vertical,
			element: '#tag-' + id,
			offsetX: 0,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Center,
			width: param.width,
			data: {
				...data,
			}
		});
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		this.setState({ items: arrayMove(this.state.items, oldIndex, newIndex) });
	};
	
};

export default MenuOptionList;