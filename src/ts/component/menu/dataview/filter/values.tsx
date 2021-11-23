import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, DataUtil, Util, translate, keyboard } from 'ts/lib';
import { Select, Tag, Icon, IconObject, Input, MenuItemVertical } from 'ts/component';
import { menuStore, dbStore, detailStore } from 'ts/store';
import { observable } from 'mobx';
import { observer } from 'mobx-react';

interface Props extends I.Menu {}

const $ = require('jquery');
const Constant = require('json/constant.json');
const TIMEOUT = 500;

const MenuDataviewFilterValues = observer(class MenuDataviewFilterValues extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	timeoutChange: number = 0;
	refValue: any = null;
	range: any = null;
	n: number = 0;

	constructor (props: any) {
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

		const item = view.getFilter(itemId);
		const relation: any = dbStore.getRelation(rootId, blockId, item.relationKey) || {};
		const relationOptions = this.getRelationOptions();
		const conditionOptions = DataUtil.filterConditionsByType(relation.format);
		const checkboxOptions: I.Option[] = [
			{ id: '1', name: 'Checked' },
			{ id: '0', name: 'Unchecked' },
		];
		const relationOption: any = relationOptions.find((it: any) => { return it.id == item.relationKey; }) || {};
		const conditionOption: any = conditionOptions.find((it: any) => { return it.id == item.condition; }) || {};
		const items = this.getItems();

		let value = null;
		let Item = null;
		let list = [];
		let onSubmit = (e: any) => { this.onSubmit(e, item); };

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
				<div className="name">Add</div>
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
							<div className="clickable" onClick={(e: any) => { this.onTag(e, element); }}>
								<Tag {...element} className={DataUtil.tagClass(relation.format)} />
							</div>
							<div className="buttons">
								<Icon className="delete" onClick={(e: any) => { this.onRemove(e, element); }} />
							</div>
						</div>
					);
				};

				list = DataUtil.getRelationArrayValue(item.value).map((id: string) => { 
					return (relation.selectDict || []).find((it: any) => { return it.id == id; });
				});
				list = list.filter((it: any) => { return it && it.id; });

				value = (
					<React.Fragment>
						<ItemAdd onClick={(e: any) => { this.onTag(e, item); }} />
						{list.map((element: any) => (
							<Item key={element.id} {...element} />
						))}
					</React.Fragment>
				);
				break;
			
			case I.RelationType.Object:
				Item = (element: any) => {	
					const type = dbStore.getObjectType(element.type);
					return (
						<div className="item withCaption">
							<div className="clickable" onClick={(e: any) => { this.onObject(e, item); }}>
								<IconObject object={element} />
								<div className="name">{element.name}</div>
							</div>
							<div className="caption">
								{type?.name}
							</div>
							<div className="buttons">
								<Icon className="delete" onClick={(e: any) => { this.onRemove(e, element); }} />
							</div>
						</div>
					);
				};

				list = DataUtil.getRelationArrayValue(item.value).map((it: string) => { 
					return detailStore.get(rootId, it, []); 
				})
				list = list.filter((it: any) => { return !it._empty_; });

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
							className="operator" 
							arrowClassName="light"
							options={checkboxOptions} 
							value={item.value ? '1' : '0'} 
							onChange={(v: string) => { this.onChange('value', Boolean(Number(v)), true); }} 
						/>
					</div>
				);
				break;

			case I.RelationType.Date:
				value = (
					<div className="item">
						<Input 
							ref={(ref: any) => { this.refValue = ref; }} 
							value={item.value !== null ? Util.date('d.m.Y H:i:s', item.value) : ''} 
							placeholder="dd.mm.yyyy hh:mm:ss"
							maskOptions={{ mask: '99.99.9999 99:99:99' }}
							onFocus={(e: any) => { this.onFocusDate(e); }}
							onSelect={(e: any) => { this.onSelect(e); }}
						/>
						<Icon className="clear" onClick={this.onClear} />
					</div>
				);
				onSubmit = (e: any) => { this.onSubmitDate(e); };
				break;

			default:
				value = (
					<div className="item">
						<Input 
							ref={(ref: any) => { this.refValue = ref; }} 
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

		if ([ I.FilterCondition.None, I.FilterCondition.Empty, I.FilterCondition.NotEmpty ].indexOf(item.condition) >= 0) {
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
		const { rootId, blockId, getView, itemId } = data;

		const view = getView();
		if (!view) {
			return;
		};

		this.init();
		this.props.setActive();

		const item = view.getFilter(itemId);
		const relation = dbStore.getRelation(rootId, blockId, item.relationKey);

		if (relation && this.refValue) {
			if (this.refValue.setValue) {
				if (relation.format == I.RelationType.Date) {
					this.refValue.setValue(item.value === null ? '' : Util.date('d.m.Y H:i:s', item.value));
				} else {
					this.refValue.setValue(item.value);
				};
			};

			if (this.range && this.refValue.setRange) {
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
		$(window).unbind('keydown.menu');
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
		const { rootId, blockId, getView, itemId } = data;
		const item = getView().getFilter(itemId);
		const relation: any = dbStore.getRelation(rootId, blockId, item.relationKey) || {};
		const relationOptions = this.getRelationOptions();
		const conditionOptions = DataUtil.filterConditionsByType(relation.format);
		const relationOption: any = relationOptions.find((it: any) => { return it.id == item.relationKey; }) || {};
		const conditionOption: any = conditionOptions.find((it: any) => { return it.id == item.condition; }) || {};

		return [
			{ id: 'relation', icon: relationOption.icon, name: relationOption.name, arrow: true },
			{ id: 'condition', icon: conditionOption.icon, name: conditionOption.name, format: relation.format, arrow: true, }
		];
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};

		const { getId, getSize } = this.props;

		let options = [];
		let key = '';

		switch (item.id) {
			case 'relation':
				options = this.getRelationOptions();
				key = 'relationKey';
				break;

			case 'condition':
				options = DataUtil.filterConditionsByType(item.format);	
				key = 'condition';
				break;
		};

		menuStore.open('select', {
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			offsetY: -36,
			isSub: true,
			data: {
				rebind: this.rebind,
				value: item[key],
				options: options,
				onSelect: (e: any, el: any) => {
					this.onChange(key, el.id);
				}
			}
		});
	};

	onChange (k: string, v: any, timeout?: boolean) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView, itemId, save } = data;
		const view = getView();

		if (!view) {
			return;
		};
		
		let item = view.getFilter(itemId);
		if (!item) {
			return;
		};

		const relation = dbStore.getRelation(rootId, blockId, item.relationKey);
		if (!relation) {
			return;
		};

		this.checkClear(v);

		window.clearTimeout(this.timeoutChange);
		this.timeoutChange = window.setTimeout(() => {
			item = Util.objectCopy(item);
			item[k] = v;

			// Remove value when we change relation, filter non unique entries
			if (k == 'relationKey') {
				const relation = dbStore.getRelation(rootId, blockId, v);
				const conditions = DataUtil.filterConditionsByType(relation.format);

				item.condition = conditions.length ? conditions[0].id : I.FilterCondition.None;
				item.value = DataUtil.formatRelationValue(relation, null, false);
			};

			if (k == 'value') {
				item[k] = DataUtil.formatRelationValue(relation, item[k], false);
			};
	
			if (k == 'condition') {
				if ([ I.FilterCondition.None, I.FilterCondition.Empty, I.FilterCondition.NotEmpty ].indexOf(v) >= 0) {
					item.value = DataUtil.formatRelationValue(relation, null, false);
				};
			};

			view.setFilter(itemId, item);

			save();
			this.forceUpdate();
		}, timeout ? TIMEOUT : 0);
	};

	onRemove (e: any, element: any) {
		const { param } = this.props;
		const { data } = param;
		const { getView, itemId } = data;
		const view = getView();
		
		let item = view.getFilter(itemId);
		if (!item) {
			return;
		};

		let value = DataUtil.getRelationArrayValue(item.value);
		value = value.filter((it: any) => { return it != element.id; });
		value = Util.arrayUnique(value);

		this.onChange('value', value);
	};

	onSubmit (e: any, item: any) {
		e.preventDefault();

		const { param, close } = this.props;
		const { data } = param;
		const { getView, itemId } = data;

		getView().setFilter(itemId, { value: this.refValue.getValue() });
		close();
	};

	onSubmitDate (e: any) {
		e.preventDefault();

		const value = Util.parseDate(this.refValue.getValue());
		
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
		const value = item.value || Util.time();

		menuStore.closeAll([ 'select' ], () => {
			if (menuStore.isOpen('dataviewCalendar')) {
				menuStore.updateData('dataviewCalendar', { value: value });
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
			onOpen: () => {
				window.setTimeout(() => { this.refValue.focus(); }, 200);
			},
			data: { 
				rebind: this.rebind,
				value: value, 
				onChange: (value: number) => {
					this.onChange('value', value);
				},
			},
		});
	};

	onTag (e: any, element: any) {
		const { param, getId, getSize } = this.props;
		const { data } = param;
		const { rootId, blockId, getView, itemId } = data;
		const item = getView().getFilter(itemId);
		const relation = dbStore.getRelation(rootId, blockId, item.relationKey);

		menuStore.closeAll([ 'dataviewOptionValues', 'dataviewOptionList', 'select' ], () => {
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
		const relation = dbStore.getRelation(rootId, blockId, item.relationKey);

		menuStore.closeAll([ 'dataviewObjectValues', 'dataviewObjectList', 'select' ], () => {
			menuStore.open('dataviewObjectList', { 
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
					types: relation.objectTypes,
					relation: observable.box(relation),
					onChange: (value: any) => {
						this.onChange('value', value);
					},
				},
			});
		});
	};

	getRelationOptions () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView } = data;

		return DataUtil.getRelationOptions(rootId, blockId, getView());
	};

	checkClear (v: any) {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
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