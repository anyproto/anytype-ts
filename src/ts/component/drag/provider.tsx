import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { DragLayer } from 'ts/component';
import { I } from 'ts/lib';
import { throttle } from 'lodash';

interface Props {
	dataset?: any;
};

const $ = require('jquery');
const THROTTLE = 20;

class DragProvider extends React.Component<Props, {}> {
	
	refLayer: any = null;
	type: string = '';
	ids: string[] = [];
	
	constructor (props: any) {
		super(props);
		
		this.onDragStart = this.onDragStart.bind(this);
		this.onDragMove = this.onDragMove.bind(this);
		this.onDragEnd = this.onDragEnd.bind(this);
		this.onDrop = this.onDrop.bind(this);
	};
	
	render () {
		const children = this.injectProps(this.props.children);
		
		return (
			<React.Fragment>
				<DragLayer ref={(ref: any) => { this.refLayer = ref; }} />
				{children}
			</React.Fragment>
		);
	};
	
	onDragStart (e: any, type: string, ids: string[], component: any) {
		const { dataset } = this.props;
		const { selection } = dataset;
		const win = $(window);
		
		e.stopPropagation();
		
		console.log('[onDragStart]', type, ids);
		
		this.set(type, ids);
		this.refLayer.show(type, this.ids, component);
		this.unbind();
		this.setDragImage(e);
		
		win.on('dragend.drag', (e: any) => { this.onDragEnd(e); });
		win.on('drag.drag', throttle((e: any) => { this.onDragMove(e); }, THROTTLE));
		
		if (selection) {
			selection.set(this.ids);
			selection.hide();
			selection.setBlocked(true);
		};
	};
	
	onDragMove (e: any) {
		let x = e.pageX;
		let y = e.pageY - $(window).scrollTop();
		
		this.refLayer.move(x, y);
	};
	
	onDragEnd (e: any) {
		const { dataset } = this.props;
		const { selection } = dataset;
		
		console.log('[onDragEnd]');
		
		$('.selectable.isDragging').removeClass('isDragging');
		
		this.refLayer.hide();
		this.unbind();
		
		if (selection) {
			selection.setBlocked(false);
		};
	};
	
	onDrop (e: any, type: string, id: string, direction: string) {
		console.log('[onDrop]', type, id, this.type, this.ids, direction);
	};
	
	unbind () {
		$(window).unbind('dragend.drag drag.drag');	
	};
	
	set (type: string, ids: string[]) {
		this.type = type;
		this.ids = ids.map((id: any) => { return id.toString(); });
		
		$('.selectable.isDragging').removeClass('isDragging');
		for (let id of this.ids) {
			$('.selectable.c' + id).addClass('isDragging');
		};
	};
	
	setDragImage (e: any) {
		let el = $('#emptyDragImage');
		
		if (!el.length) {
			el = $('<div id="emptyDragImage">');
			$('body').append(el);
		};
		
		e.dataTransfer.setDragImage(el.get(0), 0, 0);
	};
	
	injectProps (children: any) {
		return React.Children.map(children, (child: any) => {
			let children = child.props.children;
			let dataset = child.props.dataset || {};
			
			if (children) {
				child = React.cloneElement(child, { children: this.injectProps(children) });
			};
			
			dataset.onDragStart = this.onDragStart;
			dataset.onDrop = this.onDrop;
			
			return React.cloneElement(child, { dataset: dataset });
		});
	};
	
};

export default DragProvider;