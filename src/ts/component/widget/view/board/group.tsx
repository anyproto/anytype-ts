import React, { forwardRef, useRef, useEffect } from 'react';
import { Icon, Cell } from 'Component';
import Item from './item';
import * as I from 'Interface';
import Storage from 'Lib/storage';

const ANIMATION = 200;

interface Props extends I.WidgetViewComponent {
	id: string;
	value: any;
	searchIds: string[];
};

const Group = forwardRef<{}, Props>((props, ref) => {

	const nodeRef = useRef(null);
	const { rootId, block, id, value, canCreate, searchIds, onCreate, getView, getViewLimit, getObject, getContentParam } = props;
	const { viewId } = getContentParam();
	const view = getView();
	const subId = S.Record.getGroupSubId(rootId, J.Constant.blockId.dataview, id);
	const object = getObject();
	const limit = getViewLimit();
	const { total } = S.Record.getMeta(subId, '');
	const head = { [view.groupRelationKey]: value };

	const load = () => {
		if (!view || !object) {
			return;
		};

		const relation = S.Record.getRelationByKey(view.groupRelationKey);
		if (!relation) {
			return;
		};

		const isCollection = U.Object.isCollectionLayout(object.layout);
		const filters: I.Filter[] = Dataview.getFilteredFilters([
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.excludeFromSet() },
			Dataview.getGroupFilter(relation, value),
		].concat(view.filters)).map(it => Dataview.filterMapper(it, { rootId }));
		const sorts: I.Sort[] = Dataview.getFilteredSorts(view.sorts).map(it => Dataview.sortMapper(it));

		if (searchIds) {
			filters.push({ relationKey: 'id', condition: I.FilterCondition.In, value: searchIds || [] });
		};

		U.Subscription.destroyList([ subId ], false, () => {
			U.Subscription.subscribe({
				subId,
				filters,
				sorts,
				keys: J.Relation.sidebar,
				sources: object.setOf || [],
				limit,
				collectionId: (isCollection ? object.id : ''),
			}, () => {
				S.Record.recordsSet(subId, '', applyObjectOrder(id, S.Record.getRecordIds(subId, '')));
			});
		});
	};

	const getItems = () => {
		return applyObjectOrder(id, U.Common.objectCopy(S.Record.getRecordIds(subId, '')));
	};

	const applyObjectOrder = (groupId: string, ids: string[]): any[] => {
		return Dataview.applyObjectOrder(rootId, J.Constant.blockId.dataview, viewId, groupId, ids);
	};

	const getToggleKey = () => {
		return `widget${block.id}`;
	};

	const initToggle = () => {
		const isOpen = Storage.checkToggle(getToggleKey(), id);

		if (!isOpen) {
			return;
		};

		const node = nodeRef.current;
		const item = U.Dom.select(`#item-${U.Common.esc(id)}`, node);
		const children = U.Dom.select(`#item-${U.Common.esc(id)}-children`, node);

		U.Dom.addClass(item, 'isExpanded');
		if (children) {
			U.Dom.css(children, { display: 'block' });
		};
	};

	const onToggle = () => {
		const subKey = getToggleKey();
		const isOpen = Storage.checkToggle(subKey, id);
		const node = nodeRef.current;
		const item = U.Dom.select(`#item-${U.Common.esc(id)}`, node);
		const children = U.Dom.select(`#item-${U.Common.esc(id)}-children`, node);

		if (!children) {
			return;
		};

		let height = 0;
		if (isOpen) {
			U.Dom.removeClass(item, 'isExpanded');

			U.Dom.css(children, { overflow: 'visible', height: 'auto' });
			height = children.offsetHeight;
			U.Dom.css(children, { overflow: 'hidden', height: `${height}px` });

			window.setTimeout(() => U.Dom.css(children, { height: '0px' }), 15);
			window.setTimeout(() => { U.Dom.css(children, { display: 'none' }); }, ANIMATION + 15);
		} else {
			U.Dom.addClass(item, 'isExpanded');

			U.Dom.css(children, { display: 'block' });
			U.Dom.css(children, { overflow: 'visible', height: 'auto' });
			height = children.offsetHeight;

			U.Dom.css(children, { overflow: 'hidden', height: '0px' });
			window.setTimeout(() => U.Dom.css(children, { height: `${height}px` }), 15);
			window.setTimeout(() => U.Dom.css(children, { overflow: 'visible', height: 'auto' }), ANIMATION + 15);
		};

		Storage.setToggle(subKey, id, !isOpen);
	};

	const onCreateHandler = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		const view = getView();
		const isOpen = Storage.checkToggle(getToggleKey(), id);

		onCreate(e, { details: { [view.groupRelationKey]: value } });

		if (!isOpen) {
			onToggle();
		};
	};

	const onAll = (e: any) => {
		U.Object.openConfig(e, { ...object, _routeParam_: { viewId } });
	};

	useEffect(() => {
		load();
		initToggle();

		return () => {
			S.Record.recordsClear(subId, '');
		};
	}, []);

	const items = getItems();

	// Subscriptions
	items.forEach(id => {
		const object = S.Detail.get(subId, id, [ view.groupRelationKey ]);
	});

	return (
		<div
			ref={nodeRef} 
			className="group"
		>
			<div id={`item-${id}`} className="clickable" onClick={onToggle}>
				<Icon name="arrow/button" size={8} className="arrow" />
				<Cell 
					id={`board-head-${id}`} 
					rootId={rootId}
					subId={subId}
					block={S.Block.getLeaf(rootId, J.Constant.blockId.dataview)}
					relationKey={view.groupRelationKey} 
					viewType={I.ViewType.Grid}
					getRecord={() => head}
					readonly={true} 
					arrayLimit={2}
					withName={true}
					placeholder={translate('commonUncategorized')}
				/>
				{canCreate ? <Icon name="plus/menu" className="plus" tooltipParam={{ text: translate('commonCreateNewObject') }} onClick={onCreateHandler} /> : ''}
			</div>

			<div id={`item-${id}-children`} className="items">
				{!items.length ? (
					<div className="item empty">{translate('commonNoObjects')}</div>
				) : (
					<>
						{items.map(id => (
							<Item 
								{...props}
								key={`widget-${block.id}-item-${id}`} 
								subId={subId}
								id={id} 
								hideIcon={view.hideIcon}
							/>
						))}
						{total > limit ? <div className="item more" onClick={onAll}>{translate('widgetShowAll')}</div> : ''}
					</>
				)}
			</div>
		</div>
	);
	
});

export default Group;