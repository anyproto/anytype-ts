import React, { forwardRef, useEffect, useRef, useState, useImperativeHandle } from 'react';
import raf from 'raf';
import { Dimmer, Icon, Title } from 'Component';

import MenuHelp from './help';
import MenuOnboarding from './onboarding';
import MenuParticipant from './participant';
import MenuPublish from './publish';
import MenuTableOfContents from './tableOfContents';

import MenuSelect from './select';

import MenuSmile from './smile';
import MenuSmileColor from './smile/color';

import MenuCalendar from './calendar';
import MenuCalendarDay from './calendar/day';

import MenuObjectContext from './object/context';

import MenuSearchText from './search/text';
import MenuSearchObject from './search/object';
import MenuSearchChat from './search/chat';

import MenuPreviewObject from './preview/object';
import MenuPreviewLatex from './preview/latex';

import MenuBlockContext from './block/context';
import MenuBlockStyle from './block/style';
import MenuBlockAdd from './block/add';
import MenuBlockColor from './block/color';
import MenuBlockBackground from './block/background';
import MenuBlockCover from './block/cover';
import MenuBlockMedia from './block/media';
import MenuBlockAction from './block/action';
import MenuBlockHAlign from './block/align';
import MenuBlockLink from './block/link';
import MenuBlockMention from './block/mention';
import MenuBlockEmoji from './block/emoji';
import MenuBlockLayout from './block/layout';
import MenuBlockLatex from './block/latex';
import MenuBlockEmbedKroki from './block/embedKroki';
import MenuBlockLinkSettings from './block/link/settings';

import MenuBlockRelationEdit from './block/relation/edit';

import MenuRelationSuggest from './relation/suggest';
import MenuTypeSuggest from './type/suggest';

import MenuGraphSettings from './graph/settings';
import MenuObject from './object';
import MenuWidget from './widget';
import MenuWidgetSection from './widget/section';

import MenuDataviewRelationList from './dataview/relation/list';
import MenuDataviewRelationEdit from './dataview/relation/edit';
import MenuDataviewGroupList from './dataview/group/list';
import MenuDataviewGroupEdit from './dataview/group/edit';
import MenuDataviewObjectList from './dataview/object/list';
import MenuDataviewObjectValues from './dataview/object/values';
import MenuDataviewFileList from './dataview/file/list';
import MenuDataviewFileValues from './dataview/file/values';
import MenuDataviewFilterList from './dataview/filter/list';
import MenuDataviewFilterAdvanced from './dataview/filter/advanced';
import MenuDataviewFilterValues from './dataview/filter/values';
import MenuDataviewSort from './dataview/sort';
import MenuDataviewViewList from './dataview/view/list';
import MenuDataviewViewSettings from './dataview/view/settings';
import MenuDataviewViewLayout from './dataview/view/layout';
import MenuDataviewOptionList from './dataview/option/list';
import MenuDataviewOptionEdit from './dataview/option/edit';
import MenuDataviewText from './dataview/text';
import MenuDataviewSource from './dataview/source';
import MenuDataviewCreateBookmark from './dataview/create/bookmark';
import MenuDataviewTemplateContext from './dataview/template/context';
import MenuDataviewTemplateList from './dataview/template/list';
import MenuDataviewNew from './dataview/new';

import MenuSyncStatus from './syncStatus';
import MenuSyncStatusInfo from './syncStatus/info';

import MenuIdentity from './identity';
import MenuOneToOne from './oneToOne';

import MenuChatText from './chat/text';
import MenuChatCreate from './chat/create';
import MenuChangeOwner from './changeOwner';

import MenuCommentToolbar from './comment/toolbar';
import * as I from 'Interface';
import Storage from 'Lib/storage';

const ARROW_WIDTH = 17;
const ARROW_HEIGHT = 8;

const isMac = U.Common.isPlatformMac();

