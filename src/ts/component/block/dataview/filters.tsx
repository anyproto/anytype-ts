import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { observer } from 'mobx-react';
import { Icon, Label } from 'Component';
import { I, U, keyboard, translate, S, Relation, C } from 'Lib';
import Item from './filters/item';

interface Props extends I.ViewComponent {
	onClear?: () => void;
};

const BlockDataviewFilters = observer(forwardRef<{}, Props>((props, ref) => {

	const { rootId, block, className, isInline, isCollection, getView, onFilterAddClick, loadData, readonly, getTarget } = props;
	const blockId = block.id;
	const view = getView();
	const filters = view?.filters;
	const nodeRef = useRef(null);

	if (!view) {
		return null;
	};

	const items = U.Common.objectCopy(filters).map((it: any) => {
		return {
			...it,
			relation: S.Record.getRelationByKey(it.relationKey),
		};
	}).filter(it => it.relation).sort((a, b) => {
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

		onFilterAddClick(menuParam, true);
	};

	const onRemove = (e: any, item: any) => {
		e.preventDefault();
		e.stopPropagation();

		if (items.length == 1) {
			props.onClear?.();
		};
		C.BlockDataviewFilterRemove(rootId, blockId, view.id, [ item.id ], () => loadData(view.id, 0, false));
	};

	const onClear = () => {
		C.BlockDataviewFilterRemove(rootId, blockId, view.id, items.map(it => it.id), () => loadData(view.id, 0, false));
		props.onClear?.();
	};

	const onClearFilter = (item: any) => {
		const conditions = Relation.filterConditionsByType(item.relation.format);
		const condition = conditions[0]?.id || I.FilterCondition.Equal;
		const quickOptions = Relation.filterQuickOptions(item.relation.format, condition);
		const quickOption = quickOptions[0]?.id || I.FilterQuickOption.ExactDate;

		const filter = {
			...item,
			condition,
			quickOption,
			value: Relation.formatValue(item.relation, null, false),
		};

		C.BlockDataviewFilterReplace(rootId, blockId, view.id, item.id, filter, () => {
			loadData(view.id, 0, false);
		});
	};

	const onContextMenu = (e: React.MouseEvent, item: any) => {
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

	return (
		<div ref={nodeRef} id="dataviewFilters" className={cn.join(' ')}>
			<div className="sides">
				<div id="sideLeft" className="side left">
					{items.map((item: any) => (
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
					))}
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
