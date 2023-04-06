import * as React from 'react';
import * as ReactDOM from 'react-dom';
import raf from 'raf';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, CellMeasurerCache, InfiniteLoader, List } from 'react-virtualized';
import { Loader, Select, Label } from 'Component';
import { blockStore, dbStore, detailStore } from 'Store';
import { Dataview, I, C, Util, Relation } from 'Lib';
import WidgetListItem from './item';
import Constant from 'json/constant.json';

type State = {
	loading: boolean;
	viewId: string;
};

const BLOCK_ID = 'dataview';
const LIMIT = 30;
const HEIGHT = 64;

const WidgetList = observer(class WidgetList extends React.Component<I.WidgetComponent, State> {

	node: any = null;
	state = {
		loading: false,
		viewId: '',
	};
	cache: any = null;

	render (): React.ReactNode {
		const { block, isCollection, isPreview } = this.props;
		const { targetBlockId } = block.content;
		const { loading, viewId } = this.state;
		const rootId = this.getRootId();
		const views = dbStore.getViews(rootId, BLOCK_ID);
		const subId = dbStore.getSubId(rootId, BLOCK_ID);
		const records = dbStore.getRecords(subId, '');
		const { total } = dbStore.getMeta(subId, '');
		const length = records.length;
		const platform = Util.getPlatform();
		const isSelect = !isPreview || (platform != I.Platform.Mac);

		if (!this.cache) {
			return null;
		};

		let content = null;

		if (loading) {
			content = <Loader />;
		} else
		if (!length) {
			content = <Label className="empty" text="There are no objects here,<br/>create the first one" />;
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
									rowHeight={HEIGHT}
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
						id={`select-view-${rootId}`} 
						value={viewId} 
						options={views} 
						onChange={this.onChangeView}
						arrowClassName="light"
						menuParam={{ width: 300 }}
					/>
				);
			} else {
				const Item = (item) => (
					<div 
						className={[ 'viewItem', (item.id == viewId ? 'active' : '') ].join(' ')} 
						onClick={() => this.onChangeView(item.id)}
					>
						{Util.shorten(item.name, 32)}
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
		const { block, isCollection, getData } = this.props;
		const { targetBlockId } = block.content;

		if (!isCollection(targetBlockId)) {
			this.setState({ loading: true });

			C.ObjectShow(targetBlockId, this.getTraceId(), () => {
				this.setState({ loading: false });

				const view = Dataview.getView(this.getRootId(), BLOCK_ID);
				if (view) {
					this.onChangeView(view.id);
					this.load(view.id);
				};
			});
		} else {
			getData(dbStore.getSubId(this.getRootId(), BLOCK_ID), () => { this.resize(); });
		};
	};

	componentDidUpdate (): void {
		const { block, isCollection } = this.props;
		const { targetBlockId } = block.content;
		const { viewId } = this.state;
		const rootId = this.getRootId();
		const view = Dataview.getView(rootId, BLOCK_ID);
		const subId = dbStore.getSubId(rootId, BLOCK_ID);
		const records = dbStore.getRecords(subId, '');

		if (!isCollection(targetBlockId) && view && (viewId != view.id)) {
			this.load(viewId);
		};

		if (!this.cache) {
			this.cache = new CellMeasurerCache({
				fixedWidth: true,
				defaultHeight: HEIGHT,
				keyMapper: i => records[i],
			});
		};

		this.resize();
	};

	componentWillUnmount(): void {
		const rootId = this.getRootId();
		const subId = dbStore.getSubId(rootId, BLOCK_ID);

		dbStore.recordsClear(subId, '');
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
		const { block, isPreview } = this.props;
		const { targetBlockId } = block.content;
		const dataview = blockStore.getLeaf(this.getRootId(), BLOCK_ID);
		
		if (!dataview) {
			return;
		};

		const object = detailStore.get(widgets, targetBlockId);
		const setOf = Relation.getArrayValue(object.setOf);
		const isCollection = Dataview.isCollection(targetBlockId, BLOCK_ID);

		if (!setOf.length && !isCollection) {
			return;
		};

		Dataview.getData({
			rootId: this.getRootId(),
			blockId: BLOCK_ID,
			newViewId: viewId,
			sources: setOf,
			limit: isPreview ? 0 : Constant.limit.widgetRecords.list,
			collectionId: (isCollection ? targetBlockId : ''),
			keys: Constant.sidebarRelationKeys,
		}, () => {
			this.resize();
		});
	};

	onChangeView = (viewId: string): void => {
		this.setState({ viewId });
	};

	resize () {
		const { parent, isPreview } = this.props;
		const rootId = this.getRootId();
		const subId = dbStore.getSubId(rootId, BLOCK_ID);
		const records = dbStore.getRecords(subId, '');
		const length = records.length;

		raf(() => {
			const node = $(this.node);
			const body = node.find('#body');
			const head = $(`#widget-${parent.id} .head`);
			const viewSelect = node.find('#viewSelect');
			const inner = viewSelect.find('.inner');
			const viewItem = viewSelect.find('.viewItem');
			const maxHeight = $('#listWidget').height() - head.outerHeight(true) - viewSelect.outerHeight(true);
			const offset = isPreview ? 20 : 8;
			const css: any = { height: Math.min(maxHeight, HEIGHT * length + offset), paddingTop: '', paddingBottom: 8 };
			
			if (!length) {
				css.paddingTop = 8;
				css.height = 36 + css.paddingTop + css.paddingBottom;
			};

			body.css(css);

			let width = 32;
			viewItem.each((i: number, item) => { width += $(item).outerWidth(true); });
			inner.css({ width });
		});
	};

});

export default WidgetList;