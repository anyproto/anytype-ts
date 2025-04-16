import * as React from 'react';
import { observer } from 'mobx-react';
import arrayMove from 'array-move';
import $ from 'jquery';
import raf from 'raf';
import { I, C, S, U, J, Dataview, keyboard, translate } from 'Lib';
import Empty from '../empty';
import Column from './board/column';

const PADDING = 46;

const ViewBoard = observer(class ViewBoard extends React.Component<I.ViewComponent> {

	node: any = null;
	cache: any = {};
	frame = 0;
	newIndex = -1;
	newGroupId = '';
	columnRefs: any = {};
	isDraggingColumn = false;
	isDraggingCard = false;
	ox = 0;
	creating = false;

	constructor (props: I.ViewComponent) {
		super(props);

		this.onDragStartColumn = this.onDragStartColumn.bind(this);
		this.onDragStartCard = this.onDragStartCard.bind(this);
	};

	render () {
		const { rootId, block, getView, className, onViewSettings } = this.props;
		const view = getView();
		const groups = this.getGroups(false);
		const relation = S.Record.getRelationByKey(view.groupRelationKey);
		const cn = [ 'viewContent', className ];

		if (!relation || !relation.isInstalled) {
			return (
				<Empty
					{...this.props}
					title={translate('blockDataviewBoardRelationDeletedTitle')}
					description={translate('blockDataviewBoardRelationDeletedDescription')}
					button={translate('blockDataviewBoardOpenViewMenu')}
					className="withHead"
					onClick={onViewSettings}
				/>
			);
		};

		return (
			<div 
				ref={node => this.node = node} 
				id="scrollWrap"
				className="scrollWrap"
			>
				<div id="scroll" className="scroll">
					<div className={cn.join(' ')}>
						<div id="columns" className="columns">
							{groups.map((group: any, i: number) => (
								<Column 
									key={`board-column-${group.id}`} 
									ref={ref => this.columnRefs[group.id] = ref}
									{...this.props} 
									{...group}
									onDragStartColumn={this.onDragStartColumn}
									onDragStartCard={this.onDragStartCard}
									getSubId={() => this.getSubId(group.id)}
								/>
							))}
						</div>
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
		U.Common.triggerResizeEditor(this.props.isPopup);
	};

	componentWillUnmount () {
		this.unbind();
	};

	rebind () {
		this.unbind();

		const node = $(this.node);
		node.find('#scroll').on('scroll', () => this.onScrollView());
	};

	unbind () {
		const node = $(this.node);
		node.find('#scroll').off('scroll');
	};

	loadGroupList () {
		const { rootId, block, getView, getTarget } = this.props;
		const object = getTarget();
		const view = getView();

		S.Record.groupsClear(rootId, block.id);

		if (!view.groupRelationKey) {
			this.forceUpdate();
			return;
		};

		Dataview.loadGroupList(rootId, block.id, view.id, object);
	};

	getGroups (withHidden: boolean) {
		const { rootId, block, getView } = this.props;
		const view = getView();
		if (!view) {
			return [];
		};

		return Dataview.getGroups(rootId, block.id, view.id, withHidden);
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
				const el = node.find(`#record-${item.id}`);
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

		const selection = S.Common.getRef('selectionProvider');
		const node = $(this.node);
		const view = node.find('.viewContent');
		const clone = target.clone();
		
		this.ox = node.find('#columns').offset().left;

		target.addClass('isDragging');
		clone.attr({ id: '' }).addClass('isClone').css({ zIndex: 10000, position: 'fixed', left: -10000, top: -10000 });
		view.append(clone);

		$(document).off('dragover').on('dragover', e => e.preventDefault());
		$(window).off('dragend.board drag.board');
		$('body').addClass('grab');

		e.dataTransfer.setDragImage(clone.get(0), 0, 0);

		keyboard.setDragging(true);
		keyboard.disableSelection(true);
		keyboard.disableCommonDrop(true);

		selection.clear();
	};

	onDragEndCommon (e: any) {
		e.preventDefault();

		const node = $(this.node);

		$('body').removeClass('grab');
		$(window).off('dragend.board drag.board').trigger('mouseup.selection');

		node.find('.isClone').remove();
		node.find('.isDragging').removeClass('isDragging');
		node.find('.isOver').removeClass('isOver left right top bottom');

		keyboard.disableSelection(false);
		keyboard.disableCommonDrop(false);
		keyboard.setDragging(false);

		if (this.frame) {
			raf.cancel(this.frame);
		};
	};

	onDragStartColumn (e: any, groupId: string) {
		const { readonly } = this.props;
		if (readonly) {
			e.preventDefault();
			e.stopPropagation();
			return;
		};

		const win = $(window);
		const node = $(this.node);

		this.onDragStartCommon(e, node.find(`#column-${groupId}`));
		this.initCacheColumn();
		this.isDraggingColumn = true;

		win.on('drag.board', e => this.onDragMoveColumn(e, groupId));
		win.on('dragend.board', e => this.onDragEndColumn(e, groupId));
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

		for (const group of groups) {
			const rect = this.cache[group.id];
			if (!rect || (group.id == groupId)) {
				continue;
			};

			if (rect && this.cache[groupId] && U.Common.rectsCollide({ x: e.pageX, y: e.pageY, width: current.width, height: current.height }, rect)) {
				isLeft = e.pageX <= rect.x + rect.width / 2;
				hoverId = group.id;

				this.newIndex = rect.index;

				if (isLeft && (rect.index > current.index)) {
					this.newIndex--;
				};

				if (!isLeft && (rect.index < current.index)) {
					this.newIndex++;
				};
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
		S.Record.groupsSet(rootId, block.id, groups);

		groups.forEach((it: any, i: number) => {
			update.push({ ...it, groupId: it.id, index: i });
		});

		Dataview.groupUpdate(rootId, block.id, view.id, update);
		C.BlockDataviewGroupOrderUpdate(rootId, block.id, { viewId: view.id, groups: update });

		this.cache = {};
		this.isDraggingColumn = false;
		this.onDragEndCommon(e);
		this.resize();
	};

	onDragStartCard (e: any, groupId: any, record: any) {
		const { readonly } = this.props;
		if (readonly) {
			e.preventDefault();
			e.stopPropagation();
			return;
		};

		const win = $(window);

		this.onDragStartCommon(e, $(e.currentTarget));
		this.initCacheCard();
		this.isDraggingCard = true;

		win.on('drag.board', e => this.onDragMoveCard(e, record));
		win.on('dragend.board', e => this.onDragEndCard(e, record));
	};

	onDragMoveCard (e: any, record: any) {
		const node = $(this.node);
		const current = this.cache[record.id];

		if (!current) {
			return;
		};

		let isTop = false;
		let hoverId = '';

		for (const i in this.cache) {
			const rect = this.cache[i];
			if (!rect || (rect.id == record.id)) {
				continue;
			};

			if (U.Common.rectsCollide({ x: e.pageX, y: e.pageY, width: current.width, height: current.height + 8 }, rect)) {
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
				node.find(`#record-${hoverId}`).addClass('isOver ' + (isTop ? 'top' : 'bottom'));
			};
		});
	};

	onDragEndCard (e: any, record: any) {
		const current = this.cache[record.id];

		if (!current) {
			return;
		};

		this.onDragEndCommon(e);
		this.cache = {};
		this.isDraggingCard = false;

		if (!current.groupId || !this.newGroupId || ((current.index == this.newIndex) && (current.groupId == this.newGroupId))) {
			return;
		};

		const { rootId, block, getView, objectOrderUpdate } = this.props;
		const view = getView();
		const oldSubId = S.Record.getGroupSubId(rootId, block.id, current.groupId);
		const newSubId = S.Record.getGroupSubId(rootId, block.id, this.newGroupId);
		const newGroup = S.Record.getGroup(rootId, block.id, this.newGroupId);
		const change = current.groupId != this.newGroupId;

		let records: any[] = [];
		let orders: any[] = [];

		if (change) {
			S.Detail.update(newSubId, { id: record.id, details: record }, true);
			S.Detail.delete(oldSubId, record.id, Object.keys(record));

			S.Record.recordDelete(oldSubId, '', record.id);
			S.Record.recordAdd(newSubId, '', record.id, this.newIndex);

			C.ObjectListSetDetails([ record.id ], [ { key: view.groupRelationKey, value: newGroup.value } ], () => {
				orders = [
					{ viewId: view.id, groupId: current.groupId, objectIds: S.Record.getRecordIds(oldSubId, '') },
					{ viewId: view.id, groupId: this.newGroupId, objectIds: S.Record.getRecordIds(newSubId, '') }
				];

				objectOrderUpdate(orders, records);
			});
		} else {
			if (current.index + 1 == this.newIndex) {
				return;
			};

			if (this.newIndex > current.index) {
				this.newIndex -= 1;
			};

			records = arrayMove(S.Record.getRecordIds(oldSubId, ''), current.index, this.newIndex);
			orders = [ { viewId: view.id, groupId: current.groupId, objectIds: records } ];

			objectOrderUpdate(orders, records, () => S.Record.recordsSet(oldSubId, '', records));
		};
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
					const el = node.find(`#record-${item.id}`);
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

	getSubId (id: string): string {
		const { rootId, block } = this.props;

		return S.Record.getGroupSubId(rootId, block.id, id);
	};

	resize () {
		const { rootId, block, isPopup, isInline } = this.props;
		const parent = S.Block.getParentLeaf(rootId, block.id);
		const node = $(this.node);
		const scroll = node.find('#scroll');
		const view = node.find('.viewContent');
		const container = U.Common.getPageContainer(isPopup);
		const cw = container.width();
		const size = J.Size.dataview.board;
		const groups = this.getGroups(false);
		const width = groups.length * (size.card + size.margin) - size.margin;

		if (!isInline) {
			const maxWidth = cw - PADDING * 2;
			const margin = width >= maxWidth ? PADDING : 0;

			scroll.css({ width: `calc(100% + ${PADDING * 2}px)`, marginLeft: -margin, paddingLeft: margin / 2 });

			if (width > maxWidth) {
				view.css({ width: width + size.margin });
			};
		} else 
		if (parent && (parent.isPage() || parent.isLayoutDiv())) {
			const wrapper = $('#editorWrapper');
			const ww = wrapper.width();
			const margin = (cw - ww) / 2;

			scroll.css({ width: cw, marginLeft: -margin, paddingLeft: margin });
			view.css({ width: width + margin + 2 });
		};
	};

});

export default ViewBoard;
