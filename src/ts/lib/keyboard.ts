import $ from 'jquery';
import { I, C, S, U, J, Storage, focus, history as historyPopup, analytics, Renderer, sidebar, Preview, Action, translate } from 'Lib';

class Keyboard {
	
	mouse: any = { 
		page: { x: 0, y: 0 },
		client: { x: 0, y: 0 },
	};
	timeoutPin = 0;
	timeoutSidebarHide = 0;
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
	
	/**
	 * Initializes keyboard event listeners and shortcuts.
	 */
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

		win.on('focus.common', () => {
			S.Common.windowIsFocusedSet(true);
		});
		
		win.on('blur.common', () => {
			Preview.tooltipHide(true);
			Preview.previewHide(true);
			S.Common.windowIsFocusedSet(false);

			S.Menu.closeAll([ 'blockContext' ]);

			$('.dropTarget.isOver').removeClass('isOver');
		});

		Renderer.remove('commandGlobal');
		Renderer.on('commandGlobal', (e: any, cmd: string, arg: any) => this.onCommand(cmd, arg));
	};

	/**
	 * Initializes keyboard shortcuts from configuration.
	 */
	initShortcuts () {
		this.shortcuts = J.Shortcut.getItems();
	};
	
	/**
	 * Unbinds all keyboard event listeners.
	 */
	unbind () {
		$(window).off('keyup.common keydown.common mousedown.common scroll.common mousemove.common blur.common online.common offline.common');
	};

	/**
	 * Handles scroll events to hide tooltips.
	 */
	onScroll () {
		Preview.tooltipHide(false);
	};

	/**
	 * Handles mouse down events for navigation and focus management.
	 * @param {any} e - The mouse event.
	 */
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

	/**
	 * Handles mouse move events for pin checking and mouse state.
	 * @param {any} e - The mouse event.
	 */
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
	
	/**
	 * Handles key down events for shortcuts and navigation.
	 * @param {any} e - The keyboard event.
	 */
	onKeyDown (e: any) {
		const { config, theme, pin } = S.Common;
		const isPopup = this.isPopup();
		const cmd = this.cmdKey();
		const isMain = this.isMain();
		const canWrite = U.Space.canMyParticipantWrite();
		const selection = S.Common.getRef('selectionProvider');
		const rootId = this.getRootId();
		const object = S.Detail.get(rootId, rootId);
		const space = U.Space.getSpaceview();
		const rightSidebar = S.Common.getRightSidebarState(isPopup);

		this.shortcut('toggleSidebar', e, () => {
			e.preventDefault();

			sidebar.leftPanelToggle();
		});

		if (this.isMainEditor()) {
			this.shortcut('tableOfContents', e, () => {
				e.preventDefault();

				sidebar.rightPanelToggle(true, isPopup, 'object/tableOfContents', { rootId });
			});
		};

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
			if (rightSidebar.isOpen) {
				sidebar.rightPanelToggle(true, isPopup, rightSidebar.page);
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
				U.Space.openDashboard({ replace: false });
			};
			
			Preview.previewHide(false);
		});

		// Switch dark/light mode
		this.shortcut('theme', e, () => Action.themeSet(!theme ? 'dark' : ''));

		// Show/Hide menu bar on Windows
		if (U.Common.isPlatformWindows()) {
			this.shortcut('systemMenu', e, () => Renderer.send('setMenuBarVisibility', !config.showMenuBar)) ;
		};

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
					U.Space.openDashboard({ replace: false });
				};
			});

			// Settings
			this.shortcut('settings', e, () => {
				U.Object.openRoute({ id: 'account', layout: I.ObjectLayout.Settings });
			});

			// Relation panel
			this.shortcut('relation', e, () => {
				$('#button-header-relation').trigger('click');
			});

			// Select type
			this.shortcut('selectType', e, () => {
				$('#button-sidebar-select-type').trigger('click');
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

			// Copy page link
			this.shortcut('copyPageLink', e, () => {
				e.preventDefault();
				U.Object.copyLink(object, space, 'web', analytics.route.shortcut);
			});

			// Copy deep link
			this.shortcut('copyDeepLink', e, () => {
				e.preventDefault();
				U.Object.copyLink(object, space, 'deeplink', analytics.route.shortcut);
			});

			// Settings
			this.shortcut('settingsSpace', e, () => {
				e.preventDefault();

				U.Object.openRoute({ id: 'spaceIndex', layout: I.ObjectLayout.Settings });
			});

			// Logout
			this.shortcut('logout', e, () => {
				e.preventDefault();

				S.Popup.open('logout', {});
			});

			// Widget panel
			this.shortcut('widget', e, () => {
				sidebar.leftPanelSubPageToggle('widget');
			});

			if (canWrite) {
				// Create new page
				if (!S.Popup.isOpen('search') && !this.isMainSet()) {
					this.shortcut('createObject', e, () => {
						e.preventDefault();
						this.pageCreate({}, analytics.route.shortcut, [ I.ObjectFlag.SelectTemplate, I.ObjectFlag.DeleteEmpty ]);
					});
				};

				// Pin/Unpin
				this.shortcut('pin', e, () => {
					e.preventDefault();

					Action.toggleWidgetsForObject(rootId, analytics.route.header);
				});

				// Lock/Unlock
				this.shortcut('pageLock', e, () => this.onToggleLock());

				// Move to bin
				this.shortcut('moveToBin', e, () => {
					e.preventDefault();

					Action[object.isArchived ? 'restore' : 'archive']([ rootId ], analytics.route.shortcut);
				});

				// Add to favorites
				this.shortcut('addFavorite', e, () => {
					e.preventDefault();
					Action.toggleWidgetsForObject(rootId, analytics.route.shortcut);
				});
			};

			// Switch space
			for (let i = 1; i <= 9; i++) {
				const id = Number(i) - 1;
				keyboard.shortcut(`space${i}`, e, () => {
					const spaces = U.Menu.getVaultItems();
					const item = spaces[id];
	
					if (!item) {
						return;
					};

					if (item.targetSpaceId != S.Common.space) {
						U.Router.switchSpace(item.targetSpaceId, '', true, {}, false);
					} else {
						U.Space.openDashboard({ replace: false });
					};
				});
			};


			keyboard.shortcut('createSpace', e, () => {
				const element = `#button-create-space`;

				let rect = null;
				let horizontal = I.MenuDirection.Left;
				let vertical = I.MenuDirection.Top;

				if (!$(element).length) {
					const { ww, wh } = U.Common.getWindowDimensions();

					rect = { x: ww / 2, y: wh / 2, width: 0, height: 0 };
					horizontal = I.MenuDirection.Center;
					vertical = I.MenuDirection.Center;
				};

				U.Menu.spaceCreate({
					element,
					rect,
					className: 'spaceCreate fixed',
					classNameWrap: 'fromSidebar',
					horizontal,
					vertical,
				}, analytics.route.shortcut);
			});
		};

		this.initPinCheck();
	};

	/**
	 * Checks the current selection and updates state.
	 */
	checkSelection () {
		const range = U.Common.getSelectionRange();
		const selection = S.Common.getRef('selectionProvider');
		const ids = selection?.get(I.SelectType.Block) || [];

		if ((range && !range.collapsed) || ids.length) {
			return true;
		};

		return false;
	};

	/**
	 * Creates a new page with the given details, route, and flags.
	 * @param {any} details - The page details.
	 * @param {string} route - The route for the new page.
	 * @param {I.ObjectFlag[]} flags - Flags for the new object.
	 * @param {function} [callBack] - Optional callback after creation.
	 */
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

	/**
	 * Handles key up events.
	 * @param {any} e - The keyboard event.
	 */
	onKeyUp (e: any) {
	};

	/**
	 * Handles back navigation.
	 */
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
			const prev = history.entries[history.index - 1];

			if (account && !prev) {
				U.Space.openDashboard();
				return;
			};

			if (prev) {
				const route = U.Router.getParam(prev.pathname);

				let substitute = '';

				if ([ 'object', 'invite', 'membership' ].includes(route.page)) {
					substitute = history.entries[history.index - 2]?.pathname;
				};

				if ((route.page == 'main') && (route.action == 'history')) {
					substitute = history.entries[history.index - 3]?.pathname;
				};

				if (substitute) {
					U.Router.go(substitute, {});
					return;
				};

				if ((current.page == 'main') && (current.action == 'settings') && ([ 'index', 'account', 'spaceIndex', 'spaceShare' ].includes(current.id))) {
					U.Space.openDashboard({ replace: false });
				} else {
					history.goBack();
				};
			};
		};

		S.Menu.closeAll();
		this.restoreSource();
		analytics.event('HistoryBack');
	};

	/**
	 * Handles forward navigation.
	 */
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

	/**
	 * Checks if back navigation is possible.
	 * @returns {boolean} True if back is possible.
	 */
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

	/**
	 * Checks if forward navigation is possible.
	 * @returns {boolean} True if forward is possible.
	 */
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

	/**
	 * Handles global command events from the renderer.
	 * @param {string} cmd - The command name.
	 * @param {any} arg - The command argument.
	 */
	onCommand (cmd: string, arg: any) {
		if (!this.isMain() && [ 'search', 'print' ].includes(cmd) || keyboard.isShortcutEditing) {
			return;
		};

		const rootId = this.getRootId();
		const electron = U.Common.getElectron();
		const logPath = electron.logPath();
		const tmpPath = electron.tmpPath();
		const route = analytics.route.menuSystem;
		const canUndo = !this.isFocused && this.isMainEditor();

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
				if (canUndo) {
					this.onUndo(rootId, route);
				} else {
					document.execCommand('undo');
				};
				break;
			};

			case 'redo': {
				if (canUndo) {
					this.onRedo(rootId, route);
				} else {
					document.execCommand('redo');
				};
				break;
			};

			case 'createObject': {
				this.pageCreate({}, route, [ I.ObjectFlag.SelectTemplate, I.ObjectFlag.DeleteEmpty ]);
				break;
			};

			case 'createSpace': {
				Action.createSpace(I.SpaceUxType.Data, route);
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
				const unanonymized = arg?.unanonymized || false;
				C.DebugTree(rootId, logPath, unanonymized, (message: any) => {
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
				Storage.delete('chatsOnboarding');

				location.reload();
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
							onCancel: () => Renderer.send('initMenu')
						},
					});
				};
				break;
			};

			case 'readAllMessages': {
				C.ChatReadAll();
				break;
			};

		};
	};

	/**
	 * Handles contact URL action.
	 */
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

	/**
	 * Handles membership upgrade action.
	 */
	onMembershipUpgradeViaEmail () {
		const { account, membership } = S.Auth;
		const name = membership.name ? membership.name : account.id;

		Action.openUrl(J.Url.membershipUpgrade.replace(/\%25name\%25/g, name));
	};

	/**
	 * Handles tech info action.
	 */
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

	/**
	 * Handles undo action.
	 * @param {string} rootId - The root object ID.
	 * @param {string} [route] - The route context.
	 * @param {function} [callBack] - Optional callback after undo.
	 */
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

	/**
	 * Handles redo action.
	 * @param {string} rootId - The root object ID.
	 * @param {string} [route] - The route context.
	 * @param {function} [callBack] - Optional callback after redo.
	 */
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

	/**
	 * Applies print styles to the document.
	 * @param {string} className - The class name to apply.
	 * @param {boolean} clearTheme - Whether to clear the theme.
	 */
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

	/**
	 * Removes print styles from the document.
	 */
	printRemove () {
		$('html').removeClass('withPopup printMedia print save');
		S.Common.setThemeClass();
		$(window).trigger('resize');
	};

	/**
	 * Handles print action for the current route.
	 * @param {string} [route] - The route context.
	 */
	onPrint (route?: string) {
		this.printApply('print', true);

		window.print();

		this.printRemove();
		analytics.event('Print', { route });
	};

	/**
	 * Saves the current page as HTML.
	 */
	onSaveAsHTML () {
		const rootId = this.getRootId();
		const object = S.Detail.get(rootId, rootId);

		this.printApply('save', false);
		Renderer.send('winCommand', 'printHtml', { name: object.name });
	};

	/**
	 * Prints the current page to PDF.
	 * @param {any} options - Print options.
	 */
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

	/**
	 * Handles search menu action.
	 * @param {string} value - The search value.
	 * @param {string} [route] - The route context.
	 */
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

	/**
	 * Handles search popup action.
	 * @param {string} route - The route context.
	 */
	onSearchPopup (route: string, param?: Partial<I.PopupParam>) {
		param = param || {};
		param.data = param.data || {};

		if (S.Popup.isOpen('search')) {
			S.Popup.close('search');
		} else {
			S.Popup.open('search', {
				...param,
				preventCloseByEscape: true,
				data: { ...param.data, isPopup: this.isPopup(), route },
			});
		};
	};

	/**
	 * Handles shortcut action.
	 */
	onShortcut () {
		if (!S.Popup.isOpen('shortcut')) {
			S.Popup.open('shortcut', { preventResize: true });
		} else {
			S.Popup.close('shortcut');
		};
	};

	/**
	 * Handles lock action for a root object.
	 * @param {string} rootId - The root object ID.
	 * @param {boolean} v - Lock state.
	 * @param {string} [route] - The route context.
	 */
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

	/**
	 * Toggles lock state for the current object.
	 */
	onToggleLock () {
		const rootId = this.getRootId();
		const root = S.Block.getLeaf(rootId, rootId);
		
		if (root) {
			this.onLock(rootId, !root.isLocked(), analytics.route.shortcut);
		};
	};

	/**
	 * Sets the window title based on the current context.
	 */
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

	/**
	 * Returns true if the current context is a popup.
	 * @returns {boolean}
	 */
	isPopup () {
		return S.Popup.isOpen('page');
	};

	/**
	 * Gets the root object ID for the current context.
	 * @param {boolean} [isPopup] - Whether to get for popup context.
	 * @returns {string} The root object ID.
	 */
	getRootId (isPopup?: boolean): string {
		const match = this.getMatch(isPopup);
		return match.params.objectId || match.params.id;
	};

	/**
	 * Gets the match object for the popup context.
	 * @returns {any} The match object.
	 */
	getPopupMatch () {
		const popup = S.Popup.get('page');
		const match: any = popup ? { ...popup?.param.data.matchPopup } : {};

		match.params = Object.assign(match.params || {}, this.checkUniversalRoutes(match.route || ''));

		return match;
	};

	/**
	 * Gets the route match object from the router history.
	 * @returns {any} The route match object.
	 */
	getRouteMatch () {
		const route = U.Router.getRoute();
		const params = Object.assign(U.Router.getParam(route), this.checkUniversalRoutes(route));

		return { route, params };
	};

	checkUniversalRoutes (route: string) {
		route = String(route || '');

		const data = U.Common.searchParam(U.Router.getSearch());

		let ret: any = {};

		// Universal object route
		if (route.match(/^\/object/)) {
			ret = {
				page: 'main',
				action: 'object',
				...data,
				id: data.objectId,
			};
		};

		// Invite route
		if (route.match(/^\/invite/)) {
			ret = {
				page: 'main',
				action: 'invite',
				...data,
			};
		};

		// Membership route
		if (route.match(/^\/membership/)) {
			ret = {
				page: 'main',
				action: 'membership',
			};
		};

		return ret;
	};

	/**
	 * Gets the match object for the current context.
	 * @param {boolean} [isPopup] - Whether to get for popup context.
	 * @returns {any} The match object.
	 */
	getMatch (isPopup?: boolean) {
		const popup = undefined === isPopup ? this.isPopup() : isPopup;
		
		let ret: any = { params: {} };
		let data: any = {};

		if (popup) {
			ret = Object.assign(ret, this.getPopupMatch());
		} else {
			ret = this.getRouteMatch();
			data = U.Common.searchParam(U.Router.getSearch());
		};

		ret.route = String(ret.route || '');

		// Universal object route
		if (ret.route.match(/^\/object/)) {
			ret.params = Object.assign(ret.params, {
				page: 'main',
				action: 'object',
				...data,
				id: data.objectId,
			});
		};

		// Invite route
		if (ret.route.match(/^\/invite/)) {
			ret.params = Object.assign(ret.params, {
				page: 'main',
				action: 'invite',
				...data,
			});
		};

		// Membership route
		if (ret.route.match(/^\/membership/)) {
			ret.params = Object.assign(ret.params, {
				page: 'main',
				action: 'membership',
			});
		};

		return ret;
	};

	/**
	 * Returns true if the current context is the main view.
	 * @returns {boolean}
	 */
	isMain () {
		return this.getRouteMatch().params.page == 'main';
	};
	
	/**
	 * Returns true if the current context is the main editor.
	 * @returns {boolean}
	 */
	isMainEditor () {
		return this.isMain() && (this.getRouteMatch().params.action == 'edit');
	};

	/**
	 * Returns true if the current context is the main set view.
	 * @returns {boolean}
	 */
	isMainSet () {
		return this.isMain() && (this.getRouteMatch().params.action == 'set');
	};

	/**
	 * Returns true if the current context is the main graph view.
	 * @returns {boolean}
	 */
	isMainGraph () {
		return this.isMain() && (this.getRouteMatch().params.action == 'graph');
	};

	/**
	 * Returns true if the current context is the main chat view.
	 * @returns {boolean}
	 */
	isMainChat () {
		return this.isMain() && (this.getRouteMatch().params.action == 'chat');
	};

	/**
	 * Returns true if the current context is the main index view.
	 * @returns {boolean}
	 */
	isMainIndex () {
		return this.isMain() && (this.getRouteMatch().params.action == 'index');
	};

	/**
	 * Returns true if the current context is the main history view.
	 * @returns {boolean}
	 */
	isMainHistory () {
		return this.isMain() && (this.getRouteMatch().params.action == 'history');
	};

	/**
	 * Returns true if the current context is the main void view.
	 * @returns {boolean}
	 */
	isMainVoidError () {
		const match = this.getRouteMatch();
		return this.isMain() && (match.params.action == 'void') && (match.params.id == 'error');
	};

	/**
	 * Returns true if the current context is the main type view.
	 * @returns {boolean}
	 */
	isMainType () {
		return this.isMain() && (this.getRouteMatch().params.action == 'type');
	};

	/**
	 * Returns true if the current context is the main settings view.
	 * @returns {boolean}
	 */
	isMainSettings () {
		return this.isMain() && (this.getRouteMatch().params.action == 'settings');
	};

	/**
	 * Returns true if the current context is the auth view.
	 * @returns {boolean}
	 */
	isAuth () {
		return this.getRouteMatch().params.page == 'auth';
	};

	/**
	 * Returns true if the current context is the auth pin check view.
	 * @returns {boolean}
	 */
	isAuthPinCheck () {
		return this.isAuth() && (this.getRouteMatch().params.action == 'pin-check');
	};

	/**
	 * Returns true if the current popup context is the main view.
	 * @returns {boolean}
	 */
	isPopupMain () {
		return (this.getPopupMatch().params.page == 'main');
	};

	/**
	 * Returns true if the current popup context is the main history view.
	 * @returns {boolean}
	 */
	isPopupMainHistory () {
		return this.isPopupMain() && (this.getPopupMatch().params.action == 'history');
	};
	
	/**
	 * Sets the focus state.
	 * @param {boolean} v - The focus state.
	 */
	setFocus (v: boolean) {
		this.isFocused = v;
	};
	
	/**
	 * Sets the resize state.
	 * @param {boolean} v - The resize state.
	 */
	setResize (v: boolean) {
		this.isResizing = v;
	};
	
	/**
	 * Sets the dragging state.
	 * @param {boolean} v - The dragging state.
	 */
	setDragging (v: boolean) {
		this.isDragging = v;
	};

	/**
	 * Sets the pin checked state.
	 * @param {boolean} v - The pin checked state.
	 */
	setPinChecked (v: boolean) {
		v = Boolean(v);

		if (this.isPinChecked === v) {
			return;
		};

		this.isPinChecked = v;
		Renderer.send('setPinChecked', v);
	};

	/**
	 * Sets the source object.
	 * @param {any} source - The source object.
	 */
	setSource (source: any) {
		this.source = U.Common.objectCopy(source);
	};

	/**
	 * Sets the selection clear disabled state.
	 * @param {boolean} v - The state value.
	 */
	setSelectionClearDisabled (v: boolean) {
		this.isSelectionClearDisabled = v;
	};

	/**
	 * Sets the composition state.
	 * @param {boolean} v - The composition state.
	 */
	setComposition (v: boolean) {
		this.isComposition = v;
	};

	/**
	 * Sets the RTL (right-to-left) state.
	 * @param {boolean} v - The RTL state.
	 */
	setRtl (v: boolean) {
		this.isRtl = v;
	};

	/**
	 * Sets the shortcut editing state.
	 * @param {boolean} v - The shortcut editing state.
	 */
	setShortcutEditing (v: boolean) {
		this.isShortcutEditing = v;
	};

	/**
	 * Initializes pin check logic.
	 */
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

	/**
	 * Restores the source object from backup.
	 */
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
	
	/**
	 * Disables or enables mouse interactions.
	 * @param {boolean} v - The state value.
	 */
	disableMouse (v: boolean) {
		this.isMouseDisabled = v;
	};

	/**
	 * Disables or enables navigation.
	 * @param {boolean} v - The state value.
	 */
	disableNavigation (v: boolean) {
		this.isNavigationDisabled = v;
	};

	/**
	 * Disables or enables blur events.
	 * @param {boolean} v - The state value.
	 */
	disableBlur (v: boolean) {
		this.isBlurDisabled = v;
	};

	/**
	 * Disables or enables context menu.
	 * @param {boolean} v - The state value.
	 */
	disableContext (v: boolean) {
		this.isContextDisabled = v;
	};

	/**
	 * Disables or enables context close events.
	 * @param {boolean} v - The state value.
	 */
	disableContextClose (v: boolean) {
		this.isContextCloseDisabled = v;
	};

	/**
	 * Disables or enables context open events.
	 * @param {boolean} v - The state value.
	 */
	disableContextOpen (v: boolean) {
		this.isContextOpenDisabled = v;
	};
	
	/**
	 * Disables or enables preview events.
	 * @param {boolean} v - The state value.
	 */
	disablePreview (v: boolean) {
		this.isPreviewDisabled = v;
	};

	/**
	 * Disables or enables close events.
	 * @param {boolean} v - The state value.
	 */
	disableClose (v: boolean) {
		this.isCloseDisabled = v;
	};

	/**
	 * Disables or enables paste events.
	 * @param {boolean} v - The state value.
	 */
	disablePaste (v: boolean) {
		this.isPasteDisabled = v;
	};

	/**
	 * Disables or enables selection events.
	 * @param {boolean} v - The state value.
	 */
	disableSelection (v: boolean) {
		this.isSelectionDisabled = v;
	};

	/**
	 * Disables or enables common drop events.
	 * @param {boolean} v - The state value.
	 */
	disableCommonDrop (v: boolean) {
		this.isCommonDropDisabled = v;
	};

	/**
	 * Gets the mark parameter for the current selection.
	 * @returns {{ key: string; type: I.MarkType; param: string; }[]} The mark parameter.
	 */
	getMarkParam () {
		return [
			{ key: 'textBold',		 type: I.MarkType.Bold,		 param: '' },
			{ key: 'textItalic',	 type: I.MarkType.Italic,	 param: '' },
			{ key: 'textUnderlined', type: I.MarkType.Underline, param: '' },
			{ key: 'textStrike',	 type: I.MarkType.Strike,	 param: '' },
			{ key: 'textLink',		 type: I.MarkType.Link,		 param: '' },
			{ key: 'textCode',		 type: I.MarkType.Code,		 param: '' },
			{ key: 'textColor',		 type: I.MarkType.Color,	 param: '' },
			{ key: 'textBackground', type: I.MarkType.BgColor,	 param: '' },
		];
	};
	
	/**
	 * Returns true if the event is a special key event.
	 * @param {any} e - The event object.
	 * @returns {boolean}
	 */
	isSpecial(e: any): boolean {
		const fk = Array.from({ length: 12 }, (_, i) => `F${i + 1}`);
		const sk = new Set([
			Key.escape, Key.backspace, Key.delete, Key.tab, Key.enter, Key.shift, Key.ctrl, Key.alt, Key.meta,
			Key.left, Key.up, Key.right, Key.down,
			'PageUp', 'PageDown', 'Home', 'End', 'Insert', 'CapsLock', 
			'NumLock', 'ScrollLock', 'Pause', 'PrintScreen', 'ContextMenu', 'Dead',
			...fk,
		].map(it => it.toLowerCase()));
		
		return sk.has(this.eventKey(e));
	};

	/**
	 * Returns true if the event is an arrow key event.
	 * @param {any} e - The event object.
	 * @returns {boolean}
	 */
	isArrow (e: any): boolean {
		return [ Key.up, Key.down, Key.left, Key.right ].includes(this.eventKey(e));
	};

	/**
	 * Returns true if the event includes a command key.
	 * @param {any} e - The event object.
	 * @returns {boolean}
	 */
	withCommand (e: any): boolean {
		return e.shiftKey || e.ctrlKey || e.metaKey || e.altKey;
	};

	/**
	 * Gets the event key from the event object.
	 * @param {any} e - The event object.
	 * @returns {string} The event key.
	 */
	eventKey (e: any) {
		return e && e.key ? e.key.toLowerCase() : '';
	};

	/**
	 * Gets the meta keys from the event object.
	 * @param {any} e - The event object.
	 * @returns {string[]} The meta keys.
	 */
	metaKeys (e: any): string[] {
		const ret = [];
		if (e.shiftKey) {
			ret.push(Key.shift);
		};
		if (e.altKey) {
			ret.push(Key.alt);
		};
		if (e.ctrlKey) {
			ret.push('ctrl');
		};
		if (e.metaKey) {
			ret.push('cmd');
		};
		// Add CapsLock as a modifier if active
		if (e.getModifierState && e.getModifierState('CapsLock')) {
			ret.push('capslock');
		};
		return ret;
	};

	isCmd (e: any): boolean {
		return U.Common.isPlatformMac() ? e.metaKey : e.ctrlKey;
	};

	/**
	 * Handles a keyboard shortcut.
	 * @param {string} s - The shortcut name.
	 * @param {any} e - The event object.
	 * @param {function} callBack - The callback to execute if shortcut matches.
	 */
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

			if (!keys.length) {
				continue;
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
				res = item;
			};
		};

		if (res) {
			callBack(res);
		};
	};

	/**
	 * Gets the caption for a shortcut by ID.
	 * @param {string} id - The shortcut ID.
	 * @returns {string} The caption.
	 */
	getCaption (id: string) {
		let ret = '';
		if (this.shortcuts[id]) {
			ret = (this.shortcuts[id].symbols || []).join(' + ');
		};
		return ret;
	};

	/**
	 * Gets the keys for a shortcut by ID.
	 * @param {string} id - The shortcut ID.
	 * @returns {string[]} The keys.
	 */
	getKeys (id: string) {
		return this.shortcuts[id].keys || [];
	};

	/**
	 * Gets the symbols for a list of keys.
	 * @param {string[]} keys - The list of keys.
	 * @returns {string[]} The symbols.
	 */
	getSymbolsFromKeys (keys: string[]) {
		const isMac = U.Common.isPlatformMac();

		return keys.map((key: string) => {
			if (key === this.cmdKey()) {
				return this.cmdSymbol();
			};
			if (key == Key.shift) {
				return this.shiftSymbol();
			};
			if (key == Key.alt) {
				return this.altSymbol();
			};
			if ((key == 'ctrl') && isMac) {
				return '&#8963;';
			};
			if (key == Key.enter) {
				return '&#8629;';
			};
			if (key == Key.delete) {
				return 'Del';
			};
			if (key == Key.left) {
				return '←';
			};
			if (key == Key.up) {
				return '↑';
			};
			if (key == Key.right) {
				return '→';
			};
			if (key == Key.down) {
				return '↓';
			};
			if (key == 'comma') {
				return ',';
			};
			return U.Common.ucFirst(key);
		});
	};

	/**
	 * Gets the command symbol for the current platform.
	 * @returns {string} The command symbol.
	 */
	cmdSymbol () {
		return U.Common.isPlatformMac() ? '&#8984;' : 'Ctrl';
	};

	/**
	 * Gets the alt symbol for the current platform.
	 * @returns {string} The alt symbol.
	 */
	altSymbol () {
		return U.Common.isPlatformMac() ? '&#8997;' : 'Alt';
	};

	/**
	 * Gets the shift symbol for the current platform.
	 * @returns {string} The shift symbol.
	 */
	shiftSymbol () {
		return '&#x21E7;';
	};

	/**
	 * Gets the command key for the current platform.
	 * @returns {string} The command key.
	 */
	cmdKey () {
		return U.Common.isPlatformMac() ? 'cmd' : 'ctrl';
	};

};

export enum Key {
	backspace	 = 'backspace',
	delete		 = 'delete',
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
