import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, WindowScroller, List, CellMeasurer, CellMeasurerCache } from 'react-virtualized';
import { I, S, U, J, Relation, Dataview } from 'Lib';
import { LoadMore } from 'Component';
import Card from './gallery/card';

const ViewGallery = observer(class ViewGallery extends React.Component<I.ViewComponent> {

	cache: any = {};
	cellPositioner: any = null;
	refList = null;
	refLoader = null;
	width = 0;
	columnCount = 0;
	length = 0;
	timeout = 0;

	constructor (props: I.ViewComponent) {
		super(props);

		const { height } = J.Size.dataview.gallery;

		this.cache = new CellMeasurerCache({
			defaultHeight: height,
			fixedWidth: true,
		});

		this.onResize = this.onResize.bind(this);
		this.loadMoreCards = this.loadMoreCards.bind(this);
		this.getCoverObject = this.getCoverObject.bind(this);
	};

	render () {
		const { rootId, block, isPopup, isInline, className, getSubId, getView, getKeys, getLimit, getVisibleRelations, onRecordAdd, getEmpty, getRecords } = this.props;
		const view = getView();
		const relations = getVisibleRelations();
		const subId = getSubId();
		const records = getRecords();
		const { coverRelationKey, cardSize, hideIcon } = view;
		const { offset, total } = S.Record.getMeta(subId, '');
		const limit = getLimit();
		const cn = [ 'viewContent', className ];
		const cardHeight = this.getCardHeight();

		if (!records.length) {
			return getEmpty('view');
		};

		const items = this.getItems();
		const length = items.length;

		// Subscriptions on dependent objects
		for (const id of records) {
			const item = S.Detail.get(subId, id, getKeys(view.id));
			if (item._empty_) {
				continue;
			};
		
			for (const k in item) {
				const relation = S.Record.getRelationByKey(k);
				if (!relation || ![ I.RelationType.Object, I.RelationType.File ].includes(relation.format)) {
					continue;
				};

				const v = Relation.getArrayValue(item[k]);
				if (v && v.length) {
					v.forEach((it: string) => {
						const object = S.Detail.get(rootId, it, []);
					});
				};
			};
		};

		const CardAdd = () => (
			<div className="card add" onClick={e => onRecordAdd(e, 1)} />
		);

		const row = (id: string) => {
			if (id == 'add-record') {
				return <CardAdd key={`gallery-card-${view.id + id}`} />;
			} else {
				return (
					<Card 
						key={`gallery-card-${view.id + id}`}
						{...this.props} 
						getCoverObject={this.getCoverObject}
						recordId={id}
						recordIdx={records.indexOf(id)}
					/>
				);
			};
		};

		const rowRenderer = (param: any) => {
			const item = items[param.index];
			const style = { ...param.style, gridTemplateColumns: `repeat(${this.columnCount}, minmax(0, 1fr))` };

			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
				>
					{({ measure }) => (
						<div key={`gallery-row-${view.id + param.index}`} className="row" style={style}>
							{item.children.map(id => row(id))}
						</div>
					)}
				</CellMeasurer>
			);
		};

		let content = null;

		if (isInline) {
			const records = this.getRecords();
			content = (
				<>
					{records.map(id => row(id))}
				</>
			);
		} else {
			content = (
				<WindowScroller scrollElement={isPopup ? $('#popupPage-innerWrap').get(0) : window}>
					{({ height }) => (
						<AutoSizer disableHeight={true} onResize={this.onResize}>
							{({ width }) => (
								<List
									autoHeight={true}
									ref={ref => this.refList = ref}
									width={Number(width) || 0}
									height={Number(height) || 0}
									deferredMeasurmentCache={this.cache}
									rowCount={length}
									rowHeight={param => Math.max(this.cache.rowHeight(param), cardHeight)}
									rowRenderer={rowRenderer}
									overscanRowCount={length}
									scrollToAlignment="start"
								/>
							)}
						</AutoSizer>
					)}
				</WindowScroller>
			);
		};

		return (
			<div className="wrap">
				<div className={cn.join(' ')}>
					<div className={[ 'galleryWrap', U.Data.cardSizeClass(cardSize) ].join(' ')}>
						{content}
					</div>

					{limit + offset < total ? (
						<LoadMore limit={limit} loaded={records.length} total={total} onClick={this.loadMoreCards} />
					) : ''}
				</div>
			</div>
		);
	};

	componentDidMount (): void {
		this.reset();
	};

	componentDidUpdate (): void {
		this.reset();
	};

	componentWillUnmount () {
		window.clearTimeout(this.timeout);
	};

	reset () {
		const { isInline } = this.props;
		if (isInline) {
			return;
		};

		this.setColumnCount();
		this.cache.clearAll();

		if (this.refList) {
			this.refList.recomputeRowHeights(0);
		};
	};

	setColumnCount () {
		const { getView } = this.props;
		const view = getView();

		if (!view) {
			return;
		};

		const { margin } = J.Size.dataview.gallery;

		let size = 0;
		switch (view.cardSize) {
			default:				 size = 224; break;
			case I.CardSize.Medium:	 size = 360; break;
			case I.CardSize.Large:	 size = 480; break;
		};

		this.columnCount = Math.max(1, Math.floor((this.width - margin) / size));
	};

	onResize ({ width }) {
		this.width = width;

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => this.forceUpdate(), 10);
	};

	loadMoreCards ({ startIndex, stopIndex }) {
		const { rootId, block, loadData, getSubId, getView, getLimit } = this.props;
		const subId = getSubId();
		const view = getView();

		let { offset } = S.Record.getMeta(subId, '');

		return new Promise((resolve, reject) => {
			offset += getLimit();
			loadData(view.id, offset, false, resolve);
			S.Record.metaSet(subId, '', { offset });
		});
	};

	getRecords () {
		const { getRecords, isAllowedObject } = this.props;
		const records = U.Common.objectCopy(getRecords());
		
		if (isAllowedObject()) {
			records.push('add-record');
		};

		return records;
	};

	getItems () {
		if (!this.width) {
			return [];
		};

		this.setColumnCount();

		const records = this.getRecords();
		const ret: any[] = [];

		let n = 0;
		let row = { children: [] };

		for (const item of records) {
			row.children.push(item);

			n++;
			if (n == this.columnCount) {
				ret.push(row);
				row = { children: [] };
				n = 0;
			};
		};

		if (row.children.length < this.columnCount) {
			ret.push(row);
		};

		return ret.filter(it => it.children.length > 0);
	};

	getCardHeight (): number {
		const { getVisibleRelations } = this.props;
		const relations = getVisibleRelations();
		const size = J.Size.dataview.gallery;

		let height = size.padding * 2 + size.margin - 4;

		relations.forEach(it => {
			const relation = S.Record.getRelationByKey(it.relationKey);

			if (!relation) {
				return;
			};

			if (it.relationKey == 'name') {
				height += 24;
			} else {
				switch (relation.format) {
					default: {
						height += 22; break;
					};

					case I.RelationType.LongText: {
						height += 40; 
						break;
					};

					case I.RelationType.Object:
					case I.RelationType.File: {
						height += 24; 
						break;
					};
				};
			};
		});

		return Math.max(size.height, height);
	};

	getCoverObject (id: string): any {
		const { getView, getKeys, getSubId } = this.props;
		const view = getView();

		if (!view.coverRelationKey) {
			return null;
		};

		const subId = getSubId();
		const record = S.Detail.get(subId, id, getKeys(view.id));

		return Dataview.getCoverObject(subId, record, view.coverRelationKey);
	};

});

export default ViewGallery;
