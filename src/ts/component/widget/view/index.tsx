import * as React from 'react';
import { observer } from 'mobx-react';
import { Select, Label, Button } from 'Component';
import { I, C, M, S, U, J, Dataview, Relation, keyboard, translate } from 'Lib';

import WidgetViewList from './list';
import WidgetViewGallery from './gallery';
import WidgetViewBoard from './board';
import WidgetViewCalendar from './calendar';

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
		const { parent, block, isSystemTarget, onCreate } = this.props;
		const { viewId, limit, layout } = parent.content;
		const { targetBlockId } = block.content;
		const { isLoading } = this.state;
		const rootId = this.getRootId();
		const subId = this.getSubId();
		const records = this.getRecordIds();
		const length = records.length;
		const views = S.Record.getViews(rootId, J.Constant.blockId.dataview).map(it => ({ ...it, name: it.name || translate('defaultNamePage') }));
		const viewType = this.getViewType();
		const cn = [ 'innerWrap' ];
		const showEmpty = ![ I.ViewType.Calendar, I.ViewType.Board ].includes(viewType);
		const canCreate = this.props.canCreate && this.isAllowedObject();
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
			content = (
				<div className="emptyWrap">
					<Label className="empty" text={canCreate ? translate('widgetEmptyLabelCreate') : translate('widgetEmptyLabel')} />
					{canCreate ? <Button text={translate('commonCreateObject')} color="blank" className="c28" onClick={onCreate} /> : ''}
				</div>
			);
		} else {
			if (layout == I.WidgetLayout.View) {
				cn.push(`view${I.ViewType[viewType]}`);
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
						content = <WidgetViewCalendar {...props} />;
						break;
					};
				};
			} else {
				cn.push('viewList');
				content = <WidgetViewList {...props} />;
			};
		};

		return (
			<div 
				ref={node => this.node = node}
				id="innerWrap"
				className={cn.join(' ')}
			>
				{viewSelect ? <div id="viewSelect">{viewSelect}</div> : ''}
				{content}
			</div>
		);
	};

	componentDidMount (): void {
		const { block, isSystemTarget, getData, getTraceId } = this.props;
		const { targetBlockId } = block.content;

		if (isSystemTarget()) {
			getData(this.getSubId());
		} else {
			this.setState({ isLoading: true });

			C.ObjectShow(targetBlockId, getTraceId(), U.Router.getRouteSpaceId(), () => {
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
		const view = Dataview.getView(this.getRootId(), J.Constant.blockId.dataview);

		if (!isSystemTarget() && view && viewId && (viewId != view.id)) {
			this.load(viewId);
		};
	};

	componentWillUnmount(): void {
		C.ObjectSearchUnsubscribe([ this.getSubId() ]);
	};

	updateData () {
		const { block, isSystemTarget, getData } = this.props;
		const targetId = block.getTargetObjectId();
		const rootId = this.getRootId();
		const srcObject = S.Detail.get(targetId, targetId);
		const srcBlock = S.Block.getLeaf(targetId, J.Constant.blockId.dataview);

		// Update block and details in widget with source block if object is open
		if (srcBlock) {
			let dstBlock = S.Block.getLeaf(rootId, J.Constant.blockId.dataview);

			if (dstBlock) {
				dstBlock = Object.assign(dstBlock, srcBlock);
			};

			if (!srcObject._empty_) {
				S.Detail.update(rootId, { id: srcObject.id, details: srcObject }, false);
			};
		};

		if (isSystemTarget()) {
			getData(this.getSubId());
		} else {
			const view = Dataview.getView(this.getRootId(), J.Constant.blockId.dataview);
			if (view) {
				this.load(view.id);
			};
		};
	};

	updateViews () {
		const { block } = this.props;
		const { targetBlockId } = block.content;
		const views = U.Common.objectCopy(S.Record.getViews(targetBlockId, J.Constant.blockId.dataview)).map(it => new M.View(it));
		const rootId = this.getRootId();

		if (!views.length || (targetBlockId != keyboard.getRootId())) {
			return;
		};

		S.Record.viewsClear(rootId, J.Constant.blockId.dataview);
		S.Record.viewsSet(rootId, J.Constant.blockId.dataview, views);

		if (this.refSelect) {
			this.refSelect.setOptions(views);
		};
	};

	getSubId () {
		return S.Record.getSubId(this.getRootId(), J.Constant.blockId.dataview);
	};

	getRootId = (): string => {
		const { block } = this.props;
		const { targetBlockId } = block.content;

		return [ targetBlockId, 'widget', block.id ].join('-');
	};

	load (viewId: string) {
		const subId = this.getSubId();

		if (this.refChild && this.refChild.load) {
			this.refChild.load();
			S.Record.metaSet(this.getSubId(), '', { viewId });
			return;
		};

		const rootId = this.getRootId();
		const blockId = J.Constant.blockId.dataview;
		const object = this.getObject();
		const setOf = Relation.getArrayValue(object.setOf);
		const isCollection = U.Object.isCollectionLayout(object.layout);

		if (!setOf.length && !isCollection) {
			S.Record.recordsSet(subId, '', []);
			return;
		};

		const limit = this.getLimit();
		const view = this.getView();
		if (!view) {
			return;
		};

		Dataview.getData({
			rootId,
			blockId,
			newViewId: viewId,
			sources: setOf,
			limit,
			filters: this.getFilters(),
			collectionId: (isCollection ? object.id : ''),
			keys: J.Relation.sidebar.concat([ view.groupRelationKey, view.coverRelationKey ]).concat(J.Relation.cover),
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
		return Dataview.getView(this.getRootId(), J.Constant.blockId.dataview, this.props.parent.content.viewId);
	};

	getViewType () {
		const view = this.getView();
		return view ? view.type : I.ViewType.List;
	};

	getObject () {
		return S.Detail.get(S.Block.widgets, this.props.block.getTargetObjectId());
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
		C.BlockWidgetSetViewId(S.Block.widgets, this.props.parent.id, viewId);
	};

	getRecordIds () {
		const { parent, block, sortFavorite } = this.props;
		const { targetBlockId } = block.content;
		const rootId = this.getRootId();
		const subId = this.getSubId();
		const records = S.Record.getRecordIds(subId, '');
		const views = S.Record.getViews(rootId, J.Constant.blockId.dataview);
		const viewId = parent.content.viewId || (views.length ? views[0].id : '');
		const ret = Dataview.applyObjectOrder(rootId, J.Constant.blockId.dataview, viewId, '', U.Common.objectCopy(records));

		return (targetBlockId == J.Constant.widgetId.favorite) ? sortFavorite(ret) : ret;
	};

	isAllowedObject () {
		const rootId = this.getRootId();
		const object = this.getObject();
		const isCollection = U.Object.isCollectionLayout(object.layout);

		let isAllowed = S.Block.checkFlags(rootId, J.Constant.blockId.dataview, [ I.RestrictionDataview.Object ]);
		if (!isAllowed) {
			return false;
		};

		if (isAllowed && isCollection) {
			return true;
		};

		const sources = this.getSources();
		if (!sources.length) {
			return false;
		};

		const types = Relation.getSetOfObjects(rootId, object.id, I.ObjectLayout.Type);
		const skipLayouts = [ I.ObjectLayout.Participant ].concat(U.Object.getFileAndSystemLayouts());

		for (const type of types) {
			if (skipLayouts.includes(type.recommendedLayout)) {
				isAllowed = false;
				break;
			};
		};

		return isAllowed;
	};

	getSources (): string[] {
		const object = this.getObject();

		if (U.Object.isCollectionLayout(object.layout)) {
			return [];
		};

		const rootId = this.getRootId();
		const types = Relation.getSetOfObjects(rootId, object.id, I.ObjectLayout.Type).map(it => it.id);
		const relations = Relation.getSetOfObjects(rootId, object.id, I.ObjectLayout.Relation).map(it => it.id);

		return [].concat(types).concat(relations);
	};

	onOpen () {
		if (this.refChild && this.refChild.onOpen) {
			this.refChild.onOpen();
		};
	};

});

export default WidgetView;