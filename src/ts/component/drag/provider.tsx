import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { throttle } from 'lodash';
import { DragLayer } from 'Component';
import { I, C, focus, keyboard, UtilCommon, scrollOnMove, Action, Preview, UtilData, UtilObject, UtilMenu, analytics } from 'Lib';
import { blockStore, detailStore } from 'Store';
const Constant = require('json/constant.json');

interface Props {
	dataset?: I.Dataset;
	children?: React.ReactNode;
};

const OFFSET = 100;

const DragProvider = observer(class DragProvider extends React.Component<Props> {

	node: any = null;
	refLayer: any = null;
	commonDropPrevented = false;
	position: I.BlockPosition = I.BlockPosition.None;
	hoverData: any = null;
	canDrop = false;
	init = false;
	top = 0;
	frame = 0;

	objects: any = null;
	objectData: Map<string, any> = new Map();

	origin: any = null;

	constructor (props: Props) {
		super(props);

		this.onDragOver = this.onDragOver.bind(this);
		this.onDragStart = this.onDragStart.bind(this);
		this.onDragEnd = this.onDragEnd.bind(this);
		this.onDropCommon = this.onDropCommon.bind(this);
		this.onDrop = this.onDrop.bind(this);
		this.preventCommonDrop = this.preventCommonDrop.bind(this);
	};

	render () {
		const children = this.injectProps(this.props.children);

		return (
			<div
				ref={node => this.node = node}
				id="dragProvider" 
				className="dragProvider" 
				onDragOver={this.onDragOver} 
				onDrop={this.onDropCommon}
			>
				<DragLayer {...this.props} ref={ref => this.refLayer = ref} />
				{children}
			</div>
		);
	};

	initData () {
		if (this.init) {
			return;
		};

		const isPopup = keyboard.isPopup();
		const container = $(isPopup ? '#popupPage-innerWrap' : '.pageFlex');

		this.init = true;
		this.objects = container.find('.dropTarget.isDroppable');

		this.objects.each((i: number, el: any) => {
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

			const isTargetTop = item.hasClass('targetTop');
			const isTargetBot = item.hasClass('targetBot');
			const isTargetCol = item.hasClass('targetCol');
			const isEmptyToggle = item.hasClass('emptyToggle');
			const x = offset.left;
			const width = rect.width;

			let y = offset.top;
			let height = rect.height;

			// Add block's paddings to height
			if ((data.dropType == I.DropType.Block) && (data.type != I.BlockType.Layout)) {
				const block = $('#block-' + data.id);
				if (block.length) {
					const top = parseInt(block.css('paddingTop'));
					const bot = parseInt(block.css('paddingBottom'));

					y -= top + 2;
					height += top + bot + 2;
				};
			};

			this.objectData.set(data.cacheKey, {
				...data,
				obj: item,
				index: i,
				x,
				y,
				width,
				height,
				isTargetTop,
				isTargetBot,
				isTargetCol,
				isEmptyToggle,
			});
		});
	};

	onDropCommon (e: any) {
		e.preventDefault();

		if (this.commonDropPrevented) {
			this.clearState();
			return;
		};

		const rootId = keyboard.getRootId();
		const root = blockStore.getLeaf(rootId, rootId);

		if (!root || root.isLocked()) {
			return;
		};

		const dataTransfer = e.dataTransfer;
		const items = UtilCommon.getDataTransferItems(dataTransfer.items);
		const isFileDrop = dataTransfer.files && dataTransfer.files.length;
		const last = blockStore.getFirstBlock(rootId, -1, it => it && it.canCreateBlock());

		let position = this.position;
		let data: any = null;
		let targetId = '';
		let target: any = null;

		if (this.hoverData && (this.position != I.BlockPosition.None)) {
			data = this.hoverData;
		} else 
		if (last && isFileDrop) {
			data = this.objectData.get([ I.DropType.Block, last.id ].join('-'));
			position = I.BlockPosition.Bottom;
		};

		if (data) {
			targetId = String(data.id || '');
			target = blockStore.getLeaf(rootId, targetId);
		};

		// Last drop zone
		if (targetId == 'blockLast') {
			targetId = '';
			position = I.BlockPosition.Bottom;
		};

		// String items drop
		if (items && items.length) {
			UtilCommon.getDataTransferString(items, (html: string) => {
				C.BlockPaste(rootId, targetId, { from: 0, to: 0 }, [], false, { html }, '');
			});

			this.clearState();
			return;
		};

		if (isFileDrop) {
			const paths: string[] = [];
			for (const file of dataTransfer.files) {
				paths.push(file.path);
			};

			console.log('[DragProvider].onDrop paths', paths);

			C.FileDrop(rootId, targetId, position, paths, () => {
				if (target && target.isTextToggle() && (position == I.BlockPosition.InnerFirst)) {
					blockStore.toggle(rootId, targetId, true);
				};
			});
		} else
		if (data && this.canDrop && (position != I.BlockPosition.None)) {
			this.onDrop(e, data.dropType, targetId, position);
		};

		this.clearState();
	};

	onDragStart (e: any, dropType: I.DropType, ids: string[], component: any) {
		const { dataset } = this.props;
		const rootId = keyboard.getRootId();
		const isPopup = keyboard.isPopup();
		const { selection } = dataset || {};
		const win = $(window);
		const node = $(this.node);
		const container = UtilCommon.getScrollContainer(isPopup);
		const sidebar = $('#sidebar');
		const layer = $('#dragLayer');
		const body = $('body');
		const dataTransfer = { rootId, dropType, ids, withAlt: e.altKey };

		this.origin = component;

		e.stopPropagation();
		focus.clear(true);

		console.log('[DragProvider].onDragStart', dropType, ids);

		this.top = container.scrollTop();
		this.refLayer.show(rootId, dropType, ids, component);
		this.setClass(ids);
		this.initData();
		this.unbind();

		e.dataTransfer.setDragImage(layer.get(0), 0, 0);
		e.dataTransfer.setData('text/plain', JSON.stringify(dataTransfer));
		e.dataTransfer.setData('data-' + JSON.stringify(dataTransfer), '1');

		node.addClass('isDragging');
		body.addClass('isDragging');
		
		keyboard.setDragging(true);
		keyboard.disableSelection(true);
		Preview.hideAll();

		win.on('drag.drag', e => this.onDrag(e));
		win.on('dragend.drag', e => this.onDragEnd(e));

		container.off('scroll.drag').on('scroll.drag', throttle(() => this.onScroll(), 20));
		sidebar.off('scroll.drag').on('scroll.drag', throttle(() => this.onScroll(), 20));

		$('.colResize.active').removeClass('active');
		scrollOnMove.onMouseDown(e, isPopup);

		if (selection) {
			if (dropType == I.DropType.Block) {
				selection.set(I.SelectType.Block, ids);
			};
			selection.hide();
		};
	};

	onDragOver (e: any) {
		if (this.commonDropPrevented) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		this.initData();
		this.checkNodes(e, e.pageX, e.pageY);
	};

	onDrag (e: any) {
		scrollOnMove.onMouseMove(e.clientX, e.clientY);
	};

	onDragEnd (e: any) {
		const isPopup = keyboard.isPopup();
		const node = $(this.node);
		const container = UtilCommon.getScrollContainer(isPopup);
		const sidebar = $('#sidebar');
		const body = $('body');

		this.refLayer.hide();
		this.clearState();
		this.clearStyle();
		this.unbind();

		keyboard.setDragging(false);
		keyboard.disableSelection(false);

		node.removeClass('isDragging');
		body.removeClass('isDragging');

		container.off('scroll.drag');
		sidebar.off('scroll.drag');

		$('.isDragging').removeClass('isDragging');
		scrollOnMove.onMouseUp(e);
	};

	onDrop (e: any, targetType: string, targetId: string, position: I.BlockPosition) {
		const { dataset } = this.props;
		const { selection } = dataset || {};

		let data: any = {};
		try { data = JSON.parse(e.dataTransfer.getData('text/plain')) || {}; } catch (e) { /**/ };

		const { rootId, dropType, withAlt } = data;
		const ids = data.ids || [];

		if (!ids.length) {
			return;
		};

		const contextId = rootId;

		let targetContextId = keyboard.getRootId();
		let isToggle = false;

		const processSourceBlock = () => {
			const cb = () => {
				if (isToggle && (position == I.BlockPosition.InnerFirst)) {
					blockStore.toggle(contextId, targetId, true);
				};

				if (selection) {
					selection.renderSelection();
				};

				raf(() => $('.resizable').trigger('resizeInit'));
			};

			if (withAlt) {
				Action.duplicate(contextId, targetContextId, targetId, ids, position, cb);
			} else {
				Action.move(contextId, targetContextId, targetId, ids, position, cb);
			};
		};

		const processAddRecord = () => {
			UtilObject.getById(targetContextId, (object) => {
				// Add to collection
				if (object.layout == I.ObjectLayout.Collection) {
					C.ObjectCollectionAdd(targetContextId, ids);
				} else {
					ids.forEach((key: string) => {
						const newBlock = {
							type: I.BlockType.Link,
							content: {
								...UtilData.defaultLinkSettings(),
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
				if (this.hoverData.isTargetCol) {
					const childrenIds = blockStore.getChildrenIds(targetContextId, targetId);
				
					targetId = childrenIds.length ? childrenIds[childrenIds.length - 1] : '';
				};

				const target = blockStore.getLeaf(targetContextId, targetId);
				
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
						const parent = blockStore.getParentLeaf(targetContextId, targetId);

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
						ids.forEach((key: string) => {
							C.BlockCreate(targetContextId, targetId, position, { type: I.BlockType.Relation, content: { key } });
						});
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
						if (!this.origin) {
							break;
						};

						// Sort
						const { onRecordDrop } = this.origin;

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
						const blocks = blockStore.getBlocks(contextId, it => ids.includes(it.id) && it.canBecomeWidget());
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
					Action.createWidgetFromObject(contextId, objectId, targetId, position);
				};

				break;
			};

		};

		console.log('[DragProvider].onDrop from:', contextId, 'to: ', targetContextId);
	};

	onScroll () {
		if (keyboard.isDragging) {
			for (const [ key, value ] of this.objectData) {
				const { left, top } = value.obj.offset();
				this.objectData.set(key, { ...value, x: left, y: top });
			};
		};
	};

	checkNodes (e: any, ex: number, ey: number) {
		const dataTransfer = e.dataTransfer || e.originalEvent.dataTransfer;
		const isItemDrag = UtilCommon.getDataTransferItems(dataTransfer.items).length ? true : false;
		const isFileDrag = dataTransfer.types.includes('Files');
		let data: any = {};

		try {
			for (const type of dataTransfer.types) {
				if (type.match(/^data-/)) {
					data = JSON.parse(type.replace(/^data-/, ''));
					break;
				};
			};
		} catch (e) { /**/ };

		this.setHoverData(null);
		this.setPosition(I.BlockPosition.None);

		for (const [ key, value ] of this.objectData) {
			const { y, height, dropType } = value;

			let { x, width } = value;
			if (dropType == I.DropType.Block) {
				x -= OFFSET;
				width += OFFSET * 2;
			};

			if ((ex >= x) && (ex <= x + width) && (ey >= y) && (ey <= y + height)) {
				this.setHoverData(value);
				break;
			};
		};

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

		if (this.hoverData) {
			this.canDrop = true;

			if (!isFileDrag && (dropType == I.DropType.Block)) {
				this.canDrop = this.checkParentIds(ids, this.hoverData.id);
			};

			const initVars = () => {
				x = this.hoverData.x;
				y = this.hoverData.y;
				width = this.hoverData.width;
				height = this.hoverData.height;
				isTargetTop = this.hoverData.isTargetTop;
				isTargetBot = this.hoverData.isTargetBot;
				isTargetCol = this.hoverData.isTargetCol;
				isEmptyToggle = this.hoverData.isEmptyToggle;

				obj = $(this.hoverData.obj);
				type = obj.attr('data-type');
				style = Number(obj.attr('data-style')) || 0;
				canDropMiddle = Number(obj.attr('data-drop-middle')) || 0;
				isReversed = Boolean(obj.attr('data-reversed'));

				col1 = x - Constant.size.blockMenu / 4;
				col2 = x + width;
			};

			initVars();

			if (ex <= col1) {
				this.setPosition(I.BlockPosition.Left);
			} else
			if ((ex > col1) && (ex <= col2)) {
				if (ey <= y + height * 0.3) {
					this.setPosition(I.BlockPosition.Top);
				} else
				if (ey >= y + height * 0.7) {
					this.setPosition(I.BlockPosition.Bottom);
				} else {
					this.setPosition(I.BlockPosition.InnerFirst);
				};
			} else
			if (ex > col2) {
				this.setPosition(I.BlockPosition.Right);
			};

			if (this.position == I.BlockPosition.Bottom) {
				const targetBot = this.objectData.get(this.hoverData.cacheKey + '-bot');
				if (targetBot) {
					this.setHoverData(targetBot);
					initVars();
				};
			};

			// canDropMiddle flag for restricted objects
			if ((this.position == I.BlockPosition.InnerFirst) && !canDropMiddle) {
				this.recalcPositionY(ey, y, height);
			};

			// Recalc position if dataTransfer items are dragged
			if (isItemDrag && (this.position != I.BlockPosition.None)) {
				this.recalcPositionY(ey, y, height);
			};

			// You can drop vertically on Layout.Row
			if ((type == I.BlockType.Layout) && (style == I.LayoutStyle.Row)) {
				if (isTargetTop) {
					this.setPosition(I.BlockPosition.Top);
				};
				if (isTargetBot) {
					this.setPosition(I.BlockPosition.Bottom);
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
				(this.position == I.BlockPosition.Bottom)
			) {
				this.setPosition(I.BlockPosition.None);
			};

			if (this.position != I.BlockPosition.None) {

				// You can only drop inside of menu items
				if (this.hoverData.dropType == I.DropType.Menu) {
					this.setPosition(I.BlockPosition.InnerFirst);

					if (rootId == this.hoverData.targetContextId) {
						this.setPosition(I.BlockPosition.None);
					};
				};

				if (isTargetTop || (this.hoverData.id == 'blockLast')) {
					this.setPosition(I.BlockPosition.Top);
				};

				if (isTargetBot || isTargetCol) {
					this.setPosition(I.BlockPosition.Bottom);
				};

				if (isEmptyToggle) {
					this.setPosition(I.BlockPosition.InnerFirst);
				};
			};

			if ((dropType == I.DropType.Record) && (this.hoverData.dropType == I.DropType.Record) && !canDropMiddle) {
				isReversed ? this.recalcPositionX(ex, x, width) : this.recalcPositionY(ey, y, height);
			};

			if (this.hoverData.dropType == I.DropType.Widget) {
				this.recalcPositionY(ey, y, height);

				if (isTargetTop) {
					this.setPosition(I.BlockPosition.Top);
				};
				if (isTargetBot) {
					this.setPosition(I.BlockPosition.Bottom);
				};
			};
		};

		if (this.frame) {
			raf.cancel(this.frame);
		};

		this.frame = raf(() => {
			this.clearStyle();
			if ((this.position != I.BlockPosition.None) && this.canDrop && this.hoverData) {
				obj.addClass('isOver ' + this.getDirectionClass(this.position));
			};
		});
	};

	recalcPositionY = (ey: number, y: number, height: number) => {
		if (ey <= y + height * 0.5) {
			this.setPosition(I.BlockPosition.Top);
		} else
		if (ey >= y + height * 0.5) {
			this.setPosition(I.BlockPosition.Bottom);
		};
	};

	recalcPositionX = (ex: number, x: number, width: number) => {
		if (ex <= x + width * 0.5) {
			this.setPosition(I.BlockPosition.Top);
		} else
		if (ex >= x + width * 0.5) {
			this.setPosition(I.BlockPosition.Bottom);
		};
	};

	setClass (ids: string[]) {
		$('.block.isDragging').removeClass('isDragging');
		for (const id of ids) {
			$('#block-' + id).addClass('isDragging');
		};
	};

	checkParentIds (ids: string[], id: string): boolean {
		const parentIds: string[] = [];

		this.getParentIds(id, parentIds);

		for (const dropId of ids) {
			if ((dropId == id) || (parentIds.length && parentIds.includes(dropId))) {
				return false;
			};
		};
		return true;
	};

	getParentIds (blockId: string, parentIds: string[]) {
		const rootId = keyboard.getRootId();
		const item = blockStore.getMapElement(rootId, blockId);

		if (!item || (item.parentId == rootId)) {
			return;
		};

		parentIds.push(item.parentId);
		this.getParentIds(item.parentId, parentIds);
	};

	getDirectionClass (dir: I.BlockPosition) {
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

	injectProps (children: any) {
		return React.Children.map(children, (child: any) => {
			if (!child) {
				return null;
			};

			const props = child.props || {};
			const children = props.children;
			const dataset = props.dataset || {};

			if (children) {
				child = React.cloneElement(child, { children: this.injectProps(children) });
			};

			dataset.dragProvider = this;
			dataset.onDragStart = this.onDragStart;
			dataset.onDrop = this.onDrop;
			dataset.preventCommonDrop = this.preventCommonDrop;

			return React.cloneElement(child, { dataset: dataset });
		});
	};

	preventCommonDrop (v: boolean) {
		this.commonDropPrevented = Boolean(v);
	};

	clearStyle () {
		$('.dropTarget.isOver').removeClass('isOver top bottom left right middle');
	};

	clearState () {
		if (this.hoverData) {
			this.setHoverData(null);
		};

		this.clearStyle();
		this.setPosition(I.BlockPosition.None);

		this.init = false;
		this.objects = null;
		this.objectData.clear();
	};

	setHoverData (v: any) {
		this.hoverData = v;
	};

	setPosition (v: I.BlockPosition) {
		this.position = v;
	};

	unbind () {
		$(window).off('drag.drag dragend.drag');
	};

});

export default DragProvider;
