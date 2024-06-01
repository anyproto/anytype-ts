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

const BLOCK_ID = 'dataview';

const WidgetView = observer(class WidgetView extends React.Component<I.WidgetComponent, State> {

	node = null;
	state = {
		isLoading: false,
	};
	refSelect = null;
	refChild = null;

	constructor (props: I.WidgetComponent) {
		super(props);
		
		this.getSubId = this.getSubId.bind(this);
		this.getRecords = this.getRecords.bind(this);
	};

	render (): React.ReactNode {
		const { parent, block, isSystemTarget, isPreview } = this.props;
		const { viewId, limit } = parent.content;
		const { targetBlockId } = block.content;
		const { isLoading } = this.state;
		const rootId = this.getRootId();
		const subId = this.getSubId();
		const records = this.getRecords();
		const length = records.length;
		const views = dbStore.getViews(rootId, BLOCK_ID).map(it => ({ ...it, name: it.name || translate('defaultNamePage') }));
		const view = Dataview.getView(rootId, BLOCK_ID, viewId);
		const cn = [ 'innerWrap' ];
		const props = {
			...this.props,
			ref: ref => this.refChild = ref,
			getRecords: this.getRecords,
			rootId,
			subId,
		};

		let content = null;
		let viewSelect = null;
		let viewType = I.ViewType.List;

		if (view) {
			viewType = view.type;
		};

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

		if (!isLoading && !length) {
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
		const { parent, block, isSystemTarget, getData } = this.props;
		const { viewId } = parent.content;
		const { targetBlockId } = block.content;

		if (isSystemTarget()) {
			getData(this.getSubId());
		} else {
			this.setState({ isLoading: true });

			C.ObjectShow(targetBlockId, this.getTraceId(), UtilRouter.getRouteSpaceId(), () => {
				this.setState({ isLoading: false });

				const view = Dataview.getView(this.getRootId(), BLOCK_ID, viewId);
				if (view) {
					this.load(view.id);
				};
			});
		};
	};

	componentDidUpdate (): void {
		const { parent, isSystemTarget } = this.props;
		const { viewId } = parent.content;
		const rootId = this.getRootId();
		const view = Dataview.getView(rootId, BLOCK_ID);

		if (!isSystemTarget() && view && (viewId != view.id)) {
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
		const srcBlock = blockStore.getLeaf(targetBlockId, BLOCK_ID);

		// Update block in widget with source block if object is open
		if (srcBlock) {
			let dstBlock = blockStore.getLeaf(rootId, BLOCK_ID);

			if (dstBlock) {
				dstBlock = Object.assign(dstBlock, srcBlock);
			};
		};

		if (isSystemTarget()) {
			getData(this.getSubId());
		} else {
			const view = Dataview.getView(this.getRootId(), BLOCK_ID);
			if (view) {
				this.load(view.id);
			};
		};
	};

	updateViews () {
		const { block } = this.props;
		const { targetBlockId } = block.content;
		const views = UtilCommon.objectCopy(dbStore.getViews(targetBlockId, BLOCK_ID)).map(it => new M.View(it));
		const rootId = this.getRootId();

		if (!views.length || (targetBlockId != keyboard.getRootId())) {
			return;
		};

		dbStore.viewsClear(rootId, BLOCK_ID);
		dbStore.viewsSet(rootId, BLOCK_ID, views);

		if (this.refSelect) {
			this.refSelect.setOptions(views);
		};
	};

	getSubId () {
		return dbStore.getSubId(this.getRootId(), BLOCK_ID);
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
		const { widgets } = blockStore;
		const { block, parent, getLimit } = this.props;
		const { targetBlockId } = block.content;
		const object = detailStore.get(widgets, targetBlockId);
		const setOf = Relation.getArrayValue(object.setOf);
		const target = detailStore.get(widgets, targetBlockId);
		const isCollection = target.layout == I.ObjectLayout.Collection;
		const limit = getLimit(parent.content);

		if (!setOf.length && !isCollection) {
			return;
		};

		Dataview.getData({
			rootId: this.getRootId(),
			blockId: BLOCK_ID,
			newViewId: viewId,
			sources: setOf,
			limit,
			collectionId: (isCollection ? targetBlockId : ''),
			keys: Constant.sidebarRelationKeys,
		});
	};

	onChangeView = (viewId: string): void => {
		C.BlockWidgetSetViewId(blockStore.widgets, this.props.parent.id, viewId);
	};

	getRecords () {
		const { parent, block, sortFavorite } = this.props;
		const { targetBlockId } = block.content;
		const rootId = this.getRootId();
		const subId = this.getSubId();
		const records = dbStore.getRecordIds(subId, '');
		const views = dbStore.getViews(rootId, BLOCK_ID);
		const viewId = parent.content.viewId || (views.length ? views[0].id : '');
		const ret = Dataview.applyObjectOrder(rootId, BLOCK_ID, viewId, '', UtilCommon.objectCopy(records));

		return (targetBlockId == Constant.widgetId.favorite) ? sortFavorite(ret) : ret;
	};

});

export default WidgetView;