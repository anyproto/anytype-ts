import $ from 'jquery';
import raf from 'raf';
import { I, U, S, J, Storage, keyboard, analytics } from 'Lib';

interface SidebarData {
	width: number;
	isClosed: boolean;
};

class Sidebar {
	
	data: SidebarData = {
		width: 0,
		isClosed: false,
	};

	objLeft: JQuery<HTMLElement> = null;
	pageWrapperLeft: JQuery<HTMLElement> = null;
	subPageWrapperLeft: JQuery<HTMLElement> = null;
	objRight: JQuery<HTMLElement> = null;
	dummyLeft: JQuery<HTMLElement> = null;

	page: JQuery<HTMLElement> = null;
	pageFlex: JQuery<HTMLElement> = null;
	header: JQuery<HTMLElement> = null;
	footer: JQuery<HTMLElement> = null;
	loader: JQuery<HTMLElement> = null;
	leftButton: JQuery<HTMLElement> = null;
	rightButton: JQuery<HTMLElement> = null;
	isAnimating = false;
	timeoutAnim = 0;

	/**
	 * Initializes sidebar objects and state from storage.
	 */
	init () {
		this.initObjects(false);

		const stored = Storage.get('sidebar', Storage.isLocal('sidebar'));

		if (stored) {
			if ('undefined' == typeof(stored.isClosed)) {
				stored.isClosed = !stored.width;
			};

			this.set(stored);
		} else {
			this.set({ width: J.Size.sidebar.width.default, isClosed: false });
			this.resizePage(null, null, false);
		};

		this.objLeft.toggleClass('isClosed', this.data.isClosed);
	};

	/**
	 * Initializes DOM object references for sidebar elements.
	 */
	initObjects (isPopup: boolean) {
		this.objLeft = $(S.Common.getRef('sidebarLeft')?.getNode());
		this.pageWrapperLeft = this.objLeft.find('#pageWrapper');
		this.subPageWrapperLeft = this.objLeft.find('#subPageWrapper');
		this.pageFlex = U.Common.getPageFlexContainer(isPopup);
		this.page = U.Common.getPageContainer(isPopup);
		this.header = this.page.find('#header');
		this.footer = this.page.find('#footer');
		this.loader = this.page.find('#loader');
		this.objRight = this.pageFlex.find('#sidebarRight');
		this.dummyLeft = $('#sidebarDummyLeft');
		this.leftButton = $('#sidebarLeftButton');
		this.rightButton = $('#sidebarRightButton');
	};

	/**
	 * Closes the sidebar with animation and updates state.
	 */
	close (): void {
		const { width, isClosed } = this.data;

		if (!this.objLeft || !this.objLeft.length || this.isAnimating || isClosed) {
			return;
		};

		this.setAnimating(true);
		S.Common.setLeftSidebarState('vault', '');

		this.pageWrapperLeft.addClass('anim');
		this.setElementsWidth(width);
		this.setStyle({ width: 0 });
		this.set({ isClosed: true });
		this.resizePage(0, null, true);

		this.removeAnimation(() => {
			this.objLeft.addClass('isClosed');

			window.clearTimeout(this.timeoutAnim);
			$(window).trigger('resize');
			this.setAnimating(false);
		});
	};

	/**
	 * Opens the sidebar to the specified width with animation.
	 * @param {number} [width] - The width to open the sidebar to.
	 */
	open (width?: number): void {
		if (!this.objLeft || !this.objLeft.length || this.isAnimating || !this.data.isClosed) {
			return;
		};

		this.setElementsWidth(width);
		this.setAnimating(true);

		this.objLeft.removeClass('isClosed');
		this.pageWrapperLeft.addClass('anim');

		this.setStyle({ width });
		this.set({ isClosed: false });
		this.resizePage(width, null, true);

		this.removeAnimation(() => {
			$(window).trigger('resize');
			this.setAnimating(false);
		});
	};

	/**
	 * Toggles the sidebar open/close state.
	 */
	toggleOpenClose () {
		if (this.isAnimating) {
			return;
		};
		
		const { width, isClosed } = this.data;

		if (isClosed) {
			this.open(width);
			analytics.event('ExpandSidebar');
		} else {
			this.close();
			analytics.event('CollapseSidebar');
		};

		S.Menu.closeAll();
	};

