import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, keyboard, Util } from 'ts/lib';
import { Dimmer } from 'ts/component';
import { commonStore, menuStore } from 'ts/store';

import MenuHelp from './help';
import MenuAccount from './account';
import MenuSelect from './select';
import MenuButton from './button';
import MenuSmile from './smile';
import MenuSmileSkin from './smile/skin';

import MenuSearchText from './search/text';
import MenuSearchObject from './search/object';

import MenuThreadList from './thread/list';
import MenuThreadStatus from './thread/status';

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

import MenuBlockRelationEdit from './block/relation/edit';
import MenuBlockRelationList from './block/relation/list';
import MenuBlockRelationView from './block/relation/view';

import MenuObjectTypeEdit from './type/edit';

import MenuRelationSuggest from './relation/suggest';

import MenuDataviewRelationList from './dataview/relation/list';
import MenuDataviewRelationEdit from './dataview/relation/edit';
import MenuDataviewRelationType from './dataview/relation/type';
import MenuDataviewObjectList from './dataview/object/list';
import MenuDataviewObjectValues from './dataview/object/values';
import MenuDataviewFilter from './dataview/filter';
import MenuDataviewSort from './dataview/sort';
import MenuDataviewViewList from './dataview/view/list';
import MenuDataviewViewEdit from './dataview/view/edit';
import MenuDataviewCalendar from './dataview/calendar';
import MenuDataviewOptionList from './dataview/option/list';
import MenuDataviewOptionEdit from './dataview/option/edit';
import MenuDataviewOptionValues from './dataview/option/values';
import MenuDataviewDate from './dataview/date';
import MenuDataviewMedia from './dataview/media';
import MenuDataviewText from './dataview/text';

interface Props extends I.Menu {
	history: any;
};

const $ = require('jquery');
const raf = require('raf');
const Constant = require('json/constant.json');
const BORDER = 12;

