import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon, Switch } from 'ts/component';
import { I, C, DataUtil, keyboard } from 'ts/lib';
import { menuStore, dbStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';
import arrayMove from 'array-move';
import { AutoSizer, CellMeasurer, InfiniteLoader, List as VList, CellMeasurerCache } from 'react-virtualized';
import 'react-virtualized/styles.css';

interface Props extends I.Menu {}

const $ = require('jquery');
const Constant = require('json/constant.json');
const HEIGHT = 28;
const LIMIT = 20;

const MenuRelationList = observer(class MenuRelationList extends React.Component<Props, {}> {
	
	n: number = 0;
	top: number = 0;
	cache: any = {};
	refList: any = null;

	constructor (props: any) {
		super(props);
		
		this.onAdd = this.onAdd.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onSwitch = this.onSwitch.bind(this);
		this.onScroll = this.onScroll.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { readonly, rootId, blockId } = data;
		const items = this.getItems();
		const allowedView = blockStore.isAllowed(rootId, blockId, [ I.RestrictionDataview.View ]);

		items.map((it: any) => {
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
				<div 
					id={'item-' + item.relationKey} 
					className={cn.join(' ')} 
					onMouseEnter={(e: any) => { this.onMouseEnter(e, item); }}
					style={item.style}
				>
					{allowedView ? <Handle /> : ''}
					<span className="clickable" onClick={(e: any) => { this.onClick(e, item); }}>
						<Icon className={'relation ' + DataUtil.relationClass(item.relation.format)} />
						<div className="name">{item.relation.name}</div>
					</span>
					{canHide ? (
						<Switch 
							value={item.isVisible} 
							onChange={(e: any, v: boolean) => { this.onSwitch(e, item, v); }} 
						/>
					 ) : ''}
				</div>
			);
		});
		
		const rowRenderer = (param: any) => {
			const item: any = items[param.index];
			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
					hasFixedWidth={() => {}}
				>
					<Item key={item.id} {...item} index={param.index} style={param.style} />
				</CellMeasurer>
			);
		};
		
		const List = SortableContainer((item: any) => {
			return (
				<div className="items">
					<InfiniteLoader
						rowCount={items.length}
						loadMoreRows={() => {}}
						isRowLoaded={() => { return true; }}
						threshold={LIMIT}
					>
						{({ onRowsRendered, registerChild }) => (
							<AutoSizer className="scrollArea">
								{({ width, height }) => (
									<VList
										ref={(ref: any) => { this.refList = ref; }}
										width={width}
										height={height}
										deferredMeasurmentCache={this.cache}
										rowCount={items.length}
										rowHeight={HEIGHT}
										rowRenderer={rowRenderer}
										onRowsRendered={onRowsRendered}
										overscanRowCount={LIMIT}
										onScroll={this.onScroll}
									/>
								)}
							</AutoSizer>
						)}
					</InfiniteLoader>
				</div>
			);
		});
		
		return (
			<div className="wrap">
				<List 
					axis="y" 
					lockAxis="y"
					lockToContainerEdges={true}
					transitionDuration={150}
					distance={10}
					onSortEnd={this.onSortEnd}
					useDragHandle={true}
					helperClass="isDragging"
					helperContainer={() => { return $(ReactDOM.findDOMNode(this)).find('.items').get(0); }}
				/>
				{!readonly && allowedView ? (
					<div className="bottom">
						<div className="line" />
						<div 
							id="item-add" 
							className="item add" 
							onClick={this.onAdd} 
							onMouseEnter={() => { this.props.setHover({ id: 'add' }); }} 
							onMouseLeave={() => { this.props.setHover(); }}
						>
							<Icon className="plus" />
							<div className="name">New relation</div>
						</div>
					</div>
				) : ''}
			</div>
		);
	};

	componentDidMount() {
		const items = this.getItems();

		this.rebind();
		this.resize();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: (i: number) => { return (items[i] || {}).id; },
		});
	};
	
	componentDidUpdate () {
		this.resize();
		this.rebind();

		this.props.setActive(null, true);
		this.props.position();

		if (this.refList && this.top) {
			this.refList.scrollToPosition(this.top);
		};
	};

	componentWillUnmount () {
		this.unbind();
		menuStore.closeAll(Constant.menuIds.cell);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};

	onKeyDown (e: any) {
		let ret = false;
		let items = this.getItems();
		let item = items[this.n];

		keyboard.shortcut('space', e, (pressed: string) => {
			e.preventDefault();

			this.onSwitch(e, item, !item.isVisible);
			ret = true;
		});

		if (ret) {
			return;
		};

		this.props.onKeyDown(e);
	};

	onAdd (e: any) {
		const { param, getId, getSize } = this.props;
		const { data } = param;
		const { rootId, blockId, getView, onAdd } = data;
		const view = getView();
		const relations = DataUtil.viewGetRelations(rootId, blockId, view);
		const menuIdEdit = 'dataviewRelationEdit';

		menuStore.open('relationSuggest', { 
			element: `#${getId()} #item-add`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			noAnimation: true,
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

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};
	
	onClick (e: any, item: any) {
		const { param, getId } = this.props;
		const { data } = param;
		const { readonly } = data;

		if (readonly) {
			return;
		};
		
		menuStore.open('dataviewRelationEdit', { 
			element: `#${getId()} #item-${item.relationKey}`,
			horizontal: I.MenuDirection.Center,
			noAnimation: true,
			data: {
				...data,
				relationKey: item.relationKey,
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

	onSwitch (e: any, item: any, v: boolean) {
		const { param } = this.props;
		const { data } = param;
		const { getView } = data;
		const relation = getView().getRelation(item.relationKey);

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

	onScroll ({ clientHeight, scrollHeight, scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView } = data;
		const view = getView();

		return DataUtil.viewGetRelations(rootId, blockId, view).map((it: any) => {
			it.id = it.relationKey;
			it.relation = dbStore.getRelation(rootId, blockId, it.relationKey) || {};
			return it;
		});
	};

	resize () {
		const { getId, position } = this.props;
		const items = this.getItems();
		const obj = $('#' + getId() + ' .content');
		const height = Math.max(HEIGHT * 2, Math.min(360, items.length * HEIGHT + 58));

		obj.css({ height: height });
		position();
	};
	
});

export default MenuRelationList;