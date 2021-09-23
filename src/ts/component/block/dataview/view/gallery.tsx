import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';
import { dbStore } from 'ts/store';
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
		const relations = view.relations.filter((it: any) => { return it.isVisible; });
		const data = dbStore.getData(rootId, block.id);
		const { offset, total } = dbStore.getMeta(rootId, block.id);
		const { coverRelationKey } = view;

		for (let item of data) {
			for (let k in item) {
			};
		};

		return (
			<div className="wrap">
				<div className="viewItem viewGallery">
					<WindowScroller scrollElement={isPopup ? $('#popupPage #innerWrap').get(0) : window}>
						{({ height, isScrolling, registerChild, scrollTop }) => {
							return (
								<AutoSizer 
									disableHeight 
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
													autoHeight
													height={Number(height) || 0}
													width={Number(width) || 0}
													isScrolling={isScrolling}
													cellCount={data.length}
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
													style={{ willChange: 'auto' }}
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

	setDimensions () {
		const { card, margin } = Constant.size.dataview.gallery;

		this.columnCount = Math.max(1, Math.floor(this.width / (card + margin)));
		this.columnWidth = Math.floor((this.width - 14 - margin * (this.columnCount - 1)) / this.columnCount);
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