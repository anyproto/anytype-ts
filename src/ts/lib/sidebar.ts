import $ from 'jquery';
import raf from 'raf';
import { I, keyboard, Storage, UtilCommon } from 'Lib';
import { commonStore, menuStore, popupStore } from 'Store';
const Constant = require('json/constant.json');

interface SidebarData {
	x: number;
	y: number;
	width: number;
	snap: I.MenuDirection.Left | I.MenuDirection.Right | null;
	isClosed: boolean;
};

const SNAP_THRESHOLD = 30;
const SHOW_THRESHOLD = 30;
const ANIMATION = 200;

class Sidebar {
	
	data: SidebarData = {
		x: 0,
		y: 0,
		width: 0,
		snap: I.MenuDirection.Left,
		isClosed: false,
	};
	obj: JQuery<HTMLElement> = null;
	page: JQuery<HTMLElement> = null;
	header: JQuery<HTMLElement> = null;
	footer: JQuery<HTMLElement> = null;
	loader: JQuery<HTMLElement> = null;
	dummyLeft: JQuery<HTMLElement> = null;
	dummyRight: JQuery<HTMLElement> = null;
	isAnimating = false;
	isDragging = false;
	timeoutHide = 0;
	timeoutAnim = 0;

	init () {
		this.initObjects();

		const stored = Storage.get('sidebar');
		if (stored) {
			if ('undefined' == typeof(stored.isClosed)) {
				stored.isClosed = !stored.width;
			};

			this.set(stored);
		} else {
			commonStore.autoSidebarSet(true);
			commonStore.isSidebarFixedSet(true);

			const { wh } = UtilCommon.getWindowDimensions();
			const y = wh / 2 - this.getMaxHeight() / 2;

			this.set({
				width: Constant.size.sidebar.width.default,
				y,
				x: 0,
				snap: I.MenuDirection.Left,
				isClosed: false,
			});

			this.resizePage();
		};
	};

	initObjects () {
		this.obj = $('#sidebar');
		this.page = $('#page.isFull');
		this.header = this.page.find('#header');
		this.footer = this.page.find('#footer');
		this.loader = this.page.find('#loader');
		this.dummyLeft = $('#sidebarDummyLeft');
		this.dummyRight = $('#sidebarDummyRight');
	};

	onMouseMove (): void {
		window.clearTimeout(this.timeoutHide);

		if (!this.obj || !this.obj.length || keyboard.isDragging) {
			return;
		};

		if (this.isDragging) {
			this.obj.removeClass('anim').addClass('active');
			return;
		};

		if (
			this.isAnimating ||
			commonStore.isSidebarFixed ||
			!commonStore.autoSidebar
		) {
			return;
		};

		const { x } = keyboard.mouse.page;
		const { width, snap } = this.data;
		const { ww } = UtilCommon.getWindowDimensions();
		const menuOpen = menuStore.isOpenList([ 'dataviewContext', 'preview', 'widget' ]);
		const popupOpen = popupStore.isOpen();

		let show = false;
		let hide = false;

		if (snap == I.MenuDirection.Left) {
			if (x <= SHOW_THRESHOLD) {
				show = true;
			};
			if (x >= width + 20) {
				hide = true;
			};
		};

		if (snap == I.MenuDirection.Right) {
			if (x >= ww - SHOW_THRESHOLD) {
				show = true;
			};
			if (x <= ww - width - 20) {
				hide = true;
			};
		};

		if (popupOpen) {
			show = false;
		};

		if (menuOpen) {
			show = false;
			hide = false;
		};

		if (show) {
			this.show();
		};

		if (hide && this.obj.hasClass('active')) {
			this.timeoutHide = window.setTimeout(() => this.hide(), 200);
		};
	};

	collapse (): void {
		if (!this.obj || !this.obj.length) {
			return;
		};

		const { autoSidebar } = commonStore;
		const { x, y, width, snap } = this.data;
		const css: any = { top: 0, height: '100%' };
		const mouse = keyboard.mouse.page;

		let tx = 0;
		if (snap == I.MenuDirection.Left) {
			css.left = 0;
			tx = -110;
		};

		if (snap == I.MenuDirection.Right) {
			css.right = 0;
			tx = 110;
		};

		this.setAnimating(true);
		this.obj.removeClass('anim');
		this.obj.css(css);
		this.obj.addClass('anim');
		this.setFixed(false);

		raf(() => {
			const css: any = {};
			if (
				(this.data.snap === null) ||
				(autoSidebar && (mouse.x >= x) && (mouse.x <= x + width))
			) {
				css.top = y;
				css.height = this.getMaxHeight();
				css.transform = `translate3d(0px,0px,0px)`;
			} else {
				css.top = 0;
				css.height = '100%';
				css.transform = `translate3d(${tx}%,0px,0px)`;
			};

			this.obj.css(css);
		});

		this.removeAnimation(() => {
			this.obj.css({ transform: '' });

			if (!autoSidebar) {
				this.obj.removeClass('active');
			};
		});
	}

