import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, keyboard, Util } from 'ts/lib';

import MenuHelp from './help';
import MenuAccount from './account';
import MenuSelect from './select';
import MenuSmile from './smile';
import MenuSmileSkin from './smile/skin';

import MenuBlockContext from './block/context';
import MenuBlockStyle from './block/style';
import MenuBlockAdd from './block/add';
import MenuBlockColor from './block/color';
import MenuBlockBackground from './block/background';
import MenuBlockCover from './block/cover';
import MenuBlockAction from './block/action';
import MenuBlockMore from './block/more';
import MenuBlockAlign from './block/align';
import MenuBlockLink from './block/link';
import MenuBlockMention from './block/mention';

import MenuDataviewRelationList from './dataview/relation/list';
import MenuDataviewRelationEdit from './dataview/relation/edit';
import MenuDataviewRelationType from './dataview/relation/type';
import MenuDataviewFilter from './dataview/filter';
import MenuDataviewSort from './dataview/sort';
import MenuDataviewView from './dataview/view';
import MenuDataviewCalendar from './dataview/calendar';
import MenuDataviewTagList from './dataview/tag/list';
import MenuDataviewTagEdit from './dataview/tag/edit';
import MenuDataviewAccount from './dataview/account';
import MenuDataviewMore from './dataview/more';

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
		this.setActiveItem = this.setActiveItem.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
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
			blockColor:				 MenuBlockColor,
			blockBackground:		 MenuBlockBackground,
			blockMore:				 MenuBlockMore,
			blockAlign:				 MenuBlockAlign,
			blockLink:				 MenuBlockLink,
			blockCover:				 MenuBlockCover,
			blockMention:			 MenuBlockMention,
			
			dataviewRelationList:	 MenuDataviewRelationList,
			dataviewRelationEdit:	 MenuDataviewRelationEdit,
			dataviewRelationType:	 MenuDataviewRelationType,
			dataviewTagList:		 MenuDataviewTagList,
			dataviewTagEdit:		 MenuDataviewTagEdit,
			dataviewFilter:			 MenuDataviewFilter,
			dataviewSort:			 MenuDataviewSort,
			dataviewView:			 MenuDataviewView,
			dataviewCalendar:		 MenuDataviewCalendar,
			dataviewAccount:		 MenuDataviewAccount,
			dataviewMore:			 MenuDataviewMore,
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
		
		if (param.className) {
			cn.push(param.className);
		};
		
		return (
			<div id={menuId} className={cn.join(' ')} onMouseLeave={this.onMouseLeave}>
				<div className="content">
					<Component {...this.props} setActiveItem={this.setActiveItem} position={this.position} />
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
		const { param } = this.props;
		const { isSub } = param;
		
		this._isMounted = false;
		this.unbind();
		
		if (isSub) {
			$('#menu-polygon').hide();
		};
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
		const { id, param } = this.props;
		const { element, type, vertical, horizontal, offsetX, offsetY, forceX, forceY, isSub } = param;
		
		raf(() => {
			if (!this._isMounted) {
				return;
			};
			
			let el = null;
			if ('object' == typeof(element)) {
				el = $(element);
			} else {
				el = $(element.replace(/\//g, '\\/'));
			};
			
			if (!el || !el.length) {
				console.error('[Menu.position]', id, 'element not found', element);
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

			switch (vertical) {
				case I.MenuDirection.Top:
					y = offset.top - height + offsetY;
					
					// Switch
					if (y <= BORDER) {
						y = offset.top + eh - offsetY;
					};
					break;

				case I.MenuDirection.Center:
					y = offset.top - height / 2 + eh / 2 + offsetY;
					break;

				case I.MenuDirection.Bottom:
					y = offset.top + eh + offsetY;

					// Switch
					if (y >= wh - height - BORDER) {
						y = offset.top - height - offsetY;
					};
					break;
			};

			switch (horizontal) {
				case I.MenuDirection.Left:
					x += offsetX;
					break;

				case I.MenuDirection.Center:
					x = x + ew / 2 - width / 2 + offsetX;
					break;

				case I.MenuDirection.Right:
					x -= width + offsetX - ew;
					break;
			};

			if (undefined !== forceX) x = forceX;
			if (undefined !== forceY) y = forceY;

			x = Math.max(BORDER, x);
			x = Math.min(ww - width - BORDER, x);
		
			y = Math.max(BORDER, y);
			y = Math.min(wh - height - BORDER, y);

			node.css({ left: x, top: y });
			
			if (isSub) {
				const coords = keyboard.coords;
				const poly = $('#menu-polygon');
				
				if (type == I.MenuType.Vertical) {
					let px = Math.abs(x - coords.x);
					let py = Math.abs(y - coords.y);
					 
					poly.show().css({
						width: px - 4,
						height: height,
						left: coords.x + 4,
						top: y,
						clipPath: 'polygon(0px ' + py + 'px, 100% 0%, 100% 100%)'
					});
				};
			};
		});
	};
	
	onMouseLeave (e: any) {
		const { param } = this.props;
		const { isSub } = param;
		
		if (isSub) {
			$('#menu-polygon').hide();
		};
	};
	
	setActiveItem (item?: any, scroll?: boolean) {
		const node = $(ReactDOM.findDOMNode(this));
		node.find('.item.active').removeClass('active');
		
		if (!item) {
			return;
		};
		
		const el = node.find('#item-' + item.id).addClass('active');
		
		if (el.length && scroll) {
			const content = node.find('.content');
			const st = content.scrollTop();
			const pt = el.position().top;
			const eh = el.outerHeight();
			const ch = content.height();
			const top = Math.max(0, st + pt + eh - BORDER - ch);
			
			content.animate({ scrollTop: top }, 100);
		};
	};
	
};

export default Menu;