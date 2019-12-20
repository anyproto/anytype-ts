import { I, Util, Storage } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';

const $ = require('jquery');

class Keyboard {
	
	history: any = null;
	focus: boolean = false;
	back: boolean = true;
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
		};
		
		this.setPinCheck();
	};
	
	onKeyUp (e: any) {
		let k = e.which;
	};
	
	setFocus (v: boolean) {
		this.focus = v;
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
	c			 = 67,
	slash		 = 191,
};

export let keyboard: Keyboard = new Keyboard();