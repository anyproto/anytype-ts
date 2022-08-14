import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon, Switch } from 'Component';
import { I, C, DataUtil, keyboard, translate } from 'Lib';
import { menuStore, dbStore, blockStore } from 'Store';
import { observer } from 'mobx-react';
import arrayMove from 'array-move';
import { AutoSizer, CellMeasurer, InfiniteLoader, List as VList, CellMeasurerCache } from 'react-virtualized';

import Cell from 'Component/block/dataview/cell';

interface Props extends I.Menu {};

const $ = require('jquery');
const Constant = require('json/constant.json');
const HEIGHT = 28;
const LIMIT = 20;

const MenuGroupList = observer(class MenuGroupList extends React.Component<Props, {}> {
	
	n: number = 0;
	top: number = 0;
	cache: any = {};
	refList: any = null;

	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onSwitch = this.onSwitch.bind(this);
		this.onScroll = this.onScroll.bind(this);
	};
	
	render () {
		const { param } = this.props;
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
					id={'item-' + item.id} 
					className={cn.join(' ')} 
					onMouseEnter={(e: any) => { this.onMouseEnter(e, item); }}
					style={item.style}
				>
					{allowedView ? <Handle /> : ''}
					<span className="clickable" onClick={(e: any) => { this.onClick(e, item); }}>
						<Cell 
							id={'menu-group-' + item.id} 
							rootId={rootId}
							subId={subId}
							block={block}
							relationKey={view.groupRelationKey} 
							viewType={I.ViewType.Board}
							getRecord={() => { return head; }}
							readonly={true} 
							arrayLimit={2}
							placeholder={translate('placeholderCellCommon')}
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
					onSortStart={this.onSortStart}
					onSortEnd={this.onSortEnd}
					useDragHandle={true}
					helperClass="isDragging"
					helperContainer={() => { return $(ReactDOM.findDOMNode(this)).find('.items').get(0); }}
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
		$(window).off('keydown.menu');
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

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};
	
	onClick (e: any, item: any) {
	};

	onSortStart () {
		const { dataset } = this.props;
		const { selection } = dataset;

		selection.preventSelect(true);
	};

	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		const { param, dataset } = this.props;
		const { selection } = dataset;
		const { data } = param;
		const { rootId, blockId } = data;
			
		dbStore.groupsSet(rootId, blockId, arrayMove(this.getItems(), oldIndex, newIndex));
		this.save();

		selection.preventSelect(false);
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
			update.push({ groupId: it.id, index: i, isHidden: it.isHidden });
		});

		dbStore.groupsSet(rootId, blockId, groups);
		C.BlockDataviewGroupOrderUpdate(rootId, blockId, { viewId: view.id, groups: update });
	};

	onScroll ({ clientHeight, scrollHeight, scrollTop }) {
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
		const obj = $('#' + getId() + ' .content');
		const height = Math.max(HEIGHT * 2, Math.min(360, items.length * HEIGHT + 58));

		obj.css({ height: height });
		position();
	};
	
});

export default MenuGroupList;