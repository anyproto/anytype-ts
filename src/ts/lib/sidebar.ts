import $ from 'jquery';
import raf from 'raf';
import { analytics, I, J, keyboard, S, Storage, U } from 'Lib';

interface SidebarData {
	width: number;
	isClosed: boolean;
};

/**
 * Sidebar manages the left and right sidebar panels in the application.
 *
 * Key responsibilities:
 * - Opening/closing sidebar panels with animations
 * - Managing panel widths and persisting state to storage
 * - Handling auto-show/hide on mouse hover
 * - Resizing the main page content when sidebars change
 * - Managing sub-pages within the left sidebar
 *
 * Sidebar panels:
 * - Left: Main navigation sidebar (vault/space navigation)
 * - SubLeft: Secondary left panel for widgets/sub-navigation
 * - Right: Context-sensitive sidebar (object details, etc.)
 *
 * Each panel has its own width and open/closed state that is
 * persisted to local storage.
 */
class Sidebar {
	
	panelData = {
		[I.SidebarPanel.Left]: { width: 0, isClosed: false } as SidebarData,
		[I.SidebarPanel.SubLeft]: { width: 0, isClosed: false } as SidebarData,
		[I.SidebarPanel.Right]: { width: 0, isClosed: false } as SidebarData,
	};

	isAnimating = false;
	timeoutAnim = 0;

	/**
	 * Initializes sidebar objects and state from storage.
	 */
	init (isPopup: boolean) {
		const key = J.Constant.storageKey.sidebarData;
		const stored = Storage.get(key, Storage.isLocal(key));

		for (const panel of [ I.SidebarPanel.Left, I.SidebarPanel.SubLeft, I.SidebarPanel.Right ]) {
			if (isPopup && (panel != I.SidebarPanel.Right)) {
				continue;
			};

			const data = stored?.[panel] || {};
			const param = this.getSizeParam(panel);
			const width = this.limitWidth(panel, data.width || param.default);
			const isClosed = (undefined !== data.isClosed) && (panel != I.SidebarPanel.Right) ? Boolean(data.isClosed) : true;

			this.setData(panel, isPopup, { width, isClosed }, false);
		};

		this.resizePage(isPopup, null, null, false);
	};

	getData (panel: I.SidebarPanel, isPopup?: boolean): SidebarData {
		const ns = U.Common.getEventNamespace(isPopup);
		const key = [ panel, ns ].join('');
		const param = this.getSizeParam(panel);

		return this.panelData[key] || { width: param.default, isClosed: true };
	};

	/**
	 * Sets the sidebar data and updates the style.
	 * @param {Partial<SidebarData>} v - The new sidebar data.
	 */
	setData (panel: I.SidebarPanel, isPopup: boolean, v: Partial<SidebarData>, save: boolean): void {
		const storageKey = J.Constant.storageKey.sidebarData;
		const ns = U.Common.getEventNamespace(isPopup);
		const key = [ panel, ns ].join('');

		this.panelData[key] = Object.assign(this.panelData[key] || {}, v);
		this.setStyle(panel, isPopup, this.panelData[key]);

		if (save) {
			Storage.set(storageKey, this.panelData, Storage.isLocal(storageKey));
		};
	};

	open (panel: I.SidebarPanel, subPage?: string, width?: number): void {
		switch (panel) {
			case I.SidebarPanel.Left: {
				this.leftPanelOpen(width, true, true);
				break;
			};

			case I.SidebarPanel.SubLeft: {
				if (!subPage) {
					subPage = S.Common.getLeftSidebarState().subPage;
				};

				this.leftPanelSubPageOpen(subPage, true, true);
				break;
			};
		};
	};

	close (panel: I.SidebarPanel): void {
		switch (panel) {
			case I.SidebarPanel.Left: {
				this.leftPanelClose(true, true);
				break;
			};

			case I.SidebarPanel.SubLeft: {
				this.leftPanelSubPageClose(true, true);
				break;
			};
		};
	};

	toggle (panel: I.SidebarPanel, subPage?: string): void {
		switch (panel) {
			case I.SidebarPanel.Left: {
				this.leftPanelToggle();
				break;
			};

			case I.SidebarPanel.SubLeft: {
				this.leftPanelSubPageToggle(subPage);
				break;
			};
		};
	};

