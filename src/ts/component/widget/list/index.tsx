import * as React from 'react';
import raf from 'raf';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, CellMeasurerCache, InfiniteLoader, List } from 'react-virtualized';
import { Loader, Select, Label } from 'Component';
import { blockStore, dbStore, detailStore } from 'Store';
import { Dataview, I, C, M, UtilCommon, Relation, keyboard, UtilObject, translate } from 'Lib';
import WidgetListItem from './item';
import Constant from 'json/constant.json';

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
	state = {
		isLoading: false,
	};
	cache: any = null;

	render (): React.ReactNode {
		const { parent, block, isCollection, isPreview, sortFavorite } = this.props;
		const { viewId, limit } = parent.content;
		const { targetBlockId } = block.content;
		const { isLoading } = this.state;
		const rootId = this.getRootId();
		const views = dbStore.getViews(rootId, BLOCK_ID).map(it => ({ ...it, name: it.name || UtilObject.defaultName('Page') }));
		const subId = dbStore.getSubId(rootId, BLOCK_ID);
		const { total } = dbStore.getMeta(subId, '');
		const isSelect = !isPreview || !UtilCommon.isPlatformMac();

		let records = this.getRecords();
		if (targetBlockId == Constant.widgetId.favorite) {
			records = sortFavorite(records);
		};

		const length = records.length;

		if (!this.cache) {
			return null;
		};

		let content = null;

		if (isLoading) {
			content = <Loader />;
		} else
		if (!length) {
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
						subId={subId} 
						id={records[index]} 
						style={style} 
					/>
				</CellMeasurer>
			);

			content = (
				<InfiniteLoader
					rowCount={total}
					loadMoreRows={() => {}}
					isRowLoaded={() => true}
					threshold={LIMIT}
				>
					{({ onRowsRendered }) => (
						<AutoSizer className="scrollArea">
							{({ width, height }) => (
								<List
									width={width}
									height={height}
									deferredMeasurmentCache={this.cache}
									rowCount={length}
									rowHeight={this.getRowHeight()}
									rowRenderer={rowRenderer}
									onRowsRendered={onRowsRendered}
									overscanRowCount={LIMIT}
									scrollToAlignment="center"
								/>
						)}
						</AutoSizer>
					)}
				</InfiniteLoader>
			);
		} else {
			content = (
				<React.Fragment>
					{records.map((id: string) => (
						<WidgetListItem key={`widget-${block.id}-${id}`} {...this.props} subId={subId} id={id} />
					))}
				</React.Fragment>
			);
		};

		let viewSelect = null;

		if (!isCollection(targetBlockId)) {
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
				{viewSelect ? (
					<div id="viewSelect">
						{viewSelect}
					</div>
				) : ''}
				<div id="body" className="body">
					{content}
				</div>
			</div>
		);
	};

	componentDidMount (): void {
		const { parent, block, isCollection, getData } = this.props;
		const { viewId } = parent.content;
		const { targetBlockId } = block.content;

		if (isCollection(targetBlockId)) {
			getData(dbStore.getSubId(this.getRootId(), BLOCK_ID), () => this.resize());
		} else {
			this.setState({ isLoading: true });

			C.ObjectShow(targetBlockId, this.getTraceId(), () => {
				this.setState({ isLoading: false });

				const view = Dataview.getView(this.getRootId(), BLOCK_ID, viewId);
				if (view) {
					this.load(view.id);
				};
			});
		};
	};

	componentDidUpdate (): void {
		const { parent, block, isCollection } = this.props;
		const { viewId } = parent.content;
		const { targetBlockId } = block.content;
		const rootId = this.getRootId();
		const view = Dataview.getView(rootId, BLOCK_ID);
		const records = this.getRecords();		

		if (!isCollection(targetBlockId) && view && (viewId != view.id)) {
			this.load(viewId);
		};

		if (!this.cache) {
			this.cache = new CellMeasurerCache({
				fixedWidth: true,
				defaultHeight: this.getRowHeight(),
				keyMapper: i => records[i],
			});
		};

		this.resize();
	};

	componentWillUnmount(): void {
		const rootId = this.getRootId();
		const subId = dbStore.getSubId(rootId, BLOCK_ID);

		dbStore.recordsClear(subId, '');
		C.ObjectSearchUnsubscribe([ subId ]);
	};

	updateData () {
		const { block, isCollection, getData } = this.props;
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

		if (isCollection(targetBlockId)) {
			getData(dbStore.getSubId(this.getRootId(), BLOCK_ID), () => this.resize());
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

	getTraceId = (): string => {
		return [ 'widget', this.props.block.id ].join('-');
	};

	getRootId = (): string => {
		const { block } = this.props;
		const { targetBlockId } = block.content;

		return [ targetBlockId, this.getTraceId() ].join('-');
	};

	load = (viewId: string) => {
		const { widgets } = blockStore;
		const { block, parent, getLimit } = this.props;
		const { targetBlockId } = block.content;
		const object = detailStore.get(widgets, targetBlockId);
		const setOf = Relation.getArrayValue(object.setOf);
		const target = detailStore.get(widgets, targetBlockId);
		const isCollection = target.type == Constant.typeId.collection;
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

	onChangeView = (viewId: string): void => {
		const { parent } = this.props;

		C.BlockWidgetSetViewId(blockStore.widgets, parent.id, viewId);
	};

	getRecords () {
		const { parent } = this.props;
		const { viewId } = parent.content;
		const rootId = this.getRootId();
		const subId = dbStore.getSubId(rootId, BLOCK_ID);
		const records = dbStore.getRecords(subId, '');

		return Dataview.applyObjectOrder(rootId, BLOCK_ID, viewId, '', UtilCommon.objectCopy(records));
	};

	resize () {
		const { parent, isPreview } = this.props;
		const length = this.getRecords().length;

		raf(() => {
			const node = $(this.node);
			const body = node.find('#body');
			const head = $(`#widget-${parent.id} .head`);
			const viewSelect = node.find('#viewSelect');
			const inner = viewSelect.find('.inner');
			const viewItem = viewSelect.find('.viewItem');
			const offset = isPreview ? 20 : 8;

			let height = this.getRowHeight() * length + offset;
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

	getRowHeight () {
		return this.props.isCompact ? HEIGHT_COMPACT : HEIGHT_LIST;
	};

});

export default WidgetList;
