import { I, C, S, U, J, focus, analytics, Renderer, Preview, Storage, translate, Mapper, keyboard } from 'Lib';

const Diff = require('diff');

class Action {

	/**
	 * Closes a page and clears related data and subscriptions.
	 * @param {string} rootId - The root object ID.
	 * @param {boolean} withCommand - Whether to send a close command to the backend.
	 */
	pageClose (rootId: string, withCommand: boolean) {
		if (keyboard.isCloseDisabled) {
			return;
		};

		const { widgets } = S.Block;
		const { space } = S.Common;

		// Prevent closing of system objects
		if ([ widgets ].includes(rootId)) {
			return;
		};

		const blocks = S.Block.getBlocks(rootId);
		const object = S.Detail.get(rootId, rootId);

		if (object.layout == I.ObjectLayout.Space) {
			this.dbClearChat(object.chatId, J.Constant.blockId.chat);
		};

		for (const block of blocks) {
			if (block.isDataview()) {
				this.dbClearBlock(rootId, block.id);
			} else 
			if (block.isChat()) {
				this.dbClearBlock(object.chatId, block.id);
				this.dbClearChat(object.chatId, block.id);
			};
		};

		this.dbClearRoot(rootId);
		S.Block.clear(rootId);

		U.Subscription.destroyList([ rootId ]);

		if (withCommand) {
			C.ObjectClose(rootId, space);
		};
	};

	/**
	 * Clears all data related to a root object.
	 * @param {string} rootId - The root object ID.
	 */
	dbClearRoot (rootId: string) {
		if (!rootId) {
			return;
		};

		S.Record.metaClear(rootId, '');
		S.Record.recordsClear(rootId, '');
		S.Detail.clear(rootId);
	};

	/**
	 * Clears all data related to a block.
	 * @param {string} rootId - The root object ID.
	 * @param {string} blockId - The block ID.
	 */
	dbClearBlock (rootId: string, blockId: string) {
		if (!rootId || !blockId) {
			return;
		};

		const subId = S.Record.getSubId(rootId, blockId);
		const groups = S.Record.getGroups(rootId, blockId);

		S.Record.metaClear(subId, '');
		S.Record.recordsClear(subId, '');
		S.Record.recordsClear(`${subId}/dep`, '');
		S.Record.viewsClear(rootId, blockId);

		const groupIds = groups.map(it => it.id).concat('groups');
		
		groupIds.forEach(id => {
			S.Record.recordsClear(S.Record.getGroupSubId(rootId, blockId, id), '');
		});

		S.Record.groupsClear(rootId, blockId);
		S.Detail.clear(subId);

		U.Subscription.destroyList(groupIds.concat([ subId ]), true);
	};

	/**
	 * Clears all data related to a chat block.
	 * @param {string} chatId - The chat object ID.
	 * @param {string} blockId - The block ID.
	 */
	dbClearChat (chatId: string, blockId: string) {	
		if (!chatId || !blockId) {
			return;
		};

		const subId = S.Record.getSubId(chatId, blockId);

		C.ChatUnsubscribe(chatId, subId);
		S.Chat.clear(subId);
	};

	/**
	 * Uploads a file to a block.
	 * @param {I.FileType} type - The file type.
	 * @param {string} rootId - The root object ID.
	 * @param {string} blockId - The block ID.
	 * @param {string} url - The file URL.
	 * @param {string} path - The file path.
	 * @param {function} [callBack] - Optional callback after upload.
	 */
	upload (type: I.FileType, rootId: string, blockId: string, url: string, path: string, callBack?: (message: any) => void) {
		C.BlockUpload(rootId, blockId, url, path, (message: any) => {
			if (callBack) {
				callBack(message);
			};

			analytics.event('UploadMedia', { type: type, middleTime: message.middleTime });
		});
	};
	
