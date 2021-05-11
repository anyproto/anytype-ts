import * as React from 'react';
import { I, C, DataUtil, Util, translate } from 'ts/lib';
import { Select, Tag, Icon, IconObject, Input } from 'ts/component';
import { menuStore, dbStore, detailStore } from 'ts/store';
import { observable } from 'mobx';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const Constant = require('json/constant.json');
const TIMEOUT = 500;

@observer
class MenuDataviewFilterValues extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	timeoutChange: number = 0;
	ref: any = null;
	range: I.TextRange = {
		from: 0,
		to: 0,
	};

	constructor (props: any) {
		super(props);

		this.onSubmit = this.onSubmit.bind(this);
		this.onFocusDate = this.onFocusDate.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onObject = this.onObject.bind(this);
		this.onTag = this.onTag.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView, itemId } = data;
		const item = getView().getFilter(itemId);
		const relation = dbStore.getRelation(rootId, blockId, item.relationKey);
		const conditionOptions = DataUtil.filterConditionsByType(relation.format);
		const checkboxOptions: I.Option[] = [
			{ id: '1', name: 'Checked' },
			{ id: '0', name: 'Unchecked' },
		];
		
		let value = null;
		let Item = null;
		let list = [];
		let onSubmit = (e: any) => { this.onSubmit(e, item); };

		const ItemAdd = (item: any) => (
			<div className="item add" onClick={item.onClick}>
				<Icon className="plus" />
				<div className="name">Add</div>
			</div>
		);

		switch (relation.format) {

			case I.RelationType.Tag:
			case I.RelationType.Status:
				Item = (element: any) => {
					return (
						<div className="item" >
							<div className="clickable" onClick={(e: any) => { this.onTag(e, element); }}>
								<Tag {...element} key={item.id} className={DataUtil.tagClass(relation.format)} />
							</div>
							<div className="buttons">
								<Icon className="delete" onClick={(e: any) => { this.onRemove(e, element); }} />
							</div>
						</div>
					);
				};

				list = (item.value || []).map((id: string, i: number) => { 
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
					return (
						<div className="item">
							<div className="clickable" onClick={(e: any) => { this.onObject(e, item); }}>
								<IconObject object={element} />
								<div className="name">{element.name}</div>
							</div>
							<div className="buttons">
								<Icon className="delete" onClick={(e: any) => { this.onRemove(e, element); }} />
							</div>
						</div>
					);
				};

				list = (item.value || []).map((it: string) => { 
					const object = detailStore.get(rootId, it, []);
					const { iconImage, iconEmoji, name } = object;
					return object;
				});
				list = list.filter((it: any) => { return !it._objectEmpty_; });

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
				console.log(item.value);
				value = (
					<div className="item">
						<Input 
							ref={(ref: any) => { this.ref = ref; }} 
							value={item.value !== '' ? Util.date('d.m.Y H:i:s', item.value) : ''} 
							placeHolder="dd.mm.yyyy hh:mm:ss"
							maskOptions={{ mask: '99.99.9999 99:99:99' }}
							onFocus={(e: any) => { this.onFocusDate(e, item); }}
							onSelect={(e: any) => { this.onSelect(e, item); }}
						/>
					</div>
				);
				onSubmit = (e: any) => { this.onSubmitDate(e, item); };
				break;

			default:
				value = (
					<div className="item">
						<Input 
							ref={(ref: any) => { this.ref = ref; }} 
							value={item.value} 
							placeHolder={translate('commonValue')} 
							onKeyUp={(e: any, v: string) => { this.onChange('value', v, true); }} 
							onSelect={(e: any) => { this.onSelect(e, item); }}
						/>
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
					<div className="item">
						<Select
							id="condition"
							className="condition grey" 
							arrowClassName="light"
							options={conditionOptions} 
							value={item.condition} 
							onChange={(v: string) => { this.onChange('condition', v); }} 
						/>
					</div>
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
	};

	componentWillUnmount () {
		this._isMounted = false;
		menuStore.closeAll(Constant.menuIds.cell);
    };

	componentDidUpdate () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView, itemId } = data;
		const view = getView();
		const item = view.getFilter(itemId);
		const relation = dbStore.getRelation(rootId, blockId, item.relationKey);

		if (this.ref) {
			if (this.ref.setValue) {
				if (relation.format == I.RelationType.Date) {
					this.ref.setValue(Util.date('d.m.Y H:i:s', item.value));
				} else {
					this.ref.setValue(item.value);
				};
			};

			if (this.ref.setRange) {
				this.ref.setRange(this.range);
			};
		};
	};

	onChange (k: string, v: any, timeout?: boolean) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView, itemId } = data;
		const view = getView();
		
		let item = view.getFilter(itemId);
		if (!item) {
			return;
		};

		window.clearTimeout(this.timeoutChange);
		this.timeoutChange = window.setTimeout(() => {
			item = Util.objectCopy(item);
			item[k] = v;
	
			if (k == 'condition') {
				if ([ I.FilterCondition.None, I.FilterCondition.Empty, I.FilterCondition.NotEmpty ].indexOf(v) >= 0) {
					const relation = dbStore.getRelation(rootId, blockId, item.relationKey);
					item.value = DataUtil.formatRelationValue(relation, null);
				};

				view.filters = view.filters.filter((it: I.Filter, i: number) => { 
					return (i == itemId) || 
					(it.relationKey != item.relationKey) || 
					((it.relationKey == item.relationKey) && (it.condition != v)); 
				});
			};

			view.setFilter(itemId, item);

			this.save();
			this.forceUpdate();
		}, timeout ? TIMEOUT : 0);
	};

	onRemove (e: any, element: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView, itemId } = data;
		const view = getView();
		
		let item = view.getFilter(itemId);
		if (!item) {
			return;
		};

		let value = Util.objectCopy(item.value);
		value = value.filter((it: any) => { return it != element.id; });
		value = Util.arrayUnique(value);

		this.onChange('value', value);
	};

	onSubmit (e: any, item: any) {
		e.preventDefault();

		const { param } = this.props;
		const { data } = param;
		const { getView } = data;

		getView().setFilter(item.id, { value: this.ref.getValue() });
	};

	onSubmitDate (e: any, item: any) {
		e.preventDefault();

		const value = Util.parseDate(this.ref.getValue());
		
		this.onChange('value', value);
		this.onCalendar(item.id, value);
	};

	onFocusDate (e: any, item: any) {
		const value = item.value || Util.time();
		
		if (menuStore.isOpen('dataviewCalendar')) {
			menuStore.updateData('dataviewCalendar', { value: value });
		} else {
			this.onCalendar(item.id, value);
		};
	};

	onSelect (e: any, item: any) {
		this.range = {
			from: e.currentTarget.selectionStart,
			to: e.currentTarget.selectionEnd,
		};
	};

	onCalendar (id: number, value: number) {
		const { getId } = this.props;

		menuStore.open('dataviewCalendar', {
			element: `#${getId()} #value`,
			offsetY: 4,
			horizontal: I.MenuDirection.Center,
			onOpen: () => {
				window.setTimeout(() => { this.ref.focus(); }, 200);
			},
			data: { 
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

		menuStore.closeAll([ 'dataviewOptionValues', 'dataviewOptionList' ], () => {
			menuStore.open('dataviewOptionList', { 
				element: `#${getId()} #value`,
				className: 'fromFilter',
				width: getSize().width,
				horizontal: I.MenuDirection.Center,
				noFlipY: true,
				data: { 
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

		menuStore.closeAll([ 'dataviewObjectValues', 'dataviewObjectList' ], () => {
			menuStore.open('dataviewObjectList', { 
				element: `#${getId()} #value`,
				className: 'fromFilter',
				width: getSize().width,
				horizontal: I.MenuDirection.Center,
				noFlipY: true,
				data: { 
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

	save () {
		const { param } = this.props;
		const { data } = param;
		const { getView, rootId, blockId, onSave } = data;
		const view = getView();

		C.BlockDataviewViewUpdate(rootId, blockId, view.id, view, onSave);
	};
    
};

export default MenuDataviewFilterValues;