	/**
	 * Sets the width of sidebar elements.
	 * @param {any} width - The width to set.
	 */
	setElementsWidth (width: any): void {
		this.objLeft.find('#head').css({ width });
		this.objLeft.find('#body').css({ width });
	};

	/**
	 * Sets the sidebar width and updates layout.
	 * @param {number} w - The width to set.
	 */
	setWidth (w: number): void {
		w = this.limitWidth(w);

		this.set({ width: w, isClosed: false });
		this.resizePage(null, null, false);
	};

	private removeAnimation (callBack?: () => void): void {
		if (!this.objLeft || !this.objLeft.length) {
			return;
		};

		window.clearTimeout(this.timeoutAnim);
		this.timeoutAnim = window.setTimeout(() => {
			this.pageWrapperLeft.removeClass('anim');
			this.setElementsWidth('');

			if (callBack) {
				callBack();
			};
		}, J.Constant.delay.sidebar);
	};

	/**
	 * Handles mouse move events for sidebar hover and auto-show/hide.
	 */
	onMouseMove (): void {
		const { hideSidebar } = S.Common;

		if (!this.objLeft || !this.objLeft.length || keyboard.isDragging || keyboard.isResizing) {
			return;
		};

		if (
			this.isAnimating ||
			!hideSidebar
		) {
			return;
		};

		const { x } = keyboard.mouse.page;
		const { width, isClosed } = this.data;
		const vw = isClosed ? 0 : J.Size.sidebar.threshold;
		const menuOpen = S.Menu.isOpenList([ 'objectContext', 'widget', 'selectSidebarToggle', 'typeSuggest' ]);
		const popupOpen = S.Popup.isOpen();

		let show = false;
		let hide = false;

		if (x <= 10) {
			show = true;
		} else
		if (x >= width + vw + 30 + J.Size.sidebar.sub) {
			hide = true;
		};

		if (popupOpen) {
			show = false;
		};

		if (menuOpen) {
			show = false;
			hide = false;
		};

		if (show) {
			this.open(width);
		};

		if (hide && !isClosed) {
			this.close();
		};
	};

	/**
	 * Resizes the page and sidebar elements based on sidebar widths and animation state.
	 * @param {number} widthLeft - The width of the left sidebar.
	 * @param {number} widthRight - The width of the right sidebar.
	 * @param {boolean} animate - Whether to animate the resize.
	 */
	resizePageInner (isPopup: boolean, widthLeft: number, widthRight: number, animate: boolean): void {
		const isMain = keyboard.isMain();
		const isMainVoidError = keyboard.isMainVoidError();
		const isMainHistory = keyboard.isMainHistory();
		const isPopupMainHistory = keyboard.isPopupMainHistory();
		const rightSidebar = S.Common.getRightSidebarState(isPopup);

		this.initObjects(isPopup);

		let leftButtonX = 12;
		let rightButtonX = 52;

		if ((widthLeft === null) && this.objLeft && this.objLeft.length) {
			widthLeft = this.objLeft.outerWidth();
		};

		if ((widthRight === null) && this.objRight && this.objRight.length && rightSidebar.isOpen) {
			widthRight = this.objRight.outerWidth();
		};

		const { isFullScreen } = S.Common;

		if (isPopup) {
			widthLeft = 0;
		};

		if (!isMain || isMainVoidError) {
			widthLeft = 0;
			widthRight = 0;
		};

		widthLeft = Number(widthLeft) || 0;
		widthRight = Number(widthRight) || 0;

		const container = U.Common.getScrollContainer(isPopup);
		const pageWidth = this.pageFlex.width() - widthLeft - widthRight;
		const ho = isMainHistory || isPopupMainHistory ? J.Size.history.panel : 0;
		const hw = pageWidth - ho;
		const pageCss: any = { width: pageWidth };

		if (!isPopup) {
			pageCss.height = U.Common.getAppContainerHeight() - 16;
		};

		if (U.Common.isPlatformMac() && !isFullScreen) {
			leftButtonX = 84;
			rightButtonX = 120;
		};

		if (widthLeft) {
			rightButtonX = widthLeft - 40;
		};

		this.header.css({ width: '' });
		this.footer.css({ width: '' });

		this.header.toggleClass('sidebarAnimation', animate);
		this.footer.toggleClass('sidebarAnimation', animate);
		this.page.toggleClass('sidebarAnimation', animate);

		this.loader.css({ width: pageWidth, right: 0 });
		this.header.css({ width: hw });
		this.footer.css({ width: hw });
		this.page.css(pageCss);

		this.pageFlex.toggleClass('withSidebarLeft', !!widthLeft);
		this.pageFlex.toggleClass('withSidebarRight', !!widthRight);

		if (!isPopup) {
			this.dummyLeft.toggleClass('sidebarAnimation', animate);
			this.leftButton.toggleClass('sidebarAnimation', animate);
			this.rightButton.toggleClass('sidebarAnimation', animate);
			this.header.toggleClass('withSidebarLeft', !!widthLeft);
			this.rightButton.toggleClass('withSidebar', !!widthLeft);

			this.dummyLeft.css({ width: widthLeft });
			this.leftButton.css({ left: leftButtonX });
			this.rightButton.css({ left: rightButtonX });
		} else {
			this.objRight.css({ height: container.height() });
		};

		$(window).trigger('sidebarResize');
	};

