import $ from 'jquery';
import raf from 'raf';
import { U, S, J, Storage, keyboard } from 'Lib';

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
	objRight: JQuery<HTMLElement> = null;
	dummyLeft: JQuery<HTMLElement> = null;

	page: JQuery<HTMLElement> = null;
	pageFlex: JQuery<HTMLElement> = null;
	header: JQuery<HTMLElement> = null;
	footer: JQuery<HTMLElement> = null;
	loader: JQuery<HTMLElement> = null;
	toggleButton: JQuery<HTMLElement> = null;
	syncButton: JQuery<HTMLElement> = null;
	vault: JQuery<HTMLElement> = null;
	isAnimating = false;
	timeoutAnim = 0;

	/**
	 * Initializes sidebar objects and state from storage.
	 */
	init () {
		this.initObjects();

		const stored = Storage.get('sidebar');
		const vault = $(S.Common.getRef('vault')?.getNode());

		if (stored) {
			if ('undefined' == typeof(stored.isClosed)) {
				stored.isClosed = !stored.width;
			};

			this.set(stored);
		} else {
			this.set({
				width: J.Size.sidebar.width.default,
				isClosed: false,
			});

			this.resizePage(J.Size.sidebar.width.default, null, false);
		};

		const { isClosed } = this.data;

		vault.toggleClass('isClosed', isClosed);
		this.objLeft.toggleClass('isClosed', isClosed);
	};

	/**
	 * Initializes DOM object references for sidebar elements.
	 */
	initObjects () {
		const isPopup = keyboard.isPopup();
		const vault = S.Common.getRef('vault');

		this.objLeft = $('#sidebarLeft');
		this.pageFlex = U.Common.getPageFlexContainer(isPopup);
		this.page = U.Common.getPageContainer(isPopup);
		this.header = this.page.find('#header');
		this.footer = this.page.find('#footer');
		this.loader = this.page.find('#loader');
		this.objRight = this.pageFlex.find('#sidebarRight');
		this.dummyLeft = $('#sidebarDummyLeft');
		this.toggleButton = $('#sidebarToggle');
		this.syncButton = $('#sidebarSync');

		if (vault) {
			this.vault = $(vault.getNode());
		};
	};

	/**
	 * Closes the sidebar with animation and updates state.
	 */
	close (): void {
		const { width, isClosed } = this.data;

		if (!this.objLeft || !this.objLeft.length || this.isAnimating || isClosed) {
			return;
		};

		this.objLeft.addClass('anim');
		this.setElementsWidth(width);
		this.setAnimating(true);
		this.setStyle({ width: 0 });
		this.set({ isClosed: true });
		this.resizePage(0, null, true);
		this.vaultHide();

		this.removeAnimation(() => {
			this.objLeft.addClass('isClosed');

			window.clearTimeout(this.timeoutAnim);
			this.timeoutAnim = window.setTimeout(() => {
				$(window).trigger('resize');
				this.setAnimating(false);
				this.vault.removeClass('anim');
			}, this.getVaultDuration(this.data.width));
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
		this.vaultShow(width);

		window.clearTimeout(this.timeoutAnim);
		this.timeoutAnim = window.setTimeout(() => {
			this.objLeft.removeClass('isClosed');
			this.objLeft.addClass('anim');

			this.setStyle({ width });
			this.set({ isClosed: false });
			this.resizePage(width, null, true);

			this.removeAnimation(() => {
				$(window).trigger('resize');
				this.setAnimating(false);
				this.vault.removeClass('anim');
			});
		}, this.getVaultDuration(width));
	};

	/**
	 * Toggles the sidebar open/close state.
	 */
	toggleOpenClose () {
		if (this.isAnimating) {
			return;
		};
		
		const { width, isClosed } = this.data;
		
		isClosed ? this.open(width) : this.close();
		S.Menu.closeAll();
	};

	/**
	 * Sets the width of sidebar elements.
	 * @param {any} width - The width to set.
	 */
	setElementsWidth (width: any): void {
		this.objLeft.find('#head').css({ width });
		this.objLeft.find('#body').css({ width });
		this.objLeft.find('#shareBanner').css({ width: (width ? width - 24 : '') });
	};

	/**
	 * Sets the sidebar width and updates layout.
	 * @param {number} w - The width to set.
	 */
	setWidth (w: number): void {
		w = this.limitWidth(w);

		this.set({ width: w, isClosed: false });
		this.resizePage(w, null, false);
	};

	private removeAnimation (callBack?: () => void): void {
		if (!this.objLeft || !this.objLeft.length) {
			return;
		};

		window.clearTimeout(this.timeoutAnim);
		this.timeoutAnim = window.setTimeout(() => {
			this.objLeft.removeClass('anim');
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
		const { showVault, hideSidebar } = S.Common;

		if (!this.objLeft || !this.objLeft.length || keyboard.isDragging) {
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
		const vw = isClosed || !showVault ? 0 : J.Size.vault.width;
		const menuOpen = S.Menu.isOpenList([ 'objectContext', 'widget', 'selectSidebarToggle', 'typeSuggest' ]);
		const popupOpen = S.Popup.isOpen();

		let show = false;
		let hide = false;

		if (x <= 10) {
			show = true;
		} else
		if (x >= width + vw + 30) {
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

	getVaultWidth (): number {
		const { isClosed } = this.data;
		const { showVault } = S.Common;
		const isMain = keyboard.isMain();
		const isPopup = keyboard.isPopup();

		return isClosed || !showVault || !isMain || isPopup ? 0 : J.Size.vault.width;
	};

	/**
	 * Resizes the page and sidebar elements based on sidebar widths and animation state.
	 * @param {number} widthLeft - The width of the left sidebar.
	 * @param {number} widthRight - The width of the right sidebar.
	 * @param {boolean} animate - Whether to animate the resize.
	 */
	resizePage (widthLeft: number, widthRight: number, animate: boolean): void {
		const isPopup = keyboard.isPopup();
		const isMain = keyboard.isMain();
		const isMainVoid = keyboard.isMainVoid();
		const isMainHistory = keyboard.isMainHistory();

		this.initObjects();

		let toggleX = 16;
		let syncX = 52;

		if ((widthLeft === null) && this.objLeft && this.objLeft.length) {
			widthLeft = this.objLeft.outerWidth();
		};

		if ((widthRight === null) && this.objRight && this.objRight.length) {
			widthRight = this.objRight.outerWidth();
		};

		const { showVault, isFullScreen } = S.Common;
		const { ww } = U.Common.getWindowDimensions();
		const vw = this.getVaultWidth();

		widthLeft += vw;

		if (isPopup) {
			widthLeft = 0;
		};

		if (!isMain || isMainVoid) {
			widthLeft = 0;
			widthRight = 0;
		};

		widthLeft = Number(widthLeft) || 0;
		widthRight = Number(widthRight) || 0;

		const container = U.Common.getScrollContainer(isPopup);
		const pageWidth = (!isPopup ? ww : this.pageFlex.width()) - widthLeft - widthRight;
		const ho = isMainHistory ? J.Size.history.panel : 0;
		const hw = pageWidth - ho;

		if ((widthLeft && showVault) || (U.Common.isPlatformMac() && !isFullScreen)) {
			toggleX = 84;
			syncX = 120;

			if (widthLeft) {
				syncX = widthLeft - 40;
			};
		};

		this.objRight.css({ height: container.height() });

		this.header.css({ width: '' });
		this.footer.css({ width: '' });

		this.header.toggleClass('sidebarAnimation', animate);
		this.footer.toggleClass('sidebarAnimation', animate);
		//this.page.toggleClass('sidebarAnimation', animate);

		this.loader.css({ width: pageWidth, right: 0 });
		this.header.css({ width: hw });
		this.footer.css({ width: hw });
		
		if (!isPopup) {
			this.dummyLeft.css({ width: widthLeft });
			this.dummyLeft.toggleClass('sidebarAnimation', animate);

			this.toggleButton.toggleClass('sidebarAnimation', animate);
			this.syncButton.toggleClass('sidebarAnimation', animate);
			this.header.toggleClass('withSidebarLeft', !!widthLeft);

			this.page.css({ width: pageWidth });
			this.toggleButton.css({ left: toggleX });
			this.syncButton.css({ left: syncX });
		};

		$(window).trigger('sidebarResize');
	};

	/**
	 * Saves the current sidebar state to storage.
	 */
	private save (): void {
		Storage.set('sidebar', this.data);
	};

	/**
	 * Sets the sidebar data and updates the style.
	 * @param {Partial<SidebarData>} v - The new sidebar data.
	 */
	set (v: Partial<SidebarData>): void {
		v = Object.assign(this.data, v);

		const { width } = v;

		this.data = Object.assign<SidebarData, Partial<SidebarData>>(this.data, { 
			width: this.limitWidth(width),
		});

		this.save();
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
		if (!this.objLeft || !this.objLeft.length) {
			return;
		};

		const width = v.isClosed ? 0 : v.width;

		this.objLeft.css({ width });
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
	 * Hides the vault sidebar element with animation.
	 */
	vaultHide () {
		this.vault.addClass('anim');
		this.setVaultAnimationParam(this.data.width, true);
		this.vault.addClass('isClosed');
	};

	/**
	 * Shows the vault sidebar element with animation.
	 * @param {number} width - The width to show the vault at.
	 */
	vaultShow (width: number) {
		this.vault.addClass('anim');
		this.setVaultAnimationParam(width, false);
		this.vault.removeClass('isClosed');
	};

	/**
	 * Sets the vault animation parameters.
	 * @param {number} width - The width for the animation.
	 * @param {boolean} withDelay - Whether to add a delay to the animation.
	 */
	setVaultAnimationParam (width: number, withDelay: boolean) {
		const css: any = { transitionDuration: `${this.getVaultDuration(width)}ms`, transitionDelay: '' };

		if (withDelay) {
			css.transitionDelay = `${J.Constant.delay.sidebar}ms`;
		};

		this.vault.css(css);
	};

	/**
	 * Gets the duration for the vault animation based on width.
	 * @param {number} width - The width for the animation.
	 * @returns {number} The animation duration in ms.
	 */
	getVaultDuration (width: number): number {
		return J.Size.vault.width / width * J.Constant.delay.sidebar;
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

	/**
	 * Toggles the right panel open or closed with animation.
	 * @param {boolean} v - Whether to open the panel.
	 * @param {boolean} animate - Whether to animate the toggle.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 * @param {string} [page] - The page to show in the panel.
	 * @param {any} [param] - Additional parameters for the panel.
	 */
	rightPanelToggle (animate: boolean, isPopup: boolean, page?: string, param?: any) {
		const current = S.Common.getShowSidebarRight(isPopup);
		const shouldOpen = !page || (page != current);

		// open the panel if it is different page from the current page
		if (shouldOpen) {
			S.Common.showSidebarRightSet(isPopup, page);
			this.rightPanelSetState(isPopup, { page: page, ...param });
		} else {
			S.Common.showSidebarRightSet(isPopup, null);
		};

		window.setTimeout(() => {
			this.initObjects();

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

			this.objRight.css(cssStart);

			raf(() => {
				if (animate) {
					this.objRight.addClass('anim');
				};

				this.objRight.css(cssEnd);
				this.resizePage(null, shouldOpen ? null : 0, animate);
			});
		});

		window.setTimeout(() => {
			if (animate) {
				this.objRight.removeClass('anim');
			};

			if (!shouldOpen) {
				S.Common.showSidebarRightSet(isPopup, null);
			};

			$(window).trigger('resize');
		}, animate ? J.Constant.delay.sidebar : 0);
	};

	/**
	 * Sets the state of the left panel.
	 * @param {any} v - The state to set.
	 */
	leftPanelSetState (v: any) {
		S.Common.getRef('sidebarLeft')?.setState(v);
	};

	/**
	 * Sets the state of the right panel for the given context.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 * @param {any} v - The state to set.
	 */
	rightPanelSetState (isPopup: boolean, v: any) {
		this.rightPanelRef(isPopup)?.setState(v);
	};

	/**
	 * Gets the state of the right panel for the given context.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 */
	rightPanelGetState (isPopup: boolean) {
		return this.rightPanelRef(isPopup)?.getState() || {};
	};

};

export const sidebar: Sidebar = new Sidebar();
