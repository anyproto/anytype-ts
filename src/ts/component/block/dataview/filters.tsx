import React, { forwardRef, useRef, MouseEvent } from 'react';
import { observer } from 'mobx-react';
import { Icon, Label } from 'Component';
import { I, U, translate, S, Relation, C, Dataview } from 'Lib';
import Item from './filters/item';
import AdvancedItem from './filters/advanced';

interface Props extends I.ViewComponent {
	onClear?: () => void;
};

const BlockDataviewFilters = observer(forwardRef<{}, Props>((props, ref) => {

	const { rootId, block, className, isInline, isCollection, getView, onFilterAddClick, onSortAdd, loadData, readonly, getTarget, closeFilters } = props;
	const blockId = block.id;
	const view = getView();
	const filters = view?.filters;
	const nodeRef = useRef(null);

	if (!view) {
		return null;
	};
	
	const isAdvancedFilter = (filter: I.Filter): boolean => {
		return !![ I.FilterOperator.And, I.FilterOperator.Or ].includes(filter.operator);
	};

	const items = U.Common.objectCopy(filters).map((it: any) => {
		return {
			...it,
			relation: S.Record.getRelationByKey(it.relationKey),
		};
	}).filter(it => it.relation || isAdvancedFilter(it)).sort((a, b) => {
		const aAdvanced = isAdvancedFilter(a);
		const bAdvanced = isAdvancedFilter(b);

		if (aAdvanced !== bAdvanced) {
			return aAdvanced ? -1 : 1;
		};

		const aActive = Relation.isFilterActive(a);
		const bActive = Relation.isFilterActive(b);

		if (aActive === bActive) return 0;
		return aActive ? -1 : 1;
	});
	const isReadonly = readonly || !S.Block.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);

	const cn = [ 'dataviewFilters' ];

	if (className) {
		cn.push(className);
	};
	if (isInline) {
		cn.push('isInline');
	};

	const onClick = (e: any, item: any) => {
		const filter: I.Filter = view.getFilter(item.id);

		S.Menu.open('dataviewFilterValues', {
			element: `#block-${blockId} #dataviewFilters #item-${item.id}`,
			classNameWrap: 'fromBlock',
			horizontal: I.MenuDirection.Left,
			offsetY: 4,
			noFlipY: true,
			data: {
				rootId,
				blockId,
				isInline,
				getView,
				getTarget,
				readonly: isReadonly,
				save: () => {
					C.BlockDataviewFilterReplace(rootId, blockId, view.id, item.id, filter, () => {
						loadData(view.id, 0, false);
					});
				},
				itemId: item.id,
			}
		});
	};

	const onAdd = () => {
		const menuParam = {
			element: `#block-${blockId} #dataviewFilters #item-add`,
			classNameWrap: 'fromBlock',
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			offsetY: 4,
		};

		onFilterAddClick(menuParam);
	};

	const onRemove = (e: any, item: any) => {
		e.preventDefault();
		e.stopPropagation();

		if (items.length === 1) {
			props.onClear?.();
		};
		C.BlockDataviewFilterRemove(rootId, blockId, view.id, [ item.id ], () => loadData(view.id, 0, false));
	};

	const onClear = () => {
		const sorts = view.sorts || [];

		C.BlockDataviewFilterRemove(rootId, blockId, view.id, items.map(it => it.id), () => {
			if (sorts.length) {
				C.BlockDataviewSortRemove(rootId, blockId, view.id, sorts.map(it => it.id), () => {
					loadData(view.id, 0, false);
					props.onClear?.();
				});
			} else {
				loadData(view.id, 0, false);
				props.onClear?.();
			};
		});
	};

	const onClearFilter = (item: any) => {
		const filter = {
			...item,
			...Dataview.getDefaultFilterValues(item.relation),
		};

		C.BlockDataviewFilterReplace(rootId, blockId, view.id, item.id, filter, () => {
			loadData(view.id, 0, false);
		});
	};

	const onContextMenu = (e: MouseEvent, item: any) => {
		e.preventDefault();

		if (isReadonly) {
			return;
		};

		S.Menu.open('select', {
			element: `#block-${blockId} #dataviewFilters #item-${item.id}`,
			classNameWrap: 'fromBlock',
			offsetY: 4,
			data: {
				options: [
					{ id: 'clear', name: translate('commonClear') },
					{ id: 'delete', name: translate('commonDelete') },
				],
				onSelect: (e: any, option: any) => {
					switch (option.id) {
						case 'clear': onClearFilter(item); break;
						case 'delete': onRemove(e, item); break;
					};
				},
			}
		});
	};

	const onAdvancedClick = (e: any, item: any) => {
		S.Menu.open('dataviewFilterAdvanced', {
			element: `#block-${blockId} #dataviewFilters #item-${item.id}`,
			classNameWrap: 'fromBlock',
			horizontal: I.MenuDirection.Left,
			offsetY: 4,
			noFlipY: true,
			data: {
				rootId,
				blockId,
				isInline,
				getView,
				getTarget,
				readonly: isReadonly,
				loadData,
			}
		});
	};

	const { config } = S.Common;
	const sorts = view.sorts || [];
	const sortTitle = sorts.length === 1
		? (S.Record.getRelationByKey(sorts[0].relationKey)?.name || '')
		: `${sorts.length} ${U.Common.plural(sorts.length, translate('pluralSort'))}`;

	const onSortRemove = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		C.BlockDataviewSortRemove(rootId, blockId, view.id, sorts.map(it => it.id), () => {
			loadData(view.id, 0, false);
			closeFilters?.();
		});
	};

	const onSortClick = () => {
		S.Menu.open('dataviewSort', {
			element: `#block-${blockId} #dataviewFilters #item-sort`,
			classNameWrap: 'fromBlock',
			horizontal: I.MenuDirection.Left,
			offsetY: 4,
			noFlipY: true,
			data: {
				rootId,
				blockId,
				getView,
				getTarget,
				onSortAdd,
				isInline,
				readonly: isReadonly,
				closeFilters,
				loadData,
			}
		});
	};

	return (
		<div ref={nodeRef} id="dataviewFilters" className={cn.join(' ')}>
			<div className="sides">
				<div id="sideLeft" className="side left">
					{sorts.length ? (
						<>
							<div id="item-sort" className="filterItem isActive" onClick={onSortClick}>
								<Icon className={`sortArrow c${sorts[0].type}`} />
								<div className="content">
									<Label className="name" text={sortTitle} />
								</div>
								{config.experimental ? <Icon className="delete" onClick={onSortRemove} /> : ''}
							</div>
							<div className="separator vertical" />
						</>
					) : ''}
					{items.map((item: any) => {
						if (isAdvancedFilter(item)) {
							return (
								<AdvancedItem
									{...props}
									key={item.id}
									filter={item}
									subId={rootId}
									onRemove={e => onRemove(e, item)}
									onClick={e => onAdvancedClick(e, item)}
									onContextMenu={e => onContextMenu(e, item)}
									readonly={isReadonly}
								/>
							);
						}

						return (
							<Item
								{...props}
								key={item.id}
								filter={item}
								subId={rootId}
								onRemove={e => onRemove(e, item)}
								onClick={e => onClick(e, item)}
								onContextMenu={e => onContextMenu(e, item)}
								readonly={isReadonly}
							/>
						);
					})}
					<Icon id="item-add" className="plus" onClick={onAdd} />
				</div>

				<div id="sideRight" className="side right">
					{items.length ? (
						<div className="buttons">
							<Label text={translate('commonClear')} onClick={onClear} />
						</div>
					) : ''}
				</div>
			</div>
		</div>
	);

}));

export default BlockDataviewFilters;
