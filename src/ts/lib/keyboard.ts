import $ from 'jquery';
import { I, C, UtilCommon, Storage, focus, history as historyPopup, analytics, Renderer, sidebar, UtilObject, Preview, Action, translate } from 'Lib';
import { commonStore, authStore, blockStore, detailStore, menuStore, popupStore } from 'Store';
import Constant from 'json/constant.json';
import Url from 'json/url.json';
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
		const doc = $(document);

		win.on('keydown.common', e => this.onKeyDown(e));
		win.on('keyup.common', e => this.onKeyUp(e));
		win.on('mousedown.common', e => this.onMouseDown(e));
		win.on('scroll.common', () => this.onScroll());
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

			if (!commonStore.isSidebarFixed) {
				sidebar.hide();
			};

			menuStore.closeAll([ 'blockContext' ]);
		});

		doc.off('mouseleave.common').on('mouseleave.common', () => {
			if (!commonStore.isSidebarFixed) {
				sidebar.hide();
			};
		});

		Renderer.remove('commandGlobal');
		Renderer.on('commandGlobal', (e: any, cmd: string, arg: any) => this.onCommand(cmd, arg));
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
		const target = $(e.target);

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
		if (target.parents(`#block-${focused}`).length <= 0) {
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
		const isMac = UtilCommon.isPlatformMac();
		const key = e.key.toLowerCase();
		const cmd = this.cmdKey();
		const isMain = this.isMain();

		this.pressed.push(key);

		this.shortcut(`${cmd}+\\, ${cmd}+.`, e, () => {
			e.preventDefault();
			sidebar.toggleOpenClose();
		});

		// Navigation
		if (!this.isNavigationDisabled) {
			keyboard.shortcut(isMac ? 'cmd+[' : 'alt+arrowleft', e, () => this.onBack());
			keyboard.shortcut(isMac ? 'cmd+]' : 'alt+arrowright', e, () => this.onForward());

			if (!UtilCommon.getSelectionRange() && isMac) {
				keyboard.shortcut(`${cmd}+arrowleft`, e, () => this.onBack());
				keyboard.shortcut(`${cmd}+arrowright`, e, () => this.onForward());
			};
		};

		// Close popups and menus
		this.shortcut('escape', e, () => {
			e.preventDefault();
			if (menuStore.isOpen()) {
				menuStore.closeLast();
			} else 
			if (popupStore.isOpen()) {
				let canClose = true;

				if (UtilCommon.getSelectionRange()) {
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

		if (isMain) {

			// Shortcuts
			this.shortcut('ctrl+space', e, () => {
				popupStore.open('shortcut', { preventResize: true });
			});

			// Lock/Unlock
			keyboard.shortcut(`ctrl+shift+l`, e, () => {
				keyboard.onToggleLock();
			});

			// Print
			keyboard.shortcut(`${cmd}+p`, e, () => {
				e.preventDefault();
				this.onPrint('Shortcut');
			});

			// Navigation search
			this.shortcut(`${cmd}+s, ${cmd}+k`, e, (pressed: string) => {
				if (popupStore.isOpen('search') || !this.isPinChecked || ((pressed == `${cmd}+k`) && this.checkSelection())) {
					return;
				};

				this.onSearchPopup();
			});

			this.shortcut(`${cmd}+l`, e, () => {
				if (popupStore.isOpen('search') || !this.isPinChecked || this.checkSelection()) {
					return;
				};

				UtilObject.openAuto({ layout: I.ObjectLayout.Store });
			});

			// Text search
			this.shortcut(`${cmd}+f`, e, () => {
				if (!this.isFocused) {
					this.onSearchMenu('', 'Shortcut');
				};
			});

			// Navigation links
			this.shortcut(`${cmd}+o`, e, () => {
				e.preventDefault();
				UtilObject.openAuto({ id: this.getRootId(), layout: I.ObjectLayout.Navigation });
			});

			// Graph
			this.shortcut(`${cmd}+alt+o`, e, () => {
				e.preventDefault();
				UtilObject.openAuto({ id: this.getRootId(), layout: I.ObjectLayout.Graph });
			});

			// Go to dashboard
			this.shortcut('alt+h', e, () => {
				if (authStore.account && !popupStore.isOpen('search')) {
					UtilObject.openHome('route');
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

			// Create relation
			this.shortcut(`${cmd}+shift+r`, e, () => {
				$('#button-header-relation').trigger('click');
				window.setTimeout(() => { $('#menuBlockRelationView #item-add').trigger('click'); }, Constant.delay.menu * 2);
			});

			// Store
			this.shortcut(`${cmd}+alt+l`, e, () => {
				UtilObject.openRoute({ layout: I.ObjectLayout.Store });
			});

			// Object id
			this.shortcut(`${cmd}+shift+\\`, e, () => {
				popupStore.open('confirm', {
					className: 'isWide isLeft',
					data: {
						text: `ID: ${this.getRootId()}`,
						textConfirm: translate('commonCopy'),
						textCancel: translate('commonClose'),
						canConfirm: true,
						canCancel: true,
						onConfirm: () => UtilCommon.copyToast('ID', this.getRootId()),
					}
				});
			});
		};

		this.initPinCheck();
	};

	// Check if smth is selected
	checkSelection () {
		const range = UtilCommon.getSelectionRange();

		if ((range && !range.collapsed) || (this.selection && this.selection.get(I.SelectType.Block).length)) {
			return true;
		};

		return false;
	};

	pageCreate () {
		const isMain = this.isMain();

		if (!isMain) {
			return;
		};

		let targetId = '';
		let position = I.BlockPosition.Bottom;
		let rootId = '';
		let details: any = {};
		let flags: I.ObjectFlag[] = [ I.ObjectFlag.SelectType ];
		
		if (!rootId) {
			flags = flags.concat([ I.ObjectFlag.DeleteEmpty ]);
		};
		
		UtilObject.create(rootId, targetId, details, position, '', {}, flags, (message: any) => {
			UtilObject.openPopup({ id: message.targetId });

			analytics.event('CreateObject', {
				route: 'Navigation',
				objectType: commonStore.type,
			});
		});
	};

	isPopup () {
		return popupStore.isOpen('page');
	};

	getRootId (): string {
		const isPopup = this.isPopup();
		const popupMatch = this.getPopupMatch();
		return isPopup ? popupMatch.params.id : (this.match?.params?.id);
	};

	onKeyUp (e: any) {
		this.pressed = this.pressed.filter(it => it != this.eventKey(e));
	};

	onBack () {
		const { account } = authStore;
		const isPopup = this.isPopup();

		if (authStore.accountIsDeleted() || authStore.accountIsPending() || !this.checkBack()) {
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
			const history = UtilCommon.history;

			let prev = history.entries[history.index - 1];

			if (account && !prev) {
				UtilObject.openHome('route');
				return;
			};

			if (prev) {
				const route = UtilCommon.getRoute(prev.pathname);

				if ((route.page == 'main') && (route.action == 'history')) {
					prev = history.entries[history.index - 3];
					if (prev) {
						UtilCommon.route(prev.pathname, {});
					};
					return;
				};

				history.goBack();
			};
		};

		menuStore.closeAll();
		this.restoreSource();
		analytics.event('HistoryBack');
	};

	onForward () {
		const isPopup = this.isPopup();

		if (!this.checkForward()) {
			return;
		};

		if (isPopup) {
			historyPopup.goForward((match: any) => { 
				popupStore.updateData('page', { matchPopup: match }); 
			});
		} else {
			UtilCommon.history.goForward();
		};

		menuStore.closeAll();
		analytics.event('HistoryForward');
	};

	checkBack (): boolean {
		const { account } = authStore;
		const isPopup = this.isPopup();
		const history = UtilCommon.history;

		if (!history) {
			return;
		};

		if (!isPopup) {
			let prev = history.entries[history.index - 1];

			if (account && !prev) {
				return false;
			};

			if (prev) {
				const route = UtilCommon.getRoute(prev.pathname);

				if ([ 'index', 'auth' ].includes(route.page) && account) {
					return false;
				};

				if ((route.page == 'main') && !account) {
					return false;
				};

				if ((route.page == 'main') && (route.action == 'usecase')) {
					return false;
				};
			};
		};

		return true;
	};

	checkForward (): boolean {
		const isPopup = this.isPopup();
		const history = UtilCommon.history;

		if (!history) {
			return;
		};

		let ret = true;
		if (isPopup) {
			ret = historyPopup.checkForward();
		} else {
			ret = history.index + 1 <= history.entries.length - 1;
		};
		return ret;
	};

	onCommand (cmd: string, arg: any) {
		if (!this.isMain() && [ 'search', 'print' ].includes(cmd)) {
			return;
		};

		const rootId = keyboard.getRootId();
		const logPath = window.Electron.logPath;
		const tmpPath = window.Electron.tmpPath;

		switch (cmd) {
			case 'search': {
				this.onSearchMenu('', 'MenuSystem');
				break;
			};

			case 'print': {
				this.onPrint('MenuSystem');
				break;
			};

			case 'tech': {
				this.onTechInfo();
				break;
			};

			case 'terms':
			case 'tutorial':
			case 'privacy':
			case 'community': {
				Renderer.send('urlOpen', Url[cmd]);
				break;
			};

			case 'contact': {
				this.onContactUrl();
				break;
			};

			case 'undo': {
				if (!this.isFocused) {
					this.onUndo(rootId, 'MenuSystem');
				};
				break;
			};

			case 'redo': {
				if (!this.isFocused) {
					this.onRedo(rootId, 'MenuSystem');
				};
				break;
			};

			case 'create': {
				this.pageCreate();
				break;
			};

			case 'saveAsHTML': {
				this.onSaveAsHTML();
				break;
			};

			case 'saveAsHTMLSuccess': {
				this.printRemove();
				break;
			};

			case 'save': {
				Action.export([ rootId ], I.ExportType.Protobuf, true, true, true, true);
				break;
			};

			case 'exportTemplates': {
				Action.openDir({ buttonLabel: translate('commonExport') }, paths => {
					C.TemplateExportAll(paths[0], (message: any) => {
						if (message.error.code) {
							return;
						};

						Renderer.send('pathOpen', paths[0]);
					});
				});
				break;
			};

			case 'exportLocalstore': {
				Action.openDir({ buttonLabel: translate('commonExport') }, paths => {
					C.DebugExportLocalstore(paths[0], [], (message: any) => {
						if (!message.error.code) {
							Renderer.send('pathOpen', paths[0]);
						};
					});
				});
				break;
			};

			case 'debugSpace': {
				C.DebugSpaceSummary((message: any) => {
					if (!message.error.code) {
						window.Electron.fileWrite('debug-space-summary.json', JSON.stringify(message, null, 5), 'utf8');

						Renderer.send('pathOpen', tmpPath);
					};
				});
				break;
			};

			case 'debugTree': {
				C.DebugTree(rootId, logPath, (message: any) => {
					if (!message.error.code) {
						Renderer.send('pathOpen', logPath);
					};
				});
				break;
			};

			case 'resetOnboarding': {
				Storage.delete('onboarding');
				break;
			};

		};
	};

	onContactUrl () {
		const { account } = authStore;
		if (!account) {
			return;
		};

		C.AppGetVersion((message: any) => {
			let url = Url.contact;

			url = url.replace(/\%25device\%25/g, window.Electron.version.device);
			url = url.replace(/\%25os\%25/g, window.Electron.version.os);
			url = url.replace(/\%25version\%25/g, window.Electron.version.app);
			url = url.replace(/\%25build\%25/g, message.details);
			url = url.replace(/\%25middleware\%25/g, message.version);
			url = url.replace(/\%25accountId\%25/g, account.id);
			url = url.replace(/\%25analyticsId\%25/g, account.info.analyticsId);
			url = url.replace(/\%25deviceId\%25/g, account.info.deviceId);

			Renderer.send('urlOpen', url);
		});
	};

	onTechInfo () {
		const { account } = authStore;
		if (!account) {
			return;
		};

		C.AppGetVersion((message: any) => {
			const data = [
				[ translate('libKeyboardDevice'), window.Electron.version.device ],
				[ translate('libKeyboardOSVersion'), window.Electron.version.os ],
				[ translate('libKeyboardAppVersion'), window.Electron.version.app ],
				[ translate('libKeyboardBuildNumber'), message.details ],
				[ translate('libKeyboardLibraryVersion'), message.version ],
				[ translate('libKeyboardAccountID'), account.id ],
				[ translate('libKeyboardAnalyticsID'), account.info.analyticsId ],
				[ translate('libKeyboardDeviceID'), account.info.deviceId ],
			];

			popupStore.open('confirm', {
				className: 'isWide isLeft',
				data: {
					text: data.map(it => `<b>${it[0]}</b>: ${it[1]}`).join('<br/>'),
					textConfirm: translate('commonCopy'),
					textCancel: translate('commonClose'),
					canConfirm: true,
					canCancel: true,
					onConfirm: () => {
						UtilCommon.copyToast(translate('libKeyboardTechInformation'), data.map(it => `${it[0]}: ${it[1]}`).join('\n'));
					},
				}
			});
		});
	};

	onUndo (rootId: string, route?: string, callBack?: (message: any) => void) {
		C.ObjectUndo(rootId, callBack);

		analytics.event('Undo', { route });
	};

	onRedo (rootId: string, route?: string, callBack?: (message: any) => void) {
		C.ObjectRedo(rootId, callBack);

		analytics.event('Redo', { route });
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
			UtilCommon.addBodyClass('theme', '');
		};
		focus.clearRange(true);
	};

	printRemove () {
		$('html').removeClass('withPopup printMedia print save');
		commonStore.setThemeClass();
		$(window).trigger('resize');
	};

	onPrint (route?: string) {
		this.printApply('print', true);

		window.print();

		this.printRemove();
		analytics.event('Print', { route });
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

	onSearchMenu (value: string, route?: string) {
		const isPopup = this.isPopup();
		const popupMatch = this.getPopupMatch();

		let isDisabled = false;
		if (!isPopup) {
			isDisabled = this.isMainSet() || this.isMainStore() || this.isMainGraph();
		} else {
			isDisabled = [ 'set', 'store', 'graph' ].includes(popupMatch.params.action);
		};

		if (isDisabled) {
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
					route,
				},
			});
		}, Constant.delay.menu);
	};

	onSearchPopup () {
		popupStore.open('search', {
			data: { isPopup: this.isPopup() },
		});
	};

	onLock (rootId: string, v: boolean, route?: string) {
		const block = blockStore.getLeaf(rootId, rootId);
		if (!block) {
			return;
		};

		C.BlockListSetFields(rootId, [
			{ blockId: rootId, fields: { ...block.fields, isLocked: v } },
		]);

		Preview.toastShow({ objectId: rootId, action: I.ToastAction.Lock, value: v });
		analytics.event((v ? 'LockPage' : 'UnlockPage'), { route });
	};

	onToggleLock () {
		const rootId = this.getRootId();
		const root = blockStore.getLeaf(rootId, rootId);
		
		if (root) {
			this.onLock(rootId, !root.isLocked(), 'Shortcut');
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
		return UtilCommon.isPlatformMac() ? e.metaKey : e.ctrlKey;
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

	isMainGraph () {
		return this.isMain() && (this.match?.params?.action == 'graph');
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
		this.source = UtilCommon.objectCopy(source);
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
			UtilCommon.route('/auth/pin-check', { replace: true, animate: true });
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

		const a = s.split(',').map(it => it.trim());
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
		return UtilCommon.isPlatformMac() ? '&#8984;' : 'Ctrl';
	};

	altSymbol () {
		return UtilCommon.isPlatformMac() ? '&#8997;' : 'Alt';
	};

	cmdKey () {
		return UtilCommon.isPlatformMac() ? 'cmd' : 'ctrl';
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
