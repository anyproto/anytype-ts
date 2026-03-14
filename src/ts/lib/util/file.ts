import loadImage from 'blueimp-load-image';
import { I, C, S, U, J, Relation, Preview, Dataview, translate } from 'Lib';
import { DragEvent } from 'react';

const SIZE_UNIT = 1024;
const UNITS = {
	1: 'B',
	2: 'KB',
	3: 'MB',
	4: 'GB',
	5: 'TB',
};

interface DirectoryTree {
	name: string;
	path: string;
	files: string[];
	children: DirectoryTree[];
	totalFiles: number;
	depthExceeded: boolean;
};

const progressCounter = { value: 0 };

class UtilFile {

	/**
	 * Returns a human-readable file size string for a given number of bytes.
	 * @param {number} v - The file size in bytes.
	 * @param {boolean} withSpace - Flag saying to divide number and unit with space.
	 * @returns {string} The formatted file size string.
	 */
	size (v: number, withSpace?: boolean): string {
		v = Number(v) || 0;

		let ret = 0;
		let unit = '';

		for (let i = U.Common.objectLength(UNITS); i >= 1; --i) {
			const n = v / Math.pow(SIZE_UNIT, i - 1);
			if ((n >= 0.9) || (i == 1)) {
				ret = n;
				unit = UNITS[i];
				break;
			};
		};

		return ret ? U.Common.formatNumber(Number(U.String.sprintf(`%0.2f`, ret))) + (withSpace ? ' ' : '') + unit : '';
	};

	/**
	 * Returns the icon name for a file object based on its properties.
	 * @param {any} object - The file object.
	 * @returns {string} The icon name.
	 */
	icon (object: any): string {
		object = object || {};

		const name = Relation.getStringValue(object.name);
		const n = name.split('.');
		const mime = String(object.mime || object.mimeType || object.fileMimeType || '').toLowerCase();
		const e = String(object.fileExt || n[n.length - 1] || '').toLowerCase();

		let t: string[] = [];
		let icon = 'other';

		if (mime) {
			const a: string[] = mime.split(';');
			if (a.length) {
				t = a[0].split('/');
			};
		};

		// Detect by mime type

		if (t.length) {
			if ([ 'image', 'video', 'text', 'audio' ].indexOf(t[0]) >= 0) {
				icon = t[0];
			};
			
			if ([ 'pdf' ].indexOf(t[1]) >= 0) {
				icon = t[1];
			};
			
			if ([ 'zip', 'gzip', 'tar', 'gz', 'rar' ].indexOf(t[1]) >= 0) {
				icon = 'archive';
			};
			
			if ([ 'vnd.ms-powerpoint' ].indexOf(t[1]) >= 0) {
				icon = 'presentation';
			};
			
			if ([ 'vnd.openxmlformats-officedocument.spreadsheetml.sheet' ].indexOf(t[1]) >= 0) {
				icon = 'table';
			};
		};

		// Detect by extension
		if ([ 'm4v' ].indexOf(e) >= 0) {
			icon = 'video';
		};
			
		if ([ 'csv', 'json', 'txt', 'doc', 'docx', 'md', 'tsx', 'scss', 'html', 'yml', 'rtf' ].includes(e)) {
			icon = 'text';
		};
			
		if ([ 'zip', 'gzip', 'tar', 'gz', 'rar' ].includes(e)) {
			icon = 'archive';
		};

		if ([ 'xls', 'xlsx', 'sqlite' ].includes(e)) {
			icon = 'table';
		};

		if ([ 'ppt', 'pptx', 'key' ].includes(e)) {
			icon = 'presentation';
		};

		if ([ 'aif' ].includes(e)) {
			icon = 'audio';
		};

		if ([ 'dwg', 'ai' ].includes(e)) {
			icon = 'other';
		};

		if ([ 'ai' ].includes(e)) {
			icon = 'image';
		};

		for (const k in J.Constant.fileExtension) {
			const el = J.Constant.fileExtension[k];
			if (!U.Common.hasProperty(el, 'length')) {
				continue;
			};

			if (el.includes(e)) {
				icon = k;
				break;
			};
		};

		return icon;
	};

	/**
	 * Returns the icon path for a file object based on its properties and theme.
	 * @param {any} object - The file object.
	 * @returns {string} The icon path.
	 */
	iconPath (object: any) {
		return `./img/${S.Common.getThemePath()}icon/file/${this.icon(object)}.svg`;
	};

