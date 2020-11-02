import { I, Util, DataUtil, SmileUtil, Storage, focus } from 'ts/lib';
import { commonStore, authStore, blockStore } from 'ts/store';

const $ = require('jquery');
const KeyCode = require('json/key.json');

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
	isPinChecked: boolean = false;
	
	init (history: any) {
		this.history = history;
		this.unbind();
		
		let win = $(window); 
		win.on('keydown.common', (e: any) => { this.onKeyDown(e); })
	};
	
	unbind () {
		$(window).unbind('keyup.common keydown.common');
	};
	
	onKeyDown (e: any) {
		const { account } = authStore;
		const { root } = blockStore;
		const { focused } = focus;
		const rootId = this.isEditor() ? this.match.params.id : root;
		const platform = Util.getPlatform();
		const isMainIndex = this.isMainIndex();
		
		// Go back
		this.shortcut('backspace', e, (pressed: string) => {
			if (this.isBackDisabled || this.isFocused) {
				return;
			};
			this.history.goBack();
		});

		if (platform == I.Platform.Mac) {
			this.shortcut('cmd+[', e, (pressed: string) => { this.back(); });
			this.shortcut('cmd+]', e, (pressed: string) => { this.forward(); });
		} else {
			this.shortcut('alt+arrowleft', e, (pressed: string) => { this.back(); });
			this.shortcut('alt+arrowright', e, (pressed: string) => { this.forward(); });
		};

		// Close popups
		this.shortcut('escape', e, (pressed: string) => {
			e.preventDefault();
			commonStore.popupCloseAll();
			commonStore.menuCloseAll();
			Util.linkPreviewHide(false);
		});

		// Navigation search
		this.shortcut('ctrl+s, cmd+s', e, (pressed: string) => {
			if (commonStore.popupIsOpen('navigation') || !this.isPinChecked || !account) {
				return;
			};
			commonStore.popupOpen('navigation', { 
				preventResize: true,
				data: { 
					type: I.NavigationType.Go, 
					disableFirstKey: true,
					rootId: rootId,
				}, 
			});
		});

		// Navigation links
		this.shortcut('ctrl+o, cmd+o', e, (pressed: string) => {
			if (!account) {
				return;
			};
			commonStore.popupOpen('navigation', { 
				preventResize: true,
				data: { 
					type: I.NavigationType.Go, 
					rootId: rootId,
					expanded: true,
				}, 
			});
		});

		// Go to dashboard
		this.shortcut('cmd+enter, alt+h', e, (pressed: string) => {
			let check = platform == I.Platform.Mac ? pressed == 'cmd+enter' : true;
			if (!check || !authStore.account) {
				return;
			};

			this.history.push('/main/index');
		});

		// Create new page
		this.shortcut('ctrl+n, cmd+n', e, (pressed: string) => {
			let check = platform == I.Platform.Mac ? pressed == 'cmd+n' : true;
			if (!check) {
				return;
			};

			e.preventDefault();
			
			let targetId = '';
			let position = I.BlockPosition.Bottom;
			
			if (this.isEditor()) {
				const fb = blockStore.getLeaf(rootId, focused);
				if (fb) {
					if (fb.isTextTitle()) {
						const first = blockStore.getFirstBlock(rootId, 1, (it: I.Block) => { return it.isFocusable() && !it.isTextTitle(); });
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
			
			DataUtil.pageCreate(e, rootId, targetId, { iconEmoji: SmileUtil.random() }, position, (message: any) => {
				if (isMainIndex) {
					DataUtil.pageOpen(message.targetId);
				} else {
					DataUtil.pageOpenPopup(message.targetId);
				};
			});
		});
		
		this.initPinCheck();
	};

	back () {
		const { account } = authStore;

		const prev = this.history.entries[this.history.index - 1];
		if (prev) {
			let route = Util.getRoute(prev.pathname);
			if ((route.page == 'auth') && account) {
				return;
			};
			if ((route.page == 'main') && !account) {
				return;
			};
		};

		this.history.goBack();
	};

	forward () {
		this.history.goForward();
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

	isMainIndex () {
		return this.match && this.match.params && (this.match.params.page == 'main') && (this.match.params.action == 'index');
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

	setPinChecked (v: boolean) {
		this.isPinChecked = v;
	};
	
	initPinCheck () {
		const { account } = authStore;
		const pin = Storage.get('pin');
		
		if (!pin) {
			this.setPinChecked(true);
		};
		
		if (!pin || !account) {
			return;
		};
		
		window.clearTimeout(this.timeoutPin);
		this.timeoutPin = window.setTimeout(() => {
			const pin = Storage.get('pin');
			if (pin) {
				this.setPinChecked(false);
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

	shortcut (s: string, e: any, callBack: (pressed: string) => void) {
		if (!e || !e.key) {
			return;
		};

		const a = s.split(',').map((it: string) => { return it.trim(); });
		const key = e.key.toLowerCase();
		const which = e.which;

		let pressed = [];
		let res = '';

		if (e.shiftKey) {
			pressed.push('shift');
		};
		if (e.altKey) {
			pressed.push('alt');
		};
		if (e.ctrlKey) {
			pressed.push('ctrl');
		};
		if (e.metaKey) {
			pressed.push('cmd');
		};

		for (let item of a) {
			const keys = item.split('+').sort();
			for (let k of keys) {
				if (which == KeyCode[k]) {
					pressed.push(k);
				} else
				if (k == key) {
					pressed.push(key);
				};
			};

			pressed = [ ...new Set(pressed) ];

			const check = pressed.sort().join('+');
			if (check == keys.join('+')) {
				res = check;
			};
		};

		if (res) {
			callBack(res);
		};
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