	/**
	 * Duplicates a list of blocks to a target context and position.
	 * @param {string} rootId - The root object ID.
	 * @param {string} targetContextId - The target context ID.
	 * @param {string} blockId - The block ID to duplicate after.
	 * @param {string[]} blockIds - The block IDs to duplicate.
	 * @param {I.BlockPosition} position - The position to insert.
	 * @param {function} [callBack] - Optional callback after duplication.
	 */
	duplicate (rootId: string, targetContextId: string, blockId: string, blockIds: string[], position: I.BlockPosition, callBack?: (message: any) => void) {
		C.BlockListDuplicate(rootId, targetContextId, blockIds, blockId, position, (message: any) => {
			if (message.error.code) {
				return;
			};

			const lastId = message.blockIds && message.blockIds.length ? message.blockIds[message.blockIds.length - 1] : '';
			this.focusToEnd(rootId, lastId);

			if (callBack) {
				callBack(message);
			};

			analytics.event('DuplicateBlock', { count: message.blockIds.length });
		});
	};

	/**
	 * Moves a list of blocks to a target context and position.
	 * @param {string} contextId - The source context ID.
	 * @param {string} targetContextId - The target context ID.
	 * @param {string} targetId - The target block ID.
	 * @param {string[]} blockIds - The block IDs to move.
	 * @param {I.BlockPosition} position - The position to insert.
	 * @param {function} [callBack] - Optional callback after move.
	 */
	move (contextId: string, targetContextId: string, targetId: string, blockIds: string[], position: I.BlockPosition, callBack?: (message: any) => void) {
		C.BlockListMoveToExistingObject(contextId, targetContextId, targetId, blockIds, position, (message: any) => {
			if (message.error.code) {
				return;
			};

			if (callBack) {
				callBack(message);
			};

			const count = blockIds.length;

			if (contextId != targetContextId) {
				Preview.toastShow({ action: I.ToastAction.Move, originId: contextId, targetId: targetContextId, count });
			};

			analytics.event(contextId != targetContextId ? 'MoveBlock' : 'ReorderBlock', { count });
		});
	};

	/**
	 * Removes a list of blocks from a root object.
	 * @param {string} rootId - The root object ID.
	 * @param {string} blockId - The block ID to focus after removal.
	 * @param {string[]} blockIds - The block IDs to remove.
	 */
	remove (rootId: string, blockId: string, blockIds: string[]) {
		const next = S.Block.getNextBlock(rootId, blockId, -1, (it: any) => {
			return it.type == I.BlockType.Text;
		});
		
		C.BlockListDelete(rootId, blockIds, (message: any) => {
			if (message.error.code) {
				return;
			};

			if (next) {
				this.focusToEnd(rootId, next.id);
			};

			analytics.event('DeleteBlock', { count: blockIds.length });
		});
	};

	/**
	 * Removes a widget block and updates storage.
	 * @param {string} id - The widget block ID.
	 * @param {any} target - The target parameter for analytics.
	 */
	removeWidget (id: string, target: any) {
		const { widgets } = S.Block;
		const block = S.Block.getLeaf(widgets, id);

		if (!block) {
			return;
		};

		const { layout } = block.content;

		C.BlockListDelete(widgets, [ id ]);
		Storage.setToggle('widget', id, false);
		Storage.deleteToggle(`widget${id}`);

		const childrenIds = S.Block.getChildrenIds(widgets, id);
		if (childrenIds.length) {
			Storage.deleteToggle(`widget${childrenIds[0]}`);
		};

		analytics.event('DeleteWidget', { layout, params: { target } });
	};

	/**
	 * Focuses the end of a block for editing.
	 * @param {string} rootId - The root object ID.
	 * @param {string} id - The block ID to focus.
	 */
	focusToEnd (rootId: string, id: string) {
		const block = S.Block.getLeaf(rootId, id);
		if (!block) {
			return;
		};

		const length = block.getLength();
		focus.set(id, { from: length, to: length });
		focus.apply();
	};

	/**
	 * Opens a URL, routing internally if possible.
	 * @param {string} url - The URL to open.
	 */
	openUrl (url: string) {
		if (!url) {
			return;
		};

		url = U.Common.urlFix(url);

		const route = U.Common.getRouteFromUrl(url);
		
		if (route) {
			U.Router.go(route, {});
			return;
		};

		const scheme = U.Common.getScheme(url);
		const cb = () => Renderer.send('openUrl', url);
		const allowedSchemes = J.Constant.allowedSchemes.concat(J.Constant.protocol);
		const isAllowed = allowedSchemes.includes(scheme);
		const isDangerous = [ 
			'javascript', 
			'data', 
			'ws', 
			'wss', 
			'chrome', 
			'about', 
			'ssh', 
			'blob',
			'ms-msdt',
			'search-ms',
			'ms-officecmd',
		].includes(scheme);
		const storageKey = isDangerous ? '' : 'openUrl';

		if (isDangerous || (!Storage.get(storageKey) && !isAllowed)) {
			S.Popup.open('confirm', {
				data: {
					icon: 'confirm',
					title: translate('popupConfirmOpenExternalLinkTitle'),
					text: U.Common.sprintf(translate('popupConfirmOpenExternalLinkText'), U.Common.shorten(url, 120)),
					textConfirm: translate('commonYes'),
					storageKey,
					onConfirm: () => cb(),
				}
			});
		} else {
			cb();
		};
	};