const Components: any = {

	help:					 MenuHelp,
	onboarding:				 MenuOnboarding,
	participant:			 MenuParticipant,
	publish:				 MenuPublish,
	tableOfContents:		 MenuTableOfContents,

	select:					 MenuSelect,

	smile:					 MenuSmile,
	smileColor:				 MenuSmileColor,

	calendar:				 MenuCalendar,
	calendarDay:			 MenuCalendarDay,

	objectContext:			 MenuObjectContext,

	searchText:				 MenuSearchText,
	searchObject:			 MenuSearchObject,
	searchChat:				 MenuSearchChat,

	previewObject:			 MenuPreviewObject,
	previewLatex:			 MenuPreviewLatex,
	
	blockContext:			 MenuBlockContext,
	blockAction:			 MenuBlockAction,
	blockStyle:				 MenuBlockStyle,
	blockAdd:				 MenuBlockAdd,
	blockColor:				 MenuBlockColor,
	blockBackground:		 MenuBlockBackground,
	blockAlign:				 MenuBlockHAlign,
	blockLink:				 MenuBlockLink,
	blockCover:				 MenuBlockCover,
	blockMedia:				 MenuBlockMedia,
	blockMention:			 MenuBlockMention,
	blockEmoji:				 MenuBlockEmoji,
	blockLayout:			 MenuBlockLayout,
	blockLatex:				 MenuBlockLatex,
	blockEmbedKroki:		 MenuBlockEmbedKroki,
	blockLinkSettings:		 MenuBlockLinkSettings,

	blockRelationEdit:		 MenuBlockRelationEdit,

	relationSuggest:		 MenuRelationSuggest,
	typeSuggest:			 MenuTypeSuggest,

	graphSettings:			 MenuGraphSettings,
	object:					 MenuObject,
	widget:					 MenuWidget,
	widgetSection:			 MenuWidgetSection,

	dataviewRelationList:	 MenuDataviewRelationList,
	dataviewRelationEdit:	 MenuDataviewRelationEdit,
	dataviewGroupList:		 MenuDataviewGroupList,
	dataviewGroupEdit:		 MenuDataviewGroupEdit,
	dataviewObjectList:		 MenuDataviewObjectList,
	dataviewObjectValues:	 MenuDataviewObjectValues,
	dataviewFileList:		 MenuDataviewFileList,
	dataviewFileValues:		 MenuDataviewFileValues,
	dataviewOptionList:		 MenuDataviewOptionList,
	dataviewOptionEdit:		 MenuDataviewOptionEdit,
	dataviewFilterList:		 MenuDataviewFilterList,
	dataviewFilterAdvanced:	 MenuDataviewFilterAdvanced,
	dataviewFilterValues:	 MenuDataviewFilterValues,
	dataviewSort:			 MenuDataviewSort,
	dataviewViewList:		 MenuDataviewViewList,
	dataviewViewSettings:	 MenuDataviewViewSettings,
	dataviewViewLayout:	 	 MenuDataviewViewLayout,
	dataviewText:			 MenuDataviewText,
	dataviewSource:			 MenuDataviewSource,
	dataviewCreateBookmark:	 MenuDataviewCreateBookmark,
	dataviewTemplateContext: MenuDataviewTemplateContext,
	dataviewTemplateList:	 MenuDataviewTemplateList,
	dataviewNew: 		 	 MenuDataviewNew,

	syncStatus:				 MenuSyncStatus,
	syncStatusInfo:			 MenuSyncStatusInfo,

	identity:				 MenuIdentity,
	oneToOne:				 MenuOneToOne,

	chatText: 				 MenuChatText,
	chatCreate: 			 MenuChatCreate,
	changeOwner:			 MenuChangeOwner,

	commentToolbar:			 MenuCommentToolbar,
};

interface RefProps extends I.MenuRef {
	getChildRef: () => any;
	close: (callBack?: () => void) => void;
	getId: () => string;
	getSize: () => { width: number; height: number; };
	props: I.Menu;
};

