import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon, Switch } from 'ts/component';
import { I, C, DataUtil } from 'ts/lib';
import { menuStore, dbStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';
import arrayMove from 'array-move';

interface Props extends I.Menu {}

const $ = require('jquery');
const Constant = require('json/constant.json');

const MenuRelationList = observer(class MenuRelationList extends React.Component<Props, {}> {
	
	top: number = 0;

	constructor (props: any) {
		super(props);
		
		this.onAdd = this.onAdd.bind(this);
		this.onEdit = this.onEdit.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onSwitch = this.onSwitch.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { readonly, rootId, blockId, getView } = data;
		const view = getView();
		const relations = DataUtil.viewGetRelations(rootId, blockId, view);
		const allowedView = blockStore.isAllowed(rootId, blockId, [ I.RestrictionDataview.View ]);

		relations.map((it: any) => {
			it.relation = dbStore.getRelation(rootId, blockId, it.relationKey) || {};
			const { format, name } = it.relation;
		});

		const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));

		const Item = SortableElement((item: any) => {
			const canHide = allowedView && (item.relationKey != Constant.relationKey.name);
			const canEdit = !readonly && allowedView;
			const cn = [ 'item' ];
			
			if (item.relation.isHidden) {
				cn.push('isHidden');
			};
			if (!canEdit) {
				cn.push('isReadonly');
			};

			return (
				<div id={'item-' + item.relationKey} className={cn.join(' ')}>
					{allowedView ? <Handle /> : ''}
					<span className="clickable" onClick={(e: any) => { this.onEdit(e, item.relationKey); }}>
						<Icon className={'relation ' + DataUtil.relationClass(item.relation.format)} />
						<div className="name">{item.relation.name}</div>
					</span>
					{canHide ? (
						<Switch 
							value={item.isVisible} 
							onChange={(e: any, v: boolean) => { this.onSwitch(e, item.relationKey, v); }} 
						/>
					 ) : ''}
				</div>
			);
		});
		
		const ItemAdd = SortableElement((item: any) => (
			<div id="item-add" className="item add" onClick={this.onAdd}>
				<Icon className="plus" />
				<div className="name">New relation</div>
			</div>
		));
		
		const List = SortableContainer((item: any) => {
			return (
				<div className="items">
					<div id="scrollWrap" className="scrollWrap">
						{relations.map((item: any, i: number) => {
							return <Item key={item.relationKey} {...item} index={i} />;
						})}
					</div>
					{!readonly ? (
						<div className="bottom">
							<div className="line" />
							<ItemAdd index={relations.length + 1} disabled={true} /> 
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
		const node = $(ReactDOM.findDOMNode(this));
		const scroll = node.find('#scrollWrap');

		scroll.unbind('scroll').on('scroll', (e: any) => {
			this.top = scroll.scrollTop();
		});
	};
	
	componentDidUpdate () {
		const node = $(ReactDOM.findDOMNode(this));
		const scroll = node.find('#scrollWrap');

		scroll.scrollTop(this.top);
		this.props.position();
	};

	componentWillUnmount () {
		menuStore.closeAll(Constant.menuIds.cell);
	};

	onAdd (e: any) {
		const { param, getId, close, id } = this.props;
		const { data } = param;
		const { rootId, blockId, getView } = data;
		const view = getView();
		const relations = DataUtil.viewGetRelations(rootId, blockId, view);
		const menuIdEdit = 'dataviewRelationEdit';

		const onAdd = () => {
			menuStore.closeAll([ id, menuIdEdit, 'dataviewRelationSuggest' ]); 
		};

		menuStore.open('relationSuggest', { 
			element: `#${getId()} #item-add`,
			offsetX: 256,
			vertical: I.MenuDirection.Center,
			data: {
				...data,
				menuIdEdit: menuIdEdit,
				filter: '',
				skipIds: relations.map((it: I.ViewRelation) => { return it.relationKey; }),
				onAdd: onAdd,
				addCommand: (rootId: string, blockId: string, relation: any) => {
					DataUtil.dataviewRelationAdd(rootId, blockId, relation, getView(), onAdd);
				},
				listCommand: (rootId: string, blockId: string, callBack?: (message: any) => void) => {
					C.BlockDataviewRelationListAvailable(rootId, blockId, callBack);
				},
			}
		});
	};
	
	onEdit (e: any, id: string) {
		const { param, getId } = this.props;
		const { data } = param;
		const { readonly } = data;

		if (readonly) {
			return;
		};
		
		menuStore.open('dataviewRelationEdit', { 
			element: `#${getId()} #item-${id}`,
			horizontal: I.MenuDirection.Center,
			data: {
				...data,
				relationKey: id,
			}
		});
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		const { param } = this.props;
		const { data } = param;
		const { getView } = data;
		const view = getView();
		
		view.relations = arrayMove(view.relations, oldIndex, newIndex);
		this.save();
	};

	onSwitch (e: any, id: string, v: boolean) {
		const { param } = this.props;
		const { data } = param;
		const { getView } = data;
		const relation = getView().getRelation(id);

		if (relation) {
			relation.isVisible = v;
			this.save();
		};
	};

	save () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, onSave, getView } = data;
		const view = getView();

		C.BlockDataviewViewUpdate(rootId, blockId, view.id, view, onSave);
	};
	
});

export default MenuRelationList;