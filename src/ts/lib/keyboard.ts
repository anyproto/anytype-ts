import $ from 'jquery';
import { I, C, Util, Storage, focus, history as historyPopup, analytics, Renderer, sidebar, ObjectUtil, Preview } from 'Lib';
import { commonStore, authStore, blockStore, detailStore, menuStore, popupStore } from 'Store';
import Constant from 'json/constant.json';
import KeyCode from 'json/key.json';

class Keyboard {
	
	mouse: any = { 
		page: { x: 0, y: 0 },
		client: { x: 0, y: 0 },
	};
	timeoutPin = 0;
	timeoutSidebarHide = 0;
	timeoutSidebarAnim = 0;
	pressed: string[] = [];
	match: any = {};
	matchPopup: any = {};
	source: any = null;
	selection: any = null;
	
	isDragging = false;
	isResizing = false;
	isFocused = false;
	isPreviewDisabled = false;
	isMouseDisabled = false;
	isNavigationDisabled = false;
	isPinChecked = false;
	isBlurDisabled = false;
	isCloseDisabled = false;
	isContextCloseDisabled = false;
	isContextOpenDisabled = false;
	isPasteDisabled = false;
	isSelectionDisabled = false;
	isSelectionClearDisabled = false;
	
	init () {
		this.unbind();
		
		const win = $(window);
		win.on('keydown.common', (e: any) => { this.onKeyDown(e); });
		win.on('keyup.common', (e: any) => { this.onKeyUp(e); });
		win.on('mousedown.common', (e: any) => { this.onMouseDown(e); });
		win.on('scroll.common', () => { this.onScroll(); });
		win.off('mousemove.common beforeunload.common blur.common');
		
		win.on('mousemove.common', (e: any) => {
			this.initPinCheck();
			this.disableMouse(false);
			this.onMouseMove(e);
		});
		
		win.on('blur.common', () => {
			Preview.tooltipHide(true);
			Preview.previewHide(true);

			this.pressed = [];
		});

		Renderer.remove('commandGlobal');
		Renderer.on('commandGlobal', (e: any, cmd: string, arg: any) => { this.onCommand(cmd, arg); });
	};
	
	unbind () {
		$(window).off('keyup.common keydown.common mousedown.common scroll.common mousemove.common blur.common');
	};

	onScroll () {
		Preview.tooltipHide(false);

		$(window).trigger('resize.menuOnboarding');
	};

	onMouseDown (e: any) {
		const { focused } = focus.state;

		// Mouse back
		if ((e.buttons & 8) && !this.isNavigationDisabled) {
			e.preventDefault();
			this.onBack();
		};

		// Mouse forward
		if ((e.buttons & 16) && !this.isNavigationDisabled) {
			e.preventDefault();
			this.onForward();
		};

		// Remove isFocusable from focused block
		if ($(e.target).parents(`#block-${focused}`).length <= 0) {
			$('.focusable.c' + focused).removeClass('isFocused');
		};
	};

	onMouseMove (e: any) {
		this.mouse = {
			page: { x: e.pageX, y: e.pageY },
			client: { x: e.clientX, y: e.clientY },
		};

		sidebar.onMouseMove();
	};
	
