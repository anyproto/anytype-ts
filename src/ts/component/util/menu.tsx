import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { MenuInterface, MenuDirection, MenuType } from 'ts/store/common';
import { MenuHelp } from 'ts/component';

const $ = require('jquery');
const raf = require('raf');
const BORDER = 12;

class Menu extends React.Component<MenuInterface, {}> {

	_isMounted: boolean = false;

	render () {
		const { id, param } = this.props;
		const { type } = param;
		const Components: any = {
			help: MenuHelp
		};
		const Component = Components[id];
		const cn = [ 
			'menu', 
			'menu-' + id, 
			(type == MenuType.Horizontal ? 'horizontal' : 'vertical') 
		];
		
		if (!Component) {
			return <div />
		};
		
		return (
			<div className={cn.join(' ')}>
				<Component {...this.props} />
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
	
	position () {
		if (!this._isMounted) {
			return;
		};
		
		const { param } = this.props;
		const { element, vertical, horizontal, offsetX, offsetY } = param;
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const el = $('#' + element);
		const ww = win.width();
		const wh = win.scrollTop() + win.height();
		
		raf(() => {
			const offset = el.offset();
			const width = node.outerWidth();
			const height = node.outerHeight();
			const ew = el.outerWidth();
			const eh = el.outerHeight();
			
			let x = offset.left;
			let y = offset.top;
			
			if (vertical == MenuDirection.Top) {
				y -= height + offsetY;
			};
			if (vertical == MenuDirection.Bottom) {
				y += eh + offsetY;
			};
			
			if (horizontal == MenuDirection.Left) {
				x += offsetX;
			};
			if (horizontal == MenuDirection.Right) {
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