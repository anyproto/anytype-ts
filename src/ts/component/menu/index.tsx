import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, Key, Util } from 'ts/lib';

import MenuHelp from './help';
import MenuAccount from './account';
import MenuSelect from './select';
import MenuSmile from './smile';
import MenuSmileSkin from './smile/skin';

import MenuBlockContext from './block/context';
import MenuBlockStyle from './block/style';
import MenuBlockAdd from './block/add';
import MenuBlockColor from './block/color';
import MenuBlockAction from './block/action';
import MenuBlockMore from './block/more';
import MenuBlockAlign from './block/align';

import MenuDataviewPropertyList from './dataview/property/list';
import MenuDataviewPropertyEdit from './dataview/property/edit';
import MenuDataviewPropertyType from './dataview/property/type';
import MenuDataviewFilter from './dataview/filter';
import MenuDataviewSort from './dataview/sort';
import MenuDataviewView from './dataview/view';
import MenuDataviewCalendar from './dataview/calendar';
import MenuDataviewTagList from './dataview/tag/list';
import MenuDataviewTagEdit from './dataview/tag/edit';
import MenuDataviewAccount from './dataview/account';

interface Props extends I.Menu {
	history: any;
};

const $ = require('jquery');
const raf = require('raf');
const BORDER = 12;

class Menu extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	
	constructor (props: any) {
		super(props);
		
		this.position = this.position.bind(this);
	};

	render () {
		const { id, param } = this.props;
		const { type, vertical, horizontal } = param;
		
		const Components: any = {
			help:					 MenuHelp,
			account:				 MenuAccount,
			select:					 MenuSelect,
			smile:					 MenuSmile,
			smileSkin:				 MenuSmileSkin,
			
			blockContext:			 MenuBlockContext,
			blockAction:			 MenuBlockAction,
			blockStyle:				 MenuBlockStyle,
			blockAdd:				 MenuBlockAdd,
			blockAddSub:			 MenuBlockAdd,
			blockColor:				 MenuBlockColor,
			blockMore:				 MenuBlockMore,
			blockAlign:				 MenuBlockAlign,
			
			dataviewPropertyList:	 MenuDataviewPropertyList,
			dataviewPropertyEdit:	 MenuDataviewPropertyEdit,
			dataviewPropertyType:	 MenuDataviewPropertyType,
			dataviewTagList:		 MenuDataviewTagList,
			dataviewTagEdit:		 MenuDataviewTagEdit,
			dataviewFilter:			 MenuDataviewFilter,
			dataviewSort:			 MenuDataviewSort,
			dataviewView:			 MenuDataviewView,
			dataviewCalendar:		 MenuDataviewCalendar,
			dataviewAccount:		 MenuDataviewAccount,
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
		
		const win = $(window);
		win.on('resize.menu', () => { this.position(); });
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
			window.setTimeout(() => { node.css({ transform: 'none' }); }, 210);
		});
	};
	
	position () {
		const { param } = this.props;
		const { element, vertical, horizontal, offsetX, offsetY } = param;
		
		raf(() => {
			if (!this._isMounted) {
				return;
			};
			
			const el = $(element.replace(/\//g, '\\/'));
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
			if (vertical == I.MenuDirection.Center) {
				y =  y - height / 2 + eh / 2 + offsetY;
			};
			if (vertical == I.MenuDirection.Bottom) {
				y += eh + offsetY;
			};
			
			if (horizontal == I.MenuDirection.Left) {
				x += offsetX;
			};
			if (horizontal == I.MenuDirection.Center) {
				x = x + ew / 2 - width / 2 + offsetX;
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