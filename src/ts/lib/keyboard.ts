import $ from 'jquery';
import { I, C, S, U, J, Storage, focus, history as historyPopup, analytics, Renderer, sidebar, Preview, Action, translate } from 'Lib';

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
	isContextDisabled = false;
	isContextCloseDisabled = false;
	isContextOpenDisabled = false;
	isPasteDisabled = false;
	isSelectionDisabled = false;
	isSelectionClearDisabled = false;
	isComposition = false;
	isCommonDropDisabled = false;
	
	init () {
		this.unbind();
		
		const win = $(window);

		S.Common.isOnlineSet(navigator.onLine);

		win.on('keydown.common', e => this.onKeyDown(e));
		win.on('keyup.common', e => this.onKeyUp(e));
		win.on('mousedown.common', e => this.onMouseDown(e));
		win.on('scroll.common', () => this.onScroll());
		win.on('mousemove.common', e => this.onMouseMove(e));

		win.on('online.common offline.common', () => {
			const { onLine } = navigator;

			S.Common.isOnlineSet(onLine);

			if (!S.Common.membershipTiers.length) {
				U.Data.getMembershipTiers(false);
			};
		});
		
		win.on('blur.common', () => {
			Preview.tooltipHide(true);
			Preview.previewHide(true);

			this.pressed = [];

			S.Menu.closeAll([ 'blockContext' ]);

			$('.dropTarget.isOver').removeClass('isOver');
		});

		Renderer.remove('commandGlobal');
		Renderer.on('commandGlobal', (e: any, cmd: string, arg: any) => this.onCommand(cmd, arg));
	};
	
	unbind () {
		$(window).off('keyup.common keydown.common mousedown.common scroll.common mousemove.common blur.common online.common offline.common');
	};

	onScroll () {
		Preview.tooltipHide(false);
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
	};
	
	onKeyDown (e: any) {
		const isMac = U.Common.isPlatformMac();
		const key = e.key.toLowerCase();
		const cmd = this.cmdKey();
		const isMain = this.isMain();
		const canWrite = U.Space.canMyParticipantWrite();
		const selection = S.Common.getRef('selectionProvider');
		const { spaceview } = S.Block;

		this.pressed.push(key);

		this.shortcut(`${cmd}+\\, ${cmd}+dot`, e, (pressed: string) => {
			e.preventDefault();
			sidebar.toggleOpenClose();
		});

		// Navigation
		if (!this.isNavigationDisabled) {
			this.shortcut(isMac ? 'cmd+[' : 'alt+arrowleft', e, () => this.onBack());
			this.shortcut(isMac ? 'cmd+]' : 'alt+arrowright', e, () => this.onForward());

			if (!U.Common.getSelectionRange() && isMac) {
				this.shortcut(`${cmd}+arrowleft`, e, () => this.onBack());
				this.shortcut(`${cmd}+arrowright`, e, () => this.onForward());
			};
		};

		// Close popups and menus
		this.shortcut('escape', e, () => {
			e.preventDefault();

			if (S.Menu.isOpen()) {
				S.Menu.closeLast();
			} else 
			if (S.Popup.isOpen()) {
				let canClose = true;

				if (this.isPopup()) {
					if (U.Common.getSelectionRange()) {
						U.Common.clearSelection();
						canClose = false;
					} else
					if (selection) {
						const ids = selection.get(I.SelectType.Block);
						if (ids.length) {
							canClose = false;
						};
					};
				};

				if (canClose) {
					const last = S.Popup.getLast();
					if (last && !last.param.preventCloseByEscape) {
						S.Popup.close(last.id);
					};
				};
			};
			
			Preview.previewHide(false);
		});

		if (isMain) {

			// Shortcuts
			this.shortcut('ctrl+space', e, () => {
				S.Popup.open('shortcut', { preventResize: true });
			});

			// Print
			this.shortcut(`${cmd}+p`, e, () => {
				e.preventDefault();
				this.onPrint(analytics.route.shortcut);
			});

			// Navigation search
			this.shortcut(`${cmd}+s, ${cmd}+k`, e, (pressed: string) => {
				if (S.Popup.isOpen('search') || !this.isPinChecked || ((pressed == `${cmd}+k`) && this.checkSelection())) {
					return;
				};

				this.onSearchPopup(analytics.route.shortcut);
			});

			this.shortcut(`${cmd}+l`, e, () => {
				if (S.Popup.isOpen('search') || !this.isPinChecked || this.checkSelection()) {
					return;
				};

				U.Object.openAuto({ layout: I.ObjectLayout.Store });
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
				U.Object.openAuto({ id: this.getRootId(), layout: I.ObjectLayout.Navigation });
			});

			// Graph
			this.shortcut(`${cmd}+alt+o`, e, () => {
				e.preventDefault();
				U.Object.openAuto({ id: this.getRootId(), layout: I.ObjectLayout.Graph });
			});

			// Go to dashboard
			this.shortcut('alt+h', e, () => {
				if (S.Auth.account && !S.Popup.isOpen('search')) {
					U.Space.openDashboard('route');
				};
			});

			// Settings
			this.shortcut(`${cmd}+comma`, e, () => {
				if (!S.Popup.isOpen('settings')) {
					S.Popup.open('settings', {});
				};
			});

			// Create relation
			this.shortcut(`${cmd}+shift+r`, e, () => {
				$('#button-header-relation').trigger('click');
			});

			// Store
			this.shortcut(`${cmd}+alt+l`, e, () => {
				U.Object.openRoute({ layout: I.ObjectLayout.Store });
			});

			// Object id
			this.shortcut(`${cmd}+shift+\\`, e, () => {
				S.Popup.open('confirm', {
					className: 'isWide isLeft',
					data: {
						text: `ID: ${this.getRootId()}`,
						textConfirm: translate('commonCopy'),
						textCancel: translate('commonClose'),
						canConfirm: true,
						canCancel: true,
						onConfirm: () => U.Common.copyToast('ID', this.getRootId()),
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
		const range = U.Common.getSelectionRange();
		const selection = S.Common.getRef('selectionProvider');

		if ((range && !range.collapsed) || (selection && selection.get(I.SelectType.Block).length)) {
			return true;
		};

		return false;
	};

	pageCreate (details: any, route: string) {
		if (this.isMain()) {
			const flags = [ I.ObjectFlag.SelectTemplate, I.ObjectFlag.DeleteEmpty ];
			U.Object.create('', '', details, I.BlockPosition.Bottom, '', flags, route, message => U.Object.openConfig(message.details));
		};
	};

	isPopup () {
		return S.Popup.isOpen('page');
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
		const { account } = S.Auth;
		const isPopup = this.isPopup();

		if (S.Auth.accountIsDeleted() || S.Auth.accountIsPending() || !this.checkBack()) {
			return;
		};

		if (isPopup) {
			if (!historyPopup.checkBack()) {
				S.Popup.close('page');
			} else {
				historyPopup.goBack((match: any) => { 
					S.Popup.updateData('page', { matchPopup: match }); 
				});
			};
		} else {
			const history = U.Router.history;

			let prev = history.entries[history.index - 1];

			if (account && !prev) {
				U.Space.openDashboard('route');
				return;
			};

			if (prev) {
				const route = U.Router.getParam(prev.pathname);

				if ((route.page == 'main') && (route.action == 'history')) {
					prev = history.entries[history.index - 3];
					if (prev) {
						U.Router.go(prev.pathname, {});
					};
					return;
				};

				history.goBack();
			};
		};

		S.Menu.closeAll();
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
				S.Popup.updateData('page', { matchPopup: match }); 
			});
		} else {
			U.Router.history.goForward();
		};

		S.Menu.closeAll();
		analytics.event('HistoryForward');
	};

	checkBack (): boolean {
		const { account } = S.Auth;
		const isPopup = this.isPopup();
		const history = U.Router.history;

		if (!history) {
			return;
		};

		if (!isPopup) {
			const prev = history.entries[history.index - 1];

			if (account && !prev) {
				return false;
			};

			if (prev) {
				const route = U.Router.getParam(prev.pathname);

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
		const history = U.Router.history;

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
		const logPath = U.Common.getElectron().logPath();
		const tmpPath = U.Common.getElectron().tmpPath();

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
				Renderer.send('urlOpen', J.Url[cmd]);
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
				const items = U.Space.getList();

				if (items.length >= J.Constant.limit.space) {
					break;
				};

				S.Popup.open('settings', { 
					className: 'isSpaceCreate',
					data: { 
						page: 'spaceCreate', 
						isSpace: true,
						onCreate: (id) => {
							U.Router.switchSpace(id, '', true, () => Storage.initPinnedTypes());
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
				S.Popup.close('export');
				break;
			};

			case 'save': {
				S.Popup.open('export', { data: { objectIds: [ rootId ], route: analytics.route.menuSystem, allowHtml: true } });
				break;
			};

			case 'exportTemplates': {
				Action.openDirectoryDialog({ buttonLabel: translate('commonExport') }, paths => {
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
				Action.openDirectoryDialog({ buttonLabel: translate('commonExport') }, paths => {
					C.DebugExportLocalstore(paths[0], [], (message: any) => {
						if (!message.error.code) {
							Renderer.send('pathOpen', paths[0]);
						};
					});
				});
				break;
			};

			case 'debugSpace': {
				C.DebugSpaceSummary(S.Common.space, (message: any) => {
					if (!message.error.code) {
						U.Common.getElectron().fileWrite('debug-space-summary.json', JSON.stringify(message, null, 5), { encoding: 'utf8' });
						Renderer.send('pathOpen', tmpPath);
					};
				});
				break;
			};

			case 'debugStat': {
				C.DebugStat((message: any) => {
					if (!message.error.code) {
						U.Common.getElectron().fileWrite('debug-stat.json', JSON.stringify(message, null, 5), { encoding: 'utf8' });
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

			case 'debugReconcile': {
				S.Popup.open('confirm', {
					data: {
						text: translate('popupConfirmActionReconcileText'),
						onConfirm: () => {
							C.FileReconcile(() => {
								Preview.toastShow({ text: translate('commonDone') });
							});
						},
					}
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
		const { account } = S.Auth;
		if (!account) {
			return;
		};

		C.AppGetVersion((message: any) => {
			let url = J.Url.contact;

			url = url.replace(/\%25os\%25/g, U.Common.getElectron().version.os);
			url = url.replace(/\%25version\%25/g, U.Common.getElectron().version.app);
			url = url.replace(/\%25build\%25/g, message.details);
			url = url.replace(/\%25middleware\%25/g, message.version);
			url = url.replace(/\%25accountId\%25/g, account.id);
			url = url.replace(/\%25analyticsId\%25/g, account.info.analyticsId);
			url = url.replace(/\%25deviceId\%25/g, account.info.deviceId);

			Renderer.send('urlOpen', url);
		});
	};

	onMembershipUpgrade () {
		const { account, membership } = S.Auth;
		const name = membership.name ? membership.name : account.id;

		Renderer.send('urlOpen', J.Url.membershipUpgrade.replace(/\%25name\%25/g, name));
	};

	onTechInfo () {
		const { account } = S.Auth;

		C.AppGetVersion((message: any) => {
			let data = [
				[ translate('libKeyboardOSVersion'), U.Common.getElectron().version.os ],
				[ translate('libKeyboardAppVersion'), U.Common.getElectron().version.app ],
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

			S.Popup.open('confirm', {
				className: 'isWide techInfo',
				data: {
					title: translate('menuHelpTech'),
					text: data.map(it => `<dl><dt>${it[0]}:</dt><dd>${it[1]}</dd></dl>`).join(''),
					textConfirm: translate('commonCopy'),
					colorConfirm: 'blank',
					canCancel: false,
					onConfirm: () => {
						U.Common.copyToast(translate('libKeyboardTechInformation'), data.map(it => `${it[0]}: ${it[1]}`).join('\n'));
					},
				}
			});
		});
	};

	onUndo (rootId: string, route?: string, callBack?: (message: any) => void) {
		const { account } = S.Auth;
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
		const { account } = S.Auth;
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
			U.Common.addBodyClass('theme', '');
		};

		$('#link-prism').remove();
		focus.clearRange(true);
	};

	printRemove () {
		$('html').removeClass('withPopup printMedia print save');
		S.Common.setThemeClass();
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
		const object = S.Detail.get(rootId, rootId);

		this.printApply('save', false);
		Renderer.send('winCommand', 'printHtml', { name: object.name });
	};

	onPrintToPDF (options: any) {
		const rootId = this.getRootId();
		const object = S.Detail.get(rootId, rootId);

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

		S.Menu.closeAll(null, () => {
			S.Menu.open('searchText', {
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
		S.Popup.open('search', {
			preventCloseByEscape: true,
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

		if (S.Menu.isOpen(id)) {
			S.Menu.open(id, menuParam);
		} else {
			S.Popup.close('search', () => {
				S.Menu.closeAll(J.Menu.navigation, () => {
					S.Menu.open(id, menuParam);
				});
			});
		};
	};

	onQuickCapture (shortcut: boolean, param?: Partial<I.MenuParam>) {
		param = param || {};

		if ((S.Common.navigationMenu != I.NavigationMenuMode.Hover) && S.Menu.isOpen('quickCapture')) {
			S.Menu.close('quickCapture');
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
		const block = S.Block.getLeaf(rootId, rootId);
		if (!block) {
			return;
		};

		S.Menu.closeAll([ 'blockContext' ]);

		C.BlockListSetFields(rootId, [
			{ blockId: rootId, fields: { ...block.fields, isLocked: v } },
		]);

		Preview.toastShow({ objectId: rootId, action: I.ToastAction.Lock, value: v });
		analytics.event((v ? 'LockPage' : 'UnlockPage'), { route });
	};

	onToggleLock () {
		const rootId = this.getRootId();
		const root = S.Block.getLeaf(rootId, rootId);
		
		if (root) {
			this.onLock(rootId, !root.isLocked(), analytics.route.shortcut);
		};
	};

	setWindowTitle () {
		const pin = Storage.getPin();
		if (pin && !this.isPinChecked) {
			document.title = J.Constant.appName;
			return;
		};

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
			U.Data.setWindowTitleText(titles[action]);
		} else {
			const rootId = this.getRootId();
			U.Data.setWindowTitle(rootId, rootId);
		};
	};

	getPopupMatch () {
		const popup = S.Popup.get('page');
		return popup && popup?.param.data.matchPopup || {};
	};

	getMatch () {
		const ret = (this.isPopup() ? this.getPopupMatch() : this.match) || { params: {} };

		for (const k in ret.params) {
			if (ret.params[k] == J.Constant.blankRouteId) {
				ret.params[k] = '';
			};
		};

		return ret;
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

	isMainHistory () {
		return this.isMain() && (this.match?.params?.action == 'history');
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
		this.source = U.Common.objectCopy(source);
	};

	setSelectionClearDisabled (v: boolean) {
		this.isSelectionClearDisabled = v;
	};

	setComposition (v: boolean) {
		this.isComposition = v;
	};

	initPinCheck () {
		const { account } = S.Auth;
		const check = () => {
			const pin = Storage.getPin();
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
				S.Common.redirectSet(U.Router.getRoute());
			};

			U.Router.go('/auth/pin-check', { replace: true, animate: true });
			Renderer.send('pin-check');
		}, S.Common.pinTime);
	};

	restoreSource () {
		if (!this.source) {
			return;
		};

		const { type, data } = this.source;

		switch (type) {
			case I.Source.Popup:
				window.setTimeout(() => S.Popup.open(data.id, data.param), S.Popup.getTimeout());
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

	// Flag to prevent menuBlockContext from opening
	disableContext (v: boolean) {
		this.isContextDisabled = v;
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

	// Flag to disable selection
	disableSelection (v: boolean) {
		this.isSelectionDisabled = v;
	};

	// Flag to disable common drop
	disableCommonDrop (v: boolean) {
		this.isCommonDropDisabled = v;
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
		if (which == J.Key.dead) {
			pressed.push('n');
		};

		for (const item of a) {
			const keys = item.split('+').sort();
			
			for (const k of keys) {
				if (which == J.Key[k]) {
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
		return U.Common.isPlatformMac() ? '&#8984;' : 'Ctrl';
	};

	altSymbol () {
		return U.Common.isPlatformMac() ? '&#8997;' : 'Alt';
	};

	cmdKey () {
		return U.Common.isPlatformMac() ? 'cmd' : 'ctrl';
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