	/**
	 * Opens a file path using the system's default handler.
	 * @param {string} path - The file path to open.
	 */
	openPath (path: string) {
		if (path) {
			Renderer.send('openPath', path);
		};
	};

	/**
	 * Opens a file by ID and route, downloading it if necessary.
	 * @param {string} id - The file ID.
	 * @param {string} route - The route context for analytics.
	 */
	openFile (id: string, route: string) {
		if (!id) {
			return;
		};

		C.FileDownload(id, U.Common.getElectron().tmpPath(), (message: any) => {
			if (message.path) {
				this.openPath(message.path);
				analytics.event('OpenMedia', { route });
			};
		});
	};

	/**
	 * Downloads a file by ID and route, optionally as an image.
	 * @param {string} id - The file ID.
	 * @param {string} route - The route context for analytics.
	 * @param {boolean} isImage - Whether to treat the file as an image.
	 */
	downloadFile (id: string, route: string, isImage: boolean) {
		if (!id) {
			return;
		};
		
		const url = isImage ? S.Common.imageUrl(id, 0) : S.Common.fileUrl(id);

		Renderer.send('download', url, { saveAs: true });
		analytics.event('DownloadMedia', { route });
	};

	/**
	 * Opens a file dialog for selecting files.
	 * @param {any} param - Dialog parameters.
	 * @param {function} [callBack] - Optional callback with selected paths.
	 */
	openFileDialog (param: any, callBack?: (paths: string[]) => void) {
		param = Object.assign({
			extensions: [],
			properties: [],
		}, param);

		const properties = param.properties || [];
		const extensions = param.extensions || [];

		const options: any = Object.assign(param, { 
			properties: [ 'openFile' ].concat(properties),
		});

		if (extensions.length) {
			options.filters = [ 
				{ name: 'Filtered extensions', extensions },
			];
		};
		
		U.Common.getElectron().showOpenDialog(options).then(({ filePaths }) => {
			if ((typeof filePaths === 'undefined') || !filePaths.length) {
				return;
			};
			
			if (callBack) {
				callBack(filePaths);
			};
		});
	};

	/**
	 * Opens a directory dialog for selecting folders.
	 * @param {any} param - Dialog parameters.
	 * @param {function} [callBack] - Optional callback with selected paths.
	 */
	openDirectoryDialog (param: any, callBack?: (paths: string[]) => void) {
		param = Object.assign({}, param);

		const options = Object.assign(param, { 
			properties: [ 'openDirectory' ],
		});

		U.Common.getElectron().showOpenDialog(options).then(({ filePaths }) => {
			if ((typeof filePaths === 'undefined') || !filePaths.length) {
				return;
			};

			if (callBack) {
				callBack(filePaths);
			};
		});
	};

	/**
	 * Deletes a list of objects by IDs, with confirmation and analytics.
	 * @param {string[]} ids - The object IDs to delete.
	 * @param {string} route - The route context for analytics.
	 * @param {function} [callBack] - Optional callback after deletion.
	 */
	delete (ids: string[], route: string, callBack?: () => void): void {
		const count = ids.length;

		if (!U.Space.canMyParticipantWrite()) {
			S.Popup.open('confirm', {
				data: {
					title: translate('popupConfirmActionRestrictedTitle'),
					text: translate('popupConfirmActionRestrictedText'),
					textConfirm: translate('commonOk'),
					canCancel: false
				},
			});
			return;
		};

		analytics.event('ShowDeletionWarning');

		S.Popup.open('confirm', {
			data: {
				title: U.Common.sprintf(translate('popupConfirmDeleteWarningTitle'), count, U.Common.plural(count, translate('pluralObject'))),
				text: translate('popupConfirmDeleteWarningText'),
				textConfirm: translate('commonDelete'),
				onConfirm: () => { 
					Storage.deleteLastOpenedByObjectId(ids);
					C.ObjectListDelete(ids); 

					const isPopup = keyboard.isPopup();
					const match = keyboard.getMatch();

					if (ids.includes(match.params.id)) {
						if (isPopup) {
							S.Popup.close('page');
						} else {
							U.Space.openDashboard();
						};
					};

					if (callBack) {
						callBack();
					};

					analytics.event('RemoveCompletely', { count, route });
				},
				onCancel: () => {
					if (callBack) {
						callBack();
					};
				},
			},
		});
	};