class Menu extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	
	constructor (props: any) {
		super(props);
		
		this.position = this.position.bind(this);
		this.close = this.close.bind(this);
		this.setHover = this.setHover.bind(this);
		this.getId = this.getId.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { id, param } = this.props;
		const { type, vertical, horizontal, passThrough, noDimmer } = param;
		
		const Components: any = {
			help:					 MenuHelp,
			account:				 MenuAccount,
			select:					 MenuSelect,
			button:					 MenuButton,
			smile:					 MenuSmile,
			smileSkin:				 MenuSmileSkin,

			searchText:				 MenuSearchText,
			searchObject:			 MenuSearchObject,

			threadList:				 MenuThreadList,
			threadStatus:			 MenuThreadStatus,
			
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

			blockRelationEdit:		 MenuBlockRelationEdit,
			blockRelationList:		 MenuBlockRelationList,
			blockRelationView:		 MenuBlockRelationView,

			objectTypeEdit:			 MenuObjectTypeEdit,

			relationSuggest:		 MenuRelationSuggest,

			dataviewRelationList:	 MenuDataviewRelationList,
			dataviewRelationEdit:	 MenuDataviewRelationEdit,
			dataviewRelationType:	 MenuDataviewRelationType,
			dataviewObjectList:		 MenuDataviewObjectList,
			dataviewObjectValues:	 MenuDataviewObjectValues,
			dataviewOptionList:		 MenuDataviewOptionList,
			dataviewOptionEdit:		 MenuDataviewOptionEdit,
			dataviewOptionValues:	 MenuDataviewOptionValues,
			dataviewFilter:			 MenuDataviewFilter,
			dataviewSort:			 MenuDataviewSort,
			dataviewViewList:		 MenuDataviewViewList,
			dataviewViewEdit:		 MenuDataviewViewEdit,
			dataviewCalendar:		 MenuDataviewCalendar,
			dataviewDate:			 MenuDataviewDate,
			dataviewMedia:			 MenuDataviewMedia,
			dataviewText:			 MenuDataviewText,
		};
		
		const menuId = this.getId();
		const Component = Components[id];
		const cn = [ 
			'menu', 
			menuId, 
			(type == I.MenuType.Horizontal ? 'horizontal' : 'vertical'),
			'v' + vertical,
			'h' + horizontal
		];
		const cd = [];
		
		if (!Component) {
			return <div>Component {id} not found</div>
		};
		
		if (param.className) {
			cn.push(param.className);
		};

		if (passThrough) {
			cd.push('through');
		};
		
		return (
			<div id={menuId + '-wrap'} className="menuWrap">
				<div id={menuId} className={cn.join(' ')} onMouseLeave={this.onMouseLeave}>
					<div className="content">
						<Component 
							{...this.props} 
							setHover={this.setHover} 
							getId={this.getId} 
							position={this.position} 
							close={this.close} 
						/>
					</div>
				</div>
				{!noDimmer ? (
					<Dimmer onClick={() => { menuStore.close(id); }} className={cd.join(' ')} />
				) : ''}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.position();
		this.animate();
		this.unbind();
		
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));

		win.on('resize.' + this.getId(), () => { this.position(); });

		if (commonStore.popupIsOpen()) {
			node.addClass('fromPopup');
		};
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
		$(window).unbind('resize.' + this.getId());
	};
	
	animate () {
		raf(() => {
			if (!this._isMounted) {
				return;
			};
			
			const node = $(ReactDOM.findDOMNode(this)); 
			const menu = node.find('.menu');

			menu.addClass('show');
			window.setTimeout(() => { menu.css({ transform: 'none' }); }, 210);
		});
	};
	
	position () {
		const { id, param } = this.props;
		const { element, rect, type, vertical, horizontal, offsetX, offsetY, fixedX, fixedY, isSub, noFlipX, noFlipY } = param;
		const platform = Util.getPlatform();
		
		raf(() => {
			if (!this._isMounted) {
				return;
			};
			
			const win = $(window);
			const node = $(ReactDOM.findDOMNode(this));
			const menu = node.find('.menu');
			const ww = win.width();
			const wh = win.scrollTop() + win.height();
			const width = param.width ? param.width : menu.outerWidth();
			const height = menu.outerHeight();

			let ew = 0;
			let eh = 0;
			let ox = 0;
			let oy = 0;
			let minY = Constant.size.header + 2;
			if (platform == I.Platform.Windows) {
				minY += 30;
			};

			if (rect) {
				ew = Number(rect.width) || 0;
				eh = Number(rect.height) || 0;
				ox = Number(rect.x) || 0;
				oy = Number(rect.y) || 0;
			} else {
				let el = null;
				if ('object' == typeof(element)) {
					el = $(element);
				} else {
					el = $(element.replace(/\//g, '\\/'));
				};
				
				if (!el || !el.length) {
					console.log('[Menu.position]', id, 'element not found', element);
					return;
				};

				const offset = el.offset();
				ew = el.outerWidth();
				eh = el.outerHeight();
				ox = offset.left;
				oy = offset.top;
			};

			let x = ox;
			let y = oy;
			let flipX = false;

			switch (vertical) {
				case I.MenuDirection.Top:
					y = oy - height + offsetY;
					
					// Switch
					if (!noFlipY && (y <= BORDER)) {
						y = oy + eh - offsetY;
					};
					break;

				case I.MenuDirection.Center:
					y = oy - height / 2 + eh / 2 + offsetY;
					break;

				case I.MenuDirection.Bottom:
					y = oy + eh + offsetY;

					// Switch
					if (!noFlipY && (y >= wh - height - BORDER)) {
						y = oy - height - offsetY;
					};
					break;
			};

			switch (horizontal) {
				case I.MenuDirection.Left:
					x += offsetX;

					// Switch
					if (!noFlipX && (x >= ww - width - BORDER)) {
						x = ox - width;
						flipX = true;
					};
					break;

				case I.MenuDirection.Center:
					x = x + ew / 2 - width / 2 + offsetX;
					break;

				case I.MenuDirection.Right:
					x -= width + offsetX - ew;

					// Switch
					if (!noFlipX && (x <= BORDER)) {
						x = ox + ew;
						flipX = true;
					};
					break;
			};

			if (undefined !== fixedX) x = fixedX;
			if (undefined !== fixedY) y = fixedY;

			x = Math.max(BORDER, x);
			x = Math.min(ww - width - BORDER, x);

			y = Math.max(minY, y);
			y = Math.min(wh - height - BORDER, y);

			let css: any = { left: x, top: y };
			if (param.width) {
				css.width = param.width;
			};

			menu.css(css);
			
			if (isSub) {
				const coords = keyboard.coords;
				const poly = $('#menu-polygon');
				
				if (type == I.MenuType.Vertical) {
					let px = Math.abs(x - coords.x);
					let py = Math.abs(y - coords.y);
					let w = px - 4;
					let t = '';
					let l = coords.x + 4;

					if (flipX) {
						w -= width;
						l -= w + 8;
						t = 'scaleX(-1)';
					};

					poly.show().css({
						width: w,
						height: height,
						left: l,
						top: y,
						clipPath: `polygon(0px ${py}px, 100% 0%, 100% 100%)`,
						transform: t,
					});
				};
			};
		});
	};

	close () {
		menuStore.close(this.props.id);
	};
	
	onMouseLeave (e: any) {
		const { param } = this.props;
		const { isSub } = param;
		
		if (isSub) {
			$('#menu-polygon').hide();
		};
	};
	
	setHover (item?: any, scroll?: boolean) {
		const node = $(ReactDOM.findDOMNode(this));
		const menu = node.find('.menu');

		menu.find('.item.hover').removeClass('hover');

		if (!item) {
			return;
		};

		const el = menu.find('#item-' + item.id).addClass('hover');
		if (el.length && scroll) {
			const content = node.find('.content');
			const st = content.scrollTop();
			const pt = el.position().top;
			const eh = el.outerHeight();
			const ch = content.height();
			const top = Math.max(0, st + pt + eh - BORDER - ch);
			
			content.stop(true, true).animate({ scrollTop: top }, 100);
		};
	};

	getId (): string {
		return Util.toCamelCase('menu-' + this.props.id);
	};

};

export default Menu;