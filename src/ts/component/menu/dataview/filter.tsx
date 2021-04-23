import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon, Select, Input, IconObject, Tag } from 'ts/component';
import { commonStore, blockStore, dbStore, menuStore } from 'ts/store';
import { I, C, DataUtil } from 'ts/lib';
import arrayMove from 'array-move';
import { translate, Util } from 'ts/lib';
import { observer } from 'mobx-react';
import { observable } from 'mobx';

interface Props extends I.Menu {};

const Constant = require('json/constant.json');
const $ = require('jquery');
const raf = require('raf');
const TIMEOUT = 500;

@observer
class MenuFilter extends React.Component<Props, {}> {
	
	refObj: any = {};
	timeoutChange: number = 0;
	range: I.TextRange = {
		from: 0,
		to: 0,
	};
	id: string = '';
	
	constructor (props: any) {
		super(props);
		
		this.onAdd = this.onAdd.bind(this);
		this.onDelete = this.onDelete.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.onFocusDate = this.onFocusDate.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onObject = this.onObject.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView } = data;
		const view = getView();
		const filterCnt = view.filters.length;
		const filters = Util.objectCopy(view.filters).map((it: any) => {
			return { 
				...it, 
				relation: dbStore.getRelation(rootId, blockId, it.relationKey),
			};
		}).filter((it: any) => { return it.relation ? true : false; });

		for (let filter of view.filters) {
			const { relationKey, condition, value } = filter;
		};

		const operatorOptions: I.Option[] = [
			{ id: String(I.FilterOperator.And), name: 'And' },
			{ id: String(I.FilterOperator.Or), name: 'Or' },
		];

		const checkboxOptions: I.Option[] = [
			{ id: '1', name: 'Checked' },
			{ id: '0', name: 'Unchecked' },
		];
		
		const relationOptions = this.getRelationOptions();