	/**
	 * Restores an account from a backup file, handling import and selection.
	 * @param {function} onError - Callback for error handling, returns true to abort.
	 */
	restoreFromBackup (onError: (error: { code: number, description: string }) => boolean) {
		const { networkConfig } = S.Auth;
		const { dataPath } = S.Common;
		const { mode, path } = networkConfig;

		this.openFileDialog({ extensions: [ 'zip' ] }, paths => {
			C.AccountRecoverFromLegacyExport(paths[0], dataPath, U.Common.rand(1, J.Constant.count.icon), (message: any) => {
				if (onError(message.error)) {
					return;
				};

				const { accountId, spaceId } = message;

				C.ObjectImport(spaceId, { paths, noCollection: true }, [], false, I.ImportType.Protobuf, I.ImportMode.AllOrNothing, false, true, false, false, (message: any) => {
					if (onError(message.error)) {
						return;
					};

					C.AccountSelect(accountId, dataPath, mode, path, (message: any) => {
						const { account } = message;

						if (onError(message.error) || !account) {
							return;
						};

						S.Auth.accountSet(account);
						S.Common.configSet(account.config, false);

						const routeParam = {
							replace: true,
							animate: true,
							onFadeIn: () => {
								S.Popup.open('migration', { data: { type: 'import' } });
								S.Block.closeRecentWidgets();
							},
						};

						U.Data.onInfo(account.info);
						U.Data.onAuthWithoutSpace(routeParam);
						U.Data.onAuthOnce(true);
					});
				});
			});
		});
	};

	/**
	 * Archives a list of objects by IDs.
	 * @param {string[]} ids - The object IDs to archive.
	 * @param {string} route - The route context for analytics.
	 * @param {function} [callBack] - Optional callback after archiving.
	 */
	archive (ids: string[], route: string, callBack?: () => void) {
		C.ObjectListSetIsArchived(ids, true, (message: any) => {
			if (message.error.code) {
				return;
			};

			Preview.toastShow({ action: I.ToastAction.Archive, ids });
			analytics.event('MoveToBin', { route, count: ids.length });

			if (callBack) {
				callBack();
			};
		});
	};

	/**
	 * Restores objects from the archive (bin).
	 * @param {string[]} ids - The object IDs to restore.
	 * @param {string} route - The route context for analytics.
	 * @param {function} [callBack] - Optional callback after restore.
	 */
	restore (ids: string[], route: string, callBack?: () => void) {
		ids = ids || [];

		C.ObjectListSetIsArchived(ids, false, (message: any) => {
			if (message.error.code) {
				return;
			};

			analytics.event('RestoreFromBin', { route, count: ids.length });

			if (callBack) {
				callBack();
			};
		});
	};

	/**
	 * Imports objects into the current space from selected files.
	 * @param {I.ImportType} type - The import type.
	 * @param {string[]} extensions - Allowed file extensions.
	 * @param {any} [options] - Additional import options.
	 * @param {function} [callBack] - Optional callback after import.
	 */
	import (type: I.ImportType, extensions: string[], options?: any, callBack?: (message: any) => void) {
		const fileOptions: any = { 
			properties: [ 'openFile', 'multiSelections' ],
			filters: [
				{ name: 'Filtered extensions', extensions },
			],
		};

		if (U.Common.isPlatformMac()) {
			fileOptions.properties.push('openDirectory');
		};

		analytics.event('ClickImport', { type });

		U.Common.getElectron().showOpenDialog(fileOptions).then((result: any) => {
			const paths = result.filePaths;
			if ((paths == undefined) || !paths.length) {
				return;
			};

			analytics.event('ClickImportFile', { type });
			Preview.toastShow({ text: translate('toastImportStart') });

			C.ObjectImport(S.Common.space, Object.assign(options || {}, { paths }), [], true, type, I.ImportMode.IgnoreErrors, false, false, false, false, (message: any) => {
				if (message.error.code) {
					return;
				};

				if (callBack) {	
					callBack(message);
				};
			});
		});
	};

