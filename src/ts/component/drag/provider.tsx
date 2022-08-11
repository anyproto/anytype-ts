import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { DragLayer } from 'Component';
import { I, C, focus, keyboard, Util, scrollOnMove, analytics } from 'Lib';
import { blockStore } from 'Store';
import { observer } from 'mobx-react';
import { throttle } from 'lodash';

interface Props {
	dataset?: any;
};

const $ = require('jquery');
const raf = require('raf');
const Constant = require('json/constant.json');

const OFFSET = 100;

const DragProvider = observer(class DragProvider extends React.Component<Props, {}> {

	refLayer: any = null;
	commonDropPrevented: boolean = false;
	position: I.BlockPosition = I.BlockPosition.None;
	hoverData: any = null;
	canDrop: boolean = false;
	init: boolean = false;
	top: number = 0;
	frame: number = 0;

	objects: any = null;
	objectData: Map<string, any> = new Map();

	constructor (props: any) {
		super(props);

		this.onDragOver = this.onDragOver.bind(this);
		this.onDragStart = this.onDragStart.bind(this);
		this.onDragMove = this.onDragMove.bind(this);
		this.onDragEnd = this.onDragEnd.bind(this);
		this.onDropCommon = this.onDropCommon.bind(this);
		this.onDrop = this.onDrop.bind(this);
		this.preventCommonDrop = this.preventCommonDrop.bind(this);
	};

	render () {
		const children = this.injectProps(this.props.children);
		return (
			<div id="dragProvider" className="dragProvider" onDragOver={this.onDragOver} onDrop={this.onDropCommon}>
				<DragLayer {...this.props} ref={(ref: any) => { this.refLayer = ref; }} />
				{children}
			</div>
		);
	};

	initData () {
		if (this.init) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const rootId = keyboard.getRootId();

		this.init = true;
		this.objects = node.find('.dropTarget.isDroppable.root-' + rootId);
		
		this.objects.each((i: number, el: any) => {
			const item = $(el);
			const data = item.data();
			const offset = item.offset();
			const rect = el.getBoundingClientRect() as DOMRect;

			const isTargetTop = item.hasClass('targetTop');
			const isTargetBot = item.hasClass('targetBot');
			const isTargetCol = item.hasClass('targetCol');

			let x = offset.left;
			let y = offset.top;
			let { width, height } = rect;

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
			});
		});
	};

	onDropCommon (e: any) {
		if (this.commonDropPrevented) {
			this.clearState();
			return;
		};

		const rootId = keyboard.getRootId();
		const root = blockStore.getLeaf(rootId, rootId);

		if (!root || root.isLocked()) {
			return;
		};

		const dt = (e.dataTransfer || e.originalEvent.dataTransfer);
		const isFileDrop = dt.files && dt.files.length;
		const last = blockStore.getFirstBlock(rootId, -1, it => it.canCreateBlock());

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

		if (isFileDrop) {
			let paths: string[] = [];
			for (let file of dt.files) {
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

	onDragOver (e: any) {
		if (this.commonDropPrevented) {
			return;
		};

		e.preventDefault();
   		e.stopPropagation();

		const isPopup = keyboard.isPopup();
		const dt = (e.dataTransfer || e.originalEvent.dataTransfer);
		const isFileDrag = dt.types.indexOf('Files') >= 0;
		const top = Util.getScrollContainer(isPopup).scrollTop();
		const diff = isPopup ? Math.abs(top - this.top) * (top > this.top ? 1 : -1) : 0;

		this.initData();
		this.checkNodes(e, e.pageX, e.pageY + diff, isFileDrag);
	};

	onDragStart (e: any, type: I.DropType, ids: string[], component: any) {
		const { dataset } = this.props;
		const rootId = keyboard.getRootId();
		const isPopup = keyboard.isPopup();
		const { selection } = dataset || {};
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const container = Util.getScrollContainer(isPopup);
		const sidebar = $('#sidebar');
		const layer = $('#dragLayer');
		const body = $('body');

		e.stopPropagation();
		focus.clear(true);

		console.log('[DragProvider].onDragStart', type, ids);

		this.top = container.scrollTop();
		this.refLayer.show(rootId, type, ids, component);
		this.setClass(ids);
		this.unbind();
		this.initData();

		e.dataTransfer.setDragImage(layer.get(0), 0, 0);
		e.dataTransfer.setData('application/json', JSON.stringify({
			rootId,
			dropType: type,
			ids,
		}));

		node.addClass('isDragging');
		body.addClass('isDragging');
		keyboard.setDragging(true);
		Util.previewHide(false);

		win.on('drag.drag', (e: any) => { this.onDragMove(e); });
		win.on('dragend.drag', (e: any) => { this.onDragEnd(e); });

		container.off('scroll.drag').on('scroll.drag', throttle((e: any) => { this.onScroll(); }, 20));
		sidebar.off('scroll.drag').on('scroll.drag', throttle((e: any) => { this.onScroll(); }, 20));

		$('.colResize.active').removeClass('active');
		scrollOnMove.onMouseDown(e, isPopup);

		if (selection) {
			if (type == I.DropType.Block) {
				selection.set(I.SelectType.Block, ids);
			};
			selection.hide();
			selection.preventSelect(true);
		};
	};

	onDragMove (e: any) {
		const isPopup = keyboard.isPopup();
		const dt = (e.dataTransfer || e.originalEvent.dataTransfer);
		const isFileDrag = dt.types.indexOf('Files') >= 0;
		const top = Util.getScrollContainer(isPopup).scrollTop();
		const diff = isPopup ? Math.abs(top - this.top) * (top > this.top ? 1 : -1) : 0;

		this.checkNodes(e, e.pageX, e.pageY + diff, isFileDrag);
		scrollOnMove.onMouseMove(e.clientX, e.clientY);
	};

	onDragEnd (e: any) {
		const { dataset } = this.props;
		const { selection } = dataset || {};
		const isPopup = keyboard.isPopup();
		const node = $(ReactDOM.findDOMNode(this));
		const container = Util.getScrollContainer(isPopup);
		const sidebar = $('#sidebar');
		const body = $('body');

		this.refLayer.hide();
		this.unbind();
		this.clearState();

		keyboard.setDragging(false);
		node.removeClass('isDragging');
		body.removeClass('isDragging');

		container.off('scroll.drag');
		sidebar.off('scroll.drag');

		if (selection) {
			selection.preventSelect(false);
			selection.preventClear(false);
		};

		$('.isDragging').removeClass('isDragging');
		scrollOnMove.onMouseUp(e);
	};

	onDrop (e: any, type: string, targetId: string, position: I.BlockPosition) {
		const { dataset } = this.props;
		const { selection } = dataset || {};
		
		if (selection) {
			selection.preventClear(false);
		};

		let data: any = {};
		try { data = JSON.parse(e.dataTransfer.getData('application/json')) || {}; } catch (e) {};

		let { rootId, dropType, ids } = data;
		let contextId = rootId;
		let targetContextId = keyboard.getRootId();
		let isToggle = false;

		// DropTarget type
		switch (type) {
			case I.DropType.Block:
				const target = blockStore.getLeaf(targetContextId, targetId);
				
				if (!target) {
					console.log('[DragProvider].onDrop No target', target);
					break;
				};

				isToggle = target.isTextToggle();
		
				if (target.isLink() && (position == I.BlockPosition.InnerFirst)) {
					targetContextId = target.content.targetBlockId;
					targetId = '';

					if (contextId == targetContextId) {
						console.log('[DragProvider].onDrop Contexts are equal');
						return;
					};
				} else {
					const element = blockStore.getMapElement(targetContextId, targetId);
					const parent = blockStore.getLeaf(targetContextId, element.parentId);

					if (parent && parent.isLayoutColumn() && ([ I.BlockPosition.Left, I.BlockPosition.Right ].indexOf(position) >= 0)) {
						targetId = parent.id;
					};
				};
				break;

			case I.DropType.Relation:
				break;

			case I.DropType.Menu:
				targetContextId = targetId;
				targetId = '';
				break;
		};

		console.log('[DragProvider].onDrop from:', contextId, 'to: ', targetContextId);

		// Source type
		switch (dropType) {
			case I.DropType.Block:
				C.BlockListMoveToExistingObject(contextId, targetContextId, ids || [], targetId, position, () => {
					if (isToggle && (position == I.BlockPosition.InnerFirst)) {
						blockStore.toggle(rootId, targetId, true);
					};

					if (selection) {
						selection.renderSelection();
					};

					analytics.event('ReorderBlock', { count: ids.length });
				});
				break;

			case I.DropType.Relation:
				ids.forEach((key: string) => {
					C.BlockCreate(targetContextId, targetId, position, { type: I.BlockType.Relation, content: { key } });
				});
				break;
		};
	};

	onScroll () {
		if (!keyboard.isDragging) {
			return;
		};

		const isPopup = keyboard.isPopup();
		const container = Util.getScrollContainer(isPopup);
		const top = container.scrollTop();

		for (let [ key, value ] of this.objectData) {
			let rect = value.obj.get(0).getBoundingClientRect() as DOMRect;
			this.objectData.set(key, { ...value, y: rect.y + top });
		};
	};

	checkNodes (e, ex: number, ey: number, isFileDrag: boolean) {
		let data: any = {};
		try { data = JSON.parse(e.dataTransfer.getData('application/json')) || {}; } catch (e) {};

		this.setHoverData(null);
		this.setPosition(I.BlockPosition.None);

		for (let [ key, value ] of this.objectData) {
			let { x, y, width, height, dropType } = value;

			if (dropType == I.DropType.Block) {
				x -= OFFSET;
				width += OFFSET * 2;
			};

			if ((ex >= x) && (ex <= x + width) && (ey >= y) && (ey <= y + height)) {
				this.setHoverData(value);
				break;
			};
		};

		let { rootId, dropType, ids } = data;
		let x = 0;
		let y = 0;
		let width = 0;
		let height = 0;
		let isTargetTop = false;
		let isTargetBot = false;
		let isTargetCol = false;
		let obj = null;
		let type: any = '';
		let style = 0;
		let canDropMiddle = 0;

		let col1 = 0; 
		let col2 = 0;

		let isText = false;
		let isFeatured = false;
		let isType = false;

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

				obj = $(this.hoverData.obj);
				type = obj.attr('data-type');
				style = Number(obj.attr('data-style')) || 0;
				canDropMiddle = Number(obj.attr('data-drop-middle')) || 0;

				col1 = x - Constant.size.blockMenu / 4;
				col2 = x + width;

				isText = type == I.BlockType.Text;
				isFeatured = type == I.BlockType.Featured;
				isType = type == I.BlockType.Type;
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

			const recalcPosition = () => {
				if (ey <= y + height * 0.5) {
					this.setPosition(I.BlockPosition.Top);
				} else
				if (ey >= y + height * 0.5) {
					this.setPosition(I.BlockPosition.Bottom);
				};
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
				recalcPosition();
			};

			// You can't drop on Icon
			if ([ I.BlockType.IconPage, I.BlockType.IconUser ].indexOf(type) >= 0) {
				this.setPosition(I.BlockPosition.None);
			};

			// You can't drop on Title and Description
			if (isText && ([ I.TextStyle.Title, I.TextStyle.Description ].indexOf(style) >= 0)) {
				this.setPosition(I.BlockPosition.None);
			};

			// You can only drop into Paragraphs, Lists and Callout
			if (
				(this.position == I.BlockPosition.InnerFirst) &&
				isText &&
				([ 
					I.TextStyle.Paragraph, 
					I.TextStyle.Toggle, 
					I.TextStyle.Checkbox, 
					I.TextStyle.Numbered, 
					I.TextStyle.Bulleted, 
					I.TextStyle.Callout,
					I.TextStyle.Quote,
				].indexOf(style) < 0)
			) {
				recalcPosition();
			};

			// You can only drop into text blocks and links
			if (
				(this.position == I.BlockPosition.InnerFirst) &&
				![ I.BlockType.Text, I.BlockType.Link ].includes(type)
			) {
				recalcPosition();
			};

			// You can't drop on Featured or Type
			if (isFeatured || isType) {
				this.setPosition(I.BlockPosition.None);
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

			// You can only drop inside of menu items
			if ((this.hoverData.dropType == I.DropType.Menu) && (this.position != I.BlockPosition.None)) {
				this.setPosition(I.BlockPosition.InnerFirst);

				if (rootId == this.hoverData.targetContextId) {
					this.setPosition(I.BlockPosition.None);
				};
			};

			if ((this.hoverData.id == 'blockLast') && (this.position != I.BlockPosition.None)) {
				this.setPosition(I.BlockPosition.Top);
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
			(this.position == I.BlockPosition.Bottom)) {
				this.setPosition(I.BlockPosition.None);
			};

			if (isTargetTop && (this.position != I.BlockPosition.None)) {
				this.setPosition(I.BlockPosition.Top);
			};

			if ((isTargetBot || isTargetCol) && (this.position != I.BlockPosition.None)) {
				this.setPosition(I.BlockPosition.Bottom);
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

	unbind () {
		$(window).off('dragend.drag drag.drag');
	};

	setClass (ids: string[]) {
		$('.block.isDragging').removeClass('isDragging');
		for (let id of ids) {
			$('#block-' + id).addClass('isDragging');
		};
	};

	checkParentIds (ids: string[], id: string): boolean {
		let parentIds: string[] = [];
		this.getParentIds(id, parentIds);

		for (let dropId of ids) {
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

			let props = child.props || {};
			let children = props.children;
			let dataset = props.dataset || {};

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

});

export default DragProvider;