		const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));
		
		const Item = SortableElement((item: any) => {
			const relation = item.relation;
			const conditionOptions = DataUtil.filterConditionsByType(relation.format);
			const refGet = (ref: any) => { this.refObj[item.id] = ref; }; 
			const id = [ 'item', item.id, 'value' ].join('-');

			let value = null;
			let onSubmit = (e: any) => { this.onSubmit(e, item); };
			let Item = null;
			let cn = [];
			let cv = [ 'value' ];
			let list = [];

			if (item.id == filters.length - 1) {
				cv.push('last');
			};

			switch (relation.format) {

				case I.RelationType.Tag:
				case I.RelationType.Status:
					cn = [ 'select', 'isList' ];

					Item = (item: any) => {
						return (
							<div className="element">
								<Tag {...item} key={item.id} className={DataUtil.tagClass(relation.format)} />
							</div>
						);
					};

					list = (item.value || []).map((id: string, i: number) => { 
						return (relation.selectDict || []).find((it: any) => { return it.id == id; });
					});
					list = list.filter((it: any) => { return it && it.id; });

					if (list.length) {
						cn.push('withValues');
					};

					value = (
						<div id={id} className={cn.join(' ')} onClick={(e: any) => { this.onTag(e, item); }}>
							{list.length ? (
								<React.Fragment>
									{list.map((item: any, i: number) => {
										return <Item key={item.id} {...item} />;
									})}
								</React.Fragment>
							) : (
								<React.Fragment>
									<div className="name">Add options</div>
									<Icon className="arrow light" />
								</React.Fragment>
							)}
						</div>
					);
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
					cn = [ 'select', 'isList' ];

					list = (item.value || []).map((it: string) => { 
						const details = blockStore.getDetails(rootId, it);
						const { iconImage, iconEmoji, name } = details;
						return details;
					});
					list = list.filter((it: any) => { return !it._objectEmpty_; });

					if (list.length) {
						cn.push('withValues');
					};

					value = (
						<div id={id} className={cn.join(' ')} onClick={(e: any) => { this.onObject(e, item); }}>
							{list.length ? (
								<React.Fragment>
									{list.map((item: any, i: number) => {
										return <Item key={i} {...item} />;
									})}
								</React.Fragment>
							) : (
								<React.Fragment>
									<div className="name">Add objects</div>
									<Icon className="arrow light" />
								</React.Fragment>
							)}
						</div>
					);
					break;

				case I.RelationType.Checkbox:
					value = (
						<Select 
							id={[ 'filter', 'checkbox', item.id ].join('-')} 
							className="operator" 
							arrowClassName="light"
							options={checkboxOptions} 
							value={item.value ? '1' : '0'} 
							onChange={(v: string) => { this.onChange(item.id, 'value', Boolean(Number(v)), true); }} 
						/>
					);
					break;

				case I.RelationType.Date:
					value = (
						<Input 
							id={id}
							key={id}
							ref={refGet} 
							value={item.value !== '' ? Util.date('d.m.Y H:i:s', item.value) : ''} 
							placeHolder="dd.mm.yyyy hh:mm:ss"
							maskOptions={{ mask: '99.99.9999 99:99:99' }}
							onFocus={(e: any) => { this.onFocusDate(e, item); }}
							onBlur={() => { this.id = ''; }}
							onSelect={(e: any) => { this.onSelect(e, item); }}
						/>
					);
					onSubmit = (e: any) => { this.onSubmitDate(e, item); };
					break;

				default:
					value = (
						<Input 
							id={id}
							key={id}
							ref={refGet} 
							value={item.value} 
							placeHolder={translate('commonValue')} 
							onBlur={() => { this.id = ''; }}
							onKeyUp={(e: any, v: string) => { this.onChange(item.id, 'value', v, true); }} 
							onSelect={(e: any) => { this.onSelect(e, item); }}
						/>
					);
					break;
			};

			if ([ I.FilterCondition.Empty, I.FilterCondition.NotEmpty ].indexOf(item.condition) >= 0) {
				value = null;
			};

			return (
				<form id={'item-' + item.id} className="item" onSubmit={onSubmit}>
					<Handle />
					{/*item.id > 0 ? (
						
						<Select 
							id={[ 'filter', 'operator', item.id ].join('-')} 
							className="operator" 
							arrowClassName="light"
							options={operatorOptions} 
							value={item.operator} 
							onChange={(v: string) => { this.onChange(item.id, 'operator', v); }} 
						/>
						<div className="txt">And</div>
					) : (
						<div className="txt">Where</div>
					)*/}

					<IconObject size={40} object={{ relationFormat: relation.format, layout: I.ObjectLayout.Relation }} />

					<div className="txt">
						<Select 
							id={[ 'filter', 'relation', item.id ].join('-')} 
							className="relation" 
							arrowClassName="light"
							options={relationOptions}
							value={item.relationKey} 
							onChange={(v: string) => { this.onChange(item.id, 'relationKey', v); }} 
						/>
						<Select 
							id={[ 'filter', 'condition', item.id ].join('-')} 
							className="condition grey" 
							arrowClassName="light"
							options={conditionOptions} 
							value={item.condition} 
							onChange={(v: string) => { this.onChange(item.id, 'condition', v); }} 
						/>
					</div>

					{item.condition != I.FilterCondition.None ? (
						<div className={cv.join(' ')}>
							{value}
						</div>
					) : ''}

					<Icon className="delete" onClick={(e: any) => { this.onDelete(e, item.id); }} />
				</form>
			);
		});
		
		const ItemAdd = SortableElement((item: any) => (
			<div className="item add" onClick={this.onAdd}>
				<Icon className="plus" />
				<div className="name">Add a filter</div>
			</div>
		));
		
		const List = SortableContainer((item: any) => {
			return (
				<div className="items">
					{filters.map((item: any, i: number) => (
						<Item key={i} {...item} id={i} index={i} />
					))}
					{!filters.length ? (
						<div className="item empty">
							<div className="inner">No filters applied to this view</div>
						</div>
					) : ''}
					<ItemAdd index={view.filters.length + 1} disabled={true} />
				</div>
			);
		});
		
		return (
			<List 
				axis="y" 
				lockAxis="y"
				lockToContainerEdges={true}
				transitionDuration={150}
				distance={10}
				onSortEnd={this.onSortEnd}
				useDragHandle={true}
				helperClass="isDragging"
				helperContainer={() => { return $(ReactDOM.findDOMNode(this)).get(0); }}
			/>
		);
	};
	
	componentDidMount () {
		this.resize();
	};

	componentDidUpdate () {
		this.resize();

		if (this.id) {
			const ref = this.refObj[this.id];
			if (ref && ref.setRange) {
				ref.setRange(this.range);
			};
		};
	};

	valueByType (type: I.RelationType): any {
		let ret: any = null;

		switch (type) {
			case I.RelationType.ShortText: 
			case I.RelationType.LongText: 
			case I.RelationType.Url: 
			case I.RelationType.Email: 
			case I.RelationType.Phone: 
				ret = '';
				break;

			case I.RelationType.Object: 
			case I.RelationType.Status: 
			case I.RelationType.Tag: 
				ret = [];
				break;
			
			case I.RelationType.Number:
			case I.RelationType.Date:
				ret = 0;
				break;
			
			case I.RelationType.Checkbox:
				ret = false;
				break;
		};
		return ret;
	};

	getRelationOptions () {
		const { config } = commonStore;
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView } = data;
		const view = getView();
		
		const relations = view.relations.filter((it: I.ViewRelation) => { 
			const relation = dbStore.getRelation(rootId, blockId, it.relationKey);
			if (!relation || (!config.debug.ho && relation.isHidden) || (relation.format == I.RelationType.File)) {
				return false;
			};
			return true;
		});

		const options: any[] = relations.map((it: I.ViewRelation) => {
			const relation = dbStore.getRelation(rootId, blockId, it.relationKey);
			return { 
				id: relation.relationKey, 
				name: relation.name, 
				//icon: 'relation ' + DataUtil.relationClass(relation.format),
				isHidden: relation.isHidden,
				format: relation.format,
			};
		});

		return options;
	};
	
	onAdd (e: any) {
		const { param } = this.props;
		const { data } = param;
		const { getView } = data;
		const view = getView();
		const relationOptions = this.getRelationOptions();

		if (!relationOptions.length) {
			return;
		};

		const first = relationOptions[0];
		const conditions = DataUtil.filterConditionsByType(first.format);
		const condition = conditions.length ? conditions[0].id : I.FilterCondition.None;

		view.filters.push({ 
			relationKey: first.id, 
			operator: I.FilterOperator.And, 
			condition: condition as I.FilterCondition,
			value: this.valueByType(first.format),
		});
		this.save();
	};

	onDelete (e: any, id: number) {
		const { param } = this.props;
		const { data } = param;
		const { getView } = data;
		const view = getView();

		view.filters = view.filters.filter((it: any, i: number) => { return i != id; });
		this.save();

		menuStore.close('select');
	};
	
	onSortEnd (result: any) {
		const { param } = this.props;
		const { data } = param;
		const { getView } = data;
		const view = getView();
		const { oldIndex, newIndex } = result;

		this.id = '';
		view.filters = arrayMove(view.filters, oldIndex, newIndex);
		this.save();
	};

	onSubmit (e: any, item: any) {
		e.preventDefault();

		const { param } = this.props;
		const { data } = param;
		const { getView } = data;
		const view = getView();

		view.filters[item.id].value = this.refObj[item.id].getValue();
	};

	onChange (id: number, k: string, v: any, timeout?: boolean) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView } = data;
		const view = getView();

		window.clearTimeout(this.timeoutChange);
		this.timeoutChange = window.setTimeout(() => {
			let item = view.filters.find((it: any, i: number) => { return i == id; });
			let idx = view.filters.findIndex((it: any, i: number) => { return i == id; });
			if (!item) {
				return;
			};

			item = Util.objectCopy(item);
			item[k] = v;
	
			// Remove value when we change relation, filter non unique entries
			if (k == 'relationKey') {
				const relation = dbStore.getRelation(rootId, blockId, v);
				const conditions = DataUtil.filterConditionsByType(relation.format);

				item.condition = conditions.length ? conditions[0].id : I.FilterCondition.None;
				item.value = this.valueByType(relation.format);

				view.filters = view.filters.filter((it: I.Filter, i: number) => { 
					return (i == id) || 
					(it.relationKey != v) || 
					((it.relationKey == v) && (it.condition != item.condition)); 
				});
			};

			if (k == 'condition') {
				view.filters = view.filters.filter((it: I.Filter, i: number) => { 
					return (i == id) || 
					(it.relationKey != item.relationKey) || 
					((it.relationKey == item.relationKey) && (it.condition != v)); 
				});
			};

			view.filters[idx] = item;

			this.save();
			this.forceUpdate();
		}, timeout ? TIMEOUT : 0);
	};

	onSubmitDate (e: any, item: any) {
		e.preventDefault();

		const value = Util.parseDate(this.refObj[item.id].getValue());
		
		this.onChange(item.id, 'value', value);
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
		this.id = item.id.toString();
		this.range = {
			from: e.currentTarget.selectionStart,
			to: e.currentTarget.selectionEnd,
		};
	};

	onCalendar (id: number, value: number) {
		menuStore.open('dataviewCalendar', {
			element: `#menuDataviewFilter #item-${id}-value`,
			offsetY: 4,
			horizontal: I.MenuDirection.Center,
			onOpen: () => {
				window.setTimeout(() => { this.refObj[id].focus(); }, 200);
			},
			data: { 
				value: value, 
				onChange: (value: number) => {
					this.onChange(id, 'value', value);
				},
			},
		});
	};

	onTag (e: any, item: any) {
		const { param, getId } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const relation = dbStore.getRelation(rootId, blockId, item.relationKey);
		const id = [ 'item', item.id, 'value' ].join('-');

		menuStore.closeAll([ 'dataviewOptionValues', 'dataviewOptionList', 'dataviewOptionEdit' ], () => {
			menuStore.open('dataviewOptionValues', { 
				element: '#' + getId() + ' #' + id,
				offsetY: 4,
				className: 'fromFilter',
				data: { 
					rootId: rootId,
					blockId: blockId,
					value: item.value || [], 
					types: relation.objectTypes,
					relation: observable.box(relation),
					onChange: (value: any) => {
						this.onChange(item.id, 'value', value);
					},
				},
			});
		});
	};

	onObject (e: any, item: any) {
		const { param, getId } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const relation = dbStore.getRelation(rootId, blockId, item.relationKey);
		const id = [ 'item', item.id, 'value' ].join('-');

		menuStore.closeAll([ 'dataviewObjectValues', 'dataviewObjectList' ], () => {
			menuStore.open('dataviewObjectValues', { 
				element: '#' + getId() + ' #' + id,
				offsetY: 4,
				className: 'fromFilter',
				data: { 
					rootId: rootId,
					blockId: blockId,
					value: item.value || [], 
					types: relation.objectTypes,
					relation: observable.box(relation),
					onChange: (value: any) => {
						this.onChange(item.id, 'value', value);
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

	resize () {
	};

};

export default MenuFilter;