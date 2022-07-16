import { I, Storage, Util } from 'ts/lib';
import { commonStore } from 'ts/store';

interface SidebarObj {
	x: number;
	y: number;
	width: number;
	height: number;
	fixed: boolean;
	snap: I.MenuDirection;
};

const Constant = require('json/constant.json');

class Sidebar {

	obj: SidebarObj = { x: 0, y: 0, width: 0, height: 0, fixed: false, snap: I.MenuDirection.None };
	fixed: boolean = false;

	init () {
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
		const size = Constant.size.sidebar;

		v = Object.assign(this.obj, v);

		const { x, y } = this.checkCoords(v.x, v.y);

		v.fixed = Boolean(v.fixed);
		v.x = x;
		v.y = y;
		v.snap = Number(v.snap) || I.MenuDirection.None;
		
		v.width = Number(v.width) || 0;
		v.width = Math.max(size.width.min, Math.min(size.width.max, v.width));
		
		v.height = Number(v.height) || 0;
		v.height = Math.max(size.height.min, Math.min(this.maxHeight(), v.height));

		this.obj = Object.assign(this.obj, v);
		Storage.set('sidebar', v);

		this.setStyle();
	};

	setStyle () {
		const obj = $('#sidebar');
		const button = $('#footer #button-expand');
		const { fixed, snap, x, y, width, height } = this.obj;
		const css: any = {};
		const cn = [];

		obj.removeClass('left right fixed');

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

		console.log(css);
		fixed ? button.hide() : button.show();
		obj.css(css).addClass(cn.join(' '));
	};

	checkCoords (x: number, y: number): { x: number, y: number } {
		const win = $(window);
		const wh = win.height();
		const ww = win.width();
		const hh = Util.sizeHeader();

		x = Number(x);
		x = Math.max(0, x);
		x = Math.min(ww - this.obj.width, x);

		y = Number(y);
		y = Math.max((wh - hh) * 0.1, y);
		y = Math.min(hh + (wh - hh) * 0.9 - this.obj.height, y);

		return { x, y };
	};

	maxHeight () {
		const win = $(window);
		const wh = win.height() - Util.sizeHeader();
		return wh - 144;
	};

};

export let sidebar: Sidebar = new Sidebar();