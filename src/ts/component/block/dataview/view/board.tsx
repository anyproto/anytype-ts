import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Loader } from 'ts/component';
import { dbStore, detailStore, popupStore } from 'ts/store';
import { I, C, Util, DataUtil, analytics, keyboard } from 'ts/lib';
import { observer } from 'mobx-react';
import { throttle } from 'lodash';
import arrayMove from 'array-move';

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
	width: number = 0;
	height: number = 0;
	frame: number = 0;
	groupRelationKey: string = '';
	oldIndex: number = -1;
	newIndex: number = -1;
	state = {
		loading: false,
	};
	columnRefs: any = {};
	isDraggingColumn: boolean = false;

	constructor (props: any) {
		super(props);
		
		this.onAdd = this.onAdd.bind(this);
		this.onDragStartColumn = this.onDragStartColumn.bind(this);
		this.onDragStartCard = this.onDragStartCard.bind(this);
	};

	render () {
		const { rootId, block, getView } = this.props;
		const { loading } = this.state;
		const view = getView();
		const { groupRelationKey } = view;
		const groups = dbStore.getGroups(rootId, block.id);

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
										onAdd={this.onAdd} 
										onDragStartColumn={this.onDragStartColumn}
										onDragStartCard={this.onDragStartCard}
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
		this.loadGroupList();
		this.resize();
		this.rebind();
	};

	componentDidUpdate () {
		this.loadGroupList();
		this.resize();

		$(window).trigger('resize.editor');
	};

	componentWillUnmount () {
		const { rootId, block } = this.props;
		const groups = dbStore.getGroups(rootId, block.id);
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

		if (this.groupRelationKey == view.groupRelationKey) {
			return;
		};

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
				groupOrder[it.groupId] = it.index;
			});
		};

		this.setState({ loading: true });

		C.ObjectRelationSearchDistinct(view.groupRelationKey, (message: any) => {
			if (message.error.code) {
				return;
			};

			message.groups.sort((c1: any, c2: any) => {
				if (groupOrder[c1.id] > groupOrder[c2.id]) return 1;
				if (groupOrder[c1.id] < groupOrder[c2.id]) return -1;
				return 0;
			});

			dbStore.groupsSet(rootId, block.id, message.groups);
			this.setState({ loading: false });
		});
	};

	onAdd (id: string) {
		const { rootId, block, getView } = this.props;
		const groups = dbStore.getGroups(rootId, block.id);
		const view = getView();
		const group = groups.find(it => it.id == id);
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
		const { rootId, block } = this.props;
		const groups = dbStore.getGroups(rootId, block.id);
		const node = $(ReactDOM.findDOMNode(this));

		this.cache = {};
		groups.forEach((group: any, i: number) => {
			const item = node.find(`#column-${group.id}`);
			const p = item.offset();

			this.cache[group.id] = {
				id: group.id,
				x: p.left,
				y: p.top,
				width: item.outerWidth(),
				height: item.outerHeight(),
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
			const subId = dbStore.getSubId(rootId, [ block.id, group.id ].join(':'));
			const records = dbStore.getRecords(subId, '');

			records.forEach((record: any) => {
				const item = node.find(`#card-${record.id}`);
				const p = item.offset();

				this.cache[record.id] = {
					id: record.id,
					groupId: group.id,
					x: p.left,
					y: p.top,
					width: item.outerWidth(),
					height: item.outerHeight(),
					index: i,
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

		this.width = clone.outerWidth();
		this.height = clone.outerHeight();

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
		this.oldIndex = -1;
		this.newIndex = -1;
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

	onDragMoveColumn (e: any, groupId: string) {
		const { rootId, block } = this.props;
		const groups = dbStore.getGroups(rootId, block.id);
		const node = $(ReactDOM.findDOMNode(this));
		const ghost = $('<div />').addClass('ghost isColumn');

		this.oldIndex = groups.findIndex(it => it.id == groupId);

		let isLeft = false;
		let hoverId = '';

		for (let group of groups) {
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

		let groups = dbStore.getGroups(rootId, block.id);
		groups = arrayMove(groups, this.oldIndex, this.newIndex);
		dbStore.groupsSet(rootId, block.id, groups);

		groups.forEach((it: any, i: number) => {
			update.push({ groupId: it.id, index: i });
		});

		C.BlockDataviewGroupOrderUpdate(rootId, block.id, [ { viewId: view.id, groups: update } ]);

		this.isDraggingColumn = false;
		this.onDragEndCommon(e);
		this.resize();
	};

	onDragStartCard (e: any, groupId: any, record: any) {
		const win = $(window);

		this.onDragStartCommon(e, $(e.currentTarget));
		this.initCacheCard();

		win.on('drag.board', (e: any) => { this.onDragMoveCard(e, record); });
		win.on('dragend.board', (e: any) => { this.onDragEndCard(e); });
	};

	onDragMoveCard (e: any, record: any) {
		const node = $(ReactDOM.findDOMNode(this));
		const ghost = $('<div />').addClass('ghost isCard');
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

			if (Util.rectsCollide({ x: e.pageX, y: e.pageY, width: this.width, height: this.height + 8 }, rect)) {
				isTop = e.pageY <= rect.y + rect.height / 2;
				hoverId = rect.id;
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

	onDragEndCard (e: any) {
		this.onDragEndCommon(e);
	};

	onScroll () {
		if (!this.isDraggingColumn) {
			return;
		};

		const { rootId, block } = this.props;
		const groups = dbStore.getGroups(rootId, block.id);
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

	clear () {
		const node = $(ReactDOM.findDOMNode(this));
		node.find('.isOver').removeClass('isOver top bottom left right');
	};

	resize () {
		const { rootId, block } = this.props;
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const scroll = node.find('.scroll');
		const viewItem = node.find('.viewItem');
		const ww = win.width();
		const mw = ww - 192;
		const size = Constant.size.dataview.board;
		const groups = dbStore.getGroups(rootId, block.id);
		
		let vw = 0;
		let margin = 0;
		let width = groups.length * (size.card + size.margin);

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