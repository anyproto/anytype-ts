import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon } from 'ts/component';
import { I, C, Util, DataUtil, keyboard, Key, translate } from 'ts/lib';
import arrayMove from 'array-move';
import { menuStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const $ = require('jquery');
const Constant = require('json/constant.json');

@observer
class MenuViewList extends React.Component<Props> {
	
	_isMounted: boolean = false;
	n: number = 0;
	
	constructor (props: any) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onAdd = this.onAdd.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { getData } = data;
		const items = this.getItems();

		const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));

		const Item = SortableElement((item: any) => {
			return (
				<div id={'item-' + item.id} className="item" onMouseEnter={(e: any) => { this.onOver(e, item); }}>
					<Handle />
					<div className="clickable" onClick={(e: any) => { getData(item.id, 0); }}>
						<Icon className={'view c' + item.type} />
						<div className="name">{item.name}</div>
					</div>
					<div className="buttons">
						<Icon className="more" onClick={(e: any) => { this.onEdit(e, item); }} />
					</div>
				</div>
			);
		});

		const ItemAdd = SortableElement((item: any) => (
			<div id="item-add" className="item add" onMouseEnter={(e: any) => { this.onOver(e, { id: 'add' }); }} onClick={this.onAdd}>
				<Icon className="plus" />
				<div className="name">Add a view</div>
			</div>
		));
		
		const List = SortableContainer((item: any) => {
			return (
				<div className="items">
					<ItemAdd index={0} disabled={true} />
					{items.map((item: any, i: number) => (
						<Item key={i + 1} {...item} index={i + 1} />
					))}
				</div>
			);
		});
		
		return (
			<div>
				<List 
					axis="y" 
					transitionDuration={150}
					distance={10}
					useDragHandle={true}
					onSortEnd={this.onSortEnd}
					helperClass="isDragging"
					helperContainer={() => { return $(ReactDOM.findDOMNode(this)).get(0); }}
				/>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.rebind();
	};

	componentDidUpdate () {
		this.setActive(null, true);
		this.props.position();
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();

		menuStore.closeAll([ 'dataviewViewEdit' ]);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.onKeyDown(e); });
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const block = blockStore.getLeaf(rootId, blockId);

		return block.content.views || [];
	};

	getValue (): any[] {
		const { param } = this.props;
		const { data } = param;

		let value = Util.objectCopy(data.value || []);
		if ('object' != typeof(value)) {
			value = value ? [ value ] : [];
		};
		value = value.filter((it: string) => { return it; });
		return value;
	};

	setActive = (item?: any, scroll?: boolean) => {
		const items = this.getItems();
		this.props.setHover((item ? item : items[this.n]), scroll);
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.setActive(item, false);
		};
	};

	onAdd () {
		const { param, getId } = this.props;
		const { data } = param;
		const { getView } = data;
		const view = getView();

		menuStore.open('dataviewViewEdit', {
			element: `#${getId()} #item-add`,
			data: {
				...data,
				view: { 
					name: Constant.default.viewName,
					relations: Util.objectCopy(view.relations),
				},
			},
			horizontal: I.MenuDirection.Center,
		});
	};

	onEdit (e: any, item: any) {
		e.stopPropagation();

		const { param, getId, getSize, close } = this.props;
		const { data } = param;

		menuStore.open('dataviewViewEdit', { 
			element: '#' + getId() + ' #item-' + item.id,
			horizontal: I.MenuDirection.Center,
			passThrough: true,
			noFlipY: true,
			data: {
				...data,
				option: item,
				onSelect: () => { close(); }
			}
		});
	};

	onClick (e: any, item: any) {
		const { close } = this.props;

		close();
	};

	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
	};

	onKeyDown (e: any) {
		if (!this._isMounted) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();
		
		keyboard.disableMouse(true);
		
		const k = e.key.toLowerCase();
		const items = this.getItems();
		const l = items.length;
		const item = items[this.n];
		
		switch (k) {
			case Key.up:
				this.n--;
				if (this.n < 0) {
					this.n = l - 1;
				};
				this.setActive(null, true);
				break;
				
			case Key.down:
				this.n++;
				if (this.n > l - 1) {
					this.n = 0;
				};
				this.setActive(null, true);
				break;
				
			case Key.right:
				if (item) {
					this.onOver(e, item);
				};
				break;
			
			case Key.tab:
			case Key.enter:
			case Key.space:
				if (item) {
					this.onClick(e, item);					
				};
				break;
				
			case Key.escape:
				this.props.close();
				break;
		};
	};
	
};

export default MenuViewList;