	/**
	 * Closes the sidebar with animation and updates state.
	 */
	leftPanelClose (animate: boolean, save: boolean): void {
		const { isClosed } = this.getData(I.SidebarPanel.Left);
		if (this.isAnimating || isClosed) {
			return;
		};


		const objLeft = this.leftPanelGetNode();
		const pageWrapperLeft = objLeft.find('#pageWrapper');

		if (!pageWrapperLeft || !pageWrapperLeft.length) {
			return;
		};

		const dataSubLeft = this.getData(I.SidebarPanel.SubLeft);
		const newWidth = dataSubLeft.isClosed ? 0 : dataSubLeft.width;

		if (animate) {
			pageWrapperLeft.addClass('anim');
		};

		this.setStyle(I.SidebarPanel.Left, false, { width: 0 });
		this.setData(I.SidebarPanel.Left, false, { isClosed: true }, save);
		this.resizePage(false, newWidth, null, animate);

		window.clearTimeout(this.timeoutAnim);
		this.timeoutAnim = window.setTimeout(() => {
			pageWrapperLeft.removeClass('anim').addClass('isClosed');
		}, animate ? J.Constant.delay.sidebar : 0);

		analytics.event('CollapseVault');
	};

	/**
	 * Opens the sidebar to the specified width with animation.
	 * @param {number} [width] - The width to open the sidebar to.
	 */
	leftPanelOpen (width: number, animate: boolean, save: boolean): void {
		const { isClosed } = this.getData(I.SidebarPanel.Left);
		if (this.isAnimating || !isClosed) {
			return;
		};

		const objLeft = this.leftPanelGetNode();
		const pageWrapperLeft = objLeft.find('#pageWrapper');

		if (!pageWrapperLeft || !pageWrapperLeft.length) {
			return;
		};

		const dataSubLeft = this.getData(I.SidebarPanel.SubLeft);
		const newWidth = width + (dataSubLeft.isClosed ? 0 : dataSubLeft.width);

		if (animate) {
			pageWrapperLeft.addClass('anim');
		};

		pageWrapperLeft.removeClass('isClosed');

		this.setStyle(I.SidebarPanel.Left, false, { width });
		this.setData(I.SidebarPanel.Left, false, { isClosed: false }, save);
		this.resizePage(false, newWidth, null, animate);

		window.clearTimeout(this.timeoutAnim);
		this.timeoutAnim = window.setTimeout(() => {
			pageWrapperLeft.removeClass('anim');
		}, animate ? J.Constant.delay.sidebar : 0);

		analytics.event('ExpandVault');
	};

	/**
	 * Toggles the sidebar open/close state.
	 */
	leftPanelToggle () {
		if (this.isAnimating) {
			return;
		};
		
		const { width, isClosed } = this.getData(I.SidebarPanel.Left);

		isClosed ? this.leftPanelOpen(width, true, true) : this.leftPanelClose(true, true);
		S.Menu.closeAll();
		analytics.event(isClosed ? 'ExpandSidebar' : 'CollapseSidebar');
	};

	/**
	 * Closes the sidebar with animation and updates state.
	 */
	rightPanelClose (isPopup: boolean, animate?: boolean): void {
		const { isClosed } = this.getData(I.SidebarPanel.Right, isPopup);
		if (this.isAnimating || isClosed) {
			return;
		};

		const obj = this.rightPanelGetNode(isPopup);

		if (!obj || !obj.length) {
			return;
		};

		if (animate) {
			obj.addClass('sidebarAnimation');
		};

		obj.css({ transform: 'translate3d(100%,0px,0px)' });
		this.resizePage(isPopup, null, 0, animate);

		window.clearTimeout(this.timeoutAnim);
		this.timeoutAnim = window.setTimeout(() => {
			this.setData(I.SidebarPanel.Right, isPopup, { isClosed: true }, true);
			obj.removeClass('sidebarAnimation').css({ transform: '' });
			this.resizePage(isPopup, null, null, false);

			S.Common.setRightSidebarState(isPopup, { page: '' });
		}, animate ? J.Constant.delay.sidebar : 0);
	};

