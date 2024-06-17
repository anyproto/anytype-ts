import * as React from 'react';
import { observer } from 'mobx-react';
import arrayMove from 'array-move';
import { AutoSizer, CellMeasurer, InfiniteLoader, List as VList, CellMeasurerCache } from 'react-virtualized';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import $ from 'jquery';
import { Icon, Switch } from 'Component';
import Cell from 'Component/block/dataview/cell';
import { I, C, Dataview, keyboard, translate } from 'Lib';
import { menuStore, dbStore, blockStore } from 'Store';
const Constant = require('json/constant.json');

const HEIGHT = 28;
const LIMIT = 20;

const MenuGroupList = observer(class MenuGroupList extends React.Component<I.Menu> {
	
	node: any = null;
	n = -1;
	top = 0;
	cache: any = {};
	refList: any = null;

	constructor (props: I.Menu) {
		super(props);
		
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onSwitch = this.onSwitch.bind(this);
		this.onScroll = this.onScroll.bind(this);
	};
	
	render () {
		const { param, getId } = this.props;
		const { data } = param;
		const { readonly, rootId, blockId, getView } = data;
		const items = this.getItems();
		const view = getView();
		const block = blockStore.getLeaf(rootId, blockId);
		const allowedView = blockStore.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);

		const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));

		const Item = SortableElement((item: any) => {
			const canHide = allowedView;
			const canEdit = !readonly && allowedView;
			const subId = dbStore.getSubId(rootId, [ blockId, item.id ].join(':'));
			const cn = [ 'item' ];
			const head = {};

			head[view.groupRelationKey] = item.value;
			
			if (!canEdit) {
				cn.push('isReadonly');
			};

			return (
				<div 
					ref={node => this.node = node}
					id={'item-' + item.id} 
					className={cn.join(' ')} 
					onMouseEnter={e => this.onMouseEnter(e, item)}
					style={item.style}
				>
					{allowedView ? <Handle /> : ''}
					<span className="clickable">
						<Cell 
							id={'menu-group-' + item.id} 
							rootId={rootId}
							subId={subId}
							block={block}
							relationKey={view.groupRelationKey} 
							viewType={I.ViewType.Board}
							getRecord={() => head}
							readonly={true} 
							arrayLimit={4}
							withName={true}
							placeholder={translate('commonUncategorized')}
						/>
					</span>
					{canHide ? (
						<Switch 
							value={!item.isHidden} 
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
				>
					<Item key={item.id} {...item} index={param.index} style={param.style} />
				</CellMeasurer>
			);
		};
		
		const List = SortableContainer(() => (
			<div className="items">
				<InfiniteLoader
					rowCount={items.length}
					loadMoreRows={() => {}}
					isRowLoaded={() => true}
					threshold={LIMIT}
				>
					{({ onRowsRendered }) => (
						<AutoSizer className="scrollArea">
							{({ width, height }) => (
								<VList
									ref={ref => this.refList = ref}
									width={width}
									height={height}
									deferredMeasurmentCache={this.cache}
									rowCount={items.length}
									rowHeight={HEIGHT}
									rowRenderer={rowRenderer}
									onRowsRendered={onRowsRendered}
									overscanRowCount={LIMIT}
									onScroll={this.onScroll}
									scrollToAlignment="center"
								/>
							)}
						</AutoSizer>
					)}
				</InfiniteLoader>
			</div>
		));
		
		return (
			<div className="wrap">
				<List 
					axis="y" 
					lockAxis="y"
					lockToContainerEdges={true}
					transitionDuration={150}
					distance={10}
					onSortStart={this.onSortStart}
					onSortEnd={this.onSortEnd}
					useDragHandle={true}
					helperClass="isDragging"
					helperContainer={() => $(`#${getId()} .items`).get(0)}
				/>
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
			keyMapper: i => (items[i] || {}).id,
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
		$(window).on('keydown.menu', e => this.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	onKeyDown (e: any) {
		let ret = false;
		const items = this.getItems();
		const item = items[this.n];

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

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};
	
	onSortStart () {
		keyboard.disableSelection(true);
	};

	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
			
		dbStore.groupsSet(rootId, blockId, arrayMove(this.getItems(), oldIndex, newIndex));
		this.save();

		keyboard.disableSelection(false);
	};

	onSwitch (e: any, item: any, v: boolean) {
		const groups = this.getItems();
		const group = groups.find(it => it.id == item.id);

		group.isHidden = !v;
		this.save();
	};

	save () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView } = data;
		const view = getView();
		const groups = this.getItems();
		const update: any[] = [];

		groups.forEach((it: any, i: number) => {
			update.push({ ...it, groupId: it.id, index: i });
		});

		dbStore.groupsSet(rootId, blockId, groups);
		Dataview.groupUpdate(rootId, blockId, view.id, update);
		C.BlockDataviewGroupOrderUpdate(rootId, blockId, { viewId: view.id, groups: update });
	};

	onScroll ({ scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;

		return dbStore.getGroups(rootId, blockId);
	};

	resize () {
		const { getId, position } = this.props;
		const items = this.getItems();
		const obj = $(`#${getId()} .content`);
		const height = Math.max(HEIGHT * 2, Math.min(360, items.length * HEIGHT + 16));

		obj.css({ height });
		position();
	};
	
});

export default MenuGroupList;