import React, { forwardRef, useRef } from 'react';
import { observer } from 'mobx-react';
import { I, S, U, Relation, translate } from 'Lib';
import { Icon, Select, Input, IconObject, Label } from 'Component';

interface Props {
	rootId: string;
	blockId: string;
	rule: I.Filter;
	index: number;
	depth: number;
	parentPath: string;
	operator: I.FilterOperator;
	getView: () => any;
	isInline: boolean;
	readonly?: boolean;
	onRemove: (index: number) => void;
	onUpdate: (index: number, data: Partial<I.Filter>) => void;
	onOperatorChange: (operator: I.FilterOperator) => void;
	onTurnIntoGroup: (index: number) => void;
};

const DataviewFilterRule = observer(forwardRef<{}, Props>((props, ref) => {

	const { rootId, blockId, rule, index, depth, parentPath, operator, getView, isInline, readonly, onRemove, onUpdate, onOperatorChange, onTurnIntoGroup } = props;
	const nodeId = `rule-${parentPath}-${index}`;
	const { relationKey, condition, value } = rule;
	const operatorRef = useRef(null);
	const conditionRef = useRef(null);
	const inputRef = useRef(null);
	const relation: any = relationKey ? S.Record.getRelationByKey(relationKey) : null;
	const conditionOptions = relation ? Relation.filterConditionsByType(relation.format) : [];
	const conditionOption: any = conditionOptions.find(it => it.id == condition) || {};
	const operatorOptions = [
		{ id: String(I.FilterOperator.And), name: translate('commonAnd') },
		{ id: String(I.FilterOperator.Or), name: translate('commonOr') },
	];
	const operatorOption: any = operatorOptions.find(it => it.id == String(operator)) || {};
	const operatorName = operatorOption.name || '';

	const onRelationClick = (e: any) => {
		e.stopPropagation();

		const element = `#${nodeId} .relationSelect`;

		U.Menu.sortOrFilterRelationSelect({
			element,
			classNameWrap: 'fromBlock',
			horizontal: I.MenuDirection.Left,
			offsetY: 4,
		}, {
			rootId,
			blockId,
			getView,
			onSelect: (item: any) => {
				const conditions = Relation.filterConditionsByType(item.format);
				const newCondition = conditions.length ? conditions[0].id : I.FilterCondition.None;

				onUpdate(index, {
					relationKey: item.relationKey ? item.relationKey : item.id,
					condition: newCondition as I.FilterCondition,
					value: Relation.formatValue(item, null, false),
				});
			},
		});
	};

	const onMore = (e: any) => {
		e.stopPropagation();

		const options: any[] = [];

		if (depth < 2) {
			options.push({ id: 'group', name: translate('menuDataviewFilterTurnIntoGroup'), icon: 'group' });
		};

		options.push({ id: 'delete', name: translate('commonDelete'), icon: 'remove' });

		S.Menu.open('select', {
			element: `#${nodeId} .icon.more`,
			classNameWrap: 'fromBlock',
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			data: {
				options,
				onSelect: (e: any, option: any) => {
					switch (option.id) {
						case 'group': onTurnIntoGroup(index); break;
						case 'delete': onRemove(index); break;
					};
				},
			}
		});
	};

	const cn = [ 'rule' ];

	if (readonly) {
		cn.push('isReadonly');
	};

	return (
		<div
			id={nodeId}
			className={cn.join(' ')}
		>
			{index == 0 ? '' : index == 1 ? (
				<div className="head">
					<Select
						ref={operatorRef}
						id={`${nodeId}-operator`}
						value={String(operator)}
						options={operatorOptions}
						onChange={v => onOperatorChange(Number(v) as I.FilterOperator)}
						menuParam={{ classNameWrap: 'fromBlock', offsetY: 4 }}
						readonly={readonly}
					/>
				</div>
			) : (
				<div className="head">
					<Label text={operatorName} />
				</div>
			)}

			<div className="inner">
				<div className="relationSelect select" onClick={onRelationClick}>
					{relation ? <IconObject size={20} object={{ relationFormat: relation.format, layout: I.ObjectLayout.Relation }} /> : ''}
					<Label text={relation?.name || ''} />
					<Icon className="arrow" />
				</div>

				<Select
					className="conditionSelect"
					key={`${nodeId}-condition-${relationKey}`}
					ref={conditionRef}
					id={`${nodeId}-condition`}
					value={String(condition)}
					options={conditionOptions}
					onChange={v => onUpdate(index, { condition: Number(v) as I.FilterCondition })}
					menuParam={{ classNameWrap: 'fromBlock', offsetY: 4 }}
					readonly={readonly}
				/>

				<div className="valueSelect">
					<Input
						ref={inputRef}
						value={value}
						placeholder={translate(`placeholderCell${relation?.format || 0}`)}
						onKeyUp={(e: any, v: string) => onUpdate(index, { value: v })}
						readonly={readonly}
					/>
				</div>

				{!readonly ? <Icon className="more withBackground" onClick={onMore} /> : ''}
			</div>
		</div>
	);

}));

export default DataviewFilterRule;