	/**
	 * Opens the sidebar to the specified width with animation.
	 * @param {number} [width] - The width to open the sidebar to.
	 */
	rightPanelOpen (isPopup: boolean, state: Partial<I.SidebarRightState>, width?: number, animate?: boolean): void {
		const { isClosed } = this.getData(I.SidebarPanel.Right, isPopup);
		if (this.isAnimating || !isClosed) {
			return;
		};


		const obj = this.rightPanelGetNode(isPopup);

		if (!obj || !obj.length) {
			return;
		};

		obj.css({ transform: 'translate3d(100%,0px,0px)' });

		S.Common.setRightSidebarState(isPopup, state);

		this.setStyle(I.SidebarPanel.Right, isPopup, { width });
		this.setData(I.SidebarPanel.Right, isPopup, { isClosed: false }, true);
		this.resizePage(isPopup, null, width, animate);

		raf(() => {
			if (animate) {
				obj.addClass('sidebarAnimation');
			};

			obj.css({ transform: 'translate3d(0px,0px,0px)' });

			window.clearTimeout(this.timeoutAnim);
			this.timeoutAnim = window.setTimeout(() => {
				obj.removeClass('sidebarAnimation').css({ transform: '' });
				this.resizePage(isPopup, null, null, false);
			}, animate ? J.Constant.delay.sidebar : 0);
		});
	};

	/**
	 * Toggles the sidebar open/close state.
	 */
	rightPanelToggle (isPopup: boolean, state: Partial<I.SidebarRightState>) {
		if (this.isAnimating) {
			return;
		};
		
		const { width, isClosed } = this.getData(I.SidebarPanel.Right, isPopup);

		if (isClosed) {
			this.rightPanelOpen(isPopup, state, width, true);
		} else {
			this.rightPanelClose(isPopup, true);
		};

		analytics.event(isClosed ? 'ExpandSidebar' : 'CollapseSidebar');
		S.Menu.closeAll();
	};

	leftPanelSubPageClose (animate: boolean, save: boolean) {
		if (this.isAnimating) {
			return;
		};

		const dataLeft = this.getData(I.SidebarPanel.Left);
		const dataSubLeft = this.getData(I.SidebarPanel.SubLeft);

		if (dataSubLeft.isClosed) {
			return;
		};

		const width = dataLeft.isClosed ? 0 : dataLeft.width;
		const objLeft = this.leftPanelGetNode();
		const subPageWrapperLeft = objLeft.find('#subPageWrapper');
		const dummyLeft = $('#sidebarDummyLeft');

		subPageWrapperLeft.addClass('sidebarAnimation isClosing').css({ transform: 'translate3d(-100%,0px,0px)' });
		objLeft.addClass('sidebarAnimation').css({ width });
		dummyLeft.addClass('sidebarAnimation').css({ width });

		this.resizePage(false, width, null, animate);

		window.setTimeout(() => {
			this.setData(I.SidebarPanel.SubLeft, false, { isClosed: true }, save);

			objLeft.removeClass('sidebarAnimation').css({ width: '' });
			subPageWrapperLeft.removeClass('sidebarAnimation isClosing').css({ transform: '' });
			dummyLeft.removeClass('sidebarAnimation');

			this.resizePage(false, null, null, false);
		}, animate ? J.Constant.delay.sidebar : 0);

		analytics.event('CollapseWidgetPanel');
	};

	leftPanelSubPageOpen (id: string, animate: boolean, save: boolean) {
		if (this.isAnimating) {
			return;
		};

		const state = S.Common.getLeftSidebarState();
		const dataLeft = this.getData(I.SidebarPanel.Left);
		const dataSubLeft = this.getData(I.SidebarPanel.SubLeft);
		const objLeft = this.leftPanelGetNode();
		const subPageWrapperLeft = objLeft.find('#subPageWrapper');
		const dummyLeft = $('#sidebarDummyLeft');

		if (state.subPage != id) {
			S.Common.setLeftSidebarState(state.page, id);
		};

		if (!dataSubLeft.isClosed) {
			return;
		};

		const width = dataLeft.isClosed ? 0 : dataLeft.width;
		const newWidth = width + dataSubLeft.width;

		subPageWrapperLeft.css({ transform: 'translate3d(-100%,0px,0px)' });
		objLeft.css({ width });
		dummyLeft.css({ width });
		this.resizePage(false, newWidth, null, animate);
		this.setData(I.SidebarPanel.SubLeft, false, { isClosed: false }, save);

		raf(() => {
			subPageWrapperLeft.addClass('sidebarAnimation isOpening').css({ transform: 'translate3d(0px,0px,0px)' });
			objLeft.addClass('sidebarAnimation').css({ width: newWidth });
			dummyLeft.addClass('sidebarAnimation').css({ width: newWidth});

			window.setTimeout(() => {
				subPageWrapperLeft.removeClass('sidebarAnimation isOpening').css({ transform: '' });
				objLeft.removeClass('sidebarAnimation').css({ width: '' });
				dummyLeft.removeClass('sidebarAnimation');

				this.resizePage(false, null, null, false);
			}, animate ? J.Constant.delay.sidebar : 0);
		});

		analytics.event('ExpandWidgetPanel');
	};

