import $ from 'jquery';
import { I, C, S, U, J, Storage, focus, history as historyPopup, analytics, Renderer, sidebar, Preview, Action, translate } from 'Lib';

class Keyboard {
	
	mouse: any = { 
		page: { x: 0, y: 0 },
		client: { x: 0, y: 0 },
	};
	timeoutPin = 0;
	timeoutSidebarHide = 0;
	match: any = {};
	matchPopup: any = {};
	source: any = null;
	selection: any = null;
	shortcuts: any = {};
	
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
	isShortcutEditing = false;
	isRtl = false;
	
	init () {
		this.unbind();
		this.initShortcuts();
		
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

			S.Menu.closeAll([ 'blockContext' ]);

			$('.dropTarget.isOver').removeClass('isOver');
		});

		Renderer.remove('commandGlobal');
		Renderer.on('commandGlobal', (e: any, cmd: string, arg: any) => this.onCommand(cmd, arg));
	};

	initShortcuts () {
		this.shortcuts = J.Shortcut.getItems();
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

		if (this.isMain()) {
			sidebar.onMouseMove();
		};
	};
	
	onKeyDown (e: any) {
		const { theme, pin } = S.Common;
		const isPopup = this.isPopup();
		const key = e.key.toLowerCase();
		const cmd = this.cmdKey();
		const isMain = this.isMain();
		const canWrite = U.Space.canMyParticipantWrite();
		const selection = S.Common.getRef('selectionProvider');

		this.shortcut('toggleSidebar', e, () => {
			e.preventDefault();
			sidebar.toggleOpenClose();
		});

		// Navigation
		if (!this.isNavigationDisabled) {
			this.shortcut('back', e, () => this.onBack());
			this.shortcut('forward', e, () => this.onForward());
		};

		// Close popups and menus
		this.shortcut('escape', e, () => {
			e.preventDefault();

			if (S.Menu.isOpen()) {
				S.Menu.closeLast();
			} else 
			if (S.Common.getShowSidebarRight(isPopup)) {
				sidebar.rightPanelToggle(false, true, isPopup);
			} else
			if (S.Popup.isOpen()) {
				let canClose = true;

				if (this.isPopup()) {
					if (U.Common.getSelectionRange()) {
						U.Common.clearSelection();
						canClose = false;
					} else
					if (selection) {
						const ids = selection?.get(I.SelectType.Block) || [];
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
			} else 
			if (this.isMainSettings() && !this.isFocused) {
				sidebar.leftPanelSetState({ page: 'widget' });
				U.Space.openDashboard();
			};
			
			Preview.previewHide(false);
		});

		if (isMain) {

			// Print
			this.shortcut('print', e, () => {
				e.preventDefault();
				this.onPrint(analytics.route.shortcut);
			});

			// Navigation search
			this.shortcut('search', e, (pressed: string) => {
				if (S.Popup.isOpen('search') || !this.isPinChecked) {
					return;
				};

				this.onSearchPopup(analytics.route.shortcut);
			});

			// Text search
			this.shortcut('searchText', e, () => {
				if (!this.isFocused) {
					this.onSearchMenu('', analytics.route.shortcut);
				};
			});

			// Navigation links
			this.shortcut('navigation', e, () => {
				e.preventDefault();
				U.Object.openAuto({ id: this.getRootId(), layout: I.ObjectLayout.Navigation });
			});

			// Graph
			this.shortcut('graph', e, () => {
				e.preventDefault();
				U.Object.openAuto({ id: this.getRootId(), layout: I.ObjectLayout.Graph });
			});

			// Archive
			this.shortcut('bin', e, () => {
				e.preventDefault();
				U.Object.openAuto({ layout: I.ObjectLayout.Archive });
			});

			// Go to dashboard
			this.shortcut('home', e, () => {
				if (S.Auth.account && !S.Popup.isOpen('search')) {
					U.Space.openDashboard();
				};
			});

			// Settings
			this.shortcut('settings', e, () => {
				U.Object.openAuto({ id: 'account', layout: I.ObjectLayout.Settings });
			});

			// Relation panel
			this.shortcut('relation', e, () => {
				$('#button-header-relation').trigger('click');
			});

			// Select type
			this.shortcut('selectType', e, () => {
				$('#widget-space #widget-space-arrow').trigger('click');
			});

			// Switch dark/light mode
			this.shortcut('theme', e, () => {
				Action.themeSet(!theme ? 'dark' : '');
			});

			// Lock the app
			this.shortcut('lock', e, () => {
				if (pin) {
					Renderer.send('pinCheck');
				};
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
				if (!S.Popup.isOpen('search') && !this.isMainSet()) {
					this.shortcut('createObject', e, () => {
						e.preventDefault();
						this.pageCreate({}, analytics.route.shortcut, [ I.ObjectFlag.SelectTemplate, I.ObjectFlag.DeleteEmpty ]);
					});
				};

				// Lock/Unlock
				this.shortcut('pageLock', e, () => this.onToggleLock());
			};
		};

		this.initPinCheck();
	};

	// Check if smth is selected
	checkSelection () {
		const range = U.Common.getSelectionRange();
		const selection = S.Common.getRef('selectionProvider');
		const ids = selection?.get(I.SelectType.Block) || [];

		if ((range && !range.collapsed) || ids.length) {
			return true;
		};

		return false;
	};

	pageCreate (details: any, route: string, flags: I.ObjectFlag[], callBack?: (message: any) => void) {
		if (!this.isMain()) {
			return;
		};

		U.Object.create('', '', details, I.BlockPosition.Bottom, '', flags, route, message => {
			U.Object.openConfig(message.details);

			if (callBack) {
				callBack(message);
			};
		});
	};

	onKeyUp (e: any) {
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
			const current = U.Router.getParam(history.location.pathname);

			let prev = history.entries[history.index - 1];

			if (account && !prev) {
				U.Space.openDashboard();
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

				if ((current.page == 'main') && (current.action == 'settings') && ([ 'index', 'account', 'spaceIndex', 'spaceShare' ].includes(current.id))) {
					sidebar.leftPanelSetState({ page: 'widget' });
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
		if (!this.isMain() && [ 'search', 'print' ].includes(cmd) || keyboard.isShortcutEditing) {
			return;
		};

		const rootId = this.getRootId();
		const electron = U.Common.getElectron();
		const logPath = electron.logPath();
		const tmpPath = electron.tmpPath();
		const route = analytics.route.menuSystem;

		switch (cmd) {
			case 'search': {
				this.onSearchMenu('', route);
				break;
			};

			case 'shortcut': {
				this.onShortcut();
				analytics.event('MenuHelpShortcut', { route: analytics.route.shortcut });
				break;
			};

			case 'print': {
				this.onPrint(route);
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
				Action.openUrl(J.Url[cmd]);
				break;
			};

			case 'contact': {
				this.onContactUrl();
				break;
			};

			case 'undo': {
				if (!this.isFocused) {
					this.onUndo(rootId, route);
				};
				break;
			};

			case 'redo': {
				if (!this.isFocused) {
					this.onRedo(rootId, route);
				};
				break;
			};

			case 'createObject': {
				this.pageCreate({}, route, [ I.ObjectFlag.SelectType, I.ObjectFlag.SelectTemplate, I.ObjectFlag.DeleteEmpty ]);
				break;
			};

			case 'createSpace': {
				Action.createSpace(route);
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

						Action.openPath(paths[0]);
					});
				});
				break;
			};

			case 'exportLocalstore': {
				Action.openDirectoryDialog({ buttonLabel: translate('commonExport') }, paths => {
					C.DebugExportLocalstore(paths[0], [], (message: any) => {
						if (!message.error.code) {
							Action.openPath(paths[0]);
						};
					});
				});
				break;
			};

			case 'debugSpace': {
				C.DebugSpaceSummary(S.Common.space, (message: any) => {
					if (!message.error.code) {
						U.Common.getElectron().fileWrite('debug-space-summary.json', JSON.stringify(message, null, 5), { encoding: 'utf8' });
						Action.openPath(tmpPath);
					};
				});
				break;
			};

			case 'debugStat': {
				C.DebugStat((message: any) => {
					if (!message.error.code) {
						U.Common.getElectron().fileWrite('debug-stat.json', JSON.stringify(message, null, 5), { encoding: 'utf8' });
						Action.openPath(tmpPath);
					};
				});
				break;
			};

			case 'debugTree': {
				C.DebugTree(rootId, logPath, false, (message: any) => {
					if (!message.error.code) {
						Action.openPath(logPath);
					};
				});
				break;
			};

			case 'debugProcess': {
				C.DebugStackGoroutines(logPath, (message: any) => {
					if (!message.error.code) {
						Action.openPath(logPath);
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

			case 'debugNet': {
				const { networkConfig } = S.Auth;
				const { path } = networkConfig;

				C.DebugNetCheck(path, (message: any) => {
					const result = String(message.result || '').trim();

					if (!result) {
						return;
					};

					S.Popup.open('confirm', {
						className: 'isWide techInfo isLeft',
						data: {
							title: translate('menuHelpNet'),
							text: U.Common.lbBr(result),
							textConfirm: translate('commonCopy'),
							colorConfirm: 'blank',
							canCancel: false,
							onConfirm: () => {
								U.Common.copyToast(translate('libKeyboardNetInformation'), result);
							},
						}
					});
				});
				break;
			};

			case 'debugLog': {
				C.DebugExportLog(tmpPath, (message: any) => {
					if (!message.error.code) {
						Action.openPath(tmpPath);
					};
				});
				break;
			};

			case 'debugProfiler': {
				C.DebugRunProfiler(30, (message: any) => {
					if (!message.error.code) {
						Action.openPath(message.path);
					};
				});
				break;
			};

			case 'resetOnboarding': {
				Storage.delete('onboarding');
				Storage.delete('primitivesOnboarding');
				break;
			};

			case 'interfaceLang': {
				Action.setInterfaceLang(arg);
				break;
			};

			case 'systemInfo': {
				const props: any = {};
				const { cpu, graphics, memLayout, diskLayout } = arg;
				const { manufacturer, brand, speed, cores } = cpu;
				const { controllers, displays } = graphics;

				props.systemCpu = [ manufacturer, brand ].join(', ');
				props.systemCpuSpeed = [ `${speed}GHz`, `${cores} cores` ].join(', ');
				props.systemVideo = (controllers || []).map(it => it.model).join(', ');
				props.systemDisplay = (displays || []).map(it => it.model).join(', ');
				props.systemResolution = `${window.screen.width}x${window.screen.height}`;
				props.systemMemory = (memLayout || []).map(it => U.File.size(it.size)).join(', ');
				props.systemMemoryType = (memLayout || []).map(it => it.type).join(', ');
				props.systemDisk = (diskLayout || []).map(it => U.File.size(it.size)).join(', ');
				props.systemDiskName = (diskLayout || []).map(it => it.name).join(', ');

				analytics.setProperty(props);
				break;
			};

			case 'releaseChannel': {
				const cb = () => Renderer.send('setChannel', arg);

				if (arg == 'latest') {
					cb();
				} else {
					S.Popup.open('confirm', {
						className: 'isLeft',
						data: {
							icon: 'warning',
							title: translate('commonWarning'),
							text: translate('popupConfirmReleaseChannelText'),
							onConfirm: () => cb(),
						},
					});
				};
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

			Action.openUrl(url);
		});
	};

	onMembershipUpgrade () {
		const { account, membership } = S.Auth;
		const name = membership.name ? membership.name : account.id;

		Action.openUrl(J.Url.membershipUpgrade.replace(/\%25name\%25/g, name));
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
					[ translate('popupSettingsEthereumIdentityTitle'), account.info.ethereumAddress ],
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
		const theme = S.Common.getThemeClass();

		if (theme) {
			options.printBackground = true;
		};

		this.printApply('print', false);
		Renderer.send('winCommand', 'printPdf', { name: object.name, options });
	};

	onSearchMenu (value: string, route?: string) {
		const isPopup = this.isPopup();
		const popupMatch = this.getPopupMatch();

		let isDisabled = false;
		if (!isPopup) {
			isDisabled = this.isMainSet() || this.isMainGraph() || this.isMainChat();
		} else {
			isDisabled = [ 'set', 'store', 'graph', 'chat' ].includes(popupMatch.params.action);
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

	onShortcut () {
		if (!S.Popup.isOpen('shortcut')) {
			S.Popup.open('shortcut', { preventResize: true });
		} else {
			S.Popup.close('shortcut');
		};
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
		const { pin } = S.Common;
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
			archive: translate('commonBin'),
		};

		if (titles[action]) {
			U.Data.setWindowTitleText(titles[action]);
		} else {
			const rootId = this.getRootId();
			U.Data.setWindowTitle(rootId, rootId);
		};
	};

	isPopup () {
		return S.Popup.isOpen('page');
	};

	getRootId (isPopup?: boolean): string {
		const match = this.getMatch(isPopup);
		return match.params.objectId || match.params.id;
	};

	getPopupMatch () {
		const popup = S.Popup.get('page');
		return popup && popup?.param.data.matchPopup || {};
	};

	getMatch (isPopup?: boolean) {
		const popup = undefined === isPopup ? this.isPopup() : isPopup;

		let ret: any = { params: {} };
		if (popup) {
			ret = Object.assign(ret, this.getPopupMatch());
		} else {
			const match = U.Common.objectCopy(this.match);
			const param = U.Router.getParam(U.Router.getRoute());

			ret = Object.assign(ret, match);
			ret.params = Object.assign(ret.params, param);
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

	isMainGraph () {
		return this.isMain() && (this.match?.params?.action == 'graph');
	};

	isMainChat () {
		return this.isMain() && (this.match?.params?.action == 'chat');
	};

	isMainIndex () {
		return this.isMain() && (this.match?.params?.action == 'index');
	};

	isMainHistory () {
		return this.isMain() && (this.match?.params?.action == 'history');
	};

	isMainVoid () {
		return this.isMain() && (this.match?.params?.action == 'void');
	};

	isMainType () {
		return this.isMain() && (this.match?.params?.action == 'type');
	};

	isMainSettings () {
		return this.isMain() && (this.match?.params?.action == 'settings');
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
		this.match = U.Common.objectCopy(match);
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

	setRtl (v: boolean) {
		this.isRtl = v;
	};

	setShortcutEditing (v: boolean) {
		this.isShortcutEditing = v;
	};

	initPinCheck () {
		const { account } = S.Auth;

		const check = () => {
			const { pin } = S.Common;
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

			if (this.isMain()) {
				S.Common.redirectSet(U.Router.getRoute());
			};

			Renderer.send('pinCheck');
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

	getMarkParam () {
		return [
			{ key: 'textBold',		 type: I.MarkType.Bold,		 param: '' },
			{ key: 'textItalic',	 type: I.MarkType.Italic,	 param: '' },
			{ key: 'textUnderlined', type: I.MarkType.Underline, param: '' },
			{ key: 'textStrike',	 type: I.MarkType.Strike,	 param: '' },
			{ key: 'textLink',		 type: I.MarkType.Link,		 param: '' },
			{ key: 'textCode',		 type: I.MarkType.Code,		 param: '' },
			{ key: 'textColor',		 type: I.MarkType.Color,	 param: Storage.get('color') },
			{ key: 'textBackground', type: I.MarkType.BgColor,	 param: Storage.get('bgColor') },
		];
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

	metaKeys (e: any): string[] {
		const ret = [];
		if (e.shiftKey) {
			ret.push('shift');
		};
		if (e.altKey) {
			ret.push('alt');
		};
		if (e.ctrlKey) {
			ret.push('ctrl');
		};
		if (e.metaKey) {
			ret.push('cmd');
		};
		return ret;
	};

	shortcut (s: string, e: any, callBack: (pressed: string) => void) {
		if (!e || !e.key || this.isShortcutEditing) {
			return;
		};

		const a = s.split(',').map(it => it.trim());
		const key = this.eventKey(e);
		const which = e.which;
		const metaKeys = this.metaKeys(e);

		let pressed = [];
		let res = '';

		if (metaKeys.length) {
			pressed = pressed.concat(metaKeys);
		};

		// Cmd + Alt + N hack
		if (which == J.Key.dead) {
			pressed.push('n');
		};

		for (const item of a) {
			let keys = [];

			if (this.shortcuts[item]) {
				keys = this.shortcuts[item].keys || [];
			} else {
				keys = item.split('+');
			};

			keys.sort();
			
			for (const k of keys) {
				if (which == J.Key[k]) {
					pressed.push(k);
				} else
				if (k == key) {
					pressed.push(key);
				};
			};

			const check = U.Common.arrayUnique(pressed).sort().join('+');

			if (check == keys.join('+')) {
				res = check;
			};
		};

		if (res) {
			callBack(res);
		};
	};

	getCaption (id: string) {
		let ret = '';
		if (this.shortcuts[id]) {
			ret = (this.shortcuts[id].symbols || []).join(' + ');
		};
		return ret;
	};

	getKeys (id: string) {
		return this.shortcuts[id].keys || [];
	};

	getSymbolsFromKeys (keys: string[]) {
		const isMac = U.Common.isPlatformMac();

		return keys.map((key: string) => {
			if (key === this.cmdKey()) {
				return this.cmdSymbol();
			};
			if (key == 'shift') {
				return this.shiftSymbol();
			};
			if (key == 'alt') {
				return this.altSymbol();
			};
			if ((key == 'ctrl') && isMac) {
				return '&#8963;';
			};
			if (key == 'enter') {
				return '&#8629;';
			};
			if (key == 'delete') {
				return 'Del';
			};
			if (key == 'arrowleft') {
				return '←';
			};
			if (key == 'arrowup') {
				return '↑';
			};
			if (key == 'arrowright') {
				return '→';
			};
			if (key == 'arrowdown') {
				return '↓';
			};
			if (key == 'comma') {
				return ',';
			};
			return U.Common.ucFirst(key);
		});
	};

	cmdSymbol () {
		return U.Common.isPlatformMac() ? '&#8984;' : 'Ctrl';
	};

	altSymbol () {
		return U.Common.isPlatformMac() ? '&#8997;' : 'Alt';
	};

	shiftSymbol () {
		return '&#x21E7;';
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
