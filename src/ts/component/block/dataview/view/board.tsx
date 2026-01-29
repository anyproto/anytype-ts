import React, { forwardRef, useEffect, useRef, useImperativeHandle, useState } from 'react';
import { observer } from 'mobx-react';
import { arrayMove } from '@dnd-kit/sortable';
import $ from 'jquery';
import raf from 'raf';
import { StickyScrollbar } from 'Component';
import { I, C, S, U, J, Dataview, keyboard, translate } from 'Lib';
import Empty from '../empty';
import Column from './board/column';

const PADDING = 46;

const ViewBoard = observer(forwardRef<I.ViewRef, I.ViewComponent>((props, ref) => {

	const { rootId, block, getView, getTarget, className, onViewSettings, isInline, isPopup, readonly, objectOrderUpdate } = props;
	const view = getView();
	const relation = S.Record.getRelationByKey(view.groupRelationKey);
	const cn = [ 'viewContent', className ];
	const nodeRef = useRef(null);
	const scrollRef = useRef(null);
	const stickyScrollRef = useRef(null);
	const isSyncingScroll = useRef(false);
	const hoverId = useRef('');
	const newIndex = useRef(-1);
	const newGroupId = useRef('');
	const frame = useRef(0);
	const cache = useRef({});
	const isDraggingColumn = useRef(false);
	const isDraggingCard = useRef(false);
	const ox = useRef(0);
	const columnRefs = useRef(new Map());
	const [ dummy, setDummy ] = useState(0);

	useEffect(() => {
		resize();
		rebind();

		return () => {
			unbind();
			columnRefs.current.clear();
			cache.current = {};
		};
	}, []);

	useEffect(() => {
		resize();
		U.Common.triggerResizeEditor(isPopup);

		const selection = S.Common.getRef('selectionProvider');
		const ids = selection?.get(I.SelectType.Record) || [];

		if (ids.length) {
			selection?.renderSelection();
		};
	});

	const rebind = () => {
		const scroll = $(scrollRef.current);

		unbind();

		scroll.on('scroll', () => onScrollHorizontal());
		U.Common.getPageContainer(isPopup).on('scroll.board', onScrollView);

		if (!isInline) {
			stickyScrollRef.current?.bind(scroll, isSyncingScroll.current);
		};
	};

	const unbind = () => {
		const scroll = $(scrollRef.current);

		scroll.off('scroll');
		stickyScrollRef.current?.unbind();
		U.Common.getPageContainer(isPopup).off('scroll.board');
	};

	const onScrollHorizontal = () => {
		if (stickyScrollRef.current) {
			isSyncingScroll.current = stickyScrollRef.current.sync($(scrollRef.current), isSyncingScroll.current);
		};
	};

	const load = () => {
		const object = getTarget();
		const view = getView();

		S.Record.groupsClear(rootId, block.id);

		if (!view.groupRelationKey) {
			setDummy(dummy + 1);
		} else {
			Dataview.loadGroupList(rootId, block.id, view.id, object);
		};
	};

	const getGroups = (withHidden: boolean) => {
		const view = getView();
		return view ? Dataview.getGroups(rootId, block.id, view.id, withHidden) : [];
	};

	const initCacheColumn = () => {
		const groups = getGroups(true);
		const node = $(nodeRef.current);

		cache.current = {};
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
			
			cache.current[group.id] = item;
		});
	};

	const initCacheCard = () => {
		const groups = getGroups(false);
		const node = $(nodeRef.current);

		cache.current = {};

		groups.forEach((group: any, i: number) => {
			const column = columnRefs.current.get(group.id);
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
				cache.current[item.id] = {
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

	const onDragStartCommon = (e: any, target: any) => {
		e.stopPropagation();

		const selection = S.Common.getRef('selectionProvider');
		const node = $(nodeRef.current);
		const view = node.find('.viewContent');
		const clone = target.clone();
		
		ox.current = node.find('#columns').offset().left;

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

	const onDragEndCommon = (e: any) => {
		e.preventDefault();

		const node = $(nodeRef.current);

		$('body').removeClass('grab');
		$(window).off('dragend.board drag.board').trigger('mouseup.selection');

		node.find('.isClone').remove();
		node.find('.isDragging').removeClass('isDragging');
		node.find('.isOver').removeClass('isOver left right top bottom');

		keyboard.disableSelection(false);
		keyboard.disableCommonDrop(false);
		keyboard.setDragging(false);

		if (frame.current) {
			raf.cancel(frame.current);
			frame.current = 0;
		};
	};

	const onDragStartColumn = (e: any, groupId: string) => {
		if (readonly) {
			e.preventDefault();
			e.stopPropagation();
			return;
		};

		const win = $(window);
		const node = $(nodeRef.current);

		onDragStartCommon(e, node.find(`#column-${groupId}`));
		initCacheColumn();
		isDraggingColumn.current = true;

		win.on('drag.board', e => onDragMoveColumn(e, groupId));
		win.on('dragend.board', e => onDragEndColumn(e, groupId));
	};

	const onDragMoveColumn = (e: any, groupId: any) => {
		const node = $(nodeRef.current);
		const current = cache.current[groupId];
		const groups = getGroups(false);

		if (!current) {
			return;
		};

		let isLeft = false;

		hoverId.current = '';

		for (const group of groups) {
			const rect = cache.current[group.id];
			if (!rect || (group.id == groupId)) {
				continue;
			};

			if (rect && cache.current[groupId] && U.Common.rectsCollide({ x: e.pageX, y: e.pageY, width: current.width, height: current.height }, rect)) {
				isLeft = e.pageX <= rect.x + rect.width / 2;
				hoverId.current = group.id;

				newIndex.current = rect.index;

				if (isLeft && (rect.index > current.index)) {
					newIndex.current--;
				};

				if (!isLeft && (rect.index < current.index)) {
					newIndex.current++;
				};
				break;
			};
		};

		if (frame.current) {
			raf.cancel(frame.current);
			frame.current = 0;
		};

		frame.current = raf(() => {
			node.find('.isOver').removeClass('isOver left right');

			if (hoverId.current) {
				node.find(`#column-${hoverId.current}`).addClass(`isOver ${isLeft ? 'left' : 'right'}`);
			};
		});
	};

	const onDragEndColumn = (e: any, groupId: string) => {
		if (hoverId.current) {
			const view = getView();
			const update: any[] = [];
			const current = cache.current[groupId];

			let groups = getGroups(true);
			groups = arrayMove(groups, current.index, newIndex.current);
			S.Record.groupsSet(rootId, block.id, groups);

			groups.forEach((it: any, i: number) => {
				update.push({ ...it, groupId: it.id, index: i });
			});

			Dataview.groupUpdate(rootId, block.id, view.id, update);
			C.BlockDataviewGroupOrderUpdate(rootId, block.id, { viewId: view.id, groups: update });
		};

		cache.current = {};
		isDraggingColumn.current = false;
		onDragEndCommon(e);
		resize();
	};

	const onDragStartCard = (e: any, groupId: any, record: any) => {
		if (readonly) {
			e.preventDefault();
			e.stopPropagation();
			return;
		};

		const win = $(window);

		onDragStartCommon(e, $(e.currentTarget));
		initCacheCard();
		isDraggingCard.current = true;

		win.on('drag.board', e => onDragMoveCard(e, record));
		win.on('dragend.board', e => onDragEndCard(e, record));
	};

	const onDragMoveCard = (e: any, record: any) => {
		const node = $(nodeRef.current);
		const current = cache.current[record.id];

		if (!current) {
			return;
		};

		let isTop = false;
		
		hoverId.current = '';

		for (const i in cache.current) {
			const rect = cache.current[i];
			if (!rect || (rect.id == record.id)) {
				continue;
			};

			if (U.Common.rectsCollide({ x: e.pageX, y: e.pageY, width: current.width, height: current.height + 8 }, rect)) {
				isTop = rect.isAdd || (e.pageY <= rect.y + rect.height / 2);

				hoverId.current = rect.id;
				newGroupId.current = rect.groupId;
				newIndex.current = isTop ? rect.index : rect.index + 1;
				break;
			};
		};

		if (frame.current) {
			raf.cancel(frame.current);
			frame.current = 0;
		};

		frame.current = raf(() => {
			node.find('.isOver').removeClass('isOver top bottom');

			if (hoverId.current) {
				node.find(`#record-${hoverId.current}`).addClass(`isOver ${isTop ? 'top' : 'bottom'}`);
			};
		});
	};

	const onDragEndCard = (e: any, record: any) => {
		const current = cache.current[record.id];

		if (!current) {
			return;
		};

		onDragEndCommon(e);
		cache.current = {};
		isDraggingCard.current = false;

		if (
			!hoverId.current || 
			!current.groupId || 
			!newGroupId.current || 
			((current.index == newIndex.current) && (current.groupId == newGroupId.current))
		) {
			return;
		};

		const view = getView();
		const oldSubId = S.Record.getGroupSubId(rootId, block.id, current.groupId);
		const newSubId = S.Record.getGroupSubId(rootId, block.id, newGroupId.current);
		const newGroup = S.Record.getGroup(rootId, block.id, newGroupId.current);
		const change = current.groupId != newGroupId.current;

		let records: any[] = [];
		let orders: any[] = [];

		if (change) {
			S.Detail.update(newSubId, { id: record.id, details: record }, true);
			S.Detail.delete(oldSubId, record.id, Object.keys(record));

			S.Record.recordDelete(oldSubId, '', record.id);
			S.Record.recordAdd(newSubId, '', record.id, newIndex.current);

			C.ObjectListSetDetails([ record.id ], [ { key: view.groupRelationKey, value: newGroup.value } ], () => {
				orders = [
					{ viewId: view.id, groupId: current.groupId, objectIds: S.Record.getRecordIds(oldSubId, '') },
					{ viewId: view.id, groupId: newGroupId.current, objectIds: S.Record.getRecordIds(newSubId, '') }
				];

				objectOrderUpdate(orders, records);
			});
		} else {
			if (current.index + 1 == newIndex.current) {
				return;
			};

			if (newIndex.current > current.index) {
				newIndex.current -= 1;
			};

			records = arrayMove(S.Record.getRecordIds(oldSubId, ''), current.index, newIndex.current);
			orders = [ { viewId: view.id, groupId: current.groupId, objectIds: records } ];

			objectOrderUpdate(orders, records, () => S.Record.recordsSet(oldSubId, '', records));
		};
	};

	const onScrollView = () => {
		const groups = getGroups(false);
		const node = $(nodeRef.current);

		if (isDraggingColumn.current) {
			groups.forEach((group: any, i: number) => {
				const rect = cache.current[group.id];
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
		if (isDraggingCard.current) {
			groups.forEach((group: any, i: number) => {
				const column = columnRefs.current.get(group.id);
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
					cache.current[item.id].x = left;
					cache.current[item.id].y = top;
				});
			});
		};
	};

	const getSubId = (id: string): string => {
		return S.Record.getGroupSubId(rootId, block.id, id);
	};

	const resize = () => {
		const parent = S.Block.getParentLeaf(rootId, block.id);
		const node = $(nodeRef.current);
		const scroll = $(scrollRef.current);
		const view = node.find('.viewContent');
		const container = U.Common.getPageContainer(isPopup);
		const cw = container.width();
		const size = J.Size.dataview.board;
		const groups = getGroups(false);
		const width = groups.length * (size.card + size.margin) - size.margin;

		if (!isInline) {
			const mw = cw - PADDING * 2;
			const margin = (cw - mw) / 2;
			const vw = Math.max(mw, width) + (width > mw ? PADDING : 0);
			const pr = width > mw ? PADDING : 0;

			scroll.css({ width: cw - 4, marginLeft: -margin - 2, paddingLeft: margin });
			view.css({ width: vw, paddingRight: pr });

			stickyScrollRef.current?.resize({
				width: mw,
				left: margin,
				paddingLeft: margin,
				display: vw <= mw ? 'none' : '',
				trackWidth: vw,
			});
		} else
		if (parent && (parent.isPage() || parent.isLayoutDiv())) {
			const wrapper = $('#editorWrapper');
			const ww = wrapper.width();
			const margin = (cw - ww) / 2;

			scroll.css({ width: cw, marginLeft: -margin, paddingLeft: margin });
			view.css({ width: width + margin + 2 });
		};
	};

	if (!relation) {
		return (
			<Empty
				{...props}
				title={translate('blockDataviewBoardRelationDeletedTitle')}
				description={translate('blockDataviewBoardRelationDeletedDescription')}
				button={translate('blockDataviewBoardOpenViewMenu')}
				className="withHead"
				onClick={onViewSettings}
			/>
		);
	};

	const groups = getGroups(false);

	useImperativeHandle(ref, () => ({
		load,
		resize,
	}));

	return (
		<div
			ref={nodeRef}
			className="wrap"
		>
			<div id="scrollWrap" className="scrollWrap">
				<div ref={scrollRef} id="scroll" className="scroll">
					<div className={cn.join(' ')}>
						<div id="columns" className="columns">
							{groups.map((group: any, i: number) => (
								<Column
									key={`board-column-${group.id}`}
									ref={ref => columnRefs.current.set(group.id, ref)}
									{...props}
									{...group}
									onDragStartColumn={onDragStartColumn}
									onDragStartCard={onDragStartCard}
									getSubId={() => getSubId(group.id)}
								/>
							))}
						</div>
					</div>
				</div>
			</div>
			{!isInline ? <StickyScrollbar ref={stickyScrollRef} /> : ''}
		</div>
	);	

}));

export default ViewBoard;