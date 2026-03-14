import React, { forwardRef, useRef, useState, useEffect, DragEvent, MouseEvent } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon, Input, Button, Loader } from 'Component';
import { I, C, J, S, U, translate, Action, analytics, Preview } from 'Lib';

enum Tab {
	Upload = 0,
	Link = 1,
};

const PopupUpload = observer(forwardRef<{}, I.Popup>((props, ref) => {

	const { param, close } = props;
	const { data } = param;
	const { layout, onUpload, collectionId, details } = data;
	const [ tab, setTab ] = useState(Tab.Upload);
	const [ isDragging, setIsDragging ] = useState(false);
	const [ isLoading, setIsLoading ] = useState(false);
	const urlRef = useRef(null);
	const dragCounter = useRef(0);

	const fileType = U.Object.getFileTypeByLayout(layout);
	const extensions = U.File.getExtensionsByLayout(layout);

	const onDragEnter = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();

		dragCounter.current++;
		setIsDragging(true);
	};

	const onDragLeave = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();

		dragCounter.current--;
		if (dragCounter.current <= 0) {
			dragCounter.current = 0;
			setIsDragging(false);
		};
	};

	const onDragOver = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const onDrop = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();

		dragCounter.current = 0;
		setIsDragging(false);

		const { files } = e.dataTransfer;
		if (!files || !files.length) {
			return;
		};

		const electron = U.Common.getElectron();
		const filePaths: string[] = [];
		const dirPaths: string[] = [];

		for (let i = 0; i < files.length; i++) {
			const path = electron.webFilePath(files[i]);
			if (!path) {
				continue;
			};

			if (electron.isDirectory(path)) {
				dirPaths.push(path);
			} else {
				filePaths.push(path);
			};
		};

		if (dirPaths.length) {
			handleFolderDrop(dirPaths, filePaths);
		} else
		if (filePaths.length) {
			uploadFiles(filePaths);
		};
	};

	const onClickZone = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		Action.openFileDialog({ extensions, properties: [ 'multiSelections' ] }, (paths: string[]) => {
			if (paths.length) {
				uploadFiles(paths);
			};
		});
	};

	const onPaste = (e: any) => {
		const cb = e.clipboardData || e.originalEvent?.clipboardData;
		if (!cb) {
			return;
		};

		const items = cb.items;
		if (!items || !items.length) {
			return;
		};

		const electron = U.Common.getElectron();
		const paths: string[] = [];

		for (let i = 0; i < items.length; i++) {
			if (items[i].kind == 'file') {
				const file = items[i].getAsFile();
				if (file) {
					const path = electron.webFilePath(file);
					if (path) {
						paths.push(path);
					};
				};
			};
		};

		if (paths.length) {
			e.preventDefault();
			e.stopPropagation();
			uploadFiles(paths);
		};
	};

	const handleFolderDrop = (dirPaths: string[], extraFiles: string[]) => {
		const trees = dirPaths.map(p => U.File.scanDirectory(p));
		let allFiles = [].concat(extraFiles);

		for (const tree of trees) {
			allFiles = allFiles.concat(U.File.collectFiles(tree));
		};

		const totalFiles = allFiles.length;
		const { softLimit, hardLimit } = J.Constant.fileUpload;

		if (totalFiles > hardLimit) {
			close();
			window.setTimeout(() => {
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
			}, S.Popup.getTimeout());
			return;
		};

		const counts = U.File.getFileCountsByType(allFiles);
		const breakdown = U.File.formatCountsBreakdown(counts);

		if (totalFiles > softLimit) {
			close();
			window.setTimeout(() => {
				S.Popup.open('confirm', {
					preventCloseByClick: true,
					data: {
						title: translate('popupUploadFolderConfirmTitle'),
						text: U.String.sprintf(translate('popupUploadFolderConfirmText'), breakdown),
						textConfirm: translate('commonUpload'),
						textCancel: translate('commonCancel'),
						canCancel: true,
						canConfirm: true,
						onConfirm: () => {
							processFolder(trees, extraFiles);
						},
					},
				});
			}, S.Popup.getTimeout());
			return;
		};

		processFolder(trees, extraFiles);
	};

	const processFolder = (trees: ReturnType<typeof U.File.scanDirectory>[], extraFiles: string[]) => {
		let allFiles: string[] = [].concat(extraFiles);
		for (const tree of trees) {
			allFiles = allFiles.concat(U.File.collectFiles(tree));
		};

		const progressId = U.File.nextProgressId();
		const total = allFiles.length;

		// Close popup immediately — progress panel takes over
		onUpload?.([]);
		close();

		S.Progress.add({
			id: progressId,
			spaceId: S.Common.space,
			type: I.ProgressType.Drop,
			state: I.ProgressState.Running,
			current: 0,
			total,
			canCancel: false,
		});

		const space = S.Common.space;
		const electron = U.Common.getElectron();
		let completed = 0;
		let errorCount = 0;
		let lastErrorDescription = '';
		const objectIds: string[] = [];
		const counts: { [key: string]: number } = {};

		const onAllDone = () => {
			S.Progress.delete(progressId);
			Preview.toastShow({ action: I.ToastAction.Upload, uploadCounts: counts });

			if (errorCount > 0) {
				U.File.showUploadError(errorCount, lastErrorDescription);
			} else
			if (trees.some(t => t.depthExceeded)) {
				U.File.showDepthExceededWarning();
			};
		};

		const createCollectionTree = (tree: ReturnType<typeof U.File.scanDirectory>, parentCollectionId: string, onDone: () => void) => {
			const collType = J.Constant.typeKey.collection;

			C.ObjectCreate({ name: tree.name }, [], '', collType, space, (message: any) => {
				if (message.error.code) {
					onDone();
					return;
				};

				const colId = message.details.id;

				if (parentCollectionId) {
					C.ObjectCollectionAdd(parentCollectionId, [ colId ]);
				};

				if (collectionId) {
					C.ObjectCollectionAdd(collectionId, [ colId ]);
				};

				let pending = tree.files.length + tree.children.length;

				if (!pending) {
					onDone();
					return;
				};

				const checkDone = () => {
					pending--;
					if (pending <= 0) {
						onDone();
					};
				};

				for (const filePath of tree.files) {
					const mime = electron.fileMime(filePath) || '';
					const fileLayout = U.File.layoutByMime(mime);
					const type = U.Object.getFileTypeByLayout(fileLayout);
					const key = U.File.layoutToCountKey(fileLayout);

					C.FileUpload(space, '', filePath, type, details || {}, false, '', I.ImageKind.Basic, '', '', (msg: any) => {
						completed++;
						S.Progress.update({ id: progressId, current: completed });

						if (msg.error.code) {
							errorCount++;
							if (msg.error.description) {
								lastErrorDescription = msg.error.description;
							};
						} else
						if (msg.objectId) {
							objectIds.push(msg.objectId);
							counts[key] = (counts[key] || 0) + 1;
							C.ObjectCollectionAdd(colId, [ msg.objectId ]);
						};

						checkDone();
					});
				};

				for (const child of tree.children) {
					createCollectionTree(child, colId, checkDone);
				};
			});
		};

		// Upload extra loose files first
		let looseRemaining = extraFiles.length;

		const onLooseDone = () => {
			// Then process folder trees
			let treeRemaining = trees.length;

			if (!treeRemaining) {
				onAllDone();
				return;
			};

			for (const tree of trees) {
				createCollectionTree(tree, '', () => {
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
			const fileLayout = U.File.layoutByMime(mime);
			const type = U.Object.getFileTypeByLayout(fileLayout);
			const key = U.File.layoutToCountKey(fileLayout);

			C.FileUpload(space, '', filePath, type, details || {}, false, '', I.ImageKind.Basic, '', '', (message: any) => {
				completed++;
				S.Progress.update({ id: progressId, current: completed });

				if (message.error.code) {
					errorCount++;
					if (message.error.description) {
						lastErrorDescription = message.error.description;
					};
				} else
				if (message.objectId) {
					objectIds.push(message.objectId);
					counts[key] = (counts[key] || 0) + 1;

					if (collectionId) {
						C.ObjectCollectionAdd(collectionId, [ message.objectId ]);
					};
				};

				looseRemaining--;
				if (looseRemaining <= 0) {
					onLooseDone();
				};
			});
		};

		analytics.event('UploadMedia', { type: fileType });
	};

	const uploadFiles = (paths: string[]) => {
		setIsLoading(true);

		const space = S.Common.space;
		const electron = U.Common.getElectron();
		let completed = 0;
		let errorCount = 0;
		let lastErrorDescription = '';
		const objectIds: string[] = [];
		const counts: { [key: string]: number } = {};

		const cb = () => {
			setIsLoading(false);
			Preview.toastShow({ action: I.ToastAction.Upload, uploadCounts: counts });
			onUpload?.(objectIds);
			close();

			if (errorCount > 0) {
				window.setTimeout(() => {
					U.File.showUploadError(errorCount, lastErrorDescription);
				}, S.Popup.getTimeout());
			};
		};

		for (const path of paths) {
			const mime = electron.fileMime(path) || '';
			const fileLayout = U.File.layoutByMime(mime);
			const type = U.Object.getFileTypeByLayout(fileLayout);
			const key = U.File.layoutToCountKey(fileLayout);

			C.FileUpload(space, '', path, type, details || {}, false, '', I.ImageKind.Basic, '', '', (message: any) => {
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

					if (collectionId) {
						C.ObjectCollectionAdd(collectionId, [ message.objectId ]);
					};
				};

				if (completed >= paths.length) {
					cb();
				};
			});
		};

		analytics.event('UploadMedia', { type: fileType });
	};

	const onSubmitUrl = (e: any) => {
		e.preventDefault();

		const url = String(urlRef.current?.getValue() || '').trim();
		if (!url || !url.match(/^https?:\/\//)) {
			return;
		};

		setIsLoading(true);

		C.FileUpload(S.Common.space, url, '', fileType, details || {}, false, '', I.ImageKind.Basic, '', '', (message: any) => {
			setIsLoading(false);

			if (message.error.code) {
				close();
				window.setTimeout(() => {
					U.File.showUploadError(1, message.error.description);
				}, S.Popup.getTimeout());
				return;
			};

			const objectIds = message.objectId ? [ message.objectId ] : [];
			const key = U.File.layoutToCountKey(layout);

			if (message.objectId && collectionId) {
				C.ObjectCollectionAdd(collectionId, [ message.objectId ]);
			};

			Preview.toastShow({ action: I.ToastAction.Upload, uploadCounts: { [key]: 1 } });
			onUpload?.(objectIds);
			close();
		});

		analytics.event('UploadMedia', { type: fileType });
	};

	useEffect(() => {
		$(window).on(`paste.popupUpload`, onPaste);
		return () => {
			$(window).off(`paste.popupUpload`);
		};
	}, []);

	const tabs = [
		{ id: Tab.Upload, name: translate('popupUploadTabUpload') },
		{ id: Tab.Link, name: translate('popupUploadTabLink') },
	];

	return (
		<div className="wrap">
			{isLoading ? <Loader /> : ''}

			<div className="tabs">
				{tabs.map(it => (
					<div
						key={it.id}
						className={[ 'tab', (it.id == tab ? 'active' : '') ].join(' ')}
						onClick={() => setTab(it.id)}
					>
						{it.name}
					</div>
				))}
			</div>

			{tab == Tab.Upload ? (
				<div
					className={[ 'dropZone', (isDragging ? 'isDragging' : '') ].join(' ')}
					onDragEnter={onDragEnter}
					onDragLeave={onDragLeave}
					onDragOver={onDragOver}
					onDrop={onDrop}
					onClick={onClickZone}
				>
					<Icon className="upload" />
					<div className="label">{translate('popupUploadDropLabel')}</div>
				</div>
			) : ''}

			{tab == Tab.Link ? (
				<form className="linkForm" onSubmit={onSubmitUrl}>
					<div className="title">{translate('popupUploadLinkTitle')}</div>
					<div className="inputRow">
						<Input
							ref={urlRef}
							className="c36"
							placeholder={translate('popupUploadLinkPlaceholder')}
							onKeyDown={e => e.stopPropagation()}
						/>
						<Button className="c36" text={translate('commonUpload')} onClick={onSubmitUrl} />
					</div>
				</form>
			) : ''}
		</div>
	);

}));

export default PopupUpload;
