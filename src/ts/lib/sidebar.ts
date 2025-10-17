import $ from 'jquery';
import raf from 'raf';
import { I, U, S, J, Storage, keyboard, analytics } from 'Lib';

interface SidebarData {
	width: number;
	isClosed: boolean;
};

const STORAGE_KEY = 'sidebarData';

class Sidebar {
	
	panelData = {
		[I.SidebarPanel.Left]: { width: 0, isClosed: false } as SidebarData,
		[I.SidebarPanel.SubLeft]: { width: 0, isClosed: false } as SidebarData,
		[I.SidebarPanel.Right]: { width: 0, isClosed: false } as SidebarData,
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
	isAnimating = false;
	timeoutAnim = 0;

	/**
	 * Initializes sidebar objects and state from storage.
	 */
	init () {
		this.initObjects(false);

		const stored = Storage.get(STORAGE_KEY, Storage.isLocal(STORAGE_KEY));

		if (stored) {
			const keys = [ I.SidebarPanel.Left, I.SidebarPanel.SubLeft ];
			for (const key of keys) {
				const data = stored[key];

				if (!data) {
					continue;
				};

				if ('undefined' == typeof(data.isClosed)) {
					data.isClosed = !data.width;
				};

				this.set(key, data);
			};
		} else {
			this.set(I.SidebarPanel.Left, { width: J.Size.sidebar.width.default, isClosed: false });
			this.set(I.SidebarPanel.SubLeft, { width: J.Size.sidebar.width.default, isClosed: false });
			this.resizePage(null, null, false);
		};
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
	};

	getData (panel: I.SidebarPanel): SidebarData {
		return this.panelData[panel] || { width: J.Size.sidebar.width.default, isClosed: false };
	};

	open (panel: I.SidebarPanel, subPage?: string, width?: number): void {
		switch (panel) {
			case I.SidebarPanel.Left: {
				this.leftPanelOpen(width);
				break;
			};

			case I.SidebarPanel.SubLeft: {
				if (!subPage) {
					subPage = S.Common.getLeftSidebarState().subPage;
				};

				this.leftPanelSubPageOpen(subPage);
				break;
			};
		};
	};

	close (panel: I.SidebarPanel): void {
		switch (panel) {
			case I.SidebarPanel.Left: {
				this.leftPanelClose();
				break;
			};

			case I.SidebarPanel.SubLeft: {
				this.leftPanelSubPageClose();
				break;
			};
		};
	};

	/**
	 * Closes the sidebar with animation and updates state.
	 */
	leftPanelClose (): void {
		const { width, isClosed } = this.getData(I.SidebarPanel.Left);

		if (!this.objLeft || !this.objLeft.length || this.isAnimating || isClosed) {
			return;
		};

		this.setAnimating(true);
		this.pageWrapperLeft.addClass('anim');
		this.setElementsWidth(width);
		this.setStyle(I.SidebarPanel.Left, { width: 0 });
		this.set(I.SidebarPanel.Left, { isClosed: true });
		this.resizePage(0, null, true);

		this.removeAnimation(() => {
			this.pageWrapperLeft.addClass('isClosed');

			window.clearTimeout(this.timeoutAnim);
			$(window).trigger('resize');
			this.setAnimating(false);
		});
	};

	/**
	 * Opens the sidebar to the specified width with animation.
	 * @param {number} [width] - The width to open the sidebar to.
	 */
	leftPanelOpen (width?: number): void {
		const { isClosed } = this.getData(I.SidebarPanel.Left);

		if (!this.objLeft || !this.objLeft.length || this.isAnimating || !isClosed) {
			return;
		};

		this.setElementsWidth(width);
		this.setAnimating(true);
		this.pageWrapperLeft.addClass('anim').removeClass('isClosed');

		this.setStyle(I.SidebarPanel.Left, { width });
		this.set(I.SidebarPanel.Left, { isClosed: false });
		this.resizePage(width, null, true);

		this.removeAnimation(() => {
			$(window).trigger('resize');
			this.setAnimating(false);
		});
	};

	/**
	 * Toggles the sidebar open/close state.
	 */
	leftPanelToggle () {
		if (this.isAnimating) {
			return;
		};
		
		const { width, isClosed } = this.getData(I.SidebarPanel.Left);

		if (isClosed) {
			this.leftPanelOpen(width);
			analytics.event('ExpandSidebar');
		} else {
			this.leftPanelClose();
			analytics.event('CollapseSidebar');
		};

		S.Menu.closeAll();
	};

	/**
	 * Sets the width of sidebar elements.
	 * @param {any} width - The width to set.
	 */
	setElementsWidth (width: any): void {
		this.pageWrapperLeft.find('#head').css({ width });
		this.pageWrapperLeft.find('#body').css({ width });
	};

	/**
	 * Sets the sidebar width and updates layout.
	 * @param {number} w - The width to set.
	 */
	setWidth (panel: I.SidebarPanel, w: number): void {
		this.set(panel, { width: this.limitWidth(w), isClosed: false });
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
		const dataLeft = this.getData(I.SidebarPanel.Left);
		const dataSubLeft = this.getData(I.SidebarPanel.SubLeft);
		const vw = dataLeft.isClosed ? 0 : J.Size.sidebar.threshold;
		const menuOpen = S.Menu.isOpenList([ 'objectContext', 'widget', 'selectSidebarToggle', 'typeSuggest' ]);
		const popupOpen = S.Popup.isOpen();

		let show = false;
		let hide = false;

		if (x <= 10) {
			show = true;
		} else
		if (x >= dataLeft.width + dataSubLeft.width + vw + 30) {
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
			this.leftPanelOpen(dataLeft.width);
		};

		if (hide && !dataLeft.isClosed) {
			this.leftPanelClose();
		};
	};

	/**
	 * Resizes the page and sidebar elements based on sidebar widths and animation state.
	 * @param {number} widthLeft - The width of the left sidebar.
	 * @param {number} widthRight - The width of the right sidebar.
	 * @param {boolean} animate - Whether to animate the resize.
	 */
	resizePageInner (isPopup: boolean, widthLeft: number, widthRight: number, animate: boolean): void {
		this.initObjects(isPopup);

		if (!this.pageFlex || !this.pageFlex.length) {
			return;
		};

		const isMain = keyboard.isMain();
		const isMainVoidError = keyboard.isMainVoidError();
		const isMainHistory = keyboard.isMainHistory();
		const isPopupMainHistory = keyboard.isPopupMainHistory();
		const rightSidebar = S.Common.getRightSidebarState(isPopup);

		let leftButtonX = 12;

		if ((widthLeft === null) && this.objLeft && this.objLeft.length) {
			widthLeft = this.objLeft.outerWidth();
		};

		if ((widthRight === null) && this.objRight && this.objRight.length && rightSidebar.isOpen) {
			widthRight = this.objRight.outerWidth();
		};

		if (isPopup) {
			widthLeft = 0;
		};

		if (!isMain || isMainVoidError) {
			widthLeft = 0;
			widthRight = 0;
		};

		widthLeft = Number(widthLeft) || 0;
		widthRight = Number(widthRight) || 0;

		const { isFullScreen } = S.Common;
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
			this.pageFlex.toggleClass('sidebarAnimation', animate);
			this.dummyLeft.toggleClass('sidebarAnimation', animate);
			this.leftButton.toggleClass('sidebarAnimation', animate);
			this.header.toggleClass('withSidebarLeft', !!widthLeft);

			this.dummyLeft.css({ width: widthLeft });
			this.leftButton.css({ left: leftButtonX });
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
	set (panel: I.SidebarPanel, v: Partial<SidebarData>): void {
		this.panelData[panel] = Object.assign(this.panelData[panel], v);
		this.setStyle(panel, this.panelData[panel]);

		Storage.delete(STORAGE_KEY, Storage.isLocal(STORAGE_KEY));
		Storage.set(STORAGE_KEY, this.panelData, Storage.isLocal(STORAGE_KEY));
	};

	/**
	 * Sets the animating state of the sidebar.
	 * @param {boolean} v - The animating state.
	 */
	public setAnimating (v: boolean) {
		this.isAnimating = v;
	};

	private getWrapper (panel: I.SidebarPanel): JQuery<HTMLElement> {
		let obj = null;

		switch (panel) {
			case I.SidebarPanel.Left: {
				obj = this.pageWrapperLeft;
				break;
			};

			case I.SidebarPanel.SubLeft: {
				obj = this.subPageWrapperLeft;
				break;
			};
		};

		return obj;
	};

	/**
	 * Sets the style of the sidebar elements.
	 * @param {Partial<SidebarData>} v - The style data.
	 */
	private setStyle (panel: I.SidebarPanel, v: Partial<SidebarData>): void {
		const obj = this.getWrapper(panel);

		if (obj && obj.length) {
			obj.css({ width: v.isClosed ? 0 : v.width });
		};

		if (undefined !== v.isClosed) {
			obj.toggleClass('isClosed', v.isClosed);
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

	leftPanelSubPageToggle (id: string) {
		const { isClosed } = this.getData(I.SidebarPanel.SubLeft);

		if (isClosed) {
			this.leftPanelSubPageOpen(id);
		} else {
			this.leftPanelSubPageClose();
		};
	};

	leftPanelSubPageClose () {
		if (this.isAnimating) {
			return;
		};

		this.initObjects(false);

		const dataLeft = this.getData(I.SidebarPanel.Left);
		const width = dataLeft.isClosed ? 0 : dataLeft.width;

		this.subPageWrapperLeft.addClass('sidebarAnimation').css({ transform: 'translate3d(-100%,0px,0px)' });
		this.objLeft.addClass('sidebarAnimation').css({ width });
		this.dummyLeft.addClass('sidebarAnimation').css({ width });
		this.resizePage(width, null, true);
		this.setAnimating(true);

		window.setTimeout(() => {
			this.set(I.SidebarPanel.SubLeft, { isClosed: true });

			this.objLeft.removeClass('sidebarAnimation').css({ width: '' });
			this.subPageWrapperLeft.removeClass('sidebarAnimation').css({ transform: '' });
			this.dummyLeft.removeClass('sidebarAnimation');
			this.setAnimating(false);
			this.resizePage(null, null, false);
		}, J.Constant.delay.sidebar);
	};

	leftPanelSubPageOpen (id: string) {
		if (this.isAnimating) {
			return;
		};

		this.initObjects(false);

		const state = S.Common.getLeftSidebarState();
		const dataLeft = this.getData(I.SidebarPanel.Left);
		const dataSubLeft = this.getData(I.SidebarPanel.SubLeft);

		S.Common.setLeftSidebarState(state.page, id);

		if (!dataSubLeft.isClosed) {
			return;
		};


		const width = dataLeft.isClosed ? 0 : dataLeft.width;
		const newWidth = width + dataSubLeft.width;

		this.setStyle(I.SidebarPanel.Left, { width });
		this.subPageWrapperLeft.css({ transform: 'translate3d(-100%,0px,0px)' });
		this.objLeft.css({ width });
		this.dummyLeft.css({ width });
		this.setAnimating(true);
		this.set(I.SidebarPanel.SubLeft, { isClosed: false });

		raf(() => {
			this.subPageWrapperLeft.addClass('sidebarAnimation').css({ transform: 'translate3d(0px,0px,0px)' });
			this.objLeft.addClass('sidebarAnimation').css({ width: newWidth });
			this.dummyLeft.addClass('sidebarAnimation').css({ width: newWidth});
			this.resizePage(newWidth, null, true);

			window.setTimeout(() => {
				this.subPageWrapperLeft.removeClass('sidebarAnimation').css({ transform: '' });
				this.objLeft.removeClass('sidebarAnimation').css({ width: '' });
				this.dummyLeft.removeClass('sidebarAnimation');
				this.setAnimating(false);
			}, J.Constant.delay.sidebar);
		});
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