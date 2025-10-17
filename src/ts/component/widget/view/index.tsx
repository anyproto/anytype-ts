import React, { forwardRef, useState, useRef, useEffect, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { Select, Label, Filter, Button } from 'Component';
import { I, C, M, S, U, J, Dataview, Relation, keyboard, translate, analytics, Storage } from 'Lib';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel, Navigation } from 'swiper/modules';

import WidgetViewList from './list';
import WidgetViewGallery from './gallery';
import WidgetViewBoard from './board';
import WidgetViewCalendar from './calendar';
import WidgetViewGraph from './graph';

interface WidgetViewRefProps {
	updateData: () => void;
	updateViews: () => void;
	onOpen: () => void;
	setSearchIds: (ids: string[]) => void;
	appendSearchIds?: (ids: string[]) => void;
	getSearchIds: () => string[];
	getFilter: () => string;
};

const WidgetView = observer(forwardRef<WidgetViewRefProps, I.WidgetComponent>((props, ref: any) => {

	const { 
		parent, block, isSystemTarget, isPreview, canCreate, getData, getTraceId, getLimit, checkShowAllButton, onCreate,
		getContentParam, getObject
	} = props;
	const { viewId, limit, layout } = getContentParam();
	const targetId = block ? block.getTargetObjectId() : '';
	const [ searchIds, setSearchIds ] = useState<string[]>(null);
	const prevIdsRef = useRef<string[]>(null);
	const selectRef = useRef(null);
	const childRef = useRef(null);
	const filterRef = useRef(null);
	const filter = useRef('');
	const filterTimeout = useRef(0);
	const traceId = getTraceId();
	const rootId = block ? [ targetId, traceId ].join('-') : '';
	const subId = S.Record.getSubId(rootId, J.Constant.blockId.dataview);
	const object = getObject(targetId);
	const view = Dataview.getView(rootId, J.Constant.blockId.dataview, viewId);
	const viewType = view ? view.type : I.ViewType.List;
	const isOpen = Storage.checkToggle('widget', parent.id);
	const isShown = isOpen || isPreview;

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
			load(view.id, true);
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

	const load = (viewId: string, clear?: boolean) => {
		if (childRef.current?.load) {
			childRef.current?.load(searchIds);
			S.Record.metaSet(subId, '', { viewId });
			return;
		};

		const setOf = Relation.getArrayValue(object.setOf);
		const isCollection = U.Object.isCollectionLayout(object.layout);
		const view = getView();

		if (!view || (!setOf.length && !isCollection)) {
			return;
		};

		Dataview.getData({
			rootId,
			blockId: J.Constant.blockId.dataview,
			subId,
			newViewId: viewId,
			sources: setOf,
			limit: getLimitHandler(),
			filters: getFilters(),
			collectionId: (isCollection ? object.id : ''),
			keys: J.Relation.sidebar.concat([ view.groupRelationKey, view.coverRelationKey ]).concat(J.Relation.cover),
			noDeps: true,
			clear,
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

		if (searchIds) {
			filters.push({ relationKey: 'id', condition: I.FilterCondition.In, value: searchIds });
		};

		return filters;
	};

	const getSorts = () => {
		if (!view) {
			return [];
		};

		const sorts: I.Sort[] = U.Common.objectCopy(view.sorts || []);

		if (!sorts.length) {
			sorts.push({ relationKey: 'createdDate', type: I.SortType.Desc, includeTime: true });
		};

		return sorts;
	};

	const getView = () => {
		return Dataview.getView(rootId, J.Constant.blockId.dataview, viewId);
	};

	const getLimitHandler = (): number => {
		const view = getView();
		return view ? getLimit() : 0;
	};

	const onChangeView = (viewId: string) => {
		switch (parent.content.section) {
			case I.WidgetSection.Pin: {
				C.BlockWidgetSetViewId(S.Block.widgets, parent.id, viewId);
				break;
			};

			case I.WidgetSection.Type: {
				C.ObjectListSetDetails([ targetId ], [ { key: 'widgetViewId', value: viewId } ], () => {
					S.Block.updateWidgetData(targetId);
				});
				break;
			};
		};
	};

	const getRecordIds = () => {
		const records = S.Record.getRecordIds(subId, '');
		const views = S.Record.getViews(rootId, J.Constant.blockId.dataview);
		const id = viewId || (views.length ? views[0].id : '');

		return Dataview.applyObjectOrder(rootId, J.Constant.blockId.dataview, id, '', U.Common.objectCopy(records));
	};

	const onOpen = () => {
		if (childRef.current?.onOpen) {
			childRef.current?.onOpen();
		};
	};

	const onFilterChange = (v: string) => {
		window.clearTimeout(filterTimeout.current);
		filterTimeout.current = window.setTimeout(() => {
			if (filter.current == v) {
				return;
			};

			filter.current = v;

			if (!filter.current) {
				setSearchIds(null);
				return;
			};

			U.Subscription.destroyList([ subId ], false, () => {
				U.Subscription.search({
					filters: getFilters(),
					sorts: getSorts(),
					fullText: filter.current,
					keys: [ 'id' ],
				}, (message: any) => {
					setSearchIds((message.records || []).map(it => it.id));
				});
			});
		}, J.Constant.delay.keyboard);
	};

	const records = getRecordIds();
	const length = records.length;
	const views = S.Record.getViews(rootId, J.Constant.blockId.dataview).map(it => ({ ...it, name: it.name || translate('defaultNamePage') }));
	const cn = [ 'innerWrap' ];
	const showEmpty = ![ I.ViewType.Calendar, I.ViewType.Board ].includes(viewType);
	const isEmpty = !length && showEmpty;
	const childProps = {
		...props,
		ref: childRef,
		rootId,
		subId,
		reload: () => load(viewId, true),
		getRecordIds,
		getView: () => view,
		getViewType: () => viewType,
		getObject: () => object,
		getViewLimit: getLimitHandler,
	};

	let content = null;
	let viewSelect = null;
	let head = null;

	if (!isSystemTarget && (views.length > 1)) {
		if (isPreview) {
			viewSelect = (
				<div id="tabs" className="tabs">
					<Swiper
						direction="horizontal"
						slidesPerView="auto"
						slidesPerGroupAuto={true}
						spaceBetween={12}
						mousewheel={true}
						navigation={true}
						modules={[ Mousewheel, Navigation ]}
					>
						{views.map((it: any, i: number) => {
							const cn = [ 'tab' ];

							if (viewId == it.id) {
								cn.push('active');
							};

							return (
								<SwiperSlide key={it.id}>
									<div
										key={it.id}
										className={cn.join(' ')}
										onClick={() => onChangeView(it.id)}
									>
										{it.name}
									</div>
								</SwiperSlide>
							);
						})}
					</Swiper>
				</div>
			);
		} else {
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
	};

	if (viewSelect) {
		cn.push('withViewSelect');
	};

	if (isPreview) {
		head = (
			<div className="head">
				<div className="filterWrapper">
					<div className="side left">
						<Filter
							ref={filterRef}
							className="outlined"
							icon="search"
							placeholder={translate('commonSearch')}
							onChange={onFilterChange}
							onClear={() => setSearchIds([])}
						/>
					</div>
					{canCreate ? (
						<div className="side right">
							<Button 
								id="button-object-create" 
								color="blank" 
								className="c28" 
								text={translate('commonNew')} 
								onClick={() => onCreate({ 
									element: '#button-object-create', 
									route: analytics.route.widget,
									details: {
										name: String(filterRef.current?.getValue() || ''),
									},
								})} 
							/>
						</div>
					) : ''}
				</div>
			</div>
		);
	};

	if (isEmpty) {
		const label = targetId == J.Constant.widgetId.favorite ? translate('widgetEmptyFavoriteLabel') : translate('widgetEmptyLabel');

		content = (
			<div className="emptyWrap">
				<Label className="empty" text={label} />
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
		} else 
		if (targetId) {
			const root = S.Block.getLeaf(rootId, targetId);
			const cb = () => {
				const view = getView();
				if (view) {
					load(view.id);
				};
			};

			if (root) {
				cb();
				return;
			};

			C.ObjectShow(targetId, traceId, U.Router.getRouteSpaceId(), (message) => {
				if (!message.error.code) {
					cb();
				};
			});
		};
	}, []);

	useEffect(() => {
		if (!isSystemTarget) {
			load(viewId, true);
		};
	}, [ viewId ]);

	useEffect(() => {
		if (U.Common.compareJSON(searchIds, prevIdsRef.current)) {
			return;
		};

		if (view) {
			load(view.id, true);
		};

		prevIdsRef.current = searchIds;
	}, [ searchIds ]);

	useEffect(() => {
		$(`#widget-${parent.id}`).toggleClass('isEmpty', isEmpty);

		checkShowAllButton(subId);
	});

	useImperativeHandle(ref, () => ({
		updateData,
		updateViews,
		onOpen,
		setSearchIds,
		appendSearchIds: (ids: string[]) => setSearchIds((searchIds || []).concat(ids || [])),
		getSearchIds: () => searchIds,
		getFilter: () => filter.current,
	}));

	return (
		<div 
			id="innerWrap"
			className={cn.join(' ')}
			style={{ display: isShown ? 'flex' : 'none' }}
		>
			{viewSelect ? <div id="viewSelect">{viewSelect}</div> : ''}
			{head}
			{content}
		</div>
	);

}));

export default WidgetView;