import { I, Storage, Util, keyboard } from 'Lib';
import { commonStore, menuStore, popupStore } from 'Store';

interface SidebarData {
	x: number;
	y: number;
	width: number;
	height: number;
	fixed: boolean;
	snap: I.MenuDirection;
};

const raf = require('raf');
const $ = require('jquery');
const Constant = require('json/constant.json');

const SNAP_THRESHOLD = 30;
const SHOW_THRESHOLD = 30;
const ANIMATION = 300;

class Sidebar {

	data: SidebarData = { x: 0, y: 0, width: 0, height: 0, fixed: false, snap: null };
	obj: any = null;
	fixed: boolean = false;
	animating: boolean = false;

	timeoutHide: number = 0;
	timeoutAnim: number = 0;

	init () {
		this.obj = $('#sidebar');

		const stored = Storage.get('sidebar');
		if (stored) {
			this.set(stored);
			return;
		};

		const platform = Util.getPlatform();
		const isWindows = platform == I.Platform.Windows;
		const offset = isWindows ? 30 : 0;
		const win = $(window);
		const wh = win.height();
		const height = this.maxHeight();
		const y = (wh - offset) / 2 - height / 2 + offset;

		Storage.setToggle(Constant.subId.sidebar, 'favorite', true);
		Storage.setToggle(Constant.subId.sidebar, 'recent', true);
		Storage.setToggle(Constant.subId.sidebar, 'set', true);

		this.set({
			height,
			width: Constant.size.sidebar.width.default,
			y,
			x: 0,
			fixed: true,
			snap: I.MenuDirection.Left,
		});

		this.resizePage();
		this.fixed = false;

		commonStore.autoSidebarSet(true);
	};

	set (v: any) {
		v = Object.assign(this.data, v);

		const { x, y } = this.checkCoords(v.x, v.y);
		const snap = this.getSnap();

		v.fixed = Boolean(v.fixed);
		v.x = x;
		v.y = y;
		v.width = this.checkWidth(v.width);
		v.height = this.checkHeight(v.height);
		v.snap = snap;

		this.data = Object.assign(this.data, v);
		this.save();
		this.setStyle();
	};

	save () {
		Storage.set('sidebar', this.data);
	};

