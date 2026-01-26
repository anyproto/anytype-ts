import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { I, S, U, Relation, translate } from 'Lib';
import { Icon, Tag, IconObject, Label } from 'Component';

interface Props extends I.Filter {
	id: string;
	subId: string;
	relation: any;
	filter: I.Filter;
	readonly?: boolean;
	onOver?: (e: any) => void;
	onClick?: (e: any) => void;
	onRemove?: (e: any) => void;
};

const DataviewFilterItem = observer(forwardRef<{}, Props>((props, ref) => {

	const { subId, filter, readonly, onOver, onClick, onRemove } = props;
	const { id, condition, quickOption, relation } = filter;
	const isDictionary = Relation.isDictionary(relation.relationKey);
	const cn = [ 'filterItem' ];

	if (readonly) {
		cn.push('isReadonly');
	};

	let conditionOptions = [];
	if (isDictionary) {
		conditionOptions = Relation.filterConditionsDictionary();
	} else {
		conditionOptions = Relation.filterConditionsByType(relation.format);
	};

	const conditionOption: any = conditionOptions.find(it => it.id == condition) || {};
	const filterOptions = Relation.filterQuickOptions(relation.format, conditionOption.id);
	const filterOption: any = filterOptions.find(it => it.id == quickOption) || {};

	let name = relation.name;
	let value = filter.value;
	let v: any = null;
	let list = [];
	let Item: any = null;


	switch (relation.format) {

		default: {
			v = `“${value}”`;
			break;
		};

		case I.RelationType.Number: {
			v = Number(value) || 0;
			break;
		};

		case I.RelationType.Date: {
			v = [];

			let name = String(filterOption.name || '').toLowerCase();

			if (quickOption == I.FilterQuickOption.ExactDate) {
				v.push(value !== null ? U.Date.date('d.m.Y', value) : '');
			} else
			if ([ I.FilterQuickOption.NumberOfDaysAgo, I.FilterQuickOption.NumberOfDaysNow ].includes(quickOption)) {
				value = Number(value) || 0;
				name = quickOption == I.FilterQuickOption.NumberOfDaysAgo ? `menuItemFilterTimeAgo` : `menuItemFilterTimeFromNow`;
				v.push(U.String.sprintf(translate(name), value, U.Common.plural(value, translate('pluralDay'))));
			} else
			if (filterOption) {
				v.push(name);
			};

			v = v.join(' ');
			break;
		};

		case I.RelationType.Checkbox: {
			v = translate(`relationCheckboxLabelShort${Number(value)}`);
			break;
		};

		case I.RelationType.MultiSelect:
		case I.RelationType.Select: {
			list = Relation.getOptions(value);

			if (list.length) {
				v = list.map(it => it.name).join(', ');
			} else {
				v = 'empty';
			};
			break;
		};

		case I.RelationType.File:
		case I.RelationType.Object: {
			Item = (item: any) => {
				return (
					<div className="element">
						<div className="flex">
							<IconObject object={item} />
							<div className="name">{item.name}</div>
						</div>
					</div>
				);
			};

			list = Relation.getArrayValue(value).map(it => S.Detail.get(subId, it, []));
			list = list.filter(it => !it._empty_);

			v = list.map(it => it.name).join(', ');
			break;
		};
	};

	if (isDictionary) {
		const options = Relation.getDictionaryOptions(relation.relationKey);
		const option = options.find(it => it.id == v);

		if (option) {
			v = option.name;
		};
	};

	if ([ I.FilterCondition.None, I.FilterCondition.Empty, I.FilterCondition.NotEmpty ].includes(condition)) {
		v = null;
	};

	let withValue = false;
	if (Relation.isFilterActive(filter)) {
		withValue = true;
		cn.push('withValue');
	};

	return (
		<div
			id={`item-${id}`}
			className={cn.join(' ')}
			onMouseEnter={onOver}
			onClick={onClick}
		>
			<IconObject size={20} object={{ relationFormat: relation.format, layout: I.ObjectLayout.Relation }} />

			<div className="content">
				<Label className="name" text={name} />

				{withValue ? (
					<>
						<Label className="condition" text={conditionOption.name} />
						<div className="value">{v}</div>
					</>
				) : ''}
			</div>

			<Icon className="delete" onClick={onRemove} />
		</div>
	);

}));

export default DataviewFilterItem;