	/**
	 * Exports objects from the current space to a selected directory.
	 * @param {string} spaceId - The space ID.
	 * @param {string[]} ids - The object IDs to export.
	 * @param {I.ExportType} type - The export type.
	 * @param {any} param - Export parameters.
	 * @param {function} [onSelectPath] - Optional callback after path selection.
	 * @param {function} [callBack] - Optional callback after export.
	 */
	export (spaceId: string, ids: string[], type: I.ExportType, param: any, onSelectPath?: () => void, callBack?: (message: any) => void): void {
		const { zip, nested, files, archived, json, route } = param;

		this.openDirectoryDialog({ buttonLabel: translate('commonExport') }, paths => {
			if (onSelectPath) {
				onSelectPath();
			};

			C.ObjectListExport(spaceId, paths[0], ids, type, zip, nested, files, archived, json, (message: any) => {
				if (message.error.code) {
					return;
				};

				this.openPath(paths[0]);
				analytics.event('Export', { type, middleTime: message.middleTime, route });

				if (callBack) {
					callBack(message);
				};
			});
		});
	};

	/**
	 * Copies or cuts blocks to the clipboard.
	 * @param {string} rootId - The root object ID.
	 * @param {string[]} ids - The block IDs to copy or cut.
	 * @param {boolean} isCut - Whether to cut (true) or copy (false).
	 */
	copyBlocks (rootId: string, ids: string[], isCut: boolean) {
		const root = S.Block.getLeaf(rootId, rootId);
		if (!root) {
			return;
		};

		const { focused } = focus.state;

		if (root.isLocked() && !ids.length) {
			return;
		};

		const range = U.Common.objectCopy(focus.state.range);
		const cmd = isCut ? 'BlockCut' : 'BlockCopy';
		const tree = S.Block.wrapTree(rootId, rootId);

		let next = null;
		let blocks = S.Block.unwrapTree([ tree ]).filter(it => ids.includes(it.id));

		ids.forEach((id: string) => {
			const block = S.Block.getLeaf(rootId, id);
			if (block && block.isTable()) {
				blocks = blocks.concat(S.Block.unwrapTree([ S.Block.wrapTree(rootId, block.id) ]));
			};
		});

		blocks = U.Common.arrayUniqueObjects(blocks, 'id');
		blocks = blocks.map((it: I.Block) => {
			const element = S.Block.getMapElement(rootId, it.id);
			if (!element) {
				return null;
			};

			if (it.type == I.BlockType.Dataview) {
				it.content.views = S.Record.getViews(rootId, it.id);
			};

			it.childrenIds = element.childrenIds;
			return it;
		}).filter(it => it);

		if (isCut) {
			next = S.Block.getNextBlock(rootId, focused, -1, it => it.isFocusable());
		};

		C[cmd](rootId, blocks, range, (message: any) => {
			U.Common.clipboardCopy({
				text: message.textSlot,
				html: message.htmlSlot,
				anytype: {
					range,
					blocks: (message.anySlot || []).map(Mapper.From.Block),
				},
			});

			if (isCut) {
				S.Menu.closeAll([ 'blockContext', 'blockAction' ]);

				if (next) {
					const l = next.getLength();

					focus.set(next.id, { from: l, to: l });
					focus.apply();
				};
			};
		});

		analytics.event(isCut ? 'CutBlock' : 'CopyBlock', { count: blocks.length });
	};

	/**
	 * Creates a new space with the given UX type and route.
	 * @param {I.SpaceUxType} uxType - The UX type for the new space.
	 * @param {string} route - The route context for analytics.
	 */
	createSpace (uxType: I.SpaceUxType, route: string) {
		if (!U.Space.canCreateSpace()) {
			return;
		};

		S.Popup.closeAll(null, () => {
			S.Popup.open('spaceCreate', { data: { uxType, route } });
		});
	};

