import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, WindowScroller, List, CellMeasurer, CellMeasurerCache } from 'react-virtualized';
import { I, Relation, UtilData, UtilCommon, UtilObject } from 'Lib';
import { dbStore, detailStore } from 'Store';
import { LoadMore } from 'Component';
import Card from './gallery/card';
const Constant = require('json/constant.json');

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

		const { height } = Constant.size.dataview.gallery;

		this.cache = new CellMeasurerCache({
			defaultHeight: height,
			fixedWidth: true,
		});

		this.onResize = this.onResize.bind(this);
		this.loadMoreCards = this.loadMoreCards.bind(this);
		this.getCoverObject = this.getCoverObject.bind(this);
	};

	render () {
		const { rootId, block, isPopup, isInline, className, getView, getKeys, getLimit, getVisibleRelations, onRecordAdd, getEmpty, getRecords } = this.props;
		const view = getView();
		const relations = getVisibleRelations();
		const subId = dbStore.getSubId(rootId, block.id);
		const records = getRecords();
		const { coverRelationKey, cardSize, hideIcon } = view;
		const { offset, total } = dbStore.getMeta(subId, '');
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
			const item = detailStore.get(subId, id, getKeys(view.id));
			if (item._empty_) {
				continue;
			};
		
			for (const k in item) {
				const relation = dbStore.getRelationByKey(k);
				if (!relation || ![ I.RelationType.Object, I.RelationType.File ].includes(relation.format)) {
					continue;
				};

				const v = Relation.getArrayValue(item[k]);
				if (v && v.length) {
					v.forEach((it: string) => {
						const object = detailStore.get(rootId, it, []);
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
				<React.Fragment>
					{records.map(id => row(id))}
				</React.Fragment>
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
					<div className={[ 'galleryWrap', UtilData.cardSizeClass(cardSize) ].join(' ')}>
						{content}
					</div>

					{isInline && (limit + offset < total) ? (
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

		const { margin } = Constant.size.dataview.gallery;

		let size = 0;
		switch (view.cardSize) {
			default:				 size = 224; break;
			case I.CardSize.Medium:	 size = 284; break;
			case I.CardSize.Large:	 size = 360; break;
		};

		this.columnCount = Math.max(1, Math.floor((this.width - margin) / size));
	};

	onResize ({ width }) {
		this.width = width;

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => this.forceUpdate(), 10);
	};

	loadMoreCards ({ startIndex, stopIndex }) {
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

	getRecords () {
		const { getRecords, isAllowedObject } = this.props;
		const records = UtilCommon.objectCopy(getRecords());
		
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
		const size = Constant.size.dataview.gallery;

		let height = size.padding * 2 + size.margin - 4;

		relations.forEach(it => {
			const relation = dbStore.getRelationByKey(it.relationKey);

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
		const { rootId, block, getView, getKeys } = this.props;
		const view = getView();

		if (!view.coverRelationKey) {
			return null;
		};

		const subId = dbStore.getSubId(rootId, block.id);
		const record = detailStore.get(subId, id, getKeys(view.id));
		const value = Relation.getArrayValue(record[view.coverRelationKey]);
		const fileLayouts = UtilObject.getFileLayouts();

		let object = null;
		if (view.coverRelationKey == Constant.pageCoverRelationKey) {
			object = record;
		} else {
			for (const id of value) {
				const file = detailStore.get(subId, id, []);
				if (file._empty_ || !fileLayouts.includes(file.layout)) {
					continue;
				};

				object = file;
				break;
			};
		};

		if (!object || object._empty_) {
			return null;
		};

		if (!object.coverId && !object.coverType && !fileLayouts.includes(object.layout)) {
			return null;
		};

		return object;
	};

});

export default ViewGallery;