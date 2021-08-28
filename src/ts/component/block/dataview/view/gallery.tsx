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
const SPACE = 16;

const ViewGallery = observer(class ViewGallery extends React.Component<Props, {}> {

	cache: any = {};
	cellPositioner: any = null;
	ref: any = null;

	constructor(props: Props) {
		super(props);

		const size = Constant.size.dataview.gallery;

		this.cache = new CellMeasurerCache({
			defaultHeight: 250,
			defaultWidth: size.card,
			fixedWidth: true,
		});

		this.cellPositioner = createMasonryCellPositioner({
			cellMeasurerCache: this.cache,
			columnCount: 3,
			columnWidth: size.card,
			spacer: SPACE,
		});

		this.onResize = this.onResize.bind(this);
	};

	render () {
		const { rootId, block, getData, getView, isPopup } = this.props;
		const view = getView();
		const data = dbStore.getData(rootId, block.id);
		const { offset, total } = dbStore.getMeta(rootId, block.id);

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
														<CellMeasurer cache={this.cache} index={index} key={key} parent={parent}>
															<Card 
																key={'gallery-card-' + view.id + index} 
																{...this.props} 
																index={index} 
																style={style}
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
				</div>
			</div>
		);
	};

	onResize ({ width }) {
		const size = Constant.size.dataview.gallery;

		this.cellPositioner.reset({
			columnCount: Math.floor(width / (size.card + SPACE)),
			columnWidth: size.card,
			spacer: SPACE,
    	});
		this.ref.recomputeCellPositions();
	};
	
});

export default ViewGallery;