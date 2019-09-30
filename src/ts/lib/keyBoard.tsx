const $ = require('jquery');

class KeyBoard {
	
	history: any = null;
	focus: boolean = false;
	
	init (history: any) {
		this.history = history;
		this.unbind();
		
		let win = $(window); 
		win.on('keydown.common', (e: any) => { this.keyDown(e); })
		win.on('keyup.common', (e: any) => { this.keyUp(e); });
	};
	
	unbind () {
		$(window).unbind('keyup.common keydown.common');
	};
	
	keyUp (e: any) {
		let k = e.which;
		
		//console.log('keyup', e.shiftKey, e.ctrlKey, e.metaKey);
		
		if (!this.focus) {
			if (k == Key.backSpace) {
				e.preventDefault();
				this.history.goBack();
			};			
		};
	};
	
	keyDown (e: any) {
		//console.log('keydown', e.shiftKey, e.ctrlKey, e.metaKey);
	};
	
	setFocus (v: boolean) {
		this.focus = v;
	};
	
};

export enum Key {
	backSpace =	 8,
};

export let keyBoard: KeyBoard = new KeyBoard();