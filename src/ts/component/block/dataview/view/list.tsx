import * as React from 'react';
import { AutoSizer, WindowScroller, List, InfiniteLoader } from 'react-virtualized';
import { observer } from 'mobx-react';
import $ from 'jquery';
import { dbStore, blockStore } from 'Store';
import { Icon, LoadMore } from 'Component';
import { I, translate } from 'Lib';
import Empty from '../empty';
import Row from './list/row';

interface Props extends I.ViewComponent {};

const HEIGHT = 32;

const ViewList = observer(class ViewList extends React.Component<Props, object> {

	ref: any = null;

	constructor (props: any) {
		super (props);

		this.loadMoreRows = this.loadMoreRows.bind(this);
	};

	render () {
		const { rootId, block, getView, isPopup, readonly, onRecordAdd, isInline, getLimit } = this.props;
		const view = getView();
		const subId = dbStore.getSubId(rootId, block.id);
		const records = dbStore.getRecords(subId, '');
		const allowed = blockStore.checkFlags(rootId, block.id, [ I.RestrictionDataview.Object ]);
		const { offset, total } = dbStore.getMeta(dbStore.getSubId(rootId, block.id), '');
		const limit = getLimit();
		const length = records.length;

		if (!length) {
			return (
				<Empty 
					{...this.props}
					title="No objects of this type" 
					description="Create the first object of this type to start your set"
					button="Add a new object"
					withButton={allowed}
					onClick={(e: any) => onRecordAdd(e, 1)}
				/>
			);
		};

		let content = null;

		if (isInline) {
			content = (
				<div>
					{records.map((id: string, index: number) => (
						<Row
							key={'grid-row-' + view.id + index}
							{...this.props}
							style={{height: HEIGHT}}
							readonly={readonly || !allowed}
							index={index}
						/>
					))}
				</div>
			);
		} else {
			content = (
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
			);
		};

		return (
			<div className="wrap">
				<div className="viewItem viewList">

					{content}

					{isInline && (limit + offset < total) ? (
						<LoadMore limit={getLimit()} loaded={records.length} total={total} onClick={this.loadMoreRows} />
					) : ''}

					{!readonly && allowed && !isInline ? (
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
		let { rootId, block, getData, getView, getLimit } = this.props;
		let subId = dbStore.getSubId(rootId, block.id);
		let { offset } = dbStore.getMeta(subId, '');
		let view = getView();

        return new Promise((resolve, reject) => {
			offset += getLimit();
			getData(view.id, offset, false, resolve);
			dbStore.metaSet(subId, '', { offset });
		});
	};

});

export default ViewList;