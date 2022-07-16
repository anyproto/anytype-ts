import { I, Storage, Util, keyboard } from 'ts/lib';
import { commonStore, menuStore } from 'ts/store';

interface SidebarData {
	x: number;
	y: number;
	width: number;
	height: number;
	fixed: boolean;
	snap: I.MenuDirection;
};

const Constant = require('json/constant.json');
const SNAP_THRESHOLD = 30;

class Sidebar {

	data: SidebarData = { x: 0, y: 0, width: 0, height: 0, fixed: false, snap: I.MenuDirection.None };
	obj: any = null;
	fixed: boolean = false;
	timeoutShow: number = 0;

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

		Storage.setToggle(Constant.subIds.sidebar, 'favorite', true);
		Storage.setToggle(Constant.subIds.sidebar, 'recent', true);
		Storage.setToggle(Constant.subIds.sidebar, 'set', true);

		this.set({
			height,
			width: 0,
			y,
			x: 0,
			fixed: true,
			snap: I.MenuDirection.Left,
		});

		this.fixed = false;
		commonStore.autoSidebarSet(true);
	};

	set (v: any) {
		v = Object.assign(this.data, v);

		const { x, y } = this.checkCoords(v.x, v.y);
		const snap = this.checkSnap(x);

		v.fixed = Boolean(v.fixed);
		v.x = x;
		v.y = y;
		v.snap = snap;
		v.width = this.checkWidth(v.width);
		v.height = this.checkHeight(v.height);

		this.data = Object.assign(this.data, v);
		Storage.set('sidebar', v);

		this.setStyle();
		Util.resizeSidebar();
	};

	setStyle () {
		if (!this.obj || !this.obj.length) {
			return;
		};

		const head = this.obj.find('#head');
		const platform = Util.getPlatform();
		const { fixed, snap, x, y, width, height } = this.data;
		const css: any = {};
		const cn = [];
		const hh = fixed ? (platform == I.Platform.Windows ? 30 : Util.sizeHeader()) : 12;

		css.left = '';
		css.top = y;
		css.width = width;
		css.height = height;

		if (snap === null) {
			css.left = x;
		};

		if (fixed) {
			cn.push('fixed');
			css.height = '';
		};
		if (snap == I.MenuDirection.Left) {
			cn.push('left');
		};
		if (snap == I.MenuDirection.Right) {
			cn.push('right');
		};

		head.css({ height: hh });

		this.obj.removeClass('left right fixed');
		this.obj.css(css).addClass(cn.join(' '));
		this.checkButton();
	};

	onMouseMove () {
		if (!this.obj || !this.obj.length) {
			return;
		};

		if (keyboard.isDragging) {
			this.obj.addClass('active');
			return;
		};

		const { x } = keyboard.mouse.page;
		const { snap, width } = this.data;
		const win = $(window);
		const ww = win.width();
		const menuOpen = menuStore.isOpenList([ 'dataviewContext', 'preview' ]);

		let add = false;
		let remove = false;

		if ((snap == I.MenuDirection.Left) && (ww > Constant.size.sidebar.unfix)) {
			if (x <= 20) {
				add = true;
			};
			if (x > width + 10) {
				remove = true;
			};
		};

		if (snap == I.MenuDirection.Right) {
			if (x >= ww - 20) {
				add = true;
			};
			if (x < ww - width - 10) {
				remove = true;
			};
		};

		if (menuOpen) {
			remove = false;
		};

		if (add) {
			this.obj.addClass('anim active');
		};

		if (remove) {
			this.timeoutShow = window.setTimeout(() => {
				this.obj.removeClass('active');
				window.setTimeout(() => { this.obj.removeClass('anim'); }, 200);
			}, 200);
		};
	};

	collapse () {
		this.set({ fixed: false });
	};

	expand () {
		this.set({ fixed: true });
	};

	show () {
	};

	hide () {
	};

	resize () {
		const { fixed } = this.data;
		const win = $(window);
		const ww = win.width();

		if ((ww > Constant.size.sidebar.unfix) && !fixed && this.fixed) {
			this.expand();
		};
		if ((ww <= Constant.size.sidebar.unfix) && fixed) {
			this.collapse();
			this.fixed = true;
		};
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
		const win = $(window);
		const wh = win.height();
		const ww = win.width();
		const hh = Util.sizeHeader();

		x = Number(x);
		x = Math.max(0, x);
		x = Math.min(ww - this.data.width, x);

		y = Number(y);
		y = Math.max((wh - hh) * 0.1, y);
		y = Math.min(hh + (wh - hh) * 0.9 - this.data.height, y);

		return { x, y };
	};

	checkSnap (x: number) {
		let win = $(window);
		let snap = null;

		if (x <= SNAP_THRESHOLD) {
			snap = I.MenuDirection.Left;
		};
		if (x + this.data.width >= win.width() - SNAP_THRESHOLD) {
			snap = I.MenuDirection.Right;
		};
		return snap;
	};

	checkWidth (width: number) {
		const size = Constant.size.sidebar.width;

		width = Number(width) || 0;
		return Math.max(size.min, Math.min(size.max, width));
	};

	checkHeight (height: number) {
		const size = Constant.size.sidebar.height;

		height = Number(height) || 0;
		return Math.max(size.min, Math.min(sidebar.maxHeight(), height));
	};

	maxHeight () {
		const win = $(window);
		const wh = win.height() - Util.sizeHeader();
		return wh - 144;
	};

};

export let sidebar: Sidebar = new Sidebar();