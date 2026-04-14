import React, { forwardRef, useRef, useState, useEffect, DragEvent, MouseEvent } from 'react';
import { Icon, Input, Button, Loader, Error } from 'Component';
import * as I from 'Interface';

enum Tab {
	Upload = 0,
	Link = 1,
};

const PopupUpload = forwardRef<{}, I.Popup>((props, ref) => {

	const { param, close } = props;
	const { data } = param;
	const { layout, onUpload, collectionId, details, route } = data;
	const [ tab, setTab ] = useState(Tab.Upload);
	const [ isDragging, setIsDragging ] = useState(false);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ error, setError ] = useState('');
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
			const allPaths = filePaths.concat(dirPaths);
			onUpload?.([]);
			close();
			C.FileDrop(collectionId || '', '', I.BlockPosition.None as number, allPaths, (message: any) => {
				U.File.showFileDropError(message);

				if (!message.error.code) {
					analytics.event('CreateCollectionFromFolder', { route, filesCount: filePaths.length });

					if (filePaths.length) {
						analytics.event('UploadFile', { route, count: filePaths.length });
					};
				};
			});
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
		const cb = e.clipboardData;
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
			uploadFiles(paths, analytics.route.uploadClipboardPaste);
		};
	};

	const getUploadType = (typeSet: Set<string>): string => {
		if (typeSet.size == 1) {
			return typeSet.values().next().value;
		};
		return typeSet.size > 1 ? 'Mixed' : 'File';
	};

	const uploadFiles = (paths: string[], analyticsRoute?: string) => {
		setIsLoading(true);

		const space = S.Common.space;
		const electron = U.Common.getElectron();
		let completed = 0;
		let errorCount = 0;
		let lastErrorDescription = '';
		const objectIds: string[] = [];
		const counts: { [key: string]: number } = {};
		const typeSet: Set<string> = new Set();
		const eventRoute = analyticsRoute || route;

		const cb = () => {
			setIsLoading(false);
			Preview.toastShow({ action: I.ToastAction.Upload, uploadCounts: counts });
			onUpload?.(objectIds);
			close();

			if (objectIds.length) {
				analytics.event('UploadFile', { route: eventRoute, count: objectIds.length, type: getUploadType(typeSet) });
			};

			if (errorCount > 0) {
				analytics.event('UploadFileError', { route: eventRoute, errorType: 'Unknown', count: errorCount });

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
			const typeName = I.FileType[type] || 'File';

			typeSet.add(typeName);

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
			setError(translate('popupUploadLinkInvalid'));
			return;
		};

		setError('');
		setIsLoading(true);

		const typeName = I.FileType[fileType] || 'File';

		C.FileUpload(S.Common.space, url, '', fileType, details || {}, false, '', I.ImageKind.Basic, '', '', (message: any) => {
			setIsLoading(false);

			if (message.error.code) {
				analytics.event('UploadFileError', { route, errorType: 'Unknown', count: 1 });

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
			analytics.event('UploadFile', { route, count: 1, type: typeName });
			onUpload?.(objectIds);
			close();
		});

		analytics.event('UploadMedia', { type: fileType });
	};

	useEffect(() => {
		U.Dom.addEvent(window, 'paste', onPaste);
		analytics.event('ScreenUploadFile', { route });

		return () => {
			U.Dom.removeEvent(window, 'paste', onPaste);
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
					<Icon name="common/upload" size={48} />
					<div className="label">{translate('popupUploadDropLabel')}</div>
				</div>
			) : ''}

			{tab == Tab.Link ? (
				<form className="linkForm" onSubmit={onSubmitUrl}>
					<div className="title">{translate('popupUploadLinkTitle')}</div>
					<div className="inputWrapper">
						<Input
							ref={urlRef}
							size={36}
							className="round"
							placeholder={translate('popupUploadLinkPlaceholder')}
							onKeyDown={e => e.stopPropagation()}
						/>
						<Button size={36} text={translate('commonUpload')} onClick={onSubmitUrl} />
					</div>
					<Error text={error} />
				</form>
			) : ''}
		</div>
	);

});

export default PopupUpload;
