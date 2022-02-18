import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, keyboard, Util, analytics } from 'ts/lib';
import { Dimmer, Icon } from 'ts/component';
import { menuStore, popupStore } from 'ts/store';
import { observer } from 'mobx-react';

import MenuHelp from './help';
import MenuOnboarding from './onboarding';
import MenuAccount from './account';
import MenuSelect from './select';
import MenuButton from './button';

import MenuSmile from './smile';
import MenuSmileSkin from './smile/skin';

import MenuSearchText from './search/text';
import MenuSearchObject from './search/object';

import MenuPreviewObject from './preview/object';
import MenuPreviewLatex from './preview/latex';

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
import MenuBlockLayout from './block/layout';
import MenuBlockLatex from './block/latex';
import MenuBlockLinkSettings from './block/link/settings';

import MenuBlockRelationEdit from './block/relation/edit';
import MenuBlockRelationView from './block/relation/view';

import MenuRelationSuggest from './relation/suggest';

import MenuDataviewRelationList from './dataview/relation/list';
import MenuDataviewRelationEdit from './dataview/relation/edit';
import MenuDataviewObjectList from './dataview/object/list';
import MenuDataviewObjectValues from './dataview/object/values';
import MenuDataviewFileList from './dataview/file/list';
import MenuDataviewFileValues from './dataview/file/values';
import MenuDataviewFilterList from './dataview/filter/list';
import MenuDataviewFilterValues from './dataview/filter/values';
import MenuDataviewSort from './dataview/sort';
import MenuDataviewViewList from './dataview/view/list';
import MenuDataviewViewEdit from './dataview/view/edit';
import MenuDataviewCalendar from './dataview/calendar';
import MenuDataviewOptionList from './dataview/option/list';
import MenuDataviewOptionEdit from './dataview/option/edit';
import MenuDataviewOptionValues from './dataview/option/values';
import MenuDataviewDate from './dataview/date';
import MenuDataviewText from './dataview/text';
import MenuDataviewSource from './dataview/source';
import MenuDataviewContext from './dataview/context';

interface Props extends I.Menu {
	dataset?: any;
	history: any;
};

interface State {
	tab: string;
};

const $ = require('jquery');
const raf = require('raf');
const Constant = require('json/constant.json');
const BORDER = 10;
const ARROW_WIDTH = 17;
const ARROW_HEIGHT = 8;

const Components: any = {
	help:					 MenuHelp,
	onboarding:				 MenuOnboarding,
	account:				 MenuAccount,
	select:					 MenuSelect,
	button:					 MenuButton,

	smile:					 MenuSmile,
	smileSkin:				 MenuSmileSkin,

	searchText:				 MenuSearchText,
	searchObject:			 MenuSearchObject,

	previewObject:			 MenuPreviewObject,
	previewLatex:			 MenuPreviewLatex,

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
	blockLayout:			 MenuBlockLayout,
	blockLatex:				 MenuBlockLatex,
	blockLinkSettings:		 MenuBlockLinkSettings,

	blockRelationEdit:		 MenuBlockRelationEdit,
	blockRelationView:		 MenuBlockRelationView,

	relationSuggest:		 MenuRelationSuggest,

	dataviewRelationList:	 MenuDataviewRelationList,
	dataviewRelationEdit:	 MenuDataviewRelationEdit,
	dataviewObjectList:		 MenuDataviewObjectList,
	dataviewObjectValues:	 MenuDataviewObjectValues,
	dataviewFileList:		 MenuDataviewFileList,
	dataviewFileValues:		 MenuDataviewFileValues,
	dataviewOptionList:		 MenuDataviewOptionList,
	dataviewOptionEdit:		 MenuDataviewOptionEdit,
	dataviewOptionValues:	 MenuDataviewOptionValues,
	dataviewFilterList:		 MenuDataviewFilterList,
	dataviewFilterValues:	 MenuDataviewFilterValues,
	dataviewSort:			 MenuDataviewSort,
	dataviewViewList:		 MenuDataviewViewList,
	dataviewViewEdit:		 MenuDataviewViewEdit,
	dataviewCalendar:		 MenuDataviewCalendar,
	dataviewDate:			 MenuDataviewDate,
	dataviewText:			 MenuDataviewText,
	dataviewSource:			 MenuDataviewSource,
	dataviewContext:		 MenuDataviewContext,
};