	/**
	 * Loads a preview canvas for an image file and calls a callback with the canvas.
	 * @param {any} file - The image file.
	 * @param {any} param - The parameters for loading.
	 * @param {function} [success] - Callback with the loaded canvas.
	 */
	loadPreviewCanvas (file: any, param: any, success?: (canvas: any) => void) {
		if (!file) {
			return;
		};
		
		param = Object.assign({
			maxWidth: 256,
			type: 'image/png',
			quality: 0.95,
			canvas: true,
		}, param);
		
		loadImage.parseMetaData(file, (data: any) => {
			if (data.exif) {
				param = Object.assign(param, { orientation: data.exif.get('Orientation') });
			};

			loadImage(file, success, param);
		});
	};
	
	/**
	 * Loads a preview image as a base64 string and calls a callback with the image and parameters.
	 * @param {any} file - The image file.
	 * @param {any} param - The parameters for loading.
	 * @param {function} [success] - Callback with the image and parameters.
	 * @param {function} [error] - Callback if loading fails.
	 */
	loadPreviewBase64 (file: any, param: any, success?: (image: string, param: any) => void, error?: (error: string) => void) {
		this.loadPreviewCanvas(file, param, (canvas: any) => {
			if (!canvas || (canvas.type == 'error')) {
				error?.('Failed to get preview canvas');
				return;
			};

			const image = canvas.toDataURL(param.type, param.quality);

			if (image) {
				success?.(image, { width: canvas.width, height: canvas.height });
			};
			
			if (!image) {
				error?.('Failed to get canvas.toDataURL()');
			};
		});
	};

	/**
	 * Returns the current date as a string suitable for filenames.
	 * @returns {string} The date string.
	 */
	date () {
		return new Date().toISOString().replace(/:/g, '_').replace(/\..+/, '');
	};

	/**
	 * Returns the file name for a file object, appending the extension if needed.
	 * @param {any} object - The file object.
	 * @returns {string} The file name.
	 */
	name (object: any) {
		object = object || {};

		const name = String(object.name || '');
		const fileExt = String(object.fileExt || '');

		if (!fileExt || new RegExp(`\\.${U.String.regexEscape(fileExt)}$`).test(name)) {
			return name;
		};

		return `${name}.${fileExt}`;
	};

	/**
	 * Returns the object layout type for a given mime type.
	 * @param {string} mime - The mime type string.
	 * @returns {I.ObjectLayout} The object layout type.
	 */
	layoutByMime (mime: string) {
		const t = mime.split('/');
		
		let layout = I.ObjectLayout.File;
		if (t.length) {
			switch (t[0]) {
				case 'image':
					layout = I.ObjectLayout.Image;
					break;

				case 'video':
					layout = I.ObjectLayout.Video;
					break;

				case 'audio':
					layout = I.ObjectLayout.Audio;
					break;
			};
		};

		return layout;
	};

