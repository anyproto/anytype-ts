import * as React from 'react';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';
import { dbStore, blockStore } from 'ts/store';
import { Icon } from 'ts/component';
import { translate } from 'ts/lib';
import { AutoSizer, WindowScroller, List } from 'react-virtualized';

import Row from './list/row';

interface Props extends I.ViewComponent {}

const $ = require('jquery');
const HEIGHT = 32;

const ViewList = observer(class ViewList extends React.Component<Props, {}> {

	ref: any = null;

	render () {
		const { rootId, block, getData, getView, isPopup, readonly, onRowAdd } = this.props;
		const view = getView();
		const data = dbStore.getData(rootId, block.id);
		const { offset, total } = dbStore.getMeta(rootId, block.id);
		const allowed = blockStore.isAllowed(rootId, block.id, [ I.RestrictionDataview.Object ]);
		const length = data.length;

		return (
			<div className="wrap">
				<div className="viewItem viewList">
					<WindowScroller scrollElement={isPopup ? $('#popupPage #innerWrap').get(0) : window}>
						{({ height, isScrolling, registerChild, scrollTop }) => {
							return (
								<AutoSizer disableHeight>
									{({ width }) => (
										<List
											ref={(ref: any) => { this.ref = ref; }}
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
									)}
								</AutoSizer>
							);
						}}
					</WindowScroller>

					{!readonly && allowed ? (
						<div className="row add">
							<div className="cell add">
								<div className="btn" onClick={(e: any) => { onRowAdd(e, 1); }}>
									<Icon className="plus" />
									<div className="name">{translate('blockDataviewNew')}</div>
								</div>
							</div>
						</div>
					) : null}
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