import React, { forwardRef, useRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Icon, Cell } from 'Component';
import { I, S, U, J, translate, Dataview, Storage } from 'Lib';
import Item from './item';

const ANIMATION = 200;

interface Props extends I.WidgetViewComponent {
	id: string;
	value: any;
};

const Group = observer(forwardRef<{}, Props>((props, ref) => {

	const nodeRef = useRef(null);
	const { rootId, block, parent, id, value, canCreate, onCreate, getView, getViewLimit, getObject } = props;
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
		const filters: I.Filter[] = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.excludeFromSet() },
			Dataview.getGroupFilter(relation, value),
		].concat(view.filters);
		const sorts: I.Sort[] = [].concat(view.sorts);

		U.Data.searchSubscribe({
			subId,
			filters: filters.map(it => Dataview.filterMapper(view, it)),
			sorts: sorts.map(it => Dataview.filterMapper(view, it)),
			keys: J.Relation.sidebar,
			sources: object.setOf || [],
			limit,
			ignoreHidden: true,
			ignoreDeleted: true,
			collectionId: (isCollection ? object.id : ''),
		}, () => {
			S.Record.recordsSet(subId, '', applyObjectOrder(id, S.Record.getRecordIds(subId, '')));
		});
	};

	const getItems = () => {
		return applyObjectOrder(id, U.Common.objectCopy(S.Record.getRecordIds(subId, '')));
	};

	const applyObjectOrder = (groupId: string, ids: string[]): any[] => {
		return Dataview.applyObjectOrder(rootId, J.Constant.blockId.dataview, parent.content.viewId, groupId, ids);
	};

	const getToggleKey = () => {
		return `widget${block.id}`;
	};

	const initToggle = () => {
		const isOpen = Storage.checkToggle(getToggleKey(), id);

		if (!isOpen) {
			return;
		};

		const node = $(nodeRef.current);
		const item = node.find(`#item-${id}`);
		const children = node.find(`#item-${id}-children`);

		item.addClass('isExpanded');
		children.show();
	};

	const onToggle = () => {
		const subKey = getToggleKey();
		const isOpen = Storage.checkToggle(subKey, id);
		const node = $(nodeRef.current);
		const item = node.find(`#item-${id}`);
		const children = node.find(`#item-${id}-children`);

		let height = 0;
		if (isOpen) {
			item.removeClass('isExpanded');

			children.css({ overflow: 'visible', height: 'auto' });
			height = children.height();
			children.css({ overflow: 'hidden', height: height });

			window.setTimeout(() => children.css({ height: 0 }), 15);
			window.setTimeout(() => children.hide(), ANIMATION + 15);
		} else {
			item.addClass('isExpanded');

			children.show();
			children.css({ overflow: 'visible', height: 'auto' });
			height = children.height();

			children.css({ overflow: 'hidden', height: 0 });
			window.setTimeout(() => children.css({ height: height }), 15);
			window.setTimeout(() => children.css({ overflow: 'visible', height: 'auto' }), ANIMATION + 15);
		};

		Storage.setToggle(subKey, id, !isOpen);
	};

	const onCreateHandler = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		const view = getView();
		const isOpen = Storage.checkToggle(getToggleKey(), id);

		onCreate({ details: { [view.groupRelationKey]: value } });

		if (!isOpen) {
			onToggle();
		};
	};

	const onAll = (e: any) => {
		U.Object.openEvent(e, { ...object, _routeParam_: { viewId: parent.content.viewId } });
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
				<Icon className="arrow" />
				<Cell 
					id={`board-head-${id}`} 
					rootId={rootId}
					subId={subId}
					block={S.Block.getLeaf(rootId, J.Constant.blockId.dataview)}
					relationKey={view.groupRelationKey} 
					viewType={I.ViewType.Board}
					getRecord={() => head}
					readonly={true} 
					arrayLimit={2}
					withName={true}
					placeholder={translate('commonUncategorized')}
				/>
				{canCreate ? <Icon className="plus" tooltipParam={{ text: translate('commonCreateNewObject') }} onClick={onCreateHandler} /> : ''}
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
	
}));

export default Group;