import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName, Icon, DropTarget } from 'Component';
import { I, S, U, C, translate, Preview, Dataview } from 'Lib';

interface Props extends I.ViewComponent {
	d: number;
	m: number;
	y: number;
	isToday: boolean;
	onCreate: (details: any) => void;
};

interface Ref {
	load: () => void;
};

const LIMIT = 4;

const CalendarItem = observer(forwardRef<Ref, Props>((props, ref) => {

	const { 
		rootId, block, className, d, m, y, isToday, isCollection, readonly, getSubId, getView, onContext, getKeys, getTarget, getSearchIds, isAllowedObject,
	} = props;
	const view = getView();
	const { hideIcon } = view;
	const subId = [ getSubId(), y, m, d ].join('-');
	const keys = getKeys(view.id);
	const items = S.Record.getRecords(subId, keys);
	const { total } = S.Record.getMeta(subId, '');
	const cn = [ 'day' ];
	const relation = S.Record.getRelationByKey(view.groupRelationKey);
	const canDrag = relation && !relation.isReadonlyValue;
	const nodeRef = useRef(null);

	if (className) {
		cn.push(className);
	};

	const load = () => {
		loadData(subId, LIMIT);
	};

	const loadData = (subId: string, limit: number) => {
		const view = getView();

		if (!view) {
			return;
		};
	
		const relation = S.Record.getRelationByKey(view.groupRelationKey);
		if (!relation) {
			return;
		};
	
		const object = getTarget();
		const start = U.Date.timestamp(y, m, d, 0, 0, 0);
		const end = U.Date.timestamp(y, m, d, 23, 59, 59);
		const filters: I.Filter[] = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.excludeFromSet() },
		].concat(view.filters as any[]);
		const sorts: I.Sort[] = [].concat(view.sorts);
		const searchIds = getSearchIds();

		filters.push({ 
			relationKey: relation.relationKey, 
			condition: I.FilterCondition.GreaterOrEqual, 
			value: start, 
			quickOption: I.FilterQuickOption.ExactDate,
			format: relation.format,
		});

		filters.push({ 
			relationKey: relation.relationKey, 
			condition: I.FilterCondition.LessOrEqual, 
			value: end, 
			quickOption: I.FilterQuickOption.ExactDate,
			format: relation.format,
		});

		if (searchIds) {
			filters.push({ relationKey: 'id', condition: I.FilterCondition.In, value: searchIds || [] });
		};

		U.Subscription.subscribe({
			subId,
			limit,
			filters: filters.map(it => Dataview.filterMapper(it, { rootId })),
			sorts: sorts.map(Dataview.filterMapper),
			keys: getKeys(view.id),
			sources: object.setOf || [],
			collectionId: (isCollection ? object.id : ''),
		});
	};

	const onOpen = (record: any) => {
		U.Object.openConfig(null, record);
	};

	const onMouseEnter = (e: any, item: any) => {
		const node = $(nodeRef.current);
		const element = node.find(`#record-${item.id}`);
		const name = U.String.shorten(item.name, 50);

		Preview.tooltipShow({ text: name, element });
	};

	const onMouseLeave = () => {
		Preview.tooltipHide(false);
	};

	const onMore = () => {
		const node = $(nodeRef.current);
		const view = getView();

		S.Menu.closeAll([ 'calendarDay' ], () => {
			S.Menu.open('calendarDay', {
				element: node,
				horizontal: I.MenuDirection.Center,
				width: node.outerWidth() + 8,
				offsetY: -(node.outerHeight() + 4),
				classNameWrap: 'fromBlock',
				noFlipX: true,
				data: {
					...props,
					subId: getSubId(),
					load: loadData,
					blockId: block.id,
					relationKey: view.groupRelationKey,
					hideIcon: view.hideIcon,
					readonly,
					onCreate: onCreate,
				}
			});
		});
	};

	const onContextHandler = () => {
		const node = $(nodeRef.current);
		const options = [
			{ id: 'open', icon: 'expand', name: translate('commonOpenObject') }
		] as I.Option[];

		if (canCreateValue) {
			options.push({ id: 'add', name: translate('commonNewObject') });
		};

		S.Menu.open('select', {
			element: node,
			offsetY: -node.outerHeight() + 32,
			offsetX: 16,
			noFlipX: true,
			noFlipY: true,
			data: {
				options,
				noVirtualisation: true,
				onSelect: (e: any, item: any) => {
					switch (item.id) {
						case 'open': onOpenDate(); break;
						case 'add': onCreate(e); break;
					};
				},
			}
		});
	};

	const onCreate = (e: any) => {
		if (!canCreateValue) {
			return;
		};

		e?.stopPropagation();

		const { d, m, y, getView, onCreate } = props;
		const view = getView();
		const details = {};

		details[view.groupRelationKey] = U.Date.timestamp(y, m, d, 12, 0, 0);
		onCreate(details);
	};

	const onOpenDate = () => {
		const { d, m, y, getView } = props;
		const view = getView();

		U.Object.openDateByTimestamp(view.groupRelationKey, U.Date.timestamp(y, m, d, 12, 0, 0), 'config');
	};

	const canCreate = (): boolean => {
		if (!view) {
			return false;
		};

		const groupRelation = S.Record.getRelationByKey(view.groupRelationKey);
		return groupRelation && (!groupRelation.isReadonlyValue || isToday) && isAllowedObject();
	};

	const onDragStart = (e: any, item: any) => {
		S.Common.getRef('dragProvider')?.onDragStart(e, I.DropType.Record, [ item.id ], {
			getNode: () => nodeRef.current,
			onRecordDrop,
		});
	};

	const onRecordDrop = (targetId: string, ids: [], position: I.BlockPosition) => {
		if (!view) {
			return;
		};

		let value = 0;

		if (targetId.match(/^empty-/)) {
			const [ , y, m, d ] = targetId.split('-').map(Number);
			
			value = U.Date.timestamp(y, m, d, 0, 0, 0);
		} else {
			const records = S.Record.getRecords(subId);
			const target = records.find(r => r.id == targetId);
			if (!target) {
				return;
			};

			value = target[view.groupRelationKey] + (position == I.BlockPosition.Bottom ? 1 : 0);
		};

		if (value) {
			C.ObjectListSetDetails(ids, [ { key: view.groupRelationKey, value } ]);
		};
	};

	const canCreateValue = canCreate();

	let more = null;
	if (total > LIMIT) {
		more = (
			<div className="record more" onClick={onMore}>
				+{total - LIMIT} {translate('commonMore')} {U.Common.plural(total, translate('pluralObject')).toLowerCase()}
			</div>
		);
	};

	const Item = (item: any) => {
		const canEdit = !item.isReadonly && S.Block.isAllowed(item.restrictions, [ I.RestrictionObject.Details ]) && U.Object.isTaskLayout(item.layout);
		const icon = hideIcon ? null : <IconObject id={`item-${item.id}-icon`} object={item} size={16} canEdit={canEdit} />;

		let content = (
			<>
				{icon}
				<ObjectName object={item} onClick={() => onOpen(item)} />
			</>
		);

		if (canDrag) {
			content = (
				<DropTarget {...props} rootId={rootId} id={item.id} dropType={I.DropType.Record} viewType={view.type}>
					{content}
				</DropTarget>
			);
		};

		return (
			
			<div 
				id={`record-${item.id}`}
				className="record" 
				draggable={canDrag}
				onContextMenu={e => onContext(e, item.id)}
				onMouseEnter={e => onMouseEnter(e, item)}
				onMouseLeave={onMouseLeave}
				onDragStart={e => onDragStart(e, item)}
			>
				{content}
			</div>
		);
	};

	useEffect(() => {
		load();

		return () => {
			U.Subscription.destroyList([ subId ]);
		};
	}, []);

	useImperativeHandle(ref, () => ({
		load,
	}));

	return (
		<div 
			ref={nodeRef}
			className={cn.join(' ')}
			onContextMenu={onContextHandler}
			onDoubleClick={onCreate}
		>
			<div className="head">
				{canCreateValue ? (
					<Icon 
						className="plus withBackground" 
						tooltipParam={{ text: translate(`commonNewObject`) }} 
						onClick={onCreate} 
					/> 
				) : ''}

				<div className="number" onClick={onOpenDate}>
					<div className="inner">{d}</div>
				</div>
			</div>

			<div className="items">
				{items.map(item => <Item key={[ y, m, d, item.id ].join('-')} {...item} />)}

				{more}

				<DropTarget {...props} rootId={rootId} id={[ 'empty', y, m, d ].join('-')} isTargetBottom={true} dropType={I.DropType.Record} viewType={view.type} />
			</div>
		</div>
	);

}));

export default CalendarItem;