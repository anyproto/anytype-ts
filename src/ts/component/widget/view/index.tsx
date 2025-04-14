import React, { forwardRef, useState, useRef, useEffect, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { Select, Label, Button } from 'Component';
import { I, C, M, S, U, J, Dataview, Relation, keyboard, translate, analytics } from 'Lib';

import WidgetViewList from './list';
import WidgetViewGallery from './gallery';
import WidgetViewBoard from './board';
import WidgetViewCalendar from './calendar';
import WidgetViewGraph from './graph';

interface WidgetViewRefProps {
	updateData: () => void;
	updateViews: () => void;
	onOpen: () => void;
};

const WidgetView = observer(forwardRef<WidgetViewRefProps, I.WidgetComponent>((props, ref: any) => {

	const { parent, block, isSystemTarget, onCreate, getData, getTraceId, getLimit, sortFavorite } = props;
	const { viewId, limit, layout } = parent.content;
	const targetId = block ? block.getTargetObjectId() : '';
	const [ isLoading, setIsLoading ] = useState(false);
	const nodeRef = useRef(null);
	const selectRef = useRef(null);
	const childRef = useRef(null);
	const rootId = block ? [ targetId, 'widget', block.id ].join('-') : '';
	const subId = S.Record.getSubId(rootId, J.Constant.blockId.dataview);
	const object = S.Detail.get(S.Block.widgets, targetId);
	const view = Dataview.getView(rootId, J.Constant.blockId.dataview);
	const viewType = view ? view.type : I.ViewType.List;

	const updateData = () =>{
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

		if (isSystemTarget) {
			getData(subId);
		} else 
		if (view) {
			load(view.id);
		};
	};

	const updateViews = () => {
		const views = U.Common.objectCopy(S.Record.getViews(targetId, J.Constant.blockId.dataview)).map(it => new M.View(it));

		if (!views.length || (targetId != keyboard.getRootId())) {
			return;
		};

		S.Record.viewsClear(rootId, J.Constant.blockId.dataview);
		S.Record.viewsSet(rootId, J.Constant.blockId.dataview, views);

		selectRef.current?.setOptions(views);
	};

	const load = (viewId: string) => {
		if (childRef.current?.load) {
			childRef.current?.load();
			S.Record.metaSet(subId, '', { viewId });
			return;
		};

		const setOf = Relation.getArrayValue(object.setOf);
		const isCollection = U.Object.isCollectionLayout(object.layout);

		if (!setOf.length && !isCollection) {
			S.Record.recordsSet(subId, '', []);
			return;
		};

		const view = getView();
		if (!view) {
			return;
		};

		Dataview.getData({
			rootId,
			blockId: J.Constant.blockId.dataview,
			newViewId: viewId,
			sources: setOf,
			limit: getLimitHandler(),
			filters: getFilters(),
			collectionId: (isCollection ? object.id : ''),
			keys: J.Relation.sidebar.concat([ view.groupRelationKey, view.coverRelationKey ]).concat(J.Relation.cover),
		});
	};

	const getFilters = () => {
		if (!view) {
			return [];
		};

		let filters: I.Filter[] = [];

		if (childRef.current?.getFilters) {
			filters = filters.concat(childRef.current?.getFilters());
		};

		return filters;
	};

	const getView = () => {
		return Dataview.getView(rootId, J.Constant.blockId.dataview, parent.content.viewId);
	};

	const getLimitHandler = (): number => {
		let limit = getLimit(parent.content);
		if ((layout == I.WidgetLayout.View) && (viewType == I.ViewType.Calendar)) {
			limit = 1000;
		};
		return limit;
	};

	const onChangeView = (viewId: string) => {
		C.BlockWidgetSetViewId(S.Block.widgets, parent.id, viewId);
	};

	const getRecordIds = () => {
		const records = S.Record.getRecordIds(subId, '');
		const views = S.Record.getViews(rootId, J.Constant.blockId.dataview);
		const viewId = parent.content.viewId || (views.length ? views[0].id : '');
		const ret = Dataview.applyObjectOrder(rootId, J.Constant.blockId.dataview, viewId, '', U.Common.objectCopy(records));

		return (targetId == J.Constant.widgetId.favorite) ? sortFavorite(ret) : ret;
	};

	const isAllowedObject = () => {
		const isCollection = U.Object.isCollectionLayout(object.layout);

		if (isSystemTarget) {
			return true;
		};

		let isAllowed = S.Block.checkFlags(rootId, J.Constant.blockId.dataview, [ I.RestrictionDataview.Object ]);
		if (!isAllowed) {
			return false;
		};

		if (isAllowed && isCollection) {
			return true;
		};

		const sources = getSources();
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

	const getSources = (): string[] => {
		if (U.Object.isCollectionLayout(object.layout)) {
			return [];
		};

		const types = Relation.getSetOfObjects(rootId, object.id, I.ObjectLayout.Type).map(it => it.id);
		const relations = Relation.getSetOfObjects(rootId, object.id, I.ObjectLayout.Relation).map(it => it.id);

		return [].concat(types).concat(relations);
	};

	const onOpen = () => {
		if (childRef.current?.onOpen) {
			childRef.current?.onOpen();
		};
	};

	const records = getRecordIds();
	const length = records.length;
	const views = S.Record.getViews(rootId, J.Constant.blockId.dataview).map(it => ({ ...it, name: it.name || translate('defaultNamePage') }));
	const cn = [ 'innerWrap' ];
	const showEmpty = ![ I.ViewType.Calendar, I.ViewType.Board ].includes(viewType);
	const canCreate = props.canCreate && isAllowedObject();
	const childProps = {
		...props,
		ref: childRef,
		rootId,
		subId,
		reload: () => load(viewId),
		getRecordIds,
		getView: () => view,
		getViewType: () => viewType,
		getObject: () => object,
		getViewLimit: getLimitHandler,
	};

	let content = null;
	let viewSelect = null;

	if (!isSystemTarget && (views.length > 1)) {
		viewSelect = (
			<Select 
				ref={selectRef}
				id={`select-view-${rootId}`} 
				value={viewId} 
				options={views} 
				onChange={onChangeView}
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
				{canCreate ? (
					<Button 
						text={translate('commonCreateObject')} 
						color="blank" 
						className="c28" 
						onClick={() => onCreate({ route: analytics.route.inWidget })} 
					/> 
				) : ''}
			</div>
		);
	} else {
		if (layout == I.WidgetLayout.View) {
			cn.push(`view${I.ViewType[viewType]}`);
			switch (viewType) {
				default: {
					content = <WidgetViewList {...childProps} />;
					break;
				};

				case I.ViewType.Gallery: {
					content = <WidgetViewGallery {...childProps} />;
					break;
				};

				case I.ViewType.Board: {
					content = <WidgetViewBoard {...childProps} />;
					break;
				};

				case I.ViewType.Calendar: {
					content = <WidgetViewCalendar {...childProps} />;
					break;
				};

				case I.ViewType.Graph: {
					content = <WidgetViewGraph {...childProps} />;
					break;
				};
			};
		} else {
			cn.push('viewList');
			content = <WidgetViewList {...childProps} />;
		};
	};

	useEffect(() => {
		if (isSystemTarget) {
			getData(subId);
		} else {
			setIsLoading(true);

			C.ObjectShow(targetId, getTraceId(), U.Router.getRouteSpaceId(), () => {
				setIsLoading(false);

				const view = getView();
				if (view) {
					load(view.id);
				};
			});
		};

		return () => {
			C.ObjectSearchUnsubscribe([ subId ]);
		};
	}, []);

	useEffect(() => {
		if (!isSystemTarget) {
			load(viewId);
		};
	}, [ viewId ]);

	useImperativeHandle(ref, () => ({
		updateData,
		updateViews,
		onOpen,
	}));

	return (
		<div 
			ref={nodeRef}
			id="innerWrap"
			className={cn.join(' ')}
		>
			{viewSelect ? <div id="viewSelect">{viewSelect}</div> : ''}
			{content}
		</div>
	);

}));

export default WidgetView;