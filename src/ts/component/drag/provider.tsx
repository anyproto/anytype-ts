import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { DragLayer } from 'ts/component';
import { I, C, focus, keyboard, Util, scrollOnMove, analytics } from 'ts/lib';
import { blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props {
	dataset?: any;
};

const $ = require('jquery');
const Constant = require('json/constant.json');

const OFFSET = 100;

const DragProvider = observer(class DragProvider extends React.Component<Props, {}> {

	refLayer: any = null;
	type: I.DragType = I.DragType.None;
	ids: string[] = [];
	commonDropPrevented: boolean = false;
	position: I.BlockPosition = I.BlockPosition.None;
	hoverData: any = null;
	canDrop: boolean = false;
	timeoutHover: number = 0;
	init: boolean = false;
	top: number = 0;

	objects: any = null;
	objectData: Map<string, any> = new Map();
	emptyObj: any = null;

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
		this.objects = node.find('.dropTarget.root-' + rootId);
		this.emptyObj = $('<div class="dragEmpty" />');
		this.emptyObj.css({ height: $('#dragLayer').height() });

		this.objects.each((i: number, el: any) => {
			const item = $(el);
			const data = item.data();
			const offset = item.offset();
			const rect = el.getBoundingClientRect() as DOMRect;

			let x = offset.left;
			let y = offset.top;
			let w = rect.width;
			let h = rect.height;
			let isTargetTop = item.hasClass('targetTop');
			let isTargetBot = item.hasClass('targetBot');
			let key = data.id;

			if (isTargetTop) key += '-top';
			if (isTargetBot) key += '-bot';

			// Add block's paddings to height
			if ((data.dropType == I.DragType.Block) && (data.type != I.BlockType.Layout)) {
				const block = $('#block-' + data.id);
				if (block.length) {
					const top = parseInt(block.css('paddingTop'));
					const bot = parseInt(block.css('paddingBottom'));

					y -= top + 2;
					h += top + bot + 2;
				};
			};

			this.objectData.set(key, {
				...data,
				obj: item,
				index: i,
				width: w,
				height: h,
				x: x,
				y: y,
				isTargetTop: isTargetTop,
				isTargetBot: isTargetBot,
			});
		});
	};

	onDropCommon (e: any) {
		if (this.commonDropPrevented) {
			this.clear();
			return;
		};

		const rootId = keyboard.getRootId();
		const root = blockStore.getLeaf(rootId, rootId);
		if (!root || root.isLocked()) {
			return;
		};

		const dt = (e.dataTransfer || e.originalEvent.dataTransfer);
		const isFileDrop = dt.files && dt.files.length;
		const last = blockStore.getFirstBlock(rootId, -1, (it: I.Block) => {
			return !it.isSystem() && !it.isLayoutFooter();
		});

		let position = this.position;
		let data: any = null;
		let targetId = '';
		let target: any = null;

		if (this.hoverData && (this.position != I.BlockPosition.None)) {
			data = this.hoverData;
		} else 
		if (last && isFileDrop) {
			data = this.objectData.get(last.id);
			position = I.BlockPosition.Bottom;
		};
		
		if (data) {
			targetId = String(data.id || '');
			target = blockStore.getLeaf(rootId, targetId);
		};
		
		if (isFileDrop) {
			let paths: string[] = [];
			for (let file of dt.files) {
				paths.push(file.path);
			};

			console.log('[dragProvider.onDrop] paths', paths);

			C.FileDrop(rootId, targetId, position, paths, () => {
				if (target && target.isTextToggle() && (position == I.BlockPosition.InnerFirst)) {
					blockStore.toggle(rootId, targetId, true);
				};
			});
		} else
		if (data && this.canDrop && (position != I.BlockPosition.None)) {
			this.onDrop(e, data.dropType, data.rootId, targetId, position);
		};

		this.clear();
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
		this.checkNodes(e.pageX, e.pageY + diff, isFileDrag);
	};

	onDragStart (e: any, type: I.DragType, ids: string[], component: any) {
		const { dataset } = this.props;
		const rootId = keyboard.getRootId();
		const isPopup = keyboard.isPopup();
		const { selection } = dataset || {};
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const layer = $('#dragLayer');
		const body = $('body');

		e.stopPropagation();
		focus.clear(true);

		console.log('[dragProvider.onDragStart]', type, ids);

		this.top = Util.getScrollContainer(isPopup).scrollTop();
		this.refLayer.show(rootId, type, ids, component);
		this.set(type, ids);
		this.unbind();
		this.initData();

		e.dataTransfer.setDragImage(layer.get(0), 0, 0);
		node.addClass('isDragging');
		body.addClass('isDragging');
		keyboard.setDrag(true);
		Util.previewHide(false);

		win.on('drag.drag', (e: any) => { this.onDragMove(e); });
		win.on('dragend.drag', (e: any) => { this.onDragEnd(e); });

		$('.colResize.active').removeClass('active');
		scrollOnMove.onMouseDown(e, isPopup);

		if (selection) {
			if (type == I.DragType.Block) {
				selection.set(I.SelectType.Block, this.ids);
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

		this.checkNodes(e.pageX, e.pageY + diff, isFileDrag);
		scrollOnMove.onMouseMove(e.clientX, e.clientY);
	};

	onDragEnd (e: any) {
		const { dataset } = this.props;
		const { selection } = dataset || {};
		const node = $(ReactDOM.findDOMNode(this));
		const body = $('body');

		this.refLayer.hide();
		this.unbind();
		this.clear();

		keyboard.setDrag(false);
		node.removeClass('isDragging');
		body.removeClass('isDragging');

		if (selection) {
			selection.preventSelect(false);
			selection.preventClear(false);
		};

		$('.block.isDragging').removeClass('isDragging');
		scrollOnMove.onMouseUp(e);
	};

	onDrop (e: any, type: string, rootId: string, targetId: string, position: I.BlockPosition) {
		const { dataset } = this.props;
		const { selection } = dataset || {};
		const target = blockStore.getLeaf(rootId, targetId);

		if (!target) {
			console.log('[dragProvider.onDrop] No target', target);
			return;
		};

		if (selection) {
			selection.preventClear(false);
		};

		console.log('[dragProvider.onDrop]', type, targetId, this.type, this.ids, position);

		let targetContextId = rootId;
		let contextId = rootId;

		if (target.isLink() && (position == I.BlockPosition.InnerFirst)) {
			contextId = keyboard.getRootId();
			targetContextId = target.content.targetBlockId;
			targetId = '';

			if (contextId == targetContextId) {
				console.log('[dragProvider.onDrop] Contexts are equal');
				return;
			};
		} else {
			const element = blockStore.getMapElement(rootId, targetId);
			const parent = blockStore.getLeaf(rootId, element.parentId);

			if (parent && parent.isLayoutColumn() && ([ I.BlockPosition.Left, I.BlockPosition.Right ].indexOf(position) >= 0)) {
				targetId = parent.id;
			};	
		};

		switch (this.type) {
			default:
				C.BlockListMoveToExistingObject(contextId, targetContextId, this.ids || [], targetId, position, () => {
					if (target.isTextToggle() && (position == I.BlockPosition.InnerFirst)) {
						blockStore.toggle(rootId, targetId, true);
					};

					if (selection) {
						selection.renderSelection();
					};

					analytics.event('ReorderBlock', { count: this.ids.length });
				});
				break;

			case I.DragType.Relation:
				this.ids.forEach((key: string) => {
					let param: any = {
						type: I.BlockType.Relation,
						content: { key }
					};

					C.BlockCreate(param, targetContextId, targetId, position,);
				});
				break;
		};
	};

	checkNodes (ex: number, ey: number, isFileDrag: boolean) {
		const rootId = keyboard.getRootId();

		this.hoverData = null;
		this.position = I.BlockPosition.None;

		if (this.emptyObj) {
			this.emptyObj.remove();
		};

		this.objectData.forEach((value: any) => {
			let { x, y, width, height, dropType } = value;

			if (dropType == I.DragType.Block) {
				x -= OFFSET;
				width += OFFSET * 2;
			};

			if ((ex >= x) && (ex <= x + width) && (ey >= y) && (ey <= y + height)) {
				this.hoverData = value;
			};
		});

		this.canDrop = true;

		if (this.hoverData) {
			if (!isFileDrag && (this.type == I.DragType.Block)) {
				let parentIds: string[] = [];
				this.getParentIds(rootId, this.hoverData.id, parentIds);

				for (let dropId of this.ids) {
					if ((dropId == this.hoverData.id) || (parentIds.length && (parentIds.indexOf(dropId) >= 0))) {
						this.canDrop = false;
						break;
					};
				};
			};

			const { x, y, width, height } = this.hoverData;
			const obj = $(this.hoverData.obj);
			const type = obj.attr('data-type');
			const style = Number(obj.attr('data-style')) || 0;
			const canDropMiddle = Number(obj.attr('data-drop-middle')) || 0;
			const col1 = x - Constant.size.blockMenu / 4;
			const col2 = x + width;
			const isText = type == I.BlockType.Text;
			const isFeatured = type == I.BlockType.Featured;
			const isType = type == I.BlockType.Type;

			if (ex <= col1) {
				this.position = I.BlockPosition.Left;
			} else
			if ((ex > col1) && (ex <= col2)) {
				if (ey <= y + height * 0.15) {
					this.position = I.BlockPosition.Top;
				} else
				if (ey >= y + height * 0.85) {
					this.position = I.BlockPosition.Bottom;
				} else {
					this.position = I.BlockPosition.InnerFirst;
				};
			} else
			if (ex > col2) {
				this.position = I.BlockPosition.Right;
			};

			const recalcPosition = () => {
				if (ey <= y + height * 0.5) {
					this.position = I.BlockPosition.Top;
				} else
				if (ey >= y + height * 0.5) {
					this.position = I.BlockPosition.Bottom;
				};
			};

			// canDropMiddle flag for restricted objects
			if ((this.position == I.BlockPosition.InnerFirst) && !canDropMiddle) {
				recalcPosition();
			};

			// You can't drop on Icon
			if ([ I.BlockType.IconPage, I.BlockType.IconUser ].indexOf(type) >= 0) {
				this.position = I.BlockPosition.None;
			};

			// You can't drop on Title and Description
			if (isText && ([ I.TextStyle.Title, I.TextStyle.Description ].indexOf(style) >= 0)) {
				this.position = I.BlockPosition.None;
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
				([ I.BlockType.Text, I.BlockType.Link ].indexOf(type) < 0)
			) {
				recalcPosition();
			};

			// You can't drop on Featured or Type
			if (isFeatured || isType) {
				this.position = I.BlockPosition.None;
			};

			// You can drop vertically on Layout.Row
			if ((type == I.BlockType.Layout) && (style == I.LayoutStyle.Row)) {
				if (this.hoverData.isTargetTop) {
					this.position = I.BlockPosition.Top;
				};
				if (this.hoverData.isTargetBot) {
					this.position = I.BlockPosition.Bottom;
				};
			};

			// You can only drop inside of menu items
			if ((this.hoverData.dropType == I.DragType.Menu) && (this.position != I.BlockPosition.None)) {
				this.position = I.BlockPosition.InnerFirst;

				if (rootId == this.hoverData.targetContextId) {
					this.position = I.BlockPosition.None;
				};
			};

			if (!obj.hasClass('targetBot') && 
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
				this.position = I.BlockPosition.None;
			};

			if (obj.hasClass('targetTop') && (this.position != I.BlockPosition.None)) {
				this.position = I.BlockPosition.Top;
			};

			if (obj.hasClass('targetBot') && (this.position != I.BlockPosition.None)) {
				this.position = I.BlockPosition.Bottom;
			};
		};

		window.clearTimeout(this.timeoutHover);
		if ((this.position != I.BlockPosition.None) && this.canDrop) {
			$('.dropTarget.isOver').removeClass('isOver top bottom left right middle');
			this.hoverData.obj.addClass('isOver ' + this.getDirectionClass(this.position));
		} else {
			this.timeoutHover = window.setTimeout(() => {
				$('.dropTarget.isOver').removeClass('isOver top bottom left right middle');
			}, 10);
		};
	}; 

	unbind () {
		$(window).unbind('dragend.drag drag.drag');
	};

	set (type: I.DragType, ids: string[]) {
		this.type = type;
		this.ids = ids.map((id: any) => { return id.toString(); });

		$('.block.isDragging').removeClass('isDragging');
		for (let id of this.ids) {
			$('#block-' + id).addClass('isDragging');
		};
	};

	getParentIds (rootId: string, blockId: string, parentIds: string[]) {
		const item = blockStore.getMapElement(rootId, blockId);
		if (!item || (item.parentId == rootId)) {
			return;
		};

		parentIds.push(item.parentId);
		this.getParentIds(rootId, item.parentId, parentIds);
	};

	getDirectionClass (dir: I.BlockPosition) {
		let c = '';
		switch (dir) {
			case I.BlockPosition.None:	 c = ''; break;
			case I.BlockPosition.Top:	 c = 'top'; break;
			case I.BlockPosition.Bottom: c = 'bottom'; break;
			case I.BlockPosition.Left:	 c = 'left'; break;
			case I.BlockPosition.Right:	 c = 'right'; break;
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

	clear () {
		if (this.emptyObj) {
			this.emptyObj.remove();
			this.emptyObj = null;
		};

		if (this.hoverData) {
			this.hoverData.obj.removeClass('isOver top bottom left right middle');
			this.hoverData = null;
		};

		this.init = false;
		this.position = I.BlockPosition.None;
		this.objects = null;
		this.objectData.clear();
	};

});

export default DragProvider;
