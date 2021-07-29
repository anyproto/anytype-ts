import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon, IconObject } from 'ts/component';
import { I, Util, DataUtil, keyboard, Key, translate } from 'ts/lib';
import arrayMove from 'array-move';
import { commonStore, detailStore, dbStore, menuStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {}

const $ = require('jquery');

const MenuObjectValues = observer(class MenuObjectValues extends React.Component<Props> {
	
	_isMounted: boolean = false;
	n: number = 0;
	
	constructor (props: any) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onAdd = this.onAdd.bind(this);
	};
	
	render () {
		const items = this.getItems();

		const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));

		const Item = SortableElement((item: any) => {
			const type: any = dbStore.getObjectType(item.type) || {};

			return (
				<div 
					id={'item-' + item.id} 
					className={[ 'item', 'withCaption', (item.isHidden ? 'isHidden' : '') ].join(' ')} 
					onMouseEnter={(e: any) => { this.onOver(e, item); }}
				>
					<Handle />
					<span className="clickable" onClick={(e: any) => { this.onClick(e, item); }}>
						<IconObject object={item} />
						<div className="name">{item.name}</div>
					</span>
					<Icon className="delete" onClick={(e: any) => { this.onRemove(e, item); }} />
				</div>
			);
		});

		const ItemAdd = SortableElement((item: any) => (
			<div id="item-add" className="item add" onMouseEnter={(e: any) => { this.onOver(e, { id: 'add' }); }} onClick={this.onAdd}>
				<Icon className="plus" />
				<div className="name">Add</div>
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
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.onKeyDown(e); });
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};

	getItems () {
		const { config } = commonStore;
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;

		let value = DataUtil.getRelationArrayValue(data.value);
		value = value.map((it: string) => { return detailStore.get(rootId, it, []); });
		value = value.filter((it: any) => { return !it._empty_; });
		
		if (!config.debug.ho) {
			value = value.filter((it: any) => { return !it.isHidden; });
		};
		return value;
	};

	onClick (e: any, item: any) {
		DataUtil.objectOpenEvent(e, item);
	};

	setActive (item?: any, scroll?: boolean) {
		const items = this.getItems();
		this.props.setHover((item ? item : items[this.n]), scroll);
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.setActive(item, false);
		};
	};

	onAdd () {
		const { param, getId, getSize, close } = this.props;
		const { data, classNameWrap } = param;

		menuStore.open('dataviewObjectList', {
			element: `#${getId()}`,
			width: 0,
			offsetX: param.width,
			offsetY: () => { return -getSize().height; },
			passThrough: true,
			noFlipY: true,
			noAnimation: true,
			classNameWrap: classNameWrap,
			onClose: () => { close(); },
			data: {
				...data,
				rebind: this.rebind,
			},
		});
	};

	onRemove (e: any, item: any) {
		const { param, id } = this.props;
		const { data } = param;
		const { onChange } = data;
		
		let value = DataUtil.getRelationArrayValue(data.value);
		value = value.filter((it: any) => { return it != item.id; });
		value = Util.arrayUnique(value);

		this.n = -1;

		onChange(value);
		menuStore.updateData(id, { value: value });
		menuStore.updateData('dataviewObjectList', { value: value });
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		const { param } = this.props;
		const { data } = param;
		const { onChange } = data;

		let value = DataUtil.getRelationArrayValue(data.value);
		value = arrayMove(value, oldIndex - 1, newIndex - 1);
		value = Util.arrayUnique(value);

		this.props.param.data.value = value;
		onChange(value);
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
	
});

export default MenuObjectValues;