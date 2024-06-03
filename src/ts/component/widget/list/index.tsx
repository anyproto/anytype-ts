import * as React from 'react';
import raf from 'raf';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, CellMeasurerCache, InfiniteLoader, List as VList } from 'react-virtualized';
import { Select, Label } from 'Component';
import { blockStore, dbStore, detailStore } from 'Store';
import { Dataview, I, C, M, UtilCommon, Relation, keyboard, translate, Action, UtilRouter } from 'Lib';
import { SortableContainer } from 'react-sortable-hoc';
import arrayMove from 'array-move';
import WidgetListItem from './item';
const Constant = require('json/constant.json');

interface Props extends I.WidgetComponent {
	isCompact?: boolean;
};

interface State {
	isLoading: boolean;
};

const BLOCK_ID = 'dataview';
const LIMIT = 30;
const HEIGHT_COMPACT = 28;
const HEIGHT_LIST = 64;

const WidgetList = observer(class WidgetList extends React.Component<Props, State> {

	node = null;
	refSelect = null;
	refList = null;
	state = {
		isLoading: false,
	};
	cache: any = null;
	top = 0;

	constructor (props: Props) {
		super(props);
		
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onScroll = this.onScroll.bind(this);
		this.getSubId = this.getSubId.bind(this);
	};

	render (): React.ReactNode {
		const { parent, block, isSystemTarget, isPreview } = this.props;
		const { viewId, limit } = parent.content;
		const { targetBlockId } = block.content;
		const { isLoading } = this.state;
		const rootId = this.getRootId();
		const views = dbStore.getViews(rootId, BLOCK_ID).map(it => ({ ...it, name: it.name || translate('defaultNamePage') }));
		const subId = dbStore.getSubId(rootId, BLOCK_ID);
		const { total } = dbStore.getMeta(subId, '');
		const isSelect = !isPreview || !UtilCommon.isPlatformMac();
		const items = this.getItems();
		const length = items.length;

		if (!this.cache) {
			return null;
		};

		let content = null;

		if (!isLoading && !length) {
			content = <Label className="empty" text={translate('widgetEmptyLabel')} />;
		} else
		if (isPreview) {
			const rowRenderer = ({ index, key, parent, style }) => (
				<CellMeasurer
					key={key}
					parent={parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={index}
					fixedWidth
				>
					<WidgetListItem 
						{...this.props}
						{...items[index]}
						subId={subId} 
						id={items[index].id}
						style={style} 
						index={index}
					/>
				</CellMeasurer>
			);

			const List = SortableContainer(() => (
				<div className="items">
					<InfiniteLoader
						rowCount={total}
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
										rowCount={length}
										rowHeight={({ index }) => this.getRowHeight(items[index], index)}
										rowRenderer={rowRenderer}
										onRowsRendered={onRowsRendered}
										overscanRowCount={LIMIT}
										scrollToAlignment="center"
										onScroll={this.onScroll}
									/>
							)}
							</AutoSizer>
						)}
					</InfiniteLoader>
				</div>
			));

			content = (
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
					helperContainer={() => $(`#widget-${parent.id} .items`).get(0)}
				/>
			);
		} else {
			content = (
				<React.Fragment>
					{items.map((item: any) => (
						<WidgetListItem key={`widget-${block.id}-${item.id}`} {...this.props} {...item} subId={subId} id={item.id} />
					))}
				</React.Fragment>
			);
		};

		let viewSelect = null;

		if (!isSystemTarget() && (views.length > 1)) {
			if (isSelect) {
				viewSelect = (
					<Select 
						ref={ref => this.refSelect = ref}
						id={`select-view-${rootId}`} 
						value={viewId} 
						options={views} 
						onChange={this.onChangeView}
						arrowClassName="light"
						menuParam={{ 
							width: 300,
							className: 'fixed',
							classNameWrap: 'fromSidebar',
						}}
					/>
				);
			} else {
				const Item = (item) => (
					<div 
						className={[ 'viewItem', (item.id == viewId ? 'active' : '') ].join(' ')} 
						onClick={() => this.onChangeView(item.id)}
					>
						{UtilCommon.shorten(item.name, 32)}
					</div>
				);

				viewSelect = (
					<div className="viewList">
						<div className="inner">
							{views.map(item => (
								<Item key={`widget-${block.id}-view-${item.id}`} {...item} />
							))}
						</div>
					</div>
				);
			};
		};

		return (
			<div 
				ref={node => this.node = node}
				className="innerWrap"
			>
				{viewSelect ? <div id="viewSelect">{viewSelect}</div> : ''}

				<div id="body" className="body">
					{content}
				</div>
			</div>
		);
	};

	componentDidMount (): void {
		const { parent, block, isSystemTarget, getData } = this.props;
		const { viewId } = parent.content;
		const { targetBlockId } = block.content;

		if (isSystemTarget()) {
			getData(this.getSubId(), () => this.resize());
		} else {
			this.setState({ isLoading: true });

			C.ObjectShow(targetBlockId, this.getTraceId(), UtilRouter.getRouteSpaceId(), () => {
				this.setState({ isLoading: false });

				const view = Dataview.getView(this.getRootId(), BLOCK_ID, viewId);
				if (view) {
					this.load(view.id);
				};
			});
		};

		this.initCache();
		this.forceUpdate();
	};

	componentDidUpdate (): void {
		const { parent, isSystemTarget } = this.props;
		const { viewId } = parent.content;
		const rootId = this.getRootId();
		const view = Dataview.getView(rootId, BLOCK_ID);

		if (!isSystemTarget() && view && (viewId != view.id)) {
			this.load(viewId);
		};

		if (this.refList) {
			this.refList.scrollToPosition(this.top);
		};

		this.initCache();
		this.resize();
	};

	componentWillUnmount(): void {
		C.ObjectSearchUnsubscribe([ dbStore.getSubId(this.getRootId(), BLOCK_ID) ]);
	};

	initCache () {
		if (!this.cache) {
			const items = this.getItems();

			this.cache = new CellMeasurerCache({
				fixedWidth: true,
				defaultHeight: i => this.getRowHeight(items[i], i),
				keyMapper: i => items[i],
			});
		};
	};

	updateData () {
		const { block, isSystemTarget, getData } = this.props;
		const { targetBlockId } = block.content;
		const rootId = this.getRootId();
		const srcBlock = blockStore.getLeaf(targetBlockId, BLOCK_ID);

		// Update block in widget with source block if object is open
		if (srcBlock) {
			let dstBlock = blockStore.getLeaf(rootId, BLOCK_ID);

			if (dstBlock) {
				dstBlock = Object.assign(dstBlock, srcBlock);
			};
		};

		if (isSystemTarget()) {
			getData(this.getSubId(), () => this.resize());
		} else {
			const view = Dataview.getView(this.getRootId(), BLOCK_ID);
			if (view) {
				this.load(view.id);
			};
		};
	};

	updateViews () {
		const { block } = this.props;
		const { targetBlockId } = block.content;
		const views = UtilCommon.objectCopy(dbStore.getViews(targetBlockId, BLOCK_ID)).map(it => new M.View(it));
		const rootId = this.getRootId();

		if (!views.length || (targetBlockId != keyboard.getRootId())) {
			return;
		};

		dbStore.viewsClear(rootId, BLOCK_ID);
		dbStore.viewsSet(rootId, BLOCK_ID, views);

		if (this.refSelect) {
			this.refSelect.setOptions(views);
		};
	};

	getSubId () {
		return dbStore.getSubId(this.getRootId(), BLOCK_ID);
	};

	getTraceId = (): string => {
		return [ 'widget', this.props.block.id ].join('-');
	};

	getRootId = (): string => {
		const { block } = this.props;
		const { targetBlockId } = block.content;

		return [ targetBlockId, 'widget', block.id ].join('-');
	};

	load = (viewId: string) => {
		const { widgets } = blockStore;
		const { block, parent, getLimit } = this.props;
		const { targetBlockId } = block.content;
		const object = detailStore.get(widgets, targetBlockId);
		const setOf = Relation.getArrayValue(object.setOf);
		const target = detailStore.get(widgets, targetBlockId);
		const isCollection = target.layout == I.ObjectLayout.Collection;
		const limit = getLimit(parent.content);

		if (!setOf.length && !isCollection) {
			return;
		};

		Dataview.getData({
			rootId: this.getRootId(),
			blockId: BLOCK_ID,
			newViewId: viewId,
			sources: setOf,
			limit,
			collectionId: (isCollection ? targetBlockId : ''),
			keys: Constant.sidebarRelationKeys,
		}, () => {
			this.resize();
		});
	};

	onSortStart () {
		keyboard.disableSelection(true);
	};

	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		const { block } = this.props;
		const { targetBlockId } = block.content;

		keyboard.disableSelection(false);

		if ((oldIndex == newIndex) || (targetBlockId != Constant.widgetId.favorite)) {
			return;
		};

		const { root } = blockStore;
		const records = this.getRecords();
		const children = blockStore.getChildren(root, root, it => it.isLink());
		const ro = records[oldIndex];
		const rn = records[newIndex];
		const oidx = children.findIndex(it => it.content.targetBlockId == ro);
		const nidx = children.findIndex(it => it.content.targetBlockId == rn);
		const current = children[oidx];
		const target = children[nidx];
		const childrenIds = blockStore.getChildrenIds(root, root);
		const position = newIndex < oldIndex ? I.BlockPosition.Top : I.BlockPosition.Bottom;

		blockStore.updateStructure(root, root, arrayMove(childrenIds, oidx, nidx));
		Action.move(root, root, target.id, [ current.id ], position);
	};

	onChangeView = (viewId: string): void => {
		C.BlockWidgetSetViewId(blockStore.widgets, this.props.parent.id, viewId);
	};

	getRecords () {
		const { parent, block, sortFavorite } = this.props;
		const { targetBlockId } = block.content;
		const rootId = this.getRootId();
		const subId = dbStore.getSubId(rootId, BLOCK_ID);
		const records = dbStore.getRecordIds(subId, '');
		const views = dbStore.getViews(rootId, BLOCK_ID);
		const viewId = parent.content.viewId || (views.length ? views[0].id : '');
		const ret = Dataview.applyObjectOrder(rootId, BLOCK_ID, viewId, '', UtilCommon.objectCopy(records));

		return (targetBlockId == Constant.widgetId.favorite) ? sortFavorite(ret) : ret;
	};

	getItems () {
		const { block, addGroupLabels, isPreview } = this.props;
		const rootId = this.getRootId();
		const subId = dbStore.getSubId(rootId, BLOCK_ID);
		const { targetBlockId } = block.content;
		const isRecent = [ Constant.widgetId.recentOpen, Constant.widgetId.recentEdit ].includes(targetBlockId);

		let items = this.getRecords().map(id => detailStore.get(subId, id, Constant.sidebarRelationKeys));

		if (isPreview && isRecent) {
			// add group labels
			items = addGroupLabels(items, targetBlockId);
		};

		return items;
	};

	resize () {
		const { parent, isPreview } = this.props;
		const length = this.getItems().length;

		raf(() => {
			const node = $(this.node);
			const body = node.find('#body');
			const head = $(`#widget-${parent.id} .head`);
			const viewSelect = node.find('#viewSelect');
			const inner = viewSelect.find('.inner');
			const viewItem = viewSelect.find('.viewItem');
			const offset = isPreview ? 20 : 8;

			let height = this.getTotalHeight() + offset;
			if (isPreview) {
				let maxHeight = $('#listWidget').height() - head.outerHeight(true);
				if (viewSelect.length) {
					maxHeight -= viewSelect.outerHeight(true);
				};

				height = Math.min(maxHeight, height);
			};

			const css: any = { height, paddingTop: '', paddingBottom: 8 };
			
			if (!length) {
				css.paddingTop = 20;
				css.paddingBottom = 22;
				css.height = 36 + css.paddingTop + css.paddingBottom;
			};

			body.css(css);

			let width = 32;
			viewItem.each((i: number, item) => { width += $(item).outerWidth(true); });
			inner.css({ width });
		});
	};

	getTotalHeight () {
		const items = this.getItems();

		let height = 0;

		items.forEach((item, index) => {
			height += this.getRowHeight(item, index);
		});

		return height;
	};

	getRowHeight (item: any, index: number) {
		if (item && item.isSection) {
			return index ? HEIGHT_COMPACT + 12 : HEIGHT_COMPACT;
		};
		return this.props.isCompact ? HEIGHT_COMPACT : HEIGHT_LIST;
	};

	onScroll ({ scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

});

export default WidgetList;