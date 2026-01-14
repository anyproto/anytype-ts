import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { observer } from 'mobx-react';
import { Icon, Label } from 'Component';
import { I, U, keyboard, translate, S, Relation, C } from 'Lib';
import Item from './filters/item';

interface Props extends I.ViewComponent {

};

const BlockDataviewFilters = observer(forwardRef<{}, Props>((props, ref) => {

	const { rootId, block, className, isInline, isCollection, getView, onFilterAdd, loadData } = props;
	const blockId = block.id;
	const view = getView();
	const filters = view?.filters;
	const nodeRef = useRef(null);


	if (!view || !filters.length) {
		return null;
	};

	const items = U.Common.objectCopy(filters).map((it: any) => {
		return {
			...it,
			relation: S.Record.getRelationByKey(it.relationKey),
		};
	}).filter(it => it.relation);

	const cn = [ 'dataviewFilters' ];

	if (className) {
		cn.push(className);
	};
	if (isInline) {
		cn.push('isInline');
	};

	const buttons: any[] = [
		{ id: 'clear', text: translate('commonClear') },
	];

	const onClear = () => {
		C.BlockDataviewFilterRemove(rootId, blockId, view.id, items.map(it => it.id), () => loadData(view.id, 0, false));
	};

	const onAdd = () => {
		const menuParam = {
			element: `#block-${blockId} #dataviewFilters #item-add`,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
		};

		U.Menu.sortOrFilterRelationSelect(menuParam, {
			rootId,
			blockId,
			getView,
			onSelect: item => {
				const conditions = Relation.filterConditionsByType(item.format);
				const condition = conditions.length ? conditions[0].id : I.FilterCondition.None;
				const quickOptions = Relation.filterQuickOptions(item.format, condition);
				const quickOption = quickOptions.length ? quickOptions[0].id : I.FilterQuickOption.Today;

				onFilterAdd({
					relationKey: item.relationKey ? item.relationKey : item.id,
					condition: condition as I.FilterCondition,
					value: Relation.formatValue(item, null, false),
					quickOption,
				})
			},
		});
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
