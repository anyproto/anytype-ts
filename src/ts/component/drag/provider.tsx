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

@observer
class DragProvider extends React.Component<Props, {}> {

	refLayer: any = null;
	type: string = '';
	ids: string[] = [];
	map: any;
	commonDropPrevented: boolean = false;
	position: I.BlockPosition = I.BlockPosition.None;
	hovered: any = null;
	canDrop: boolean = false;
	timeoutHover: number = 0;
	
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

	onDropCommon (e: any) {
		if (this.commonDropPrevented) {
			return;
		};

		const { rootId } = this.props;

		let data: any = {};
		if (this.hovered) {
			data = this.hovered.data();
		};
		let targetId = String(data.id || '');

		console.log(this.hovered, this.canDrop, this.position);

		if (e.dataTransfer.files && e.dataTransfer.files.length) {
			let paths: string[] = [];
			for (let file of e.dataTransfer.files) {
				paths.push(file.path);
			};
			console.log('[dragProvider.onDrop] paths', paths);
			C.ExternalDropFiles(rootId, targetId, this.position, paths);
		} else
		if (this.hovered && this.canDrop && (this.position != I.BlockPosition.None)) {
			this.onDrop (e, data.dropType, data.rootId, targetId, this.position);
		};

		this.clear();
	};

	onDragOver (e: any) {
		e.preventDefault();
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

		this.objects = $('.dropTarget');
		this.emptyObj = $('<div class="dragEmpty" />');
		this.emptyObj.css({ height: $('#dragLayer').height() });

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

		const x = e.pageX;
		const y = Math.max(0, e.pageY - $(window).scrollTop());
		const isFileDrag = e.originalEvent.dataTransfer.files && e.originalEvent.dataTransfer.files.length;

		this.refLayer.move(x, y);

		this.hovered = null;
		this.position = I.BlockPosition.None;

		let hoverRect: any = null;
		let prev: any = null;

		$('.dragEmpty').remove();

		// Find hovered block by mouse coords
		this.objects.each((i: number, item: any) => {
			let rect = item.getBoundingClientRect() as DOMRect;
			let data = $(item).data();

			if (data.dropType == I.DragItem.Block) {
				rect.x -= 100;
				rect.width += 200;
			};

			if ((x >= rect.x) && (x <= rect.x + rect.width) && (y >= rect.y) && (y <= rect.y + rect.height)) {
				prev = this.objects.get(i - 1);
				this.hovered = $(item);
				hoverRect = rect;
			};
		});

		this.canDrop = true;

		if (this.hovered) {
			const data = this.hovered.data();
			const checkRect: any = {
				x: hoverRect.x + hoverRect.width * 0.3,
				width: hoverRect.x + hoverRect.width * 0.6,

				y: hoverRect.y + hoverRect.height * 0.3 - 2,
				height: hoverRect.y + hoverRect.height * 0.7 + 2,
			};

			if (!isFileDrag && (this.type == I.DragItem.Block)) {
				let parentIds: string[] = [];
				this.getParentIds(data.id, parentIds);

				for (let dropId of this.ids) {
					if ((dropId == data.id) || (parentIds.length && (parentIds.indexOf(dropId) >= 0))) {
						this.canDrop = false;
						break;
					};
				};
			};

			if ((y >= hoverRect.y) && (y <= checkRect.y)) {
				this.position = I.BlockPosition.Top;
			} else
			if ((y >= checkRect.height) && (y <= hoverRect.y + hoverRect.height)) {
				this.position = I.BlockPosition.Bottom;
			} else
			if ((x >= hoverRect.x) && (x < checkRect.x) && (y > checkRect.y) && (y < checkRect.height)) {
				this.position = I.BlockPosition.Left;
			} else
			if ((x > checkRect.width) && (x <= hoverRect.x + hoverRect.width) && (y > checkRect.y) && (y < checkRect.height)) {
				this.position = I.BlockPosition.Right;
			} else
			if ((x > checkRect.x) && (x < checkRect.width) && (y > checkRect.y) && (y < checkRect.height)) {
				this.position = I.BlockPosition.Inner;
			};

			// You can't drop on Icon and Title
			if ([ I.BlockType.IconPage, I.BlockType.IconUser, I.BlockType.Title ].indexOf(data.type) >= 0) {
				this.position = I.BlockPosition.None;
			};

			// You cant drop in Headers
			if (
				(this.position == I.BlockPosition.Inner) &&
				(data.type == I.BlockType.Text) &&
				[ I.TextStyle.Header1, I.TextStyle.Header2, I.TextStyle.Header3, I.TextStyle.Header4 ].indexOf(data.style) >= 0
			) {
				this.position = I.BlockPosition.None;
			};

			// You can drop vertically on Layout.Row
			if ((data.type == I.BlockType.Layout) && (data.style == I.LayoutStyle.Row) && (this.position != I.BlockPosition.None)) {
				if (this.hovered.hasClass('targetTop')) {
					this.position = I.BlockPosition.Top;
				};
				if (this.hovered.hasClass('targetBot')) {
					this.position = I.BlockPosition.Bottom;
				};
			};

			// You can only drop inside of menu items
			if ((data.dropType == I.DragItem.Menu) && (this.position != I.BlockPosition.None)) {
				this.position = I.BlockPosition.Inner;

				if (rootId == data.targetContextId) {
					this.position = I.BlockPosition.None;
				};
			};
		};

		window.clearTimeout(this.timeoutHover);

		if (this.canDrop) {
			if ((this.position == I.BlockPosition.Top) && prev) {
				$(prev).after(this.emptyObj);
			};
			if ((this.position == I.BlockPosition.Bottom)) {
				this.hovered.after(this.emptyObj);
			};
		};

		if ((this.position != I.BlockPosition.None) && this.canDrop) {
			$('.dropTarget.isOver').removeClass('isOver top bottom left right middle');
			this.hovered.addClass('isOver ' + this.getDirectionClass(this.position));
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
				console.log('Contexts are equal');
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
		$(window).unbind('dragend.drag drag.drag');
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
		$('.dropTarget.isOver').removeClass('isOver top bottom left right middle');
		$('.dragEmpty').remove();

		this.hovered = null;
		this.position = I.BlockPosition.None;
	};

};

export default DragProvider;
