import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { MenuInterface } from 'ts/store/common';
import { MenuHelp } from 'ts/component';

const $ = require('jquery');
const raf = require('raf');
const BORDER = 12;

class Menu extends React.Component<MenuInterface, {}> {

	_isMounted: boolean = false;

	render () {
		const { id, param } = this.props;
		const Components: any = {
			help: MenuHelp
		};
		const Component = Components[id];
		const { type } = param;
		const cn = [ 'menu', 'menu-' + id, (type || 'vertical') ];
		
		return (
			<div className={cn.join(' ')}>
				<Component />
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.position();
	};
	
	componentDidUpdate () {
		this.position();
	};
	
	componentWillUnmount () {
	};
	
	position () {
		const { param } = this.props;
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		
		let { element, vertical, horizontal, offsetX, offsetY } = param;
		let el = $('#' + element);
		let ww = win.width();
		let wh = win.scrollTop() + win.height();
		
		offsetX = Number(offsetX) || 0;
		offsetY = Number(offsetY) || 0;
		vertical = vertical || 'bottom';
		horizontal = horizontal || 'left';
		
		raf(() => {
			const offset = el.offset();
			const width = node.outerWidth();
			const height = node.outerHeight();
			const ew = el.outerWidth();
			const eh = el.outerHeight();
			
			let x = offset.left;
			let y = offset.top;
			
			if (vertical == 'top') {
				y -= height + offsetY;
			};
			
			if (vertical == 'bottom') {
				y += eh + offsetY;
			};
			
			if (horizontal == 'left') {
				x += offsetX;
			};
			
			if (horizontal == 'right') {
				x -= width + offsetX - ew;
			};
			
			x = Math.max(BORDER, x);
			x = Math.min(ww - width - BORDER, x);
		
			y = Math.max(BORDER, y);
			y = Math.min(wh - height - BORDER, y);
			
			node.css({ left: x, top: y });
		});
	};
	
};

export default Menu;