	expand (): void {
		if (!this.obj || !this.obj.length) {
			return;
		};

		const { autoSidebar } = commonStore;
		const { snap } = this.data;
		const mh = this.getMaxHeight();
		const css: any = { top: 0, transform: 'translate3d(0px,0px,0px)' };

		if (autoSidebar) {
			css.top = 50;
			css.height = mh;
		};

		if (snap == I.MenuDirection.Left) {
			css.left = 0;
		};
		if (snap == I.MenuDirection.Right) {
			css.right = 0;
		};

		this.obj.removeClass('anim');
		this.obj.css(css).addClass('anim');
		this.setFixed(true);

		raf(() => {
			this.obj.css({ top: 0 }).addClass('fixed');
		});

		this.removeAnimation(() => {
			this.obj.css({
				transform: '',
				height: mh,
				top: this.data.y,
				left: '',
				right: '',
			});
		});
	}

	show (): void {
		if (!this.obj || !this.obj.length) {
			return;
		};

		this.obj.css({ top: this.data.y, height: this.getMaxHeight() });
		this.obj.addClass('anim active');
		this.removeAnimation();
	};

	hide (): void {
		if (!this.obj || !this.obj.length) {
			return;
		};

		this.obj.css({ transform: '' }).addClass('anim').removeClass('active');
		this.removeAnimation();
	};

	close (): void {
		if (!this.obj || !this.obj.length || this.isAnimating) {
			return;
		};

		this.setAnimating(true);
		this.obj.addClass('anim').removeClass('active');
		this.setStyle({ width: 0 });
		this.set({ isClosed: true });
		this.removeAnimation(() => $(window).trigger('resize'));
	};

	open (width?: number): void {
		if (!this.obj || !this.obj.length || this.isAnimating) {
			return;
		};

		this.setAnimating(true);
		this.obj.addClass('anim').removeClass('active');
		this.setStyle({ width });
		this.set({ isClosed: false });
		this.removeAnimation(() => $(window).trigger('resize'));
	};

	toggleOpenClose () {
		if (!this.isAnimating) {
			this.data.isClosed ? this.open(this.data.width) : this.close();
		};
	};

	toggleExpandCollapse () {
		const { isClosed, width } = this.data;

		if (isClosed) {
			this.set({ width, isClosed: false }, true);
			$(window).trigger('resize');
		};

		commonStore.isSidebarFixed ? this.collapse() : this.expand();
	};

	private removeAnimation (callBack?: () => void): void {
		if (!this.obj || !this.obj.length) {
			return;
		};

		window.clearTimeout(this.timeoutAnim);
		this.timeoutAnim = window.setTimeout(() => {
			this.obj.removeClass('anim');
			this.setAnimating(false);

			if (callBack) {
				callBack();
			};
		}, ANIMATION);
	};

	resize (): void {
		const { snap, width } = this.data;
		const { ww } = UtilCommon.getWindowDimensions();
		const set: Partial<SidebarData> = {};

		if (snap == I.MenuDirection.Left) {
			set.x = 0;
		};
		if (snap == I.MenuDirection.Right) {
			set.x = ww - width;
		};

		if (UtilCommon.objectLength(set)) {
			this.set(set);
		};
	};

