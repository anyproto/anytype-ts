import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { I, C, Relation, translate } from 'Lib';
import { MenuItemVertical } from 'Component';
import Rule from './rule';

interface Props {
	rootId: string;
	blockId: string;
	filter: I.Filter;
	getView: () => any;
	getTarget: () => any;
	isInline: boolean;
	loadData: (viewId: string, offset: number, clear?: boolean) => void;
	readonly?: boolean;
	onDelete?: () => void;
};

const DataviewFilterGroup = observer(forwardRef<{}, Props>((props, ref) => {

	const { rootId, blockId, filter, getView, getTarget, isInline, loadData, readonly, onDelete } = props;

	const save = (updated: I.Filter) => {
		const view = getView();

		if (!view) {
			return;
		};

		C.BlockDataviewFilterReplace(rootId, blockId, view.id, filter.id, updated, () => {
			loadData(view.id, 0, false);
		});
	};

	const onRuleAdd = () => {
		const conditions = Relation.filterConditionsByType(I.RelationType.ShortText);
		const condition = conditions.length ? conditions[0].id : I.FilterCondition.None;

		const newRule: I.Filter = {
			relationKey: 'name',
			condition: condition as I.FilterCondition,
			value: '',
		};

		const updated = {
			...filter,
			nestedFilters: [ ...(filter.nestedFilters || []), newRule ],
		};

		save(updated);
	};

	const onRuleRemove = (index: number) => {
		const nestedFilters = [ ...(filter.nestedFilters || []) ];

		if (nestedFilters.length <= 1) {
			onDelete?.();
			return;
		};

		nestedFilters.splice(index, 1);
		save({ ...filter, nestedFilters });
	};

	const onRuleUpdate = (index: number, data: Partial<I.Filter>) => {
		const nestedFilters = [ ...(filter.nestedFilters || []) ];

		nestedFilters[index] = { ...nestedFilters[index], ...data };
		save({ ...filter, nestedFilters });
	};

	const onOperatorChange = (operator: I.FilterOperator) => {
		save({ ...filter, operator });
	};

	const onClick = (e: any, item: any) => {
		if (item.id == 'add') {
			onRuleAdd();
		};
	};

	const getItems = () => {
		const items: any[] = [];

		(filter.nestedFilters || []).forEach((rule, i) => {
			items.push({ ...rule, index: i, isRule: true });
		});

		items.push({ isDiv: true });
		items.push({ id: 'add', name: translate('menuDataviewFilterAddRule'), icon: 'plus' });

		return items;
	};

	const items = getItems();

	return (
		<div className="group">
			{items.map((item: any, i: number) => {
				if (item.isRule) {
					return (
						<Rule
							key={i}
							rootId={rootId}
							blockId={blockId}
							rule={item}
							index={item.index}
							operator={filter.operator}
							getView={getView}
							isInline={isInline}
							readonly={readonly}
							onRemove={onRuleRemove}
							onUpdate={onRuleUpdate}
							onOperatorChange={onOperatorChange}
						/>
					);
				};

				return (
					<MenuItemVertical
						key={i}
						{...item}
						onClick={e => onClick(e, item)}
					/>
				);
			})}
		</div>
	);

}));

export default DataviewFilterGroup;