const Menu = forwardRef<RefProps, I.Menu>((props, ref) => {

	const { id, param } = props;
	const { 
		element, type, vertical, horizontal, passThrough, noDimmer, component, withArrow, getTabs, withBack, onBack,
		initialTab, onOpen, noAutoHover, isSub, noAnimation, parentId, classNameWrap, recalcRect, fixedX, fixedY, 
		noFlipX, noFlipY, stickToElementEdge, noBorderX, noBorderY, noClose, commonFilter, visibleDimmer,
	} = param;
	const { data } = param;
	const { preventFilter } = data;
	const [ tab, setTab ] = useState('');
	const tabs: I.MenuTab[] = getTabs ? getTabs() : [];
	const nodeRef = useRef(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const childRef = useRef(null);
	const timeoutPoly = useRef(0);
	const polyRef = useRef(null);
	const isAnimating = useRef(false);
	const isMounted = useRef(false);
	const isUnmountedRef = useRef(false);
	const framePosition = useRef(0);

	const getContext = () => ({
		getChildRef: () => childRef.current,
		close,
		getId,
		getSize,
		props,
	});

	useImperativeHandle(ref, getContext);

	useEffect(() => {
		polyRef.current = U.Dom.get('menu-polygon');
		setClass();
		position();
		animate();
		rebind();
		setActive();

		const el = getElement();

		if (!noAutoHover && el) {
			U.Dom.addClass(el, 'hover');
		};

		if (param.height) {
			U.Dom.css(containerRef.current, { height: `${param.height}px` });
		};

		if (tabs.length) {
			setTab(initialTab || tabs[0].id);
		};

		onOpen?.(getContext());
		analytics.event('menu', { params: { id } });

		return () => {
			const el = getElement();

			isUnmountedRef.current = true;

			unbind();

			if (el) {
				U.Dom.removeClass(el, 'hover');
			};

			if (isSub && polyRef.current) {
				U.Dom.css(polyRef.current, { display: 'none' });
				window.clearTimeout(timeoutPoly.current);
			};

			rebindPrevious();
			raf.cancel(framePosition.current);
			window.clearTimeout(scrollTimeout.current);
			isAnimating.current = false;
		};
	}, []);

	useEffect(() => {
		if (isMounted.current) {
			if (noAnimation) {
				U.Dom.addClass(containerRef.current, 'noAnimation');
			};

			setClass();

			U.Dom.addClass(containerRef.current, 'show');
			position();
		} else {
			isMounted.current = true;
		};
	});

	useEffect(() => {
		onOpen?.(getContext());
	}, [ param.menuKey ]);

	const rebindPrevious = () => {
		childRef.current?.unbind?.();

		// Without parentId we can't verify that the menu owning param.rebind
		// is still mounted — calling rebind() on an unmounted owner re-adds
		// its window keydown listener with nobody left to remove it, which
		// silently leaks an `e.preventDefault()` on space across the whole tab.
		if (!parentId) {
			if (param.rebind) {
				console.error(`[Menu].rebindPrevious: param.rebind passed without parentId in ${id}, skipping to avoid keydown leak`);
			};
			return;
		};

		if (!S.Menu.isOpen(parentId)) {
			return;
		};

		if (param.rebind) {
			param.rebind();
		} else
		if (data.rebind) {
			data.rebind();
			console.error(`[Menu].rebindPrevious uses data.rebind in ${id}`);
		};
	};

	const setClass = () => {
		const cn = [ 'menuWrap' ];

		if (classNameWrap) {
			cn.push(classNameWrap);
		};

		if (visibleDimmer) {
			cn.push('visibleDimmer');
		};

		if (S.Popup.isOpen()) {
			cn.push('fromPopup');
		};

		if (nodeRef.current) {
			nodeRef.current.className = cn.join(' ');
		};
	};

	const resizeHandler = useRef<(() => void) | null>(null);
	const sidebarResizeHandler = useRef<(() => void) | null>(null);
	const scrollHandler = useRef<(() => void) | null>(null);
	const scrollContainerRef = useRef<HTMLElement | null>(null);
	const scrollTimeout = useRef(0);

	const rebind = () => {
		unbind();

		const handler = () => position();
		resizeHandler.current = handler;
		sidebarResizeHandler.current = handler;

		U.Dom.addEvents(window, [
			[ 'resize', handler ],
			[ 'sidebarResize', handler ],
		]);

		const containerEl = U.Dom.getScrollContainer(keyboard.isPopup());
		if (containerEl) {
			scrollContainerRef.current = containerEl;
			const onScroll = () => {
				U.Dom.addClass(containerRef.current, 'noAnimation');
				window.clearTimeout(scrollTimeout.current);

				raf.cancel(framePosition.current);
				framePosition.current = raf(() => position());

				scrollTimeout.current = window.setTimeout(() => {
					U.Dom.removeClass(containerRef.current, 'noAnimation');
				}, 50);
			};
			scrollHandler.current = onScroll;
			U.Dom.addEvent(containerEl, 'scroll', onScroll);
		};
	};

	const unbind = () => {
		if (resizeHandler.current) {
			U.Dom.removeEvent(window, 'resize', resizeHandler.current);
			resizeHandler.current = null;
		};
		if (sidebarResizeHandler.current) {
			U.Dom.removeEvent(window, 'sidebarResize', sidebarResizeHandler.current);
			sidebarResizeHandler.current = null;
		};
		if (scrollHandler.current && scrollContainerRef.current) {
			U.Dom.removeEvent(scrollContainerRef.current, 'scroll', scrollHandler.current);
			scrollHandler.current = null;
			scrollContainerRef.current = null;
		};
	};
	
	const animate = () => {
		if (isAnimating.current) {
			return;
		};

		const menu = containerRef.current;

		if (noAnimation) {
			U.Dom.addClass(menu, 'noAnimation', 'show');
			U.Dom.css(menu, { transform: 'none' });
		} else {
			isAnimating.current = true;

			raf(() => {
				U.Dom.addClass(menu, 'show');
				window.setTimeout(() => { 
					U.Dom.css(menu, { transform: 'none' });
					isAnimating.current = false;
				}, S.Menu.getTimeout());
			});
		};
	};

	const getBorderTop = () => {
		return Number(window.AnytypeGlobalConfig?.menuBorderTop) || J.Size.header;
	};
	
	const getBorderBottom = () => {
		return Number(window.AnytypeGlobalConfig?.menuBorderBottom) || J.Size.menuBorder;
	};

	const getBorderLeft = (isFixed) => {
		return Number(window.AnytypeGlobalConfig?.menuBorderLeft) || J.Size.menuBorder;
	};

	const position = () => {
		childRef.current?.beforePosition?.();

		raf(() => {
			const menuEl = containerRef.current;
			const nodeEl = nodeRef.current;

			if (!menuEl || !nodeEl) {
				return;
			};

			const arrow = U.Dom.select('#arrowDirection', menuEl);
			const isFixed = (getComputedStyle(menuEl).position == 'fixed') || (getComputedStyle(nodeEl).position == 'fixed');
			const winSize = U.Dom.getWindowDimensions();
			const borderLeft = getBorderLeft(isFixed);
			const borderTop = getBorderTop();
			const borderBottom = getBorderBottom();
			const ww = winSize.ww;
			const wh = winSize.wh;
			const width = param.width ? param.width : menuEl.offsetWidth;
			const height = menuEl.offsetHeight;

			let offsetX = Number(typeof param.offsetX === 'function' ? param.offsetX() : param.offsetX) || 0;
			let offsetY = Number(typeof param.offsetY === 'function' ? param.offsetY() : param.offsetY) || 0;
			let ew = 0;
			let eh = 0;
			let ox = 0;
			let oy = 0;
			let rect = null;

			if (recalcRect) {
				rect = recalcRect();
			};
			if (!rect) {
				rect = param.rect;
			};

			if (rect) {
				ew = Number(rect.width) || 0;
				eh = Number(rect.height) || 0;
				ox = Number(rect.x) || 0;
				oy = Number(rect.y) || 0;
			} else {
				const el = getElement();
				if (!el) {
					console.log('[Menu].position', id, 'element not found', element);
					return;
				};

				const elRect = el.getBoundingClientRect();

				ew = el.offsetWidth;
				eh = el.offsetHeight;
				ox = elRect.left + window.scrollX;
				oy = elRect.top + window.scrollY;
			};

			let x = ox;
			let y = oy;
			let flipX = false;

			if (stickToElementEdge != I.MenuDirection.None) {
				switch (stickToElementEdge) {
					case I.MenuDirection.Top: offsetY = -eh; break;
					case I.MenuDirection.Bottom: offsetY = eh; break;
					case I.MenuDirection.Left: offsetX = -ew; break;
					case I.MenuDirection.Right: offsetX = ew; break;
				};
			};

			switch (vertical) {
				case I.MenuDirection.Top:
					y = oy - height + offsetY;

					// Switch
					if (!noFlipY && (y <= borderTop)) {
						y = oy + eh - offsetY;
					};
					break;

				case I.MenuDirection.Center:
					y = oy - height / 2 + eh / 2 + offsetY;
					break;

				case I.MenuDirection.Bottom:
					y = oy + eh + offsetY;

					// Switch
					if (!noFlipY && (y >= wh - height - borderBottom)) {
						y = oy - height - offsetY;
					};
					break;
			};

			switch (horizontal) {
				case I.MenuDirection.Left:
					x += offsetX;

					// Switch
					if (!noFlipX && (x >= ww - width - J.Size.menuBorder)) {
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
					if (!noFlipX && (x <= J.Size.menuBorder)) {
						x = ox + ew;
						flipX = true;
					};
					break;
			};

			if (!noBorderX) {
				x = Math.max(borderLeft, x);
				x = Math.min(ww - width - J.Size.menuBorder, x);
			};

			if (!noBorderY) {
				y = Math.max(borderTop, y);
				y = Math.min(wh - height - borderBottom, y);
			};

			if (undefined !== fixedX) x = fixedX;
			if (undefined !== fixedY) y = fixedY;

			const menuCss: any = { left: `${x}px`, top: `${y}px` };
			if (param.width) {
				menuCss.width = `${param.width}px`;
			};

			U.Dom.css(menuEl, menuCss);

			if (isSub) {
				const coords = U.Common.objectCopy(keyboard.mouse.page);
				const offset = 8;

				let w = 0;
				let h = 0;
				let left = 0;
				let top = 0;
				let transform = '';
				let clipPath = '';

				if (type == I.MenuType.Vertical) {
					h = height;
					top = y;

					if (flipX || I.MenuDirection.Right) {
						left = x + width;
						w = Math.abs(x + width - coords.x) - offset;
						transform = 'scaleX(-1)';
					} else {
						left = coords.x + offset;
						w = Math.abs(x - coords.x) - offset;
					};

					clipPath = `polygon(0px ${oy - y}px, 0px ${oy - y + eh}px, 100% 100%, 100% 0%)`;
				};

				if (type == I.MenuType.Horizontal) {
					w = width;
					left = x;
					h = Math.abs(y - coords.y) - offset;
					top = y;
					clipPath = `polygon(0 ${height}px, 100% ${height}px, ${ox - x + ew}px 100%, ${ox - x}px 100%)`;
				};

				if (polyRef.current) {
					U.Dom.css(polyRef.current, { display: 'block' });
					U.Dom.css(polyRef.current, {
						width: `${w}px`,
						height: `${h}px`,
						left: `${left}px`,
						top: `${top}px`,
						clipPath,
						transform,
						position: (isFixed ? 'fixed' : 'absolute'),
						zIndex: '100000',
					});
				};

				window.clearTimeout(timeoutPoly.current);
				timeoutPoly.current = window.setTimeout(() => {
					if (polyRef.current) {
						U.Dom.css(polyRef.current, { display: 'none' });
					};
				}, 500);
			};

			// Arrow positioning

			if (withArrow && arrow) {
				const arrowDirection = getArrowDirection();
				const size = getSize();
				const { width, height } = size;
				const min = 8;
				const arrowCss: any = { left: '', right: '', top: '', bottom: '' };

				switch (arrowDirection) {
					case I.MenuDirection.Bottom:
					case I.MenuDirection.Top:

						switch (horizontal) {
							case I.MenuDirection.Left:
								if (ew > width) {
									arrowCss.left = width / 2 - ARROW_WIDTH / 2;
								} else {
									arrowCss.left = ew / 2 - ARROW_WIDTH / 2;
								};
								arrowCss.left = Math.max(min, Math.min(width - min, arrowCss.left));
								break;

							case I.MenuDirection.Center:
								if (ew > width) {
									arrowCss.left = width / 2 - ARROW_WIDTH / 2;
								} else {
									arrowCss.left = ox - x + ew / 2 - ARROW_WIDTH / 2;
								};
								arrowCss.left = Math.max(min, Math.min(width - min, arrowCss.left));
								break;

							case I.MenuDirection.Right:
								if (ew > width) {
									arrowCss.right = width / 2 - ARROW_WIDTH / 2;
								} else {
									arrowCss.right = ew / 2 - ARROW_WIDTH / 2;
								};
								arrowCss.right = Math.max(min, Math.min(width - min, arrowCss.right));
								break;
						};
						break;

					case I.MenuDirection.Left:
					case I.MenuDirection.Right:
						arrowCss.top = eh / 2 - ARROW_HEIGHT / 2;
						arrowCss.top = Math.max(min, Math.min(height - min, arrowCss.top));
						break;
				};

				U.Dom.css(arrow, {
					left: arrowCss.left !== '' ? `${arrowCss.left}px` : '',
					right: arrowCss.right !== '' ? `${arrowCss.right}px` : '',
					top: arrowCss.top !== '' ? `${arrowCss.top}px` : '',
					bottom: arrowCss.bottom !== '' ? `${arrowCss.bottom}px` : '',
				});
			};
		});
	};

	const close = (callBack?: () => void) => {
		S.Menu.close(props.id, () => {
			window.setTimeout(() => rebindPrevious(), S.Menu.getTimeout());
			callBack?.();
		});
	};

	const onDimmerClick = () => {
		if (!noClose) {
			close();
		};
	};
	
	const onMouseLeave = (e: any) => {
		if (isSub && polyRef.current) {
			U.Dom.css(polyRef.current, { display: 'none' });
		};
	};

	const getIndex = (): number => {
		return childRef.current ? Number(childRef.current.getIndex?.()) || 0 : -1;
	};

	const setIndex = (n: number) => {
		childRef.current?.setIndex?.(n);
	};

	const onKeyDown = (e: any) => {
		// Defense-in-depth: a leaked window keydown listener (e.g. one a
		// child menu added but never removed in its cleanup) would still
		// hold this closure after the menu unmounts. Bail out immediately
		// so no preventDefault on space ever fires for a dead menu.
		if (isUnmountedRef.current || !childRef.current || !childRef.current.getItems || keyboard.isComposition) {
			return;
		};

		const cmd = keyboard.cmdKey();
		
		let isClipboard = false;

		keyboard.shortcut(`${cmd}+c, ${cmd}+v, ${cmd}+x, ${cmd}+a`, e, () => isClipboard = true);

		if (isClipboard) {
			return;
		};

		e.stopPropagation();
		keyboard.disableMouse(true);

		const inputRef = getInputRef();
		const shortcutClose = [ 'escape' ];
		const shortcutSelect = [ 'tab', 'enter' ];
		const shortcutPrev = isMac ? 'arrowup, ctrl+p' : 'arrowup';
		const shortcutNext = isMac ? 'arrowdown, ctrl+n' : 'arrowdown';
			
		let index = getIndex();
		let ret = false;

		if (inputRef) {
			if (inputRef.isFocused() && (index < 0)) {
				keyboard.shortcut('arrowleft, arrowright', e, () => ret = true);

				keyboard.shortcut(shortcutNext, e, () => {
					inputRef.blur();

					setIndex(0);
					setActive(null, true);

					ret = true;
				});

				if (childRef.current && childRef.current.onClick && !preventFilter) {	
					keyboard.shortcut(shortcutSelect.join(', '), e, () => {
						e.preventDefault();

						const items = childRef.current.getItems();
						const item = items.length ? items[0] : null;

						if (item) {
							item.arrow && !item.skipOver && childRef.current.onOver ? childRef.current.onOver(e, item) : childRef.current.onClick(e, item);
						};
					});
				};

				keyboard.shortcut(shortcutPrev, e, () => {
					if (!childRef.current.getItems) {
						return;
					};

					setIndex(childRef.current.getItems().length - 1);
					setActive(null, true);

					inputRef?.blur();
					ret = true;
				});
			} else {
				keyboard.shortcut(shortcutPrev, e, () => {
					if (index < 0) {
						inputRef?.focus();

						setIndex(-1);
						setActive(null, true);

						ret = true;
					};
				});
			};
		};

		if (ret) {
			return;
		};

		if (!commonFilter && !keyboard.isFocused) {
			shortcutClose.push('arrowleft');
			shortcutSelect.push('arrowright');
		};

		keyboard.shortcut(shortcutClose.join(', '), e, () => {
			e.preventDefault();
			close();
		});

		if (!childRef.current || !childRef.current.getItems) {
			return;
		};

		const items = childRef.current.getItems();
		const l = items.length;
		
		index = getIndex();

		const item = items[index];
		const onArrow = (dir: number) => {
			index += dir;

			if (index < 0) {
				if ((index == -1) && inputRef) {
					index = -1;
					inputRef.focus();
				} else {
					index = l - 1;
				};
			};

			if (index > l - 1) {
				index = 0;
			};

			setIndex(index);

			const item = items[index];
			if (!item) {
				return;
			};

			if ((item.isDiv || item.isSection || item.isEmpty) && (items.length > 1)) {
				onArrow(dir);
				return;
			};

			setActive(null, true, dir);

			if (!item.arrow && childRef.current.onOver) {
				childRef.current.onOver(e, item);
			};
		};

		keyboard.shortcut(shortcutPrev, e, () => {
			e.preventDefault();
			onArrow(-1);
		});

		keyboard.shortcut(shortcutNext, e, () => {
			e.preventDefault();
			onArrow(1);
		});

		if (childRef.current && childRef.current.onClick) {	
			keyboard.shortcut(shortcutSelect.join(', '), e, () => {
				e.preventDefault();
				if (item) {
					item.arrow && !item.skipOver && childRef.current.onOver ? childRef.current.onOver(e, item) : childRef.current.onClick(e, item);
				};
			});
		};

		if (childRef.current && childRef.current.onSortEnd) {
			keyboard.shortcut('shift+arrowup, shift+arrowdown', e, (pressed: string) => {
				e.preventDefault();
				onSortMove(pressed.match('arrowup') ? -1 : 1);
			});
		};

		if (!keyboard.isFocused && (!inputRef || (inputRef && !inputRef.isFocused()))) {
			if (childRef.current && childRef.current.onRemove) {
				keyboard.shortcut('backspace', e, () => {
					e.preventDefault();

					setIndex(index - 1);
					checkIndex();
					childRef.current.onRemove(e, item);
					setActive(null, true);
				});
			};

			if (childRef.current && childRef.current.onSwitch) {
				keyboard.shortcut('space', e, () => {
					e.preventDefault();

					childRef.current.onSwitch(e, item);
				});
			};
		};
	};

	const getInputRef = () => {
		return childRef.current?.getFilterRef?.();
	};

	const getListRef = () => {
		return childRef.current?.getListRef?.();
	};

	const onSortMove = (dir: number) => {
		const items = childRef.current.getItems();
		const index = getIndex();

		setIndex(index + dir);
		checkIndex();
		childRef.current.onSortEnd({ active: items[index], over: items[getIndex()] });
	};

	const checkIndex = () => {
		const items = childRef.current.getItems();
		
		let index = getIndex();
		index = Math.max(0, index);
		index = Math.min(items.length - 1, index);

		setIndex(index);
	};

	const setActive = (item?: any, scroll?: boolean, dir?: number) => {
		dir = dir || 1;

		if (!childRef.current || !childRef.current.getItems) {
			return;
		};

		const inputRef = getInputRef();	
		const listRef = getListRef();

		let index = getIndex();
		if ((index < 0) && inputRef) {
			inputRef.focus();
		};

		const items = childRef.current.getItems();
		if (item && (undefined !== item.id)) {
			index = items.findIndex(it => it.id == item.id);
		};

		if (scroll) {
			if (childRef.current.scrollToRow) {
				childRef.current.scrollToRow(items, Math.max(0, index));
			} else
			if (listRef) {
				listRef.scrollToRow(Math.max(0, index));
			};
		};

		const next = items[index];
		if (!next) {
			return;
		};

		if (next.isDiv || next.isSection || next.isEmpty) {
			index += dir;
			setIndex(index);

			if (items[index]) {
				setActive(items[index], scroll);
			};
		} else {
			setHover(next, scroll);
		};

		setIndex(index);
	};
	
	const setHover = (item?: any, scroll?: boolean) => {
		const container = containerRef.current;
		if (!container) {
			return;
		};

		U.Dom.selectAll('.item.hover', container).forEach(el => U.Dom.removeClass(el as HTMLElement, 'hover'));

		if (!item) {
			return;
		};

		let el: HTMLElement | null = null;
		if (item.itemId) {
			el = U.Dom.select(`#item-${U.Common.esc(item.itemId)}`, container);
		};
		if (item.id && !el) {
			el = U.Dom.select(`#item-${U.Common.esc(item.id)}`, container);
		};

		if (!el) {
			return;
		};

		U.Dom.addClass(el, 'hover');

		if (scroll) {
			let scrollWrap = U.Dom.select('.scrollWrap', nodeRef.current);
			if (!scrollWrap) {
				scrollWrap = U.Dom.select('.content', nodeRef.current);
			};

			if (scrollWrap) {
				const st = scrollWrap.scrollTop;
				const pt = el.offsetTop;
				const eh = el.offsetHeight;
				const ch = U.Dom.contentHeight(scrollWrap);
				const top = Math.max(0, st + pt + eh - J.Size.menuBorder - ch);

				scrollWrap.scrollTop = top;
			};
		};
	};

	const storageGet = () => {
		return Storage.get(getId()) || {};
	};

	const storageSet = (data: any) => {
		const current = storageGet();
		Storage.set(getId(), Object.assign(current, data));
	};

	const getId = (): string => {
		let id = '';

		if (tab) {
			const item = tabs.find(it => it.id == tab);
			if (item) {
				id = item.component;
			};
		} else {
			id = props.id;
		};

		return U.String.toCamelCase(`menu-${id}`);
	};

	const getContainer = (): HTMLElement | null => {
		return containerRef.current;
	};

	const getElement = (): HTMLElement | null => {
		const { element } = props.param;
		if (!element) return null;
		if (element instanceof HTMLElement) return element;
		if (typeof element === 'string') return U.Dom.select(element);
		return null;
	};

	const getSize = (): { width: number; height: number; } => {
		const el = containerRef.current;
		return { width: el?.offsetWidth ?? 0, height: el?.offsetHeight ?? 0 };
	};

	const getPosition = (): DOMRect => {
		return containerRef.current ? U.Dom.getElementRect(containerRef.current) : null;
	};

	const getArrowDirection = (): I.MenuDirection => {
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

	const getMaxHeight = (isPopup: boolean): number => {
		return (U.Dom.getScrollContainer(isPopup)?.clientHeight || 0) - getBorderTop() - getBorderBottom();
	};

	const menuId = getId();
	const arrowDirection = getArrowDirection();
	const cn = [
		'menu',
		(type == I.MenuType.Horizontal ? 'horizontal' : 'vertical'),
		`v${vertical}`,
		`h${horizontal}`
	];
	const cd = [];
	
	let title = '';
	let Component = null;

	if (param.title) {
		title = param.title;
	};

	if (component) {
		cn.push(U.String.toCamelCase(`menu-${component}`));
	} else {
		cn.push(menuId);
	};

	if (tab) {
		const item = tabs.find(it => it.id == tab);
		if (item) {
			Component = Components[item.component];
		};
	} else
	if (component) {
		Component = Components[component];
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
		cd.push('passThrough');
	};

	const Tab = (item: any) => (
		<div className={[ 'tab', (item.id == tab ? 'active' : '') ].join(' ')} onClick={e => setTab(item.id)}>
			{item.name}
		</div>
	);

	return (
		<div 
			ref={nodeRef}
			id={`${menuId}-wrap`} 
			className="menuWrap"
		>
			<div
				ref={containerRef}
				id={menuId}
				className={cn.join(' ')}
				onMouseLeave={onMouseLeave}
			>
				{tabs.length ? (
					<div className="tabs">
						{tabs.map((item: any, i: number) => (
							<Tab key={i} {...item} />
						))}
					</div>
				) : ''}

				{title ? (
					<div className="titleWrapper">
						{withBack ? <Icon name="common/back" className="arrow back" onClick={() => onBack(id)} /> : ''}
						<Title text={title} />
					</div>
				) : ''}

				{param.data?.satellite || ''}

				<div className="content">
					<Component
						ref={childRef}
						{...props}
						setActive={setActive}
						setHover={setHover}
						onKeyDown={onKeyDown}
						storageGet={storageGet}
						storageSet={storageSet}
						getId={getId}
						getContainer={getContainer}
						getSize={getSize}
						getPosition={getPosition}
						getMaxHeight={getMaxHeight}
						position={position}
						close={close}
						/>
				</div>
				
				{withArrow ? <Icon id="arrowDirection" className={[ 'arrowDirection', `c${arrowDirection}` ].join(' ')} /> : ''}
			</div>
			{!noDimmer ? (
				<Dimmer onClick={onDimmerClick} className={cd.join(' ')} />
			) : ''}
		</div>
	);
	
});

export default Menu;
