import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, WindowScroller, List, InfiniteLoader } from 'react-virtualized';
import { Icon, LoadMore } from 'Component';
import { I, S, U, translate, J } from 'Lib';
import Row from './list/row';

const HEIGHT = 34;
const PADDING = 40;

const ViewList = observer(class ViewList extends React.Component<I.ViewComponent> {

	node: any = null;
	ref = null;
	rows: Map<string, any[]> = new Map();

	constructor (props: I.ViewComponent) {
		super (props);

		this.loadMoreRows = this.loadMoreRows.bind(this);
		this.listOnRef = this.listOnRef.bind(this);
	};

	render () {
		const { rootId, block, className, isPopup, isInline, getView, getSubId, onRecordAdd, getLimit, getEmpty, getRecords } = this.props;
		const view = getView();
		const records = getRecords();
		const subId = getSubId();
		const { offset, total } = S.Record.getMeta(subId, '');
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
							recordId={records[index]}
							readonly={!isAllowedObject}
							listOnRef={this.listOnRef}
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
					{({ onRowsRendered }) => (
						<WindowScroller scrollElement={isPopup ? $('#popupPage-innerWrap').get(0) : window}>
							{({ height, isScrolling, scrollTop }) => (
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
														recordId={records[index]}
														recordIdx={index}
														listOnRef={this.listOnRef}
													/>
												</div>
											)}
											scrollTop={scrollTop}
										/>
									)}
								</AutoSizer>
							)}
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

	componentDidMount () {
		this.rebind();
		this.resize();
	};

	componentDidUpdate () {
		U.Common.triggerResizeEditor(this.props.isPopup);

		const selection = S.Common.getRef('selectionProvider');
		const ids = selection?.get(I.SelectType.Record) || [];

		this.rebind();
		this.resize();

		if (ids.length) {
			selection?.renderSelection();
		};
	};

	componentWillUnmount () {
		this.unbind();
	};

	rebind () {
		const scroll = $(this.node).find('#scroll');

		this.unbind();

		scroll.on('scroll', () => this.onScroll());
	};

	unbind () {
		const scroll = $(this.node).find('#scroll');

		scroll.off('scroll');
	};

	listOnRef (ref: any, rowId: string, relationKey: string) {
		const row = this.rows.get(rowId);

		if (!row) {
			this.rows.set(rowId, [ { ref, relationKey } ]);
			return;
		};

		if (row.find(it => it.relationKey == relationKey)) {
			return;
		};

		row.push({ ref, relationKey });
		this.rows.set(rowId, row);
	};

	onScroll () {
		S.Menu.resizeAll();
	};

	loadMoreRows ({ startIndex, stopIndex }) {
		const { loadData, getView, getLimit, getSubId } = this.props;
		const subId = getSubId();
		const view = getView();

		let { offset } = S.Record.getMeta(subId, '');

		return new Promise((resolve, reject) => {
			offset += getLimit();
			loadData(view.id, offset, false, resolve);
			S.Record.metaSet(subId, '', { offset });
		});
	};

	resize () {
		const { rootId, block, isPopup, isInline, getVisibleRelations, getRecords } = this.props;
		const parent = S.Block.getParentLeaf(rootId, block.id);
		const node = $(this.node);
		const scroll = node.find('#scroll');
		const wrap = node.find('#scrollWrap');
		const container = U.Common.getPageContainer(isPopup);
		const cw = container.width();
		const records = getRecords();

		let width = 0;
		records.forEach((id) => {
			const row = this.rows.get(id);

			if (!row) {
				return;
			};

			let rowWidth = row.reduce((res: number, current: any) => {
				return res + Number(current.ref.width)
			}, 0);

			rowWidth += 8;
			if (width < rowWidth) {
				width = rowWidth;
			};
		});

		if (isInline) {
			if (parent) {
				if (parent.isPage() || parent.isLayoutDiv()) {
					const wrapper = container.find('#editorWrapper');
					const ww = wrapper.width();
					const vw = Math.max(ww, width) + (width > ww ? PADDING : 0);
					const margin = Math.max(0, (cw - ww) / 2);
					const offset = 8;

					scroll.css({ width: cw, marginLeft: -margin });
					wrap.css({ width: vw + margin - offset, paddingLeft: margin, paddingRight: offset * 2 });
				} else {
					const parentObj = $(`#block-${parent.id}`);
					const vw = parentObj.length ? (parentObj.width() - J.Size.blockMenu) : 0;

					wrap.css({ width: Math.max(vw, width) });
				};
			};
		} else {
			const mw = cw - PADDING * 2;
			const vw = Math.max(mw, width) + (width > mw ? PADDING : 0);
			const margin = (cw - mw) / 2;
			const pr = width > mw ? PADDING : 0;

			scroll.css({ width: cw - 4, marginLeft: -margin - 2, paddingLeft: margin });
			wrap.css({ width: vw, paddingRight: pr });
		};
	};

});

export default ViewList;
