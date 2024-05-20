import $ from 'jquery';
import { I, C, UtilCommon, UtilData, Storage, focus, history as historyPopup, analytics, Renderer, sidebar, UtilObject, UtilRouter, Preview, Action, translate, UtilSpace } from 'Lib';
import { commonStore, authStore, blockStore, detailStore, menuStore, popupStore, dbStore } from 'Store';
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
	isComposition = false;
	
	init () {
		this.unbind();
		
		const win = $(window);
		const doc = $(document);

		commonStore.isOnlineSet(navigator.onLine);

		win.on('keydown.common', e => this.onKeyDown(e));
		win.on('keyup.common', e => this.onKeyUp(e));
		win.on('mousedown.common', e => this.onMouseDown(e));
		win.on('scroll.common', () => this.onScroll());
		win.on('mousemove.common', e => this.onMouseMove(e));

		win.on('online.common offline.common', () => {
			const { onLine } = navigator;

			commonStore.isOnlineSet(onLine);

			if (!commonStore.membershipTiers.length) {
				UtilData.getMembershipTiers(false);
			};
		});
		
		win.on('blur.common', () => {
			Preview.tooltipHide(true);
			Preview.previewHide(true);

			this.pressed = [];

			if (!commonStore.isSidebarFixed) {
				sidebar.hide();
			};

			menuStore.closeAll([ 'blockContext' ]);

			$('.dropTarget.isOver').removeClass('isOver');
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
		$(window).off('keyup.common keydown.common mousedown.common scroll.common mousemove.common blur.common online.common offline.common');
	};

	onScroll () {
		Preview.tooltipHide(false);

		$(window).trigger('resize.menuOnboarding resize.menuSpace');
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
		this.initPinCheck();
		this.disableMouse(false);

		this.mouse = {
			page: { x: e.pageX, y: e.pageY },
			client: { x: e.clientX, y: e.clientY },
		};

		if (this.isMain()) {
			sidebar.onMouseMove();
		};
	};
	
	onKeyDown (e: any) {
		const isMac = UtilCommon.isPlatformMac();
		const key = e.key.toLowerCase();
		const cmd = this.cmdKey();
		const isMain = this.isMain();
		const canWrite = UtilSpace.canMyParticipantWrite();

		this.pressed.push(key);

		this.shortcut(`${cmd}+\\, ${cmd}+.`, e, (pressed: string) => {
			e.preventDefault();

			if (pressed.match('.') && this.isFocused) {
				return;
			};

			commonStore.isSidebarFixed ? sidebar.toggleOpenClose() : sidebar.toggleExpandCollapse();
		});

		// Navigation
		if (!this.isNavigationDisabled) {
			this.shortcut(isMac ? 'cmd+[' : 'alt+arrowleft', e, () => this.onBack());
			this.shortcut(isMac ? 'cmd+]' : 'alt+arrowright', e, () => this.onForward());

			if (!UtilCommon.getSelectionRange() && isMac) {
				this.shortcut(`${cmd}+arrowleft`, e, () => this.onBack());
				this.shortcut(`${cmd}+arrowright`, e, () => this.onForward());
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

				if (this.isPopup()) {
					if (UtilCommon.getSelectionRange()) {
						UtilCommon.clearSelection();
						canClose = false;
					} else
					if (this.selection) {
						const ids = this.selection.get(I.SelectType.Block);
						if (ids.length) {
							canClose = false;
						};
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

			// Spaces
			this.shortcut('ctrl+tab', e, () => {
				this.onSpaceMenu(true);
			});

			// Print
			this.shortcut(`${cmd}+p`, e, () => {
				e.preventDefault();
				this.onPrint(analytics.route.shortcut);
			});

			// Navigation search
			this.shortcut(`${cmd}+s, ${cmd}+k`, e, (pressed: string) => {
				if (popupStore.isOpen('search') || !this.isPinChecked || ((pressed == `${cmd}+k`) && this.checkSelection())) {
					return;
				};

				this.onSearchPopup(analytics.route.shortcut);
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
					this.onSearchMenu('', analytics.route.shortcut);
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
					UtilSpace.openDashboard('route');
				};
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

			if (canWrite) {
				// Create new page
				this.shortcut(`${cmd}+n`, e, () => {
					e.preventDefault();
					this.pageCreate({}, analytics.route.shortcut);
				});

				// Quick capture menu
				this.shortcut(`${cmd}+alt+n`, e, () => {
					e.preventDefault();
					this.onQuickCapture(true);
				});

				// Lock/Unlock
				this.shortcut(`ctrl+shift+l`, e, () => {
					this.onToggleLock();
				});
			};
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

	pageCreate (details: any, route: string) {
		if (this.isMain()) {
			const flags = [ I.ObjectFlag.SelectTemplate, I.ObjectFlag.DeleteEmpty ];
			UtilObject.create('', '', details, I.BlockPosition.Bottom, '', flags, route, message => UtilObject.openConfig(message.details));
		};
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
			const history = UtilRouter.history;

			let prev = history.entries[history.index - 1];

			if (account && !prev) {
				UtilSpace.openDashboard('route');
				return;
			};

			if (prev) {
				const route = UtilRouter.getParam(prev.pathname);

				if ((route.page == 'main') && (route.action == 'history')) {
					prev = history.entries[history.index - 3];
					if (prev) {
						UtilRouter.go(prev.pathname, {});
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
			UtilRouter.history.goForward();
		};

		menuStore.closeAll();
		analytics.event('HistoryForward');
	};

	checkBack (): boolean {
		const { account } = authStore;
		const isPopup = this.isPopup();
		const history = UtilRouter.history;

		if (!history) {
			return;
		};

		if (!isPopup) {
			const prev = history.entries[history.index - 1];

			if (account && !prev) {
				return false;
			};

			if (prev) {
				const route = UtilRouter.getParam(prev.pathname);

				if ([ 'index', 'auth' ].includes(route.page) && account) {
					return false;
				};

				if ((route.page == 'main') && !account) {
					return false;
				};
			};
		};

		return true;
	};

	checkForward (): boolean {
		const isPopup = this.isPopup();
		const history = UtilRouter.history;

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

		const rootId = this.getRootId();
		const logPath = UtilCommon.getElectron().logPath();
		const tmpPath = UtilCommon.getElectron().tmpPath();

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

			case 'gallery':
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

			case 'createObject': {
				this.pageCreate({}, 'MenuSystem');
				break;
			};

			case 'createSpace': {
				const items = UtilSpace.getList();

				if (items.length >= Constant.limit.space) {
					break;
				};

				popupStore.open('settings', { 
					className: 'isSpaceCreate',
					data: { 
						page: 'spaceCreate', 
						isSpace: true,
						onCreate: (id) => {
							UtilRouter.switchSpace(id, '', () => Storage.initPinnedTypes());
							analytics.event('SwitchSpace');
						},
					}, 
				});
				break;
			};

			case 'saveAsHTML': {
				this.onSaveAsHTML();
				break;
			};

			case 'saveAsHTMLSuccess': {
				this.printRemove();
				popupStore.close('export');
				break;
			};

			case 'save': {
				popupStore.open('export', { data: { objectIds: [ rootId ], route: analytics.route.menuSystem, allowHtml: true } });
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
				C.DebugSpaceSummary(commonStore.space, (message: any) => {
					if (!message.error.code) {
						UtilCommon.getElectron().fileWrite('debug-space-summary.json', JSON.stringify(message, null, 5), { encoding: 'utf8' });
						Renderer.send('pathOpen', tmpPath);
					};
				});
				break;
			};

			case 'debugStat': {
				C.DebugStat((message: any) => {
					if (!message.error.code) {
						UtilCommon.getElectron().fileWrite('debug-stat.json', JSON.stringify(message, null, 5), { encoding: 'utf8' });
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

			case 'debugProcess': {
				C.DebugStackGoroutines(logPath, (message: any) => {
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

			case 'interfaceLang': {
				Action.setInterfaceLang(arg);
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

			url = url.replace(/\%25os\%25/g, UtilCommon.getElectron().version.os);
			url = url.replace(/\%25version\%25/g, UtilCommon.getElectron().version.app);
			url = url.replace(/\%25build\%25/g, message.details);
			url = url.replace(/\%25middleware\%25/g, message.version);
			url = url.replace(/\%25accountId\%25/g, account.id);
			url = url.replace(/\%25analyticsId\%25/g, account.info.analyticsId);
			url = url.replace(/\%25deviceId\%25/g, account.info.deviceId);

			Renderer.send('urlOpen', url);
		});
	};

	onMembershipUpgrade () {
		const { account, membership } = authStore;
		const name = membership.name ? membership.name : account.id;

		Renderer.send('urlOpen', Url.membershipUpgrade.replace(/\%25name\%25/g, name));
	};

	onTechInfo () {
		const { account } = authStore;

		C.AppGetVersion((message: any) => {
			let data = [
				[ translate('libKeyboardOSVersion'), UtilCommon.getElectron().version.os ],
				[ translate('libKeyboardAppVersion'), UtilCommon.getElectron().version.app ],
				[ translate('libKeyboardBuildNumber'), message.details ],
				[ translate('libKeyboardLibraryVersion'), message.version ],
			];

			if (account) {
				data = data.concat([
					[ translate('libKeyboardAccountId'), account.id ],
					[ translate('libKeyboardAnalyticsId'), account.info.analyticsId ],
					[ translate('libKeyboardDeviceId'), account.info.deviceId ],
				]);
			};

			popupStore.open('confirm', {
				className: 'isWide techInfo',
				data: {
					title: translate('menuHelpTech'),
					text: data.map(it => `<dl><dt>${it[0]}:</dt><dd>${it[1]}</dd></dl>`).join(''),
					textConfirm: translate('commonCopy'),
					colorConfirm: 'blank',
					canCancel: false,
					onConfirm: () => {
						UtilCommon.copyToast(translate('libKeyboardTechInformation'), data.map(it => `${it[0]}: ${it[1]}`).join('\n'));
					},
				}
			});
		});
	};

	onUndo (rootId: string, route?: string, callBack?: (message: any) => void) {
		const { account } = authStore;
		if (!account) {
			return;
		};

		C.ObjectUndo(rootId, (message: any) => {
			if (message.blockId && message.range) {
				focus.set(message.blockId, message.range);
				focus.apply();
				focus.scroll(this.isPopup(), message.blockId);
			};

			if (callBack) {
				callBack(message);
			};
		});
		analytics.event('Undo', { route });
	};

	onRedo (rootId: string, route?: string, callBack?: (message: any) => void) {
		const { account } = authStore;
		if (!account) {
			return;
		};

		C.ObjectRedo(rootId, (message: any) => {
			if (message.blockId && message.range) {
				focus.set(message.blockId, message.range);
				focus.apply();
				focus.scroll(this.isPopup(), message.blockId);
			};

			if (callBack) {
				callBack(message);
			};
		});

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

		$('#link-prism').remove();
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

		menuStore.closeAll([ 'blockContext' ], () => {
			menuStore.open('searchText', {
				element: '#header',
				type: I.MenuType.Horizontal,
				horizontal: I.MenuDirection.Right,
				offsetX: 10,
				classNameWrap: 'fromHeader',
				passThrough: true,
				data: {
					isPopup,
					value,
					route,
				},
			});
		});
	};

	onSearchPopup (route: string) {
		popupStore.open('search', {
			data: { isPopup: this.isPopup(), route },
		});
	};

	menuFromNavigation (id: string, param: Partial<I.MenuParam>, data: any) {
		const menuParam = Object.assign({
			element: '#navigationPanel',
			className: 'fixed',
			classNameWrap: 'fromNavigation',
			type: I.MenuType.Horizontal,
			horizontal: I.MenuDirection.Center,
			vertical: I.MenuDirection.Top,
			noFlipY: true,
			offsetY: -12,
			data,
		}, param);

		if (menuStore.isOpen(id)) {
			menuStore.open(id, menuParam);
		} else {
			popupStore.close('search', () => {
				menuStore.closeAll(Constant.menuIds.navigation, () => {
					menuStore.open(id, menuParam);
				});
			});
		};
	};

	onSpaceMenu (shortcut: boolean) {
		this.menuFromNavigation('space', {}, { shortcut });
	};

	onQuickCapture (shortcut: boolean, param?: Partial<I.MenuParam>) {
		param = param || {};

		if ((commonStore.navigationMenu != I.NavigationMenuMode.Hover) && menuStore.isOpen('quickCapture')) {
			menuStore.close('quickCapture');
			return;
		};

		const button = $('#button-navigation-plus');

		this.menuFromNavigation('quickCapture', {
			...param,
			onOpen: () => button.addClass('active'),
			onClose: () => button.removeClass('active'),
		}, { isExpanded: shortcut });
	};

	onLock (rootId: string, v: boolean, route?: string) {
		const block = blockStore.getLeaf(rootId, rootId);
		if (!block) {
			return;
		};

		menuStore.closeAll([ 'blockContext' ]);

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
			this.onLock(rootId, !root.isLocked(), analytics.route.shortcut);
		};
	};

	setWindowTitle () {
		const match = this.getMatch();
		const action = match?.params?.action;
		const titles = {
			index: translate('commonDashboard'),
			graph: translate('commonGraph'),
			navigation: translate('commonFlow'),
			store: translate('commonLibrary'),
			archive: translate('commonBin'),
		};

		if (titles[action]) {
			UtilData.setWindowTitleText(titles[action]);
		} else {
			const rootId = this.getRootId();
			UtilData.setWindowTitle(rootId, rootId);
		};
	};

	getPopupMatch () {
		const popup = popupStore.get('page');
		return popup && popup?.param.data.matchPopup || {};
	};

	getMatch () {
		return (this.isPopup() ? this.getPopupMatch() : this.match) || { params: {} };
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

	isAuth () {
		return this.match?.params?.page == 'auth';
	};

	isAuthPinCheck () {
		return this.isAuth() && (this.match?.params?.action == 'pin-check');
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
		v = Boolean(v);

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

	setComposition (v: boolean) {
		this.isComposition = v;
	};

	initPinCheck () {
		const { account } = authStore;
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
			if (!check() || this.isAuthPinCheck()) {
				return;
			};

			this.setPinChecked(false);

			if (this.isMain()) {
				commonStore.redirectSet(UtilRouter.getRoute());
			};

			UtilRouter.go('/auth/pin-check', { replace: true, animate: true });
			Renderer.send('pin-check');
		}, commonStore.pinTime);
	};

	restoreSource () {
		if (!this.source) {
			return;
		};

		const { type, data } = this.source;

		switch (type) {
			case I.Source.Popup:
				window.setTimeout(() => popupStore.open(data.id, data.param), popupStore.getTimeout());
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
		return this.isArrow(e) || [ Key.escape, Key.backspace, Key.tab, Key.enter, Key.shift, Key.ctrl, Key.alt, Key.meta ].includes(this.eventKey(e));
	};

	isArrow (e: any): boolean {
		return [ Key.up, Key.down, Key.left, Key.right ].includes(this.eventKey(e));
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

		// Cmd + Alt + N hack
		if (which == KeyCode.dead) {
			pressed.push('n');
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
