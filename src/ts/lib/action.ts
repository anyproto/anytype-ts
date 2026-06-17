

import * as Diff from 'diff';
import * as I from 'Interface';
import Storage from 'Lib/storage';
import { focus } from 'Lib/focus';

class Action {

	/**
	 * Closes a page and clears related data and subscriptions.
	 * @param {string} rootId - The root object ID.
	 * @param {boolean} withCommand - Whether to send a close command to the backend.
	 */
	pageClose (isPopup: boolean, rootId: string, withCommand: boolean) {
		if (!rootId || keyboard.isCloseDisabled || !U.Data.checkPageClose(isPopup, rootId)) {
			return;
		};

		// Prevent closing of system objects
		if (rootId == S.Block.widgets) {
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
				this.dbClearChat(object.chatId, block.id);
				this.dbClearChat(object.id, block.id);
			};
		};

		this.dbClearRoot(rootId);
		S.Block.clear(rootId);

		U.Subscription.destroyList([ rootId ]);

		if (withCommand) {
			C.ObjectClose(rootId, S.Common.space);
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
			callBack?.(message);
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

			callBack?.(message);
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

			callBack?.(message);

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

		url = U.String.urlFix(url);

		const route = U.Common.getRouteFromUrl(url);
		if (route) {
			U.Router.go(route, {});
			return;
		};

		const scheme = U.String.urlScheme(url);
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
					iconParam: { name: 'popup/header/confirm', color: 'orange' },
					title: translate('popupConfirmOpenExternalLinkTitle'),
					text: U.String.sprintf(translate('popupConfirmOpenExternalLinkText'), U.String.shorten(url, 120)),
					textConfirm: translate('commonYes'),
					storageKey,
					onConfirm: cb,
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
	openFile (object: any, route: string) {
		if (object._empty_ || S.Common.isDownloading(object.id)) {
			return;
		};

		const ext = String(object.fileExt || '').toLowerCase();
		const cb = () => {
			S.Common.downloadStart(object.id);
			C.FileDownload(object.id, U.Common.getElectron().downloadPath(), (message: any) => {
				S.Common.downloadDone(object.id);
				if (message.path) {
					this.openPath(message.path);
					analytics.event('OpenMedia', { route });
				};
			});
		};
		const isDangerous = !ext || [
			'exe', 'bat', 'cmd', 'com', 'cpl', 'scr', 'msi', 'msp', 'pif', 'reg', 'vbs', 'vbe', 'ws', 'wsf', 'wsh', 'ps1', 'jar',
			'app', 'action', 'command', 'csh', 'osx', 'scpt', 'workflow', 'bin', 'ksh', 'out', 'run', 'sh', 'docm', 'xlsm', 'pptm',
		].includes(ext);

		if (isDangerous) {
			S.Popup.open('confirm', {
				data: {
					iconParam: { name: 'popup/header/confirm', color: 'orange' },
					title: translate('popupConfirmOpenExternalFileTitle'),
					text: U.String.sprintf(translate('popupConfirmOpenExternalFileText'), U.Object.name(object)),
					textConfirm: translate('commonYes'),
					onConfirm: cb,
				},
			});
		} else {
			cb();
		};
	};

	/**
	 * Downloads a file by ID and route, optionally as an image.
	 * @param {string} id - The file ID.
	 * @param {string} route - The route context for analytics.
	 * @param {boolean} isImage - Whether to treat the file as an image.
	 */
	downloadFile (id: string, route: string, isImage: boolean) {
		this.downloadFiles([ { id, isImage } ], route);
	};

	/**
	 * Downloads multiple files into a single chosen directory using one dialog.
	 * @param {{ id: string, isImage: boolean }[]} files - The files to download.
	 * @param {string} route - The route context for analytics.
	 */
	downloadFiles (files: { id: string, isImage: boolean }[], route: string) {
		files = (files || []).filter(it => it.id && !S.Common.isDownloading(it.id));

		if (!files.length) {
			return;
		};

		this.openDirectoryDialog({ buttonLabel: translate('commonDownload') }, paths => {
			files.forEach(file => {
				const url = file.isImage ? S.Common.imageUrl(file.id, 0) : S.Common.fileUrl(file.id);

				S.Common.downloadStart(file.id);

				const promise = Renderer.send('download', url, { directory: paths[0] });
				if (promise && promise.then) {
					promise.then(() => S.Common.downloadDone(file.id));
				} else {
					S.Common.downloadDone(file.id);
				};
			});

			analytics.event('DownloadMedia', { route });
		});
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
			
			callBack?.(filePaths);
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

			callBack?.(filePaths);
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
			preventMenuClose: true,
			data: {
				title: U.String.sprintf(translate('popupConfirmDeleteWarningTitle'), count, U.Common.plural(count, translate('pluralObject'))),
				text: translate('popupConfirmDeleteWarningText'),
				textConfirm: translate('commonDelete'),
				onConfirm: () => { 
					C.ObjectListDelete(ids); 

					const isPopup = keyboard.isPopup();
					const match = keyboard.getMatch();

					if (ids.includes(match.params.id)) {
						if (isPopup) {
							S.Popup.close('page');
						} else {
							const history = U.Router.history;
							const prev = history.entries[history.index - 1];

							if (prev) {
								history.goBack();
							} else {
								U.Space.openDashboard();
							};
						};
					};

					callBack?.();
					analytics.event('RemoveCompletely', { count, route });
				},
				onCancel: callBack,
			},
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

			ids.forEach(id => {
				S.Detail.update(id, { id, details: { isArchived: true } }, false);
			});

			Preview.toastShow({ action: I.ToastAction.Archive, ids, autoArchivedIds: message.autoArchivedIds || [] });
			analytics.event('MoveToBin', { route, count: ids.length });
			callBack?.();
		});
	};

	archiveCheckType (rootId: string, ids: string[], route: string, callBack?: () => void) {
		const types = [];

		const cb = (ids: string[]) => {
			this.archive(ids, route, callBack);
		};

		ids.forEach((id) => {
			const type = S.Record.getTypeById(id);
			if (type) {
				types.push(type);
			};
		});

		if (types.length) {
			const filters = [
				{ relationKey: 'type', condition: I.FilterCondition.In, value: types.map(({ id }) => id) }
			];
			U.Subscription.search({ filters }, (message: any) => {
				if (message.records.length) {
					S.Popup.open('objectManager', {
						className: 'archiveType',
						data: {
							type: I.ObjectManagerPopup.TypeArchive,
							objects: types,
							onConfirm: (selectedIds, totalCount) => {
								cb(ids.concat(selectedIds));

								analytics.event('ClickDeleteType', { suggestCount: totalCount, count: selectedIds.length });
							},
						},
					});

					analytics.event('ScreenDeleteType', { route });
				} else {
					cb(ids);
				};
			});
		} else {
			cb(ids);
		};
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

			ids.forEach(id => {
				S.Detail.update(id, { id, details: { isArchived: false } }, false);
			});

			Preview.toastShow({ action: I.ToastAction.Restore, ids, autoRestoredIds: message.autoRestoredIds || [] });
			callBack?.();
			analytics.event('RestoreFromBin', { route, count: ids.length });
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
				if (!message.error.code) {
					callBack?.(message);
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
			onSelectPath?.();

			C.ObjectListExport(spaceId, paths[0], ids, type, zip, nested, files, archived, json, (message: any) => {
				if (message.error.code) {
					return;
				};

				this.openPath(paths[0]);
				analytics.event('Export', { type, middleTime: message.middleTime, route });

				callBack?.(message);
			});
		});
	};

	/**
	 * Copies or cuts blocks to the clipboard.
	 * @param {string} rootId - The root object ID.
	 * @param {string[]} ids - The block IDs to copy or cut.
	 * @param {I.ClipboardMode} mode - Whether to copy or cut.
	 * @param {Map<string, I.TextRange>} ranges - Per-block partial text ranges (cross-block text selection); the middleware applies them to the first and last block of the request.
	 */
	copyBlocks (rootId: string, ids: string[], mode: I.ClipboardMode, ranges?: Map<string, I.TextRange>) {
		const root = S.Block.getLeaf(rootId, rootId);
		if (!root) {
			return;
		};

		const { focused } = focus.state;

		if (root.isLocked() && !ids.length) {
			return;
		};

		const range = ranges ? { from: 0, to: 0 } : U.Common.objectCopy(focus.state.range);
		const isCut = mode == I.ClipboardMode.Cut;
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

		if (isCut && !ranges && (blocks.length > 1)) {
			next = S.Block.getNextBlock(rootId, blocks[0].id, -1, it => it.isFocusable());
		};

		if ((range.from == range.to) && !blocks.length) {
			return;
		};

		// The middleware applies rangeFirst/rangeLast positionally to the first/last block of the request
		let rangeFirst = range;
		let rangeLast = null;

		if (ranges && blocks.length) {
			rangeFirst = ranges.get(blocks[0].id) || { from: 0, to: 0 };
			rangeLast = ranges.get(blocks[blocks.length - 1].id) || { from: 0, to: 0 };
		};

		C[cmd](rootId, blocks, rangeFirst, rangeLast, (message: any) => {
			if (message.error.code) {
				return;
			};

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

				if (ranges) {
					// Partially cut edge blocks keep the unselected part of their text: collapse the caret there
					const first = blocks[0];
					const last = blocks[blocks.length - 1];

					if (first.isText() && rangeFirst.from > 0) {
						focus.set(first.id, { from: rangeFirst.from, to: rangeFirst.from });
					} else
					if (last.isText() && rangeLast && (rangeLast.to > 0) && (rangeLast.to < last.getLength())) {
						focus.set(last.id, { from: 0, to: 0 });
					} else {
						const prev = S.Block.getNextBlock(rootId, first.id, -1, it => it.isFocusable());
						if (prev) {
							const l = prev.getLength();
							focus.set(prev.id, { from: l, to: l });
						};
					};

					focus.apply();
				} else {
					if (next) {
						const l = next.getLength();
						focus.set(next.id, { from: l, to: l });
					} else {
						focus.set(focused, { from: range.from, to: range.from });
					};

					focus.apply();
				};
			};
		});

		analytics.event(isCut ? 'CutBlock' : 'CopyBlock', { count: blocks.length });
	};

	/**
	 * Copies or cuts the current cross-block text selection to the clipboard.
	 * @param {string} rootId - The root object ID.
	 * @param {I.ClipboardMode} mode - Whether to copy or cut.
	 */
	copyTextSelection (rootId: string, mode: I.ClipboardMode) {
		const selection = S.Common.getRef('selectionProvider');
		const textSel = selection?.getTextSelection();

		if (!textSel) {
			return;
		};

		const ids = selection.getTextSelectionIds();
		if (!ids.length) {
			return;
		};

		const ranges = new Map([
			[ textSel.from.id, textSel.from.range ],
			[ textSel.to.id, textSel.to.range ],
		]);

		this.copyBlocks(rootId, ids, mode, ranges);

		if (mode == I.ClipboardMode.Cut) {
			selection.clear();
		};
	};

	/**
	 * Opens the space creation popup with the selected create type.
	 * @param {I.SpaceCreateType} type - The selected create type (Personal, Group, Join).
	 * @param {string} route - The route context for analytics.
	 */
	createSpace (type: I.SpaceCreateType, route: string) {
		if (type == I.SpaceCreateType.Group) {
			const mySharedSpaces = U.Space.getMySharedSpacesList();
			const { sharedSpacesLimit } = U.Space.getProfile();

			if (sharedSpacesLimit && (mySharedSpaces.length >= sharedSpacesLimit)) {
				S.Popup.open('confirm', {
					data: {
						iconParam: { name: 'popup/header/warning', color: 'grey' },
						title: translate('popupConfirmSharedSpaceLimitTitle'),
						text: U.String.sprintf(translate('popupConfirmSharedSpaceLimitText'), sharedSpacesLimit),
						textConfirm: translate('popupConfirmSharedSpaceLimitButton'),
						canCancel: false,
						onConfirm: () => this.openSettings('membership', ''),
					},
				});
				analytics.event('ScreenHitShareSpaceLimit');
				return;
			};
		};

		S.Popup.closeAll(null, () => {
			S.Popup.open('spaceCreate', { data: { type, route } });
		});
	};

	/**
	 * Removes a space by ID, showing a confirmation dialog.
	 * @param {string} id - The space ID.
	 * @param {string} route - The route context for analytics.
	 * @param {function} [callBack] - Optional callback after removal.
	 */
	removeSpace (id: string, route: string, forceDelete?: boolean, callBack?: (message: any) => void) {
		const spaceview = U.Space.getSpaceviewBySpaceId(id);

		if (!spaceview) {
			return;
		};

		const isOwner = U.Space.isMyOwner(id);
		const name = isOwner ? spaceview.name : U.String.shorten(spaceview.name, 32);
		const suffix = isOwner ? 'Delete' : 'Leave';
		const confirmMessage = isOwner ? spaceview.name : '';

		let title = U.String.sprintf(translate(`space${suffix}WarningTitle`), name);
		let text = U.String.sprintf(translate(`space${suffix}WarningText`), name);
		let confirm = isOwner ? translate('commonDelete') : translate('commonLeaveSpace');
		let toast = U.String.sprintf(translate(`space${suffix}Toast`), name);

		if (forceDelete) {
			title = U.String.sprintf(translate('spaceDeleteWarningTitle'), name);
			text = U.String.sprintf(translate('spaceLeaveWarningText'), name);
			toast = U.String.sprintf(translate('spaceDeleteToast'), name);
			confirm = translate('commonDelete');
		};

		analytics.event(`Click${suffix}Space`, { route });

		S.Popup.open('confirm', {
			data: {
				iconParam: { name: 'popup/header/confirm', color: 'orange' },
				title,
				text,
				textConfirm: confirm,
				colorConfirm: 'red',
				confirmMessage,
				onConfirm: () => {
					analytics.event(`Click${suffix}SpaceWarning`, { type: suffix, route });

					C.SpaceDelete(id, (message: any) => {
						callBack?.(message);

						if (!message.error.code) {
							Preview.toastShow({ text: toast });
							analytics.event(`${suffix}Space`, { type: spaceview.spaceAccessType, route });
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
	 * Creates a widget from an object and adds it to the widgets block.
	 * @param {string} rootId - The root object ID.
	 * @param {string} objectId - The object ID to create a widget from.
	 * @param {string} targetId - The target block ID for insertion.
	 * @param {I.BlockPosition} position - The position to insert the widget.
	 * @param {string} [route] - The route context for analytics.
	 */
	createWidgetFromObject (rootId: string, objectId: string, targetId: string, position: I.BlockPosition, route?: string) {
		this.createWidgetFromObjectIn(S.Block.widgets, rootId, objectId, targetId, position, route);
	};

	createWidgetFromObjectIn (contextId: string, rootId: string, objectId: string, targetId: string, position: I.BlockPosition, route?: string) {
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

		C.BlockCreateWidget(contextId, targetId, newBlock, position, layout, limit, () => {
			analytics.createWidget(layout, route);
		});
	};

	removeWidgetStorage (id: string) {
		Storage.setToggle('widget', id, false);
		Storage.deleteToggle(`widget${id}`);

		const childrenIds = S.Block.getChildrenIds(S.Block.widgets, id);
		if (childrenIds.length) {
			Storage.deleteToggle(`widget${childrenIds[0]}`);
		};
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

		C.BlockListDelete(widgets, [ id ]);
		this.removeWidgetStorage(id);

		analytics.event('DeleteWidget', { layout: block.content.layout, params: { target } });
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

		list.forEach(block => {
			analytics.event('DeleteWidget', { layout: block.content.layout });
			this.removeWidgetStorage(block.id);
		});

		C.BlockListDelete(widgets, list.map(it => it.id), callBack);
	};

	toggleWidgetsForObject (objectId: string, route?: string) {
		if (S.Block.getWidgetsForTarget(objectId).length) {
			this.removeWidgetsForObjects([ objectId ]);
		} else {
			this.createWidgetFromObject(objectId, objectId, '', I.BlockPosition.InnerFirst, route);
		};
	};

	togglePersonalWidgetsForObject (objectId: string, route?: string) {
		const personalId = U.Object.getPersonalWidgetsId();
		const list = S.Block.getWidgetsForTargetIn(objectId, personalId);

		if (list.length) {
			C.BlockListDelete(personalId, list.map(it => it.id));
		} else {
			this.createWidgetFromObjectIn(personalId, personalId, objectId, '', I.BlockPosition.InnerFirst, route);
		};
	};

	savePendingMembers (spaceId: string, identities: string[]) {
		const existing = Storage.getSpaceKey('pendingMembers', false, spaceId) || [];
		const merged = [ ...new Set([ ...existing, ...identities ]) ];

		Storage.setSpaceKey('pendingMembers', merged, false, spaceId);
	};

	getPendingMembers (spaceId: string): string[] {
		return Storage.getSpaceKey('pendingMembers', false, spaceId) || [];
	};

	processPendingMembers (retryCount: number = 0) {
		const spaceData = Storage.getSpace(false);
		const entries: { spaceId: string; identities: string[] }[] = [];

		for (const spaceId in spaceData) {
			const identities = spaceData[spaceId]?.pendingMembers;

			if (identities?.length) {
				entries.push({ spaceId, identities });
				Storage.deleteSpaceKey('pendingMembers', false, spaceId);
			};
		};

		if (!entries.length) {
			return;
		};

		const { writersLimit } = U.Space.getTierLimits();
		const maxRetries = 5;
		const failed: { spaceId: string; identities: string[] }[] = [];

		let processed = 0;
		const total = entries.length;

		const onProcessed = () => {
			processed++;

			if (processed < total) {
				return;
			};

			if (failed.length && (retryCount < maxRetries)) {
				failed.forEach(it => this.savePendingMembers(it.spaceId, it.identities));

				const delay = Math.min(5000 * Math.pow(2, retryCount), 30000);

				window.setTimeout(() => this.processPendingMembers(retryCount + 1), delay);
			};
		};

		entries.forEach(({ spaceId, identities }) => {
			C.SpaceMakeShareable(spaceId, (message: any) => {
				if (message.error.code) {
					failed.push({ spaceId, identities });
					onProcessed();
					return;
				};

				C.SpaceInviteGenerate(spaceId, I.InviteType.WithoutApprove, I.ParticipantPermissions.Writer, (message) => {
					if (message.error.code) {
						failed.push({ spaceId, identities });
						onProcessed();
						return;
					};

					const writerIdentities = identities.slice(0, writersLimit);
					const readerIdentities = identities.slice(writersLimit);

					if (writerIdentities.length) {
						C.SpaceParticipantsAddList(spaceId, writerIdentities, I.ParticipantPermissions.Writer);
					};

					if (readerIdentities.length) {
						C.SpaceParticipantsAddList(spaceId, readerIdentities, I.ParticipantPermissions.Reader);
					};

					analytics.event('AddMember', { count: identities.length });
					onProcessed();
				});
			});
		});
	};

	membershipUpgrade (event?: any) {
		const product = S.Membership.data?.getTopProduct();
		if (!product) {
			return;
		};

		if (!product.isUpgradeable) {
			S.Popup.open('confirm', {
				data: {
					title: translate('popupConfirmMembershipUpgradeTitle'),
					text: translate('popupConfirmMembershipUpgradeText'),
					textConfirm: translate('popupConfirmMembershipUpgradeButton'),
					onConfirm: () => this.openSettings('membership', ''),
					canCancel: false
				}
			});
		} else {
			this.openSettings('membership', '');
		};

		if (event) {
			analytics.event('ClickUpgradePlanTooltip', event);
		};
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

						Preview.toastShow({ text: translate('toastInviteRevoke') });
						S.Popup.close('confirm');
						analytics.event('RevokeShareLink');
						callBack?.();
					});
				},
			},
		});

		analytics.event('ScreenRevokeShareLink');
	};

	/**
	 * Opens a confirmation popup to remove an active member from a space.
	 * Reused by the Members settings screen and the participant menu.
	 * @param {string} spaceId - The space ID.
	 * @param {any} item - The participant object ({ identity }).
	 * @param {function} [callBack] - Optional callback invoked after removal is dispatched.
	 */
	memberRemove (spaceId: string, item: any, callBack?: () => void) {
		S.Popup.open('confirm', {
			data: {
				iconParam: { name: 'popup/header/error', color: 'red' },
				title: translate('popupConfirmMemberRemoveTitle'),
				text: translate('popupConfirmMemberRemoveText'),
				textConfirm: translate('commonRemove'),
				colorConfirm: 'red',
				onConfirm: () => {
					C.SpaceParticipantRemove(spaceId, [ item.identity ]);

					analytics.event('RemoveSpaceMember');
					callBack?.();
				},
			},
		});
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
				callBack?.();
				return;
			};

			const { free } = diskSpace;

			if (free <= 1024 * 1024 * 1024) { // less than 1GB
				S.Popup.open('confirm', {
					onClose: callBack,
					data: {
						iconParam: { name: 'popup/header/warning', color: 'orange' },
						title: translate('popupConfirmDiskSpaceTitle'),
						text: translate('popupConfirmDiskSpaceText'),
						textConfirm: translate('commonOkay'),
						canCancel: false,
					},
				});
			} else {
				callBack?.();
			};
		});
	};

	spaceInfo () {
		const { account } = S.Auth;
		const { dateFormat } = S.Common;
		const space = U.Space.getSpaceview();
		const creator = U.Space.getCreator(space.targetSpaceId, space.creator);
		const data = [
			[ translate(`popupSettingsSpaceIndexSpaceIdTitle`), space.targetSpaceId ],
			[ translate(`popupSettingsSpaceIndexNetworkIdTitle`), account.info.networkId ],
		];

		if (!creator._empty_) {
			data.push([ translate(`popupSettingsSpaceIndexCreatedByTitle`), creator.resolvedName ]);
		};
		if (space.createdDate) {
			data.push([ translate(`popupSettingsSpaceIndexCreationDateTitle`), U.Date.dateWithFormat(dateFormat, space.createdDate) ],);
		};

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

	openSettings (id: string, route: string, param?: Partial<I.RouteParam>) {
		const object = { 
			id, 
			layout: I.ObjectLayout.Settings,
			_routeParam_: { additional: [] },
		};

		if (route) {
			object._routeParam_.additional.push({ route });
		};

		U.Object.openRoute(object, param);
	};

	openSpaceShare (route: string) {
		this.openSettings('spaceShare', route);
	};

	setChatNotificationMode (spaceId: string, ids: string[], mode: I.NotificationMode, route: string, callBack?: (message: any) => void) {
		C.PushNotificationSetForceModeIds(spaceId, ids, mode, callBack);
		analytics.event('ChangeMessageNotificationState', { type: mode, spaceType: I.SpaceType.Data, route });
	};

	/**
	 * Shows an invite request popup and handles navigation on cancel.
	 */
	inviteRequest () {
		S.Popup.open('confirm', {
			data: {
				title: translate('popupInviteInviteConfirmTitle'),
				text: translate('popupInviteInviteConfirmText'),
				textConfirm: translate('commonDone'),
				textCancel: translate('popupInviteInviteConfirmCancel'),
				onCancel: () => {
					U.Object.openRoute({ id: 'spaceList', layout: I.ObjectLayout.Settings });
				},
			},
		});

		analytics.event('ScreenRequestSent');
	};

	finalizeMembership (product: any, route: string, callBack?: () => void) {
		const showSurveyPopup = () => {
			if (Survey.isComplete(I.SurveyType.Cta)) {
				S.Popup.close('membershipFinalization');
				callBack?.();
				return;
			};

			const profile = U.Space.getProfile();
			const participant = U.Space.getParticipant() || profile;
			const globalName = Relation.getStringValue(participant?.globalName);
			const title = globalName ? U.String.sprintf(translate('popupConfirmMembershipSurveyTitle'), globalName) : translate('popupConfirmMembershipSurveyTitleNoName');

			S.Popup.replace('membershipFinalization', 'confirm', {
				onClose: () => callBack?.(),
				data: {
					iconParam: { name: 'popup/header/emoji', width: 232, height: 52 },
					title,
					text: translate('popupConfirmMembershipSurveyText'),
					colorConfirm: 'accent',
					textConfirm: translate('popupConfirmMembershipSurveyTakeSurvey'),
					onConfirm: () => Survey.onConfirm(I.SurveyType.Cta),
					onCancel: () => Survey.onSkip(I.SurveyType.Cta),
				}
			});
		};

		S.Popup.open('membershipFinalization', {
			data: {
				product,
				route,
				onSuccess: showSurveyPopup,
			},
		});
	};

	openSpaceTab (spaceId: string, spaceType: I.SpaceType, analyticsRoute?: string) {
		Renderer.send('openTab', { spaceId, spaceType }, { setActive: false });
		analytics.event('AddTab', { route: analyticsRoute, spaceType });
	};

};

export default new Action();
