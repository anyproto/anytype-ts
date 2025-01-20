import * as React from 'react';
import { I, S, U, Relation, translate } from 'Lib';
import { Icon, Tag, IconObject } from 'Component';
import { SortableHandle, SortableElement } from 'react-sortable-hoc';
import { observer } from 'mobx-react';

interface Props extends I.Filter {
	id: string;
	index: number;
	subId: string;
	relation: any;
	readonly?: boolean;
	style: any;
	onOver?: (e: any) => void;
	onClick?: (e: any) => void;
	onRemove?: (e: any) => void;
};

const MenuItemFilter = observer(class MenuItemFilter extends React.Component<Props> {

	_isMounted = false;

	render () {
		const { id, index, relation, condition, quickOption, subId, readonly, style, onOver, onClick, onRemove } = this.props;
		const isDictionary = Relation.isDictionary(relation.relationKey);

		let conditionOptions = [];
		if (isDictionary) {
			conditionOptions = Relation.filterConditionsDictionary();
		} else {
			conditionOptions = Relation.filterConditionsByType(relation.format);
		};

		const conditionOption: any = conditionOptions.find(it => it.id == condition) || {};
		const filterOptions = Relation.filterQuickOptions(relation.format, conditionOption.id);
		const filterOption: any = filterOptions.find(it => it.id == quickOption) || {};

		let value = this.props.value;
		let v: any = null;
		let list = [];
		let Item: any = null;

		const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));

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
					v.push(U.Common.sprintf(translate(name), value, U.Common.plural(value, translate('pluralDay'))));
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
					v = (
						<>
							{list.map((item: any) => (
								<Tag 
									key={item.id}
									text={item.name}
									color={item.color}
									className={Relation.selectClassName(relation.format)} 
								/>
							))}
						</>
					);
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

				v = (
					<>
						{list.map((item: any, i: number) => {
							return <Item key={i} {...item} />;
						})}
					</>
				);
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

		const Element = SortableElement((item: any) => (
			<div 
				id={'item-' + id}
				className={[ 'item', (readonly ? 'isReadonly' : '') ].join(' ')} 
				onMouseEnter={onOver}
				style={style}
			>
				{!readonly ? <Handle /> : ''}
				<IconObject size={40} object={{ relationFormat: relation.format, layout: I.ObjectLayout.Relation }} />

				<div className="txt" onClick={onClick}>
					<div className="name">{relation.name}</div>
					<div className="flex">
						<div className="condition grey">
							{conditionOption.name}
						</div>
						{v !== null ? (
							<div className="value grey">{v}</div>
						) : ''}
					</div>
				</div>

				{!readonly ? (
					<div className="buttons">
						<Icon className="more withBackground" onClick={onClick} />
						<Icon className="delete withBackground" onClick={onRemove} />
					</div>
				) : ''}
			</div>
		));

		return <Element index={index} />;
	};

	componentDidMount () {
		this._isMounted = true;
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

});

export default MenuItemFilter;