	leftPanelSubPageToggle (id: string) {
		const { isClosed } = this.getData(I.SidebarPanel.SubLeft);

		if (isClosed) {
			this.leftPanelSubPageOpen(id, true, true);
		} else {
			this.leftPanelSubPageClose(true, true);
		};
	};

	/**
	 * Sets the sidebar width and updates layout.
	 * @param {I.SidebarPanel} panel - Current sidebar panel.
	 * @param {number} w - The width to set.
	 */
	setWidth (panel: I.SidebarPanel, isPopup: boolean, w: number, save: boolean): void {
		if (panel == I.SidebarPanel.Left) {
			S.Common.vaultIsMinimalSet(w <= J.Size.vaultStripeMaxWidth);
		};
		this.setData(panel, isPopup, { width: this.limitWidth(panel, w) }, save);
		this.resizePage(isPopup, null, null, false);
	};

	/**
	 * Handles mouse move events for sidebar hover and auto-show/hide.
	 */
	onMouseMove (): void {
		const { hideSidebar, windowIsFocused } = S.Common;

		if (keyboard.isDragging || keyboard.isResizing) {
			return;
		};

		if (
			this.isAnimating ||
			!hideSidebar ||
			!keyboard.isMain() ||
			!windowIsFocused
		) {
			return;
		};

		const { x, y } = keyboard.mouse.page;

		// Skip if mouse position is at origin - indicates uninitialized state
		// This can happen when switching tabs before any mouse movement
		if (!x && !y) {
			return;
		};

		const dataLeft = this.getData(I.SidebarPanel.Left);
		const dataSubLeft = this.getData(I.SidebarPanel.SubLeft);
		const leftState = S.Common.getLeftSidebarState();
		const param = this.getSizeParam(I.SidebarPanel.Left);
		const vw = dataLeft.isClosed ? 0 : param.threshold;
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
			this.leftPanelOpen(dataLeft.width, false, false);
			this.leftPanelSubPageOpen(leftState.subPage, false, false);
		};

