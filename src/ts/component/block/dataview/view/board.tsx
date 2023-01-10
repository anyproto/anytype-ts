import * as React from 'react';
import { set } from 'mobx';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import arrayMove from 'array-move';
import $ from 'jquery';
import raf from 'raf';
import { Loader } from 'Component';
import { I, C, Util, DataUtil, analytics, keyboard, Relation } from 'Lib';
import { dbStore, detailStore, popupStore, menuStore, commonStore, blockStore } from 'Store';
import Empty from '../empty';
import Column from './board/column';
import Constant from 'json/constant.json';

interface State {
	loading: boolean;
};

const ViewBoard = observer(class ViewBoard extends React.Component<I.ViewComponent, State> {

	node: any = null;
	cache: any = {};
	frame: number = 0;
	groupRelationKey: string = '';
	newIndex: number = -1;
	newGroupId: string = '';
	state = {
		loading: false,
	};
	columnRefs: any = {};
	isDraggingColumn: boolean = false;
	isDraggingCard: boolean = false;
	ox: number = 0;

	constructor (props: I.ViewComponent) {
		super(props);
		
		this.onView = this.onView.bind(this);
		this.onRecordAdd = this.onRecordAdd.bind(this);
		this.onDragStartColumn = this.onDragStartColumn.bind(this);
		this.onDragStartCard = this.onDragStartCard.bind(this);
		this.applyObjectOrder = this.applyObjectOrder.bind(this);
	};

	render () {
		const { loading } = this.state;
		const { rootId, block, getView } = this.props;
		const view = getView();
		const groups = this.getGroups(false);
		const relation = dbStore.getRelationByKey(view.groupRelationKey);

		if (!relation || !relation.isInstalled) {
			return (
				<Empty 
					{...this.props}
					title="Relation has been deleted" 
					description="Choose another relation to group your Kanban"
					button="Open view menu"
					onClick={this.onView}
				/>
			);
		};

		return (
			<div 
				ref={node => this.node = node} 
				className="wrap"
			>
				<div id="scroll" className="scroll">
					<div className="viewItem viewBoard">
						{loading ? <Loader /> : (
							<div id="columns" className="columns">
								{groups.map((group: any, i: number) => (
									<Column 
										key={`board-column-${group.id}`} 
										ref={(ref: any) => { this.columnRefs[group.id] = ref; }}
										{...this.props} 
										{...group}
										onRecordAdd={this.onRecordAdd} 
										onDragStartColumn={this.onDragStartColumn}
										onDragStartCard={this.onDragStartCard}
										applyObjectOrder={this.applyObjectOrder}
										getSubId={() => { return dbStore.getGroupSubId(rootId, block.id, group.id); }}
									/>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.resize();
		this.rebind();
	};

	componentDidUpdate () {
		this.resize();
		$(window).trigger('resize.editor');
	};

	componentWillUnmount () {
		const { rootId, block } = this.props;
		const groups = this.getGroups(true);
		const ids = [ dbStore.getGroupSubId(rootId, block.id, 'groups') ];

		groups.forEach((it: any) => {
			ids.push(dbStore.getGroupSubId(rootId, block.id, it.id));
		});

		C.ObjectSearchUnsubscribe(ids);
		dbStore.groupsClear(rootId, block.id);

		this.unbind();
	};

	rebind () {
		this.unbind();

		const node = $(this.node);
		node.find('#scroll').on('scroll', (e: any) => { this.onScrollView(); });
	};

	unbind () {
		const node = $(this.node);
		node.find('#scroll').off('scroll');
	};

	loadGroupList () {
		const { rootId, block, getView } = this.props;
		const view = getView();
		const subId = dbStore.getGroupSubId(rootId, block.id, 'groups');

		dbStore.groupsClear(rootId, block.id);
		this.groupRelationKey = view.groupRelationKey;

		if (!view.groupRelationKey) {
			this.forceUpdate();
			return;
		};

		const relation = dbStore.getRelationByKey(view.groupRelationKey);
		if (!relation) {
			return;
		};

		const groupOrder: any = {};
 		const el = block.content.groupOrder.find(it => it.viewId == view.id);

		if (el) {
			el.groups.forEach(it => groupOrder[it.groupId] = it);
		};

		this.setState({ loading: true });

		C.ObjectGroupsSubscribe(subId, view.groupRelationKey, view.filters, block.content.sources, (message: any) => {
			if (message.error.code) {
				return;
			};

			let groups = (message.groups || []).map((it: any) => {
				let bgColor = 'grey';
				let value: any = it.value;
				let option: any = null;

				switch (relation.format) {
					case I.RelationType.Tag:
						value = Relation.getArrayValue(value);
						if (value.length) {
							option = detailStore.get(Constant.subId.option, value[0]);
							bgColor = option?.color;
						};
						break;

					case I.RelationType.Status:
						option = detailStore.get(Constant.subId.option, value);
						bgColor = option?.color;
						break;
				};

				it.isHidden = groupOrder[it.id]?.isHidden;
				it.bgColor = groupOrder[it.id]?.bgColor || bgColor;
				return it;
			});

			dbStore.groupsSet(rootId, block.id, this.applyGroupOrder(groups));
			this.setState({ loading: false });
		});
	};

	onRecordAdd (groupId: string, dir: number) {
		const { rootId, block, getView } = this.props;
		const view = getView();
		const group = dbStore.getGroup(rootId, block.id, groupId);
		const object = detailStore.get(rootId, rootId, [ 'setOf' ], true);
		const setOf = object.setOf || [];
		const subId = dbStore.getGroupSubId(rootId, block.id, groupId);
		const node = $(this.node);
		const element = node.find(`#card-${groupId}-add`);
		const types = Relation.getSetOfObjects(rootId, rootId, Constant.typeId.type);
		const relations = Relation.getSetOfObjects(rootId, rootId, Constant.typeId.relation);
		const details: any = {
			type: types.length ? types[0].id : commonStore.type,
		};

		details[view.groupRelationKey] = group.value;

		if (types.length) {
			details.type = types[0].id;
		};

		if (relations.length) {
			relations.forEach((it: any) => {
				details[it.id] = Relation.formatValue(it, null, true);
			});
		};

		const create = (template: any) => {
			C.ObjectCreate(details, [], template?.id, (message: any) => {
				if (message.error.code) {
					return;
				};

				const object = detailStore.get(subId, message.objectId, []);
				const records = dbStore.getRecords(subId, '');
				const oldIndex = records.indexOf(message.objectId);
				const newIndex = dir > 0 ? records.length : 0;
				const update = arrayMove(records, oldIndex, newIndex);

				C.BlockDataviewObjectOrderUpdate(rootId, block.id, [ { viewId: view.id, groupId, objectIds: update } ], () => {
					dbStore.recordsSet(subId, '', update);
				});

				analytics.event('CreateObject', {
					route: 'Set',
					objectType: object.type,
					layout: object.layout,
					template: template ? (template.templateIsBundled ? template.id : 'custom') : '',
				});
			});
		};

		if (details.type == Constant.typeId.bookmark) {
			menuStore.open('dataviewCreateBookmark', {
				type: I.MenuType.Horizontal,
				element,
				vertical: dir > 0 ? I.MenuDirection.Top : I.MenuDirection.Bottom,
				horizontal: dir > 0 ? I.MenuDirection.Left : I.MenuDirection.Right,
			});
			return;
		};

		DataUtil.checkTemplateCnt(setOf, (message: any) => {
			if (message.records.length > 1) {
				popupStore.open('template', { data: { typeId: details.type, onSelect: create } });
			} else {
				create(message.records.length ? message.records[0] : '');
			};
		});
	};

	getGroups (withHidden: boolean) {
		let { rootId, block } = this.props;
		let groups = this.applyGroupOrder(Util.objectCopy(dbStore.getGroups(rootId, block.id)));

		if (!withHidden) {
			groups = groups.filter(it => !it.isHidden);
		};

		return groups;
	};

	initCacheColumn () {
		const groups = this.getGroups(true);
		const node = $(this.node);

		this.cache = {};
		groups.forEach((group: any, i: number) => {
			const el = node.find(`#column-${group.id}`);
			const item = {
				id: group.id,
				index: i,
				x: 0,
				y: 0,
				width: 0,
				height: 0,
			};

			if (el.length) {
				const { left, top } = el.offset();

				item.x = left;
				item.y = top;
				item.width = el.outerWidth();
				item.height = el.outerHeight();
			};
			
			this.cache[group.id] = item;
		});
	};

	initCacheCard () {
		const groups = this.getGroups(false);
		const node = $(this.node);

		this.cache = {};

		groups.forEach((group: any, i: number) => {
			const column = this.columnRefs[group.id];
			if (!column) {
				return;
			};

			const items = column.getItems() || [];

			items.push({ id: `${group.id}-add`, isAdd: true });
			items.forEach((item: any, i: number) => {
				const el = node.find(`#card-${item.id}`);
				if (!el.length) {
					return;
				};

				const { left, top } = el.offset();
				this.cache[item.id] = {
					id: item.id,
					groupId: group.id,
					x: left,
					y: top,
					width: el.outerWidth(),
					height: el.outerHeight(),
					index: i,
					isAdd: item.isAdd,
				};
			});
		});
	};

	onDragStartCommon (e: any, target: any) {
		e.stopPropagation();

		const { dataset } = this.props;
		const { selection, preventCommonDrop } = dataset || {};
		const node = $(this.node);
		const viewItem = node.find('.viewItem');
		const clone = target.clone();
		
		this.ox =  node.find('#columns').offset().left;

		target.addClass('isDragging');
		clone.attr({ id: '' }).addClass('isClone').css({ zIndex: 10000, position: 'fixed', left: -10000, top: -10000 });
		viewItem.append(clone);

		$(document).off('dragover').on('dragover', (e: any) => { e.preventDefault(); });
		$(window).off('dragend.board drag.board');
		$('body').addClass('grab');

		e.dataTransfer.setDragImage(clone.get(0), 0, 0);

		keyboard.setDragging(true);
		selection.preventSelect(true);
		selection.clear();
		preventCommonDrop(true);
	};

	onDragEndCommon (e: any) {
		e.preventDefault();

		const { dataset } = this.props;
		const { selection, preventCommonDrop } = dataset || {};
		const node = $(this.node);

		$('body').removeClass('grab');
		$(window).off('dragend.board drag.board').trigger('mouseup.selection');

		node.find('.isClone').remove();
		node.find('.isDragging').removeClass('isDragging');
		node.find('.isOver').removeClass('isOver left right top bottom');

		selection.preventSelect(false);
		preventCommonDrop(false);
		keyboard.setDragging(false);

		if (this.frame) {
			raf.cancel(this.frame);
		};
	};

	onDragStartColumn (e: any, groupId: string) {
		const win = $(window);
		const node = $(this.node);

		this.onDragStartCommon(e, node.find(`#column-${groupId}`));
		this.initCacheColumn();
		this.isDraggingColumn = true;

		win.on('drag.board', (e: any) => { this.onDragMoveColumn(e, groupId); });
		win.on('dragend.board', (e: any) => { this.onDragEndColumn(e, groupId); });
	};

	onDragMoveColumn (e: any, groupId: any) {
		const node = $(this.node);
		const current = this.cache[groupId];
		const groups = this.getGroups(false);

		if (!current) {
			return;
		};

		let isLeft = false;
		let hoverId = '';

		for (let group of groups) {
			const rect = this.cache[group.id];
			if (!rect || (group.id == groupId)) {
				continue;
			};

			if (rect && this.cache[groupId] && Util.rectsCollide({ x: e.pageX, y: e.pageY, width: current.width, height: current.height }, rect)) {
				isLeft = e.pageX <= rect.x + rect.width / 2;
				hoverId = group.id;

				this.newIndex = isLeft ? rect.index : rect.index + 1;
				break;
			};
		};

		if (this.frame) {
			raf.cancel(this.frame);
		};

		this.frame = raf(() => {
			node.find('.isOver').removeClass('isOver left right');

			if (hoverId) {
				node.find(`#column-${hoverId}`).addClass('isOver ' + (isLeft ? 'left' : 'right'));
			};
		});
	};

	onDragEndColumn (e: any, groupId: string) {
		const { rootId, block, getView } = this.props;
		const view = getView();
		const update: any[] = [];
		const current = this.cache[groupId];

		let groups = this.getGroups(true);
		groups = arrayMove(groups, current.index, this.newIndex);
		dbStore.groupsSet(rootId, block.id, groups);

		groups.forEach((it: any, i: number) => {
			update.push({ ...it, groupId: it.id, index: i });
		});

		DataUtil.dataviewGroupUpdate(rootId, block.id, view.id, update);
		C.BlockDataviewGroupOrderUpdate(rootId, block.id, { viewId: view.id, groups: update });

		this.cache = {};
		this.isDraggingColumn = false;
		this.onDragEndCommon(e);
		this.resize();
	};

	onDragStartCard (e: any, groupId: any, record: any) {
		const win = $(window);

		this.onDragStartCommon(e, $(e.currentTarget));
		this.initCacheCard();
		this.isDraggingCard = true;

		win.on('drag.board', (e: any) => { this.onDragMoveCard(e, record); });
		win.on('dragend.board', (e: any) => { this.onDragEndCard(e, record); });
	};

	onDragMoveCard (e: any, record: any) {
		const node = $(this.node);
		const current = this.cache[record.id];

		if (!current) {
			return;
		};

		let isTop = false;
		let hoverId = '';

		for (let i in this.cache) {
			const rect = this.cache[i];
			if (!rect || (rect.id == record.id)) {
				continue;
			};

			if (Util.rectsCollide({ x: e.pageX, y: e.pageY, width: current.width, height: current.height + 8 }, rect)) {
				isTop = rect.isAdd || (e.pageY <= rect.y + rect.height / 2);
				hoverId = rect.id;

				this.newGroupId = rect.groupId;
				this.newIndex = isTop ? rect.index : rect.index + 1;
				break;
			};
		};

		if (this.frame) {
			raf.cancel(this.frame);
		};

		this.frame = raf(() => {
			node.find('.isOver').removeClass('isOver top bottom');

			if (hoverId) {
				node.find(`#card-${hoverId}`).addClass('isOver ' + (isTop ? 'top' : 'bottom'));
			};
		});
	};

	onDragEndCard (e: any, record: any) {
		const current = this.cache[record.id];

		this.onDragEndCommon(e);
		this.cache = {};
		this.isDraggingCard = false;

		if (!current.groupId || !this.newGroupId || ((current.index == this.newIndex) && (current.groupId == this.newGroupId))) {
			return;
		};

		const { rootId, block, getView } = this.props;
		const view = getView();
		const oldSubId = dbStore.getGroupSubId(rootId, block.id, current.groupId);
		const newSubId = dbStore.getGroupSubId(rootId, block.id, this.newGroupId);
		const newGroup = dbStore.getGroup(rootId, block.id, this.newGroupId);
		const change = current.groupId != this.newGroupId;

		let records: any[] = [];

		const setOrder = (orders: any[]) => {
			C.BlockDataviewObjectOrderUpdate(rootId, block.id, orders, () => {
				orders.forEach((it: any) => {
					let old = block.content.objectOrder.find(item => (view.id == item.viewId) && (item.groupId == it.groupId));
					if (old) {
						set(old, it);
					} else {
						block.content.objectOrder.push(it);
					};

					window.setTimeout(() => { this.applyObjectOrder(it.groupId, records); }, 30);
				});
			});
		};

		if (change) {
			detailStore.update(newSubId, { id: record.id, details: record }, true);
			detailStore.delete(oldSubId, record.id, Object.keys(record));

			dbStore.recordDelete(oldSubId, '', record.id);
			dbStore.recordAdd(newSubId, '', record.id, this.newIndex);

			C.ObjectSetDetails(record.id, [ { key: view.groupRelationKey, value: newGroup.value } ], () => {
				setOrder([
					{ viewId: view.id, groupId: current.groupId, objectIds: dbStore.getRecords(oldSubId, '') },
					{ viewId: view.id, groupId: this.newGroupId, objectIds: dbStore.getRecords(newSubId, '') }
				]);
			});
		} else {
			if (current.index + 1 == this.newIndex) {
				return;
			};

			records = arrayMove(dbStore.getRecords(oldSubId, ''), current.index, this.newIndex);
			dbStore.recordsSet(oldSubId, '', records);

			setOrder([ { viewId: view.id, groupId: current.groupId, objectIds: records } ]);
		};
	};

	applyGroupOrder (groups: any[]) {
		const { block, getView } = this.props;
		const view = getView();
		
		if (!view) {
			return [];
		};

 		const el = block.content.groupOrder.find(it => it.viewId == view.id);
		const groupOrder: any = {};

		if (el) {
			el.groups.forEach(it => groupOrder[it.groupId] = it);
		};

		groups.sort((c1: any, c2: any) => {
			const idx1 = groupOrder[c1.id]?.index;
			const idx2 = groupOrder[c2.id]?.index;
			if (idx1 > idx2) return 1;
			if (idx1 < idx2) return -1;
			return 0;
		});

		return groups;
	};

	applyObjectOrder (groupId: string, records: any[]) {
		const { block, getView } = this.props;
		const view = getView();
		const el = block.content.objectOrder.find(it => (it.viewId == view.id) && (it.groupId == groupId));
		const objectIds = el ? el.objectIds || [] : [];

		records.sort((c1: any, c2: any) => {
			const idx1 = objectIds.indexOf(c1);
			const idx2 = objectIds.indexOf(c2);

			if (idx1 > idx2) return 1;
			if (idx1 < idx2) return -1;
			return 0;
		});

		return records;
	};

	onScrollView () {
		const groups = this.getGroups(false);
		const node = $(this.node);

		if (this.isDraggingColumn) {
			groups.forEach((group: any, i: number) => {
				const rect = this.cache[group.id];
				if (!rect) {
					return;
				};

				const el = node.find(`#column-${group.id}`);
				if (!el.length) {
					return;
				};

				const { left, top } = el.offset();
				rect.x = left;
				rect.y = top;
			});
		} else
		if (this.isDraggingCard) {
			groups.forEach((group: any, i: number) => {
				const column = this.columnRefs[group.id];
				if (!column) {
					return;
				};

				const items = column.getItems();
				items.forEach((item: any, i: number) => {
					const el = node.find(`#card-${item.id}`);
					if (!el.length) {
						return;
					};

					const { left, top } = el.offset();
					this.cache[item.id].x = left;
					this.cache[item.id].y = top;
				});
			});
		};
	};

	onView (e: any) {
		e.stopPropagation();

		const { rootId, block, getView, getData } = this.props;
		const view = getView();
		const allowed = blockStore.checkFlags(rootId, block.id, [ I.RestrictionDataview.View ]);

		menuStore.open('dataviewViewEdit', { 
			element: `#dataviewEmpty-${block.id} .button`,
			horizontal: I.MenuDirection.Center,
			offsetY: 10,
			data: {
				rootId,
				blockId: block.id,
				readonly: !allowed,
				view: observable.box(view),
				getView,
				getData,
				onSave: () => { this.forceUpdate(); },
			}
		});
	};

	resize () {
		const { isPopup, isInline } = this.props;
		const node = $(this.node);
		const scroll = node.find('.scroll');
		const viewItem = node.find('.viewItem');
		const container = Util.getPageContainer(isPopup);
		const ww = container.width();
		const mw = ww - 192;
		const size = Constant.size.dataview.board;
		const groups = this.getGroups(false);
		const width = 30 + groups.length * (size.card + size.margin);
		const margin = width >= mw ? (ww - mw) / 2 : 0;

		if (!isInline) {
			scroll.css({ width: ww, marginLeft: -margin / 2, paddingLeft: margin / 2 + 8 });
			viewItem.css({ width: width < mw ? mw : width });
		} else {
			scroll.css({ paddingLeft: 8 });
		};
	};
	
});

export default ViewBoard;