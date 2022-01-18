import { I, C, Util, DataUtil, crumbs, Storage, focus, history as historyPopup, analytics, Docs } from 'ts/lib';
import { commonStore, authStore, blockStore, menuStore, popupStore } from 'ts/store';

const { ipcRenderer } = window.require('electron');

const $ = require('jquery');
const KeyCode = require('json/key.json');
const Constant = require('json/constant.json');

class Keyboard {
	
	mouse: any = { 
		page: { x: 0, y: 0 },
		client: { x: 0, y: 0 },
	};
	timeoutPin: number = 0;
	pressed: string[] = [];
	match: any = {};
	matchPopup: any = {};
	source: any = null;
	
	isDragging: boolean = false;
	isResizing: boolean = false;
	isFocused: boolean = false;
	isPreviewDisabled: boolean = false;
	isMouseDisabled: boolean = false;
	isPinChecked: boolean = false;
	isContextDisabled: boolean = false;
	isBlurDisabled: boolean = false;
	isCloseDisabled: boolean = false;
	
	init () {
		this.unbind();
		
		const win = $(window); 
		win.on('keydown.common', (e: any) => { this.onKeyDown(e); });
		win.on('keyup.common', (e: any) => { this.onKeyUp(e); });
		win.on('mousedown.common', (e: any) => { this.onMouseDown(e); });
		win.on('scroll.common', (e: any) => { this.onScroll(e); });

		ipcRenderer.removeAllListeners('commandGlobal');
		ipcRenderer.on('commandGlobal', (e: any, cmd: string, arg: any) => { this.onCommand(cmd, arg); });
	};
	
	unbind () {
		$(window).unbind('keyup.common keydown.common mousedown.common scroll.common');
	};

	onScroll (e: any) {
		Util.tooltipHide(false);

		$(window).trigger('resize.menuOnboarding');
	};

	onMouseDown (e: any) {
		const { focused } = focus.state;

		// Mouse back
		if (e.buttons & 8) {
			e.preventDefault();
			this.back();
		};

		// Mouse forward
		if (e.buttons & 16) {
			e.preventDefault();
			this.forward();
		};

		// Remove isFocusable from focused block
		if ($(e.target).parents(`#block-${focused}`).length <= 0) {
			$('.focusable.c' + focused).removeClass('isFocused');
		};
	};
	
	onKeyDown (e: any) {
		const rootId = this.getRootId();
		const platform = Util.getPlatform();
		const key = e.key.toLowerCase();
		const cmd = this.ctrlKey();
		const isMain = this.isMain();

		this.pressed.push(key);

		// Go back
		this.shortcut('backspace', e, (pressed: string) => {
			if (!isMain || (isMain && !this.isMainIndex()) || this.isFocused) {
				return;
			};
			this.back();
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
			if (menuStore.isOpen()) {
				menuStore.closeLast();
			} else {
				popupStore.closeLast();
			};
			Util.previewHide(false);
		});

		// Shortcuts
		this.shortcut('ctrl+space', e, (pressed: string) => {
			popupStore.open('shortcut', {});
		});

		if (isMain) {
			// Print
			keyboard.shortcut(`${cmd}+p`, e, (pressed: string) => {
				e.preventDefault();
				this.onPrint();
			});

			// Navigation search
			this.shortcut(`${cmd}+s`, e, (pressed: string) => {
				if (popupStore.isOpen('search') || !this.isPinChecked) {
					return;
				};
				popupStore.open('search', { 
					preventResize: true,
					data: { 
						rootId,
					}, 
				});
			});

			// Text search
			this.shortcut(`${cmd}+f`, e, (pressed: string) => {
				this.onSearch();
			});

			// Navigation links
			this.shortcut(`${cmd}+o`, e, (pressed: string) => {
				DataUtil.objectOpenPopup({ id: this.getRootId(), layout: I.ObjectLayout.Navigation });
			});

			// Graph
			this.shortcut(`${cmd}+alt+o`, e, (pressed: string) => {
				DataUtil.objectOpenPopup({ id: this.getRootId(), layout: I.ObjectLayout.Graph });
			});

			// Go to dashboard
			this.shortcut('cmd+enter, alt+h', e, (pressed: string) => {
				let check = platform == I.Platform.Mac ? pressed == 'cmd+enter' : true;
				if (!check || !authStore.account) {
					return;
				};

				Util.route('/main/index');
			});

			// Create new page
			this.shortcut(`${cmd}+n`, e, (pressed: string) => {
				e.preventDefault();
				this.pageCreate();
			});
		};

		this.initPinCheck();
	};

