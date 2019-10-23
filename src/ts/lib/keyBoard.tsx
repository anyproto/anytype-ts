import { commonStore } from 'ts/store';

const $ = require('jquery');

class KeyBoard {
	
	history: any = null;
	focus: boolean = false;
	
	init (history: any) {
		this.history = history;
		this.unbind();
		
		let win = $(window); 
		win.on('keydown.common', (e: any) => { this.keyDownWindow(e); })
		win.on('keyup.common', (e: any) => { this.keyUpWindow(e); });
	};
	
	unbind () {
		$(window).unbind('keyup.common keydown.common');
	};
	
	keyDownWindow (e: any) {
	};
	
	keyUpWindow (e: any) {
		let k = e.which;
		
		//console.log('keyup', e.shiftKey, e.ctrlKey, e.metaKey);
		
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
	
	keyDownBlock (e: any) {
		let k = e.which;
	};
	
	keyUpBlock (e: any) {
		let k = e.which;
		
		if (k == Key.enter) {
			e.preventDefault();
		};
	};
	
	setFocus (v: boolean) {
		this.focus = v;
	};
	
};

export enum Key {
	backSpace	 = 8,
	enter		 = 13,
	escape		 = 27,
};

export let keyBoard: KeyBoard = new KeyBoard();