	/**
	 * Removes a space by ID, showing a confirmation dialog.
	 * @param {string} id - The space ID.
	 * @param {string} route - The route context for analytics.
	 * @param {function} [callBack] - Optional callback after removal.
	 */
	removeSpace (id: string, route: string, forceDelete?: boolean, callBack?: (message: any) => void) {
		const space = U.Space.getSpaceviewBySpaceId(id);

		if (!space) {
			return;
		};

		const isOwner = U.Space.isMyOwner(id);
		const name = isOwner ? space.name : U.Common.shorten(space.name, 32);
		const suffix = isOwner ? 'Delete' : 'Leave';
		const confirmMessage = isOwner ? space.name : '';

		let title = U.Common.sprintf(translate(`space${suffix}WarningTitle`), name);
		let text = U.Common.sprintf(translate(`space${suffix}WarningText`), name);
		let confirm = isOwner ? translate('commonDelete') : translate('commonLeaveSpace');
		let toast = U.Common.sprintf(translate(`space${suffix}Toast`), name);

		if (forceDelete) {
			title = U.Common.sprintf(translate('spaceDeleteWarningTitle'), name);
			text = U.Common.sprintf(translate('spaceLeaveWarningText'), name);
			toast = U.Common.sprintf(translate('spaceDeleteToast'), name);
			confirm = translate('commonDelete');
		};

		analytics.event(`Click${suffix}Space`, { route });

		S.Popup.open('confirm', {
			data: {
				icon: 'confirm',
				title,
				text,
				textConfirm: confirm,
				colorConfirm: 'red',
				confirmMessage,
				onConfirm: () => {
					analytics.event(`Click${suffix}SpaceWarning`, { type: suffix, route });

					C.SpaceDelete(id, (message: any) => {
						if (callBack) {
							callBack(message);
						};

						if (!message.error.code) {
							Preview.toastShow({ text: toast });
							analytics.event(`${suffix}Space`, { type: space.spaceAccessType, route });
						};
					});
				},
				onCancel: () => {
					analytics.event(`Click${suffix}SpaceWarning`, { type: 'Cancel', route });
				}
			},
		});
	};

	/**
	 * Sets the interface language and optionally the spelling language.
	 * @param {string} id - The language ID.
	 */
	setInterfaceLang (id: string) {
		Renderer.send('setInterfaceLang', id);
		analytics.event('SwitchInterfaceLanguage', { type: id });
	};

	/**
	 * Checks and sets the default spelling language based on the interface language.
	 */
	checkDefaultSpellingLang () {
		const { config } = S.Common;
		const { languages, interfaceLang } = config;

		if (!Storage.get('setSpellingLang') && !languages.length) {
			const check = J.Lang.interfaceToSpellingLangMap[interfaceLang] || J.Constant.default.spellingLang;

			this.setSpellingLang([ check ]);
			Storage.set('setSpellingLang', true);
		};
	};

	/**
	 * Sets the spelling languages for the app.
	 * @param {string[]} langs - The list of language codes.
	 */
	setSpellingLang (langs: string[]) {
		langs = langs || [];

		const diff = Diff.diffArrays(S.Common.config.languages || [], langs);

		S.Common.configSet({ languages: langs }, false);
		Renderer.send('setSpellingLang', langs);

		diff.forEach(it => {
			if (it.added && it.value.length) {
				analytics.event('AddSpellcheckLanguage', { type: it.value[0] });
			};
		});
	};

	/**
	 * Imports a usecase into a space.
	 * @param {string} spaceId - The space ID.
	 * @param {I.Usecase} id - The usecase ID.
	 * @param {function} [callBack] - Optional callback after import.
	 */
	importUsecase (spaceId: string, id: I.Usecase, callBack?: (message: any) => void) {
		C.ObjectImportUseCase(spaceId, id, (message: any) => {
			S.Block.closeRecentWidgets();

			if (callBack) {
				callBack(message);
			};
		});
	};

