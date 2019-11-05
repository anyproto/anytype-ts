import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { DragLayer } from 'ts/component';
import { I } from 'ts/lib';
import { throttle } from 'lodash';

interface Props {};

const $ = require('jquery');

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
			<div>
				<DragLayer ref={(ref: any) => { this.refLayer = ref; }} />
				{children}
			</div>
		);
	};
	
	onDragStart (e: any, type: string, ids: string[], component: any) {
		console.log('[onDragStart]', type, ids);
		
		this.type = type;
		this.ids = ids;
		
		this.refLayer.show(type, ids, component);
		this.unbind();
		this.setDragImage(e);
		
		let win = $(window);
		win.on('dragend.drag', (e: any) => { this.onDragEnd(e); });
		win.on('drag.drag', throttle((e: any) => { this.onDragMove(e); }, 10));
	};
	
	onDragMove (e: any) {
		let x = e.pageX;
		let y = e.pageY - $(window).scrollTop();
		
		this.refLayer.move(x, y);
	};
	
	onDragEnd (e: any) {
		console.log('[onDragEnd]');
		
		this.refLayer.hide();
		this.unbind();
	};
	
	onDrop (e: any, type: string, id: string) {
		console.log('[onDrop]', type, id, this.type, this.ids);
	};
	
	unbind () {
		$(window).unbind('dragend.drag drag.drag');	
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
			if (children) {
				child = React.cloneElement(child, { children: this.injectProps(children) });
			};
			
			return React.cloneElement(child, {
				dataset: {
					onDragStart: this.onDragStart,
					onDrop: this.onDrop,
				}
			});
		});
	};
	
};

export default DragProvider;