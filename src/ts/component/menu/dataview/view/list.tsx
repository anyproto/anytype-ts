import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon } from 'ts/component';
import { I, Util, keyboard, Key } from 'ts/lib';
import { menuStore, dbStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {}

const $ = require('jquery');

const MenuViewList = observer(class MenuViewList extends React.Component<Props> {
	
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
		const { getData, rootId, blockId } = data;
		const items = this.getItems();
		const allowed = blockStore.isAllowed(rootId, blockId, [ I.RestrictionDataview.View ]);

		const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));

		const Item = SortableElement((item: any) => {
			return (
				<div id={'item-' + item.id} className="item big" onMouseEnter={(e: any) => { this.onOver(e, item); }}>
					{allowed ? <Handle /> : ''}
					<div className="clickable" onClick={(e: any) => { getData(item.id, 0); }}>
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
					{items.map((item: any, i: number) => (
						<Item key={i} {...item} index={i} />
					))}
					{allowed ? <ItemAdd index={items.length} disabled={true} /> : ''}
				</div>
			);
		});
		
		return (
			<div>
				<div className="sectionName">Views</div>
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
		menuStore.closeAll([ 'dataviewViewEdit' ]);
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
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;

		return dbStore.getViews(rootId, blockId);
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

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	onAdd () {
		const { param, getId } = this.props;
		const { data } = param;
		const { getView } = data;
		const view = getView();
		const relations = Util.objectCopy(view.relations);
		const filters: I.Filter[] = [];

		for (let relation of relations) {
			if (relation.isHidden || !relation.isVisible) {
				continue;
			};

			filters.push({
				relationKey: relation.relationKey,
				operator: I.FilterOperator.And,
				condition: I.FilterCondition.None,
				value: null,
			});
		};

		menuStore.open('dataviewViewEdit', {
			element: `#${getId()} #item-add`,
			horizontal: I.MenuDirection.Center,
			data: {
				...data,
				view: { 
					type: I.ViewType.Grid,
					relations: relations,
					filters: filters,
				},
				onSave: () => {
					this.forceUpdate();
				},
			},
		});
	};

	onEdit (e: any, item: any) {
		e.stopPropagation();

		const { param, getId } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const allowed = blockStore.isAllowed(rootId, blockId, [ I.RestrictionDataview.View ]);

		menuStore.open('dataviewViewEdit', { 
			element: `#${getId()} #item-${item.id}`,
			horizontal: I.MenuDirection.Center,
			data: {
				...data,
				readonly: !allowed,
				view: item,
				onSave: () => { this.forceUpdate(); },
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

});

export default MenuViewList;