	resizePage () {
		this.initObjects();

		const { isSidebarFixed } = commonStore;
		const { snap } = this.data;

		let width = 0;
		let dummy = null;

		if (this.obj && this.obj.length) {
			if (isSidebarFixed && (this.obj.css('display') != 'none')) {
				width = this.obj.outerWidth();
			};
		};

		const { ww } = UtilCommon.getWindowDimensions();
		const pageWidth = ww - width;
		const css: any = { width: '' };
		const cssLoader: any = { width: pageWidth, left: '', right: '' };
		
		this.header.css(css).removeClass('withSidebar snapLeft snapRight');
		this.footer.css(css).removeClass('withSidebar snapLeft snapRight');

		this.dummyLeft.css({ width: 0 });
		this.dummyRight.css({ width: 0 });

		css.width = this.header.outerWidth() - width;

		if (isSidebarFixed && width) {
			this.header.addClass('withSidebar');
			this.footer.addClass('withSidebar');
		};

		if (snap !== null) {
			if (snap == I.MenuDirection.Right) {
				dummy = this.dummyRight;

				this.header.addClass('snapRight');
				this.footer.addClass('snapRight');

				cssLoader.left = 0;
				cssLoader.right = '';
			} else {
				dummy = this.dummyLeft;
				this.header.addClass('snapLeft');
				this.footer.addClass('snapLeft');

				cssLoader.left = '';
				cssLoader.right = 0;
			};
		};

		if (dummy && dummy.length) {
			dummy.css({ width: width ? width : 0 });
		};

		this.page.css({ width: pageWidth });
		this.loader.css(cssLoader);
		this.header.css(css);
		this.footer.css(css);

		$(window).trigger('sidebarResize');
	};

	private save (): void {
		Storage.set('sidebar', this.data);
	};

	set (v: Partial<SidebarData>, force?: boolean): void {
		v = Object.assign(this.data, v);

		let { width, x, y } = v;

		if (!force) {
			width = this.limitWidth(width);

			const coords = this.limitCoords(v.x, v.y, width, this.getMaxHeight());
			x = coords.x;
			y = coords.y;
		};

		this.data = Object.assign<SidebarData, Partial<SidebarData>>(this.data, {
			x,
			y,
			width,
			snap: this.getSnap(x, width),
		});

		this.save();
		this.resizePage();
		this.setStyle(this.data);
	};

	public setAnimating (v: boolean) {
		this.isAnimating = v;
	};

	public setDragging (v: boolean) {
		this.isDragging = v;
	};

	private setStyle (v: Partial<SidebarData>): void {
		if (!this.obj || !this.obj.length) {
			return;
		};

		const { x, y, width, snap, isClosed } = v;
		const css: any = { left: '', right: '', width };
		const cn = [];

		if (commonStore.isSidebarFixed) {
			cn.push('fixed active');
		} else {
			css.top = y;
			css.height = this.getMaxHeight();
		};

		if (snap === null) {
			css.left = x;
		};
		if (snap == I.MenuDirection.Left) {
			cn.push('left');
		};
		if (snap == I.MenuDirection.Right) {
			cn.push('right');
		};

		if (this.isDragging) {
			cn.push('active');
		};

		if (isClosed) {
			css.width = 0;
		};

		this.obj.removeClass('left right fixed');
		this.obj.css(css).addClass(cn.join(' '));
	};

	private setFixed (v: boolean): void {
		commonStore.isSidebarFixedSet(v);

		this.data.snap = this.getSnap(this.data.x, this.data.width);
		this.resizePage();
		this.save();

		$(window).trigger('resize');
	};

	/**
	 * Get the side to snap the sidebar to
	 */
	private getSnap (x: number, width: number): I.MenuDirection.Left | I.MenuDirection.Right | null {
		if (x <= SNAP_THRESHOLD) {
			return I.MenuDirection.Left;
		} else 
		if (commonStore.isSidebarFixed) {
			return I.MenuDirection.Left;
		} else {
			return null;
		};
	};

	/**
	 * Get max height allowed
	 */
	private getMaxHeight (): number {
		return UtilCommon.getWindowDimensions().wh - UtilCommon.sizeHeader() * 2;
	};

	/**
	 * Limit the sidebar coordinates to the max and min bounds
	 */
	private limitCoords (x: number, y: number, width: number, height: number ): { x: number; y: number } {
		const { ww, wh } = UtilCommon.getWindowDimensions();
		const hh = UtilCommon.sizeHeader();

		x = Number(x);
		x = Math.max(0, x);
		x = Math.min(ww - width, x);

		y = Number(y);
		y = Math.max(hh, y);
		y = Math.min(wh - SHOW_THRESHOLD - 10 - height, y);

		return { x, y };
	};

	/**
	 * Limit the sidebar width to the max and min bounds
	 */
	private limitWidth (width: number): number {
		const { min, max } = Constant.size.sidebar.width;
		return Math.max(min, Math.min(max, Number(width) || 0));
	};

};

export const sidebar: Sidebar = new Sidebar();