import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon, IconObject, ObjectName } from 'ts/component';
import { I, DataUtil, keyboard } from 'ts/lib';
import arrayMove from 'array-move';
import { commonStore, detailStore, menuStore } from 'ts/store';
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
			const cn = [ 'item' ];
			
			if (item.id == 'add') {
				cn.push('add');
			} else {	
				cn.push('withCaption');
			};
			if (item.isHidden) {
				cn.push('isHidden');
			};

			return (
				<div 
					id={'item-' + item.id} 
					className={cn.join(' ')} 
					onMouseEnter={(e: any) => { this.onOver(e, item); }}
				>
					{item.id == 'add' ? (
						<span className="clickable" onClick={(e: any) => { this.onClick(e, item); }}>
							<Icon className="plus" />
							<div className="name">Add object</div>
						</span>
					) : (
						<React.Fragment>
							<Handle />
							<span className="clickable" onClick={(e: any) => { this.onClick(e, item); }}>
								<IconObject object={item} />
								<ObjectName object={item} />
							</span>
							<Icon className="delete" onClick={(e: any) => { this.onRemove(e, item); }} />
						</React.Fragment>
					)}
				</div>
			);
		});

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
		this.props.setActive(null, true);
		this.props.position();
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};

	getItems () {
		const { config } = commonStore;
		const { param } = this.props;
		const { data } = param;
		const { subId } = data;

		let value: any[] = DataUtil.getRelationArrayValue(data.value);
		value = value.map((it: string) => { return detailStore.get(subId, it, []); });
		value = value.filter((it: any) => { return !it._empty_; });

		if (!config.debug.ho) {
			value = value.filter((it: any) => { return !it.isHidden; });
		};

		value.unshift({ id: 'add' });
		return value;
	};

	onClick (e: any, item: any) {
		if (item.id == 'add') {
			this.onAdd();
		} else {
			DataUtil.objectOpenEvent(e, item);
		};
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
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
		const relation = data.relation.get();
		
		let value = DataUtil.getRelationArrayValue(data.value);
		value = value.filter((it: any) => { return it != item.id; });
		value = DataUtil.formatRelationValue(relation, value, true);

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
		const relation = data.relation.get();

		let value = DataUtil.getRelationArrayValue(data.value);
		value = arrayMove(value, oldIndex - 1, newIndex - 1);
		value = DataUtil.formatRelationValue(relation, value, true);

		this.props.param.data.value = value;
		onChange(value);
	};

});

export default MenuObjectValues;