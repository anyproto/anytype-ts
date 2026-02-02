import React, { forwardRef, useRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { I, S, U, Relation, translate } from 'Lib';
import { Icon, Select, Input, IconObject, Label, Tag } from 'Component';
import ItemObject from 'Component/cell/item/object';

interface Props {
	rootId: string;
	blockId: string;
	rule: I.Filter;
	index: number;
	depth: number;
	parentPath: string;
	operator: I.FilterOperator;
	getView: () => any;
	getTarget: () => any;
	isInline: boolean;
	loadData: (viewId: string, offset: number, clear?: boolean) => void;
	readonly?: boolean;
	onRemove: (index: number) => void;
	onUpdate: (index: number, data: Partial<I.Filter>) => void;
	onOperatorChange: (operator: I.FilterOperator) => void;
	onTurnIntoGroup: (index: number) => void;
};

const DataviewFilterRule = observer(forwardRef<{}, Props>((props, ref) => {

	const {
		rootId, blockId, rule, index, depth, parentPath, operator, getView, getTarget, isInline, loadData,
		readonly, onRemove, onUpdate, onOperatorChange, onTurnIntoGroup
	} = props;
	const nodeId = `rule-${parentPath}-${index}`;
	const { relationKey, condition, value } = rule;
	const operatorRef = useRef(null);
	const conditionRef = useRef(null);
	const inputRef = useRef(null);
	const relation: any = relationKey ? S.Record.getRelationByKey(relationKey) : null;
	const conditionOptions = relation ? Relation.filterConditionsByType(relation.format) : [];
	const operatorOptions = [
		{ id: String(I.FilterOperator.And), name: translate('commonAnd') },
		{ id: String(I.FilterOperator.Or), name: translate('commonOr') },
	];
	const operatorOption: any = operatorOptions.find(it => it.id == String(operator)) || {};
	const operatorName = operatorOption.name || '';
	const subId = `advancedFilter-${nodeId}`;

	useEffect(() => {
		if (!relation) {
			return;
		};

		if (![ I.RelationType.Object, I.RelationType.File ].includes(relation.format)) {
			return;
		};

		const ids = Relation.getArrayValue(value).filter(it => it);

		if (!ids.length) {
			return;
		};

		U.Subscription.subscribeIds({
			subId,
			ids,
			noDeps: true,
		});

		return () => {
			U.Subscription.destroyList([ subId ]);
		};
	}, [ relationKey, value ]);

	const getValue = () => {
		if (!relation) {
			return null;
		};

		if ([ I.FilterCondition.Empty, I.FilterCondition.NotEmpty ].includes(condition)) {
			return null;
		};

		switch (relation.format) {
			case I.RelationType.Date: {
				const quickOption = rule.quickOption || I.FilterQuickOption.ExactDate;
				const quickOptions = Relation.filterQuickOptions(relation.format, condition);

				let dateValue = null;

				if ([ I.FilterQuickOption.NumberOfDaysAgo, I.FilterQuickOption.NumberOfDaysNow ].includes(quickOption)) {
					dateValue = (
						<Input
							key={`${nodeId}-days-${quickOption}`}
							ref={inputRef}
							value={value}
							placeholder={translate(`placeholderCell${I.RelationType.Number}`)}
							onKeyUp={(e: any, v: string) => onUpdate(index, { value: v })}
							readonly={readonly}
						/>
					);
				} else
				if (quickOption == I.FilterQuickOption.ExactDate) {
					const mask = [];
					const ph = [];
					const { dateFormat } = S.Common;

					switch (dateFormat) {
						case I.DateFormat.ISO: { mask.push('9999.99.99'); ph.push('yyyy.mm.dd'); break; };
						case I.DateFormat.ShortUS: { mask.push('99.99.9999'); ph.push('mm.dd.yyyy'); break; };
						default: { mask.push('99.99.9999'); ph.push('dd.mm.yyyy'); break; };
					};

					dateValue = (
						<Input
							key={`${nodeId}-date-${quickOption}`}
							ref={inputRef}
							value={value ? U.Date.date('d.m.Y', value) : ''}
							placeholder={ph.join(' ')}
							maskOptions={{
								mask: mask.join(' '),
								separator: '.',
								alias: 'datetime',
							}}
							readonly={readonly}
							onClick={() => {
								if (readonly) {
									return;
								};

								S.Menu.open('calendar', {
									element: `#${nodeId} .dateInput`,
									classNameWrap: 'fromBlock',
									horizontal: I.MenuDirection.Center,
									offsetY: 4,
									data: {
										value: rule.value || U.Date.now(),
										canEdit: true,
										canClear: true,
										onChange: (v: number) => {
											onUpdate(index, { value: v });
											inputRef.current?.setValue(v ? U.Date.date('d.m.Y', v) : '');
										},
									},
								});
							}}
						/>
					);
				};

				return (
					<div className="dateWrapper">
						<Select
							key={`${nodeId}-quick-${relationKey}-${condition}`}
							id={`${nodeId}-quick`}
							value={String(quickOption)}
							options={quickOptions}
							onChange={v => onUpdate(index, {
								quickOption: Number(v) as I.FilterQuickOption,
								value: Relation.formatValue(relation, null, false),
							})}
							menuParam={{ classNameWrap: 'fromBlock', offsetY: 4 }}
							readonly={readonly}
						/>
						{dateValue ? <div className="dateInput">{dateValue}</div> : ''}
					</div>
				);
			};

			case I.RelationType.Checkbox: {
				const checkboxOptions = [
					{ id: '1', name: translate('menuDataviewFilterValuesChecked') },
					{ id: '0', name: translate('menuDataviewFilterValuesUnchecked') },
				];
				return (
					<Select
						key={`${nodeId}-checkbox-${relationKey}`}
						id={`${nodeId}-checkbox`}
						value={value ? '1' : '0'}
						options={checkboxOptions}
						onChange={v => onUpdate(index, { value: Boolean(Number(v)) })}
						menuParam={{ classNameWrap: 'fromBlock', offsetY: 4 }}
						readonly={readonly}
					/>
				);
			};

			case I.RelationType.ShortText:
			case I.RelationType.Number:
			case I.RelationType.Url:
			case I.RelationType.Phone:
			case I.RelationType.Email: {
				return (
					<Input
						ref={inputRef}
						value={value}
						placeholder={translate(`placeholderCell${relation.format}`)}
						onKeyUp={(e: any, v: string) => onUpdate(index, { value: v })}
						readonly={readonly}
					/>
				);
			};

			case I.RelationType.Object:
			case I.RelationType.File: {
				const items = Relation.getArrayValue(value)
					.map(id => S.Detail.get(subId, id, []))
					.filter(it => !it._empty_ && !it.isArchived && !it.isDeleted);

				if (!items.length) {
					return null;
				};

				return (
					<div className="objectsList">
						{items.map((item: any) => (
							<ItemObject
								key={item.id}
								cellId={nodeId}
								getObject={() => item}
								relation={relation}
								canEdit={false}
							/>
						))}
					</div>
				);
			};

			case I.RelationType.Select:
			case I.RelationType.MultiSelect: {
				const items = Relation.getOptions(value)
					.filter(it => !it.isArchived && !it.isDeleted && !it._empty_);

				if (!items.length) {
					return null;
				};

				return (
					<div className="optionsList">
						{items.map((item: any) => (
							<Tag
								key={item.id}
								text={item.name}
								color={item.color}
								className={Relation.selectClassName(relation.format)}
							/>
						))}
					</div>
				);
			};

			default: {
				return null;
			};
		};
	};

	const onValueClick = () => {
		const view = getView();
		const withMenu = [
			I.RelationType.Object,
			I.RelationType.File,
			I.RelationType.Select,
			I.RelationType.MultiSelect
		].includes(relation.format);

		if (!view || readonly || !withMenu) {
			return;
		};

		S.Menu.open('dataviewFilterValues', {
			element: `#${nodeId} .valueSelect`,
			classNameWrap: 'fromBlock',
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			data: {
				rootId,
				blockId,
				isInline,
				getView,
				getTarget,
				readonly,
				filter: rule,
				hideHead: true,
				onFilterPropChange: (k: string, v: any) => {
					onUpdate(index, { [k]: v });
				},
			}
		});
	};

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

	const valueContent = getValue();
	const cn = [ 'rule' ];
	const vscn = [ 'valueSelect', `is${I.RelationType[relation.format]}` ];

	if (readonly) {
		cn.push('isReadonly');
	};

	if (!valueContent) {
		vscn.push('isEmpty');
	};

	return (
		<div
			id={nodeId}
			className={cn.join(' ')}
		>
			{index == 0 ? (
				<div className="head">
					<Label text={translate('commonWhere')} />
				</div>
			) : index == 1 ? (
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
					onChange={v => {
						const newCondition = Number(v) as I.FilterCondition;
						const data: Partial<I.Filter> = { condition: newCondition };

						if ([ I.FilterCondition.None, I.FilterCondition.Empty, I.FilterCondition.NotEmpty ].includes(newCondition)) {
							data.value = Relation.formatValue(relation, null, false);
						};

						if (relation.format == I.RelationType.Date) {
							const qo = Relation.filterQuickOptions(relation.format, newCondition);
							const currentQo = qo.find(it => it.id == rule.quickOption);

							if (!currentQo && qo.length) {
								data.quickOption = qo[0].id as I.FilterQuickOption;
							};
						};

						onUpdate(index, data);
					}}
					menuParam={{ classNameWrap: 'fromBlock', offsetY: 4 }}
					readonly={readonly}
				/>

				<div className={vscn.join(' ')} onClick={onValueClick}>
					{valueContent}
				</div>

				{!readonly ? <Icon className="more withBackground" onClick={onMore} /> : ''}
			</div>
		</div>
	);

}));

export default DataviewFilterRule;