	/**
	 * Creates a widget from an object and adds it to the widgets block.
	 * @param {string} rootId - The root object ID.
	 * @param {string} objectId - The object ID to create a widget from.
	 * @param {string} targetId - The target block ID for insertion.
	 * @param {I.BlockPosition} position - The position to insert the widget.
	 * @param {string} [route] - The route context for analytics.
	 */
	createWidgetFromObject (rootId: string, objectId: string, targetId: string, position: I.BlockPosition, route?: string) {
		const object = S.Detail.get(rootId, objectId);

		let layout = I.WidgetLayout.Link;

		if (object && !object._empty_) {
			if (U.Object.isInFileOrSystemLayouts(object.layout) || U.Object.isDateLayout(object.layout)) {
				layout = I.WidgetLayout.Link;
			} else 
			if (U.Object.isInSetLayouts(object.layout)) {
				layout = I.WidgetLayout.View;
			} else
			if (U.Object.isInPageLayouts(object.layout)) {
				layout = I.WidgetLayout.Tree;
			};
		};

		const limit = Number(U.Menu.getWidgetLimitOptions(layout)[0]?.id) || 0;
		const newBlock = { 
			type: I.BlockType.Link,
			content: { targetBlockId: objectId },
		};

		C.BlockCreateWidget(S.Block.widgets, targetId, newBlock, position, layout, limit, (message: any) => {
			analytics.createWidget(layout, route);
		});
	};

	removeWidgetsForObjects (objectIds: string[], callBack?: (message: any) => void) {
		const { widgets } = S.Block;
		const list = S.Block.getBlocks(widgets, (block: I.Block) => {
			if (!block.isWidget()) {
				return false;
			};

			const childrenIds = S.Block.getChildrenIds(widgets, block.id);
			if (!childrenIds.length) {
				return false;
			};

			const child = S.Block.getLeaf(widgets, childrenIds[0]);
			if (!child) {
				return false;
			};

			const target = child.getTargetObjectId();
			return objectIds.includes(target);
		});

		C.BlockListDelete(widgets, list.map(it => it.id), callBack);
	};

	toggleWidgetsForObject (objectId: string, route?: string) {
		if (S.Block.getWidgetsForTarget(objectId, I.WidgetSection.Pin).length) {
			this.removeWidgetsForObjects([ objectId ]);
		} else {
			this.createWidgetFromObject(objectId, objectId, '', I.BlockPosition.InnerFirst, route);
		};
	};

	membershipUpgrade (tier?: I.TierType) {
		if (!U.Common.checkCanMembershipUpgrade()) {
			this.membershipUpgradeViaEmail();
			return;
		};

		U.Object.openRoute(
			{ id: 'membership', layout: I.ObjectLayout.Settings },
			{
				onRouteChange: () => {
					S.Popup.open('membership', {
						data: { tier: tier ? tier : I.TierType.Builder }
					});
				}
			},
		);
	};

	/**
	 * Opens a membership upgrade confirmation popup.
	 */
	membershipUpgradeViaEmail () {
		S.Popup.open('confirm', {
			data: {
				title: translate('popupConfirmMembershipUpgradeTitle'),
				text: translate('popupConfirmMembershipUpgradeText'),
				textConfirm: translate('popupConfirmMembershipUpgradeButton'),
				onConfirm: () => keyboard.onMembershipUpgradeViaEmail(),
				canCancel: false
			}
		});
	};

	/**
	 * Opens a confirmation popup to revoke a space invite link.
	 * @param {string} spaceId - The space ID.
	 * @param {function} [callBack] - Optional callback after revocation.
	 */
	inviteRevoke (spaceId: string, callBack?: () => void) {
		S.Popup.open('confirm', {
			data: {
				title: translate('popupConfirmRevokeLinkTitle'),
				text: translate('popupConfirmRevokeLinkText'),
				textConfirm: translate('popupConfirmRevokeLinkConfirm'),
				colorConfirm: 'red',
				noCloseOnConfirm: true,
				onConfirm: () => {
					C.SpaceInviteRevoke(spaceId, (message: any) => {
						if (message.error.code) {
							S.Popup.updateData('confirm', { error: message.error.description });
							return;
						};

						if (callBack) {
							callBack();
						};

						Preview.toastShow({ text: translate('toastInviteRevoke') });
						S.Popup.close('confirm');
						analytics.event('RevokeShareLink');
					});
				},
			},
		});

		analytics.event('ScreenRevokeShareLink');
	};

