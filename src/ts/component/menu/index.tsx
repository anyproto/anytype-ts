import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, Util } from 'ts/lib';

const $ = require('jquery');
const raf = require('raf');
const BORDER = 12;

import MenuHelp from './help';
import MenuAccount from './account';
import MenuPropertyList from './property/list';
import MenuFilter from './filter';
import MenuSort from './sort';
import MenuView from './view';

interface Props extends I.Menu {
	history: any;
};

class Menu extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	render () {
		const { id, param } = this.props;
		const { type, vertical, horizontal } = param;
		
		const Components: any = {
			help: MenuHelp,
			account: MenuAccount,
			propertyList: MenuPropertyList,
			filter: MenuFilter,
			sort: MenuSort,
			view: MenuView,
		};
		
		const menuId = Util.toCamelCase('menu-' + id);
		const Component = Components[id];
		const cn = [ 
			'menu', 
			menuId, 
			(type == I.MenuType.Horizontal ? 'horizontal' : 'vertical'),
			'v' + vertical,
			'h' + horizontal
		];
		
		if (!Component) {
			return <div>Component {id} not found</div>
		};
		
		return (
			<div id={menuId} className={cn.join(' ')}>
				<div className="content">
					<Component {...this.props} />
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.position();
		this.animate();
		this.unbind();
		
		$(window).on('resize.menu', () => { this.position(); });
	};
	
	componentDidUpdate () {
		this.position();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};
	
	unbind () {
		$(window).unbind('resize.menu');
	};
	
	animate () {
		raf(() => {
			if (!this._isMounted) {
				return;
			};
			
			const node = $(ReactDOM.findDOMNode(this)); 
			node.addClass('show');
			setTimeout(() => { node.css({ transform: 'none' }); }, 200);
		});
	};
	
	position () {
		const { param } = this.props;
		const { element, vertical, horizontal, offsetX, offsetY } = param;
		
		raf(() => {
			if (!this._isMounted) {
				return;
			};

			const el = $('#' + element);
			if (!el.length) {
				console.error('[Menu.position] element not found', element);
				return;
			};

			const win = $(window);			
			const node = $(ReactDOM.findDOMNode(this));
			const ww = win.width();
			const wh = win.scrollTop() + win.height();			
			const offset = el.offset();
			const width = node.outerWidth();
			const height = node.outerHeight();
			const ew = el.outerWidth();
			const eh = el.outerHeight();
			
			let x = offset.left;
			let y = offset.top;
			
			if (vertical == I.MenuDirection.Top) {
				y -= height + offsetY;
			};
			if (vertical == I.MenuDirection.Bottom) {
				y += eh + offsetY;
			};
			
			if (horizontal == I.MenuDirection.Left) {
				x += offsetX;
			};
			if (horizontal == I.MenuDirection.Right) {
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