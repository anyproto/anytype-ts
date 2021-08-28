import * as React from 'react';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';
import { dbStore } from 'ts/store';
import { AutoSizer, WindowScroller, List } from 'react-virtualized';

import Row from './list/row';

interface Props extends I.ViewComponent {}

const $ = require('jquery');
const HEIGHT = 32;

const ViewList = observer(class ViewList extends React.Component<Props, {}> {

	render () {
		const { rootId, block, getData, getView, isPopup } = this.props;
		const view = getView();
		const data = dbStore.getData(rootId, block.id);
		const { offset, total } = dbStore.getMeta(rootId, block.id);

		return (
			<div className="wrap">
				<div className="viewItem viewList">
					<WindowScroller scrollElement={isPopup ? $('#popupPage #innerWrap').get(0) : window}>
						{({ height, isScrolling, registerChild, scrollTop }) => {
							return (
								<AutoSizer disableHeight>
									{({ width }) => {
										return (
											<div ref={registerChild}>
												<List
													autoHeight
													height={Number(height) || 0}
													width={Number(width) || 0}
													isScrolling={isScrolling}
													rowCount={data.length}
													rowHeight={HEIGHT}
													rowRenderer={({ key, index, style }) => (
														<div className="listItem" key={key} style={style}>
															<Row 
																key={'grid-row-' + view.id + index} 
																{...this.props}
																index={index}
															/>
														</div>
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

	componentDidUpdate () {
		const win = $(window);
		win.trigger('resize.editor');
	};

});

export default ViewList;