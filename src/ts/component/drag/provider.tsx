import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { DragLayer } from 'ts/component';
import { I, C, focus, keyboard, Util, scrollOnMove } from 'ts/lib';
import { blockStore } from 'ts/store';
import { observer } from 'mobx-react';
import { throttle } from 'lodash';

interface Props extends RouteComponentProps<any> {
	dataset?: any;
	rootId: string;
};

const raf = require('jquery');
const $ = require('jquery');
const THROTTLE = 20;
const OFFSET = 100;

@observer
class DragProvider extends React.Component<Props, {}> {

	refLayer: any = null;
	type: string = '';
	ids: string[] = [];
	map: any;
	commonDropPrevented: boolean = false;
	position: I.BlockPosition = I.BlockPosition.None;
	hoverData: any = null;
	canDrop: boolean = false;
	timeoutHover: number = 0;
	init: boolean = false;
	
	objects: any = null;
	objectData: any = {};
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
		const { rootId } = this.props;
		const children = this.injectProps(this.props.children);

		return (
			<div className="dragProvider" onDragOver={this.onDragOver} onDrop={this.onDropCommon}>
				<DragLayer {...this.props} ref={(ref: any) => { this.refLayer = ref; }} rootId={rootId} />
				{children}
			</div>
		);
	};

	initData () {
		if (this.init) {
			return;
		};

		this.init = true;
		this.objects = $('.dropTarget');
		this.emptyObj = $('<div class="dragEmpty" />');
		this.emptyObj.css({ height: $('#dragLayer').height() });

		this.objects.each((i: number, item: any) => {
			item = $(item);

			const data = item.data();
			const offset = item.offset();

			this.objectData[data.id] = {
				obj: item,
				index: i,
				width: item.width(),
				height: item.height(),
				x: offset.left,
				y: offset.top,
				...data
			};
		});
	};

	onDropCommon (e: any) {
		console.log(1111);
		if (this.commonDropPrevented) {
			return;
		};

		const { rootId } = this.props;
		const dt = (e.dataTransfer || e.originalEvent.dataTransfer);

		let data: any = {};
		if (this.hoverData) {
			data = this.hoverData;
		};
		let targetId = String(data.id || '');

		if (dt.files && dt.files.length) {
			let paths: string[] = [];
			for (let file of dt.files) {
				paths.push(file.path);
			};
			
			console.log('[dragProvider.onDrop] paths', paths);
			C.ExternalDropFiles(rootId, targetId, this.position, paths);
		} else
		if (this.hoverData && this.canDrop && (this.position != I.BlockPosition.None)) {
			this.onDrop (e, data.dropType, data.rootId, targetId, this.position);
		};

		this.clear();
	};

	onDragOver (e: any) {
		e.preventDefault();
   		e.stopPropagation();

		this.initData();
		this.onDragMove(e);
	};

	onDragStart (e: any, type: string, ids: string[], component: any) {
		const { rootId, dataset } = this.props;
		const { selection } = dataset || {};
		const win = $(window);

		e.stopPropagation();
		focus.clear(true);

		console.log('[dragProvider.onDragStart]', type, ids);

		this.map = blockStore.getMap(rootId);
		this.refLayer.show(type, ids, component);
		this.set(type, ids);
		this.unbind();
		this.setDragImage(e);
		this.initData();

		keyboard.setDrag(true);
		Util.linkPreviewHide(false);

		win.on('dragend.drag', (e: any) => { this.onDragEnd(e); });
		win.on('drag.drag', (e: any) => { this.onDragMove(e); });

		$('.colResize.active').removeClass('active');
		scrollOnMove.onMouseDown(e);

		if (selection) {
			selection.set(this.ids);
			selection.hide();
			selection.preventSelect(true);
		};
	};

	onDragMove (e: any) {
		const { rootId } = this.props;

		const st = $(window).scrollTop();
		const ex = e.pageX;
		const ey = e.pageY;
		const dt = (e.dataTransfer || e.originalEvent.dataTransfer);
		const isFileDrag = dt.types.indexOf('Files') >= 0;

		this.refLayer.move(ex, Math.max(0, ey - st));
		this.hoverData = null;
		this.position = I.BlockPosition.None;

		let prev: any = null;

		if (this.emptyObj) {
			this.emptyObj.remove();
		};

		for (let id in this.objectData) {
			const data = this.objectData[id];
			
			let { x, y, width, height } = data;
			
			if (data.dropType == I.DragItem.Block) {
				x -= OFFSET;
				width += OFFSET * 2;
			};

			if ((ex >= x) && (ex <= x + width) && (ey >= y) && (ey <= y + height)) {
				prev = this.objects.get(data.index - 1);
				this.hoverData = data;
			};
		};

		this.canDrop = true;

		if (this.hoverData) {
			let { x, y, width, height } = this.hoverData;

			if (this.hoverData.dropType == I.DragItem.Block) {
				x -= OFFSET;
				width += OFFSET * 2;
			};

			const checkRect: any = {
				x: x + width * 0.3,
				width: x + width * 0.6,
				y: y + height * 0.3 - 2,
				height: y + height * 0.7 + 2,
			};

			if (!isFileDrag && (this.type == I.DragItem.Block)) {
				let parentIds: string[] = [];
				this.getParentIds(this.hoverData.id, parentIds);

				for (let dropId of this.ids) {
					if ((dropId == this.hoverData.id) || (parentIds.length && (parentIds.indexOf(dropId) >= 0))) {
						this.canDrop = false;
						break;
					};
				};
			};

			if ((ey >= y) && (ey <= checkRect.y)) {
				this.position = I.BlockPosition.Top;
			} else
			if ((ey >= checkRect.height) && (ey <= y + height)) {
				this.position = I.BlockPosition.Bottom;
			} else
			if ((ex >= x) && (ex <= checkRect.x) && (ey >= checkRect.y) && (ey <= checkRect.height)) {
				this.position = I.BlockPosition.Left;
			} else
			if ((ex >= checkRect.width) && (ex <= x + width) && (ey >= checkRect.y) && (ey <= checkRect.height)) {
				this.position = I.BlockPosition.Right;
			} else
			if ((ex >= checkRect.x) && (ex <= checkRect.width) && (ey >= checkRect.y) && (ey <= checkRect.height)) {
				this.position = I.BlockPosition.Inner;
			};

			// You can't drop on Icon and Title
			if ([ I.BlockType.IconPage, I.BlockType.IconUser, I.BlockType.Title ].indexOf(this.hoverData.type) >= 0) {
				this.position = I.BlockPosition.None;
			};

			// You cant drop in Headers
			if (
				(this.position == I.BlockPosition.Inner) &&
				(this.hoverData.type == I.BlockType.Text) &&
				[ I.TextStyle.Header1, I.TextStyle.Header2, I.TextStyle.Header3, I.TextStyle.Header4 ].indexOf(this.hoverData.style) >= 0
			) {
				this.position = I.BlockPosition.None;
			};

			// You can drop vertically on Layout.Row
			if ((this.hoverData.type == I.BlockType.Layout) && (this.hoverData.style == I.LayoutStyle.Row) && (this.position != I.BlockPosition.None)) {
				if (this.hoverData.obj.hasClass('targetTop')) {
					this.position = I.BlockPosition.Top;
				};
				if (this.hoverData.obj.hasClass('targetBot')) {
					this.position = I.BlockPosition.Bottom;
				};
			};

			// You can only drop inside of menu items
			if ((this.hoverData.dropType == I.DragItem.Menu) && (this.position != I.BlockPosition.None)) {
				this.position = I.BlockPosition.Inner;

				if (rootId == this.hoverData.targetContextId) {
					this.position = I.BlockPosition.None;
				};
			};
		};

		window.clearTimeout(this.timeoutHover);

		/*
		if (this.canDrop) {
			if ((this.position == I.BlockPosition.Top) && prev) {
				$(prev).after(this.emptyObj);
			};
			if ((this.position == I.BlockPosition.Bottom)) {
				this.hovered.after(this.emptyObj);
			};
		};
		*/

		if ((this.position != I.BlockPosition.None) && this.canDrop) {
			$('.dropTarget.isOver').removeClass('isOver top bottom left right middle');
			this.hoverData.obj.addClass('isOver ' + this.getDirectionClass(this.position));
		} else {
			this.timeoutHover = window.setTimeout(() => {
				$('.dropTarget.isOver').removeClass('isOver top bottom left right middle');
			}, 10);
		};

		scrollOnMove.onMouseMove(e);
	};

	onDragEnd (e: any) {
		const { dataset } = this.props;
		const { selection } = dataset || {};

		this.refLayer.hide();
		this.unbind();
		this.clear();

		keyboard.setDrag(false);

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
		const map = blockStore.getMap(rootId);
		const element = map[targetId];

		console.log(targetId, position);

		if (!target || !element) {
			return;
		};

		const parent = blockStore.getLeaf(rootId, element.parentId);

		let targetContextId = rootId;
		let contextId = rootId;

		if (target.isLink() && (position == I.BlockPosition.Inner)) {
			contextId = this.props.rootId;
			targetContextId = target.content.targetBlockId;
			targetId = '';

			if (contextId == targetContextId) {
				console.log('[dragProvider.onDrop] Contexts are equal');
				return;
			};
		};

		if (parent && parent.isLayoutColumn() && ([ I.BlockPosition.Left, I.BlockPosition.Right ].indexOf(position) >= 0)) {
			targetId = parent.id;
		};

		console.log('[dragProvider.onDrop]', type, targetId, this.type, this.ids, position);

		C.BlockListMove(contextId, targetContextId, this.ids || [], targetId, position, () => {
			if (selection) {
				selection.set(this.ids);
			};
		});
	};

	unbind () {
		const win = $(window);
		win.unbind('dragend.drag drag.drag');
	};

	set (type: string, ids: string[]) {
		this.type = type;
		this.ids = ids.map((id: any) => { return id.toString(); });

		$('.block.isDragging').removeClass('isDragging');
		for (let id of this.ids) {
			$('#block-' + id).addClass('isDragging');
		};
	};

	getParentIds (id: string, parentIds: string[]) {
		const { rootId } = this.props;
		const item = this.map[id];

		if (!item || (item.parentId == rootId)) {
			return;
		};

		parentIds.push(item.parentId);
		this.getParentIds(item.parentId, parentIds);
	};

	getDirectionClass (dir: I.BlockPosition) {
		let c = '';
		switch (dir) {
			case I.BlockPosition.None:	 c = ''; break;
			case I.BlockPosition.Top:	 c = 'top'; break;
			case I.BlockPosition.Bottom: c = 'bottom'; break;
			case I.BlockPosition.Left:	 c = 'left'; break;
			case I.BlockPosition.Right:	 c = 'right'; break;
			case I.BlockPosition.Inner:	 c = 'middle'; break;
		};
		return c;
	};

	setDragImage (e: any) {
		let el = $('#emptyDragImage');

		if (!el.length) {
			el = $('<div id="emptyDragImage">');
			$('body').append(el);
		};

		el.css({ width: 1, height: 1, opacity: 0 });
		e.dataTransfer.setDragImage(el.get(0), 0, 0);
	};

	injectProps (children: any) {
		return React.Children.map(children, (child: any) => {
			let children = child.props.children;
			let dataset = child.props.dataset || {};

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
		this.objectData = {};
	};

};

export default DragProvider;
