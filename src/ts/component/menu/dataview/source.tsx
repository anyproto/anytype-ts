import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, IconObject, Tag } from 'ts/component';
import { detailStore, dbStore, menuStore, blockStore } from 'ts/store';
import { I, C, DataUtil } from 'ts/lib';
import arrayMove from 'array-move';
import { translate, Util, keyboard } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends I.Menu {}

const Constant = require('json/constant.json');
const $ = require('jquery');

const MenuSource = observer(class MenuSource extends React.Component<Props, {}> {
	
	n: number = 0;

	constructor (props: any) {
		super(props);
		
		this.save = this.save.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onRemove = this.onRemove.bind(this);
	};
	
	render () {
		const items = this.getItems();
		
		const Item = (item: any) => {
			const canDelete = item.id != 'type';
			return (
				<form id={'item-' + item.itemId} className={[ 'item' ].join(' ')} onMouseEnter={(e: any) => { this.onOver(e, item); }}>
					<IconObject size={40} object={item} />
					<div className="txt" onClick={(e: any) => { this.onClick(e, item); }}>
						<div className="name">{item.name}</div>
						<div className="value">{item.value}</div>
					</div>
					<div className="buttons">
						{canDelete ? <Icon className="delete" onClick={(e: any) => { this.onRemove(e, item); }} /> : ''}
					</div>
				</form>
			);
		};
		
		const ItemAdd = (item: any) => (
			<div id="item-add" className="item add" onClick={this.onAdd}>
				<Icon className="plus" />
				<div className="name">Add a relation</div>
			</div>
		);
		
		return (
			<div className="items">
				<div className="scrollWrap">
					{items.map((item: any, i: number) => (
						<Item key={i} {...item} />
					))}
					{!items.length ? (
						<div className="item empty">
							<div className="inner">Select one or more sources</div>
						</div>
					) : ''}
				</div>
				<div className="bottom">
					<div className="line" />
					<ItemAdd disabled={true} /> 
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this.rebind();
	};

	componentDidUpdate () {
		this.props.setActive();
	};

	componentWillUnmount () {
		this.unbind();
		menuStore.closeAll(Constant.menuIds.cell);
	};

	rebind () {
		const { getId } = this.props;
		const obj = $(`#${getId()} .content`);

		obj.unbind('click').on('click', () => { menuStore.closeAll(Constant.menuIds.cell); });

		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};

	onAdd (e: any) {
		const { getId, getSize, param } = this.props;
		const { data } = param;
		const value = DataUtil.getRelationArrayValue(data.value);

		menuStore.open('searchObject', { 
			element: `#${getId()} #item-add`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			className: 'single',
			data: {
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.relation }
				],
				onSelect: (item: any) => {
					value.push(item.id);
					this.save(value);
				}
			}
		});
	};

	onRemove (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;

		let value = DataUtil.getRelationArrayValue(data.value);
		value = value.filter((it: string) => { return it != item.id; });

		this.save(value);
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	onClick (e: any, item: any) {
		const { param, getId, getSize } = this.props;
		const { data } = param;
		const { rootId, blockId, readonly } = data;

		if (item.itemId == 'type') {
			if (readonly) {
				return;
			};

			const types = dbStore.getObjectTypesForSBType(I.SmartBlockType.Page).map((it: any) => { return it.id; });
			const filters = [
				{ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.In, value: types }
			];
	
			menuStore.open('searchObject', {
				element: `#${getId()} #item-${item.itemId}`,
				className: 'big single',
				horizontal: I.MenuDirection.Center,
				offsetX: getSize().width,
				offsetY: -56,
				data: {
					isBig: true,
					rootId: rootId,
					blockId: blockId,
					blockIds: [ blockId ],
					placeholder: 'Change object type',
					placeholderFocus: 'Change object type',
					filters: filters,
					onSelect: (item: any) => {
						this.save([ item.id ]);
					}
				}
			}); 
		};
	};

	save (value: string[]) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;

		C.BlockDataviewSetSource(rootId, blockId, value, (message: any) => {
			if (!message.error.code) {
				data.value = value;
			};
		});
	};

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const length = data.value.length;
		const value = DataUtil.getRelationArrayValue(data.value).filter((it: string) => {
			const object = detailStore.get(rootId, it);
			return !object._empty_;
		});
		const items = [];

		if (!value.length) {
			items.push({
				id: 'type',
				itemId: 'type',
				name: 'Object type',
				relationFormat: I.RelationType.Object,
				layout: I.ObjectLayout.Relation,
				value: 'All',
			});
		} else {
			value.forEach((it: string) => {
				const object = detailStore.get(rootId, it);
				if (object.type == Constant.typeId.type) {
					items.push({
						...object,
						itemId: 'type',
						name: 'Object type',
						value: object.name,
					});
				} else {
					items.push({
						...object,
						itemId: object.id,
						value: 'All',
					});
				};
			});
		};
		return items;
	};

});

export default MenuSource;