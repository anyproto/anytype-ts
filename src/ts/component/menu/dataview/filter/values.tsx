import * as React from 'react';
import $ from 'jquery';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { I, UtilCommon, translate, keyboard, analytics, Relation, UtilDate, UtilObject } from 'Lib';
import { Select, Tag, Icon, IconObject, Input, MenuItemVertical } from 'Component';
import { menuStore, dbStore, detailStore, blockStore } from 'Store';
const Constant = require('json/constant.json');

const TIMEOUT = 1000;

const MenuDataviewFilterValues = observer(class MenuDataviewFilterValues extends React.Component<I.Menu> {

	_isMounted = false;
	node: any = null;
	timeoutChange = 0;
	refInput = null;
	refSelect = null;
	range: any = null;
	n = -1;

	constructor (props: I.Menu) {
		super(props);

		this.rebind = this.rebind.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.onFocusText = this.onFocusText.bind(this);
		this.onFocusDate = this.onFocusDate.bind(this);
		this.onSubmitDate = this.onSubmitDate.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onObject = this.onObject.bind(this);
		this.onTag = this.onTag.bind(this);
		this.onClear = this.onClear.bind(this);
		this.onOver = this.onOver.bind(this);
		this.onSelectClose = this.onSelectClose.bind(this);
		this.onValueHover = this.onValueHover.bind(this);
	};

	render () {
		const { param, setHover } = this.props;
		const { data } = param;
		const { rootId, blockId, getView, itemId } = data;

		const view = getView();
		if (!view) {
			return null;
		};

		const item = view.getFilter(itemId);
		if (!item) {
			return null;
		};

		const isReadonly = this.isReadonly();
		const subId = dbStore.getSubId(rootId, blockId);
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
		const selectParam = {
			width: 260,
			isSub: true,
			noScroll: true,
			noVirtualisation: true,
			onClose: this.onSelectClose,
		};

		let wrapValue = false;
		let value = null;
		let Item = null;
		let list = [];
		let onSubmit = e => this.onSubmit(e);

		const ItemAdd = (item: any) => (
			<div 
				id="item-add" 
				className="item add" 
				onClick={item.onClick} 
				onMouseEnter={() => { 
					menuStore.close('select', () => {
						window.setTimeout(() => setHover({ id: 'add' }), 35);
					});
				}}
			>
				<Icon className="plus" />
				<div className="name">{translate('commonAdd')}</div>
			</div>
		);

		switch (relation.format) {

			case I.RelationType.MultiSelect:
			case I.RelationType.Select: {
				Item = (element: any) => {
					return (
						<div 
							id={`item-tag-${element.id}`} 
							className={[ 'item', (isReadonly ? 'isReadonly' : '') ].join(' ')}
							onMouseEnter={() => {
								menuStore.close('select'); 
								setHover({ id: `tag-${element.id}` }); 
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
								<Icon className="delete" onClick={e => this.onDelete(e, element)} />
							</div>
						</div>
					);
				};

				list = Relation.getOptions(item.value);

				value = (
					<React.Fragment>
						{!isReadonly ? <ItemAdd onClick={this.onTag} /> : ''}
						{list.map(element => <Item key={element.id} {...element} />)}
					</React.Fragment>
				);
				break;
			};
			
			case I.RelationType.File:
			case I.RelationType.Object: {
				Item = (element: any) => {	
					const type = dbStore.getTypeById(element.type);

					return (
						<div 
							id={`item-object-${element.id}`} 
							className={[ 'item', 'withCaption', (isReadonly ? 'isReadonly' : '') ].join(' ')}
							onMouseEnter={() => setHover({ id: `object-${element.id}` })}
						>
							<div className="clickable" onClick={e => this.onObject(e, item)}>
								<IconObject object={element} />
								<div className="name">{element.name}</div>
							</div>
							<div className="caption">
								{type?.name}
							</div>
							<div className="buttons">
								<Icon className="delete" onClick={e => this.onDelete(e, element)} />
							</div>
						</div>
					);
				};

				list = Relation.getArrayValue(item.value).map(it => detailStore.get(subId, it, []));
				list = list.filter(it => !it._empty_);

				value = (
					<React.Fragment>
						{!isReadonly ? <ItemAdd onClick={e => this.onObject(e, item)} /> : ''}
						{list.map((item: any, i: number) => <Item key={i} {...item} />)}
					</React.Fragment>
				);
				break;
			};

			case I.RelationType.Checkbox: {
				value = (
					<Select 
						id={[ 'filter', 'checkbox', item.id ].join('-')} 
						ref={ref => this.refSelect = ref}
						className="checkboxValue" 
						arrowClassName="light"
						options={checkboxOptions} 
						value={item.value ? '1' : '0'}
						onChange={v => this.onChange('value', Boolean(Number(v)), true)} 
						menuParam={selectParam}
						readonly={isReadonly}
					/>
				);
				wrapValue = true;
				break;
			};

			case I.RelationType.Date: {
				if ([ I.FilterQuickOption.NumberOfDaysAgo, I.FilterQuickOption.NumberOfDaysNow ].includes(item.quickOption)) {
					value = (
						<React.Fragment>
							<Input 
								key="filter-value-date-days-input"
								ref={ref => this.refInput = ref} 
								value={item.value} 
								placeholder={translate('commonValue')} 
								onFocus={this.onFocusText}
								onKeyUp={(e: any, v: string) => this.onChange('value', v, true)} 
								onSelect={this.onSelect}
								readonly={isReadonly}
							/>
							<Icon className="clear" onClick={this.onClear} />
						</React.Fragment>
					);
				} else
				if ([ I.FilterQuickOption.ExactDate ].includes(item.quickOption)) {
					value = (
						<React.Fragment>
							<Input 
								key="filter-value-date-exact-input"
								ref={ref => this.refInput = ref} 
								value={item.value !== null ? UtilDate.date('d.m.Y H:i:s', item.value) : ''} 
								placeholder="dd.mm.yyyy hh:mm:ss"
								maskOptions={{ mask: '99.99.9999 99:99:99' }}
								onFocus={this.onFocusDate}
								onSelect={this.onSelect}
								readonly={isReadonly}
							/>
							<Icon className="clear" onClick={this.onClear} />
						</React.Fragment>
					);
					onSubmit = this.onSubmitDate;
				};
				wrapValue = true;
				break;
			};

			default: {
				value = (
					<React.Fragment>
						<Input 
							ref={ref => this.refInput = ref} 
							value={item.value} 
							placeholder={translate('commonValue')} 
							onFocus={this.onFocusText}
							onKeyUp={(e: any, v: string) => this.onChange('value', v, true)} 
							onSelect={this.onSelect}
							readonly={isReadonly}
						/>
						<Icon className="clear" onClick={this.onClear} />
					</React.Fragment>
				);
				wrapValue = true;
				break;
			};
		};

		if (Relation.isDictionary(item.relationKey)) {
			value = (
				<Select 
					id={[ 'filter', 'dictionary', item.id ].join('-')} 
					ref={ref => this.refSelect = ref}
					className="checkboxValue" 
					arrowClassName="light"
					options={Relation.getDictionaryOptions(item.relationKey)} 
					value={item.value}
					onChange={v => this.onChange('value', Number(v), true)} 
					menuParam={selectParam}
					readonly={isReadonly}
				/>
			);
			wrapValue = true;
		};

		if ([ I.FilterCondition.None, I.FilterCondition.Empty, I.FilterCondition.NotEmpty ].includes(item.condition)) {
			value = null;
		};

		if (value && wrapValue) {
			value = (
				<div 
					id="item-value" 
					className="item" 
					onMouseEnter={this.onValueHover}
				>
					{value}
				</div>
			);
		};

		return (
			<div ref={ref => this.node = ref}>
				<div className="section">
					{items.map((item: any, i: number) => (
						<MenuItemVertical key={i} {...item} onMouseEnter={e => this.onOver(e, item)} readonly={isReadonly} />
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

		if (relation && this.refInput) {
			const isDate = relation.format == I.RelationType.Date;

			if (this.refInput.setValue) {
				if (isDate) {
					if (item.quickOption == I.FilterQuickOption.ExactDate) {
						this.refInput.setValue(item.value === null ? '' : UtilDate.date('d.m.Y H:i:s', item.value));
					} else {
						this.refInput.setValue(item.value);
					};
				} else {
					this.refInput.setValue(item.value);
				};
			};

			if (this.range && this.refInput.setRange && !isDate) {
				this.refInput.setRange(this.range);
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
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
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
		
		const filterQuickOptions = Relation.filterQuickOptions(relation.format, item.condition);
		const filterOption: any = filterQuickOptions.find(it => it.id == item.quickOption) || {};

		let conditionOptions = [];
		if (Relation.isDictionary(item.relationKey)) {
			conditionOptions = Relation.filterConditionsDictionary();
		} else {
			conditionOptions = Relation.filterConditionsByType(relation.format);
		};

		const conditionOption: any = conditionOptions.find(it => it.id == item.condition) || {};

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
		const { getId, getSize, setActive, param } = this.props;
		const { data } = param;
		const { getView, itemId } = data;
		const view = getView();
		const filter = view.getFilter(itemId);
		const isReadonly = this.isReadonly();

		if (isReadonly) {
			return;
		};

		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};

		let options = [];
		let key = item.id;

		switch (item.id) {
			case 'relation': {
				options = this.getRelationOptions();
				key = 'relationKey';
				break;
			};

			case 'condition': {
				if (Relation.isDictionary(filter.relationKey)) {
					options = Relation.filterConditionsDictionary();	
				} else {
					options = Relation.filterConditionsByType(item.format);	
				};
				break;
			};

			case 'quickOption': {
				options = Relation.filterQuickOptions(item.format, item.condition);	
				break;
			};
		};

		menuStore.closeAll([ 'select' ], () => {
			menuStore.open('select', {
				element: `#${getId()} #item-${item.id}`,
				offsetX: getSize().width,
				vertical: I.MenuDirection.Center,
				isSub: true,
				noFlipY: true,
				data: {
					noFilter: true,
					noVirtualisation: true,
					rebind: this.rebind,
					value: item[key],
					options,
					onSelect: (e: any, el: any) => {
						this.onChange(key, el.id);
					}
				}
			});
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
		
		const item = view.getFilter(itemId);
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

		getView().setFilter({ id: itemId, value: this.refInput.getValue() });
		close();
	};

	onSubmitDate (e: any) {
		e.preventDefault();

		const value = UtilDate.parseDate(this.refInput.getValue());
		
		this.onChange('value', value);
		this.onCalendar(value);
	};

	onFocusText () {
		menuStore.close('select');
	};

	onFocusDate (e: any) {
		const isReadonly = this.isReadonly();
		if (isReadonly) {
			return;
		};

		const { param } = this.props;
		const { data } = param;
		const { getView, itemId } = data;
		const item = getView().getFilter(itemId);
		const value = item.value || UtilDate.now();

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
		const isReadonly = this.isReadonly();
		if (isReadonly) {
			return;
		};

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
					onChange: value => this.onChange('value', value),
				},
			});
		});
	};

	onObject (e: any, item: any) {
		const isReadonly = this.isReadonly();
		if (isReadonly) {
			return;
		};

		const { param, getId, getSize } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const relation = dbStore.getRelationByKey(item.relationKey);
		const filters = [];

		if (relation.format == I.RelationType.File) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.In, value: UtilObject.getFileLayouts() });
		};

		menuStore.closeAll([ 'dataviewObjectValues', 'dataviewObjectList', 'select' ], () => {
			menuStore.open('dataviewObjectList', { 
				element: `#${getId()}`,
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
					filters,
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

	onValueHover (e: React.MouseEvent) {
		e.persist();

		menuStore.closeAll([ 'select' ], () => {
			this.refSelect?.show(e);

			window.setTimeout(() => this.props.setHover({ id: 'value' }), 35);
		});
	};

	onSelectClose () {
		this.props.setHover();
	};

	isReadonly () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, readonly } = data;
		const allowedView = blockStore.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);

		return readonly || !allowedView;
	};

});

export default MenuDataviewFilterValues;