const Menu = observer(class Menu extends React.Component<Props, State> {

	_isMounted: boolean = false;
	timeoutPoly: number = 0;
	ref: any = null;
	isAnimating: boolean = false;

	state = {
		tab: '',
	};
	
	constructor (props: any) {
		super(props);
		
		this.position = this.position.bind(this);
		this.close = this.close.bind(this);
		this.setHover = this.setHover.bind(this);
		this.setActive = this.setActive.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.getId = this.getId.bind(this);
		this.getSize = this.getSize.bind(this);
		this.getPosition = this.getPosition.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { id, param } = this.props;
		const { element, tabs, type, vertical, horizontal, passThrough, noDimmer, withArrow } = param;
		const { data } = param;
		
		let tab = '';
		if (tabs.length) {
			tab = this.state.tab || tabs[0].id;
		};
		
		let menuId = this.getId();
		let Component = null;
		let arrowDirection = this.getArrowDirection();

		const cn = [ 
			'menu', 
			menuId,
			(type == I.MenuType.Horizontal ? 'horizontal' : 'vertical'),
			'v' + vertical,
			'h' + horizontal
		];
		const cd = [];

		if (tab) {
			const item = tabs.find((it: I.MenuTab) => { return it.id == tab; });
			if (item) {
				Component = Components[item.component];
			};
		} else {
			Component = Components[id];
		};

		if (!Component) {
			return null;
		};
		
		if (param.className) {
			cn.push(param.className);
		};

		if (passThrough) {
			cd.push('through');
		};

		const Tab = (item: any) => (
			<div className={[ 'tab', (item.id == tab ? 'active' : '') ].join(' ')} onClick={(e: any) => { this.onTab(item.id); }}>
				{item.name}
			</div>
		);

		return (
			<div id={menuId + '-wrap'} className="menuWrap">
				<div id={menuId} className={cn.join(' ')} onMouseLeave={this.onMouseLeave}>
					{tabs.length ? (
						<div className="tabs">
							{tabs.map((item: any, i: number) => (
								<Tab key={i} {...item} />
							))}
						</div>
					) : ''}

					{withArrow ? <Icon id="arrowDirection" className={[ 'arrowDirection', 'c' + arrowDirection ].join(' ')} /> :  ''}

					<div className="content">
						<Component 
							ref={(ref: any) => { this.ref = ref; }}
							{...this.props} 
							setActive={this.setActive}
							setHover={this.setHover}
							onKeyDown={this.onKeyDown}
							getId={this.getId} 
							getSize={this.getSize}
							getPosition={this.getPosition}
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
		const { id, param } = this.props;
		const { onOpen } = param;

		this._isMounted = true;

		this.setClass();
		this.position();
		this.animate();
		this.rebind();
		this.setActive();
		
		const obj = $(`#${this.getId()}`);
		const el = this.getElement();

		if (el && el.length) {
			el.addClass('hover');
		};

		if (param.height) {
			obj.css({ height: param.height });
		};

		if (onOpen) {
			onOpen(this);
		};

		analytics.event('menu', { params: { id } });
	};

	componentDidUpdate () {
		const { param } = this.props;
		const { noAnimation } = param;
		const node = $(ReactDOM.findDOMNode(this)); 
		const menu = node.find('.menu');

		this.setClass();

		if (noAnimation) {
			menu.addClass('noAnimation');
		};

		menu.addClass('show').css({ transform: 'none' });

		this.position();
	};

	componentWillUnmount () {
		const { param } = this.props;
		const { isSub, data } = param;
		const { rebind } = data;
		const el = this.getElement();

		this._isMounted = false;
		this.unbind();

		if (el && el.length) {
			el.removeClass('hover');
		};
		
		if (isSub) {
			$('#menu-polygon').hide();
			window.clearTimeout(this.timeoutPoly);
		};

		if (this.ref && this.ref.unbind) {
			this.ref.unbind();
		};
		if (rebind) {
			rebind();
		};
	};

	setClass () {
		if (!this._isMounted) {
			return;
		};

		const { param } = this.props;
		const { classNameWrap } = param;
		const node = $(ReactDOM.findDOMNode(this));
		const cn = [ 'menuWrap' ];

		if (classNameWrap) {
			cn.push(classNameWrap);	
		};

		if (popupStore.isOpen()) {
			cn.push('fromPopup');
		};

		node.attr({ class: cn.join(' ') });
	};

	rebind () {
		this.unbind();
		$(window).on('resize.' + this.getId(), () => { this.position(); });
	};
	
	unbind () {
		$(window).unbind('resize.' + this.getId());
	};
	
	animate () {
		if (this.isAnimating) {
			return;
		};

		const { param } = this.props;
		const { noAnimation } = param;
		const menu = $('#' + this.getId());

		if (noAnimation) {
			menu.addClass('noAnimation show').css({ transform: 'none' });
		} else {
			this.isAnimating = true;

			raf(() => {
				if (!this._isMounted) {
					return;
				};
				
				menu.addClass('show');
				window.setTimeout(() => { 
					menu.css({ transform: 'none' }); 
					this.isAnimating = false;
				}, Constant.delay.menu);
			});
		};
	};
	
	position () {
		const { id, param } = this.props;
		const { element, recalcRect, type, vertical, horizontal, fixedX, fixedY, isSub, noFlipX, noFlipY, withArrow } = param;

		raf(() => {
			if (!this._isMounted) {
				return;
			};

			const win = $(window);
			const node = $(ReactDOM.findDOMNode(this));
			const menu = node.find('.menu');
			const arrow = menu.find('#arrowDirection');
			const ww = win.width();
			const wh = win.scrollTop() + win.height();
			const width = param.width ? param.width : menu.outerWidth();
			const height = menu.outerHeight();
			const scrollTop = win.scrollTop();
			const isFixed = (menu.css('position') == 'fixed') || (node.css('position') == 'fixed');
			const offsetX = Number('function' == typeof(param.offsetX) ? param.offsetX() : param.offsetX) || 0;
			const offsetY = Number('function' == typeof(param.offsetY) ? param.offsetY() : param.offsetY) || 0;
			const rect = recalcRect ? recalcRect() : param.rect;

			let ew = 0;
			let eh = 0;
			let ox = 0;
			let oy = 0;
			let minY = Util.sizeHeader();

			if (rect) {
				ew = Number(rect.width) || 0;
				eh = Number(rect.height) || 0;
				ox = Number(rect.x) || 0;
				oy = Number(rect.y) || 0;
			} else {
				const el = this.getElement();
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

			if (isFixed) {
				y -= scrollTop;
			};

			x = Math.max(BORDER, x);
			x = Math.min(ww - width - BORDER, x);

			y = Math.max(minY, y);
			y = Math.min(wh - height - BORDER, y);

			if (undefined !== fixedX) x = fixedX;
			if (undefined !== fixedY) y = fixedY;

			let css: any = { left: x, top: y };
			if (param.width) {
				css.width = param.width;
			};
			menu.css(css);

			if (isSub && (type == I.MenuType.Vertical)) {
				const coords = Util.objectCopy(keyboard.mouse.page);
				const poly = $('#menu-polygon');

				let w = Math.abs(x - coords.x) - 4;
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
					clipPath: `polygon(0px ${oy - y}px, 0px ${oy - y + eh}px, 100% 100%, 100% 0%)`,
					transform: t,
					position: (isFixed ? 'fixed' : 'absolute'),
				});

				window.clearTimeout(this.timeoutPoly);
				this.timeoutPoly = window.setTimeout(() => { 
					win.trigger('mousemove');
					poly.hide(); 
				}, 500);
			};

			// Arrow positioning

			if (withArrow) {
				const arrowDirection = this.getArrowDirection();
				const size = this.getSize();
				const { width, height } = size;
				const min = 6;
				const css: any = { left: '', right: '', top: '', bottom: '' };

				switch (arrowDirection) {
					case I.MenuDirection.Bottom:
					case I.MenuDirection.Top:

						switch (horizontal) {
							case I.MenuDirection.Left:
								if (ew > width) {
									css.left = width / 2 - ARROW_WIDTH / 2;
								} else {
									css.left = ew / 2 - ARROW_WIDTH / 2;
								};
								css.left = Math.max(min, Math.min(width - min, css.left));
								break;

							case I.MenuDirection.Center:
								if (ew > width) {
									css.left = width / 2 - ARROW_WIDTH / 2;
								} else {
									css.left = ox - x + ew / 2 - ARROW_WIDTH / 2;
								};
								css.left = Math.max(min, Math.min(width - min, css.left));
								break;

							case I.MenuDirection.Right: 
								if (ew > width) {
									css.right = width / 2 - ARROW_WIDTH / 2;
								} else {
									css.right = ew / 2 - ARROW_WIDTH / 2;
								};
								css.right = Math.max(min, Math.min(width - min, css.right));
								break;
						};
						break;
					
					case I.MenuDirection.Left:
					case I.MenuDirection.Right:
						css.top = eh / 2 - ARROW_HEIGHT / 2;
						css.top = Math.max(min, Math.min(height - min, css.top));
						break;
				};

				arrow.css(css);
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

	onKeyDown (e: any) {
		if (!this.ref || !this.ref.getItems) {
			return;
		};

		e.stopPropagation();
		keyboard.disableMouse(true);

		const { param } = this.props;
		const { commonFilter } = param;
		const refInput = this.ref.refFilter || this.ref.refName;

		let ret = false;

		if (refInput) {
			if (refInput.isFocused && (this.ref.n < 0)) {
				keyboard.shortcut('arrowleft, arrowright', e, (pressed: string) => {
					ret = true;
				});

				keyboard.shortcut('arrowdown', e, (pressed: string) => {
					this.ref.n = 0;
					refInput.blur();
					this.setActive(null, true);

					ret = true;
				});

				keyboard.shortcut('arrowup', e, (pressed: string) => {
					if (!this.ref.getItems) {
						return;
					};

					this.ref.n = this.ref.getItems().length - 1;
					refInput.blur();
					this.setActive(null, true);

					ret = true;
				});
			} else {
				keyboard.shortcut('arrowup', e, (pressed: string) => {
					if (!this.ref.n) {
						this.ref.n = -1;
						refInput.focus();
						this.setActive(null, true);

						ret = true;
					};
				});
			};
		};

		if (ret) {
			return;
		};

		const shortcutClose = [ 'escape' ];
		const shortcutSelect = [ 'tab', 'enter' ];

		if (!commonFilter) {
			shortcutClose.push('arrowleft');
			shortcutSelect.push('arrowright');
		};

		keyboard.shortcut(shortcutClose.join(', '), e, (pressed: string) => {
			e.preventDefault();
			this.close();
		});

		if (!this.ref || !this.ref.getItems) {
			return;
		};

		const items = this.ref.getItems();
		const l = items.length;
		const item = items[this.ref.n];

		keyboard.shortcut('arrowup', e, (pressed: string) => {
			e.preventDefault();
			
			this.ref.n--;
			if (this.ref.n < 0) {
				if ((this.ref.n == -1) && refInput) {
					this.ref.n = -1;
					refInput.focus();
				} else {
					this.ref.n = l - 1;
				};
			};

			this.setActive(null, true);

			let item = items[this.ref.n];
			if (item && !item.arrow && this.ref.onOver) {
				this.ref.onOver(e, item);
			};
		});

		keyboard.shortcut('arrowdown', e, (pressed: string) => {
			e.preventDefault();
			this.ref.n++;
			if (this.ref.n > l - 1) {
				this.ref.n = 0;
			};

			this.setActive(null, true);

			let item = items[this.ref.n];
			if (item && !item.arrow && this.ref.onOver) {
				this.ref.onOver(e, item);
			};
		});

		if (this.ref && this.ref.onClick) {	
			keyboard.shortcut(shortcutSelect.join(', '), e, (pressed: string) => {
				e.preventDefault();
				if (item) {
					item.arrow && this.ref.onOver ? this.ref.onOver(e, item) : this.ref.onClick(e, item);
				};
			});
		};

		if (this.ref && this.ref.onSortEnd) {
			keyboard.shortcut('shift+arrowup', e, (pressed: string) => {
				e.preventDefault();
				this.onSortMove(-1);
			});

			keyboard.shortcut('shift+arrowdown', e, (pressed: string) => {
				e.preventDefault();
				this.onSortMove(1);
			});
		};

		if (this.ref && this.ref.onRemove && refInput && !refInput.isFocused) {
			keyboard.shortcut('backspace', e, (pressed: string) => {
				e.preventDefault();

				this.ref.n--;
				this.checkIndex();
				this.ref.onRemove(e, item);
				this.setActive(null, true);
			});
		};
	};

	onSortMove (dir: number) {
		const n = this.ref.n;

		this.ref.n = n + dir;
		this.checkIndex();

		this.ref.onSortEnd({ oldIndex: n, newIndex: this.ref.n });
	};

	checkIndex () {
		const items = this.ref.getItems();

		this.ref.n = Math.max(0, this.ref.n);
		this.ref.n = Math.min(items.length - 1, this.ref.n);
	};

	setActive (item?: any, scroll?: boolean) {
		if (!this.ref || !this.ref.getItems) {
			return;
		};

		const refInput = this.ref.refFilter || this.ref.refName;
		if ((this.ref.n == -1) && refInput) {
			refInput.focus();
		};

		const items = this.ref.getItems();
		if (item) {
			this.ref.n = items.findIndex((it: any) => { return it.id == item.id; });
		};

		if (this.ref.refList && scroll) {
			let idx = this.ref.n;
			if (this.ref.recalcIndex) {
				idx = this.ref.recalcIndex();
			};
			this.ref.refList.scrollToRow(Math.max(0, idx));
		};

		this.setHover(items[this.ref.n], scroll);
	};
	
	setHover (item?: any, scroll?: boolean) {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const menu = node.find('.menu');

		menu.find('.item.hover').removeClass('hover');

		if (!item) {
			return;
		};

		let el = menu.find(`#item-${item.itemId}`);
		if (!el.length) {
			el = menu.find(`#item-${item.id}`);
		};

		if (!el.length) {
			return;
		};

		el.addClass('hover');

		if (scroll) {
			let scrollWrap = node.find('.scrollWrap');
			if (!scrollWrap.length) {
				scrollWrap = node.find('.content');
			};

			const st = scrollWrap.scrollTop();
			const pt = el.position().top;
			const eh = el.outerHeight();
			const ch = scrollWrap.height();
			const top = Math.max(0, st + pt + eh - BORDER - ch);
			
			scrollWrap.scrollTop(top);
		};
	};

	onTab (id: string) {
		this.setState({ tab: id });
	};

	getId (): string {
		const { param } = this.props;
		const { tabs } = param;
		const { tab } = this.state;

		let id = '';

		if (tab) {
			const item = tabs.find((it: I.MenuTab) => { return it.id == tab; });
			if (item) {
				id = item.component;
			};
		} else {
			id = this.props.id;
		};

		return Util.toCamelCase('menu-' + id);
	};

	getElement () {
		const { param } = this.props;
		const { element } = param;

		return $(element);
	};

	getSize (): { width: number; height: number; } {
		const obj = $('#' + this.getId());
		return { width: obj.outerWidth(), height: obj.outerHeight() };
	};

	getPosition (): DOMRect {
		const obj = $('#' + this.getId());
		return obj.get(0).getBoundingClientRect() as DOMRect;
	};

	getArrowDirection (): I.MenuDirection {
		const { param } = this.props;
		const { vertical, horizontal } = param;

		let dir: I.MenuDirection = I.MenuDirection.None;

		if (vertical == I.MenuDirection.Bottom) {
			dir = I.MenuDirection.Top;
		};
		if (vertical == I.MenuDirection.Top) {
			dir = I.MenuDirection.Bottom;
		};
		if ((vertical == I.MenuDirection.Center) && (horizontal == I.MenuDirection.Left)) {
			dir = I.MenuDirection.Right;
		};
		if ((vertical == I.MenuDirection.Center) && (horizontal == I.MenuDirection.Right)) {
			dir = I.MenuDirection.Left;
		};

		return dir;
	};

});

export default Menu;