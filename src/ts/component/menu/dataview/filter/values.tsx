import * as React from 'react';
import $ from 'jquery';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { I, UtilCommon, translate, keyboard, analytics, Relation } from 'Lib';
import { Select, Tag, Icon, IconObject, Input, MenuItemVertical } from 'Component';
import { menuStore, dbStore, detailStore } from 'Store';
import Constant from 'json/constant.json';

const TIMEOUT = 1000;

const MenuDataviewFilterValues = observer(class MenuDataviewFilterValues extends React.Component<I.Menu> {

	_isMounted = false;
	node: any = null;
	timeoutChange = 0;
	refValue: any = null;
	range: any = null;
	n = -1;

	constructor (props: I.Menu) {
		super(props);

		this.rebind = this.rebind.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.onFocusText = this.onFocusText.bind(this);
		this.onFocusDate = this.onFocusDate.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onObject = this.onObject.bind(this);
		this.onTag = this.onTag.bind(this);
		this.onClear = this.onClear.bind(this);
		this.onOver = this.onOver.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView, itemId } = data;
		const view = getView();
		if (!view) {
			return null;
		};

		const subId = dbStore.getSubId(rootId, blockId);
		const item = view.getFilter(itemId);
		const relation: any = dbStore.getRelationByKey(item.relationKey) || {};
		const relationOptions = this.getRelationOptions();
		const conditionOptions = Relation.filterConditionsByType(relation.format);
		const checkboxOptions: I.Option[] = [
			{ id: '1', name: translate('menuDataviewFilterValuesChecked') },
			{ id: '0', name: translate('menuDataviewFilterValuesUnchecked') },
		];
		const relationOption: any = relationOptions.find(it => it.id == item.relationKey) || {};
		const conditionOption: any = conditionOptions.find(it => it.id == item.condition) || {};
		const items = this.getItems();

		let value = null;
		let Item = null;
		let list = [];
		let onSubmit = (e: any) => { this.onSubmit(e); };

		const ItemAdd = (item: any) => (
			<div 
				id="item-add" 
				className="item add" 
				onClick={item.onClick} 
				onMouseEnter={() => { 
					menuStore.close('select'); 
					this.props.setHover({ id: 'add' }); 
				}}
			>
				<Icon className="plus" />
				<div className="name">{translate('commonAdd')}</div>
			</div>
		);

		switch (relation.format) {

			case I.RelationType.Tag:
			case I.RelationType.Status:
				Item = (element: any) => {
					return (
						<div 
							id={'item-tag-' + element.id} 
							className="item" 
							onMouseEnter={() => {
								menuStore.close('select'); 
								this.props.setHover({ id: 'tag-' + element.id }); 
							}}
						>
							<div className="clickable" onClick={this.onTag}>
								<Tag
									text={element.name}
									color={element.color}
									className={Relation.selectClassName(relation.format)} 
								/>
							</div>
							<div className="buttons">
								<Icon className="delete" onClick={(e: any) => { this.onDelete(e, element); }} />
							</div>
						</div>
					);
				};

				list = Relation.getOptions(item.value);

				value = (
					<React.Fragment>
						<ItemAdd onClick={this.onTag} />
						{list.map((element: any) => (
							<Item key={element.id} {...element} />
						))}
					</React.Fragment>
				);
				break;
			
			case I.RelationType.Object:
				Item = (element: any) => {	
					const type = dbStore.getType(element.type);

					return (
						<div 
							id={'item-' + element.id} 
							className="item withCaption"
							onMouseEnter={() => { this.props.setHover({ id: element.id }); }}
						>
							<div className="clickable" onClick={(e: any) => { this.onObject(e, item); }}>
								<IconObject object={element} />
								<div className="name">{element.name}</div>
							</div>
							<div className="caption">
								{type.name}
							</div>
							<div className="buttons">
								<Icon className="delete" onClick={(e: any) => { this.onDelete(e, element); }} />
							</div>
						</div>
					);
				};

				list = Relation.getArrayValue(item.value).map(it => detailStore.get(subId, it, []));
				list = list.filter(it => !it._empty_);

				value = (
					<React.Fragment>
						<ItemAdd onClick={(e: any) => { this.onObject(e, item); }} />
						{list.map((item: any, i: number) => {
							return <Item key={i} {...item} />;
						})}
					</React.Fragment>
				);
				break;

			case I.RelationType.Checkbox:
				value = (
					<div className="item">
						<Select 
							id={[ 'filter', 'checkbox', item.id ].join('-')} 
							className="checkboxValue" 
							arrowClassName="light"
							options={checkboxOptions} 
							value={item.value ? '1' : '0'} 
							onChange={(v: string) => { this.onChange('value', Boolean(Number(v)), true); }} 
						/>
					</div>
				);
				break;

			case I.RelationType.Date:
				if ([ I.FilterQuickOption.NumberOfDaysAgo, I.FilterQuickOption.NumberOfDaysNow ].includes(item.quickOption)) {
					value = (
						<div key="filter-value-date-days" className="item">
							<Input 
								key="filter-value-date-days-input"
								ref={ref => this.refValue = ref} 
								value={item.value} 
								placeholder={translate('commonValue')} 
								onFocus={this.onFocusText}
								onKeyUp={(e: any, v: string) => { this.onChange('value', v, true); }} 
								onSelect={(e: any) => { this.onSelect(e); }}
							/>
							<Icon className="clear" onClick={this.onClear} />
						</div>
					);
				};

				if ([ I.FilterQuickOption.ExactDate ].includes(item.quickOption)) {
					value = (
						<div key="filter-value-date-exact" className="item">
							<Input 
								key="filter-value-date-exact-input"
								ref={ref => this.refValue = ref} 
								value={item.value !== null ? UtilCommon.date('d.m.Y H:i:s', item.value) : ''} 
								placeholder="dd.mm.yyyy hh:mm:ss"
								maskOptions={{ mask: '99.99.9999 99:99:99' }}
								onFocus={(e: any) => { this.onFocusDate(e); }}
								onSelect={(e: any) => { this.onSelect(e); }}
							/>
							<Icon className="clear" onClick={this.onClear} />
						</div>
					);
					onSubmit = (e: any) => { this.onSubmitDate(e); };
				};

				break;

			default:
				value = (
					<div className="item">
						<Input 
							ref={ref => this.refValue = ref} 
							value={item.value} 
							placeholder={translate('commonValue')} 
							onFocus={this.onFocusText}
							onKeyUp={(e: any, v: string) => { this.onChange('value', v, true); }} 
							onSelect={(e: any) => { this.onSelect(e); }}
						/>
						<Icon className="clear" onClick={this.onClear} />
					</div>
				);
				break;
		};

		if ([ I.FilterCondition.None, I.FilterCondition.Empty, I.FilterCondition.NotEmpty ].includes(item.condition)) {
			value = null;
		};

		return (
			<div>
				<div className="section">
					{items.map((item: any, i: number) => (
						<MenuItemVertical key={i} {...item} onMouseEnter={(e: any) => { this.onOver(e, item); }} />
					))}
				</div>

				{value ? (
					<div className="section">
						<form id="value" onSubmit={onSubmit}>
							{value}
						</form>
					</div>
				) : ''}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.init();
		this.rebind();
	};

	componentDidUpdate () {
		const { param } = this.props;
		const { data } = param;
		const { getView, itemId } = data;
		const view = getView();

		if (!view) {
			return;
		};

		this.init();
		this.props.setActive();

		const item = view.getFilter(itemId);
		const relation = dbStore.getRelationByKey(item.relationKey);

		if (relation && this.refValue) {
			const isDate = relation.format == I.RelationType.Date;

			if (this.refValue.setValue) {
				if (isDate) {
					if (item.quickOption == I.FilterQuickOption.ExactDate) {
						this.refValue.setValue(item.value === null ? '' : UtilCommon.date('d.m.Y H:i:s', item.value));
					} else {
						this.refValue.setValue(item.value);
					};
				} else {
					this.refValue.setValue(item.value);
				};
			};

			if (this.range && this.refValue.setRange && !isDate) {
				this.refValue.setRange(this.range);
			};
		};
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
		menuStore.closeAll(Constant.menuIds.cell);
    };

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	init () {
		const { param } = this.props;
		const { data } = param;
		const { getView, itemId } = data;
		const view = getView();
		if (!view) {
			return;
		};

		const item = view.getFilter(itemId);
		if (item) {
			this.checkClear(item.value);
		};
	};

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { getView, itemId } = data;
		const view = getView();

		if (!view) {
			return [];
		};

		const item = view.getFilter(itemId);
		const relation: any = dbStore.getRelationByKey(item.relationKey) || {};
		const relationOptions = this.getRelationOptions();
		const relationOption: any = relationOptions.find(it => it.id == item.relationKey) || {};
		
		const conditionOptions = Relation.filterConditionsByType(relation.format);
		const conditionOption: any = conditionOptions.find(it => it.id == item.condition) || {};
		
		const filterQuickOptions = Relation.filterQuickOptions(relation.format, item.condition);
		const filterOption: any = filterQuickOptions.find(it => it.id == item.quickOption) || {};

		const ret: any[] = [
			{ id: 'relation', icon: relationOption.icon, name: relationOption.name, arrow: true },
			{ id: 'condition', icon: '', name: conditionOption.name, format: relation.format, arrow: true },
		];

		if ((relation.format == I.RelationType.Date) && filterQuickOptions.length) {
			ret.push({ id: 'quickOption', icon: '', name: filterOption.name, format: relation.format, condition: conditionOption.id, arrow: true });
		};

		return ret;
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};

		const { getId, getSize } = this.props;

		let options = [];
		let key = item.id;

		switch (item.id) {
			case 'relation': {
				options = this.getRelationOptions();
				key = 'relationKey';
				break;
			};

			case 'condition': {
				options = Relation.filterConditionsByType(item.format);	
				break;
			};

			case 'quickOption': {
				options = Relation.filterQuickOptions(item.format, item.condition);	
				break;
			};
		};

		menuStore.open('select', {
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			isSub: true,
			noFlipY: true,
			data: {
				noFilter: true,
				noScroll: true,
				rebind: this.rebind,
				value: item[key],
				options,
				onSelect: (e: any, el: any) => {
					this.onChange(key, el.id);
				}
			}
		});
	};

	onChange (k: string, v: any, timeout?: boolean) {
		const { param } = this.props;
		const { data } = param;
		const { getView, itemId, save, isInline, getTarget } = data;
		const view = getView();
		const object = getTarget();

		if (!view) {
			return;
		};
		
		let item = view.getFilter(itemId);
		if (!item) {
			return;
		};

		const relation = dbStore.getRelationByKey(item.relationKey);
		if (!relation) {
			return;
		};

		this.checkClear(v);

		window.clearTimeout(this.timeoutChange);
		this.timeoutChange = window.setTimeout(() => {
			item = UtilCommon.objectCopy(item);
			item[k] = v;

			// Remove value when we change relation, filter non unique entries
			if (k == 'relationKey') {
				const relation = dbStore.getRelationByKey(v);
				const conditions = Relation.filterConditionsByType(relation.format);

				item.condition = conditions.length ? conditions[0].id : I.FilterCondition.None;
				item.quickOption = I.FilterQuickOption.ExactDate;
				item.value = Relation.formatValue(relation, null, false);
			};

			if (k == 'condition') {
				if ([ I.FilterCondition.None, I.FilterCondition.Empty, I.FilterCondition.NotEmpty ].includes(v)) {
					item.value = Relation.formatValue(relation, null, false);
				};

				const quickOptions = Relation.filterQuickOptions(relation.format, item.condition);
				const filterOption = quickOptions.find(it => it.id == item.quickOption);

				if (!filterOption) {
					item.quickOption = quickOptions.length ? quickOptions[0].id : I.FilterQuickOption.ExactDate;
				};
			};

			if (k == 'quickOption') {
				item.value = Relation.formatValue(relation, null, false);
			};

			if (k == 'value') {
				item[k] = Relation.formatValue(relation, item[k], false);
			};

			view.setFilter(item);

			analytics.event('ChangeFilterValue', {
				condition: item.condition,
				objectType: object.type,
				embedType: analytics.embedType(isInline)
			});

			save();
			this.forceUpdate();
		}, timeout ? TIMEOUT : 0);
	};

	onDelete (e: any, element: any) {
		const { param } = this.props;
		const { data } = param;
		const { getView, itemId } = data;
		const view = getView();
		
		let item = view.getFilter(itemId);
		if (!item) {
			return;
		};

		let value = Relation.getArrayValue(item.value);
		value = value.filter(it => it != element.id);
		value = UtilCommon.arrayUnique(value);

		this.onChange('value', value);
	};

	onSubmit (e: any) {
		e.preventDefault();

		const { param, close } = this.props;
		const { data } = param;
		const { getView, itemId } = data;

		getView().setFilter({ id: itemId, value: this.refValue.getValue() });
		close();
	};

	onSubmitDate (e: any) {
		e.preventDefault();

		const value = UtilCommon.parseDate(this.refValue.getValue());
		
		this.onChange('value', value);
		this.onCalendar(value);
	};

	onFocusText () {
		menuStore.close('select');
	};

	onFocusDate (e: any) {
		const { param } = this.props;
		const { data } = param;
		const { getView, itemId } = data;
		const item = getView().getFilter(itemId);
		const value = item.value || UtilCommon.time();

		menuStore.closeAll([ 'select' ], () => {
			if (menuStore.isOpen('dataviewCalendar')) {
				menuStore.updateData('dataviewCalendar', { value });
			} else {
				this.onCalendar(value);
			};
		});
	};

	onSelect (e: any) {
		this.range = {
			from: e.currentTarget.selectionStart,
			to: e.currentTarget.selectionEnd,
		};
	};

	onCalendar (value: number) {
		const { getId } = this.props;

		menuStore.open('dataviewCalendar', {
			element: `#${getId()} #value`,
			horizontal: I.MenuDirection.Center,
			data: { 
				rebind: this.rebind,
				value: value, 
				onChange: (value: number) => {
					this.onChange('value', value);
				},
			},
		});
	};

	onTag () {
		const { param, getId, getSize } = this.props;
		const { data } = param;
		const { rootId, blockId, getView, itemId } = data;
		const item = getView().getFilter(itemId);
		const relation = dbStore.getRelationByKey(item.relationKey);

		menuStore.closeAll([ 'dataviewOptionList', 'select' ], () => {
			menuStore.open('dataviewOptionList', { 
				element: `#${getId()} #value`,
				className: 'fromFilter',
				width: getSize().width,
				horizontal: I.MenuDirection.Center,
				noFlipY: true,
				data: { 
					rebind: this.rebind,
					rootId: rootId,
					blockId: blockId,
					value: item.value || [], 
					relation: observable.box(relation),
					canAdd: true,
					onChange: (value: any) => {
						this.onChange('value', value);
					},
				},
			});
		});
	};

	onObject (e: any, item: any) {
		const { param, getId, getSize } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const relation = dbStore.getRelationByKey(item.relationKey);

		menuStore.closeAll([ 'dataviewObjectValues', 'dataviewObjectList', 'select' ], () => {
			menuStore.open('dataviewObjectList', { 
				element: `#${getId()} #value`,
				className: 'fromFilter',
				width: getSize().width,
				horizontal: I.MenuDirection.Center,
				noFlipY: true,
				data: { 
					rebind: this.rebind,
					rootId,
					blockId,
					value: item.value, 
					types: relation.objectTypes,
					relation: observable.box(relation),
					canAdd: true,
					onChange: (value: any, callBack?: () => void) => {
						this.onChange('value', value);

						if (callBack) {
							callBack();
						};
					},
				},
			});
		});
	};

	getRelationOptions () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView } = data;

		return Relation.getFilterOptions(rootId, blockId, getView());
	};

	checkClear (v: any) {
		if (!this._isMounted) {
			return;
		};

		const node = $(this.node);
		const clear = node.find('.icon.clear');

		v ? clear.addClass('active') : clear.removeClass('active');
	};

	onClear (e: any) {
		e.stopPropagation();

		this.range = null;
		this.onChange('value', null);
	};

});

export default MenuDataviewFilterValues;