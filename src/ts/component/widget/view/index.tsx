import * as React from 'react';
import { observer } from 'mobx-react';
import { Select, Label } from 'Component';
import { blockStore, dbStore, detailStore } from 'Store';
import { Dataview, I, C, M, UtilCommon, Relation, keyboard, translate, UtilRouter } from 'Lib';

import WidgetViewList from './list';
import WidgetViewGallery from './gallery';
import WidgetViewBoard from './board';
import WidgetViewCalendar from './calendar';

const Constant = require('json/constant.json');

interface State {
	isLoading: boolean;
};

const WidgetView = observer(class WidgetView extends React.Component<I.WidgetComponent, State> {

	node = null;
	state = {
		isLoading: false,
	};
	refSelect = null;
	refChild = null;

	constructor (props: I.WidgetComponent) {
		super(props);
		
		this.getView = this.getView.bind(this);
		this.getViewType = this.getViewType.bind(this);
		this.getSubId = this.getSubId.bind(this);
		this.getRecordIds = this.getRecordIds.bind(this);
		this.getObject = this.getObject.bind(this);
		this.getLimit = this.getLimit.bind(this);
		this.reload = this.reload.bind(this);
		this.onChangeView = this.onChangeView.bind(this);
	};

	render (): React.ReactNode {
		const { parent, block, isSystemTarget } = this.props;
		const { viewId, limit } = parent.content;
		const { targetBlockId } = block.content;
		const { isLoading } = this.state;
		const rootId = this.getRootId();
		const subId = this.getSubId();
		const records = this.getRecordIds();
		const length = records.length;
		const views = dbStore.getViews(rootId, Constant.blockId.dataview).map(it => ({ ...it, name: it.name || translate('defaultNamePage') }));
		const viewType = this.getViewType();
		const cn = [ 'innerWrap' ];
		const showEmpty = ![ I.ViewType.Calendar, I.ViewType.Board ].includes(viewType);
		const props = {
			...this.props,
			ref: ref => this.refChild = ref,
			reload: this.reload,
			getRecordIds: this.getRecordIds,
			getView: this.getView,
			getViewType: this.getViewType,
			getObject: this.getObject,
			getViewLimit: this.getLimit,
			rootId,
			subId,
		};

		let content = null;
		let viewSelect = null;

		cn.push(`view${I.ViewType[viewType]}`);

		if (!isSystemTarget() && (views.length > 1)) {
			viewSelect = (
				<Select 
					ref={ref => this.refSelect = ref}
					id={`select-view-${rootId}`} 
					value={viewId} 
					options={views} 
					onChange={this.onChangeView}
					arrowClassName="light"
					menuParam={{ 
						width: 300,
						className: 'fixed',
						classNameWrap: 'fromSidebar',
					}}
				/>
			);
		};

		if (!isLoading && !length && showEmpty) {
			content = <Label className="empty" text={translate('widgetEmptyLabel')} />;
		} else {
			switch (viewType) {
				default: {
					content = <WidgetViewList {...props} />;
					break;
				};

				case I.ViewType.Gallery: {
					content = <WidgetViewGallery {...props} />;
					break;
				};

				case I.ViewType.Board: {
					content = <WidgetViewBoard {...props} />;
					break;
				};

				case I.ViewType.Calendar: {
					content = <WidgetViewCalendar  {...props} />;
					break;
				};
			};
		};

		return (
			<div 
				ref={node => this.node = node}
				className={cn.join(' ')}
			>
				{viewSelect ? <div id="viewSelect">{viewSelect}</div> : ''}
				{content}
			</div>
		);
	};

	componentDidMount (): void {
		const { block, isSystemTarget, getData } = this.props;
		const { targetBlockId } = block.content;

		if (isSystemTarget()) {
			getData(this.getSubId());
		} else {
			this.setState({ isLoading: true });

			C.ObjectShow(targetBlockId, this.getTraceId(), UtilRouter.getRouteSpaceId(), () => {
				this.setState({ isLoading: false });

				const view = this.getView();
				if (view) {
					this.load(view.id);
				};
			});
		};
	};

	componentDidUpdate (): void {
		const { parent, isSystemTarget } = this.props;
		const { viewId } = parent.content;
		const view = Dataview.getView(this.getRootId(), Constant.blockId.dataview);

		if (!isSystemTarget() && view && viewId && (viewId != view.id)) {
			this.load(viewId);
		};
	};

	componentWillUnmount(): void {
		C.ObjectSearchUnsubscribe([ this.getSubId() ]);
	};

	updateData () {
		const { block, isSystemTarget, getData } = this.props;
		const { targetBlockId } = block.content;
		const rootId = this.getRootId();
		const srcBlock = blockStore.getLeaf(targetBlockId, Constant.blockId.dataview);

		// Update block in widget with source block if object is open
		if (srcBlock) {
			let dstBlock = blockStore.getLeaf(rootId, Constant.blockId.dataview);

			if (dstBlock) {
				dstBlock = Object.assign(dstBlock, srcBlock);
			};
		};

		if (isSystemTarget()) {
			getData(this.getSubId());
		} else {
			const view = Dataview.getView(this.getRootId(), Constant.blockId.dataview);
			if (view) {
				this.load(view.id);
			};
		};
	};

	updateViews () {
		const { block } = this.props;
		const { targetBlockId } = block.content;
		const views = UtilCommon.objectCopy(dbStore.getViews(targetBlockId, Constant.blockId.dataview)).map(it => new M.View(it));
		const rootId = this.getRootId();

		if (!views.length || (targetBlockId != keyboard.getRootId())) {
			return;
		};

		dbStore.viewsClear(rootId, Constant.blockId.dataview);
		dbStore.viewsSet(rootId, Constant.blockId.dataview, views);

		if (this.refSelect) {
			this.refSelect.setOptions(views);
		};
	};

	getSubId () {
		return dbStore.getSubId(this.getRootId(), Constant.blockId.dataview);
	};

	getTraceId = (): string => {
		return [ 'widget', this.props.block.id ].join('-');
	};

	getRootId = (): string => {
		const { block } = this.props;
		const { targetBlockId } = block.content;

		return [ targetBlockId, 'widget', block.id ].join('-');
	};

	load (viewId: string) {
		if (this.refChild && this.refChild.load) {
			this.refChild.load();
			dbStore.metaSet(this.getSubId(), '', { viewId });
			return;
		};

		const object = this.getObject();
		const setOf = Relation.getArrayValue(object.setOf);
		const isCollection = object.layout == I.ObjectLayout.Collection;
		const limit = this.getLimit();

		if (!setOf.length && !isCollection) {
			return;
		};

		Dataview.getData({
			rootId: this.getRootId(),
			blockId: Constant.blockId.dataview,
			newViewId: viewId,
			sources: setOf,
			limit,
			filters: this.getFilters(),
			collectionId: (isCollection ? object.id : ''),
			keys: Constant.sidebarRelationKeys,
		});
	};

	reload () {
		this.load(this.props.parent.content.viewId);
	};

	getFilters () {
		const view = this.getView();
		if (!view) {
			return [];
		};

		let filters: I.Filter[] = [];

		if (this.refChild && this.refChild.getFilters) {
			filters = filters.concat(this.refChild.getFilters());
		};

		return filters;
	};

	getView () {
		return Dataview.getView(this.getRootId(), Constant.blockId.dataview, this.props.parent.content.viewId);
	};

	getViewType () {
		const view = this.getView();
		return view ? view.type : I.ViewType.List;
	};

	getObject () {
		return detailStore.get(blockStore.widgets, this.props.block.getTargetObjectId());
	};

	getLimit (): number {
		const { parent, getLimit } = this.props;
		const viewType = this.getViewType();

		let limit = getLimit(parent.content);

		switch (viewType) {
			case I.ViewType.Calendar: {
				limit = 0;
				break;
			};
		};

		return limit;
	};

	onChangeView (viewId: string) {
		C.BlockWidgetSetViewId(blockStore.widgets, this.props.parent.id, viewId);
	};

	getRecordIds () {
		const { parent, block, sortFavorite } = this.props;
		const { targetBlockId } = block.content;
		const rootId = this.getRootId();
		const subId = this.getSubId();
		const records = dbStore.getRecordIds(subId, '');
		const views = dbStore.getViews(rootId, Constant.blockId.dataview);
		const viewId = parent.content.viewId || (views.length ? views[0].id : '');
		const ret = Dataview.applyObjectOrder(rootId, Constant.blockId.dataview, viewId, '', UtilCommon.objectCopy(records));

		return (targetBlockId == Constant.widgetId.favorite) ? sortFavorite(ret) : ret;
	};

});

export default WidgetView;