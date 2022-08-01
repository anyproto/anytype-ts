import * as React from 'react';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';
import { dbStore, blockStore } from 'ts/store';
import { Icon } from 'ts/component';
import { translate } from 'ts/lib';
import { AutoSizer, WindowScroller, List, InfiniteLoader } from 'react-virtualized';

import Row from './list/row';

interface Props extends I.ViewComponent {};

const $ = require('jquery');
const Constant = require('json/constant.json');
const HEIGHT = 32;

const ViewList = observer(class ViewList extends React.Component<Props, {}> {

	ref: any = null;

	constructor (props: any) {
		super (props);

		this.loadMoreRows = this.loadMoreRows.bind(this);
	};

	render () {
		const { rootId, block, getView, isPopup, readonly, onRecordAdd } = this.props;
		const view = getView();
		const subId = dbStore.getSubId(rootId, block.id);
		const records = dbStore.getRecords(subId, '');
		const allowed = blockStore.checkFlags(rootId, block.id, [ I.RestrictionDataview.Object ]);
		const { total } = dbStore.getMeta(dbStore.getSubId(rootId, block.id), '');
		const length = records.length;

		return (
			<div className="wrap">
				<div className="viewItem viewList">
					<InfiniteLoader
						isRowLoaded={({ index }) => !!records[index]}
						loadMoreRows={this.loadMoreRows}
						rowCount={total}
						threshold={10}
					>
						{({ onRowsRendered, registerChild }) => (
							<WindowScroller scrollElement={isPopup ? $('#popupPage-innerWrap').get(0) : window}>
								{({ height, isScrolling, registerChild, scrollTop }) => {
									return (
										<AutoSizer disableHeight={true}>
											{({ width }) => (
												<List
													ref={(ref: any) => { this.ref = ref; }}
													autoHeight={true}
													height={Number(height) || 0}
													width={Number(width) || 0}
													isScrolling={isScrolling}
													rowCount={records.length}
													rowHeight={HEIGHT}
													onRowsRendered={onRowsRendered}
													rowRenderer={({ key, index, style }) => (
														<div className="listItem" key={'grid-row-' + view.id + index} style={style}>
															<Row 
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
						)}
					</InfiniteLoader>

					{!readonly && allowed ? (
						<div className="row add">
							<div className="cell add">
								<div className="btn" onClick={(e: any) => { onRecordAdd(e, 1); }}>
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

	loadMoreRows ({ startIndex, stopIndex }) {
		const { rootId, block, getData, getView } = this.props;
		const { offset } = dbStore.getMeta(dbStore.getSubId(rootId, block.id), '');
		const view = getView();

        return new Promise((resolve, reject) => {
			getData(view.id, offset + Constant.limit.dataview.records, resolve);
		});
	};

});

export default ViewList;