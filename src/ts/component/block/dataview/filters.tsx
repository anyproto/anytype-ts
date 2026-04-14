import React, { forwardRef, useRef, useImperativeHandle, MouseEvent } from 'react';
import { Icon, Label } from 'Component';
import Item from './filters/item';
import AdvancedItem from './filters/advanced';
import * as I from 'Interface';

interface RefProps {
	openFilterMenu: (filterId: string) => void;
};

interface Props extends I.ViewComponent {
	onClear?: () => void;
};

const BlockDataviewFilters = forwardRef<RefProps, Props>((props, ref) => {

	const { rootId, block, className, isInline, getView, onFilterAddClick, onSortAdd, loadData, readonly, getTarget, closeFilters } = props;
	const blockId = block.id;
	const view = getView();
	const nodeRef = useRef(null);

	if (!view) {
		return null;
	};

	const filters = Dataview.getFilteredFilters(view.filters);
	const sorts = Dataview.getFilteredSorts(view.sorts);
	const isReadonly = readonly || !S.Block.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);
	const cn = [ 'dataviewFilters' ];
	const items = U.Common.objectCopy(filters).map((it: any) => {
		const relation = S.Record.getRelationByKey(it.relationKey);
		return {
			...it,
			relation: (relation && !relation.isArchived && !relation.isDeleted) ? relation : null,
		};
	}).filter(it => it.relation || Dataview.isAdvancedFilter(it)).sort((a, b) => {
		const aAdvanced = Dataview.isAdvancedFilter(a);
		const bAdvanced = Dataview.isAdvancedFilter(b);

		if (aAdvanced !== bAdvanced) {
			return aAdvanced ? -1 : 1;
		};

		const aActive = Relation.isFilterActive(a);
		const bActive = Relation.isFilterActive(b);

		if (aActive === bActive) return 0;
		return aActive ? -1 : 1;
	});

	if (className) {
		cn.push(className);
	};
	if (isInline) {
		cn.push('isInline');
	};

	const onClick = (e: any, item: any) => {
		const isAdvanced = Dataview.isAdvancedFilter(item);
		const menuId = isAdvanced ? 'dataviewFilterAdvanced' : 'dataviewFilterValues';
		const menuParam: I.MenuParam = {
			element: `#block-${U.Common.esc(blockId)} #dataviewFilters #item-${U.Common.esc(item.id)}`,
			classNameWrap: 'fromBlock',
			offsetY: 4,
			noFlipY: true,
			data: {
				rootId,
				blockId,
				isInline,
				getView,
				getTarget,
				readonly: isReadonly,
			},
		};

		if (isAdvanced) {
			menuParam.noFlipX = true;
			menuParam.data = Object.assign(menuParam.data, {
				loadData,
			});
		} else {
			menuParam.data = Object.assign(menuParam.data, {
				itemId: item.id,
				save: () => {
					const currentFilter = view.getFilter(item.id);
					if (currentFilter) {
						C.BlockDataviewFilterReplace(rootId, blockId, view.id, item.id, currentFilter, () => {
							loadData(view.id, 0, false);
						});
					};
				},
			});	
		};

		S.Menu.open(menuId, menuParam);
	};

	const onAdd = () => {
		const menuParam = {
			element: `#block-${U.Common.esc(blockId)} #dataviewFilters #item-add`,
			classNameWrap: 'fromBlock',
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			offsetY: 4,
			noFlipX: true,
		};

		onFilterAddClick(menuParam);
	};

	const onRemove = (e: any, item: any) => {
		e.preventDefault();
		e.stopPropagation();

		const object = getTarget();
		const rel = S.Record.getRelationByKey(item.relationKey);

		if (items.length === 1) {
			props.onClear?.();
		};

		C.BlockDataviewFilterRemove(rootId, blockId, view.id, [ item.id ], () => loadData(view.id, 0, false));

		analytics.event('RemoveFilter', {
			objectType: object.type,
			relationKey: item.relationKey,
			format: rel?.format,
			embedType: analytics.embedType(isInline)
		});
	};

	const onClear = () => {
		const sorts = Dataview.getFilteredSorts(view.sorts);

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
		const filter = view.getFilter(item.id);

		if (!filter) {
			return;
		};

		Dataview.clearFilter(rootId, blockId, view.id, filter, () => {
			loadData(view.id, 0, false);
		});
	};

	const onContextMenu = (e: MouseEvent, item: any) => {
		e.preventDefault();

		if (isReadonly) {
			return;
		};

		S.Menu.open('select', {
			element: `#block-${U.Common.esc(blockId)} #dataviewFilters #item-${U.Common.esc(item.id)}`,
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

	const openFilterMenu = (filterId: string) => {
		const item = items.find(it => it.id == filterId);
		if (!item) {
			return;
		};

		onClick(null, item);
	};

	useImperativeHandle(ref, () => ({
		openFilterMenu,
	}));

	const sortTitle = sorts.length === 1
		? (S.Record.getRelationByKey(sorts[0].relationKey)?.name || '')
		: U.String.sprintf(translate('commonCountSorts'), sorts.length, U.Common.plural(sorts.length, translate('pluralSort')));

	const onSortClick = () => {
		S.Menu.open('dataviewSort', {
			element: `#block-${U.Common.esc(blockId)} #dataviewFilters #item-sort`,
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
								<Icon name="control/dataview/filterSort" className={`sortArrow c${sorts[0].type}`} />
								<div className="content">
									<Label className="name" text={sortTitle} />
								</div>
								<Icon name="arrow/button" size={8} className="arrow" />
							</div>
							<div className="separator vertical" />
						</>
					) : ''}
					{items.map((item: any) => {
						const isAdvanced = Dataview.isAdvancedFilter(item);
						const Component = isAdvanced ? AdvancedItem : Item;

						return (
							<Component
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
					<div id="item-add" className="itemAdd" onClick={onAdd}>
						<Icon name="control/dataview/filterPlus" className="plus" />
						<Label text={translate('commonFilter')} />
					</div>

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

});

export default BlockDataviewFilters;