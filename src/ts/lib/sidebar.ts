import raf from 'raf';
import * as I from 'Interface';
import Storage from 'Lib/storage';

interface SidebarData {
	width: number;
	isClosed: boolean;
	savedClosed: boolean;
};

interface AutoHideInput {
	x: number;
	leftClosed: boolean;
	leftWidth: number;
	subLeftClosed: boolean;
	subLeftWidth: number;
	leftMinWidth: number;
	armed: boolean;
	popupOpen: boolean;
	menuOpen: boolean;
};

interface AutoHideDecision {
	show: boolean;
	hide: boolean;
	armed: boolean;
};

/**
 * Pure decision for the auto-hide (hover) behaviour of the left sidebar panels.
 *
 * The `armed` latch is the fix for panels collapsing the instant they are opened:
 * auto-hide is only allowed once the pointer has actually been over a visible open
 * panel since it was shown (the latch is reset on every open). Opening a panel
 * explicitly (header icon or keyboard shortcut) while the cursor is parked in the
 * content area therefore keeps it open until the user moves into the panel and back
 * out — instead of the next mouse move immediately satisfying the hide boundary.
 *
 * @returns whether to show/hide the panels and the next value of the `armed` latch.
 */
const getAutoHideDecision = (input: AutoHideInput): AutoHideDecision => {
	const { x, leftClosed, leftWidth, subLeftClosed, subLeftWidth, leftMinWidth, armed, popupOpen, menuOpen } = input;
	const vw = leftClosed ? 0 : leftMinWidth;
	const boundary = leftWidth + subLeftWidth + vw + 30;
	const visibleRight = (leftClosed ? 0 : leftWidth) + (subLeftClosed ? 0 : subLeftWidth);
	const anyOpen = (!leftClosed) || (!subLeftClosed);

	let show = false;
	let hide = false;

	if (x <= 10) {
		show = true;
	} else
	if (x >= boundary) {
		hide = true;
	};

	if (popupOpen) {
		show = false;
	};

	if (menuOpen) {
		show = false;
		hide = false;
	};

	// Arm auto-hide only once the pointer is actually over a visible open panel
	// (not the slack between the panel edge and the hide boundary). The latch is
	// also reset to false whenever a panel is opened (see leftPanelOpen /
	// leftPanelSubPageOpen), so an explicit open never inherits a stale armed state.
	let nextArmed = armed;
	if (!anyOpen) {
		nextArmed = false;
	} else
	if (x < visibleRight) {
		nextArmed = true;
	};

	// Suppress the hide until the pointer has been over the sidebar at least once.
	if (hide && !nextArmed) {
		hide = false;
	};

	return { show, hide, armed: nextArmed };
};

