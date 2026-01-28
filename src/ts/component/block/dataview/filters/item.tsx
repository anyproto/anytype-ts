import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { I, S, U, Relation, translate } from 'Lib';
import { Icon, Tag, IconObject, Label } from 'Component';

interface FilterWithRelation extends I.Filter {
	relation: any;
};

interface Props {
	subId: string;
	filter: FilterWithRelation;
	readonly?: boolean;
	onOver?: (e: any) => void;
	onClick?: (e: any) => void;
	onRemove?: (e: any) => void;
	onContextMenu?: (e: React.MouseEvent) => void;
};

const DataviewFilterItem = observer(forwardRef<{}, Props>((props, ref) => {

	const { subId, filter, readonly, onOver, onClick, onRemove, onContextMenu } = props;
	const { id, condition, quickOption, relation } = filter;

	if (!relation) {
		return null;
	};

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

	const name = relation.name;
	let value = filter.value;
	let v: any = null;
	let list = [];

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

			let filterName = String(filterOption.name || '').toLowerCase();

			if (quickOption == I.FilterQuickOption.ExactDate) {
				v.push(value !== null ? U.Date.date('d.m.Y', value) : '');
			} else
			if ([ I.FilterQuickOption.NumberOfDaysAgo, I.FilterQuickOption.NumberOfDaysNow ].includes(quickOption)) {
				value = Number(value) || 0;
				filterName = quickOption == I.FilterQuickOption.NumberOfDaysAgo ? `menuItemFilterTimeAgo` : `menuItemFilterTimeFromNow`;
				v.push(U.String.sprintf(translate(filterName), value, U.Common.plural(value, translate('pluralDay'))));
			} else
			if (filterOption) {
				v.push(filterName);
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
			onContextMenu={onContextMenu}
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
