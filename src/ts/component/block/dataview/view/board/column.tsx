import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icon, LoadMore, Cell } from 'Component';
import Card from './card';
import * as I from 'Interface';

interface Props extends I.ViewComponent {
	id: string;
	value: any;
	recordIdx?: number;
	onDragStartColumn?: (e: any, groupId: string) => void;
	onDragStartCard?: (e: any, groupId: string, record: any) => void;
	getSubId?: () => string;
};

interface RefProps {
	getItems: () => any[];
};

const BoardColumn = forwardRef<RefProps, Props>((props, ref) => {

	const { 
		id, rootId, block, value, isCollection, getSubId, getView, getLimit, onDragStartColumn, getTarget, onRefRecord, applyObjectOrder, 
		getSearchIds, getKeys, onRecordAdd,
	} = props;
	const view = getView();
	const { coverRelationKey, hideIcon } = view;
	const target = getTarget();
	const subId = getSubId();
	const { total } = S.Record.getMeta(subId, '');
	const limit = getLimit();
	const head = {};
	const cn = [ 'column' ];
	const cnbg = [];
	const group = S.Record.getGroup(rootId, block.id, id);
	const order = (block.content.groupOrder || []).find(it => it.viewId == view.id);
	const orderGroup = (order?.groups || []).find(it => it.groupId == id) || {};
	const isAllowedObject = props.isAllowedObject();
	const tooltip = Dataview.getCreateTooltip(rootId, block.id, target.id, view.id);
	const nodeRef = useRef(null);
	const offset = useRef(0);

	if (view.groupBackgroundColors) {
		cn.push('withColor');
		cnbg.push(`bgColor bgColor-${orderGroup.bgColor || group.bgColor || 'grey'}`);
	};

	head[view.groupRelationKey] = value;

	const load = (clear: boolean) => {
		if (!view) {
			return;
		};

		const relation = S.Record.getRelationByKey(view.groupRelationKey);
		if (!relation) {
			return;
		};

		const el = block.content.objectOrder.find(it => (it.viewId == view.id) && (it.groupId == id));
		const objectIds = el ? el.objectIds || [] : [];
		const subId = getSubId();
		const limit = getLimit() + offset.current;
		const filters: I.Filter[] = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.excludeFromSet() },
			Dataview.getGroupFilter(relation, value),
		].concat(Dataview.getActiveFilters(view) as any[]);
		const sorts: I.Sort[] = [].concat(Dataview.getFilteredSorts(view.sorts));
		const searchIds = getSearchIds();

		if (objectIds.length) {
			sorts.unshift({ relationKey: 'id', type: I.SortType.Custom, customOrder: objectIds });
		};

		if (searchIds) {
			filters.push({ relationKey: 'id', condition: I.FilterCondition.In, value: searchIds || [] });
		};

		if (clear) {
			S.Record.recordsSet(subId, '', []);
		};

		U.Subscription.destroyList([ subId ], false, () => {
			U.Subscription.subscribe({
				subId,
				filters: filters.map(it => Dataview.filterMapper(it, { rootId })),
				sorts: sorts.map(it => Dataview.sortMapper(it)),
				keys: getKeys(view.id),
				sources: target.setOf || [],
				limit,
				collectionId: (isCollection ? target.id : ''),
			}, () => {
				S.Record.recordsSet(subId, '', applyObjectOrder(id, S.Record.getRecordIds(subId, '')));
			});
		});
	};

	const getItems = () => {
		return applyObjectOrder(id, [ ...S.Record.getRecordIds(getSubId(), '') ]).map(id => ({ id }));
	};

	const getCoverObject = (id: string) => {
		if (!view?.coverRelationKey) {
			return null;
		};

		const subId = getSubId();
		const record = S.Detail.get(subId, id, getKeys(view.id));

		return Dataview.getCoverObject(subId, record, view.coverRelationKey);
	};

	const onLoadMore = () => {
		offset.current += getLimit();
		load(false);
	};

	const onAdd = (e: any, dir: number) => {
		e.preventDefault();
		e.stopPropagation();

		onRecordAdd(e, dir, id);
	};

	const onMore = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		const node = nodeRef.current;
		const element = `#button-${U.Common.esc(id)}-more`;

		S.Menu.open('dataviewGroupEdit', {
			element,
			horizontal: I.MenuDirection.Center,
			offsetY: 4,
			onOpen: () => {
				U.Dom.addClass(U.Dom.select(element), 'active');
				U.Dom.addClass(node, 'active');
			},
			onClose: () => {
				U.Dom.removeClass(U.Dom.select(element), 'active');
				U.Dom.removeClass(node, 'active');
			},
			data: {
				rootId,
				blockId: block.id,
				groupId: id,
				getView,
			}
		});
	};

	const items = getItems();

	// Subscriptions
	items.forEach((item: any) => {
		const object = S.Detail.get(subId, item.id, [ view.groupRelationKey ]);
	});

	useEffect(() => {
		load(true);
	}, []);

	useImperativeHandle(ref, () => ({
		getItems,
	}));

	return (
		<div 
			ref={nodeRef} 
			id={`column-${id}`} 
			className={cn.join(' ')}
			{...U.Common.dataProps({ id })}
		>
			<AnimatePresence mode="popLayout">
				<motion.div
					id={`column-${id}-head`} 
					className="head"
					{...U.Common.animationProps({
						transition: { duration: 0.2, delay: 0.1 },
					})}
				>
					<div className="sides">
						<div 
							className="side left"
							draggable={true}
							onDragStart={e => onDragStartColumn(e, id)}
							onClick={onMore}
						>
							<Cell 
								id={`board-head-${id}`} 
								rootId={rootId}
								subId={subId}
								block={block}
								relationKey={view.groupRelationKey} 
								viewType={I.ViewType.Grid}
								getRecord={() => head}
								readonly={true} 
								arrayLimit={4}
								withName={true}
								placeholder={translate('commonUncategorized')}
							/>
						</div>

						<div className="side right">
							<Icon id={`button-${id}-more`} name="common/more" className="more" withBackground={true} tooltipParam={{ text: translate('blockDataviewBoardColumnSettings') }} onClick={onMore} />
							{isAllowedObject ? <Icon name="plus/menu" className="add" withBackground={true} tooltipParam={{ text: tooltip }} onClick={e => onAdd(e, -1)} /> : ''}
						</div>
					</div>

					<div className={cnbg.join(' ')} />
				</motion.div>
			</AnimatePresence>

			<div className="body">
				<div className="bg">
					{items.map((item: any, i: number) => (
						<Card
							ref={ref => onRefRecord(ref, item.id)}
							key={[ 'board', view.id, id, item.id ].join('-')}
							{...props}
							id={item.id}
							groupId={id}
							getRecord={() => item}
							getCoverObject={getCoverObject}
							recordIdx={i}
						/>
					))}

					{limit + offset.current < total ? (
						<LoadMore limit={limit} loaded={items.length} total={total} onClick={onLoadMore} />
					): ''}

					{isAllowedObject ? (
						<div id={`record-${id}-add`} className="card add" onClick={e => onAdd(e, 1)}>
							<Icon name="plus/menu" className="plus" />
						</div>
					) : ''}

					<div className={cnbg.join(' ')} />
				</div>
			</div>
		</div>
	);

});

export default BoardColumn;
