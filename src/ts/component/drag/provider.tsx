import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { DragLayer } from 'ts/component';
import { I, C, focus, keyboard, Util } from 'ts/lib';
import { blockStore } from 'ts/store';
import { observer } from 'mobx-react';
import { throttle } from 'lodash';

interface Props extends RouteComponentProps<any> {
	dataset?: any;
	rootId: string;
};

const $ = require('jquery');
const THROTTLE = 20;

@observer
class DragProvider extends React.Component<Props, {}> {
	
	refLayer: any = null;
	type: string = '';
	ids: string[] = [];
	map: any;
	commonDropPrevented: boolean = false;
	
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
		if (this.commonDropPrevented || !e.dataTransfer.files || !e.dataTransfer.files.length) {
			return;
		};
		
		const { rootId } = this.props;
		const paths: string[] = [];
		for (let file of e.dataTransfer.files) {
			paths.push(file.path);
		};
			
		console.log('[selection.onDrop] paths', paths);
			
		C.ExternalDropFiles(rootId, '', I.BlockPosition.Bottom, paths);
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
		
		console.log('[onDragStart]', type, ids);
		
		this.map = blockStore.getMap(rootId);
		this.refLayer.show(type, ids, component);
		this.set(type, ids);
		this.unbind();
		this.setDragImage(e);
		keyboard.setDrag(true);
		Util.linkPreviewHide(false);
		
		win.on('dragend.drag', (e: any) => { this.onDragEnd(e); });
		win.on('drag.drag', throttle((e: any) => { this.onDragMove(e); }, THROTTLE));
		
		$('.colResize.active').removeClass('active');
		
		if (selection) {
			selection.set(this.ids);
			selection.hide();
			selection.preventSelect(true);
		};
	};
	
	onDragMove (e: any) {
		let x = e.pageX;
		let y = Math.max(0, e.pageY - $(window).scrollTop());
		
		this.refLayer.move(x, y);
	};
	
	onDragEnd (e: any) {
		const { dataset } = this.props;
		const { selection } = dataset || {};
		
		$('.block.isDragging').removeClass('isDragging');
		
		this.refLayer.hide();
		this.unbind();
		keyboard.setDrag(false);
		
		if (selection) {
			selection.preventSelect(false);
			selection.preventClear(false);
		};
	};
	
	onDrop (e: any, type: string, rootId: string, targetId: string, position: I.BlockPosition) {
		if (position == I.BlockPosition.None) {
			return;
		};
		
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
		};
		
		if (parent && parent.isLayoutColumn() && ([ I.BlockPosition.Left, I.BlockPosition.Right ].indexOf(position) >= 0)) {
			targetId = parent.id;
		};
		
		console.log('[onDrop]', type, targetId, this.type, this.ids, position);
		
		if (e.dataTransfer.files && e.dataTransfer.files.length) {
			this.commonDropPrevented = true;
			
			const paths: string[] = [];
			
			for (let file of e.dataTransfer.files) {
				paths.push(file.path);
			};
			
			console.log('[onDrop] paths', paths);
			
			C.ExternalDropFiles(contextId, targetId, position, paths, (message: any) => {
				this.commonDropPrevented = false;
			});
		} else {
			C.BlockListMove(contextId, targetContextId, this.ids || [], targetId, position, () => {
				if (selection) {
					selection.set(this.ids);
				};
			});
		};
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
	
};

export default DragProvider;