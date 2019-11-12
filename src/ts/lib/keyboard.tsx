import { I, Util } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';

const $ = require('jquery');

class Keyboard {
	
	history: any = null;
	focus: boolean = false;
	
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
			if (k == Key.backSpace) {
				e.preventDefault();
				this.history.goBack();
			};
			
			if (k == Key.escape) {
				e.preventDefault();
				commonStore.popupCloseAll();
			};
		};
	};
	
	onKeyUp (e: any) {
		let k = e.which;
	};
	
	setFocus (v: boolean) {
		this.focus = v;
	};
	
};

export enum Key {
	backSpace	 = 8,
	enter		 = 13,
	escape		 = 27,
	up			 = 38,
	down		 = 40,
};

export let keyboard: Keyboard = new Keyboard();