	setStyle () {
		if (!this.obj || !this.obj.length) {
			return;
		};

		const { fixed, x, y, width, height, snap } = this.data;
		const css: any = { left: '', right: '', width };
		const cn = [];

		if (fixed) {
			cn.push('fixed active');
		} else {
			css.top = y;
			css.height = height;
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

		this.obj.removeClass('left right fixed');
		this.obj.css(css).addClass(cn.join(' '));

		this.resizeHead();
		this.checkButton();
	};

	setWidth (v: number) {
		this.data.width = this.checkWidth(v);
		this.save();
		this.setStyle();
	};

	setHeight (v: number) {
		this.data.height = this.checkHeight(v);
		this.save();
		this.setStyle();
	};

	setFixed (v: boolean) {
		this.data.fixed = v;
		this.data.snap = this.getSnap();

		this.checkButton();
		this.resizeHead();
		this.resizePage();
		this.save();

		$(window).trigger('resize');
	};

	onMouseMove () {
		window.clearTimeout(this.timeoutHide);

		if (!this.obj || !this.obj.length) {
			return;
		};

		if (keyboard.isDragging) {
			this.obj.removeClass('anim').addClass('active');
			return;
		};

		const { autoSidebar } = commonStore;
		const { x } = keyboard.mouse.page;
		const { width, snap } = this.data;
		const win = $(window);
		const ww = win.width();
		const menuOpen = menuStore.isOpenList([ 'dataviewContext', 'preview' ]);
		const popupOpen = popupStore.isOpen();

		if (this.data.fixed || this.animating || !autoSidebar) {
			return;
		};

		let show = false;
		let hide = false;

		if (snap == I.MenuDirection.Left) {
			if (x <= SHOW_THRESHOLD) {
				show = true;
			}
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
			this.timeoutHide = window.setTimeout(() => { this.hide(); }, 200);
		};
	};

	collapse () {
		if (!this.obj || !this.obj.length) {
			return;
		};

		this.animating = true;

		const { autoSidebar } = commonStore;
		const { x, y, width, height, snap } = this.data;
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

		this.obj.removeClass('anim');
		this.obj.css(css);
		this.obj.addClass('anim');
		this.setFixed(false);

		raf(() => { 
			const css: any = {};
			if ((this.data.snap === null) || (autoSidebar && (mouse.x >= x) && (mouse.x <= x + width))) {
				css.top = y;
				css.height = height;
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
	};

	expand () {
		if (!this.obj || !this.obj.length) {
			return;
		};

		const { autoSidebar } = commonStore;
		const { snap } = this.data;
		const css: any = { top: 0, transform: 'translate3d(0px,0px,0px)' };

		if (autoSidebar) {
			css.top = 50;
			css.height = this.data.height;
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
			this.obj.css({ transform: '', height: this.data.height, top: this.data.y, left: '', right: '' });
		});
	};

	show () {
		if (!this.obj || !this.obj.length) {
			return;
		};

		this.obj.css({ top: this.data.y, height: this.data.height });
		this.obj.addClass('anim active');
		this.removeAnimation();
	};

	hide () {
		if (!this.obj || !this.obj.length) {
			return;
		};

		this.obj.addClass('anim').removeClass('active');
		this.removeAnimation();
	};

	removeAnimation (callBack?: () => void) {
		if (!this.obj || !this.obj.length) {
			return;
		};

		window.clearTimeout(this.timeoutAnim);
		this.timeoutAnim = window.setTimeout(() => { 
			this.obj.removeClass('anim'); 
			this.animating = false;

			if (callBack) {
				callBack();
			};
		}, ANIMATION);
	};

	resize () {
		const { fixed, snap, width } = this.data;
		const win = $(window);
		const ww = win.width();
		const set: any = {};

		if (!fixed) {
			set.height = this.maxHeight();
		};
		if (snap == I.MenuDirection.Left) {
			set.x = 0;
		};
		if (snap == I.MenuDirection.Right) {
			set.x = ww - width;
		};

		if (Util.objectLength(set)) {
			this.set(set);
		};
	};

	resizeHead () {
		if (!this.obj || !this.obj.length) {
			return;
		};

		const head = this.obj.find('#head');
		const platform = Util.getPlatform();

		head.css({ height: this.data.fixed ? (platform == I.Platform.Windows ? 30 : Util.sizeHeader()) : 12 });
	};

	resizePage () {
		const { fixed, snap } = this.data;
		const win = $(window);
		const page = $('#page.isFull');
		const header = page.find('#header');
		const footer = page.find('#footer');
		const loader = page.find('#loader');
		const dummyLeft = $('#sidebarDummyLeft');
		const dummyRight = $('#sidebarDummyRight');

		let width = 0;
		if (this.obj && this.obj.length) {
			if (fixed && (this.obj.css('display') != 'none')) {
				width = this.obj.outerWidth();
			};
		};

		let pageWidth = win.width() - width;
		let css: any = { width: '' };
		let cssLoader: any = { width: pageWidth, left: '', right: '' };
		let dummy = null;

		header.css(css).removeClass('withSidebar snapLeft snapRight');
		footer.css(css).removeClass('withSidebar snapLeft snapRight');

		dummyLeft.css({ width: 0 });
		dummyRight.css({ width: 0 });

		css.width = header.outerWidth() - width;
		
		if (fixed) {
			header.addClass('withSidebar');
			footer.addClass('withSidebar');
		};

		if (snap !== null) {
			if (snap == I.MenuDirection.Right) {
				dummy = dummyRight;
				header.addClass('snapRight');
				footer.addClass('snapRight');

				cssLoader.left = 0;
				cssLoader.right = '';
			} else {
				dummy = dummyLeft;
				header.addClass('snapLeft');
				footer.addClass('snapLeft');

				cssLoader.left = '';
				cssLoader.right = 0;
			};
		};

		if (dummy && dummy.length) {
			dummy.css({ width: width ? width : 0 });
		};

		page.css({ width: pageWidth });
		loader.css(cssLoader);
		header.css(css);
		footer.css(css);

		this.checkButton();
	};

	checkButton () {
		const { fixed } = this.data;
		const button = $('#footer #button-expand');

		if (!button.length) {
			return;
		};

		fixed ? button.hide() : button.show();
	};

	checkCoords (x: number, y: number): { x: number, y: number } {
		const { width, height } = this.data;
		const win = $(window);
		const wh = win.height();
		const ww = win.width();
		const hh = Util.sizeHeader();

		x = Number(x);
		x = Math.max(0, x);
		x = Math.min(ww - width, x);

		y = Number(y);
		y = Math.max(hh, y);
		y = Math.min(wh - SHOW_THRESHOLD - 10 - height, y);

		return { x, y };
	};

	getSnap (): I.MenuDirection {
		const { x, width, fixed } = this.data;
		const win = $(window);
		const ww = win.width();

		let snap = null;
		if (x <= SNAP_THRESHOLD) {
			snap = I.MenuDirection.Left;
		} else
		if (x + width >= ww - SNAP_THRESHOLD) {
			snap = I.MenuDirection.Right;
		};
		if (fixed && (snap === null)) {
			snap = I.MenuDirection.Left;
		};
		return snap;
	};

	checkWidth (width: number): number {
		const { min, max } = Constant.size.sidebar.width;
		return Math.max(min, Math.min(max, Number(width) || 0));
	};

	checkHeight (height: number): number {
		const { min } = Constant.size.sidebar.height;
		return Math.max(min, Math.min(this.maxHeight(), Number(height) || 0));
	};

	maxHeight (): number {
		const win = $(window);
		return win.height() - Util.sizeHeader() - 52 - 10;
	};

};

export let sidebar: Sidebar = new Sidebar();