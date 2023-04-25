import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, WindowScroller, Masonry, CellMeasurer, CellMeasurerCache, createMasonryCellPositioner } from 'react-virtualized';
import { I, Relation, DataUtil } from 'Lib';
import { dbStore, detailStore, blockStore } from 'Store';
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
			defaultHeight: 250,
			defaultWidth: Constant.size.dataview.gallery.card,
			fixedWidth: true,
		});

		this.onResize = this.onResize.bind(this);
		this.loadMoreCards = this.loadMoreCards.bind(this);
	};

	render () {
		const { rootId, block, getView, getKeys, isPopup, isInline, getLimit, getVisibleRelations, getRecords, className } = this.props;
		const view = getView();
		const relations = getVisibleRelations();
		const subId = dbStore.getSubId(rootId, block.id);
		const records = getRecords();
		const { coverRelationKey, cardSize, hideIcon } = view;
		const { offset, total } = dbStore.getMeta(subId, '');
		const allowed = blockStore.checkFlags(rootId, block.id, [ I.RestrictionDataview.Object ]);
		const limit = getLimit();
		const length = records.length;
		const cn = [ 'viewContent', className ];

		// Subscriptions on dependent objects
		for (let id of records) {
			const item = detailStore.get(subId, id, getKeys(view.id));
		
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

		let content = null;

		if (isInline) {
			content = (
				<React.Fragment>
					{records.map((id: string, index: number) => (
						<Card 
							key={'gallery-card-' + view.id + index} 
							{...this.props}
							index={index} 
						/>
					))}
				</React.Fragment>
			);
		} else {
			content = (
				<WindowScroller scrollElement={isPopup ? $('#popupPage-innerWrap').get(0) : window}>
					{({ height, isScrolling, registerChild, scrollTop }) => {
						return (
							<AutoSizer 
								disableHeight={true}
								onResize={this.onResize} 
								overscanByPixels={200}
							>
								{({ width }) => {
									this.width = width;
									this.setDimensions();
									this.initPositioner();

									return (
										<div ref={registerChild}>
											<Masonry
												ref={ref => { this.ref = ref; }}
												autoHeight={true}
												height={Number(height) || 0}
												width={Number(width) || 0}
												isScrolling={isScrolling}
												cellCount={records.length}
												cellMeasurerCache={this.cache}
												cellPositioner={this.cellPositioner}
												cellRenderer={({ key, index, parent, style }) => (
													<CellMeasurer cache={this.cache} index={index} key={'gallery-card-measurer-' + view.id + index} parent={parent}>
														<Card 
															key={'gallery-card-' + view.id + index} 
															{...this.props} 
															index={index} 
															style={{ ...style, width: this.columnWidth }}
														/>
													</CellMeasurer>
												)}
												scrollTop={scrollTop}
											/>
										</div>
									);
								}}
							</AutoSizer>
						);
					}}
				</WindowScroller>
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
		this.resetPositioner();
		this.ref.clearCellPositions();
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

	initPositioner () {
		if (!this.cellPositioner) {
			this.cellPositioner = createMasonryCellPositioner({
				cellMeasurerCache: this.cache,
				columnCount: this.columnCount,
				columnWidth: this.columnWidth,
				spacer: Constant.size.dataview.gallery.margin,
			});
		};
	};

	resetPositioner () {
		if (!this.cellPositioner) {
			return;
		};

		this.cellPositioner.reset({
			columnCount: this.columnCount,
			columnWidth: this.columnWidth,
			spacer: Constant.size.dataview.gallery.margin,
    	});
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

});

export default ViewGallery;