import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, DataUtil} from 'ts/lib';
import { observer } from 'mobx-react';
import { dbStore, detailStore } from 'ts/store';
import { AutoSizer, WindowScroller, Masonry, CellMeasurer, CellMeasurerCache, createMasonryCellPositioner } from 'react-virtualized';

import Card from './gallery/card';

interface Props extends I.ViewComponent {};

const $ = require('jquery');
const Constant = require('json/constant.json');

const ViewGallery = observer(class ViewGallery extends React.Component<Props, {}> {

	cache: any = {};
	cellPositioner: any = null;
	ref: any = null;
	width: number = 0;
	columnWidth: number = 0;
	columnCount: number = 0;

	constructor(props: Props) {
		super(props);

		this.cache = new CellMeasurerCache({
			defaultHeight: 250,
			defaultWidth: Constant.size.dataview.gallery.card,
			fixedWidth: true,
		});

		this.onResize = this.onResize.bind(this);
	};

	render () {
		const { rootId, block, getData, getView, isPopup } = this.props;
		const view = getView();
		const viewRelations = view.relations.filter((it: any) => { 
			return it.isVisible && dbStore.getRelation(rootId, block.id, it.relationKey); 
		});
		const subId = dbStore.getSubId(rootId, block.id);
		const records = dbStore.getRecords(subId, '');
		const { coverRelationKey, cardSize, hideIcon } = view;

		// Subscriptions on dependent objects
		for (let item of records) {
			for (let k in item) {
				const relation = dbStore.getRelation(rootId, block.id, k);
				if (!relation) {
					continue;
				};

				const v = DataUtil.getRelationArrayValue(item[k]);
				if ([ I.RelationType.Object, I.RelationType.File ].includes(relation.format) && v && v.length) {
					v.forEach((it: string) => {
						const object = detailStore.get(rootId, it, []);
					});
				};
			};
		};

		return (
			<div className="wrap">
				<div className="viewItem viewGallery">
					<div className="galleryWrap">
						<WindowScroller scrollElement={isPopup ? $('#popupPage #innerWrap').get(0) : window}>
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
														ref={(ref: any) => { this.ref = ref; }}
														autoHeight={true}
														height={Number(height) || 0}
														width={Number(width) || 0}
														isScrolling={isScrolling}
														cellCount={records.length}
														cellMeasurerCache={this.cache}
														cellPositioner={this.cellPositioner}
														cellRenderer={({ key, index, parent, style }) => {
															return (
																<CellMeasurer cache={this.cache} index={index} key={'gallery-card-measurer-' + view.id + index} parent={parent}>
																	<Card 
																		key={'gallery-card-' + view.id + index} 
																		{...this.props} 
																		index={index} 
																		style={{ ...style, width: this.columnWidth }}
																	/>
																</CellMeasurer>
															);
														}}
														scrollTop={scrollTop}
													/>
												</div>
											);
										}}
									</AutoSizer>
								);
							}}
						</WindowScroller>
					</div>
				</div>
			</div>
		);
	};

	componentDidUpdate () {
		this.reset();
	};

	reset () {
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

});

export default ViewGallery;