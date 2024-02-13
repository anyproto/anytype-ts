import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, WindowScroller, List, InfiniteLoader } from 'react-virtualized';
import { dbStore, detailStore } from 'Store';
import { Icon, LoadMore } from 'Component';
import { I, translate, UtilCommon } from 'Lib';
import Row from './list/row';

const HEIGHT = 34;

const ViewList = observer(class ViewList extends React.Component<I.ViewComponent> {

	node: any = null;
	ref = null;

	constructor (props: I.ViewComponent) {
		super (props);

		this.loadMoreRows = this.loadMoreRows.bind(this);
	};

	render () {
		const { rootId, block, className, isPopup, isInline, getView, getKeys, onRecordAdd, getLimit, getEmpty, getRecords } = this.props;
		const view = getView();
		const records = getRecords();
		const subId = dbStore.getSubId(rootId, block.id);
		const { offset, total } = dbStore.getMeta(subId, '');
		const limit = getLimit();
		const length = records.length;
		const isAllowedObject = this.props.isAllowedObject();
		const cn = [ 'viewContent', className ];

		if (!length) {
			return getEmpty('view');
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
							readonly={!isAllowedObject}
							record={detailStore.get(subId, id)}
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
												ref={ref => this.ref = ref}
												autoHeight={true}
												height={Number(height) || 0}
												width={Number(width) || 0}
												isScrolling={isScrolling}
												rowCount={records.length}
												rowHeight={HEIGHT}
												onRowsRendered={onRowsRendered}
												rowRenderer={({ key, index, style }) => (
													<div className="listItem" key={`grid-row-${view.id + index}`} style={style}>
														<Row
															{...this.props}
															record={detailStore.get(subId, records[index], getKeys(view.id))}
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
			<div 
				ref={node => this.node = node} 
				className="wrap"
			>
				<div id="scroll" className="scroll">
					<div id="scrollWrap" className="scrollWrap">
						<div className={cn.join(' ')}>
							{content}

							{isAllowedObject ? (
								<div className="row add">
									<div className="cell add">
										<div className="btn" onClick={e => onRecordAdd(e, 1)}>
											<Icon className="plus" />
											<div className="name">{translate('commonNewObject')}</div>
										</div>
									</div>
								</div>
							) : null}

							{isInline && (limit + offset < total) ? (
								<LoadMore limit={getLimit()} loaded={records.length} total={total} onClick={this.loadMoreRows} />
							) : ''}
						</div>
					</div>
				</div>
			</div>
		);
	};

	componentDidUpdate () {
		UtilCommon.triggerResizeEditor(this.props.isPopup);
	};

	loadMoreRows ({ startIndex, stopIndex }) {
		const { rootId, block, loadData, getView, getLimit } = this.props;
		const subId = dbStore.getSubId(rootId, block.id);
		let { offset } = dbStore.getMeta(subId, '');
		const view = getView();

        return new Promise((resolve, reject) => {
			offset += getLimit();
			loadData(view.id, offset, false, resolve);
			dbStore.metaSet(subId, '', { offset });
		});
	};

});

export default ViewList;