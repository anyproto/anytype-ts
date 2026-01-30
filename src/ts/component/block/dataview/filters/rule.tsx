import React, { forwardRef, useRef } from 'react';
import { observer } from 'mobx-react';
import { I, S, U, Relation, translate } from 'Lib';
import { Icon, Select, Input, IconObject, Label } from 'Component';

interface Props {
	rootId: string;
	blockId: string;
	rule: I.Filter;
	index: number;
	operator: I.FilterOperator;
	getView: () => any;
	isInline: boolean;
	readonly?: boolean;
	onRemove: (index: number) => void;
	onUpdate: (index: number, data: Partial<I.Filter>) => void;
	onOperatorChange: (operator: I.FilterOperator) => void;
};

const DataviewFilterRule = observer(forwardRef<{}, Props>((props, ref) => {

	const { rootId, blockId, rule, index, operator, getView, isInline, readonly, onRemove, onUpdate, onOperatorChange } = props;
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

		const element = `#rule-${index} .relationSelect`;

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

		S.Menu.open('select', {
			element: `#rule-${index} .icon.more`,
			classNameWrap: 'fromBlock',
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			data: {
				options: [
					{ id: 'delete', name: translate('commonDelete'), icon: 'remove' },
				],
				onSelect: () => {
					onRemove(index);
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
			id={`rule-${index}`}
			className={cn.join(' ')}
		>
			<div className="head">
				{index == 0 ? (
					<Label text={translate('commonWhere')} />
				) : index == 1 ? (
					<Select
						ref={operatorRef}
						id={`rule-operator-${index}`}
						value={String(operator)}
						options={operatorOptions}
						onChange={v => onOperatorChange(Number(v) as I.FilterOperator)}
						menuParam={{ classNameWrap: 'fromBlock', offsetY: 4 }}
						readonly={readonly}
					/>
				) : (
					<Label text={operatorName} />
				)}
			</div>

			<div className="inner">
				<div className="relationSelect select" onClick={onRelationClick}>
					{relation ? <IconObject size={20} object={{ relationFormat: relation.format, layout: I.ObjectLayout.Relation }} /> : ''}
					<Label text={relation?.name || ''} />
					<Icon className="arrow" />
				</div>

				<Select
					className="conditionSelect"
					key={`rule-condition-${index}-${relationKey}`}
					ref={conditionRef}
					id={`rule-condition-${index}`}
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
