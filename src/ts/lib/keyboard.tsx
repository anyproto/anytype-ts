import { I, Util, DataUtil, SmileUtil, Storage, focus } from 'ts/lib';
import { commonStore, authStore, blockStore } from 'ts/store';

const $ = require('jquery');
const Constant = require('json/constant.json');

class Keyboard {
	
	history: any = null;
	coords: any = { x: 0, y: 0 };
	timeoutPin: number = 0;
	pressed: any = {};
	match: any = {};
	
	isDragging: boolean = false;
	isResizing: boolean = false;
	isFocused: boolean = false;
	isPreviewDisabled: boolean = false;
	isMouseDisabled: boolean = false;
	isBackDisabled: boolean = false;
	
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
		const { root } = blockStore;
		const { focused } = focus;
		const k = e.key.toLowerCase();
		const rootId = this.isEditor() ? this.match.params.id : root;
		
		if (!this.isFocused) {
			if ((k == Key.backspace) && !this.isBackDisabled) {
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
			
			// Navigation
			if ((k == Key.s) && !e.shiftKey) {
				commonStore.popupOpen('navigation', { 
					preventResize: true,
					data: { 
						type: I.NavigationType.Go, 
						disableFirstKey: true,
						rootId: rootId,
					}, 
				});
			};

			if (k == Key.o) {
				commonStore.popupOpen('navigation', { 
					preventResize: true,
					data: { 
						type: I.NavigationType.Go, 
						rootId: rootId,
						expanded: true,
					}, 
				});
			};
		};

		// Create new page
		if ((k == Key.n) && this.ctrlByPlatform(e)) {
			e.preventDefault();
			
			let targetId = '';
			let position = I.BlockPosition.Bottom;
			
			if (this.isEditor()) {
				const fb = blockStore.getLeaf(rootId, focused);
				if (fb) {
					if (fb.isTitle()) {
						const first = blockStore.getFirstBlock(rootId, 1, (it: I.Block) => { return it.isFocusable() && !it.isTitle(); });
						if (first) {
							targetId = first.id;
							position = I.BlockPosition.Top;
						};
					} else 
					if (fb.isFocusable()) {
						targetId = fb.id;
					};
				};
			};
			
			DataUtil.pageCreate(e, rootId, targetId, { iconEmoji: SmileUtil.random() }, position);
		};
		
		this.setPinCheck();
	};

	ctrlByPlatform (e: any) {
		const platform = Util.getPlatform();
		if (platform == I.Platform.Mac) {
			return e.metaKey;
		} else {
			return e.ctrlKey;
		};
	};
	
	isEditor () {
		return this.match && this.match.params && (this.match.params.page == 'main') && (this.match.params.action == 'edit');
	};
	
	onKeyUp (e: any) {
		const k = e.key.toLowerCase();
	};
	
	setFocus (v: boolean) {
		this.isFocused = v;
	};
	
	setResize (v: boolean) {
		this.isResizing = v;
	};
	
	setDrag (v: boolean) {
		this.isDragging = v;
	};
	
	setPinCheck () {
		const { account } = authStore;
		const pin = Storage.get('pin');
		
		if (!pin || !account) {
			return;
		};
		
		window.clearTimeout(this.timeoutPin);
		this.timeoutPin = window.setTimeout(() => {
			const pin = Storage.get('pin');
			if (pin) {
				this.history.push('/auth/pin-check');				
			};
		}, 5 * 60 * 1000);
	};
	
	setMatch (match: any) {
		this.match = match;
	};
	
	disableBack (v: boolean) {
		this.isBackDisabled = v;
	};
	
	disableMouse (v: boolean) {
		this.isMouseDisabled = v;
	};
	
	disablePreview (v: boolean) {
		this.isPreviewDisabled = v;
	};
	
	setCoords (x: number, y: number) {
		this.coords = { x: x, y: y };
	};
	
	isArrow (k: string): boolean {
		const keys: string[] = [ Key.up, Key.down, Key.left, Key.right ];
		return keys.indexOf(k) >= 0;
	};
	
	isSpecial (k: string): boolean {
		const keys: string[] = [ Key.backspace, Key.tab, Key.enter ];
		return this.isArrow(k) || keys.indexOf(k) >= 0;
	};
	
};

export enum Key {
	backspace	 = 'backspace',
	tab			 = 'tab',
	enter		 = 'enter',
	escape		 = 'escape',
	space		 = 'space',
	left		 = 'arrowleft',
	up			 = 'arrowup',
	right		 = 'arrowright',
	down		 = 'arrowdown',
	a			 = 'a',
	b			 = 'b',
	c			 = 'c',
	d			 = 'd',
	e			 = 'e',
	i			 = 'i',
	k			 = 'k',
	l			 = 'l',
	n			 = 'n',
	o			 = 'o',
	p			 = 'p',
	s			 = 's',
	v			 = 'v',
	x			 = 'x',
	y			 = 'y',
	z			 = 'z',
	slash		 = '/',
};

export let keyboard: Keyboard = new Keyboard();