	onKeyDown (e: any) {
		const platform = Util.getPlatform();
		const isMac = platform == I.Platform.Mac;
		const key = e.key.toLowerCase();
		const cmd = this.cmdKey();
		const isMain = this.isMain();

		this.pressed.push(key);

		this.shortcut(`${cmd}+\\`, e, () => {
			e.preventDefault();
			sidebar.toggle();
		});

		// Navigation
		if (!this.isNavigationDisabled) {
			keyboard.shortcut(isMac ? 'cmd+[' : 'alt+arrowleft', e, () => { this.onBack(); });
			keyboard.shortcut(isMac ? 'cmd+]' : 'alt+arrowright', e, () => { this.onForward(); });
		};

		// Close popups and menus
		this.shortcut('escape', e, () => {
			e.preventDefault();
			if (menuStore.isOpen()) {
				menuStore.closeLast();
			} else 
			if (popupStore.isOpen()) {
				let canClose = true;

				if (Util.selectionRange()) {
					$(document.activeElement).blur();
					window.getSelection().removeAllRanges();
					canClose = false;
				} else
				if (this.selection) {
					const ids = this.selection.get(I.SelectType.Block);
					if (ids.length) {
						canClose = false;
					};
				};

				if (canClose) {
					popupStore.closeLast();
				};
			};
			
			Preview.previewHide(false);
		});

		// Shortcuts
		this.shortcut('ctrl+space', e, () => {
			popupStore.open('shortcut', {});
		});

		// Lock/Unlock
		keyboard.shortcut(`ctrl+shift+l`, e, () => {
			keyboard.onToggleLock();
		});

		if (isMain) {
			// Print
			keyboard.shortcut(`${cmd}+p`, e, () => {
				e.preventDefault();
				this.onPrint();
			});

			// Navigation search
			this.shortcut(`${cmd}+s, ${cmd}+k`, e, (pressed: string) => {
				if (popupStore.isOpen('search') || !this.isPinChecked) {
					return;
				};

				// Check if smth is selected to prevent search from opening
				if ((pressed == `${cmd}+k`) && (Util.selectionRange() || (this.selection && this.selection.get(I.SelectType.Block).length))) {
					return;
				};

				this.onSearchPopup();
			});

			// Text search
			this.shortcut(`${cmd}+f`, e, () => {
				if (!this.isFocused) {
					this.onSearchMenu('');
				};
			});

			// Navigation links
			this.shortcut(`${cmd}+o`, e, () => {
				e.preventDefault();
				ObjectUtil.openAuto({ id: this.getRootId(), layout: I.ObjectLayout.Navigation });
			});

			// Graph
			this.shortcut(`${cmd}+alt+o`, e, () => {
				e.preventDefault();
				ObjectUtil.openAuto({ id: this.getRootId(), layout: I.ObjectLayout.Graph });
			});

			// Go to dashboard
			this.shortcut('alt+h', e, () => {
				if (authStore.account && !popupStore.isOpen('search')) {
					ObjectUtil.openHome('route');
				};
			});

			// Create new page
			this.shortcut(`${cmd}+n`, e, () => {
				e.preventDefault();
				this.pageCreate();
			});

			// Settings
			this.shortcut(`${cmd}+comma`, e, () => {
				if (!popupStore.isOpen('settings')) {
					popupStore.open('settings', {});
				};
			});

			// Store
			this.shortcut(`${cmd}+alt+l`, e, () => {
				ObjectUtil.openRoute({ layout: I.ObjectLayout.Store });
			});
		};

		this.initPinCheck();
	};