export { getAutoHideDecision };
export type { AutoHideInput, AutoHideDecision };

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
		[I.SidebarPanel.Left]: { width: 0, isClosed: false, savedClosed: false } as SidebarData,
		[I.SidebarPanel.SubLeft]: { width: 0, isClosed: false, savedClosed: false } as SidebarData,
		[I.SidebarPanel.Right]: { width: 0, isClosed: false, savedClosed: false } as SidebarData,
	};

	isAnimating = false;
	timeoutAnim = 0;
	timeoutHover = 0;
	timeoutSubPage = 0;
	subPageOpId = 0;
	autoHideArmed = false;

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
			const savedClosed = Boolean(data.savedClosed);

			let isClosed = (undefined !== data.isClosed) && (panel != I.SidebarPanel.Right) ? Boolean(data.isClosed) : true;

			// When auto-hide is enabled, start with left panels closed to prevent flicker on new tab
			if (S.Common.hideSidebar && (panel != I.SidebarPanel.Right) && !keyboard.isMainSettings()) {
				isClosed = true;
			};

			this.setData(panel, isPopup, { width, isClosed, savedClosed }, false);
			this.setStyle(panel, isPopup, { width, isClosed });

			if ((panel == I.SidebarPanel.Left) && !isPopup) {
				S.Common.vaultIsMinimalSet(width <= J.Size.sidebar.left.threshold.minimal);
			};
		};

		this.resizePage(isPopup, null, null, false);
	};

	getData (panel: I.SidebarPanel, isPopup?: boolean): SidebarData {
		const ns = U.Dom.getEventNamespace(isPopup);
		const key = [ panel, ns ].join('');
		const param = this.getSizeParam(panel);

		return this.panelData[key] || { width: param.default, isClosed: true, savedClosed: false };
	};

	/**
	 * Sets the sidebar data and updates the style.
	 * @param {Partial<SidebarData>} v - The new sidebar data.
	 */
	setData (panel: I.SidebarPanel, isPopup: boolean, v: Partial<SidebarData>, save: boolean): void {
		const storageKey = J.Constant.storageKey.sidebarData;
		const ns = U.Dom.getEventNamespace(isPopup);
		const key = [ panel, ns ].join('');

		this.panelData[key] = Object.assign(this.panelData[key] || {}, v);

		if (save) {
			Storage.set(storageKey, this.panelData, Storage.isLocal(storageKey));
		};
	};

	open (panel: I.SidebarPanel, subPage?: string, width?: number, animate?: boolean): void {
		const anim = animate !== undefined ? animate : true;

		switch (panel) {
			case I.SidebarPanel.Left: {
				this.leftPanelOpen(width, anim, true);
				break;
			};

			case I.SidebarPanel.SubLeft: {
				if (!subPage) {
					subPage = S.Common.getLeftSidebarState().subPage;
				};

				this.leftPanelSubPageOpen(subPage, anim, true);
				break;
			};
		};
	};

	close (panel: I.SidebarPanel, animate?: boolean): void {
		const anim = animate !== undefined ? animate : true;

		switch (panel) {
			case I.SidebarPanel.Left: {
				this.leftPanelClose(anim, true);
				break;
			};

			case I.SidebarPanel.SubLeft: {
				this.leftPanelSubPageClose(anim, true);
				break;
			};
		};
	};

	toggle (panel: I.SidebarPanel, subPage?: string): void {
		switch (panel) {
			case I.SidebarPanel.Left: {
				this.leftPanelToggle(true, true);
				break;
			};

			case I.SidebarPanel.SubLeft: {
				this.leftPanelSubPageToggle(subPage, true, true);
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
		const pageWrapperLeft = U.Dom.select('#pageWrapper', objLeft);

		if (!pageWrapperLeft) {
			return;
		};

		const dataSubLeft = this.getData(I.SidebarPanel.SubLeft);

		if (animate) {
			U.Dom.addClass(pageWrapperLeft, 'sidebarAnimation');
		};

		this.setData(I.SidebarPanel.Left, false, { isClosed: true, ...(save ? { savedClosed: true } : {}) }, save);
		this.setStyle(I.SidebarPanel.Left, false, { width: 0, isClosed: true });
		this.resizePage(false, dataSubLeft.isClosed ? 0 : dataSubLeft.width, null, animate);

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
		const pageWrapperLeft = U.Dom.select('#pageWrapper', objLeft);

		if (!pageWrapperLeft) {
			return;
		};

		// Reset auto-hide latch: a freshly opened panel must be re-entered before it can auto-hide.
		this.autoHideArmed = false;

		if (animate) {
			U.Dom.addClass(pageWrapperLeft, 'sidebarAnimation');
		};

		const dataSubLeft = this.getData(I.SidebarPanel.SubLeft);

		this.setStyle(I.SidebarPanel.Left, false, { width, isClosed: false });
		this.setData(I.SidebarPanel.Left, false, { isClosed: false, ...(save ? { savedClosed: false } : {}) }, save);
		this.resizePage(false, width + (dataSubLeft.isClosed ? 0 : dataSubLeft.width), null, animate);

		analytics.event('ExpandVault');
	};

	/**
	 * Toggles the sidebar open/close state.
	 */
	leftPanelToggle (animate: boolean, save: boolean) {
		if (this.isAnimating) {
			return;
		};
		
		const { width, isClosed } = this.getData(I.SidebarPanel.Left);

		isClosed ? this.leftPanelOpen(width, animate, save) : this.leftPanelClose(animate, save);
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

		if (!obj) {
			return;
		};

		if (animate) {
			U.Dom.addClass(obj, 'sidebarAnimation');
		};

		U.Dom.css(obj, { transform: 'translate3d(100%,0px,0px)' });
		this.resizePage(isPopup, null, 0, animate);

		window.clearTimeout(this.timeoutAnim);
		this.timeoutAnim = window.setTimeout(() => {
			this.setData(I.SidebarPanel.Right, isPopup, { isClosed: true }, true);
			this.setStyle(I.SidebarPanel.Right, isPopup, { isClosed: true });

			U.Dom.removeClass(obj, 'sidebarAnimation');
			U.Dom.css(obj, { transform: '' });
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

		if (!obj) {
			return;
		};

		U.Dom.css(obj, { transform: 'translate3d(100%,0px,0px)' });

		S.Common.setRightSidebarState(isPopup, state);

		this.setData(I.SidebarPanel.Right, isPopup, { isClosed: false }, true);
		this.setStyle(I.SidebarPanel.Right, isPopup, { width, isClosed: false });
		this.resizePage(isPopup, null, width, animate);

		raf(() => {
			if (animate) {
				U.Dom.addClass(obj, 'sidebarAnimation');
			};

			U.Dom.css(obj, { transform: 'translate3d(0px,0px,0px)' });

			window.clearTimeout(this.timeoutAnim);
			this.timeoutAnim = window.setTimeout(() => {
				U.Dom.removeClass(obj, 'sidebarAnimation');
				U.Dom.css(obj, { transform: '' });
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
		const currentState = S.Common.getRightSidebarState(isPopup);
		const isSamePage = !isClosed && (currentState.page == state?.page);

		if (isClosed) {
			this.rightPanelOpen(isPopup, state, width, true);
		} else
		if (isSamePage) {
			this.rightPanelClose(isPopup, true);
		} else {
			S.Common.setRightSidebarState(isPopup, state);
		};

		if ((isClosed || !isSamePage) && (state?.page == 'object/tableOfContents')) {
			analytics.event('ScreenTableOfContents');
		} else {
			analytics.event(isClosed ? 'ExpandSidebar' : 'CollapseSidebar');
		};
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

		this.subPageOpId++;
		window.clearTimeout(this.timeoutSubPage);

		const width = dataLeft.isClosed ? 0 : dataLeft.width;
		const objLeft = this.leftPanelGetNode();
		const subPageWrapperLeft = U.Dom.select('#subPageWrapper', objLeft);
		const dummyLeft = U.Dom.get('sidebarDummyLeft');

		if (subPageWrapperLeft) {
			U.Dom.addClass(subPageWrapperLeft, 'sidebarAnimation');
			U.Dom.css(subPageWrapperLeft, { transform: 'translate3d(-100%,0px,0px)' });
		};

		if (objLeft) {
			U.Dom.addClass(objLeft, 'sidebarAnimation');
			U.Dom.css(objLeft, { width: width + 'px' });
		};

		if (dummyLeft) {
			U.Dom.addClass(dummyLeft, 'sidebarAnimation');
			U.Dom.css(dummyLeft, { width: width + 'px' });
		};

		this.setData(I.SidebarPanel.SubLeft, false, { isClosed: true }, save);
		this.resizePage(false, width, null, animate);

		this.timeoutSubPage = window.setTimeout(() => {
			this.setStyle(I.SidebarPanel.SubLeft, false, { isClosed: true });

			if (objLeft) {
				U.Dom.removeClass(objLeft, 'sidebarAnimation');
				U.Dom.css(objLeft, { width: '' });
			};

			if (subPageWrapperLeft) {
				U.Dom.removeClass(subPageWrapperLeft, 'sidebarAnimation');
				U.Dom.css(subPageWrapperLeft, { transform: '' });
			};

			if (dummyLeft) {
				U.Dom.removeClass(dummyLeft, 'sidebarAnimation');
			};

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
		const subPageWrapperLeft = U.Dom.select('#subPageWrapper', objLeft);
		const dummyLeft = U.Dom.get('sidebarDummyLeft');

		if (state.subPage != id) {
			S.Common.setLeftSidebarState(state.page, id);
		};

		if (!dataSubLeft.isClosed) {
			return;
		};

		// Reset auto-hide latch: a freshly opened panel must be re-entered before it can auto-hide.
		this.autoHideArmed = false;

		this.subPageOpId++;
		window.clearTimeout(this.timeoutSubPage);

		const opId = this.subPageOpId;
		const width = dataLeft.isClosed ? 0 : dataLeft.width;
		const newWidth = width + dataSubLeft.width;

		if (subPageWrapperLeft) {
			U.Dom.removeClass(subPageWrapperLeft, 'sidebarAnimation');
			U.Dom.css(subPageWrapperLeft, { transform: 'translate3d(-100%,0px,0px)' });
		};

		if (objLeft) {
			U.Dom.css(objLeft, { width: width + 'px' });
		};

		if (dummyLeft) {
			U.Dom.css(dummyLeft, { width: width + 'px' });
		};

		void subPageWrapperLeft?.offsetHeight;

		this.setData(I.SidebarPanel.SubLeft, false, { isClosed: false }, save);
		this.resizePage(false, newWidth, null, animate);
		this.setStyle(I.SidebarPanel.SubLeft, false, { width: dataSubLeft.width, isClosed: false });

		raf(() => {
			if (opId !== this.subPageOpId) {
				return;
			};

			if (subPageWrapperLeft) {
				U.Dom.addClass(subPageWrapperLeft, 'sidebarAnimation');
				U.Dom.css(subPageWrapperLeft, { transform: 'translate3d(0px,0px,0px)' });
			};

			if (objLeft) {
				U.Dom.addClass(objLeft, 'sidebarAnimation');
				U.Dom.css(objLeft, { width: newWidth + 'px' });
			};

			if (dummyLeft) {
				U.Dom.addClass(dummyLeft, 'sidebarAnimation');
				U.Dom.css(dummyLeft, { width: newWidth + 'px' });
			};

			this.timeoutSubPage = window.setTimeout(() => {
				if (opId !== this.subPageOpId) {
					return;
				};

				if (subPageWrapperLeft) {
					U.Dom.removeClass(subPageWrapperLeft, 'sidebarAnimation');
					U.Dom.css(subPageWrapperLeft, { transform: '' });
				};

				if (objLeft) {
					U.Dom.removeClass(objLeft, 'sidebarAnimation');
					U.Dom.css(objLeft, { width: '' });
				};

				if (dummyLeft) {
					U.Dom.removeClass(dummyLeft, 'sidebarAnimation');
				};

				this.resizePage(false, null, null, false);
			}, animate ? J.Constant.delay.sidebar : 0);
		});

		analytics.event('ExpandWidgetPanel');
	};

	leftPanelSubPageToggle (id: string, animate: boolean, save: boolean) {
		const { isClosed } = this.getData(I.SidebarPanel.SubLeft);

		isClosed ? this.leftPanelSubPageOpen(id, animate, save) : this.leftPanelSubPageClose(animate, save);
	};

	toggleBothPanels () {
		if (this.isAnimating) {
			return;
		};

		const dataLeft = this.getData(I.SidebarPanel.Left);
		const dataSubLeft = this.getData(I.SidebarPanel.SubLeft);
		const shouldOpen = dataLeft.isClosed || dataSubLeft.isClosed;
		const delay = J.Constant.delay.sidebar;

		S.Menu.closeAll();

		if (shouldOpen) {
			if (dataLeft.isClosed && dataSubLeft.isClosed) {
				this.leftPanelSubPageOpen('widget', true, true);
				window.setTimeout(() => {
					this.setAnimating(false);
					this.leftPanelOpen(dataLeft.width, true, true);
				}, delay);
			} else
			if (dataLeft.isClosed) {
				this.leftPanelOpen(dataLeft.width, true, true);
			} else {
				this.leftPanelSubPageOpen('widget', true, true);
			};
		} else {
			this.leftPanelClose(true, true);
			window.setTimeout(() => {
				this.setAnimating(false);
				this.leftPanelSubPageClose(true, true);
			}, delay);
		};
	};

	/**
	 * Sets the sidebar width and updates layout.
	 * @param {I.SidebarPanel} panel - Current sidebar panel.
	 * @param {number} w - The width to set.
	 */
	setWidth (panel: I.SidebarPanel, isPopup: boolean, width: number, save: boolean): void {
		width = this.limitWidth(panel, width);

		if (panel == I.SidebarPanel.Left) {
			S.Common.vaultIsMinimalSet(width <= J.Size.sidebar.left.threshold.minimal);
		};

		this.setData(panel, isPopup, { width }, save);
		this.setStyle(panel, isPopup, { width });
		this.resizePage(isPopup, null, null, false);
	};

	/**
	 * Handles mouse move events for sidebar hover and auto-show/hide.
	 */
	onMouseMove (): void {
		const { hideSidebar, windowIsFocused } = S.Common;
		const { x } = keyboard.mouse.page;

		if ((x == null) || keyboard.isDragging || keyboard.isResizing) {
			return;
		};

		if (
			this.isAnimating ||
			!hideSidebar ||
			!keyboard.isMain() ||
			!windowIsFocused ||
			keyboard.isMainSettings()
		) {
			window.clearTimeout(this.timeoutHover);
			this.timeoutHover = 0;
			return;
		};

		const dataLeft = this.getData(I.SidebarPanel.Left);
		const dataSubLeft = this.getData(I.SidebarPanel.SubLeft);
		const leftState = S.Common.getLeftSidebarState();
		const param = this.getSizeParam(I.SidebarPanel.Left);
		const menuOpen = S.Menu.isOpenList([ 'objectContext', 'widget', 'selectSidebarToggle', 'typeSuggest' ]);
		const popupOpen = S.Popup.isOpen();

		const { show, hide, armed } = getAutoHideDecision({
			x,
			leftClosed: dataLeft.isClosed,
			leftWidth: dataLeft.width,
			subLeftClosed: dataSubLeft.isClosed,
			subLeftWidth: dataSubLeft.width,
			leftMinWidth: param.min,
			armed: this.autoHideArmed,
			popupOpen,
			menuOpen,
		});

		this.autoHideArmed = armed;

		if (show) {
			if (!this.timeoutHover && dataLeft.isClosed) {
				this.timeoutHover = window.setTimeout(() => {
					this.timeoutHover = 0;
					this.leftPanelOpen(dataLeft.width, false, false);
					this.leftPanelSubPageOpen(leftState.subPage, false, false);
				}, J.Constant.delay.sidebarHover);
			};
		} else {
			window.clearTimeout(this.timeoutHover);
			this.timeoutHover = 0;

			if (hide) {
				this.autoHidePanels(dataLeft, dataSubLeft);
				this.autoHideArmed = false;
			};
		};
	};

	/**
	 * Directly closes both left panels without animation for auto-hide.
	 * Bypasses animation methods to avoid async race conditions with page width.
	 */
	private autoHidePanels (dataLeft: SidebarData, dataSubLeft: SidebarData): void {
		const needCloseLeft = !dataLeft.isClosed;
		const needCloseSubLeft = !dataSubLeft.isClosed;

		if (!needCloseLeft && !needCloseSubLeft) {
			return;
		};

		this.subPageOpId++;
		window.clearTimeout(this.timeoutSubPage);

		const objLeft = this.leftPanelGetNode();
		const pageWrapperLeft = U.Dom.select('#pageWrapper', objLeft);
		const subPageWrapperLeft = U.Dom.select('#subPageWrapper', objLeft);
		const dummyLeft = U.Dom.get('sidebarDummyLeft');

		if (needCloseLeft) {
			this.setData(I.SidebarPanel.Left, false, { isClosed: true }, false);
			this.setStyle(I.SidebarPanel.Left, false, { width: 0, isClosed: true });
		};

		if (needCloseSubLeft) {
			this.setData(I.SidebarPanel.SubLeft, false, { isClosed: true }, false);
			this.setStyle(I.SidebarPanel.SubLeft, false, { isClosed: true });
		};

		if (pageWrapperLeft) {
			U.Dom.removeClass(pageWrapperLeft, 'sidebarAnimation');
		};

		if (subPageWrapperLeft) {
			U.Dom.removeClass(subPageWrapperLeft, 'sidebarAnimation');
			U.Dom.css(subPageWrapperLeft, { transform: '' });
		};

		if (objLeft) {
			U.Dom.removeClass(objLeft, 'sidebarAnimation');
			U.Dom.css(objLeft, { width: '' });
		};

		if (dummyLeft) {
			U.Dom.removeClass(dummyLeft, 'sidebarAnimation');
		};

		this.resizePage(false, 0, null, false);
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

		const pageFlex = U.Dom.getPageFlexContainer(isPopup);
		const page = U.Dom.getPageContainer(isPopup);
		const header = U.Dom.select('#header', page);
		const footer = U.Dom.select('#footer', page);
		const loader = U.Dom.select('#loader', page);

		if (!pageFlex) {
			return;
		};

		if (animate) {
			this.setAnimating(true);
			window.setTimeout(() => {
				this.setAnimating(false);
				U.Dom.eventDispatch(window, 'sidebarResize');
			}, J.Constant.delay.sidebar);
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
		const pageWrapperLeft = U.Dom.select('#pageWrapper', objLeft);
		const subPageWrapperLeft = U.Dom.select('#subPageWrapper', objLeft);
		const dummyLeft = U.Dom.get('sidebarDummyLeft');
		const isLeftClosed = dataLeft.isClosed || isAuth;
		const isSubLeftClosed = dataSubLeft.isClosed || isAuth;

		if ((widthLeft === null) && objLeft) {
			widthLeft = objLeft.offsetWidth ?? 0;
		};

		if ((widthRight === null) && objRight && !dataRight.isClosed) {
			widthRight = objRight.offsetWidth ?? 0;
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

		const container = U.Dom.getScrollContainer(isPopup);
		const pageWidth = (pageFlex?.clientWidth ?? 0) - widthLeft - widthRight;
		const ho = isMainHistory || isPopupMainHistory ? J.Size.history.panel : 0;
		const hw = pageWidth - ho;
		const pageCss: any = { width: `${pageWidth}px` };
		const offset = singleTab && !alwaysShowTabs ? 0 : 8;

		if (!isPopup) {
			pageCss.height = `${U.Dom.getAppContainerHeight() - offset}px`;
		};

		if (header) {
			U.Dom.css(header, { width: '' });
			U.Dom.toggleClass(header, 'sidebarAnimation', animate);
			U.Dom.css(header, { width: `${hw}px` });
		};

		if (footer) {
			U.Dom.css(footer, { width: '' });
			U.Dom.toggleClass(footer, 'sidebarAnimation', animate);
			U.Dom.css(footer, { width: `${hw}px` });
		};

		if (page) {
			U.Dom.toggleClass(page, 'sidebarAnimation', animate);
			U.Dom.css(page, pageCss);
		};

		U.Dom.toggleClass(pageFlex, 'withSidebarRight', !!widthRight);

		if (loader) {
			U.Dom.css(loader, { width: `${pageWidth}px`, right: '0px' });
		};

		if (!isPopup) {
			U.Dom.toggleClass(pageFlex, 'sidebarAnimation', animate);

			if (dummyLeft) {
				U.Dom.toggleClass(dummyLeft, 'sidebarAnimation', animate);
				U.Dom.css(dummyLeft, { width: widthLeft + 'px' });
			};

			if (subPageWrapperLeft) {
				U.Dom.toggleClass(subPageWrapperLeft, 'withSidebarLeft', !isLeftClosed);
			};

			U.Dom.toggleClass(pageFlex, 'withSidebarTotalLeft', !!widthLeft);
			U.Dom.toggleClass(pageFlex, 'withSidebarLeft', !isLeftClosed);
			U.Dom.toggleClass(pageFlex, 'withSidebarSubLeft', !isSubLeftClosed);

			if (header) {
				U.Dom.toggleClass(header, 'withSidebarTotalLeft', !!widthLeft);
				U.Dom.toggleClass(header, 'withSidebarLeft', !isLeftClosed);
				U.Dom.toggleClass(header, 'withSidebarSubLeft', !isSubLeftClosed);
			};

			if (pageWrapperLeft) {
				U.Dom.toggleClass(pageWrapperLeft, 'sidebarAnimation', animate);
			};

			if (subPageWrapperLeft) {
				U.Dom.toggleClass(subPageWrapperLeft, 'sidebarAnimation', animate);
				U.Dom.toggleClass(subPageWrapperLeft, 'withSidebarLeft', !isLeftClosed);
			};
		} else {
			if (objRight) {
				U.Dom.css(objRight, { height: (container?.clientHeight ?? 0) + 'px' });
			};
		};

		U.Dom.eventDispatch(window, 'sidebarResize');
	};

	/**
	 * Sets the animating state of the sidebar.
	 * @param {boolean} v - The animating state.
	 */
	public setAnimating (v: boolean) {
		this.isAnimating = v;
	};

	private getWrapper (panel: I.SidebarPanel, isPopup: boolean): HTMLElement | null {
		const objLeft = this.leftPanelGetNode();

		let obj: HTMLElement | null = null;

		switch (panel) {
			case I.SidebarPanel.Left: {
				obj = U.Dom.select('#pageWrapper', objLeft);
				break;
			};

			case I.SidebarPanel.SubLeft: {
				obj = U.Dom.select('#subPageWrapper', objLeft);
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

		if (obj) {
			U.Dom.css(obj, { width: (v.isClosed ? 0 : this.limitWidth(panel, v.width)) + 'px' });
		};

		if ((undefined !== v.isClosed) && obj) {
			U.Dom.toggleClass(obj, 'isClosed', v.isClosed);
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
		return U.Dom.get('sidebarDummyLeft')?.offsetWidth ?? 0;
	};

	leftPanelGetNode (): HTMLElement | null {
		return S.Common.getRef('sidebarLeft')?.getNode() || null;
	};

	rightPanelGetNode (isPopup: boolean): HTMLElement | null {
		const ns = U.Dom.getEventNamespace(isPopup);
		const ref = S.Common.getRef(`sidebarRight${ns}`);

		return ref?.getNode() || null;
	};

	getSizeParam (panel: I.SidebarPanel) {
		const param = U.Common.objectCopy(J.Size.sidebar);
		return param[panel] ? Object.assign(param.default, param[panel]) : param.default;
	};

};

export const sidebar: Sidebar = new Sidebar();