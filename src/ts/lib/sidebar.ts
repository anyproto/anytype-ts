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
	init (isPopup: boolean) {
		this.initObjects(isPopup);

		const { space } = S.Common;
		const stored = Storage.get(STORAGE_KEY, Storage.isLocal(STORAGE_KEY));

		for (const panel of [ I.SidebarPanel.Left, I.SidebarPanel.SubLeft, I.SidebarPanel.Right ]) {
			if (isPopup && (panel != I.SidebarPanel.Right)) {
				continue;
			};

			const data = stored?.[panel];
			const param = this.getSizeParam(panel);

			let isClosed = true;
			let width = param.default;

			if (data) {
				isClosed = Boolean(data.isClosed);
				width = this.limitWidth(panel, data.width);
			};

			if ((panel == I.SidebarPanel.SubLeft) && !space) {
				isClosed = true;
			};

			if (panel == I.SidebarPanel.Right) {
				isClosed = true;
			};

			this.setData(panel, isPopup, { width, isClosed });
		};

		this.resizePage(isPopup, null, null, false);
	};

	/**
	 * Initializes DOM object references for sidebar elements.
	 */
	initObjects (isPopup: boolean) {
		this.objLeft = $(S.Common.getRef('sidebarLeft')?.getNode());
		this.objRight = this.rightPanelGetNode(isPopup);
		this.pageWrapperLeft = this.objLeft.find('#pageWrapper');
		this.subPageWrapperLeft = this.objLeft.find('#subPageWrapper');
		this.pageFlex = U.Common.getPageFlexContainer(isPopup);
		this.page = U.Common.getPageContainer(isPopup);
		this.header = this.page.find('#header');
		this.footer = this.page.find('#footer');
		this.loader = this.page.find('#loader');
		this.dummyLeft = $('#sidebarDummyLeft');
		this.leftButton = $('#sidebarLeftButton');
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
	setData (panel: I.SidebarPanel, isPopup: boolean, v: Partial<SidebarData>): void {
		const isLocal = Storage.isLocal(STORAGE_KEY);
		const ns = U.Common.getEventNamespace(isPopup);
		const key = [ panel, ns ].join('');

		this.panelData = Storage.get(STORAGE_KEY, isLocal) || {};
		this.panelData[key] = Object.assign(this.panelData[key] || {}, v);

		this.setStyle(panel, isPopup, this.panelData[key]);
		Storage.set(STORAGE_KEY, this.panelData, isLocal);
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

				this.leftPanelSubPageOpen(subPage, true);
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
				this.leftPanelSubPageClose(true);
				break;
			};
		};
	};

	/**
	 * Closes the sidebar with animation and updates state.
	 */
	leftPanelClose (): void {
		this.initObjects(false);

		const { width, isClosed } = this.getData(I.SidebarPanel.Left);

		if (!this.objLeft || !this.objLeft.length || this.isAnimating || isClosed) {
			return;
		};

		const dataSubLeft = this.getData(I.SidebarPanel.SubLeft);
		const newWidth = dataSubLeft.isClosed ? 0 : dataSubLeft.width;

		this.pageWrapperLeft.addClass('anim');
		this.setElementsWidth(width);
		this.setStyle(I.SidebarPanel.Left, false, { width: 0 });
		this.setData(I.SidebarPanel.Left, false, { isClosed: true });
		this.resizePage(false, newWidth, null, true);

		window.clearTimeout(this.timeoutAnim);
		this.timeoutAnim = window.setTimeout(() => {
			this.pageWrapperLeft.removeClass('anim').addClass('isClosed');
			this.setElementsWidth('');

			$(window).trigger('sidebarResize');
		}, J.Constant.delay.sidebar);
	};

	/**
	 * Opens the sidebar to the specified width with animation.
	 * @param {number} [width] - The width to open the sidebar to.
	 */
	leftPanelOpen (width?: number): void {
		this.initObjects(false);

		const { isClosed } = this.getData(I.SidebarPanel.Left);

		if (!this.objLeft || !this.objLeft.length || this.isAnimating || !isClosed) {
			return;
		};

		const dataSubLeft = this.getData(I.SidebarPanel.SubLeft);
		const newWidth = width + (dataSubLeft.isClosed ? 0 : dataSubLeft.width);

		this.setElementsWidth(width);
		this.pageWrapperLeft.addClass('anim').removeClass('isClosed');

		this.setStyle(I.SidebarPanel.Left, false, { width });
		this.setData(I.SidebarPanel.Left, false, { isClosed: false });
		this.resizePage(false, newWidth, null, true);

		window.clearTimeout(this.timeoutAnim);
		this.timeoutAnim = window.setTimeout(() => {
			this.pageWrapperLeft.removeClass('anim');
			this.setElementsWidth('');

			$(window).trigger('sidebarResize');
		}, J.Constant.delay.sidebar);
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
	 * Closes the sidebar with animation and updates state.
	 */
	rightPanelClose (isPopup: boolean, animate?: boolean): void {
		this.initObjects(isPopup);

		const { isClosed } = this.getData(I.SidebarPanel.Right, isPopup);

		if (!this.objRight || !this.objRight.length || this.isAnimating || isClosed) {
			return;
		};

		this.objRight.addClass('sidebarAnimation').css({ transform: 'translate3d(100%,0px,0px)' });
		this.resizePage(isPopup, null, 0, animate);

		window.clearTimeout(this.timeoutAnim);
		this.timeoutAnim = window.setTimeout(() => {
			this.setData(I.SidebarPanel.Right, isPopup, { isClosed: true });
			this.rightPanelSetState(isPopup, { page: '' });
			this.objRight.removeClass('sidebarAnimation').css({ transform: '' });

			$(window).trigger('sidebarResize');
		}, animate ? J.Constant.delay.sidebar : 0);
	};

	/**
	 * Opens the sidebar to the specified width with animation.
	 * @param {number} [width] - The width to open the sidebar to.
	 */
	rightPanelOpen (isPopup: boolean, state: Partial<I.SidebarRightState>, width?: number, animate?: boolean): void {
		this.initObjects(isPopup);

		const { isClosed } = this.getData(I.SidebarPanel.Right, isPopup);

		if (!this.objRight || !this.objRight.length || this.isAnimating || !isClosed) {
			return;
		};

		this.objRight.css({ transform: 'translate3d(100%,0px,0px)' });

		this.rightPanelSetState(isPopup, state);
		this.setStyle(I.SidebarPanel.Right, isPopup, { width });
		this.setData(I.SidebarPanel.Right, isPopup, { isClosed: false });
		this.resizePage(isPopup, null, width, animate);

		raf(() => {
			this.objRight.addClass('sidebarAnimation').css({ transform: 'translate3d(0px,0px,0px)' });

			window.clearTimeout(this.timeoutAnim);
			this.timeoutAnim = window.setTimeout(() => {
				this.objRight.removeClass('sidebarAnimation').css({ transform: '' });

				$(window).trigger('sidebarResize');
				raf(() => $(window).trigger('resize'));
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
			analytics.event('ExpandSidebar');
		} else {
			this.rightPanelClose(isPopup, true);
			analytics.event('CollapseSidebar');
		};

		S.Menu.closeAll();
	};

	leftPanelSubPageClose (animate: boolean) {
		if (this.isAnimating) {
			return;
		};

		this.initObjects(false);

		const dataLeft = this.getData(I.SidebarPanel.Left);
		const width = dataLeft.isClosed ? 0 : dataLeft.width;

		this.subPageWrapperLeft.addClass('sidebarAnimation').css({ transform: 'translate3d(-100%,0px,0px)' });
		this.objLeft.addClass('sidebarAnimation').css({ width });
		this.dummyLeft.addClass('sidebarAnimation').css({ width });
		this.resizePage(false, width, null, animate);

		window.setTimeout(() => {
			this.setData(I.SidebarPanel.SubLeft, false, { isClosed: true });

			this.objLeft.removeClass('sidebarAnimation').css({ width: '' });
			this.subPageWrapperLeft.removeClass('sidebarAnimation').css({ transform: '' });
			this.dummyLeft.removeClass('sidebarAnimation');
			this.resizePage(false, null, null, false);
		}, animate ? J.Constant.delay.sidebar : 0);
	};

	leftPanelSubPageOpen (id: string, animate: boolean) {
		if (this.isAnimating) {
			return;
		};

		const state = S.Common.getLeftSidebarState();
		const dataLeft = this.getData(I.SidebarPanel.Left);
		const dataSubLeft = this.getData(I.SidebarPanel.SubLeft);

		if (state.subPage != id) {
			S.Common.setLeftSidebarState(state.page, id);
		};

		if (!dataSubLeft.isClosed) {
			return;
		};

		this.initObjects(false);

		const width = dataLeft.isClosed ? 0 : dataLeft.width;
		const newWidth = width + dataSubLeft.width;

		this.subPageWrapperLeft.css({ transform: 'translate3d(-100%,0px,0px)' });
		this.objLeft.css({ width });
		this.dummyLeft.css({ width });
		this.resizePage(false, newWidth, null, animate);
		this.setData(I.SidebarPanel.SubLeft, false, { isClosed: false });

		raf(() => {
			this.subPageWrapperLeft.addClass('sidebarAnimation').css({ transform: 'translate3d(0px,0px,0px)' });
			this.objLeft.addClass('sidebarAnimation').css({ width: newWidth });
			this.dummyLeft.addClass('sidebarAnimation').css({ width: newWidth});

			window.setTimeout(() => {
				this.subPageWrapperLeft.removeClass('sidebarAnimation').css({ transform: '' });
				this.objLeft.removeClass('sidebarAnimation').css({ width: '' });
				this.dummyLeft.removeClass('sidebarAnimation');
				this.resizePage(false, null, null, false);
			}, animate ? J.Constant.delay.sidebar : 0);
		});
	};

	leftPanelSubPageToggle (id: string) {
		const { isClosed } = this.getData(I.SidebarPanel.SubLeft);

		if (isClosed) {
			this.leftPanelSubPageOpen(id, true);
		} else {
			this.leftPanelSubPageClose(true);
		};
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
	setWidth (panel: I.SidebarPanel, isPopup: boolean, width: number): void {
		this.setData(panel, isPopup, { width: this.limitWidth(panel, width), isClosed: false });
		this.resizePage(isPopup, null, null, false);
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
	resizePage (isPopup: boolean, widthLeft: number, widthRight: number, animate: boolean): void {
		if (this.isAnimating) {
			return;
		};

		this.initObjects(isPopup);

		if (!this.pageFlex || !this.pageFlex.length) {
			return;
		};

		if (animate) {
			this.setAnimating(true);
			window.setTimeout(() => this.setAnimating(false), J.Constant.delay.sidebar);
		};

		const isMain = keyboard.isMain();
		const isMainVoidError = keyboard.isMainVoidError();
		const isMainHistory = keyboard.isMainHistory();
		const isPopupMainHistory = keyboard.isPopupMainHistory();
		const dataLeft = this.getData(I.SidebarPanel.Left, isPopup);
		const dataSubLeft = this.getData(I.SidebarPanel.SubLeft, isPopup);
		const dataRight = this.getData(I.SidebarPanel.Right, isPopup);

		if ((widthLeft === null) && this.objLeft && this.objLeft.length) {
			widthLeft = this.objLeft.outerWidth();
		};

		if ((widthRight === null) && this.objRight && this.objRight.length && !dataRight.isClosed) {
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

		const container = U.Common.getScrollContainer(isPopup);
		const pageWidth = this.pageFlex.width() - widthLeft - widthRight;
		const ho = isMainHistory || isPopupMainHistory ? J.Size.history.panel : 0;
		const hw = pageWidth - ho;
		const pageCss: any = { width: pageWidth };

		if (!isPopup) {
			pageCss.height = U.Common.getAppContainerHeight() - 8;
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

		
		this.pageFlex.toggleClass('withSidebarRight', !!widthRight);

		if (!isPopup) {
			this.pageFlex.toggleClass('sidebarAnimation', animate);
			this.dummyLeft.toggleClass('sidebarAnimation', animate);
			
			this.leftButton.toggleClass('sidebarAnimation', animate);
			this.leftButton.toggleClass('withSidebarLeft', !dataLeft.isClosed);

			this.pageFlex.toggleClass('withSidebarTotalLeft', !!widthLeft);
			this.pageFlex.toggleClass('withSidebarLeft', !dataLeft.isClosed);
			this.pageFlex.toggleClass('withSidebarSubLeft', !dataSubLeft.isClosed);

			this.header.toggleClass('withSidebarTotalLeft', !!widthLeft);
			this.header.toggleClass('withSidebarLeft', !dataLeft.isClosed);
			this.header.toggleClass('withSidebarSubLeft', !dataSubLeft.isClosed);

			this.subPageWrapperLeft.toggleClass('withSidebarLeft', !dataLeft.isClosed);

			this.dummyLeft.css({ width: widthLeft });
		} else {
			this.objRight.css({ height: container.height() });
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
		this.initObjects(isPopup);

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

			case I.SidebarPanel.Right: {
				obj = this.objRight;
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

	rightPanelGetRef (isPopup: boolean) {
		return S.Common.getRef(`sidebarRight${U.Common.getEventNamespace(isPopup)}`);
	};

	rightPanelGetNode (isPopup: boolean): JQuery<HTMLElement> | null {
		return $(this.rightPanelGetRef(isPopup)?.getNode());
	};

	rightPanelSetState (isPopup: boolean, v: Partial<I.SidebarRightState>) {
		S.Common.setRightSidebarState(isPopup, v.page);
		this.rightPanelGetRef(isPopup)?.setState(v);
	};

	getSizeParam (panel: I.SidebarPanel) {
		const param = U.Common.objectCopy(J.Size.sidebar);

		let ret = param.default;
		if (param[panel]) {
			ret = Object.assign(ret, param[panel]);
		};
		return ret;
	};

};

export const sidebar: Sidebar = new Sidebar();