	resizePage (widthLeft: number, widthRight: number, animate: boolean): void {
		this.resizePageInner(false, widthLeft, widthRight, animate);
		this.resizePageInner(true, widthLeft, widthRight, animate);
	};

	/**
	 * Sets the sidebar data and updates the style.
	 * @param {Partial<SidebarData>} v - The new sidebar data.
	 */
	set (v: Partial<SidebarData>): void {
		v = Object.assign(this.data, v);

		this.data = Object.assign<SidebarData, Partial<SidebarData>>(this.data, { 
			width: this.limitWidth(v.width),
		});

		Storage.set('sidebar', this.data, Storage.isLocal('sidebar'));
		this.setStyle(this.data);
	};

	/**
	 * Sets the animating state of the sidebar.
	 * @param {boolean} v - The animating state.
	 */
	public setAnimating (v: boolean) {
		this.isAnimating = v;
	};

	/**
	 * Sets the style of the sidebar elements.
	 * @param {Partial<SidebarData>} v - The style data.
	 */
	private setStyle (v: Partial<SidebarData>): void {
		if (this.pageWrapperLeft && this.pageWrapperLeft.length) {
			this.pageWrapperLeft.css({ width: v.isClosed ? 0 : v.width });
		};
	};

	/**
	 * Limits the sidebar width to the allowed min and max bounds.
	 * @param {number} width - The width to limit.
	 * @returns {number} The limited width.
	 */
	private limitWidth (width: number): number {
		const { min, max } = J.Size.sidebar.width;
		return Math.max(min, Math.min(max, Number(width) || 0));
	};

	/**
	 * Gets the width of the sidebar dummy element.
	 * @returns {number} The dummy width.
	 */
	getDummyWidth (): number {
		return Number($('#sidebarDummyLeft').outerWidth()) || 0;
	};

	/**
	 * Gets the reference to the right panel for the given context.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 * @returns {any} The right panel reference.
	 */
	rightPanelRef (isPopup: boolean) {
		const namespace = U.Common.getEventNamespace(isPopup);
		return S.Common.getRef(`sidebarRight${namespace}`);
	};

	rightPanelRestore (isPopup: boolean) {
		this.initObjects(isPopup);

		const rightSidebar = S.Common.getRightSidebarState(isPopup);
		const { isOpen } = rightSidebar;
		const css: any = {};

		if (isOpen) {
			css.right = 0;
		} else {
			css.right = -J.Size.sidebar.right;
			this.objRight.hide();
		};
		
		this.objRight.css(css);
	};