		if (hide) {
			if (!dataLeft.isClosed) {
				this.leftPanelClose(false, false);
			};
			if (!dataSubLeft.isClosed) {
				this.leftPanelSubPageClose(false, false);
			};
		};
	};

	/**
	 * Resizes the page and sidebar elements based on sidebar widths and animation state.
	 * @param {number} widthLeft - The width of the left sidebar.
	 * @param {number} widthRight - The width of the right sidebar.
	 * @param {boolean} animate - Whether to animate the resize.
	 */
	resizePage (isPopup: boolean, widthLeft: number, widthRight: number, animate: boolean): void {
		if (this.isAnimating) {
			return;
		};

		const pageFlex = U.Common.getPageFlexContainer(isPopup);
		const page = U.Common.getPageContainer(isPopup);
		const header = page.find('#header');
		const footer = page.find('#footer');
		const loader = page.find('#loader');

		if (!pageFlex || !pageFlex.length) {
			return;
		};

		if (animate) {
			this.setAnimating(true);
			window.setTimeout(() => this.setAnimating(false), J.Constant.delay.sidebar);
		};

		const { config, singleTab } = S.Common;
		const { alwaysShowTabs } = config;
		const isAuth = keyboard.isAuth();
		const isMain = keyboard.isMain();
		const isMainVoidError = keyboard.isMainVoidError();
		const isMainHistory = keyboard.isMainHistory();
		const isPopupMainHistory = keyboard.isPopupMainHistory();
		const dataLeft = this.getData(I.SidebarPanel.Left, isPopup);
		const dataSubLeft = this.getData(I.SidebarPanel.SubLeft, isPopup);
		const dataRight = this.getData(I.SidebarPanel.Right, isPopup);
		const objLeft = this.leftPanelGetNode();
		const objRight = this.rightPanelGetNode(isPopup);
		const subPageWrapperLeft = objLeft.find('#subPageWrapper');
		const dummyLeft = $('#sidebarDummyLeft');
		const isLeftClosed = dataLeft.isClosed || isAuth;
		const isSubLeftClosed = dataSubLeft.isClosed || isAuth;

		if ((widthLeft === null) && objLeft && objLeft.length) {
			widthLeft = objLeft.outerWidth();
		};

		if ((widthRight === null) && objRight && objRight.length && !dataRight.isClosed) {
			widthRight = objRight.outerWidth();
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

		const container = U.Common.getScrollContainer(isPopup);
		const pageWidth = pageFlex.width() - widthLeft - widthRight;
		const ho = isMainHistory || isPopupMainHistory ? J.Size.history.panel : 0;
		const hw = pageWidth - ho;
		const pageCss: any = { width: pageWidth };
		const offset = singleTab && !alwaysShowTabs ? 0 : 8;

		if (!isPopup) {
			pageCss.height = U.Common.getAppContainerHeight() - offset;
		};

		header.css({ width: '' }).toggleClass('sidebarAnimation', animate);
		header.css({ width: hw });

		footer.css({ width: '' }).toggleClass('sidebarAnimation', animate);
		footer.css({ width: hw });

		page.toggleClass('sidebarAnimation', animate);
		page.css(pageCss);
		pageFlex.toggleClass('withSidebarRight', !!widthRight);

		loader.css({ width: pageWidth, right: 0 });

		if (!isPopup) {
			pageFlex.toggleClass('sidebarAnimation', animate);

			dummyLeft.toggleClass('sidebarAnimation', animate);
			dummyLeft.css({ width: widthLeft });

			subPageWrapperLeft.toggleClass('withSidebarLeft', !isLeftClosed);
			
			pageFlex.toggleClass('withSidebarTotalLeft', !!widthLeft);
			pageFlex.toggleClass('withSidebarLeft', !isLeftClosed);
			pageFlex.toggleClass('withSidebarSubLeft', !isSubLeftClosed);

			header.toggleClass('withSidebarTotalLeft', !!widthLeft);
			header.toggleClass('withSidebarLeft', !isLeftClosed);
			header.toggleClass('withSidebarSubLeft', !isSubLeftClosed);

			subPageWrapperLeft.toggleClass('sidebarAnimation', animate);
			subPageWrapperLeft.toggleClass('withSidebarLeft', !isLeftClosed);
		} else {
			objRight.css({ height: container.height() });
		};

		$(window).trigger('sidebarResize');
	};

	/**
	 * Sets the animating state of the sidebar.
	 * @param {boolean} v - The animating state.
	 */
	public setAnimating (v: boolean) {
		this.isAnimating = v;
	};

	private getWrapper (panel: I.SidebarPanel, isPopup: boolean): JQuery<HTMLElement> {
		const objLeft = this.leftPanelGetNode();

		let obj = null;

		switch (panel) {
			case I.SidebarPanel.Left: {
				obj = objLeft.find('#pageWrapper');
				break;
			};

			case I.SidebarPanel.SubLeft: {
				obj = objLeft.find('#subPageWrapper');
				break;
			};

			case I.SidebarPanel.Right: {
				obj = this.rightPanelGetNode(isPopup);
				break;
			};
		};

		return obj;
	};

	/**
	 * Sets the style of the sidebar elements.
	 * @param {Partial<SidebarData>} v - The style data.
	 */
	private setStyle (panel: I.SidebarPanel, isPopup: boolean, v: Partial<SidebarData>): void {
		const obj = this.getWrapper(panel, isPopup);

		if (obj && obj.length) {
			obj.css({ width: v.isClosed ? 0 : this.limitWidth(panel, v.width) });
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
	private limitWidth (panel: I.SidebarPanel, width: number): number {
		const { min, max } = this.getSizeParam(panel);

		return Math.max(min, Math.min(max, Number(width) || 0));
	};

	/**
	 * Gets the width of the sidebar dummy element.
	 * @returns {number} The dummy width.
	 */
	getDummyWidth (): number {
		return Number($('#sidebarDummyLeft').outerWidth()) || 0;
	};

	leftPanelGetNode (): JQuery<HTMLElement> | null {
		return $(S.Common.getRef('sidebarLeft')?.getNode());
	};

	rightPanelGetNode (isPopup: boolean): JQuery<HTMLElement> | null {
		const ns = U.Common.getEventNamespace(isPopup);
		const ref = S.Common.getRef(`sidebarRight${ns}`);

		return $(ref?.getNode());
	};

	getSizeParam (panel: I.SidebarPanel) {
		const param = U.Common.objectCopy(J.Size.sidebar);
		return param[panel] ? Object.assign(param.default, param[panel]) : param.default;
	};

};

export const sidebar: Sidebar = new Sidebar();