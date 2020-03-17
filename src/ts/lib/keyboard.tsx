import { I, C, Util, DataUtil, Storage } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';

const $ = require('jquery');
const Constant = require('json/constant.json');

class Keyboard {
	
	history: any = null;
	focus: boolean = false;
	resize: boolean = false;
	drag: boolean = false;
	back: boolean = true;
	mouse: boolean = true;
	timeoutPin: number = 0;
	
	init (history: any) {
		this.history = history;
		this.unbind();
		
		let win = $(window); 
		win.on('keydown.common', (e: any) => { this.onKeyDown(e); })
		win.on('keyup.common', (e: any) => { this.onKeyUp(e); });
	};
	
	unbind () {
		$(window).unbind('keyup.common keydown.common');
	};
	
	onKeyDown (e: any) {
		let k = e.which;
		
		if (!this.focus) {
			if ((k == Key.backspace) && this.back) {
				e.preventDefault();
				this.history.goBack();
			};
		};
		
		if (k == Key.escape) {
			e.preventDefault();
			commonStore.popupCloseAll();
			commonStore.menuCloseAll();
			Util.linkPreviewHide(false);
		};
		
		if (e.ctrlKey || e.metaKey) {
			
			// Create new page
			if (k == Key.n) {
				e.preventDefault();
				DataUtil.pageCreate(e, { history: this.history }, '', Constant.default.name);
			};
		};
		
		this.setPinCheck();
	};
	
	onKeyUp (e: any) {
		let k = e.which;
	};
	
	setFocus (v: boolean) {
		this.focus = v;
	};
	
	setResize (v: boolean) {
		this.resize = v;
	};
	
	setDrag (v: boolean) {
		this.drag = v;
	};
	
	setPinCheck () {
		const pin = Storage.get('pin');
		if (!pin) {
			return;
		};
		
		window.clearTimeout(this.timeoutPin);
		this.timeoutPin = window.setTimeout(() => {
			if (pin) {
				this.history.push('/auth/pin-check');				
			};
		}, 5 * 60 * 1000);
	};
	
	disableBack (v: boolean) {
		this.back = !v;
	};
	
	disableMouse (v: boolean) {
		this.mouse = !v;
	};
	
	isArrow (k: number): boolean {
		return [ Key.up, Key.down, Key.left, Key.right ].indexOf(k) >= 0;
	};
	
	isSpecial (k: number): boolean {
		return this.isArrow(k) || [ Key.backspace, Key.tab, Key.enter ].indexOf(k) >= 0;
	};
	
};

export enum Key {
	backspace	 = 8,
	tab			 = 9,
	enter		 = 13,
	escape		 = 27,
	space		 = 32,
	left		 = 37,
	up			 = 38,
	right		 = 39,
	down		 = 40,
	a			 = 65,
	b			 = 66,
	c			 = 67,
	d			 = 68,
	e			 = 69,
	i			 = 73,
	k			 = 75,
	n			 = 78,
	p			 = 80,
	s			 = 83,
	v			 = 86,
	x			 = 88,
	y			 = 89,
	z			 = 90,
	slash		 = 191,
};

export let keyboard: Keyboard = new Keyboard();