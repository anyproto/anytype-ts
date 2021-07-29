import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon, Tag } from 'ts/component';
import { I, Util, DataUtil, keyboard, Key, translate } from 'ts/lib';
import arrayMove from 'array-move';
import { menuStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {}

const $ = require('jquery');

const MenuOptionValues = observer(class MenuOptionValues extends React.Component<Props> {
	
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
		const relation = data.relation.get();
		const items = this.getItems();

		const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));

		const Item = SortableElement((item: any) => {
			return (
				<div id={'item-' + item.id} className="item" onMouseEnter={(e: any) => { this.onOver(e, item); }}>
					<Handle />
					<div className="clickable" onClick={(e: any) => { this.onEdit(e, item); }}>
						<Tag {...item} className={DataUtil.tagClass(relation.format)} />
					</div>
					<div className="buttons">
						<Icon className="more" onClick={(e: any) => { this.onEdit(e, item); }} />
						<Icon className="delete" onClick={(e: any) => { this.onRemove(e, item); }} />
					</div>
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
				<div className="sectionName">Select an option or add one</div>
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
		this.props.setActive(null, true);
		this.props.position();
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	rebind () {
		const { getId } = this.props;
		const win = $(window);
		const obj = $(`#${getId()}`);

		this.unbind();

		win.on('keydown.menu', (e: any) => { this.onKeyDown(e); });
		obj.on('click', () => { menuStore.close('dataviewOptionEdit'); });
	};
	
	unbind () {
		const { getId } = this.props;
		const win = $(window);
		const obj = $(`#${getId()}`);

		win.unbind('keydown.menu');
		obj.unbind('click');
	};

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const relation = data.relation.get();

		let value = DataUtil.getRelationArrayValue(data.value);
		value = value.map((id: string) => { 
			return (relation.selectDict || []).find((it: any) => { return it.id == id; });
		});

		value = value.filter((it: any) => { return it && it.id; });
		return value;
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	onAdd (e: any) {
		e.stopPropagation();

		const { param, getId, close } = this.props;
		const { data, classNameWrap } = param;

		menuStore.close('dataviewOptionEdit', () => {
			menuStore.open('dataviewOptionList', {
				element: `#${getId()} #item-add`,
				width: 0,
				offsetX: param.width,
				offsetY: -64,
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
		});
	};

	onEdit (e: any, item: any) {
		e.stopPropagation();

		const { param, getId, getSize } = this.props;
		const { data, classNameWrap } = param;

		menuStore.close('dataviewOptionEdit', () => {
			menuStore.open('dataviewOptionEdit', { 
				element: `#${getId()} #item-${item.id}`,
				offsetX: getSize().width,
				vertical: I.MenuDirection.Center,
				passThrough: true,
				noFlipY: true,
				noAnimation: true,
				classNameWrap: classNameWrap,
				data: {
					...data,
					option: item,
				}
			});
		});
	};

	onClick (e: any, item: any) {
	};

	onRemove (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { onChange } = data;
		
		let value = DataUtil.getRelationArrayValue(data.value);
		value = value.filter((it: any) => { return it != item.id; });
		value = Util.arrayUnique(value);

		this.props.param.data.value = value;
		menuStore.updateData('dataviewOptionList', { value: value });

		onChange(value);
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
		
		const { setActive } = this.props;
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
				setActive(null, true);
				break;
				
			case Key.down:
				this.n++;
				if (this.n > l - 1) {
					this.n = 0;
				};
				setActive(null, true);
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

export default MenuOptionValues;