	pageCreate () {
		const { focused } = focus.state;
		const isMain = this.isMain();

		if (!isMain) {
			return;
		};

		let targetId = '';
		let position = I.BlockPosition.Bottom;
		let rootId = '';
		let root: any = null;
		let details: any = {};
		let flags: I.ObjectFlag[] = [ I.ObjectFlag.SelectType ];
		
		if (this.isMainEditor()) {
			rootId = this.getRootId();
			root = blockStore.getLeaf(rootId, rootId);

			if (!root || root.isLocked()) {
				return;
			};

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

		if (!targetId) {
			flags = flags.concat([ I.ObjectFlag.DeleteEmpty ]);
		};
		
		ObjectUtil.create(rootId, targetId, details, position, '', {}, flags, (message: any) => {
			ObjectUtil.openPopup({ id: message.targetId });
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
		this.pressed = this.pressed.filter(it => it != this.eventKey(e));
	};

	onBack () {
		const { account } = authStore;
		const isPopup = this.isPopup();

		if (authStore.accountIsDeleted() || authStore.accountIsPending()) {
			return;
		};

		if (isPopup) {
			if (!historyPopup.checkBack()) {
				popupStore.close('page');
			} else {
				historyPopup.goBack((match: any) => { 
					popupStore.updateData('page', { matchPopup: match }); 
				});
			};
		} else {
			let prev = Util.history.entries[Util.history.index - 1];

			if (account && !prev) {
				ObjectUtil.openHome('route');
				return;
			};

			if (prev) {
				const route = Util.getRoute(prev.pathname);

				if ([ 'index', 'auth' ].includes(route.page) && account) {
					return;
				};

				if ((route.page == 'main') && !account) {
					return;
				};

				if ((route.page == 'main') && (route.action == 'history')) {
					prev = Util.history.entries[Util.history.index - 3];
					if (prev) {
						Util.route(prev.pathname);
					};
					return;
				};

				Util.history.goBack();
			};
		};

		menuStore.closeAll();
		this.restoreSource();
		analytics.event('HistoryBack');
	};

	onForward () {
		const isPopup = this.isPopup();

		if (isPopup) {
			historyPopup.goForward((match: any) => { 
				popupStore.updateData('page', { matchPopup: match }); 
			});
		} else {
			Util.history.goForward();
		};

		menuStore.closeAll();
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
		if (!this.isMain() && [ 'search', 'graph', 'print', 'workspace' ].includes(cmd)) {
			return;
		};

		switch (cmd) {
			case 'search': {
				this.onSearchMenu('');
				break;
			};

			case 'graph': {
				ObjectUtil.openPopup({ id: this.getRootId(), layout: I.ObjectLayout.Graph });
				break;
			};

			case 'print': {
				this.onPrint();
				break;
			};

			case 'id': {
				const { account } = authStore;
				if (!account) {
					break;
				};

				popupStore.open('confirm', {
					data: {
						title: 'Anytype ID',
						text: account.id,
						textConfirm: 'Copy',
						textCancel: 'Close',
						canConfirm: true,
						canCancel: true,
						onConfirm: () => {
							Util.clipboardCopy({ text: account.id });
							Preview.toastShow({ text: 'Anytype ID copied to clipboard' });
						},
					}
				});
				break;
			};

			case 'workspace': {
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
	};

	onUndo (rootId: string, callBack?: (message: any) => void) {
		C.ObjectUndo(rootId, callBack);

		analytics.event('Undo', { route: 'editor' });
	};

	onRedo (rootId: string, callBack?: (message: any) => void) {
		C.ObjectRedo(rootId, callBack);

		analytics.event('Redo', { route: 'editor' });
	};

	printApply (className: string, clearTheme: boolean) {
		const isPopup = this.isPopup();
		const html = $('html');

		html.addClass('printMedia');
		
		if (isPopup) {
			html.addClass('withPopup');
		};

		if (className) {
			html.addClass(className);
		};

		if (clearTheme) {
			Util.addBodyClass('theme', '');
		};
		focus.clearRange(true);
	};

	printRemove () {
		$('html').removeClass('withPopup printMedia print save');
		commonStore.setThemeClass();
		$(window).trigger('resize');
	};

	onPrint () {
		this.printApply('print', true);

		window.print();

		this.printRemove();
		analytics.event('Print');
	};

	onSaveAsHTML () {
		const rootId = this.getRootId();
		const object = detailStore.get(rootId, rootId);

		this.printApply('save', false);
		Renderer.send('winCommand', 'printHtml', { name: object.name });
	};

	onPrintToPDF (options: any) {
		const rootId = this.getRootId();
		const object = detailStore.get(rootId, rootId);

		this.printApply('print', true);
		Renderer.send('winCommand', 'printPdf', { name: object.name, options });
	};

	onSearchMenu (value: string) {
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
				offsetX: 10,
				classNameWrap: 'fromHeader',
				data: {
					isPopup,
					value,
				},
			});
		}, Constant.delay.menu);
	};

	onSearchPopup () {
		popupStore.open('search', {
			preventResize: true, 
			data: { isPopup: this.isPopup() },
		});
	};

	onLock (rootId: string, v: boolean) {
		const block = blockStore.getLeaf(rootId, rootId);
		if (!block) {
			return;
		};

		C.BlockListSetFields(rootId, [
			{ blockId: rootId, fields: { ...block.fields, isLocked: v } },
		]);

		Preview.toastShow({ objectId: rootId, action: I.ToastAction.Lock, value: v });
		analytics.event((v ? 'LockPage' : 'UnlockPage'));
	};

	onToggleLock () {
		const rootId = this.getRootId();
		const root = blockStore.getLeaf(rootId, rootId);
		
		if (root) {
			this.onLock(rootId, !root.isLocked());
		};
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
	
	setDragging (v: boolean) {
		this.isDragging = v;
	};

	setPinChecked (v: boolean) {
		if (this.isPinChecked === v) {
			return;
		};

		this.isPinChecked = v;
		Renderer.send('setPinChecked', v);
	};

	setMatch (match: any) {
		this.match = match;
	};

	setSource (source: any) {
		this.source = Util.objectCopy(source);
	};

	setSelection (v: any) {
		this.selection = v;
	};

	setSelectionClearDisabled (v: boolean) {
		this.isSelectionClearDisabled = v;
	};

	initPinCheck () {
		const { account } = authStore;
		const { pinTime } = commonStore;
		const pin = Storage.get('pin');

		if (!pin) {
			this.setPinChecked(true);
			return;
		};

		const check = () => {
			const pin = Storage.get('pin');
			if (!pin) {
				this.setPinChecked(true);
				return false;
			};
			return true;
		};

		if (!account || !check()) {
			return;
		};

		window.clearTimeout(this.timeoutPin);
		this.timeoutPin = window.setTimeout(() => {
			if (!check()) {
				return;
			};

			this.setPinChecked(false);
			Util.route('/auth/pin-check');
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

	disableNavigation (v: boolean) {
		this.isNavigationDisabled = v;
	};

	// Flag to prevent blur events
	disableBlur (v: boolean) {
		this.isBlurDisabled = v;
	};

	// Flag to prevent menuBlockContext from closing
	disableContextClose (v: boolean) {
		this.isContextCloseDisabled = v;
	};

	// Flag to prevent menuBlockContext from opening
	disableContextOpen (v: boolean) {
		this.isContextOpenDisabled = v;
	};
	
	disablePreview (v: boolean) {
		this.isPreviewDisabled = v;
	};

	// Flag to prevent document from sending close, to prevent deletion of drafts
	disableClose (v: boolean) {
		this.isCloseDisabled = v;
	};

	// Flag to prevent common paste handling in editor
	disablePaste (v: boolean) {
		this.isPasteDisabled = v;
	};

	disableSelection (v: boolean) {
		this.isSelectionDisabled = v;
	};
	
	isSpecial (e: any): boolean {
		return [ 
			Key.escape, Key.backspace, Key.tab, Key.enter, Key.shift, Key.ctrl, 
			Key.alt, Key.meta, Key.up, Key.down, Key.left, Key.right,
		].includes(this.eventKey(e));
	};

	withCommand (e: any): boolean {
		return e.shiftKey || e.ctrlKey || e.metaKey || e.altKey;
	};

	eventKey (e: any) {
		return e && e.key ? e.key.toLowerCase() : '';
	};

	shortcut (s: string, e: any, callBack: (pressed: string) => void) {
		if (!e || !e.key) {
			return;
		};

		const a = s.split(',').map((it: string) => { return it.trim(); });
		const key = this.eventKey(e);
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

		for (const item of a) {
			const keys = item.split('+').sort();
			
			for (const k of keys) {
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

	cmdSymbol () {
		return Util.getPlatform() == I.Platform.Mac ? '&#8984;' : 'Ctrl';
	};

	cmdKey () {
		return Util.getPlatform() == I.Platform.Mac ? 'cmd' : 'ctrl';
	};

	checkPressed (key: string) {
		return this.pressed.includes(key);
	};

	isShift () {
		return this.checkPressed(Key.shift);
	};

	isAlt () {
		return this.checkPressed(Key.alt);
	};

	isCtrl () {
		return this.checkPressed(Key.ctrl);
	};

	isMeta () {
		return this.checkPressed(Key.meta);
	};

	isCtrlOrMeta () {
		return this.isCtrl() || this.isMeta();
	};

};

export enum Key {
	backspace	 = 'backspace',
	tab			 = 'tab',
	enter		 = 'enter',
	shift		 = 'shift',
	alt			 = 'alt',
	ctrl		 = 'control',
	meta		 = 'meta',
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

 export const keyboard: Keyboard = new Keyboard();