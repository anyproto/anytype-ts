import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Loader } from 'Component';
import { dbStore, detailStore, popupStore } from 'Store';
import { I, C, Util, DataUtil, analytics, keyboard } from 'Lib';
import { observer } from 'mobx-react';
import { throttle } from 'lodash';
import arrayMove from 'array-move';
import { set } from 'mobx';

import Column from './board/column';

interface Props extends I.ViewComponent {
	dataset?: any;
};

interface State {
	loading: boolean;
};

const $ = require('jquery');
const raf = require('raf');
const Constant = require('json/constant.json');

const ViewBoard = observer(class ViewBoard extends React.Component<Props, State> {

	cache: any = {};
	frame: number = 0;
	groupRelationKey: string = '';
	oldIndex: number = -1;
	newIndex: number = -1;
	oldGroupId: string = '';
	newGroupId: string = '';
	state = {
		loading: false,
	};
	columnRefs: any = {};
	isDraggingColumn: boolean = false;

	constructor (props: any) {
		super(props);
		
		this.onRecordAdd = this.onRecordAdd.bind(this);
		this.onDragStartColumn = this.onDragStartColumn.bind(this);
		this.onDragStartCard = this.onDragStartCard.bind(this);
		this.getSubId = this.getSubId.bind(this);
		this.onScrollColumn = this.onScrollColumn.bind(this);
	};

	render () {
		const { rootId, block, getView } = this.props;
		const { loading } = this.state;
		const groups = this.getGroups(false);

		return (
			<div className="wrap">
				<div className="scroll">
					<div className="viewItem viewBoard">
						{loading ? <Loader /> : (
							<div className="columns">
								{groups.map((group: any, i: number) => (
									<Column 
										key={`board-column-${group.id}`} 
										ref={(ref: any) => { this.columnRefs[group.id] = ref; }}
										{...this.props} 
										{...group} 
										onRecordAdd={this.onRecordAdd} 
										onDragStartColumn={this.onDragStartColumn}
										onDragStartCard={this.onDragStartCard}
										onScrollColumn={() => { return this.onScrollColumn(group.id); }}
										applyGroupOrder={() => { return this.applyGroupOrder(group.id); }}
										getSubId={() => { return this.getSubId(group.id); }}
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
		const ids = [];

		groups.forEach((it: any) => {
			ids.push(dbStore.getSubId(rootId, [ block.id, it.id ].join(':')));
		});

		C.ObjectSearchUnsubscribe(ids);
		dbStore.groupsClear(rootId, block.id);

		this.unbind();
	};

	rebind () {
		const node = $(ReactDOM.findDOMNode(this));
		const scroll = node.find('.scroll');

		scroll.off('scroll').on('scroll', throttle((e: any) => { this.onScroll(); }, 20));
	};

	unbind () {
		const node = $(ReactDOM.findDOMNode(this));
		const scroll = node.find('.scroll');

		scroll.off('scroll');
	};

	loadGroupList () {
		const { rootId, block, getView } = this.props;
		const view = getView();

		dbStore.groupsClear(rootId, block.id);
		this.groupRelationKey = view.groupRelationKey;

		if (!view.groupRelationKey) {
			this.forceUpdate();
			return;
		};

		const groupOrder: any = {};
 		const el = block.content.groupOrder.find(it => it.viewId == view.id);

		if (el) {
			el.groups.forEach((it: any) => {
				groupOrder[it.groupId] = it;
			});
		};

		this.setState({ loading: true });

		C.ObjectRelationSearchDistinct(view.groupRelationKey, view.filters, (message: any) => {
			if (message.error.code) {
				return;
			};

			const groups = (message.groups || []).map((it: any) => {
				it.isHidden = groupOrder[it.id]?.isHidden;
				it.bgColor = groupOrder[it.id]?.bgColor;
				return it;
			});

			groups.sort((c1: any, c2: any) => {
				const idx1 = groupOrder[c1.id]?.index;
				const idx2 = groupOrder[c2.id]?.index;
				if (idx1 > idx2) return 1;
				if (idx1 < idx2) return -1;
				return 0;
			});

			dbStore.groupsSet(rootId, block.id, groups);
			this.setState({ loading: false });
		});
	};

	onRecordAdd (groupId: string, dir: number) {
		const { rootId, block, getView } = this.props;
		const view = getView();
		const group = dbStore.getGroup(rootId, block.id, groupId);
		const object = detailStore.get(rootId, rootId, [ 'setOf' ], true);
		const setOf = object.setOf || [];
		const details: any = {};
		const subId = this.getSubId(groupId);

		details[view.groupRelationKey] = group.value;

		const create = (template: any) => {
			C.BlockDataviewRecordCreate(rootId, block.id, details, template?.id, (message: any) => {
				if (message.error.code) {
					return;
				};

				const newRecord = message.record;
				const records = dbStore.getRecords(subId, '');
				const oldIndex = records.findIndex(it => it.id == newRecord.id);
				const newIndex = dir > 0 ? records.length - 1 : 0;

				dbStore.recordsSet(subId, '', arrayMove(records, oldIndex, newIndex));

				analytics.event('CreateObject', {
					route: 'Set',
					objectType: newRecord.type,
					layout: newRecord.layout,
					template: template ? (template.templateIsBundled ? template.id : 'custom') : '',
				});
			});
		};

		if (!setOf.length) {
			create(null);
			return;
		};

		const showPopup = () => {
			popupStore.open('template', {
				data: {
					typeId: setOf[0],
					onSelect: create,
				},
			});
		};

		DataUtil.checkTemplateCnt(setOf, (message: any) => {
			if (message.records.length > 1) {
				showPopup();
			} else {
				create(message.records.length ? message.records[0] : '');
			};
		});
	};

	getGroups (withHidden: boolean) {
		let { rootId, block } = this.props;
		let groups = dbStore.getGroups(rootId, block.id)

		if (!withHidden) {
			groups = groups.filter(it => !it.isHidden);
		};

		return groups;
	};

	initCacheColumn () {
		const groups = this.getGroups(false);
		const node = $(ReactDOM.findDOMNode(this));

		this.cache = {};
		groups.forEach((group: any, i: number) => {
			const el = node.find(`#column-${group.id}`);
			if (!el.length) {
				return;
			};

			const { left, top } = el.offset();
			this.cache[group.id] = {
				id: group.id,
				x: left,
				y: top,
				width: el.outerWidth(),
				height: el.outerHeight(),
				index: i,
			};
		});
	};

	initCacheCard () {
		const { rootId, block } = this.props;
		const groups = dbStore.getGroups(rootId, block.id);
		const node = $(ReactDOM.findDOMNode(this));

		this.cache = {};

		groups.forEach((group: any, i: number) => {
			const items = this.columnRefs[group.id].getItems() || [];

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
		
		const node = $(ReactDOM.findDOMNode(this));
		const viewItem = node.find('.viewItem');
		const clone = target.clone();

		target.addClass('isDragging');
		clone.attr({ id: '' }).addClass('isClone').css({ zIndex: 10000, position: 'fixed', left: -10000, top: -10000 });
		viewItem.append(clone);

		$(document).off('dragover').on('dragover', (e: any) => { e.preventDefault(); });
		$(window).off('dragend.board drag.board');
		e.dataTransfer.setDragImage(clone.get(0), 0, 0);
		$('body').addClass('grab');

		keyboard.setDragging(true);
		selection.preventSelect(true);
		preventCommonDrop(true);
	};

	onDragEndCommon (e: any) {
		e.preventDefault();

		const { dataset } = this.props;
		const { selection, preventCommonDrop } = dataset || {};
		const node = $(ReactDOM.findDOMNode(this));

		$('body').removeClass('grab');
		$(window).off('dragend.board drag.board');

		node.find('.isClone').remove();
		node.find('.isDragging').removeClass('isDragging');
		node.find(`.ghost`).remove();

		selection.preventSelect(false);
		preventCommonDrop(false);
		keyboard.setDragging(false);

		if (this.frame) {
			raf.cancel(this.frame);
		};

		this.cache = {};
		this.clear();
	};

	onDragStartColumn (e: any, groupId: string) {
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));

		this.onDragStartCommon(e, node.find(`#column-${groupId}`));
		this.initCacheColumn();
		this.isDraggingColumn = true;

		win.on('drag.board', (e: any) => { this.onDragMoveColumn(e, groupId); });
		win.on('dragend.board', (e: any) => { this.onDragEndColumn(e); });
	};

	onDragMoveColumn (e: any, groupId: any) {
		const node = $(ReactDOM.findDOMNode(this));
		const ghost = $('<div />').addClass('ghost isColumn');
		const current = this.cache[groupId];
		const groups = this.getGroups(false);

		if (!current) {
			return;
		};

		this.oldIndex = groups.findIndex(it => it.id == groupId);

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
			node.find('.ghost.isColumn').remove();

			if (hoverId) {
				const el = node.find(`#column-${hoverId}`);

				isLeft ? el.before(ghost) : el.after(ghost);
				ghost.css({ height: this.cache[hoverId].height });
			};
		});
	};

	onDragEndColumn (e: any) {
		const { rootId, block, getView } = this.props;
		const view = getView();
		const update: any[] = [];

		let groups = this.getGroups(false);
		groups = arrayMove(groups, this.oldIndex, this.newIndex);
		dbStore.groupsSet(rootId, block.id, groups);

		groups.forEach((it: any, i: number) => {
			update.push({ groupId: it.id, index: i, isHidden: it.isHidden });
		});

		C.BlockDataviewGroupOrderUpdate(rootId, block.id, { viewId: view.id, groups: update });

		this.isDraggingColumn = false;
		this.onDragEndCommon(e);
		this.resize();
		this.clearValues();
	};

	onDragStartCard (e: any, groupId: any, record: any) {
		const win = $(window);

		this.onDragStartCommon(e, $(e.currentTarget));
		this.initCacheCard();

		win.on('drag.board', (e: any) => { this.onDragMoveCard(e, record); });
		win.on('dragend.board', (e: any) => { this.onDragEndCard(e, record); });
	};

	onDragMoveCard (e: any, record: any) {
		const node = $(ReactDOM.findDOMNode(this));
		const ghost = $('<div />').addClass('ghost isCard');
		const current = this.cache[record.id];

		if (!current) {
			return;
		};

		this.oldGroupId = current.groupId;
		this.oldIndex = current.index;

		let isTop = false;
		let hoverId = '';

		for (let i in this.cache) {
			const rect = this.cache[i];
			if (!rect || (rect.id == record.id)) {
				continue;
			};

			if (Util.rectsCollide({ x: e.pageX, y: e.pageY, width: current.width, height: current.height + 8 }, rect)) {
				isTop = e.pageY <= rect.y + rect.height / 2;
				if (rect.isAdd) {
					isTop = true;
				};

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
			node.find(`.ghost.isCard`).remove();

			if (hoverId) {
				const card = node.find(`#card-${hoverId}`);

				ghost.css({ height: current.height, width: current.width });
				isTop ? card.before(ghost) : card.after(ghost);
			};
		});
	};

	onDragEndCard (e: any, record: any) {
		this.onDragEndCommon(e);

		if (!this.oldGroupId || !this.newGroupId || ((this.oldIndex == this.newIndex) && (this.oldGroupId == this.newGroupId))) {
			return;
		};

		const { rootId, block, getView } = this.props;
		const view = getView();
		const orders: any[] = [];
		const oldSubId = this.getSubId(this.oldGroupId);
		const newSubId = this.getSubId(this.newGroupId);
		const newGroup = dbStore.getGroup(rootId, block.id, this.newGroupId);
		const change = this.oldGroupId != this.newGroupId;

		const setOrder = () => {
			C.BlockDataviewObjectOrderUpdate(rootId, block.id, orders, () => {
				orders.forEach((it: any) => {
					let old = block.content.objectOrder.find(item => item.groupId == it.groupId);
					if (old) {
						set(old, it);
					} else {
						block.content.objectOrder.push(it);
					};

					window.setTimeout(() => { this.applyGroupOrder(it.groupId); }, 30);
				});
			});
		};

		let records: any[] = [];

		if (change) {
			dbStore.recordDelete(oldSubId, '', record.id);
			dbStore.recordAdd(newSubId, '', { id: record.id }, 1);

			records = dbStore.getRecords(newSubId, '');
			records = arrayMove(records, records.findIndex(it => it.id == record.id), this.newIndex);
			dbStore.recordsSet(newSubId, '', records);

			detailStore.update(newSubId, { id: record.id, details: record }, true);
			detailStore.delete(oldSubId, record.id, Object.keys(record));

			orders.push({ viewId: view.id, groupId: this.oldGroupId, objectIds: dbStore.getRecords(oldSubId, '').map(it => it.id) });
			orders.push({ viewId: view.id, groupId: this.newGroupId, objectIds: records.map(it => it.id) });

			C.ObjectSetDetails(record.id, [ { key: view.groupRelationKey, value: newGroup.value } ], setOrder);
		} else {
			records = arrayMove(dbStore.getRecords(oldSubId, ''), this.oldIndex, this.newIndex);
			dbStore.recordsSet(oldSubId, '', records);

			orders.push({ viewId: view.id, groupId: this.oldGroupId, objectIds: records.map(it => it.id) });			

			setOrder();
		};

		this.clearValues();
	};

	applyGroupOrder (groupId: string) {
		const { block } = this.props;
		const order = block.content.objectOrder.find(it => it.groupId == groupId);
		const subId = this.getSubId(groupId);

		if (!order) {
			return;
		};

		let records = dbStore.getRecords(subId, '');

		records.sort((c1: any, c2: any) => {
			let idx1 = order.objectIds.indexOf(c1.id);
			let idx2 = order.objectIds.indexOf(c2.id);
			if (idx1 > idx2) return 1;
			if (idx1 < idx2) return -1;
			return 0;
		});

		dbStore.recordsSet(subId, '', records);
	};

	onScroll () {
		if (!this.isDraggingColumn) {
			return;
		};

		const groups = this.getGroups(false);
		const node = $(ReactDOM.findDOMNode(this));

		groups.forEach((group: any, i: number) => {
			if (this.cache[group.id]) {
				const item = node.find(`#column-${group.id}`);
				const p = item.offset();

				this.cache[group.id].x = p.left;
				this.cache[group.id].y = p.top;
			};
		});
	};

	getSubId (groupId: string) {
		const { rootId, block } = this.props;
		return dbStore.getSubId(rootId, [ block.id, groupId ].join(':'));
	};

	clear () {
		const node = $(ReactDOM.findDOMNode(this));
		node.find('.isOver').removeClass('isOver top bottom left right');
	};

	clearValues () {
		this.oldIndex = this.newIndex -1;
		this.oldGroupId = this.newGroupId = '';
	};

	onScrollColumn (groupId: string) {
		const node = $(ReactDOM.findDOMNode(this));

		for (let i in this.cache) {
			let item = this.cache[i];
			if (item.groupId != groupId) {
				continue;
			};

			let el = node.find(`#card-${item.id}`);
			item.y = el.offset().top;
		};
	};

	resize () {
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const scroll = node.find('.scroll');
		const viewItem = node.find('.viewItem');
		const ww = win.width();
		const mw = ww - 192;
		const size = Constant.size.dataview.board;
		const groups = this.getGroups(false);
		const width = 30 + groups.length * (size.card + size.margin);
		
		let vw = 0;
		let margin = 0;

		if (width < mw) {
			vw = mw;
		} else {
			vw = width;
			margin = (ww - mw) / 2; 
		};

		scroll.css({ width: ww, marginLeft: -margin / 2 , paddingLeft: margin / 2 });
		viewItem.css({ width: vw });
	};
	
});

export default ViewBoard;