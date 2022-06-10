import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C, Util, DataUtil, analytics } from 'ts/lib';
import { observer } from 'mobx-react';
import { dbStore, detailStore, popupStore } from 'ts/store';
import arrayMove from 'array-move';

import Column from './board/column';

interface Props extends I.ViewComponent {
	dataset?: any;
};

const $ = require('jquery');
const raf = require('raf');
const Constant = require('json/constant.json');

const ViewBoard = observer(class ViewBoard extends React.Component<Props, {}> {

	cache: any = {};
	width: number = 0;
	height: number = 0;
	frame: number = 0;
	groupRelationKey: string = '';
	oldIndex: number = -1;
	newIndex: number = -1;

	constructor (props: any) {
		super(props);
		
		this.onAdd = this.onAdd.bind(this);
		this.onDragStartColumn = this.onDragStartColumn.bind(this);
		this.onDragStartCard = this.onDragStartCard.bind(this);
	};

	render () {
		const { getView } = this.props;
		const view = getView();
		const { groupRelationKey } = view;
		const { boardGroups } = dbStore;

		return (
			<div className="wrap">
				<div className="scroll">
					<div className="viewItem viewBoard">
						<div className="columns">
							{boardGroups.map((group: any, i: number) => (
								<Column 
									key={`board-column-${group.id}`} 
									{...this.props} 
									{...group} 
									onAdd={this.onAdd} 
									onDragStartColumn={this.onDragStartColumn}
									onDragStartCard={this.onDragStartCard}
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.loadGroupList();
		this.resize();
	};

	componentDidUpdate () {
		this.loadGroupList();
		this.resize();

		$(window).trigger('resize.editor');
	};

	componentWillUnmount () {
		const { rootId, block } = this.props;
		const { boardGroups } = dbStore;
		const ids = [];

		boardGroups.forEach((it: any) => {
			ids.push(dbStore.getSubId(rootId, [ block.id, it.id ].join(':')));
		});

		C.ObjectSearchUnsubscribe(ids);
		this.clearGroupData();
	};

	loadGroupList () {
		const { block, getView } = this.props;
		const view = getView();

		if (this.groupRelationKey == view.groupRelationKey) {
			return;
		};

		this.clearGroupData();
		this.groupRelationKey = view.groupRelationKey;

		if (!view.groupRelationKey) {
			this.forceUpdate();
			return;
		};

		console.log(JSON.stringify(block.content.groupOrder, null, 5));
		console.log(view.id);

		const groupOrder: any = {};
 		const el = block.content.groupOrder.find(it => it.viewId == view.id);

		if (el) {
			el.groups.forEach((it: any) => {
				groupOrder[it.groupId] = it.index;
			});
		};

		C.ObjectRelationSearchDistinct(view.groupRelationKey, (message: any) => {
			if (message.error.code) {
				return;
			};

			console.log(JSON.stringify(groupOrder, null, 5));
			message.groups.sort((c1: any, c2: any) => {
				if (groupOrder[c1.id] > groupOrder[c2.id]) return 1;
				if (groupOrder[c1.id] < groupOrder[c2.id]) return -1;
				return 0;
			});

			dbStore.boardGroupsSet(message.groups);
		});
	};

	clearGroupData () {
		const { rootId, block } = this.props;
		const { boardGroups } = dbStore;

		boardGroups.forEach((it: any) => {
			const subId = dbStore.getSubId(rootId, [ block.id, it.id ].join(':'));
			dbStore.recordsClear(subId, '');
		});

		dbStore.boardGroupsClear();
	};

	onAdd (id: string) {
		const { rootId, block, getView } = this.props;
		const { boardGroups } = dbStore;
		const view = getView();
		const group = boardGroups.find(it => it.id == id);
		const object = detailStore.get(rootId, rootId, [ 'setOf' ], true);
		const setOf = object.setOf || [];
		const details: any = {};

		details[view.groupRelationKey] = group.value;

		const create = (template: any) => {
			C.BlockDataviewRecordCreate(rootId, block.id, details, template?.id, (message: any) => {
				if (message.error.code) {
					return;
				};

				const newRecord = message.record;

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

	initCacheColumn () {
		const node = $(ReactDOM.findDOMNode(this));
		const { boardGroups } = dbStore;

		this.cache = {};
		boardGroups.forEach((group: any, i: number) => {
			const item = node.find(`#column-${group.id}`);
			const p = item.offset();

			this.cache[group.id] = {
				x: p.left,
				y: p.top,
				width: item.outerWidth(),
				height: item.outerHeight(),
				index: i,
			};
		});
	};

	initCacheCard () {
	};

	onDragStartCommon (e: any, target: any) {
		e.stopPropagation();

		const { dataset } = this.props;
		const { selection, preventCommonDrop } = dataset || {};
		
		const node = $(ReactDOM.findDOMNode(this));
		const viewItem = node.find('.viewItem');
		const clone = target.clone();

		this.width = clone.outerWidth();
		this.height = clone.outerHeight();

		$('body').addClass('grab');
		target.addClass('isDragging');
		clone.attr({ id: '' }).addClass('isClone').css({ zIndex: 10000, position: 'fixed', left: -10000, top: -10000 });
		viewItem.append(clone);

		$(document).off('dragover').on('dragover', (e: any) => { e.preventDefault(); });
		e.dataTransfer.setDragImage(clone.get(0), 0, 0);

		selection.preventSelect(true);
		preventCommonDrop(true);
		
		this.unbind();
	};

	onDragEndCommon (e: any) {
		e.preventDefault();

		const { dataset } = this.props;
		const { selection, preventCommonDrop } = dataset || {};
		const node = $(ReactDOM.findDOMNode(this));

		$('body').removeClass('grab');
		node.find('.isClone').remove();
		node.find('.isDragging').removeClass('isDragging');

		selection.preventSelect(false);
		preventCommonDrop(false);

		if (this.frame) {
			raf.cancel(this.frame);
		};

		this.cache = {};
		this.oldIndex = -1;
		this.newIndex = -1;
		this.clear();
		this.unbind();
	};

	onDragStartColumn (e: any, groupId: string) {
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));

		this.onDragStartCommon(e, node.find(`#column-${groupId}`));
		this.initCacheColumn();

		win.on('drag.board', (e: any) => { this.onDragMoveColumn(e, groupId); });
		win.on('dragend.board', (e: any) => { this.onDragEndColumn(e); });
	};

	onDragMoveColumn (e: any, groupId: string) {
		const { boardGroups } = dbStore;
		const node = $(ReactDOM.findDOMNode(this));

		this.oldIndex = boardGroups.findIndex(it => it.id == groupId);

		let isLeft = false;
		let hoverId = '';

		for (let group of boardGroups) {
			const rect = this.cache[group.id];
			if (!rect || (group.id == groupId)) {
				continue;
			};

			if (rect && this.cache[groupId] && Util.rectsCollide({ x: e.pageX, y: e.pageY, width: this.width, height: this.height }, rect)) {
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
			this.clear();

			if (hoverId) {
				node.find(`#column-${hoverId}`).addClass('isOver ' + (isLeft ? 'left' : 'right'));
			};
		});
	};

	onDragEndColumn (e: any) {
		const { rootId, block, getView } = this.props;
		const view = getView();
		const groups: any[] = [];
		
		let { boardGroups } = dbStore;
		boardGroups = arrayMove(dbStore.boardGroups, this.oldIndex, this.newIndex);
		dbStore.boardGroupsSet(boardGroups);

		boardGroups.forEach((it: any, i: number) => {
			groups.push({ groupId: it.id, index: i });
		});

		C.BlockDataviewGroupOrderUpdate(rootId, block.id, [
			{ viewId: view.id, groups: groups }
		]);

		this.onDragEndCommon(e);
	};

	onDragStartCard (e: any, groupId: any, record: any) {
		const win = $(window);

		this.onDragStartCommon(e, $(e.currentTarget));
		this.initCacheCard();

		win.on('drag.board', (e: any) => { this.onDragMoveCard(e, groupId, record); });
		win.on('dragend.board', (e: any) => { this.onDragEndColumn(e); });
	};

	onDragMoveCard (e: any, groupId: any, record: any) {
		const node = $(ReactDOM.findDOMNode(this));
		const items = node.find('.card');

		let isTop = false;
		let hoverId = '';

		for (let i = 0; i < items.length; ++i) {
			const item = $(items.get(i));
			const id = item.data('id');
			const rect = this.cache[id];

			if (id == record.id) {
				continue;
			};

			if (rect && this.cache[record.id] && Util.rectsCollide({ x: e.pageX, y: e.pageY, width: this.width, height: this.height + 8 }, rect)) {
				isTop = e.pageY <= rect.y + rect.height / 2;
				hoverId = id;
				break;
			};
		};

		if (this.frame) {
			raf.cancel(this.frame);
		};

		this.frame = raf(() => {
			this.clear();

			if (hoverId) {
				const card = node.find(`#card-${hoverId}`);
				const cn = isTop ? 'top' : 'bottom';

				card.addClass('isOver ' + cn);
				card.find('.ghost.' + cn).css({ height: this.cache[hoverId].height });
			};
		});
	};

	onDragEndCard (e: any) {
		this.onDragEndCommon(e);
	};

	clear () {
		const node = $(ReactDOM.findDOMNode(this));
		node.find('.isOver').removeClass('isOver top bottom left right');
	};

	unbind () {
		$(window).off('dragend.board drag.board');
	};

	resize () {
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const scroll = node.find('.scroll');
		const viewItem = node.find('.viewItem');
		const columns = node.find('.column');
		const ww = win.width();
		const mw = ww - 192;
		const size = Constant.size.dataview.board;
		
		let vw = 0;
		let margin = 0;
		let width = columns.length * (size.card + size.margin);

		if (width < mw) {
			vw = mw;
		} else {
			vw = width;
			margin = (ww - mw) / 2; 
		};

		scroll.css({ width: ww, marginLeft: -margin, paddingLeft: margin });
		viewItem.css({ width: vw });
	};
	
});

export default ViewBoard;