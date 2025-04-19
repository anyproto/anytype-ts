import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { throttle } from 'lodash';
import { DragLayer } from 'Component';
import { I, C, S, U, J, focus, keyboard, scrollOnMove, Action, Preview, analytics, Relation } from 'Lib';

interface Props {
	children?: React.ReactNode;
};

interface DragProviderRefProps {
	onDragStart: (e: any, dropType: I.DropType, ids: string[], component: any) => void;
	onScroll: () => void;
};

const OFFSET = 100;

const DragProvider = observer(forwardRef<DragProviderRefProps, Props>((props, ref: any) => {

	const { children } = props;
	const nodeRef = useRef(null);
	const layerRef = useRef(null);
	const isInitialised = useRef(false);
	const position = useRef(I.BlockPosition.None);
	const hoverData = useRef(null);
	const canDrop = useRef(false);
	const top = useRef(0);
	const frame = useRef(0);
	const objects = useRef(null);
	const objectData = useRef(new Map());
	const origin = useRef(null);

	const initData = () => {
		if (isInitialised.current) {
			return;
		};

		const isPopup = keyboard.isPopup();
		const container = $(isPopup ? '#popupPage-innerWrap' : '#root');

		clearState();
		isInitialised.current = true;
		objects.current = container.find('.dropTarget.isDroppable');

		objects.current.each((i: number, el: any) => {
			const item = $(el);
			const data = {
				id: item.attr('data-id'),
				rootId: item.attr('data-root-id'),
				cacheKey: item.attr('data-cache-key'),
				dropType: item.attr('data-drop-type'),
				type: item.attr('data-type'),
				style: item.attr('data-style'),
				targetContextId: item.attr('data-target-context-id'),
			};
			const offset = item.offset();
			const rect = el.getBoundingClientRect() as DOMRect;
			const x = offset.left;
			const width = rect.width;

			let y = offset.top;
			let height = rect.height;

			// Add block's paddings to height
			if ((data.dropType == I.DropType.Block) && (data.type != I.BlockType.Layout)) {
				const block = $(`#block-${data.id}`);
				if (block.length) {
					const top = parseInt(block.css('paddingTop'));
					const bot = parseInt(block.css('paddingBottom'));

					y -= top + 2;
					height += top + bot + 2;
				};
			};

			objectData.current.set(data.cacheKey, {
				...data,
				obj: item,
				index: i,
				x,
				y,
				width,
				height,
				isTargetTop: item.hasClass('targetTop'),
				isTargetBot: item.hasClass('targetBot'),
				isTargetCol: item.hasClass('targetCol'),
				isEmptyToggle: item.hasClass('emptyToggle'),
			});
		});
	};

	const onDropCommon = (e: any) => {
		e.preventDefault();

		if (keyboard.isCommonDropDisabled) {
			clearState();
			return;
		};

		const rootId = keyboard.getRootId();
		const root = S.Block.getLeaf(rootId, rootId);

		if (!root || root.isLocked()) {
			return;
		};

		const electron = U.Common.getElectron();
		const dataTransfer = e.dataTransfer;
		const items = U.Common.getDataTransferItems(dataTransfer.items);
		const isFileDrop = dataTransfer.files && dataTransfer.files.length;
		const last = S.Block.getFirstBlock(rootId, -1, it => it && it.canCreateBlock());

		let data: any = null;
		let targetId = '';
		let target: any = null;

		if (hoverData.current && (position.current != I.BlockPosition.None)) {
			data = hoverData.current;
		} else 
		if (last && isFileDrop) {
			data = objectData.current.get([ I.DropType.Block, last.id ].join('-'));
			position.current = I.BlockPosition.Bottom;
		};

		if (data) {
			targetId = String(data.id || '');
			target = S.Block.getLeaf(rootId, targetId);
		};

		// Last drop zone
		if (targetId == 'blockLast') {
			targetId = '';
			position.current = I.BlockPosition.Bottom;
		};

		// String items drop
		if (items && items.length) {
			U.Common.getDataTransferString(items, (html: string) => {
				C.BlockPaste(rootId, targetId, { from: 0, to: 0 }, [], false, { html }, '');
			});

			clearState();
			return;
		};

		if (isFileDrop) {
			const paths: string[] = [];
			for (const file of dataTransfer.files) {
				const path = electron.webFilePath(file);
				if (path) {
					paths.push(path);
				};
			};

			console.log('[DragProvider].onDrop paths', paths);

			C.FileDrop(rootId, targetId, position.current, paths, () => {
				if (target && target.isTextToggle() && (position.current == I.BlockPosition.InnerFirst)) {
					S.Block.toggle(rootId, targetId, true);
				};
			});
		} else
		if (data && canDrop && (position.current != I.BlockPosition.None)) {
			onDrop(e, data.dropType, targetId, position.current);
		};

		clearState();
	};

	const onDragStart = (e: any, dropType: I.DropType, ids: string[], component: any) => {
		const rootId = keyboard.getRootId();
		const isPopup = keyboard.isPopup();
		const selection = S.Common.getRef('selectionProvider');
		const win = $(window);
		const node = $(nodeRef.current);
		const container = U.Common.getScrollContainer(isPopup);
		const sidebar = $('#sidebarLeft');
		const layer = $('#dragLayer');
		const body = $('body');
		const dataTransfer = { rootId, dropType, ids, withAlt: e.altKey };

		origin.current = component;

		e.stopPropagation();
		focus.clear(true);

		console.log('[DragProvider].onDragStart', dropType, ids);

		top.current = container.scrollTop();
		layerRef.current.show(rootId, dropType, ids, component);
		setClass(ids);
		initData();
		unbind();

		e.dataTransfer.setDragImage(layer.get(0), 0, 0);
		e.dataTransfer.setData('text/plain', JSON.stringify(dataTransfer));
		e.dataTransfer.setData('data-' + JSON.stringify(dataTransfer), '1');

		node.addClass('isDragging');
		body.addClass('isDragging');
		
		keyboard.setDragging(true);
		keyboard.disableSelection(true);
		Preview.hideAll();

		win.on('drag.drag', e => onDrag(e));
		win.on('dragend.drag', e => onDragEnd(e));

		container.off('scroll.drag').on('scroll.drag', throttle(() => onScroll(), 20));
		sidebar.off('scroll.drag').on('scroll.drag', throttle(() => onScroll(), 20));

		$('.colResize.active').removeClass('active');
		scrollOnMove.onMouseDown(e, isPopup);

		if (dropType == I.DropType.Block) {
			selection?.set(I.SelectType.Block, ids);
		};
		selection?.hide();
	};

	const onDragOver = (e: any) => {
		if (keyboard.isCommonDropDisabled) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		initData();
		checkNodes(e, e.pageX, e.pageY);
	};

	const onDrag = (e: any) => {
		scrollOnMove.onMouseMove(e.clientX, e.clientY);
	};

	const onDragEnd = (e: any) => {
		const isPopup = keyboard.isPopup();
		const node = $(nodeRef.current);
		const container = U.Common.getScrollContainer(isPopup);
		const sidebar = $('#sidebarLeft');
		const body = $('body');

		layerRef.current.hide();
		clearState();
		clearStyle();
		unbind();

		keyboard.setDragging(false);
		keyboard.disableSelection(false);

		node.removeClass('isDragging');
		body.removeClass('isDragging');

		container.off('scroll.drag');
		sidebar.off('scroll.drag');

		$('.isDragging').removeClass('isDragging');
		scrollOnMove.onMouseUp(e);
	};

	const onDrop = (e: any, targetType: string, targetId: string, position: I.BlockPosition) => {
		const selection = S.Common.getRef('selectionProvider');

		let data: any = {};
		try { data = JSON.parse(e.dataTransfer.getData('text/plain')) || {}; } catch (e) {};

		const { rootId, dropType, withAlt } = data;
		const ids = data.ids || [];
		const contextId = rootId;

		if (!ids.length) {
			return;
		};

		let targetContextId = keyboard.getRootId();
		let isToggle = false;

		const processSourceBlock = () => {
			const cb = () => {
				if (isToggle && (position == I.BlockPosition.InnerFirst)) {
					S.Block.toggle(contextId, targetId, true);
				};

				selection?.renderSelection();
				raf(() => $('.resizable').trigger('resizeInit'));
			};

			if (withAlt) {
				Action.duplicate(contextId, targetContextId, targetId, ids, position, cb);
			} else {
				Action.move(contextId, targetContextId, targetId, ids, position, cb);
			};
		};

		const processAddRecord = () => {
			U.Object.getById(targetContextId, {}, (object) => {
				// Add to collection
				if (U.Object.isCollectionLayout(object.layout)) {
					C.ObjectCollectionAdd(targetContextId, ids);
				} else {
					ids.forEach((key: string) => {
						const newBlock = {
							type: I.BlockType.Link,
							content: {
								...U.Data.defaultLinkSettings(),
								targetBlockId: key,
							}
						};
						C.BlockCreate(targetContextId, targetId, position, newBlock);
					});
				};
			});
		};

		// DropTarget type
		switch (targetType) {
			case I.DropType.Block: {

				// Drop into column is targeting last block
				if (hoverData.current.isTargetCol) {
					const childrenIds = S.Block.getChildrenIds(targetContextId, targetId);
				
					targetId = childrenIds.length ? childrenIds[childrenIds.length - 1] : '';
				};

				const target = S.Block.getLeaf(targetContextId, targetId);
				
				if (target) {
					isToggle = target.isTextToggle();
		
					if ((target.isLink() || target.isBookmark()) && (position == I.BlockPosition.InnerFirst)) {
						targetContextId = target.getTargetObjectId();
						targetId = '';

						if (contextId == targetContextId) {
							console.log('[DragProvider].onDrop Contexts are equal');
							return;
						};
					} else {
						const parent = S.Block.getParentLeaf(targetContextId, targetId);

						if (parent && parent.isLayoutColumn() && ([ I.BlockPosition.Left, I.BlockPosition.Right ].indexOf(position) >= 0)) {
							targetId = parent.id;
						};
					};
				};

				// Source type
				switch (dropType) {
					case I.DropType.Block: {
						processSourceBlock();
						break;
					};

					case I.DropType.Relation: {
						const object = S.Detail.get(targetContextId, targetContextId);

						if (U.Object.isInFileLayouts(object.layout)) {
							const type = S.Record.getTypeById(object.type);

							if (!type) {
								break;
							};

							const list = Relation.getArrayValue(type.recommendedFileRelations);
							const idx = list.findIndex(id => id == targetId);
							const dir = position == I.BlockPosition.Bottom ? 1 : -1;

							if (idx < 0) {
								break;
							};

							for (let i = 0; i < ids.length; i++) {
								list.splice(Math.max(0, i + idx + dir), 0, ids[i]);
							};

							C.ObjectListSetDetails([ type.id ], [ { key: 'recommendedFileRelations', value: U.Common.arrayUnique(list) } ]);
						} else {
							const keys = ids.map(id => S.Record.getRelationById(id)?.relationKey).filter(it => it);

							keys.forEach((key: string) => {
								C.BlockCreate(targetContextId, targetId, position, { type: I.BlockType.Relation, content: { key } });
							});
						};
						break;
					};
				};

				break;
			};

			case I.DropType.Relation: {
				break;
			};

			case I.DropType.Menu: {
				targetContextId = targetId;
				targetId = '';

				// Source type
				switch (dropType) {
					case I.DropType.Block: {
						processSourceBlock();
						break;
					};

					case I.DropType.Record: {
						processAddRecord();
						break;
					};
				};
				break;
			};

			case I.DropType.Record: {

				switch (position) {
					case I.BlockPosition.Top:
					case I.BlockPosition.Bottom: {
						if (!origin.current) {
							break;
						};

						// Sort
						const { onRecordDrop } = origin.current;

						if (onRecordDrop) {
							onRecordDrop(targetId, ids);
						};
						break;
					};

					case I.BlockPosition.InnerFirst: {
						processAddRecord();
						break;
					};
				};

				break;
			};

			case I.DropType.Widget: {
				let create = false;
				let objectId = '';

				// Source type
				switch (dropType) {
					case I.DropType.Block: {
						const blocks = S.Block.getBlocks(contextId, it => ids.includes(it.id) && it.canBecomeWidget());
						if (!blocks.length) {
							break;
						};

						const block = blocks[0];
						if (block.isText()) {
							const marks = block.content.marks.filter(it => [ I.MarkType.Object, I.MarkType.Mention ].includes(it.type));
							if (!marks.length) {
								break;
							};

							objectId = marks[0].param;
						} else {
							objectId = block.getTargetObjectId();
						};

						if (objectId) {
							create = true;
						};
						break;
					};

					case I.DropType.Record: {
						objectId = ids[0];
						create = true;
						break;
					};
				};

				if (create) {
					Action.createWidgetFromObject(contextId, objectId, targetId, position, analytics.route.addWidgetDnD);
				};

				break;
			};

		};

		console.log('[DragProvider].onDrop from:', contextId, 'to: ', targetContextId);
	};

	const onScroll = () => {
		if (keyboard.isDragging) {
			for (const [ key, value ] of objectData.current) {
				const { left, top } = value.obj.offset();
				objectData.current.set(key, { ...value, x: left, y: top });
			};
		};
	};

	const checkNodes = (e: any, ex: number, ey: number) => {
		const dataTransfer = e.dataTransfer || e.originalEvent.dataTransfer;
		const isItemDrag = U.Common.getDataTransferItems(dataTransfer.items).length ? true : false;
		const isFileDrag = dataTransfer.types.includes('Files');
		let data: any = {};

		try {
			for (const type of dataTransfer.types) {
				if (type.match(/^data-/)) {
					data = JSON.parse(type.replace(/^data-/, ''));
					break;
				};
			};
		} catch (e) { };

		setHoverData(null);
		setPosition(I.BlockPosition.None);

		for (const [ key, value ] of objectData.current) {
			const { y, height, dropType } = value;

			let { x, width } = value;
			if (dropType == I.DropType.Block) {
				x -= OFFSET;
				width += OFFSET * 2;
			};

			if ((ex >= x) && (ex <= x + width) && (ey >= y) && (ey <= y + height)) {
				setHoverData(value);
				break;
			};
		};

		const hd = hoverData.current;
		const dropType = String(data.droptype) || '';
		const rootId = String(data.rootid) || '';
		const ids = data.ids || [];

		let x = 0;
		let y = 0;
		let width = 0;
		let height = 0;
		let isTargetTop = false;
		let isTargetBot = false;
		let isTargetCol = false;
		let isEmptyToggle = false;
		let obj = null;
		let type: any = '';
		let style = 0;
		let canDropMiddle = 0;
		let isReversed = false;
		let col1 = 0; 
		let col2 = 0;

		if (hd) {
			canDrop.current = true;

			if (!isFileDrag && (dropType == I.DropType.Block)) {
				canDrop.current = checkParentIds(ids, hd.id);
			};

			const initVars = () => {
				x = hd.x;
				y = hd.y;
				width = hd.width;
				height = hd.height;
				isTargetTop = hd.isTargetTop;
				isTargetBot = hd.isTargetBot;
				isTargetCol = hd.isTargetCol;
				isEmptyToggle = hd.isEmptyToggle;

				obj = $(hd.obj);
				type = obj.attr('data-type');
				style = Number(obj.attr('data-style')) || 0;
				canDropMiddle = Number(obj.attr('data-drop-middle')) || 0;
				isReversed = Boolean(obj.attr('data-reversed'));

				col1 = x - J.Size.blockMenu / 4;
				col2 = x + width;
			};

			initVars();

			if (ex <= col1) {
				setPosition(I.BlockPosition.Left);
			} else
			if ((ex > col1) && (ex <= col2)) {
				if (ey <= y + height * 0.3) {
					setPosition(I.BlockPosition.Top);
				} else
				if (ey >= y + height * 0.7) {
					setPosition(I.BlockPosition.Bottom);
				} else {
					setPosition(I.BlockPosition.InnerFirst);
				};
			} else
			if (ex > col2) {
				setPosition(I.BlockPosition.Right);
			};

			if (position.current == I.BlockPosition.Bottom) {
				const targetBot = objectData.current.get(hd + '-bot');
				if (targetBot) {
					setHoverData(targetBot);
					initVars();
				};
			};

			// canDropMiddle flag for restricted objects
			if ((position.current == I.BlockPosition.InnerFirst) && !canDropMiddle) {
				recalcPositionY(ey, y, height);
			};

			// Recalc position if dataTransfer items are dragged
			if (isItemDrag && (position.current != I.BlockPosition.None)) {
				recalcPositionY(ey, y, height);
			};

			// You can drop vertically on Layout.Row
			if ((type == I.BlockType.Layout) && (style == I.LayoutStyle.Row)) {
				if (isTargetTop) {
					setPosition(I.BlockPosition.Top);
				};
				if (isTargetBot) {
					setPosition(I.BlockPosition.Bottom);
				};
			};

			if (!isTargetBot &&
				[
					I.TextStyle.Paragraph, 
					I.TextStyle.Toggle, 
					I.TextStyle.Checkbox, 
					I.TextStyle.Numbered, 
					I.TextStyle.Bulleted, 
					I.TextStyle.Callout,
					I.TextStyle.Quote,
				].includes(style) && 
				(position.current == I.BlockPosition.Bottom)
			) {
				setPosition(I.BlockPosition.None);
			};

			if (position.current != I.BlockPosition.None) {

				// You can only drop inside of menu items
				if (hd.dropType == I.DropType.Menu) {
					setPosition(I.BlockPosition.InnerFirst);

					if (rootId == hd.targetContextId) {
						setPosition(I.BlockPosition.None);
					};
				};

				if (isTargetTop || (hd.id == 'blockLast')) {
					setPosition(I.BlockPosition.Top);
				};

				if (isTargetBot || isTargetCol) {
					setPosition(I.BlockPosition.Bottom);
				};

				if (isEmptyToggle) {
					setPosition(I.BlockPosition.InnerFirst);
				};
			};

			if ((dropType == I.DropType.Record) && (hd.dropType == I.DropType.Record) && !canDropMiddle) {
				isReversed ? recalcPositionX(ex, x, width) : recalcPositionY(ey, y, height);
			};

			if (hd.dropType == I.DropType.Widget) {
				recalcPositionY(ey, y, height);

				if (isTargetTop) {
					setPosition(I.BlockPosition.Top);
				};
				if (isTargetBot) {
					setPosition(I.BlockPosition.Bottom);
				};
			};
		};

		if (frame.current) {
			raf.cancel(frame.current);
		};

		frame.current = raf(() => {
			clearStyle();
			if ((position.current != I.BlockPosition.None) && canDrop.current && hd) {
				obj.addClass(`isOver ${getDirectionClass(position.current)}`);
			};
		});
	};

	const recalcPositionY = (ey: number, y: number, height: number) => {
		setPosition(ey <= y + height * 0.5 ? I.BlockPosition.Top : I.BlockPosition.Bottom);
	};

	const recalcPositionX = (ex: number, x: number, width: number) => {
		setPosition(ex <= x + width * 0.5 ? I.BlockPosition.Top : I.BlockPosition.Bottom);
	};

	const setClass = (ids: string[]) => {
		$('.block.isDragging').removeClass('isDragging');
		for (const id of ids) {
			$('#block-' + id).addClass('isDragging');
		};
	};

	const checkParentIds = (ids: string[], id: string): boolean => {
		const parentIds: string[] = [];

		getParentIds(id, parentIds);

		for (const dropId of ids) {
			if ((dropId == id) || (parentIds.length && parentIds.includes(dropId))) {
				return false;
			};
		};
		return true;
	};

	const getParentIds = (blockId: string, parentIds: string[]) => {
		const rootId = keyboard.getRootId();
		const item = S.Block.getMapElement(rootId, blockId);

		if (!item || (item.parentId == rootId)) {
			return;
		};

		parentIds.push(item.parentId);
		getParentIds(item.parentId, parentIds);
	};

	const getDirectionClass = (dir: I.BlockPosition) => {
		let c = '';
		switch (dir) {
			case I.BlockPosition.None:		 c = ''; break;
			case I.BlockPosition.Top:		 c = 'top'; break;
			case I.BlockPosition.Bottom:	 c = 'bottom'; break;
			case I.BlockPosition.Left:		 c = 'left'; break;
			case I.BlockPosition.Right:		 c = 'right'; break;
			case I.BlockPosition.Inner:
			case I.BlockPosition.InnerFirst: c = 'middle'; break;
		};
		return c;
	};

	const clearStyle = () => {
		$('.dropTarget.isOver').removeClass('isOver top bottom left right middle');
	};

	const clearState = () => {
		if (hoverData.current) {
			setHoverData(null);
		};

		clearStyle();
		setPosition(I.BlockPosition.None);

		isInitialised.current = false;
		objects.current = null;
		objectData.current.clear();
	};

	const setHoverData = (v: any) => {
		hoverData.current = v;
	};

	const setPosition = (v: I.BlockPosition) => {
		position.current = v;
	};

	const unbind = () => {
		$(window).off('drag.drag dragend.drag');
	};

	useImperativeHandle(ref, () => ({
		onDragStart,
		onScroll,
	}));

	return (
		<div
			ref={nodeRef}
			id="dragProvider" 
			className="dragProvider" 
			onDragOver={onDragOver} 
			onDrop={onDropCommon}
		>
			<DragLayer {...props} ref={layerRef} />
			{children}
		</div>
	);

}));

export default DragProvider;