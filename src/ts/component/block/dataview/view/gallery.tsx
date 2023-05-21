import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { InfiniteLoader, AutoSizer, WindowScroller, List, CellMeasurer, CellMeasurerCache } from 'react-virtualized';
import { I, Relation, DataUtil, Util } from 'Lib';
import { dbStore, detailStore } from 'Store';
import { LoadMore } from 'Component';
import Card from './gallery/card';
import Constant from 'json/constant.json';

const ViewGallery = observer(class ViewGallery extends React.Component<I.ViewComponent> {

	cache: any = {};
	cellPositioner: any = null;
	ref: any = null;
	width = 0;
	columnWidth = 0;
	columnCount = 0;

	constructor (props: I.ViewComponent) {
		super(props);

		this.cache = new CellMeasurerCache({
			defaultHeight: Constant.size.dataview.gallery.height,
			defaultWidth: Constant.size.dataview.gallery.width,
			fixedWidth: true,
		});

		this.onResize = this.onResize.bind(this);
		this.loadMoreCards = this.loadMoreCards.bind(this);
	};

	render () {
		const { rootId, block, isPopup, isInline, className, getView, getKeys, getLimit, getVisibleRelations, onRecordAdd, getEmpty, getRecords } = this.props;
		const view = getView();
		const relations = getVisibleRelations();
		const subId = dbStore.getSubId(rootId, block.id);
		const records = getRecords();
		const { coverRelationKey, cardSize, hideIcon } = view;
		const { offset, total } = dbStore.getMeta(subId, '');
		const limit = getLimit();
		const length = records.length;
		const cn = [ 'viewContent', className ];

		if (!length) {
			return getEmpty('view');
		};

		const items = this.getItems();

		// Subscriptions on dependent objects
		for (let id of records) {
			const item = detailStore.get(subId, id, getKeys(view.id));
			if (item._empty_) {
				continue;
			};
		
			for (let k in item) {
				const relation = dbStore.getRelationByKey(k);
				if (!relation || ![ I.RelationType.Object, I.RelationType.File ].includes(relation.format)) {
					continue;
				};

				const v = Relation.getArrayValue(item[k]);
				if (v && v.length) {
					v.forEach((it: string) => {
						const object = detailStore.get(rootId, it, []);
					});
				};
			};
		};

		const CardAdd = () => (
			<div className="card add" onClick={e => onRecordAdd(e, 1)} />
		);

		const rowRenderer = (param: any) => {
			const item = items[param.index];
			const style = { ...param.style, gridTemplateColumns: `repeat(${this.columnCount}, minmax(0, 1fr))` };

			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
				>
					{({ measure }) => (
						<div key={'gallery-card-' + view.id + param.index} className="row" style={style}>
							{item.children.map((id: string) => {
								if (id == 'add-record') {
									return <CardAdd key={'gallery-card-' + view.id + id} />;
								} else {
									return <Card key={'gallery-card-' + view.id + id} {...this.props} recordId={id} />;
								};
							})}
						</div>
					)}
				</CellMeasurer>
			);
		};

		let content = null;

		if (isInline) {
			const records = this.getRecords();
			content = (
				<React.Fragment>
					{records.map((id: string) => {
						if (id == 'add-record') {
							return <CardAdd key={'gallery-card-' + view.id + id} />;
						} else {
							return <Card key={'gallery-card-' + view.id + id} {...this.props} recordId={id} />;
						};
					})}
				</React.Fragment>
			);
		} else {
			content = (
				<InfiniteLoader
					loadMoreRows={() => {}}
					isRowLoaded={({ index }) => !!records[index]}
					rowCount={total}
					threshold={10}
				>
					{({ onRowsRendered }) => (
						<WindowScroller scrollElement={isPopup ? $('#popupPage-innerWrap').get(0) : window}>
							{({ height, isScrolling, registerChild, scrollTop }) => {
								return (
									<AutoSizer disableHeight={true} onResize={this.onResize}>
										{({ width }) => {
											return (
												<div ref={registerChild}>
													<List
														autoHeight={true}
														ref={ref => this.ref = ref}
														width={width}
														height={height}
														deferredMeasurmentCache={this.cache}
														rowCount={items.length}
														rowHeight={this.cache.rowHeight}
														rowRenderer={rowRenderer}
														onRowsRendered={onRowsRendered}
														overscanRowCount={20}
														scrollToAlignment="start"
													/>
												</div>
											);
										}}
									</AutoSizer>
								);
							}}
						</WindowScroller>
					)}
				</InfiniteLoader>
			);
		};

		return (
			<div className="wrap">
				<div className={cn.join(' ')}>
					<div className={[ 'galleryWrap', DataUtil.cardSizeClass(cardSize) ].join(' ')}>
						{content}
					</div>

					{isInline && (limit + offset < total) ? (
						<LoadMore limit={limit} loaded={records.length} total={total} onClick={this.loadMoreCards} />
					) : ''}
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.reset();
	};

	componentDidUpdate () {
		this.reset();
	};

	reset () {
		const { isInline } = this.props;
		if (isInline || !this.ref) {
			return;
		};

		this.setDimensions();
		this.cache.clearAll();
		this.ref.recomputeRowHeights(0);
	};

	getSize (): number {
		const { getView } = this.props;
		const view = getView();
		
		let size = 0;
		switch (view.cardSize) {
			default:
			case I.CardSize.Small:	 size = 224; break;
			case I.CardSize.Medium:	 size = 284; break;
			case I.CardSize.Large:	 size = 360; break;
		};

		return size;
	};

	setDimensions () {
		const { margin } = Constant.size.dataview.gallery;

		this.columnCount = Math.max(1, Math.floor((this.width - margin) / this.getSize()));
		this.columnWidth = (this.width - (this.columnCount - 1) * margin) / this.columnCount;
	};

	onResize ({ width }) {
		this.width = width;
		this.reset();
	};

	loadMoreCards ({ startIndex, stopIndex }) {
		let { rootId, block, loadData, getView, getLimit } = this.props;
		let subId = dbStore.getSubId(rootId, block.id);
		let { offset } = dbStore.getMeta(subId, '');
		let view = getView();

		return new Promise((resolve, reject) => {
			offset += getLimit();
			loadData(view.id, offset, false, resolve);
			dbStore.metaSet(subId, '', { offset });
		});
	};

	getRecords () {
		const { getRecords } = this.props;
		const records = Util.objectCopy(getRecords());
		
		records.push('add-record');

		return records;
	};

	getItems () {
		this.setDimensions();

		const records = this.getRecords();
		const ret: any[] = [];

		let n = 0;
		let row = { children: [] };

		for (let item of records) {
			row.children.push(item);

			n++;
			if (n == this.columnCount) {
				ret.push(row);
				row = { children: [] };
				n = 0;
			};
		};

		if (row.children.length < this.columnCount) {
			ret.push(row);
		};

		return ret.filter(it => it.children.length > 0);
	};

	resize () {
		this.forceUpdate();
	};

});

export default ViewGallery;