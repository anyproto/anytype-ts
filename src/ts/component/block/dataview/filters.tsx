import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { observer } from 'mobx-react';
import { Icon, Label } from 'Component';
import { I, U, keyboard, translate, S, Relation, C } from 'Lib';
import Item from './filters/item';

interface Props extends I.ViewComponent {

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
	}).filter(it => it.relation);
	const isReadonly = readonly || !S.Block.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);

	const cn = [ 'dataviewFilters' ];

	if (className) {
		cn.push(className);
	};
	if (isInline) {
		cn.push('isInline');
	};

	const onClick = (e: any, item: any) => {
		S.Menu.open('dataviewFilterValues', {
			element: `#block-${blockId} #dataviewFilters #item-${item.id}`,
			classNameWrap: 'fromBlock',
			horizontal: I.MenuDirection.Center,
			noFlipY: true,
			data: {
				rootId,
				blockId,
				isInline,
				getView,
				getTarget,
				readonly: isReadonly,
				save: () => {
					C.BlockDataviewFilterReplace(rootId, blockId, view.id, item.id, view.getFilter(item.id), () => {
						loadData(view.id, 0, false);
					});
				},
				itemId: item.id,
			}
		});
	};

	const onClear = () => {
		C.BlockDataviewFilterRemove(rootId, blockId, view.id, items.map(it => it.id), () => loadData(view.id, 0, false));
	};

	const onAdd = () => {
		const menuParam = {
			element: `#block-${blockId} #dataviewFilters #item-add`,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
		};

		onFilterAddClick(menuParam);
	};

	const onRemove = (e: any, item: any) => {
		C.BlockDataviewFilterRemove(rootId, blockId, view.id, [ item.id ], () => loadData(view.id, 0, false));
	};

	return (
		<div ref={nodeRef} id="dataviewFilters" className={cn.join(' ')}>
			<div className="sides">
				<div id="sideLeft" className="side left">
					{items.map((item: any) => (
						<Item
							{...props}
							key={item.id}
							{...item}
							subId={rootId}
							onRemove={e => onRemove(e, item)}
							onClick={e => onClick(e, item)}
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