	/**
	 * Toggles the right panel open or closed with animation.
	 * @param {boolean} v - Whether to open the panel.
	 * @param {boolean} animate - Whether to animate the toggle.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 * @param {string} [page] - The page to show in the panel.
	 * @param {any} [param] - Additional parameters for the panel.
	 */
	rightPanelToggle (animate: boolean, isPopup: boolean, page?: string, param?: any) {
		const rightSidebar = S.Common.getRightSidebarState(isPopup);
		const shouldOpen = !rightSidebar.isOpen || (rightSidebar.page != page);

		if (rightSidebar.isOpen && (page != rightSidebar.page)) {
			animate = false;
		};

		// open the panel if it is different page from the current page
		if (shouldOpen) {
			S.Common.setRightSidebarState(isPopup, page, true);
		} else {
			S.Common.setRightSidebarState(isPopup, '', false);
		};

		this.rightPanelSetState(isPopup, { page: '' });
		this.initObjects(isPopup);

		const width = this.objRight.outerWidth();
		const cssStart: any = {};
		const cssEnd: any = {};

		if (shouldOpen) {
			cssStart.right = -width;
			cssEnd.right = 0;
		} else {
			cssStart.right = 0;
			cssEnd.right = -width;
		};

		this.objRight.show().css(cssStart);

		raf(() => {
			if (animate) {
				this.objRight.addClass('anim');
			};

			this.objRight.css(cssEnd);
			this.resizePageInner(isPopup, null, shouldOpen ? null : 0, animate);

			window.setTimeout(() => {
				if (shouldOpen) {
					this.rightPanelSetState(isPopup, { page, ...param });
				} else {
					this.objRight.hide();
				};

				this.objRight.removeClass('anim');
			}, animate ? J.Constant.delay.sidebar : 0);
		});

		window.setTimeout(() => {
			if (animate) {
				this.objRight.removeClass('anim');
			};

			if (!shouldOpen) {
				S.Common.setRightSidebarState(isPopup, '', false);
			};

			$(window).trigger('resize');
		}, animate ? J.Constant.delay.sidebar : 0);
	};

	leftPanelSubPageToggle (id: string) {
		this.initObjects(false);

		const state = S.Common.getLeftSidebarState();
		const open = id && !state.subPage;
		const { width, isClosed } = this.data;

		if (open) {
			S.Common.setLeftSidebarState(state.page, id);

			const width = isClosed ? 0 : this.data.width;
			const newWidth = width + J.Size.sidebar.sub;

			this.setStyle({ width });
			this.subPageWrapperLeft.css({ transform: 'translate3d(-100%,0px,0px)' });
			this.objLeft.css({ width });
			this.dummyLeft.css({ width });

			raf(() => {
				this.subPageWrapperLeft.addClass('sidebarAnimation').css({ transform: 'translate3d(0px,0px,0px)' });
				this.objLeft.addClass('sidebarAnimation').css({ width: newWidth });
				this.dummyLeft.addClass('sidebarAnimation').css({ width: newWidth});
				this.resizePage(newWidth, null, true);

				window.setTimeout(() => {
					this.subPageWrapperLeft.removeClass('sidebarAnimation').css({ transform: '' });
					this.objLeft.removeClass('sidebarAnimation').css({ width: '' });
					this.dummyLeft.removeClass('sidebarAnimation');
				}, J.Constant.delay.sidebar);
			});
		} else {
			this.subPageWrapperLeft.addClass('sidebarAnimation').css({ transform: 'translate3d(-100%,0px,0px)' });
			this.objLeft.addClass('sidebarAnimation').css({ width });
			this.dummyLeft.addClass('sidebarAnimation').css({ width });
			this.resizePage(width, null, true);

			window.setTimeout(() => {
				S.Common.setLeftSidebarState(state.page, '');

				this.objLeft.removeClass('sidebarAnimation').css({ width: '' });
				this.subPageWrapperLeft.removeClass('sidebarAnimation').css({ transform: '' });
				this.dummyLeft.removeClass('sidebarAnimation');

			}, J.Constant.delay.sidebar);
		};
	};

	/**
	 * Sets the state of the right panel for the given context.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 * @param {any} v - The state to set.
	 */
	rightPanelSetState (isPopup: boolean, v: any) {
		const rightSidebar = S.Common.getRightSidebarState(isPopup);
		const { isOpen, page } = rightSidebar;

		v.page = v.page || page;

		S.Common.setRightSidebarState(isPopup, v.page, isOpen);
		this.rightPanelRef(isPopup)?.setState(v);
	};

	/**
	 * Gets the state of the right panel for the given context.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 */
	rightPanelGetState (isPopup: boolean) {
		return this.rightPanelRef(isPopup)?.getState() || {};
	};

	/**
	 * Closes the right panel for the given context.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 */
	rightPanelClose (isPopup: boolean) {
		S.Common.setRightSidebarState(isPopup, '', false);
		this.rightPanelRestore(isPopup);
	};

};

export const sidebar: Sidebar = new Sidebar();