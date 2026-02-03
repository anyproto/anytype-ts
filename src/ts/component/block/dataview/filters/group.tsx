import React, { forwardRef, useRef } from 'react';
import { observer } from 'mobx-react';
import { I, C, Relation, translate } from 'Lib';
import { MenuItemVertical, Select, Label } from 'Component';
import Rule from './rule';

interface Props {
	rootId: string;
	blockId: string;
	filter: I.Filter;
	depth: number;
	parentPath?: string;
	getView: () => any;
	getTarget: () => any;
	isInline: boolean;
	loadData: (viewId: string, offset: number, clear?: boolean) => void;
	readonly?: boolean;
	onDelete?: () => void;
	onUpdate?: (data: I.Filter) => void;
	index?: number;
	parentOperator?: I.FilterOperator;
	onParentOperatorChange?: (operator: I.FilterOperator) => void;
};

const DataviewFilterGroup = observer(forwardRef<{}, Props>((props, ref) => {

	const { rootId, blockId, filter, depth, parentPath, getView, getTarget, isInline, loadData, readonly, onDelete, onUpdate } = props;
	const { index, parentOperator, onParentOperatorChange } = props;
	const operatorRef = useRef(null);
	const path = parentPath ? `${parentPath}-${index ?? 0}` : String(index ?? 0);

	const getNodeId = (type: string, idx?: number) => {
		const base = `${type}-${path}`;
		return idx !== undefined ? `${base}-${idx}` : base;
	};

	const operatorOptions = [
		{ id: String(I.FilterOperator.And), name: translate('filterOperatorAnd') },
		{ id: String(I.FilterOperator.Or), name: translate('filterOperatorOr') },
	];
	const operatorOption: any = operatorOptions.find(it => it.id == String(parentOperator)) || {};
	const operatorName = operatorOption.name || '';

	const persist = (updated: I.Filter) => {
		if (onUpdate) {
			onUpdate(updated);
		} else {
			save(updated);
		};
	};

	const save = (updated: I.Filter) => {
		const view = getView();

		if (!view) {
			return;
		};

		view.setFilter(updated);
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

		persist(updated);
	};

	const onRuleRemove = (idx: number) => {
		const nestedFilters = [ ...(filter.nestedFilters || []) ];

		if (nestedFilters.length <= 1) {
			onDelete?.();
			return;
		};

		nestedFilters.splice(idx, 1);
		persist({ ...filter, nestedFilters });
	};

	const onRuleUpdate = (idx: number, data: Partial<I.Filter>) => {
		const nestedFilters = [ ...(filter.nestedFilters || []) ];

		nestedFilters[idx] = { ...nestedFilters[idx], ...data };
		persist({ ...filter, nestedFilters });
	};

	const onOperatorChange = (operator: I.FilterOperator) => {
		persist({ ...filter, operator });
	};

	const onTurnIntoGroup = (idx: number) => {
		const nestedFilters = [ ...(filter.nestedFilters || []) ];
		const rule = nestedFilters[idx];

		nestedFilters[idx] = {
			operator: I.FilterOperator.And,
			condition: I.FilterCondition.None,
			relationKey: '',
			value: '',
			nestedFilters: [ rule ],
		};

		persist({ ...filter, nestedFilters });
	};

	const onClick = (e: any, item: any) => {
		if (item.id == 'add') {
			onRuleAdd();
		};
	};

	const isGroup = (item: any) => {
		return [ I.FilterOperator.And, I.FilterOperator.Or ].includes(item.operator);
	};

	const getHead = (): any => {
		if (index === 0) {
			return (
				<div className="head">
					<Label text={translate('commonWhere')} />
				</div>
			);
		};

		if (index == 1) {
			return (
				<div className="head">
					<Select
						ref={operatorRef}
						id={getNodeId('group-operator')}
						value={String(parentOperator)}
						options={operatorOptions}
						onChange={v => onParentOperatorChange?.(Number(v) as I.FilterOperator)}
						menuParam={{ classNameWrap: 'fromBlock', offsetY: 4 }}
						readonly={readonly}
					/>
				</div>
			);
		};

		if (!index) {
			return '';
		};

		return (
			<div className="head">
				<Label text={operatorName} />
			</div>
		)
	};

	const getItems = () => {
		const items: any[] = [];

		(filter.nestedFilters || []).forEach((rule, i) => {
			items.push({ ...rule, index: i, isRule: true });
		});

		if (depth == 0) {
			items.push({ isDiv: true });
		};
		items.push({ id: 'add', name: translate('menuDataviewFilterAddRule'), icon: 'plus' });

		return items;
	};

	const items = getItems();

	return (
		<div id={getNodeId('group')} className={`group depth${depth}`}>
			{getHead()}

			<div className="items">
				{items.map((item: any, i: number) => {
					if (item.isRule) {
						if (isGroup(item)) {
							return (
								<DataviewFilterGroup
									key={i}
									rootId={rootId}
									blockId={blockId}
									filter={item}
									depth={depth + 1}
									parentPath={path}
									index={item.index}
									parentOperator={filter.operator}
									onParentOperatorChange={onOperatorChange}
									getView={getView}
									getTarget={getTarget}
									isInline={isInline}
									loadData={loadData}
									readonly={readonly}
									onDelete={() => onRuleRemove(item.index)}
									onUpdate={(updated) => {
										const nestedFilters = [ ...(filter.nestedFilters || []) ];
										nestedFilters[item.index] = updated;
										persist({ ...filter, nestedFilters });
									}}
								/>
							);
						};

						return (
							<Rule
								key={i}
								rootId={rootId}
								blockId={blockId}
								rule={item}
								index={item.index}
								depth={depth}
								parentPath={path}
								operator={filter.operator}
								getView={getView}
								getTarget={getTarget}
								isInline={isInline}
								loadData={loadData}
								readonly={readonly}
								onRemove={onRuleRemove}
								onUpdate={onRuleUpdate}
								onOperatorChange={onOperatorChange}
								onTurnIntoGroup={onTurnIntoGroup}
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
		</div>
	);

}));

export default DataviewFilterGroup;