	/**
	 * Returns file extensions for the given object layout used for file picker filtering.
	 * @param {I.ObjectLayout} layout - The object layout.
	 * @returns {string[]} The file extensions (without dots).
	 */
	getExtensionsByLayout (layout: I.ObjectLayout): string[] {
		switch (layout) {
			case I.ObjectLayout.Image:
				return [ 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'ico', 'heic', 'heif', 'avif' ];

			case I.ObjectLayout.Video:
				return [ 'mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'm4v', 'ogv', '3gp' ];

			case I.ObjectLayout.Audio:
				return [ 'mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'aiff', 'aif', 'opus' ];

			case I.ObjectLayout.Pdf:
				return [ 'pdf' ];

			default:
				return [];
		};
	};

	/**
	 * Checks if a drag event contains files.
	 * @param {React.DragEvent} e - The drag event.
	 * @returns {boolean} True if files are present, false otherwise.
	 */
	checkDropFiles (e: DragEvent): boolean {
		const dt = e.dataTransfer;
		return ((dt.files && dt.files.length) || (dt.types && dt.types.includes('Files'))) ? true : false;
	};

	/**
	 * Recursively scans a directory and returns its tree structure.
	 * Skips hidden files, known junk, and skip-listed directories.
	 */
	scanDirectory (dirPath: string, depth: number = 0): DirectoryTree {
		const electron = U.Common.getElectron();
		const skipDirs = J.Constant.fileUpload.skipDirs;
		const maxDepth = J.Constant.fileUpload.maxDepth;
		const dirName = electron.fileName(dirPath);

		const result: DirectoryTree = {
			name: dirName,
			path: dirPath,
			files: [],
			children: [],
			totalFiles: 0,
			depthExceeded: false,
		};

		const entries: string[] = electron.readDir(dirPath);

		for (let i = 0; i < entries.length; i++) {
			const entry = entries[i];

			if (entry.startsWith('.') || (entry == 'Thumbs.db')) {
				continue;
			};

			const fullPath = electron.filePath(dirPath, entry);

			if (electron.isDirectory(fullPath)) {
				if (skipDirs.includes(entry)) {
					continue;
				};

				if (depth >= maxDepth) {
					result.depthExceeded = true;
					continue;
				};

				const child = this.scanDirectory(fullPath, depth + 1);
				result.children.push(child);
				result.totalFiles += child.totalFiles;

				if (child.depthExceeded) {
					result.depthExceeded = true;
				};
			} else {
				result.files.push(fullPath);
				result.totalFiles++;
			};
		};

		return result;
	};

	/**
	 * Returns a breakdown of file counts by type (image, video, audio, file) for a list of paths.
	 */
	getFileCountsByType (paths: string[]): { [key: string]: number } {
		const electron = U.Common.getElectron();
		const counts: { [key: string]: number } = {};

		for (const path of paths) {
			const mime = electron.fileMime(path) || '';
			const layout = this.layoutByMime(mime);
			let key = 'file';

			switch (layout) {
				case I.ObjectLayout.Image: key = 'image'; break;
				case I.ObjectLayout.Video: key = 'video'; break;
				case I.ObjectLayout.Audio: key = 'audio'; break;
			};

			counts[key] = (counts[key] || 0) + 1;
		};

		return counts;
	};

	/**
	 * Collects all file paths from a scanned directory tree.
	 */
	collectFiles (tree: DirectoryTree): string[] {
		let files = [].concat(tree.files);

		for (const child of tree.children) {
			files = files.concat(this.collectFiles(child));
		};

		return files;
	};

	/**
	 * Uploads folders as collections and inserts link blocks into the editor.
	 */
	uploadFolderAsCollection (dirPaths: string[], rootId: string, targetId: string, position: I.BlockPosition) {
		const trees = dirPaths.map(p => this.scanDirectory(p));
		let allFiles: string[] = [];

		for (const tree of trees) {
			allFiles = allFiles.concat(this.collectFiles(tree));
		};

		const totalFiles = allFiles.length;
		const { softLimit, hardLimit } = J.Constant.fileUpload;

		if (totalFiles > hardLimit) {
			S.Popup.open('confirm', {
				preventCloseByClick: true,
				data: {
					title: translate('popupUploadFolderTooManyTitle'),
					text: U.String.sprintf(translate('popupUploadFolderTooManyText'), totalFiles, hardLimit),
					textConfirm: translate('commonOk'),
					canCancel: false,
					canConfirm: true,
				},
			});
			return;
		};

		const counts = this.getFileCountsByType(allFiles);
		const breakdown = this.formatCountsBreakdown(counts);

		const doUpload = () => {
			const space = S.Common.space;
			const electron = U.Common.getElectron();
			const progressId = this.nextProgressId();
			const uploadCounts: { [key: string]: number } = {};
			let completed = 0;
			let errorCount = 0;
			let lastErrorDescription = '';

			S.Progress.add({
				id: progressId,
				spaceId: space,
				type: I.ProgressType.Drop,
				state: I.ProgressState.Running,
				current: 0,
				total: totalFiles,
				canCancel: false,
			});

			const createTree = (tree: DirectoryTree, parentColId: string, onDone: (colId: string) => void) => {
				C.ObjectCreate({ name: tree.name }, [], '', J.Constant.typeKey.collection, space, (message: any) => {
					if (message.error.code) {
						onDone('');
						return;
					};

					const colId = message.details.id;

					if (parentColId) {
						C.ObjectCollectionAdd(parentColId, [ colId ]);
					};

					let pending = tree.files.length + tree.children.length;

					if (!pending) {
						onDone(colId);
						return;
					};

					const check = () => {
						pending--;
						if (pending <= 0) {
							onDone(colId);
						};
					};

					for (const filePath of tree.files) {
						const mime = electron.fileMime(filePath) || '';
						const fileLayout = this.layoutByMime(mime);
						const type = U.Object.getFileTypeByLayout(fileLayout);
						const key = this.layoutToCountKey(fileLayout);

						C.FileUpload(space, '', filePath, type, {}, false, '', I.ImageKind.Basic, '', '', (msg: any) => {
							completed++;
							S.Progress.update({ id: progressId, current: completed });

							if (msg.error.code) {
								errorCount++;
								if (msg.error.description) {
									lastErrorDescription = msg.error.description;
								};
							} else
							if (msg.objectId) {
								uploadCounts[key] = (uploadCounts[key] || 0) + 1;
								C.ObjectCollectionAdd(colId, [ msg.objectId ]);
							};

							check();
						});
					};

					for (const child of tree.children) {
						createTree(child, colId, () => check());
					};
				});
			};

			let remaining = trees.length;
			const topCollectionIds: string[] = [];

			for (const tree of trees) {
				createTree(tree, '', (colId: string) => {
					if (colId) {
						topCollectionIds.push(colId);
					};

					remaining--;

					if (remaining <= 0) {
						S.Progress.delete(progressId);
						Preview.toastShow({ action: I.ToastAction.Upload, uploadCounts });

						if (errorCount > 0) {
							this.showUploadError(errorCount, lastErrorDescription);
						} else
						if (trees.some(t => t.depthExceeded)) {
							this.showDepthExceededWarning();
						};

						for (const id of topCollectionIds) {
							const linkParam = U.Data.getLinkBlockParam(id, I.ObjectLayout.Collection, false);
							C.BlockCreate(rootId, targetId, position, linkParam);
						};
					};
				});
			};
		};

		if (totalFiles > softLimit) {
			S.Popup.open('confirm', {
				preventCloseByClick: true,
				data: {
					title: translate('popupUploadFolderConfirmTitle'),
					text: U.String.sprintf(translate('popupUploadFolderConfirmText'), breakdown),
					textConfirm: translate('commonUpload'),
					textCancel: translate('commonCancel'),
					canCancel: true,
					canConfirm: true,
					onConfirm: doUpload,
				},
			});
			return;
		};

		doUpload();
	};

	/**
	 * Uploads files into a dataview (set/collection) context with filter-derived properties.
	 * For type-source sets, shows a mismatch dialog if some files don't match the source type.
	 * For collections, adds uploaded objects to the collection.
	 */
	uploadFilesToDataview (rootId: string, blockId: string, filePaths: string[]) {
		const block = S.Block.getLeaf(rootId, blockId);
		if (!block) {
			return;
		};

		const objectId = block.getTargetObjectId() || rootId;
		const isCollection = Dataview.isCollection(rootId, blockId);
		const meta = S.Record.getMeta(rootId, blockId);
		const details = Dataview.getDetails(rootId, blockId, objectId, meta.viewId);
		const sourceTypes = Relation.getSetOfObjects(rootId, objectId, I.ObjectLayout.Type);
		const sourceLayouts = sourceTypes.map(it => it.recommendedLayout);

		const space = S.Common.space;
		const electron = U.Common.getElectron();
		const objectIds: string[] = [];
		const counts: { [key: string]: number } = {};
		let completed = 0;
		let mismatchCount = 0;
		let errorCount = 0;
		let lastErrorDescription = '';

		const onAllDone = () => {
			if (isCollection && objectIds.length) {
				C.ObjectCollectionAdd(objectId, objectIds);
			};

			Preview.toastShow({ action: I.ToastAction.Upload, uploadCounts: counts });

			if (errorCount > 0) {
				this.showUploadError(errorCount, lastErrorDescription);
			} else
			if ((sourceTypes.length > 0) && (mismatchCount > 0)) {
				S.Popup.open('confirm', {
					preventCloseByClick: true,
					data: {
						title: translate('popupUploadTypeMismatchTitle'),
						text: U.String.sprintf(translate('popupUploadTypeMismatchText'), mismatchCount),
						textConfirm: translate('commonOk'),
						canCancel: false,
					},
				});
			};
		};

		for (const filePath of filePaths) {
			const mime = electron.fileMime(filePath) || '';
			const fileLayout = this.layoutByMime(mime);
			const type = U.Object.getFileTypeByLayout(fileLayout);
			const key = this.layoutToCountKey(fileLayout);

			if (sourceTypes.length && !sourceLayouts.includes(fileLayout)) {
				mismatchCount++;
			};

			C.FileUpload(space, '', filePath, type, details, false, '', I.ImageKind.Basic, '', '', (message: any) => {
				completed++;

				if (message.error.code) {
					errorCount++;
					if (message.error.description) {
						lastErrorDescription = message.error.description;
					};
				} else
				if (message.objectId) {
					objectIds.push(message.objectId);
					counts[key] = (counts[key] || 0) + 1;
				};

				if (completed >= filePaths.length) {
					onAllDone();
				};
			});
		};
	};

	/**
	 * Uploads folders into a dataview (set/collection) context as collections with filter-derived properties.
	 */
	uploadFolderToDataview (dirPaths: string[], extraFiles: string[], rootId: string, blockId: string) {
		const block = S.Block.getLeaf(rootId, blockId);
		if (!block) {
			return;
		};

		const objectId = block.getTargetObjectId() || rootId;
		const isCollection = Dataview.isCollection(rootId, blockId);
		const meta = S.Record.getMeta(rootId, blockId);
		const details = Dataview.getDetails(rootId, blockId, objectId, meta.viewId);
		const sourceTypes = Relation.getSetOfObjects(rootId, objectId, I.ObjectLayout.Type);
		const sourceLayouts = sourceTypes.map(it => it.recommendedLayout);

		const trees = dirPaths.map(p => this.scanDirectory(p));
		let allFiles = [].concat(extraFiles);

		for (const tree of trees) {
			allFiles = allFiles.concat(this.collectFiles(tree));
		};

		const totalFiles = allFiles.length;
		const { softLimit, hardLimit } = J.Constant.fileUpload;

		if (totalFiles > hardLimit) {
			S.Popup.open('confirm', {
				preventCloseByClick: true,
				data: {
					title: translate('popupUploadFolderTooManyTitle'),
					text: U.String.sprintf(translate('popupUploadFolderTooManyText'), totalFiles, hardLimit),
					textConfirm: translate('commonOk'),
					canCancel: false,
					canConfirm: true,
				},
			});
			return;
		};

		const fileCounts = this.getFileCountsByType(allFiles);
		const breakdown = this.formatCountsBreakdown(fileCounts);

		const doUpload = () => {
			const space = S.Common.space;
			const electron = U.Common.getElectron();
			const progressId = this.nextProgressId();
			const uploadCounts: { [key: string]: number } = {};
			let completed = 0;
			let mismatchCount = 0;
			let errorCount = 0;
			let lastErrorDescription = '';

			S.Progress.add({
				id: progressId,
				spaceId: space,
				type: I.ProgressType.Drop,
				state: I.ProgressState.Running,
				current: 0,
				total: totalFiles,
				canCancel: false,
			});

			const onAllDone = () => {
				S.Progress.delete(progressId);
				Preview.toastShow({ action: I.ToastAction.Upload, uploadCounts });

				if (errorCount > 0) {
					this.showUploadError(errorCount, lastErrorDescription);
				} else
				if ((sourceTypes.length > 0) && (mismatchCount > 0)) {
					S.Popup.open('confirm', {
						preventCloseByClick: true,
						data: {
							title: translate('popupUploadTypeMismatchTitle'),
							text: U.String.sprintf(translate('popupUploadTypeMismatchText'), mismatchCount),
							textConfirm: translate('commonOk'),
							canCancel: false,
						},
					});
				} else
				if (trees.some(t => t.depthExceeded)) {
					this.showDepthExceededWarning();
				};
			};

			const createTree = (tree: DirectoryTree, parentColId: string, onDone: (colId: string) => void) => {
				C.ObjectCreate({ name: tree.name }, [], '', J.Constant.typeKey.collection, space, (message: any) => {
					if (message.error.code) {
						onDone('');
						return;
					};

					const colId = message.details.id;

					if (parentColId) {
						C.ObjectCollectionAdd(parentColId, [ colId ]);
					};

					if (isCollection) {
						C.ObjectCollectionAdd(objectId, [ colId ]);
					};

					let pending = tree.files.length + tree.children.length;

					if (!pending) {
						onDone(colId);
						return;
					};

					const check = () => {
						pending--;
						if (pending <= 0) {
							onDone(colId);
						};
					};

					for (const filePath of tree.files) {
						const mime = electron.fileMime(filePath) || '';
						const fileLayout = this.layoutByMime(mime);
						const type = U.Object.getFileTypeByLayout(fileLayout);
						const key = this.layoutToCountKey(fileLayout);

						if (sourceTypes.length && !sourceLayouts.includes(fileLayout)) {
							mismatchCount++;
						};

						C.FileUpload(space, '', filePath, type, details, false, '', I.ImageKind.Basic, '', '', (msg: any) => {
							completed++;
							S.Progress.update({ id: progressId, current: completed });

							if (msg.error.code) {
								errorCount++;
								if (msg.error.description) {
									lastErrorDescription = msg.error.description;
								};
							} else
							if (msg.objectId) {
								uploadCounts[key] = (uploadCounts[key] || 0) + 1;
								C.ObjectCollectionAdd(colId, [ msg.objectId ]);
							};

							check();
						});
					};

					for (const child of tree.children) {
						createTree(child, colId, () => check());
					};
				});
			};

			// Upload extra loose files first
			let looseRemaining = extraFiles.length;

			const onLooseDone = () => {
				let treeRemaining = trees.length;

				if (!treeRemaining) {
					onAllDone();
					return;
				};

				for (const tree of trees) {
					createTree(tree, '', (colId: string) => {
						treeRemaining--;
						if (treeRemaining <= 0) {
							onAllDone();
						};
					});
				};
			};

			if (!looseRemaining) {
				onLooseDone();
				return;
			};

			for (const filePath of extraFiles) {
				const mime = electron.fileMime(filePath) || '';
				const fileLayout = this.layoutByMime(mime);
				const type = U.Object.getFileTypeByLayout(fileLayout);
				const key = this.layoutToCountKey(fileLayout);

				if (sourceTypes.length && !sourceLayouts.includes(fileLayout)) {
					mismatchCount++;
				};

				C.FileUpload(space, '', filePath, type, details, false, '', I.ImageKind.Basic, '', '', (message: any) => {
					completed++;
					S.Progress.update({ id: progressId, current: completed });

					if (message.error.code) {
						errorCount++;
						if (message.error.description) {
							lastErrorDescription = message.error.description;
						};
					} else
					if (message.objectId) {
						uploadCounts[key] = (uploadCounts[key] || 0) + 1;

						if (isCollection) {
							C.ObjectCollectionAdd(objectId, [ message.objectId ]);
						};
					};

					looseRemaining--;
					if (looseRemaining <= 0) {
						onLooseDone();
					};
				});
			};
		};

		if (totalFiles > softLimit) {
			S.Popup.open('confirm', {
				preventCloseByClick: true,
				data: {
					title: translate('popupUploadFolderConfirmTitle'),
					text: U.String.sprintf(translate('popupUploadFolderConfirmText'), breakdown),
					textConfirm: translate('commonUpload'),
					textCancel: translate('commonCancel'),
					canCancel: true,
					canConfirm: true,
					onConfirm: doUpload,
				},
			});
			return;
		};

		doUpload();
	};

	/**
	 * Maps an ObjectLayout to a count key string.
	 */
	layoutToCountKey (l: I.ObjectLayout): string {
		switch (l) {
			case I.ObjectLayout.Image: return 'image';
			case I.ObjectLayout.Video: return 'video';
			case I.ObjectLayout.Audio: return 'audio';
			default: return 'file';
		};
	};

	/**
	 * Formats file counts into a human-readable breakdown string.
	 */
	formatCountsBreakdown (counts: { [key: string]: number }): string {
		const pluralMap = {
			image: translate('pluralImage'),
			video: translate('pluralVideo'),
			audio: translate('pluralAudio'),
			file: translate('pluralFile'),
		};

		const parts: string[] = [];
		for (const key of [ 'image', 'video', 'audio', 'file' ]) {
			const n = counts[key];
			if (n > 0) {
				parts.push(`${n} ${U.Common.plural(n, pluralMap[key]).toLowerCase()}`);
			};
		};

		return parts.join(', ');
	};

	/**
	 * Shows an error popup when some files failed to upload.
	 */
	nextProgressId (): string {
		return `folder-upload-${++progressCounter.value}`;
	};

	showDepthExceededWarning () {
		S.Popup.open('confirm', {
			preventCloseByClick: true,
			data: {
				icon: 'warning',
				title: translate('popupUploadDepthExceededTitle'),
				text: translate('popupUploadDepthExceededText'),
				canCancel: false,
			},
		});
	};

	showUploadError (errorCount: number, lastErrorDescription?: string) {
		if (!errorCount) {
			return;
		};

		S.Popup.open('confirm', {
			preventCloseByClick: true,
			data: {
				icon: 'error',
				title: U.String.sprintf(translate('popupUploadErrorTitle'), errorCount, U.Common.plural(errorCount, translate('pluralFile'))),
				text: lastErrorDescription || translate('popupUploadErrorText'),
				textConfirm: translate('popupUploadErrorConfirm'),
				colorConfirm: 'blank',
				canCancel: false,
			},
		});
	};

};

export default new UtilFile();