	/**
	 * Adds objects to a collection by target ID.
	 * @param {string} targetId - The collection target ID.
	 * @param {string[]} objectIds - The object IDs to add.
	 */
	addToCollection (targetId: string, objectIds: string[]) {
		const collectionType = S.Record.getCollectionType();

		C.ObjectCollectionAdd(targetId, objectIds, (message: any) => {
			if (message.error.code) {
				return;
			};

			Preview.toastShow({ action: I.ToastAction.Collection, objectId: objectIds[0], targetId });
			analytics.event('LinkToObject', { objectType: collectionType?.id, linkType: 'Collection' });
		});
	};

	/**
	 * Sets the application theme and notifies the renderer.
	 * @param {string} id - The theme ID.
	 */
	themeSet (id: string) {
		S.Common.themeSet(id);
		Renderer.send('setTheme', id);
		analytics.event('ThemeSet', { id });
	};

	/**
	 * Toggles a relation as featured for a given object.
	 * @param {string} rootId - The root object ID.
	 * @param {string} relationKey - The relation key to toggle.
	 * @returns {null|void} Returns null if the relation is not found.
	 */
	toggleFeatureRelation (rootId: string, relationKey: string) {
		const object = S.Detail.get(rootId, rootId, [ 'featuredRelations' ], true);
		const featured = U.Common.objectCopy(object.featuredRelations || []);
		const relation = S.Record.getRelationByKey(relationKey);

		if (!relation) {
			return null;
		};

		if (!featured.includes(relationKey)) {
			C.ObjectRelationAddFeatured(rootId, [ relationKey ], () => analytics.event('FeatureRelation', { relationKey, format: relation.format }));
		} else {
			C.ObjectRelationRemoveFeatured(rootId, [ relationKey ], () => analytics.event('UnfeatureRelation', { relationKey, format: relation.format }));
		};
	};

	checkDiskSpace (callBack?: () => void) {
		Renderer.send('checkDiskSpace').then(diskSpace => {
			if (!diskSpace) {
				if (callBack) {
					callBack();
				};
				return;
			};

			const { free } = diskSpace;

			if (free <= 1024 * 1024 * 1024) { // less than 1GB
				S.Popup.open('confirm', {
					onClose: callBack,
					data: {
						icon: 'warning',
						title: translate('popupConfirmDiskSpaceTitle'),
						text: translate('popupConfirmDiskSpaceText'),
						textConfirm: translate('commonOkay'),
						canCancel: false,
					},
				});
			} else 
			if (callBack) {
				callBack();
			};
		});
	};

	spaceInfo () {
		const { account } = S.Auth;
		const space = U.Space.getSpaceview();
		const creator = U.Space.getCreator(space.targetSpaceId, space.creator);
		const data = [
			[ translate(`popupSettingsSpaceIndexSpaceIdTitle`), space.targetSpaceId ],
			[ translate(`popupSettingsSpaceIndexCreatedByTitle`), creator.globalName || creator.identity ],
			[ translate(`popupSettingsSpaceIndexNetworkIdTitle`), account.info.networkId ],
			[ translate(`popupSettingsSpaceIndexCreationDateTitle`), U.Date.dateWithFormat(S.Common.dateFormat, space.createdDate) ],
		];

		S.Popup.open('confirm', {
			className: 'isWide spaceInfo',
			data: {
				title: translate('popupSettingsSpaceIndexSpaceInfoTitle'),
				text: data.map(it => `<dl><dt>${it[0]}:</dt><dd>${it[1]}</dd></dl>`).join(''),
				textConfirm: translate('commonCopy'),
				colorConfirm: 'blank',
				canCancel: false,
				onConfirm: () => {
					U.Common.copyToast(translate('libKeyboardTechInformation'), data.map(it => `${it[0]}: ${it[1]}`).join('\n'));
				},
			}
		});

		analytics.event('ScreenSpaceInfo');
	};

	emptyBin (route: string, callBack?: () => void) {
		U.Subscription.search({
			filters: [
				{ relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: true },
			],
			ignoreArchived: false,
		}, (message: any) => {
			if (!message.error.code) {
				this.delete((message.records || []).map(it => it.id), route, callBack);
			};
		});
	};

	openSettings (id: string, route: string) {
		U.Object.openRoute({ 
			id, 
			layout: I.ObjectLayout.Settings,
			_routeParam_: { 
				additional: [ 
					{ key: 'route', value: route },
				],
			},
		});
	};

	openSpaceShare (route: string) {
		this.openSettings('spaceShare', route);
	};

};

export default new Action();