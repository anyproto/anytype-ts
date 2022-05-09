import * as React from 'react';
import { I, Relation, DataUtil, Util } from 'ts/lib';
import { Icon, Tag, IconObject } from 'ts/component';
import { detailStore } from 'ts/store';
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

const MenuItemFilter = observer(class MenuItemFilter extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);
	};

	render () {
		const { id, index, relation, condition, quickOption, value, subId, readonly, style, onOver, onClick, onRemove } = this.props;

		const conditionOptions = Relation.filterConditionsByType(relation.format);
		const conditionOption: any = conditionOptions.find(it => it.id == condition) || {};
		const filterOptions = Relation.filterQuickOptions(relation.format, conditionOption.id);
		const filterOption: any = filterOptions.find(it => it.id == quickOption) || {};

		let v: any = null;
		let list = [];
		let Item: any = null;

		const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));

		switch (relation.format) {

			default:
				v = `“${value}”`
				break;

			case I.RelationType.Number:
				v = Number(value) || 0;
				break;

			case I.RelationType.Date:
				v = [];

				if (quickOption == I.FilterQuickOption.ExactDate) {
					v.push(value !== null ? Util.date('d.m.Y', value) : 'empty');
				} else
				if ([ I.FilterQuickOption.NumberOfDaysAgo, I.FilterQuickOption.NumberOfDaysNow ].includes(quickOption)) {
					v.push(filterOption.name.toLowerCase());
					v.push(value !== null ? Number(value) : 'empty');
				} else {
					v.push(filterOption.name.toLowerCase());
				};

				v = v.join(' ');
				break;

			case I.RelationType.Checkbox:
				v = value ? 'checked' : 'unchecked';
				break;

			case I.RelationType.Tag:
			case I.RelationType.Status:
				list = Relation.getArrayValue(value).map((id: string) => { 
					return (relation.selectDict || []).find((it: any) => { return it.id == id; });
				});
				list = list.filter((it: any) => { return it && it.id; });

				if (list.length) {
					v = (
						<React.Fragment>
							{list.map((item: any) => (
								<Tag {...item} key={item.id} className={DataUtil.tagClass(relation.format)} />
							))}
						</React.Fragment>
					);
				} else {
					v = 'empty';
				};
				break;

			case I.RelationType.Object:
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

				list = Relation.getArrayValue(value).map((it: string) => { return detailStore.get(subId, it, []); });
				list = list.filter((it: any) => { return !it._empty_; });

				v = (
					<React.Fragment>
						{list.map((item: any, i: number) => {
							return <Item key={i} {...item} />;
						})}
					</React.Fragment>
				);
				break;
		};

		if ([ I.FilterCondition.None, I.FilterCondition.Empty, I.FilterCondition.NotEmpty ].indexOf(condition) >= 0) {
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
						<Icon className="more" onClick={onClick} />
						<Icon className="delete" onClick={onRemove} />
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