import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon, IconObject, Select } from 'ts/component';
import { I, C, DataUtil, Util } from 'ts/lib';
import arrayMove from 'array-move';
import { menuStore, dbStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {}

const $ = require('jquery');
const Constant = require('json/constant.json');

const MenuSort = observer(class MenuSort extends React.Component<Props, {}> {
	
	n: number = 0;
	
	constructor (props: any) {
		super(props);
		
		this.onAdd = this.onAdd.bind(this);
		this.onRemove = this.onRemove.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView } = data;
		const view = getView();
		
		if (!view) {
			return null;
		};

		const items = this.getItems();
		const sortCnt = items.length;
		const allowedView = blockStore.isAllowed(rootId, blockId, [ I.RestrictionDataview.View ]);
		
		const typeOptions = [
			{ id: String(I.SortType.Asc), name: 'Ascending' },
			{ id: String(I.SortType.Desc), name: 'Descending' },
		];
		
		const relationOptions = this.getRelationOptions();

		const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));
		
		const Item = SortableElement((item: any) => {
			const relation: any = dbStore.getRelation(rootId, blockId, item.relationKey) || {};
			return (
				<div id={'item-' + item.id} className={[ 'item', (!allowedView ? 'isReadonly' : '') ].join(' ')}>
					{allowedView ? <Handle /> : ''}
					<IconObject size={40} object={{ relationFormat: relation.format, layout: I.ObjectLayout.Relation }} />
					<div className="txt">
						<Select id={[ 'filter', 'relation', item.id ].join('-')} options={relationOptions} value={item.relationKey} onChange={(v: string) => { this.onChange(item.id, 'relationKey', v); }} />
						<Select id={[ 'filter', 'type', item.id ].join('-')} className="grey" options={typeOptions} value={item.type} onChange={(v: string) => { this.onChange(item.id, 'type', v); }} />
					</div>
					{allowedView ? <Icon className="delete" onClick={(e: any) => { this.onRemove(e, item); }} /> : ''}
				</div>
			);
		});
		
		const ItemAdd = SortableElement((item: any) => (
			<div className="item add" onClick={this.onAdd}>
				<Icon className="plus" />
				<div className="name">New sort</div>
			</div>
		));
		
		const List = SortableContainer((item: any) => {
			return (
				<div className="items">
					<div className="scrollWrap">
						{items.map((item: any, i: number) => (
							<Item key={i} {...item} id={i} index={i} />
						))}
						{!view.sorts.length ? (
							<div className="item empty">No sorts applied to this view</div>
						) : ''}
					</div>
					{allowedView ? (
						<div className="bottom">
							<div className="line" />
							<ItemAdd index={view.sorts.length + 1} disabled={true} /> 
						</div>
					) : ''}
				</div>
			);
		});
		
		return (
			<List 
				axis="y"
				lockAxis="y"
				lockToContainerEdges={true}
				transitionDuration={150}
				distance={10}
				onSortEnd={this.onSortEnd}
				useDragHandle={true}
				helperClass="isDragging"
				helperContainer={() => { return $(ReactDOM.findDOMNode(this)).get(0); }}
			/>
		);
	};

	componentDidMount() {
		this.rebind();
	};
	
	componentDidUpdate () {
		this.props.setActive();
		this.props.position();
	};

	componentWillUnmount () {
		this.unbind();
		menuStore.closeAll(Constant.menuIds.cell);
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
		const { getView } = data;
		const view = getView();

		if (!view) {
			return [];
		};
		
		let n = 0;
		return Util.objectCopy(view.sorts || []).map((it: any) => {
			it.id = n++;
			return it;
		});
	};

	getRelationOptions () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView } = data;

		return DataUtil.getRelationOptions(rootId, blockId, getView());
	};

	onAdd (e: any) {
		const { param, getId } = this.props;
		const { data } = param;
		const { getView } = data;
		const view = getView();
		const relationOptions = this.getRelationOptions();

		if (!relationOptions.length) {
			return;
		};

		const obj = $(`#${getId()}`);
		const content = obj.find('.content');

		view.sorts.push({ 
			relationKey: relationOptions[0].id, 
			type: I.SortType.Asc,
		});

		content.animate({ scrollTop: content.get(0).scrollHeight }, 50);
		this.save();
	};

	onChange (id: number, k: string, v: string) {
		const { param } = this.props;
		const { data } = param;
		const { getView } = data;
		const view = getView();
		const item = view.getSort(id);

		if (k == 'relationKey') {
			view.sorts = view.sorts.filter((it: I.Sort, i: number) => { return (i == id) || (it.relationKey != v); });
		};
		
		item[k] = v;
		this.save();
		this.forceUpdate();
	};
	
	onRemove (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { getView } = data;
		const view = getView();

		view.sorts = view.sorts.filter((it: any, i: number) => { return i != item.id; });
		this.save();

		menuStore.close('select');
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		const { param } = this.props;
		const { data } = param;
		const { getView } = data;
		const view = getView();

		view.sorts = arrayMove(view.sorts, oldIndex, newIndex);
		this.save();
	};

	save () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, onSave, getView } = data;
		const view = getView();

		C.BlockDataviewViewUpdate(rootId, blockId, view.id, view, onSave);
	};
	
});

export default MenuSort;