	pageCreate () {
		const { focused } = focus.state;
		const isMainIndex = this.isMainIndex();
		const isMainEditor = this.isMainEditor();

		if (!isMainIndex && !isMainEditor) {
			return;
		};

		let targetId = '';
		let position = I.BlockPosition.Bottom;
		let rootId = '';
		let details: any = { isDraft: true };
		
		if (this.isMainEditor()) {
			rootId = this.getRootId();
			details = {};

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
		
		DataUtil.pageCreate(rootId, targetId, details, position, '', {}, (message: any) => {
			DataUtil.objectOpenPopup({ id: message.targetId });
		});
	};

	isPopup () {
		return popupStore.isOpen('page');
	};

	getRootId (): string {
		const isPopup = this.isPopup();
		const popupMatch = this.getPopupMatch();
		return isPopup ? popupMatch.params.id : (this.match?.params?.id || blockStore.root);
	};

	onKeyUp (e: any) {
		const key = e.key.toLowerCase();

		this.pressed = this.pressed.filter((it: string) => { return it != key; });
	};

	back () {
		const { account } = authStore;
		const isPopup = this.isPopup();

		crumbs.restore(I.CrumbsType.Page);
		
		if (isPopup) {
			if (!historyPopup.checkBack()) {
				popupStore.close('page');
			} else {
				historyPopup.goBack((match: any) => { 
					popupStore.updateData('page', { matchPopup: match }); 
				});
			};
		} else {
			const prev = Util.history.entries[Util.history.index - 1];
			if (prev) {
				let route = Util.getRoute(prev.pathname);
				if ([ 'index', 'auth' ].includes(route.page) && account) {
					return;
				};
				if ((route.page == 'main') && !account) {
					return;
				};
			};

			Util.history.goBack();
		};

		this.restoreSource();

		analytics.event('HistoryBack');
	};

	forward () {
		const isPopup = this.isPopup();

		crumbs.restore(I.CrumbsType.Page);

		if (isPopup) {
			historyPopup.goForward((match: any) => { 
				popupStore.updateData('page', { matchPopup: match }); 
			});
		} else {
			Util.history.goForward();
		};

		analytics.event('HistoryForward');
	};

	checkBack (): boolean {
		const isPopup = this.isPopup();
		const history = Util.history;

		let ret = true;
		if (!isPopup) {
			ret = history.index - 1 >= 0;
		};
		return ret;
	};

	checkForward (): boolean {
		const isPopup = this.isPopup();
		const history = Util.history;

		let ret = true;
		if (isPopup) {
			ret = historyPopup.checkForward();
		} else {
			ret = history.index + 1 <= history.entries.length - 1;
		};
		return ret;
	};

	onCommand (cmd: string, arg: any) {
		if (!this.isMain()) {
			return;
		};

		switch (cmd) {
			case 'search':
				this.onSearch();
				break;

			case 'graph':
				DataUtil.objectOpenPopup({ id: this.getRootId(), layout: I.ObjectLayout.Graph });
				break;

			case 'print':
				this.onPrint();
				break;

			case 'id':
				const { account } = authStore;
				if (!account) {
					break;
				};

				popupStore.open('confirm', {
					data: {
						title: 'Anytype ID',
						text: account.id,
						textConfirm: 'Ok',
						canConfirm: true,
						canCancel: false,
					}
				});
				break;

			case 'workspace':
				popupStore.open('prompt', {
					data: {
						title: 'Create Space',
						onChange: (v: string) => {
							C.WorkspaceCreate(v);
						},
					}
				});
				break;
		};
	};

	onUndo (rootId: string, callBack?: (message: any) => void) {
		C.BlockUndo(rootId, callBack);

		analytics.event('Undo');
	};

	onRedo (rootId: string, callBack?: (message: any) => void) {
		C.BlockRedo(rootId, callBack);

		analytics.event('Redo');
	};

	onPrint () {
		const { theme } = commonStore;
		const isPopup = this.isPopup();
		const html = $('html');

		if (isPopup) {
			html.addClass('withPopup');
		};

		Util.addBodyClass('theme', '');

		focus.clearRange(true);
		window.print();

		html.removeClass('withPopup');
		Util.addBodyClass('theme', theme);

		analytics.event('Print');
	};

	onSearch () {
		const isPopup = this.isPopup();
		const popupMatch = this.getPopupMatch();

		// Do not allow in set or store
		if (!isPopup && (this.isMainSet() || this.isMainStore()) || (isPopup && ([ 'set', 'store' ].indexOf(popupMatch.params.action) >= 0))) {
			return;
		};

		menuStore.closeAll([ 'blockContext' ]);
		window.setTimeout(() => {
			menuStore.open('searchText', {
				element: '#header',
				type: I.MenuType.Horizontal,
				horizontal: I.MenuDirection.Right,
				classNameWrap: 'fromHeader',
				data: {
					isPopup,
				},
			});
		}, Constant.delay.menu);
	};

	onLock (rootId: string, v: boolean) {
		const block = blockStore.getLeaf(rootId, rootId);
		if (!block) {
			return;
		};

		C.BlockListSetFields(rootId, [
			{ blockId: rootId, fields: { ...block.fields, isLocked: v } },
		], (message: any) => {
			analytics.event((v ? 'LockPage' : 'UnlockPage'));
		});
	};

	onToggleLock (rootId: string) {
		const block = blockStore.getLeaf(rootId, rootId);
		if (!block) {
			return;
		};

		this.onLock(rootId, !block.fields.isLocked);		
	};

	getPopupMatch () {
		const popup = popupStore.get('page');
		return popup && popup?.param.data.matchPopup || {};
	};

	getMatch () {
		return (this.isPopup() ? this.getPopupMatch() : this.match) || { params: {} };
	};

	ctrlByPlatform (e: any) {
		const platform = Util.getPlatform();
		if (platform == I.Platform.Mac) {
			return e.metaKey;
		} else {
			return e.ctrlKey;
		};
	};

	isMain () {
		return this.match?.params?.page == 'main';
	};
	
	isMainEditor () {
		return this.isMain() && (this.match?.params?.action == 'edit');
	};

	isMainSet () {
		return this.isMain() && (this.match?.params?.action == 'set');
	};

	isMainStore () {
		return this.isMain() && (this.match?.params?.action == 'store');
	};

	isMainIndex () {
		return this.isMain() && (this.match?.params?.action == 'index');
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

	setMatch (match: any) {
		this.match = match;
	};

	setSource (source: any) {
		this.source = Util.objectCopy(source);
	};

	initPinCheck () {
		const { account } = authStore;
		const { pinTime } = commonStore;
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
				
				popupStore.closeAll(null, () => {
					Util.route('/auth/pin-check');
				});
			};
		}, pinTime);
	};

	restoreSource () {
		if (!this.source) {
			return;
		};

		const { type, data } = this.source;

		switch (type) {
			case I.Source.Popup:
				window.setTimeout(() => {
					popupStore.open(data.id, data.param);
				}, Constant.delay.popup);
				break;
		};

		this.setSource(null);
	};
	
	disableMouse (v: boolean) {
		this.isMouseDisabled = v;
	};

	// Flag to prevent blur events
	disableBlur (v: boolean) {
		this.isBlurDisabled = v;
	};

	// Flag to prevent menuBlockContext from closing
	disableContext (v: boolean) {
		this.isContextDisabled = v;
	};
	
	disablePreview (v: boolean) {
		this.isPreviewDisabled = v;
	};

	// Flag to prevent document from sending close, to prevent deletion of drafts
	disableClose (v: boolean) {
		this.isCloseDisabled = v;
	};
	
	setCoords (e: any) {
		this.mouse = {
			page: { x: e.pageX, y: e.pageY },
			client: { x: e.clientX, y: e.clientY },
		};
	};
	
	isArrow (k: string): boolean {
		const keys: string[] = [ Key.up, Key.down, Key.left, Key.right ];
		return keys.indexOf(k) >= 0;
	};
	
	isSpecial (k: string): boolean {
		const keys: string[] = [ Key.escape, Key.backspace, Key.tab, Key.enter ];
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

	ctrlSymbol () {
		const platform = Util.getPlatform();
		return platform == I.Platform.Mac ? '&#8984;' : 'Ctrl';
	};

	ctrlKey () {
		const platform = Util.getPlatform();
		return platform == I.Platform.Mac ? 'cmd' : 'ctrl';
	};

};

export enum Key {
	backspace	 = 'backspace',
	tab			 = 'tab',
	enter		 = 'enter',
	shift		 = 'shift',
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